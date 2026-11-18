import React from 'react';
import {
  SelfieSelections,
  UPPER_GARMENT_COLOR_OPTIONS,
  UPPER_GARMENT_FIT_OPTIONS,
  UPPER_GARMENT_MATERIAL_OPTIONS,
  UPPER_GARMENT_OPTIONS,
  UPPER_GARMENT_PATTERN_OPTIONS,
  UpperGarmentColorType,
  UpperGarmentFitType,
  UpperGarmentMaterialType,
  UpperGarmentPatternType,
  UpperGarmentType,
} from '../types/selfie';
import {
  getCompatibleFitsForGarment,
  getCompatibleMaterialsForGarment,
  getCompatiblePatternsForGarment,
  getEffectiveUpperClothingState,
} from '../utils/promptRules';

interface UpperClothingSelectorProps {
  selections: SelfieSelections;
  onUpdate: <K extends keyof SelfieSelections>(
    key: K,
    value: SelfieSelections[K]
  ) => void;
  lockedByOuterPreserve?: boolean;
  hidePreserveOption?: boolean;
  variant?: 'default' | 'dark';
  idPrefix?: string;
}

export const UpperClothingSelector: React.FC<UpperClothingSelectorProps> = ({
  selections,
  onUpdate,
  lockedByOuterPreserve = false,
  hidePreserveOption = false,
  variant = 'default',
  idPrefix = 'upper',
}) => {
  const effective = getEffectiveUpperClothingState(selections);
  const isLocked = lockedByOuterPreserve || effective.isPreservingUpper;
  const isDark = variant === 'dark';

  const garmentOptions = hidePreserveOption
    ? UPPER_GARMENT_OPTIONS.filter((o) => o.value !== 'preserve_reference')
    : UPPER_GARMENT_OPTIONS;

  const colorOptions = UPPER_GARMENT_COLOR_OPTIONS.filter(
    (o) => o.value !== 'preserve_reference'
  );

  const ensureGarmentInitialized = () => {
    if (selections.upperGarment === undefined && !isLocked) {
      onUpdate('upperGarment', effective.upperGarment);
    }
  };

  const handleGarmentSelect = (nextGarment: UpperGarmentType) => {
    if (lockedByOuterPreserve) return;
    onUpdate('upperGarment', nextGarment);

    if (nextGarment === 'preserve_reference') {
      onUpdate('upperGarmentColor', 'preserve_reference');
      return;
    }

    const compatMaterials = getCompatibleMaterialsForGarment(nextGarment);
    const compatFits = getCompatibleFitsForGarment(nextGarment);
    const compatPatterns = getCompatiblePatternsForGarment(nextGarment);

    const currentColor =
      selections.upperGarmentColor &&
      selections.upperGarmentColor !== 'preserve_reference'
        ? selections.upperGarmentColor
        : effective.upperGarmentColor === 'preserve_reference'
          ? 'beige'
          : effective.upperGarmentColor;
    onUpdate('upperGarmentColor', currentColor);

    const currentMaterial =
      selections.upperGarmentMaterial ?? effective.upperGarmentMaterial;
    onUpdate(
      'upperGarmentMaterial',
      compatMaterials.includes(currentMaterial)
        ? currentMaterial
        : compatMaterials[0]
    );

    const currentFit = selections.upperGarmentFit ?? effective.upperGarmentFit;
    onUpdate(
      'upperGarmentFit',
      compatFits.includes(currentFit)
        ? currentFit
        : compatFits.includes('relaxed')
          ? 'relaxed'
          : compatFits[0]
    );

    const currentPattern =
      selections.upperGarmentPattern ?? effective.upperGarmentPattern;
    onUpdate(
      'upperGarmentPattern',
      compatPatterns.includes(currentPattern)
        ? currentPattern
        : compatPatterns[0]
    );
  };

  const handleColorSelect = (color: UpperGarmentColorType) => {
    if (isLocked) return;
    ensureGarmentInitialized();
    onUpdate('upperGarmentColor', color);
  };

  const handleMaterialSelect = (material: UpperGarmentMaterialType) => {
    if (isLocked || !effective.compatibleMaterials.includes(material)) return;
    ensureGarmentInitialized();
    onUpdate('upperGarmentMaterial', material);
  };

  const handleFitSelect = (fit: UpperGarmentFitType) => {
    if (isLocked || !effective.compatibleFits.includes(fit)) return;
    ensureGarmentInitialized();
    onUpdate('upperGarmentFit', fit);
  };

  const handlePatternSelect = (pattern: UpperGarmentPatternType) => {
    if (isLocked || !effective.compatiblePatterns.includes(pattern)) return;
    ensureGarmentInitialized();
    onUpdate('upperGarmentPattern', pattern);
  };

  const containerCls = isDark
    ? 'p-4 rounded-lg bg-gray-900/70 border border-gray-700 space-y-5'
    : 'p-4 rounded-xl bg-stone-50/70 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800 space-y-5';

  const headingCls = isDark
    ? 'text-sm font-bold text-orange-400'
    : 'text-sm font-bold text-stone-900 dark:text-stone-100';

  const subtextCls = isDark
    ? 'text-xs text-gray-400'
    : 'text-xs text-stone-500 dark:text-stone-400';

  const labelCls = isDark
    ? 'block text-xs font-semibold text-gray-200'
    : 'block text-xs font-semibold text-stone-800 dark:text-stone-200';

  const inputCls = isDark
    ? 'w-full px-3 py-2 text-sm rounded-md border border-gray-700 bg-gray-950 text-white focus:outline-none focus:border-orange-500'
    : 'w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600';

  const getBtnCls = (active: boolean, disabled: boolean) => {
    if (disabled) {
      return isDark
        ? 'opacity-40 cursor-not-allowed bg-gray-900 border-gray-800 text-gray-500'
        : 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400';
    }
    if (active) {
      return isDark
        ? 'bg-orange-600 text-white border-orange-500 font-semibold'
        : 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold';
    }
    return isDark
      ? 'bg-gray-900 text-gray-200 border-gray-700 hover:border-gray-500'
      : 'bg-white dark:bg-stone-900/70 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500';
  };

  return (
    <div className={containerCls} data-testid={`${idPrefix}-clothing-selector`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <h3 className={headingCls}>
            الملابس العلوية (مستقلة بالكامل عن الملابس السفلية)
          </h3>
          <p className={`${subtextCls} mt-0.5`}>
            تُطبّق هذه الخيارات على القطعة العلوية فقط مع نسيج واقعي وطيّات طبيعية دون تغيير القطعة السفلية أو اختراع شعارات.
          </p>
        </div>
      </div>

      {lockedByOuterPreserve && (
        <div
          role="status"
          className={
            isDark
              ? 'p-3 rounded-md bg-gray-950 border border-amber-700/60 text-xs text-amber-300'
              : 'p-3 rounded-lg bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200'
          }
        >
          تم قفل تعديل القطعة العلوية تلقائيًا لأن خيار الملابس العام مضبوط على{' '}
          <strong>الحفاظ على ملابس المرجع</strong>.
        </div>
      )}

      {/* 1. Upper Garment */}
      <div className="space-y-2">
        <label className={labelCls}>1. نوع القطعة العلوية</label>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
          role="group"
          aria-label="نوع القطعة العلوية"
        >
          {garmentOptions.map((opt) => {
            const active =
              (lockedByOuterPreserve ? 'preserve_reference' : effective.upperGarment) ===
              opt.value;
            const disabled =
              lockedByOuterPreserve && opt.value !== 'preserve_reference';
            return (
              <button
                key={opt.value}
                type="button"
                disabled={disabled}
                onClick={() => handleGarmentSelect(opt.value)}
                aria-pressed={active}
                className={`text-right px-3 py-2 rounded-lg border text-xs transition-colors flex flex-col justify-between ${getBtnCls(
                  active,
                  disabled
                )}`}
              >
                <span className="leading-snug">{opt.labelAr}</span>
              </button>
            );
          })}
        </div>

        {!isLocked && effective.upperGarment === 'custom_upper_garment' && (
          <div className="pt-1">
            <label htmlFor={`${idPrefix}-custom-garment`} className={`${labelCls} mb-1`}>
              وصف القطعة العلوية المخصصة:
            </label>
            <input
              id={`${idPrefix}-custom-garment`}
              type="text"
              maxLength={80}
              value={selections.customUpperGarmentText || ''}
              onChange={(e) => {
                ensureGarmentInitialized();
                onUpdate('customUpperGarmentText', e.target.value);
              }}
              placeholder="مثال: قميص كتان بياقة مفتوحة وأكمام مطوية"
              className={inputCls}
            />
          </div>
        )}
      </div>

      {isLocked && !lockedByOuterPreserve && (
        <div
          role="status"
          className={
            isDark
              ? 'p-3 rounded-md bg-gray-950 border border-gray-700 text-xs text-gray-300'
              : 'p-3 rounded-lg bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-700 text-xs text-stone-700 dark:text-stone-300'
          }
        >
          تم اختيار <strong>الحفاظ على القطعة العلوية من المرجع</strong> — سيبقى اللون والخامة والقصّة والنقشة الأصلية للقطعة العلوية كما هي في الصورة المرجعية دون تغيير.
        </div>
      )}

      {/* 2. Color, Material, Fit, Pattern (only active when not preserving reference upper) */}
      {!isLocked && (
        <>
          {/* Color */}
          <div className="space-y-2">
            <label className={labelCls}>2. لون القطعة العلوية فقط</label>
            <div
              className="grid grid-cols-3 sm:grid-cols-6 gap-2"
              role="group"
              aria-label="لون القطعة العلوية"
            >
              {colorOptions.map((opt) => {
                const active = effective.upperGarmentColor === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleColorSelect(opt.value)}
                    aria-pressed={active}
                    className={`text-right px-2.5 py-2 rounded-lg border text-xs transition-colors ${getBtnCls(
                      active,
                      false
                    )}`}
                  >
                    {opt.labelAr}
                  </button>
                );
              })}
            </div>

            {effective.upperGarmentColor === 'custom_upper_color' && (
              <div className="pt-1">
                <label htmlFor={`${idPrefix}-custom-color`} className={`${labelCls} mb-1`}>
                  حدد لون القطعة العلوية المخصص:
                </label>
                <input
                  id={`${idPrefix}-custom-color`}
                  type="text"
                  maxLength={60}
                  value={selections.customUpperColorText || ''}
                  onChange={(e) => {
                    ensureGarmentInitialized();
                    onUpdate('customUpperColorText', e.target.value);
                  }}
                  placeholder="مثال: أزرق رمادي باهت"
                  className={inputCls}
                />
              </div>
            )}
          </div>

          {/* Fabric / Material */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <label className={labelCls}>3. خامة ونسيج القماش</label>
              <span className={subtextCls}>
                تُعطّل الخامات غير المناسبة تلقائيًا حسب القطعة
              </span>
            </div>
            <div
              className="grid grid-cols-2 sm:grid-cols-5 gap-2"
              role="group"
              aria-label="خامة القطعة العلوية"
            >
              {UPPER_GARMENT_MATERIAL_OPTIONS.filter((opt) =>
                effective.compatibleMaterials.includes(opt.value)
              ).map((opt) => {
                const active = effective.upperGarmentMaterial === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleMaterialSelect(opt.value)}
                    aria-pressed={active}
                    className={`text-right px-3 py-2 rounded-lg border text-xs transition-colors ${getBtnCls(
                      active,
                      false
                    )}`}
                  >
                    {opt.labelAr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fit & Pattern */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelCls}>4. القصّة والوسع (Fit — محتشم افتراضيًا)</label>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="قصة القطعة العلوية"
              >
                {UPPER_GARMENT_FIT_OPTIONS.filter((opt) =>
                  effective.compatibleFits.includes(opt.value)
                ).map((opt) => {
                  const active = effective.upperGarmentFit === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handleFitSelect(opt.value)}
                      aria-pressed={active}
                      className={`text-right px-3 py-2 rounded-lg border text-xs transition-colors ${getBtnCls(
                        active,
                        false
                      )}`}
                    >
                      {opt.labelAr}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className={labelCls}>5. النقشة (اختياري)</label>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="نقشة القطعة العلوية"
              >
                {UPPER_GARMENT_PATTERN_OPTIONS.filter((opt) =>
                  effective.compatiblePatterns.includes(opt.value)
                ).map((opt) => {
                  const active = effective.upperGarmentPattern === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => handlePatternSelect(opt.value)}
                      aria-pressed={active}
                      className={`text-right px-3 py-2 rounded-lg border text-xs transition-colors ${getBtnCls(
                        active,
                        false
                      )}`}
                    >
                      {opt.labelAr}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
