import React from 'react';
import { Check, Moon, ShieldCheck, Zap } from 'lucide-react';
import {
  ASPECT_RATIO_OPTIONS,
  FLASH_MIRROR_GEOMETRY_OPTIONS,
  FRONT_POSE_OPTIONS,
  LOWER_BODY_COLOR_OPTIONS,
  REAR_CAMERA_POSE_OPTIONS,
  SCREEN_ORIENTATION_OPTIONS,
  SelfieSelections,
  SKIN_TEXTURE_OPTIONS,
  STRICT_LIGHTING_MODE_OPTIONS,
  StrictLowerClothingMode,
} from '../types/selfie';
import { getEffectiveLowerClothingState } from '../utils/promptRules';
import { UpperClothingSelector } from './UpperClothingSelector';
import { LowerClothingSelector } from './LowerClothingSelector';

interface StrictEditingSectionProps {
  selections: SelfieSelections;
  onUpdate: <K extends keyof SelfieSelections>(key: K, value: SelfieSelections[K]) => void;
  useHighThinking: boolean;
  onToggleHighThinking: (val: boolean) => void;
  fastMode: boolean;
  onToggleFastMode: (val: boolean) => void;
}

const PRIORITY_ORDER_ITEMS = [
  '1. الحفاظ الصارم على هوية الشخص وملامح الوجه وبنية العظام من الصورة المرجعية دون تجميل [01].',
  '2. الحفاظ على صحة التشريح والفيزياء والمنظور وهندسة الانعكاس والجاذبية [07 & 08].',
  '3. اتباع وضع الإضاءة المختار (MODE A أو MODE B) حصرياً وفق قانون التربيع العكسي للضوء [04–06].',
  '4. إبقاء الشخص هو الموضوع الأساسي في الكادر دون عزل خلفية مصطنع [03].',
  '5. تطبيق تعديلات الملابس العلوية و/أو السفلية المختارة باستقلالية تامة ودون تسرّب ألوان، مع حفظ أي قطعة غير معدّلة كما في المرجع [02].',
  '6. التحسينات الجمالية الثانوية التي لا تتعارض مع القواعد أعلاه [09–11].',
];

const CONSISTENCY_CHECK_ITEMS = [
  'هل يحافظ البرومبت بصرامة على ملامح الوجه وبنيته العظمية وتفاصيله المرجعية دون تجميل أو تنحيف؟',
  'هل طُبّقت تعديلات الملابس العلوية والسفلية بشكل مستقل دون تسرّب ألوان أو اختراع شعارات مع حفظ القطع غير المعدّلة من المرجع؟',
  'هل هناك وضع إضاءة واحد فقط نشط والغرفة مظلمة فيزيائياً؟',
  'هل كل منطقة مضاءة لها مسار ضوئي منطقي وفيزيائي دون إضاءة استوديو خفية؟',
  'هل الصورة خالية تماماً من اللمعان البلاستيكي أو التنعيم الصناعي (Zero AI Plastic Look)؟',
];

export const StrictEditingSection: React.FC<StrictEditingSectionProps> = ({
  selections,
  onUpdate,
  useHighThinking,
  onToggleHighThinking,
  fastMode,
  onToggleFastMode,
}) => {
  const isModeA = selections.strictLightingMode === 'mode_a_screen';
  const isModeB = selections.strictLightingMode === 'mode_b_flash_mirror';
  const isUnselected = selections.strictLightingMode === 'unselected';
  const effectiveLowerState = getEffectiveLowerClothingState({
    ...selections,
    workflowMode: 'strict_editing',
  });
  const lowerMode: StrictLowerClothingMode = effectiveLowerState.editMode;
  const isUpperEditEnabled = Boolean(selections.strictUpperClothingEditEnabled);

  const handleToggleUpperEdit = (enableEdit: boolean) => {
    onUpdate('strictUpperClothingEditEnabled', enableEdit);
    if (enableEdit) {
      if (
        selections.upperGarment === undefined ||
        selections.upperGarment === 'preserve_reference'
      ) {
        onUpdate('upperGarment', 'crew_neck_tshirt');
        onUpdate('upperGarmentColor', 'white');
        onUpdate('upperGarmentMaterial', 'cotton_jersey');
        onUpdate('upperGarmentFit', 'regular');
        onUpdate('upperGarmentPattern', 'solid');
      }
    }
  };

  const handleSelectLowerMode = (mode: StrictLowerClothingMode) => {
    onUpdate('strictLowerClothingMode', mode);
    if (mode === 'preserve_reference') {
      onUpdate('lowerGarment', 'preserve_reference');
      onUpdate('lowerGarmentColor', 'preserve_reference');
    } else if (mode === 'recolor_only') {
      if (selections.lowerGarment === 'preserve_reference') {
        onUpdate('lowerGarment', undefined);
      }
    } else {
      if (
        selections.lowerGarment === undefined ||
        selections.lowerGarment === 'preserve_reference'
      ) {
        onUpdate('lowerGarment', 'relaxed_trousers');
        onUpdate('lowerGarmentColor', 'charcoal');
        onUpdate('lowerGarmentMaterial', 'cotton_twill');
        onUpdate('lowerGarmentFit', 'relaxed');
        onUpdate('lowerGarmentPattern', 'solid');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* RULE 04, 05, 06: LIGHTING MODE SELECTION */}
      <section
        id="section-2"
        aria-labelledby="heading-strict-lighting"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              القواعد [04 · 05 · 06] · وضع الإضاءة الإلزامي
            </span>
            <h2
              id="heading-strict-lighting"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              اختيار وضع الإضاءة الليلية الحصري (MODE A أو MODE B)
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            يُمنع الجمع بين الوضعين نهائيًا
          </span>
        </div>

        <div
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
          role="group"
          aria-label="اختيار وضع الإضاءة الصارم"
        >
          {STRICT_LIGHTING_MODE_OPTIONS.map((opt) => {
            const active = selections.strictLightingMode === opt.value;
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onUpdate('strictLightingMode', opt.value)}
                aria-pressed={active}
                className={`p-4 rounded-lg border text-right transition-colors flex flex-col justify-between ${
                  active
                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                    : 'bg-stone-50/80 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-sm leading-snug">{opt.labelAr}</span>
                  {opt.value === 'mode_a_screen' && <Moon className="w-4 h-4 shrink-0" />}
                  {opt.value === 'mode_b_flash_mirror' && <Zap className="w-4 h-4 shrink-0" />}
                </div>
                {opt.descAr && (
                  <span
                    className={`text-xs leading-relaxed ${
                      active
                        ? 'text-stone-300 dark:text-stone-900'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {opt.descAr}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Rule 05 Details: Mode A Screen Orientation */}
        {isModeA && (
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
            <label className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
              القاعدة [05] — اتجاه شاشة الهاتف ومسار الضوء في الغرفة المظلمة:
            </label>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              تبقى الغرفة مظلمة تمامًا دون فلاش أو مصابيح أو ضوء نافذة. يحدد موقع الشاشة واتجاهها الفعلي الأجزاء التي يصلها الضوء فقط مع قبول الظلال العميقة.
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
              role="group"
              aria-label="اتجاه شاشة الهاتف في الوضع A"
            >
              {SCREEN_ORIENTATION_OPTIONS.map((item) => {
                const selected = selections.screenOrientation === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onUpdate('screenOrientation', item.value)}
                    aria-pressed={selected}
                    className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                      selected
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span>{item.labelAr}</span>
                    {item.descAr && (
                      <span
                        className={`text-[11px] mt-1 ${
                          selected
                            ? 'text-stone-300 dark:text-stone-900'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {item.descAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rule 06 & 08 Details: Mode B Flash Mirror Geometry */}
        {isModeB && (
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
            <label className="block text-sm font-semibold text-stone-900 dark:text-stone-100">
              القاعدتان [06 & 08] — هندسة فلاش الكاميرا وانعكاس المرآة في الغرفة المظلمة:
            </label>
            <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
              جميع مصادر الإضاءة الأخرى مطفأة ولا تساهم شاشة الهاتف بأي إضاءة مرئية. يتبع وهج الفلاش والظلال زاوية الكاميرا والمرآة بدقة فيزيائية.
            </p>
            <div
              className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
              role="group"
              aria-label="هندسة فلاش المرآة في الوضع B"
            >
              {FLASH_MIRROR_GEOMETRY_OPTIONS.map((item) => {
                const selected = selections.flashMirrorGeometry === item.value;
                return (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => onUpdate('flashMirrorGeometry', item.value)}
                    aria-pressed={selected}
                    className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                      selected
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                        : 'bg-white dark:bg-stone-900 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span>{item.labelAr}</span>
                    {item.descAr && (
                      <span
                        className={`text-[11px] mt-1 ${
                          selected
                            ? 'text-stone-300 dark:text-stone-900'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {item.descAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {isUnselected && (
          <div
            role="alert"
            className="p-4 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200"
          >
            <strong>تنبيه القاعدة [04]:</strong> لم يتم تحديد وضع الإضاءة بعد. يرجى اختيار <strong>الوضع A (شاشة الهاتف فقط)</strong> أو <strong>الوضع B (فلاش الهاتف في المرآة)</strong> أعلاه لتفعيل توليد التعليمات.
          </div>
        )}
      </section>

      {/* RULE 02: INDEPENDENT UPPER & LOWER CLOTHING CONTROLS */}
      <section
        id="section-4"
        aria-labelledby="heading-strict-clothing"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              القاعدة [02] · التحكم المستقل بالملابس العلوية والسفلية
            </span>
            <h2
              id="heading-strict-clothing"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              تخصيص أو حفظ الملابس العلوية والملابس السفلية بشكل مستقل
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            حفظ المرجع افتراضيًا ومنع تسرّب الألوان أو الخامات
          </span>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
          يُحافظ هذا الوضع على ملابس الصورة المرجعية افتراضيًا ما لم تختر تعديل القطعة العلوية و/أو السفلية صراحةً. تُطبّق الألوان والخامات والقصّات على القطعة المحددة فقط دون تغيير القطعة الأخرى أو البشرة المكشوفة أو اختراع شعارات.
        </p>

        {/* Sub-section A: Upper-body clothing */}
        <div
          className="space-y-3 pt-2 border-t border-stone-100 dark:border-stone-800"
          data-testid="strict-upper-subsection"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              أ. الملابس العلوية
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              تحكم مستقل بالقطعة العلوية فقط
            </span>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
            role="group"
            aria-label="وضع الملابس العلوية في التحرير الصارم"
          >
            <button
              type="button"
              onClick={() => handleToggleUpperEdit(false)}
              aria-pressed={!isUpperEditEnabled}
              className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                !isUpperEditEnabled
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span>الحفاظ على الملابس العلوية من المرجع (افتراضي)</span>
              <span
                className={`text-[11px] mt-1 ${
                  !isUpperEditEnabled
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                إبقاء القطعة العلوية الأصلية دون تغيير لون أو خامة أو تصميم
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleToggleUpperEdit(true)}
              aria-pressed={isUpperEditEnabled}
              className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                isUpperEditEnabled
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span>تعديل الملابس العلوية صراحةً</span>
              <span
                className={`text-[11px] mt-1 ${
                  isUpperEditEnabled
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                تحديد نوع القطعة العلوية، اللون، الخامة، القصّة، والنقشة باستقلالية
              </span>
            </button>
          </div>

          {!isUpperEditEnabled ? (
            <div
              role="status"
              className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300"
            >
              الوضع النشط: <strong>الحفاظ الكامل على الملابس العلوية الأصلية</strong> من الصورة المرجعية دون تغيير.
            </div>
          ) : (
            <UpperClothingSelector
              selections={selections}
              onUpdate={onUpdate}
              hidePreserveOption
              idPrefix="strict-editing-upper"
            />
          )}
        </div>

        {/* Sub-section B: Lower-body clothing */}
        <div
          className="space-y-3 pt-4 border-t border-stone-100 dark:border-stone-800"
          data-testid="strict-lower-subsection"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h3 className="text-sm font-bold text-stone-900 dark:text-stone-100">
              ب. الملابس السفلية
            </h3>
            <span className="text-xs text-stone-500 dark:text-stone-400">
              حفظ المرجع، إعادة تلوين فقط، أو تعديل كامل للقطعة السفلية
            </span>
          </div>

          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
            role="group"
            aria-label="وضع الملابس السفلية في التحرير الصارم"
          >
            <button
              type="button"
              onClick={() => handleSelectLowerMode('preserve_reference')}
              aria-pressed={lowerMode === 'preserve_reference'}
              className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                lowerMode === 'preserve_reference'
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span>الحفاظ على القطعة السفلية من المرجع</span>
              <span
                className={`text-[11px] mt-1 ${
                  lowerMode === 'preserve_reference'
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                إبقاء الملابس السفلية الأصلية ولونها كما هي تمامًا
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLowerMode('recolor_only')}
              aria-pressed={lowerMode === 'recolor_only'}
              className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                lowerMode === 'recolor_only'
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span>تغيير لون القطعة السفلية فقط</span>
              <span
                className={`text-[11px] mt-1 ${
                  lowerMode === 'recolor_only'
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                حفظ نوع القطعة الأصلية وقصّتها وخامتها مع تغيير اللون فقط
              </span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectLowerMode('edit_garment')}
              aria-pressed={lowerMode === 'edit_garment'}
              className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                lowerMode === 'edit_garment'
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span>تعديل القطعة السفلية بالكامل</span>
              <span
                className={`text-[11px] mt-1 ${
                  lowerMode === 'edit_garment'
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                تحديد نوع القطعة السفلية، اللون، الخامة، القصّة، والنقشة باستقلالية
              </span>
            </button>
          </div>

          {lowerMode === 'preserve_reference' && (
            <div
              role="status"
              className="p-3 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 text-xs text-stone-600 dark:text-stone-300"
            >
              الوضع النشط: <strong>الحفاظ الكامل على الملابس السفلية الأصلية</strong> من الصورة المرجعية دون أي تعديل في اللون أو التصميم.
            </div>
          )}

          {lowerMode === 'recolor_only' && (
            <div className="space-y-3">
              <div
                className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
                role="group"
                aria-label="لون الملابس السفلية"
              >
                {LOWER_BODY_COLOR_OPTIONS.map((item) => {
                  const active = selections.lowerBodyColor === item.value;
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onUpdate('lowerBodyColor', item.value)}
                      aria-pressed={active}
                      className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                        active
                          ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                          : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                      }`}
                    >
                      <span>{item.labelAr}</span>
                      {item.descAr && (
                        <span
                          className={`text-[11px] mt-1 ${
                            active
                              ? 'text-stone-300 dark:text-stone-900'
                              : 'text-stone-500 dark:text-stone-400'
                          }`}
                        >
                          {item.descAr}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {selections.lowerBodyColor === 'custom_lower_color' && (
                <div>
                  <label
                    htmlFor="custom-lower-body-color-input"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    حدد لون الملابس السفلية المخصص (بالعربية أو الإنجليزية):
                  </label>
                  <input
                    id="custom-lower-body-color-input"
                    type="text"
                    maxLength={80}
                    value={selections.customLowerBodyColorText}
                    onChange={(e) => onUpdate('customLowerBodyColorText', e.target.value)}
                    placeholder="مثال: رمادي فحمي داكن أو كحلي مطفأ (Subdued Charcoal / Navy)"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}
            </div>
          )}

          {lowerMode === 'edit_garment' && (
            <LowerClothingSelector
              selections={{
                ...selections,
                workflowMode: 'strict_editing',
                strictLowerClothingMode: 'edit_garment',
              }}
              onUpdate={onUpdate}
              hidePreserveOption
              idPrefix="strict-editing-lower"
            />
          )}
        </div>
      </section>

      {/* OUTPUT FORMAT, ASPECT RATIO & MANDATORY PRIORITY CHECKLIST (01, 03, 07-12) */}
      <section
        id="section-5"
        aria-labelledby="heading-strict-priority"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              القواعد [01 · 03 · 07–12] · صيغة المخرج وترتيب الأولويات
            </span>
            <h2
              id="heading-strict-priority"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              صيغة البرومبت الإنجليزي وضوابط التحقق النهائي
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            حماية صارمة للهوية والفيزياء
          </span>
        </div>

        {/* Pose & Camera Setup Selector (Rules 03 & 07) */}
        <div className="space-y-4">
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
              أ. وضعيات الكاميرا الأمامية والسرير (Front Camera & Bed Mechanics — القاعدتان [03 & 07]):
            </label>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
              role="group"
              aria-label="الوضعية على السرير"
            >
              {FRONT_POSE_OPTIONS.map((opt) => {
                const active = selections.pose === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate('pose', opt.value)}
                    aria-pressed={active}
                    className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                      active
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                        : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-sm leading-snug">{opt.labelAr}</span>
                    {opt.descAr && (
                      <span
                        className={`text-[11px] mt-1.5 leading-relaxed ${
                          active
                            ? 'text-stone-300 dark:text-stone-900'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {opt.descAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
              ب. وضعيات الكاميرا الخلفية والمرآة (Rear Camera & Mirror / Propped Mechanics):
            </label>
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5"
              role="group"
              aria-label="وضعيات الكاميرا الخلفية"
            >
              {REAR_CAMERA_POSE_OPTIONS.map((opt) => {
                const active = selections.pose === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => onUpdate('pose', opt.value)}
                    aria-pressed={active}
                    className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                      active
                        ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                        : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                    }`}
                  >
                    <span className="text-sm leading-snug">{opt.labelAr}</span>
                    {opt.descAr && (
                      <span
                        className={`text-[11px] mt-1.5 leading-relaxed ${
                          active
                            ? 'text-stone-300 dark:text-stone-900'
                            : 'text-stone-500 dark:text-stone-400'
                        }`}
                      >
                        {opt.descAr}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Skin Texture Selector (Rule 01 & 09) */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
            ملمس البشرة (القاعدتان [01 & 09]):
          </label>
          <div
            className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
            role="group"
            aria-label="ملمس البشرة"
          >
            {SKIN_TEXTURE_OPTIONS.map((opt) => {
              const active = selections.skinTexture === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onUpdate('skinTexture', opt.value)}
                  aria-pressed={active}
                  className={`p-3 rounded-lg border text-right text-xs transition-colors flex flex-col justify-between ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                      : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  <span className="text-sm leading-snug">{opt.labelAr}</span>
                  {opt.descAr && (
                    <span
                      className={`text-[11px] mt-1 ${
                        active
                          ? 'text-stone-300 dark:text-stone-900'
                          : 'text-stone-500 dark:text-stone-400'
                      }`}
                    >
                      {opt.descAr}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Output Format Selector */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
            صيغة النص الإنجليزي المطلوب في مربع المخرجات:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" role="group" aria-label="صيغة النص الإنجليزي">
            <button
              type="button"
              onClick={() => onUpdate('strictOutputFormat', 'concise_prompt')}
              aria-pressed={selections.strictOutputFormat === 'concise_prompt'}
              className={`p-3.5 rounded-lg border text-right transition-colors ${
                selections.strictOutputFormat === 'concise_prompt'
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span className="text-sm block">فقرة برومبت إنجليزية مدمجة (100–170 كلمة)</span>
              <span
                className={`text-xs block mt-1 ${
                  selections.strictOutputFormat === 'concise_prompt'
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                فقرة واحدة مترابطة بدون عناوين تلخّص القواعد الـ 12 مع الوضع المختار وضوابط الملابس العلوية والسفلية
              </span>
            </button>

            <button
              type="button"
              onClick={() => onUpdate('strictOutputFormat', 'full_12_rules')}
              aria-pressed={selections.strictOutputFormat === 'full_12_rules'}
              className={`p-3.5 rounded-lg border text-right transition-colors ${
                selections.strictOutputFormat === 'full_12_rules'
                  ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                  : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
              }`}
            >
              <span className="text-sm block">وثيقة القواعد الـ 12 الكاملة ([01] إلى [12])</span>
              <span
                className={`text-xs block mt-1 ${
                  selections.strictOutputFormat === 'full_12_rules'
                    ? 'text-stone-300 dark:text-stone-900'
                    : 'text-stone-500 dark:text-stone-400'
                }`}
              >
                تُخرج النص الإنجليزي المفصّل للقواعد [01]–[12] مخصصًا بالوضع المختار وضوابط الملابس العلوية والسفلية
              </span>
            </button>
          </div>
        </div>

        {/* Priority Order & Consistency Check Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
              <span>القاعدة [11] — ترتيب الأولويات الإلزامي عند التعارض:</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {PRIORITY_ORDER_ITEMS.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-2.5">
            <h3 className="text-xs font-bold text-stone-900 dark:text-stone-100 flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>القاعدة [12] — الفحص النهائي للاتساق (Anti-AI Detection):</span>
            </h3>
            <ul className="space-y-1.5 text-xs text-stone-700 dark:text-stone-300 leading-relaxed">
              {CONSISTENCY_CHECK_ITEMS.map((item, idx) => (
                <li key={idx} className="flex items-start gap-1.5">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <div className="pt-2 border-t border-stone-200 dark:border-stone-700 text-[11px] text-stone-500 dark:text-stone-400 flex flex-wrap items-center justify-between gap-2">
              <span>ملف الجهاز المرجعي: Xiaomi 15 Ultra (دون اختراع بيانات مستشعر أو ISO غير موثقة)</span>
              <a
                href="/assets/aistudio/____________________________________________________________________00ec56e7.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-700 dark:text-amber-400 font-semibold hover:underline"
              >
                فتح الدليل الهندسي الكامل (MD)
              </a>
            </div>
          </div>
        </div>

        {/* Aspect Ratio & AI Mode */}
        <div className="space-y-2.5 pt-2 border-t border-stone-100 dark:border-stone-800">
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
            نسبة أبعاد الصورة (Aspect Ratio)
          </label>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2"
            role="group"
            aria-label="نسبة أبعاد الصورة المستهدفة"
          >
            {ASPECT_RATIO_OPTIONS.map((ar) => {
              const active = selections.aspectRatio === ar.value;
              return (
                <button
                  key={ar.value}
                  type="button"
                  onClick={() => onUpdate('aspectRatio', ar.value)}
                  aria-pressed={active}
                  className={`px-3 py-2 rounded-lg border text-right transition-colors ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                      : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  <span className="text-xs font-mono-num block">{ar.labelAr}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            htmlFor="strict-fast-mode"
            className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 cursor-pointer"
          >
            <input
              id="strict-fast-mode"
              type="checkbox"
              checked={fastMode}
              onChange={(e) => {
                onToggleFastMode(e.target.checked);
                if (e.target.checked) onToggleHighThinking(false);
              }}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600 shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                استجابة فائقة السرعة (Flash-Lite)
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                صياغة فورية عبر gemini-3.1-flash-lite.
              </span>
            </div>
          </label>

          <label
            htmlFor="strict-high-thinking"
            className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 cursor-pointer"
          >
            <input
              id="strict-high-thinking"
              type="checkbox"
              checked={useHighThinking}
              onChange={(e) => {
                onToggleHighThinking(e.target.checked);
                if (e.target.checked) onToggleFastMode(false);
              }}
              className="mt-1 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600 shrink-0"
            />
            <div>
              <span className="text-xs font-semibold text-stone-900 dark:text-stone-100 block">
                تفكير عميق لتدقيق القواعد الـ 12 (Thinking HIGH)
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                يستخدم gemini-4-hydrogen بمستوى تفكير عالٍ للتحقق من عدم تعارض الفيزياء والإضاءة.
              </span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
};
