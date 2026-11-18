import {
  BACKGROUND_OPTIONS,
  CAMERA_ANGLE_OPTIONS,
  CameraMode,
  CaptureArtifactType,
  CLOTHING_COLOR_OPTIONS,
  CLOTHING_OPTIONS,
  ClothingEditSpec,
  CONCISE_REFERENCE_FACE_PRESERVATION_RULE,
  DEFAULT_SELECTIONS,
  EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION as BASE_EXPERT_SYSTEM_INSTRUCTION,
  ExposurePreference,
  EXPRESSION_OPTIONS,
  FLASH_MIRROR_GEOMETRY_OPTIONS,
  FocusTarget,
  FRAMING_OPTIONS,
  FramingType,
  GAZE_OPTIONS,
  HAIR_OPTIONS,
  IMAGE_TREATMENT_OPTIONS,
  LIGHTING_OPTIONS,
  LightingSource,
  LOWER_BODY_COLOR_OPTIONS,
  LOWER_GARMENT_COLOR_OPTIONS,
  LOWER_GARMENT_FIT_OPTIONS,
  LOWER_GARMENT_MATERIAL_OPTIONS,
  LOWER_GARMENT_OPTIONS,
  LOWER_GARMENT_PATTERN_OPTIONS,
  LowerGarmentColorType,
  LowerGarmentFitType,
  LowerGarmentMaterialType,
  LowerGarmentPatternType,
  LowerGarmentType,
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
  MirrorBottomClothingType,
  MirrorFreeHandActionType,
  MirrorGazeType,
  MirrorLensProfileType,
  MirrorLensSpec,
  MirrorMovementMomentType,
  MirrorPhonePositionType,
  MirrorPoseCompositionSpec,
  MirrorPoseEnergyType,
  MirrorPoseType,
  MirrorStanceType,
  MirrorSupportObjectType,
  MirrorTorsoOrientationType,
  NormalizedGarmentEditSpec,
  PHONE_COLOR_OPTIONS,
  PHONE_HAND_OPTIONS,
  PhoneHandType,
  PhoneProcessingProfile,
  PHOTO_VIBE_OPTIONS,
  PHYSICAL_CAUSALITY_RULE,
  POSE_OPTIONS,
  PoseType,
  PromptFallbackReason,
  PromptGenerationDiagnostics,
  PromptGenerationSource,
  REFERENCE_FACE_PRESERVATION_RULE,
  ReferenceImageAnalysis,
  ROOM_COLOR_OPTIONS,
  ROOM_STYLE_OPTIONS,
  ROOM_TIDINESS_OPTIONS,
  SCREEN_ORIENTATION_OPTIONS,
  SelfieSelections,
  SKIN_TEXTURE_OPTIONS,
  StrictLowerClothingMode,
  StructuredSceneConfig,
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
  XIAOMI_15_ULTRA_LENS_PROFILES,
} from '../types/selfie';
import {
  BiomechanicsSolution,
  buildPhoneHandOpticsState,
  buildPoseCoupledLowerFabricPhysics,
  buildPoseCoupledUpperFabricPhysics,
  evaluateLockedMirrorConflicts,
  isFramingShowingLowerLegsAndFeet,
  isFramingShowingMidsection,
  isFramingShowingThighs,
  LockableSelectionField,
  LockedFieldConflict,
  MIRROR_POSE_CATEGORY_LIST,
  MirrorPoseCategoryId,
  solveBiomechanicsAndPhysics,
} from './physicsEngine';

export {
  CONCISE_REFERENCE_FACE_PRESERVATION_RULE,
  evaluateLockedMirrorConflicts,
  MIRROR_POSE_CATEGORY_LIST,
  PHYSICAL_CAUSALITY_RULE,
  REFERENCE_FACE_PRESERVATION_RULE,
  solveBiomechanicsAndPhysics,
};

export type {
  BiomechanicsSolution,
  LockableSelectionField,
  LockedFieldConflict,
  MirrorPoseCategoryId,
};

/**
 * Arabic-to-English dictionary for common user-entered custom details
 * so offline/deterministic prompt generation translates user-supplied Arabic inputs smoothly
 * without inventing details that were not provided.
 */
const ARABIC_SCENE_TRANSLATIONS: Array<[RegExp, string]> = [
  [
    /سيلفي يومي عفوي داخل غرفة نوم عادية في السعودية/g,
    'an everyday candid selfie inside an ordinary bedroom in Saudi Arabia',
  ],
  [
    /سيلفي يومي عفوي داخل غرفة نوم هادئة/g,
    'an everyday candid selfie inside a quiet bedroom',
  ],
  [/سيلفي صباحي|صباحي/g, 'a natural morning selfie'],
  [/سيلفي مسائي|مسائي|ليلي/g, 'an evening indoor selfie'],
  [/بعد التمرين|رياضي/g, 'a casual post-workout indoor moment'],
  [/في الرياض|بالرياض|الرياض/g, 'in Riyadh, Saudi Arabia'],
  [/في جدة|بجدة|جدة/g, 'in Jeddah, Saudi Arabia'],
  [/في السعودية|بالسعودية|السعودية/g, 'in Saudi Arabia'],
  [/ثوب سعودي|ثوب/g, 'a traditional Saudi thobe'],
  [/نظارة طبية|نظارات طبية|نظارة/g, 'a pair of prescription glasses'],
  [/ساعة يد|ساعة/g, 'a simple wristwatch'],
  [/كتاب|كتب/g, 'a book resting nearby'],
  [/نبات|نباتات|زرع/g, 'a small indoor potted plant'],
  [/لوحة فنية|لوحة/g, 'a framed minimalist wall art piece'],
  [/سجادة|فرش/g, 'a soft woven area rug'],
  [/وسائد|مخدات/g, 'plush decorative pillows'],
  [/بطانية|غطاء/g, 'a textured knit throw blanket'],
  [/كوب قهوة|فنجان قهوة|قهوة/g, 'a ceramic coffee mug on the nightstand'],
  [/قميص|تشيرت/g, 'a casual cotton shirt'],
  [/جاكيت|سترة/g, 'a light indoor cardigan'],
  [/أخضر|خضراء|زيتوني/g, 'subdued olive green'],
  [/أحمر|حمراء|عنابي/g, 'muted burgundy'],
  [/بني|بنية/g, 'deep warm brown'],
  [/ذهبي/g, 'matte gold'],
  [/وردي/g, 'muted dusty rose'],
  [/كحلي|أزرق داكن/g, 'deep navy blue'],
  [/رمادي داكن|فحمي/g, 'dark charcoal gray'],
];

const DISALLOWED_PATTERNS: RegExp[] = [
  /ignore previous|system prompt|override|jailbreak/gi,
  /nude|naked|lingerie|sexy|sensual|erotic|provocative|nsfw/gi,
  /عاري|عارية|مثير|اباحي|جنسي|ملابس داخلية/g,
  /child|kid|minor|teenager|underage|baby/gi,
  /طفل|أطفال|قاصر|صغير السن/g,
  /whiten skin|lighten skin|bleach skin|تفتيح البشرة|تبييض البشرة/gi,
  /change age|make younger|make older|تغيير العمر|تصغير العمر/gi,
  /slim body|reshape body|تغيير شكل الجسم|تنحيف الجسم/gi,
  /other people|another person|crowd|couple|شخص آخر|أشخاص آخرين|صديق/gi,
];

function findPhrase<T extends string>(
  options: { value: T; enPhrase: string }[],
  value: T
): string {
  return options.find((o) => o.value === value)?.enPhrase ?? '';
}

/**
 * Sanitizes custom user input, removing disallowed or conflicting instructions
 * and translating common Arabic scene descriptors into natural English.
 */
export function sanitizeCustomText(raw: string): string {
  if (!raw || !raw.trim()) return '';
  let cleaned = raw.trim();

  for (const pattern of DISALLOWED_PATTERNS) {
    cleaned = cleaned.replace(pattern, '');
  }

  cleaned = cleaned.replace(/["'`#*{}[\]\\]/g, ' ').replace(/\s+/g, ' ').trim();
  if (!cleaned) return '';

  if (/[\u0600-\u06FF]/.test(cleaned)) {
    const translatedParts: string[] = [];
    for (const [regex, en] of ARABIC_SCENE_TRANSLATIONS) {
      regex.lastIndex = 0;
      if (regex.test(cleaned)) {
        translatedParts.push(en);
      }
    }
    const englishOnly = cleaned
      .replace(/[\u0600-\u06FF،؛؟]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    if (englishOnly && translatedParts.length > 0) {
      return `${englishOnly}, ${translatedParts.join(', ')}`;
    }
    if (translatedParts.length > 0) {
      return translatedParts.join(', ');
    }
    return englishOnly;
  }

  return cleaned.slice(0, 200);
}

/**
 * Resolves the English description for Rule [02] Lower-Body Clothing Color.
 */
export function resolveLowerBodyColorPhrase(
  selections: SelfieSelections
): string {
  const customLower = sanitizeCustomText(selections.customLowerBodyColorText);
  if (selections.lowerBodyColor === 'custom_lower_color' && customLower) {
    return customLower;
  }
  return (
    findPhrase(LOWER_BODY_COLOR_OPTIONS, selections.lowerBodyColor) ||
    'a restrained, naturally coordinated tone appropriate to the existing outfit'
  );
}

const UPPER_GARMENT_MATERIAL_MATRIX: Record<
  UpperGarmentType,
  UpperGarmentMaterialType[]
> = {
  preserve_reference: ['cotton_jersey'],
  crew_neck_tshirt: [
    'cotton_jersey',
    'ribbed_cotton',
    'linen_cotton_blend',
    'waffle_knit',
  ],
  long_sleeve_tshirt: [
    'cotton_jersey',
    'ribbed_cotton',
    'waffle_knit',
    'linen_cotton_blend',
  ],
  henley: [
    'cotton_jersey',
    'waffle_knit',
    'ribbed_cotton',
    'linen_cotton_blend',
  ],
  polo_shirt: [
    'cotton_jersey',
    'ribbed_cotton',
    'cotton_poplin',
    'knit',
    'linen_cotton_blend',
  ],
  button_up_shirt: [
    'cotton_poplin',
    'linen_cotton_blend',
    'chambray_denim',
    'flannel',
  ],
  flannel_shirt: ['flannel', 'cotton_poplin', 'chambray_denim'],
  sweatshirt: ['french_terry', 'fleece', 'waffle_knit', 'cotton_jersey'],
  hoodie: ['fleece', 'french_terry', 'cotton_jersey'],
  cardigan: [
    'knit',
    'ribbed_cotton',
    'waffle_knit',
    'french_terry',
    'linen_cotton_blend',
  ],
  knit_sweater: ['knit', 'waffle_knit', 'ribbed_cotton'],
  pajama_top: [
    'cotton_poplin',
    'cotton_jersey',
    'flannel',
    'linen_cotton_blend',
    'waffle_knit',
    'french_terry',
  ],
  modest_lounge_top: [
    'cotton_jersey',
    'ribbed_cotton',
    'french_terry',
    'waffle_knit',
    'linen_cotton_blend',
    'knit',
    'cotton_poplin',
  ],
  lightweight_overshirt: [
    'chambray_denim',
    'flannel',
    'cotton_poplin',
    'linen_cotton_blend',
    'french_terry',
  ],
  custom_upper_garment: [
    'cotton_jersey',
    'ribbed_cotton',
    'french_terry',
    'fleece',
    'cotton_poplin',
    'flannel',
    'knit',
    'linen_cotton_blend',
    'waffle_knit',
    'chambray_denim',
  ],
};

const UPPER_GARMENT_FIT_MATRIX: Record<UpperGarmentType, UpperGarmentFitType[]> = {
  preserve_reference: ['regular'],
  crew_neck_tshirt: ['regular', 'relaxed', 'oversized', 'fitted'],
  long_sleeve_tshirt: ['regular', 'relaxed', 'oversized', 'fitted'],
  henley: ['regular', 'relaxed', 'fitted'],
  polo_shirt: ['regular', 'relaxed', 'fitted'],
  button_up_shirt: ['regular', 'relaxed', 'oversized', 'fitted'],
  flannel_shirt: ['regular', 'relaxed', 'oversized'],
  sweatshirt: ['regular', 'relaxed', 'oversized'],
  hoodie: ['regular', 'relaxed', 'oversized'],
  cardigan: ['regular', 'relaxed', 'oversized'],
  knit_sweater: ['regular', 'relaxed', 'oversized', 'fitted'],
  pajama_top: ['regular', 'relaxed', 'oversized'],
  modest_lounge_top: ['regular', 'relaxed', 'oversized'],
  lightweight_overshirt: ['regular', 'relaxed', 'oversized'],
  custom_upper_garment: ['regular', 'relaxed', 'oversized', 'fitted'],
};

const UPPER_GARMENT_PATTERN_MATRIX: Record<
  UpperGarmentType,
  UpperGarmentPatternType[]
> = {
  preserve_reference: ['solid'],
  crew_neck_tshirt: ['solid', 'stripes', 'subtle_texture'],
  long_sleeve_tshirt: ['solid', 'stripes', 'subtle_texture'],
  henley: ['solid', 'stripes', 'subtle_texture'],
  polo_shirt: ['solid', 'stripes', 'subtle_texture'],
  button_up_shirt: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  flannel_shirt: ['plaid', 'solid', 'stripes', 'subtle_texture'],
  sweatshirt: ['solid', 'stripes', 'subtle_texture'],
  hoodie: ['solid', 'subtle_texture'],
  cardigan: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  knit_sweater: ['solid', 'stripes', 'subtle_texture'],
  pajama_top: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  modest_lounge_top: ['solid', 'stripes', 'subtle_texture'],
  lightweight_overshirt: ['solid', 'plaid', 'stripes', 'subtle_texture'],
  custom_upper_garment: ['solid', 'stripes', 'plaid', 'subtle_texture'],
};

export function getCompatibleMaterialsForGarment(
  garment: UpperGarmentType
): UpperGarmentMaterialType[] {
  return UPPER_GARMENT_MATERIAL_MATRIX[garment] || ['cotton_jersey'];
}

export function getCompatibleFitsForGarment(
  garment: UpperGarmentType
): UpperGarmentFitType[] {
  return UPPER_GARMENT_FIT_MATRIX[garment] || ['regular', 'relaxed'];
}

export function getCompatiblePatternsForGarment(
  garment: UpperGarmentType
): UpperGarmentPatternType[] {
  return UPPER_GARMENT_PATTERN_MATRIX[garment] || ['solid', 'subtle_texture'];
}

function mapLegacyColorToUpperColor(
  color?: SelfieSelections['clothingColor']
): UpperGarmentColorType {
  switch (color) {
    case 'preserve_reference':
      return 'preserve_reference';
    case 'white':
      return 'white';
    case 'black':
      return 'black';
    case 'gray':
      return 'light_gray';
    case 'blue':
      return 'navy';
    case 'custom_color':
      return 'custom_upper_color';
    case 'beige':
    default:
      return 'beige';
  }
}

export function getEffectiveUpperClothingState(
  selections: Partial<SelfieSelections>
): {
  isPreservingUpper: boolean;
  isExplicitStructuredUpper: boolean;
  upperGarment: UpperGarmentType;
  upperGarmentColor: UpperGarmentColorType;
  upperGarmentMaterial: UpperGarmentMaterialType;
  upperGarmentFit: UpperGarmentFitType;
  upperGarmentPattern: UpperGarmentPatternType;
  compatibleMaterials: UpperGarmentMaterialType[];
  compatibleFits: UpperGarmentFitType[];
  compatiblePatterns: UpperGarmentPatternType[];
} {
  const workflowMode = selections.workflowMode ?? DEFAULT_SELECTIONS.workflowMode;
  const legacyClothing = selections.clothing ?? DEFAULT_SELECTIONS.clothing;
  const legacyColor = selections.clothingColor ?? DEFAULT_SELECTIONS.clothingColor;
  const mirrorClothing =
    selections.mirrorClothing ?? DEFAULT_SELECTIONS.mirrorClothing;

  let defaultGarment: UpperGarmentType = 'crew_neck_tshirt';
  let defaultColor: UpperGarmentColorType = mapLegacyColorToUpperColor(legacyColor);
  let defaultMaterial: UpperGarmentMaterialType = 'cotton_jersey';
  let defaultFit: UpperGarmentFitType = 'regular';
  const defaultPattern: UpperGarmentPatternType = 'solid';

  if (workflowMode === 'strict_editing') {
    if (!selections.strictUpperClothingEditEnabled) {
      return {
        isPreservingUpper: true,
        isExplicitStructuredUpper: false,
        upperGarment: 'preserve_reference',
        upperGarmentColor: 'preserve_reference',
        upperGarmentMaterial: 'cotton_jersey',
        upperGarmentFit: 'regular',
        upperGarmentPattern: 'solid',
        compatibleMaterials: ['cotton_jersey'],
        compatibleFits: ['regular'],
        compatiblePatterns: ['solid'],
      };
    }
    defaultColor = 'navy';
  } else if (workflowMode === 'mirror_studio') {
    if (mirrorClothing === 'dark_oversized_hoodie') {
      defaultGarment = 'hoodie';
      defaultColor = 'charcoal';
      defaultMaterial = 'fleece';
      defaultFit = 'oversized';
    } else if (mirrorClothing === 'ribbed_tank_top') {
      defaultGarment = 'modest_lounge_top';
      defaultColor = 'white';
      defaultMaterial = 'ribbed_cotton';
      defaultFit = 'regular';
    } else if (mirrorClothing === 'loose_silk_sleepwear') {
      defaultGarment = 'pajama_top';
      defaultColor = 'ivory';
      defaultMaterial = 'cotton_poplin';
      defaultFit = 'relaxed';
    } else {
      defaultGarment = 'crew_neck_tshirt';
      defaultColor = 'white';
      defaultMaterial = 'cotton_jersey';
      defaultFit = 'regular';
    }
  } else {
    if (legacyClothing === 'preserve_reference') {
      defaultGarment = 'preserve_reference';
      defaultColor = 'preserve_reference';
    } else if (legacyClothing === 'hoodie_and_pants') {
      defaultGarment = 'hoodie';
      defaultMaterial = 'fleece';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'modest_pajamas') {
      defaultGarment = 'pajama_top';
      defaultMaterial = 'cotton_poplin';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'simple_loungewear') {
      defaultGarment = 'modest_lounge_top';
      defaultMaterial = 'cotton_jersey';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'white_cotton_tshirt') {
      defaultGarment = 'crew_neck_tshirt';
      defaultColor = 'white';
      defaultMaterial = 'cotton_jersey';
      defaultFit = 'regular';
    } else if (legacyClothing === 'dark_oversized_hoodie') {
      defaultGarment = 'hoodie';
      defaultColor = 'charcoal';
      defaultMaterial = 'fleece';
      defaultFit = 'oversized';
    } else if (legacyClothing === 'ribbed_tank_top') {
      defaultGarment = 'modest_lounge_top';
      defaultMaterial = 'ribbed_cotton';
    } else if (legacyClothing === 'loose_silk_sleepwear') {
      defaultGarment = 'pajama_top';
      defaultMaterial = 'cotton_poplin';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'custom_clothing') {
      defaultGarment = 'custom_upper_garment';
    }
  }

  const isExplicitStructuredUpper =
    selections.upperGarment !== undefined ||
    selections.upperGarmentColor !== undefined ||
    selections.upperGarmentMaterial !== undefined ||
    selections.upperGarmentFit !== undefined ||
    selections.upperGarmentPattern !== undefined;

  let resolvedGarment: UpperGarmentType =
    selections.upperGarment ?? defaultGarment;
  if (
    workflowMode === 'scene_builder' &&
    selections.upperGarment === undefined &&
    legacyClothing === 'preserve_reference'
  ) {
    resolvedGarment = 'preserve_reference';
  }

  const isPreservingUpper = resolvedGarment === 'preserve_reference';
  if (isPreservingUpper) {
    return {
      isPreservingUpper: true,
      isExplicitStructuredUpper,
      upperGarment: 'preserve_reference',
      upperGarmentColor: 'preserve_reference',
      upperGarmentMaterial: 'cotton_jersey',
      upperGarmentFit: 'regular',
      upperGarmentPattern: 'solid',
      compatibleMaterials: ['cotton_jersey'],
      compatibleFits: ['regular'],
      compatiblePatterns: ['solid'],
    };
  }

  const compatibleMaterials = getCompatibleMaterialsForGarment(resolvedGarment);
  const compatibleFits = getCompatibleFitsForGarment(resolvedGarment);
  const compatiblePatterns = getCompatiblePatternsForGarment(resolvedGarment);

  const requestedMaterial =
    selections.upperGarmentMaterial ??
    (compatibleMaterials.includes(defaultMaterial)
      ? defaultMaterial
      : compatibleMaterials[0]);
  const resolvedMaterial = compatibleMaterials.includes(requestedMaterial)
    ? requestedMaterial
    : compatibleMaterials[0];

  const requestedFit =
    selections.upperGarmentFit ??
    (compatibleFits.includes(defaultFit) ? defaultFit : compatibleFits[0]);
  const resolvedFit = compatibleFits.includes(requestedFit)
    ? requestedFit
    : compatibleFits.includes('relaxed')
      ? 'relaxed'
      : compatibleFits[0];

  const requestedPattern =
    selections.upperGarmentPattern ??
    (compatiblePatterns.includes(defaultPattern)
      ? defaultPattern
      : compatiblePatterns[0]);
  const resolvedPattern = compatiblePatterns.includes(requestedPattern)
    ? requestedPattern
    : compatiblePatterns[0];

  const requestedColor =
    selections.upperGarmentColor ??
    (defaultColor === 'preserve_reference' ? 'beige' : defaultColor);
  const resolvedColor: UpperGarmentColorType =
    requestedColor === 'preserve_reference' ? 'beige' : requestedColor;

  return {
    isPreservingUpper: false,
    isExplicitStructuredUpper,
    upperGarment: resolvedGarment,
    upperGarmentColor: resolvedColor,
    upperGarmentMaterial: resolvedMaterial,
    upperGarmentFit: resolvedFit,
    upperGarmentPattern: resolvedPattern,
    compatibleMaterials,
    compatibleFits,
    compatiblePatterns,
  };
}

const LOWER_GARMENT_MATERIAL_MATRIX: Record<
  LowerGarmentType,
  LowerGarmentMaterialType[]
> = {
  preserve_reference: ['cotton_twill'],
  tailored_trousers: ['wool_blend_suiting', 'cotton_twill', 'linen_cotton_blend'],
  relaxed_trousers: ['cotton_twill', 'linen_cotton_blend', 'wool_blend_suiting', 'cotton_poplin'],
  chinos: ['cotton_twill', 'linen_cotton_blend'],
  jeans: ['denim'],
  sweatpants: ['fleece', 'french_terry', 'cotton_jersey'],
  joggers: ['french_terry', 'fleece', 'cotton_twill', 'nylon_track_weave'],
  lounge_pants: ['cotton_jersey', 'french_terry', 'linen_cotton_blend', 'ribbed_knit', 'cotton_poplin'],
  pajama_pants: ['cotton_poplin', 'cotton_jersey', 'linen_cotton_blend', 'fleece'],
  track_pants: ['nylon_track_weave', 'french_terry', 'cotton_jersey'],
  athletic_shorts: ['athletic_mesh', 'nylon_track_weave', 'french_terry'],
  modest_shorts: ['cotton_twill', 'linen_cotton_blend', 'french_terry', 'denim'],
  midi_long_skirt: ['cotton_poplin', 'linen_cotton_blend', 'ribbed_knit', 'denim', 'wool_blend_suiting'],
  custom_lower_garment: [
    'cotton_twill',
    'denim',
    'fleece',
    'french_terry',
    'cotton_jersey',
    'cotton_poplin',
    'linen_cotton_blend',
    'wool_blend_suiting',
    'athletic_mesh',
    'nylon_track_weave',
    'ribbed_knit',
  ],
};

const LOWER_GARMENT_FIT_MATRIX: Record<LowerGarmentType, LowerGarmentFitType[]> = {
  preserve_reference: ['regular'],
  tailored_trousers: ['regular', 'straight', 'tapered', 'relaxed'],
  relaxed_trousers: ['relaxed', 'straight', 'wide_leg', 'regular'],
  chinos: ['regular', 'straight', 'tapered', 'relaxed'],
  jeans: ['regular', 'straight', 'relaxed', 'tapered', 'wide_leg', 'loose_baggy'],
  sweatpants: ['relaxed', 'regular', 'straight', 'loose_baggy'],
  joggers: ['tapered', 'regular', 'relaxed'],
  lounge_pants: ['relaxed', 'wide_leg', 'straight', 'regular'],
  pajama_pants: ['relaxed', 'straight', 'wide_leg', 'loose_baggy'],
  track_pants: ['relaxed', 'straight', 'tapered', 'loose_baggy'],
  athletic_shorts: ['regular', 'relaxed', 'loose_baggy'],
  modest_shorts: ['regular', 'relaxed', 'straight'],
  midi_long_skirt: ['regular', 'relaxed', 'wide_leg'],
  custom_lower_garment: ['regular', 'relaxed', 'straight', 'tapered', 'wide_leg', 'loose_baggy'],
};

const LOWER_GARMENT_PATTERN_MATRIX: Record<
  LowerGarmentType,
  LowerGarmentPatternType[]
> = {
  preserve_reference: ['solid'],
  tailored_trousers: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  relaxed_trousers: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  chinos: ['solid', 'subtle_texture'],
  jeans: ['solid', 'washed_fade', 'subtle_texture'],
  sweatpants: ['solid', 'subtle_texture'],
  joggers: ['solid', 'subtle_texture', 'side_stripe'],
  lounge_pants: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  pajama_pants: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  track_pants: ['solid', 'side_stripe', 'subtle_texture'],
  athletic_shorts: ['solid', 'side_stripe', 'subtle_texture'],
  modest_shorts: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  midi_long_skirt: ['solid', 'stripes', 'plaid', 'subtle_texture'],
  custom_lower_garment: ['solid', 'subtle_texture', 'stripes', 'plaid', 'washed_fade', 'side_stripe'],
};

export function getCompatibleMaterialsForLowerGarment(
  garment: LowerGarmentType
): LowerGarmentMaterialType[] {
  return LOWER_GARMENT_MATERIAL_MATRIX[garment] || ['cotton_twill'];
}

export function getCompatibleFitsForLowerGarment(
  garment: LowerGarmentType
): LowerGarmentFitType[] {
  return LOWER_GARMENT_FIT_MATRIX[garment] || ['regular', 'relaxed'];
}

export function getCompatiblePatternsForLowerGarment(
  garment: LowerGarmentType
): LowerGarmentPatternType[] {
  return LOWER_GARMENT_PATTERN_MATRIX[garment] || ['solid', 'subtle_texture'];
}

function mapLegacyColorToLowerColor(
  color?: SelfieSelections['clothingColor']
): LowerGarmentColorType {
  switch (color) {
    case 'preserve_reference':
      return 'preserve_reference';
    case 'white':
      return 'white';
    case 'black':
      return 'black';
    case 'gray':
      return 'light_gray';
    case 'blue':
      return 'navy';
    case 'custom_color':
      return 'custom_lower_color';
    case 'beige':
    default:
      return 'beige';
  }
}

function mapStrictColorToLowerColor(
  color?: SelfieSelections['lowerBodyColor']
): LowerGarmentColorType {
  switch (color) {
    case 'charcoal_black':
      return 'charcoal';
    case 'deep_navy':
      return 'navy';
    case 'slate_gray':
      return 'charcoal';
    case 'subdued_beige':
      return 'beige';
    case 'deep_brown':
      return 'brown';
    case 'muted_olive':
      return 'olive';
    case 'custom_lower_color':
      return 'custom_lower_color';
    case 'coordinated_auto':
    default:
      return 'charcoal';
  }
}

export function mapMirrorBottomToLowerSpec(
  mirrorBottom?: MirrorBottomClothingType
): {
  garment: LowerGarmentType;
  color: LowerGarmentColorType;
  material: LowerGarmentMaterialType;
  fit: LowerGarmentFitType;
  pattern: LowerGarmentPatternType;
} {
  switch (mirrorBottom) {
    case 'black_running_shorts':
      return {
        garment: 'athletic_shorts',
        color: 'black',
        material: 'nylon_track_weave',
        fit: 'regular',
        pattern: 'solid',
      };
    case 'navy_sports_track_pants':
      return {
        garment: 'track_pants',
        color: 'navy',
        material: 'nylon_track_weave',
        fit: 'relaxed',
        pattern: 'solid',
      };
    case 'light_grey_sweatpants':
      return {
        garment: 'sweatpants',
        color: 'light_gray',
        material: 'fleece',
        fit: 'relaxed',
        pattern: 'solid',
      };
    case 'faded_blue_jeans':
      return {
        garment: 'jeans',
        color: 'denim_blue',
        material: 'denim',
        fit: 'regular',
        pattern: 'washed_fade',
      };
    case 'dark_grey_sweatpants':
      return {
        garment: 'sweatpants',
        color: 'charcoal',
        material: 'fleece',
        fit: 'relaxed',
        pattern: 'solid',
      };
    case 'tailored_black_trousers':
      return {
        garment: 'tailored_trousers',
        color: 'black',
        material: 'wool_blend_suiting',
        fit: 'regular',
        pattern: 'solid',
      };
    case 'red_athletic_mesh_shorts':
    default:
      return {
        garment: 'athletic_shorts',
        color: 'red',
        material: 'athletic_mesh',
        fit: 'relaxed',
        pattern: 'solid',
      };
  }
}

export function getEffectiveLowerClothingState(
  selections: Partial<SelfieSelections>
): {
  editMode: StrictLowerClothingMode;
  isPreservingLower: boolean;
  isExplicitStructuredLower: boolean;
  lowerGarment: LowerGarmentType;
  lowerGarmentColor: LowerGarmentColorType;
  lowerGarmentMaterial: LowerGarmentMaterialType;
  lowerGarmentFit: LowerGarmentFitType;
  lowerGarmentPattern: LowerGarmentPatternType;
  compatibleMaterials: LowerGarmentMaterialType[];
  compatibleFits: LowerGarmentFitType[];
  compatiblePatterns: LowerGarmentPatternType[];
} {
  const workflowMode = selections.workflowMode ?? DEFAULT_SELECTIONS.workflowMode;
  const legacyClothing = selections.clothing ?? DEFAULT_SELECTIONS.clothing;
  const legacyColor = selections.clothingColor ?? DEFAULT_SELECTIONS.clothingColor;
  const mirrorBottom =
    selections.mirrorBottomClothing ?? DEFAULT_SELECTIONS.mirrorBottomClothing;

  let defaultGarment: LowerGarmentType = 'relaxed_trousers';
  let defaultColor: LowerGarmentColorType = mapLegacyColorToLowerColor(legacyColor);
  let defaultMaterial: LowerGarmentMaterialType = 'cotton_twill';
  let defaultFit: LowerGarmentFitType = 'relaxed';
  let defaultPattern: LowerGarmentPatternType = 'solid';

  if (workflowMode === 'strict_editing') {
    const inferredStrictMode: StrictLowerClothingMode =
      selections.strictLowerClothingMode ??
      (selections.lowerGarment === 'preserve_reference'
        ? 'preserve_reference'
        : selections.lowerGarment !== undefined
          ? 'edit_garment'
          : 'recolor_only');

    if (
      inferredStrictMode === 'preserve_reference' ||
      (inferredStrictMode !== 'recolor_only' &&
        selections.lowerGarment === 'preserve_reference')
    ) {
      return {
        editMode: 'preserve_reference',
        isPreservingLower: true,
        isExplicitStructuredLower: selections.lowerGarment !== undefined,
        lowerGarment: 'preserve_reference',
        lowerGarmentColor: 'preserve_reference',
        lowerGarmentMaterial: 'cotton_twill',
        lowerGarmentFit: 'regular',
        lowerGarmentPattern: 'solid',
        compatibleMaterials: ['cotton_twill'],
        compatibleFits: ['regular'],
        compatiblePatterns: ['solid'],
      };
    }

    if (inferredStrictMode === 'recolor_only') {
      return {
        editMode: 'recolor_only',
        isPreservingLower: false,
        isExplicitStructuredLower: false,
        lowerGarment: 'preserve_reference',
        lowerGarmentColor: mapStrictColorToLowerColor(selections.lowerBodyColor),
        lowerGarmentMaterial: 'cotton_twill',
        lowerGarmentFit: 'regular',
        lowerGarmentPattern: 'solid',
        compatibleMaterials: ['cotton_twill'],
        compatibleFits: ['regular'],
        compatiblePatterns: ['solid'],
      };
    }

    defaultGarment = 'relaxed_trousers';
    defaultColor = mapStrictColorToLowerColor(selections.lowerBodyColor);
    defaultMaterial = 'cotton_twill';
    defaultFit = 'relaxed';
  } else if (workflowMode === 'mirror_studio') {
    const mapped = mapMirrorBottomToLowerSpec(mirrorBottom);
    defaultGarment = mapped.garment;
    defaultColor = mapped.color;
    defaultMaterial = mapped.material;
    defaultFit = mapped.fit;
    defaultPattern = mapped.pattern;
  } else {
    if (legacyClothing === 'preserve_reference') {
      if (legacyColor && legacyColor !== 'preserve_reference') {
        if (selections.lowerGarment === undefined) {
          return {
            editMode: 'recolor_only',
            isPreservingLower: false,
            isExplicitStructuredLower: false,
            lowerGarment: 'preserve_reference',
            lowerGarmentColor: mapLegacyColorToLowerColor(legacyColor),
            lowerGarmentMaterial: 'cotton_twill',
            lowerGarmentFit: 'regular',
            lowerGarmentPattern: 'solid',
            compatibleMaterials: ['cotton_twill'],
            compatibleFits: ['regular'],
            compatiblePatterns: ['solid'],
          };
        }
      } else {
        defaultGarment = 'preserve_reference';
        defaultColor = 'preserve_reference';
      }
    } else if (legacyClothing === 'modest_pajamas') {
      defaultGarment = 'pajama_pants';
      defaultMaterial = 'cotton_poplin';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'hoodie_and_pants' || legacyClothing === 'dark_oversized_hoodie') {
      defaultGarment = 'sweatpants';
      defaultMaterial = 'fleece';
      defaultFit = 'relaxed';
    } else if (legacyClothing === 'simple_loungewear' || legacyClothing === 'loose_silk_sleepwear') {
      defaultGarment = 'lounge_pants';
      defaultMaterial = 'cotton_jersey';
      defaultFit = 'relaxed';
    } else {
      defaultGarment = 'relaxed_trousers';
      defaultMaterial = 'cotton_twill';
      defaultFit = 'relaxed';
    }
  }

  const isExplicitStructuredLower =
    selections.lowerGarment !== undefined ||
    selections.lowerGarmentColor !== undefined ||
    selections.lowerGarmentMaterial !== undefined ||
    selections.lowerGarmentFit !== undefined ||
    selections.lowerGarmentPattern !== undefined;

  const resolvedGarment: LowerGarmentType =
    selections.lowerGarment ?? defaultGarment;

  if (resolvedGarment === 'preserve_reference') {
    return {
      editMode: 'preserve_reference',
      isPreservingLower: true,
      isExplicitStructuredLower,
      lowerGarment: 'preserve_reference',
      lowerGarmentColor: 'preserve_reference',
      lowerGarmentMaterial: 'cotton_twill',
      lowerGarmentFit: 'regular',
      lowerGarmentPattern: 'solid',
      compatibleMaterials: ['cotton_twill'],
      compatibleFits: ['regular'],
      compatiblePatterns: ['solid'],
    };
  }

  const compatibleMaterials = getCompatibleMaterialsForLowerGarment(resolvedGarment);
  const compatibleFits = getCompatibleFitsForLowerGarment(resolvedGarment);
  const compatiblePatterns = getCompatiblePatternsForLowerGarment(resolvedGarment);

  const requestedMaterial =
    selections.lowerGarmentMaterial ??
    (compatibleMaterials.includes(defaultMaterial)
      ? defaultMaterial
      : compatibleMaterials[0]);
  const resolvedMaterial = compatibleMaterials.includes(requestedMaterial)
    ? requestedMaterial
    : compatibleMaterials[0];

  const requestedFit =
    selections.lowerGarmentFit ??
    (compatibleFits.includes(defaultFit) ? defaultFit : compatibleFits[0]);
  const resolvedFit = compatibleFits.includes(requestedFit)
    ? requestedFit
    : compatibleFits.includes('relaxed')
      ? 'relaxed'
      : compatibleFits[0];

  const requestedPattern =
    selections.lowerGarmentPattern ??
    (compatiblePatterns.includes(defaultPattern)
      ? defaultPattern
      : compatiblePatterns[0]);
  const resolvedPattern = compatiblePatterns.includes(requestedPattern)
    ? requestedPattern
    : compatiblePatterns[0];

  const requestedColor =
    selections.lowerGarmentColor ??
    (defaultColor === 'preserve_reference' ? 'charcoal' : defaultColor);
  const resolvedColor: LowerGarmentColorType =
    requestedColor === 'preserve_reference' ? 'charcoal' : requestedColor;

  return {
    editMode: 'edit_garment',
    isPreservingLower: false,
    isExplicitStructuredLower,
    lowerGarment: resolvedGarment,
    lowerGarmentColor: resolvedColor,
    lowerGarmentMaterial: resolvedMaterial,
    lowerGarmentFit: resolvedFit,
    lowerGarmentPattern: resolvedPattern,
    compatibleMaterials,
    compatibleFits,
    compatiblePatterns,
  };
}

/**
 * Hydrates older saved presets into the independent upper/lower clothing fields
 * without mutating the original preset intent.
 */
export function hydrateLegacyClothingSelections(
  raw: Partial<SelfieSelections>
): SelfieSelections {
  const base: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...raw,
    imageTreatments: [
      ...(raw.imageTreatments || DEFAULT_SELECTIONS.imageTreatments),
    ],
  };

  const upperState = getEffectiveUpperClothingState(base);
  const lowerState = getEffectiveLowerClothingState(base);

  if (base.upperGarment === undefined) {
    if (
      !(base.workflowMode === 'strict_editing' && !base.strictUpperClothingEditEnabled)
    ) {
      base.upperGarment = upperState.upperGarment;
      base.upperGarmentColor = upperState.upperGarmentColor;
      base.upperGarmentMaterial = upperState.upperGarmentMaterial;
      base.upperGarmentFit = upperState.upperGarmentFit;
      base.upperGarmentPattern = upperState.upperGarmentPattern;
      if (base.clothing === 'custom_clothing' && base.customClothingText && !base.customUpperGarmentText) {
        base.customUpperGarmentText = base.customClothingText;
      }
      if (base.clothingColor === 'custom_color' && base.customClothingColorText && !base.customUpperColorText) {
        base.customUpperColorText = base.customClothingColorText;
      }
    } else {
      base.upperGarment = 'preserve_reference';
      base.upperGarmentColor = 'preserve_reference';
    }
  }

  if (base.workflowMode === 'strict_editing' && base.strictLowerClothingMode === undefined) {
    base.strictLowerClothingMode = lowerState.editMode;
  }

  if (base.lowerGarment === undefined && lowerState.editMode !== 'recolor_only') {
    base.lowerGarment = lowerState.lowerGarment;
    base.lowerGarmentColor = lowerState.lowerGarmentColor;
    base.lowerGarmentMaterial = lowerState.lowerGarmentMaterial;
    base.lowerGarmentFit = lowerState.lowerGarmentFit;
    base.lowerGarmentPattern = lowerState.lowerGarmentPattern;
    if (base.clothingColor === 'custom_color' && base.customClothingColorText && !base.customLowerGarmentColorText) {
      base.customLowerGarmentColorText = base.customClothingColorText;
    }
  }

  // Safely hydrate legacy Mirror Studio pose presets without overriding valid user fields
  if (raw.mirrorPose && !MIRROR_POSE_PRESET_SPECS[raw.mirrorPose]) {
    base.mirrorPose = 'pose_contrapposto_standing';
  }
  const activePreset = base.mirrorPose || 'pose_contrapposto_standing';
  const presetSpec = MIRROR_POSE_PRESET_SPECS[activePreset];

  if (!raw.phoneHand) {
    base.phoneHand = presetSpec.defaults.phoneHand;
  }
  if (!raw.mirrorGaze) {
    base.mirrorGaze = presetSpec.defaults.gaze;
  }
  if (!raw.mirrorPoseEnergy) {
    base.mirrorPoseEnergy = presetSpec.defaults.energy;
  }
  if (!raw.mirrorSupportObject) {
    base.mirrorSupportObject = inferDefaultMirrorSupportObject(
      activePreset,
      base.mirrorStance || presetSpec.defaults.stance,
      base.mirrorFreeHandAction || presetSpec.defaults.freeHandAction
    );
  }
  if (!raw.framing && base.workflowMode === 'mirror_studio') {
    base.framing = presetSpec.defaults.framing;
  }

  return base;
}

/**
 * Unified legacy preset hydration helper covering clothing and mirror pose selections.
 */
export const hydrateLegacySelections = hydrateLegacyClothingSelections;

const SHORT_SLEEVE_OR_COLLARLESS_CUFF_GARMENTS = new Set<UpperGarmentType>([
  'crew_neck_tshirt',
  'polo_shirt',
]);

function getMaterialWeaveConstruction(
  material: UpperGarmentMaterialType,
  garment: UpperGarmentType
): string {
  const sleeveTrim = SHORT_SLEEVE_OR_COLLARLESS_CUFF_GARMENTS.has(garment)
    ? 'collar binding, sleeve hems, and stitched seams'
    : 'collar, cuffs, and stitched seams';

  switch (material) {
    case 'cotton_jersey':
      return `visible cotton jersey knit grain, natural light-to-midweight thickness, and neat ${sleeveTrim}`;
    case 'ribbed_cotton':
      return `visible vertical ribbed cotton texture, medium thickness, and clean ${sleeveTrim}`;
    case 'french_terry':
      return `visible French terry knit weave, midweight thickness, and ribbed ${sleeveTrim}`;
    case 'fleece':
      return `dense brushed fleece surface texture, cozy thickness, and structured ${sleeveTrim}`;
    case 'cotton_poplin':
      return `crisp woven cotton poplin weave, light-medium thickness, and tailored ${sleeveTrim}`;
    case 'flannel':
      return `softly brushed flannel twill weave, medium-warm thickness, and clean ${sleeveTrim}`;
    case 'knit':
      return `tactile interlocked knit yarn texture, medium thickness, and ribbed ${sleeveTrim}`;
    case 'linen_cotton_blend':
      return `breathable slubbed linen-cotton weave, airy thickness, and stitched ${sleeveTrim}`;
    case 'waffle_knit':
      return `dimensional waffle-knit grid structure, midweight thickness, and bound ${sleeveTrim}`;
    case 'chambray_denim':
      return `woven chambray denim twill structure, medium weight, and topstitched ${sleeveTrim}`;
  }
}

function getLowerMaterialWeaveConstruction(
  material: LowerGarmentMaterialType,
  garment: LowerGarmentType
): string {
  const seamDetail =
    garment === 'midi_long_skirt'
      ? 'waistband, vertical seams, and draped hem'
      : garment === 'athletic_shorts' || garment === 'modest_shorts'
        ? 'waistband, side seams, and leg hems'
        : garment === 'sweatpants' || garment === 'joggers' || garment === 'pajama_pants' || garment === 'track_pants'
          ? 'elastic waistband, side seams, and ankle hems'
          : 'waistband, pocket stitching, and stitched inseams';

  switch (material) {
    case 'cotton_twill':
      return `matte diagonal cotton twill weave and crisp ${seamDetail}`;
    case 'denim':
      return `authentic woven indigo-style denim twill and felled ${seamDetail}`;
    case 'fleece':
      return `dense brushed fleece texture with cozy weight and ${seamDetail}`;
    case 'french_terry':
      return `midweight French terry knit weave and ${seamDetail}`;
    case 'cotton_jersey':
      return `soft matte cotton jersey knit grain and ${seamDetail}`;
    case 'cotton_poplin':
      return `smooth breathable cotton poplin weave and ${seamDetail}`;
    case 'linen_cotton_blend':
      return `airy slubbed linen-cotton weave and ${seamDetail}`;
    case 'wool_blend_suiting':
      return `matte fine suiting weave with clean ${seamDetail}`;
    case 'athletic_mesh':
      return `lightweight breathable mesh knit and athletic ${seamDetail}`;
    case 'nylon_track_weave':
      return `matte lightweight track weave with crisp ${seamDetail}`;
    case 'ribbed_knit':
      return `vertical ribbed knit structure and ${seamDetail}`;
  }
}

export function resolveUpperGarmentColorPhrase(
  color: UpperGarmentColorType,
  customUpperColorText?: string
): string {
  const custom = sanitizeCustomText(customUpperColorText || '');
  if (color === 'custom_upper_color' && custom) {
    return custom;
  }
  return (
    findPhrase(UPPER_GARMENT_COLOR_OPTIONS, color) || 'warm sand beige'
  );
}

export function resolveUpperGarmentDescriptor(
  garment: UpperGarmentType,
  customUpperGarmentText?: string
): string {
  const custom = sanitizeCustomText(customUpperGarmentText || '');
  if (garment === 'custom_upper_garment' && custom) {
    return custom;
  }
  return findPhrase(UPPER_GARMENT_OPTIONS, garment) || 'a crew-neck T-shirt';
}

export function resolveLowerGarmentColorPhrase(
  color: LowerGarmentColorType,
  customLowerColorText?: string
): string {
  const custom = sanitizeCustomText(customLowerColorText || '');
  if (color === 'custom_lower_color' && custom) {
    return custom;
  }
  return (
    findPhrase(LOWER_GARMENT_COLOR_OPTIONS, color) || 'dark charcoal gray'
  );
}

export function resolveLowerGarmentDescriptor(
  garment: LowerGarmentType,
  customLowerGarmentText?: string
): string {
  const custom = sanitizeCustomText(customLowerGarmentText || '');
  if (garment === 'custom_lower_garment' && custom) {
    return custom;
  }
  return findPhrase(LOWER_GARMENT_OPTIONS, garment) || 'relaxed casual trousers';
}

export function buildUpperFabricPhysicsPhrase(params: {
  garment: UpperGarmentType;
  colorPhrase: string;
  material: UpperGarmentMaterialType;
  fit: UpperGarmentFitType;
  pattern: UpperGarmentPatternType;
  compact?: boolean;
  framing?: FramingType;
}): string {
  const { garment, colorPhrase, material, fit, pattern, compact, framing } = params;
  const construction = getMaterialWeaveConstruction(material, garment);
  const fitDrape =
    fit === 'oversized'
      ? 'draping loosely with generous volume'
      : fit === 'relaxed'
        ? 'draping with easy relaxed volume'
        : fit === 'fitted'
          ? 'following the upper torso modestly without tight cling'
          : 'draping naturally over the torso';
  const patternNote =
    pattern === 'plaid'
      ? 'woven plaid pattern'
      : pattern === 'stripes'
        ? 'subtle woven stripes'
        : pattern === 'subtle_texture'
          ? 'subtle woven texture'
          : 'solid unprinted surface';

  const torsoRegions =
    framing === 'head_and_shoulders'
      ? 'shoulders, collar, and upper chest'
      : 'shoulders, elbows, chest, and waist';

  if (compact) {
    return `${patternNote} with ${construction}, ${fitDrape} with gravity-driven folds across the ${torsoRegions}, lighting-responsive ${colorPhrase} shading, avoiding plastic cloth, synthetic textures, floating fabric, impossible folds, or invented logos and brands`;
  }

  return `showing ${patternNote}, ${construction}, ${fitDrape} with gravity-driven folds and compression at the ${torsoRegions} matching the pose, and ${colorPhrase} shading responding naturally to the lighting while avoiding plastic smooth cloth, repetitive synthetic textures, floating fabric, impossible folds, or invented logos, text, and brands`;
}

export function buildLowerFabricPhysicsPhrase(params: {
  garment: LowerGarmentType;
  colorPhrase: string;
  material: LowerGarmentMaterialType;
  fit: LowerGarmentFitType;
  pattern: LowerGarmentPatternType;
  compact?: boolean;
  framing?: FramingType;
}): string {
  const { garment, colorPhrase, material, fit, pattern, compact, framing } = params;
  const construction = getLowerMaterialWeaveConstruction(material, garment);
  const fitDrape =
    fit === 'wide_leg' || fit === 'loose_baggy'
      ? 'draping loosely with generous leg volume'
      : fit === 'relaxed'
        ? 'draping with easy relaxed volume'
        : fit === 'tapered'
          ? 'narrowing smoothly toward the ankle'
          : fit === 'straight'
            ? 'falling in a clean straight line'
            : 'draping naturally from the waist';
  const patternNote =
    pattern === 'plaid'
      ? 'woven plaid pattern'
      : pattern === 'stripes'
        ? 'subtle woven stripes'
        : pattern === 'washed_fade'
          ? 'subtle natural washed fade'
          : pattern === 'side_stripe'
            ? 'minimal tonal side seam stripe'
            : pattern === 'subtle_texture'
              ? 'subtle woven texture'
              : 'solid unprinted surface';

  if (framing === 'head_and_shoulders' || framing === 'half_body') {
    const cropNote =
      framing === 'head_and_shoulders'
        ? 'mostly outside the head-and-shoulders crop without inventing obscured lower-body limbs'
        : 'visible only near the top waistband edge in the half-body crop without inventing obscured lower-limb proportions';
    if (compact) {
      return `${patternNote} with ${construction}, ${fitDrape} (${cropNote}), and ${colorPhrase} shading without invented logos`;
    }
    return `showing ${patternNote}, ${construction}, ${fitDrape} (${cropNote}), with ${colorPhrase} shading responding to the lighting without plastic cloth, color bleed, or invented logos and hidden measurements`;
  }

  const visibleRegions =
    framing === 'three_quarter'
      ? 'waist, hips, and upper thighs'
      : 'waist, hips, thighs, knees, and hems';

  if (compact) {
    return `${patternNote} with ${construction}, ${fitDrape} and natural tension and folds across the ${visibleRegions} under gravity without invented logos`;
  }

  return `showing ${patternNote}, ${construction}, ${fitDrape} with realistic tension, gravity-driven drape, folds, and contact compression at the ${visibleRegions} consistent with the pose, and ${colorPhrase} shading responding to the lighting without plastic cloth, color bleed, or invented logos, brands, or hidden measurements`;
}

function deriveLegacyLowerClothingPhrase(selections: SelfieSelections): string {
  const customColor = sanitizeCustomText(selections.customClothingColorText);
  const colorDesc =
    selections.clothingColor === 'custom_color' && customColor
      ? customColor
      : findPhrase(CLOTHING_COLOR_OPTIONS, selections.clothingColor);

  switch (selections.clothing) {
    case 'modest_pajamas':
      return `matching modest long pajama trousers in ${colorDesc || 'a coordinated neutral tone'}`;
    case 'hoodie_and_pants':
    case 'dark_oversized_hoodie':
      return `relaxed sweatpants in ${colorDesc || 'a coordinated neutral tone'}`;
    case 'simple_loungewear':
    case 'loose_silk_sleepwear':
      return `comfortable indoor lounge pants in ${colorDesc || 'a coordinated neutral tone'}`;
    case 'custom_clothing':
      return `comfortable lower-body trousers in ${colorDesc || 'a coordinated neutral tone'}`;
    case 'tshirt_and_pants':
    case 'white_cotton_tshirt':
    case 'ribbed_tank_top':
    default:
      return `comfortable casual trousers in ${colorDesc || 'a coordinated neutral tone'}`;
  }
}

/**
 * Renders the scene-appropriate English instruction for focusTarget.
 */
export function buildFocusDescription(
  focusTarget: FocusTarget,
  cameraMode: CameraMode
): string {
  const effectiveFocus: FocusTarget =
    cameraMode === 'front_selfie' && focusTarget === 'mirror_reflection'
      ? 'subject_face'
      : focusTarget;

  switch (effectiveFocus) {
    case 'mirror_reflection':
      return 'focus on the reflected subject with coherent mirror geometry';
    case 'upper_body':
      return 'focus priority on the subject’s upper body';
    case 'subject_face':
    default:
      return 'autofocus priority on the subject’s face';
  }
}

/**
 * Renders the scene-appropriate English instruction for exposurePreference.
 */
export function buildExposureDescription(
  exposurePreference: ExposurePreference,
  lightingSource: LightingSource,
  phoneProcessingProfile: PhoneProcessingProfile
): string {
  const disallowFlashExposure =
    lightingSource === 'screen_only' || phoneProcessingProfile === 'night_mode';

  const effectiveExposure: ExposurePreference =
    disallowFlashExposure && exposurePreference === 'flash_highlight_controlled'
      ? 'low_key_shadow_preserving'
      : exposurePreference;

  switch (effectiveExposure) {
    case 'low_key_shadow_preserving':
      return 'low-key exposure preserving the selected low-light mood without inventing extra light';
    case 'flash_highlight_controlled':
      return 'controlled highlight exposure retaining realistic flash highlights without clipping them unnaturally';
    case 'balanced':
    default:
      return 'natural smartphone auto-exposure balancing subject and background';
  }
}

export interface ConflictDetectionResult {
  valid: boolean;
  conflicts: string[];
  warnings: string[];
}

/**
 * Explicitly detects incompatible selections without silently masking them:
 * 1. "Screen is the only light source" combined with direct phone flash.
 * 2. Night mode combined with direct flash.
 * 3. Front-camera selfie combined with rear-camera mirror photo settings.
 * 4. Explicit instruction forbidding all clothing-color changes combined with a requested color change.
 *    (Note: preserve_reference + an explicit clothingColor is a valid narrow lower-garment color edit, NOT a conflict.)
 */
export function detectSelectionConflicts(
  input: Partial<SelfieSelections>
): ConflictDetectionResult {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  const workflowMode = input.workflowMode ?? DEFAULT_SELECTIONS.workflowMode;
  const strictLightingMode =
    input.strictLightingMode ?? DEFAULT_SELECTIONS.strictLightingMode;
  const lighting = input.lighting ?? DEFAULT_SELECTIONS.lighting;
  const secondaryLighting = input.secondaryLighting;
  const mixedLightingEnabled = Boolean(input.mixedLightingEnabled);
  const selfieType = input.selfieType ?? DEFAULT_SELECTIONS.selfieType;
  const framing = input.framing ?? DEFAULT_SELECTIONS.framing;
  const background = input.background ?? DEFAULT_SELECTIONS.background;
  const gaze = input.gaze ?? DEFAULT_SELECTIONS.gaze;
  const phoneColor = input.phoneColor ?? DEFAULT_SELECTIONS.phoneColor;
  const pose = input.pose ?? DEFAULT_SELECTIONS.pose;
  const clothing = input.clothing ?? DEFAULT_SELECTIONS.clothing;
  const clothingColor = input.clothingColor ?? DEFAULT_SELECTIONS.clothingColor;
  const phoneProcessingProfile =
    input.phoneProcessingProfile ?? 'natural_phone';
  const customTextCombined = `${input.customDetails || ''} ${input.userConcept || ''}`;

  // 1. Screen-only light source combined with direct flash
  const isScreenOnlyPrimary =
    (workflowMode === 'strict_editing' &&
      strictLightingMode === 'mode_a_screen') ||
    (workflowMode === 'scene_builder' &&
      lighting === 'mode_a_phone_screen_dark') ||
    (workflowMode === 'mirror_studio' &&
      lighting === 'mode_a_phone_screen_dark');

  const hasDirectFlashRequest =
    secondaryLighting === 'mode_b_phone_flash_mirror_dark' ||
    (workflowMode === 'strict_editing' &&
      strictLightingMode === 'mode_a_screen' &&
      input.lighting === 'mode_b_phone_flash_mirror_dark') ||
    (workflowMode === 'scene_builder' &&
      lighting === 'mode_a_phone_screen_dark' &&
      input.strictLightingMode === 'mode_b_flash_mirror' &&
      mixedLightingEnabled) ||
    /\b(?:direct\s+flash|camera\s+flash|phone\s+flash|led\s+flash)\b|فلاش\s+مباشر|فلاش\s+الكاميرا/i.test(
      customTextCombined
    );

  if (isScreenOnlyPrimary && hasDirectFlashRequest) {
    conflicts.push('SCREEN_ONLY_WITH_FLASH');
    warnings.push(
      'تعارض في الإضاءة: لا يمكن دمج «إضاءة شاشة الهاتف فقط» مع «فلاش الهاتف المباشر».'
    );
  }

  // Also check if direct flash primary is combined with screen-only secondary
  const isDirectFlashPrimary =
    (workflowMode === 'strict_editing' &&
      strictLightingMode === 'mode_b_flash_mirror') ||
    (workflowMode === 'scene_builder' &&
      lighting === 'mode_b_phone_flash_mirror_dark') ||
    (workflowMode === 'mirror_studio' &&
      lighting !== 'mode_a_phone_screen_dark' &&
      phoneProcessingProfile !== 'night_mode');

  if (
    isDirectFlashPrimary &&
    (secondaryLighting === 'mode_a_phone_screen_dark' ||
      /\bscreen\s+is\s+the\s+only\s+light\s+source|screen-only\s+lighting\b/i.test(
        customTextCombined
      ))
  ) {
    conflicts.push('FLASH_WITH_SCREEN_ONLY');
    warnings.push(
      'تعارض في الإضاءة: لا يمكن دمج «فلاش الهاتف المباشر» مع «إضاءة الشاشة فقط».'
    );
  }

  // 2. Night mode combined with direct flash
  const hasFlashForNightModeCheck =
    (workflowMode === 'strict_editing' &&
      strictLightingMode === 'mode_b_flash_mirror') ||
    (workflowMode === 'scene_builder' &&
      (lighting === 'mode_b_phone_flash_mirror_dark' ||
        secondaryLighting === 'mode_b_phone_flash_mirror_dark')) ||
    (workflowMode === 'mirror_studio' &&
      lighting !== 'mode_a_phone_screen_dark') ||
    /\b(?:direct\s+flash|camera\s+flash|phone\s+flash|led\s+flash)\b/i.test(
      customTextCombined
    );

  if (phoneProcessingProfile === 'night_mode' && hasFlashForNightModeCheck) {
    conflicts.push('NIGHT_MODE_WITH_FLASH');
    warnings.push(
      'تعارض في معالجة الكاميرا: لا يمكن تفعيل «الوضع الليلي (Night Mode)» مع «الفلاش المباشر».'
    );
  }

  // 3. Front-camera selfie combined with rear-camera mirror photo settings
  if (workflowMode === 'scene_builder' && selfieType === 'front_camera') {
    if (phoneColor !== 'hidden_front_camera') {
      conflicts.push('FRONT_CAMERA_VISIBLE_PHONE');
      warnings.push('تم إخفاء الهاتف تلقائيًا لأن التصوير بالكاميرا الأمامية.');
    }
    if (gaze === 'at_mirror_reflection') {
      conflicts.push('FRONT_CAMERA_MIRROR_GAZE');
      warnings.push(
        'تم تعديل اتجاه النظر إلى عدسة الهاتف لعدم وجود مرآة في الكاميرا الأمامية.'
      );
    }
    if (framing === 'full_body_mirror') {
      conflicts.push('FRONT_CAMERA_FULL_BODY_MIRROR');
      warnings.push(
        'تم تعديل الكادر إلى «نصف الجسم» لأن خيار كامل الجسم يتطلب سيلفي أمام المرآة.'
      );
    }
    if (background === 'full_length_mirror') {
      conflicts.push('FRONT_CAMERA_MIRROR_BACKGROUND');
      warnings.push(
        'تم تغيير الخلفية من مرآة طويلة إلى سرير وطاولة جانبية لمنع انعكاس المرآة مع الكاميرا الأمامية.'
      );
    }
    if (lighting === 'mode_b_phone_flash_mirror_dark') {
      conflicts.push('FRONT_CAMERA_MIRROR_FLASH');
      warnings.push(
        'تم تحويل الإضاءة إلى الوضع A (شاشة الهاتف فقط) لأن الكاميرا الأمامية لا تستخدم مرآة.'
      );
    }
    if (
      (pose === 'rear_mirror_standing' || pose === 'rear_mirror_sitting') &&
      (framing === 'full_body_mirror' ||
        background === 'full_length_mirror' ||
        gaze === 'at_mirror_reflection' ||
        lighting === 'mode_b_phone_flash_mirror_dark' ||
        phoneColor !== 'hidden_front_camera')
    ) {
      conflicts.push('FRONT_CAMERA_REAR_MIRROR_POSE');
      warnings.push(
        'تعارض في الكاميرا: لا يمكن وصف سيلفي الكاميرا الأمامية كلقطة مرآة بالكاميرا الخلفية.'
      );
    }
  }

  if (
    workflowMode === 'strict_editing' &&
    strictLightingMode === 'mode_a_screen' &&
    (framing === 'full_body_mirror' ||
      background === 'full_length_mirror' ||
      gaze === 'at_mirror_reflection')
  ) {
    conflicts.push('STRICT_MODE_A_MIRROR_CONFLICT');
    warnings.push(
      'تعارض في الكاميرا: الوضع A مخصص لسيلفي الكاميرا الأمامية على ضوء الشاشة ولا يدعم انعكاس المرآة الكامل.'
    );
  }

  // 4. Only report a clothing-color conflict if an explicit instruction forbids all clothing-color changes
  // while a color change is requested. (preserve_reference + clothingColor is a valid lower-garment color edit.)
  const forbidsAllClothingColorChanges =
    /\b(?:do\s+not\s+change\s+any\s+clothing\s+colors?|forbid\s+all\s+clothing[-\s]color\s+changes|never\s+recolor\s+any\s+garments?|keep\s+all\s+clothing\s+colors?\s+unchanged|preserve\s+original\s+pants\s+color|keep\s+lower\s+garment\s+color\s+unchanged)\b|منع\s+تغيير\s+لون\s+الملابس|عدم\s+تغيير\s+لون\s+الملابس/i.test(
      customTextCombined
    );

  const requestsColorEdit =
    (workflowMode === 'strict_editing' &&
      input.strictLowerClothingMode !== 'preserve_reference' &&
      input.lowerGarment !== 'preserve_reference') ||
    (workflowMode === 'scene_builder' &&
      clothing === 'preserve_reference' &&
      clothingColor !== 'preserve_reference' &&
      input.lowerGarment === undefined);

  if (forbidsAllClothingColorChanges && requestsColorEdit) {
    conflicts.push('PRESERVE_GARMENT_COLOR_CONFLICT');
    warnings.push(
      'تعارض في الملابس: تعليمات منع تغيير لون الملابس تتعارض مع طلب تلوين الملابس السفلية.'
    );
  }

  // 5. Preserve-reference upper garment conflict check
  const upperPreservedByLegacy =
    workflowMode === 'scene_builder' &&
    input.upperGarment === undefined &&
    clothing === 'preserve_reference';
  const upperPreservedByChoice = input.upperGarment === 'preserve_reference';
  const hasExplicitUpperOverride =
    (input.upperGarment !== undefined &&
      input.upperGarment !== 'preserve_reference') ||
    (input.upperGarmentColor !== undefined &&
      input.upperGarmentColor !== 'preserve_reference') ||
    Boolean(input.customUpperColorText?.trim()) ||
    Boolean(input.customUpperGarmentText?.trim());

  if (
    (upperPreservedByLegacy && hasExplicitUpperOverride) ||
    (upperPreservedByChoice &&
      ((input.upperGarmentColor !== undefined &&
        input.upperGarmentColor !== 'preserve_reference') ||
        Boolean(input.customUpperColorText?.trim()) ||
        Boolean(input.customUpperGarmentText?.trim())))
  ) {
    conflicts.push('PRESERVE_UPPER_GARMENT_CONFLICT');
    warnings.push(
      'تعارض في الملابس العلوية: تم الحفاظ على لون وخامة وقصة ونقشة القطعة العلوية من الصورة المرجعية وتجاوز التعديلات المتعارضة.'
    );
  }

  // 5b. Preserve-reference lower garment conflict check
  const lowerPreservedByChoice =
    (workflowMode === 'strict_editing' &&
      input.strictLowerClothingMode === 'preserve_reference') ||
    (input.lowerGarment === 'preserve_reference' &&
      !(
        workflowMode === 'strict_editing' &&
        input.strictLowerClothingMode === 'recolor_only'
      ));
  if (
    lowerPreservedByChoice &&
    ((input.lowerGarmentColor !== undefined &&
      input.lowerGarmentColor !== 'preserve_reference') ||
      Boolean(input.customLowerGarmentColorText?.trim()) ||
      Boolean(input.customLowerGarmentText?.trim()))
  ) {
    conflicts.push('PRESERVE_LOWER_GARMENT_CONFLICT');
    warnings.push(
      'تعارض في الملابس السفلية: تم الحفاظ على لون وخامة وقصة ونقشة القطعة السفلية من الصورة المرجعية وتجاوز التعديلات المتعارضة.'
    );
  }

  // 6. Mirror Studio canonical pose, framing crop, phone-hand exclusivity, support-surface, gaze, and lens conflicts
  if (workflowMode === 'mirror_studio') {
    const poseCheck = analyzeMirrorPoseConflicts(input);
    for (const code of poseCheck.conflicts) {
      if (!conflicts.includes(code)) conflicts.push(code);
    }
    for (const msg of poseCheck.warnings) {
      if (!warnings.includes(msg)) warnings.push(msg);
    }
  }

  return {
    valid: conflicts.length === 0,
    conflicts,
    warnings,
  };
}

export const MIRROR_SEATED_POSES = new Set<MirrorPoseType>([
  'pose_bed_edge_dynamic',
  'pose_chair_or_stool_sitting',
  'pose_seated_forearm_knee_rest',
  'pose_floor_rug_mirror',
  'pose_floor_sitting_bed',
  'pose_prop_open_book',
]);

export const MIRROR_LEANING_POSES = new Set<MirrorPoseType>([
  'pose_wall_lean_scurve',
  'pose_vanity_casual_lean',
  'pose_doorway_frame_lean',
  'pose_leaning_forward',
]);

export const MIRROR_FULL_BODY_ONLY_POSES = new Set<MirrorPoseType>([
  'pose_one_foot_forward_knee_bend',
  'pose_wall_lean_scurve',
  'pose_floor_rug_mirror',
  'pose_floor_sitting_bed',
]);

export const MIRROR_LOWER_LEG_STANCES = new Set<MirrorStanceType>([
  'one_foot_forward',
  'staggered_feet',
  'paused_natural_step',
]);

export const MIRROR_UPPER_CROP_FORBIDDEN_STANCES = new Set<MirrorStanceType>([
  'one_foot_forward',
  'staggered_feet',
  'soft_knee_bend',
  'paused_natural_step',
]);

const MIRROR_SEAT_SUPPORT_OBJECTS = new Set<MirrorSupportObjectType>([
  'bed_edge',
  'chair',
  'stool',
]);

const MIRROR_LEAN_SUPPORT_OBJECTS = new Set<MirrorSupportObjectType>([
  'wall',
  'vanity',
]);

const MIRROR_HAND_PROP_SUPPORT_OBJECTS = new Set<MirrorSupportObjectType>([
  'mirror_glass',
  'coffee_mug',
  'open_book',
  'perfume_bottle',
]);

export function inferDefaultMirrorSupportObject(
  mirrorPose: MirrorPoseType,
  mirrorStance: MirrorStanceType,
  mirrorFreeHandAction: MirrorFreeHandActionType
): MirrorSupportObjectType {
  if (mirrorFreeHandAction === 'lightly_touch_mirror') return 'mirror_glass';
  if (mirrorFreeHandAction === 'hold_mug') return 'coffee_mug';
  if (mirrorFreeHandAction === 'hold_book') return 'open_book';
  if (mirrorPose === 'pose_bed_edge_dynamic' || mirrorPose === 'pose_floor_sitting_bed') {
    return 'bed_edge';
  }
  if (
    mirrorPose === 'pose_chair_or_stool_sitting' ||
    mirrorPose === 'pose_seated_forearm_knee_rest'
  ) {
    return 'chair';
  }
  if (
    mirrorPose === 'pose_wall_lean_scurve' ||
    mirrorPose === 'pose_doorway_frame_lean'
  ) {
    return 'wall';
  }
  if (mirrorPose === 'pose_vanity_casual_lean' || mirrorPose === 'pose_leaning_forward') {
    return 'vanity';
  }
  if (mirrorPose === 'pose_hand_on_mirror_glass') return 'mirror_glass';
  if (mirrorPose === 'pose_prop_coffee_mug') return 'coffee_mug';
  if (mirrorPose === 'pose_prop_open_book') return 'open_book';
  if (mirrorPose === 'pose_prop_perfume_spray') return 'perfume_bottle';
  if (mirrorStance === 'light_shoulder_wall_lean') return 'wall';
  return 'none';
}

function getMirrorPresetFreeHandRequirement(
  mirrorPose: MirrorPoseType
): MirrorFreeHandActionType | 'hold_perfume' | 'bed_rest' | 'surface_rest' | null {
  switch (mirrorPose) {
    case 'pose_prop_coffee_mug':
      return 'hold_mug';
    case 'pose_prop_open_book':
      return 'hold_book';
    case 'pose_prop_perfume_spray':
      return 'hold_perfume';
    case 'pose_hand_on_mirror_glass':
      return 'lightly_touch_mirror';
    case 'pose_adjust_collar_sleeves':
    case 'pose_cuffed_sleeve_check':
    case 'pose_putting_on_jacket':
    case 'pose_adjust_accessories':
      return 'adjust_sleeve_or_collar';
    case 'pose_hand_in_hair_jawline':
      return 'tuck_hair_behind_ear';
    case 'pose_bed_edge_dynamic':
      return 'bed_rest';
    case 'pose_leaning_forward':
      return 'surface_rest';
    default:
      return null;
  }
}

export function isFramingAllowedForPoseAndLens(
  framing: FramingType,
  mirrorPose: MirrorPoseType,
  mirrorLens: MirrorLensProfileType
): { allowed: boolean; reasonAr?: string } {
  if (mirrorLens === 'ultra_telephoto_100mm' && framing === 'full_body_mirror') {
    return {
      allowed: false,
      reasonAr: 'عدسة 100mm البصرية للتقريب الفائق لا تدعم كادر كامل الجسم',
    };
  }
  const spec = MIRROR_POSE_PRESET_SPECS[mirrorPose];
  if (
    (framing === 'head_and_shoulders' || framing === 'half_body') &&
    !spec.allowedFramings.includes(framing)
  ) {
    return {
      allowed: false,
      reasonAr: 'يتطلب كادرًا أوسع (ثلاثة أرباع أو كامل الجسم) لإظهار الوضعية',
    };
  }
  if (
    framing === 'three_quarter' &&
    MIRROR_FULL_BODY_ONLY_POSES.has(mirrorPose)
  ) {
    return {
      allowed: false,
      reasonAr: 'يتطلب كادر كامل الجسم أمام المرآة لإظهار الساقين والقدمين',
    };
  }
  return { allowed: true };
}

function analyzeMirrorPoseConflicts(input: Partial<SelfieSelections>): {
  conflicts: string[];
  warnings: string[];
} {
  const conflicts: string[] = [];
  const warnings: string[] = [];

  const mirrorPose: MirrorPoseType =
    input.mirrorPose && MIRROR_POSE_PRESET_SPECS[input.mirrorPose]
      ? input.mirrorPose
      : DEFAULT_SELECTIONS.mirrorPose;
  const mirrorStance: MirrorStanceType =
    input.mirrorStance ?? DEFAULT_SELECTIONS.mirrorStance ?? 'balanced_relaxed';
  const mirrorFreeHand: MirrorFreeHandActionType =
    input.mirrorFreeHandAction ??
    DEFAULT_SELECTIONS.mirrorFreeHandAction ??
    'none_relaxed';
  const mirrorLens: MirrorLensProfileType =
    input.mirrorLensProfile ??
    DEFAULT_SELECTIONS.mirrorLensProfile ??
    'main_23mm';
  const phoneHand: PhoneHandType = input.phoneHand ?? DEFAULT_SELECTIONS.phoneHand;
  const framing: FramingType = input.framing ?? DEFAULT_SELECTIONS.framing;
  const mirrorGaze: MirrorGazeType =
    input.mirrorGaze ?? DEFAULT_SELECTIONS.mirrorGaze;
  const mirrorExpression =
    input.mirrorExpression ?? DEFAULT_SELECTIONS.mirrorExpression;
  const explicitSupport = input.mirrorSupportObject;
  const effectiveSupport: MirrorSupportObjectType =
    explicitSupport ??
    inferDefaultMirrorSupportObject(mirrorPose, mirrorStance, mirrorFreeHand);
  const spec = MIRROR_POSE_PRESET_SPECS[mirrorPose];

  const presetFreeHand = getMirrorPresetFreeHandRequirement(mirrorPose);

  // 1. Phone-holding hand cannot also perform a free-hand action
  if (
    phoneHand === 'both_hands' &&
    (mirrorFreeHand !== 'none_relaxed' ||
      !spec.allowedPhoneHands.includes('both_hands') ||
      MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(effectiveSupport))
  ) {
    conflicts.push('MIRROR_PHONE_HAND_CONFLICT');
    warnings.push(
      'تعارض إمساك الهاتف: لا يمكن إمساك الهاتف بكلتا اليدين مع وجود حركة أو أداة في اليد الحرة.'
    );
  }

  // 2. Single free-hand exclusivity across preset & composable free hand & prop
  if (
    mirrorFreeHand !== 'none_relaxed' &&
    presetFreeHand &&
    presetFreeHand !== mirrorFreeHand
  ) {
    conflicts.push('MIRROR_FREE_HAND_CONFLICT');
    warnings.push(
      'تعارض في حركة اليد الحرة: لا يمكن إسناد حركتين أو أداتين لليد الحرة في وقت واحد بينما اليد الأخرى تمسك الهاتف.'
    );
  }

  // 3. Seated stance vs standing stance conflict
  if (MIRROR_SEATED_POSES.has(mirrorPose) && mirrorStance !== 'balanced_relaxed') {
    conflicts.push('MIRROR_STANCE_CONFLICT');
    warnings.push(
      'تعارض في الوضعية: لا يمكن الجمع بين الجلوس ووضعية وقوف في نفس اللقطة؛ تم توحيد الوضعية إلى وضع مريح متزن.'
    );
  }

  // 4. Support surface required for leaning & sitting poses when support is explicit
  const needsLeanSurface =
    MIRROR_LEANING_POSES.has(mirrorPose) ||
    mirrorStance === 'light_shoulder_wall_lean';
  const needsSeatSurface =
    mirrorPose === 'pose_bed_edge_dynamic' ||
    mirrorPose === 'pose_chair_or_stool_sitting' ||
    mirrorPose === 'pose_seated_forearm_knee_rest' ||
    mirrorPose === 'pose_floor_sitting_bed';

  if (
    explicitSupport !== undefined &&
    ((needsLeanSurface && !MIRROR_LEAN_SUPPORT_OBJECTS.has(explicitSupport)) ||
      (needsSeatSurface && !MIRROR_SEAT_SUPPORT_OBJECTS.has(explicitSupport)))
  ) {
    conflicts.push('MIRROR_SUPPORT_SURFACE_CONFLICT');
    warnings.push(
      'تعارض سطح الدعم: الاستناد أو الجلوس يتطلب وجود سطح داعم أو مقعد ظاهر ومتوافق في الغرفة.'
    );
  }

  // 5. Camera framing / crop visibility rules (do not describe legs or feet outside crop)
  const framingViolated =
    (mirrorLens === 'ultra_telephoto_100mm' && framing === 'full_body_mirror') ||
    ((framing === 'head_and_shoulders' || framing === 'half_body') &&
      (!spec.allowedFramings.includes(framing) ||
        MIRROR_UPPER_CROP_FORBIDDEN_STANCES.has(mirrorStance))) ||
    (framing === 'head_and_shoulders' &&
      mirrorFreeHand === 'hand_at_hip_or_pocket') ||
    (framing === 'three_quarter' && MIRROR_LOWER_LEG_STANCES.has(mirrorStance));

  if (framingViolated) {
    conflicts.push('MIRROR_FRAMING_VISIBILITY_CONFLICT');
    warnings.push(
      'تعارض قص الكادر: تم ضبط الوضعية لتطابق الجزء الظاهر في الكادر وعدم وصف السيقان أو القدمين خارج الإطار.'
    );
  }

  // 6. Gaze consistency
  if (
    (mirrorExpression === 'calm_screen_focus' &&
      mirrorGaze !== 'gaze_phone_screen') ||
    (mirrorPose === 'pose_phone_chest_look_down' &&
      mirrorGaze !== 'gaze_phone_screen') ||
    (mirrorPose === 'pose_phone_cover_lower_face_eye_contact' &&
      mirrorGaze !== 'gaze_camera_lens')
  ) {
    conflicts.push('MIRROR_GAZE_CONSISTENCY_CONFLICT');
    warnings.push(
      'تعارض اتجاه النظر: تم توحيد اتجاه النظر والتعبير مع موضع الهاتف وانعكاس المرآة.'
    );
  }

  // 7. Optical telephoto vs mirror glass close touch
  if (
    (mirrorLens === 'telephoto_70mm' || mirrorLens === 'ultra_telephoto_100mm') &&
    (mirrorFreeHand === 'lightly_touch_mirror' ||
      mirrorPose === 'pose_hand_on_mirror_glass' ||
      effectiveSupport === 'mirror_glass')
  ) {
    conflicts.push('MIRROR_LENS_DISTANCE_CONFLICT');
    warnings.push(
      'تعارض المسافة والعدسة: عدستا التقريب 70mm و100mm تتطلبان مسافة أبعد عن المرآة ولا تتوافقان مع ملامسة سطح المرآة عن قرب.'
    );
  }

  return { conflicts, warnings };
}

function getPhoneHandHoldClause(phoneHand: PhoneHandType): string {
  if (phoneHand === 'both_hands') return 'steadily in both hands';
  if (phoneHand === 'left_hand') return 'in the left hand';
  return 'in the right hand';
}

function formatMirrorPhonePositionClause(
  phonePosition: MirrorPhonePositionType,
  phoneHand: PhoneHandType
): string {
  const handClause = getPhoneHandHoldClause(phoneHand);
  if (phonePosition === 'shoulder_level') {
    return `held at shoulder height ${handClause} beside the upper torso with the rear camera aimed toward the mirror`;
  }
  if (phonePosition === 'eye_level') {
    return `held at eye level ${handClause} with the rear camera aimed straight toward the mirror`;
  }
  return `held steadily at chest level ${handClause} with the rear camera aimed cleanly at the mirror`;
}

function sanitizeLowerBodyWordsForCrop(
  text: string,
  framing: FramingType
): string {
  if (framing === 'full_body_mirror') return text;
  if (framing === 'three_quarter') {
    return text
      .replace(/,?\s*with the sole of the foot flat against the wall/gi, '')
      .replace(/,?\s*sole of the foot[^.,;]*/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  // head_and_shoulders or half_body: remove legs, knees, feet, ankles, hips/thighs if head_and_shoulders
  let cleaned = text
    .replace(/,?\s*weight shifted naturally to one leg/gi, ', torso balanced naturally')
    .replace(/,?\s*knees slightly apart\.?/gi, '.')
    .replace(/\bOne knee[^.,;]*[.,]?/gi, '')
    .replace(/\bFront leg[^.,;]*[.,]?/gi, '')
    .replace(/[^.]*\b(?:legs?|knees?|feet|foot|ankles?|soles?)\b[^.]*\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  if (framing === 'head_and_shoulders') {
    cleaned = cleaned
      .replace(/[^.]*\b(?:waist|hips?|thighs?)\b[^.]*\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  return cleaned;
}

function buildCropSafeStanceClause(
  stance: MirrorStanceType,
  framing: FramingType,
  supportObject: MirrorSupportObjectType
): string {
  if (framing === 'head_and_shoulders' || framing === 'half_body') {
    if (stance === 'light_shoulder_wall_lean' || supportObject === 'wall') {
      return 'Standing with a light, casual shoulder lean against the visible adjacent wall';
    }
    if (supportObject === 'vanity') {
      return 'Standing beside a visible bedroom vanity with a relaxed upper-body posture';
    }
    if (stance === 'gentle_three_quarter_turn') {
      return 'Standing in a gentle three-quarter upper-body orientation relative to the mirror';
    }
    if (stance === 'contrapposto_weight_shift' && framing === 'half_body') {
      return 'Standing with an easy, relaxed upper-torso weight shift and level, unforced shoulders';
    }
    return 'Standing comfortably in an upright, relaxed upper-body posture';
  }

  if (framing === 'three_quarter') {
    if (stance === 'light_shoulder_wall_lean') {
      return 'Standing with a light, casual shoulder lean against the visible adjacent bedroom wall';
    }
    if (stance === 'contrapposto_weight_shift') {
      return 'Standing in an effortless contrapposto posture with body weight settled onto one hip and relaxed shoulders';
    }
    if (stance === 'soft_knee_bend') {
      return 'Standing naturally with weight carried comfortably on the supporting side and gentle hip relaxation';
    }
    if (stance === 'gentle_three_quarter_turn') {
      return 'Standing turned in a gentle three-quarter orientation relative to the mirror';
    }
    return 'Standing in a relaxed balanced posture with natural hip and torso alignment';
  }

  return (
    findPhrase(MIRROR_STANCE_OPTIONS, stance) ||
    MIRROR_STANCE_OPTIONS[0].enPhrase
  );
}

function buildGazeAndEnergySentence(
  gaze: MirrorGazeType,
  energy: MirrorPoseEnergyType,
  presetEnPhrase: string
): string {
  const alreadyMentionsGaze =
    /\b(?:eyes?\s+(?:looking|focused|making)|looking\s+(?:down|at|toward|slightly)|eye\s+contact)\b/i.test(
      presetEnPhrase
    );
  const gazePart = alreadyMentionsGaze
    ? ''
    : gaze === 'gaze_phone_screen'
      ? 'Gaze directed downward at the phone screen reflection.'
      : gaze === 'gaze_camera_lens'
        ? 'Gaze directed naturally toward the camera lens in the mirror reflection.'
        : 'Gaze glancing slightly off-camera to the side.';
  const energyPart =
    findPhrase(MIRROR_POSE_ENERGY_OPTIONS, energy) ||
    MIRROR_POSE_ENERGY_OPTIONS[0].enPhrase;
  return [
    gazePart,
    `Maintain a fully clothed adult appearance, natural adult proportions, and a single balanced posture ${energyPart}.`,
  ]
    .filter(Boolean)
    .join(' ');
}

function buildSupportSentence(
  supportObject: MirrorSupportObjectType,
  mirrorPose: MirrorPoseType,
  presetText: string
): string {
  if (supportObject === 'none') return '';
  if (
    (supportObject === 'wall' && /\bwall\b/i.test(presetText)) ||
    (supportObject === 'vanity' && /\bvanity\b/i.test(presetText)) ||
    (supportObject === 'bed_edge' && /\bbed\b/i.test(presetText)) ||
    (supportObject === 'chair' && /\bchair\b/i.test(presetText)) ||
    (supportObject === 'stool' && /\bstool\b/i.test(presetText)) ||
    (supportObject === 'mirror_glass' && /\bmirror\b/i.test(presetText)) ||
    (supportObject === 'coffee_mug' && /\bmug\b/i.test(presetText)) ||
    (supportObject === 'open_book' && /\bbook\b/i.test(presetText)) ||
    (supportObject === 'perfume_bottle' && /\bperfume\b/i.test(presetText))
  ) {
    return '';
  }
  if (
    mirrorPose === 'pose_chair_or_stool_sitting' &&
    supportObject === 'stool'
  ) {
    return 'Seated comfortably on a visible bedroom stool rather than a backed chair.';
  }
  const supportPhrase = findPhrase(MIRROR_SUPPORT_OBJECT_OPTIONS, supportObject);
  if (!supportPhrase) return '';
  return `Positioned ${supportPhrase}.`;
}

function buildVisibleCropFramingNote(framing: FramingType): string {
  if (framing === 'head_and_shoulders') {
    return 'Frame tightly from the chest and shoulders upward in the mirror.';
  }
  if (framing === 'half_body') {
    return 'Frame cleanly as a half-body mirror view from the waist upward.';
  }
  if (framing === 'three_quarter') {
    return 'Frame as a three-quarter mirror view from mid-thighs upward.';
  }
  return 'Frame as a full-body view through a tall floor-length mirror.';
}

/**
 * Single reusable canonical Mirror Studio Pose resolver.
 * Resolves conflicts across framing crop, lens distance, phone hand exclusivity,
 * required visible support objects, gaze, expression, and pose presets, and builds
 * ONE coherent, non-duplicated mirror pose description.
 */
export function resolveMirrorPoseConfiguration(rawInput: Partial<SelfieSelections>): {
  resolvedSelections: SelfieSelections;
  poseComposition: MirrorPoseCompositionSpec;
  adjustments: string[];
  conflicts: string[];
  lockedConflicts: LockedFieldConflict[];
} {
  const input: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...rawInput,
    workflowMode: 'mirror_studio',
    selfieType: 'mirror',
    imageTreatments: [
      ...(rawInput.imageTreatments || DEFAULT_SELECTIONS.imageTreatments),
    ],
  };

  const detected = analyzeMirrorPoseConflicts(input);
  const adjustments: string[] = [];
  const addAdj = (msg: string) => {
    if (!adjustments.includes(msg)) adjustments.push(msg);
  };

  let mirrorLensProfile: MirrorLensProfileType =
    input.mirrorLensProfile && XIAOMI_15_ULTRA_LENS_PROFILES[input.mirrorLensProfile]
      ? input.mirrorLensProfile
      : 'main_23mm';
  let framing: FramingType = input.framing || 'three_quarter';
  let mirrorPose: MirrorPoseType =
    input.mirrorPose && MIRROR_POSE_PRESET_SPECS[input.mirrorPose]
      ? input.mirrorPose
      : 'pose_contrapposto_standing';
  let mirrorStance: MirrorStanceType = input.mirrorStance || 'balanced_relaxed';
  let mirrorTorsoOrientation: MirrorTorsoOrientationType =
    input.mirrorTorsoOrientation || 'slight_angle_head_turned';
  let phoneHand: PhoneHandType = input.phoneHand || 'right_hand';
  let mirrorPhonePosition: MirrorPhonePositionType =
    input.mirrorPhonePosition || 'chest_level';
  let mirrorFreeHandAction: MirrorFreeHandActionType =
    input.mirrorFreeHandAction || 'none_relaxed';
  let mirrorMovementMoment: MirrorMovementMomentType =
    input.mirrorMovementMoment || 'still_composed';
  let mirrorMotionBlurEnabled = Boolean(input.mirrorMotionBlurEnabled);
  let mirrorGaze: MirrorGazeType = input.mirrorGaze || 'gaze_phone_screen';
  let mirrorExpression = input.mirrorExpression || 'neutral_exact_lock';
  let mirrorPoseEnergy: MirrorPoseEnergyType = input.mirrorPoseEnergy || 'relaxed';
  let mirrorSupportObject: MirrorSupportObjectType =
    input.mirrorSupportObject ??
    inferDefaultMirrorSupportObject(
      mirrorPose,
      mirrorStance,
      mirrorFreeHandAction
    );

  const { lockedSet, lockedConflicts } = evaluateLockedMirrorConflicts(input);
  const isLocked = (field: LockableSelectionField) => lockedSet.has(field);

  // A. Lens vs full-body framing constraint
  if (mirrorLensProfile === 'ultra_telephoto_100mm' && framing === 'full_body_mirror') {
    if (!isLocked('framing')) {
      framing = 'three_quarter';
      addAdj('تم ضبط الكادر إلى ثلاثة أرباع لأن عدسة 100mm البصرية لا تلتقط كامل الجسم.');
    } else if (!isLocked('mirrorLensProfile')) {
      mirrorLensProfile = 'main_23mm';
      addAdj('تم التحويل إلى عدسة 23mm الرئيسية للحفاظ على كادر كامل الجسم المقفل.');
    }
  }

  // B. Lens vs close mirror-glass touch
  if (
    (mirrorLensProfile === 'telephoto_70mm' ||
      mirrorLensProfile === 'ultra_telephoto_100mm') &&
    (mirrorFreeHandAction === 'lightly_touch_mirror' ||
      mirrorPose === 'pose_hand_on_mirror_glass' ||
      mirrorSupportObject === 'mirror_glass')
  ) {
    const canModifyTargets =
      !isLocked('mirrorFreeHandAction') &&
      !isLocked('mirrorPose') &&
      !isLocked('mirrorSupportObject');
    if (canModifyTargets) {
      if (mirrorFreeHandAction === 'lightly_touch_mirror') {
        mirrorFreeHandAction = 'none_relaxed';
      }
      if (mirrorPose === 'pose_hand_on_mirror_glass') {
        mirrorPose = 'pose_contrapposto_standing';
      }
      if (mirrorSupportObject === 'mirror_glass') {
        mirrorSupportObject = 'none';
      }
      addAdj(
        'عدستا التقريب 70mm و100mm تتطلبان مسافة أبعد عن المرآة؛ تم إلغاء ملامسة الزجاج عن قرب.'
      );
    } else if (!isLocked('mirrorLensProfile')) {
      mirrorLensProfile = 'main_23mm';
      addAdj('تم ضبط العدسة إلى 23mm لتوافق ملامسة سطح المرآة المقفلة.');
    }
  }

  // C. Dual free-hand prop/action conflict (keep explicit free-hand action, neutralize preset unless locked)
  const presetFreeHand = getMirrorPresetFreeHandRequirement(mirrorPose);
  if (
    mirrorFreeHandAction !== 'none_relaxed' &&
    presetFreeHand &&
    presetFreeHand !== mirrorFreeHandAction
  ) {
    if (!isLocked('mirrorPose')) {
      mirrorPose = 'pose_contrapposto_standing';
      if (
        mirrorFreeHandAction === 'hold_book' ||
        mirrorFreeHandAction === 'hold_mug' ||
        mirrorFreeHandAction === 'lightly_touch_mirror'
      ) {
        if (!isLocked('mirrorSupportObject')) {
          mirrorSupportObject = inferDefaultMirrorSupportObject(
            mirrorPose,
            mirrorStance,
            mirrorFreeHandAction
          );
        }
      } else if (
        MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(mirrorSupportObject) &&
        !isLocked('mirrorSupportObject')
      ) {
        mirrorSupportObject = 'none';
      }
      addAdj(
        'تم توحيد حركة اليد الحرة إلى حركة واحدة متناسقة بدلاً من تداخل حركتين أو أداتين.'
      );
    } else if (!isLocked('mirrorFreeHandAction')) {
      mirrorFreeHandAction =
        presetFreeHand === 'hold_mug' ||
        presetFreeHand === 'hold_book' ||
        presetFreeHand === 'lightly_touch_mirror' ||
        presetFreeHand === 'adjust_sleeve_or_collar' ||
        presetFreeHand === 'tuck_hair_behind_ear'
          ? presetFreeHand
          : 'none_relaxed';
      addAdj('تم توحيد حركة اليد الحرة لتتطابق مع الوضعية المقفلة.');
    }
  }

  // D. Phone hand exclusivity (both hands hold phone => no free-hand action or hand-held prop)
  if (phoneHand === 'both_hands') {
    const spec = MIRROR_POSE_PRESET_SPECS[mirrorPose];
    const hasLockedHandConflict =
      isLocked('phoneHand') &&
      ((mirrorFreeHandAction !== 'none_relaxed' && isLocked('mirrorFreeHandAction')) ||
        (MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(mirrorSupportObject) &&
          isLocked('mirrorSupportObject')) ||
        (!spec.allowedPhoneHands.includes('both_hands') && isLocked('mirrorPose')));

    if (!hasLockedHandConflict) {
      let changed = false;
      if (mirrorFreeHandAction !== 'none_relaxed' && !isLocked('mirrorFreeHandAction')) {
        mirrorFreeHandAction = 'none_relaxed';
        changed = true;
      }
      if (!spec.allowedPhoneHands.includes('both_hands') && !isLocked('mirrorPose')) {
        mirrorPose = 'pose_contrapposto_standing';
        changed = true;
      }
      if (
        MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(mirrorSupportObject) &&
        !isLocked('mirrorSupportObject')
      ) {
        mirrorSupportObject = 'none';
        changed = true;
      }
      if (
        !changed &&
        !isLocked('phoneHand') &&
        (mirrorFreeHandAction !== 'none_relaxed' ||
          MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(mirrorSupportObject) ||
          !spec.allowedPhoneHands.includes('both_hands'))
      ) {
        phoneHand = 'right_hand';
        changed = true;
      }
      if (changed) {
        addAdj(
          'تم إيقاف حركة اليد الحرة والأداة المساعدة لأن إمساك الهاتف بكلتا اليدين يشغل اليدين معًا.'
        );
      }
    }
  }

  // E. Framing crop visibility enforcement (tight crops never depict uncropped legs/feet/seats)
  if (framing === 'three_quarter' && MIRROR_FULL_BODY_ONLY_POSES.has(mirrorPose)) {
    if (mirrorLensProfile !== 'ultra_telephoto_100mm' && !isLocked('framing')) {
      framing = 'full_body_mirror';
      addAdj(
        'تم ضبط الكادر إلى «كامل الجسم أمام المرآة» لإظهار الساقين والقدمين بما يتوافق مع الوضعية المختارة.'
      );
    } else if (!isLocked('mirrorPose')) {
      mirrorPose = 'pose_contrapposto_standing';
      if (!isLocked('mirrorStance')) mirrorStance = 'balanced_relaxed';
      addAdj(
        'تم تبديل الوضعية إلى وقوف متزن متوافق مع عدسة التقريب والكادر المتوسط.'
      );
    }
  } else {
    const currentSpec = MIRROR_POSE_PRESET_SPECS[mirrorPose];
    if (
      (framing === 'head_and_shoulders' || framing === 'half_body') &&
      !currentSpec.allowedFramings.includes(framing)
    ) {
      if (!isLocked('mirrorPose')) {
        mirrorPose = 'pose_contrapposto_standing';
        if (
          MIRROR_SEAT_SUPPORT_OBJECTS.has(mirrorSupportObject) &&
          !isLocked('mirrorSupportObject')
        ) {
          mirrorSupportObject = 'none';
        }
        addAdj(
          'تم تعديل الوضعية لتتوافق مع كادر اللقطة الضيق دون وصف أجزاء غير ظاهرة في الصورة.'
        );
      } else if (!isLocked('framing')) {
        framing = currentSpec.allowedFramings.includes('three_quarter')
          ? 'three_quarter'
          : 'full_body_mirror';
        addAdj('تم توسيع الكادر ليظهر كامل أجزاء الوضعية المقفلة.');
      }
    }
    if (
      (framing === 'head_and_shoulders' || framing === 'half_body') &&
      MIRROR_UPPER_CROP_FORBIDDEN_STANCES.has(mirrorStance) &&
      !isLocked('mirrorStance')
    ) {
      mirrorStance =
        framing === 'half_body' ? 'gentle_three_quarter_turn' : 'balanced_relaxed';
      addAdj(
        'تم استبدال وقفة الساقين بوقفة علوية متزنة تتوافق مع قص الكادر المختار.'
      );
    } else if (
      framing === 'three_quarter' &&
      MIRROR_LOWER_LEG_STANCES.has(mirrorStance) &&
      !isLocked('mirrorStance')
    ) {
      mirrorStance = 'contrapposto_weight_shift';
      addAdj(
        'تم تعديل الوقفة إلى نقل وزن مريح متناسب مع كادر ثلاثة أرباع (دون وصف القدمين خارج الكادر).'
      );
    }
    if (
      framing === 'head_and_shoulders' &&
      mirrorFreeHandAction === 'hand_at_hip_or_pocket' &&
      !isLocked('mirrorFreeHandAction')
    ) {
      mirrorFreeHandAction = 'none_relaxed';
      addAdj(
        'تم تعطيل حركة اليد عند الخصر لأن كادر الرأس والكتفين لا يُظهر منطقة الخصر.'
      );
    }
  }

  // F. Support surface requirement for leaning & sitting
  const needsLeanSurface =
    MIRROR_LEANING_POSES.has(mirrorPose) ||
    mirrorStance === 'light_shoulder_wall_lean';
  const needsSeatSurface =
    mirrorPose === 'pose_bed_edge_dynamic' ||
    mirrorPose === 'pose_chair_or_stool_sitting' ||
    mirrorPose === 'pose_seated_forearm_knee_rest' ||
    mirrorPose === 'pose_floor_sitting_bed';

  if (
    rawInput.mirrorSupportObject !== undefined &&
    needsLeanSurface &&
    !MIRROR_LEAN_SUPPORT_OBJECTS.has(mirrorSupportObject)
  ) {
    if (!isLocked('mirrorPose') && !isLocked('mirrorStance')) {
      if (MIRROR_LEANING_POSES.has(mirrorPose)) {
        mirrorPose = 'pose_contrapposto_standing';
      }
      if (mirrorStance === 'light_shoulder_wall_lean') {
        mirrorStance = 'balanced_relaxed';
      }
      addAdj(
        'تم التحويل إلى وقفة متزنة لأن الاستناد يتطلب وجود حائط أو طاولة زينة ظاهرة كسطح دعم.'
      );
    } else if (!isLocked('mirrorSupportObject')) {
      mirrorSupportObject = 'wall';
      addAdj('تم تفعيل الجدار كسطح دعم متوافق مع وضعية الاستناد المقفلة.');
    }
  }

  if (
    rawInput.mirrorSupportObject !== undefined &&
    needsSeatSurface &&
    !MIRROR_SEAT_SUPPORT_OBJECTS.has(mirrorSupportObject)
  ) {
    if (!isLocked('mirrorPose')) {
      mirrorPose = 'pose_contrapposto_standing';
      addAdj(
        'تم التحويل إلى وقفة متزنة لأن الجلوس يتطلب اختيار مقعد ظاهر (حافة السرير أو كرسي أو مقعد).'
      );
    } else if (!isLocked('mirrorSupportObject')) {
      mirrorSupportObject =
        mirrorPose === 'pose_bed_edge_dynamic' || mirrorPose === 'pose_floor_sitting_bed'
          ? 'bed_edge'
          : 'chair';
      addAdj('تم تفعيل مقعد ظاهر متوافق مع وضعية الجلوس المقفلة.');
    }
  }

  if (
    rawInput.mirrorSupportObject === undefined &&
    mirrorSupportObject === 'none'
  ) {
    mirrorSupportObject = inferDefaultMirrorSupportObject(
      mirrorPose,
      mirrorStance,
      mirrorFreeHandAction
    );
  }

  // Seated pose stance consistency
  if (
    MIRROR_SEATED_POSES.has(mirrorPose) &&
    mirrorStance !== 'balanced_relaxed' &&
    !isLocked('mirrorStance')
  ) {
    mirrorStance = 'balanced_relaxed';
    addAdj(
      'تم توحيد الوقفة مع وضعية الجلوس لمنع تداخل وضعيتي جلوس ووقوف.'
    );
  }

  // Motion blur preset guard
  if (mirrorPose === 'pose_free_hand_motion_blur' && !mirrorMotionBlurEnabled) {
    mirrorPose = 'pose_contrapposto_standing';
    addAdj('تم تعطيل وضع الضبابية الحركية لأن خيار الضبابية الحركية غير مفعل.');
  }

  // G. Gaze & expression consistency
  if (
    mirrorPose === 'pose_phone_chest_look_down' &&
    mirrorGaze !== 'gaze_phone_screen' &&
    !isLocked('mirrorGaze')
  ) {
    mirrorGaze = 'gaze_phone_screen';
    addAdj('تم ضبط النظر إلى شاشة الهاتف ليتطابق مع الوضعية المختارة.');
  }
  if (
    mirrorPose === 'pose_phone_cover_lower_face_eye_contact' &&
    mirrorGaze !== 'gaze_camera_lens' &&
    !isLocked('mirrorGaze')
  ) {
    mirrorGaze = 'gaze_camera_lens';
    addAdj('تم ضبط النظر إلى انعكاس المرآة/العدسة ليتطابق مع الوضعية المختارة.');
  }
  if (
    mirrorExpression === 'calm_screen_focus' &&
    mirrorGaze !== 'gaze_phone_screen'
  ) {
    mirrorExpression = 'neutral_exact_lock';
    addAdj('تم ضبط تعبير الوجه إلى استرخاء محايد ليتطابق مع اتجاه النظر إلى المرآة.');
  }

  const resolvedSelections: SelfieSelections = {
    ...input,
    framing,
    background:
      framing === 'full_body_mirror' ? 'full_length_mirror' : input.background,
    deviceModel: input.deviceModel?.trim() || 'Xiaomi 15 Ultra',
    mirrorLensProfile,
    mirrorPose,
    mirrorStance,
    mirrorTorsoOrientation,
    phoneHand,
    mirrorPhonePosition,
    mirrorFreeHandAction,
    mirrorMovementMoment,
    mirrorMotionBlurEnabled,
    mirrorGaze,
    mirrorExpression,
    mirrorPoseEnergy,
    mirrorSupportObject,
  };

  const poseDescription = buildResolvedMirrorPoseDescription({
    preset: mirrorPose,
    framing,
    stance: mirrorStance,
    torsoOrientation: mirrorTorsoOrientation,
    phoneHand,
    phonePosition: mirrorPhonePosition,
    freeHandAction: mirrorFreeHandAction,
    gaze: mirrorGaze,
    energy: mirrorPoseEnergy,
    supportObject: mirrorSupportObject,
    movementMoment: mirrorMovementMoment,
    motionBlurEnabled: mirrorMotionBlurEnabled,
  });

  const poseComposition: MirrorPoseCompositionSpec = {
    preset: mirrorPose,
    framing,
    stance: mirrorStance,
    torsoOrientation: mirrorTorsoOrientation,
    phoneHand,
    phonePosition: mirrorPhonePosition,
    freeHandAction: mirrorFreeHandAction,
    gaze: mirrorGaze,
    energy: mirrorPoseEnergy,
    supportObject: mirrorSupportObject,
    movementMoment: mirrorMovementMoment,
    motionBlurEnabled: mirrorMotionBlurEnabled,
    poseDescription,
  };

  const finalLockedConflicts = evaluateLockedMirrorConflicts(resolvedSelections).lockedConflicts;

  return {
    resolvedSelections,
    poseComposition,
    adjustments,
    conflicts: detected.conflicts,
    lockedConflicts:
      finalLockedConflicts.length > 0 ? finalLockedConflicts : lockedConflicts,
  };
}

/**
 * Builds ONE coherent, non-duplicated, physically plausible Mirror Studio pose description
 * strictly grounded in visible framing, weight distribution, support contact, hand exclusivity,
 * gaze alignment, and adult proportions.
 */
export function buildResolvedMirrorPoseDescription(
  comp: MirrorPoseCompositionSpec
): string {
  const preset = comp.preset || 'pose_contrapposto_standing';
  const framing = comp.framing || 'three_quarter';
  const phoneHand = comp.phoneHand || 'right_hand';
  const gaze = comp.gaze || 'gaze_phone_screen';
  const energy = comp.energy || 'relaxed';
  const supportObject = comp.supportObject || 'none';

  const presetOptionPhrase =
    findPhrase(MIRROR_POSE_OPTIONS, preset) || MIRROR_POSE_OPTIONS[0].enPhrase;
  const stancePhrase = buildCropSafeStanceClause(
    comp.stance,
    framing,
    supportObject
  );
  const torsoPhrase = findPhrase(
    MIRROR_TORSO_ORIENTATION_OPTIONS,
    comp.torsoOrientation
  );
  const freeHandPhrase = findPhrase(
    MIRROR_FREE_HAND_ACTION_OPTIONS,
    comp.freeHandAction
  );
  const movementPhrase = findPhrase(
    MIRROR_MOVEMENT_MOMENT_OPTIONS,
    comp.movementMoment
  );

  const isNeutralPreset = preset === 'pose_contrapposto_standing';
  const isSeatedPreset = MIRROR_SEATED_POSES.has(preset);

  let basePosture = presetOptionPhrase;
  if (!isSeatedPreset && comp.stance !== 'balanced_relaxed') {
    basePosture = `${stancePhrase.charAt(0).toUpperCase()}${stancePhrase.slice(1)}.`;
  } else if (framing === 'head_and_shoulders' || framing === 'half_body') {
    basePosture = sanitizeLowerBodyWordsForCrop(presetOptionPhrase, framing);
    if (!basePosture || basePosture.length < 18) {
      basePosture = `${stancePhrase.charAt(0).toUpperCase()}${stancePhrase.slice(1)}.`;
    }
  } else if (framing === 'three_quarter') {
    basePosture = sanitizeLowerBodyWordsForCrop(presetOptionPhrase, framing);
  }

  // Prevent free-hand duplication when preset already describes that free hand or phoneHand === 'both_hands'
  const presetFreeHand = getMirrorPresetFreeHandRequirement(preset);
  const presetAlreadyMentionsAction =
    !isNeutralPreset &&
    presetFreeHand !== null &&
    presetFreeHand === comp.freeHandAction;

  let freeHandSentence = '';
  if (phoneHand === 'both_hands') {
    freeHandSentence =
      'Both hands cooperate naturally to steady the single smartphone at the selected height with relaxed elbows and wrists.';
  } else if (comp.freeHandAction !== 'none_relaxed' && !presetAlreadyMentionsAction) {
    if (
      framing === 'head_and_shoulders' &&
      comp.freeHandAction === 'hand_at_hip_or_pocket'
    ) {
      freeHandSentence = '';
    } else {
      freeHandSentence = `Free arm relaxed ${freeHandPhrase}.`;
    }
  } else if (isNeutralPreset && comp.freeHandAction === 'none_relaxed') {
    freeHandSentence = `Free arm ${freeHandPhrase}.`;
  }

  const supportSentence = buildSupportSentence(supportObject, preset, basePosture);
  const cropSentence = buildVisibleCropFramingNote(framing);
  const gazeEnergySentence = buildGazeAndEnergySentence(
    gaze,
    energy,
    basePosture
  );
  const momentSentence =
    comp.movementMoment !== 'still_composed' && movementPhrase
      ? `Moment ${movementPhrase}.`
      : '';
  const motionNote = comp.motionBlurEnabled
    ? 'Allowing subtle natural motion blur only on the moving free hand while keeping the face and torso crisp.'
    : '';

  const assembled = [
    basePosture,
    supportSentence,
    torsoPhrase ? `Natural ${torsoPhrase}.` : '',
    freeHandSentence,
    momentSentence,
    cropSentence,
    gazeEnergySentence,
    'Preserve natural physical balance, relaxed shoulders, anatomically plausible joint alignment, believable contact compression at support points, and natural gravity-driven clothing folds without exaggerated anatomy.',
    motionNote,
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Final crop safeguard to ensure tight crops never leak leg/foot terms
  return sanitizeLowerBodyWordsForCrop(assembled, framing);
}

export interface MirrorOptionCompatibility {
  allowed: boolean;
  reasonAr?: string;
}

/**
 * Reusable UI compatibility lookup consumed by MirrorStudioSection
 * so every disabled state and Arabic reason derives from the single canonical ruleset.
 */
export function getCompatibleMirrorPoseOptions(rawInput: Partial<SelfieSelections>): {
  framings: Record<FramingType, MirrorOptionCompatibility>;
  poses: Record<MirrorPoseType, MirrorOptionCompatibility>;
  stances: Record<MirrorStanceType, MirrorOptionCompatibility>;
  phoneHands: Record<PhoneHandType, MirrorOptionCompatibility>;
  freeHandActions: Record<MirrorFreeHandActionType, MirrorOptionCompatibility>;
  supportObjects: Record<MirrorSupportObjectType, MirrorOptionCompatibility>;
  gazes: Record<MirrorGazeType, MirrorOptionCompatibility>;
  energies: Record<MirrorPoseEnergyType, MirrorOptionCompatibility>;
} {
  const framing: FramingType = rawInput.framing || 'three_quarter';
  const lens: MirrorLensProfileType = rawInput.mirrorLensProfile || 'main_23mm';
  const preset: MirrorPoseType = rawInput.mirrorPose || 'pose_contrapposto_standing';
  const phoneHand: PhoneHandType = rawInput.phoneHand || 'right_hand';
  const isTelephoto =
    lens === 'telephoto_70mm' || lens === 'ultra_telephoto_100mm';
  const presetSpec = MIRROR_POSE_PRESET_SPECS[preset];
  const isSeated = MIRROR_SEATED_POSES.has(preset);

  const framings = {} as Record<FramingType, MirrorOptionCompatibility>;
  for (const opt of FRAMING_OPTIONS) {
    if (lens === 'ultra_telephoto_100mm' && opt.value === 'full_body_mirror') {
      framings[opt.value] = {
        allowed: false,
        reasonAr: 'عدسة 100mm للتقريب الفائق لا تغطي كامل الجسم',
      };
    } else {
      framings[opt.value] = { allowed: true };
    }
  }

  const poses = {} as Record<MirrorPoseType, MirrorOptionCompatibility>;
  for (const opt of MIRROR_POSE_OPTIONS) {
    const spec = MIRROR_POSE_PRESET_SPECS[opt.value];
    if (isTelephoto && opt.value === 'pose_hand_on_mirror_glass') {
      poses[opt.value] = {
        allowed: false,
        reasonAr: 'غير متاح مع عدسات التقريب 70mm/100mm',
      };
    } else if (
      (framing === 'head_and_shoulders' || framing === 'half_body') &&
      !spec.allowedFramings.includes(framing)
    ) {
      poses[opt.value] = {
        allowed: false,
        reasonAr: 'يتطلب كادر ثلاثة أرباع أو كامل الجسم',
      };
    } else if (
      framing === 'three_quarter' &&
      MIRROR_FULL_BODY_ONLY_POSES.has(opt.value)
    ) {
      poses[opt.value] = {
        allowed: false,
        reasonAr: 'يتطلب كادر كامل الجسم أمام المرآة',
      };
    } else if (
      phoneHand === 'both_hands' &&
      !spec.allowedPhoneHands.includes('both_hands')
    ) {
      poses[opt.value] = {
        allowed: false,
        reasonAr: 'يتطلب إمساك الهاتف بيد واحدة لتحرير اليد الأخرى',
      };
    } else {
      poses[opt.value] = { allowed: true };
    }
  }

  const stances = {} as Record<MirrorStanceType, MirrorOptionCompatibility>;
  for (const opt of MIRROR_STANCE_OPTIONS) {
    if (isSeated && opt.value !== 'balanced_relaxed') {
      stances[opt.value] = {
        allowed: false,
        reasonAr: 'الوضعية المختارة وضعية جلوس وليست وقوفًا',
      };
    } else if (
      (framing === 'head_and_shoulders' || framing === 'half_body') &&
      MIRROR_UPPER_CROP_FORBIDDEN_STANCES.has(opt.value)
    ) {
      stances[opt.value] = {
        allowed: false,
        reasonAr: 'كادر الصورة لا يُظهر الساقين أو القدمين',
      };
    } else if (
      framing === 'three_quarter' &&
      MIRROR_LOWER_LEG_STANCES.has(opt.value)
    ) {
      stances[opt.value] = {
        allowed: false,
        reasonAr: 'يتطلب كادر كامل الجسم لإظهار القدمين والخطوة',
      };
    } else {
      stances[opt.value] = { allowed: true };
    }
  }

  const phoneHands = {} as Record<PhoneHandType, MirrorOptionCompatibility>;
  for (const opt of PHONE_HAND_OPTIONS) {
    if (opt.value === 'both_hands' && !presetSpec.allowedPhoneHands.includes('both_hands')) {
      phoneHands[opt.value] = {
        allowed: false,
        reasonAr: 'هذا القالب يتطلب يدًا حرة ولذلك يمسك الهاتف بيد واحدة',
      };
    } else {
      phoneHands[opt.value] = { allowed: true };
    }
  }

  const freeHandActions = {} as Record<
    MirrorFreeHandActionType,
    MirrorOptionCompatibility
  >;
  for (const opt of MIRROR_FREE_HAND_ACTION_OPTIONS) {
    if (phoneHand === 'both_hands' && opt.value !== 'none_relaxed') {
      freeHandActions[opt.value] = {
        allowed: false,
        reasonAr: 'غير متاح عند إمساك الهاتف بكلتا اليدين',
      };
    } else if (isTelephoto && opt.value === 'lightly_touch_mirror') {
      freeHandActions[opt.value] = {
        allowed: false,
        reasonAr: 'غير متاح مع عدسات التقريب البعيدة',
      };
    } else if (
      framing === 'head_and_shoulders' &&
      opt.value === 'hand_at_hip_or_pocket'
    ) {
      freeHandActions[opt.value] = {
        allowed: false,
        reasonAr: 'الخصر والجيب خارج كادر الرأس والكتفين',
      };
    } else {
      freeHandActions[opt.value] = { allowed: true };
    }
  }

  const supportObjects = {} as Record<
    MirrorSupportObjectType,
    MirrorOptionCompatibility
  >;
  for (const opt of MIRROR_SUPPORT_OBJECT_OPTIONS) {
    if (
      phoneHand === 'both_hands' &&
      MIRROR_HAND_PROP_SUPPORT_OBJECTS.has(opt.value)
    ) {
      supportObjects[opt.value] = {
        allowed: false,
        reasonAr: 'لا يمكن حمل أداة عند إمساك الهاتف بكلتا اليدين',
      };
    } else if (isTelephoto && opt.value === 'mirror_glass') {
      supportObjects[opt.value] = {
        allowed: false,
        reasonAr: 'غير متاح مع عدسات التقريب البعيدة',
      };
    } else if (
      (framing === 'head_and_shoulders' || framing === 'half_body') &&
      MIRROR_SEAT_SUPPORT_OBJECTS.has(opt.value)
    ) {
      supportObjects[opt.value] = {
        allowed: false,
        reasonAr: 'المقعد غير ظاهر في الكادر العلوي الضيق',
      };
    } else {
      supportObjects[opt.value] = { allowed: true };
    }
  }

  const gazes = {} as Record<MirrorGazeType, MirrorOptionCompatibility>;
  for (const opt of MIRROR_GAZE_OPTIONS) {
    if (!presetSpec.allowedGazes.includes(opt.value)) {
      gazes[opt.value] = {
        allowed: false,
        reasonAr: 'هذا القالب يحدد اتجاه نظر متناسقًا معه',
      };
    } else {
      gazes[opt.value] = { allowed: true };
    }
  }

  const energies = {} as Record<MirrorPoseEnergyType, MirrorOptionCompatibility>;
  for (const opt of MIRROR_POSE_ENERGY_OPTIONS) {
    energies[opt.value] = { allowed: true };
  }

  return {
    framings,
    poses,
    stances,
    phoneHands,
    freeHandActions,
    supportObjects,
    gazes,
    energies,
  };
}

const CURATED_MIRROR_SURPRISE_BUNDLES: Array<{
  mirrorPose: MirrorPoseType;
  framing: FramingType;
  mirrorLensProfile: MirrorLensProfileType;
  mirrorStance: MirrorStanceType;
  mirrorTorsoOrientation: MirrorTorsoOrientationType;
  phoneHand: PhoneHandType;
  mirrorPhonePosition: MirrorPhonePositionType;
  mirrorFreeHandAction: MirrorFreeHandActionType;
  mirrorMovementMoment: MirrorMovementMomentType;
  mirrorGaze: MirrorGazeType;
  mirrorExpression: SelfieSelections['mirrorExpression'];
  mirrorPoseEnergy: MirrorPoseEnergyType;
  mirrorSupportObject: MirrorSupportObjectType;
}> = [
  {
    mirrorPose: 'pose_contrapposto_standing',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'contrapposto_weight_shift',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'hand_at_hip_or_pocket',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'confident',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_one_foot_forward_knee_bend',
    framing: 'full_body_mirror',
    mirrorLensProfile: 'ultrawide_14mm',
    mirrorStance: 'one_foot_forward',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'hand_at_hip_or_pocket',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'asymmetrical_smirk',
    mirrorPoseEnergy: 'confident',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_wall_lean_scurve',
    framing: 'full_body_mirror',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'light_shoulder_wall_lean',
    mirrorTorsoOrientation: 'three_quarter_look_back',
    phoneHand: 'left_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'wall',
  },
  {
    mirrorPose: 'pose_vanity_casual_lean',
    framing: 'half_body',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'gentle_three_quarter_turn',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'candid',
    mirrorSupportObject: 'vanity',
  },
  {
    mirrorPose: 'pose_bed_edge_dynamic',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'balanced_relaxed',
    mirrorTorsoOrientation: 'facing_mirror',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'calm_screen_focus',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'bed_edge',
  },
  {
    mirrorPose: 'pose_chair_or_stool_sitting',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'balanced_relaxed',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'stool',
  },
  {
    mirrorPose: 'pose_candid_framing_check',
    framing: 'half_body',
    mirrorLensProfile: 'telephoto_70mm',
    mirrorStance: 'gentle_three_quarter_turn',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'both_hands',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'turning_toward_mirror',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'calm_screen_focus',
    mirrorPoseEnergy: 'candid',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_adjust_collar_sleeves',
    framing: 'half_body',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'gentle_three_quarter_turn',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'adjust_sleeve_or_collar',
    mirrorMovementMoment: 'finishing_outfit_adjustment',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'candid',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_hand_in_hair_jawline',
    framing: 'half_body',
    mirrorLensProfile: 'telephoto_70mm',
    mirrorStance: 'balanced_relaxed',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'left_hand',
    mirrorPhonePosition: 'shoulder_level',
    mirrorFreeHandAction: 'tuck_hair_behind_ear',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'asymmetrical_smirk',
    mirrorPoseEnergy: 'playful',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_prop_coffee_mug',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'contrapposto_weight_shift',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'hold_mug',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'coffee_mug',
  },
  {
    mirrorPose: 'pose_standing_three_quarter_turn',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'gentle_three_quarter_turn',
    mirrorTorsoOrientation: 'three_quarter_look_back',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_camera_lens',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'none',
  },
  {
    mirrorPose: 'pose_seated_forearm_knee_rest',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'balanced_relaxed',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'none_relaxed',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'calm_screen_focus',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'bed_edge',
  },
  {
    mirrorPose: 'pose_doorway_frame_lean',
    framing: 'three_quarter',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'light_shoulder_wall_lean',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'left_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'hand_at_hip_or_pocket',
    mirrorMovementMoment: 'still_composed',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'relaxed',
    mirrorSupportObject: 'wall',
  },
  {
    mirrorPose: 'pose_cuffed_sleeve_check',
    framing: 'half_body',
    mirrorLensProfile: 'main_23mm',
    mirrorStance: 'gentle_three_quarter_turn',
    mirrorTorsoOrientation: 'slight_angle_head_turned',
    phoneHand: 'right_hand',
    mirrorPhonePosition: 'chest_level',
    mirrorFreeHandAction: 'adjust_sleeve_or_collar',
    mirrorMovementMoment: 'finishing_outfit_adjustment',
    mirrorGaze: 'gaze_phone_screen',
    mirrorExpression: 'neutral_exact_lock',
    mirrorPoseEnergy: 'candid',
    mirrorSupportObject: 'none',
  },
];

/**
 * Picks a complete, coordinated, physically valid Mirror Studio pose bundle ("Surprise me"),
 * optionally avoiding the active preset to keep consecutive clicks fresh.
 */
export function generateConsistentMirrorPoseBundle(
  seed = Date.now(),
  currentPreset?: MirrorPoseType
): (typeof CURATED_MIRROR_SURPRISE_BUNDLES)[number] {
  const candidates =
    currentPreset && CURATED_MIRROR_SURPRISE_BUNDLES.length > 1
      ? CURATED_MIRROR_SURPRISE_BUNDLES.filter(
          (b) => b.mirrorPose !== currentPreset
        )
      : CURATED_MIRROR_SURPRISE_BUNDLES;
  const idx = Math.abs(Math.floor(seed)) % candidates.length;
  return { ...candidates[idx] };
}

/**
 * Validates scene selections directly and returns a clear validation result and localized warnings.
 */
export function validateSceneSelections(
  selections: Partial<SelfieSelections>
): ConflictDetectionResult {
  return detectSelectionConflicts(selections);
}

/**
 * Enforces compatibility rules across Strict Editing Mode, Scene Builder Mode, and Mirror Studio Mode.
 * Preserves clothingColor when clothing === 'preserve_reference' so normalizeSelections can interpret
 * an explicit color selection as a narrow lower-body garment recolor.
 */
export function enforceCompatibilityRules(
  input: SelfieSelections
): {
  selections: SelfieSelections;
  adjustments: string[];
  warnings: string[];
  conflicts: string[];
  lockedConflicts: LockedFieldConflict[];
} {
  const next: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...input,
    imageTreatments: [...(input.imageTreatments || ['no_beauty_filter'])],
  };

  if (next.workflowMode === 'mirror_studio') {
    next.selfieType = 'mirror';
  }

  const detected = detectSelectionConflicts(input);
  const adjustments: string[] = [...detected.warnings];
  const { lockedSet, lockedConflicts: topLockedConflicts } =
    evaluateLockedMirrorConflicts(next);
  let mirrorLockedConflicts: LockedFieldConflict[] = topLockedConflicts;

  // Strict Editing Mode compatibility enforcement (Rules 04, 05, 06)
  if (next.workflowMode === 'strict_editing') {
    if (next.strictLightingMode === 'mode_b_flash_mirror') {
      if (next.selfieType !== 'mirror') {
        next.selfieType = 'mirror';
        const msg =
          'تم ضبط نوع اللقطة إلى «صورة مرآة» لأن الوضع B يشترط فلاش الهاتف أمام المرآة (القاعدة 06).';
        if (!adjustments.includes(msg)) adjustments.push(msg);
      }
      if (next.phoneColor === 'hidden_front_camera') {
        next.phoneColor = 'black';
      }
    }
    if (next.strictLightingMode === 'mode_a_screen') {
      if (next.lighting === 'mode_b_phone_flash_mirror_dark') {
        next.lighting = 'mode_a_phone_screen_dark';
      }
      if (next.secondaryLighting === 'mode_b_phone_flash_mirror_dark') {
        next.secondaryLighting = undefined;
      }
    }
    if (!next.imageTreatments.includes('no_beauty_filter')) {
      next.imageTreatments = ['no_beauty_filter', ...next.imageTreatments];
    }
    if (next.mixedLightingEnabled) {
      next.mixedLightingEnabled = false;
      next.secondaryLighting = undefined;
      const msg =
        'تم إيقاف الإضاءة المختلطة لأن القاعدة 04 تمنع الجمع بين وضعي الإضاءة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  // Night mode cannot be combined with direct flash (respecting lockedFields)
  if (next.phoneProcessingProfile === 'night_mode') {
    const bothNightFlashLocked =
      lockedSet.has('phoneProcessingProfile') && lockedSet.has('lighting');
    if (!bothNightFlashLocked) {
      if (
        next.workflowMode === 'strict_editing' &&
        next.strictLightingMode === 'mode_b_flash_mirror'
      ) {
        next.strictLightingMode = 'mode_a_screen';
      }
      if (next.lighting === 'mode_b_phone_flash_mirror_dark') {
        if (!lockedSet.has('lighting')) {
          next.lighting = 'mode_a_phone_screen_dark';
        } else if (!lockedSet.has('phoneProcessingProfile')) {
          next.phoneProcessingProfile = 'natural_phone';
        }
      }
      if (next.secondaryLighting === 'mode_b_phone_flash_mirror_dark') {
        next.secondaryLighting = undefined;
        next.mixedLightingEnabled = false;
      }
    }
  }

  // Rule 1: Front-camera selfie constraints
  if (next.selfieType === 'front_camera') {
    if (next.phoneColor !== 'hidden_front_camera') {
      next.phoneColor = 'hidden_front_camera';
      const msg = 'تم إخفاء الهاتف تلقائيًا لأن التصوير بالكاميرا الأمامية.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
    if (next.gaze === 'at_mirror_reflection') {
      next.gaze = 'at_camera_lens';
      const msg =
        'تم تعديل اتجاه النظر إلى عدسة الهاتف لعدم وجود مرآة في الكاميرا الأمامية.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
    if (next.framing === 'full_body_mirror') {
      next.framing = 'half_body';
      const msg =
        'تم تعديل الكادر إلى «نصف الجسم» لأن خيار كامل الجسم يتطلب سيلفي أمام المرآة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
    if (next.background === 'full_length_mirror') {
      next.background = 'bed_and_nightstand';
      const msg =
        'تم تغيير الخلفية من مرآة طويلة إلى سرير وطاولة جانبية لمنع انعكاس المرآة مع الكاميرا الأمامية.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
    if (next.lighting === 'mode_b_phone_flash_mirror_dark') {
      next.lighting = 'mode_a_phone_screen_dark';
      const msg =
        'تم تحويل الإضاءة إلى الوضع A (شاشة الهاتف فقط) لأن الكاميرا الأمامية لا تستخدم مرآة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  // Rule 2: Mirror selfie constraints
  if (next.selfieType === 'mirror') {
    if (next.phoneColor === 'hidden_front_camera') {
      next.phoneColor = 'black';
      const msg = 'تم تحديد ظهور الهاتف باللون الأسود لأن السيلفي أمام المرآة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
    if (next.framing === 'full_body_mirror') {
      if (next.background !== 'full_length_mirror') {
        next.background = 'full_length_mirror';
        const msg =
          'تم ربط كادر «كامل الجسم» بوجود مرآة طويلة ومساحة مناسبة في الغرفة.';
        if (!adjustments.includes(msg)) adjustments.push(msg);
      }
      if (next.pose === 'pose_headboard_lean') {
        next.pose = 'rear_mirror_standing';
        const msg =
          'تم تعديل الوضعية إلى «تصوير في المرآة (وقوف اعتيادي)» لتتناسب مع كادر كامل الجسم أمام المرآة.';
        if (!adjustments.includes(msg)) adjustments.push(msg);
      }
    }
  }

  // Rule 3: When switching from preserve_reference to a new full outfit while clothingColor is still preserve_reference,
  // assign a default neutral color ('beige'). When clothing === 'preserve_reference', keep clothingColor intact
  // so normalizeSelections can interpret an explicit color choice as a lower-garment color-only edit.
  if (
    next.clothing !== 'preserve_reference' &&
    next.clothingColor === 'preserve_reference'
  ) {
    next.clothingColor = 'beige';
    const msg =
      'تم اختيار لون ملابس محايد (بيج) لأنك اخترت زيًا جديدًا بدلًا من ملابس الصورة المرجعية.';
    if (!adjustments.includes(msg)) adjustments.push(msg);
  }

  // Rule 3b: Upper garment preserve-reference precedence & garment-material/fit/pattern compatibility
  const upperPreservedByLegacy =
    next.workflowMode === 'scene_builder' &&
    next.upperGarment === undefined &&
    next.clothing === 'preserve_reference';
  const upperPreservedByChoice = next.upperGarment === 'preserve_reference';
  const strictPreservesUpper =
    next.workflowMode === 'strict_editing' && !next.strictUpperClothingEditEnabled;

  if (upperPreservedByLegacy || upperPreservedByChoice) {
    const hadConflictingUpper =
      (next.upperGarment !== undefined &&
        next.upperGarment !== 'preserve_reference') ||
      (next.upperGarmentColor !== undefined &&
        next.upperGarmentColor !== 'preserve_reference') ||
      Boolean(next.customUpperColorText?.trim()) ||
      Boolean(next.customUpperGarmentText?.trim());

    next.upperGarment = 'preserve_reference';
    next.upperGarmentColor = 'preserve_reference';
    next.customUpperColorText = '';
    next.customUpperGarmentText = '';

    if (hadConflictingUpper) {
      const msg =
        'تم الحفاظ على لون وخامة وقصة ونقشة الملابس العلوية من الصورة المرجعية وتعطيل التعديلات المتعارضة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  } else if (!strictPreservesUpper && next.upperGarment !== undefined) {
    const chosenGarment = next.upperGarment;

    if (next.upperGarmentColor === 'preserve_reference') {
      next.upperGarmentColor = 'beige';
    }

    const compatMaterials = getCompatibleMaterialsForGarment(chosenGarment);
    if (
      next.upperGarmentMaterial &&
      !compatMaterials.includes(next.upperGarmentMaterial)
    ) {
      next.upperGarmentMaterial = compatMaterials[0];
      const msg =
        'تم تعديل خامة القماش العلوية لتتوافق مع نوع القطعة العلوية المختارة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }

    const compatFits = getCompatibleFitsForGarment(chosenGarment);
    if (next.upperGarmentFit && !compatFits.includes(next.upperGarmentFit)) {
      next.upperGarmentFit = compatFits.includes('relaxed')
        ? 'relaxed'
        : compatFits[0];
      const msg =
        'تم ضبط قصة القطعة العلوية لتكون محتشمة ومتوافقة مع تصميم القطعة المختارة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }

    const compatPatterns = getCompatiblePatternsForGarment(chosenGarment);
    if (
      next.upperGarmentPattern &&
      !compatPatterns.includes(next.upperGarmentPattern)
    ) {
      next.upperGarmentPattern = compatPatterns.includes('subtle_texture')
        ? 'subtle_texture'
        : compatPatterns[0];
      const msg =
        'تم ضبط نقشة القطعة العلوية لتتناسب مع نسيج القطعة المختارة بشكل واقعي.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  // Rule 3c: Lower garment independent preserve-reference & material/fit/pattern compatibility
  const lowerPreservedByLegacy =
    next.workflowMode === 'scene_builder' &&
    next.lowerGarment === undefined &&
    next.clothing === 'preserve_reference' &&
    next.clothingColor === 'preserve_reference';
  const lowerPreservedByChoice =
    (next.workflowMode === 'strict_editing' &&
      next.strictLowerClothingMode === 'preserve_reference') ||
    (next.lowerGarment === 'preserve_reference' &&
      !(
        next.workflowMode === 'strict_editing' &&
        next.strictLowerClothingMode === 'recolor_only'
      ));

  if (lowerPreservedByLegacy || lowerPreservedByChoice) {
    const hadConflictingLower =
      (next.lowerGarment !== undefined &&
        next.lowerGarment !== 'preserve_reference') ||
      (next.lowerGarmentColor !== undefined &&
        next.lowerGarmentColor !== 'preserve_reference') ||
      Boolean(next.customLowerGarmentColorText?.trim()) ||
      Boolean(next.customLowerGarmentText?.trim());

    if (lowerPreservedByChoice) {
      next.lowerGarment = 'preserve_reference';
      next.lowerGarmentColor = 'preserve_reference';
      next.customLowerGarmentColorText = '';
      next.customLowerGarmentText = '';
    }

    if (hadConflictingLower) {
      const msg =
        'تم الحفاظ على لون وخامة وقصة ونقشة الملابس السفلية من الصورة المرجعية وتعطيل التعديلات المتعارضة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  } else if (
    next.workflowMode === 'strict_editing' &&
    next.strictLowerClothingMode === 'recolor_only'
  ) {
    if (next.lowerGarment === 'preserve_reference') {
      next.lowerGarment = undefined;
    }
  } else if (next.lowerGarment !== undefined) {
    const chosenLower = next.lowerGarment;

    if (next.lowerGarmentColor === 'preserve_reference') {
      next.lowerGarmentColor = 'charcoal';
    }

    const compatLowerMaterials = getCompatibleMaterialsForLowerGarment(chosenLower);
    if (
      next.lowerGarmentMaterial &&
      !compatLowerMaterials.includes(next.lowerGarmentMaterial)
    ) {
      next.lowerGarmentMaterial = compatLowerMaterials[0];
      const msg =
        'تم تعديل خامة القماش السفلية لتتوافق مع نوع القطعة السفلية المختارة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }

    const compatLowerFits = getCompatibleFitsForLowerGarment(chosenLower);
    if (next.lowerGarmentFit && !compatLowerFits.includes(next.lowerGarmentFit)) {
      next.lowerGarmentFit = compatLowerFits.includes('relaxed')
        ? 'relaxed'
        : compatLowerFits[0];
      const msg =
        'تم ضبط قصة القطعة السفلية لتكون محتشمة ومتوافقة مع تصميم القطعة المختارة.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }

    const compatLowerPatterns = getCompatiblePatternsForLowerGarment(chosenLower);
    if (
      next.lowerGarmentPattern &&
      !compatLowerPatterns.includes(next.lowerGarmentPattern)
    ) {
      next.lowerGarmentPattern = compatLowerPatterns.includes('subtle_texture')
        ? 'subtle_texture'
        : compatLowerPatterns[0];
      const msg =
        'تم ضبط نقشة القطعة السفلية لتتناسب مع نسيج القطعة المختارة بشكل واقعي.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  // Rule 4: Lighting conflict prevention
  if (
    next.lighting === 'mode_a_phone_screen_dark' ||
    next.lighting === 'mode_b_phone_flash_mirror_dark'
  ) {
    if (next.mixedLightingEnabled) {
      next.mixedLightingEnabled = false;
      next.secondaryLighting = undefined;
      const msg =
        'لا يمكن دمج إضاءة إضافية مع أوضاع الغرفة المظلمة الصارمة (الوضع A أو B).';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  } else if (!next.mixedLightingEnabled) {
    next.secondaryLighting = undefined;
  } else if (next.secondaryLighting) {
    const daytimeLights = ['morning_window', 'soft_daylight', 'late_afternoon'];
    if (
      daytimeLights.includes(next.lighting) &&
      daytimeLights.includes(next.secondaryLighting) &&
      next.lighting !== next.secondaryLighting
    ) {
      next.secondaryLighting = 'warm_bedside_lamp';
      const msg =
        'تم ضبط الإضاءة الثانوية إلى «مصباح جانبي دافئ» لمنع تعارض أوقات ضوء الشمس.';
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  if (next.imageTreatments.length === 0) {
    next.imageTreatments = ['no_beauty_filter'];
  }

  // Rule 5: Mirror Studio canonical pose, framing, support, phone-hand, lens, and gaze resolver
  if (next.workflowMode === 'mirror_studio') {
    const mirrorResolved = resolveMirrorPoseConfiguration({
      ...next,
      // Preserve whether mirrorSupportObject was explicitly supplied in raw input
      mirrorSupportObject: input.mirrorSupportObject,
    });
    Object.assign(next, mirrorResolved.resolvedSelections);
    mirrorLockedConflicts = mirrorResolved.lockedConflicts;
    for (const msg of mirrorResolved.adjustments) {
      if (!adjustments.includes(msg)) adjustments.push(msg);
    }
  }

  return {
    selections: next,
    adjustments,
    warnings: adjustments,
    conflicts: detected.conflicts,
    lockedConflicts: mirrorLockedConflicts,
  };
}

/**
 * STAGE 1: Normalize raw user selections into a single StructuredSceneConfig (Source of Truth).
 */
export function normalizeSelections(
  rawInput: Partial<SelfieSelections>
): StructuredSceneConfig {
  const fullInput: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...rawInput,
    imageTreatments: [
      ...(rawInput.imageTreatments || DEFAULT_SELECTIONS.imageTreatments),
    ],
  };

  const { selections, lockedConflicts } = enforceCompatibilityRules(fullInput);
  const biomechanics = solveBiomechanicsAndPhysics(selections);

  // Determine CameraMode
  let cameraMode: CameraMode = 'front_selfie';
  const stationaryRearPoses = [
    'rear_tripod_bed_sitting',
    'rear_tripod_lying_reading',
    'rear_propped_low_angle',
    'rear_desk_profile',
  ];

  if (selections.workflowMode === 'mirror_studio') {
    cameraMode = 'rear_mirror';
  } else if (selections.workflowMode === 'strict_editing') {
    if (selections.strictLightingMode === 'mode_b_flash_mirror') {
      cameraMode = 'rear_mirror';
    } else {
      cameraMode = 'front_selfie';
    }
  } else {
    if (selections.selfieType === 'mirror') {
      cameraMode = 'rear_mirror';
    } else if (stationaryRearPoses.includes(selections.pose)) {
      cameraMode = 'rear_stationary';
    } else {
      cameraMode = 'front_selfie';
    }
  }

  // Determine PhoneProcessingProfile
  const phoneProcessingProfile: PhoneProcessingProfile =
    rawInput.phoneProcessingProfile ?? 'natural_phone';

  // Determine LightingSource
  let lightingSource: LightingSource = 'morning_window';
  let lightingModifier = '';

  if (selections.workflowMode === 'mirror_studio') {
    if (
      rawInput.lighting === 'mode_a_phone_screen_dark' ||
      phoneProcessingProfile === 'night_mode'
    ) {
      lightingSource = 'screen_only';
    } else {
      lightingSource = 'direct_flash';
    }
  } else if (selections.workflowMode === 'strict_editing') {
    if (selections.strictLightingMode === 'unselected') {
      lightingSource = 'unselected';
    } else if (
      selections.strictLightingMode === 'mode_a_screen' ||
      phoneProcessingProfile === 'night_mode'
    ) {
      lightingSource = 'screen_only';
      lightingModifier = findPhrase(
        SCREEN_ORIENTATION_OPTIONS,
        selections.screenOrientation
      );
    } else {
      lightingSource = 'direct_flash';
      lightingModifier = findPhrase(
        FLASH_MIRROR_GEOMETRY_OPTIONS,
        selections.flashMirrorGeometry
      );
    }
  } else {
    if (
      selections.lighting === 'mode_a_phone_screen_dark' ||
      (selections.lighting === 'mode_b_phone_flash_mirror_dark' &&
        phoneProcessingProfile === 'night_mode')
    ) {
      lightingSource = 'screen_only';
    } else if (selections.lighting === 'mode_b_phone_flash_mirror_dark') {
      lightingSource = 'direct_flash';
    } else {
      lightingSource = selections.lighting;
    }
  }

  // Secondary lighting source
  let secondaryLightingSource: LightingSource | undefined;
  if (
    selections.mixedLightingEnabled &&
    selections.secondaryLighting &&
    selections.secondaryLighting !== selections.lighting &&
    lightingSource !== 'screen_only' &&
    lightingSource !== 'direct_flash'
  ) {
    if (selections.secondaryLighting === 'mode_a_phone_screen_dark') {
      secondaryLightingSource = 'screen_only';
    } else if (
      selections.secondaryLighting === 'mode_b_phone_flash_mirror_dark'
    ) {
      secondaryLightingSource =
        phoneProcessingProfile === 'night_mode' ? undefined : 'direct_flash';
    } else {
      secondaryLightingSource = selections.secondaryLighting;
    }
  }

  // FocusTarget
  const focusTarget: FocusTarget =
    rawInput.focusTarget ??
    (cameraMode === 'rear_mirror' ? 'mirror_reflection' : 'subject_face');

  // ExposurePreference
  const exposurePreference: ExposurePreference =
    rawInput.exposurePreference ??
    (lightingSource === 'screen_only'
      ? 'low_key_shadow_preserving'
      : lightingSource === 'direct_flash'
        ? 'flash_highlight_controlled'
        : 'balanced');

  // ClothingEdits (Independent normalized Upper and Lower garment specs)
  const effectiveUpper = getEffectiveUpperClothingState(selections);
  const effectiveLower = getEffectiveLowerClothingState(selections);

  const upperSpec: NormalizedGarmentEditSpec<
    UpperGarmentType,
    UpperGarmentColorType,
    UpperGarmentMaterialType,
    UpperGarmentFitType,
    UpperGarmentPatternType
  > = (() => {
    const strictBlockedUpper =
      selections.workflowMode === 'strict_editing' &&
      !selections.strictUpperClothingEditEnabled;
    if (strictBlockedUpper || effectiveUpper.isPreservingUpper) {
      return {
        editMode: 'preserve_reference',
        preserveReference: true,
        garment: 'preserve_reference',
        color: 'preserve_reference',
        colorPhrase: 'preserving the original upper garment color from the reference photo',
        garmentPhrase:
          'preserving the original upper-body garment color, material, cut, fit, and pattern from the reference image unchanged',
      };
    }

    if (
      selections.workflowMode === 'mirror_studio' &&
      selections.upperGarment === undefined
    ) {
      const legacyMirrorTop =
        findPhrase(MIRROR_CLOTHING_PHYSICS_OPTIONS, selections.mirrorClothing) ||
        MIRROR_CLOTHING_PHYSICS_OPTIONS[0].enPhrase;
      const upperColorDesc = resolveUpperGarmentColorPhrase(
        effectiveUpper.upperGarmentColor,
        selections.customUpperColorText
      );
      const basePhysics = buildUpperFabricPhysicsPhrase({
        garment: effectiveUpper.upperGarment,
        colorPhrase: upperColorDesc,
        material: effectiveUpper.upperGarmentMaterial,
        fit: effectiveUpper.upperGarmentFit,
        pattern: effectiveUpper.upperGarmentPattern,
        compact: true,
        framing: selections.framing,
      });
      const physicsPhrase = `${basePhysics}; ${biomechanics.garmentPhysics.upperPoseCouplingPhrase}`;
      return {
        editMode: 'edit_garment',
        preserveReference: false,
        garment: effectiveUpper.upperGarment,
        color: effectiveUpper.upperGarmentColor,
        colorPhrase: upperColorDesc,
        material: effectiveUpper.upperGarmentMaterial,
        fit: effectiveUpper.upperGarmentFit,
        pattern: effectiveUpper.upperGarmentPattern,
        garmentPhrase: `${legacyMirrorTop} ${physicsPhrase}.`,
        fabricPhysicsPhrase: physicsPhrase,
      };
    }

    if (
      selections.workflowMode === 'scene_builder' &&
      selections.upperGarment === undefined &&
      selections.clothing !== 'preserve_reference'
    ) {
      const customOutfit = sanitizeCustomText(selections.customClothingText);
      const baseClothing =
        selections.clothing === 'custom_clothing' && customOutfit
          ? customOutfit
          : findPhrase(CLOTHING_OPTIONS, selections.clothing);
      const customColor = sanitizeCustomText(selections.customClothingColorText);
      const colorDesc =
        selections.clothingColor === 'custom_color' && customColor
          ? customColor
          : findPhrase(CLOTHING_COLOR_OPTIONS, selections.clothingColor);
      return {
        editMode: 'edit_garment',
        preserveReference: false,
        garment: effectiveUpper.upperGarment,
        color: effectiveUpper.upperGarmentColor,
        colorPhrase: colorDesc,
        material: effectiveUpper.upperGarmentMaterial,
        fit: effectiveUpper.upperGarmentFit,
        pattern: effectiveUpper.upperGarmentPattern,
        garmentPhrase: `wearing ${baseClothing} in ${colorDesc}`,
      };
    }

    const upperDesc = resolveUpperGarmentDescriptor(
      effectiveUpper.upperGarment,
      selections.customUpperGarmentText
    );
    const upperColorDesc = resolveUpperGarmentColorPhrase(
      effectiveUpper.upperGarmentColor,
      selections.customUpperColorText
    );
    const materialDesc = findPhrase(
      UPPER_GARMENT_MATERIAL_OPTIONS,
      effectiveUpper.upperGarmentMaterial
    );
    const fitDesc = findPhrase(
      UPPER_GARMENT_FIT_OPTIONS,
      effectiveUpper.upperGarmentFit
    );
    const patternDesc = findPhrase(
      UPPER_GARMENT_PATTERN_OPTIONS,
      effectiveUpper.upperGarmentPattern
    );
    const isCompactMode =
      selections.workflowMode === 'scene_builder' ||
      (selections.workflowMode === 'strict_editing' &&
        selections.strictOutputFormat !== 'full_12_rules');
    const basePhysicsPhrase = buildUpperFabricPhysicsPhrase({
      garment: effectiveUpper.upperGarment,
      colorPhrase: upperColorDesc,
      material: effectiveUpper.upperGarmentMaterial,
      fit: effectiveUpper.upperGarmentFit,
      pattern: effectiveUpper.upperGarmentPattern,
      compact: isCompactMode,
      framing: selections.framing,
    });
    const coupledUpper = buildPoseCoupledUpperFabricPhysics({
      garment: effectiveUpper.upperGarment,
      colorPhrase: upperColorDesc,
      material: effectiveUpper.upperGarmentMaterial,
      fit: effectiveUpper.upperGarmentFit,
      pattern: effectiveUpper.upperGarmentPattern,
      framing: selections.framing,
      phoneHand: selections.phoneHand || 'right_hand',
      phonePosition: selections.mirrorPhonePosition || 'chest_level',
      freeHandAction: selections.mirrorFreeHandAction || 'none_relaxed',
      supportObject: selections.mirrorSupportObject || 'none',
      postureType: biomechanics.gravityBalance.postureType,
      compact: true,
    });
    const physicsPhrase = isCompactMode
      ? basePhysicsPhrase
      : `${basePhysicsPhrase}; ${coupledUpper}`;

    const garmentPhrase =
      selections.workflowMode === 'mirror_studio'
        ? `Wearing ${upperDesc} in ${upperColorDesc} ${materialDesc} (${fitDesc}, ${patternDesc}), ${physicsPhrase}.`
        : selections.workflowMode === 'strict_editing'
          ? `${upperDesc} in ${upperColorDesc} ${materialDesc} with ${fitDesc} and ${patternDesc}`
          : `wearing ${upperDesc} in ${upperColorDesc} ${materialDesc} with a ${fitDesc} and ${patternDesc}`;

    return {
      editMode: 'edit_garment',
      preserveReference: false,
      garment: effectiveUpper.upperGarment,
      customGarmentText: sanitizeCustomText(selections.customUpperGarmentText || '') || undefined,
      color: effectiveUpper.upperGarmentColor,
      customColorText: sanitizeCustomText(selections.customUpperColorText || '') || undefined,
      colorPhrase: upperColorDesc,
      material: effectiveUpper.upperGarmentMaterial,
      fit: effectiveUpper.upperGarmentFit,
      pattern: effectiveUpper.upperGarmentPattern,
      garmentPhrase,
      fabricPhysicsPhrase: physicsPhrase,
    };
  })();

  const lowerSpec: NormalizedGarmentEditSpec<
    LowerGarmentType,
    LowerGarmentColorType,
    LowerGarmentMaterialType,
    LowerGarmentFitType,
    LowerGarmentPatternType
  > = (() => {
    if (effectiveLower.editMode === 'preserve_reference') {
      return {
        editMode: 'preserve_reference',
        preserveReference: true,
        garment: 'preserve_reference',
        color: 'preserve_reference',
        colorPhrase: 'preserving the original lower garment color from the reference photo',
        garmentPhrase:
          'preserving the original lower-body garment type, color, material, cut, fit, and pattern from the reference image unchanged',
      };
    }

    if (effectiveLower.editMode === 'recolor_only') {
      const recolorPhrase =
        selections.workflowMode === 'strict_editing'
          ? resolveLowerBodyColorPhrase(selections)
          : (() => {
              const customColor = sanitizeCustomText(selections.customClothingColorText);
              return (
                (selections.clothingColor === 'custom_color' && customColor
                  ? customColor
                  : findPhrase(CLOTHING_COLOR_OPTIONS, selections.clothingColor)) ||
                'a coordinated neutral tone'
              );
            })();
      return {
        editMode: 'recolor_only',
        preserveReference: false,
        garment: 'preserve_reference',
        color: effectiveLower.lowerGarmentColor,
        colorPhrase: recolorPhrase,
        garmentPhrase: `recoloring only the lower-body garment to ${recolorPhrase} while preserving its original cut, fabric weave, seams, and fit`,
      };
    }

    if (
      selections.workflowMode === 'mirror_studio' &&
      selections.lowerGarment === undefined
    ) {
      const legacyMirrorBottom =
        findPhrase(MIRROR_BOTTOM_CLOTHING_OPTIONS, selections.mirrorBottomClothing) ||
        MIRROR_BOTTOM_CLOTHING_OPTIONS[0].enPhrase;
      const lowerColorDesc = resolveLowerGarmentColorPhrase(
        effectiveLower.lowerGarmentColor,
        selections.customLowerGarmentColorText
      );
      const baseLowerPhysics = buildLowerFabricPhysicsPhrase({
        garment: effectiveLower.lowerGarment,
        colorPhrase: lowerColorDesc,
        material: effectiveLower.lowerGarmentMaterial,
        fit: effectiveLower.lowerGarmentFit,
        pattern: effectiveLower.lowerGarmentPattern,
        compact: true,
        framing: selections.framing,
      });
      const lowerPhysicsPhrase = `${baseLowerPhysics}; ${biomechanics.garmentPhysics.lowerPoseCouplingPhrase}`;
      return {
        editMode: 'edit_garment',
        preserveReference: false,
        garment: effectiveLower.lowerGarment,
        color: effectiveLower.lowerGarmentColor,
        colorPhrase: lowerColorDesc,
        material: effectiveLower.lowerGarmentMaterial,
        fit: effectiveLower.lowerGarmentFit,
        pattern: effectiveLower.lowerGarmentPattern,
        garmentPhrase: legacyMirrorBottom,
        fabricPhysicsPhrase: lowerPhysicsPhrase,
      };
    }

    if (
      selections.workflowMode === 'scene_builder' &&
      selections.lowerGarment === undefined &&
      selections.upperGarment !== undefined
    ) {
      const legacyLowerPhrase = deriveLegacyLowerClothingPhrase(selections);
      return {
        editMode: 'edit_garment',
        preserveReference: false,
        garment: effectiveLower.lowerGarment,
        color: effectiveLower.lowerGarmentColor,
        colorPhrase: resolveLowerGarmentColorPhrase(
          effectiveLower.lowerGarmentColor,
          selections.customLowerGarmentColorText
        ),
        material: effectiveLower.lowerGarmentMaterial,
        fit: effectiveLower.lowerGarmentFit,
        pattern: effectiveLower.lowerGarmentPattern,
        garmentPhrase: legacyLowerPhrase,
      };
    }

    if (
      selections.workflowMode === 'scene_builder' &&
      selections.lowerGarment === undefined &&
      selections.upperGarment === undefined
    ) {
      return {
        editMode: 'edit_garment',
        preserveReference: false,
        garment: effectiveLower.lowerGarment,
        color: effectiveLower.lowerGarmentColor,
        colorPhrase: resolveLowerGarmentColorPhrase(
          effectiveLower.lowerGarmentColor,
          selections.customLowerGarmentColorText
        ),
        material: effectiveLower.lowerGarmentMaterial,
        fit: effectiveLower.lowerGarmentFit,
        pattern: effectiveLower.lowerGarmentPattern,
        garmentPhrase: '',
      };
    }

    const lowerDesc = resolveLowerGarmentDescriptor(
      effectiveLower.lowerGarment,
      selections.customLowerGarmentText
    );
    const lowerColorDesc = resolveLowerGarmentColorPhrase(
      effectiveLower.lowerGarmentColor,
      selections.customLowerGarmentColorText
    );
    const lowerMaterialDesc = findPhrase(
      LOWER_GARMENT_MATERIAL_OPTIONS,
      effectiveLower.lowerGarmentMaterial
    );
    const lowerFitDesc = findPhrase(
      LOWER_GARMENT_FIT_OPTIONS,
      effectiveLower.lowerGarmentFit
    );
    const lowerPatternDesc = findPhrase(
      LOWER_GARMENT_PATTERN_OPTIONS,
      effectiveLower.lowerGarmentPattern
    );
    const isLowerCompact =
      selections.workflowMode === 'scene_builder' ||
      (selections.workflowMode === 'strict_editing' &&
        selections.strictOutputFormat !== 'full_12_rules');
    const baseLowerPhysicsPhrase = buildLowerFabricPhysicsPhrase({
      garment: effectiveLower.lowerGarment,
      colorPhrase: lowerColorDesc,
      material: effectiveLower.lowerGarmentMaterial,
      fit: effectiveLower.lowerGarmentFit,
      pattern: effectiveLower.lowerGarmentPattern,
      compact: isLowerCompact,
      framing: selections.framing,
    });
    const coupledLower = buildPoseCoupledLowerFabricPhysics({
      garment: effectiveLower.lowerGarment,
      colorPhrase: lowerColorDesc,
      material: effectiveLower.lowerGarmentMaterial,
      fit: effectiveLower.lowerGarmentFit,
      pattern: effectiveLower.lowerGarmentPattern,
      framing: selections.framing,
      freeHandAction: selections.mirrorFreeHandAction || 'none_relaxed',
      postureType: biomechanics.gravityBalance.postureType,
      compact: true,
    });
    const lowerPhysicsPhrase = isLowerCompact
      ? baseLowerPhysicsPhrase
      : `${baseLowerPhysicsPhrase}; ${coupledLower}`;

    const garmentPhrase =
      selections.workflowMode === 'mirror_studio'
        ? `Wearing ${lowerDesc} in ${lowerColorDesc} ${lowerMaterialDesc} (${lowerFitDesc}, ${lowerPatternDesc}), ${lowerPhysicsPhrase}.`
        : `${lowerDesc} in ${lowerColorDesc} ${lowerMaterialDesc} with a ${lowerFitDesc} and ${lowerPatternDesc}`;

    return {
      editMode: 'edit_garment',
      preserveReference: false,
      garment: effectiveLower.lowerGarment,
      customGarmentText: sanitizeCustomText(selections.customLowerGarmentText || '') || undefined,
      color: effectiveLower.lowerGarmentColor,
      customColorText: sanitizeCustomText(selections.customLowerGarmentColorText || '') || undefined,
      colorPhrase: lowerColorDesc,
      material: effectiveLower.lowerGarmentMaterial,
      fit: effectiveLower.lowerGarmentFit,
      pattern: effectiveLower.lowerGarmentPattern,
      garmentPhrase,
      fabricPhysicsPhrase: lowerPhysicsPhrase,
    };
  })();

  let clothingEdits: ClothingEditSpec;
  if (selections.workflowMode === 'mirror_studio') {
    clothingEdits = {
      mode: 'mirror_outfit',
      upper: upperSpec,
      lower: lowerSpec,
      upperGarment: upperSpec.garment,
      upperGarmentColor: upperSpec.color,
      upperGarmentMaterial: upperSpec.preserveReference ? undefined : upperSpec.material,
      upperGarmentFit: upperSpec.preserveReference ? undefined : upperSpec.fit,
      upperGarmentPattern: upperSpec.preserveReference ? undefined : upperSpec.pattern,
      upperClothingPhrase: upperSpec.garmentPhrase,
      upperFabricPhysicsPhrase: upperSpec.fabricPhysicsPhrase,
      lowerGarment: lowerSpec.garment,
      lowerGarmentColor: lowerSpec.color,
      lowerGarmentMaterial: lowerSpec.preserveReference ? undefined : lowerSpec.material,
      lowerGarmentFit: lowerSpec.preserveReference ? undefined : lowerSpec.fit,
      lowerGarmentPattern: lowerSpec.preserveReference ? undefined : lowerSpec.pattern,
      lowerClothingPhrase: lowerSpec.garmentPhrase,
      lowerFabricPhysicsPhrase: lowerSpec.fabricPhysicsPhrase,
      preserveCutAndFabric: false,
      preserveUpperClothing: upperSpec.preserveReference,
      preserveLowerClothing: lowerSpec.preserveReference,
    };
  } else if (selections.workflowMode === 'strict_editing') {
    const mode: ClothingEditSpec['mode'] =
      upperSpec.preserveReference && lowerSpec.preserveReference
        ? 'preserve_reference'
        : upperSpec.preserveReference && lowerSpec.editMode === 'recolor_only'
          ? 'recolor_lower_only'
          : !upperSpec.preserveReference && lowerSpec.preserveReference
            ? 'edit_upper_only'
            : upperSpec.preserveReference && lowerSpec.editMode === 'edit_garment'
              ? 'full_outfit'
              : 'edit_both_independently';

    clothingEdits = {
      mode,
      upper: upperSpec,
      lower: lowerSpec,
      lowerBodyColorPhrase: lowerSpec.colorPhrase,
      upperGarment: upperSpec.garment,
      upperGarmentColor: upperSpec.color,
      upperGarmentMaterial: upperSpec.preserveReference ? undefined : upperSpec.material,
      upperGarmentFit: upperSpec.preserveReference ? undefined : upperSpec.fit,
      upperGarmentPattern: upperSpec.preserveReference ? undefined : upperSpec.pattern,
      upperClothingPhrase: upperSpec.preserveReference ? undefined : upperSpec.garmentPhrase,
      upperFabricPhysicsPhrase: upperSpec.fabricPhysicsPhrase,
      lowerGarment: lowerSpec.garment,
      lowerGarmentColor: lowerSpec.color,
      lowerGarmentMaterial:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.material : undefined,
      lowerGarmentFit:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.fit : undefined,
      lowerGarmentPattern:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.pattern : undefined,
      lowerClothingPhrase:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.garmentPhrase : undefined,
      lowerFabricPhysicsPhrase: lowerSpec.fabricPhysicsPhrase,
      preserveCutAndFabric:
        lowerSpec.preserveReference || lowerSpec.editMode === 'recolor_only',
      preserveUpperClothing: upperSpec.preserveReference,
      preserveLowerClothing: lowerSpec.preserveReference,
    };
  } else {
    const mode: ClothingEditSpec['mode'] =
      upperSpec.preserveReference && lowerSpec.preserveReference
        ? 'preserve_reference'
        : upperSpec.preserveReference && lowerSpec.editMode === 'recolor_only'
          ? 'recolor_lower_only'
          : 'full_outfit';

    clothingEdits = {
      mode,
      upper: upperSpec,
      lower: lowerSpec,
      lowerBodyColorPhrase:
        lowerSpec.editMode === 'recolor_only' ? lowerSpec.colorPhrase : undefined,
      upperGarment: upperSpec.garment,
      upperGarmentColor: upperSpec.color,
      upperGarmentMaterial: upperSpec.preserveReference ? undefined : upperSpec.material,
      upperGarmentFit: upperSpec.preserveReference ? undefined : upperSpec.fit,
      upperGarmentPattern: upperSpec.preserveReference ? undefined : upperSpec.pattern,
      upperClothingPhrase:
        mode === 'preserve_reference' || mode === 'recolor_lower_only'
          ? undefined
          : upperSpec.garmentPhrase,
      upperFabricPhysicsPhrase: upperSpec.fabricPhysicsPhrase,
      lowerGarment: lowerSpec.garment,
      lowerGarmentColor: lowerSpec.color,
      lowerGarmentMaterial:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.material : undefined,
      lowerGarmentFit:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.fit : undefined,
      lowerGarmentPattern:
        lowerSpec.editMode === 'edit_garment' ? lowerSpec.pattern : undefined,
      lowerClothingPhrase: lowerSpec.garmentPhrase || undefined,
      lowerFabricPhysicsPhrase: lowerSpec.fabricPhysicsPhrase,
      preserveCutAndFabric:
        mode === 'preserve_reference' || mode === 'recolor_lower_only',
      preserveUpperClothing: upperSpec.preserveReference,
      preserveLowerClothing: lowerSpec.preserveReference,
    };
  }

  // CaptureArtifacts (only included when selected or clearly appropriate to the chosen profile)
  const rawArtifacts = (rawInput.captureArtifacts || []).filter(
    (a) =>
      !(
        selections.workflowMode === 'mirror_studio' &&
        !selections.mirrorMotionBlurEnabled &&
        a === 'slight_hand_motion_blur'
      )
  );
  const captureArtifacts: CaptureArtifactType[] = [...rawArtifacts];
  const isLowLight =
    lightingSource === 'screen_only' ||
    lightingSource === 'direct_flash' ||
    lightingSource === 'warm_bedside_lamp' ||
    phoneProcessingProfile === 'night_mode' ||
    phoneProcessingProfile === 'raw_low_light';

  if (
    (isLowLight || selections.imageTreatments.includes('subtle_grain')) &&
    !captureArtifacts.includes('subtle_shadow_noise')
  ) {
    captureArtifacts.push('subtle_shadow_noise');
  }
  if (
    lightingSource === 'direct_flash' &&
    phoneProcessingProfile !== 'night_mode' &&
    !captureArtifacts.includes('flash_falloff')
  ) {
    captureArtifacts.push('flash_falloff');
  }
  if (
    phoneProcessingProfile === 'natural_hdr' &&
    !captureArtifacts.includes('natural_hdr_tonemapping')
  ) {
    captureArtifacts.push('natural_hdr_tonemapping');
  }
  if (
    selections.workflowMode === 'mirror_studio' &&
    Boolean(selections.mirrorMotionBlurEnabled) &&
    !captureArtifacts.includes('slight_hand_motion_blur')
  ) {
    captureArtifacts.push('slight_hand_motion_blur');
  }

  // Mirror Studio lens profile & composable pose composition
  const mirrorLensProfile: MirrorLensProfileType | undefined =
    selections.workflowMode === 'mirror_studio'
      ? selections.mirrorLensProfile &&
        XIAOMI_15_ULTRA_LENS_PROFILES[selections.mirrorLensProfile]
        ? selections.mirrorLensProfile
        : 'main_23mm'
      : undefined;
  const mirrorCameraSpec: MirrorLensSpec | undefined = mirrorLensProfile
    ? XIAOMI_15_ULTRA_LENS_PROFILES[mirrorLensProfile]
    : undefined;
  const mirrorPoseResolved =
    selections.workflowMode === 'mirror_studio'
      ? resolveMirrorPoseConfiguration(selections)
      : undefined;
  const mirrorPoseComposition: MirrorPoseCompositionSpec | undefined =
    mirrorPoseResolved?.poseComposition;

  // Pose, Expression, Gaze, Hair
  let pose = '';
  if (selections.workflowMode === 'mirror_studio' && mirrorPoseComposition) {
    pose =
      mirrorPoseComposition.poseDescription ||
      buildResolvedMirrorPoseDescription(mirrorPoseComposition);
  } else {
    pose =
      selections.workflowMode === 'mirror_studio'
        ? findPhrase(MIRROR_POSE_OPTIONS, selections.mirrorPose) ||
          MIRROR_POSE_OPTIONS[0].enPhrase
        : findPhrase(POSE_OPTIONS, selections.pose) || POSE_OPTIONS[0].enPhrase;
  }

  const expression =
    selections.workflowMode === 'mirror_studio'
      ? findPhrase(MIRROR_EXPRESSION_OPTIONS, selections.mirrorExpression) ||
        MIRROR_EXPRESSION_OPTIONS[0].enPhrase
      : findPhrase(EXPRESSION_OPTIONS, selections.expression) ||
        EXPRESSION_OPTIONS[0].enPhrase;

  const gaze =
    selections.workflowMode === 'mirror_studio'
      ? findPhrase(
          MIRROR_GAZE_OPTIONS,
          mirrorPoseComposition?.gaze || selections.mirrorGaze
        ) || MIRROR_GAZE_OPTIONS[0].enPhrase
      : findPhrase(GAZE_OPTIONS, selections.gaze) || GAZE_OPTIONS[0].enPhrase;

  const hair =
    selections.workflowMode === 'mirror_studio'
      ? findPhrase(MIRROR_HAIR_PHYSICS_OPTIONS, selections.mirrorHair) ||
        MIRROR_HAIR_PHYSICS_OPTIONS[0].enPhrase
      : selections.hair === 'match_reference'
        ? 'reference hairstyle'
        : selections.hair === 'neatly_styled'
          ? 'neatly groomed hairstyle'
          : selections.hair === 'slightly_casual'
            ? 'natural, slightly casual hairstyle'
            : findPhrase(HAIR_OPTIONS, selections.hair) || 'natural hairstyle';

  const framing = findPhrase(
    FRAMING_OPTIONS,
    mirrorPoseComposition?.framing || selections.framing
  );
  const cameraAngle = findPhrase(CAMERA_ANGLE_OPTIONS, selections.cameraAngle);

  // Room & Background descriptions
  const roomStylePhrase = findPhrase(ROOM_STYLE_OPTIONS, selections.roomStyle);
  const roomTidinessPhrase = findPhrase(
    ROOM_TIDINESS_OPTIONS,
    selections.roomTidiness
  );
  const customRoomColor = sanitizeCustomText(selections.customRoomColorsText);
  const roomColorPhrase =
    selections.roomColors === 'custom_room_colors' && customRoomColor
      ? `a ${customRoomColor} color palette`
      : findPhrase(ROOM_COLOR_OPTIONS, selections.roomColors);
  const roomDescription = `${roomStylePhrase} with ${roomColorPhrase}, ${roomTidinessPhrase}`;
  const backgroundDescription = findPhrase(
    BACKGROUND_OPTIONS,
    selections.background
  );

  // Phone description
  let phoneDescription = '';
  if (selections.workflowMode === 'mirror_studio' && mirrorPoseComposition) {
    const phonePosPhrase = formatMirrorPhonePositionClause(
      mirrorPoseComposition.phonePosition,
      mirrorPoseComposition.phoneHand || selections.phoneHand || 'right_hand'
    );
    const mirrorDeviceName =
      sanitizeCustomText(selections.deviceModel || '') || 'Xiaomi 15 Ultra';
    phoneDescription = `holding a single physical ${mirrorDeviceName} smartphone ${phonePosPhrase}`;
  } else if (cameraMode === 'rear_mirror') {
    const customPhone = sanitizeCustomText(selections.customPhoneColorText);
    const phoneDesc =
      selections.phoneColor === 'custom_phone_color' && customPhone
        ? `holding a ${customPhone} smartphone`
        : selections.phoneColor === 'hidden_front_camera'
          ? 'holding a smartphone'
          : findPhrase(PHONE_COLOR_OPTIONS, selections.phoneColor);
    const handDesc = findPhrase(PHONE_HAND_OPTIONS, selections.phoneHand);
    const faceClearClause = selections.keepFaceUnobstructed
      ? 'positioned away from their face'
      : 'in a natural mirror-selfie posture';
    phoneDescription = `${phoneDesc} ${handDesc} ${faceClearClause}`;
  } else if (cameraMode === 'rear_stationary') {
    phoneDescription =
      'captured by a stationary smartphone positioned in the room';
  } else {
    phoneDescription =
      'captured from arm’s length with the phone outside the visible frame';
  }

  const vibeDescription = findPhrase(PHOTO_VIBE_OPTIONS, selections.photoVibe);
  const treatmentDescriptions = selections.imageTreatments
    .map((t) => findPhrase(IMAGE_TREATMENT_OPTIONS, t))
    .filter(Boolean);

  // Clean custom details so conflicting keywords do not leak into the scene config
  let cleanedCustomDetails = sanitizeCustomText(selections.customDetails);
  let cleanedUserConcept = sanitizeCustomText(selections.userConcept);
  if (
    lightingSource === 'screen_only' ||
    phoneProcessingProfile === 'night_mode'
  ) {
    cleanedCustomDetails = cleanedCustomDetails
      .replace(
        /\b(?:with\s+)?(?:direct\s+flash|camera\s+flash|phone\s+flash|led\s+flash)\b/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();
    cleanedUserConcept = cleanedUserConcept
      .replace(
        /\b(?:with\s+)?(?:direct\s+flash|camera\s+flash|phone\s+flash|led\s+flash)\b/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();
  }

  const skinTextureGoal =
    findPhrase(SKIN_TEXTURE_OPTIONS, selections.skinTexture) ||
    'raw unedited skin, clearly visible pores, authentic micro-details';

  return {
    workflowMode: selections.workflowMode,
    cameraMode,
    pose,
    expression,
    gaze,
    hair,
    framing,
    cameraAngle,
    lightingSource,
    secondaryLightingSource,
    lightingModifier,
    phoneProcessingProfile,
    focusTarget,
    exposurePreference,
    clothingEdits,
    captureArtifacts,
    roomDescription,
    backgroundDescription,
    phoneDescription,
    vibeDescription,
    treatmentDescriptions,
    mirrorLensProfile,
    mirrorCameraSpec,
    mirrorPoseComposition,
    subjectFacts: {
      userConcept: cleanedUserConcept || undefined,
      customDetails: cleanedCustomDetails || undefined,
      subjectTraits:
        sanitizeCustomText(rawInput.subjectTraits || '') || undefined,
      deviceModel: sanitizeCustomText(selections.deviceModel || '') || undefined,
      locationText:
        sanitizeCustomText(rawInput.locationText || '') || undefined,
      aspectRatio: selections.aspectRatio,
      skinTextureGoal,
    },
    lockedConflicts:
      lockedConflicts.length > 0 ? lockedConflicts : undefined,
    biomechanics,
  };
}

/**
 * STAGE 2: Resolve scene conflicts deterministically on StructuredSceneConfig.
 */
export function resolveSceneConflicts(
  config: StructuredSceneConfig,
  rawInput?: Partial<SelfieSelections>
): {
  config: StructuredSceneConfig;
  warnings: string[];
  conflicts: string[];
} {
  const next: StructuredSceneConfig = {
    ...config,
    clothingEdits: { ...config.clothingEdits },
    captureArtifacts: [...config.captureArtifacts],
    subjectFacts: { ...config.subjectFacts },
  };
  const detection = rawInput
    ? detectSelectionConflicts(rawInput)
    : { valid: true, conflicts: [], warnings: [] };
  const warnings = [...detection.warnings];
  const conflicts = [...detection.conflicts];

  // 1. Screen-only light cannot be combined with direct flash
  if (
    next.lightingSource === 'screen_only' &&
    next.secondaryLightingSource === 'direct_flash'
  ) {
    next.secondaryLightingSource = undefined;
    if (!conflicts.includes('SCREEN_ONLY_WITH_FLASH')) {
      conflicts.push('SCREEN_ONLY_WITH_FLASH');
      warnings.push(
        'تعارض في الإضاءة: لا يمكن دمج «إضاءة شاشة الهاتف فقط» مع «فلاش الهاتف المباشر».'
      );
    }
  }
  if (next.lightingSource === 'screen_only') {
    next.captureArtifacts = next.captureArtifacts.filter(
      (a) => a !== 'flash_falloff'
    );
    if (next.exposurePreference === 'flash_highlight_controlled') {
      next.exposurePreference = 'low_key_shadow_preserving';
    }
  }

  // 2. Night mode cannot be combined with direct flash
  if (next.phoneProcessingProfile === 'night_mode') {
    if (next.lightingSource === 'direct_flash') {
      next.lightingSource = 'screen_only';
      if (!conflicts.includes('NIGHT_MODE_WITH_FLASH')) {
        conflicts.push('NIGHT_MODE_WITH_FLASH');
        warnings.push(
          'تعارض في معالجة الكاميرا: لا يمكن تفعيل «الوضع الليلي (Night Mode)» مع «الفلاش المباشر».'
        );
      }
    }
    if (next.secondaryLightingSource === 'direct_flash') {
      next.secondaryLightingSource = undefined;
    }
    next.captureArtifacts = next.captureArtifacts.filter(
      (a) => a !== 'flash_falloff'
    );
    if (next.exposurePreference === 'flash_highlight_controlled') {
      next.exposurePreference = 'low_key_shadow_preserving';
    }
  }

  // 3. Front-camera selfie cannot be described as a rear-camera mirror photo
  if (next.cameraMode === 'front_selfie') {
    if (next.focusTarget === 'mirror_reflection') {
      next.focusTarget = 'subject_face';
    }
    if (next.lightingSource === 'direct_flash') {
      next.lightingSource = 'screen_only';
    }
    next.captureArtifacts = next.captureArtifacts.filter(
      (a) => a !== 'flash_falloff'
    );
  }

  return {
    config: next,
    warnings,
    conflicts,
  };
}

/**
 * Validates whether Strict 12-Rule Editing Mode has a valid Lighting Mode selected (Rule 04).
 */
export function validateStrictLightingSelection(
  selections: SelfieSelections
): { valid: boolean; messageAr?: string } {
  if (
    selections.workflowMode === 'strict_editing' &&
    selections.strictLightingMode === 'unselected'
  ) {
    return {
      valid: false,
      messageAr:
        'القاعدة [04]: يرجى اختيار وضع إضاءة واحد أولًا (الوضع A: شاشة الهاتف فقط، أو الوضع B: فلاش الهاتف أمام المرآة) قبل توليد تعليمات التعديل.',
    };
  }
  return { valid: true };
}

/**
 * 1. أمر إصلاح التعارضات (Conflict Resolution Function)
 * وظيفتها: استلام الخيارات، إزالة أي تناقض، وفرض القواعد الصارمة.
 */
export function resolvePromptConflicts(
  pose: string,
  expression: string,
  hair: string,
  topClothing: string,
  bottomClothing: string,
  options?: {
    deviceModel?: string;
    lightingSource?: LightingSource;
    phoneProcessingProfile?: PhoneProcessingProfile;
    focusTarget?: FocusTarget;
    exposurePreference?: ExposurePreference;
    phonePositionPhrase?: string;
    phoneHand?: PhoneHandType;
    motionBlurEnabled?: boolean;
  }
): string {
  const effectiveDeviceModel = options?.deviceModel?.trim() || 'Xiaomi 15 Ultra';
  const deviceLabel = `single physical ${effectiveDeviceModel} smartphone`;
  const phonePosClause = options?.phonePositionPhrase
    ? ` (${options.phonePositionPhrase})`
    : '';
  const isScreenOrNight =
    options?.lightingSource === 'screen_only' ||
    options?.phoneProcessingProfile === 'night_mode';

  // فرض ظهور هاتف واحد فقط ومنع تعدد الهواتف أو الكاميرا الأمامية أو الحامل ثلاثي القوائم
  const enforcePhoneRule = isScreenOrNight
    ? `The subject is visibly holding one ${deviceLabel}${phonePosClause}, pointing the rear camera at the mirror (no duplicate phones, no impossible reflections, no front-camera capture, and no tripod).`
    : `The subject is visibly holding one ${deviceLabel}${phonePosClause}, pointing the rear camera at the mirror with the rear LED flash aimed toward the mirror (no duplicate phones, no impossible reflections, no front-camera capture, and no tripod).`;

  let combined = `${enforcePhoneRule} ${pose} ${expression} ${hair} ${topClothing} ${bottomClothing}`
    .replace(/\s+/g, ' ')
    .trim();

  // إزالة أي إشارة للضبابية الحركية ما لم تكن مفعّلة صراحةً
  if (!options?.motionBlurEnabled) {
    combined = combined
      .replace(/[^.]*\bmotion\s+blur\b[^.]*\.?/gi, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // إذا كان الوضع الليلي أو إضاءة الشاشة فقط مفعلين، أزل أي إشارة للفلاش المباشر لمنع التعارض
  if (isScreenOrNight) {
    combined = combined
      .replace(
        /[^.]*\b(?:bright\s+flash|rear\s+flash|rear\s+LED\s+flash|LED\s+flash|flash)\b[^.]*\.?/gi,
        ''
      )
      .replace(/\s+/g, ' ')
      .trim();
  }

  return combined;
}

export function isBedContactPose(
  config: StructuredSceneConfig,
  selections?: Partial<SelfieSelections>
): boolean {
  if (config.workflowMode === 'mirror_studio') {
    if (
      selections?.mirrorPose === 'pose_bed_edge_dynamic' ||
      selections?.mirrorSupportObject === 'bed_edge' ||
      config.mirrorPoseComposition?.supportObject === 'bed_edge'
    ) {
      return true;
    }
    if (selections?.mirrorPose) {
      return false;
    }
  } else if (selections?.pose) {
    const bedPoses: PoseType[] = [
      'pose_side_lying',
      'pose_supine_up',
      'pose_prone_stomach',
      'pose_headboard_lean',
      'pose_edge_sitting',
      'pose_cross_legged',
      'rear_tripod_bed_sitting',
      'rear_tripod_lying_reading',
      'rear_propped_low_angle',
    ];
    if (bedPoses.includes(selections.pose)) {
      return true;
    }
    const nonBedPoses: PoseType[] = [
      'rear_mirror_standing',
      'rear_mirror_sitting',
      'rear_desk_profile',
    ];
    if (nonBedPoses.includes(selections.pose)) {
      return false;
    }
  }
  return /\b(?:mattress|pillow|bed['’]?s?\s+edge|headboard|(?:sitting|lying|resting)[^.]{0,30}on\s+(?:the|a)\s+bed)\b/i.test(
    config.pose
  );
}

function usesPillowContact(
  config: StructuredSceneConfig,
  selections?: Partial<SelfieSelections>
): boolean {
  if (!isBedContactPose(config, selections)) {
    return false;
  }
  if (config.workflowMode === 'mirror_studio') {
    return /\bpillows?\b/i.test(config.pose);
  }
  if (
    selections?.pose === 'pose_side_lying' ||
    selections?.pose === 'pose_supine_up' ||
    selections?.pose === 'pose_headboard_lean'
  ) {
    return true;
  }
  return /\bpillows?\b/i.test(config.pose);
}

function isFloorOrWallContactPose(
  config: StructuredSceneConfig,
  selections?: Partial<SelfieSelections>
): 'floor' | 'wall' | 'vanity' | 'chair' | 'stool' | null {
  if (config.workflowMode === 'mirror_studio') {
    const sup =
      config.mirrorPoseComposition?.supportObject ||
      selections?.mirrorSupportObject;
    if (
      selections?.mirrorPose === 'pose_floor_rug_mirror' ||
      selections?.mirrorPose === 'pose_floor_sitting_bed'
    ) {
      return 'floor';
    }
    if (sup === 'stool') return 'stool';
    if (
      sup === 'chair' ||
      selections?.mirrorPose === 'pose_chair_or_stool_sitting' ||
      selections?.mirrorPose === 'pose_seated_forearm_knee_rest'
    ) {
      return 'chair';
    }
    if (
      sup === 'vanity' ||
      selections?.mirrorPose === 'pose_vanity_casual_lean' ||
      selections?.mirrorPose === 'pose_leaning_forward'
    ) {
      return 'vanity';
    }
    if (
      sup === 'wall' ||
      selections?.mirrorPose === 'pose_wall_lean_scurve' ||
      selections?.mirrorPose === 'pose_doorway_frame_lean' ||
      config.mirrorPoseComposition?.stance === 'light_shoulder_wall_lean'
    ) {
      return 'wall';
    }
    return null;
  }
  if (selections?.pose === 'rear_mirror_sitting') {
    return 'floor';
  }
  return null;
}

/**
 * Builds a conditional, scene-responsive physical-causality instruction from StructuredSceneConfig.
 */
export function buildPhysicalCausalityInstruction(
  config: StructuredSceneConfig,
  selections?: Partial<SelfieSelections>,
  mode: 'concise' | 'full' | 'mirror' = 'concise'
): string {
  const hasBedContact = isBedContactPose(config, selections);
  const hasPillowContact = usesPillowContact(config, selections);
  const surfaceKind = isFloorOrWallContactPose(config, selections);
  const hasMirrorTouch =
    config.workflowMode === 'mirror_studio' &&
    (selections?.mirrorPose === 'pose_hand_on_mirror_glass' ||
      config.mirrorPoseComposition?.freeHandAction === 'lightly_touch_mirror' ||
      config.mirrorPoseComposition?.supportObject === 'mirror_glass');
  const hasPhoneVisible = config.cameraMode === 'rear_mirror';
  const hasMirror = config.cameraMode === 'rear_mirror';
  const motionBlurActive = Boolean(
    (config.workflowMode === 'mirror_studio' &&
      config.mirrorPoseComposition?.motionBlurEnabled) ||
      config.captureArtifacts.includes('slight_hand_motion_blur')
  );

  let contactSurface = 'actual visible support or prop surfaces';
  if (hasBedContact) {
    contactSurface = hasPillowContact
      ? 'visible mattress and pillow contacts'
      : 'visible mattress and bedding contacts';
  } else if (surfaceKind === 'floor') {
    contactSurface = 'visible floor or rug contacts';
  } else if (surfaceKind === 'wall') {
    contactSurface = 'visible wall support contacts';
  } else if (surfaceKind === 'vanity') {
    contactSurface = 'visible vanity edge contacts';
  } else if (surfaceKind === 'chair') {
    contactSurface = 'visible chair seat and cushion contacts';
  } else if (surfaceKind === 'stool') {
    contactSurface = 'visible stool seat contacts';
  } else if (hasMirrorTouch) {
    contactSurface = 'visible hand-to-mirror glass contacts';
  } else if (mode === 'concise') {
    contactSurface = 'visible floor or prop contacts';
  }

  const phoneGrip = hasPhoneVisible
    ? mode === 'concise'
      ? ' and fingers gripping the phone'
      : ' and fingers gripping the single smartphone'
    : '';

  const drapeClause = hasBedContact
    ? mode === 'concise'
      ? 'gravity-draped hair, clothing, and bedding'
      : 'hair, clothing, and bedding draped under gravity consistent with body orientation and contact'
    : mode === 'concise'
      ? 'gravity-draped hair and clothing'
      : 'hair and clothing draped under gravity consistent with body orientation and contact';

  const lightCue =
    config.phoneProcessingProfile === 'night_mode'
      ? 'night-mode illumination without flash'
      : config.lightingSource === 'screen_only'
        ? 'phone-screen light alone without flash'
        : config.lightingSource === 'direct_flash'
          ? 'direct flash alone'
          : 'the selected light';

  if (mode === 'concise') {
    const shadowClause = hasMirror
      ? `shadows, highlights, occlusion, and mirror reflection matching ${lightCue} and camera position`
      : `shadows, highlights, and occlusion matching ${lightCue}`;
    const motionPart = motionBlurActive
      ? ', motion blur only on the moving free hand'
      : '';
    return `Keep one balanced pose, compression only at ${contactSurface}${phoneGrip}, ${drapeClause}, ${shadowClause}${motionPart}, without invented measurements, extra limbs, props, hidden details, or metadata.`;
  }

  const shadowMirrorFull = hasMirror
    ? `Keep contact shadows, cast shadows, highlights, occlusion, and mirror reflection geometry consistent with ${lightCue} and the rear-camera position.`
    : `Keep contact shadows, cast shadows, highlights, and occlusion consistent with ${lightCue} and the camera position.`;
  const motionFull = motionBlurActive
    ? ' Use motion blur only on the selected moving free hand while keeping the face and torso crisp.'
    : '';
  const metadataPhrase =
    mode === 'mirror' ? 'undocumented camera metadata' : 'camera metadata';

  return `Every visible physical effect must follow from the selected pose, support surfaces, camera geometry, and lighting. Keep one anatomically plausible, physically balanced pose with subtle deformation only at ${contactSurface}${phoneGrip}, with ${drapeClause}. ${shadowMirrorFull}${motionFull} Do not invent unsupported body measurements, hidden details, extra props or limbs, or ${metadataPhrase}.`;
}

/**
 * دالة توليد قواعد وكود JSON المخصص لاستوديو المرآة والمربوط بـ Gemini
 */
export function getMirrorStudioRules(
  pose: string,
  expression: string,
  hair: string,
  topClothing: string,
  bottomClothing: string,
  options?: {
    deviceModel?: string;
    lightingSource?: LightingSource;
    phoneProcessingProfile?: PhoneProcessingProfile;
    focusTarget?: FocusTarget;
    exposurePreference?: ExposurePreference;
    upperClothingSpec?: ClothingEditSpec;
    lensProfile?: MirrorLensProfileType;
    cameraSpec?: MirrorLensSpec;
    poseComposition?: MirrorPoseCompositionSpec;
    physicalCausalityClause?: string;
    biomechanics?: BiomechanicsSolution;
    flashMirrorGeometry?: SelfieSelections['flashMirrorGeometry'];
  }
): string {
  const isNightMode = options?.phoneProcessingProfile === 'night_mode';
  const isScreenOnly =
    options?.lightingSource === 'screen_only' || isNightMode;

  const effectiveLighting: LightingSource = isScreenOnly
    ? 'screen_only'
    : 'direct_flash';
  const effectiveFocus: FocusTarget =
    options?.focusTarget ?? 'mirror_reflection';
  const effectiveExposure: ExposurePreference =
    options?.exposurePreference ??
    (isScreenOnly
      ? 'low_key_shadow_preserving'
      : 'flash_highlight_controlled');

  const effectiveDeviceModel =
    options?.deviceModel?.trim() || 'Xiaomi 15 Ultra';
  const effectiveLensSpec: MirrorLensSpec =
    options?.cameraSpec ||
    XIAOMI_15_ULTRA_LENS_PROFILES[options?.lensProfile || 'main_23mm'];
  const effectivePoseComp: MirrorPoseCompositionSpec =
    options?.poseComposition || {
      preset: 'pose_contrapposto_standing',
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'none',
      movementMoment: 'still_composed',
      motionBlurEnabled: false,
    };

  const phonePositionPhrase = formatMirrorPhonePositionClause(
    effectivePoseComp.phonePosition,
    effectivePoseComp.phoneHand || 'right_hand'
  );
  const phoneHandOptics =
    options?.biomechanics?.phoneHandOptics ||
    buildPhoneHandOpticsState(
      effectivePoseComp.phoneHand || 'right_hand',
      effectivePoseComp.phonePosition,
      effectivePoseComp.torsoOrientation
    );

  const focusPhrase = buildFocusDescription(effectiveFocus, 'rear_mirror');
  const exposurePhrase = buildExposureDescription(
    effectiveExposure,
    effectiveLighting,
    options?.phoneProcessingProfile ?? 'natural_phone'
  );

  const basePhysicalMechanics = resolvePromptConflicts(
    pose,
    expression,
    hair,
    topClothing,
    bottomClothing,
    {
      ...options,
      deviceModel: effectiveDeviceModel,
      phonePositionPhrase,
      phoneHand: effectivePoseComp.phoneHand,
      motionBlurEnabled: effectivePoseComp.motionBlurEnabled,
    }
  );
  const clothingSpec = options?.upperClothingSpec;
  const fallbackMirrorCausality = buildPhysicalCausalityInstruction(
    {
      workflowMode: 'mirror_studio',
      cameraMode: 'rear_mirror',
      pose,
      expression,
      gaze: '',
      hair,
      framing: '',
      cameraAngle: '',
      lightingSource: effectiveLighting,
      phoneProcessingProfile: options?.phoneProcessingProfile ?? 'natural_phone',
      focusTarget: effectiveFocus,
      exposurePreference: effectiveExposure,
      clothingEdits:
        clothingSpec ||
        normalizeSelections({
          ...DEFAULT_SELECTIONS,
          workflowMode: 'mirror_studio',
        }).clothingEdits,
      captureArtifacts: effectivePoseComp.motionBlurEnabled
        ? ['slight_hand_motion_blur']
        : [],
      treatmentDescriptions: [],
      mirrorPoseComposition: effectivePoseComp,
      subjectFacts: {
        deviceModel: effectiveDeviceModel,
        skinTextureGoal: 'natural skin texture',
      },
    },
    undefined,
    'mirror'
  );
  const garmentSeparationNote = clothingSpec
    ? 'Keep upper-body and lower-body garments strictly separated with zero color, dye, or fabric bleed between them, and never invent logos or brand marks.'
    : '';
  const handReflectionCorrespondenceNote = `${phoneHandOptics.anatomicalHoldClause}. ${phoneHandOptics.mirrorReflectionSideClause}.`;
  const physicalMechanics = `${basePhysicalMechanics} ${handReflectionCorrespondenceNote} ${garmentSeparationNote} ${options?.physicalCausalityClause || fallbackMirrorCausality}`
    .replace(/\s+/g, ' ')
    .trim();

  const flashGeometryNote = options?.biomechanics?.opticalLighting.flashGeometryClause;
  const flashAngleDesc =
    options?.flashMirrorGeometry === 'angled_reflection'
      ? 'fired at an off-axis angle relative to the mirror normal so harsh lens glare misses the lens axis while still casting crisp directional flash falloff and behind-subject cast shadows'
      : options?.flashMirrorGeometry === 'partial_face_occlusion'
        ? 'creating plausible on-axis direct-flash highlights, defined cast shadows behind the subject, and partial lower-face/phone-edge glare occlusion while keeping upper facial geometry clearly recognizable'
        : 'creating plausible on-axis direct-flash highlights, defined cast shadows behind the subject, realistic foreground subject exposure, natural flash falloff with distance, and a plausibly placed flash reflection in the mirror glass when the angle permits';

  const sceneLighting = isNightMode
    ? `Dim indoor room captured with the ${effectiveDeviceModel} rear camera in night-mode multi-frame exposure and soft ambient screen glow. No direct flash and no extra studio lighting.`
    : isScreenOnly
      ? `Dark indoor room where the ${effectiveDeviceModel} screen is the sole active light source, casting soft localized illumination with natural falloff and no flash or extra room lighting.`
      : `Dark or dimly lit indoor room illuminated exclusively by the direct rear LED flash of the single ${effectiveDeviceModel} smartphone aimed at the mirror, ${flashGeometryNote || flashAngleDesc}, with room lights and extra lighting sources off.`;

  const sensorResponseBase = isNightMode
    ? 'Night-mode multi-frame shadow recovery, balanced low-light exposure, subtle shadow noise in darker corners, and no direct flash.'
    : isScreenOnly
      ? 'Low-light shadow roll-off, subtle shadow noise in unlit areas, and balanced screen-lit highlights without flash glare.'
      : 'Plausible direct-flash highlights, defined cast shadows, natural flash falloff with distance, balanced highlight roll-off on the mirror glass, and subtle shadow noise in unlit areas without unverified metadata.';

  const motionClause = effectivePoseComp.motionBlurEnabled
    ? ', subtle natural motion blur limited to the moving free hand while the subject face remains sharp'
    : ', crisp handheld stillness without artificial motion streak';

  const opticsPhysics = `${effectiveLensSpec.framingGuidance}. ${effectiveLensSpec.distanceGuidance}. ${effectiveLensSpec.perspectiveAndDistortionTarget}. ${focusPhrase}, natural depth of field, physically consistent mirror geometry${motionClause}.`;

  const upperGarmentSpecJson = clothingSpec
    ? clothingSpec.preserveUpperClothing
      ? {
          preserve_reference: true,
          garment: 'preserve_reference',
          color: 'preserve_reference',
          rule: 'Preserve the original upper garment color, material, cut, fit, and pattern from the reference image unchanged with zero color or fabric bleed from the lower garment.',
        }
      : {
          preserve_reference: false,
          garment: clothingSpec.upperGarment || 'crew_neck_tshirt',
          color: clothingSpec.upperGarmentColor || 'white',
          material: clothingSpec.upperGarmentMaterial || 'cotton_jersey',
          fit: clothingSpec.upperGarmentFit || 'regular',
          pattern: clothingSpec.upperGarmentPattern || 'solid',
          fabric_physics:
            clothingSpec.upperFabricPhysicsPhrase ||
            'Natural weave structure, realistic seams, collar, cuffs, gravity-driven folds at shoulders, elbows, chest, and waist, and lighting-responsive shading without plastic textures or invented logos.',
        }
    : undefined;

  const cropSafeLowerFallbackPhysics =
    effectivePoseComp.framing === 'head_and_shoulders' ||
    effectivePoseComp.framing === 'half_body'
      ? 'Natural weave structure, realistic seams, and waistband visible only near the upper crop border without inventing lower limbs or logos.'
      : effectivePoseComp.framing === 'three_quarter'
        ? 'Natural weave structure, realistic seams, waistband, and gravity-driven folds at waist, hips, and thighs consistent with posture without inventing logos.'
        : 'Natural weave structure, realistic seams, waistband, hem, gravity-driven folds at waist, hips, thighs, and knees, and lighting-responsive shading without plastic textures or invented logos.';

  const lowerGarmentSpecJson = clothingSpec
    ? clothingSpec.preserveLowerClothing
      ? {
          preserve_reference: true,
          garment: 'preserve_reference',
          color: 'preserve_reference',
          rule: 'Preserve the original lower-body garment type, color, material, cut, fit, and pattern from the reference image unchanged with zero color or fabric bleed from the upper garment.',
        }
      : {
          preserve_reference: false,
          garment: clothingSpec.lowerGarment || 'sweatpants',
          color: clothingSpec.lowerGarmentColor || 'charcoal',
          material: clothingSpec.lowerGarmentMaterial || 'french_terry',
          fit: clothingSpec.lowerGarmentFit || 'relaxed',
          pattern: clothingSpec.lowerGarmentPattern || 'solid',
          fabric_physics:
            clothingSpec.lowerFabricPhysicsPhrase || cropSafeLowerFallbackPhysics,
        }
    : undefined;

  const finalJson = {
    TARGET_AI: 'Google Gemini (Imagen 3 Engine)',
    GEMINI_EXECUTION_RULE: `Use this structured scene configuration to render a plausible ${effectiveDeviceModel} rear-camera mirror photograph. ${CONCISE_REFERENCE_FACE_PRESERVATION_RULE} Prioritize visible facial-appearance preservation, the selected rear lens framing and distance, physical mirror and rear LED flash consistency, independent UPPER_GARMENT_SPEC and LOWER_GARMENT_SPEC separation with zero cross-garment color or fabric bleed, a single coherent pose composition, and zero invented camera/flash metadata.`,
    SYSTEM_DIRECTIVE: 'EXECUTE_PHOTOGRAPHIC_CAPTURE',
    PRIORITIES: {
      Rule_1:
        'High-priority visual-preservation goal: follow SUBJECT_IDENTITY_LOCK.Structural_Integrity to preserve the person’s visible facial structure, proportions, hairline, skin tone, and natural asymmetry from the supplied reference image.',
      Rule_2:
        `Follow the selected ${effectiveDeviceModel} rear lens framing (${effectiveLensSpec.specSummary}), single physical mirror-selfie mechanics, single free-hand rule, independent upper and lower garment specifications with zero color bleed, and active lighting setup consistently.`,
    },
    SCENE_LIGHTING: sceneLighting,
    CAMERA_PIPELINE: {
      Device: `${effectiveDeviceModel} rear camera (${effectiveLensSpec.labelShort}: ${effectiveLensSpec.specSummary})`,
      Lens_Profile: {
        id: effectiveLensSpec.id,
        equivalent_focal_length_mm: effectiveLensSpec.equivalentFocalLengthMm,
        aperture: effectiveLensSpec.aperture,
        optics_note: effectiveLensSpec.stabilizationOrFov,
        optical_capture_mode: effectiveLensSpec.isOpticalTelephoto
          ? `Optical ${effectiveLensSpec.equivalentFocalLengthMm}mm telephoto rear camera lens rather than digital zoom`
          : `Optical ${effectiveLensSpec.equivalentFocalLengthMm}mm rear camera lens`,
        framing_target: effectiveLensSpec.framingGuidance,
        distance_target: effectiveLensSpec.distanceGuidance,
        perspective_and_distortion_target:
          effectiveLensSpec.perspectiveAndDistortionTarget,
        simulation_scope:
          'Treat focal length, aperture, field of view, distance, and perspective as visual composition goals rather than guaranteed exact optical simulation; include only verified device and lens details.',
      },
      Optics_Physics: opticsPhysics,
      Sensor_Response: `Use ${exposurePhrase}. ${sensorResponseBase}`,
    },
    POSE_COMPOSITION: {
      preset: effectivePoseComp.preset || 'pose_contrapposto_standing',
      framing: effectivePoseComp.framing || 'three_quarter',
      stance: effectivePoseComp.stance,
      torso_orientation: effectivePoseComp.torsoOrientation,
      phone_hand: effectivePoseComp.phoneHand || 'right_hand',
      phone_position: effectivePoseComp.phonePosition,
      free_hand_action: effectivePoseComp.freeHandAction,
      gaze_target: effectivePoseComp.gaze || 'gaze_phone_screen',
      expression_energy: effectivePoseComp.energy || 'relaxed',
      support_object: effectivePoseComp.supportObject || 'none',
      movement_moment: effectivePoseComp.movementMoment,
      motion_blur_enabled: effectivePoseComp.motionBlurEnabled,
      anatomical_hand_mechanics: phoneHandOptics.anatomicalHoldClause,
      mirror_reflection_side: phoneHandOptics.mirrorReflectionSideClause,
      pose_description: effectivePoseComp.poseDescription || pose,
      rule: 'Keep one fully clothed adult subject in a single balanced posture; allow at most one stance, one phone-holding hand assignment (never pair both_hands with a free-hand action), compatible visible support contact, aligned gaze and torso orientation, and zero invented lower-body limbs outside the selected crop.',
    },
    ...(upperGarmentSpecJson ? { UPPER_GARMENT_SPEC: upperGarmentSpecJson } : {}),
    ...(lowerGarmentSpecJson ? { LOWER_GARMENT_SPEC: lowerGarmentSpecJson } : {}),
    PHYSICAL_MECHANICS: physicalMechanics,
    SUBJECT_IDENTITY_LOCK: {
      Structural_Integrity: REFERENCE_FACE_PRESERVATION_RULE,
      Texture_Enforcement:
        'Raw unedited skin, visible pores, natural specular highlights matching the active light source, and physically plausible woven or knit fabric texture with realistic seams and folds rather than plastic-looking cloth.',
      ANTI_AI_FILTERS:
        'Avoid plastic skin smoothing, waxy finishes, plastic-looking cloth, repetitive synthetic fabric patterns, invented logos or brands, or heavy beauty filters so the result resembles an ordinary handheld smartphone photograph.',
    },
  };

  return JSON.stringify(finalJson, null, 4);
}

/**
 * 2. الدالة الرئيسية لتوليد الرمز المربوط بالذكاء الاصطناعي (`workflowMode === 'mirror_studio'`).
 */
export function buildMirrorStudioJsonPrompt(
  rawSelections: SelfieSelections
): string {
  const normalized = normalizeSelections(rawSelections);
  const { config } = resolveSceneConflicts(normalized, rawSelections);

  const upperText = config.clothingEdits.preserveUpperClothing
    ? 'Preserving the original upper-body garment type, color, material, cut, fit, and pattern from the reference image unchanged.'
    : config.clothingEdits.upperClothingPhrase ||
      MIRROR_CLOTHING_PHYSICS_OPTIONS[0].enPhrase;

  const lowerText = config.clothingEdits.preserveLowerClothing
    ? 'Preserving the original lower-body garment type, color, material, cut, fit, and pattern from the reference image unchanged.'
    : config.clothingEdits.lowerClothingPhrase ||
      MIRROR_BOTTOM_CLOTHING_OPTIONS[0].enPhrase;

  return getMirrorStudioRules(
    config.pose,
    config.expression,
    config.hair,
    upperText,
    lowerText,
    {
      deviceModel: config.subjectFacts.deviceModel,
      lightingSource: config.lightingSource,
      phoneProcessingProfile: config.phoneProcessingProfile,
      focusTarget: config.focusTarget,
      exposurePreference: config.exposurePreference,
      upperClothingSpec: config.clothingEdits,
      lensProfile: config.mirrorLensProfile,
      cameraSpec: config.mirrorCameraSpec,
      poseComposition: config.mirrorPoseComposition,
      physicalCausalityClause: buildPhysicalCausalityInstruction(
        config,
        rawSelections,
        'mirror'
      ),
      biomechanics: config.biomechanics,
      flashMirrorGeometry: rawSelections.flashMirrorGeometry,
    }
  );
}

function buildLightingDescription(config: StructuredSceneConfig): string {
  if (config.phoneProcessingProfile === 'night_mode') {
    return 'Light the dim room using smartphone night-mode multi-frame low-light exposure with soft ambient illumination, lifted shadow detail, subtle low-light shadow noise, and no direct flash.';
  }

  if (config.lightingSource === 'screen_only') {
    const modifier = config.lightingModifier
      ? ` ${config.lightingModifier}`
      : ' with soft localized illumination that weakens naturally with distance';
    return `Light the dark room with the phone screen as the sole active light source${modifier}, keeping all room lamps and camera flash off while allowing subtle low-light shadow noise in unlit areas.`;
  }

  if (config.lightingSource === 'direct_flash') {
    const modifier = config.lightingModifier
      ? ` ${config.lightingModifier}`
      : ' reflecting off the mirror';
    return `Light the dark room exclusively with the rear smartphone flash${modifier}, producing realistic flash falloff, crisp specular highlights, subtle shadow noise in unlit corners, and keeping room lamps and screen illumination off.`;
  }

  const primaryPhrase =
    findPhrase(LIGHTING_OPTIONS, config.lightingSource as any) ||
    'soft, balanced indoor lighting';

  if (
    config.secondaryLightingSource &&
    config.secondaryLightingSource !== config.lightingSource
  ) {
    const secondaryPhrase = findPhrase(
      LIGHTING_OPTIONS,
      config.secondaryLightingSource as any
    );
    if (secondaryPhrase) {
      return `Light the room with ${primaryPhrase} combined with ${secondaryPhrase}.`;
    }
  }

  return `Light the room with ${primaryPhrase}.`;
}

function buildCameraProcessingClause(config: StructuredSceneConfig): string {
  const parts: string[] = [];

  if (
    config.phoneProcessingProfile === 'natural_hdr' ||
    config.captureArtifacts.includes('natural_hdr_tonemapping')
  ) {
    parts.push('natural phone HDR tone mapping');
  } else if (config.phoneProcessingProfile === 'night_mode') {
    parts.push('steady night-mode low-light processing without flash');
  } else {
    parts.push('balanced smartphone camera processing');
  }

  // Always include scene-appropriate focus target and exposure preference
  parts.push(buildFocusDescription(config.focusTarget, config.cameraMode));
  parts.push(
    buildExposureDescription(
      config.exposurePreference,
      config.lightingSource,
      config.phoneProcessingProfile
    )
  );

  if (
    config.captureArtifacts.includes('flash_falloff') &&
    config.lightingSource === 'direct_flash' &&
    config.phoneProcessingProfile !== 'night_mode'
  ) {
    parts.push('realistic flash falloff');
  }

  if (config.captureArtifacts.includes('subtle_shadow_noise')) {
    parts.push('subtle shadow noise in darker areas');
  }

  if (config.captureArtifacts.includes('slight_hand_motion_blur')) {
    parts.push('slight motion blur on the moving free hand');
  }

  return parts.join(', ');
}

/**
 * Builds the English prompt for Strict 12-Rule Image-Editing Mode (`workflowMode === 'strict_editing'`).
 * Uses the normalized StructuredSceneConfig and never invents personal or device details.
 */
export function buildStrictEditingPrompt(
  rawSelections: SelfieSelections,
  styleVariant = 0
): string {
  if (rawSelections.strictLightingMode === 'unselected') {
    return '';
  }

  const normalized = normalizeSelections({
    ...rawSelections,
    workflowMode: 'strict_editing',
  });
  const { config } = resolveSceneConflicts(normalized, rawSelections);
  if (config.lightingSource === 'unselected') {
    return '';
  }

  const variant = Math.abs(styleVariant) % 4;
  const lowerColorPhrase =
    config.clothingEdits.lowerBodyColorPhrase ||
    resolveLowerBodyColorPhrase(rawSelections);
  const skinTexturePhrase = config.subjectFacts.skinTextureGoal;
  const posePhrase = config.pose;
  const focusPhrase = buildFocusDescription(
    config.focusTarget,
    config.cameraMode
  );
  const exposurePhrase = buildExposureDescription(
    config.exposurePreference,
    config.lightingSource,
    config.phoneProcessingProfile
  );

  const subjectTraitClause = config.subjectFacts.subjectTraits
    ? ` (${config.subjectFacts.subjectTraits})`
    : '';
  const locationClause = config.subjectFacts.locationText
    ? ` in ${config.subjectFacts.locationText}`
    : '';
  const deviceClause = config.subjectFacts.deviceModel
    ? ` on a ${config.subjectFacts.deviceModel}`
    : '';
  const conceptClause = config.subjectFacts.userConcept
    ? ` Concept context: ${config.subjectFacts.userConcept}.`
    : '';
  const extraClause = config.subjectFacts.customDetails
    ? ` Maintain ${config.subjectFacts.customDetails} where physically consistent.`
    : '';

  const isModeA = config.lightingSource === 'screen_only';
  const isNightMode = config.phoneProcessingProfile === 'night_mode';
  const screenOrientationClause =
    findPhrase(SCREEN_ORIENTATION_OPTIONS, rawSelections.screenOrientation) ||
    'with the phone screen facing toward the person';
  const flashGeometryClause =
    findPhrase(
      FLASH_MIRROR_GEOMETRY_OPTIONS,
      rawSelections.flashMirrorGeometry
    ) ||
    'where flash reflection, highlight clipping, and cast shadows strictly follow the camera-flash-mirror geometry';

  const upperSpec = config.clothingEdits.upper;
  const lowerSpec = config.clothingEdits.lower;
  const upperPreserved = Boolean(
    upperSpec ? upperSpec.preserveReference : config.clothingEdits.preserveUpperClothing
  );
  const lowerPreserved = Boolean(
    lowerSpec ? lowerSpec.preserveReference : config.clothingEdits.preserveLowerClothing
  );
  const lowerEditKind: 'preserve_reference' | 'recolor_only' | 'edit_garment' =
    lowerSpec?.editMode ||
    (lowerPreserved
      ? 'preserve_reference'
      : config.clothingEdits.lowerClothingPhrase
        ? 'edit_garment'
        : 'recolor_only');
  const upperPhrase =
    upperSpec?.garmentPhrase || config.clothingEdits.upperClothingPhrase || '';
  const upperPhysics =
    upperSpec?.fabricPhysicsPhrase ||
    config.clothingEdits.upperFabricPhysicsPhrase ||
    'preserving realistic weave, seams, collar, cuffs, gravity-driven folds, and lighting-responsive shading without plastic textures or invented logos';
  const lowerPhrase =
    lowerSpec?.garmentPhrase || config.clothingEdits.lowerClothingPhrase || '';
  const lowerPhysics =
    lowerSpec?.fabricPhysicsPhrase ||
    config.clothingEdits.lowerFabricPhysicsPhrase ||
    'preserving realistic weave, seams, waistband, hem, gravity-driven folds, and lighting-responsive shading without plastic textures or invented logos';

  const isLegacyRecolorOnly =
    upperPreserved && lowerEditKind === 'recolor_only';

  const mirrorHandClause =
    rawSelections.phoneHand === 'left_hand'
      ? ' holding the phone visibly in the left hand (appearing on the left side of the chest/torso in the mirror reflection)'
      : rawSelections.phoneHand === 'both_hands'
        ? ' steadying the phone visibly with both hands'
        : ' holding the phone visibly in the right hand (appearing on the right side of the chest/torso in the mirror reflection)';

  if (rawSelections.strictOutputFormat === 'full_12_rules') {
    const activeModeHeader = isModeA
      ? 'SELECTED LIGHTING MODE: MODE A — PHONE SCREEN ONLY, DARK ROOM'
      : 'SELECTED LIGHTING MODE: MODE B — PHONE FLASH IN A MIRROR PHOTOGRAPH, DARK ROOM';

    const activeModeRules = isNightMode
      ? `[04 & 05 — ACTIVE LIGHTING: NIGHT MODE LOW-LIGHT EXPOSURE, DARK ROOM]
Capture a handheld front-camera smartphone selfie applying night-mode multi-frame low-light exposure in a dark room (${screenOrientationClause}) without any direct camera flash, ceiling lights, or studio lamps. Allow natural low-light shadow roll-off and subtle shadow noise in darker areas.`
      : isModeA
        ? `[04 & 05 — ACTIVE LIGHTING: MODE A (PHONE SCREEN ONLY, DARK ROOM)]
Apply MODE A exclusively for a front-camera smartphone selfie. Keep the bedroom completely dark with the phone screen as the only active light source (${screenOrientationClause}). Do not add phone flash, ceiling lights, lamps, window light, moonlight, studio lights, fill lights, or rim lights. The screen's actual distance, orientation, and brightness govern illumination with natural distance falloff and subtle shadow noise in dark areas.`
        : `[04 & 06 — ACTIVE LIGHTING: MODE B (PHONE FLASH, DARK ROOM, MIRROR PHOTOGRAPH)]
Apply MODE B exclusively. Create a rear-camera photograph taken by the person in front of a mirror inside a dark room,${mirrorHandClause}, using only the rear phone camera flash (${flashGeometryClause}) with realistic flash falloff. All other active light sources must be off, and the phone screen must not contribute visible illumination. Maintain consistent positions and orientations for the person, their reflected image, the phone, camera lens, flash, hands, and mirror surface.`;

    let rule02Section = '';
    let rule02Summary = '';
    let clothingHeaderLines = '';

    if (isLegacyRecolorOnly) {
      clothingHeaderLines = `TARGET LOWER-BODY GARMENT COLOR: ${lowerColorPhrase}`;
      rule02Section = `[02 — LOWER-BODY CLOTHING COLOR]
Add natural, coordinated color (${lowerColorPhrase}) only to the person's lower-body garments (trousers or shorts). Preserve the original garment type, design, cut, length, fit, fabric weave, seams, folds, and upper-body clothing unchanged. Integrate the color into the fabric fibers with realistic shading and natural creases.`;
      rule02Summary =
        '(3) Recolor lower-body clothing only while preserving cut, fabric, and upper clothing [02]';
    } else if (upperPreserved && lowerPreserved) {
      clothingHeaderLines =
        'TARGET UPPER-BODY GARMENT: preserve reference unchanged\nTARGET LOWER-BODY GARMENT: preserve reference unchanged';
      rule02Section = `[02 — INDEPENDENT UPPER & LOWER CLOTHING CONTROLS]
UPPER GARMENT: Preserve the original upper-body garment type, color, material, cut, fit, and pattern from the reference image unchanged.
LOWER GARMENT: Preserve the original lower-body garment type, color, material, cut, fit, and pattern from the reference image unchanged without recoloring or altering seams, fabric weave, or fit.`;
      rule02Summary =
        '(3) Preserve both upper-body and lower-body reference garments unchanged [02]';
    } else if (!upperPreserved && lowerPreserved) {
      clothingHeaderLines = `TARGET UPPER-BODY GARMENT: ${upperPhrase}\nTARGET LOWER-BODY GARMENT: preserve reference unchanged`;
      rule02Section = `[02 — INDEPENDENT UPPER & LOWER CLOTHING CONTROLS]
UPPER GARMENT (EXPLICITLY ENABLED): Dress the upper body only in ${upperPhrase}, ${upperPhysics}. Apply this upper color and material strictly to the upper garment without invented logos.
LOWER GARMENT: Preserve the original lower-body garment type, color, material, cut, fit, and pattern from the reference image unchanged with zero color or fabric bleed from the upper garment.`;
      rule02Summary =
        '(3) Apply independent upper-garment styling while preserving reference lower-body clothing unchanged [02]';
    } else if (upperPreserved && lowerEditKind === 'edit_garment') {
      clothingHeaderLines = `TARGET UPPER-BODY GARMENT: preserve reference unchanged\nTARGET LOWER-BODY GARMENT: ${lowerPhrase}`;
      rule02Section = `[02 — INDEPENDENT UPPER & LOWER CLOTHING CONTROLS]
UPPER GARMENT: Preserve the original upper-body garment type, color, material, cut, fit, and pattern from the reference image unchanged with zero color or fabric bleed from the lower garment.
LOWER GARMENT (EXPLICITLY ENABLED): Dress the lower body only in ${lowerPhrase}, ${lowerPhysics}. Apply this lower color and material strictly to the lower garment without invented logos.`;
      rule02Summary =
        '(3) Preserve reference upper-body clothing unchanged while applying independent lower-garment styling [02]';
    } else {
      const lowerHeaderLabel =
        lowerEditKind === 'recolor_only'
          ? `TARGET LOWER-BODY GARMENT COLOR: ${lowerColorPhrase}`
          : `TARGET LOWER-BODY GARMENT: ${lowerPhrase}`;
      clothingHeaderLines = `${lowerHeaderLabel}\nTARGET UPPER-BODY GARMENT: ${upperPhrase}`;
      const lowerRuleLine =
        lowerEditKind === 'recolor_only'
          ? `LOWER GARMENT: Add natural, coordinated color (${lowerColorPhrase}) only to the person's lower-body garments (trousers or shorts), preserving the original lower-garment cut, length, fit, fabric weave, seams, and folds.`
          : `LOWER GARMENT (EXPLICITLY ENABLED): Dress the lower body only in ${lowerPhrase}, ${lowerPhysics}. Apply this lower material and color strictly to the lower garment without invented logos.`;
      rule02Section = `[02 — INDEPENDENT LOWER & UPPER CLOTHING EDITS]
${lowerRuleLine}
UPPER GARMENT (EXPLICITLY ENABLED): Dress the upper body only in ${upperPhrase}, ${upperPhysics}. Apply this upper material and color strictly to the upper garment without invented logos, keeping upper and lower garments strictly separated with zero cross-garment color bleed.`;
      rule02Summary =
        '(3) Apply independent lower-body and upper-body clothing edits with zero color bleed [02]';
    }

    return `IMAGE-EDITING INSTRUCTIONS — STRICT, INDEPENDENT RULES
${activeModeHeader}
${clothingHeaderLines}
SKIN TEXTURE GOAL: ${skinTexturePhrase}
POSE & POSTURE: ${posePhrase}
FOCUS & EXPOSURE: ${focusPhrase}; ${exposurePhrase}${deviceClause ? `\nCAMERA DEVICE: ${config.subjectFacts.deviceModel}` : ''}

[01 — REFERENCE IDENTITY AND FACE PRESERVATION]
${REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject context:${subjectTraitClause}.` : ''} Preserve ${skinTexturePhrase}.

${rule02Section}

[03 — SUBJECT-FIRST COMPOSITION]
Keep the person inside the room${locationClause} as the primary subject and visual focus (${posePhrase}) while keeping the room and furniture secondary.${extraClause}

${activeModeRules}

[07 & 08 — ANATOMICAL, PHYSICAL, AND MIRROR CONSISTENCY]
${buildPhysicalCausalityInstruction(config, rawSelections, 'full')} Keep edits strictly inside the selected edit scope while preserving unedited regions from the reference image.

[09, 10, 11 & 12 — NATURAL PHOTOGRAPHIC REALISM, SCOPE, AND PRIORITY ORDER]
Aim for an ordinary, plausible handheld smartphone photograph${deviceClause} with ${focusPhrase} and ${exposurePhrase}, preserving ${skinTexturePhrase}, natural fabric weave with everyday creases, and subtle shadow noise in low-light areas without beauty filters or plastic skin smoothing. Follow this priority order: (1) Preserve reference appearance and user-supplied facts [01], (2) Follow the selected camera mode, pose, and single lighting setup [04–08], ${rule02Summary}, (4) Apply compatible camera-processing details [09–11].`;
  }

  const aspectRatio = config.subjectFacts.aspectRatio || '9:16';
  const processingClause = buildCameraProcessingClause(config);

  const openers = [
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject details:${subjectTraitClause}.` : ''} Keep ${skinTexturePhrase}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject traits:${subjectTraitClause}.` : ''} Maintain ${skinTexturePhrase}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject context:${subjectTraitClause}.` : ''} Preserve ${skinTexturePhrase}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject details:${subjectTraitClause}.` : ''} Retain ${skinTexturePhrase}.`,
  ];

  let subjectAndClothingSentences: string[] = [];
  if (isLegacyRecolorOnly) {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while recoloring only the lower-body garment to ${lowerColorPhrase}, leaving the original garment cut, fabric weave, and upper-body clothing unchanged.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}) and apply ${lowerColorPhrase} exclusively to the lower-body clothing while preserving the garment cut, fabric texture, seams, and upper-body attire unchanged.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}) and recolor solely the lower-body garment in ${lowerColorPhrase}, keeping the original cut, fabric weave, and upper-body clothing untouched.`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}) and recolor only the lower-body garment to ${lowerColorPhrase}, preserving the garment cut, fabric weave, and upper-body clothing unaltered.`,
    ];
  } else if (upperPreserved && lowerPreserved) {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while preserving both the original upper-body garment and original lower-body garment from the reference image unchanged without recoloring.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}), preserving the exact upper-body and lower-body garments from the reference photo unchanged without color or fabric alterations.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}) while keeping both original upper-body and lower-body reference garments untouched and un-recolored.`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}) and preserve both the original upper-body clothing and original lower-body clothing from the reference image unchanged.`,
    ];
  } else if (!upperPreserved && lowerPreserved) {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while dressing the upper body only in ${upperPhrase} (${upperPhysics}) and preserving the original lower-body garment from the reference image unchanged with zero color bleed.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}), wearing ${upperPhrase} on the upper body (${upperPhysics}) while leaving the original lower-body garment from the reference photo untouched.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}) while styling only the upper body in ${upperPhrase} (${upperPhysics}) and keeping the reference lower-body clothing unaltered with zero color bleed.`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}), dressing the upper torso solely in ${upperPhrase} (${upperPhysics}) while preserving the original lower-body garment unchanged.`,
    ];
  } else if (upperPreserved && lowerEditKind === 'edit_garment') {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while preserving the original upper-body garment from the reference image unchanged and wearing ${lowerPhrase} on the lower body (${lowerPhysics}) with zero color bleed.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}), leaving the reference upper-body garment untouched while dressing the lower body only in ${lowerPhrase} (${lowerPhysics}) with zero color bleed.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}), preserving original upper-body clothing unchanged while styling only the lower body in ${lowerPhrase} (${lowerPhysics}).`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}), keeping upper-body clothing from the reference photo unaltered and wearing ${lowerPhrase} exclusively on the lower body (${lowerPhysics}).`,
    ];
  } else if (lowerEditKind === 'recolor_only') {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while recoloring only the lower-body garment to ${lowerColorPhrase} with original lower-garment cut and fabric preserved, and dressing the upper body only in ${upperPhrase}, ${upperPhysics}.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}), recoloring solely the lower-body garment to ${lowerColorPhrase} while keeping its cut and seams intact, and styling the upper body exclusively in ${upperPhrase}, ${upperPhysics}.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}), applying ${lowerColorPhrase} only to the lower-body garment with original cut preserved while dressing only the upper torso in ${upperPhrase}, ${upperPhysics}.`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}), recoloring only the lower-body garment in ${lowerColorPhrase} without changing its cut and wearing ${upperPhrase} on the upper body, ${upperPhysics}.`,
    ];
  } else {
    subjectAndClothingSentences = [
      `In an everyday indoor bedroom${locationClause}, keep the subject as the primary focus (${posePhrase}) while dressing the upper body only in ${upperPhrase} (${upperPhysics}) and wearing ${lowerPhrase} on the lower body (${lowerPhysics}), keeping upper and lower garments distinct with zero color bleed or invented logos.`,
      `Inside a quiet bedroom${locationClause}, keep the subject as the visual priority (${posePhrase}), styling the upper body exclusively in ${upperPhrase} (${upperPhysics}) paired with ${lowerPhrase} on the lower body (${lowerPhysics}) with zero color bleed.`,
      `Within an ordinary bedroom setting${locationClause}, frame the subject as the main focus (${posePhrase}), wearing ${upperPhrase} on the upper body (${upperPhysics}) and ${lowerPhrase} on the lower body (${lowerPhysics}) cleanly separated without invented logos.`,
      `In a natural bedroom environment${locationClause}, retain a subject-first composition (${posePhrase}), dressing only the upper torso in ${upperPhrase} (${upperPhysics}) and the lower body in ${lowerPhrase} (${lowerPhysics}) with zero cross-garment color bleed.`,
    ];
  }

  const lightingModeSentences = isNightMode
    ? [
        `Capture a handheld vertical ${aspectRatio} front-camera smartphone selfie${deviceClause} with ${processingClause}, using night-mode multi-frame low-light exposure in a dim bedroom ${screenOrientationClause} and recovering soft shadow detail with no direct flash or room lamps.`,
        `Shoot a handheld vertical ${aspectRatio} front-camera smartphone selfie${deviceClause} with ${processingClause}, using night-mode low-light exposure in a dark bedroom ${screenOrientationClause} while keeping direct flash and room lights off.`,
        `Use a vertical ${aspectRatio} front-camera smartphone perspective${deviceClause} with ${processingClause} in a dim bedroom ${screenOrientationClause}, without any direct flash.`,
        `Frame a vertical ${aspectRatio} front-camera smartphone selfie${deviceClause} with ${processingClause} in a dark bedroom ${screenOrientationClause}, with all flash and lamps off.`,
      ]
    : isModeA
      ? [
          `Capture a self-held vertical ${aspectRatio} front-camera smartphone selfie${deviceClause} with ${processingClause}, applying MODE A lighting exclusively in a dark room where the phone screen is the sole active light source ${screenOrientationClause}, with no flash or lamps.`,
          `Shoot a self-held vertical ${aspectRatio} front-camera smartphone perspective${deviceClause} with ${processingClause}, enforcing MODE A dark-room lighting where only the phone screen illuminates the scene ${screenOrientationClause} and all flash and room lights remain off.`,
          `Use a vertical ${aspectRatio} front-camera smartphone selfie perspective${deviceClause} with ${processingClause} and MODE A lighting alone in a dark room so light originates strictly from the phone screen ${screenOrientationClause}, without flash or lamps.`,
          `Frame a vertical ${aspectRatio} front-camera smartphone shot${deviceClause} with ${processingClause}, following MODE A exclusively in a dark bedroom lit solely by the smartphone screen ${screenOrientationClause}, with no flash.`,
        ]
      : [
          `Capture a vertical ${aspectRatio} rear-camera smartphone mirror photograph${deviceClause} with ${processingClause},${mirrorHandClause}, applying MODE B lighting exclusively in a dark bedroom illuminated solely by the direct camera flash ${flashGeometryClause}, with realistic flash falloff and all screen and room lights off.`,
          `Shoot a vertical ${aspectRatio} rear-camera mirror photograph on a smartphone${deviceClause} with ${processingClause},${mirrorHandClause}, enforcing MODE B dark-room lighting using only the direct camera flash ${flashGeometryClause} with realistic flash falloff while lamps and screen illumination remain off.`,
          `Use MODE B lighting alone for a vertical ${aspectRatio} rear-camera smartphone mirror photo${deviceClause} with ${processingClause},${mirrorHandClause}, in a dark bedroom lit strictly by the direct camera flash ${flashGeometryClause}, with realistic flash falloff and consistent mirror reflection geometry.`,
          `Follow MODE B exclusively in a vertical ${aspectRatio} rear-camera smartphone mirror photograph${deviceClause} with ${processingClause},${mirrorHandClause}, inside a dark bedroom using only the direct phone flash ${flashGeometryClause}, with realistic flash falloff and zero screen or room lighting.`,
        ];

  const physicalCausalitySentence = buildPhysicalCausalityInstruction(
    config,
    rawSelections,
    'concise'
  );

  const realismClosers = [
    `Aim for natural smartphone rendering without beauty filters, plastic skin smoothing, or artificial studio lighting.${conceptClause}${extraClause}`,
    `Favor a natural handheld photograph without beauty filters or waxy skin smoothing.${conceptClause}${extraClause}`,
    `Render cleanly without beauty filters, plastic smoothing, or artificial studio effects.${conceptClause}${extraClause}`,
    `Deliver a plausible smartphone photo without beauty filters, waxy finishes, or studio lighting.${conceptClause}${extraClause}`,
  ];

  return [
    openers[variant],
    subjectAndClothingSentences[variant],
    physicalCausalitySentence,
    lightingModeSentences[variant],
    realismClosers[variant],
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * STAGE 3: Render concise, natural English prompt from a normalized & conflict-resolved StructuredSceneConfig.
 */
export function renderScenePrompt(
  config: StructuredSceneConfig,
  rawSelections?: SelfieSelections,
  styleVariant = 0
): string {
  const effectiveSelections: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...(rawSelections || {}),
    workflowMode: config.workflowMode,
    focusTarget: config.focusTarget,
    exposurePreference: config.exposurePreference,
    phoneProcessingProfile: config.phoneProcessingProfile,
  };

  if (config.workflowMode === 'mirror_studio') {
    return buildMirrorStudioJsonPrompt(effectiveSelections);
  }

  if (config.workflowMode === 'strict_editing') {
    return buildStrictEditingPrompt(effectiveSelections, styleVariant);
  }

  const variant = Math.abs(styleVariant) % 4;
  const aspectRatio = config.subjectFacts.aspectRatio || '9:16';
  const skinTexturePhrase = config.subjectFacts.skinTextureGoal;
  const hairClause = config.hair;
  const subjectTraitClause = config.subjectFacts.subjectTraits
    ? ` (${config.subjectFacts.subjectTraits})`
    : '';
  const locationClause = config.subjectFacts.locationText
    ? ` in ${config.subjectFacts.locationText}`
    : '';
  const deviceClause = config.subjectFacts.deviceModel
    ? `, ${config.subjectFacts.deviceModel}`
    : '';

  // Priority 1: Reference consistency & user-supplied subject facts
  const identityOpeners = [
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject details:${subjectTraitClause}.` : ''} Preserve ${skinTexturePhrase}, ${hairClause}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject traits:${subjectTraitClause}.` : ''} Keep ${skinTexturePhrase}, ${hairClause}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject context:${subjectTraitClause}.` : ''} Maintain ${skinTexturePhrase}, ${hairClause}.`,
    `${CONCISE_REFERENCE_FACE_PRESERVATION_RULE}${subjectTraitClause ? ` Subject details:${subjectTraitClause}.` : ''} Retain ${skinTexturePhrase}, ${hairClause}.`,
  ];

  // Priority 2: Selected camera mode, room setting, pose, and framing
  const cameraSpecClause =
    config.cameraMode === 'rear_mirror'
      ? `rear-camera smartphone mirror selfie (${aspectRatio}${deviceClause})`
      : config.cameraMode === 'rear_stationary'
        ? `stationary rear-camera smartphone photo (${aspectRatio}${deviceClause})`
        : `front-camera smartphone selfie (${aspectRatio}${deviceClause})`;

  const roomDesc =
    config.roomDescription ||
    'a warm, cozy inviting bedroom with a soft white and warm beige palette, neatly arranged with smooth, tidy surfaces';

  const sceneLeadIns = [
    `Create a ${cameraSpecClause} in ${roomDesc}${locationClause}.`,
    `Capture a ${cameraSpecClause} in ${roomDesc}${locationClause}.`,
    `Frame a ${cameraSpecClause} in ${roomDesc}${locationClause}.`,
    `Depict an everyday ${cameraSpecClause} in ${roomDesc}${locationClause}.`,
  ];

  // Priority 3: Clothing edits (independent upper-body and lower-body specs + realistic fabric rendering)
  let outfitSentence = '';
  const ce = config.clothingEdits;
  const upperSpec = ce.upper;
  const lowerSpec = ce.lower;
  const hasExplicitUpperOrLower =
    rawSelections?.upperGarment !== undefined ||
    rawSelections?.lowerGarment !== undefined;

  if (ce.mode === 'recolor_lower_only') {
    outfitSentence = `recoloring only the lower-body garment to ${ce.lowerBodyColorPhrase} while preserving the garment's cut, fabric, fit, and construction and leaving upper-body clothing unchanged`;
  } else if (ce.mode === 'preserve_reference') {
    outfitSentence =
      'wearing the exact outfit from the reference image, preserving both the original upper-body garment and original lower-body garment unchanged';
  } else if (ce.preserveUpperClothing && ce.preserveLowerClothing) {
    outfitSentence =
      'preserving both the original upper-body garment and original lower-body garment from the reference image unchanged';
  } else if (ce.preserveUpperClothing) {
    const lowerPart =
      lowerSpec?.editMode === 'recolor_only'
        ? `recoloring only the lower-body garment to ${lowerSpec.colorPhrase} with original cut and fabric preserved and zero color bleed`
        : ce.lowerClothingPhrase
          ? `wearing ${ce.lowerClothingPhrase} on the lower body${ce.lowerFabricPhysicsPhrase ? ` (${ce.lowerFabricPhysicsPhrase})` : ''} with zero color or fabric bleed between garments`
          : '';
    outfitSentence = `${ce.upperClothingPhrase || 'preserving the original upper-body garment from the reference image unchanged'}${lowerPart ? ` while ${lowerPart}` : ''}`;
  } else if (ce.preserveLowerClothing) {
    const upperBase =
      ce.upperClothingPhrase || 'wearing casual indoor upper wear';
    const upperPhysics = ce.upperFabricPhysicsPhrase
      ? ` on the upper body (${ce.upperFabricPhysicsPhrase})`
      : ' on the upper body';
    outfitSentence = `${upperBase}${upperPhysics}, while preserving the original lower-body garment from the reference image unchanged with zero color or fabric bleed`;
  } else if (!hasExplicitUpperOrLower) {
    const upperBase =
      ce.upperClothingPhrase || 'wearing casual indoor loungewear';
    const lowerPart = ce.lowerClothingPhrase
      ? ` paired with ${ce.lowerClothingPhrase} on the lower body`
      : '';
    const physicsPart = ce.upperFabricPhysicsPhrase
      ? `, with the upper garment ${ce.upperFabricPhysicsPhrase}`
      : '';
    outfitSentence = `${upperBase}${lowerPart}${physicsPart}`;
  } else {
    const upperBase =
      ce.upperClothingPhrase || 'wearing casual indoor upper wear';
    const upperPhysics = ce.upperFabricPhysicsPhrase
      ? ` on the upper body (${ce.upperFabricPhysicsPhrase})`
      : ' on the upper body';
    const lowerPart =
      lowerSpec?.editMode === 'recolor_only'
        ? `paired with recolored lower-body clothing in ${lowerSpec.colorPhrase} with original cut and fabric preserved`
        : ce.lowerClothingPhrase
          ? `paired with ${ce.lowerClothingPhrase} on the lower body${ce.lowerFabricPhysicsPhrase ? ` (${ce.lowerFabricPhysicsPhrase})` : ''}`
          : '';
    outfitSentence = `${upperBase}${upperPhysics}${lowerPart ? `, ${lowerPart}` : ''}, keeping upper and lower garments distinct with zero color bleed or invented logos`;
  }

  const cameraActionClause =
    config.phoneDescription ||
    'captured from arm’s length with the phone outside the visible frame';

  const subjectSentences = [
    `The subject is ${config.pose}, ${cameraActionClause}, ${outfitSentence}.`,
    `Show the subject ${config.pose}, ${outfitSentence}, ${cameraActionClause}.`,
    `Positioned ${config.pose}, the subject is ${outfitSentence}, ${cameraActionClause}.`,
    `The subject is ${config.pose} while ${outfitSentence}, ${cameraActionClause}.`,
  ];

  const physicalCausalitySentence = buildPhysicalCausalityInstruction(
    config,
    effectiveSelections,
    'concise'
  );

  const framingAndExpressionSentences = [
    `Show ${config.expression}, ${config.gaze}, framed ${config.framing} ${config.cameraAngle}.`,
    `Frame ${config.framing} ${config.cameraAngle} with ${config.expression}, ${config.gaze}.`,
    `Compose ${config.framing} ${config.cameraAngle} showing ${config.expression}, ${config.gaze}.`,
    `Capture ${config.expression}, ${config.gaze}, framed ${config.framing} ${config.cameraAngle}.`,
  ];

  const conceptClause = config.subjectFacts.userConcept
    ? ` Concept context: ${config.subjectFacts.userConcept}.`
    : '';
  const extraClause = config.subjectFacts.customDetails
    ? ` Include ${config.subjectFacts.customDetails}.`
    : '';

  const bgDesc =
    config.backgroundDescription ||
    'neutral bedding, upholstered pillows, and a wooden bedside table in the background';

  const backgroundSentences = [
    `Include ${bgDesc}.${conceptClause}${extraClause}`,
    `Feature ${bgDesc}.${conceptClause}${extraClause}`,
    `Show ${bgDesc}.${conceptClause}${extraClause}`,
    `Include ${bgDesc}.${conceptClause}${extraClause}`,
  ];

  // Priority 2 (Lighting) & Priority 4 (Compatible camera processing, focus, and exposure)
  const fullLightingSentence = buildLightingDescription(config);
  const processingClause = buildCameraProcessingClause(config);
  const treatmentJoined =
    config.treatmentDescriptions.length > 0
      ? config.treatmentDescriptions.join(', ')
      : 'without beauty filters';
  const vibePhrase =
    config.vibeDescription ||
    'the authentic look of an everyday smartphone photograph';

  const closingSentences = [
    `Use ${processingClause}, ${vibePhrase} ${treatmentJoined}.`,
    `Apply ${processingClause}, ${vibePhrase} ${treatmentJoined}.`,
    `Render ${processingClause}, ${vibePhrase} ${treatmentJoined}.`,
    `Deliver ${processingClause}, ${vibePhrase} ${treatmentJoined}.`,
  ];

  return [
    identityOpeners[variant],
    sceneLeadIns[variant],
    subjectSentences[variant],
    physicalCausalitySentence,
    framingAndExpressionSentences[variant],
    backgroundSentences[variant],
    fullLightingSentence,
    closingSentences[variant],
  ]
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Builds a deterministic English prompt using the 4-stage pipeline:
 * normalizeSelections -> resolveSceneConflicts -> renderScenePrompt.
 */
export function buildDeterministicEnglishPrompt(
  rawSelections: SelfieSelections,
  styleVariant = 0
): string {
  const { selections } = enforceCompatibilityRules(rawSelections);
  const normalized = normalizeSelections(selections);
  const { config } = resolveSceneConflicts(normalized, rawSelections);
  const rendered = renderScenePrompt(config, selections, styleVariant);
  return validateAndAuditFinalPrompt(rendered, selections, config).auditedPrompt;
}

/**
 * Generates consistent, non-conflicting random selections for any workflow mode.
 */
export function generateConsistentRandomSelections(
  seed = Date.now(),
  currentWorkflowMode: SelfieSelections['workflowMode'] = 'strict_editing'
): SelfieSelections {
  const pick = <T>(arr: T[], offset: number): T => {
    const idx =
      Math.abs(Math.floor(seed / (offset + 1) + offset * 17)) % arr.length;
    return arr[idx];
  };

  const strictLightingMode = pick(
    ['mode_a_screen', 'mode_b_flash_mirror'] as const,
    19
  );
  const screenOrientation = pick(
    ['facing_subject', 'angled_partial', 'facing_away'] as const,
    20
  );
  const flashMirrorGeometry = pick(
    ['natural_glare', 'partial_face_occlusion', 'angled_reflection'] as const,
    21
  );
  const lowerBodyColor = pick(
    [
      'coordinated_auto',
      'charcoal_black',
      'deep_navy',
      'slate_gray',
      'subdued_beige',
      'deep_brown',
      'muted_olive',
    ] as const,
    22
  );

  const mirrorBundle = generateConsistentMirrorPoseBundle(seed);

  const selfieType =
    currentWorkflowMode === 'mirror_studio'
      ? 'mirror'
      : currentWorkflowMode === 'strict_editing'
        ? strictLightingMode === 'mode_b_flash_mirror'
          ? 'mirror'
          : 'front_camera'
        : pick(['mirror', 'front_camera'] as const, 1);
  const isMirror = selfieType === 'mirror';

  const framingPool = isMirror
    ? (['half_body', 'three_quarter', 'full_body_mirror'] as const)
    : (['head_and_shoulders', 'half_body', 'three_quarter'] as const);
  const framing =
    currentWorkflowMode === 'mirror_studio'
      ? mirrorBundle.framing
      : pick([...framingPool], 2);

  const cameraAngle = pick(
    ['eye_level', 'slightly_above', 'slight_side_angle'] as const,
    3
  );

  const posePool =
    framing === 'full_body_mirror'
      ? (['rear_mirror_standing'] as const)
      : isMirror
        ? ([
            'rear_mirror_standing',
            'rear_mirror_sitting',
            'pose_edge_sitting',
            'pose_cross_legged',
          ] as const)
        : currentWorkflowMode === 'strict_editing'
          ? ([
              'pose_side_lying',
              'pose_supine_up',
              'pose_prone_stomach',
              'pose_headboard_lean',
              'pose_edge_sitting',
              'pose_cross_legged',
            ] as const)
          : ([
              'pose_side_lying',
              'pose_supine_up',
              'pose_prone_stomach',
              'pose_headboard_lean',
              'pose_edge_sitting',
              'pose_cross_legged',
              'rear_tripod_bed_sitting',
              'rear_tripod_lying_reading',
              'rear_propped_low_angle',
              'rear_desk_profile',
            ] as const);
  const pose = pick([...posePool], 4);

  const expression = pick(
    [
      'subtle_smile',
      'natural_expression',
      'spontaneous_laugh',
      'calm_expression',
    ] as const,
    5
  );

  const gazePool = isMirror
    ? (['at_phone_screen', 'at_mirror_reflection'] as const)
    : (['at_camera_lens', 'at_phone_screen'] as const);
  const gaze = pick([...gazePool], 6);

  const clothing = pick(
    [
      'tshirt_and_pants',
      'modest_pajamas',
      'hoodie_and_pants',
      'simple_loungewear',
    ] as const,
    7
  );
  const clothingColor = pick(
    ['beige', 'white', 'black', 'gray', 'blue'] as const,
    8
  );
  const hair = pick(
    ['match_reference', 'neatly_styled', 'slightly_casual'] as const,
    9
  );
  const skinTexture = pick(
    ['raw_authentic', 'balanced_natural', 'cinematic_clean'] as const,
    18
  );

  const roomStyle = pick(
    [
      'modern_minimal',
      'warm_cozy',
      'hotel_luxury',
      'classic',
      'compact_realistic',
    ] as const,
    10
  );
  const roomTidiness = pick(['tidy', 'lived_in_natural'] as const, 11);
  const roomColors = pick(
    ['white_and_beige', 'warm_wood', 'neutral_gray', 'calm_tones'] as const,
    12
  );

  const background =
    framing === 'full_body_mirror'
      ? 'full_length_mirror'
      : pick(
          ['bed_and_nightstand', 'window_and_curtains', 'wardrobe'] as const,
          13
        );

  const lighting = pick(
    [
      'morning_window',
      'soft_daylight',
      'late_afternoon',
      'warm_bedside_lamp',
      'calm_ceiling_light',
    ] as const,
    14
  );

  const phoneColor = isMirror
    ? pick(['black', 'silver'] as const, 15)
    : 'hidden_front_camera';
  const phoneHand =
    currentWorkflowMode === 'mirror_studio'
      ? mirrorBundle.phoneHand
      : pick(['right_hand', 'left_hand'] as const, 16);
  const photoVibe = pick(
    [
      'candid_phone_shot',
      'realistic_daily_selfie',
      'neat_natural_shot',
    ] as const,
    17
  );

  const mirrorLensProfile = mirrorBundle.mirrorLensProfile;
  const mirrorStance = mirrorBundle.mirrorStance;
  const mirrorTorsoOrientation = mirrorBundle.mirrorTorsoOrientation;
  const mirrorPhonePosition = mirrorBundle.mirrorPhonePosition;
  const mirrorFreeHandAction = mirrorBundle.mirrorFreeHandAction;
  const mirrorMovementMoment = mirrorBundle.mirrorMovementMoment;
  const mirrorGaze = mirrorBundle.mirrorGaze;
  const mirrorPose = mirrorBundle.mirrorPose;
  const mirrorExpression = mirrorBundle.mirrorExpression;
  const mirrorPoseEnergy = mirrorBundle.mirrorPoseEnergy;
  const mirrorSupportObject = mirrorBundle.mirrorSupportObject;
  const mirrorHair = pick(
    MIRROR_HAIR_PHYSICS_OPTIONS.map((o) => o.value),
    24
  );
  const mirrorClothing = pick(
    MIRROR_CLOTHING_PHYSICS_OPTIONS.map((o) => o.value),
    25
  );
  const mirrorBottomClothing = pick(
    MIRROR_BOTTOM_CLOTHING_OPTIONS.map((o) => o.value),
    26
  );

  const upperGarment = pick(
    [
      'crew_neck_tshirt',
      'long_sleeve_tshirt',
      'henley',
      'polo_shirt',
      'button_up_shirt',
      'flannel_shirt',
      'sweatshirt',
      'hoodie',
      'cardigan',
      'knit_sweater',
      'pajama_top',
      'modest_lounge_top',
      'lightweight_overshirt',
    ] as const,
    27
  );
  const upperGarmentColor = pick(
    [
      'white',
      'ivory',
      'cream',
      'black',
      'charcoal',
      'light_gray',
      'beige',
      'brown',
      'navy',
      'denim_blue',
      'sky_blue',
      'olive',
      'sage',
      'forest_green',
      'burgundy',
      'muted_rose',
    ] as const,
    28
  );
  const upperGarmentMaterial = pick(
    getCompatibleMaterialsForGarment(upperGarment),
    29
  );
  const upperGarmentFit = pick(getCompatibleFitsForGarment(upperGarment), 30);
  const upperGarmentPattern = pick(
    getCompatiblePatternsForGarment(upperGarment),
    31
  );

  const lowerGarment = pick(
    [
      'tailored_trousers',
      'relaxed_trousers',
      'chinos',
      'jeans',
      'sweatpants',
      'joggers',
      'lounge_pants',
      'pajama_pants',
      'track_pants',
      'modest_shorts',
      'midi_long_skirt',
    ] as const,
    38
  );
  const lowerGarmentColor = pick(
    [
      'black',
      'charcoal',
      'light_gray',
      'white',
      'cream',
      'beige',
      'brown',
      'navy',
      'denim_blue',
      'olive',
      'sage',
      'burgundy',
    ] as const,
    39
  );
  const lowerGarmentMaterial = pick(
    getCompatibleMaterialsForLowerGarment(lowerGarment),
    40
  );
  const lowerGarmentFit = pick(
    getCompatibleFitsForLowerGarment(lowerGarment),
    41
  );
  const lowerGarmentPattern = pick(
    getCompatiblePatternsForLowerGarment(lowerGarment),
    42
  );

  const raw: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    workflowMode: currentWorkflowMode,
    strictLightingMode,
    screenOrientation,
    flashMirrorGeometry,
    lowerBodyColor,
    customLowerBodyColorText: '',
    selfieType,
    framing,
    cameraAngle,
    pose,
    expression,
    gaze,
    clothing,
    customClothingText: '',
    clothingColor,
    customClothingColorText: '',
    hair,
    skinTexture,
    roomStyle,
    roomTidiness,
    roomColors,
    customRoomColorsText: '',
    background,
    lighting,
    mixedLightingEnabled: false,
    secondaryLighting: undefined,
    phoneColor,
    customPhoneColorText: '',
    phoneHand,
    keepFaceUnobstructed: true,
    photoVibe,
    imageTreatments: ['no_beauty_filter', 'natural_colors'],
    customDetails: '',
    mirrorGaze,
    mirrorPose,
    mirrorExpression,
    mirrorHair,
    mirrorClothing,
    mirrorBottomClothing,
    deviceModel: 'Xiaomi 15 Ultra',
    mirrorLensProfile,
    mirrorStance,
    mirrorTorsoOrientation,
    mirrorPhonePosition,
    mirrorFreeHandAction,
    mirrorMovementMoment,
    mirrorMotionBlurEnabled: false,
    mirrorPoseEnergy,
    mirrorSupportObject,
    upperGarment:
      currentWorkflowMode === 'strict_editing' ? 'preserve_reference' : upperGarment,
    upperGarmentColor:
      currentWorkflowMode === 'strict_editing'
        ? 'preserve_reference'
        : upperGarmentColor,
    upperGarmentMaterial,
    upperGarmentFit,
    upperGarmentPattern,
    lowerGarment:
      currentWorkflowMode === 'strict_editing' ? 'preserve_reference' : lowerGarment,
    lowerGarmentColor:
      currentWorkflowMode === 'strict_editing'
        ? 'preserve_reference'
        : lowerGarmentColor,
    lowerGarmentMaterial,
    lowerGarmentFit,
    lowerGarmentPattern,
    strictLowerClothingMode: 'recolor_only',
    strictUpperClothingEditEnabled: false,
  };

  return enforceCompatibilityRules(raw).selections;
}

export const EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION =
  BASE_EXPERT_SYSTEM_INSTRUCTION;

/**
 * Wraps an English prompt in a single Markdown code block per the System Prompt Output Rules:
 * "Output ONLY ONE complete English prompt in a single markdown code block."
 */
export function wrapInMarkdownCodeBlock(promptText: string): string {
  const cleaned = promptText.trim();
  return `\`\`\`text\n${cleaned}\n\`\`\``;
}

// استخراج النص من داخل كتل الكود وتجاهل أي نص حواري
export function extractMarkdownCodeBlockContent(text: string): string {
  if (!text) return '';
  const match = text.match(/```(?:markdown|text|json)?\s*\r?\n([\s\S]*?)```/i);
  return match ? match[1].trim() : text.trim();
}

// بناء حمولة رسالة المستخدم بالاعتماد على الإعدادات المهيكلة
export function buildUserConceptPayload(
  concept: string,
  sceneSettings: Partial<SelfieSelections> = {}
): string {
  const structured = normalizeSelections({
    ...sceneSettings,
    userConcept: concept,
  });
  const { config } = resolveSceneConflicts(structured, sceneSettings);
  return `User Concept: ${concept}\nScene Details: ${JSON.stringify(sceneSettings)}\nNormalized Scene Config: ${JSON.stringify(config)}`;
}

/**
 * Cleans and normalizes any LLM-returned prompt so it strictly obeys formatting rules.
 */
export function cleanGeneratedPromptText(rawText: string): string {
  if (!rawText) return '';
  let text = rawText.trim();
  const fenced = text.match(/```(?:[a-zA-Z0-9_-]*)\s*\r?\n?([\s\S]*?)```/);
  if (fenced) {
    text = fenced[1].trim();
  } else {
    text = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '');
  }
  text = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(
      (line) =>
        line.length > 0 &&
        !/^(prompt|here is|title|note|sure|certainly):/i.test(line)
    )
    .join(' ');
  text = text.replace(/^["'“”«»]+|["'“”«»]+$/g, '').trim();
  return text.replace(/\s+/g, ' ');
}

const POSE_VALIDATION_PATTERNS: Record<PoseType, RegExp> = {
  pose_side_lying:
    /\b(?:lying\s+(?:down\s+)?on\s+(?:the|their|one['’]?s|his|her)\s+side|side[- ]lying)\b/i,
  pose_supine_up:
    /\b(?:lying\s+(?:flat\s+)?on\s+(?:the|their|his|her)\s+back|supine)\b/i,
  pose_prone_stomach:
    /\b(?:lying\s+(?:down\s+)?on\s+(?:the|their|his|her)\s+stomach|propped\s+(?:up\s+)?on\s+(?:their\s+|his\s+|her\s+)?elbows|prone)\b/i,
  pose_headboard_lean:
    /\b(?:semi-reclined|leaning\s+back[^.]{0,35}headboard|reclining\s+against[^.]{0,35}headboard|against\s+(?:the|a)\s+(?:bed['’]s\s+|padded\s+|wooden\s+|upholstered\s+)?headboard)\b/i,
  pose_edge_sitting:
    /\b(?:(?:sitting|seated|slouched)[^.]{0,45}(?:edge\s+of\s+(?:the|a)\s+bed|bed['’]?s\s+edge|bed\s+edge)|edge\s+of\s+(?:the|a)\s+bed|bed['’]?s\s+edge)\b/i,
  pose_cross_legged:
    /\b(?:(?:sitting|seated)\s+cross-legged|cross-legged)\b/i,
  rear_mirror_standing:
    /\b(?:standing\s+upright|contrapposto|weight\s+shifted\s+(?:naturally\s+)?to\s+one\s+leg|standing\s+(?:naturally\s+|casually\s+)?in\s+front\s+of|standing[^.]{0,45}mirror)\b/i,
  rear_mirror_sitting:
    /\b(?:(?:sitting|seated)\s+on\s+(?:the|a)\s+(?:bedroom\s+)?floor|bedroom\s+floor\s+leaning)\b/i,
  rear_tripod_bed_sitting:
    /\b(?:(?:sitting|seated)\s+(?:naturally\s+|casually\s+|relaxed\s+|comfortably\s+)?on\s+(?:the|a)\s+bed)\b/i,
  rear_tripod_lying_reading:
    /\b(?:(?:lying|resting)\s+(?:down\s+)?(?:comfortably\s+|casually\s+)?on\s+(?:the|a)\s+bed)\b/i,
  rear_propped_low_angle:
    /\b(?:(?:sitting|seated)[^.]{0,35}(?:edge\s+of\s+(?:the|a)\s+bed|bed['’]?s\s+edge|bed\s+edge)|shelf-propped\s+perspective|propped\s+low[- ]angle)\b/i,
  rear_desk_profile:
    /\b(?:side[- ]profile\s+(?:posture|pose)|near\s+(?:the|a)\s+(?:bedroom\s+)?desk)\b/i,
};

const LIGHTING_VALIDATION_PATTERNS: Record<LightingSource, RegExp> = {
  screen_only:
    /\b(?:phone\s+screen|smartphone\s+screen|screen\s+illumination|MODE\s+A)\b/i,
  direct_flash: /\b(?:flash|MODE\s+B)\b/i,
  morning_window:
    /\b(?:morning\s+(?:\w+\s+){0,2}(?:window|light|sunlight)|window\s+(?:day)?light)\b/i,
  soft_daylight:
    /\b(?:diffused\s+(?:\w+\s+)?daylight|natural\s+daylight|daylight|soft\s+window\s+light)\b/i,
  late_afternoon:
    /\b(?:late[- ]afternoon\s+(?:\w+\s+)?(?:sun)?light|afternoon\s+(?:\w+\s+)?(?:sun)?light|golden\s+(?:afternoon|shadows|sunlight))\b/i,
  warm_bedside_lamp:
    /\b(?:bedside(?:\s+\w+){0,2}\s+lamp|table\s+lamp|warm\s+(?:ambient|bedside|bedroom|incandescent|tungsten|lamp)\s+(?:light(?:ing)?|glow)|warm\s+lamp)\b/i,
  calm_ceiling_light:
    /\b(?:overhead\s+(?:\w+\s+){0,2}light(?:ing)?|ceiling\s+(?:\w+\s+)?light(?:ing)?)\b/i,
  unselected: /.*/,
};

function extractRequiredColorTokens(phrase: string): string[] {
  const stopWords = new Set([
    'with',
    'from',
    'that',
    'this',
    'tone',
    'color',
    'tones',
    'appropriate',
    'existing',
    'outfit',
    'natural',
    'naturally',
    'matte',
    'subdued',
    'neutral',
    'muted',
    'clean',
    'crisp',
    'soft',
    'warm',
    'deep',
    'dark',
    'fabric',
    'heather',
    'earthy',
    'restrained',
    'palette',
    'custom',
  ]);
  return phrase
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3 && !stopWords.has(w));
}

function stripNegatedPhysicalClauses(text: string): string {
  return text
    .replace(
      /\b(?:do\s+not|not|never|without|no|avoid(?:ing)?|omitting|kept\s+outside|rather\s+than)\b[^.;(),]*/gi,
      ''
    )
    .replace(/\s+/g, ' ');
}

/**
 * Validates that a rendered or model-generated prompt satisfies all required constraints
 * from the normalized StructuredSceneConfig (camera mode, pose, lighting, and clothing edits).
 */
export function validatePromptAgainstSceneConfig(
  prompt: string,
  config: StructuredSceneConfig,
  normalizedSelections: SelfieSelections
): string[] {
  const constraintIssues: string[] = [];
  const trimmed = prompt.trim();
  if (!trimmed) {
    constraintIssues.push('النص المولّد فارغ.');
    return constraintIssues;
  }

  const affirmativeText = stripNegatedPhysicalClauses(trimmed);

  // 1. Validate Camera Mode constraint
  if (config.cameraMode === 'front_selfie') {
    const hasFrontCameraCue =
      /\b(?:front[- ]facing(?:\s+(?:smartphone\s+)?(?:camera|lens|selfie))?|front[- ]camera(?:\s+(?:smartphone\s+)?selfie)?|front\s+selfie|out\s+of\s+(?:the\s+)?frame|outside\s+the\s+(?:visible\s+)?frame|arm['’]?s\s+length|handheld\s+(?:smartphone\s+)?selfie)\b/i.test(
        trimmed
      );
    const hasRearOrMirrorContradiction =
      /\b(?:rear[- ]camera|mirror\s+(?:selfie|photo|photograph|reflection)|in\s+front\s+of\s+(?:a|the)\s+mirror|pointing\s+the\s+rear\s+camera)\b/i.test(
        affirmativeText
      );
    if (!hasFrontCameraCue || hasRearOrMirrorContradiction) {
      constraintIssues.push(
        'النص المولّد يغفل وضع الكاميرا الأمامية المختار أو يتعارض معه.'
      );
    }
  } else if (config.cameraMode === 'rear_mirror') {
    const hasMirrorCue = /\b(?:mirror|reflected|reflection)\b/i.test(trimmed);
    const hasFrontContradiction =
      /\b(?:front[- ]camera\s+(?:smartphone\s+)?selfie|phone\s+(?:kept\s+)?(?:completely\s+)?outside\s+the\s+(?:visible\s+)?frame)\b/i.test(
        affirmativeText
      );
    if (!hasMirrorCue || hasFrontContradiction) {
      constraintIssues.push(
        'النص المولّد يغفل وضع التصوير أمام المرآة بالكاميرا الخلفية أو يتعارض معه.'
      );
    }
  } else if (config.cameraMode === 'rear_stationary') {
    const hasStationaryCue =
      /\b(?:stationary|rear[- ]camera|across\s+the\s+room|propped|bedside\s+table|desk|shelf)\b/i.test(
        trimmed
      );
    const hasSelfieOrMirrorContradiction =
      /\b(?:front[- ]camera\s+(?:smartphone\s+)?selfie|mirror\s+selfie|mirror\s+reflection)\b/i.test(
        affirmativeText
      );
    if (!hasStationaryCue || hasSelfieOrMirrorContradiction) {
      constraintIssues.push(
        'النص المولّد يغفل وضع الكاميرا الخلفية الثابتة أو يتعارض معه.'
      );
    }
  }

  if (
    config.cameraMode !== 'rear_mirror' &&
    /\bfingers\s+gripping\s+(?:the\s+|a\s+|one\s+)?(?:smart)?phone\b/i.test(
      affirmativeText
    )
  ) {
    constraintIssues.push(
      'النص المولّد يذكر قبضة اليد على الهاتف داخل الكادر رغم عدم ظهور الهاتف في هذا الوضع.'
    );
  }

  // 2. Validate Pose & Physical Contact constraint
  const expectedPosePattern =
    POSE_VALIDATION_PATTERNS[normalizedSelections.pose];
  if (expectedPosePattern && !expectedPosePattern.test(trimmed)) {
    constraintIssues.push(
      'النص المولّد يغفل الوضعية المختارة (Pose) أو يتعارض معها.'
    );
  }

  if (
    !isBedContactPose(config, normalizedSelections) &&
    /\b(?:(?:compressed|indented|depressed|sunken)\s+(?:mattress|pillow)s?|(?:mattress|pillow)s?\s+(?:visibly\s+|heavily\s+)?(?:compressed|indented|depressed|sinking))\b/i.test(
      affirmativeText
    )
  ) {
    constraintIssues.push(
      'النص المولّد يضيف انضغاط المرتبة أو الوسادة رغم أن الوضعية المختارة لا تلامس السرير.'
    );
  }

  // 2b. Validate Motion Blur constraint
  const motionBlurRequested = Boolean(
    config.mirrorPoseComposition?.motionBlurEnabled ||
      config.captureArtifacts.includes('slight_hand_motion_blur')
  );
  if (!motionBlurRequested && /\bmotion\s+blur\b/i.test(affirmativeText)) {
    constraintIssues.push(
      'النص المولّد يضيف ضبابية حركية (Motion Blur) رغم عدم تفعيلها.'
    );
  }

  // 3. Validate Lighting constraint
  if (config.phoneProcessingProfile === 'night_mode') {
    if (!/\bnight[- ]mode\b/i.test(trimmed)) {
      constraintIssues.push(
        'النص المولّد يغفل الوضع الليلي (Night Mode) المختار.'
      );
    }
  } else {
    const expectedLightingPattern =
      LIGHTING_VALIDATION_PATTERNS[config.lightingSource];
    if (expectedLightingPattern && !expectedLightingPattern.test(trimmed)) {
      constraintIssues.push(
        'النص المولّد يغفل إعداد الإضاءة المختار أو يتعارض معه.'
      );
    }
    if (
      config.lightingSource !== 'direct_flash' &&
      config.secondaryLightingSource !== 'direct_flash' &&
      /\b(?:illuminated\s+solely\s+by\s+the\s+direct\s+camera\s+flash|using\s+only\s+the\s+(?:rear\s+phone\s+|direct\s+)?(?:camera\s+|phone\s+)?flash|exclusively\s+with\s+the\s+rear\s+smartphone\s+flash|realistic\s+flash\s+falloff)\b/i.test(
        affirmativeText
      )
    ) {
      constraintIssues.push(
        'النص المولّد يضيف فلاش مباشر بالرغم من عدم اختياره في الإضاءة.'
      );
    }
  }

  // 4. Validate Clothing Edits constraint
  const validateUpperStructuredSpec = (textToValidate: string): boolean => {
    const ce = config.clothingEdits;
    if (ce.preserveUpperClothing || ce.upperGarment === 'preserve_reference') {
      return /\b(?:upper[- ]body|upper\s+(?:garment|clothing|attire)|original\s+upper|exact\s+outfit|unchanged|untouched|unaltered|preserved)\b/i.test(
        textToValidate
      );
    }
    const lowerText = textToValidate.toLowerCase();
    const garmentMatch =
      !ce.upperGarment ||
      ce.upperGarment === 'custom_upper_garment' ||
      (ce.upperGarment === 'crew_neck_tshirt' &&
        /\b(?:t-?shirt|tee|crew[- ]?neck)\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'long_sleeve_tshirt' &&
        /\b(?:long[- ]sleeve\s+(?:t-?shirt|tee)|t-?shirt|tee)\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'henley' && /\bhenley\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'polo_shirt' && /\bpolo\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'button_up_shirt' &&
        /\b(?:button[- ]up|button[- ]down|collared\s+shirt)\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'flannel_shirt' && /\bflannel\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'sweatshirt' && /\bsweatshirt\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'hoodie' && /\bhoodie\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'cardigan' && /\bcardigan\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'knit_sweater' &&
        /\b(?:sweater|knit\s+sweater|pullover)\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'pajama_top' && /\bpajama\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'modest_lounge_top' &&
        /\b(?:lounge\s+top|loungewear|top)\b/i.test(textToValidate)) ||
      (ce.upperGarment === 'lightweight_overshirt' &&
        /\bovershirt\b/i.test(textToValidate));

    const colorPhrase =
      ce.upperGarmentColor && ce.upperGarmentColor !== 'preserve_reference'
        ? resolveUpperGarmentColorPhrase(
            ce.upperGarmentColor,
            normalizedSelections.customUpperColorText
          )
        : '';
    const colorTokens = extractRequiredColorTokens(colorPhrase);
    const colorMatch =
      colorTokens.length === 0 ||
      colorTokens.some((tok) => lowerText.includes(tok));

    const materialPhrase = ce.upperGarmentMaterial
      ? findPhrase(UPPER_GARMENT_MATERIAL_OPTIONS, ce.upperGarmentMaterial)
      : '';
    const materialTokens = materialPhrase
      .toLowerCase()
      .split(/[\s-]+/)
      .filter((w) => w.length >= 4 && w !== 'cotton' && w !== 'blend' && w !== 'brushed' && w !== 'medium' && w !== 'gauge');
    const materialMatch =
      !materialPhrase ||
      lowerText.includes(materialPhrase.toLowerCase()) ||
      materialTokens.some((tok) => lowerText.includes(tok)) ||
      (ce.upperGarmentMaterial === 'cotton_jersey' && /\bcotton\b/i.test(textToValidate)) ||
      (ce.upperGarmentMaterial === 'linen_cotton_blend' && /\blinen\b/i.test(textToValidate)) ||
      (ce.upperGarmentMaterial === 'chambray_denim' && /\b(?:chambray|denim)\b/i.test(textToValidate));

    const patternMatch =
      !ce.upperGarmentPattern ||
      ce.upperGarmentPattern === 'solid' ||
      ce.upperGarmentPattern === 'subtle_texture' ||
      (ce.upperGarmentPattern === 'stripes' && /\bstripes?|striped\b/i.test(textToValidate)) ||
      (ce.upperGarmentPattern === 'plaid' && /\bplaid|checks?|checkered\b/i.test(textToValidate));

    return garmentMatch && colorMatch && materialMatch && patternMatch;
  };

  const validateLowerStructuredSpec = (textToValidate: string): boolean => {
    const ce = config.clothingEdits;
    const lowerSpec = ce.lower;
    if (ce.preserveLowerClothing || lowerSpec?.preserveReference) {
      return /\b(?:lower[- ]body|lower\s+(?:garment|clothing|attire|outfit)|original\s+lower|exact\s+outfit|unchanged|untouched|unaltered|preserved)\b/i.test(
        textToValidate
      );
    }

    if (lowerSpec?.editMode === 'recolor_only') {
      const hasLowerMention =
        /\b(?:lower[- ]body|lower\s+garments?|lower\s+clothing|trousers|shorts|pants|jeans|joggers|sweatpants|bottoms)\b/i.test(
          textToValidate
        );
      const colorPhrase =
        lowerSpec.colorPhrase || ce.lowerBodyColorPhrase || '';
      const colorTokens = extractRequiredColorTokens(colorPhrase);
      const lowerPrompt = textToValidate.toLowerCase();
      const isCoordinatedAuto = /coordinated neutral dark tone/i.test(colorPhrase);
      const hasColorToken =
        colorTokens.length === 0 ||
        colorTokens.some((tok) => lowerPrompt.includes(tok)) ||
        (isCoordinatedAuto &&
          /\b(?:coordinated|dark|charcoal|navy|slate|neutral|muted|beige|brown|olive|black|gr[ae]y)\b/i.test(
            textToValidate
          ));
      return hasLowerMention && hasColorToken;
    }

    if (normalizedSelections.lowerGarment === undefined) {
      return true;
    }

    const lowerText = textToValidate.toLowerCase();
    const lg = ce.lowerGarment;
    const garmentMatch =
      !lg ||
      lg === 'custom_lower_garment' ||
      (lg === 'sweatpants' && /\bsweatpants\b/i.test(textToValidate)) ||
      (lg === 'joggers' && /\bjoggers?\b/i.test(textToValidate)) ||
      (lg === 'pajama_pants' && /\bpajama\b/i.test(textToValidate)) ||
      (lg === 'lounge_pants' && /\blounge\s+pants\b/i.test(textToValidate)) ||
      (lg === 'jeans' && /\b(?:jeans|denim)\b/i.test(textToValidate)) ||
      (lg === 'chinos' && /\bchinos?\b/i.test(textToValidate)) ||
      (lg === 'tailored_trousers' &&
        /\b(?:tailored\s+trousers|trousers|slacks)\b/i.test(textToValidate)) ||
      (lg === 'relaxed_trousers' &&
        /\b(?:relaxed\s+(?:casual\s+)?trousers|trousers|pants)\b/i.test(textToValidate)) ||
      (lg === 'track_pants' && /\btrack\s+pants\b/i.test(textToValidate)) ||
      (lg === 'athletic_shorts' && /\b(?:athletic\s+shorts|shorts)\b/i.test(textToValidate)) ||
      (lg === 'modest_shorts' && /\bshorts\b/i.test(textToValidate)) ||
      (lg === 'midi_long_skirt' && /\bskirt\b/i.test(textToValidate));

    const colorPhrase =
      ce.lowerGarmentColor && ce.lowerGarmentColor !== 'preserve_reference'
        ? resolveLowerGarmentColorPhrase(
            ce.lowerGarmentColor,
            normalizedSelections.customLowerGarmentColorText
          )
        : '';
    const colorTokens = extractRequiredColorTokens(colorPhrase);
    const colorMatch =
      colorTokens.length === 0 ||
      colorTokens.some((tok) => lowerText.includes(tok));

    const materialPhrase = ce.lowerGarmentMaterial
      ? findPhrase(LOWER_GARMENT_MATERIAL_OPTIONS, ce.lowerGarmentMaterial)
      : '';
    const materialTokens = materialPhrase
      .toLowerCase()
      .split(/[\s-]+/)
      .filter(
        (w) =>
          w.length >= 4 &&
          w !== 'cotton' &&
          w !== 'blend' &&
          w !== 'brushed' &&
          w !== 'matte' &&
          w !== 'soft' &&
          w !== 'woven' &&
          w !== 'breathable'
      );
    const materialMatch =
      !materialPhrase ||
      lowerText.includes(materialPhrase.toLowerCase()) ||
      materialTokens.some((tok) => lowerText.includes(tok)) ||
      (ce.lowerGarmentMaterial === 'cotton_jersey' && /\bcotton\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'cotton_twill' && /\b(?:twill|cotton)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'cotton_poplin' && /\b(?:poplin|cotton)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'linen_cotton_blend' && /\blinen\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'wool_blend_suiting' && /\b(?:wool|suiting)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'nylon_track_weave' && /\b(?:track|woven)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'athletic_mesh' && /\bmesh\b/i.test(textToValidate)) ||
      (ce.lowerGarmentMaterial === 'ribbed_knit' && /\b(?:ribbed|knit)\b/i.test(textToValidate));

    const patternMatch =
      !ce.lowerGarmentPattern ||
      ce.lowerGarmentPattern === 'solid' ||
      ce.lowerGarmentPattern === 'subtle_texture' ||
      (ce.lowerGarmentPattern === 'stripes' && /\b(?:stripes?|striped|pinstripes?)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentPattern === 'side_stripe' && /\b(?:side[- ]seam\s+stripe|side\s+stripe|striped?)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentPattern === 'plaid' && /\b(?:plaid|checks?|checkered)\b/i.test(textToValidate)) ||
      (ce.lowerGarmentPattern === 'washed_fade' && /\b(?:washed|fade)\b/i.test(textToValidate));

    return garmentMatch && colorMatch && materialMatch && patternMatch;
  };

  if (
    config.clothingEdits.preserveUpperClothing &&
    /\b(?:recolor(?:ing)?\s+(?:the\s+)?upper|dress(?:ing)?\s+(?:the\s+)?upper\s+body\s+in|change\s+(?:the\s+)?upper\s+(?:garment|clothing))\b/i.test(
      affirmativeText
    )
  ) {
    constraintIssues.push(
      'النص المولّد يعدّل القطعة العلوية رغم ضبطها على الحفاظ من الصورة المرجعية.'
    );
  }
  if (
    config.clothingEdits.preserveLowerClothing &&
    /\b(?:recolor(?:ing)?\s+(?:only\s+)?(?:the\s+)?lower|dress(?:ing)?\s+(?:the\s+)?lower\s+body\s+in|change\s+(?:the\s+)?lower\s+(?:garment|clothing))\b/i.test(
      affirmativeText
    )
  ) {
    constraintIssues.push(
      'النص المولّد يعدّل القطعة السفلية رغم ضبطها على الحفاظ من الصورة المرجعية.'
    );
  }

  if (config.clothingEdits.mode === 'recolor_lower_only') {
    const hasLowerGarmentMention =
      /\b(?:lower[- ]body|lower\s+garments?|lower\s+clothing|trousers|shorts|pants|jeans|joggers|sweatpants|bottoms)\b/i.test(
        trimmed
      );
    const hasPreservationMention =
      /\b(?:cut|fabric|design|fit|construction|texture|weave|seams|style|silhouettes?|garment)\b/i.test(
        trimmed
      ) &&
      /\b(?:upper[- ]body|upper\s+(?:clothing|garments?|attire|outfit)|top(?:\s+(?:garment|clothing|attire|outfit))?|remaining\s+(?:outfit|clothing|garments?|attire)|shirt|hoodie|jacket|t-shirt|tee)\b/i.test(
        trimmed
      );
    const colorPhrase = config.clothingEdits.lowerBodyColorPhrase || '';
    const colorTokens = extractRequiredColorTokens(colorPhrase);
    const lowerPrompt = trimmed.toLowerCase();
    const isCoordinatedAuto = /coordinated neutral dark tone/i.test(colorPhrase);
    const hasColorToken =
      colorTokens.length === 0 ||
      colorTokens.some((tok) => lowerPrompt.includes(tok)) ||
      (isCoordinatedAuto &&
        /\b(?:coordinated|dark|charcoal|navy|slate|neutral|muted|beige|brown|olive|black|gr[ae]y)\b/i.test(
          trimmed
        ));

    if (!hasLowerGarmentMention || !hasPreservationMention || !hasColorToken) {
      constraintIssues.push(
        'النص المولّد يغفل تعديل لون الملابس السفلية المطلوب أو شروط الحفاظ على القصة والملابس العلوية.'
      );
    }
  } else if (config.clothingEdits.mode === 'edit_upper_only') {
    if (!validateUpperStructuredSpec(trimmed) || !validateLowerStructuredSpec(trimmed)) {
      constraintIssues.push(
        'النص المولّد يغفل مواصفات القطعة العلوية المختارة أو قاعدة الحفاظ على الملابس السفلية.'
      );
    }
  } else if (config.clothingEdits.mode === 'edit_both_independently') {
    const upperValid = validateUpperStructuredSpec(trimmed);
    const lowerValid = validateLowerStructuredSpec(trimmed);
    if (!lowerValid || !upperValid) {
      constraintIssues.push(
        'النص المولّد يغفل مواصفات القطعة العلوية أو تعديل الملابس السفلية المستقل.'
      );
    }
  } else if (config.clothingEdits.mode === 'preserve_reference') {
    const hasPreserveOutfit =
      /\b(?:(?:outfit|clothing|clothes|garments?|attire)\s+(?:from|in)\s+(?:the\s+)?reference|(?:same|exact|original|reference)\s+(?:outfit|clothing|clothes|garments?|attire)|keep(?:ing)?\s+(?:the\s+)?(?:existing|reference|original)\s+(?:outfit|clothing|clothes|garments?|attire)|leave\s+(?:the\s+)?(?:outfit|clothing|clothes|attire)\s+unchanged)\b/i.test(
        trimmed
      );
    const withoutNegatedRecolor = trimmed.replace(
      /\b(?:without|do\s+not|don't|never|no|avoid(?:ing)?)\s+(?:any\s+)?(?:recolor(?:ing)?|color\s+changes?)\b/gi,
      ''
    );
    const hasUnrequestedRecolor = /\b(?:recolor|recoloring)\b/i.test(
      withoutNegatedRecolor
    );
    if (
      (!hasPreserveOutfit &&
        !/\bpreserving\s+both\s+(?:the\s+)?original\s+upper-body\b/i.test(
          trimmed
        )) ||
      hasUnrequestedRecolor
    ) {
      constraintIssues.push(
        'النص المولّد لا يلتزم بالحفاظ على ملابس الصورة المرجعية دون تغيير اللون.'
      );
    }
  } else if (config.clothingEdits.mode === 'full_outfit') {
    if (
      normalizedSelections.upperGarment !== undefined ||
      config.clothingEdits.preserveUpperClothing
    ) {
      if (!validateUpperStructuredSpec(trimmed)) {
        constraintIssues.push(
          'النص المولّد يغفل مواصفات القطعة العلوية (النوع أو اللون أو الخامة أو القصة أو النقشة) أو قاعدة الحفاظ عليها.'
        );
      }
    } else {
      const outfitPhrase = config.clothingEdits.upperClothingPhrase || '';
      const outfitTokens = extractRequiredColorTokens(outfitPhrase);
      const lowerPrompt = trimmed.toLowerCase();
      const hasOutfitMatch =
        outfitTokens.length === 0 ||
        outfitTokens.some((tok) => lowerPrompt.includes(tok));
      if (!hasOutfitMatch) {
        constraintIssues.push('النص المولّد يغفل وصف الملابس أو اللون المختار.');
      }
    }

    if (
      normalizedSelections.lowerGarment !== undefined ||
      config.clothingEdits.preserveLowerClothing
    ) {
      if (!validateLowerStructuredSpec(trimmed)) {
        constraintIssues.push(
          'النص المولّد يغفل مواصفات القطعة السفلية (النوع أو اللون أو الخامة أو القصة أو النقشة) أو قاعدة الحفاظ عليها.'
        );
      }
    }
  }

  return constraintIssues;
}

/**
 * STAGE 4: Validate the rendered prompt and check for selection or text contradictions
 * as well as required StructuredSceneConfig constraints.
 */
export function validatePromptOutput(
  prompt: string,
  selections: SelfieSelections
): {
  valid: boolean;
  wordCount: number;
  issues: string[];
  warnings: string[];
} {
  const issues: string[] = [];
  const trimmed = prompt.trim();
  const words = trimmed ? trimmed.split(/\s+/) : [];
  const wordCount = words.length;

  // Check if the supplied selections themselves contain unresolved conflicts
  const conflictCheck = detectSelectionConflicts(selections);
  const warnings = [...conflictCheck.warnings];
  if (!conflictCheck.valid) {
    for (const warning of conflictCheck.warnings) {
      issues.push(warning);
    }
  }

  const affirmativePrompt = stripNegatedPhysicalClauses(trimmed);

  // Check for contradictory statements inside the rendered prompt text
  const mentionsScreenOnly =
    /\b(?:phone\s+screen\s+is\s+the\s+sole\s+active\s+light\s+source|phone\s+screen\s+as\s+the\s+only\s+active\s+light\s+source|phone\s+screen\s+as\s+the\s+sole\s+active\s+light\s+source|lit\s+solely\s+by\s+the\s+smartphone\s+screen|only\s+the\s+phone\s+screen\s+illuminates|phone-screen\s+light\s+alone)\b/i.test(
      affirmativePrompt
    );
  const mentionsActiveDirectFlash =
    /\b(?:illuminated\s+solely\s+by\s+the\s+direct\s+camera\s+flash|using\s+only\s+the\s+(?:rear\s+phone\s+|direct\s+)?(?:camera\s+|phone\s+)?flash|exclusively\s+with\s+the\s+rear\s+smartphone\s+flash|direct\s+rear\s+LED\s+flash|direct\s+(?:camera|phone)\s+flash|direct\s+flash\s+alone|dual-LED\s+flash)\b/i.test(
      affirmativePrompt
    );
  const mentionsNightMode =
    /\b(?:using|with|apply)\s+(?:steady\s+|smartphone\s+)?night[- ]mode\b|\bnight[- ]mode\s+(?:multi-frame|low-light|illumination)\b/i.test(
      affirmativePrompt
    );

  if (mentionsScreenOnly && mentionsActiveDirectFlash) {
    const msg =
      'تعارض في نص البرومبت: يتضمن النص إضاءة الشاشة فقط مع الفلاش المباشر في آن واحد.';
    issues.push(msg);
    if (!warnings.includes(msg)) warnings.push(msg);
  }

  if (mentionsNightMode && mentionsActiveDirectFlash) {
    const msg =
      'تعارض في نص البرومبت: يتضمن النص الوضع الليلي (Night Mode) مع الفلاش المباشر في آن واحد.';
    issues.push(msg);
    if (!warnings.includes(msg)) warnings.push(msg);
  }

  if (
    /\bfront-camera\s+smartphone\s+selfie\b/i.test(affirmativePrompt) &&
    /\brear-camera\s+(?:smartphone\s+)?mirror\s+(?:photo|photograph|selfie)\b/i.test(
      affirmativePrompt
    )
  ) {
    const msg =
      'تعارض في نص البرومبت: لا يمكن وصف سيلفي الكاميرا الأمامية كلقطة مرآة بالكاميرا الخلفية.';
    issues.push(msg);
    if (!warnings.includes(msg)) warnings.push(msg);
  }

  const { selections: normalizedSelections } =
    enforceCompatibilityRules(selections);
  const normalizedConfig = normalizeSelections(normalizedSelections);
  const { config } = resolveSceneConflicts(normalizedConfig, selections);

  if (selections.workflowMode === 'mirror_studio') {
    if (
      !/"SYSTEM_DIRECTIVE"\s*:\s*"EXECUTE_PHOTOGRAPHIC_CAPTURE"/.test(trimmed)
    ) {
      issues.push(
        'يجب أن يتضمن كود استوديو المرآة توجيه EXECUTE_PHOTOGRAPHIC_CAPTURE.'
      );
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        parsed.SYSTEM_DIRECTIVE !== 'EXECUTE_PHOTOGRAPHIC_CAPTURE' ||
        typeof parsed.TARGET_AI !== 'string' ||
        typeof parsed.GEMINI_EXECUTION_RULE !== 'string' ||
        !parsed.PRIORITIES ||
        typeof parsed.PRIORITIES.Rule_1 !== 'string' ||
        typeof parsed.PRIORITIES.Rule_2 !== 'string' ||
        typeof parsed.SCENE_LIGHTING !== 'string' ||
        !parsed.POSE_COMPOSITION ||
        typeof parsed.POSE_COMPOSITION !== 'object' ||
        Array.isArray(parsed.POSE_COMPOSITION) ||
        !parsed.CAMERA_PIPELINE ||
        typeof parsed.CAMERA_PIPELINE.Device !== 'string' ||
        typeof parsed.CAMERA_PIPELINE.Optics_Physics !== 'string' ||
        typeof parsed.CAMERA_PIPELINE.Sensor_Response !== 'string' ||
        typeof parsed.PHYSICAL_MECHANICS !== 'string' ||
        !parsed.SUBJECT_IDENTITY_LOCK ||
        typeof parsed.SUBJECT_IDENTITY_LOCK.Structural_Integrity !== 'string' ||
        typeof parsed.SUBJECT_IDENTITY_LOCK.Texture_Enforcement !== 'string' ||
        typeof parsed.SUBJECT_IDENTITY_LOCK.ANTI_AI_FILTERS !== 'string'
      ) {
        issues.push('بنية كود JSON لاستوديو المرآة غير مكتملة.');
      } else {
        const expectedFocus = buildFocusDescription(
          config.focusTarget,
          'rear_mirror'
        );
        const expectedExposure = buildExposureDescription(
          config.exposurePreference,
          config.lightingSource,
          config.phoneProcessingProfile
        );
        const focusText = parsed.CAMERA_PIPELINE.Optics_Physics;
        const focusMatches =
          focusText.toLowerCase().includes(expectedFocus.toLowerCase()) ||
          (config.focusTarget === 'mirror_reflection'
            ? /\bfocus(?:ed|ing)?\b.*\b(?:reflected|mirror|reflection)\b/i.test(
                focusText
              )
            : config.focusTarget === 'upper_body'
              ? /\bfocus(?:ed|ing)?\b.*\bupper\s+body\b/i.test(focusText)
              : /\b(?:autofocus|focus(?:ed|ing)?)\b.*\b(?:face|facial\s+features|eyes)\b/i.test(
                  focusText
                ));
        if (!focusMatches) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل إعداد نقطة التركيز البؤري (focusTarget).'
          );
        }

        const exposureText = parsed.CAMERA_PIPELINE.Sensor_Response;
        const effectiveExposure: ExposurePreference =
          (config.lightingSource === 'screen_only' ||
            config.phoneProcessingProfile === 'night_mode') &&
          config.exposurePreference === 'flash_highlight_controlled'
            ? 'low_key_shadow_preserving'
            : config.exposurePreference;
        const exposureMatches =
          exposureText.toLowerCase().includes(expectedExposure.toLowerCase()) ||
          (effectiveExposure === 'low_key_shadow_preserving'
            ? /\b(?:low[- ]key|shadow[- ]preserving)\b|\bpreserving\b.*\b(?:low[- ]light|mood|shadow)/i.test(
                exposureText
              )
            : effectiveExposure === 'flash_highlight_controlled'
              ? /\b(?:controlled\s+(?:\w+\s+)?highlight|highlight\s+(?:control|roll-off|retention|preservation)|flash\s+(?:\w+\s+)?highlights?|without\s+(?:\w+\s+)?clipping|prevent(?:ing)?\s+(?:harsh\s+|unnatural\s+)?clipping|flash\s+falloff)\b/i.test(
                  exposureText
                )
              : /\b(?:auto[- ]exposure|balanced\s+(?:exposure|highlights|dynamic\s+range|tones)|balancing\s+subject|natural\s+(?:smartphone\s+)?(?:exposure|dynamic\s+range)|preserv(?:e|ing)\s+highlight\s+and\s+shadow\s+detail)\b/i.test(
                  exposureText
                ));
        if (!exposureMatches) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل تفضيل التعريض الضوئي (exposurePreference).'
          );
        }

        // Positive instructions to redesign reference facial anatomy must not be
        // accepted merely because the standard preservation text is also present.
        // Remove the shared rules first so their "do not change" enumerations
        // cannot be mistaken for an affirmative edit request.
        const identityDirectiveText = stripNegatedPhysicalClauses(
          `${parsed.GEMINI_EXECUTION_RULE} ${parsed.SUBJECT_IDENTITY_LOCK.Structural_Integrity}`
            .replaceAll(REFERENCE_FACE_PRESERVATION_RULE, '')
            .replaceAll(CONCISE_REFERENCE_FACE_PRESERVATION_RULE, '')
        );
        if (
          /\b(?:replace|swap|redesign|reshape|reconstruct|alter|modify|change)\s+(?:(?:the|a|an|original|reference|subject's|person's)\s+){0,4}(?:face|nose|jaw(?:line)?|chin|eyes?|hairline|facial\s+(?:features?|geometry|anatomy|structure))\b/i.test(
            identityDirectiveText
          )
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يطلب تغيير هوية الوجه أو إعادة تشكيل ملامحه خلافًا للصورة المرجعية.'
          );
        }

        const structuralText = parsed.SUBJECT_IDENTITY_LOCK.Structural_Integrity;
        if (
          !structuralText.includes(REFERENCE_FACE_PRESERVATION_RULE) &&
          !(
            /\b(?:face\s+shape|facial\s+proportions)\b/i.test(structuralText) &&
            /\b(?:do\s+not\s+beautify|without\s+beautifying|never\s+beautify|avoid\s+beautifying)\b/i.test(
              structuralText
            ) &&
            /\basymmetry\b/i.test(structuralText)
          )
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل قاعدة الحفاظ على ملامح الوجه المرجعية.'
          );
        }

        const execRuleText = parsed.GEMINI_EXECUTION_RULE;
        if (
          !execRuleText.includes(CONCISE_REFERENCE_FACE_PRESERVATION_RULE) &&
          !(
            /\b(?:face\s+shape|facial\s+proportions)\b/i.test(execRuleText) &&
            /\b(?:without\s+beautifying|do\s+not\s+beautify|never\s+beautify|avoid\s+beautifying)\b/i.test(
              execRuleText
            )
          )
        ) {
          issues.push(
            'توجيه التنفيذ في استوديو المرآة يغفل قاعدة الحفاظ على ملامح الوجه.'
          );
        }

        if (
          !/(?:pointing|aiming|holding)\s+(?:the|its|their)?\s*rear\s+(?:\w+\s+){0,2}camera\s+(?:at|toward|towards)\s+(?:the|a)\s+mirror|\brear\s+(?:\w+\s+){0,2}camera\s+(?:pointed|aimed)\s+(?:at|toward|towards)\s+(?:the|a)\s+mirror/i.test(
            parsed.PHYSICAL_MECHANICS
          )
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل قاعدة توجيه الكاميرا الخلفية نحو المرآة.'
          );
        }
        const isScreenOrNight =
          config.lightingSource === 'screen_only' ||
          config.phoneProcessingProfile === 'night_mode';
        if (
          isScreenOrNight &&
          /\b(?:active\s+light\s+source\s+is\s+the\s+.*flash|direct\s+rear.*flash\s+reflecting)\b/i.test(
            parsed.SCENE_LIGHTING
          )
        ) {
          issues.push(
            'تعارض في إضاءة استوديو المرآة: لا يمكن تفعيل الفلاش المباشر مع الوضع الليلي أو إضاءة الشاشة فقط.'
          );
        }
        if (
          !isScreenOrNight &&
          config.lightingSource === 'direct_flash' &&
          !/\bflash\b/i.test(parsed.SCENE_LIGHTING)
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل إضاءة الفلاش المباشر المختارة.'
          );
        }

        // Validate Xiaomi 15 Ultra device profile, selected rear lens, metadata guardrails, and motion-blur rule
        const deviceText = String(parsed.CAMERA_PIPELINE.Device || '');
        const lensProfileObj =
          parsed.CAMERA_PIPELINE.Lens_Profile &&
          typeof parsed.CAMERA_PIPELINE.Lens_Profile === 'object'
            ? parsed.CAMERA_PIPELINE.Lens_Profile
            : null;
        const combinedMirrorCameraText = `${deviceText} ${parsed.CAMERA_PIPELINE.Optics_Physics} ${parsed.CAMERA_PIPELINE.Sensor_Response} ${parsed.SCENE_LIGHTING} ${parsed.PHYSICAL_MECHANICS} ${JSON.stringify(lensProfileObj || {})}`;
        const strippedNegatedMeta = combinedMirrorCameraText
          .replace(
            /\b(?:do\s+not|not|never|without|no|avoid(?:ing)?|rather\s+than)\b[^.;()]*/gi,
            ''
          )
          .replace(/\s+/g, ' ');

        if (/\bXiaomi\s+15\b(?!\s*Ultra\b)/i.test(combinedMirrorCameraText)) {
          issues.push(
            'كود JSON لاستوديو المرآة يجب أن يستخدم اسم Xiaomi 15 Ultra وليس Xiaomi 15 فقط.'
          );
        }
        const expectedDevice =
          config.subjectFacts.deviceModel || 'Xiaomi 15 Ultra';
        if (
          expectedDevice.toLowerCase().includes('xiaomi 15 ultra') &&
          !/\bXiaomi\s+15\s+Ultra\b/i.test(deviceText)
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يغفل ملف الجهاز المحدد Xiaomi 15 Ultra في CAMERA_PIPELINE.Device.'
          );
        }

        const expectedFocalMm =
          config.mirrorCameraSpec?.equivalentFocalLengthMm ?? 23;
        const lensMatchText = `${deviceText} ${parsed.CAMERA_PIPELINE.Optics_Physics} ${JSON.stringify(lensProfileObj || {})}`;
        if (!new RegExp(`\\b${expectedFocalMm}\\s*mm\\b`, 'i').test(lensMatchText)) {
          issues.push(
            `كود JSON لاستوديو المرآة يغفل مواصفات العدسة الخلفية المختارة (${expectedFocalMm}mm).`
          );
        }

        if (expectedFocalMm === 70 || expectedFocalMm === 100) {
          if (/\bdigital\s+zoom\b/i.test(strippedNegatedMeta)) {
            issues.push(
              'لا يجوز وصف عدسات التقريب البصرية (70mm أو 100mm) في Xiaomi 15 Ultra على أنها تقريب رقمي.'
            );
          }
          if (
            /\b(?:standing\s+(?:very\s+)?close\s+to\s+the\s+mirror|close[- ]range\s+mirror|flat\s+on\s+the\s+(?:physical\s+)?(?:mirror|glass))\b/i.test(
              strippedNegatedMeta
            )
          ) {
            issues.push(
              'عدستا التقريب 70mm و100mm تتطلبان مسافة أبعد عن المرآة ولا تتوافقان مع الوقوف أو لمس المرآة عن قرب.'
            );
          }
        }

        if (
          /\b(?:Sony|LYT-900|OV32B|1-inch\s+(?:type\s+)?sensor|IMX\d+|ISO\s*\d+|shutter\s+speed|1\/\d+s|watt-seconds?|\d{4}\s*K\b)\b/i.test(
            strippedNegatedMeta
          )
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يحتوي على بيانات غير موثقة للمستشعر أو ISO أو سرعة الغالق أو قوة الفلاش.'
          );
        }

        if (/\b(?:front[- ]camera|tripod)\b/i.test(strippedNegatedMeta)) {
          issues.push(
            'استوديو المرآة يتطلب التقاطًا يدويًا بالكاميرا الخلفية أمام المرآة دون كاميرا أمامية أو حامل ثلاثي.'
          );
        }

        if (
          !config.mirrorPoseComposition?.motionBlurEnabled &&
          /\bmotion\s+blur\b/i.test(strippedNegatedMeta)
        ) {
          issues.push(
            'الضبابية الحركية (Motion Blur) معطلة افتراضيًا ويجب عدم تفعيلها إلا عند اختيارها صراحةً.'
          );
        }

        if (
          !isBedContactPose(config, normalizedSelections) &&
          /\b(?:(?:compressed|indented|depressed|sunken)\s+(?:mattress|pillow)s?|(?:mattress|pillow)s?\s+(?:visibly\s+|heavily\s+)?(?:compressed|indented|depressed|sinking))\b/i.test(
            strippedNegatedMeta
          )
        ) {
          issues.push(
            'كود JSON لاستوديو المرآة يضيف انضغاط المرتبة أو الوسادة رغم أن الوضعية المختارة ليست على السرير.'
          );
        }

        // Validate POSE_COMPOSITION canonical compatibility rules (phone hand, crop visibility, support, gaze)
        const poseCompObj =
          parsed.POSE_COMPOSITION &&
          typeof parsed.POSE_COMPOSITION === 'object'
            ? parsed.POSE_COMPOSITION
            : null;
        if (poseCompObj) {
          const poseText = String(poseCompObj.pose_description || parsed.PHYSICAL_MECHANICS || '');
          const strippedPoseText = poseText
            .replace(
              /\b(?:do\s+not|not|never|without|no|avoid(?:ing)?|rather\s+than)\b[^.;()]*/gi,
              ''
            )
            .replace(/\s+/g, ' ');
          const mechanicsStrippedPose = String(parsed.PHYSICAL_MECHANICS || '')
            .replace(
              /\b(?:do\s+not|not|never|without|no|avoid(?:ing)?|rather\s+than)\b[^.;()]*/gi,
              ''
            )
            .replace(/\s+/g, ' ');

          const activePhoneHand =
            config.mirrorPoseComposition?.phoneHand || normalizedSelections.phoneHand || 'right_hand';
          const activePhonePosition =
            config.mirrorPoseComposition?.phonePosition || normalizedSelections.mirrorPhonePosition;
          const activeTorsoOrientation =
            config.mirrorPoseComposition?.torsoOrientation || normalizedSelections.mirrorTorsoOrientation;
          // The typed canonical hand and its textual mechanics must agree with
          // the normalized user choice; the JSON schema alone is insufficient.
          if (
            poseCompObj.phone_hand !== activePhoneHand ||
            poseCompObj.phone_position !== activePhonePosition ||
            poseCompObj.torso_orientation !== activeTorsoOrientation
          ) {
            issues.push(
              'تعارض في هندسة المرآة: اليد أو ارتفاع الهاتف أو اتجاه الجذع لا يطابق الإعدادات المختارة.'
            );
          }

          const anatomicalHold = String(poseCompObj.anatomical_hand_mechanics || '');
          const reflectedSide = String(poseCompObj.mirror_reflection_side || '');
          if (activePhoneHand === 'both_hands') {
            if (
              !/\bboth\s+(?:anatomical\s+)?hands\b/i.test(anatomicalHold) ||
              !/\bboth\s+hands\b/i.test(reflectedSide)
            ) {
              issues.push(
                'تعارض في الإمساك بالهاتف: اختيار كلتا اليدين لا يطابق وصف القبضة أو انعكاسها.'
              );
            }
          } else {
            const holdingSide = activePhoneHand === 'left_hand' ? 'left' : 'right';
            const freeSide = activePhoneHand === 'left_hand' ? 'right' : 'left';
            const selectedHoldPattern = new RegExp(
              `\\b(?:anatomical\\s+)?${holdingSide}\\s+hand\\b`, 'i'
            );
            const reflectionHoldingPattern = new RegExp(
              `\\banatomical\\s+${holdingSide}\\s+arm\\s+as\\s+the\\s+phone[- ]holding\\s+side\\b`, 'i'
            );
            const reflectionFreePattern = new RegExp(
              `\\banatomical\\s+${freeSide}\\s+arm\\s+as\\s+the\\s+free\\s+side\\b`, 'i'
            );
            if (
              !selectedHoldPattern.test(anatomicalHold) ||
              !reflectionHoldingPattern.test(reflectedSide) ||
              !reflectionFreePattern.test(reflectedSide)
            ) {
              issues.push(
                'تعارض في انعكاس المرآة: اليد التشريحية الممسكة بالهاتف واليد الحرة غير متطابقتين مع الإعداد المختار.'
              );
            }
          }

          if (activePhoneHand === 'both_hands') {
            if (
              (typeof poseCompObj.free_hand_action === 'string' &&
                poseCompObj.free_hand_action !== 'none_relaxed') ||
              /\b(?:free\s+hand\s+(?:tucking|adjusting|holding|resting\s+lightly\s+at|smoothing|against)|coffee\s+mug|paperback\s+book)\b/i.test(
                `${strippedPoseText} ${mechanicsStrippedPose}`
              )
            ) {
              issues.push(
                'تعارض في إمساك الهاتف: لا يجوز إسناد حركة لليد الحرة بينما اليدان تمسكان الهاتف معًا.'
              );
            }
          }

          const activeFraming =
            config.mirrorPoseComposition?.framing || normalizedSelections.framing || 'three_quarter';
          if (
            (activeFraming === 'head_and_shoulders' || activeFraming === 'half_body') &&
            /\b(?:legs?|knees?|feet|foot|ankles?|soles?)\b/i.test(
              typeof poseCompObj.pose_description === 'string'
                ? strippedPoseText
                : ''
            )
          ) {
            issues.push(
              'تعارض في قص الكادر: تم وصف السيقان أو الركبتين أو القدمين رغم أن الكادر المختار علوي ولا يُظهرها.'
            );
          } else if (
            activeFraming === 'three_quarter' &&
            /\b(?:feet|foot|ankles?|soles?)\b/i.test(
              typeof poseCompObj.pose_description === 'string'
                ? strippedPoseText
                : ''
            )
          ) {
            issues.push(
              'تعارض في قص الكادر: تم وصف القدمين أو الكاحلين رغم أن كادر ثلاثة أرباع ينتهي عند منتصف الفخذين.'
            );
          }

          const activePreset = config.mirrorPoseComposition?.preset || 'pose_contrapposto_standing';
          if (
            MIRROR_LEANING_POSES.has(activePreset) &&
            poseCompObj.support_object === 'none'
          ) {
            issues.push(
              'تعارض في سطح الدعم: وضعية الاستناد تتطلب تحديد سطح دعم ظاهر (wall أو vanity).'
            );
          }
          if (
            (activePreset === 'pose_bed_edge_dynamic' ||
              activePreset === 'pose_chair_or_stool_sitting' ||
              activePreset === 'pose_floor_sitting_bed' ||
              activePreset === 'pose_seated_forearm_knee_rest') &&
            poseCompObj.support_object === 'none'
          ) {
            issues.push(
              'تعارض في سطح الدعم: وضعية الجلوس تتطلب تحديد مقعد ظاهر (bed_edge أو chair أو stool).'
            );
          }
        }

        // Validate structured upper-garment spec in Mirror Studio when explicitly configured
        if (normalizedSelections.upperGarment !== undefined || parsed.UPPER_GARMENT_SPEC) {
          const upperSpecObj =
            parsed.UPPER_GARMENT_SPEC &&
            typeof parsed.UPPER_GARMENT_SPEC === 'object'
              ? parsed.UPPER_GARMENT_SPEC
              : null;
          const combinedUpperText = `${parsed.PHYSICAL_MECHANICS} ${JSON.stringify(upperSpecObj || {})}`;
          if (config.clothingEdits.preserveUpperClothing) {
            const specContradicts =
              upperSpecObj && upperSpecObj.preserve_reference !== true;
            if (
              specContradicts ||
              !/\b(?:preserve|reference|unchanged|unaltered)\b/i.test(
                combinedUpperText
              )
            ) {
              issues.push(
                'كود JSON لاستوديو المرآة يغفل قاعدة الحفاظ على القطعة العلوية من الصورة المرجعية.'
              );
            }
          } else if (normalizedSelections.upperGarment !== undefined) {
            const ce = config.clothingEdits;
            const specMismatch =
              upperSpecObj &&
              (upperSpecObj.preserve_reference === true ||
                (typeof upperSpecObj.garment === 'string' &&
                  ce.upperGarment &&
                  upperSpecObj.garment !== ce.upperGarment) ||
                (typeof upperSpecObj.color === 'string' &&
                  ce.upperGarmentColor &&
                  upperSpecObj.color !== ce.upperGarmentColor) ||
                (typeof upperSpecObj.material === 'string' &&
                  ce.upperGarmentMaterial &&
                  upperSpecObj.material !== ce.upperGarmentMaterial) ||
                (typeof upperSpecObj.fit === 'string' &&
                  ce.upperGarmentFit &&
                  upperSpecObj.fit !== ce.upperGarmentFit) ||
                (typeof upperSpecObj.pattern === 'string' &&
                  ce.upperGarmentPattern &&
                  upperSpecObj.pattern !== ce.upperGarmentPattern));

            const upperColor = ce.upperGarmentColor
              ? resolveUpperGarmentColorPhrase(
                  ce.upperGarmentColor,
                  normalizedSelections.customUpperColorText
                )
              : '';
            const colorTokens = extractRequiredColorTokens(upperColor);
            const mechanicsLower = String(parsed.PHYSICAL_MECHANICS || '').toLowerCase();
            const hasColor =
              colorTokens.length === 0 ||
              colorTokens.some((t) => mechanicsLower.includes(t));
            const materialPhrase = ce.upperGarmentMaterial
              ? findPhrase(UPPER_GARMENT_MATERIAL_OPTIONS, ce.upperGarmentMaterial)
              : '';
            const hasMaterial =
              !materialPhrase ||
              mechanicsLower.includes(materialPhrase.toLowerCase());
            if (specMismatch || !hasColor || !hasMaterial) {
              issues.push(
                'كود JSON لاستوديو المرآة يغفل مواصفات القطعة العلوية أو لونها أو خامتها المختارة.'
              );
            }
          }
        }

        // Validate structured lower-garment spec in Mirror Studio when explicitly configured
        if (normalizedSelections.lowerGarment !== undefined || parsed.LOWER_GARMENT_SPEC) {
          const lowerSpecObj =
            parsed.LOWER_GARMENT_SPEC &&
            typeof parsed.LOWER_GARMENT_SPEC === 'object'
              ? parsed.LOWER_GARMENT_SPEC
              : null;
          const combinedLowerText = `${parsed.PHYSICAL_MECHANICS} ${JSON.stringify(lowerSpecObj || {})}`;
          if (config.clothingEdits.preserveLowerClothing) {
            const specContradicts =
              lowerSpecObj && lowerSpecObj.preserve_reference !== true;
            if (
              specContradicts ||
              !/\b(?:preserve|reference|unchanged|unaltered)\b/i.test(
                combinedLowerText
              )
            ) {
              issues.push(
                'كود JSON لاستوديو المرآة يغفل قاعدة الحفاظ على القطعة السفلية من الصورة المرجعية.'
              );
            }
          } else if (normalizedSelections.lowerGarment !== undefined) {
            const ce = config.clothingEdits;
            const specMismatch =
              lowerSpecObj &&
              (lowerSpecObj.preserve_reference === true ||
                (typeof lowerSpecObj.garment === 'string' &&
                  ce.lowerGarment &&
                  lowerSpecObj.garment !== ce.lowerGarment) ||
                (typeof lowerSpecObj.color === 'string' &&
                  ce.lowerGarmentColor &&
                  lowerSpecObj.color !== ce.lowerGarmentColor) ||
                (typeof lowerSpecObj.material === 'string' &&
                  ce.lowerGarmentMaterial &&
                  lowerSpecObj.material !== ce.lowerGarmentMaterial) ||
                (typeof lowerSpecObj.fit === 'string' &&
                  ce.lowerGarmentFit &&
                  lowerSpecObj.fit !== ce.lowerGarmentFit) ||
                (typeof lowerSpecObj.pattern === 'string' &&
                  ce.lowerGarmentPattern &&
                  lowerSpecObj.pattern !== ce.lowerGarmentPattern));

            const lowerColor = ce.lowerGarmentColor
              ? resolveLowerGarmentColorPhrase(
                  ce.lowerGarmentColor,
                  normalizedSelections.customLowerGarmentColorText
                )
              : '';
            const colorTokens = extractRequiredColorTokens(lowerColor);
            const mechanicsLower = String(parsed.PHYSICAL_MECHANICS || '').toLowerCase();
            const hasColor =
              colorTokens.length === 0 ||
              colorTokens.some((t) => mechanicsLower.includes(t));
            const materialPhrase = ce.lowerGarmentMaterial
              ? findPhrase(LOWER_GARMENT_MATERIAL_OPTIONS, ce.lowerGarmentMaterial)
              : '';
            const hasMaterial =
              !materialPhrase ||
              mechanicsLower.includes(materialPhrase.toLowerCase());
            if (specMismatch || !hasColor || !hasMaterial) {
              issues.push(
                'كود JSON لاستوديو المرآة يغفل مواصفات القطعة السفلية أو لونها أو خامتها المختارة.'
              );
            }
          }
        }
      }
    } catch {
      issues.push('مخرجات استوديو المرآة ليست بصيغة JSON صالحة.');
    }
    return { valid: issues.length === 0, wordCount, issues, warnings };
  }

  if (
    selections.workflowMode === 'strict_editing' &&
    selections.strictOutputFormat === 'full_12_rules'
  ) {
    if (!trimmed.includes('[01 — REFERENCE IDENTITY')) {
      issues.push(
        'يجب أن تتضمن صيغة القواعد الكاملة العناوين المرقمة من 01 إلى 12.'
      );
    }
    if (
      !/\b(?:face\s+shape|facial\s+proportions)\b/i.test(trimmed) ||
      !/\b(?:do\s+not\s+beautify|without\s+beautifying)\b/i.test(trimmed)
    ) {
      issues.push('يجب تضمين قاعدة الحفاظ على ملامح الوجه المرجعية دون تجميل.');
    }
    if (/[\u0600-\u06FF]/.test(trimmed)) {
      issues.push('يجب أن يكون البرومبت باللغة الإنجليزية فقط.');
    }
    const constraintIssues = validatePromptAgainstSceneConfig(
      trimmed,
      config,
      normalizedSelections
    );
    for (const ci of constraintIssues) {
      if (!issues.includes(ci)) issues.push(ci);
    }
    return { valid: issues.length === 0, wordCount, issues, warnings };
  }

  if (/\n/.test(trimmed)) {
    issues.push('يجب أن يكون البرومبت فقرة واحدة متصلة دون فواصل أسطر.');
  }
  if (/[\u0600-\u06FF]/.test(trimmed)) {
    issues.push('يجب أن يكون البرومبت باللغة الإنجليزية فقط.');
  }
  const maxWordCount =
    normalizedSelections.upperGarment !== undefined &&
    normalizedSelections.lowerGarment !== undefined
      ? 550
      : 460;
  if (wordCount < 35 || wordCount > maxWordCount) {
    issues.push(`عدد الكلمات (${wordCount}) خارج النطاق الموصى به.`);
  }
  if (!/reference\s+(?:image|photo|picture|appearance)/i.test(trimmed)) {
    issues.push('يجب الإشارة إلى الصورة المرجعية للحفاظ على الهوية.');
  }
  if (
    !/\b(?:face\s+shape|facial\s+proportions)\b/i.test(trimmed) ||
    !/\b(?:without\s+beautifying|do\s+not\s+beautify|never\s+beautify|avoid\s+beautifying)\b/i.test(
      trimmed
    )
  ) {
    issues.push('يجب تضمين قاعدة الحفاظ على ملامح الوجه المرجعية دون تجميل.');
  }
  if (
    !/(?:\bwithout\b[^.]{0,140}\bbeaut(?:y|ification)\s+filters?\b|\bno\s+(?:added\s+|digital\s+)?beaut(?:y|ification)\s+filters?\b|\bavoid(?:ing)?\s+(?:any\s+)?beaut(?:y|ification)\s+filters?\b|\bfree\s+(?:of|from)\s+(?:any\s+)?beaut(?:y|ification)\s+filters?\b|\bdo\s+not\s+(?:use|apply)\s+(?:any\s+)?beaut(?:y|ification)\s+filters?\b)/i.test(
      trimmed
    )
  ) {
    issues.push('يجب التأكيد على عدم استخدام فلاتر التجميل.');
  }

  // Validate required scene constraints (cameraMode, pose, lightingSource, clothingEdits)
  const constraintIssues = validatePromptAgainstSceneConfig(
    trimmed,
    config,
    normalizedSelections
  );
  for (const ci of constraintIssues) {
    if (!issues.includes(ci)) {
      issues.push(ci);
    }
  }

  return {
    valid: issues.length === 0,
    wordCount,
    issues,
    warnings,
  };
}

/**
 * Final Prompt Audit & Repair Gate:
 * Audits candidate or rendered prompts for buzzwords, unverified camera/flash metadata,
 * phantom mattress compression, unrequested motion blur, opposite phone-hand leaks,
 * and out-of-crop limb descriptions without fabricating missing required rules or
 * masking genuinely broken schemas/contradictions.
 */
export function validateAndAuditFinalPrompt(
  prompt: string,
  rawSelections: SelfieSelections,
  existingConfig?: StructuredSceneConfig,
  options?: { repairMetadataAndMotion?: boolean }
): {
  auditedPrompt: string;
  repairsApplied: string[];
  validation: ReturnType<typeof validatePromptOutput>;
} {
  const { selections } = enforceCompatibilityRules(rawSelections);
  const config =
    existingConfig ||
    resolveSceneConflicts(normalizeSelections(selections), rawSelections).config;
  const repairsApplied: string[] = [];
  const repairMetadataAndMotion = options?.repairMetadataAndMotion !== false;

  const cleanTextArtifacts = (text: string): string => {
    let cleaned = text;
    const buzzwordPattern =
      /\b(?:hyper[- ]?realistic|ultra[- ]?realistic|photorealistic|masterpiece|8k\s+uhd|8k|4k\s+uhd|ultra[- ]?detailed|100%\s+(?:identical|identity|match|accuracy|fidelity))\b/gi;
    if (buzzwordPattern.test(cleaned)) {
      cleaned = cleaned
        .replace(buzzwordPattern, '')
        .replace(/\s*,\s*,+/g, ',')
        .replace(/\s+\./g, '.')
        .replace(/\s+/g, ' ')
        .trim();
      repairsApplied.push('buzzwords_removed');
    }

    if (repairMetadataAndMotion) {
      const metadataPattern =
        /\b(?:Sony\s*LYT-?900|Sony\s*IMX\d+|Sony|LYT-?900|OV32B|IMX\d+|1-inch\s+(?:type\s+)?sensor|ISO\s*\d+|1\/\d+\s*s(?:ec)?|watt[- ]seconds?|w\.s\.)\b/gi;
      if (metadataPattern.test(cleaned)) {
        cleaned = cleaned
          .replace(metadataPattern, '')
          .replace(/\s*,\s*,+/g, ',')
          .replace(/\s+\./g, '.')
          .replace(/\s+/g, ' ')
          .trim();
        repairsApplied.push('unverified_metadata_removed');
      }

      if (!isBedContactPose(config, selections)) {
        const phantomBedPattern =
          /,?\s*\b(?:(?:subtle|visibly|heavily)\s+)?(?:compressed|indented|depressed|sunken)\s+(?:mattress|pillow)s?(?:\s+and\s+(?:mattress|pillow)s?)?\b/gi;
        if (phantomBedPattern.test(cleaned)) {
          cleaned = cleaned
            .replace(phantomBedPattern, '')
            .replace(/\s*,\s*,+/g, ',')
            .replace(/\s+\./g, '.')
            .replace(/\s+/g, ' ')
            .trim();
          repairsApplied.push('phantom_mattress_removed');
        }
      }

      const motionBlurRequested = Boolean(
        config.mirrorPoseComposition?.motionBlurEnabled ||
          config.captureArtifacts.includes('slight_hand_motion_blur')
      );
      if (!motionBlurRequested) {
        const motionBlurPattern =
          /,?\s*\b(?:subtle\s+|slight\s+|natural\s+){0,2}motion\s+blur(?:\s+(?:on|across|limited\s+to)\s+[^.;,]+)?/gi;
        if (motionBlurPattern.test(cleaned)) {
          cleaned = cleaned
            .replace(motionBlurPattern, '')
            .replace(/\s*,\s*,+/g, ',')
            .replace(/\s+\./g, '.')
            .replace(/\s+/g, ' ')
            .trim();
          repairsApplied.push('unrequested_motion_blur_removed');
        }
      }
    }

    // Repair accidental opposite phone-hand phrase when an explicit single hand is selected
    if (selections.phoneHand === 'left_hand') {
      const oppositeRightHold =
        /\bholding\s+(?:the\s+|a\s+)?(?:Xiaomi\s+15\s+Ultra\s+)?(?:smart)?phone\s+(?:in|with)\s+(?:the\s+|their\s+)?right\s+hand\b/gi;
      if (oppositeRightHold.test(cleaned)) {
        cleaned = cleaned.replace(
          oppositeRightHold,
          'holding the smartphone in the left hand'
        );
        repairsApplied.push('phone_hand_repaired_to_left');
      }
    } else if (selections.phoneHand === 'right_hand') {
      const oppositeLeftHold =
        /\bholding\s+(?:the\s+|a\s+)?(?:Xiaomi\s+15\s+Ultra\s+)?(?:smart)?phone\s+(?:in|with)\s+(?:the\s+|their\s+)?left\s+hand\b/gi;
      if (oppositeLeftHold.test(cleaned)) {
        cleaned = cleaned.replace(
          oppositeLeftHold,
          'holding the smartphone in the right hand'
        );
        repairsApplied.push('phone_hand_repaired_to_right');
      }
    }

    return cleaned;
  };

  let auditedPrompt = prompt.trim();

  if (selections.workflowMode === 'mirror_studio' && auditedPrompt) {
    try {
      const parsed = JSON.parse(auditedPrompt);
      if (
        parsed &&
        typeof parsed === 'object' &&
        parsed.SYSTEM_DIRECTIVE === 'EXECUTE_PHOTOGRAPHIC_CAPTURE'
      ) {
        const cleanField = (val: unknown): unknown =>
          typeof val === 'string' ? cleanTextArtifacts(val) : val;

        if (typeof parsed.GEMINI_EXECUTION_RULE === 'string') {
          parsed.GEMINI_EXECUTION_RULE = cleanField(parsed.GEMINI_EXECUTION_RULE);
        }
        if (typeof parsed.SCENE_LIGHTING === 'string') {
          parsed.SCENE_LIGHTING = cleanField(parsed.SCENE_LIGHTING);
        }
        if (typeof parsed.PHYSICAL_MECHANICS === 'string') {
          parsed.PHYSICAL_MECHANICS = cleanField(parsed.PHYSICAL_MECHANICS);
        }
        if (parsed.CAMERA_PIPELINE && typeof parsed.CAMERA_PIPELINE === 'object') {
          parsed.CAMERA_PIPELINE.Optics_Physics = cleanField(
            parsed.CAMERA_PIPELINE.Optics_Physics
          );
          parsed.CAMERA_PIPELINE.Sensor_Response = cleanField(
            parsed.CAMERA_PIPELINE.Sensor_Response
          );
        }
        if (parsed.POSE_COMPOSITION && typeof parsed.POSE_COMPOSITION === 'object') {
          if (typeof parsed.POSE_COMPOSITION.pose_description === 'string') {
            let poseDesc = String(
              cleanField(parsed.POSE_COMPOSITION.pose_description)
            );
            const activeFraming =
              config.mirrorPoseComposition?.framing || selections.framing;
            if (
              activeFraming === 'head_and_shoulders' ||
              activeFraming === 'half_body'
            ) {
              if (/\b(?:legs?|knees?|feet|foot|ankles?|soles?)\b/i.test(poseDesc)) {
                poseDesc = poseDesc
                  .replace(/\b(?:legs?|knees?|feet|foot|ankles?|soles?)\b/gi, 'upper torso')
                  .replace(/\s+/g, ' ')
                  .trim();
                repairsApplied.push('crop_limb_leak_repaired');
              }
            } else if (activeFraming === 'three_quarter') {
              if (/\b(?:feet|foot|ankles?|soles?)\b/i.test(poseDesc)) {
                poseDesc = poseDesc
                  .replace(/\b(?:feet|foot|ankles?|soles?)\b/gi, 'mid-thigh stance')
                  .replace(/\s+/g, ' ')
                  .trim();
                repairsApplied.push('crop_feet_leak_repaired');
              }
            }
            parsed.POSE_COMPOSITION.pose_description = poseDesc;
          }
          if (typeof parsed.POSE_COMPOSITION.anatomical_hand_mechanics === 'string') {
            parsed.POSE_COMPOSITION.anatomical_hand_mechanics = cleanField(
              parsed.POSE_COMPOSITION.anatomical_hand_mechanics
            );
          }
        }
        auditedPrompt = JSON.stringify(parsed, null, 4);
      }
    } catch {
      // Preserve invalid JSON verbatim so strict schema validation catches & falls back safely
    }
  } else if (auditedPrompt) {
    auditedPrompt = cleanTextArtifacts(auditedPrompt);
  }

  const validation = validatePromptOutput(auditedPrompt, selections);
  return {
    auditedPrompt,
    repairsApplied: Array.from(new Set(repairsApplied)),
    validation,
  };
}

/**
 * Validates a model-generated candidate prompt against the normalized scene configuration
 * and falls back to the deterministic prompt when any required constraint is omitted or contradicted,
 * while preserving all Arabic compatibility warnings and adjustments.
 */
export function resolveValidatedPromptOrFallback(
  candidatePrompt: string,
  rawSelections: SelfieSelections,
  styleVariant = 0
): {
  prompt: string;
  source: PromptGenerationSource;
  adjustments: string[];
  warnings: string[];
  conflicts: string[];
  validation: ReturnType<typeof validatePromptOutput>;
} {
  const { selections, adjustments, warnings, conflicts } =
    enforceCompatibilityRules(rawSelections);

  let extracted = '';
  const rawBlock = extractMarkdownCodeBlockContent(candidatePrompt);

  if (selections.workflowMode === 'mirror_studio') {
    const rawTrimmed = candidatePrompt.trim();
    const isSingleFenceOnly =
      /^```(?:json|text|markdown)?\s*\r?\n[\s\S]*?\r?\n```\s*$/i.test(rawTrimmed);
    const hasProseOutsideJson =
      rawTrimmed.startsWith('{')
        ? false
        : !isSingleFenceOnly;

    const unfenced = rawBlock
      .replace(/^```(?:json|text|markdown)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
    if (hasProseOutsideJson) {
      extracted = '';
    } else {
      try {
        const parsed = JSON.parse(unfenced);
        extracted = JSON.stringify(parsed, null, 4);
      } catch {
        extracted = unfenced;
      }
    }
  } else if (
    selections.workflowMode === 'strict_editing' &&
    selections.strictOutputFormat === 'full_12_rules'
  ) {
    extracted = rawBlock
      .replace(/^```(?:text|markdown)?\s*/i, '')
      .replace(/```$/i, '')
      .trim();
  } else {
    extracted = cleanGeneratedPromptText(rawBlock);
  }

  // Run conservative audit cleanup (strips buzzwords, fixes accidental opposite phone-hand/crop leaks)
  // while leaving missing rules, unverified metadata, and hallucinated physics strict for the repair/fallback gate.
  const auditResult = extracted
    ? validateAndAuditFinalPrompt(extracted, selections, undefined, {
        repairMetadataAndMotion: false,
      })
    : {
        auditedPrompt: '',
        repairsApplied: [],
        validation: validatePromptOutput('', selections),
      };

  const auditedExtracted = auditResult.auditedPrompt;
  const validation = auditResult.validation;

  if (auditedExtracted && validation.valid) {
    return {
      prompt: auditedExtracted,
      source: 'gemini',
      adjustments,
      warnings,
      conflicts,
      validation,
    };
  }

  const fallbackPrompt = buildDeterministicEnglishPrompt(
    selections,
    styleVariant
  );
  return {
    prompt: fallbackPrompt,
    source: 'deterministic',
    adjustments,
    warnings,
    conflicts,
    validation,
  };
}

export const ALLOWED_REFERENCE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
] as const;

export const MAX_REFERENCE_IMAGE_BYTES = 10 * 1024 * 1024; // 10 MB

export const DEFAULT_UNKNOWN_IMAGE_ANALYSIS: ReferenceImageAnalysis = {
  setting: 'unknown',
  backgroundElements: 'unknown',
  pose: 'unknown',
  framing: 'unknown',
  cameraPerspective: 'unknown',
  lightingDirectionAndQuality: 'unknown',
  colorPalette: 'unknown',
  visibleClothing: 'unknown',
};

export const REFERENCE_IMAGE_ANALYSIS_SYSTEM_INSTRUCTION = `Role: Privacy-Safe Smartphone Scene Fact Extractor
Task: Analyze ONLY visible, non-sensitive scene facts from the reference image and return a strict JSON object with these exact 8 keys:
- "setting": "indoor", "outdoor", or "unknown"
- "backgroundElements": concise English description of visible room/background objects, or "unknown"
- "pose": concise English description of the visible body posture/pose, or "unknown"
- "framing": concise English description of the shot framing (e.g., head and shoulders, half body, three-quarter, full body), or "unknown"
- "cameraPerspective": concise English description of camera perspective (e.g., front_selfie, rear_mirror, rear_stationary), or "unknown"
- "lightingDirectionAndQuality": concise English description of light direction, softness, and warmth, or "unknown"
- "colorPalette": concise English description of visible scene and clothing colors, or "unknown"
- "visibleClothing": concise English description of visible garments, or "unknown"

Strict Privacy & Accuracy Guardrails:
1. Return "unknown" for any detail that is uncertain, obscured, or not clearly observable.
2. Do NOT infer or mention identity, age, gender, ethnicity, race, nationality, religion, body measurements, height, weight, health, or any sensitive personal or biometric traits.
3. Do NOT invent a phone model, camera brand, lens focal length, aperture, ISO, or shutter speed.
4. Output ONLY valid JSON matching the 8 keys above.`;

/**
 * Validates optional reference image payload and explicit user opt-in before sending to Gemini.
 * Image is NEVER included unless optIn is explicitly true and MIME type + file size are valid.
 */
export function validateReferenceImageInput(input: {
  optIn?: boolean;
  base64Data?: string | null;
  mimeType?: string | null;
  sizeBytes?: number | null;
}): {
  includeImage: boolean;
  valid: boolean;
  mimeType?: string;
  base64Data?: string;
  sizeBytes?: number;
  errorAr?: string;
} {
  if (!input?.optIn) {
    return { includeImage: false, valid: true };
  }

  const rawBase64 = typeof input.base64Data === 'string' ? input.base64Data.trim() : '';
  const rawMime = typeof input.mimeType === 'string' ? input.mimeType.trim().toLowerCase() : '';

  if (!rawBase64 && !rawMime) {
    return { includeImage: false, valid: true };
  }

  if (
    !rawMime ||
    !(ALLOWED_REFERENCE_IMAGE_MIME_TYPES as readonly string[]).includes(rawMime)
  ) {
    return {
      includeImage: false,
      valid: false,
      errorAr:
        'نوع ملف الصورة المرجعية غير مدعوم. يرجى اختيار صورة بصيغة JPG أو PNG أو WebP.',
    };
  }

  const cleanedBase64 = (rawBase64.includes(',')
    ? rawBase64.split(',')[1] || ''
    : rawBase64
  ).replace(/\s+/g, '');

  // The reported file size is untrusted: always calculate decoded bytes from
  // the base64 payload itself before allowing upload to the image model.
  const declaredBytes =
    typeof input.sizeBytes === 'number' && input.sizeBytes > 0
      ? input.sizeBytes
      : 0;
  const maxEncodedLength = Math.ceil(MAX_REFERENCE_IMAGE_BYTES / 3) * 4;
  const tooLargeErrorAr =
    'حجم الصورة المرجعية يتجاوز الحد الأقصى المسموح به (10 ميجابايت). يرجى اختيار صورة أصغر.';

  // Fast-fail oversized payloads before running the base64 format check.
  if (cleanedBase64.length > maxEncodedLength || declaredBytes > MAX_REFERENCE_IMAGE_BYTES) {
    return {
      includeImage: false,
      valid: false,
      errorAr: tooLargeErrorAr,
    };
  }

  // Enforce valid base64 groups and end padding (not just allowed characters).
  if (
    !cleanedBase64 ||
    cleanedBase64.length % 4 !== 0 ||
    !/^[A-Za-z0-9+/]*={0,2}$/.test(cleanedBase64)
  ) {
    return {
      includeImage: false,
      valid: false,
      errorAr: 'بيانات الصورة المرجعية غير صالحة. يرجى إعادة اختيار الصورة.',
    };
  }

  const paddingBytes = cleanedBase64.endsWith('==')
    ? 2
    : cleanedBase64.endsWith('=')
      ? 1
      : 0;
  const decodedBytes = (cleanedBase64.length / 4) * 3 - paddingBytes;

  if (decodedBytes > MAX_REFERENCE_IMAGE_BYTES) {
    return {
      includeImage: false,
      valid: false,
      sizeBytes: decodedBytes,
      errorAr: tooLargeErrorAr,
    };
  }

  return {
    includeImage: true,
    valid: true,
    mimeType: rawMime === 'image/jpg' ? 'image/jpeg' : rawMime,
    base64Data: cleanedBase64,
    sizeBytes: decodedBytes,
  };
}

const FORBIDDEN_TRAIT_OR_SPEC_PATTERNS: RegExp[] = [
  /\b\d{1,2}\s*(?:years?\s+old|yo|yrs?\s+old)\b/gi,
  /\b(?:male|female|man|woman|boy|girl|gentleman|lady|masculine|feminine|gender|sex)\b/gi,
  /\b(?:middle[- ]eastern|arab|saudi|asian|caucasian|white\s+person|black\s+person|african|hispanic|latino|indian|pakistani|european|ethnicity|ethnic|race|racial|nationality)\b/gi,
  /\b(?:\d{2,3}\s*(?:cm|mm|kg|lbs)|height|weight|body\s+measurements?|bmi|body\s+fat|waist\s+size|chest\s+size)\b/gi,
  /\b(?:health|medical|disease|disorder|syndrome|disability|scar|acne\s+condition|patient|diagnosis)\b/gi,
  /\b(?:iphone\s*\d*(?:\s*pro)?(?:\s*max)?|xiaomi\s*\d*(?:\s*ultra)?|samsung\s*galaxy\s*\w*|google\s*pixel\s*\d*|huawei\s*\w*|oneplus\s*\w*|leica|hasselblad|sony\s*imx\w*|f\/\d+(?:\.\d+)?|iso\s*\d+|\d+\s*mm\s+lens|\d+\s*mp\b|megapixels?|1\/\d+\s*(?:sec|s)\b|shutter\s+speed)\b/gi,
];

const UNCERTAIN_VALUE_PATTERN =
  /^(?:unknown|uncertain|unobservable|not\s+visible|not\s+clear|cannot\s+determine|unclear|n\/a|none|null|undefined|unspecified|maybe|possibly|hard\s+to\s+tell)$/i;

function sanitizeSceneFactField(val: unknown): string {
  if (typeof val !== 'string') return 'unknown';
  let text = val.trim();
  if (!text || UNCERTAIN_VALUE_PATTERN.test(text)) return 'unknown';
  if (
    /\b(?:unknown|uncertain|unobservable|not\s+visible|cannot\s+determine|not\s+observable)\b/i.test(
      text
    )
  ) {
    return 'unknown';
  }

  for (const pattern of FORBIDDEN_TRAIT_OR_SPEC_PATTERNS) {
    text = text.replace(pattern, '');
  }

  text = text
    .replace(/\s+/g, ' ')
    .replace(/^[,.;:\-\s]+|[,.;:\-\s]+$/g, '')
    .trim();

  if (!text || text.length < 3 || UNCERTAIN_VALUE_PATTERN.test(text)) {
    return 'unknown';
  }
  return text;
}

/**
 * Sanitizes raw image analysis so ONLY the 8 allowed visible scene fields are retained,
 * uncertain or unobservable details become "unknown", and any sensitive personal traits
 * or invented device/camera specifications are stripped.
 */
export function sanitizeReferenceImageAnalysis(
  raw: unknown
): ReferenceImageAnalysis {
  if (!raw || typeof raw !== 'object') {
    return { ...DEFAULT_UNKNOWN_IMAGE_ANALYSIS };
  }

  const record = raw as Record<string, unknown>;
  const rawSetting =
    typeof record.setting === 'string' ? record.setting.trim().toLowerCase() : '';
  const setting: ReferenceImageAnalysis['setting'] =
    rawSetting === 'indoor'
      ? 'indoor'
      : rawSetting === 'outdoor'
        ? 'outdoor'
        : 'unknown';

  return {
    setting,
    backgroundElements: sanitizeSceneFactField(record.backgroundElements),
    pose: sanitizeSceneFactField(record.pose),
    framing: sanitizeSceneFactField(record.framing),
    cameraPerspective: sanitizeSceneFactField(record.cameraPerspective),
    lightingDirectionAndQuality: sanitizeSceneFactField(
      record.lightingDirectionAndQuality
    ),
    colorPalette: sanitizeSceneFactField(record.colorPalette),
    visibleClothing: sanitizeSceneFactField(record.visibleClothing),
  };
}

/**
 * Reconciles sanitized reference-image scene observations with the user's explicit selections.
 * Explicit user selections are treated as hard constraints that ALWAYS override conflicting
 * image-derived inferences, producing concise Arabic notices when conflicts occur.
 */
export function reconcileSceneWithImageAnalysis(
  config: StructuredSceneConfig,
  selections: SelfieSelections,
  rawAnalysis?: unknown
): {
  config: StructuredSceneConfig;
  sanitizedAnalysis: ReferenceImageAnalysis;
  effectiveObservations: Partial<ReferenceImageAnalysis>;
  overrideNoticesAr: string[];
  hasConflictsWithImage: boolean;
} {
  const sanitizedAnalysis = sanitizeReferenceImageAnalysis(rawAnalysis);
  const effectiveObservations: Partial<ReferenceImageAnalysis> = {};
  const overrideNoticesAr: string[] = [];

  // 1. Setting check (all app workflows target indoor bedroom/mirror scenes)
  if (sanitizedAnalysis.setting !== 'unknown') {
    if (sanitizedAnalysis.setting === 'outdoor') {
      overrideNoticesAr.push(
        'ملاحظة توافق الصورة المرجعية: تم الالتزام ببيئة الغرفة الداخلية المختارة وتجاهل المشهد الخارجي في الصورة المرجعية.'
      );
    } else {
      effectiveObservations.setting = sanitizedAnalysis.setting;
    }
  }

  // 2. Camera perspective check against config.cameraMode
  if (sanitizedAnalysis.cameraPerspective !== 'unknown') {
    const camText = sanitizedAnalysis.cameraPerspective.toLowerCase();
    const conflictsWithFront =
      config.cameraMode === 'front_selfie' &&
      /(?:^|[\s_-])(?:rear|mirror|reflection|back[\s_-]*camera|tripod|stationary)(?:$|[\s_-])/i.test(
        camText
      );
    const conflictsWithMirror =
      config.cameraMode === 'rear_mirror' &&
      /(?:^|[\s_-])(?:front[\s_-]*camera|front[\s_-]*selfie|arm['’]s\s+length|no\s+mirror|without\s+mirror|stationary|tripod)(?:$|[\s_-])/i.test(
        camText
      );
    const conflictsWithStationary =
      config.cameraMode === 'rear_stationary' &&
      /(?:^|[\s_-])(?:front[\s_-]*camera|front[\s_-]*selfie|mirror|handheld\s+selfie)(?:$|[\s_-])/i.test(
        camText
      );

    if (conflictsWithFront || conflictsWithMirror || conflictsWithStationary) {
      overrideNoticesAr.push(
        'ملاحظة توافق الصورة المرجعية: تم الالتزام بوضع الكاميرا المختار وتجاهل زاوية التصوير الظاهرة في الصورة المرجعية.'
      );
    } else {
      effectiveObservations.cameraPerspective =
        sanitizedAnalysis.cameraPerspective;
    }
  }

  // 3. Lighting direction & quality check against config.lightingSource
  if (sanitizedAnalysis.lightingDirectionAndQuality !== 'unknown') {
    const lightText = sanitizedAnalysis.lightingDirectionAndQuality.toLowerCase();
    const isDarkScreenOnly = config.lightingSource === 'screen_only';
    const isDirectFlash = config.lightingSource === 'direct_flash';
    const isDaytime = [
      'morning_window',
      'soft_daylight',
      'late_afternoon',
    ].includes(config.lightingSource);
    const isWarmIndoor = [
      'warm_bedside_lamp',
      'calm_ceiling_light',
    ].includes(config.lightingSource);

    const conflictsWithScreenOnly =
      isDarkScreenOnly &&
      /\b(?:daylight|sunlight|morning|afternoon|window|flash|bright\s+room|ceiling|overhead|lamp|studio)\b/i.test(
        lightText
      );
    const conflictsWithFlash =
      isDirectFlash &&
      /\b(?:daylight|sunlight|morning|afternoon|window|screen[- ]only|no\s+flash|natural\s+daylight|warm\s+lamp)\b/i.test(
        lightText
      );
    const conflictsWithDaytime =
      isDaytime &&
      /\b(?:dark\s+room|pitch\s+black|night|direct\s+flash|screen\s+glow)\b/i.test(
        lightText
      );
    const conflictsWithWarmIndoor =
      isWarmIndoor &&
      /\b(?:bright\s+sunlight|midday\s+sun|direct\s+flash|outdoor\s+sun)\b/i.test(
        lightText
      );

    if (
      conflictsWithScreenOnly ||
      conflictsWithFlash ||
      conflictsWithDaytime ||
      conflictsWithWarmIndoor
    ) {
      overrideNoticesAr.push(
        'ملاحظة توافق الصورة المرجعية: تم الالتزام بإعداد الإضاءة المختار وتجاهل الإضاءة المتعارضة الظاهرة في الصورة المرجعية.'
      );
    } else {
      effectiveObservations.lightingDirectionAndQuality =
        sanitizedAnalysis.lightingDirectionAndQuality;
    }
  }

  // 4. Pose check against selected pose
  if (sanitizedAnalysis.pose !== 'unknown') {
    const poseText = sanitizedAnalysis.pose.toLowerCase();
    const selectedPoseText = config.pose.toLowerCase();
    const userSelectedStanding =
      /\bstanding\b/i.test(selectedPoseText) ||
      selections.pose === 'rear_mirror_standing';
    const userSelectedLying =
      /\b(?:lying|semi-reclined)\b/i.test(selectedPoseText) ||
      [
        'pose_side_lying',
        'pose_supine_up',
        'pose_prone_stomach',
        'pose_headboard_lean',
        'rear_tripod_lying_reading',
      ].includes(selections.pose);
    const userSelectedSitting =
      /\bsitting\b/i.test(selectedPoseText) ||
      [
        'pose_edge_sitting',
        'pose_cross_legged',
        'rear_mirror_sitting',
        'rear_tripod_bed_sitting',
        'rear_propped_low_angle',
      ].includes(selections.pose);

    const imageShowsStanding = /\b(?:standing|upright|walking)\b/i.test(poseText);
    const imageShowsLying = /\b(?:lying|supine|prone|sleeping)\b/i.test(poseText);
    const imageShowsSitting = /\b(?:sitting|seated|cross-legged)\b/i.test(
      poseText
    );

    const poseConflicts =
      (userSelectedStanding && (imageShowsLying || imageShowsSitting)) ||
      (userSelectedLying && (imageShowsStanding || imageShowsSitting)) ||
      (userSelectedSitting && (imageShowsStanding || imageShowsLying));

    if (poseConflicts) {
      overrideNoticesAr.push(
        'ملاحظة توافق الصورة المرجعية: تم الالتزام بالوضعية المختارة في الإعدادات وتجاهل الوضعية الظاهرة في الصورة المرجعية.'
      );
    } else {
      effectiveObservations.pose = sanitizedAnalysis.pose;
    }
  }

  // 5. Framing check against selections.framing
  if (sanitizedAnalysis.framing !== 'unknown') {
    const framingText = sanitizedAnalysis.framing.toLowerCase();
    const conflictsFullBody =
      selections.framing === 'full_body_mirror' &&
      /\b(?:close[- ]up|head\s+and\s+shoulders|tight\s+portrait|face\s+only|chest\s+up)\b/i.test(
        framingText
      );
    const conflictsHeadShoulders =
      selections.framing === 'head_and_shoulders' &&
      /\b(?:full[- ]body|floor[- ]length|head\s+to\s+toe|wide\s+full\s+shot)\b/i.test(
        framingText
      );

    if (conflictsFullBody || conflictsHeadShoulders) {
      overrideNoticesAr.push(
        'ملاحظة توافق الصورة المرجعية: تم الالتزام بحدود الكادر المختارة وتجاهل الكادر الظاهر في الصورة المرجعية.'
      );
    } else {
      effectiveObservations.framing = sanitizedAnalysis.framing;
    }
  }

  // 6. Clothing check against config.clothingEdits
  if (sanitizedAnalysis.visibleClothing !== 'unknown') {
    const imgCloth = sanitizedAnalysis.visibleClothing.toLowerCase();
    if (config.clothingEdits.mode === 'preserve_reference') {
      effectiveObservations.visibleClothing = sanitizedAnalysis.visibleClothing;
    } else {
      const targetClothPhrase = [
        !config.clothingEdits.preserveUpperClothing
          ? config.clothingEdits.upperClothingPhrase
          : undefined,
        config.clothingEdits.lowerBodyColorPhrase,
        config.clothingEdits.lowerClothingPhrase,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const targetTokens = extractRequiredColorTokens(targetClothPhrase);
      const matchesSelected =
        targetTokens.length > 0 &&
        targetTokens.some((tok) => imgCloth.includes(tok));
      if (!matchesSelected) {
        overrideNoticesAr.push(
          'ملاحظة توافق الصورة المرجعية: تم الالتزام بتعديلات الملابس والألوان المختارة وتجاوز الملابس الظاهرة في الصورة المرجعية.'
        );
      } else {
        effectiveObservations.visibleClothing = sanitizedAnalysis.visibleClothing;
      }
    }
  }

  // 7. Background elements & color palette (keep if non-conflicting and known)
  if (
    sanitizedAnalysis.backgroundElements !== 'unknown' &&
    sanitizedAnalysis.setting !== 'outdoor'
  ) {
    effectiveObservations.backgroundElements =
      sanitizedAnalysis.backgroundElements;
  }
  if (sanitizedAnalysis.colorPalette !== 'unknown') {
    effectiveObservations.colorPalette = sanitizedAnalysis.colorPalette;
  }

  const nextConfig: StructuredSceneConfig = {
    ...config,
    referenceImageObservations:
      Object.keys(effectiveObservations).length > 0
        ? effectiveObservations
        : undefined,
  };

  return {
    config: nextConfig,
    sanitizedAnalysis,
    effectiveObservations,
    overrideNoticesAr,
    hasConflictsWithImage: overrideNoticesAr.length > 0,
  };
}

/**
 * Builds the client-to-server request body for `/api/generate-prompt`.
 * Ensures the reference image is ONLY included when the user explicitly opts in
 * (`referenceImageOptIn === true`) and the MIME type and size are valid.
 */
export function buildPromptGenerationRequestBody(
  selections: SelfieSelections,
  options?: {
    styleVariant?: number;
    useHighThinking?: boolean;
    fastMode?: boolean;
    referenceImageOptIn?: boolean;
    imageBase64?: string | null;
    imageMimeType?: string | null;
    imageSizeBytes?: number | null;
  }
): {
  body: Record<string, unknown>;
  imageIncluded: boolean;
  validationErrorAr?: string;
} {
  const optIn = Boolean(
    options?.referenceImageOptIn ?? selections.referenceImageAnalysisOptIn
  );
  const imgCheck = validateReferenceImageInput({
    optIn,
    base64Data: options?.imageBase64,
    mimeType: options?.imageMimeType,
    sizeBytes: options?.imageSizeBytes,
  });

  const payloadPreview = buildUserConceptPayload(
    selections.userConcept,
    selections
  );

  const body: Record<string, unknown> = {
    concept: selections.userConcept,
    sceneSettings: selections,
    payloadPreview,
    userConcept: selections.userConcept,
    selections,
    styleVariant: options?.styleVariant ?? 0,
    useHighThinking: Boolean(options?.useHighThinking),
    fastMode: Boolean(options?.fastMode),
    referenceImageOptIn: optIn,
  };

  if (imgCheck.includeImage && imgCheck.valid && imgCheck.base64Data && imgCheck.mimeType) {
    body.referenceImage = {
      base64Data: imgCheck.base64Data,
      mimeType: imgCheck.mimeType,
      sizeBytes: imgCheck.sizeBytes,
    };
  }

  return {
    body,
    imageIncluded: Boolean(imgCheck.includeImage && imgCheck.valid),
    validationErrorAr: imgCheck.valid ? undefined : imgCheck.errorAr,
  };
}

export interface GeminiGenerateContentParams {
  model: string;
  contents:
    | string
    | {
        parts: Array<
          | { inlineData: { mimeType: string; data: string } }
          | { text: string }
        >;
      };
  config?: Record<string, unknown>;
}

export type GeminiGenerateContentFn = (
  params: GeminiGenerateContentParams
) => Promise<{ text?: string; model?: string }>;

/**
 * Constructs the Gemini `generateContent` request parameters, combining optional
 * opted-in inline image data, user concept, normalized scene config, and reconciled image analysis.
 */
export function buildGeminiGenerateContentRequest(
  rawSelections: Partial<SelfieSelections>,
  options?: {
    concept?: string;
    styleVariant?: number;
    referenceImageOptIn?: boolean;
    referenceImage?: {
      base64Data?: string | null;
      mimeType?: string | null;
      sizeBytes?: number | null;
    } | null;
    imageAnalysis?: unknown;
    useHighThinking?: boolean;
    fastMode?: boolean;
  }
): {
  request: GeminiGenerateContentParams;
  selections: SelfieSelections;
  sceneConfig: StructuredSceneConfig;
  imageIncluded: boolean;
  imageValidation: ReturnType<typeof validateReferenceImageInput>;
  reconciledAnalysis?: ReferenceImageAnalysis;
  overrideNoticesAr: string[];
  adjustments: string[];
  warnings: string[];
  conflicts: string[];
} {
  const mergedInput: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...rawSelections,
  };
  if (typeof options?.concept === 'string') {
    mergedInput.userConcept = options.concept;
  }

  const { selections, adjustments, warnings, conflicts } =
    enforceCompatibilityRules(mergedInput);
  const normalized = normalizeSelections(selections);
  const resolvedScene = resolveSceneConflicts(normalized, mergedInput);
  let sceneConfig = resolvedScene.config;

  const optIn = Boolean(
    options?.referenceImageOptIn ?? selections.referenceImageAnalysisOptIn
  );
  const imageValidation = validateReferenceImageInput({
    optIn,
    base64Data: options?.referenceImage?.base64Data,
    mimeType: options?.referenceImage?.mimeType,
    sizeBytes: options?.referenceImage?.sizeBytes,
  });

  let reconciledAnalysis: ReferenceImageAnalysis | undefined;
  let overrideNoticesAr: string[] = [];

  if (options?.imageAnalysis) {
    const reconciled = reconcileSceneWithImageAnalysis(
      sceneConfig,
      selections,
      options.imageAnalysis
    );
    sceneConfig = reconciled.config;
    reconciledAnalysis = reconciled.sanitizedAnalysis;
    overrideNoticesAr = reconciled.overrideNoticesAr;
  }

  const allAdjustments = Array.from(
    new Set([...adjustments, ...overrideNoticesAr])
  );
  const allWarnings = Array.from(
    new Set([
      ...warnings,
      ...resolvedScene.warnings,
      ...overrideNoticesAr,
    ])
  );
  const allConflicts = Array.from(
    new Set([...conflicts, ...resolvedScene.conflicts])
  );

  const styleVariant = Number(options?.styleVariant ?? 0);
  const baselinePrompt = buildDeterministicEnglishPrompt(
    selections,
    styleVariant
  );

  const physicalCausalityInstruction = buildPhysicalCausalityInstruction(
    sceneConfig,
    selections,
    'full'
  );

  const workflowFormatInstruction =
    selections.workflowMode === 'mirror_studio'
      ? `WORKFLOW FORMAT: Mirror Studio JSON Schema (Xiaomi 15 Ultra Rear-Camera Mirror Selfie).
Output ONLY ONE valid JSON object with ZERO text or commentary outside the JSON, preserving the EXACT keys and structure of this baseline specification (including CAMERA_PIPELINE.Lens_Profile, POSE_COMPOSITION, UPPER_GARMENT_SPEC, and LOWER_GARMENT_SPEC).
Hard Requirements:
- Device MUST stay "${sceneConfig.subjectFacts.deviceModel || 'Xiaomi 15 Ultra'}" (NEVER shorten to "Xiaomi 15" without "Ultra").
- Rear lens MUST match ${sceneConfig.mirrorCameraSpec?.labelShort || 'Main 23mm'} (${sceneConfig.mirrorCameraSpec?.specSummary || '23mm-equivalent, f/1.63, OIS'}): framing "${sceneConfig.mirrorCameraSpec?.framingGuidance || ''}", mirror distance "${sceneConfig.mirrorCameraSpec?.distanceGuidance || ''}", perspective target "${sceneConfig.mirrorCameraSpec?.perspectiveAndDistortionTarget || ''}". Treat optical specs as visual goals—NOT exact optical simulation, NOT digital zoom for 70mm/100mm, and NEVER invent ISO, shutter speed, flash power/color, or sensor names/sizes (no Sony/LYT-900/OV32B).
- Keep the resolved mirror pose strictly coherent: framing="${sceneConfig.mirrorPoseComposition?.framing || 'three_quarter'}", phone_hand="${sceneConfig.mirrorPoseComposition?.phoneHand || 'right_hand'}", gaze_target="${sceneConfig.mirrorPoseComposition?.gaze || 'gaze_phone_screen'}", expression_energy="${sceneConfig.mirrorPoseComposition?.energy || 'relaxed'}", support_object="${sceneConfig.mirrorPoseComposition?.supportObject || 'none'}". Keep a single fully clothed adult pose description without duplicate pose sentences or leg/foot descriptions outside the visible framing crop.
- Preserve BOTH UPPER_GARMENT_SPEC and LOWER_GARMENT_SPEC independently without color or fabric bleed between upper and lower garments, and never invent logos or brand marks.
- Require a single physical Xiaomi 15 Ultra rear-camera mirror selfie using the rear LED flash (unless screen-only/night mode is active): keep the phrase "pointing the rear camera at the mirror" verbatim inside PHYSICAL_MECHANICS, keep one stance, one phone position, one phone-holding hand assignment, and at most one free-hand action${sceneConfig.mirrorPoseComposition?.motionBlurEnabled ? '' : ', with motion blur disabled'}, follow the conditional Physical Causality Rule inside PHYSICAL_MECHANICS, and forbid duplicate phones, front-camera capture, tripod capture, or extra unrequested studio lighting.
Baseline specification:
${baselinePrompt}`
      : selections.workflowMode === 'strict_editing' &&
          selections.strictOutputFormat === 'full_12_rules'
        ? `WORKFLOW FORMAT: Strict 12-Rule Specification.
Output ONLY the complete English 12-rule specification inside a single \`\`\`text code block, preserving every required constraint, independent upper/lower clothing separation, the Reference Face Preservation Rule, and the conditional Physical Causality Rule inside [07 & 08] from the baseline specification:
${baselinePrompt}`
        : `WORKFLOW FORMAT: Single-Paragraph Smartphone Prompt.
Output ONLY ONE concise English paragraph (70 to 310 words, no line breaks) inside a single \`\`\`text code block. Do NOT prepend "Generate an image of". Begin directly with the concise face-preservation sentence from the baseline paragraph (preserving visible face shape, proportions, forehead, cheekbones, jawline, chin, eyes, eyebrows, nose, lips, hairline, skin tone, and natural asymmetry without beautifying, slimming, symmetrizing, or altering facial anatomy, allowing only natural angle, lighting, occlusion, or selected expression without inventing hidden areas). Include the conditional Physical Causality Rule (${physicalCausalityInstruction}) after the subject/pose description and before camera-processing details. Ensure it explicitly preserves the selected camera mode (${sceneConfig.cameraMode === 'front_selfie' ? 'front-camera smartphone selfie with the phone outside the frame' : sceneConfig.cameraMode === 'rear_mirror' ? 'rear-camera smartphone mirror photo' : 'stationary rear-camera smartphone photo'}), pose (${sceneConfig.pose}), lighting (${buildLightingDescription(sceneConfig)}), focus target (${buildFocusDescription(sceneConfig.focusTarget, sceneConfig.cameraMode)}), exposure preference (${buildExposureDescription(sceneConfig.exposurePreference, sceneConfig.lightingSource, sceneConfig.phoneProcessingProfile)}), clothing edit (${JSON.stringify(sceneConfig.clothingEdits)}), ${sceneConfig.clothingEdits.mode === 'recolor_lower_only' ? 'explicitly preserve the lower-body garment cut and fabric and leave upper-body clothing unchanged, ' : ''}${!sceneConfig.clothingEdits.preserveUpperClothing && sceneConfig.clothingEdits.upperFabricPhysicsPhrase ? 'render the upper garment with realistic weave/knit texture, thickness, seams, collar, cuffs, gravity-driven folds across shoulders/elbows/chest/waist, lighting-responsive color shading, and avoid plastic cloth or invented logos, ' : ''}${!sceneConfig.clothingEdits.preserveLowerClothing && sceneConfig.clothingEdits.lowerFabricPhysicsPhrase ? 'render the lower garment with realistic weave/knit texture, seams, waistband, hem, gravity-driven folds, and zero color bleed onto upper clothing or invented logos, ' : ''}and state "without beauty filters".
Baseline reference paragraph:
${baselinePrompt}`;

  const imageAnalysisSection = imageValidation.includeImage
    ? `\nReference Image Analysis Rules:
- Infer only visible, relevant scene facts: indoor/outdoor setting, background elements, pose, framing, camera perspective, lighting direction and quality, color palette, and visible clothing.
- Treat uncertain or unobservable details as "unknown" and do NOT invent them.
- Do NOT infer identity, age, gender, ethnicity, body measurements, health, or other sensitive personal traits.
- Do NOT invent a phone model or camera specifications.
- Explicit user selections in Normalized Scene Config are HARD CONSTRAINTS that strictly override any conflicting observation from the reference image.`
    : '';

  const reconciledSection = sceneConfig.referenceImageObservations
    ? `\nReconciled Reference Image Observations (Non-Conflicting Known Facts Only): ${JSON.stringify(sceneConfig.referenceImageObservations)}`
    : '';

  const textPayload = [
    `User Concept: ${selections.userConcept || 'Natural indoor smartphone photo'}`,
    `Workflow Mode: ${selections.workflowMode}`,
    `Reference Face Preservation Rule (High Priority): ${REFERENCE_FACE_PRESERVATION_RULE}`,
    `Physical Causality Rule (Conditional on Scene Config): ${physicalCausalityInstruction}`,
    `Normalized Scene Config (Hard Constraints): ${JSON.stringify(sceneConfig)}`,
    `Selected Scene Keys: ${JSON.stringify({
      selfieType: selections.selfieType,
      pose: selections.pose,
      framing: selections.framing,
      lighting: selections.lighting,
      clothing: selections.clothing,
      clothingColor: selections.clothingColor,
      lowerBodyColor: selections.lowerBodyColor,
      upperGarment: selections.upperGarment,
      upperGarmentColor: selections.upperGarmentColor,
      upperGarmentMaterial: selections.upperGarmentMaterial,
      upperGarmentFit: selections.upperGarmentFit,
      upperGarmentPattern: selections.upperGarmentPattern,
      lowerGarment: selections.lowerGarment,
      lowerGarmentColor: selections.lowerGarmentColor,
      lowerGarmentMaterial: selections.lowerGarmentMaterial,
      lowerGarmentFit: selections.lowerGarmentFit,
      lowerGarmentPattern: selections.lowerGarmentPattern,
      strictLowerClothingMode: selections.strictLowerClothingMode,
      strictUpperClothingEditEnabled: Boolean(
        selections.strictUpperClothingEditEnabled
      ),
      focusTarget: selections.focusTarget,
      exposurePreference: selections.exposurePreference,
      deviceModel: sceneConfig.subjectFacts.deviceModel,
      ...(selections.workflowMode === 'mirror_studio'
        ? {
            mirrorLensProfile: sceneConfig.mirrorLensProfile,
            mirrorCameraSpec: sceneConfig.mirrorCameraSpec,
            mirrorPoseComposition: sceneConfig.mirrorPoseComposition,
          }
        : {}),
    })}`,
    imageAnalysisSection,
    reconciledSection,
    workflowFormatInstruction,
  ]
    .filter(Boolean)
    .join('\n');

  const modelName =
    options?.useHighThinking && !options?.fastMode
      ? 'gemini-4-hydrogen'
      : 'gemini-3.1-flash-lite';

  const contents: GeminiGenerateContentParams['contents'] =
    imageValidation.includeImage &&
    imageValidation.base64Data &&
    imageValidation.mimeType
      ? {
          parts: [
            {
              inlineData: {
                mimeType: imageValidation.mimeType,
                data: imageValidation.base64Data,
              },
            },
            {
              text: textPayload,
            },
          ],
        }
      : textPayload;

  const requestConfig: Record<string, unknown> = {
    systemInstruction: EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION,
  };
  if (selections.workflowMode === 'mirror_studio') {
    requestConfig.responseMimeType = 'application/json';
  }

  return {
    request: {
      model: modelName,
      contents,
      config: requestConfig,
    },
    selections,
    sceneConfig,
    imageIncluded: imageValidation.includeImage,
    imageValidation,
    reconciledAnalysis,
    overrideNoticesAr,
    adjustments: allAdjustments,
    warnings: allWarnings,
    conflicts: allConflicts,
  };
}

function tryParseReferenceImageAnalysisJson(
  rawText: string
): ReferenceImageAnalysis | null {
  if (!rawText) return null;
  const extracted = extractMarkdownCodeBlockContent(rawText)
    .replace(/^```(?:json|text|markdown)?\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  if (!extracted.startsWith('{')) return null;
  try {
    const parsed = JSON.parse(extracted);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      parsed.SYSTEM_DIRECTIVE === 'EXECUTE_PHOTOGRAPHIC_CAPTURE'
    ) {
      return null;
    }
    const analysisKeys = [
      'setting',
      'backgroundElements',
      'pose',
      'framing',
      'cameraPerspective',
      'lightingDirectionAndQuality',
      'colorPalette',
      'visibleClothing',
    ];
    const hasAnalysisKey = analysisKeys.some((k) => k in parsed);
    if (!hasAnalysisKey) return null;
    return sanitizeReferenceImageAnalysis(parsed);
  } catch {
    return null;
  }
}

export function classifyGeminiFallbackReason(
  err: unknown
): PromptFallbackReason {
  const errObj =
    err && typeof err === 'object' ? (err as Record<string, unknown>) : null;
  const status =
    typeof errObj?.status === 'number'
      ? errObj.status
      : typeof errObj?.code === 'number'
        ? errObj.code
        : undefined;
  const errMsg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'string'
        ? err
        : JSON.stringify(err || '');

  if (
    status === 401 ||
    status === 403 ||
    /401|403|unauthenticated|permission_denied|api\s*key|unauthorized|invalid_argument.*key/i.test(
      errMsg
    )
  ) {
    return 'auth_error';
  }
  if (
    status === 429 ||
    /429|quota|resource_exhausted|rate\s*limit|too\s*many\s*requests/i.test(
      errMsg
    )
  ) {
    return 'quota_error';
  }
  if (
    status === 408 ||
    status === 504 ||
    /timeout|abort|timed?\s*out|deadline_exceeded|etimedout/i.test(errMsg)
  ) {
    return 'timeout';
  }
  if (
    status === 502 ||
    status === 503 ||
    /econnrefused|enotfound|econnreset|network|fetch\s*failed|failed\s*to\s*fetch|load\s*failed|socket|connect|unreachable|dns|502|503|unavailable|overloaded/i.test(
      errMsg
    )
  ) {
    return 'connection_error';
  }
  return 'unknown';
}

export function isTransientGeminiError(err: unknown): boolean {
  const errObj =
    err && typeof err === 'object' ? (err as Record<string, unknown>) : null;
  const status =
    typeof errObj?.status === 'number'
      ? errObj.status
      : typeof errObj?.code === 'number'
        ? errObj.code
        : undefined;

  if (status === 401 || status === 403 || status === 400 || status === 404) {
    return false;
  }
  if (status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  const errMsg =
    err instanceof Error
      ? `${err.name} ${err.message}`
      : typeof err === 'string'
        ? err
        : JSON.stringify(err || '');

  return /429|500|502|503|504|unavailable|overloaded|econnreset|etimedout|timeout|timed?\s*out|econnrefused|fetch\s*failed|network|socket|deadline_exceeded|resource_exhausted/i.test(
    errMsg
  );
}

export async function callWithTransientRetry<T>(
  operation: () => Promise<T>,
  options?: {
    maxRetries?: number;
    baseDelayMs?: number;
    shouldRetry?: (err: unknown) => boolean;
  }
): Promise<T> {
  const maxRetries = Math.max(0, options?.maxRetries ?? 2);
  const baseDelayMs = Math.max(0, options?.baseDelayMs ?? 450);
  const shouldRetry = options?.shouldRetry ?? isTransientGeminiError;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (err: unknown) {
      lastError = err;
      if (attempt >= maxRetries || !shouldRetry(err)) {
        throw err;
      }
      const delayMs = baseDelayMs * Math.pow(2, attempt);
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }
  throw lastError;
}

export function getFallbackStatusAr(reason: PromptFallbackReason): string {
  switch (reason) {
    case 'missing_configuration':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) لأن إعدادات خدمة Gemini غير متوفرة على الخادم.';
    case 'timeout':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) بسبب انتهاء مهلة استجابة نموذج Gemini.';
    case 'connection_error':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) بسبب تعذر الاتصال بخدمة Gemini.';
    case 'quota_error':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) بسبب تجاوز حد الاستخدام المؤقت لخدمة Gemini.';
    case 'auth_error':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) بسبب رفض المصادقة أو الصلاحيات من خدمة Gemini.';
    case 'invalid_model_response':
      return 'تم استخدام التوليد القياسي المحلي (deterministic) لأن مخرجات النموذج لم تطابق قيود المشهد المطلوبة.';
    default:
      return 'تم استخدام التوليد القياسي المحلي (deterministic) بسبب خطأ غير متوقع أثناء استدعاء النموذج.';
  }
}

export interface ExecuteGeminiPromptResult {
  validGate: boolean;
  validImage: boolean;
  errorAr?: string;
  result: string;
  prompt: string;
  rawMarkdownResponse: string;
  source: PromptGenerationSource;
  model?: string;
  fallbackReason?: PromptFallbackReason;
  statusAr: string;
  adjustments: string[];
  warnings: string[];
  conflicts: string[];
  imageIncluded: boolean;
  imageAnalysis?: ReferenceImageAnalysis;
  imageOverrideNotices: string[];
  wordCount: number;
  validationIssueCount?: number;
  validationIssueCodes?: string[];
}

/**
 * Executes the complete server-side Gemini reference-image analysis and prompt-generation flow
 * with deterministic fallback and strict constraint validation.
 */
export async function executeGeminiPromptGeneration(options: {
  rawSelections: Partial<SelfieSelections>;
  concept?: string;
  styleVariant?: number;
  useHighThinking?: boolean;
  fastMode?: boolean;
  referenceImageOptIn?: boolean;
  referenceImage?: {
    base64Data?: string | null;
    mimeType?: string | null;
    sizeBytes?: number | null;
  } | null;
  imageAnalysis?: unknown;
  generateContent?: GeminiGenerateContentFn | null;
  timeoutMs?: number;
}): Promise<ExecuteGeminiPromptResult> {
  const mergedSelections: SelfieSelections = {
    ...DEFAULT_SELECTIONS,
    ...options.rawSelections,
  };
  if (typeof options.concept === 'string') {
    mergedSelections.userConcept = options.concept;
  }

  const styleVariant = Number(options.styleVariant ?? 0);
  const { selections, adjustments, warnings, conflicts } =
    enforceCompatibilityRules(mergedSelections);

  // 1. Validate Rule 04 lighting gate
  const strictGate = validateStrictLightingSelection(selections);
  if (!strictGate.valid) {
    return {
      validGate: false,
      validImage: true,
      errorAr: strictGate.messageAr,
      result: '',
      prompt: '',
      rawMarkdownResponse: '',
      source: 'deterministic',
      statusAr: strictGate.messageAr || 'يرجى اختيار وضع الإضاءة أولًا.',
      adjustments,
      warnings,
      conflicts,
      imageIncluded: false,
      imageOverrideNotices: [],
      wordCount: 0,
    };
  }

  // 2. Validate Reference Image Opt-In, MIME type, and file size
  const optIn = Boolean(
    options.referenceImageOptIn ?? selections.referenceImageAnalysisOptIn
  );
  const imageValidation = validateReferenceImageInput({
    optIn,
    base64Data: options.referenceImage?.base64Data,
    mimeType: options.referenceImage?.mimeType,
    sizeBytes: options.referenceImage?.sizeBytes,
  });

  const fallbackPrompt = buildDeterministicEnglishPrompt(
    selections,
    styleVariant
  );
  const fallbackMarkdown = wrapInMarkdownCodeBlock(fallbackPrompt);

  if (optIn && !imageValidation.valid) {
    return {
      validGate: true,
      validImage: false,
      errorAr: imageValidation.errorAr,
      result: fallbackMarkdown,
      prompt: fallbackPrompt,
      rawMarkdownResponse: fallbackMarkdown,
      source: 'deterministic',
      fallbackReason: 'unknown',
      statusAr:
        imageValidation.errorAr ||
        'بيانات الصورة المرجعية غير صالحة؛ تم استخدام التوليد القياسي المحلي.',
      adjustments,
      warnings,
      conflicts,
      imageIncluded: false,
      imageOverrideNotices: [],
      wordCount: fallbackPrompt.split(/\s+/).length,
    };
  }

  // Reconcile any pre-supplied image analysis even if falling back
  let currentAnalysis: ReferenceImageAnalysis | undefined = options.imageAnalysis
    ? sanitizeReferenceImageAnalysis(options.imageAnalysis)
    : undefined;

  const basePrepared = buildGeminiGenerateContentRequest(mergedSelections, {
    concept: mergedSelections.userConcept,
    styleVariant,
    referenceImageOptIn: optIn,
    referenceImage: options.referenceImage,
    imageAnalysis: currentAnalysis,
    useHighThinking: options.useHighThinking,
    fastMode: options.fastMode,
  });

  // 3. Check if Gemini client is available
  if (!options.generateContent) {
    return {
      validGate: true,
      validImage: true,
      result: fallbackMarkdown,
      prompt: fallbackPrompt,
      rawMarkdownResponse: fallbackMarkdown,
      source: 'deterministic',
      model: basePrepared.request.model,
      fallbackReason: 'missing_configuration',
      statusAr: getFallbackStatusAr('missing_configuration'),
      adjustments: basePrepared.adjustments,
      warnings: basePrepared.warnings,
      conflicts: basePrepared.conflicts,
      imageIncluded: false,
      imageAnalysis: currentAnalysis,
      imageOverrideNotices: basePrepared.overrideNoticesAr,
      wordCount: fallbackPrompt.split(/\s+/).length,
    };
  }

  const runWithOptionalTimeout = async (
    params: GeminiGenerateContentParams
  ): Promise<{ text?: string; model?: string }> => {
    const fn = options.generateContent!;
    if (!options.timeoutMs || options.timeoutMs <= 0) {
      return fn(params);
    }
    return new Promise<{ text?: string; model?: string }>((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error(`Request timeout after ${options.timeoutMs}ms`));
      }, options.timeoutMs);
      fn(params).then(
        (res) => {
          clearTimeout(timer);
          resolve(res);
        },
        (err) => {
          clearTimeout(timer);
          reject(err);
        }
      );
    });
  };

  const executionStartedAt = Date.now();
  try {
    let candidatePromptText = '';
    let actualModel = basePrepared.request.model;

    // 4. If an opted-in reference image is included and no imageAnalysis was pre-supplied,
    // first ask Gemini to infer only the 8 visible scene facts (with "unknown" for uncertain details).
    if (
      imageValidation.includeImage &&
      imageValidation.base64Data &&
      imageValidation.mimeType &&
      !currentAnalysis
    ) {
      const analysisRequest: GeminiGenerateContentParams = {
        model: 'gemini-3.1-flash-lite',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: imageValidation.mimeType,
                data: imageValidation.base64Data,
              },
            },
            {
              text: `Analyze ONLY visible scene facts from this reference image to assist smartphone photo prompt generation.
User Concept: ${selections.userConcept || 'Natural indoor smartphone photo'}
Normalized Scene Settings (Hard Constraints): ${JSON.stringify(basePrepared.sceneConfig)}
Selected Scene Keys: ${JSON.stringify({
                selfieType: selections.selfieType,
                pose: selections.pose,
                framing: selections.framing,
                lighting: selections.lighting,
                clothing: selections.clothing,
                clothingColor: selections.clothingColor,
                focusTarget: selections.focusTarget,
                exposurePreference: selections.exposurePreference,
              })}
Return a JSON object with keys: setting ("indoor" | "outdoor" | "unknown"), backgroundElements, pose, framing, cameraPerspective, lightingDirectionAndQuality, colorPalette, visibleClothing.
Use "unknown" for any uncertain or unobservable detail. Do NOT infer identity, age, gender, ethnicity, body measurements, health, or device/camera specifications.`,
            },
          ],
        },
        config: {
          systemInstruction: REFERENCE_IMAGE_ANALYSIS_SYSTEM_INSTRUCTION,
          responseMimeType: 'application/json',
        },
      };

      const analysisResponse = await runWithOptionalTimeout(analysisRequest);
      const analysisRawText = analysisResponse?.text ?? '';
      const parsedAnalysis = tryParseReferenceImageAnalysisJson(analysisRawText);

      if (parsedAnalysis) {
        currentAnalysis = parsedAnalysis;
      } else if (analysisRawText.trim()) {
        // If a single-call mock returned a prompt directly instead of an analysis JSON object,
        // retain it as a candidate prompt so single-call mocks also work seamlessly.
        candidatePromptText = analysisRawText;
      }
    }

    // Rebuild the generation request with reconciled image analysis (so explicit user selections override conflicts)
    const finalPrepared = buildGeminiGenerateContentRequest(mergedSelections, {
      concept: mergedSelections.userConcept,
      styleVariant,
      referenceImageOptIn: optIn,
      referenceImage: options.referenceImage,
      imageAnalysis: currentAnalysis,
      useHighThinking: options.useHighThinking,
      fastMode: options.fastMode,
    });

    actualModel = finalPrepared.request.model;

    if (!candidatePromptText) {
      const generationResponse = await runWithOptionalTimeout(
        finalPrepared.request
      );
      candidatePromptText = generationResponse?.text ?? '';
      if (generationResponse?.model) {
        actualModel = generationResponse.model;
      }
    }

    let resolved = resolveValidatedPromptOrFallback(
      candidatePromptText,
      selections,
      styleVariant
    );

    // If initial model output failed constraint validation and sufficient timeout budget remains,
    // perform one fast text-only repair call instructing Gemini to fix only the missed constraints.
    const elapsedMs = Date.now() - executionStartedAt;
    const hasRepairBudget =
      !options.timeoutMs || elapsedMs < Math.max(0, options.timeoutMs - 8000);
    if (
      resolved.source !== 'gemini' &&
      candidatePromptText.trim().length > 0 &&
      resolved.validation.issues.length > 0 &&
      hasRepairBudget
    ) {
      const baselineReference = buildDeterministicEnglishPrompt(
        selections,
        styleVariant
      );
      const repairRequest: GeminiGenerateContentParams = {
        model: 'gemini-3.1-flash-lite',
        contents: `Your previous candidate output failed scene constraint validation.
Validation failures to fix:
${resolved.validation.issues.map((issue, idx) => `${idx + 1}. ${issue}`).join('\n')}

Normalized Scene Config (Hard Constraints): ${JSON.stringify(finalPrepared.sceneConfig)}
Previous candidate output:
${candidatePromptText}

Baseline reference template (preserve required rules, format, camera mode, pose, lighting, focus, exposure, clothing edits, face-preservation rule, and "without beauty filters" while keeping valid non-conflicting scene details):
${baselineReference}

Output ONLY the repaired result in the exact required format (${selections.workflowMode === 'mirror_studio' ? 'a single valid JSON object' : 'one markdown ```text code block'}).`,
        config: {
          systemInstruction: finalPrepared.request.config?.systemInstruction,
          ...(selections.workflowMode === 'mirror_studio'
            ? { responseMimeType: 'application/json' }
            : {}),
        },
      };

      try {
        const repairedResponse = await runWithOptionalTimeout(repairRequest);
        const repairedText = repairedResponse?.text ?? '';
        if (repairedText.trim()) {
          const repairedResolved = resolveValidatedPromptOrFallback(
            repairedText,
            selections,
            styleVariant
          );
          if (repairedResolved.source === 'gemini') {
            candidatePromptText = repairedText;
            resolved = repairedResolved;
            actualModel = repairedResponse?.model || 'gemini-3.1-flash-lite';
          }
        }
      } catch {
        // Keep original validation fallback cleanly if repair call fails
      }
    }

    const combinedAdjustments = Array.from(
      new Set([...finalPrepared.adjustments, ...resolved.adjustments])
    );
    const combinedWarnings = Array.from(
      new Set([...finalPrepared.warnings, ...resolved.warnings])
    );
    const combinedConflicts = Array.from(
      new Set([...finalPrepared.conflicts, ...resolved.conflicts])
    );
    const wrappedResult = wrapInMarkdownCodeBlock(resolved.prompt);

    if (resolved.source === 'gemini') {
      const statusAr = finalPrepared.imageIncluded
        ? 'تم تحليل الصورة المرجعية وتوليد البرومبت بنجاح عبر Gemini.'
        : 'تم توليد البرومبت بنجاح عبر Gemini.';

      return {
        validGate: true,
        validImage: true,
        result: candidatePromptText.includes('```')
          ? candidatePromptText
          : wrappedResult,
        prompt: resolved.prompt,
        rawMarkdownResponse: wrappedResult,
        source: 'gemini',
        model: actualModel,
        statusAr,
        adjustments: combinedAdjustments,
        warnings: combinedWarnings,
        conflicts: combinedConflicts,
        imageIncluded: finalPrepared.imageIncluded,
        imageAnalysis: currentAnalysis,
        imageOverrideNotices: finalPrepared.overrideNoticesAr,
        wordCount: resolved.prompt.split(/\s+/).length,
      };
    }

    return {
      validGate: true,
      validImage: true,
      result: wrappedResult,
      prompt: resolved.prompt,
      rawMarkdownResponse: wrappedResult,
      source: 'deterministic',
      model: actualModel,
      fallbackReason: 'invalid_model_response',
      statusAr: getFallbackStatusAr('invalid_model_response'),
      adjustments: combinedAdjustments,
      warnings: combinedWarnings,
      conflicts: combinedConflicts,
      imageIncluded: finalPrepared.imageIncluded,
      imageAnalysis: currentAnalysis,
      imageOverrideNotices: finalPrepared.overrideNoticesAr,
      wordCount: resolved.prompt.split(/\s+/).length,
      validationIssueCount: resolved.validation.issues.length,
      validationIssueCodes: resolved.validation.issues,
    };
  } catch (err: unknown) {
    const fallbackReason = classifyGeminiFallbackReason(err);
    const statusAr = getFallbackStatusAr(fallbackReason);

    const reconciledOnError = buildGeminiGenerateContentRequest(
      mergedSelections,
      {
        concept: mergedSelections.userConcept,
        styleVariant,
        referenceImageOptIn: optIn,
        referenceImage: options.referenceImage,
        imageAnalysis: currentAnalysis,
        useHighThinking: options.useHighThinking,
        fastMode: options.fastMode,
      }
    );

    return {
      validGate: true,
      validImage: true,
      result: fallbackMarkdown,
      prompt: fallbackPrompt,
      rawMarkdownResponse: fallbackMarkdown,
      source: 'deterministic',
      model: reconciledOnError.request.model,
      fallbackReason,
      statusAr,
      adjustments: reconciledOnError.adjustments,
      warnings: reconciledOnError.warnings,
      conflicts: reconciledOnError.conflicts,
      imageIncluded: reconciledOnError.imageIncluded,
      imageAnalysis: currentAnalysis,
      imageOverrideNotices: reconciledOnError.overrideNoticesAr,
      wordCount: fallbackPrompt.split(/\s+/).length,
    };
  }
}

/**
 * Resolves the frontend UI state from `/api/generate-prompt` HTTP responses or client fetch errors.
 * Never assumes Gemini succeeded unless the server explicitly returned `source: 'gemini'`
 * AND the returned prompt passes client-side schema/constraint validation.
 */
export function resolveClientGenerationOutcome(input: {
  ok: boolean;
  status: number;
  data?: Record<string, unknown> | null;
  error?: unknown;
  targetSelections: SelfieSelections;
  styleVariant?: number;
  imageIncluded?: boolean;
}): {
  prompt: string;
  source: PromptGenerationSource;
  fallbackReason: PromptFallbackReason | null;
  statusAr: string;
  diagnostics: PromptGenerationDiagnostics | null;
  warnings: string[];
} {
  const variant = Number(input.styleVariant ?? 0);
  const fallbackPrompt = buildDeterministicEnglishPrompt(
    input.targetSelections,
    variant
  );

  if (input.error !== undefined) {
    const reason = classifyGeminiFallbackReason(input.error);
    return {
      prompt: fallbackPrompt,
      source: 'deterministic',
      fallbackReason: reason,
      statusAr: getFallbackStatusAr(reason),
      diagnostics: null,
      warnings: [],
    };
  }

  const data = input.data && typeof input.data === 'object' ? input.data : {};
  const serverDiagnostics =
    data.diagnostics && typeof data.diagnostics === 'object'
      ? (data.diagnostics as PromptGenerationDiagnostics)
      : null;

  if (!input.ok) {
    const serverReason =
      typeof data.fallbackReason === 'string'
        ? (data.fallbackReason as PromptFallbackReason)
        : input.status === 401 || input.status === 403
          ? 'auth_error'
          : input.status === 429
            ? 'quota_error'
            : input.status === 408 || input.status === 504
              ? 'timeout'
              : input.status >= 500
                ? 'connection_error'
                : 'unknown';
    const statusAr =
      typeof data.statusAr === 'string' && data.statusAr.trim()
        ? data.statusAr
        : typeof data.error === 'string' && data.error.trim()
          ? data.error
          : getFallbackStatusAr(serverReason);
    return {
      prompt: fallbackPrompt,
      source: 'deterministic',
      fallbackReason: serverReason,
      statusAr,
      diagnostics: serverDiagnostics,
      warnings: [],
    };
  }

  const rawBlockOrPrompt =
    typeof data.result === 'string'
      ? data.result
      : typeof data.rawMarkdownResponse === 'string'
        ? data.rawMarkdownResponse
        : typeof data.prompt === 'string'
          ? data.prompt
          : '';

  const resolved = resolveValidatedPromptOrFallback(
    rawBlockOrPrompt,
    input.targetSelections,
    variant
  );

  const serverClaimedGemini = data.source === 'gemini';
  const effectiveSource: PromptGenerationSource =
    serverClaimedGemini && resolved.source === 'gemini'
      ? 'gemini'
      : 'deterministic';

  const fallbackReason: PromptFallbackReason | null =
    effectiveSource === 'gemini'
      ? null
      : typeof data.fallbackReason === 'string'
        ? (data.fallbackReason as PromptFallbackReason)
        : serverClaimedGemini
          ? 'invalid_model_response'
          : 'unknown';

  const statusAr =
    effectiveSource === 'gemini'
      ? typeof data.statusAr === 'string' && data.statusAr.trim()
        ? data.statusAr
        : input.imageIncluded
          ? 'تم تحليل الصورة المرجعية وتوليد البرومبت بنجاح عبر Gemini.'
          : 'تم توليد البرومبت بنجاح عبر Gemini.'
      : typeof data.statusAr === 'string' && data.statusAr.trim() && !serverClaimedGemini
        ? data.statusAr
        : getFallbackStatusAr(fallbackReason || 'invalid_model_response');

  const warnings: string[] = [
    ...(Array.isArray(data.adjustments) ? (data.adjustments as string[]) : []),
    ...(Array.isArray(data.warnings) ? (data.warnings as string[]) : []),
    ...(Array.isArray(data.imageOverrideNotices)
      ? (data.imageOverrideNotices as string[])
      : []),
    ...resolved.adjustments,
  ];

  return {
    prompt: resolved.prompt || fallbackPrompt,
    source: effectiveSource,
    fallbackReason,
    statusAr,
    diagnostics: serverDiagnostics,
    warnings,
  };
}


