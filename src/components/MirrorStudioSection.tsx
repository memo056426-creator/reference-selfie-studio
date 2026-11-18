import React, { useState, useEffect, useMemo } from 'react';
import {
  DEFAULT_SELECTIONS,
  FRAMING_OPTIONS,
  FramingType,
  MIRROR_BOTTOM_CLOTHING_OPTIONS,
  MIRROR_CLOTHING_PHYSICS_OPTIONS,
  MIRROR_EXPRESSION_OPTIONS,
  MIRROR_FREE_HAND_ACTION_OPTIONS,
  MIRROR_GAZE_OPTIONS,
  MIRROR_HAIR_PHYSICS_OPTIONS,
  MIRROR_LENS_PROFILE_OPTIONS,
  MIRROR_MOVEMENT_MOMENT_OPTIONS,
  MIRROR_PHONE_POSITION_OPTIONS,
  MIRROR_POSE_ENERGY_OPTIONS,
  MIRROR_POSE_OPTIONS,
  MIRROR_POSE_PRESET_SPECS,
  MIRROR_STANCE_OPTIONS,
  MIRROR_SUPPORT_OBJECT_OPTIONS,
  MIRROR_TORSO_ORIENTATION_OPTIONS,
  MirrorFreeHandActionType,
  MirrorGazeType,
  MirrorLensProfileType,
  MirrorMovementMomentType,
  MirrorPhonePositionType,
  MirrorPoseEnergyType,
  MirrorStanceType,
  MirrorSupportObjectType,
  MirrorTorsoOrientationType,
  PHONE_HAND_OPTIONS,
  PhoneHandType,
  PromptConfig,
  PromptFallbackReason,
  PromptGenerationDiagnostics,
  PromptGenerationSource,
  SelfieSelections,
  XIAOMI_15_ULTRA_LENS_PROFILES,
} from '../types/selfie';
import { AlertTriangle, Lock, Unlock } from 'lucide-react';
import {
  buildMirrorStudioJsonPrompt,
  enforceCompatibilityRules,
  generateConsistentMirrorPoseBundle,
  getCompatibleMirrorPoseOptions,
  LockableSelectionField,
  LockedFieldConflict,
  MIRROR_POSE_CATEGORY_LIST,
  MirrorPoseCategoryId,
} from '../utils/promptRules';
import { UpperClothingSelector } from './UpperClothingSelector';
import { LowerClothingSelector } from './LowerClothingSelector';

interface MirrorStudioSectionProps {
  selections?: SelfieSelections;
  onUpdate?: <K extends keyof SelfieSelections>(
    key: K,
    value: SelfieSelections[K]
  ) => void;
  onApplyUpdates?: (patch: Partial<SelfieSelections>) => void;
  adjustments?: string[];
  lockedConflicts?: LockedFieldConflict[];
  onToggleLockField?: (field: LockableSelectionField) => void;
  onApplyLockedConflictFix?: (
    patch: Partial<SelfieSelections>,
    unlockFields?: LockableSelectionField[]
  ) => void;
  onGeneratePrompt?: () => void;
  onBackToMain?: () => void;
  onGenerate?: (config: PromptConfig, additionalInstructions: string) => void;
  promptText?: string;
  isGenerating?: boolean;
  promptSource?: PromptGenerationSource;
  fallbackReason?: PromptFallbackReason | null;
  generationStatusAr?: string | null;
  diagnostics?: PromptGenerationDiagnostics | null;
}

export function MirrorStudioSection({
  selections = DEFAULT_SELECTIONS,
  onUpdate,
  onApplyUpdates,
  adjustments = [],
  lockedConflicts,
  onToggleLockField,
  onApplyLockedConflictFix,
  onGeneratePrompt,
  onBackToMain,
  onGenerate,
  promptText,
  isGenerating = false,
  promptSource = 'deterministic',
  fallbackReason = null,
  generationStatusAr = null,
  diagnostics = null,
}: MirrorStudioSectionProps) {
  const getInitialPhrase = <T extends string>(
    options: { value: T; enPhrase: string }[],
    currentVal: T
  ) => options.find((o) => o.value === currentVal)?.enPhrase || options[0].enPhrase;

  const [activePoseCategory, setActivePoseCategory] = useState<
    MirrorPoseCategoryId | 'all'
  >('all');
  const lockedSet = new Set<LockableSelectionField>(
    selections.lockedFields ?? []
  );

  const renderLockToggle = (
    field: LockableSelectionField,
    fieldLabelAr: string
  ) => {
    const isLocked = lockedSet.has(field);
    return (
      <button
        type="button"
        data-testid={`lock-toggle-${field}`}
        aria-pressed={isLocked}
        aria-label={isLocked ? `إلغاء قفل ${fieldLabelAr}` : `قفل ${fieldLabelAr}`}
        onClick={() => {
          if (onToggleLockField) {
            onToggleLockField(field);
          } else {
            const current = selections.lockedFields ?? [];
            const nextLocked = current.includes(field)
              ? current.filter((f) => f !== field)
              : [...current, field];
            applyPatch({ lockedFields: nextLocked });
          }
        }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors cursor-pointer ${
          isLocked
            ? 'bg-orange-600/20 border-orange-500 text-orange-300'
            : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200 hover:border-gray-500'
        }`}
      >
        {isLocked ? (
          <>
            <Lock className="w-3 h-3 shrink-0" />
            <span>مقفول</span>
          </>
        ) : (
          <>
            <Unlock className="w-3 h-3 shrink-0" />
            <span>قفل</span>
          </>
        )}
      </button>
    );
  };

  const applyPatch = (patch: Partial<SelfieSelections>) => {
    if (onApplyUpdates) {
      onApplyUpdates(patch);
      return;
    }
    if (onUpdate) {
      (Object.keys(patch) as Array<keyof SelfieSelections>).forEach((k) => {
        onUpdate(k, patch[k] as SelfieSelections[typeof k]);
      });
    }
  };

  const activeLensProfile: MirrorLensProfileType =
    selections.mirrorLensProfile ?? 'main_23mm';
  const activeLensMeta =
    MIRROR_LENS_PROFILE_OPTIONS.find((o) => o.value === activeLensProfile) ||
    MIRROR_LENS_PROFILE_OPTIONS[0];

  const activeFraming: FramingType = selections.framing ?? 'three_quarter';
  const activeStance: MirrorStanceType =
    selections.mirrorStance ?? 'balanced_relaxed';
  const activeTorso: MirrorTorsoOrientationType =
    selections.mirrorTorsoOrientation ?? 'slight_angle_head_turned';
  const activePhoneHand: PhoneHandType = selections.phoneHand ?? 'right_hand';
  const activePhonePos: MirrorPhonePositionType =
    selections.mirrorPhonePosition ?? 'chest_level';
  const activeFreeHand: MirrorFreeHandActionType =
    selections.mirrorFreeHandAction ?? 'none_relaxed';
  const activeMovement: MirrorMovementMomentType =
    selections.mirrorMovementMoment ?? 'still_composed';
  const activeGaze: MirrorGazeType =
    selections.mirrorGaze ?? 'gaze_phone_screen';
  const activeEnergy: MirrorPoseEnergyType =
    selections.mirrorPoseEnergy ?? 'relaxed';
  const activeSupportObject: MirrorSupportObjectType =
    selections.mirrorSupportObject ?? 'none';
  const motionBlurEnabled = Boolean(selections.mirrorMotionBlurEnabled);

  const mirrorSelectionsSnapshot = useMemo<SelfieSelections>(
    () => ({
      ...selections,
      workflowMode: 'mirror_studio',
    }),
    [selections]
  );

  const compatibilityResult = useMemo(
    () => enforceCompatibilityRules(mirrorSelectionsSnapshot),
    [mirrorSelectionsSnapshot]
  );

  const optionCompatibility = useMemo(
    () => getCompatibleMirrorPoseOptions(mirrorSelectionsSnapshot),
    [mirrorSelectionsSnapshot]
  );

  const combinedAdjustments = useMemo(
    () =>
      Array.from(
        new Set([...adjustments, ...compatibilityResult.adjustments])
      ),
    [adjustments, compatibilityResult.adjustments]
  );

  const effectiveLockedConflicts = useMemo(
    () => lockedConflicts ?? compatibilityResult.lockedConflicts ?? [],
    [lockedConflicts, compatibilityResult.lockedConflicts]
  );

  const [pose, setPose] = useState<string>(() =>
    getInitialPhrase(MIRROR_POSE_OPTIONS, selections.mirrorPose)
  );
  const [expression, setExpression] = useState<string>(() =>
    getInitialPhrase(MIRROR_EXPRESSION_OPTIONS, selections.mirrorExpression)
  );
  const [hair, setHair] = useState<string>(() =>
    getInitialPhrase(MIRROR_HAIR_PHYSICS_OPTIONS, selections.mirrorHair)
  );
  const [topClothing, setTopClothing] = useState<string>(() =>
    getInitialPhrase(MIRROR_CLOTHING_PHYSICS_OPTIONS, selections.mirrorClothing)
  );
  const [bottomClothing, setBottomClothing] = useState<string>(() =>
    getInitialPhrase(
      MIRROR_BOTTOM_CLOTHING_OPTIONS,
      selections.mirrorBottomClothing
    )
  );
  const [generatedJson, setGeneratedJson] = useState<string>(() =>
    buildMirrorStudioJsonPrompt(mirrorSelectionsSnapshot)
  );
  const [showToast, setShowToast] = useState(false);

  // مزامنة الحالة المحلية عند تغير الاختيارات من الخارج (قالب / فاجئني / ضبط تلقائي)
  useEffect(() => {
    setPose(getInitialPhrase(MIRROR_POSE_OPTIONS, selections.mirrorPose));
    setExpression(
      getInitialPhrase(MIRROR_EXPRESSION_OPTIONS, selections.mirrorExpression)
    );
    setHair(getInitialPhrase(MIRROR_HAIR_PHYSICS_OPTIONS, selections.mirrorHair));
    setTopClothing(
      getInitialPhrase(MIRROR_CLOTHING_PHYSICS_OPTIONS, selections.mirrorClothing)
    );
    setBottomClothing(
      getInitialPhrase(
        MIRROR_BOTTOM_CLOTHING_OPTIONS,
        selections.mirrorBottomClothing
      )
    );
  }, [
    selections.mirrorPose,
    selections.mirrorExpression,
    selections.mirrorHair,
    selections.mirrorClothing,
    selections.mirrorBottomClothing,
  ]);

  // دالة تحديث كود الـ JSON المخصص للمرآة
  const updateMirrorPrompt = () => {
    const jsonOutput = buildMirrorStudioJsonPrompt({
      ...selections,
      workflowMode: 'mirror_studio',
    });
    setGeneratedJson(jsonOutput);
    if (onGenerate) {
      onGenerate(selections, jsonOutput);
    }
  };

  // تحديث محلي فوري عند تغير أي خيار دون استدعاء Gemini تلقائياً
  useEffect(() => {
    updateMirrorPrompt();
  }, [
    pose,
    expression,
    hair,
    topClothing,
    bottomClothing,
    selections.framing,
    selections.phoneHand,
    selections.mirrorGaze,
    selections.mirrorPose,
    selections.mirrorExpression,
    selections.mirrorHair,
    selections.mirrorClothing,
    selections.mirrorBottomClothing,
    selections.deviceModel,
    selections.mirrorLensProfile,
    selections.mirrorStance,
    selections.mirrorTorsoOrientation,
    selections.mirrorPhonePosition,
    selections.mirrorFreeHandAction,
    selections.mirrorMovementMoment,
    selections.mirrorMotionBlurEnabled,
    selections.mirrorSupportObject,
    selections.mirrorPoseEnergy,
    selections.lighting,
    selections.phoneProcessingProfile,
    selections.focusTarget,
    selections.exposurePreference,
    selections.upperGarment,
    selections.customUpperGarmentText,
    selections.upperGarmentColor,
    selections.customUpperColorText,
    selections.upperGarmentMaterial,
    selections.upperGarmentFit,
    selections.upperGarmentPattern,
    selections.lowerGarment,
    selections.customLowerGarmentText,
    selections.lowerGarmentColor,
    selections.customLowerGarmentColorText,
    selections.lowerGarmentMaterial,
    selections.lowerGarmentFit,
    selections.lowerGarmentPattern,
  ]);

  // مزامنة مخرجات Gemini عندما يعود الرد من الخادم
  useEffect(() => {
    if (
      promptText &&
      promptText.includes('"SYSTEM_DIRECTIVE": "EXECUTE_PHOTOGRAPHIC_CAPTURE"')
    ) {
      setGeneratedJson(promptText);
    }
  }, [promptText]);

  const poseGroups = Array.from(
    new Set(MIRROR_POSE_OPTIONS.map((opt) => opt.groupAr || 'وضعيات عامة'))
  );

  const handleSurpriseMePose = () => {
    const bundle = generateConsistentMirrorPoseBundle(
      Date.now(),
      selections.mirrorPose
    );
    applyPatch({
      mirrorPose: bundle.mirrorPose,
      framing: bundle.framing,
      mirrorLensProfile: bundle.mirrorLensProfile,
      mirrorStance: bundle.mirrorStance,
      mirrorTorsoOrientation: bundle.mirrorTorsoOrientation,
      phoneHand: bundle.phoneHand,
      mirrorPhonePosition: bundle.mirrorPhonePosition,
      mirrorFreeHandAction: bundle.mirrorFreeHandAction,
      mirrorMovementMoment: bundle.mirrorMovementMoment,
      mirrorGaze: bundle.mirrorGaze,
      mirrorExpression: bundle.mirrorExpression,
      mirrorPoseEnergy: bundle.mirrorPoseEnergy,
      mirrorSupportObject: bundle.mirrorSupportObject,
      mirrorMotionBlurEnabled: false,
      background:
        bundle.framing === 'full_body_mirror'
          ? 'full_length_mirror'
          : selections.background === 'full_length_mirror'
            ? 'wardrobe'
            : selections.background,
    });
  };

  const copyToClipboard = async () => {
    if (!generatedJson) return;
    try {
      await navigator.clipboard.writeText(generatedJson);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('فشل في نسخ النص: ', err);
    }
  };

  const activePoseMeta = MIRROR_POSE_OPTIONS.find(
    (o) => o.value === selections.mirrorPose
  );

  return (
    <div
      id="mirror-studio-pro"
      className="bg-gray-800 rounded-lg p-6 shadow-xl border-t-4 border-orange-500 relative"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-orange-500 border-b border-gray-700 pb-4">
          استوديو المرآة (Xiaomi 15 Ultra)
        </h2>
        <p className="text-gray-400 text-sm mt-4">
          يتم إنشاء كود JSON المخصص لـ Gemini تلقائيًا عند تغيير الخيارات أدناه مع ضبط التوافق الفيزيائي للوضعية والكادر
        </p>
      </div>

      {effectiveLockedConflicts.length > 0 && (
        <div
          role="alert"
          data-testid="mirror-locked-conflicts-banner"
          className="mb-6 p-3.5 rounded-lg bg-red-950/60 border border-red-600/80 text-xs text-red-100 space-y-2.5"
        >
          <div className="flex items-center gap-2 font-bold text-red-300">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>تعارض مع الحقول المقفولة (تم الحفاظ على اختياراتك المقفولة):</span>
          </div>
          <div className="space-y-2">
            {effectiveLockedConflicts.map((conflict) => {
              const applyFix = (
                patch: Partial<SelfieSelections>,
                unlockFields?: LockableSelectionField[]
              ) => {
                if (onApplyLockedConflictFix) {
                  onApplyLockedConflictFix(patch, unlockFields);
                } else {
                  const current = selections.lockedFields ?? [];
                  const nextLocked = unlockFields
                    ? current.filter((f) => !unlockFields.includes(f))
                    : current;
                  applyPatch({
                    ...patch,
                    lockedFields: nextLocked,
                  });
                }
              };

              return (
                <div
                  key={conflict.code}
                  className="p-2.5 rounded bg-red-900/40 border border-red-700/60 space-y-2"
                >
                  <p className="leading-relaxed text-red-100">{conflict.reasonAr}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    {conflict.suggestedUpdates && (
                      <button
                        type="button"
                        data-testid={`conflict-fix-${conflict.code}`}
                        onClick={() =>
                          applyFix(conflict.suggestedUpdates!, conflict.fields)
                        }
                        className="px-2.5 py-1 rounded bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-bold transition-colors cursor-pointer"
                      >
                        {conflict.suggestedFixAr}
                      </button>
                    )}
                    <button
                      type="button"
                      data-testid={`conflict-unlock-${conflict.code}`}
                      onClick={() => applyFix({}, conflict.fields)}
                      className="px-2.5 py-1 rounded bg-gray-800 hover:bg-gray-700 border border-red-500/50 text-red-100 text-[11px] font-semibold transition-colors cursor-pointer"
                    >
                      فك قفل الحقول المتعارضة
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {combinedAdjustments.length > 0 && (
        <div
          role="note"
          data-testid="mirror-studio-compatibility-notes"
          className="mb-6 p-3 rounded-lg bg-amber-950/50 border border-amber-700/70 text-xs text-amber-200 space-y-1"
        >
          <div className="font-bold text-amber-300">تنبيهات التوافق التلقائي:</div>
          {combinedAdjustments.map((note, idx) => (
            <div key={idx}>• {note}</div>
          ))}
        </div>
      )}

      <div className="space-y-6">
        {/* 0. عدسة الكاميرا الخلفية لـ Xiaomi 15 Ultra والكادر */}
        <div className="p-4 rounded-lg bg-gray-900/70 border border-gray-700 space-y-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <label
                  htmlFor="select_mirror_lens"
                  className="block text-orange-400 font-semibold"
                >
                  عدسة الكاميرا الخلفية (Xiaomi 15 Ultra):
                </label>
                {renderLockToggle('mirrorLensProfile', 'العدسة الخلفية')}
              </div>
              <span className="text-xs text-gray-400 font-mono" dir="ltr">
                {XIAOMI_15_ULTRA_LENS_PROFILES[activeLensProfile].specSummary}
              </span>
            </div>
            <select
              id="select_mirror_lens"
              data-testid="select-mirror-lens"
              value={activeLensProfile}
              onChange={(e) => {
                const nextLens = e.target.value as MirrorLensProfileType;
                const patch: Partial<SelfieSelections> = {
                  mirrorLensProfile: nextLens,
                };
                if (
                  (nextLens === 'telephoto_70mm' ||
                    nextLens === 'ultra_telephoto_100mm') &&
                  activeFreeHand === 'lightly_touch_mirror'
                ) {
                  patch.mirrorFreeHandAction = 'none_relaxed';
                }
                applyPatch(patch);
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              {MIRROR_LENS_PROFILE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.labelAr}
                </option>
              ))}
            </select>
            {activeLensMeta.descAr && (
              <p className="text-xs text-gray-400">{activeLensMeta.descAr}</p>
            )}
          </div>

          <div className="space-y-1.5 pt-2 border-t border-gray-800">
            <div className="flex items-center justify-between gap-2">
              <label
                htmlFor="select_mirror_framing"
                className="block text-gray-300 text-sm font-semibold"
              >
                نطاق الكادر الظاهر في المرآة:
              </label>
              {renderLockToggle('framing', 'نطاق الكادر')}
            </div>
            <select
              id="select_mirror_framing"
              data-testid="select-mirror-framing"
              value={activeFraming}
              onChange={(e) => {
                const nextFraming = e.target.value as FramingType;
                applyPatch({
                  framing: nextFraming,
                  background:
                    nextFraming === 'full_body_mirror'
                      ? 'full_length_mirror'
                      : selections.background === 'full_length_mirror'
                        ? 'wardrobe'
                        : selections.background,
                });
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
            >
              {FRAMING_OPTIONS.map((opt) => {
                const compat = optionCompatibility.framings[opt.value];
                const disabled = compat ? !compat.allowed : false;
                return (
                  <option
                    key={opt.value}
                    value={opt.value}
                    disabled={disabled}
                  >
                    {opt.labelAr}
                    {disabled && compat?.reasonAr
                      ? ` (${compat.reasonAr})`
                      : ''}
                  </option>
                );
              })}
            </select>
            <p className="text-xs text-gray-400">
              يمنع النظام تلقائيًا وصف الساقين أو القدمين أو الجلوس عند اختيار كادر علوي ضيق.
            </p>
          </div>
        </div>

        {/* 1. دليل الوضعيات الجاهزة + التصنيف البيوميكانيكي + زر فاجئني */}
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <label
                htmlFor="select_pose"
                className="block text-gray-300 font-semibold"
              >
                قالب الوضعية الأساسي (مكتمل التنسيق لبالغ):
              </label>
              {renderLockToggle('mirrorPose', 'الوضعية')}
            </div>
            <button
              type="button"
              data-testid="mirror-surprise-me-btn"
              onClick={handleSurpriseMePose}
              className="px-3 py-1.5 rounded-md bg-orange-600/90 hover:bg-orange-600 text-white text-xs font-bold transition-colors cursor-pointer"
            >
              فاجئني بوضعية مرآة متناسقة (Surprise me)
            </button>
          </div>

          {/* تصفية الفئات البيوميكانيكية */}
          <div
            className="flex flex-wrap gap-1.5"
            role="group"
            aria-label="تصنيف الوضعيات البيوميكانيكية"
          >
            <button
              type="button"
              onClick={() => setActivePoseCategory('all')}
              className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                activePoseCategory === 'all'
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
              }`}
            >
              الكل ({MIRROR_POSE_OPTIONS.length})
            </button>
            {MIRROR_POSE_CATEGORY_LIST.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActivePoseCategory(cat.id)}
                className={`px-2.5 py-1 rounded text-xs font-semibold border transition-colors cursor-pointer ${
                  activePoseCategory === cat.id
                    ? 'bg-orange-600 text-white border-orange-500'
                    : 'bg-gray-900 text-gray-300 border-gray-700 hover:border-gray-500'
                }`}
              >
                {cat.labelAr}
              </button>
            ))}
          </div>

          {activePoseCategory !== 'all' && (
            <p className="text-[11px] text-orange-300/90">
              {
                MIRROR_POSE_CATEGORY_LIST.find(
                  (c) => c.id === activePoseCategory
                )?.descAr
              }
            </p>
          )}

          <select
            id="select_pose"
            data-testid="select-mirror-pose"
            value={pose}
            onChange={(e) => {
              const nextPhrase = e.target.value;
              setPose(nextPhrase);
              const matched = MIRROR_POSE_OPTIONS.find(
                (o) => o.enPhrase === nextPhrase
              );
              if (matched) {
                const presetSpec = MIRROR_POSE_PRESET_SPECS[matched.value];
                const nextFraming =
                  presetSpec.allowedFramings.includes(activeFraming)
                    ? activeFraming
                    : presetSpec.defaults.framing;
                applyPatch({
                  mirrorPose: matched.value,
                  framing: nextFraming,
                  mirrorStance: presetSpec.defaults.stance,
                  mirrorTorsoOrientation: presetSpec.defaults.torsoOrientation,
                  phoneHand: presetSpec.defaults.phoneHand,
                  mirrorPhonePosition: presetSpec.defaults.phonePosition,
                  mirrorFreeHandAction: presetSpec.defaults.freeHandAction,
                  mirrorMovementMoment: presetSpec.defaults.movementMoment,
                  mirrorGaze: presetSpec.defaults.gaze,
                  mirrorPoseEnergy: presetSpec.defaults.energy,
                  mirrorSupportObject: presetSpec.defaults.supportObject,
                  mirrorMotionBlurEnabled:
                    matched.value === 'pose_free_hand_motion_blur',
                });
              }
            }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
          >
            {poseGroups
              .filter((groupName) => {
                if (activePoseCategory === 'all') return true;
                const catMeta = MIRROR_POSE_CATEGORY_LIST.find(
                  (c) => c.id === activePoseCategory
                );
                return catMeta ? groupName.includes(catMeta.labelAr) || MIRROR_POSE_OPTIONS.some((o) => (o.groupAr || 'وضعيات عامة') === groupName && o.categoryId === activePoseCategory) : true;
              })
              .map((groupName) => (
                <optgroup
                  key={groupName}
                  label={groupName}
                  className="text-orange-500 font-bold"
                >
                  {MIRROR_POSE_OPTIONS.filter(
                    (opt) =>
                      (opt.groupAr || 'وضعيات عامة') === groupName &&
                      (activePoseCategory === 'all' ||
                        opt.categoryId === activePoseCategory ||
                        opt.enPhrase === pose)
                  ).map((opt) => {
                    const compat = optionCompatibility.poses[opt.value];
                    const disabled = compat ? !compat.allowed : false;
                    return (
                      <option
                        key={opt.value}
                        value={opt.enPhrase}
                        disabled={disabled}
                        className={
                          disabled
                            ? 'text-gray-500 font-normal'
                            : 'text-white font-normal'
                        }
                      >
                        {opt.labelAr}
                        {disabled && compat?.reasonAr
                          ? ` (${compat.reasonAr})`
                          : ''}
                      </option>
                    );
                  })}
                </optgroup>
              ))}
          </select>
          {activePoseMeta?.descAr && (
            <p className="text-xs text-gray-400">{activePoseMeta.descAr}</p>
          )}
        </div>

        {/* 1ب. تركيب الوضعية الواقعي القابل للتخصيص */}
        <div className="p-4 rounded-lg bg-gray-900/70 border border-gray-700 space-y-4">
          <div className="text-sm font-bold text-orange-400">
            تركيب الوضعية والحركة أمام المرآة (خيارات مترابطة):
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 1. الوقفة وتوزيع الوزن */}
            <div>
              <label
                htmlFor="select_mirror_stance"
                className="block text-gray-300 text-sm font-semibold mb-1.5"
              >
                1. الوقفة وتوزيع الوزن:
              </label>
              <select
                id="select_mirror_stance"
                data-testid="select-mirror-stance"
                value={activeStance}
                onChange={(e) =>
                  applyPatch({
                    mirrorStance: e.target.value as MirrorStanceType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_STANCE_OPTIONS.map((opt) => {
                  const compat = optionCompatibility.stances[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 2. اتجاه الجذع والرأس */}
            <div>
              <label
                htmlFor="select_mirror_torso"
                className="block text-gray-300 text-sm font-semibold mb-1.5"
              >
                2. اتجاه الجذع والرأس:
              </label>
              <select
                id="select_mirror_torso"
                data-testid="select-mirror-torso"
                value={activeTorso}
                onChange={(e) =>
                  applyPatch({
                    mirrorTorsoOrientation: e.target
                      .value as MirrorTorsoOrientationType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_TORSO_ORIENTATION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelAr}
                  </option>
                ))}
              </select>
            </div>

            {/* 3. سطح الدعم أو الأداة القريبة */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="select_mirror_support"
                  className="block text-gray-300 text-sm font-semibold"
                >
                  3. سطح الاستناد أو الأداة القريبة:
                </label>
                {renderLockToggle('mirrorSupportObject', 'سطح الدعم')}
              </div>
              <select
                id="select_mirror_support"
                data-testid="select-mirror-support"
                value={activeSupportObject}
                onChange={(e) =>
                  applyPatch({
                    mirrorSupportObject: e.target
                      .value as MirrorSupportObjectType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_SUPPORT_OBJECT_OPTIONS.map((opt) => {
                  const compat = optionCompatibility.supportObjects[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 4. اليد الحاملة للهاتف */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="select_mirror_phone_hand"
                  className="block text-gray-300 text-sm font-semibold"
                >
                  4. اليد الحاملة للهاتف:
                </label>
                {renderLockToggle('phoneHand', 'اليد الحاملة للهاتف')}
              </div>
              <select
                id="select_mirror_phone_hand"
                data-testid="select-mirror-phone-hand"
                value={activePhoneHand}
                onChange={(e) =>
                  applyPatch({
                    phoneHand: e.target.value as PhoneHandType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {PHONE_HAND_OPTIONS.map((opt) => {
                  const compat = optionCompatibility.phoneHands[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 5. موضع الهاتف */}
            <div>
              <label
                htmlFor="select_mirror_phone_pos"
                className="block text-gray-300 text-sm font-semibold mb-1.5"
              >
                5. موضع الهاتف (الكاميرا الخلفية للمرآة):
              </label>
              <select
                id="select_mirror_phone_pos"
                data-testid="select-mirror-phone-pos"
                value={activePhonePos}
                onChange={(e) =>
                  applyPatch({
                    mirrorPhonePosition: e.target
                      .value as MirrorPhonePositionType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_PHONE_POSITION_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelAr}
                  </option>
                ))}
              </select>
            </div>

            {/* 6. حركة اليد الحرة */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="select_mirror_free_hand"
                  className="block text-gray-300 text-sm font-semibold"
                >
                  6. تفاعل اليد الحرة (حركة واحدة كحد أقصى):
                </label>
                {renderLockToggle('mirrorFreeHandAction', 'حركة اليد الحرة')}
              </div>
              <select
                id="select_mirror_free_hand"
                data-testid="select-mirror-free-hand"
                value={activeFreeHand}
                onChange={(e) =>
                  applyPatch({
                    mirrorFreeHandAction: e.target
                      .value as MirrorFreeHandActionType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_FREE_HAND_ACTION_OPTIONS.map((opt) => {
                  const compat =
                    optionCompatibility.freeHandActions[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 7. اتجاه النظر */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <label
                  htmlFor="select_mirror_gaze"
                  className="block text-gray-300 text-sm font-semibold"
                >
                  7. اتجاه النظر (الشاشة أم المرآة):
                </label>
                {renderLockToggle('mirrorGaze', 'اتجاه النظر')}
              </div>
              <select
                id="select_mirror_gaze"
                data-testid="select-mirror-gaze"
                value={activeGaze}
                onChange={(e) =>
                  applyPatch({
                    mirrorGaze: e.target.value as MirrorGazeType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_GAZE_OPTIONS.map((opt) => {
                  const compat = optionCompatibility.gazes[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 8. طاقة التعبير والوضعية */}
            <div>
              <label
                htmlFor="select_mirror_energy"
                className="block text-gray-300 text-sm font-semibold mb-1.5"
              >
                8. طاقة الوضعية والحضور:
              </label>
              <select
                id="select_mirror_energy"
                data-testid="select-mirror-energy"
                value={activeEnergy}
                onChange={(e) =>
                  applyPatch({
                    mirrorPoseEnergy: e.target.value as MirrorPoseEnergyType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_POSE_ENERGY_OPTIONS.map((opt) => {
                  const compat = optionCompatibility.energies[opt.value];
                  const disabled = compat ? !compat.allowed : false;
                  return (
                    <option
                      key={opt.value}
                      value={opt.value}
                      disabled={disabled}
                    >
                      {opt.labelAr}
                      {disabled && compat?.reasonAr
                        ? ` (${compat.reasonAr})`
                        : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            {/* 9. لحظة الحركة الطبيعية */}
            <div>
              <label
                htmlFor="select_mirror_movement"
                className="block text-gray-300 text-sm font-semibold mb-1.5"
              >
                9. لحظة الحركة الطبيعية:
              </label>
              <select
                id="select_mirror_movement"
                data-testid="select-mirror-movement"
                value={activeMovement}
                onChange={(e) =>
                  applyPatch({
                    mirrorMovementMoment: e.target
                      .value as MirrorMovementMomentType,
                  })
                }
                className="w-full bg-gray-900 border border-gray-700 text-white text-sm rounded-md p-2.5 focus:outline-none focus:border-orange-500 cursor-pointer"
              >
                {MIRROR_MOVEMENT_MOMENT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.labelAr}
                  </option>
                ))}
              </select>
            </div>

            {/* تفعيل الضبابية الحركية (مغلق افتراضيًا) */}
            <div className="flex items-end pb-1">
              <label
                htmlFor="toggle_mirror_motion_blur"
                className={`flex items-center gap-2.5 text-sm select-none ${
                  activePhoneHand === 'both_hands'
                    ? 'text-gray-500 cursor-not-allowed'
                    : 'text-gray-300 cursor-pointer'
                }`}
              >
                <input
                  id="toggle_mirror_motion_blur"
                  data-testid="toggle-mirror-motion-blur"
                  type="checkbox"
                  checked={motionBlurEnabled}
                  disabled={activePhoneHand === 'both_hands'}
                  onChange={(e) =>
                    applyPatch({
                      mirrorMotionBlurEnabled: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-orange-500 rounded cursor-pointer disabled:cursor-not-allowed"
                />
                <span>
                  السماح بضبابية حركة طفيفة لليد الحرة (مغلق افتراضيًا
                  {activePhoneHand === 'both_hands'
                    ? ' — غير متاح عند إمساك الهاتف بكلتا اليدين'
                    : ''}
                  )
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* 2. تعابير الوجه */}
        <div>
          <label
            htmlFor="select_expression"
            className="block text-gray-300 font-semibold mb-2"
          >
            تعابير الوجه (تثبيت الملامح إجباري):
          </label>
          <select
            id="select_expression"
            value={expression}
            onChange={(e) => {
              const nextPhrase = e.target.value;
              setExpression(nextPhrase);
              const matched = MIRROR_EXPRESSION_OPTIONS.find(
                (o) => o.enPhrase === nextPhrase
              );
              if (matched) {
                applyPatch({ mirrorExpression: matched.value });
              }
            }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
          >
            {MIRROR_EXPRESSION_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.enPhrase}>
                {opt.labelAr}
              </option>
            ))}
          </select>
        </div>

        {/* 3. فيزياء الشعر */}
        <div>
          <label
            htmlFor="select_hair"
            className="block text-gray-300 font-semibold mb-2"
          >
            فيزياء الشعر:
          </label>
          <select
            id="select_hair"
            value={hair}
            onChange={(e) => {
              const nextPhrase = e.target.value;
              setHair(nextPhrase);
              const matched = MIRROR_HAIR_PHYSICS_OPTIONS.find(
                (o) => o.enPhrase === nextPhrase
              );
              if (matched) {
                applyPatch({ mirrorHair: matched.value });
              }
            }}
            className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
          >
            {MIRROR_HAIR_PHYSICS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.enPhrase}>
                {opt.labelAr}
              </option>
            ))}
          </select>
        </div>

        {/* 4. الملابس العلوية (اختصار سريع + محدد مهيكل تفصيلي) */}
        <div
          className="space-y-4 pt-2 border-t border-gray-700"
          data-testid="mirror-upper-subsection"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-orange-400">
              أ. الملابس العلوية
            </div>
            {renderLockToggle('upperGarment', 'الملابس العلوية')}
          </div>
          <div>
            <label
              htmlFor="select_top_clothing"
              className="block text-gray-300 font-semibold mb-2"
            >
              قالب سريع للملابس العلوية:
            </label>
            <select
              id="select_top_clothing"
              value={topClothing}
              onChange={(e) => {
                const nextPhrase = e.target.value;
                setTopClothing(nextPhrase);
                const matched = MIRROR_CLOTHING_PHYSICS_OPTIONS.find(
                  (o) => o.enPhrase === nextPhrase
                );
                if (matched) {
                  applyPatch({
                    mirrorClothing: matched.value,
                    upperGarment: undefined,
                  });
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              {MIRROR_CLOTHING_PHYSICS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.enPhrase}>
                  {opt.labelAr}
                </option>
              ))}
            </select>
          </div>

          {onUpdate && (
            <UpperClothingSelector
              selections={mirrorSelectionsSnapshot}
              onUpdate={onUpdate}
              variant="dark"
              idPrefix="mirror-upper"
            />
          )}
        </div>

        {/* 5. الملابس السفلية (اختصار سريع + محدد مهيكل تفصيلي مستقل) */}
        <div
          className="space-y-4 pt-2 border-t border-gray-700"
          data-testid="mirror-lower-subsection"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="text-sm font-bold text-orange-400">
              ب. الملابس السفلية
            </div>
            {renderLockToggle('lowerGarment', 'الملابس السفلية')}
          </div>
          <div>
            <label
              htmlFor="select_bottom_clothing"
              className="block text-gray-300 font-semibold mb-2"
            >
              قالب سريع للملابس السفلية والرياضية:
            </label>
            <select
              id="select_bottom_clothing"
              value={bottomClothing}
              onChange={(e) => {
                const nextPhrase = e.target.value;
                setBottomClothing(nextPhrase);
                const matched = MIRROR_BOTTOM_CLOTHING_OPTIONS.find(
                  (o) => o.enPhrase === nextPhrase
                );
                if (matched) {
                  applyPatch({
                    mirrorBottomClothing: matched.value,
                    lowerGarment: undefined,
                  });
                }
              }}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-md p-3 focus:outline-none focus:border-orange-500 transition-colors cursor-pointer"
            >
              {MIRROR_BOTTOM_CLOTHING_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.enPhrase}>
                  {opt.labelAr}
                </option>
              ))}
            </select>
          </div>

          {onUpdate && (
            <LowerClothingSelector
              selections={mirrorSelectionsSnapshot}
              onUpdate={onUpdate}
              variant="dark"
              idPrefix="mirror-lower"
            />
          )}
        </div>
      </div>

      {/* قسم عرض الكود والتوليد والنسخ */}
      <div className="mt-8 pt-6 border-t border-gray-700 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label
            htmlFor="resultPrompt"
            className="block text-gray-300 font-semibold"
          >
            كود JSON لاستوديو المرآة (EXECUTE_PHOTOGRAPHIC_CAPTURE):
          </label>
          <span
            data-testid="mirror-studio-source-badge"
            className={`px-2.5 py-1 rounded text-xs font-bold ${
              promptSource === 'gemini'
                ? 'bg-emerald-900/80 text-emerald-300 border border-emerald-700'
                : 'bg-gray-700 text-gray-200 border border-gray-600'
            }`}
          >
            {promptSource === 'gemini'
              ? 'المصدر: Gemini (gemini)'
              : 'المصدر: قياسي محلي (deterministic)'}
          </span>
        </div>

        {generationStatusAr && (
          <div
            role="status"
            data-testid="mirror-studio-status"
            data-source={promptSource}
            data-fallback-reason={fallbackReason || ''}
            className="p-2.5 rounded bg-gray-900 border border-gray-700 text-xs text-amber-300 space-y-1"
          >
            <div>{generationStatusAr}</div>
            {diagnostics && (
              <div dir="ltr" className="text-[10px] font-mono text-gray-400">
                {diagnostics.requestId} · {diagnostics.model} · {diagnostics.durationMs}ms · {diagnostics.httpStatusClass}
                {fallbackReason ? ` · reason:${fallbackReason}` : ''}
              </div>
            )}
          </div>
        )}

        <textarea
          id="resultPrompt"
          value={generatedJson}
          readOnly
          className="w-full h-80 bg-black text-green-400 font-mono p-4 rounded-md border border-gray-700 focus:outline-none focus:border-orange-500 resize-y mb-2"
          dir="ltr"
        />
        <div className="flex flex-col sm:flex-row gap-3">
          {onGeneratePrompt && (
            <button
              type="button"
              data-testid="mirror-studio-generate-btn"
              onClick={onGeneratePrompt}
              disabled={isGenerating}
              className="w-full sm:flex-1 bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white font-bold py-3 px-4 rounded transition-colors cursor-pointer"
            >
              {isGenerating
                ? 'جاري التوليد عبر Gemini...'
                : 'توليد البرومبت عبر Gemini'}
            </button>
          )}
          <button
            type="button"
            onClick={copyToClipboard}
            className="w-full sm:flex-1 bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded transition-colors cursor-pointer"
          >
            نسخ البرومبت
          </button>
          {onBackToMain && (
            <button
              type="button"
              onClick={onBackToMain}
              className="w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold py-3 px-4 rounded transition-colors cursor-pointer"
            >
              العودة إلى الواجهة الرئيسية
            </button>
          )}
        </div>
      </div>

      {showToast && (
        <div
          id="toast"
          role="status"
          aria-live="polite"
          className="fixed bottom-10 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg font-bold transition-all duration-300 z-50"
        >
          تم نسخ الكود البرمجي بنجاح!
        </div>
      )}
    </div>
  );
}
