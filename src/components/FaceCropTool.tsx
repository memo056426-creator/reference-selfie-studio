import React, { useRef, useState } from 'react';
import { Check, Copy, Download, ScanFace } from 'lucide-react';
import { calculateFaceCrop } from '../utils/faceCrop';

const TWO_IMAGE_INSTRUCTIONS =
  "Image 1 is the original source photograph. Image 2 is a close-up crop of the SAME person's face, used only as a facial-detail reference, not as a second person or a new scene. Edit Image 1 and use Image 2 only to preserve the original eye shape and spacing, nose, jaw, facial hair, skin texture and natural asymmetry. Change only the user-requested regions. Do not redraw or beautify the face. If the camera angle changes, preserve the reference facial anatomy instead of generating a generic face.";

interface FaceCropToolProps {
  imagePreviewUrl: string;
}

/**
 * A manual, on-device face-detail crop for use with an external image editor.
 * No face detection, remote image transfer or source-file modification.
 */
export const FaceCropTool: React.FC<FaceCropToolProps> = ({ imagePreviewUrl }) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [center, setCenter] = useState({ x: 0.5, y: 0.3 });
  const [cropFraction, setCropFraction] = useState(0.45);
  const [feedback, setFeedback] = useState<string | null>(null);
  const crop = dimensions
    ? calculateFaceCrop(dimensions.width, dimensions.height, center.x, center.y, cropFraction)
    : null;

  const selectFaceCenter = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = imageRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCenter({
      x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)),
    });
    setFeedback(null);
  };

  const handleArrows = (event: React.KeyboardEvent<HTMLButtonElement>) => {
    const step = 0.02;
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    setCenter((previous) => ({
      x: Math.max(0, Math.min(1,
        previous.x + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0)
      )),
      y: Math.max(0, Math.min(1,
        previous.y + (event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0)
      )),
    }));
  };

  const downloadFaceCrop = async () => {
    const image = imageRef.current;
    if (!image || !crop) return;
    try {
      const canvas = document.createElement('canvas');
      const outputSize = Math.min(crop.size, 1024);
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas is unavailable');
      ctx.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, outputSize, outputSize);

      const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
      if (!blob) throw new Error('Could not encode crop');
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'same-person-face-reference.png';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 3000);
      setFeedback('تم تجهيز قصّة الوجه محليًا؛ أرفقها مع الصورة الأصلية في Gemini.');
    } catch {
      setFeedback('تعذّر تجهيز قصّة الوجه في هذا المتصفح. جرّب صورة أخرى أو متصفحًا حديثًا.');
    }
  };

  const copyInstructions = async () => {
    try {
      await navigator.clipboard.writeText(TWO_IMAGE_INSTRUCTIONS);
      setFeedback('تم نسخ تعليمات استخدام الصورة الأصلية وقصّة الوجه معًا.');
    } catch {
      setFeedback('تعذّر النسخ تلقائيًا؛ يمكنك استخدام الإرشادات الظاهرة أدناه.');
    }
  };

  return (
    <div className="mt-4 rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 p-3">
      <div className="flex items-center gap-2 mb-2 text-sm font-semibold text-stone-900 dark:text-stone-100">
        <ScanFace className="w-4 h-4 text-amber-700 dark:text-amber-400" />
        <span>مرجع وجه مقرب — قصّ يدوي محلي</span>
      </div>
      <p className="mb-3 text-xs leading-relaxed text-stone-700 dark:text-stone-300">
        اضغط على مركز الوجه في الصورة وحدّد حجم المربع. نزّل القصّة وأرفقها مع <strong>الصورة الأصلية نفسها</strong> عند توليد الصورة في Gemini. القصّة لتوضيح التفاصيل، لا لتغيير هوية الشخص.
      </p>
      <button
        type="button"
        onClick={selectFaceCenter}
        onKeyDown={handleArrows}
        aria-label="تحديد مركز الوجه على الصورة المرجعية؛ استخدم الأسهم للضبط"
        className="relative block w-full overflow-hidden rounded-md border border-amber-300 dark:border-amber-800 bg-stone-900 focus-visible:outline-2 focus-visible:outline-amber-500"
      >
        <img
          ref={imageRef}
          src={imagePreviewUrl}
          onLoad={(event) => {
            const img = event.currentTarget;
            setDimensions({ width: img.naturalWidth, height: img.naturalHeight });
            setCenter({ x: 0.5, y: 0.3 });
          }}
          className="w-full h-auto block"
          alt="اختر مركز الوجه للقص المرجعي"
          draggable={false}
        />
        {crop && dimensions && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute border-2 border-amber-400 shadow-[0_0_0_2000px_rgba(0,0,0,0.28)] rounded-sm"
            style={{
              left: `${(crop.x / dimensions.width) * 100}%`,
              top: `${(crop.y / dimensions.height) * 100}%`,
              width: `${(crop.size / dimensions.width) * 100}%`,
              height: `${(crop.size / dimensions.height) * 100}%`,
            }}
          />
        )}
      </button>
      <label className="mt-3 flex items-center gap-3 text-xs text-stone-700 dark:text-stone-200">
        <span className="shrink-0">حجم قصّة الوجه</span>
        <input
          type="range"
          min="20"
          max="85"
          step="1"
          value={Math.round(cropFraction * 100)}
          onChange={(e) => setCropFraction(Number(e.target.value) / 100)}
          className="w-full accent-amber-600"
          aria-label="تعديل حجم مربع الوجه"
        />
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={downloadFaceCrop}
          disabled={!crop}
          className="inline-flex gap-1.5 items-center rounded-md bg-amber-700 hover:bg-amber-800 disabled:opacity-50 text-white px-3 py-2 text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          تنزيل قصّة الوجه
        </button>
        <button
          type="button"
          onClick={copyInstructions}
          className="inline-flex gap-1.5 items-center rounded-md border border-stone-300 dark:border-stone-700 px-3 py-2 text-xs font-medium text-stone-800 dark:text-stone-200"
        >
          <Copy className="w-4 h-4" />
          نسخ تعليمات المرجعين
        </button>
      </div>
      <p className="mt-3 text-[11px] text-stone-600 dark:text-stone-300 leading-relaxed">
        <strong>الاستخدام:</strong> ارفع الصورة الكاملة أولًا، ثم قصّة الوجه لنفس الشخص، ثم البرومبت. لا تُرفع القصّة إلى خادم هذا التطبيق، ولا يضمن أي نص تطابق الوجه تلقائيًا.
      </p>
      {feedback && (
        <p role="status" className="mt-2 flex items-start gap-1 text-xs text-emerald-800 dark:text-emerald-300">
          <Check className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          {feedback}
        </p>
      )}
    </div>
  );
};
