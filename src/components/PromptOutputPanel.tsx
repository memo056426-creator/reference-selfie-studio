import React, { useState } from 'react';
import {
  AlertCircle,
  Bookmark,
  Check,
  Code2,
  Copy,
  ExternalLink,
  Globe,
  RefreshCw,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react';
import {
  PromptFallbackReason,
  PromptGenerationDiagnostics,
  PromptGenerationSource,
  SelfieSelections,
} from '../types/selfie';
import { validateStrictLightingSelection } from '../utils/promptRules';
import { SavedPresetRecord } from '../lib/firebase';

interface PromptOutputPanelProps {
  promptText: string;
  wordCount: number;
  isOutOfSync: boolean;
  isGenerating: boolean;
  promptSource?: PromptGenerationSource;
  fallbackReason?: PromptFallbackReason | null;
  generationStatusAr?: string | null;
  diagnostics?: PromptGenerationDiagnostics | null;
  adjustments: string[];
  selections: SelfieSelections;
  onGeneratePrompt: () => void;
  onRephrasePrompt: () => void;
  savedPresets: SavedPresetRecord[];
  onSavePreset: (title: string) => Promise<void>;
  onLoadPreset: (preset: SavedPresetRecord) => void;
  onDeletePreset: (id: string) => Promise<void>;
}

export const PromptOutputPanel: React.FC<PromptOutputPanelProps> = ({
  promptText,
  wordCount,
  isOutOfSync,
  isGenerating,
  promptSource = 'deterministic',
  fallbackReason = null,
  generationStatusAr = null,
  diagnostics = null,
  adjustments,
  selections,
  onGeneratePrompt,
  onRephrasePrompt,
  savedPresets,
  onSavePreset,
  onLoadPreset,
  onDeletePreset,
}) => {
  const [copied, setCopied] = useState(false);
  const [presetTitle, setPresetTitle] = useState('');
  const [savingPreset, setSavingPreset] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Quick Tip & Search Grounding state
  const [quickTip, setQuickTip] = useState<string | null>(null);
  const [loadingTip, setLoadingTip] = useState(false);
  const [searchResult, setSearchResult] = useState<{
    summaryAr: string;
    sources: { title: string; uri: string }[];
  } | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);

  const lightingValidation = validateStrictLightingSelection(selections);
  const canGenerate = lightingValidation.valid;

  const handleCopy = async () => {
    if (!promptText) return;
    try {
      await navigator.clipboard.writeText(promptText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = promptText;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const handleSavePresetClick = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promptText) return;
    setSavingPreset(true);
    setSaveMessage(null);
    try {
      const label =
        presetTitle.trim() ||
        (selections.workflowMode === 'strict_editing'
          ? `تعديل صارم (${selections.strictLightingMode === 'mode_b_flash_mirror' ? 'MODE B' : 'MODE A'})`
          : `${selections.selfieType === 'mirror' ? 'سيلفي مرآة' : 'سيلفي أمامي'} (${selections.aspectRatio})`);
      await onSavePreset(label);
      setPresetTitle('');
      setSaveMessage('تم حفظ البرومبت والإعدادات بنجاح.');
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (err: any) {
      setSaveMessage(err?.message || 'تم الحفظ محليًا في المتصفح.');
    } finally {
      setSavingPreset(false);
    }
  };

  const handleFetchQuickTip = async () => {
    setLoadingTip(true);
    try {
      const res = await fetch('/api/gemini/quick-tip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selections }),
      });
      const data = await res.json();
      if (data.tipAr) setQuickTip(data.tipAr);
    } catch {
      setQuickTip(
        'نصيحة سريعة: تأكد من توافق اتجاه إضاءة الغرفة مع الإضاءة الظاهرة على الوجه في الصورة المرجعية.'
      );
    } finally {
      setLoadingTip(false);
    }
  };

  const handleSearchInspiration = async () => {
    setLoadingSearch(true);
    try {
      const res = await fetch('/api/gemini/search-inspiration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: `best ${selections.lighting.replace(/_/g, ' ')} bedroom ${selections.selfieType} selfie photography composition tips`,
        }),
      });
      const data = await res.json();
      if (data.summaryAr) setSearchResult(data);
    } catch {
      setSearchResult({
        summaryAr:
          'للحصول على أفضل نتيجة واقعية، استخدم إضاءة طبيعية ناعمة وتجنب الفلاتر التجميلية المبالغ فيها.',
        sources: [],
      });
    } finally {
      setLoadingSearch(false);
    }
  };

  const isFullRulesView =
    (selections.workflowMode === 'strict_editing' &&
      selections.strictOutputFormat === 'full_12_rules') ||
    selections.workflowMode === 'mirror_studio';

  return (
    <div className="space-y-6">
      {/* SECTION 8: مربع البرومبت النهائي وزر النسخ */}
      <section
        id="section-8"
        aria-labelledby="heading-section-8"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-5"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              08 · المخرجات النصية النهائية (بدون توليد صور)
            </span>
            <h2
              id="heading-section-8"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              البرومبت النهائي (جاهز للنسخ):
            </h2>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-stone-500 dark:text-stone-400 font-mono-num">
            <span
              data-testid="prompt-source-badge"
              data-source={promptSource}
              className={`px-2 py-0.5 rounded font-sans font-bold text-[11px] ${
                promptSource === 'gemini'
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800'
                  : 'bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300 border border-stone-300 dark:border-stone-700'
              }`}
            >
              {promptSource === 'gemini'
                ? 'المصدر: Gemini (gemini)'
                : 'المصدر: قياسي محلي (deterministic)'}
            </span>
            <span aria-hidden="true">·</span>
            <span>{wordCount} words</span>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center gap-1">
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>Markdown Extracted</span>
            </span>
          </div>
        </div>

        {/* Rule 04 Gate Warning if strictLightingMode is unselected */}
        {!lightingValidation.valid && (
          <div
            role="alert"
            data-testid="rule-04-lighting-alert"
            className="p-3.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 text-amber-700 dark:text-amber-400" />
            <span>{lightingValidation.messageAr}</span>
          </div>
        )}

        {/* Primary Action: Generate Prompt */}
        <button
          type="button"
          data-testid="generate-prompt-button"
          onClick={onGeneratePrompt}
          disabled={!canGenerate || isGenerating}
          className="w-full py-3 px-5 rounded-lg bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
        >
          <Wand2 className="w-4 h-4 shrink-0" />
          <span>{isGenerating ? 'جاري التوليد عبر Gemini...' : 'توليد البرومبت'}</span>
        </button>

        {/* Generation Status Banner (Generating / Gemini Success / Deterministic Fallback) */}
        {(isGenerating || generationStatusAr) && (
          <div
            role="status"
            data-testid="generation-status-banner"
            data-source={isGenerating ? 'gemini' : promptSource}
            data-fallback-reason={fallbackReason || ''}
            className={`p-3 rounded-lg border text-xs space-y-1.5 ${
              isGenerating
                ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200'
                : promptSource === 'gemini'
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-stone-100 dark:bg-stone-800/80 border-stone-300 dark:border-stone-700 text-stone-800 dark:text-stone-200'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span>
                {isGenerating
                  ? 'جاري توليد البرومبت عبر Gemini...'
                  : generationStatusAr}
              </span>
              <span className="font-mono text-[11px] font-semibold shrink-0">
                {isGenerating ? 'gemini' : promptSource}
              </span>
            </div>
            {!isGenerating && diagnostics && (
              <div
                dir="ltr"
                data-testid="generation-diagnostics"
                className="text-[10px] font-mono opacity-80 flex flex-wrap items-center gap-x-2 gap-y-0.5 pt-1 border-t border-current/15"
              >
                <span>{diagnostics.requestId}</span>
                <span>·</span>
                <span>{diagnostics.model}</span>
                <span>·</span>
                <span>{diagnostics.durationMs}ms</span>
                <span>·</span>
                <span>{diagnostics.httpStatusClass}</span>
                {fallbackReason && (
                  <>
                    <span>·</span>
                    <span>reason:{fallbackReason}</span>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Out-of-sync Notice when user modifies any option */}
        {isOutOfSync && (
          <div
            role="status"
            data-testid="out-of-sync-banner"
            className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-center justify-between gap-2"
          >
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>تم تعديل بعض الخيارات — البرومبت الحالي يحتاج إلى تحديث.</span>
            </div>
            <button
              type="button"
              onClick={onGeneratePrompt}
              disabled={!canGenerate}
              className="px-2.5 py-1 rounded bg-amber-700 text-white font-medium hover:bg-amber-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
            >
              تحديث الآن
            </button>
          </div>
        )}

        {/* Automatic Compatibility Adjustments Notice */}
        {adjustments.length > 0 && (
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 space-y-1">
            <span className="font-semibold block text-stone-900 dark:text-stone-100">
              تعديلات التوافق التلقائية:
            </span>
            {adjustments.map((adj, i) => (
              <p key={i} className="leading-relaxed">
                • {adj}
              </p>
            ))}
          </div>
        )}

        {/* Pure English Prompt Box (Read/Copy only — extracted from single Markdown code block) */}
        <div className="space-y-2">
          <label
            htmlFor="final-english-prompt"
            className="block text-xs font-medium text-stone-600 dark:text-stone-400"
          >
            {selections.workflowMode === 'mirror_studio'
              ? 'كود JSON لاستوديو المرآة الاحترافي (EXECUTE_PHOTOGRAPHIC_CAPTURE):'
              : isFullRulesView
                ? 'وثيقة التعليمات الصارمة الكاملة (القواعد [01] إلى [12] بالإنجليزية فقط):'
                : 'البرومبت النهائي (جاهز للنسخ):'}
          </label>
          <textarea
            id="final-english-prompt"
            dir="ltr"
            lang="en"
            readOnly
            rows={isFullRulesView ? 14 : 8}
            value={promptText}
            aria-label="البرومبت الإنجليزي النهائي"
            className="w-full p-4 rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-en text-sm leading-relaxed focus:outline-none focus:border-amber-600 select-all resize-y"
          />
        </div>

        {/* Copy & Rephrase Action Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!promptText}
            data-testid="copy-prompt-button"
            className="py-2.5 px-4 rounded-lg bg-stone-900 hover:bg-stone-800 dark:bg-stone-100 dark:hover:bg-stone-200 text-white dark:text-stone-900 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
                <span>تم نسخ البرومبت</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 shrink-0" />
                <span>نسخ البرومبت</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRephrasePrompt}
            disabled={!canGenerate || isGenerating}
            className="py-2.5 px-4 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 border border-stone-300 dark:border-stone-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer whitespace-nowrap"
          >
            <RefreshCw className={`w-4 h-4 shrink-0 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>إعادة الصياغة</span>
          </button>
        </div>

        <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-relaxed">
          ملاحظة: التطبيق يسلّم نص البرومبت الإنجليزي فقط ولا يقوم بتوليد الصور. انسخ البرومبت واستخدمه مع صورتك المرجعية.
        </p>
      </section>

      {/* AI Assistance & Search Grounding Box */}
      <section
        aria-labelledby="heading-ai-tips"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="heading-ai-tips"
            className="text-sm font-bold text-stone-900 dark:text-stone-100"
          >
            مساعد الإضاءة ومراجع التصوير الواقعي
          </h3>
          <span className="text-xs text-stone-500 dark:text-stone-400">Gemini + Google Search</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={handleFetchQuickTip}
            disabled={loadingTip}
            className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{loadingTip ? 'جاري التحليل...' : 'نصيحة سريعة لإعداداتك'}</span>
          </button>

          <button
            type="button"
            onClick={handleSearchInspiration}
            disabled={loadingSearch}
            className="px-3 py-2 rounded-lg border border-stone-200 dark:border-stone-700 bg-stone-50 dark:bg-stone-800/60 hover:bg-stone-100 text-xs font-medium text-stone-800 dark:text-stone-200 flex items-center justify-center gap-1.5 transition-colors whitespace-nowrap"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>{loadingSearch ? 'جاري البحث...' : 'مراجع إضاءة السيلفي (Search)'}</span>
          </button>
        </div>

        {quickTip && (
          <div className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
            {quickTip}
          </div>
        )}

        {searchResult && (
          <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700 text-xs space-y-2.5">
            <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
              {searchResult.summaryAr}
            </p>
            {searchResult.sources.length > 0 && (
              <div className="pt-2 border-t border-stone-200 dark:border-stone-700 space-y-1">
                <span className="font-semibold text-stone-800 dark:text-stone-200 block">
                  المصادر المرجعية من Google Search:
                </span>
                {searchResult.sources.map((src, idx) => (
                  <a
                    key={idx}
                    href={src.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-amber-700 dark:text-amber-400 hover:underline truncate"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    <span className="truncate">{src.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* Saved Presets Section */}
      <section
        id="saved-presets"
        aria-labelledby="heading-saved-presets"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-5 space-y-4"
      >
        <div className="flex items-center justify-between">
          <h3
            id="heading-saved-presets"
            className="text-sm font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5"
          >
            <Bookmark className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>البرومبتات والإعدادات المحفوظة</span>
          </h3>
          <span className="text-xs text-stone-500 font-mono-num">
            {savedPresets.length}
          </span>
        </div>

        <form onSubmit={handleSavePresetClick} className="flex items-center gap-2">
          <input
            type="text"
            maxLength={100}
            value={presetTitle}
            onChange={(e) => setPresetTitle(e.target.value)}
            placeholder="اسم الإعداد (مثال: سيلفي مرآة صباحي)"
            aria-label="اسم الإعداد لحفظه"
            className="flex-1 px-3 py-2 text-xs rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
          />
          <button
            type="submit"
            disabled={savingPreset || !promptText}
            className="px-3.5 py-2 rounded-lg bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 text-xs font-semibold hover:bg-stone-800 disabled:opacity-50 transition-colors whitespace-nowrap shrink-0"
          >
            {savingPreset ? 'جاري الحفظ...' : 'حفظ الإعداد'}
          </button>
        </form>

        {saveMessage && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">{saveMessage}</p>
        )}

        {savedPresets.length === 0 ? (
          <p className="text-xs text-stone-500 dark:text-stone-400 py-2">
            لا توجد إعدادات محفوظة بعد. يمكنك حفظ تشكيلة خياراتك الحالية للعودة إليها لاحقًا.
          </p>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {savedPresets.map((preset) => (
              <div
                key={preset.id}
                className="p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/60 dark:bg-stone-800/40 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-stone-900 dark:text-stone-100 truncate">
                    {preset.title}
                  </p>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 truncate font-en" dir="ltr">
                    {preset.promptText}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => onLoadPreset(preset)}
                    className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded hover:bg-stone-100 text-stone-800 dark:text-stone-200 whitespace-nowrap"
                  >
                    استرجاع
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeletePreset(preset.id)}
                    aria-label={`حذف ${preset.title}`}
                    className="p-1.5 text-stone-400 hover:text-red-600 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
