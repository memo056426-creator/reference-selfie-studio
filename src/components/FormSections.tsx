import React from 'react';
import {
  ASPECT_RATIO_OPTIONS,
  BACKGROUND_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
  CLOTHING_COLOR_OPTIONS,
  CLOTHING_OPTIONS,
  EXPRESSION_OPTIONS,
  FRAMING_OPTIONS,
  FRONT_POSE_OPTIONS,
  GAZE_OPTIONS,
  HAIR_OPTIONS,
  IMAGE_TREATMENT_OPTIONS,
  ImageTreatmentType,
  LIGHTING_OPTIONS,
  OptionItem,
  PHONE_COLOR_OPTIONS,
  PHONE_HAND_OPTIONS,
  PHOTO_VIBE_OPTIONS,
  POSE_OPTIONS,
  REAR_CAMERA_POSE_OPTIONS,
  ROOM_COLOR_OPTIONS,
  ROOM_STYLE_OPTIONS,
  ROOM_TIDINESS_OPTIONS,
  SELFIE_TYPE_OPTIONS,
  SelfieSelections,
  SKIN_TEXTURE_OPTIONS,
} from '../types/selfie';
import { UpperClothingSelector } from './UpperClothingSelector';
import { LowerClothingSelector } from './LowerClothingSelector';

interface FormSectionsProps {
  selections: SelfieSelections;
  onUpdate: <K extends keyof SelfieSelections>(key: K, value: SelfieSelections[K]) => void;
  onToggleTreatment: (treatment: ImageTreatmentType) => void;
  useHighThinking: boolean;
  onToggleHighThinking: (val: boolean) => void;
  fastMode: boolean;
  onToggleFastMode: (val: boolean) => void;
}

function OptionButtonGrid<T extends string>({
  label,
  options,
  selectedValue,
  onSelect,
  disabledValues = [],
  columns = 'grid-cols-2 sm:grid-cols-4',
}: {
  label: string;
  options: OptionItem<T>[];
  selectedValue: T;
  onSelect: (val: T) => void;
  disabledValues?: T[];
  columns?: string;
}) {
  return (
    <div className="space-y-2.5">
      <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
        {label}
      </label>
      <div className={`grid ${columns} gap-2.5`} role="group" aria-label={label}>
        {options.map((opt) => {
          const isSelected = selectedValue === opt.value;
          const isDisabled = disabledValues.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelect(opt.value)}
              aria-pressed={isSelected}
              className={`text-right px-3.5 py-2.5 rounded-lg border text-sm transition-colors flex flex-col justify-between ${
                isDisabled
                  ? 'opacity-40 cursor-not-allowed bg-stone-100 dark:bg-stone-900 border-stone-200 dark:border-stone-800 text-stone-400'
                  : isSelected
                    ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                    : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700/80 hover:border-stone-400 dark:hover:border-stone-500'
              }`}
            >
              <span className="leading-snug">{opt.labelAr}</span>
              {opt.descAr && (
                <span
                  className={`text-xs mt-1 leading-relaxed ${
                    isSelected
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
  );
}

export const FormSections: React.FC<FormSectionsProps> = ({
  selections,
  onUpdate,
  onToggleTreatment,
  useHighThinking,
  onToggleHighThinking,
  fastMode,
  onToggleFastMode,
}) => {
  const isMirror = selections.selfieType === 'mirror';
  const isFullBodyMirror = isMirror && selections.framing === 'full_body_mirror';
  const isPreservingClothing = selections.clothing === 'preserve_reference';

  // Filter options dynamically so only compatible options are shown or enabled per Section 2 & 5
  const visibleFramingOptions = isMirror
    ? FRAMING_OPTIONS
    : FRAMING_OPTIONS.filter((o) => o.value !== 'full_body_mirror');

  const visibleGazeOptions = isMirror
    ? GAZE_OPTIONS
    : GAZE_OPTIONS.filter((o) => o.value !== 'at_mirror_reflection');

  const visibleClothingColorOptions = isPreservingClothing
    ? CLOTHING_COLOR_OPTIONS.filter((o) => o.value === 'preserve_reference')
    : CLOTHING_COLOR_OPTIONS.filter((o) => o.value !== 'preserve_reference');

  const visibleBackgroundOptions = !isMirror
    ? BACKGROUND_OPTIONS.filter((o) => o.value !== 'full_length_mirror')
    : isFullBodyMirror
      ? BACKGROUND_OPTIONS.filter((o) => o.value === 'full_length_mirror')
      : BACKGROUND_OPTIONS;

  return (
    <div className="space-y-6">
      {/* SECTION 2: نوع السيلفي والكادر */}
      <section
        id="section-2"
        aria-labelledby="heading-section-2"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              02 · نوع السيلفي والكادر
            </span>
            <h2
              id="heading-section-2"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              طريقة التقاط السيلفي وحدود الكادر
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            يضبط خيارات الهاتف والانعكاس تلقائيًا
          </span>
        </div>

        <OptionButtonGrid
          label="نوع السيلفي"
          options={SELFIE_TYPE_OPTIONS}
          selectedValue={selections.selfieType}
          onSelect={(val) => onUpdate('selfieType', val)}
          columns="grid-cols-1 sm:grid-cols-2"
        />

        <OptionButtonGrid
          label="الكادر (حدود اللقطة)"
          options={visibleFramingOptions}
          selectedValue={selections.framing}
          onSelect={(val) => onUpdate('framing', val)}
          columns="grid-cols-1 sm:grid-cols-2"
        />

        <OptionButtonGrid
          label="زاوية التصوير"
          options={CAMERA_ANGLE_OPTIONS}
          selectedValue={selections.cameraAngle}
          onSelect={(val) => onUpdate('cameraAngle', val)}
          columns="grid-cols-2 sm:grid-cols-4"
        />
      </section>

      {/* SECTION 3: وضعية الشخص وتعبير الوجه */}
      <section
        id="section-3"
        aria-labelledby="heading-section-3"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              03 · الوضعية والتعبير
            </span>
            <h2
              id="heading-section-3"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              وضعية الشخص وتعبير الوجه واتجاه النظر
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            لغة جسد عفوية ومناسبة لغرفة النوم
          </span>
        </div>

        <OptionButtonGrid
          label="الوضعية على السرير (سيلفي باليد وفيزياء الجاذبية)"
          options={FRONT_POSE_OPTIONS}
          selectedValue={selections.pose}
          onSelect={(val) => onUpdate('pose', val)}
          disabledValues={isFullBodyMirror ? ['pose_headboard_lean'] : []}
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />

        <OptionButtonGrid
          label="وضعيات الكاميرا الخلفية (المرآة والهاتف المثبت)"
          options={REAR_CAMERA_POSE_OPTIONS}
          selectedValue={selections.pose as any}
          onSelect={(val) => onUpdate('pose', val)}
          columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
        />

        <OptionButtonGrid
          label="تعبير الوجه"
          options={EXPRESSION_OPTIONS}
          selectedValue={selections.expression}
          onSelect={(val) => onUpdate('expression', val)}
          columns="grid-cols-2 sm:grid-cols-4"
        />

        <OptionButtonGrid
          label="اتجاه النظر"
          options={visibleGazeOptions}
          selectedValue={selections.gaze}
          onSelect={(val) => onUpdate('gaze', val)}
          columns="grid-cols-1 sm:grid-cols-3"
        />
      </section>

      {/* SECTION 4: الملابس والمظهر */}
      <section
        id="section-4"
        aria-labelledby="heading-section-4"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              04 · الملابس والمظهر
            </span>
            <h2
              id="heading-section-4"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              الأزياء المنزلية، الألوان، وتسريحة الشعر
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            يمنع التعارض بين ملابس المرجع والملابس البديلة
          </span>
        </div>

        <OptionButtonGrid
          label="قوالب سريعة للزي الكامل (أو خصّص القطعة العلوية والسفلية بشكل مستقل أدناه)"
          options={CLOTHING_OPTIONS}
          selectedValue={selections.clothing}
          onSelect={(val) => {
            onUpdate('clothing', val);
            onUpdate('upperGarment', undefined);
            onUpdate('lowerGarment', undefined);
          }}
          columns="grid-cols-2 sm:grid-cols-3"
        />

        {selections.clothing === 'custom_clothing' && (
          <div>
            <label
              htmlFor="custom-clothing-input"
              className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
            >
              وصف الملابس المخصص (بالعربية أو الإنجليزية — سيُترجم تلقائيًا):
            </label>
            <input
              id="custom-clothing-input"
              type="text"
              maxLength={120}
              value={selections.customClothingText}
              onChange={(e) => onUpdate('customClothingText', e.target.value)}
              placeholder="مثال: قميص قطني بأكمام طويلة وبنطال كتان مريح"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
            />
          </div>
        )}

        {!isPreservingClothing &&
          (selections.upperGarment === undefined ||
            selections.lowerGarment === undefined) && (
            <div className="space-y-3">
              <OptionButtonGrid
                label="لون القالب السريع العام (لأي قطعة لم تُخصص بشكل مستقل)"
                options={visibleClothingColorOptions}
                selectedValue={selections.clothingColor}
                onSelect={(val) => onUpdate('clothingColor', val)}
                columns="grid-cols-2 sm:grid-cols-3"
              />
              {selections.clothingColor === 'custom_color' && (
                <div>
                  <label
                    htmlFor="custom-clothing-color-input"
                    className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                  >
                    حدد لون الملابس المخصص:
                  </label>
                  <input
                    id="custom-clothing-color-input"
                    type="text"
                    maxLength={80}
                    value={selections.customClothingColorText}
                    onChange={(e) => onUpdate('customClothingColorText', e.target.value)}
                    placeholder="مثال: أخضر زيتوني هادئ مع أبيض"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                  />
                </div>
              )}
            </div>
          )}

        {/* أ. الملابس العلوية */}
        <div
          className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800"
          data-testid="scene-builder-upper-subsection"
        >
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
            أ. الملابس العلوية
          </div>
          <UpperClothingSelector
            selections={selections}
            onUpdate={onUpdate}
            idPrefix="scene-builder-upper"
          />
        </div>

        {/* ب. الملابس السفلية */}
        <div
          className="space-y-2 pt-2 border-t border-stone-100 dark:border-stone-800"
          data-testid="scene-builder-lower-subsection"
        >
          <div className="text-sm font-bold text-stone-900 dark:text-stone-100">
            ب. الملابس السفلية
          </div>
          <LowerClothingSelector
            selections={selections}
            onUpdate={onUpdate}
            idPrefix="scene-builder-lower"
          />
        </div>

        <OptionButtonGrid
          label="الشعر"
          options={HAIR_OPTIONS}
          selectedValue={selections.hair}
          onSelect={(val) => onUpdate('hair', val)}
          columns="grid-cols-1 sm:grid-cols-3"
        />

        <OptionButtonGrid
          label="ملمس البشرة"
          options={SKIN_TEXTURE_OPTIONS}
          selectedValue={selections.skinTexture}
          onSelect={(val) => onUpdate('skinTexture', val)}
          columns="grid-cols-1 sm:grid-cols-3"
        />
      </section>

      {/* SECTION 5: غرفة النوم والإضاءة */}
      <section
        id="section-5"
        aria-labelledby="heading-section-5"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              05 · غرفة النوم والإضاءة
            </span>
            <h2
              id="heading-section-5"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              تصميم غرفة النوم، الخلفية، وتوزيع الإضاءة
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            غرفة النوم هي المكان الثابت للمشهد
          </span>
        </div>

        <OptionButtonGrid
          label="نمط الغرفة"
          options={ROOM_STYLE_OPTIONS}
          selectedValue={selections.roomStyle}
          onSelect={(val) => onUpdate('roomStyle', val)}
          columns="grid-cols-2 sm:grid-cols-5"
        />

        <OptionButtonGrid
          label="ترتيب الغرفة"
          options={ROOM_TIDINESS_OPTIONS}
          selectedValue={selections.roomTidiness}
          onSelect={(val) => onUpdate('roomTidiness', val)}
          columns="grid-cols-1 sm:grid-cols-2"
        />

        <div className="space-y-3">
          <OptionButtonGrid
            label="ألوان الغرفة"
            options={ROOM_COLOR_OPTIONS}
            selectedValue={selections.roomColors}
            onSelect={(val) => onUpdate('roomColors', val)}
            columns="grid-cols-2 sm:grid-cols-5"
          />
          {selections.roomColors === 'custom_room_colors' && (
            <div>
              <label
                htmlFor="custom-room-color-input"
                className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
              >
                وصف ألوان الغرفة المخصص:
              </label>
              <input
                id="custom-room-color-input"
                type="text"
                maxLength={100}
                value={selections.customRoomColorsText}
                onChange={(e) => onUpdate('customRoomColorsText', e.target.value)}
                placeholder="مثال: جدران كريمية دافئة مع خشب بلوط طبيعي"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
              />
            </div>
          )}
        </div>

        <div className="space-y-2">
          <OptionButtonGrid
            label="الخلفية الظاهرة في الغرفة"
            options={visibleBackgroundOptions}
            selectedValue={selections.background}
            onSelect={(val) => onUpdate('background', val)}
            columns="grid-cols-1 sm:grid-cols-3"
          />
          {isFullBodyMirror && (
            <p className="text-xs text-amber-700 dark:text-amber-400">
              تم ربط الخلفية بـ «مرآة طويلة» تلقائيًا لتتناسب مع خيار كامل الجسم أمام المرآة.
            </p>
          )}
        </div>

        <div className="space-y-4">
          <OptionButtonGrid
            label="الإضاءة الأساسية"
            options={LIGHTING_OPTIONS}
            selectedValue={selections.lighting}
            onSelect={(val) => onUpdate('lighting', val)}
            columns="grid-cols-2 sm:grid-cols-5"
          />

          {/* Explicit Mixed Lighting Toggle per Section 5 rule */}
          <div className="p-3.5 rounded-lg bg-stone-50 dark:bg-stone-800/40 border border-stone-200 dark:border-stone-800 space-y-3">
            <label
              htmlFor="mixed-lighting-toggle"
              className="flex items-center gap-2.5 cursor-pointer text-xs font-medium text-stone-800 dark:text-stone-200"
            >
              <input
                id="mixed-lighting-toggle"
                type="checkbox"
                checked={selections.mixedLightingEnabled}
                onChange={(e) => {
                  const enabled = e.target.checked;
                  onUpdate('mixedLightingEnabled', enabled);
                  if (enabled && !selections.secondaryLighting) {
                    onUpdate('secondaryLighting', 'warm_bedside_lamp');
                  }
                }}
                className="h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600"
              />
              <span>إضافة إضاءة مختلطة صراحةً (دمج مصدر ضوء ثانوي غير متعارض)</span>
            </label>

            {selections.mixedLightingEnabled && (
              <div className="pt-2">
                <OptionButtonGrid
                  label="الإضاءة الثانوية المساعدة"
                  options={LIGHTING_OPTIONS.filter((l) => l.value !== selections.lighting)}
                  selectedValue={selections.secondaryLighting || 'warm_bedside_lamp'}
                  onSelect={(val) => onUpdate('secondaryLighting', val)}
                  columns="grid-cols-2 sm:grid-cols-4"
                />
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SECTION 6: تفاصيل التصوير */}
      <section
        id="section-6"
        aria-labelledby="heading-section-6"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              06 · تفاصيل التصوير
            </span>
            <h2
              id="heading-section-6"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              إعدادات الهاتف، طابع اللقطة، ومعالجة الصورة
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            يضمن مظهر كاميرا هاتف واقعي دون معدات استوديو
          </span>
        </div>

        {/* Phone visibility & mirror options */}
        {!isMirror ? (
          <div className="p-4 rounded-lg bg-stone-50 dark:bg-stone-800/50 border border-stone-200 dark:border-stone-700">
            <span className="text-xs font-semibold text-stone-800 dark:text-stone-200 block mb-1">
              حالة ظهور الهاتف في الكادر:
            </span>
            <p className="text-xs text-stone-600 dark:text-stone-300">
              غير ظاهر بسبب التصوير بالكاميرا الأمامية — لن يتضمن البرومبت أي هاتف مرئي أو انعكاس مرآة.
            </p>
          </div>
        ) : (
          <div className="space-y-5 p-4 rounded-lg bg-stone-50/70 dark:bg-stone-800/30 border border-stone-200 dark:border-stone-800">
            <OptionButtonGrid
              label="لون الهاتف الظاهر في المرآة"
              options={PHONE_COLOR_OPTIONS.filter((o) => o.value !== 'hidden_front_camera')}
              selectedValue={selections.phoneColor}
              onSelect={(val) => onUpdate('phoneColor', val)}
              columns="grid-cols-1 sm:grid-cols-3"
            />

            {selections.phoneColor === 'custom_phone_color' && (
              <div>
                <label
                  htmlFor="custom-phone-color-input"
                  className="block text-xs font-medium text-stone-700 dark:text-stone-300 mb-1.5"
                >
                  حدد لون الهاتف المخصص:
                </label>
                <input
                  id="custom-phone-color-input"
                  type="text"
                  maxLength={60}
                  value={selections.customPhoneColorText}
                  onChange={(e) => onUpdate('customPhoneColorText', e.target.value)}
                  placeholder="مثال: أزرق داكن غير لامع (Matte Midnight Blue)"
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
                />
              </div>
            )}

            <OptionButtonGrid
              label="اليد التي تمسك الهاتف"
              options={PHONE_HAND_OPTIONS}
              selectedValue={selections.phoneHand}
              onSelect={(val) => onUpdate('phoneHand', val)}
              columns="grid-cols-1 sm:grid-cols-3"
            />

            <label
              htmlFor="keep-face-unobstructed-checkbox"
              className="flex items-start gap-3 cursor-pointer pt-1"
            >
              <input
                id="keep-face-unobstructed-checkbox"
                type="checkbox"
                checked={selections.keepFaceUnobstructed}
                onChange={(e) => onUpdate('keepFaceUnobstructed', e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-stone-300 text-amber-600 focus:ring-amber-600 shrink-0"
              />
              <div>
                <span className="text-sm font-semibold text-stone-900 dark:text-stone-100 block">
                  إبقاء الوجه واضحًا بالكامل
                </span>
                <span className="text-xs text-stone-600 dark:text-stone-300 block mt-0.5">
                  توجيه وضع الهاتف بعيدًا عن ملامح الوجه حتى لا يغطي الهاتف أي جزء من الهوية المرجعية.
                </span>
              </div>
            </label>
          </div>
        )}

        <OptionButtonGrid
          label="طابع الصورة"
          options={PHOTO_VIBE_OPTIONS}
          selectedValue={selections.photoVibe}
          onSelect={(val) => onUpdate('photoVibe', val)}
          columns="grid-cols-1 sm:grid-cols-3"
        />

        {/* Multi-select Image Treatments */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
            معالجة الصورة (يمكنك اختيار أكثر من خيار)
          </label>
          <div
            className="grid grid-cols-2 sm:grid-cols-4 gap-2.5"
            role="group"
            aria-label="معالجة الصورة"
          >
            {IMAGE_TREATMENT_OPTIONS.map((item) => {
              const active = selections.imageTreatments.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onToggleTreatment(item.value)}
                  aria-pressed={active}
                  className={`px-3.5 py-2.5 rounded-lg border text-sm text-right transition-colors ${
                    active
                      ? 'bg-stone-900 text-white border-stone-900 dark:bg-amber-500 dark:text-stone-950 dark:border-amber-500 font-semibold'
                      : 'bg-stone-50/70 dark:bg-stone-800/50 text-stone-800 dark:text-stone-200 border-stone-200 dark:border-stone-700 hover:border-stone-400'
                  }`}
                >
                  {item.labelAr}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* SECTION 7: متطلبات إضافية */}
      <section
        id="section-7"
        aria-labelledby="heading-section-7"
        className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-xl p-6 space-y-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 pb-4 border-b border-stone-100 dark:border-stone-800">
          <div>
            <span className="text-xs font-medium text-amber-700 dark:text-amber-400">
              07 · متطلبات إضافية
            </span>
            <h2
              id="heading-section-7"
              className="text-lg font-bold text-stone-900 dark:text-stone-100 mt-0.5"
            >
              تفاصيل إضافية، نسبة الأبعاد، ونمط المعالجة الذكية
            </h2>
          </div>
          <span className="text-xs text-stone-500 dark:text-stone-400">
            تُدمج التفاصيل المسموحة بالإنجليزية ضمن الفقرة النهائية
          </span>
        </div>

        <div>
          <label
            htmlFor="custom-details-textarea"
            className="block text-sm font-semibold text-stone-800 dark:text-stone-200 mb-1.5"
          >
            تفاصيل إضافية للمشهد (اختياري)
          </label>
          <p className="text-xs text-stone-500 dark:text-stone-400 mb-2.5">
            اكتب أي تفاصيل بسيطة ترغب بإضافتها للمشهد (مثل: نظارة طبية، ساعة يد، كتاب على الطاولة، نبات داخلي). سيُترجم محتواها ويُدمج بالإنجليزية ضمن الوصف النهائي دون الإخلال بقواعد الهوية.
          </p>
          <textarea
            id="custom-details-textarea"
            rows={3}
            maxLength={220}
            value={selections.customDetails}
            onChange={(e) => onUpdate('customDetails', e.target.value)}
            placeholder="مثال: نظارة طبية بإطار رفيع، أو كوب قهوة على الطاولة الجانبية..."
            className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-stone-300 dark:border-stone-700 bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:border-amber-600"
          />
        </div>

        {/* Aspect Ratio Selection */}
        <div className="space-y-2.5">
          <label className="block text-sm font-semibold text-stone-800 dark:text-stone-200">
            نسبة أبعاد الصورة المستهدفة (Aspect Ratio)
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
                  <span
                    className={`text-[11px] block mt-0.5 ${
                      active
                        ? 'text-stone-300 dark:text-stone-900'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    {ar.descAr}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* AI Processing Mode Selectors (Low Latency vs Deep Thinking) */}
        <div className="pt-2 border-t border-stone-100 dark:border-stone-800 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label
            htmlFor="fast-mode-checkbox"
            className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 cursor-pointer"
          >
            <input
              id="fast-mode-checkbox"
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
                صياغة فورية منخفضة الكمون عبر نموذج gemini-3.1-flash-lite.
              </span>
            </div>
          </label>

          <label
            htmlFor="high-thinking-checkbox"
            className="flex items-start gap-2.5 p-3 rounded-lg border border-stone-200 dark:border-stone-800 bg-stone-50/50 dark:bg-stone-800/30 cursor-pointer"
          >
            <input
              id="high-thinking-checkbox"
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
                تفكير عميق لتدقيق التناسق (Thinking HIGH)
              </span>
              <span className="text-[11px] text-stone-500 dark:text-stone-400 block mt-0.5">
                يستخدم gemini-4-hydrogen بمستوى تفكير عالٍ لمراجعة التفاصيل المخصصة المعقدة.
              </span>
            </div>
          </label>
        </div>
      </section>
    </div>
  );
};
