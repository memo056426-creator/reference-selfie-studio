import { randomUUID } from 'crypto';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  DEFAULT_SELECTIONS,
  PromptGenerationDiagnostics,
  SelfieSelections,
} from './src/types/selfie.ts';
import {
  callWithTransientRetry,
  classifyGeminiFallbackReason,
  executeGeminiPromptGeneration,
  getFallbackStatusAr,
  REFERENCE_IMAGE_ANALYSIS_SYSTEM_INSTRUCTION,
  sanitizeReferenceImageAnalysis,
  validateReferenceImageInput,
} from './src/utils/promptRules.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function getHttpStatusClass(status: number): PromptGenerationDiagnostics['httpStatusClass'] {
  if (status >= 200 && status < 300) return '2xx';
  if (status >= 400 && status < 500) return '4xx';
  return '5xx';
}

function logSanitizedDiagnostics(
  diagnostics: PromptGenerationDiagnostics,
  extra?: { source?: string; workflowMode?: string; imageIncluded?: boolean; errorCode?: string | number }
) {
  const payload: Record<string, unknown> = {
    requestId: diagnostics.requestId,
    route: diagnostics.route,
    model: diagnostics.model,
    durationMs: diagnostics.durationMs,
    httpStatusClass: diagnostics.httpStatusClass,
    source: extra?.source ?? 'deterministic',
    apiKeyPresent: Boolean(diagnostics.apiKeyPresent),
    workflowMode: extra?.workflowMode ?? 'unknown',
    imageIncluded: Boolean(extra?.imageIncluded),
  };

  if (diagnostics.fallbackReason) {
    payload.fallbackReason = diagnostics.fallbackReason;
  }
  if ((diagnostics.validationIssueCount ?? 0) > 0) {
    payload.validationIssueCount = diagnostics.validationIssueCount;
  }
  if (extra?.errorCode !== undefined && extra.errorCode !== null) {
    payload.providerStatus = extra.errorCode;
  }

  console.info('[prompt-diagnostics]', JSON.stringify(payload));
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '15mb' }));

  // 1. Generate or Rephrase English Selfie Prompt using the normalized scene & optional reference-image analysis pipeline
  const handleGeneratePrompt = async (req: express.Request, res: express.Response) => {
    const requestId = `req_${randomUUID().slice(0, 8)}`;
    const route = req.path || '/api/generate-prompt';
    const startedAt = Date.now();
    const fastMode: boolean = Boolean(req.body?.fastMode);
    const useHighThinking: boolean = Boolean(req.body?.useHighThinking);
    const selectedModel =
      useHighThinking && !fastMode ? 'gemini-4-hydrogen' : 'gemini-3.1-flash-lite';
    let lastProviderErrorCode: string | number | undefined;

    try {
      const incomingSettings = req.body?.sceneSettings || req.body?.selections || {};
      const rawSelections: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        ...incomingSettings,
      };
      const concept: string =
        typeof req.body?.concept === 'string'
          ? req.body.concept
          : typeof req.body?.userConcept === 'string'
            ? req.body.userConcept
            : rawSelections.userConcept || '';

      const styleVariant: number = Number(req.body?.styleVariant ?? 0);

      const referenceImageOptIn: boolean = Boolean(
        req.body?.referenceImageOptIn ??
          rawSelections.referenceImageAnalysisOptIn
      );
      const incomingRefImage = req.body?.referenceImage || null;
      const referenceImage = incomingRefImage
        ? {
            base64Data:
              incomingRefImage.base64Data ?? incomingRefImage.imageBase64 ?? null,
            mimeType:
              incomingRefImage.mimeType ?? incomingRefImage.imageMimeType ?? null,
            sizeBytes:
              typeof incomingRefImage.sizeBytes === 'number'
                ? incomingRefImage.sizeBytes
                : undefined,
          }
        : req.body?.imageBase64 || req.body?.mimeType
          ? {
              base64Data: req.body?.imageBase64 ?? null,
              mimeType: req.body?.mimeType ?? null,
            }
          : null;

      const ai = getGenAIClient();
      const apiKeyPresent = Boolean(ai);

      const outcome = await executeGeminiPromptGeneration({
        rawSelections,
        concept,
        styleVariant,
        useHighThinking,
        fastMode,
        referenceImageOptIn,
        referenceImage,
        imageAnalysis: req.body?.imageAnalysis,
        timeoutMs: 38000,
        generateContent: ai
          ? async (params) => {
              const config: Record<string, unknown> = {
                ...(params.config || {}),
              };
              const isHydrogen = params.model === 'gemini-4-hydrogen';
              if (isHydrogen) {
                config.thinkingConfig = {
                  thinkingLevel: useHighThinking
                    ? ThinkingLevel.MEDIUM
                    : ThinkingLevel.LOW,
                };
              }

              const invokeModel = async (
                targetModel: string,
                targetConfig: Record<string, unknown>,
                attemptTimeoutMs: number,
                maxRetries: number
              ) => {
                return callWithTransientRetry(
                  async () => {
                    const controller = new AbortController();
                    let timer: ReturnType<typeof setTimeout> | undefined;
                    try {
                      return await Promise.race([
                        ai.models.generateContent({
                          model: targetModel,
                          contents: params.contents as any,
                          config: {
                            ...targetConfig,
                            abortSignal: controller.signal,
                          },
                        }),
                        new Promise<never>((_, reject) => {
                          timer = setTimeout(() => {
                            controller.abort();
                            reject(
                              new Error(
                                `Model ${targetModel} timeout after ${attemptTimeoutMs}ms`
                              )
                            );
                          }, attemptTimeoutMs);
                        }),
                      ]);
                    } finally {
                      if (timer) clearTimeout(timer);
                    }
                  },
                  { maxRetries, baseDelayMs: 450 }
                );
              };

              try {
                const response = await invokeModel(
                  params.model,
                  config,
                  isHydrogen ? 15000 : 14000,
                  isHydrogen ? 0 : 2
                );
                return { text: response.text ?? '', model: params.model };
              } catch (err: unknown) {
                if (isHydrogen && classifyGeminiFallbackReason(err) !== 'auth_error') {
                  try {
                    const liteConfig = { ...(params.config || {}) };
                    delete liteConfig.thinkingConfig;
                    const liteResponse = await invokeModel(
                      'gemini-3.1-flash-lite',
                      liteConfig,
                      14000,
                      1
                    );
                    lastProviderErrorCode = undefined;
                    return {
                      text: liteResponse.text ?? '',
                      model: 'gemini-3.1-flash-lite',
                    };
                  } catch (liteErr: unknown) {
                    err = liteErr;
                  }
                }
                const errObj =
                  err && typeof err === 'object'
                    ? (err as Record<string, unknown>)
                    : null;
                const causeObj =
                  errObj?.cause && typeof errObj.cause === 'object'
                    ? (errObj.cause as Record<string, unknown>)
                    : null;
                lastProviderErrorCode =
                  typeof errObj?.status === 'number'
                    ? errObj.status
                    : typeof causeObj?.code === 'string'
                      ? causeObj.code
                      : typeof errObj?.code === 'string' ||
                          typeof errObj?.code === 'number'
                        ? errObj.code
                        : err instanceof Error
                          ? err.name
                          : 'provider_error';
                throw err;
              }
            }
          : null,
      });

      const durationMs = Date.now() - startedAt;

      if (!outcome.validGate) {
        const diagnostics: PromptGenerationDiagnostics = {
          requestId,
          route,
          model: outcome.model || selectedModel,
          durationMs,
          httpStatusClass: getHttpStatusClass(400),
          fallbackReason: outcome.fallbackReason,
          apiKeyPresent,
        };
        logSanitizedDiagnostics(diagnostics, {
          source: 'deterministic',
          workflowMode: rawSelections.workflowMode,
          imageIncluded: false,
        });
        return res.status(400).json({
          error: outcome.errorAr,
          adjustments: outcome.adjustments,
          warnings: outcome.warnings,
          conflicts: outcome.conflicts,
          source: 'deterministic',
          statusAr: outcome.statusAr,
          diagnostics,
        });
      }

      if (!outcome.validImage) {
        const diagnostics: PromptGenerationDiagnostics = {
          requestId,
          route,
          model: outcome.model || selectedModel,
          durationMs,
          httpStatusClass: getHttpStatusClass(400),
          fallbackReason: outcome.fallbackReason,
          apiKeyPresent,
        };
        logSanitizedDiagnostics(diagnostics, {
          source: 'deterministic',
          workflowMode: rawSelections.workflowMode,
          imageIncluded: false,
        });
        return res.status(400).json({
          error: outcome.errorAr,
          result: outcome.result,
          prompt: outcome.prompt,
          rawMarkdownResponse: outcome.rawMarkdownResponse,
          adjustments: outcome.adjustments,
          warnings: outcome.warnings,
          conflicts: outcome.conflicts,
          source: 'deterministic',
          fallbackReason: outcome.fallbackReason,
          statusAr: outcome.statusAr,
          wordCount: outcome.wordCount,
          diagnostics,
        });
      }

      const diagnostics: PromptGenerationDiagnostics = {
        requestId,
        route,
        model: outcome.model || selectedModel,
        durationMs,
        httpStatusClass: getHttpStatusClass(200),
        fallbackReason: outcome.fallbackReason,
        apiKeyPresent,
        validationIssueCount: outcome.validationIssueCount,
      };
      logSanitizedDiagnostics(diagnostics, {
        source: outcome.source,
        workflowMode: rawSelections.workflowMode,
        imageIncluded: outcome.imageIncluded,
        errorCode: lastProviderErrorCode,
      });

      return res.json({
        result: outcome.result,
        prompt: outcome.prompt,
        rawMarkdownResponse: outcome.rawMarkdownResponse,
        adjustments: outcome.adjustments,
        warnings: outcome.warnings,
        conflicts: outcome.conflicts,
        source: outcome.source,
        model: outcome.model || selectedModel,
        fallbackReason: outcome.fallbackReason,
        statusAr: outcome.statusAr,
        imageIncluded: outcome.imageIncluded,
        imageAnalysis: outcome.imageAnalysis,
        imageOverrideNotices: outcome.imageOverrideNotices,
        wordCount: outcome.wordCount,
        diagnostics,
        providerErrorCode: lastProviderErrorCode,
        validationIssueCodes: outcome.validationIssueCodes,
      });
    } catch (err: unknown) {
      const durationMs = Date.now() - startedAt;
      const fallbackReason = classifyGeminiFallbackReason(err);
      const diagnostics: PromptGenerationDiagnostics = {
        requestId,
        route,
        model: selectedModel,
        durationMs,
        httpStatusClass: getHttpStatusClass(500),
        fallbackReason,
        apiKeyPresent: Boolean(getGenAIClient()),
      };
      logSanitizedDiagnostics(diagnostics, {
        source: 'deterministic',
        errorCode: err instanceof Error ? err.name : 'unexpected_error',
      });
      res.status(500).json({
        error: 'تعذر توليد البرومبت حاليًا.',
        source: 'deterministic',
        fallbackReason,
        statusAr: getFallbackStatusAr(fallbackReason),
        diagnostics,
      });
    }
  };

  app.post('/api/generate-prompt', handleGeneratePrompt);
  app.post('/api/gemini/generate-prompt', handleGeneratePrompt);

  // 2. Fast Low-Latency Lighting & Composition Tip using gemini-3.1-flash-lite
  app.post('/api/gemini/quick-tip', async (req, res) => {
    const selections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      ...(req.body?.selections || {}),
    };

    const defaultTipAr =
      selections.selfieType === 'mirror'
        ? 'نصيحة سريعة: في سيلفي المرآة، اختر زاوية مستوى العين مع إضاءة نافذة جانبية لتجنب انعكاس الفلاش المباشر على الزجاج.'
        : 'نصيحة سريعة: في سيلفي الكاميرا الأمامية (Xiaomi 15 Ultra 9:16)، اجعل مصدر الإضاءة أمامك أو بزاوية 45 درجة لإبراز ملامح الوجه الطبيعية ومسام البشرة دون ظلال حادة.';

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({ tipAr: defaultTipAr, model: 'gemini-3.1-flash-lite' });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-lite',
        contents: `أعطني نصيحة تصوير واحدة قصيرة جدًا (جملة واحدة بالعربية لا تتجاوز 25 كلمة) لتحسين واقعية صورة سيلفي في غرفة نوم بهذه الإعدادات: نوع السيلفي=${selections.selfieType}، الكادر=${selections.framing}، الإضاءة=${selections.lighting}، الخلفية=${selections.background}. لا تذكر أي صفات شخصية أو حساسة.`,
      });
      const tipAr = (response.text ?? '').trim() || defaultTipAr;
      return res.json({ tipAr, model: 'gemini-3.1-flash-lite' });
    } catch {
      return res.json({ tipAr: defaultTipAr, model: 'gemini-3.1-flash-lite' });
    }
  });

  // 3. Reference Image Lighting & Environment Compatibility Analysis using gemini-4-hydrogen
  // Strictly avoids inferring age, ethnicity, or sensitive traits per Section 3 rules.
  app.post('/api/gemini/analyze-image', async (req, res) => {
    const { imageBase64, mimeType, sizeBytes } = req.body || {};
    const check = validateReferenceImageInput({
      optIn: true,
      base64Data: imageBase64,
      mimeType,
      sizeBytes,
    });
    if (!check.includeImage || !check.valid || !check.base64Data || !check.mimeType) {
      return res.status(400).json({
        error: check.errorAr || 'يرجى إرفاق صورة صالحة للتحليل.',
      });
    }

    const fallbackAnalysis = {
      lightingDirectionAr: 'إضاءة طبيعية ناعمة ومتوازنة على الوجه',
      recommendedLighting: 'soft_daylight',
      recommendedRoomStyle: 'warm_cozy',
      adviceAr:
        'للحفاظ على تطابق الملامح مع الصورة المرجعية، يُنصح باختيار إضاءة نهارية ناعمة أو ضوء صباح من النافذة مع تجنب الفلاتر التجميلية.',
      sceneAnalysis: sanitizeReferenceImageAnalysis(null),
    };

    const ai = getGenAIClient();
    if (!ai) {
      return res.json(fallbackAnalysis);
    }

    try {
      const response = await callWithTransientRetry(
        () =>
          ai.models.generateContent({
            model: 'gemini-3.1-flash-lite',
            contents: {
              parts: [
                {
                  inlineData: {
                    data: check.base64Data,
                    mimeType: check.mimeType,
                  },
                },
                {
                  text: `${REFERENCE_IMAGE_ANALYSIS_SYSTEM_INSTRUCTION}\nAlso include an optional "adviceAr" string in Arabic (2 concise sentences) explaining which bedroom lighting (morning_window, soft_daylight, late_afternoon, warm_bedside_lamp, or calm_ceiling_light) best matches the visible light direction.`,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
            },
          }),
        { maxRetries: 2, baseDelayMs: 450 }
      );

      const rawText = (response.text ?? '').trim();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(rawText);
      } catch {
        parsed = {};
      }
      const sceneAnalysis = sanitizeReferenceImageAnalysis(parsed);
      const adviceAr =
        typeof parsed.adviceAr === 'string' && parsed.adviceAr.trim()
          ? parsed.adviceAr.trim()
          : fallbackAnalysis.adviceAr;

      const lightHint = `${sceneAnalysis.lightingDirectionAndQuality} ${adviceAr}`;
      let recommendedLighting = 'soft_daylight';
      if (/مصباح|دافئ|lamp|warm/i.test(lightHint)) recommendedLighting = 'warm_bedside_lamp';
      else if (/صباح|morning/i.test(lightHint)) recommendedLighting = 'morning_window';
      else if (/عصر|ذهبي|afternoon/i.test(lightHint)) recommendedLighting = 'late_afternoon';

      return res.json({
        lightingDirectionAr: 'تم تحليل اتجاه وحرارة الإضاءة وعناصر المشهد المرئية',
        recommendedLighting,
        recommendedRoomStyle: 'warm_cozy',
        adviceAr,
        sceneAnalysis,
      });
    } catch {
      return res.json(fallbackAnalysis);
    }
  });

  // 4. Google Search Grounding for Bedroom Selfie Lighting & Interior Trends using gemini-4-hydrogen
  app.post('/api/gemini/search-inspiration', async (req, res) => {
    const queryTopic =
      req.body?.query ||
      'أفضل نصائح الإضاءة الطبيعية وتنسيق غرفة النوم لالتقاط صور سيلفي واقعية بالهاتف';

    const fallbackSources = [
      {
        title: 'Natural Window Lighting Techniques for Smartphone Portraits',
        uri: 'https://www.adobe.com/creativecloud/photography/discover/natural-light-photography.html',
      },
      {
        title: 'How to Compose Authentic Indoor Mirror Selfies',
        uri: 'https://www.masterclass.com/articles/how-to-take-good-selfies',
      },
    ];
    const fallbackSummary =
      'تعتمد صور السيلفي الواقعية في غرف النوم على وضع مصدر الضوء الطبيعي (النافذة) بزاوية جانبية ناعمة أو أمامية خفيفة، مع اختيار خلفية مرتبة بألوان محايدة وإمساك الهاتف بعيدًا عن الوجه في لقطات المرآة.';

    const ai = getGenAIClient();
    if (!ai) {
      return res.json({
        summaryAr: fallbackSummary,
        sources: fallbackSources,
      });
    }

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `ابحث في الويب وقدم ملخصًا عمليًا موجزًا باللغة العربية (3 نقاط مختصرة) حول: ${queryTopic}، وكيف يترجم ذلك إلى وصف دقيق في برومبتات توليد الصور الواقعية.`,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
      const sources = chunks
        .map((c: any) => c?.web)
        .filter((w: any) => w && w.uri && w.title)
        .map((w: any) => ({ title: String(w.title), uri: String(w.uri) }))
        .slice(0, 4);

      return res.json({
        summaryAr: (response.text ?? '').trim() || fallbackSummary,
        sources: sources.length > 0 ? sources : fallbackSources,
      });
    } catch {
      return res.json({
        summaryAr: fallbackSummary,
        sources: fallbackSources,
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
