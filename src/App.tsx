/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Camera, Lock, LogIn, LogOut, RotateCcw, ShieldCheck, Shuffle, Sliders } from 'lucide-react';
import {
  DEFAULT_SELECTIONS,
  ImageTreatmentType,
  LightingType,
  PromptFallbackReason,
  PromptGenerationDiagnostics,
  PromptGenerationSource,
  RoomStyleType,
  SelfieSelections,
  WorkflowMode,
} from './types/selfie';
import {
  buildDeterministicEnglishPrompt,
  buildPromptGenerationRequestBody,
  enforceCompatibilityRules,
  generateConsistentRandomSelections,
  hydrateLegacyClothingSelections,
  LockableSelectionField,
  resolveClientGenerationOutcome,
  validateStrictLightingSelection,
} from './utils/promptRules';
import { ReferenceImageSection } from './components/ReferenceImageSection';
import { StrictEditingSection } from './components/StrictEditingSection';
import { MirrorStudioSection } from './components/MirrorStudioSection';
import { FormSections } from './components/FormSections';
import { PromptOutputPanel } from './components/PromptOutputPanel';
import {
  auth,
  deletePresetFromFirestore,
  SavedPresetRecord,
  savePresetToFirestore,
  signInWithGoogle,
  signOutUser,
  subscribeToUserPresets,
} from './lib/firebase';

const LOCAL_PRESETS_KEY = 'bedroom_selfie_saved_presets_v1';

const QUICK_CONCEPT_EXAMPLES = [
  'سيلفي يومي عفوي داخل غرفة نوم عادية في السعودية',
  'سيلفي صباحي بعد الاستيقاظ بالرياض',
  'سيلفي بعد التمرين في غرفة النوم',
  'سيلفي ليلي هادئ على ضوء شاشة الهاتف',
];

const INITIAL_SEED_PRESET: SavedPresetRecord = {
  id: 'seed_strict_mode_a',
  userId: 'local',
  title: 'تعديل صارم: شاشة الهاتف فقط + ملابس سفلية فحمية (Xiaomi 15 Ultra)',
  promptText: buildDeterministicEnglishPrompt(DEFAULT_SELECTIONS, 0),
  selfieType: DEFAULT_SELECTIONS.selfieType,
  framing: DEFAULT_SELECTIONS.framing,
  roomStyle: DEFAULT_SELECTIONS.roomStyle,
  lighting: DEFAULT_SELECTIONS.lighting,
  aspectRatio: DEFAULT_SELECTIONS.aspectRatio,
  selectionsJson: JSON.stringify(DEFAULT_SELECTIONS),
};

export default function App() {
  const [selections, setSelections] = useState<SelfieSelections>(DEFAULT_SELECTIONS);
  const [adjustments, setAdjustments] = useState<string[]>([]);
  const [promptText, setPromptText] = useState<string>(() =>
    buildDeterministicEnglishPrompt(DEFAULT_SELECTIONS, 0)
  );
  const [styleVariant, setStyleVariant] = useState<number>(0);
  const [isOutOfSync, setIsOutOfSync] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [promptSource, setPromptSource] =
    useState<PromptGenerationSource>('deterministic');
  const [fallbackReason, setFallbackReason] =
    useState<PromptFallbackReason | null>(null);
  const [generationStatusAr, setGenerationStatusAr] = useState<string | null>(
    null
  );
  const [diagnostics, setDiagnostics] =
    useState<PromptGenerationDiagnostics | null>(null);

  // Reference image local preview state (stays local unless user explicitly enables referenceImageOptIn and presses Generate)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageSizeBytes, setImageSizeBytes] = useState<number | null>(null);
  const [referenceImageOptIn, setReferenceImageOptIn] =
    useState<boolean>(false);

  // AI Mode options
  const [useHighThinking, setUseHighThinking] = useState<boolean>(false);
  const [fastMode, setFastMode] = useState<boolean>(false);

  // Auth & Saved Presets state
  const [user, setUser] = useState<User | null>(null);
  const [cloudPresets, setCloudPresets] = useState<SavedPresetRecord[]>([]);
  const [localPresets, setLocalPresets] = useState<SavedPresetRecord[]>(() => {
    try {
      const raw = localStorage.getItem(LOCAL_PRESETS_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // ignore storage errors
    }
    return [INITIAL_SEED_PRESET];
  });

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!user) {
      setCloudPresets([]);
      return;
    }
    const unsubPresets = subscribeToUserPresets(user.uid, (items) => {
      setCloudPresets(items);
    });
    return () => unsubPresets();
  }, [user]);

  const saveLocalPresets = (next: SavedPresetRecord[]) => {
    setLocalPresets(next);
    try {
      localStorage.setItem(LOCAL_PRESETS_KEY, JSON.stringify(next));
    } catch {
      // ignore storage errors
    }
  };

  // Update a single selection field and enforce compatibility rules immediately (local only; never calls Gemini on dropdown change)
  const handleUpdateSelection = <K extends keyof SelfieSelections>(
    key: K,
    value: SelfieSelections[K]
  ) => {
    setSelections((prev) => {
      const updated = {
        ...prev,
        [key]: value,
        ...(key === 'mirrorPose' || key === 'mirrorStance'
          ? { mirrorSupportObject: undefined }
          : {}),
      };
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules(updated);
      setAdjustments(newAdj);
      if (normalized.workflowMode === 'mirror_studio') {
        setPromptText(buildDeterministicEnglishPrompt(normalized, styleVariant));
      }
      setPromptSource('deterministic');
      setFallbackReason(null);
      setIsOutOfSync(true);
      return normalized;
    });
  };

  // Apply a multi-field patch atomically and enforce compatibility rules immediately
  const handleApplySelectionPatch = (patch: Partial<SelfieSelections>) => {
    setSelections((prev) => {
      const updated = { ...prev, ...patch };
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules(updated);
      setAdjustments(newAdj);
      if (normalized.workflowMode === 'mirror_studio') {
        setPromptText(buildDeterministicEnglishPrompt(normalized, styleVariant));
      }
      setPromptSource('deterministic');
      setFallbackReason(null);
      setIsOutOfSync(true);
      return normalized;
    });
  };

  const handleToggleLockField = (field: LockableSelectionField) => {
    setSelections((prev) => {
      const currentLocked = prev.lockedFields ?? [];
      const exists = currentLocked.includes(field);
      const nextLocked = exists
        ? currentLocked.filter((f) => f !== field)
        : [...currentLocked, field];
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules({
          ...prev,
          lockedFields: nextLocked,
        });
      setAdjustments(newAdj);
      return normalized;
    });
  };

  const handleApplyLockedConflictFix = (
    patch: Partial<SelfieSelections>,
    unlockFields?: LockableSelectionField[]
  ) => {
    setSelections((prev) => {
      const currentLocked = prev.lockedFields ?? [];
      const nextLocked =
        unlockFields && unlockFields.length > 0
          ? currentLocked.filter((f) => !unlockFields.includes(f))
          : currentLocked;
      const updated: SelfieSelections = {
        ...prev,
        ...patch,
        lockedFields: nextLocked,
      };
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules(updated);
      setAdjustments(newAdj);
      if (normalized.workflowMode === 'mirror_studio') {
        setPromptText(buildDeterministicEnglishPrompt(normalized, styleVariant));
      }
      setPromptSource('deterministic');
      setFallbackReason(null);
      setIsOutOfSync(true);
      return normalized;
    });
  };

  const handleSwitchWorkflowMode = (mode: WorkflowMode) => {
    setSelections((prev) => {
      const updated: SelfieSelections = {
        ...prev,
        workflowMode: mode,
      };
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules(updated);
      setAdjustments(newAdj);
      const immediate = buildDeterministicEnglishPrompt(normalized, styleVariant);
      setPromptText(immediate);
      return normalized;
    });
    setPromptSource('deterministic');
    setFallbackReason(null);
    setDiagnostics(null);
    setGenerationStatusAr(null);
    setIsOutOfSync(false);
  };

  const handleToggleTreatment = (treatment: ImageTreatmentType) => {
    setSelections((prev) => {
      const exists = prev.imageTreatments.includes(treatment);
      const nextTreatments = exists
        ? prev.imageTreatments.filter((t) => t !== treatment)
        : [...prev.imageTreatments, treatment];
      const { selections: normalized, adjustments: newAdj } = enforceCompatibilityRules({
        ...prev,
        imageTreatments:
          nextTreatments.length > 0 ? nextTreatments : ['no_beauty_filter'],
      });
      setAdjustments(newAdj);
      return normalized;
    });
    setPromptSource('deterministic');
    setFallbackReason(null);
    setIsOutOfSync(true);
  };

  // Call backend to generate or rephrase English prompt via Gemini with deterministic fallback
  const triggerPromptGeneration = async (
    targetSelections: SelfieSelections,
    targetVariant: number
  ) => {
    const lightingCheck = validateStrictLightingSelection(targetSelections);
    if (!lightingCheck.valid) return;

    const preparedRequest = buildPromptGenerationRequestBody(targetSelections, {
      styleVariant: targetVariant,
      useHighThinking,
      fastMode,
      referenceImageOptIn,
      imageBase64,
      imageMimeType,
      imageSizeBytes,
    });

    if (preparedRequest.validationErrorAr) {
      setPromptSource('deterministic');
      setFallbackReason('unknown');
      setDiagnostics(null);
      setGenerationStatusAr(preparedRequest.validationErrorAr);
      return;
    }

    setIsGenerating(true);
    setFallbackReason(null);
    setDiagnostics(null);
    setGenerationStatusAr(
      preparedRequest.imageIncluded
        ? 'جاري تحليل الصورة المرجعية وتوليد البرومبت عبر Gemini...'
        : 'جاري توليد البرومبت عبر Gemini...'
    );

    const immediatePrompt = buildDeterministicEnglishPrompt(
      targetSelections,
      targetVariant
    );
    setPromptText(immediatePrompt);
    setPromptSource('deterministic');
    setIsOutOfSync(false);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 46000);
    const clientStartedAt = Date.now();

    try {
      const response = await fetch('/api/generate-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preparedRequest.body),
        signal: controller.signal,
      });
      const data = await response.json().catch(() => ({}));
      const outcome = resolveClientGenerationOutcome({
        ok: response.ok,
        status: response.status,
        data,
        targetSelections,
        styleVariant: targetVariant,
        imageIncluded: preparedRequest.imageIncluded,
      });

      setPromptText(outcome.prompt);
      setPromptSource(outcome.source);
      setFallbackReason(outcome.fallbackReason);
      setGenerationStatusAr(outcome.statusAr);
      setDiagnostics(
        outcome.diagnostics || {
          requestId: 'client_local',
          route: '/api/generate-prompt',
          model:
            useHighThinking && !fastMode
              ? 'gemini-4-hydrogen'
              : 'gemini-3.1-flash-lite',
          durationMs: Date.now() - clientStartedAt,
          httpStatusClass: response.ok
            ? '2xx'
            : response.status >= 400 && response.status < 500
              ? '4xx'
              : '5xx',
          fallbackReason: outcome.fallbackReason ?? undefined,
        }
      );

      if (outcome.warnings.length > 0) {
        setAdjustments((prev) =>
          Array.from(new Set([...prev, ...outcome.warnings]))
        );
      }
    } catch (err: unknown) {
      const outcome = resolveClientGenerationOutcome({
        ok: false,
        status: 0,
        error: err,
        targetSelections,
        styleVariant: targetVariant,
        imageIncluded: preparedRequest.imageIncluded,
      });
      setPromptText(outcome.prompt);
      setPromptSource('deterministic');
      setFallbackReason(outcome.fallbackReason);
      setGenerationStatusAr(outcome.statusAr);
      setDiagnostics({
        requestId: 'client_abort',
        route: '/api/generate-prompt',
        model:
          useHighThinking && !fastMode
            ? 'gemini-4-hydrogen'
            : 'gemini-3.1-flash-lite',
        durationMs: Date.now() - clientStartedAt,
        httpStatusClass: 'network_error',
        fallbackReason: outcome.fallbackReason ?? undefined,
      });
    } finally {
      clearTimeout(timeoutId);
      setIsGenerating(false);
    }
  };

  const handleGeneratePrompt = () => {
    triggerPromptGeneration(selections, styleVariant);
  };

  const handleRephrasePrompt = () => {
    const nextVariant = styleVariant + 1;
    setStyleVariant(nextVariant);
    triggerPromptGeneration(selections, nextVariant);
  };

  const handleReset = () => {
    const resetTarget: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: selections.workflowMode,
    };
    setSelections(resetTarget);
    setAdjustments([]);
    setStyleVariant(0);
    const resetPrompt = buildDeterministicEnglishPrompt(resetTarget, 0);
    setPromptText(resetPrompt);
    setPromptSource('deterministic');
    setFallbackReason(null);
    setDiagnostics(null);
    setGenerationStatusAr(null);
    setIsOutOfSync(false);
  };

  const handleConsistentRandom = () => {
    const nextVariant = (styleVariant + 1) % 4;
    setStyleVariant(nextVariant);
    const randomSel = generateConsistentRandomSelections(
      Date.now(),
      selections.workflowMode
    );
    setSelections(randomSel);
    setAdjustments([]);
    const nextPrompt = buildDeterministicEnglishPrompt(randomSel, nextVariant);
    setPromptText(nextPrompt);
    setPromptSource('deterministic');
    setFallbackReason(null);
    setDiagnostics(null);
    setGenerationStatusAr(null);
    setIsOutOfSync(true);
  };

  const handleApplyLightingSuggestion = (
    lighting: LightingType,
    roomStyle: RoomStyleType
  ) => {
    setSelections((prev) => {
      const { selections: normalized } = enforceCompatibilityRules({
        ...prev,
        lighting,
        roomStyle,
      });
      return normalized;
    });
    setIsOutOfSync(true);
  };

  const handleSavePreset = async (title: string) => {
    if (user) {
      await savePresetToFirestore(title, promptText, selections);
    } else {
      const newRecord: SavedPresetRecord = {
        id: `local_${Date.now()}`,
        userId: 'local',
        title,
        promptText,
        selfieType: selections.selfieType,
        framing: selections.framing,
        roomStyle: selections.roomStyle,
        lighting: selections.lighting,
        aspectRatio: selections.aspectRatio,
        selectionsJson: JSON.stringify(selections),
      };
      saveLocalPresets([newRecord, ...localPresets]);
    }
  };

  const handleLoadPreset = (preset: SavedPresetRecord) => {
    try {
      const parsed = JSON.parse(preset.selectionsJson) as SelfieSelections;
      const hydrated = hydrateLegacyClothingSelections(parsed);
      const { selections: normalized, adjustments: newAdj } =
        enforceCompatibilityRules(hydrated);
      setSelections(normalized);
      setAdjustments(newAdj);
      setPromptText(preset.promptText);
      setIsOutOfSync(false);
    } catch {
      setPromptText(preset.promptText);
    }
  };

  const handleDeletePreset = async (id: string) => {
    if (user && !id.startsWith('local_') && !id.startsWith('seed_')) {
      await deletePresetFromFirestore(id);
    } else {
      saveLocalPresets(localPresets.filter((p) => p.id !== id));
    }
  };

  const compatibilitySnapshot = enforceCompatibilityRules(selections);
  const lockedConflicts = compatibilitySnapshot.lockedConflicts ?? [];
  const allPresets = user ? [...cloudPresets, ...localPresets] : localPresets;
  const wordCount = promptText.trim() ? promptText.trim().split(/\s+/).length : 0;

  return (
    <div dir="rtl" className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 flex flex-col">
      {/* Top Bar Contract: 3 Zones separated by gap-8 */}
      <header className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#section-1"
            className="text-lg font-bold tracking-tight text-stone-900 dark:text-stone-100 whitespace-nowrap shrink-0"
          >
            مولّد برومبتات السيلفي المرجعي
          </a>

          {/* Zone 2: 4-5 concise single-line navigation links */}
          <nav
            aria-label="أقسام بناء البرومبت"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-stone-600 dark:text-stone-300"
          >
            <a
              href="#user-concept-section"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              فكرة المشهد
            </a>
            <a
              href="#section-1"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              الصورة المرجعية
            </a>
            {selections.workflowMode === 'strict_editing' ? (
              <>
                <a
                  href="#strict-rule-04"
                  className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  وضع الإضاءة (A / B)
                </a>
                <a
                  href="#strict-rule-02"
                  className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  لون الملابس السفلية
                </a>
              </>
            ) : (
              <>
                <a
                  href="#section-2"
                  className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  الكادر والوضعية
                </a>
                <a
                  href="#section-5"
                  className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
                >
                  الغرفة والإضاءة
                </a>
              </>
            )}
            <a
              href="#section-8"
              className="hover:text-stone-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              البرومبت النهائي
            </a>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            {user ? (
              <button
                type="button"
                onClick={() => signOutUser()}
                className="px-4 py-2 text-xs font-medium text-stone-700 dark:text-stone-200 bg-stone-100 dark:bg-stone-800 rounded-lg hover:bg-stone-200 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>تسجيل الخروج</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => signInWithGoogle().catch(() => {})}
                className="px-4 py-2 text-xs font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-lg hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0 inline-flex items-center gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>مزامنة الحساب</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Hero & Workspace Toolbar */}
      <div className="bg-white/70 dark:bg-stone-900/50 border-b border-stone-200 dark:border-stone-800 px-6 py-6">
        <div className="max-w-7xl mx-auto space-y-5">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div className="space-y-1.5 max-w-2xl">
              <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                مهندس برومبتات الصور الواقعية · Xiaomi 15 Ultra (9:16) · بيئة واقعية في السعودية
              </p>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 dark:text-stone-100 leading-tight">
                مولّد برومبتات السيلفي المرجعي
              </h1>
              <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed">
                أدخل فكرة المشهد المختصرة أو خصّص إعدادات الإضاءة والملابس والوضعية، لتحويلها فورًا إلى برومبت إنجليزي منضبط فيزيائيًا وتشريحيًا يحافظ على المظهر المرجعي للوجه وتفاصيل Xiaomi 15 Ultra بنسبة أبعاد 9:16 دون فلاتر أو قياسات مفبركة.
              </p>
            </div>

            {/* Global Action Buttons: Consistent Randomize & Reset */}
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={handleConsistentRandom}
                className="px-4 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Shuffle className="w-4 h-4 shrink-0" />
                <span>اختيارات عشوائية متناسقة</span>
              </button>

              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2.5 rounded-lg bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 text-xs font-semibold transition-colors inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
                <span>إعادة ضبط</span>
              </button>
            </div>
          </div>

          {/* Brief User Concept Input Card (Direct LLM User Message Payload) */}
          <section
            id="user-concept-section"
            aria-labelledby="heading-user-concept"
            className="p-4 rounded-xl border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 space-y-3"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label
                htmlFor="user-concept-input"
                id="heading-user-concept"
                className="text-sm font-bold text-stone-900 dark:text-stone-100"
              >
                فكرة المشهد المختصرة:
              </label>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                القيود الأساسية: الحفاظ على ملامح الوجه المرجعية · Xiaomi 15 Ultra 9:16 · السعودية · بدون فلاتر أو اختراع قياسات
              </span>
            </div>

            <div className="space-y-3">
              <textarea
                id="user-concept-input"
                rows={3}
                value={selections.userConcept}
                onChange={(e) => handleUpdateSelection('userConcept', e.target.value)}
                placeholder="اكتب فكرتك هنا (مثال: سيلفي في مقهى شعبي بالرياض وقت الغروب)..."
                className="w-full p-3 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-600"
              />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handleGeneratePrompt}
                  disabled={isGenerating || !selections.userConcept.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isGenerating ? 'جاري التوليد...' : 'توليد البرومبت'}
                </button>

                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-stone-500 dark:text-stone-400 ml-1">
                    أفكار سريعة:
                  </span>
                  {QUICK_CONCEPT_EXAMPLES.map((example) => (
                    <button
                      key={example}
                      type="button"
                      onClick={() => handleUpdateSelection('userConcept', example)}
                      className={`px-2.5 py-1 rounded-md text-[11px] border transition-colors ${
                        selections.userConcept === example
                          ? 'border-amber-600 bg-amber-50 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 font-semibold'
                          : 'border-stone-200 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 text-stone-600 dark:text-stone-300 hover:border-stone-300'
                      }`}
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Workflow modes describe instructions, not guaranteed biometric identity locks. */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 px-1">
              <div className="inline-flex items-center gap-1.5 text-xs font-bold text-stone-800 dark:text-stone-200">
                <Lock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>مستويات تعليمات حماية الوجه — دون ضمان تطابق آلي:</span>
              </div>
              <span className="text-[11px] text-stone-500 dark:text-stone-400">
                اختر النمط المناسب؛ جميعها توجّه النموذج للحفاظ على الملامح، ولا تقيس الهوية في الصورة الناتجة.
              </span>
            </div>

            <div
              role="tablist"
              aria-label="اختيار نمط عمل التطبيق"
              className="grid grid-cols-1 md:grid-cols-3 gap-3"
            >
              {/* 1. Strict Editing Mode */}
              <button
                type="button"
                role="tab"
                aria-selected={selections.workflowMode === 'strict_editing'}
                onClick={() => handleSwitchWorkflowMode('strict_editing')}
                data-testid="tab-strict-editing"
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  selections.workflowMode === 'strict_editing'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-600'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>تعليمات حماية الوجه</span>
                    </span>
                    <span className="text-[10px] font-mono-num font-semibold text-emerald-700 dark:text-emerald-400">
                      القواعد 01–12
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        وضع التعديل الصارم للصورة المرجعية (القواعد 01–12)
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                        قواعد تعديل تحافظ على تفاصيل الوجه قدر الإمكان، مع إعدادات الإضاءة الحصرية وتعديل الملابس دون استهداف ملامح الوجه.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-2.5 border-t border-stone-200/80 dark:border-stone-800">
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    يحدد مناطق الوجه كأجزاء غير مستهدفة بالتعديل؛ لا يمكن إثبات التطابق دون مقارنة بصرية.
                  </p>
                </div>
              </button>

              {/* 2. Mirror Studio Mode (JSON) */}
              <button
                type="button"
                role="tab"
                aria-selected={selections.workflowMode === 'mirror_studio'}
                onClick={() => handleSwitchWorkflowMode('mirror_studio')}
                data-testid="tab-mirror-studio"
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  selections.workflowMode === 'mirror_studio'
                    ? 'border-[#ff6600] bg-amber-50/80 dark:bg-stone-900 ring-1 ring-[#ff6600]'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      <Lock className="w-3 h-3 shrink-0" />
                      <span>تعليمات حماية الوجه</span>
                    </span>
                    <span className="text-[10px] font-mono-num font-semibold text-[#ff6600]">
                      JSON مرآة منظّم
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Camera className="w-5 h-5 text-[#ff6600] shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        استوديو المرآة الاحترافي (Xiaomi 15 Ultra)
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                        توليد أوامر JSON برمجية صارمة لـ Gemini مع فرض الفلاش الحصري ودليل الحركات التفاعلية الواقعية.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-2.5 border-t border-stone-200/80 dark:border-stone-800">
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    يوجّه انعكاس المرآة واليد الحاملة للهاتف مع تقديم هوية الوجه على زخارف المشهد؛ ليس قفلًا بيومتريًا.
                  </p>
                </div>
              </button>

              {/* 3. Comprehensive Scene Builder Mode */}
              <button
                type="button"
                role="tab"
                aria-selected={selections.workflowMode === 'scene_builder'}
                onClick={() => handleSwitchWorkflowMode('scene_builder')}
                data-testid="tab-scene-builder"
                className={`p-3.5 rounded-xl border text-right transition-all flex flex-col justify-between gap-3 ${
                  selections.workflowMode === 'scene_builder'
                    ? 'border-amber-600 bg-amber-50/80 dark:bg-amber-950/40 ring-1 ring-amber-600'
                    : 'border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 hover:border-stone-300'
                }`}
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-900 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      <Sliders className="w-3 h-3 shrink-0" />
                      <span>تخصيص المشهد</span>
                    </span>
                    <span className="text-[10px] font-mono-num font-semibold text-amber-700 dark:text-amber-400">
                      تخصيص شامل (8 أقسام)
                    </span>
                  </div>

                  <div className="flex items-start gap-3">
                    <Sliders className="w-5 h-5 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-stone-900 dark:text-stone-100">
                        وضع بناء مشهد سيلفي غرفة النوم الشامل (8 أقسام)
                      </div>
                      <p className="text-[11px] text-stone-600 dark:text-stone-400 mt-0.5 leading-relaxed">
                        تخصيص شامل لنوع السيلفي، الكادر، الوضعية، الملابس، طراز غرفة النوم، وتفاصيل الكاميرا.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-2.5 border-t border-stone-200/80 dark:border-stone-800">
                  <p className="text-[11px] text-stone-600 dark:text-stone-400 leading-relaxed">
                    يسمح بتغييرات أكبر في الكادر والملابس والغرفة، ما يزيد احتمال اختلاف مظهر الوجه في النموذج الخارجي.
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid (Sections 1 to 8) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Right / Main Column in RTL: Section 1 + Active Mode Sections */}
          <div className="lg:col-span-7 space-y-6">
            <ReferenceImageSection
              imagePreviewUrl={imagePreviewUrl}
              onImageChange={(preview, b64, mime, size) => {
                setImagePreviewUrl(preview);
                setImageBase64(b64);
                setImageMimeType(mime);
                setImageSizeBytes(size ?? null);
              }}
              referenceImageOptIn={referenceImageOptIn}
              onReferenceImageOptInChange={(optIn) => {
                setReferenceImageOptIn(optIn);
                setSelections((prev) => ({
                  ...prev,
                  referenceImageAnalysisOptIn: optIn,
                }));
              }}
              onApplyLightingSuggestion={handleApplyLightingSuggestion}
              imageBase64={imageBase64}
              imageMimeType={imageMimeType}
            />

            {selections.workflowMode === 'mirror_studio' ? (
              <MirrorStudioSection
                selections={selections}
                onUpdate={handleUpdateSelection}
                onApplyUpdates={handleApplySelectionPatch}
                adjustments={adjustments}
                lockedConflicts={lockedConflicts}
                onToggleLockField={handleToggleLockField}
                onApplyLockedConflictFix={handleApplyLockedConflictFix}
                onGeneratePrompt={handleGeneratePrompt}
                onBackToMain={() => handleSwitchWorkflowMode('strict_editing')}
                promptText={promptText}
                isGenerating={isGenerating}
                promptSource={promptSource}
                fallbackReason={fallbackReason}
                generationStatusAr={generationStatusAr}
                diagnostics={diagnostics}
              />
            ) : selections.workflowMode === 'strict_editing' ? (
              <StrictEditingSection
                selections={selections}
                onUpdate={handleUpdateSelection}
                useHighThinking={useHighThinking}
                onToggleHighThinking={setUseHighThinking}
                fastMode={fastMode}
                onToggleFastMode={setFastMode}
              />
            ) : (
              <FormSections
                selections={selections}
                onUpdate={handleUpdateSelection}
                onToggleTreatment={handleToggleTreatment}
                useHighThinking={useHighThinking}
                onToggleHighThinking={setUseHighThinking}
                fastMode={fastMode}
                onToggleFastMode={setFastMode}
              />
            )}
          </div>

          {/* Left / Sticky Output Column in RTL: Section 8 */}
          <div className="lg:col-span-5 lg:sticky lg:top-6">
            <PromptOutputPanel
              promptText={promptText}
              wordCount={wordCount}
              isOutOfSync={isOutOfSync}
              isGenerating={isGenerating}
              promptSource={promptSource}
              fallbackReason={fallbackReason}
              generationStatusAr={generationStatusAr}
              diagnostics={diagnostics}
              adjustments={adjustments}
              selections={selections}
              onGeneratePrompt={handleGeneratePrompt}
              onRephrasePrompt={handleRephrasePrompt}
              savedPresets={allPresets}
              onSavePreset={handleSavePreset}
              onLoadPreset={handleLoadPreset}
              onDeletePreset={handleDeletePreset}
            />
          </div>
        </div>
      </main>

      {/* Quiet Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900 px-6 py-4 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-stone-500 dark:text-stone-400">
          <span>
            مرسم السيلفي المرجعي — يولّد نص البرومبت الإنجليزي فقط للاستخدام مع صورتك المرجعية.
          </span>
          <span>
            التطابق النهائي للملامح يعتمد على أداة توليد الصور المستخدمة.
          </span>
        </div>
      </footer>
    </div>
  );
}
