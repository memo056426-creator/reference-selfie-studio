import {
  DEFAULT_SELECTIONS,
  FramingType,
  LightingSource,
  LockableSelectionField,
  LowerGarmentFitType,
  LowerGarmentMaterialType,
  LowerGarmentPatternType,
  LowerGarmentType,
  MirrorFreeHandActionType,
  MirrorLensProfileType,
  MirrorPhonePositionType,
  MirrorPoseCategoryId,
  MirrorPoseType,
  MirrorStanceType,
  MirrorSupportObjectType,
  MirrorTorsoOrientationType,
  PhoneHandType,
  PhoneProcessingProfile,
  SelfieSelections,
  UpperGarmentFitType,
  UpperGarmentMaterialType,
  UpperGarmentPatternType,
  UpperGarmentType,
  XIAOMI_15_ULTRA_LENS_PROFILES,
} from '../types/selfie';

export type { LockableSelectionField, MirrorPoseCategoryId };

export interface MirrorPoseCategoryMeta {
  id: MirrorPoseCategoryId;
  labelAr: string;
  descAr: string;
}

export const MIRROR_POSE_CATEGORY_LIST: MirrorPoseCategoryMeta[] = [
  {
    id: 'standing',
    labelAr: '1. وضعيات الوقوف والتوازن (Standing)',
    descAr: 'وقوف متوازن بنقل الوزن على الساقين، أو خطوة خفيفة للأمام، أو وضعية مرآة طبيعية.',
  },
  {
    id: 'sitting',
    labelAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    descAr: 'الجلوس على حافة السرير أو الكرسي أو المقعد أو السجادة مع نقاط ارتكاز واضحة.',
  },
  {
    id: 'leaning',
    labelAr: '3. وضعيات الاتكاء والانحناء (Leaning)',
    descAr: 'اتكاء متزن على جدار الغرفة أو طاولة الزينة أو إطار الباب الظاهر.',
  },
  {
    id: 'candid',
    labelAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    descAr: 'تعديل الياقة أو الأكمام، لمس الشعر أو النظارة، تفقد الكادر، أو حمل كوب/كتاب.',
  },
];

export interface LockedFieldConflict {
  code: string;
  fields: LockableSelectionField[];
  reasonAr: string;
  suggestedFixAr: string;
  suggestedUpdates?: Partial<SelfieSelections>;
}

export interface GravityAndBalanceState {
  postureType: 'standing' | 'seated' | 'leaning' | 'floor_seated';
  weightDistribution: string;
  centerOfMassNotes: string;
}

export interface JointKinematicsProfile {
  neck: string;
  shoulders: string;
  elbows: string;
  wrists: string;
  spine: string;
  hips: string;
  knees?: string;
  ankles?: string;
}

export interface PhoneHandOpticsState {
  phoneHand: PhoneHandType;
  phonePosition: MirrorPhonePositionType;
  anatomicalHoldClause: string;
  mirrorReflectionSideClause: string;
  armMechanicsClause: string;
}

export type UpperFabricStiffnessClass =
  | 'soft_drape'
  | 'structured_woven'
  | 'heavy_fleece_knit';

export type LowerFabricStiffnessClass =
  | 'soft_drape'
  | 'structured_twill_denim'
  | 'heavy_fleece_knit'
  | 'athletic_light';

export interface GarmentPosePhysicsState {
  upperStiffnessClass: UpperFabricStiffnessClass;
  lowerStiffnessClass: LowerFabricStiffnessClass;
  lowerHasPockets: boolean;
  upperHasChestOrSidePocket: boolean;
  pocketInteractionAllowed: boolean;
  pocketAdaptationReasonAr?: string;
  upperPoseCouplingPhrase: string;
  lowerPoseCouplingPhrase: string;
}

export interface OpticalAndLightingPhysicsState {
  lensFocalMm: 14 | 23 | 70 | 100;
  mirrorDistanceBand: 'close_arm_length' | 'moderate_half_room' | 'stepped_back_telephoto';
  visibleCropZone: 'chest_up' | 'waist_up' | 'mid_thigh_up' | 'full_body_floor';
  cropForbiddenRegions: string[];
  flashMode: 'screen_only' | 'night_mode' | 'direct_flash' | 'ambient';
  flashGeometryClause: string;
}

export interface BiomechanicsSolution {
  gravityBalance: GravityAndBalanceState;
  joints: JointKinematicsProfile;
  phoneHandOptics: PhoneHandOpticsState;
  visibleContactPoints: string[];
  garmentPhysics: GarmentPosePhysicsState;
  opticalLighting: OpticalAndLightingPhysicsState;
  lockedConflicts: LockedFieldConflict[];
  causalitySummary: string;
}

const POCKET_LOWER_GARMENTS = new Set<LowerGarmentType>([
  'tailored_trousers',
  'relaxed_trousers',
  'chinos',
  'jeans',
  'sweatpants',
  'joggers',
  'track_pants',
  'modest_shorts',
]);

const POCKET_UPPER_GARMENTS = new Set<UpperGarmentType>([
  'button_up_shirt',
  'flannel_shirt',
  'hoodie',
  'cardigan',
  'lightweight_overshirt',
]);

export function doesLowerGarmentHavePockets(
  garment?: LowerGarmentType
): boolean {
  if (!garment) return false;
  return POCKET_LOWER_GARMENTS.has(garment);
}

export function doesUpperGarmentHavePocket(
  garment?: UpperGarmentType
): boolean {
  if (!garment) return false;
  return POCKET_UPPER_GARMENTS.has(garment);
}

export function getUpperMaterialStiffnessClass(
  material?: UpperGarmentMaterialType
): UpperFabricStiffnessClass {
  switch (material) {
    case 'cotton_poplin':
    case 'flannel':
    case 'chambray_denim':
    case 'linen_cotton_blend':
      return 'structured_woven';
    case 'fleece':
    case 'french_terry':
    case 'knit':
    case 'waffle_knit':
      return 'heavy_fleece_knit';
    case 'cotton_jersey':
    case 'ribbed_cotton':
    default:
      return 'soft_drape';
  }
}

export function getLowerMaterialStiffnessClass(
  material?: LowerGarmentMaterialType
): LowerFabricStiffnessClass {
  switch (material) {
    case 'denim':
    case 'cotton_twill':
    case 'wool_blend_suiting':
    case 'linen_cotton_blend':
      return 'structured_twill_denim';
    case 'fleece':
    case 'french_terry':
    case 'ribbed_knit':
      return 'heavy_fleece_knit';
    case 'athletic_mesh':
    case 'nylon_track_weave':
      return 'athletic_light';
    case 'cotton_jersey':
    case 'cotton_poplin':
    default:
      return 'soft_drape';
  }
}

export function getMirrorPoseCategory(pose: MirrorPoseType): MirrorPoseCategoryId {
  switch (pose) {
    case 'pose_bed_edge_dynamic':
    case 'pose_chair_or_stool_sitting':
    case 'pose_floor_rug_mirror':
    case 'pose_floor_sitting_bed':
    case 'pose_prop_open_book':
    case 'pose_seated_forearm_knee_rest':
      return 'sitting';
    case 'pose_wall_lean_scurve':
    case 'pose_vanity_casual_lean':
    case 'pose_leaning_forward':
    case 'pose_doorway_frame_lean':
      return 'leaning';
    case 'pose_adjust_collar_sleeves':
    case 'pose_putting_on_jacket':
    case 'pose_adjust_accessories':
    case 'pose_hand_in_hair_jawline':
    case 'pose_candid_framing_check':
    case 'pose_free_hand_motion_blur':
    case 'pose_prop_coffee_mug':
    case 'pose_prop_perfume_spray':
    case 'pose_hand_on_mirror_glass':
    case 'pose_cuffed_sleeve_check':
      return 'candid';
    case 'pose_contrapposto_standing':
    case 'pose_contrapposto_70':
    case 'pose_one_foot_forward_knee_bend':
    case 'pose_phone_chest_look_down':
    case 'pose_phone_cover_lower_face_eye_contact':
    case 'pose_standing_three_quarter_turn':
    default:
      return 'standing';
  }
}

export function isFramingShowingMidsection(framing: FramingType): boolean {
  return framing !== 'head_and_shoulders';
}

export function isFramingShowingThighs(framing: FramingType): boolean {
  return framing === 'three_quarter' || framing === 'full_body_mirror';
}

export function isFramingShowingLowerLegsAndFeet(framing: FramingType): boolean {
  return framing === 'full_body_mirror';
}

export function getVisibleCropZone(
  framing: FramingType
): OpticalAndLightingPhysicsState['visibleCropZone'] {
  switch (framing) {
    case 'head_and_shoulders':
      return 'chest_up';
    case 'half_body':
      return 'waist_up';
    case 'three_quarter':
      return 'mid_thigh_up';
    case 'full_body_mirror':
    default:
      return 'full_body_floor';
  }
}

export function getCropForbiddenRegions(framing: FramingType): string[] {
  if (framing === 'head_and_shoulders') {
    return ['waist', 'hips', 'thighs', 'knees', 'shins', 'ankles', 'feet', 'floor'];
  }
  if (framing === 'half_body') {
    return ['thighs', 'knees', 'shins', 'ankles', 'feet', 'floor'];
  }
  if (framing === 'three_quarter') {
    return ['lower shins', 'ankles', 'feet', 'soles'];
  }
  return [];
}

/**
 * Resolves anatomical phone-holding hand and optical mirror-reflection lateral cues
 * so mirror prompts never duplicate phones, drop the requested hand, or invert hands implausibly.
 */
export function buildPhoneHandOpticsState(
  phoneHand: PhoneHandType,
  phonePosition: MirrorPhonePositionType,
  torsoOrientation: MirrorTorsoOrientationType
): PhoneHandOpticsState {
  const heightPhrase =
    phonePosition === 'eye_level'
      ? 'at eye level'
      : phonePosition === 'shoulder_level'
        ? 'at shoulder height beside the upper torso'
        : 'at chest level';

  if (phoneHand === 'both_hands') {
    return {
      phoneHand,
      phonePosition,
      anatomicalHoldClause: `cradling one single physical smartphone steadily with both anatomical hands ${heightPhrase}`,
      mirrorReflectionSideClause:
        'with both hands positioned symmetrically toward center chest/face in the mirror reflection, keeping both wrists neutral and avoiding a third hand or duplicate device',
      armMechanicsClause:
        'both elbows bent comfortably at roughly 85–105 degrees close to the torso with thumbs and fingers wrapped cleanly around opposite edges of the single phone frame without blocking the rear lens module',
    };
  }

  const isLeft = phoneHand === 'left_hand';
  const holdingSide = isLeft ? 'left' : 'right';
  const freeSide = isLeft ? 'right' : 'left';
  const angleNote =
    torsoOrientation === 'facing_mirror'
      ? 'directly facing the mirror plane'
      : 'turned gently in a relaxed three-quarter torso orientation';

  return {
    phoneHand,
    phonePosition,
    anatomicalHoldClause: `holding one single physical smartphone exclusively in the subject’s anatomical ${holdingSide} hand ${heightPhrase}`,
    mirrorReflectionSideClause: `keeping the anatomical ${holdingSide} arm as the phone-holding side and the anatomical ${freeSide} arm as the free side throughout the mirror reflection (${angleNote}), without hand-swapping or phantom fingers`,
    armMechanicsClause: `anatomical ${holdingSide} shoulder level and relaxed, elbow flexed naturally around 85–110 degrees, forearm angled cleanly upward toward the mirror, neutral wrist and fingers gripping the phone edges cleanly with the rear camera lens unobstructed while the anatomical ${freeSide} arm remains unencumbered by any second phone`,
  };
}

/**
 * Generates pose-coupled fabric physics grounded in material stiffness, active joint mechanics,
 * contact compression, pocket reality, and visible framing boundaries.
 */
export function buildPoseCoupledUpperFabricPhysics(params: {
  garment: UpperGarmentType;
  colorPhrase: string;
  material: UpperGarmentMaterialType;
  fit: UpperGarmentFitType;
  pattern: UpperGarmentPatternType;
  framing: FramingType;
  phoneHand: PhoneHandType;
  phonePosition: MirrorPhonePositionType;
  freeHandAction: MirrorFreeHandActionType;
  supportObject: MirrorSupportObjectType;
  postureType: GravityAndBalanceState['postureType'];
  compact?: boolean;
}): string {
  const {
    garment,
    colorPhrase,
    material,
    fit,
    pattern,
    framing,
    phoneHand,
    phonePosition,
    freeHandAction,
    supportObject,
    postureType,
    compact,
  } = params;

  const stiffness = getUpperMaterialStiffnessClass(material);
  const stiffnessFoldNote =
    stiffness === 'structured_woven'
      ? 'crisp structured folds and clean collar/placket geometry'
      : stiffness === 'heavy_fleece_knit'
        ? 'thicker soft-folding bulk and weighty gravity drape'
        : 'soft responsive jersey drape and fine natural creases';

  const armSide =
    phoneHand === 'both_hands'
      ? 'both raised arms'
      : phoneHand === 'left_hand'
        ? 'the raised anatomical left arm'
        : 'the raised anatomical right arm';
  const liftNote =
    phonePosition === 'eye_level'
      ? `noticeable diagonal tension across ${armSide}’s shoulder seam, underarm creasing, and slight upward hem lift on that side`
      : phonePosition === 'shoulder_level'
        ? `moderate fabric pull around ${armSide}’s shoulder and sleeve crease`
        : `natural elbow-bend creasing along ${armSide}`;

  const contactZones: string[] = ['shoulders', 'elbows', 'chest'];
  if (isFramingShowingMidsection(framing)) {
    contactZones.push('waist');
  }
  const supportFlatten =
    supportObject === 'wall'
      ? ', slight fabric flattening where the shoulder contacts the wall'
      : postureType === 'seated' && isFramingShowingMidsection(framing)
        ? ', soft horizontal creasing across the lower torso where seated'
        : '';

  const sleeveInteract =
    freeHandAction === 'adjust_sleeve_or_collar'
      ? ', crisp localized pinch folds where the free hand adjusts the cuff or collar'
      : freeHandAction === 'smooth_shirt' && isFramingShowingMidsection(framing)
        ? ', gentle surface tension under the smoothing free palm'
        : '';

  const weaveTag = material.replace(/_/g, ' ');
  const patternNote =
    pattern === 'plaid'
      ? 'woven plaid alignment following body contours'
      : pattern === 'stripes'
        ? 'woven stripes curving naturally over folds'
        : pattern === 'subtle_texture'
          ? 'subtle yarn-level weave texture'
          : 'solid matte surface without invented logos or prints';

  const fitNote =
    fit === 'oversized'
      ? 'oversized volume pooling gently downward'
      : fit === 'relaxed'
        ? 'easy relaxed drape'
        : fit === 'fitted'
          ? 'modest close drape without tight cling'
          : 'balanced regular drape';

  if (compact) {
    return `${weaveTag} (${garment.replace(/_/g, ' ')}), ${patternNote}, ${fitNote} with ${stiffnessFoldNote}, ${liftNote} across ${contactZones.join(', ')}${supportFlatten}${sleeveInteract}, lighting-responsive ${colorPhrase} shading without plastic texture`;
  }

  return `${weaveTag} fabric with ${stiffnessFoldNote}, ${patternNote}, ${fitNote} showing ${liftNote} across ${contactZones.join(', ')}${supportFlatten}${sleeveInteract}, and ${colorPhrase} shading responding plausibly to light without plastic cloth, floating hems, or invented logos`;
}

export function buildPoseCoupledLowerFabricPhysics(params: {
  garment: LowerGarmentType;
  colorPhrase: string;
  material: LowerGarmentMaterialType;
  fit: LowerGarmentFitType;
  pattern: LowerGarmentPatternType;
  framing: FramingType;
  freeHandAction: MirrorFreeHandActionType;
  postureType: GravityAndBalanceState['postureType'];
  compact?: boolean;
}): string {
  const {
    garment,
    colorPhrase,
    material,
    fit,
    pattern,
    framing,
    freeHandAction,
    postureType,
    compact,
  } = params;

  const stiffness = getLowerMaterialStiffnessClass(material);
  const stiffnessBehavior =
    stiffness === 'structured_twill_denim'
      ? 'firm structured creasing and crisp seam lines'
      : stiffness === 'heavy_fleece_knit'
        ? 'soft thick-pile folds and cushioned gravity stacking'
        : stiffness === 'athletic_light'
          ? 'lightweight breathable hang with minimal stiff creasing'
          : 'soft fluid drape and fine surface creases';

  const zones: string[] = [];
  if (isFramingShowingMidsection(framing)) zones.push('waistband', 'hips');
  if (isFramingShowingThighs(framing)) zones.push('thighs');
  if (isFramingShowingLowerLegsAndFeet(framing)) zones.push('knees', 'lower hems');
  if (zones.length === 0) {
    zones.push('visible upper garment boundary only');
  }

  const postureFolds =
    postureType === 'seated' || postureType === 'floor_seated'
      ? isFramingShowingThighs(framing)
        ? 'natural horizontal lap bunching at the hip-crease and behind-knee compression'
        : 'subtle seated waistband compression'
      : isFramingShowingLowerLegsAndFeet(framing)
        ? 'vertical gravity hang with gentle knee-bend creasing and natural cuff stacking'
        : isFramingShowingThighs(framing)
          ? 'vertical gravity hang across the hips and upper thighs matching the stance weight shift'
          : 'natural waistband drape within the upper crop';

  const hasPocket = doesLowerGarmentHavePockets(garment);
  const pocketNote =
    freeHandAction === 'hand_at_hip_or_pocket' && isFramingShowingMidsection(framing)
      ? hasPocket
        ? ', localized pocket-entry creasing and slight cloth tension from the resting hand'
        : ', light surface crease where the hand rests gently against the outer hip without inventing pockets'
      : '';

  const weaveTag = material.replace(/_/g, ' ');
  const fitTag = fit.replace(/_/g, ' ');
  const patternTag =
    pattern === 'washed_fade'
      ? 'natural washed denim fade'
      : pattern === 'side_stripe'
        ? 'minimal tonal side seam stripe'
        : pattern === 'plaid'
          ? 'aligned woven plaid'
          : pattern === 'stripes'
            ? 'subtle vertical stripes'
            : pattern === 'subtle_texture'
              ? 'subtle woven yarn texture'
              : 'solid matte finish without logos';

  if (compact) {
    return `${weaveTag} (${fitTag}), ${patternTag}, ${stiffnessBehavior}, ${postureFolds} at ${zones.join(', ')}${pocketNote}, ${colorPhrase} shading without color bleed`;
  }

  return `${weaveTag} lower fabric (${fitTag}) with ${patternTag}, showing ${stiffnessBehavior} and ${postureFolds} across ${zones.join(', ')}${pocketNote}, and ${colorPhrase} shading consistent with lighting without color bleed, plastic cloth, or invented logos`;
}

/**
 * Evaluates locked vs unlocked Mirror Studio fields under the strict Priority Hierarchy:
 * 1. Reference Face Identity
 * 2. Explicit user instructions & lockedFields
 * 3. Anatomical & physical consistency
 * 4. Mirror & camera optical geometry
 * 5. Lighting & material consistency
 * 6. Composition
 */
export function evaluateLockedMirrorConflicts(
  selections: SelfieSelections
): {
  lockedSet: Set<LockableSelectionField>;
  lockedConflicts: LockedFieldConflict[];
} {
  const lockedList: LockableSelectionField[] = Array.isArray(selections.lockedFields)
    ? selections.lockedFields
    : [];
  const lockedSet = new Set<LockableSelectionField>(lockedList);
  const lockedConflicts: LockedFieldConflict[] = [];

  const lens = selections.mirrorLensProfile || 'main_23mm';
  const framing = selections.framing || 'three_quarter';
  const pose = selections.mirrorPose || 'pose_contrapposto_standing';
  const phoneHand = selections.phoneHand || 'right_hand';
  const freeHand = selections.mirrorFreeHandAction || 'none_relaxed';
  const support = selections.mirrorSupportObject || 'none';
  const stance = selections.mirrorStance || 'balanced_relaxed';
  const gaze = selections.mirrorGaze || 'gaze_phone_screen';
  const lowerGarment = selections.lowerGarment;
  const lighting = selections.lighting;
  const profile = selections.phoneProcessingProfile || 'natural_phone';

  const isBothLocked = (a: LockableSelectionField, b: LockableSelectionField) =>
    lockedSet.has(a) && lockedSet.has(b);

  // 1. Both hands holding phone vs free-hand action
  if (
    phoneHand === 'both_hands' &&
    freeHand !== 'none_relaxed' &&
    isBothLocked('phoneHand', 'mirrorFreeHandAction')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_PHONE_HAND_VS_FREE_HAND',
      fields: ['phoneHand', 'mirrorFreeHandAction'],
      reasonAr:
        'لا يمكن قفل إمساك الهاتف بكلتا اليدين مع قفل حركة نشطة لليد الحرة في الوقت نفسه؛ التشريح البشري لا يترك يدًا ثالثة.',
      suggestedFixAr:
        'فكّ قفل اليد الحرة أو غيّر إمساك الهاتف إلى اليد اليمنى أو اليسرى.',
      suggestedUpdates: { mirrorFreeHandAction: 'none_relaxed' },
    });
  }

  // 2. Both hands vs hand-held prop support
  const propSupports = new Set<MirrorSupportObjectType>([
    'mirror_glass',
    'coffee_mug',
    'open_book',
    'perfume_bottle',
  ]);
  if (
    phoneHand === 'both_hands' &&
    propSupports.has(support) &&
    isBothLocked('phoneHand', 'mirrorSupportObject')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_PHONE_HAND_VS_PROP',
      fields: ['phoneHand', 'mirrorSupportObject'],
      reasonAr:
        'لا يمكن إمساك الهاتف بكلتا اليدين أثناء حمل كوب أو كتاب أو زجاجة عطر أو لمس المرآة.',
      suggestedFixAr:
        'اختر يدًا واحدة للهاتف أو أزل الأداة المساعدة.',
      suggestedUpdates: { mirrorSupportObject: 'none' },
    });
  }

  // 3. 100mm telephoto vs full_body_mirror framing
  if (
    lens === 'ultra_telephoto_100mm' &&
    framing === 'full_body_mirror' &&
    isBothLocked('mirrorLensProfile', 'framing')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_100MM_VS_FULL_BODY',
      fields: ['mirrorLensProfile', 'framing'],
      reasonAr:
        'عدسة التقريب 100mm ذات مجال رؤية ضيق ولا تتسع لإطار كامل الجسم أمام المرآة من مسافة غرفة عادية.',
      suggestedFixAr:
        'غيّر الكادر إلى ثلاثة أرباع أو بدّل العدسة إلى Main 23mm / Ultra-wide 14mm.',
      suggestedUpdates: { framing: 'three_quarter' },
    });
  }

  // 4. Telephoto 70/100mm vs mirror_glass close touch
  if (
    (lens === 'telephoto_70mm' || lens === 'ultra_telephoto_100mm') &&
    (freeHand === 'lightly_touch_mirror' ||
      pose === 'pose_hand_on_mirror_glass' ||
      support === 'mirror_glass') &&
    (isBothLocked('mirrorLensProfile', 'mirrorFreeHandAction') ||
      isBothLocked('mirrorLensProfile', 'mirrorPose') ||
      isBothLocked('mirrorLensProfile', 'mirrorSupportObject'))
  ) {
    lockedConflicts.push({
      code: 'LOCKED_TELEPHOTO_VS_MIRROR_TOUCH',
      fields: ['mirrorLensProfile', 'mirrorFreeHandAction'],
      reasonAr:
        'عدسات التقريب 70mm و100mm تتطلب مسافة متباعدة عن المرآة وتتعارض مع لمس زجاج المرآة عن قرب.',
      suggestedFixAr:
        'بدّل العدسة إلى Main 23mm أو ألغِ لمس زجاج المرآة.',
      suggestedUpdates: { mirrorLensProfile: 'main_23mm' },
    });
  }

  // 5. Tight framing vs full-body-only pose or seated pose
  const tightFraming = framing === 'head_and_shoulders' || framing === 'half_body';
  const seatedOrFloorPose =
    pose === 'pose_bed_edge_dynamic' ||
    pose === 'pose_chair_or_stool_sitting' ||
    pose === 'pose_floor_rug_mirror' ||
    pose === 'pose_floor_sitting_bed' ||
    pose === 'pose_prop_open_book' ||
    pose === 'pose_seated_forearm_knee_rest';
  const fullBodyPose =
    pose === 'pose_one_foot_forward_knee_bend' ||
    pose === 'pose_wall_lean_scurve' ||
    pose === 'pose_floor_rug_mirror' ||
    pose === 'pose_floor_sitting_bed';

  if (
    ((tightFraming && (seatedOrFloorPose || fullBodyPose)) ||
      (framing === 'three_quarter' && fullBodyPose)) &&
    isBothLocked('framing', 'mirrorPose')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_FRAMING_VS_POSE',
      fields: ['framing', 'mirrorPose'],
      reasonAr:
        'الوضعية المقفلة تعتمد على الساقين أو المقعد أو الأرضية بينما الكادر المقفل يقص تلك المناطق خارج الصورة.',
      suggestedFixAr:
        'وسّع الكادر إلى ثلاثة أرباع/كامل الجسم أو اختر وضعية علوية متناسقة مع الكادر.',
      suggestedUpdates: { framing: 'full_body_mirror' },
    });
  }

  // 6. Leaning / Sitting pose vs support = 'none'
  const needsLeanSupport =
    pose === 'pose_wall_lean_scurve' ||
    pose === 'pose_vanity_casual_lean' ||
    pose === 'pose_leaning_forward' ||
    pose === 'pose_doorway_frame_lean' ||
    stance === 'light_shoulder_wall_lean';
  const needsSeatSupport =
    pose === 'pose_bed_edge_dynamic' ||
    pose === 'pose_chair_or_stool_sitting' ||
    pose === 'pose_floor_sitting_bed' ||
    pose === 'pose_seated_forearm_knee_rest';

  if (
    ((needsLeanSupport && support !== 'wall' && support !== 'vanity') ||
      (needsSeatSupport &&
        support !== 'bed_edge' &&
        support !== 'chair' &&
        support !== 'stool')) &&
    isBothLocked('mirrorPose', 'mirrorSupportObject')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_POSE_VS_SUPPORT_SURFACE',
      fields: ['mirrorPose', 'mirrorSupportObject'],
      reasonAr:
        'الوضعية المقفلة تتطلب سطح استناد أو مقعدًا ظاهرًا في الغرفة ولا تتوافق فيزيائيًا مع سطح الدعم المقفل حاليًا.',
      suggestedFixAr: needsSeatSupport
        ? 'اختر مقعدًا ظاهرًا (حافة السرير أو كرسي أو ستول) أو فك قفل الوضعية.'
        : 'اختر الجدار أو طاولة الزينة كسطح دعم.',
      suggestedUpdates: {
        mirrorSupportObject: needsSeatSupport ? 'bed_edge' : 'wall',
      },
    });
  }

  // 7. Gaze lock conflict
  if (
    ((pose === 'pose_phone_chest_look_down' && gaze !== 'gaze_phone_screen') ||
      (pose === 'pose_phone_cover_lower_face_eye_contact' &&
        gaze !== 'gaze_camera_lens')) &&
    isBothLocked('mirrorPose', 'mirrorGaze')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_POSE_VS_GAZE',
      fields: ['mirrorPose', 'mirrorGaze'],
      reasonAr:
        'اتجاه النظر المقفل يتعارض مع هدف النظر الأساسي المحدد في الوضعية المقفلة.',
      suggestedFixAr:
        pose === 'pose_phone_chest_look_down'
          ? 'اضبط اتجاه النظر إلى شاشة الهاتف.'
          : 'اضبط اتجاه النظر إلى عدسة الكاميرا في المرآة.',
      suggestedUpdates: {
        mirrorGaze:
          pose === 'pose_phone_chest_look_down'
            ? 'gaze_phone_screen'
            : 'gaze_camera_lens',
      },
    });
  }

  // 8. Night mode vs direct flash
  if (
    profile === 'night_mode' &&
    lighting !== 'mode_a_phone_screen_dark' &&
    isBothLocked('phoneProcessingProfile', 'lighting')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_NIGHT_MODE_VS_FLASH',
      fields: ['phoneProcessingProfile', 'lighting'],
      reasonAr:
        'الوضع الليلي (Night Mode) يتعارض مع الفلاش المباشر المقفل؛ لا يمكن تشغيل تعريض متعدد الإطارات مع فلاش LED مباشر في الوقت نفسه.',
      suggestedFixAr:
        'غيّر الإضاءة إلى شاشة الهاتف فقط أو عطّل الوضع الليلي عند استخدام الفلاش.',
      suggestedUpdates: { phoneProcessingProfile: 'natural_phone' },
    });
  }

  // 9. Pocket action vs pocketless lower garment when both locked
  if (
    freeHand === 'hand_at_hip_or_pocket' &&
    lowerGarment !== undefined &&
    !doesLowerGarmentHavePockets(lowerGarment) &&
    isBothLocked('mirrorFreeHandAction', 'lowerGarment')
  ) {
    lockedConflicts.push({
      code: 'LOCKED_POCKET_HAND_VS_NO_POCKET_GARMENT',
      fields: ['mirrorFreeHandAction', 'lowerGarment'],
      reasonAr:
        'القطعة السفلية المختارة لا تحتوي عادةً على جيوب جانبية عميقة؛ سيوجَّه البرومبت إلى إسناد اليد على جانب الخصر خارجيًا دون اختراع جيب.',
      suggestedFixAr:
        'اختر وضع اليد على الخصر خارجيًا أو استبدل القطعة السفلية ببنطال جينز أو تشينو أو سويتبانتس بجيوب.',
    });
  }

  return { lockedSet, lockedConflicts };
}

/**
 * Deterministic rule-based biomechanics, mirror optics, and garment-pose physics solver.
 * Used as the single source of truth across Mirror Studio, Strict Editing, Scene Builder, and the final audit gate.
 */
export function solveBiomechanicsAndPhysics(
  rawInput: Partial<SelfieSelections>
): BiomechanicsSolution {
  const s: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...rawInput,
  };

  const framing: FramingType = s.framing || 'three_quarter';
  const lensId: MirrorLensProfileType =
    s.mirrorLensProfile && XIAOMI_15_ULTRA_LENS_PROFILES[s.mirrorLensProfile]
      ? s.mirrorLensProfile
      : 'main_23mm';
  const lensSpec = XIAOMI_15_ULTRA_LENS_PROFILES[lensId];
  const pose: MirrorPoseType = s.mirrorPose || 'pose_contrapposto_standing';
  const stance: MirrorStanceType = s.mirrorStance || 'balanced_relaxed';
  const torsoOrientation: MirrorTorsoOrientationType =
    s.mirrorTorsoOrientation || 'slight_angle_head_turned';
  const phoneHand: PhoneHandType = s.phoneHand || 'right_hand';
  const phonePosition: MirrorPhonePositionType =
    s.mirrorPhonePosition || 'chest_level';
  const freeHandAction: MirrorFreeHandActionType =
    s.mirrorFreeHandAction || 'none_relaxed';
  const supportObject: MirrorSupportObjectType =
    s.mirrorSupportObject || 'none';
  const category = getMirrorPoseCategory(pose);

  const isSeatedOnFurniture =
    pose === 'pose_bed_edge_dynamic' ||
    pose === 'pose_chair_or_stool_sitting' ||
    pose === 'pose_prop_open_book' ||
    pose === 'pose_seated_forearm_knee_rest' ||
    supportObject === 'bed_edge' ||
    supportObject === 'chair' ||
    supportObject === 'stool';
  const isFloorSeated =
    pose === 'pose_floor_rug_mirror' || pose === 'pose_floor_sitting_bed';
  const isLeaning =
    category === 'leaning' || stance === 'light_shoulder_wall_lean';

  const postureType: GravityAndBalanceState['postureType'] = isFloorSeated
    ? 'floor_seated'
    : isSeatedOnFurniture
      ? 'seated'
      : isLeaning
        ? 'leaning'
        : 'standing';

  // A held prop (e.g. open_book) is not the surface supporting a seated body.
  // Derive the seat independently so gravity and visible contacts agree.
  const seatedSurface: 'bed_edge' | 'chair' | 'stool' =
    supportObject === 'bed_edge' ||
    supportObject === 'chair' ||
    supportObject === 'stool'
      ? supportObject
      : pose === 'pose_chair_or_stool_sitting' ||
          pose === 'pose_seated_forearm_knee_rest'
        ? 'chair'
        : 'bed_edge';

  // 1. Gravity & balance
  let gravityBalance: GravityAndBalanceState;
  if (postureType === 'floor_seated') {
    gravityBalance = {
      postureType,
      weightDistribution:
        pose === 'pose_floor_sitting_bed'
          ? 'Pelvis settled onto the bedroom floor with upper-back support transferred into the visible bed frame behind.'
          : 'Pelvis centered squarely on the bedroom floor rug with one knee drawn naturally for forward stability.',
      centerOfMassNotes:
        'Center of mass anchored low over sitting bones; no floating torso or weightless knees.',
    };
  } else if (postureType === 'seated') {
    const surfaceLabel =
      seatedSurface === 'chair'
        ? 'visible bedroom chair seat'
        : seatedSurface === 'stool'
          ? 'visible bedroom stool seat'
          : 'visible bed mattress edge';
    gravityBalance = {
      postureType,
      weightDistribution: isFramingShowingLowerLegsAndFeet(framing)
        ? `Pelvis weighted steadily onto the ${surfaceLabel} with balanced upper torso and feet anchored comfortably on the floor beneath.`
        : `Pelvis weighted steadily onto the ${surfaceLabel} with balanced upright upper-torso posture.`,
      centerOfMassNotes:
        seatedSurface === 'bed_edge'
          ? 'Subtle localized mattress indentation strictly beneath seated pelvis weight.'
          : 'Stable vertical load path through rigid chair/stool frame.',
    };
  } else if (postureType === 'leaning') {
    const leanTarget =
      supportObject === 'vanity'
        ? 'visible bedroom vanity table edge'
        : 'visible adjacent bedroom wall';
    gravityBalance = {
      postureType,
      weightDistribution: isFramingShowingThighs(framing)
        ? `Roughly 70% weight through the supporting hip/thighs and 30% lateral brace transferred into the ${leanTarget}.`
        : `Natural weight distribution braced laterally with calm shoulder contact against the ${leanTarget}.`,
      centerOfMassNotes:
        'Natural counter-tilt of shoulders so body remains effortlessly balanced against the support.',
    };
  } else {
    const isContrapposto =
      stance === 'contrapposto_weight_shift' ||
      pose === 'pose_contrapposto_70' ||
      pose === 'pose_contrapposto_standing';
    gravityBalance = {
      postureType: 'standing',
      weightDistribution: !isFramingShowingThighs(framing)
        ? 'Balanced, relaxed upright upper-torso alignment with natural shoulder poise and zero stiff symmetry.'
        : isContrapposto
          ? 'Approximately 70% weight settled over one supporting side with the opposite side softly relaxed and slight natural shoulder counter-balance.'
          : stance === 'one_foot_forward' || pose === 'pose_one_foot_forward_knee_bend'
            ? isFramingShowingLowerLegsAndFeet(framing)
              ? 'Weight grounded securely over the rear supporting leg while the forward foot rests lightly with a soft knee bend.'
              : 'Weight grounded comfortably over the supporting side in a natural staggered stance.'
            : 'Even, natural upright weight distribution without rigid stiffness.',
      centerOfMassNotes: isFramingShowingLowerLegsAndFeet(framing)
        ? 'Center of gravity stays cleanly over base of support; visible footwear/feet flush on the floor.'
        : 'Center of gravity stays balanced cleanly over the torso support axis.',
    };
  }

  // 2. Joint kinematics (filtered safely by crop framing)
  const joints: JointKinematicsProfile = {
    neck:
      s.mirrorGaze === 'gaze_phone_screen'
        ? 'gentle downward cervical tilt (10–20 degrees) toward phone screen reflection without chin compression'
        : 'relaxed neutral neck aligned with spine turning slightly toward mirror lens',
    shoulders:
      isLeaning && supportObject === 'wall'
        ? 'support-side shoulder braced calmly against wall; opposite shoulder relaxed and level'
        : 'natural relaxed shoulder slope with modest elevation only on the phone-holding side',
    elbows:
      phoneHand === 'both_hands'
        ? 'both elbows comfortably flexed (85–105 degrees) near ribcage'
        : `phone-holding elbow flexed naturally (85–110 degrees); free elbow gently relaxed (${freeHandAction === 'none_relaxed' ? 'slight natural carry angle' : 'positioned cleanly for the free-hand task'})`,
    wrists:
      'neutral ergonomic wrist angles gripping the phone bezel securely without hyperextension or twisted fingers',
    spine:
      postureType === 'seated'
        ? 'soft natural lumbar curve supporting upright seated posture'
        : 'natural anatomical spinal S-curve matching pelvic balance without forced arching',
    hips: isFramingShowingMidsection(framing)
      ? postureType === 'standing' && stance === 'contrapposto_weight_shift'
        ? 'natural subtle pelvic tilt over the weight-bearing side'
        : 'balanced natural hip alignment'
      : 'outside visible tight crop',
    ...(isFramingShowingThighs(framing)
      ? {
          knees:
            postureType === 'seated' || postureType === 'floor_seated'
              ? 'flexed naturally at ~90 degrees for seated support with visible thigh clearance'
              : stance === 'soft_knee_bend' || stance === 'one_foot_forward'
                ? 'weight-bearing knee straight without locking; relaxed knee softly flexed (~10–20 degrees)'
                : 'natural relaxed knee alignment without hyperextension',
        }
      : {}),
    ...(isFramingShowingLowerLegsAndFeet(framing)
      ? {
          ankles:
            pose === 'pose_wall_lean_scurve'
              ? 'supporting ankle grounded flat on floor; bent-knee sole braced flat against the visible wall'
              : 'ankles aligned comfortably with weight-bearing foot planted flat on the floor',
        }
      : {}),
  };

  // 3. Phone-holding optics & anatomical vs mirror side clarity
  const phoneHandOptics = buildPhoneHandOpticsState(
    phoneHand,
    phonePosition,
    torsoOrientation
  );

  // 4. Visible Contact Points
  const visibleContactPoints: string[] = [
    phoneHand === 'both_hands'
      ? 'fingers of both hands gripping edges of the single physical smartphone'
      : `fingers of the anatomical ${phoneHand === 'left_hand' ? 'left' : 'right'} hand gripping the single physical smartphone`,
  ];
  if (isFramingShowingLowerLegsAndFeet(framing) && postureType === 'standing') {
    visibleContactPoints.push('soles/footwear grounded flat on bedroom floor');
  }
  if (postureType === 'seated') {
    if (seatedSurface === 'bed_edge') {
      visibleContactPoints.push('seated thighs/pelvis compressing the visible mattress edge');
      if (pose === 'pose_bed_edge_dynamic') {
        visibleContactPoints.push('phone-arm elbow braced lightly on thigh and free palm resting on bedsheets');
      }
    } else {
      visibleContactPoints.push(`seated body resting naturally on visible ${seatedSurface}`);
    }
  }
  if (supportObject === 'wall') {
    visibleContactPoints.push('shoulder/upper back making light contact with visible bedroom wall');
  } else if (supportObject === 'vanity') {
    visibleContactPoints.push('hip/forearm lightly resting against visible vanity table edge');
  } else if (supportObject === 'mirror_glass' && phoneHand !== 'both_hands') {
    visibleContactPoints.push('free-hand fingertips resting gently against visible mirror glass');
  } else if (supportObject === 'coffee_mug' && phoneHand !== 'both_hands') {
    visibleContactPoints.push('free hand wrapped naturally around plain ceramic coffee mug');
  } else if (supportObject === 'open_book' && phoneHand !== 'both_hands') {
    visibleContactPoints.push('free hand cradling an open book');
  } else if (supportObject === 'perfume_bottle' && phoneHand !== 'both_hands') {
    visibleContactPoints.push('free hand gripping a small perfume bottle');
  }
  if (postureType === 'floor_seated') {
    visibleContactPoints.push('seated legs/pelvis grounded cleanly on bedroom floor/rug');
    if (pose === 'pose_floor_sitting_bed' && supportObject === 'bed_edge') {
      visibleContactPoints.push('upper back resting lightly against the visible bed frame');
    }
  }

  // 5. Garment physics & pocket validation
  const upperGarment: UpperGarmentType = s.upperGarment || 'crew_neck_tshirt';
  const upperMaterial: UpperGarmentMaterialType =
    s.upperGarmentMaterial || 'cotton_jersey';
  const upperFit: UpperGarmentFitType = s.upperGarmentFit || 'regular';
  const upperPattern: UpperGarmentPatternType = s.upperGarmentPattern || 'solid';

  const lowerGarment: LowerGarmentType = s.lowerGarment || 'relaxed_trousers';
  const lowerMaterial: LowerGarmentMaterialType =
    s.lowerGarmentMaterial || 'cotton_twill';
  const lowerFit: LowerGarmentFitType = s.lowerGarmentFit || 'relaxed';
  const lowerPattern: LowerGarmentPatternType = s.lowerGarmentPattern || 'solid';

  const lowerHasPockets =
    s.lowerGarment !== undefined &&
    s.lowerGarment !== 'preserve_reference' &&
    doesLowerGarmentHavePockets(lowerGarment);
  const upperHasChestOrSidePocket =
    s.upperGarment !== undefined &&
    s.upperGarment !== 'preserve_reference' &&
    doesUpperGarmentHavePocket(upperGarment);

  const pocketInteractionAllowed =
    freeHandAction !== 'hand_at_hip_or_pocket' ||
    (isFramingShowingMidsection(framing) &&
      (lowerHasPockets || s.workflowMode !== 'mirror_studio'));

  const pocketAdaptationReasonAr =
    freeHandAction === 'hand_at_hip_or_pocket' && !lowerHasPockets
      ? 'القطعة السفلية المختارة قد لا تحتوي على جيوب؛ تم توجيه اليد للراحة على الجانب/الخصر خارجيًا دون اختراع جيوب.'
      : undefined;

  const upperPoseCouplingPhrase = buildPoseCoupledUpperFabricPhysics({
    garment: upperGarment,
    colorPhrase: s.upperGarmentColor || 'selected shade',
    material: upperMaterial,
    fit: upperFit,
    pattern: upperPattern,
    framing,
    phoneHand,
    phonePosition,
    freeHandAction,
    supportObject,
    postureType,
  });

  const lowerPoseCouplingPhrase = buildPoseCoupledLowerFabricPhysics({
    garment: lowerGarment,
    colorPhrase: s.lowerGarmentColor || 'selected shade',
    material: lowerMaterial,
    fit: lowerFit,
    pattern: lowerPattern,
    framing,
    freeHandAction,
    postureType,
  });

  // 6. Optical & lighting physics
  const phoneProfile: PhoneProcessingProfile =
    s.phoneProcessingProfile || 'natural_phone';
  const lightingSource: LightingSource =
    s.lighting === 'mode_a_phone_screen_dark'
      ? 'screen_only'
      : s.lighting === 'mode_b_phone_flash_mirror_dark'
        ? 'direct_flash'
        : s.workflowMode === 'mirror_studio'
          ? 'direct_flash'
          : (s.lighting as LightingSource);

  const flashMode: OpticalAndLightingPhysicsState['flashMode'] =
    phoneProfile === 'night_mode'
      ? 'night_mode'
      : lightingSource === 'screen_only'
        ? 'screen_only'
        : lightingSource === 'direct_flash'
          ? 'direct_flash'
          : 'ambient';

  const mirrorDistanceBand: OpticalAndLightingPhysicsState['mirrorDistanceBand'] =
    lensSpec.equivalentFocalLengthMm >= 70
      ? 'stepped_back_telephoto'
      : supportObject === 'mirror_glass' || framing === 'head_and_shoulders'
        ? 'close_arm_length'
        : 'moderate_half_room';

  let flashGeometryClause = '';
  if (flashMode === 'night_mode') {
    flashGeometryClause =
      'Steady night-mode multi-frame ambient capture with zero camera flash, smooth shadow roll-off, and no harsh specular flare.';
  } else if (flashMode === 'screen_only') {
    flashGeometryClause =
      'Dark room illuminated strictly by local soft smartphone screen light falling off naturally with distance; zero flash flare or room lamps.';
  } else if (flashMode === 'direct_flash') {
    flashGeometryClause =
      s.flashMirrorGeometry === 'angled_reflection'
        ? 'Direct rear flash fired at an off-axis angle relative to the mirror normal so direct glare misses the lens axis while still casting crisp directional flash falloff and behind-subject shadow.'
        : s.flashMirrorGeometry === 'partial_face_occlusion'
          ? 'Direct rear flash bouncing cleanly off the mirror surface with plausible partial glare or phone occlusion across only part of the lower face, preserving recognizable facial geometry and crisp behind-subject shadows.'
          : 'Direct rear LED flash illuminating foreground first with natural flash falloff with distance, crisp behind-subject cast shadow, and geometry-consistent mirror specular reflection only where reflection angle aligns with the camera.';
  } else {
    flashGeometryClause =
      'Single coherent ambient bedroom light source casting consistent directional highlights and soft contact shadows.';
  }

  const { lockedConflicts } = evaluateLockedMirrorConflicts(s);

  const causalitySummary = [
    gravityBalance.weightDistribution,
    phoneHandOptics.anatomicalHoldClause + ', ' + phoneHandOptics.mirrorReflectionSideClause,
    visibleContactPoints.length > 0
      ? `Physical contacts strictly limited to: ${visibleContactPoints.join('; ')}.`
      : '',
    flashGeometryClause,
  ]
    .filter(Boolean)
    .join(' ');

  return {
    gravityBalance,
    joints,
    phoneHandOptics,
    visibleContactPoints,
    garmentPhysics: {
      upperStiffnessClass: getUpperMaterialStiffnessClass(upperMaterial),
      lowerStiffnessClass: getLowerMaterialStiffnessClass(lowerMaterial),
      lowerHasPockets,
      upperHasChestOrSidePocket,
      pocketInteractionAllowed,
      pocketAdaptationReasonAr,
      upperPoseCouplingPhrase,
      lowerPoseCouplingPhrase,
    },
    opticalLighting: {
      lensFocalMm: lensSpec.equivalentFocalLengthMm,
      mirrorDistanceBand,
      visibleCropZone: getVisibleCropZone(framing),
      cropForbiddenRegions: getCropForbiddenRegions(framing),
      flashMode,
      flashGeometryClause,
    },
    lockedConflicts,
    causalitySummary,
  };
}
