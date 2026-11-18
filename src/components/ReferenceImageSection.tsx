import React, { useRef, useState } from 'react';
import { Camera, Check, Image as ImageIcon, ShieldAlert, Sparkles, Trash2, Upload } from 'lucide-react';
import { LightingType, RoomStyleType } from '../types/selfie';
import {
  ALLOWED_REFERENCE_IMAGE_MIME_TYPES,
  MAX_REFERENCE_IMAGE_BYTES,
  validateReferenceImageInput,
} from '../utils/promptRules';

interface ReferenceImageSectionProps {
  imagePreviewUrl: string | null;
  onImageChange: (
    previewUrl: string | null,
    base64Data: string | null,
    mimeType: string | null,
    sizeBytes?: number | null
  ) => void;
  referenceImageOptIn?: boolean;
  onReferenceImageOptInChange?: (optIn: boolean) => void;
  onApplyLightingSuggestion: (lighting: LightingType, roomStyle: RoomStyleType) => void;
  imageBase64: string | null;
  imageMimeType: string | null;
}

export const ReferenceImageSection: React.FC<ReferenceImageSectionProps> = ({
  imagePreviewUrl,
  onImageChange,
  referenceImageOptIn = false,
  onReferenceImageOptInChange,
  onApplyLightingSuggestion,
  imageBase64,
  imageMimeType,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<{
    lightingDirectionAr: string;
    recommendedLighting: LightingType;
    recommendedRoomStyle: RoomStyleType;
    adviceAr: string;
  } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    const normalizedMime = file.type.trim().toLowerCase();
    if (
      !normalizedMime ||
      !(ALLOWED_REFERENCE_IMAGE_MIME_TYPES as readonly string[]).includes(
        normalizedMime
      )
    ) {
      setUploadError(
        'نوع ملف الصورة المرجعية غير مدعوم. يرجى اختيار ملف صورة صالح (JPG أو PNG أو WebP).'
      );
      return;
    }

    if (file.size > MAX_REFERENCE_IMAGE_BYTES) {
      setUploadError(
        'حجم الصورة يتجاوز الحد الأقصى المسموح به (10 ميجابايت). يرجى اختيار صورة أصغر.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const base64Match = result.split(',')[1] || null;
      const check = validateReferenceImageInput({
        optIn: true,
        base64Data: base64Match,
        mimeType: normalizedMime,
        sizeBytes: file.size,
      });
      if (!check.valid) {
        setUploadError(
          check.errorAr || 'يرجى اختيار ملف صورة صالح (JPG أو PNG أو WebP).'
        );
        return;
      }
      onImageChange(
        result,
        check.base64Data || base64Match,
        check.mimeType || normalizedMime,
        file.size
      );
      setAnalysisResult(null);
    };
    reader.readAsDataURL(file);
  };

  const handleClearImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageChange(null, null, null, null);
    setAnalysisResult(null);
    setUploadError(null);
  };

  const handleAnalyzeLighting = async () => {
    if (!imageBase64 || !imageMimeType) return;
    if (!referenceImageOptIn) {
      setUploadError(
        'يرجى تفعيل خيار «الموافقة على تحليل الصورة المرجعية عبر Gemini» أولًا قبل إرسال الصورة للتحليل.'
      );
      return;
    }
    setUploadError(null);
    setAnalyzing(true);
    try {
      const response = await fetch('/api/gemini/analyze-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: imageMimeType,
        }),
      });
      const data = await response.json();
      if (response.ok && data.adviceAr) {
        setAnalysisResult(data);
      } else if (data.error) {
        setUploadError(data.error);
      }
    } catch {
      setUploadError(
        'تعذر تحليل الإضاءة حاليًا، يمكنك اختيار الإضاءة يدويًا من القسم الخامس.'
      );
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <section
      id="section-1"
      aria-labelledby="heading-section-1"
      className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 transition-colors"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 mb-5 border-b border-stone-100 dark:border-stone-800">
        <div>
          <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
            01 · الخطوة الأولى
          </span>
          <h2
            id="heading-section-1"
            className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
          >
            الصورة المرجعية
          </h2>
        </div>
        <span className="text-xs text-stone-500 dark:text-stone-400">
          معاينة محلية آمنة افتراضيًا + تحليل مشهد اختياري عبر Gemini
        </span>
      </div>

      {/* Guidance Banner */}
      <div className="bg-stone-50 dark:bg-stone-800/60 border border-stone-200/80 dark:border-stone-700/70 rounded-lg p-4 mb-5">
        <p className="text-sm font-semibold text-stone-900 dark:text-stone-100 mb-1">
          استخدم الصورة المرجعية نفسها مع البرومبت في أداة توليد الصور
        </p>
        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          تبقى صورتك المرجعية محلية داخل متصفحك افتراضيًا ولا تُرسل إلى الخادم إلا إذا قمت بتفعيل خيار تحليل الصورة المرجعية عبر Gemini أدناه ثم ضغطت على «توليد البرومبت». لا يتم حفظ الصورة أو تسجيلها، ولا نقوم باستنتاج الهوية أو العمر أو الجنس أو العرق أو قياسات الجسم أو أي سمات شخصية حساسة، كما أن اختياراتك اليدوية في الإعدادات لها الأولوية دائمًا فوق أي ملاحظة مستخلصة من الصورة.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-start">
        {/* Upload / Preview Box */}
        <div className="md:col-span-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="sr-only"
            id="reference-image-upload"
            aria-label="رفع الصورة المرجعية للمعاينة"
          />

          {!imagePreviewUrl ? (
            <label
              htmlFor="reference-image-upload"
              className="flex flex-col items-center justify-center border border-dashed border-stone-300 dark:border-stone-700 rounded-lg p-6 text-center cursor-pointer hover:border-amber-600 dark:hover:border-amber-500 hover:bg-stone-50/70 dark:hover:bg-stone-800/40 transition-colors min-h-[180px]"
            >
              <Upload className="w-7 h-7 text-stone-400 dark:text-stone-500 mb-2.5" />
              <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
                اضغط لاختيار صورة مرجعية (JPG / PNG / WebP)
              </span>
              <span className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                تُعرض محليًا داخل المتصفح فقط ما لم تفعّل خيار تحليل Gemini
              </span>
            </label>
          ) : (
            <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 bg-stone-50 dark:bg-stone-800/40">
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-md bg-stone-200 dark:bg-stone-900 mb-3">
                <img
                  src={imagePreviewUrl}
                  alt="معاينة الصورة المرجعية"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain"
                />
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-stone-700 dark:text-stone-200 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-md hover:bg-stone-100 transition-colors whitespace-nowrap shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>تغيير الصورة</span>
                </button>
                <button
                  type="button"
                  onClick={handleClearImage}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-white dark:bg-stone-800 border border-red-200 dark:border-red-900/50 rounded-md hover:bg-red-50 transition-colors whitespace-nowrap shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>إزالة المعاينة</span>
                </button>
              </div>
            </div>
          )}

          {uploadError && (
            <p role="alert" className="text-xs text-red-600 dark:text-red-400 mt-2">
              {uploadError}
            </p>
          )}
        </div>

        {/* Explicit Gemini Reference-Image Analysis Opt-In */}
        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
          {/* Separate Explicit Opt-In for Sending Reference Image to Gemini */}
          <div className="p-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20">
            <label
              htmlFor="reference-image-gemini-opt-in"
              className="flex items-start gap-3 cursor-pointer select-none"
            >
              <input
                id="reference-image-gemini-opt-in"
                data-testid="reference-image-gemini-opt-in"
                type="checkbox"
                checked={referenceImageOptIn}
                onChange={(e) =>
                  onReferenceImageOptInChange?.(e.target.checked)
                }
                className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600 shrink-0"
              />
              <div>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block">
                  الموافقة الصريحة على تحليل الصورة المرجعية عبر Gemini (اختياري ومنفصل)
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed block mt-1">
                  عند تفعيل هذا الخيار والضغط على «توليد البرومبت»، يتم تضمين الصورة المرجعية مع إعدادات المشهد لتحليل العناصر المرئية فقط (البيئة الداخلية/الخارجية، الخلفية، الوضعية، الكادر، زاوية الكاميرا، الإضاءة، الألوان، والملابس الظاهرة) دون حفظ الصورة أو استنتاج أي سمات شخصية. عند عدم التفعيل تبقى الصورة محلية تمامًا في متصفحك.
                </span>
              </div>
            </label>
            <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300">
              <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
              <span>
                {referenceImageOptIn && imagePreviewUrl
                  ? 'مفعّل: سيتم إرسال الصورة المرجعية إلى Gemini عند الضغط على «توليد البرومبت» فقط.'
                  : 'غير مفعّل: الصورة المرجعية محفوظة محليًا في متصفحك ولن تُرسل إلى Gemini.'}
              </span>
            </div>
          </div>

          {imagePreviewUrl && (
            <div className="p-4 rounded-lg border border-stone-200 dark:border-stone-800 bg-white dark:bg-stone-900">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <span className="text-xs font-semibold text-stone-800 dark:text-stone-200">
                  مطابقة إضاءة الصورة المرجعية (تحليل بصري اختياري)
                </span>
                <button
                  type="button"
                  onClick={handleAnalyzeLighting}
                  disabled={analyzing || !referenceImageOptIn}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 rounded-md hover:bg-amber-100 transition-colors disabled:opacity-50 whitespace-nowrap shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{analyzing ? 'جاري فحص الإضاءة...' : 'اقتراح إضاءة متوافقة'}</span>
                </button>
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                يفحص اتجاه الضوء وحرارته اللونية فقط لاقتراح إضاءة غرفة نوم متناغمة دون تحليل أي سمات شخصية (يتطلب تفعيل موافقة تحليل الصورة أعلاه).
              </p>

              {analysisResult && (
                <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 text-xs space-y-2">
                  <p className="text-stone-700 dark:text-stone-300 leading-relaxed">
                    {analysisResult.adviceAr}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      onApplyLightingSuggestion(
                        analysisResult.recommendedLighting,
                        analysisResult.recommendedRoomStyle
                      )
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 dark:bg-stone-100 dark:text-stone-900 rounded-md hover:bg-stone-800 transition-colors whitespace-nowrap shrink-0"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>تطبيق الإضاءة المقترحة تلقائيًا</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-stone-500 dark:text-stone-400">
            <Camera className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
            <span>
              اختياراتك الصريحة في الإعدادات تُعامل كقيود إلزامية تتجاوز أي استنتاج متعارض من الصورة المرجعية.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};
