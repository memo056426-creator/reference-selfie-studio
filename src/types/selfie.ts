import type {
  BiomechanicsSolution,
  LockedFieldConflict,
} from '../utils/physicsEngine.ts';

export type WorkflowMode = 'strict_editing' | 'scene_builder' | 'mirror_studio';

export type StrictLightingMode =
  | 'mode_a_screen'
  | 'mode_b_flash_mirror'
  | 'unselected';

export type ScreenOrientationType =
  | 'facing_subject'
  | 'angled_partial'
  | 'facing_away';

export type FlashMirrorGeometryType =
  | 'natural_glare'
  | 'partial_face_occlusion'
  | 'angled_reflection';

export type LowerBodyColorType =
  | 'coordinated_auto'
  | 'charcoal_black'
  | 'deep_navy'
  | 'slate_gray'
  | 'subdued_beige'
  | 'deep_brown'
  | 'muted_olive'
  | 'custom_lower_color';

export type StrictOutputFormat = 'concise_prompt' | 'full_12_rules';

export type SelfieType = 'front_camera' | 'mirror';

export type FramingType =
  | 'head_and_shoulders'
  | 'half_body'
  | 'three_quarter'
  | 'full_body_mirror';

export type CameraAngleType =
  | 'eye_level'
  | 'slightly_above'
  | 'slightly_below'
  | 'slight_side_angle';

export type RearCameraPoseType =
  | 'rear_mirror_standing'
  | 'rear_mirror_sitting'
  | 'rear_tripod_bed_sitting'
  | 'rear_tripod_lying_reading'
  | 'rear_propped_low_angle'
  | 'rear_desk_profile';

export type PoseType =
  | 'pose_side_lying'
  | 'pose_supine_up'
  | 'pose_prone_stomach'
  | 'pose_headboard_lean'
  | 'pose_edge_sitting'
  | 'pose_cross_legged'
  | RearCameraPoseType;

export type MirrorGazeType =
  | 'gaze_phone_screen'
  | 'gaze_camera_lens'
  | 'gaze_side_off_camera';

export type MirrorPoseType =
  | 'pose_adjust_collar_sleeves'
  | 'pose_putting_on_jacket'
  | 'pose_adjust_accessories'
  | 'pose_bed_edge_dynamic'
  | 'pose_wall_lean_scurve'
  | 'pose_vanity_casual_lean'
  | 'pose_chair_or_stool_sitting'
  | 'pose_floor_rug_mirror'
  | 'pose_contrapposto_70'
  | 'pose_one_foot_forward_knee_bend'
  | 'pose_hand_in_hair_jawline'
  | 'pose_candid_framing_check'
  | 'pose_free_hand_motion_blur'
  | 'pose_prop_coffee_mug'
  | 'pose_prop_perfume_spray'
  | 'pose_prop_open_book'
  | 'pose_hand_on_mirror_glass'
  | 'pose_phone_chest_look_down'
  | 'pose_phone_cover_lower_face_eye_contact'
  | 'pose_contrapposto_standing'
  | 'pose_floor_sitting_bed'
  | 'pose_leaning_forward'
  | 'pose_standing_three_quarter_turn'
  | 'pose_seated_forearm_knee_rest'
  | 'pose_doorway_frame_lean'
  | 'pose_cuffed_sleeve_check';

export type MirrorPoseCategoryId =
  | 'standing'
  | 'sitting'
  | 'leaning'
  | 'candid';

export type LockableSelectionField =
  | 'framing'
  | 'mirrorPose'
  | 'mirrorStance'
  | 'mirrorTorsoOrientation'
  | 'phoneHand'
  | 'mirrorPhonePosition'
  | 'mirrorFreeHandAction'
  | 'mirrorSupportObject'
  | 'mirrorLensProfile'
  | 'mirrorGaze'
  | 'lighting'
  | 'phoneProcessingProfile'
  | 'upperGarment'
  | 'lowerGarment';

export type MirrorSupportObjectType =
  | 'none'
  | 'wall'
  | 'vanity'
  | 'bed_edge'
  | 'chair'
  | 'stool'
  | 'mirror_glass'
  | 'coffee_mug'
  | 'open_book'
  | 'perfume_bottle';

export type MirrorPoseEnergyType =
  | 'relaxed'
  | 'playful'
  | 'confident'
  | 'candid';

export type MirrorLensProfileType =
  | 'main_23mm'
  | 'telephoto_70mm'
  | 'ultra_telephoto_100mm'
  | 'ultrawide_14mm';

export type MirrorStanceType =
  | 'balanced_relaxed'
  | 'contrapposto_weight_shift'
  | 'staggered_feet'
  | 'one_foot_forward'
  | 'soft_knee_bend'
  | 'gentle_three_quarter_turn'
  | 'light_shoulder_wall_lean'
  | 'paused_natural_step';

export type MirrorTorsoOrientationType =
  | 'facing_mirror'
  | 'slight_angle_head_turned'
  | 'three_quarter_look_back';

export type MirrorPhonePositionType =
  | 'chest_level'
  | 'shoulder_level'
  | 'eye_level';

export type MirrorFreeHandActionType =
  | 'none_relaxed'
  | 'hand_at_hip_or_pocket'
  | 'adjust_sleeve_or_collar'
  | 'smooth_shirt'
  | 'tuck_hair_behind_ear'
  | 'lightly_touch_mirror'
  | 'hold_mug'
  | 'hold_book';

export type MirrorMovementMomentType =
  | 'still_composed'
  | 'turning_toward_mirror'
  | 'finishing_outfit_adjustment'
  | 'pausing_mid_step';

export type MirrorExpressionType =
  | 'neutral_exact_lock'
  | 'flash_squint_exact_lock'
  | 'flash_squint'
  | 'asymmetrical_smirk'
  | 'neutral_gravity_rest'
  | 'calm_screen_focus';

export type ExpressionType =
  | 'subtle_smile'
  | 'natural_expression'
  | 'spontaneous_laugh'
  | 'calm_expression'
  | MirrorExpressionType;

export type GazeDirectionType =
  | 'at_camera_lens'
  | 'at_phone_screen'
  | 'at_mirror_reflection'
  | MirrorGazeType;

export type MirrorClothingPhysicsType =
  | 'white_cotton_tshirt'
  | 'dark_oversized_hoodie'
  | 'ribbed_tank_top'
  | 'loose_silk_sleepwear';

export type MirrorBottomClothingType =
  | 'red_athletic_mesh_shorts'
  | 'black_running_shorts'
  | 'navy_sports_track_pants'
  | 'light_grey_sweatpants'
  | 'faded_blue_jeans'
  | 'dark_grey_sweatpants'
  | 'tailored_black_trousers';

export type ClothingType =
  | 'preserve_reference'
  | 'tshirt_and_pants'
  | 'modest_pajamas'
  | 'hoodie_and_pants'
  | 'simple_loungewear'
  | 'custom_clothing'
  | MirrorClothingPhysicsType;

export type ClothingColorType =
  | 'preserve_reference'
  | 'white'
  | 'black'
  | 'gray'
  | 'beige'
  | 'blue'
  | 'custom_color';

export type UpperGarmentType =
  | 'crew_neck_tshirt'
  | 'long_sleeve_tshirt'
  | 'henley'
  | 'polo_shirt'
  | 'button_up_shirt'
  | 'flannel_shirt'
  | 'sweatshirt'
  | 'hoodie'
  | 'cardigan'
  | 'knit_sweater'
  | 'pajama_top'
  | 'modest_lounge_top'
  | 'lightweight_overshirt'
  | 'preserve_reference'
  | 'custom_upper_garment';

export type UpperGarmentColorType =
  | 'preserve_reference'
  | 'white'
  | 'ivory'
  | 'cream'
  | 'black'
  | 'charcoal'
  | 'light_gray'
  | 'beige'
  | 'brown'
  | 'navy'
  | 'denim_blue'
  | 'sky_blue'
  | 'olive'
  | 'sage'
  | 'forest_green'
  | 'burgundy'
  | 'muted_rose'
  | 'custom_upper_color';

export type UpperGarmentMaterialType =
  | 'cotton_jersey'
  | 'ribbed_cotton'
  | 'french_terry'
  | 'fleece'
  | 'cotton_poplin'
  | 'flannel'
  | 'knit'
  | 'linen_cotton_blend'
  | 'waffle_knit'
  | 'chambray_denim';

export type UpperGarmentFitType =
  | 'regular'
  | 'relaxed'
  | 'oversized'
  | 'fitted';

export type UpperGarmentPatternType =
  | 'solid'
  | 'stripes'
  | 'plaid'
  | 'subtle_texture';

export type LowerGarmentType =
  | 'preserve_reference'
  | 'tailored_trousers'
  | 'relaxed_trousers'
  | 'chinos'
  | 'jeans'
  | 'sweatpants'
  | 'joggers'
  | 'lounge_pants'
  | 'pajama_pants'
  | 'track_pants'
  | 'athletic_shorts'
  | 'modest_shorts'
  | 'midi_long_skirt'
  | 'custom_lower_garment';

export type LowerGarmentColorType =
  | 'preserve_reference'
  | 'white'
  | 'ivory'
  | 'cream'
  | 'black'
  | 'charcoal'
  | 'light_gray'
  | 'beige'
  | 'brown'
  | 'navy'
  | 'denim_blue'
  | 'sky_blue'
  | 'olive'
  | 'sage'
  | 'forest_green'
  | 'burgundy'
  | 'red'
  | 'muted_rose'
  | 'custom_lower_color';

export type LowerGarmentMaterialType =
  | 'cotton_twill'
  | 'denim'
  | 'fleece'
  | 'french_terry'
  | 'cotton_jersey'
  | 'cotton_poplin'
  | 'linen_cotton_blend'
  | 'wool_blend_suiting'
  | 'athletic_mesh'
  | 'nylon_track_weave'
  | 'ribbed_knit';

export type LowerGarmentFitType =
  | 'regular'
  | 'relaxed'
  | 'straight'
  | 'tapered'
  | 'wide_leg'
  | 'loose_baggy';

export type LowerGarmentPatternType =
  | 'solid'
  | 'subtle_texture'
  | 'stripes'
  | 'plaid'
  | 'washed_fade'
  | 'side_stripe';

export type StrictLowerClothingMode =
  | 'preserve_reference'
  | 'recolor_only'
  | 'edit_garment';

export type MirrorHairPhysicsType =
  | 'natural_gravity_lock'
  | 'pillow_bedhead_messy'
  | 'damp_sebum_clumping'
  | 'pushed_back_casual';

export type HairType =
  | 'match_reference'
  | 'neatly_styled'
  | 'slightly_casual'
  | MirrorHairPhysicsType;

export type SkinTextureType =
  | 'raw_authentic'
  | 'balanced_natural'
  | 'cinematic_clean';

export type RoomStyleType =
  | 'modern_minimal'
  | 'warm_cozy'
  | 'hotel_luxury'
  | 'classic'
  | 'compact_realistic';

export type RoomTidinessType = 'tidy' | 'lived_in_natural';

export type RoomColorType =
  | 'white_and_beige'
  | 'warm_wood'
  | 'neutral_gray'
  | 'calm_tones'
  | 'custom_room_colors';

export type BackgroundType =
  | 'bed_and_nightstand'
  | 'window_and_curtains'
  | 'wardrobe'
  | 'full_length_mirror';

export type LightingType =
  | 'morning_window'
  | 'soft_daylight'
  | 'late_afternoon'
  | 'warm_bedside_lamp'
  | 'calm_ceiling_light'
  | 'mode_a_phone_screen_dark'
  | 'mode_b_phone_flash_mirror_dark';

export type PhoneVisibilityColorType =
  | 'hidden_front_camera'
  | 'black'
  | 'silver'
  | 'custom_phone_color';

export type PhoneHandType = 'right_hand' | 'left_hand' | 'both_hands';

export type PhotoVibeType =
  | 'candid_phone_shot'
  | 'realistic_daily_selfie'
  | 'neat_natural_shot';

export type ImageTreatmentType =
  | 'no_beauty_filter'
  | 'natural_colors'
  | 'soft_contrast'
  | 'subtle_grain';

export type AspectRatioType =
  | '1:1'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '9:16'
  | '16:9'
  | '21:9';

export interface SelfieSelections {
  userConcept: string;
  workflowMode: WorkflowMode;
  strictLightingMode: StrictLightingMode;
  screenOrientation: ScreenOrientationType;
  flashMirrorGeometry: FlashMirrorGeometryType;
  lowerBodyColor: LowerBodyColorType;
  customLowerBodyColorText: string;
  strictOutputFormat: StrictOutputFormat;
  selfieType: SelfieType;
  framing: FramingType;
  cameraAngle: CameraAngleType;
  pose: PoseType;
  expression: ExpressionType;
  gaze: GazeDirectionType;
  clothing: ClothingType;
  customClothingText: string;
  clothingColor: ClothingColorType;
  customClothingColorText: string;
  hair: HairType;
  skinTexture: SkinTextureType;
  roomStyle: RoomStyleType;
  roomTidiness: RoomTidinessType;
  roomColors: RoomColorType;
  customRoomColorsText: string;
  background: BackgroundType;
  lighting: LightingType;
  mixedLightingEnabled: boolean;
  secondaryLighting?: LightingType;
  phoneColor: PhoneVisibilityColorType;
  customPhoneColorText: string;
  phoneHand: PhoneHandType;
  keepFaceUnobstructed: boolean;
  photoVibe: PhotoVibeType;
  imageTreatments: ImageTreatmentType[];
  customDetails: string;
  aspectRatio: AspectRatioType;
  mirrorGaze: MirrorGazeType;
  mirrorPose: MirrorPoseType;
  mirrorExpression: MirrorExpressionType;
  mirrorHair: MirrorHairPhysicsType;
  mirrorClothing: MirrorClothingPhysicsType;
  mirrorBottomClothing: MirrorBottomClothingType;
  phoneProcessingProfile?: PhoneProcessingProfile;
  focusTarget?: FocusTarget;
  exposurePreference?: ExposurePreference;
  captureArtifacts?: CaptureArtifactType[];
  subjectTraits?: string;
  deviceModel?: string;
  locationText?: string;
  referenceImageAnalysisOptIn?: boolean;
  upperGarment?: UpperGarmentType;
  customUpperGarmentText?: string;
  upperGarmentColor?: UpperGarmentColorType;
  customUpperColorText?: string;
  upperGarmentMaterial?: UpperGarmentMaterialType;
  upperGarmentFit?: UpperGarmentFitType;
  upperGarmentPattern?: UpperGarmentPatternType;
  strictUpperClothingEditEnabled?: boolean;
  lowerGarment?: LowerGarmentType;
  customLowerGarmentText?: string;
  lowerGarmentColor?: LowerGarmentColorType;
  customLowerGarmentColorText?: string;
  lowerGarmentMaterial?: LowerGarmentMaterialType;
  lowerGarmentFit?: LowerGarmentFitType;
  lowerGarmentPattern?: LowerGarmentPatternType;
  strictLowerClothingMode?: StrictLowerClothingMode;
  mirrorLensProfile?: MirrorLensProfileType;
  mirrorStance?: MirrorStanceType;
  mirrorTorsoOrientation?: MirrorTorsoOrientationType;
  mirrorPhonePosition?: MirrorPhonePositionType;
  mirrorFreeHandAction?: MirrorFreeHandActionType;
  mirrorMovementMoment?: MirrorMovementMomentType;
  mirrorMotionBlurEnabled?: boolean;
  mirrorSupportObject?: MirrorSupportObjectType;
  mirrorPoseEnergy?: MirrorPoseEnergyType;
  lockedFields?: LockableSelectionField[];
}

export type PromptGenerationSource = 'gemini' | 'deterministic';

export type PromptFallbackReason =
  | 'missing_configuration'
  | 'timeout'
  | 'connection_error'
  | 'quota_error'
  | 'auth_error'
  | 'invalid_model_response'
  | 'unknown';

export interface PromptGenerationDiagnostics {
  requestId: string;
  route: string;
  model: string;
  durationMs: number;
  httpStatusClass: '2xx' | '4xx' | '5xx' | 'network_error';
  fallbackReason?: PromptFallbackReason;
  apiKeyPresent?: boolean;
  validationIssueCount?: number;
}

export interface ReferenceImageAnalysis {
  setting: 'indoor' | 'outdoor' | 'unknown';
  backgroundElements: string;
  pose: string;
  framing: string;
  cameraPerspective: string;
  lightingDirectionAndQuality: string;
  colorPalette: string;
  visibleClothing: string;
}

export interface ReferenceImagePayload {
  base64Data: string;
  mimeType: string;
  sizeBytes?: number;
}

export type CameraMode = 'front_selfie' | 'rear_mirror' | 'rear_stationary';

export type LightingSource =
  | 'screen_only'
  | 'direct_flash'
  | 'morning_window'
  | 'soft_daylight'
  | 'late_afternoon'
  | 'warm_bedside_lamp'
  | 'calm_ceiling_light'
  | 'unselected';

export type PhoneProcessingProfile =
  | 'natural_phone'
  | 'natural_hdr'
  | 'night_mode'
  | 'raw_low_light';

export type FocusTarget =
  | 'subject_face'
  | 'mirror_reflection'
  | 'upper_body';

export type ExposurePreference =
  | 'balanced'
  | 'low_key_shadow_preserving'
  | 'flash_highlight_controlled';

export type CaptureArtifactType =
  | 'subtle_shadow_noise'
  | 'flash_falloff'
  | 'natural_hdr_tonemapping'
  | 'slight_hand_motion_blur'
  | 'soft_background_separation';

export interface NormalizedGarmentEditSpec<
  G extends string,
  C extends string,
  M extends string,
  F extends string,
  P extends string,
> {
  editMode: 'preserve_reference' | 'recolor_only' | 'edit_garment';
  preserveReference: boolean;
  garment: G;
  customGarmentText?: string;
  color?: C;
  customColorText?: string;
  colorPhrase?: string;
  material?: M;
  fit?: F;
  pattern?: P;
  garmentPhrase: string;
  fabricPhysicsPhrase?: string;
}

export interface ClothingEditSpec {
  mode:
    | 'preserve_reference'
    | 'recolor_lower_only'
    | 'full_outfit'
    | 'mirror_outfit'
    | 'edit_both_independently'
    | 'edit_upper_only';
  upper: NormalizedGarmentEditSpec<
    UpperGarmentType,
    UpperGarmentColorType,
    UpperGarmentMaterialType,
    UpperGarmentFitType,
    UpperGarmentPatternType
  >;
  lower: NormalizedGarmentEditSpec<
    LowerGarmentType,
    LowerGarmentColorType,
    LowerGarmentMaterialType,
    LowerGarmentFitType,
    LowerGarmentPatternType
  >;
  upperClothingPhrase?: string;
  lowerClothingPhrase?: string;
  lowerBodyColorPhrase?: string;
  upperGarment?: UpperGarmentType;
  upperGarmentColor?: UpperGarmentColorType;
  upperGarmentMaterial?: UpperGarmentMaterialType;
  upperGarmentFit?: UpperGarmentFitType;
  upperGarmentPattern?: UpperGarmentPatternType;
  upperFabricPhysicsPhrase?: string;
  lowerGarment?: LowerGarmentType;
  lowerGarmentColor?: LowerGarmentColorType;
  lowerGarmentMaterial?: LowerGarmentMaterialType;
  lowerGarmentFit?: LowerGarmentFitType;
  lowerGarmentPattern?: LowerGarmentPatternType;
  lowerFabricPhysicsPhrase?: string;
  preserveCutAndFabric: boolean;
  preserveUpperClothing: boolean;
  preserveLowerClothing: boolean;
}

export interface MirrorLensSpec {
  id: MirrorLensProfileType;
  labelShort: string;
  equivalentFocalLengthMm: 14 | 23 | 70 | 100;
  aperture: 'f/2.2' | 'f/1.63' | 'f/1.8' | 'f/2.6';
  stabilizationOrFov: string;
  specSummary: string;
  framingGuidance: string;
  distanceGuidance: string;
  perspectiveAndDistortionTarget: string;
  isOpticalTelephoto: boolean;
}

export interface MirrorPoseCompositionSpec {
  preset?: MirrorPoseType;
  framing?: FramingType;
  stance: MirrorStanceType;
  torsoOrientation: MirrorTorsoOrientationType;
  phoneHand?: PhoneHandType;
  phonePosition: MirrorPhonePositionType;
  freeHandAction: MirrorFreeHandActionType;
  gaze?: MirrorGazeType;
  energy?: MirrorPoseEnergyType;
  supportObject?: MirrorSupportObjectType;
  movementMoment: MirrorMovementMomentType;
  motionBlurEnabled: boolean;
  poseDescription?: string;
}

export type MirrorPosePostureCategory =
  | 'standing'
  | 'leaning'
  | 'seated'
  | 'floor_seated';

export interface CanonicalMirrorPosePresetSpec {
  id: MirrorPoseType;
  category: MirrorPoseCategoryId;
  postureCategory: MirrorPosePostureCategory;
  minFraming: FramingType;
  allowedFramings: FramingType[];
  allowedStances: MirrorStanceType[];
  allowedPhoneHands: PhoneHandType[];
  allowedFreeHandActions: MirrorFreeHandActionType[];
  allowedSupportObjects: MirrorSupportObjectType[];
  requiredSupportCategory?: 'lean_surface' | 'seat' | 'mirror_surface' | 'prop';
  allowedGazes: MirrorGazeType[];
  allowedEnergies: MirrorPoseEnergyType[];
  defaults: {
    framing: FramingType;
    stance: MirrorStanceType;
    torsoOrientation: MirrorTorsoOrientationType;
    phoneHand: PhoneHandType;
    phonePosition: MirrorPhonePositionType;
    freeHandAction: MirrorFreeHandActionType;
    movementMoment: MirrorMovementMomentType;
    gaze: MirrorGazeType;
    energy: MirrorPoseEnergyType;
    supportObject: MirrorSupportObjectType;
  };
}

export interface StructuredSceneConfig {
  workflowMode: WorkflowMode;
  cameraMode: CameraMode;
  pose: string;
  expression: string;
  gaze: string;
  hair: string;
  framing: string;
  cameraAngle: string;
  lightingSource: LightingSource;
  secondaryLightingSource?: LightingSource;
  lightingModifier?: string;
  phoneProcessingProfile: PhoneProcessingProfile;
  focusTarget: FocusTarget;
  exposurePreference: ExposurePreference;
  clothingEdits: ClothingEditSpec;
  captureArtifacts: CaptureArtifactType[];
  roomDescription?: string;
  backgroundDescription?: string;
  phoneDescription?: string;
  vibeDescription?: string;
  treatmentDescriptions: string[];
  mirrorLensProfile?: MirrorLensProfileType;
  mirrorCameraSpec?: MirrorLensSpec;
  mirrorPoseComposition?: MirrorPoseCompositionSpec;
  subjectFacts: {
    userConcept?: string;
    customDetails?: string;
    subjectTraits?: string;
    deviceModel?: string;
    locationText?: string;
    aspectRatio?: AspectRatioType;
    skinTextureGoal: string;
  };
  referenceImageObservations?: Partial<ReferenceImageAnalysis>;
  lockedConflicts?: LockedFieldConflict[];
  biomechanics?: BiomechanicsSolution;
}

export type PromptConfig = SelfieSelections;

export interface OptionItem<T extends string> {
  value: T;
  labelAr: string;
  descAr?: string;
  groupAr?: string;
  categoryId?: MirrorPoseCategoryId;
  enPhrase: string;
}

export const REFERENCE_FACE_PRESERVATION_RULE =
  'High-priority visual-preservation goal: use the supplied reference image as the visual appearance reference and strictly preserve the person’s visible craniofacial anatomy, overall face shape and facial proportions, forehead, cheekbone contours, jawline, chin shape, eye shape and spacing, eyebrows, nose shape, lips, visible ears, skin pore texture, facial hair where present, hairline, natural skin tone, distinctive visible features, and natural facial asymmetry. Do not beautify, slim or widen the face, change facial geometry, enlarge eyes or lips, narrow the nose, change skin tone, artificially symmetrize the face, or change the hairline, and do not alter facial structure to fit a pose, lighting setup, clothing change, or beauty style. Allow only natural changes resulting from camera angle, perspective, physical lighting, user-selected expression (changing expression only, never facial anatomy), or partial phone/flash occlusion; do not invent or reconstruct facial areas that are hidden or unclear. For image editing, use the supplied photograph as the source, not a loose character inspiration; treat visible facial regions as protected from regeneration during clothing and scene edits. If the chosen viewpoint makes a pixel-identical face impossible, retain the reference-specific anatomy instead of synthesizing a generic face.';

export const CONCISE_REFERENCE_FACE_PRESERVATION_RULE =
  'Use the supplied reference image to edit the same person, not recreate a lookalike. Keep the face a protected non-target region for clothing or room edits: preserve face shape, proportions, forehead, eyes, nose, jawline, chin, lips, ears, hairline, skin tone, pores, and asymmetry without beautifying, slimming, or symmetrizing. Allow natural angle, lighting, occlusion, or selected expression changes only; never invent hidden anatomy.';

export const PHYSICAL_CAUSALITY_RULE =
  'Every visible physical effect must follow from the selected pose, support surfaces, camera geometry, and lighting. Keep one anatomically plausible, physically balanced pose. Show subtle deformation only at actual visible contact points—for example, a mattress or pillow beneath a resting subject, or fingers gripping a phone. Let hair, clothing, and bedding drape under gravity in a way consistent with body orientation and contact. Keep contact shadows, cast shadows, highlights, occlusion, and any mirror reflection consistent with the selected light source and camera position. Use motion blur only on the selected moving part. Do not invent unsupported body measurements, hidden details, extra props or limbs, or camera metadata.';

export const EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION = `Role: Smartphone Photography Prompt Engineer
Task: Convert a normalized scene configuration into a concise, natural English prompt describing a plausible smartphone photograph.

Reference Face Preservation Rule:
${REFERENCE_FACE_PRESERVATION_RULE}

Physical Causality Rule:
${PHYSICAL_CAUSALITY_RULE}

Core Priorities:
1. Preserve user-supplied facts and reference-image appearance goals: follow the Reference Face Preservation Rule above without claiming guaranteed 100% identity locks, and place a concise face-preservation sentence near the beginning of every generated English prompt.
2. Follow the selected camera mode (front-camera selfie, rear-camera mirror photo, or stationary rear-camera shot), pose, and single coherent lighting setup, enforcing physical causality conditionally (mention mattress/pillow compression only on bed poses, mirror geometry and visible phone-grip mechanics only on mirror-camera modes, cast shadows/highlights matching the single light source, and motion blur only when explicitly enabled on the selected moving hand).
3. Apply requested upper-body and lower-body clothing edits accurately and independently (each garment has its own preserve-reference, recolor-only, or structured type/color/material/fit/pattern rule). Apply color, material, fit, and pattern strictly to the garment they belong to with zero color or fabric bleed between upper and lower garments; describe weave, seams, drape, folds, tension, and compression consistent with the selected material and pose; never invent logos, brands, hidden garment details, or body measurements; and preserve any garment marked "preserve" exactly from the reference image.
4. Include optional camera-processing details (such as subtle low-light shadow noise, realistic flash falloff, or natural phone HDR) only when compatible with the selected scene profile.

Strict Guardrails:
- Do NOT invent a person's gender, ethnicity, age, height, weight, location, clothing, phone model, sensor specifications, ISO, or shutter speed unless explicitly supplied in the scene configuration.
- Do NOT invent unsupported body measurements, hidden details, or extra props or limbs.
- Do NOT invent logos, text, prints, or brands on clothing, and avoid plastic-looking smooth cloth, repetitive synthetic textures, floating fabric, or impossible folds.
- Do NOT combine mutually exclusive lighting or camera modes (never combine screen-only lighting with direct flash, never combine night mode with direct flash, and never describe a front-camera selfie as a rear-camera mirror photo).
- Do NOT claim "100% identity match", "undetectable AI", or guaranteed photographic realism; describe reference fidelity, natural fabric physics, and natural skin texture as prompt goals for an ordinary smartphone-photo appearance.

Output Rules:
- Output ONLY ONE complete English prompt in a single markdown code block.
- Do NOT prepend "Generate an image of".
- No conversational text, no explanations, no greetings.`;

export const INTERNAL_SYSTEM_INSTRUCTION = EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION;

export const STRICT_IMAGE_EDITING_SYSTEM_INSTRUCTION = `IMAGE-EDITING INSTRUCTIONS — STRUCTURED SCENE & LIGHTING RULES

[01 — REFERENCE IDENTITY GOAL]
${REFERENCE_FACE_PRESERVATION_RULE}

[02 — INDEPENDENT UPPER & LOWER CLOTHING CONTROLS]
Preserve the reference image garments by default unless an explicit edit is selected for the upper garment and/or the lower garment.
- Each garment (upper-body and lower-body) is controlled independently: preserve from reference, recolor only (preserving original garment type, cut, length, fit, fabric weave, seams, and folds), or apply an explicitly selected garment type, color, material, fit, and pattern.
- Apply color, material, fit, and pattern strictly to the garment they belong to without color or fabric bleed between upper and lower garments.
- Describe realistic fabric weave, seams, drape, folds, tension, and compression consistent with the selected material and pose, and never invent logos, brands, hidden details, or body measurements.

[03 — SUBJECT-FIRST COMPOSITION]
Keep the subject inside the room as the primary visual focus while keeping the room and furniture secondary and natural.
Avoid artificial studio rim-lighting or exaggerated background effects.

[04 — SINGLE LIGHTING MODE SELECTION GATE]
Use only ONE primary dark-room lighting mode for each image:
MODE A: PHONE SCREEN ONLY IN A DARK ROOM.
MODE B: CAMERA FLASH IN A MIRROR PHOTOGRAPH INSIDE A DARK ROOM.
Never combine screen-only lighting with direct camera flash.

[05 — MODE A: PHONE SCREEN ONLY, DARK ROOM]
Keep the room dark with the phone screen as the sole active light source.
Omit phone flash, ceiling lights, lamps, window light, or studio fill lights.
Allow illumination to fall off naturally with screen distance and orientation, keeping unlit areas in soft shadow with subtle low-light shadow noise.

[06 — MODE B: PHONE FLASH, DARK ROOM, MIRROR PHOTOGRAPH]
Describe a rear-camera mirror photograph in a dark room lit by the phone camera flash reflecting off the mirror.
Keep room lights and screen illumination off, and do not combine direct flash with night mode.
Maintain consistent positions for the subject, reflection, phone, hand grip, and mirror surface, with realistic flash falloff.

[07 & 08 — ANATOMICAL, PHYSICAL, AND MIRROR CONSISTENCY]
${PHYSICAL_CAUSALITY_RULE} Apply these physical effects conditionally based on the selected pose, visible support surfaces, camera geometry, and single active lighting mode, keeping all unedited regions true to the reference image.

[09–12 — NATURAL SMARTPHONE RENDERING & PRIORITY ORDER]
Aim for a natural handheld smartphone photograph with unretouched skin texture, realistic fabric folds, and balanced exposure. Follow this priority order:
1. Preserve user-supplied facts and reference appearance goals [01].
2. Follow the selected camera mode, pose, and single lighting setup [04–08].
3. Apply only the selected independent upper-body and/or lower-body garment rules while keeping any preserved garment unchanged [02].
4. Apply compatible camera-processing details only when appropriate [09–12].`;


export const STRICT_LIGHTING_MODE_OPTIONS: OptionItem<StrictLightingMode>[] = [
  {
    value: 'mode_a_screen',
    labelAr: 'الوضع A: إضاءة شاشة الهاتف فقط (غرفة مظلمة)',
    descAr: 'الغرفة مظلمة بالكامل؛ شاشة الهاتف هي المصدر الضوئي الوحيد دون فلاش أو إضاءة خارجية',
    enPhrase:
      'MODE A (PHONE SCREEN ONLY, DARK ROOM): Keep the room completely dark with the phone screen as the sole active light source, omitting any phone flash, ceiling lights, lamps, window light, or fill lights',
  },
  {
    value: 'mode_b_flash_mirror',
    labelAr: 'الوضع B: فلاش الهاتف أمام المرآة (غرفة مظلمة)',
    descAr: 'صورة ملتقطة أمام مرآة في غرفة مظلمة باستخدام فلاش الكاميرا فقط دون مساهمة ضوئية من الشاشة',
    enPhrase:
      'MODE B (PHONE FLASH, DARK ROOM, MIRROR PHOTOGRAPH): Capture the photograph in front of a mirror inside a dark room using only the phone camera flash while all other light sources and screen illumination remain off',
  },
  {
    value: 'unselected',
    labelAr: 'لم يتم تحديد وضع الإضاءة بعد',
    descAr: 'يتطلب النظام اختيار الوضع A أو الوضع B قبل تطبيق التعديلات (القاعدة 04)',
    enPhrase: '',
  },
];

export const SCREEN_ORIENTATION_OPTIONS: OptionItem<ScreenOrientationType>[] = [
  {
    value: 'facing_subject',
    labelAr: 'الشاشة مواجهة للشخص (إضاءة موضعية ناعمة)',
    descAr: 'تُضيء الوجه وأعلى الجسم بضوء خافت يتلاشى طبيعيًا مع المسافة',
    enPhrase:
      'with the phone screen facing toward the person, casting soft localized screen illumination that weakens naturally with distance while unlit areas remain in deep shadow',
  },
  {
    value: 'angled_partial',
    labelAr: 'الشاشة بزاوية مائلة (إضاءة جزئية وظلال عميقة)',
    descAr: 'تُضيء جانبًا واحدًا فقط بحسب زاوية الشاشة الفعلية',
    enPhrase:
      'with the phone screen held at an oblique angle, illuminating only the adjacent side of the person and leaving the rest in physically accurate darkness',
  },
  {
    value: 'facing_away',
    labelAr: 'الشاشة موجهة بعيدًا عن الوجه (دون إضاءة مباشرة للوجه)',
    descAr: 'القاعدة 05: لا يتم إضاءة الوجه اصطناعيًا عندما تتجه الشاشة بعيدًا عنه',
    enPhrase:
      'with the phone screen oriented away from the person so their face is not directly illuminated, allowing only subtle secondary surface reflections and deep natural shadows',
  },
];

export const FLASH_MIRROR_GEOMETRY_OPTIONS: OptionItem<FlashMirrorGeometryType>[] = [
  {
    value: 'natural_glare',
    labelAr: 'انعكاس فلاش فيزيائي طبيعي في المرآة',
    descAr: 'وهج الفلاش والظلال تتبع زاوية الكاميرا والمرآة بدقة',
    enPhrase:
      'where flash reflection, highlight clipping, and cast shadows strictly follow the camera-flash-mirror geometry',
  },
  {
    value: 'partial_face_occlusion',
    labelAr: 'تغطية جزئية للوجه بالهاتف أو وهج الفلاش',
    descAr: 'القاعدة 06: السماح لوهج الفلاش أو موقع الهاتف بحجب جزء من التفاصيل بشكل واقعي',
    enPhrase:
      'allowing realistic flash glare and the physical position of the phone to partially obscure facial details without artificially forcing full facial visibility',
  },
  {
    value: 'angled_reflection',
    labelAr: 'زاوية فلاش جانبية في المرآة (تجنب الوهج المباشر على العدسة)',
    descAr: 'مسار ضوئي متناسق بين الفلاش والانعكاس دون انفجار ضوئي مفتعل',
    enPhrase:
      'angled so the flash illuminates the subject and mirror reflection with physically plausible falloff without forcing an unnatural flash burst',
  },
];

export const LOWER_BODY_COLOR_OPTIONS: OptionItem<LowerBodyColorType>[] = [
  {
    value: 'coordinated_auto',
    labelAr: 'تنسيق لوني هادئ ومناسب تلقائيًا',
    descAr: 'القاعدة 02: اختيار لون متناسق وهادئ يناسب الزي الحالي',
    enPhrase: 'a restrained, naturally coordinated tone appropriate to the existing outfit',
  },
  {
    value: 'charcoal_black',
    labelAr: 'أسود فحمي طبيعي',
    enPhrase: 'natural matte charcoal black',
  },
  {
    value: 'deep_navy',
    labelAr: 'كحلي داكن هادئ',
    enPhrase: 'subdued deep navy blue',
  },
  {
    value: 'slate_gray',
    labelAr: 'رمادي صخري محايد',
    enPhrase: 'neutral dark slate gray',
  },
  {
    value: 'subdued_beige',
    labelAr: 'بيج ترابي خافت',
    enPhrase: 'muted earthy taupe-beige',
  },
  {
    value: 'deep_brown',
    labelAr: 'بني داكن',
    enPhrase: 'deep espresso brown',
  },
  {
    value: 'muted_olive',
    labelAr: 'زيتوني داكن خافت',
    enPhrase: 'subdued dark olive green',
  },
  {
    value: 'custom_lower_color',
    labelAr: 'لون مخصص للملابس السفلية',
    enPhrase: 'custom coordinated tone',
  },
];

export const SELFIE_TYPE_OPTIONS: OptionItem<SelfieType>[] = [
  {
    value: 'mirror',
    labelAr: 'سيلفي أمام المرآة',
    descAr: 'يظهر انعكاس الشخص والهاتف داخل مرآة غرفة النوم',
    enPhrase: 'mirror selfie',
  },
  {
    value: 'front_camera',
    labelAr: 'سيلفي بالكاميرا الأمامية',
    descAr: 'التقاط مباشر من زاوية ذراع ممتدة دون ظهور الهاتف أو المرآة',
    enPhrase: 'front-camera handheld selfie',
  },
];

export const FRAMING_OPTIONS: OptionItem<FramingType>[] = [
  {
    value: 'head_and_shoulders',
    labelAr: 'الوجه والكتفان',
    descAr: 'تركيز قريب وواضح على الملامح وأعلى الكتفين',
    enPhrase: 'from the chest and shoulders upward',
  },
  {
    value: 'half_body',
    labelAr: 'نصف الجسم',
    descAr: 'من الخصر إلى أعلى الرأس مع إظهار جزء من الغرفة',
    enPhrase: 'from the waist upward',
  },
  {
    value: 'three_quarter',
    labelAr: 'ثلاثة أرباع الجسم',
    descAr: 'من منتصف الفخذين إلى الأعلى لإبراز الوقفة والغرفة',
    enPhrase: 'from the thighs upward',
  },
  {
    value: 'full_body_mirror',
    labelAr: 'كامل الجسم أمام المرآة',
    descAr: 'يتطلب سيلفي مرآة طويلة ومساحة كافية في الغرفة',
    enPhrase: 'in a full-body composition captured through a tall floor-length mirror',
  },
];

export const CAMERA_ANGLE_OPTIONS: OptionItem<CameraAngleType>[] = [
  {
    value: 'eye_level',
    labelAr: 'مستوى العين',
    enPhrase: 'at natural eye level',
  },
  {
    value: 'slightly_above',
    labelAr: 'أعلى قليلًا',
    enPhrase: 'from a slightly elevated handheld angle',
  },
  {
    value: 'slightly_below',
    labelAr: 'أسفل قليلًا',
    enPhrase: 'from a subtly lower angle looking slightly upward',
  },
  {
    value: 'slight_side_angle',
    labelAr: 'زاوية جانبية خفيفة',
    enPhrase: 'from a gentle three-quarter side angle',
  },
];

export const FRONT_POSE_OPTIONS: OptionItem<PoseType>[] = [
  {
    value: 'pose_side_lying',
    labelAr: 'استلقاء جانبي (على الوسادة)',
    descAr:
      'مستلقٍ على جانبه فوق المرتبة؛ تستجيب أنسجة الوجه الرخوة للجاذبية بالسحب الطبيعي نحو الأسفل، ذراع واحدة ممتدة لإمساك الهاتف، والرأس يستقر بثقله على وسادة منضغطة بوضوح، مع انسدال الشعر بفعل الجاذبية.',
    enPhrase:
      'lying on the side on a mattress. Facial tissue responding naturally to gravity pulling downward. One arm extending to hold the smartphone, head resting heavily on a highly compressed pillow. Hair pulled by gravity',
  },
  {
    value: 'pose_supine_up',
    labelAr: 'استلقاء على الظهر (الهاتف للأعلى)',
    descAr:
      'مستلقٍ على ظهره، كلتا الذراعين مرفوعتان لإمساك الهاتف مباشرة فوق الوجه، مع انثناء جلدي طبيعي طفيف أسفل الذقن والرقبة بسبب الجاذبية وزاوية التصوير العلوية، وانضغاط طبيعي للصدر.',
    enPhrase:
      'lying flat on the back. Both arms raised holding the smartphone directly above the face. Slight natural skin folding at the front of the neck (submental area) due to gravity and downward viewing angle. Chest naturally compressed',
  },
  {
    value: 'pose_prone_stomach',
    labelAr: 'استلقاء على البطن (الاستناد على المرفقين)',
    descAr:
      'مستلقٍ على البطن ومرتكز على المرفقين، وزن الجزء العلوي من الجسم يغوص فيزيائياً في المرتبة، الذقن مائل قليلاً للأعلى للنظر إلى الهاتف بمستوى العين، والأكتاف مرفوعة بشكل طبيعي لدعم وزن الجسم.',
    enPhrase:
      'lying on the stomach, propped up on elbows. Upper body weight physically sinking into the mattress. Chin tilted slightly upward looking at the phone held at eye level. Shoulders hunched naturally reacting to supporting the body weight',
  },
  {
    value: 'pose_headboard_lean',
    labelAr: 'استناد بالظهر على اللوح الأمامي للسرير',
    descAr:
      'شبه مستلقٍ ومستند بثقله على لوح رأس السرير (Headboard) مع انضغاط الوسائد خلف الظهر بوضوح، الهاتف ممسوك عند مستوى الصدر بذراعين مسترخيتين، وتوزيع وزن الجسم قطرياً يسبب شدّاً واقعياً في ملاءة السرير.',
    enPhrase:
      "semi-reclined, leaning back heavily against the bed's headboard with pillows visibly compressed behind the back. Phone held at chest level with relaxed arms. Body weight distributed diagonally causing fabric tension on the bedsheets",
  },
  {
    value: 'pose_edge_sitting',
    labelAr: 'جلوس مسترخي على حافة السرير',
    descAr:
      'جالس باسترخاء على حافة السرير، الرقبة منحنية قليلاً للأسفل للنظر إلى الشاشة، الهاتف ممسوك بيد واحدة تحت مستوى العين، مع انحناء طبيعي للعمود الفقري وهبوط واضح لحافة المرتبة تحت وزن الجسم.',
    enPhrase:
      "sitting slouched on the edge of the bed. Neck slightly bent downward looking at the screen. Phone held with one hand below eye level. Realistic spine curvature and shoulder relaxation. Mattress indented at the edge under the person's weight",
  },
  {
    value: 'pose_cross_legged',
    labelAr: 'جلوس متربع في منتصف السرير',
    descAr:
      'جالس متربعاً في منتصف السرير، المرتبة منخفضة بوضوح تحت الوزن المركز للجسم، يمسك الهاتف فوق مستوى العين قليلاً مع طيات قماش شعاعية حقيقية تمتد حول الجسم الجالس.',
    enPhrase:
      'sitting cross-legged in the center of the bed. Mattress distinctly depressed under the concentrated body weight. Holding the smartphone slightly above eye level, head tilted slightly upward, authentic fabric folds stretching radially from the seated body',
  },
];

export const REAR_CAMERA_POSE_OPTIONS: OptionItem<RearCameraPoseType>[] = [
  {
    value: 'rear_mirror_standing',
    labelAr: 'تصوير في المرآة (وقوف اعتيادي)',
    descAr:
      'يقف أمام مرآة خزانة غرفة النوم ممسكاً بالهاتف، الوزن مرتكز بشكل طبيعي على ساق واحدة (Contrapposto)، وطيات قماش طبيعية تستجيب للجاذبية.',
    enPhrase:
      'standing upright with weight shifted naturally to one leg in a relaxed contrapposto posture and natural fabric folds on the clothing',
  },
  {
    value: 'rear_mirror_sitting',
    labelAr: 'تصوير في المرآة (جلوس على الأرض)',
    descAr:
      'جالس على أرضية الغرفة يميل للخلف قليلاً مع مد الساقين أو تقاطعهما واسترخاء الأكتاف.',
    enPhrase:
      'sitting on the bedroom floor leaning slightly back with legs crossed and relaxed shoulders',
  },
  {
    value: 'rear_tripod_bed_sitting',
    labelAr: 'هاتف مثبت بعيداً (جلوس على السرير)',
    descAr:
      'لقطة من هاتف ثابت موضوع في الغرفة، الشخص جالس بشكل طبيعي على السرير مع انضغاط المرتبة تحت وزنه.',
    enPhrase:
      'sitting naturally on the bed with the mattress gently indented under their weight',
  },
  {
    value: 'rear_tripod_lying_reading',
    labelAr: 'هاتف مثبت بعيداً (استلقاء جانبي مريح)',
    descAr:
      'لقطة من وضع ثابت على طاولة السرير الجانبية، الشخص مستلقٍ براحة على السرير ووزن جسمه مدعوم بالمرتبة.',
    enPhrase:
      'lying down comfortably on the bed with body weight supported naturally by the mattress',
  },
  {
    value: 'rear_propped_low_angle',
    labelAr: 'هاتف مسنود على الأرض (زاوية سفلية عفوية)',
    descAr:
      'لقطة عفوية بزاوية منخفضة، الشخص جالس على حافة السرير بوقفة طبيعية.',
    enPhrase:
      'sitting candidly on the edge of the bed from a slightly low shelf-propped perspective with natural fabric folds',
  },
  {
    value: 'rear_desk_profile',
    labelAr: 'هاتف مثبت على المكتب (تصوير جانبي - بروفايل)',
    descAr:
      'لقطة جانبية ملتقطة بهاتف مسند على مكتب الغرفة، الشخص يقف أو يجلس قرب النافذة.',
    enPhrase:
      'positioned near the bedroom desk in a relaxed side-profile posture with natural side lighting on the face',
  },
];

export const POSE_OPTIONS: OptionItem<PoseType>[] = [
  ...FRONT_POSE_OPTIONS,
  ...REAR_CAMERA_POSE_OPTIONS,
];

export const MIRROR_GAZE_OPTIONS: OptionItem<MirrorGazeType>[] = [
  {
    value: 'gaze_phone_screen',
    labelAr: 'النظر لأسفل نحو شاشة الهاتف (التركيز على الجهاز)',
    descAr: 'تركيز العينين لأسفل بانتباه نحو انعكاس شاشة الهاتف المادية في المرآة.',
    enPhrase:
      'Eyes focused downward intently at the physical phone screen reflection.',
  },
  {
    value: 'gaze_camera_lens',
    labelAr: 'النظر مباشرة للعدسة في المرآة (تواصل بصري)',
    descAr: 'النظر مباشرة للأمام مع تواصل بصري مباشر مع عدسة الكاميرا الخلفية في انعكاس المرآة.',
    enPhrase:
      'Eyes looking directly forward, making eye contact with the camera lens in the mirror reflection.',
  },
  {
    value: 'gaze_side_off_camera',
    labelAr: 'النظر للجانب بعيداً عن العدسة (انعكاس غير متماثل للضوء)',
    descAr: 'النظر قليلاً إلى الجانب بعيداً عن العدسة مع التقاط انعكاسات ضوئية غير متماثلة من الفلاش.',
    enPhrase:
      'Eyes looking slightly off-camera to the side, catching asymmetrical specular highlights from the flash.',
  },
];

export const MIRROR_POSE_OPTIONS: OptionItem<MirrorPoseType>[] = (
  [
  // 1. وضعيات الوقوف والتوازن (Standing)
  {
    value: 'pose_contrapposto_standing',
    labelAr: 'وقوف مسترخي كلاسيكي (نقل الوزن على قدم واحدة Contrapposto)',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr: 'الوقوف أمام المرآة بوضعية مسترخية مع نقل وزن الجسم طبيعياً إلى ساق واحدة ورفع ذراع واحدة لإمساك الهاتف.',
    enPhrase:
      'Standing in front of the mirror with a relaxed contrapposto posture, weight shifted naturally to one leg. One arm raised holding the smartphone.',
  },
  {
    value: 'pose_contrapposto_70',
    labelAr: 'نقل الوزن (70% على ساق واحدة - استرخاء)',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr: 'الوقوف مع نقل 70% من وزن الجسم إلى ساق واحدة وثني الساق الأمامية قليلاً باسترخاء وتوزيع وزن فيزيائي طبيعي.',
    enPhrase:
      'Standing with 70% of body weight shifted to one leg (contrapposto). Front leg slightly bent and relaxed. Natural physical weight distribution.',
  },
  {
    value: 'pose_one_foot_forward_knee_bend',
    labelAr: 'قدم متقدمة قليلاً مع ثني خفيف للركبة',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr:
      'وقوف مريح لبالغ مع تقديم إحدى القدمين خطوة خفيفة للأمام، وثني ناعم للركبة الأمامية، وارتكاز الوزن بثبات على الساق الخلفية.',
    enPhrase:
      'Standing comfortably with one foot stepped slightly forward and the front knee softly bent, carrying natural weight on the back leg with relaxed shoulders and hips.',
  },
  {
    value: 'pose_standing_three_quarter_turn',
    labelAr: 'وقوف بزاوية ثلاثة أرباع والتفات هادئ للمرآة',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr:
      'الوقوف باستدارة جانبية خفيفة (ثلاثة أرباع) لإبراز انسدال الملابس، مع التفات الرأس بسلاسة نحو المرآة وتوازن مريح في الكتفين.',
    enPhrase:
      'Standing turned at a gentle three-quarter torso angle relative to the mirror with the head turned smoothly back toward the reflection, keeping shoulders relaxed and posture evenly grounded.',
  },
  {
    value: 'pose_phone_chest_look_down',
    labelAr: 'هاتف عند الصدر مع النظر للأسفل (للشاشة)',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr: 'إمساك الهاتف بدقة عند مستوى الصدر مع إمالته للأعلى قليلاً وتوجيه النظر لأسفل مباشرة نحو انعكاس شاشة الهاتف.',
    enPhrase:
      'Smartphone held precisely at chest level, tilted slightly upward. Eyes looking downward directly at the physical phone screen reflection.',
  },
  {
    value: 'pose_phone_cover_lower_face_eye_contact',
    labelAr: 'التواصل البصري المباشر مع عدسة الكاميرا المنعكسة',
    groupAr: '1. وضعيات الوقوف والتوازن (Standing)',
    categoryId: 'standing',
    descAr: 'إمساك الهاتف بحيث يغطي الجزء السفلي من الوجه مع تواصل بصري مباشر وحاد مع عدسة الكاميرا في انعكاس المرآة.',
    enPhrase:
      'Smartphone held covering the lower face. Eyes making direct intense eye contact with the camera lens in the mirror reflection.',
  },

  // 2. وضعيات الجلوس والاستناد على الأثاث (Sitting)
  {
    value: 'pose_bed_edge_dynamic',
    labelAr: 'الجلوس على حافة السرير (استناد ديناميكي)',
    groupAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    categoryId: 'sitting',
    descAr: 'الجلوس على حافة السرير بمواجهة المرآة مع استناد مرفق اليد الممسكة بالهاتف على الفخذ للثبات واليد الحرة على الملاءات خلفه.',
    enPhrase:
      'Sitting on the edge of the bed facing the mirror, knees slightly apart. Phone-holding elbow resting on thigh for stability, free hand resting flat on the bedsheets behind. Torso leaning slightly forward.',
  },
  {
    value: 'pose_chair_or_stool_sitting',
    labelAr: 'جلوس طبيعي مريح على كرسي أو مقعد ظاهر',
    groupAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    categoryId: 'sitting',
    descAr:
      'جلوس طبيعي ومسترخٍ لبالغ بكامل ملابسه على كرسي أو مقعد ظاهر في الغرفة مع استقرار الأكتاف وثنيات قماش طبيعية.',
    enPhrase:
      'Sitting naturally and comfortably on a visible bedroom chair or stool facing the mirror, torso balanced upright with relaxed shoulders and realistic fabric folds across the lap.',
  },
  {
    value: 'pose_seated_forearm_knee_rest',
    labelAr: 'جلوس بميل خفيف واستناد الساعد الحر على الفخذ',
    groupAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    categoryId: 'sitting',
    descAr:
      'الجلوس على كرسي أو حافة السرير بميل أمامي متوازن مع إراحة الساعد الحر فوق الفخذ واستقرار الجلسة.',
    enPhrase:
      'Seated comfortably on a visible bed edge, chair, or stool with a slight balanced forward torso lean, free forearm resting casually across the thigh.',
  },
  {
    value: 'pose_floor_rug_mirror',
    labelAr: 'الجلوس الأرضي العفوي أمام مرآة طويلة',
    groupAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    categoryId: 'sitting',
    descAr: 'الجلوس على سجادة الأرضية أمام مرآة بطول كامل مع ضم إحدى الركبتين نحو الصدر ومد الساق الأخرى وإمساك الهاتف بمستوى الصدر.',
    enPhrase:
      'Sitting on the floor rug in front of a full-length mirror. One knee pulled towards the chest, the other leg extended. Phone held at chest level.',
  },
  {
    value: 'pose_floor_sitting_bed',
    labelAr: 'جلوس على الأرض والاستناد للسرير (زاوية سفلية)',
    groupAr: '2. وضعيات الجلوس والاستناد على الأثاث (Sitting)',
    categoryId: 'sitting',
    descAr: 'الجلوس بعفوية على أرضية غرفة النوم مع الاستناد بالظهر على إطار السرير ورفع الهاتف لالتقاط سيلفي مرآة بزاوية سفلية طفيفة.',
    enPhrase:
      'Sitting casually on the bedroom floor leaning back against the bed frame. Smartphone held up for a slight low-angle mirror selfie. Spine curved naturally.',
  },

  // 3. وضعيات الاتكاء والانحناء (Leaning)
  {
    value: 'pose_wall_lean_scurve',
    labelAr: 'الاستناد على الحائط (ثني ركبة واحدة S-Curve)',
    groupAr: '3. وضعيات الاتكاء والانحناء (Leaning)',
    categoryId: 'leaning',
    descAr: 'الاستناد بالظهر بالكامل على الحائط بجوار المرآة مع ثني ركبة واحدة ووضع باطن القدم على الحائط لتشكيل انحناء S طبيعي في العمود الفقري.',
    enPhrase:
      'Leaning back completely against the wall next to the mirror. One knee bent with the sole of the foot flat against the wall, creating a natural S-curve in the spine.',
  },
  {
    value: 'pose_vanity_casual_lean',
    labelAr: 'اتكاء عفوي متوازن على طاولة الزينة (Vanity)',
    groupAr: '3. وضعيات الاتكاء والانحناء (Leaning)',
    categoryId: 'leaning',
    descAr:
      'اتكاء خفيف ومتوازن بجانب الورك أو الساعد على حافة طاولة زينة ظاهرة أمام المرآة مع ثنيات طبيعية في القماش عند نقطة التلامس.',
    enPhrase:
      'Leaning lightly in a balanced, casual posture against a visible bedroom vanity table, keeping weight comfortably supported with natural clothing folds at the contact point.',
  },
  {
    value: 'pose_doorway_frame_lean',
    labelAr: 'اتكاء هادئ بالكتف على جدار أو إطار الغرفة الظاهر',
    groupAr: '3. وضعيات الاتكاء والانحناء (Leaning)',
    categoryId: 'leaning',
    descAr:
      'اتكاء طبيعي بالكتف والعضد على جدار أو زاوية إطار باب ظاهرة بجوار المرآة، مع توزيع الوزن باسترخاء دون تيبّس.',
    enPhrase:
      'Resting one shoulder casually against a visible bedroom wall corner or doorframe beside the mirror, transferring weight naturally into the support surface with relaxed shoulders.',
  },
  {
    value: 'pose_leaning_forward',
    labelAr: 'انحناء طفيف للأمام نحو المرآة مع ارتكاز على سطح ظاهر',
    groupAr: '3. وضعيات الاتكاء والانحناء (Leaning)',
    categoryId: 'leaning',
    descAr: 'انحناء خفيف متوازن للأمام باتجاه المرآة مع إسناد الورك أو اليد الحرة بلطف على حافة طاولة زينة أو جدار ظاهر في المشهد.',
    enPhrase:
      'Leaning slightly forward toward the mirror in a balanced posture beside a visible bedroom vanity or wall edge, keeping weight naturally braced at the visible contact surface.',
  },

  // 4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)
  {
    value: 'pose_candid_framing_check',
    labelAr: 'لحظة عفوية: تفقد الكادر والتقاط تلقائي',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr:
      'لقطة عفوية طبيعية أثناء تفقد الكادر في شاشة الهاتف أو تعديل الوقفة بخفة، بطاقة شبابية راقية ومحتشمة لبالغ.',
    enPhrase:
      'Captured in a spontaneous, unposed candid moment checking the framing on the phone reflection, keeping relaxed shoulders and an expressive yet natural adult posture.',
  },
  {
    value: 'pose_adjust_collar_sleeves',
    labelAr: 'تعديل الياقة أو الأكمام (حركة متجمدة)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'الوقوف بزاوية طفيفة مع قيام اليد الحرة برفع ياقة الجاكيت أو طي أكمام القميص عند المعصم في لقطة حركة متجمدة.',
    enPhrase:
      'Standing at a slight angle, free hand physically pulling up the jacket collar or rolling up shirt sleeves at the wrist. Dynamic arm line. Capturing a frozen action moment.',
  },
  {
    value: 'pose_cuffed_sleeve_check',
    labelAr: 'تفقد كم القميص أو طي المعصم بعفوية',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'إمساك الهاتف بمستوى الصدر بيد واحدة بينما تتحقق اليد الحرة من طيّة كم القميص أو ساعة المعصم في لقطة يومية عفوية.',
    enPhrase:
      'Holding the phone steadily at chest level in one hand while the free fingers casually adjust a folded shirt cuff near the wrist in a candid everyday routine pause.',
  },
  {
    value: 'pose_putting_on_jacket',
    labelAr: 'لحظة ارتداء جاكيت أو ترتيب القميص',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'حركة متجمدة أثناء ارتداء جاكيت وسحبه فوق أحد الكتفين أو الإمساك بطرف القميص لترتيبه.',
    enPhrase:
      'Frozen action of putting on a jacket, pulling it over one shoulder. Holding the edge of the shirt to tuck it in.',
  },
  {
    value: 'pose_adjust_accessories',
    labelAr: 'التفاعل مع الإكسسوارات (نظارة، ساعة)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'اليد الحرة تلمس إطار النظارة لتعديلها أو تضبط ساعة اليد في حركة يومية عفوية.',
    enPhrase:
      'Free hand touching the frame of glasses to adjust them, or adjusting a wristwatch. Everyday candid action.',
  },
  {
    value: 'pose_hand_in_hair_jawline',
    labelAr: 'تمرير اليد في الشعر أو خلف الرقبة (إبراز الفك)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'تمرير أصابع اليد الحرة خلال الشعر لإبعاده عن الجبهة أو إسناد اليد خلف الرقبة لرفع الصدر وإبراز خط الفك.',
    enPhrase:
      'Free hand running fingers through hair, pushing it back off the forehead. Hand resting relaxed behind the neck, lifting the chest and accentuating the jawline.',
  },
  {
    value: 'pose_free_hand_motion_blur',
    labelAr: 'ضبابية حركية فنية (Motion Blur) لليد الحرة',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'ضبابية حركية طفيفة مقصودة على اليد الحرة أثناء تحركها بينما يبقى الجسم والوجه في تركيز بؤري حاد لمحاكاة لقطة عفوية حقيقية.',
    enPhrase:
      'Slight intentional motion blur on the free hand moving, while the main body and face remain in sharp focus, simulating a real spontaneous capture.',
  },
  {
    value: 'pose_prop_coffee_mug',
    labelAr: 'الإمساك بكوب قهوة (روتين صباحي)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'اليد الحرة تمسك كوب قهوة بعفوية قرب مستوى الصدر بطابع روتين صباحي واقعي.',
    enPhrase:
      'Free hand casually holding a coffee mug near chest level. Candid morning routine vibe.',
  },
  {
    value: 'pose_prop_perfume_spray',
    labelAr: 'الإمساك بزجاجة عطر (لحظة الرش الفعلي)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'الإمساك بزجاجة عطر باليد الحرة وتوجيهها نحو الرقبة في حركة متجمدة للحظة الرش.',
    enPhrase:
      'Holding a perfume bottle in the free hand, aiming it at the neck in a frozen action of spraying.',
  },
  {
    value: 'pose_prop_open_book',
    labelAr: 'توثيق لحظة هدوء مع كتاب مفتوح',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'الجلوس بعفوية مع إمساك كتاب مفتوح أو مجلة بيد واحدة والتقاط السيلفي باليد الأخرى.',
    enPhrase:
      'Sitting casually holding an open book or magazine in one hand, taking the selfie with the other hand.',
  },
  {
    value: 'pose_hand_on_mirror_glass',
    labelAr: 'لمس سطح المرآة مباشرة باليد الحرة (بُعد 3D)',
    groupAr: '4. حركات عفوية وتفاعل مع الملابس أو الأدوات (Candid)',
    categoryId: 'candid',
    descAr: 'الوقوف قريباً من المرآة مع وضع اليد الحرة مسطحة مباشرة على السطح الزجاجي للمرآة لخلق تفاعل عمق ثلاثي الأبعاد بين اليد الحقيقية وانعكاسها.',
    enPhrase:
      'Standing close to the mirror. Free hand placed directly flat on the physical glass surface of the mirror, creating a strong 3D depth interaction between the real hand and reflection.',
  },
]
);

export const MIRROR_SUPPORT_OBJECT_OPTIONS: OptionItem<MirrorSupportObjectType>[] = [
  {
    value: 'none',
    labelAr: 'دون استناد أو أداة (وقوف حر متوازن)',
    descAr: 'وقوف حر متزن دون ملامسة جدار أو مقعد أو حمل أدوات.',
    enPhrase: 'freestanding with balanced posture',
  },
  {
    value: 'wall',
    labelAr: 'جدار الغرفة القريب (للاتكاء المتوازن)',
    descAr: 'اتكاء خفيف بالكتف أو الظهر على حائط ظاهر بجانب المرآة.',
    enPhrase: 'resting lightly against a visible bedroom wall',
  },
  {
    value: 'vanity',
    labelAr: 'طاولة الزينة / التسريحة الظاهرة',
    descAr: 'اتكاء خفيف أو وضع اليد بمحاذاة طاولة زينة ظاهرة أمام المرآة.',
    enPhrase: 'resting lightly beside a visible bedroom vanity table',
  },
  {
    value: 'bed_edge',
    labelAr: 'حافة السرير الظاهرة',
    descAr: 'الجلوس الطبيعي على حافة سرير مرئية مع انضغاط طفيف للمرتبة.',
    enPhrase: 'seated on a visible bed edge with subtle mattress compression',
  },
  {
    value: 'chair',
    labelAr: 'كرسي غرفة النوم الظاهر',
    descAr: 'الجلوس بارتياح على كرسي ظاهر في الإطار.',
    enPhrase: 'seated comfortably on a visible bedroom chair',
  },
  {
    value: 'stool',
    labelAr: 'مقعد قصير / ستول ظاهر (Stool)',
    descAr: 'الجلوس بتوازن طبيعي على مقعد خشبي أو مبطن ظاهر في الكادر.',
    enPhrase: 'seated with natural balance on a visible bedroom stool',
  },
  {
    value: 'mirror_glass',
    labelAr: 'سطح زجاج المرآة (لمس خفيف قريب)',
    descAr: 'وضع اليد الحرة بلطف على زجاج المرآة (يتطلب يدًا واحدة للهاتف وعدسة قريبة).',
    enPhrase: 'free hand resting gently against the visible mirror glass',
  },
  {
    value: 'coffee_mug',
    labelAr: 'كوب قهوة سيراميك بسيط',
    descAr: 'حمل كوب قهوة باليد الحرة أثناء إمساك الهاتف باليد الأخرى.',
    enPhrase: 'free hand holding one plain ceramic coffee mug',
  },
  {
    value: 'open_book',
    labelAr: 'كتاب بسيط',
    descAr: 'حمل كتاب باليد الحرة في وقفة أو جلسة هادئة.',
    enPhrase: 'free hand holding a simple book',
  },
  {
    value: 'perfume_bottle',
    labelAr: 'زجاجة عطر يومية',
    descAr: 'إمساك زجاجة عطر باليد الحرة في لحظة عفوية.',
    enPhrase: 'free hand holding a simple everyday perfume bottle',
  },
];

export const MIRROR_POSE_ENERGY_OPTIONS: OptionItem<MirrorPoseEnergyType>[] = [
  {
    value: 'relaxed',
    labelAr: 'مسترخٍ وهادئ (Relaxed)',
    descAr: 'لغة جسد عفوية ومريحة بأكتاف مسترخية وتوازن طبيعي لبالغ.',
    enPhrase: 'with relaxed, comfortable adult body language and natural shoulder ease',
  },
  {
    value: 'candid',
    labelAr: 'عفوي وتلقائي (Candid)',
    descAr: 'طابع غير متكلف كأنه التقط في لحظة حقيقية أثناء الاستعداد أو تفقد الإطلالة.',
    enPhrase: 'with unposed, spontaneous everyday candid adult energy',
  },
  {
    value: 'confident',
    labelAr: 'واثق ومتزن (Confident)',
    descAr: 'وقفة متماسكة ومتزنة بإطلالة هادئة وواثقة دون مبالغة.',
    enPhrase: 'with composed, quietly confident adult posture and natural poise',
  },
  {
    value: 'playful',
    labelAr: 'حيوي وخفيف الظل (Playful)',
    descAr: 'طاقة شبابية مرحة ومهذبة لبالغ بكامل ملابسه في لقطة مرآة ودودة.',
    enPhrase: 'with light-hearted, expressive, upbeat yet modest adult energy',
  },
];

const ALL_MIRROR_STANCES: MirrorStanceType[] = [
  'balanced_relaxed',
  'contrapposto_weight_shift',
  'staggered_feet',
  'one_foot_forward',
  'soft_knee_bend',
  'gentle_three_quarter_turn',
  'light_shoulder_wall_lean',
  'paused_natural_step',
];

const ALL_STANDING_FRAMINGS: FramingType[] = [
  'head_and_shoulders',
  'half_body',
  'three_quarter',
  'full_body_mirror',
];

const UPPER_PLUS_THREE_QUARTER_FRAMINGS: FramingType[] = [
  'half_body',
  'three_quarter',
  'full_body_mirror',
];

const SEATED_FRAMINGS: FramingType[] = ['three_quarter', 'full_body_mirror'];

const ALL_MIRROR_GAZES: MirrorGazeType[] = [
  'gaze_phone_screen',
  'gaze_camera_lens',
  'gaze_side_off_camera',
];

const ALL_MIRROR_ENERGIES: MirrorPoseEnergyType[] = [
  'relaxed',
  'playful',
  'confident',
  'candid',
];

const SINGLE_HAND_ONLY: PhoneHandType[] = ['right_hand', 'left_hand'];
const ANY_PHONE_HAND: PhoneHandType[] = ['right_hand', 'left_hand', 'both_hands'];

export const MIRROR_POSE_PRESET_SPECS: Record<
  MirrorPoseType,
  CanonicalMirrorPosePresetSpec
> = {
  pose_contrapposto_standing: {
    id: 'pose_contrapposto_standing',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: ALL_MIRROR_STANCES,
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'adjust_sleeve_or_collar',
      'smooth_shirt',
      'tuck_hair_behind_ear',
      'lightly_touch_mirror',
      'hold_mug',
      'hold_book',
    ],
    allowedSupportObjects: [
      'none',
      'wall',
      'vanity',
      'mirror_glass',
      'coffee_mug',
      'open_book',
    ],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'none',
    },
  },
  pose_contrapposto_70: {
    id: 'pose_contrapposto_70',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'three_quarter',
    allowedFramings: ['three_quarter', 'full_body_mirror'],
    allowedStances: [
      'balanced_relaxed',
      'contrapposto_weight_shift',
      'soft_knee_bend',
      'gentle_three_quarter_turn',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'adjust_sleeve_or_collar',
      'smooth_shirt',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['none', 'wall', 'vanity'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'contrapposto_weight_shift',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'hand_at_hip_or_pocket',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'confident',
      supportObject: 'none',
    },
  },
  pose_one_foot_forward_knee_bend: {
    id: 'pose_one_foot_forward_knee_bend',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'full_body_mirror',
    allowedFramings: ['full_body_mirror'],
    allowedStances: ['one_foot_forward', 'soft_knee_bend', 'balanced_relaxed'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'adjust_sleeve_or_collar',
      'smooth_shirt',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'full_body_mirror',
      stance: 'one_foot_forward',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'hand_at_hip_or_pocket',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'confident',
      supportObject: 'none',
    },
  },
  pose_standing_three_quarter_turn: {
    id: 'pose_standing_three_quarter_turn',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'gentle_three_quarter_turn',
      'balanced_relaxed',
      'contrapposto_weight_shift',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'smooth_shirt',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['none', 'wall', 'vanity'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'three_quarter_look_back',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'relaxed',
      supportObject: 'none',
    },
  },
  pose_wall_lean_scurve: {
    id: 'pose_wall_lean_scurve',
    category: 'leaning',
    postureCategory: 'leaning',
    minFraming: 'three_quarter',
    allowedFramings: ['three_quarter', 'full_body_mirror'],
    allowedStances: ['light_shoulder_wall_lean', 'balanced_relaxed', 'soft_knee_bend'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['wall'],
    requiredSupportCategory: 'lean_surface',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'full_body_mirror',
      stance: 'light_shoulder_wall_lean',
      torsoOrientation: 'three_quarter_look_back',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'relaxed',
      supportObject: 'wall',
    },
  },
  pose_vanity_casual_lean: {
    id: 'pose_vanity_casual_lean',
    category: 'leaning',
    postureCategory: 'leaning',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: ['none_relaxed', 'tuck_hair_behind_ear'],
    allowedSupportObjects: ['vanity', 'wall'],
    requiredSupportCategory: 'lean_surface',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'candid',
      supportObject: 'vanity',
    },
  },
  pose_doorway_frame_lean: {
    id: 'pose_doorway_frame_lean',
    category: 'leaning',
    postureCategory: 'leaning',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: [
      'light_shoulder_wall_lean',
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['wall'],
    requiredSupportCategory: 'lean_surface',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'light_shoulder_wall_lean',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'hand_at_hip_or_pocket',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'wall',
    },
  },
  pose_bed_edge_dynamic: {
    id: 'pose_bed_edge_dynamic',
    category: 'sitting',
    postureCategory: 'seated',
    minFraming: 'three_quarter',
    allowedFramings: SEATED_FRAMINGS,
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['bed_edge'],
    requiredSupportCategory: 'seat',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'facing_mirror',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'bed_edge',
    },
  },
  pose_chair_or_stool_sitting: {
    id: 'pose_chair_or_stool_sitting',
    category: 'sitting',
    postureCategory: 'seated',
    minFraming: 'three_quarter',
    allowedFramings: SEATED_FRAMINGS,
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'adjust_sleeve_or_collar',
      'tuck_hair_behind_ear',
      'hold_mug',
    ],
    allowedSupportObjects: ['chair', 'stool'],
    requiredSupportCategory: 'seat',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'relaxed',
      supportObject: 'chair',
    },
  },
  pose_seated_forearm_knee_rest: {
    id: 'pose_seated_forearm_knee_rest',
    category: 'sitting',
    postureCategory: 'seated',
    minFraming: 'three_quarter',
    allowedFramings: SEATED_FRAMINGS,
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['bed_edge', 'chair', 'stool'],
    requiredSupportCategory: 'seat',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'confident',
      supportObject: 'chair',
    },
  },
  pose_floor_rug_mirror: {
    id: 'pose_floor_rug_mirror',
    category: 'sitting',
    postureCategory: 'floor_seated',
    minFraming: 'full_body_mirror',
    allowedFramings: ['full_body_mirror'],
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['none', 'bed_edge'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'full_body_mirror',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'none',
    },
  },
  pose_floor_sitting_bed: {
    id: 'pose_floor_sitting_bed',
    category: 'sitting',
    postureCategory: 'floor_seated',
    minFraming: 'full_body_mirror',
    allowedFramings: ['full_body_mirror'],
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['bed_edge'],
    requiredSupportCategory: 'seat',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'full_body_mirror',
      stance: 'balanced_relaxed',
      torsoOrientation: 'facing_mirror',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'bed_edge',
    },
  },
  pose_candid_framing_check: {
    id: 'pose_candid_framing_check',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
      'light_shoulder_wall_lean',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'adjust_sleeve_or_collar',
      'smooth_shirt',
      'tuck_hair_behind_ear',
    ],
    allowedSupportObjects: ['none', 'wall', 'vanity'],
    allowedGazes: ['gaze_phone_screen', 'gaze_camera_lens'],
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'both_hands',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'turning_toward_mirror',
      gaze: 'gaze_phone_screen',
      energy: 'candid',
      supportObject: 'none',
    },
  },
  pose_adjust_collar_sleeves: {
    id: 'pose_adjust_collar_sleeves',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
    ],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['adjust_sleeve_or_collar', 'none_relaxed'],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'adjust_sleeve_or_collar',
      movementMoment: 'finishing_outfit_adjustment',
      gaze: 'gaze_camera_lens',
      energy: 'candid',
      supportObject: 'none',
    },
  },
  pose_cuffed_sleeve_check: {
    id: 'pose_cuffed_sleeve_check',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
    ],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['adjust_sleeve_or_collar', 'none_relaxed'],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'adjust_sleeve_or_collar',
      movementMoment: 'finishing_outfit_adjustment',
      gaze: 'gaze_phone_screen',
      energy: 'candid',
      supportObject: 'none',
    },
  },
  pose_putting_on_jacket: {
    id: 'pose_putting_on_jacket',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: ['balanced_relaxed', 'gentle_three_quarter_turn'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['adjust_sleeve_or_collar', 'none_relaxed'],
    allowedSupportObjects: ['none'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'adjust_sleeve_or_collar',
      movementMoment: 'finishing_outfit_adjustment',
      gaze: 'gaze_phone_screen',
      energy: 'candid',
      supportObject: 'none',
    },
  },
  pose_adjust_accessories: {
    id: 'pose_adjust_accessories',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: ['balanced_relaxed', 'gentle_three_quarter_turn'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['adjust_sleeve_or_collar', 'none_relaxed'],
    allowedSupportObjects: ['none'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'shoulder_level',
      freeHandAction: 'adjust_sleeve_or_collar',
      movementMoment: 'finishing_outfit_adjustment',
      gaze: 'gaze_camera_lens',
      energy: 'candid',
      supportObject: 'none',
    },
  },
  pose_hand_in_hair_jawline: {
    id: 'pose_hand_in_hair_jawline',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'contrapposto_weight_shift',
      'light_shoulder_wall_lean',
    ],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['tuck_hair_behind_ear', 'none_relaxed'],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'tuck_hair_behind_ear',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'relaxed',
      supportObject: 'none',
    },
  },
  pose_free_hand_motion_blur: {
    id: 'pose_free_hand_motion_blur',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: ALL_MIRROR_STANCES,
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: [
      'none_relaxed',
      'adjust_sleeve_or_collar',
      'tuck_hair_behind_ear',
      'smooth_shirt',
    ],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'tuck_hair_behind_ear',
      movementMoment: 'turning_toward_mirror',
      gaze: 'gaze_camera_lens',
      energy: 'playful',
      supportObject: 'none',
    },
  },
  pose_prop_coffee_mug: {
    id: 'pose_prop_coffee_mug',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'contrapposto_weight_shift',
      'gentle_three_quarter_turn',
      'light_shoulder_wall_lean',
    ],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['hold_mug', 'none_relaxed'],
    allowedSupportObjects: ['coffee_mug'],
    requiredSupportCategory: 'prop',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'hold_mug',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'coffee_mug',
    },
  },
  pose_prop_perfume_spray: {
    id: 'pose_prop_perfume_spray',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: ['balanced_relaxed', 'gentle_three_quarter_turn'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['perfume_bottle'],
    requiredSupportCategory: 'prop',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'gentle_three_quarter_turn',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'finishing_outfit_adjustment',
      gaze: 'gaze_camera_lens',
      energy: 'candid',
      supportObject: 'perfume_bottle',
    },
  },
  pose_prop_open_book: {
    id: 'pose_prop_open_book',
    category: 'sitting',
    postureCategory: 'seated',
    minFraming: 'three_quarter',
    allowedFramings: SEATED_FRAMINGS,
    allowedStances: ['balanced_relaxed'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['hold_book', 'none_relaxed'],
    allowedSupportObjects: ['open_book', 'bed_edge', 'chair'],
    requiredSupportCategory: 'prop',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'hold_book',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'open_book',
    },
  },
  pose_hand_on_mirror_glass: {
    id: 'pose_hand_on_mirror_glass',
    category: 'candid',
    postureCategory: 'standing',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: ['balanced_relaxed', 'gentle_three_quarter_turn'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['lightly_touch_mirror', 'none_relaxed'],
    allowedSupportObjects: ['mirror_glass'],
    requiredSupportCategory: 'mirror_surface',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'slight_angle_head_turned',
      phoneHand: 'right_hand',
      phonePosition: 'shoulder_level',
      freeHandAction: 'lightly_touch_mirror',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'playful',
      supportObject: 'mirror_glass',
    },
  },
  pose_phone_chest_look_down: {
    id: 'pose_phone_chest_look_down',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: ALL_MIRROR_STANCES,
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: [
      'none_relaxed',
      'hand_at_hip_or_pocket',
      'smooth_shirt',
    ],
    allowedSupportObjects: ['none', 'wall', 'vanity'],
    allowedGazes: ['gaze_phone_screen'],
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'three_quarter',
      stance: 'balanced_relaxed',
      torsoOrientation: 'facing_mirror',
      phoneHand: 'right_hand',
      phonePosition: 'chest_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_phone_screen',
      energy: 'relaxed',
      supportObject: 'none',
    },
  },
  pose_phone_cover_lower_face_eye_contact: {
    id: 'pose_phone_cover_lower_face_eye_contact',
    category: 'standing',
    postureCategory: 'standing',
    minFraming: 'head_and_shoulders',
    allowedFramings: ALL_STANDING_FRAMINGS,
    allowedStances: [
      'balanced_relaxed',
      'gentle_three_quarter_turn',
      'light_shoulder_wall_lean',
    ],
    allowedPhoneHands: ANY_PHONE_HAND,
    allowedFreeHandActions: ['none_relaxed', 'hand_at_hip_or_pocket'],
    allowedSupportObjects: ['none', 'wall'],
    allowedGazes: ['gaze_camera_lens'],
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'facing_mirror',
      phoneHand: 'right_hand',
      phonePosition: 'eye_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'still_composed',
      gaze: 'gaze_camera_lens',
      energy: 'confident',
      supportObject: 'none',
    },
  },
  pose_leaning_forward: {
    id: 'pose_leaning_forward',
    category: 'leaning',
    postureCategory: 'leaning',
    minFraming: 'half_body',
    allowedFramings: UPPER_PLUS_THREE_QUARTER_FRAMINGS,
    allowedStances: ['balanced_relaxed', 'gentle_three_quarter_turn'],
    allowedPhoneHands: SINGLE_HAND_ONLY,
    allowedFreeHandActions: ['none_relaxed'],
    allowedSupportObjects: ['vanity', 'wall'],
    requiredSupportCategory: 'lean_surface',
    allowedGazes: ALL_MIRROR_GAZES,
    allowedEnergies: ALL_MIRROR_ENERGIES,
    defaults: {
      framing: 'half_body',
      stance: 'balanced_relaxed',
      torsoOrientation: 'facing_mirror',
      phoneHand: 'right_hand',
      phonePosition: 'shoulder_level',
      freeHandAction: 'none_relaxed',
      movementMoment: 'turning_toward_mirror',
      gaze: 'gaze_camera_lens',
      energy: 'playful',
      supportObject: 'vanity',
    },
  },
};

export const XIAOMI_15_ULTRA_LENS_PROFILES: Record<
  MirrorLensProfileType,
  MirrorLensSpec
> = {
  main_23mm: {
    id: 'main_23mm',
    labelShort: 'Main 23mm',
    equivalentFocalLengthMm: 23,
    aperture: 'f/1.63',
    stabilizationOrFov: 'OIS',
    specSummary: '23mm-equivalent, f/1.63, OIS',
    framingGuidance:
      'Natural everyday mirror-selfie waist-to-three-quarter framing with balanced room context',
    distanceGuidance:
      'Captured from a comfortable arm’s-length to moderate mirror distance',
    perspectiveAndDistortionTarget:
      'Visual target of natural everyday 23mm-equivalent wide perspective with controlled edge geometry and no exaggerated stretching',
    isOpticalTelephoto: false,
  },
  telephoto_70mm: {
    id: 'telephoto_70mm',
    labelShort: 'Floating Telephoto 70mm',
    equivalentFocalLengthMm: 70,
    aperture: 'f/1.8',
    stabilizationOrFov: 'OIS',
    specSummary: '70mm-equivalent floating telephoto, f/1.8, OIS',
    framingGuidance:
      'Tighter portrait and upper-body framing matching an optical 70mm floating telephoto lens (not digital zoom)',
    distanceGuidance:
      'Phone and subject positioned noticeably farther from the mirror to accommodate optical 70mm telephoto reach',
    perspectiveAndDistortionTarget:
      'Visual target of gently compressed telephoto perspective and flatter facial proportions with minimal wide-angle distortion',
    isOpticalTelephoto: true,
  },
  ultra_telephoto_100mm: {
    id: 'ultra_telephoto_100mm',
    labelShort: 'Ultra-Telephoto 100mm',
    equivalentFocalLengthMm: 100,
    aperture: 'f/2.6',
    stabilizationOrFov: 'OIS',
    specSummary: '100mm-equivalent ultra-telephoto, f/2.6, OIS',
    framingGuidance:
      'Tight chest-up or portrait framing matching an optical 100mm ultra-telephoto lens (not digital zoom)',
    distanceGuidance:
      'Captured from a significantly greater subject-to-mirror distance across the room—never close range',
    perspectiveAndDistortionTarget:
      'Visual target of pronounced telephoto perspective compression with minimal foreground perspective exaggeration',
    isOpticalTelephoto: true,
  },
  ultrawide_14mm: {
    id: 'ultrawide_14mm',
    labelShort: 'Ultra-Wide 14mm',
    equivalentFocalLengthMm: 14,
    aperture: 'f/2.2',
    stabilizationOrFov: '115° field of view',
    specSummary: '14mm-equivalent ultra-wide, f/2.2, 115° field of view',
    framingGuidance:
      'Expansive room and full-body mirror coverage capturing wider bedroom context within a 115° field of view',
    distanceGuidance:
      'Positioned with enough mirror clearance—avoid standing very close to the mirror—keeping the subject’s face near the center of the frame',
    perspectiveAndDistortionTarget:
      'Visual target of 14mm-equivalent ultra-wide perspective with centered facial alignment and controlled peripheral stretching',
    isOpticalTelephoto: false,
  },
};

export const MIRROR_LENS_PROFILE_OPTIONS: OptionItem<MirrorLensProfileType>[] = [
  {
    value: 'main_23mm',
    labelAr: 'العدسة الرئيسية 23mm (f/1.63, OIS) — افتراضي',
    descAr: 'منظور سيلفي مرآة يومي طبيعي وتغطية متوازنة للغرفة دون تمدد مبالغ فيه.',
    enPhrase: '23mm-equivalent, f/1.63, OIS main rear lens',
  },
  {
    value: 'telephoto_70mm',
    labelAr: 'التقريب العائم 70mm (f/1.8, OIS)',
    descAr: 'تأطير بورتريه أضيق وضغط منظور بصري طبيعي من مسافة أبعد قليلًا عن المرآة (دون تقريب رقمي).',
    enPhrase: '70mm-equivalent, f/1.8, OIS floating telephoto rear lens',
  },
  {
    value: 'ultra_telephoto_100mm',
    labelAr: 'التقريب الفائق 100mm (f/2.6, OIS)',
    descAr: 'تأطير ضيق بضغط منظوري واضح يتطلب مسافة كبيرة نسبيًا عن المرآة (ليس من مسافة قريبة).',
    enPhrase: '100mm-equivalent, f/2.6, OIS ultra-telephoto rear lens',
  },
  {
    value: 'ultrawide_14mm',
    labelAr: 'فائقة الاتساع 14mm (f/2.2, 115° FOV)',
    descAr: 'تغطية أوسع للغرفة وكامل الجسم مع إبقاء الوجه قرب مركز الكادر وتجنب الوقوف قريبًا جدًا.',
    enPhrase: '14mm-equivalent, f/2.2, 115° field of view ultra-wide rear lens',
  },
];

export const MIRROR_STANCE_OPTIONS: OptionItem<MirrorStanceType>[] = [
  {
    value: 'balanced_relaxed',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'وقوف متوازن ومسترخٍ',
    descAr: 'توزيع وزن متوازن على القدمين بوقفة طبيعية غير متكلفة.',
    enPhrase:
      'standing in a relaxed balanced stance with weight evenly distributed across both feet',
  },
  {
    value: 'contrapposto_weight_shift',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'نقل الوزن إلى ساق واحدة (Contrapposto)',
    descAr: 'إمالة طبيعية مريحة للورك مع ارتكاز معظم الوزن على ساق واحدة.',
    enPhrase:
      'standing in an effortless contrapposto stance with most body weight shifted onto one leg and the opposite hip relaxed',
  },
  {
    value: 'staggered_feet',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'وقوف متدرج القدمين',
    descAr: 'إحدى القدمين متأخرة نصف خطوة لثبات عفوي وطبيعي.',
    enPhrase:
      'standing with staggered feet placed a half-step apart for natural balance',
  },
  {
    value: 'one_foot_forward',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'تقديم قدم واحدة قليلًا للأمام',
    descAr: 'قدم واحدة متقدمة بخفة للأمام بوضعية وقوف هادئة.',
    enPhrase:
      'standing naturally with one foot placed slightly forward and ankles relaxed',
  },
  {
    value: 'soft_knee_bend',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'انثناء خفيف ومسترخٍ في إحدى الركبتين',
    descAr: 'ارتكاز مريح على إحدى الساقين مع ثني رقيق للركبة الأخرى.',
    enPhrase:
      'standing with one knee softly bent and the supporting leg carrying natural weight',
  },
  {
    value: 'gentle_three_quarter_turn',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'التفاف لطيف بزاوية ثلاثة أرباع',
    descAr: 'الوقوف بميل ثلاثة أرباع تجاه المرآة لإظهار خط الكتفين بواقعية.',
    enPhrase:
      'standing turned in a gentle three-quarter orientation relative to the mirror',
  },
  {
    value: 'light_shoulder_wall_lean',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'استناد خفيف بالكتف على الجدار',
    descAr: 'اتكاء خفيف بأحد الكتفين على الجدار أو الإطار الجانبي بتوازن مريح.',
    enPhrase:
      'standing with a light, casual shoulder lean against the adjacent bedroom wall',
  },
  {
    value: 'paused_natural_step',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'توقف لحظي في خطوة طبيعية',
    descAr: 'توقف عفوي أثناء خطوة هادئة أمام المرآة مع اتزان القدمين.',
    enPhrase:
      'standing in a paused natural step in front of the mirror with natural weight transfer',
  },
];

export const MIRROR_TORSO_ORIENTATION_OPTIONS: OptionItem<MirrorTorsoOrientationType>[] = [
  {
    value: 'facing_mirror',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'الجذع بمواجهة مباشرة للمرآة',
    enPhrase: 'torso and head facing the mirror square-on naturally',
  },
  {
    value: 'slight_angle_head_turned',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'ميل خفيف للجذع مع التفات الرأس للمرآة',
    enPhrase:
      'torso angled slightly with head turned naturally toward the mirror',
  },
  {
    value: 'three_quarter_look_back',
    groupAr: '1. وضعية الوقوف وتوزيع الوزن',
    labelAr: 'جذع بزاوية ثلاثة أرباع ونظرة للمرآة',
    enPhrase:
      'torso in a relaxed three-quarter angle while turning head naturally toward the mirror',
  },
];

export const MIRROR_PHONE_POSITION_OPTIONS: OptionItem<MirrorPhonePositionType>[] = [
  {
    value: 'chest_level',
    groupAr: '2. موضع الهاتف وزاوية الكاميرا',
    labelAr: 'الهاتف عند مستوى الصدر',
    descAr: 'إمساك الهاتف بيد واحدة عند مستوى الصدر مع توجيه الكاميرا الخلفية للمرآة.',
    enPhrase:
      'held steadily at chest level in one hand with the rear camera and flash aimed cleanly at the mirror',
  },
  {
    value: 'shoulder_level',
    groupAr: '2. موضع الهاتف وزاوية الكاميرا',
    labelAr: 'الهاتف عند مستوى الكتف',
    descAr: 'إمساك الهاتف قرب مستوى الكتف بعيدًا عن الوجه مع توجيه الكاميرا الخلفية للمرآة.',
    enPhrase:
      'held at shoulder height beside the upper torso with the rear camera aimed toward the mirror',
  },
  {
    value: 'eye_level',
    groupAr: '2. موضع الهاتف وزاوية الكاميرا',
    labelAr: 'الهاتف عند مستوى العين',
    descAr: 'رفع الهاتف عند مستوى العين في يد واحدة دون إخفاء الملامح أو حسب زاوية المرآة.',
    enPhrase:
      'held at eye level in one hand with the rear camera aimed straight toward the mirror',
  },
];

export const MIRROR_FREE_HAND_ACTION_OPTIONS: OptionItem<MirrorFreeHandActionType>[] = [
  {
    value: 'none_relaxed',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'يد حرة مسترخية طبيعيًا',
    enPhrase: 'with the free hand resting relaxed naturally at the side',
  },
  {
    value: 'hand_at_hip_or_pocket',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'اليد عند الخصر أو داخل الجيب',
    enPhrase:
      'with the free hand resting lightly at the hip or tucked comfortably into a pocket',
  },
  {
    value: 'adjust_sleeve_or_collar',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'تعديل الكم أو الياقة',
    enPhrase:
      'with the free hand naturally adjusting the shirt sleeve or collar',
  },
  {
    value: 'smooth_shirt',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'تمليس القميص أو ترتيب الحافة',
    enPhrase:
      'with the free hand lightly smoothing the front or hem of the upper garment',
  },
  {
    value: 'tuck_hair_behind_ear',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'إبعاد خصلة شعر خلف الأذن',
    enPhrase:
      'with the free hand gently tucking hair behind the ear while preserving natural hairline',
  },
  {
    value: 'lightly_touch_mirror',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'ملامسة سطح المرآة برفق (مسافة قريبة)',
    enPhrase:
      'with the free hand resting lightly against the physical mirror glass surface',
  },
  {
    value: 'hold_mug',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'إمساك كوب بسيط',
    enPhrase: 'with the free hand casually holding one plain ceramic mug',
  },
  {
    value: 'hold_book',
    groupAr: '3. تفاعل اليد الحرة (أو استخدام القالب السريع)',
    labelAr: 'إمساك كتاب بسيط',
    enPhrase: 'with the free hand casually holding one closed paperback book',
  },
];

export const MIRROR_MOVEMENT_MOMENT_OPTIONS: OptionItem<MirrorMovementMomentType>[] = [
  {
    value: 'still_composed',
    groupAr: '4. لحظات الحركة الطبيعية',
    labelAr: 'وقفة سكون ثابتة وواضحة',
    enPhrase: 'held in a crisp still moment',
  },
  {
    value: 'turning_toward_mirror',
    groupAr: '4. لحظات الحركة الطبيعية',
    labelAr: 'لحظة التفات لطيفة نحو المرآة',
    enPhrase: 'captured mid-turn glancing naturally toward the mirror',
  },
  {
    value: 'finishing_outfit_adjustment',
    groupAr: '4. لحظات الحركة الطبيعية',
    labelAr: 'لحظة إنهاء ترتيب الملابس',
    enPhrase: 'captured while finishing a subtle outfit adjustment',
  },
  {
    value: 'pausing_mid_step',
    groupAr: '4. لحظات الحركة الطبيعية',
    labelAr: 'توقف لحظي في منتصف خطوة',
    enPhrase: 'captured pausing briefly mid-step with natural balance',
  },
];

export const MIRROR_EXPRESSION_OPTIONS: OptionItem<MirrorExpressionType>[] = [
  {
    value: 'neutral_exact_lock',
    labelAr: 'استرخاء تام (حفاظ على الملامح المرجعية)',
    descAr: 'وجه مسترخٍ محايد مع الحفاظ على ملامح وتناسب الوجه من الصورة المرجعية.',
    enPhrase:
      'Neutral resting expression, aiming to keep facial features and proportions consistent with the reference image.',
  },
  {
    value: 'flash_squint_exact_lock',
    labelAr: 'تضييق العين للفلاش (حفاظ على الملامح المرجعية)',
    descAr: 'تضييق طبيعي للعينين استجابة للفلاش مع الحفاظ على ملامح الصورة المرجعية.',
    enPhrase:
      'Subtle natural squint in response to the bright flash, aiming to keep facial features consistent with the reference image.',
  },
  {
    value: 'flash_squint',
    labelAr: 'تضييق العين لا إرادياً (تفاعل طبيعي مع الفلاش)',
    descAr: 'رد فعل طبيعي تجاه الفلاش الساطع مع شد خفيف حول العينين.',
    enPhrase:
      'Subtle natural squinting reaction to the bright flash with gentle tension around the eyes.',
  },
  {
    value: 'asymmetrical_smirk',
    labelAr: 'ابتسامة جانبية خفيفة جداً',
    descAr: 'ابتسامة جانبية طفيفة وطبيعية عند زاوية الفم.',
    enPhrase:
      'Subtle asymmetrical half-smile on one side with natural skin folding around the corner of the mouth.',
  },
  {
    value: 'neutral_gravity_rest',
    labelAr: 'استرخاء تام (وجه محايد ومسترخٍ)',
    descAr: 'وجه محايد في حالة راحة تامة وعضلات مسترخية.',
    enPhrase:
      'Neutral resting face with relaxed facial muscles.',
  },
  {
    value: 'calm_screen_focus',
    labelAr: 'تركيز هادئ (النظر لشاشة الهاتف في المرآة)',
    descAr: 'عضلات وجه مسترخية مع تركيز العينين لأسفل نحو انعكاس الشاشة.',
    enPhrase:
      'Relaxed facial expression with eyes focused downward toward the phone screen reflection.',
  },
];

export const MIRROR_HAIR_PHYSICS_OPTIONS: OptionItem<MirrorHairPhysicsType>[] = [
  {
    value: 'natural_gravity_lock',
    labelAr: 'شعر طبيعي منسدل (نفس الكثافة)',
    descAr: 'الحفاظ على كثافة الشعر وخط منبت الشعر كما في الصورة المرجعية دون تكثيف اصطناعي.',
    enPhrase:
      'Keep hair density and hairline consistent with the reference image, falling naturally without artificial volume.',
  },
  {
    value: 'pillow_bedhead_messy',
    labelAr: 'فوضوي عشوائي طبيعي',
    descAr: 'الحفاظ على كثافة شعر المرجع مع مظهر منزلي عفوي غير متكلف.',
    enPhrase:
      'Keep reference hair density with a slightly tousled, casual indoor look.',
  },
  {
    value: 'damp_sebum_clumping',
    labelAr: 'شعر متماسك (رطوبة خفيفة ولمعة طبيعية)',
    descAr: 'مطابقة كثافة شعر المرجع مع خصلات رطبة قليلاً تعكس ضوء الفلاش.',
    enPhrase:
      'Keep reference hair density with slightly damp strands showing subtle specular highlights from the light.',
  },
  {
    value: 'pushed_back_casual',
    labelAr: 'شعر مدفوع للخلف عفوياً (إظهار خط الشعر الطبيعي)',
    descAr: 'نفس كثافة المرجع مع دفع الشعر للخلف عفوياً باليد لإظهار خط الشعر الطبيعي.',
    enPhrase:
      'Keep reference hair density with hair pushed back casually from the forehead.',
  },
];

export const MIRROR_CLOTHING_PHYSICS_OPTIONS: OptionItem<MirrorClothingPhysicsType>[] = [
  {
    value: 'white_cotton_tshirt',
    labelAr: 'تيشيرت قطني أبيض',
    descAr: 'تيشيرت قطني أبيض أساسي يتمدد وينثني فيزيائياً بشكل واقعي مع حركة الجسم.',
    enPhrase:
      'Wearing a basic white cotton t-shirt with physical fabric stretching.',
  },
  {
    value: 'dark_oversized_hoodie',
    labelAr: 'سترة بغطاء رأس (Hoodie داكن)',
    descAr: 'هودي داكن واسع بقماش ثقيل وسميك يتجمع طبيعياً حول الكتفين.',
    enPhrase:
      'Wearing a dark oversized hoodie pooling naturally.',
  },
  {
    value: 'ribbed_tank_top',
    labelAr: 'قميص داخلي بدون أكمام (Tank top - يبرز تفاصيل الجلد)',
    descAr: 'قميص داخلي مضلع بدون أكمام يظهر شد القماش عبر الصدر وتفاصيل مسام الجلد على الكتفين والذراعين تحت الفلاش.',
    enPhrase:
      'Wearing a ribbed sleeveless tank top. Fabric tension visible across the chest. Exposed shoulder and arm skin showing natural pores and reacting to the harsh rear flash.',
  },
  {
    value: 'loose_silk_sleepwear',
    labelAr: 'ملابس نوم حريرية واسعة (تفاعل فيزيائي مع لمعان الفلاش)',
    descAr: 'ملابس نوم حريرية واسعة ذات لمعة فيزيائية طبيعية تعكس فلاش LED وتنسدل فوق هندسة الجسم وفق قوانين الجاذبية.',
    enPhrase:
      'Wearing loose silk sleepwear. The fabric has a natural physical sheen reflecting the LED flash, draped loosely over the body geometry following the laws of gravity.',
  },
];

export const MIRROR_BOTTOM_CLOTHING_OPTIONS: OptionItem<MirrorBottomClothingType>[] = [
  {
    value: 'red_athletic_mesh_shorts',
    labelAr: 'شورت رياضي شبكي (أحمر)',
    descAr: 'شورت رياضي شبكي باللون الأحمر بقماش خفيف ينثني طبيعياً مع الحركة.',
    enPhrase:
      'Wearing red athletic mesh shorts, lightweight fabric folding naturally.',
  },
  {
    value: 'black_running_shorts',
    labelAr: 'شورت ركض (أسود)',
    descAr: 'شورت ركض أسود بطيات وتجاعيد قماشية دقيقة.',
    enPhrase:
      'Wearing black running shorts with subtle creases.',
  },
  {
    value: 'navy_sports_track_pants',
    labelAr: 'بنطال رياضي واسع (كحلي)',
    descAr: 'بنطال رياضي واسع باللون الكحلي بقصة مريحة وانسدال قماشي واقعي.',
    enPhrase:
      'Wearing navy blue sports track pants, loose fit with realistic draping.',
  },
  {
    value: 'light_grey_sweatpants',
    labelAr: 'بنطال قطني رياضي (رمادي فاتح)',
    descAr: 'بنطال رياضي قطني سميك باللون الرمادي الفاتح يتفاعل مع الجاذبية.',
    enPhrase:
      'Wearing light grey sweatpants, thick cotton fabric reacting to gravity.',
  },
  {
    value: 'faded_blue_jeans',
    labelAr: 'بنطال جينز (أزرق باهت)',
    descAr: 'بنطال جينز أزرق باهت بتجاعيد فيزيائية طبيعية عند الركبتين.',
    enPhrase:
      'Wearing faded blue denim jeans with natural physical creases at the knees.',
  },
  {
    value: 'dark_grey_sweatpants',
    labelAr: 'بنطال رياضي قطني (رمادي داكن)',
    descAr: 'بنطال رياضي قطني رمادي داكن ينسدل قماشه بارتياح ومرونة فوق الساقين وفق الجاذبية.',
    enPhrase:
      'Wearing dark grey cotton sweatpants, fabric draping loosely and comfortably over the legs following gravity.',
  },
  {
    value: 'tailored_black_trousers',
    labelAr: 'بنطال أسود رسمي (شد قماشي خفيف وظلال عميقة)',
    descAr: 'بنطال أسود مفصل بشد قماشي طفيف عبر الفخذين وظلال عميقة تخفي تفاصيل القماش.',
    enPhrase:
      'Wearing tailored black trousers, subtle fabric tension across the thighs. Deep shadows hiding fabric details.',
  },
];

export const EXPRESSION_OPTIONS: OptionItem<ExpressionType>[] = [
  {
    value: 'subtle_smile',
    labelAr: 'ابتسامة خفيفة',
    enPhrase: 'a subtle, natural smile',
  },
  {
    value: 'natural_expression',
    labelAr: 'تعبير طبيعي',
    enPhrase: 'a relaxed, unforced natural expression',
  },
  {
    value: 'spontaneous_laugh',
    labelAr: 'ضحكة عفوية',
    enPhrase: 'a warm, spontaneous candid laugh',
  },
  {
    value: 'calm_expression',
    labelAr: 'تعبير هادئ',
    enPhrase: 'a serene, composed expression',
  },
  ...MIRROR_EXPRESSION_OPTIONS,
];

export const GAZE_OPTIONS: OptionItem<GazeDirectionType>[] = [
  {
    value: 'at_camera_lens',
    labelAr: 'نحو عدسة الهاتف',
    enPhrase: 'looking directly toward the camera lens',
  },
  {
    value: 'at_phone_screen',
    labelAr: 'نحو شاشة الهاتف',
    enPhrase: 'looking attentively at the smartphone screen',
  },
  {
    value: 'at_mirror_reflection',
    labelAr: 'نحو انعكاس الهاتف في المرآة',
    enPhrase: 'looking at their reflection and the phone screen through the mirror',
  },
];

export const CLOTHING_OPTIONS: OptionItem<ClothingType>[] = [
  {
    value: 'tshirt_and_pants',
    labelAr: 'تيشيرت وبنطال مريح',
    enPhrase: 'a plain crew-neck T-shirt and comfortable casual trousers',
  },
  {
    value: 'modest_pajamas',
    labelAr: 'بيجامة محتشمة',
    enPhrase: 'a modest, comfortable long-sleeved pajama set',
  },
  {
    value: 'hoodie_and_pants',
    labelAr: 'هودي وبنطال',
    enPhrase: 'a soft pullover hoodie paired with relaxed sweatpants',
  },
  {
    value: 'simple_loungewear',
    labelAr: 'ملابس منزلية بسيطة',
    enPhrase: 'simple, neat everyday indoor loungewear',
  },
  ...MIRROR_CLOTHING_PHYSICS_OPTIONS,
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على ملابس المرجع',
    enPhrase: 'the exact same outfit worn in the reference image',
  },
  {
    value: 'custom_clothing',
    labelAr: 'وصف مخصص',
    enPhrase: 'custom modest indoor attire',
  },
];

export const CLOTHING_COLOR_OPTIONS: OptionItem<ClothingColorType>[] = [
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على ملابس المرجع',
    enPhrase: 'preserving the original garment colors from the reference photo',
  },
  {
    value: 'beige',
    labelAr: 'بيج',
    enPhrase: 'warm beige and neutral tones',
  },
  {
    value: 'white',
    labelAr: 'أبيض',
    enPhrase: 'clean crisp white fabric',
  },
  {
    value: 'black',
    labelAr: 'أسود',
    enPhrase: 'matte black fabric',
  },
  {
    value: 'gray',
    labelAr: 'رمادي',
    enPhrase: 'soft heather gray tones',
  },
  {
    value: 'blue',
    labelAr: 'أزرق',
    enPhrase: 'muted navy and slate blue tones',
  },
  {
    value: 'custom_color',
    labelAr: 'لون مخصص',
    enPhrase: 'custom color palette',
  },
];

export const UPPER_GARMENT_OPTIONS: OptionItem<UpperGarmentType>[] = [
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على ملابس المرجع العلوية',
    descAr: 'يبقي القطعة العلوية الأصلية كما هي في الصورة المرجعية دون تغيير لونها أو خامتها أو قصّتها',
    enPhrase: 'the original upper-body garment preserved from the reference image',
  },
  {
    value: 'crew_neck_tshirt',
    labelAr: 'تيشيرت برقبة دائرية',
    descAr: 'تيشيرت يومي كلاسيكي برقبة دائرية محتشمة',
    enPhrase: 'a crew-neck T-shirt',
  },
  {
    value: 'long_sleeve_tshirt',
    labelAr: 'تيشيرت بأكمام طويلة',
    descAr: 'تيشيرت بأكمام طويلة مريحة للاستخدام المنزلي',
    enPhrase: 'a long-sleeve T-shirt',
  },
  {
    value: 'henley',
    labelAr: 'قميص هينلي (Henley)',
    descAr: 'قميص بأكمام وفتحة أزرار بسيطة عند الياقة',
    enPhrase: 'a modest buttoned henley shirt',
  },
  {
    value: 'polo_shirt',
    labelAr: 'قميص بولو (Polo)',
    descAr: 'قميص بياقة مطوية وأزرار علوية مرتبة',
    enPhrase: 'a classic collared polo shirt',
  },
  {
    value: 'button_up_shirt',
    labelAr: 'قميص بأزرار كاملة',
    descAr: 'قميص كلاسيكي بياقة وأزرار أمامية وأكمام بأساور',
    enPhrase: 'a collared button-up shirt',
  },
  {
    value: 'flannel_shirt',
    labelAr: 'قميص فلانيل',
    descAr: 'قميص فلانيل دافئ بياقة وأساور أكمام',
    enPhrase: 'a casual collared flannel shirt',
  },
  {
    value: 'sweatshirt',
    labelAr: 'سويتشيرت (Sweatshirt)',
    descAr: 'سويتشيرت مريح بدون غطاء رأس بحواف مضلعة',
    enPhrase: 'a crew-neck pullover sweatshirt',
  },
  {
    value: 'hoodie',
    labelAr: 'هودي بغطاء رأس',
    descAr: 'هودي منزلي مريح بغطاء رأس وأساور مضلعة',
    enPhrase: 'a modest pullover hoodie',
  },
  {
    value: 'cardigan',
    labelAr: 'كارديجان (Cardigan)',
    descAr: 'كارديجان محبوك مفتوح أو بأزرار أمامية',
    enPhrase: 'a modest long-sleeve cardigan',
  },
  {
    value: 'knit_sweater',
    labelAr: 'كنزة محبوكة (Knit Sweater)',
    descAr: 'بلوفر أو كنزة محبوكة دافئة بأكمام طويلة',
    enPhrase: 'a modest long-sleeve knit sweater',
  },
  {
    value: 'pajama_top',
    labelAr: 'قطعة بيجامة علوية',
    descAr: 'توب بيجامة محتشم ومريح بياقة أو رقبة دائرية',
    enPhrase: 'a modest long-sleeve pajama top',
  },
  {
    value: 'modest_lounge_top',
    labelAr: 'توب منزلي محتشم',
    descAr: 'قطعة منزلية يومية محتشمة ومريحة',
    enPhrase: 'a modest indoor lounge top',
  },
  {
    value: 'lightweight_overshirt',
    labelAr: 'قميص علوي خفيف (Overshirt)',
    descAr: 'أوفرشيرت خفيف بياقة وأزرار وجيوب صدر بسيطة',
    enPhrase: 'a lightweight collared overshirt',
  },
  {
    value: 'custom_upper_garment',
    labelAr: 'قطعة علوية مخصصة',
    descAr: 'وصف نصي مخصص للقطعة العلوية فقط',
    enPhrase: 'a modest custom upper-body garment',
  },
];

export const UPPER_GARMENT_COLOR_OPTIONS: OptionItem<UpperGarmentColorType>[] = [
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على لون المرجع',
    enPhrase: 'preserving the original upper garment color from the reference photo',
  },
  { value: 'white', labelAr: 'أبيض', enPhrase: 'clean matte white' },
  { value: 'ivory', labelAr: 'عاجي', enPhrase: 'soft warm ivory' },
  { value: 'cream', labelAr: 'كريمي', enPhrase: 'subdued warm cream' },
  { value: 'black', labelAr: 'أسود', enPhrase: 'deep matte black' },
  { value: 'charcoal', labelAr: 'فحمي', enPhrase: 'dark charcoal gray' },
  { value: 'light_gray', labelAr: 'رمادي فاتح', enPhrase: 'soft heather light gray' },
  { value: 'beige', labelAr: 'بيج', enPhrase: 'warm sand beige' },
  { value: 'brown', labelAr: 'بني', enPhrase: 'earthy walnut brown' },
  { value: 'navy', labelAr: 'كحلي', enPhrase: 'deep navy blue' },
  { value: 'denim_blue', labelAr: 'أزرق دنيم', enPhrase: 'muted indigo denim blue' },
  { value: 'sky_blue', labelAr: 'أزرق سماوي', enPhrase: 'soft muted sky blue' },
  { value: 'olive', labelAr: 'زيتوني', enPhrase: 'subdued olive green' },
  { value: 'sage', labelAr: 'أخضر ميرمي (Sage)', enPhrase: 'muted sage green' },
  { value: 'forest_green', labelAr: 'أخضر غامق', enPhrase: 'deep forest green' },
  { value: 'burgundy', labelAr: 'عنابي', enPhrase: 'muted burgundy wine' },
  { value: 'muted_rose', labelAr: 'وردي مطفأ', enPhrase: 'subdued dusty muted rose' },
  {
    value: 'custom_upper_color',
    labelAr: 'لون مخصص',
    enPhrase: 'custom upper garment color',
  },
];

export const UPPER_GARMENT_MATERIAL_OPTIONS: OptionItem<UpperGarmentMaterialType>[] = [
  {
    value: 'cotton_jersey',
    labelAr: 'قطن جيرسي (Cotton Jersey)',
    descAr: 'نسيج قطني ناعم ومطفأ مناسب للتيشيرتات والقطع اليومية',
    enPhrase: 'cotton jersey',
  },
  {
    value: 'ribbed_cotton',
    labelAr: 'قطن مضلع (Ribbed Cotton)',
    descAr: 'نسيج قطني بأضلاع طولية واضحة وسُمك متماسك',
    enPhrase: 'ribbed cotton',
  },
  {
    value: 'french_terry',
    labelAr: 'فرينش تيري (French Terry)',
    descAr: 'نسيج قطني متوسط السُمك للسويتشيرت والهودي',
    enPhrase: 'French terry',
  },
  {
    value: 'fleece',
    labelAr: 'فليس (Fleece)',
    descAr: 'قماش دافئ وسميك بملمس ناعم ومبطن',
    enPhrase: 'brushed fleece',
  },
  {
    value: 'cotton_poplin',
    labelAr: 'قطن بوبلين (Cotton Poplin)',
    descAr: 'نسيج قطني منسوج بدقة لقمصان الأزرار والبيجامات المرتبة',
    enPhrase: 'cotton poplin',
  },
  {
    value: 'flannel',
    labelAr: 'فلانيل (Flannel)',
    descAr: 'نسيج قطني ممشط دافئ لقمصان الفلانيل والأوفرشيرت',
    enPhrase: 'brushed flannel',
  },
  {
    value: 'knit',
    labelAr: 'محبوك (Knit)',
    descAr: 'خيوط تريكو محبوكة واضحة الغرز للكنزات والكارديجان',
    enPhrase: 'medium-gauge knit',
  },
  {
    value: 'linen_cotton_blend',
    labelAr: 'مزيج كتان وقطن',
    descAr: 'نسيج مسامي خفيف بألياف كتان وقطن طبيعية',
    enPhrase: 'linen-cotton blend',
  },
  {
    value: 'waffle_knit',
    labelAr: 'وافل نيت (Waffle Knit)',
    descAr: 'نسيج وافل شبكي ذو ملمس هندسي بارز ومسامي',
    enPhrase: 'waffle-knit cotton',
  },
  {
    value: 'chambray_denim',
    labelAr: 'شامبراي / دنيم خفيف',
    descAr: 'مناسب للقمصان ذات الأزرار والأوفرشيرت فقط',
    enPhrase: 'chambray denim',
  },
];

export const UPPER_GARMENT_FIT_OPTIONS: OptionItem<UpperGarmentFitType>[] = [
  {
    value: 'regular',
    labelAr: 'قصة اعتيادية (Regular)',
    descAr: 'توازن طبيعي ومحتشم حول الكتفين والصدر',
    enPhrase: 'regular fit',
  },
  {
    value: 'relaxed',
    labelAr: 'قصة مريحة (Relaxed)',
    descAr: 'اتساع مريح ومحتشم يسمح بانسدال طبيعي',
    enPhrase: 'relaxed fit',
  },
  {
    value: 'oversized',
    labelAr: 'قصة واسعة (Oversized)',
    descAr: 'اتساع واضح وطيّات قماش غنية متأثرة بالجاذبية',
    enPhrase: 'oversized fit',
  },
  {
    value: 'fitted',
    labelAr: 'قصة متناسقة محتشمة (Fitted)',
    descAr: 'متناسقة باحتشام دون شدّ ضيق أو التصاق مبالغ فيه',
    enPhrase: 'modest fitted silhouette without tight cling',
  },
];

export const UPPER_GARMENT_PATTERN_OPTIONS: OptionItem<UpperGarmentPatternType>[] = [
  {
    value: 'solid',
    labelAr: 'سادة (Solid)',
    descAr: 'لون موحد بدون نقوش أو شعارات',
    enPhrase: 'solid weave without logos or prints',
  },
  {
    value: 'stripes',
    labelAr: 'مخطط (Stripes)',
    descAr: 'خطوط منسوجة هادئة ومتناسقة',
    enPhrase: 'subtle woven stripes without logos or text',
  },
  {
    value: 'plaid',
    labelAr: 'كاروهات (Plaid)',
    descAr: 'مربعات كاروهات منسوجة كلاسيكية',
    enPhrase: 'woven plaid pattern without logos or text',
  },
  {
    value: 'subtle_texture',
    labelAr: 'ملمس نسيجي خفيف',
    descAr: 'تنوع دقيق في غزل الخيوط دون رسومات',
    enPhrase: 'subtle woven heather texture without logos or text',
  },
];

export const LOWER_GARMENT_OPTIONS: OptionItem<LowerGarmentType>[] = [
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على ملابس المرجع السفلية',
    descAr: 'يبقي القطعة السفلية الأصلية كما هي في الصورة المرجعية دون تغيير لونها أو خامتها أو قصّتها',
    enPhrase: 'the original lower-body garment preserved from the reference image',
  },
  {
    value: 'tailored_trousers',
    labelAr: 'بنطال رسمي مفصل (Trousers)',
    descAr: 'بنطال كلاسيكي بقصة مرتبة وثنية أمامية بسيطة',
    enPhrase: 'tailored trousers',
  },
  {
    value: 'relaxed_trousers',
    labelAr: 'بنطال قماشي مريح',
    descAr: 'بنطال يومي مريح بانسدال طبيعي محتشم',
    enPhrase: 'relaxed casual trousers',
  },
  {
    value: 'chinos',
    labelAr: 'بنطال تشينو (Chinos)',
    descAr: 'بنطال تويل قطني يومي بجيوب جانبية مرتبة',
    enPhrase: 'cotton chinos trousers',
  },
  {
    value: 'jeans',
    labelAr: 'بنطال جينز (Jeans)',
    descAr: 'بنطال دنيم يومي بدرزات جينز وتجاعيد طبيعية عند الركبة',
    enPhrase: 'denim jeans',
  },
  {
    value: 'sweatpants',
    labelAr: 'بنطال قطني رياضي (Sweatpants)',
    descAr: 'بنطال رياضي قطني دافئ بخصر مطاطي وانسدال مريح',
    enPhrase: 'cotton sweatpants',
  },
  {
    value: 'joggers',
    labelAr: 'بنطال جوجرز (Joggers)',
    descAr: 'بنطال مريح بحواف مضلعة عند الكاحل',
    enPhrase: 'tapered cuffed joggers',
  },
  {
    value: 'lounge_pants',
    labelAr: 'بنطال منزلي خفيف (Lounge Pants)',
    descAr: 'بنطال منزلي مسامي وخفيف للاستخدام اليومي',
    enPhrase: 'comfortable indoor lounge pants',
  },
  {
    value: 'pajama_pants',
    labelAr: 'بنطال بيجامة محتشم',
    descAr: 'بنطال نوم قطني طويل ومريح بخصر مطاطي',
    enPhrase: 'modest long pajama pants',
  },
  {
    value: 'track_pants',
    labelAr: 'بنطال تراك رياضي (Track Pants)',
    descAr: 'بنطال رياضي خفيف منسوج بقصة مريحة',
    enPhrase: 'sports track pants',
  },
  {
    value: 'athletic_shorts',
    labelAr: 'شورت رياضي (Athletic Shorts)',
    descAr: 'شورت رياضي خفيف ومتنفس للحركة',
    enPhrase: 'athletic shorts',
  },
  {
    value: 'modest_shorts',
    labelAr: 'شورت منزلي محتشم (بطول الركبة)',
    descAr: 'شورت يومي مريح بطول يصل إلى الركبة',
    enPhrase: 'modest knee-length casual shorts',
  },
  {
    value: 'midi_long_skirt',
    labelAr: 'تنورة متوسطة/طويلة محتشمة',
    descAr: 'تنورة ميدي أو طويلة محتشمة بانسدال قماشي طبيعي',
    enPhrase: 'a modest midi-length skirt',
  },
  {
    value: 'custom_lower_garment',
    labelAr: 'قطعة سفلية مخصصة',
    descAr: 'وصف نصي مخصص للقطعة السفلية فقط',
    enPhrase: 'a modest custom lower-body garment',
  },
];

export const LOWER_GARMENT_COLOR_OPTIONS: OptionItem<LowerGarmentColorType>[] = [
  {
    value: 'preserve_reference',
    labelAr: 'الحفاظ على لون المرجع',
    enPhrase: 'preserving the original lower garment color from the reference photo',
  },
  { value: 'black', labelAr: 'أسود', enPhrase: 'deep matte black' },
  { value: 'charcoal', labelAr: 'فحمي', enPhrase: 'dark charcoal gray' },
  { value: 'light_gray', labelAr: 'رمادي فاتح', enPhrase: 'soft heather light gray' },
  { value: 'beige', labelAr: 'بيج', enPhrase: 'warm sand beige' },
  { value: 'brown', labelAr: 'بني', enPhrase: 'earthy walnut brown' },
  { value: 'navy', labelAr: 'كحلي', enPhrase: 'deep navy blue' },
  { value: 'denim_blue', labelAr: 'أزرق دنيم', enPhrase: 'faded indigo denim blue' },
  { value: 'sky_blue', labelAr: 'أزرق سماوي', enPhrase: 'soft muted sky blue' },
  { value: 'olive', labelAr: 'زيتوني', enPhrase: 'subdued olive green' },
  { value: 'sage', labelAr: 'أخضر ميرمي (Sage)', enPhrase: 'muted sage green' },
  { value: 'forest_green', labelAr: 'أخضر غامق', enPhrase: 'deep forest green' },
  { value: 'white', labelAr: 'أبيض', enPhrase: 'clean matte white' },
  { value: 'ivory', labelAr: 'عاجي', enPhrase: 'soft warm ivory' },
  { value: 'cream', labelAr: 'كريمي', enPhrase: 'subdued warm cream' },
  { value: 'burgundy', labelAr: 'عنابي', enPhrase: 'muted burgundy wine' },
  { value: 'red', labelAr: 'أحمر رياضي', enPhrase: 'rich matte red' },
  { value: 'muted_rose', labelAr: 'وردي مطفأ', enPhrase: 'subdued dusty muted rose' },
  {
    value: 'custom_lower_color',
    labelAr: 'لون مخصص',
    enPhrase: 'custom lower garment color',
  },
];

export const LOWER_GARMENT_MATERIAL_OPTIONS: OptionItem<LowerGarmentMaterialType>[] = [
  {
    value: 'cotton_twill',
    labelAr: 'قطن تويل (Cotton Twill)',
    descAr: 'نسيج قطني متماسك للبنطال اليومي والتشينو',
    enPhrase: 'cotton twill',
  },
  {
    value: 'denim',
    labelAr: 'دنيم / جينز (Denim)',
    descAr: 'قماش جينز مائل النسج بسُمك متوسط ودرزات متينة',
    enPhrase: 'woven denim',
  },
  {
    value: 'fleece',
    labelAr: 'فليس قطني (Fleece)',
    descAr: 'قماش قطني دافئ ومبطن لبنطال الرياضة والمنزل',
    enPhrase: 'brushed cotton fleece',
  },
  {
    value: 'french_terry',
    labelAr: 'فرينش تيري (French Terry)',
    descAr: 'نسيج قطني متوسط السُمك للجوجرز والملابس المريحة',
    enPhrase: 'French terry cotton',
  },
  {
    value: 'cotton_jersey',
    labelAr: 'قطن جيرسي (Cotton Jersey)',
    descAr: 'قطن ناعم وخفيف مناسب للبناطيل المنزلية والبيجامات',
    enPhrase: 'soft cotton jersey',
  },
  {
    value: 'cotton_poplin',
    labelAr: 'قطن بوبلين (Cotton Poplin)',
    descAr: 'قطن منسوج خفيف ومرتب لبناطيل البيجامة والتنانير الخفيفة',
    enPhrase: 'cotton poplin',
  },
  {
    value: 'linen_cotton_blend',
    labelAr: 'مزيج كتان وقطن',
    descAr: 'نسيج مسامي خفيف بانسدال طبيعي مريح',
    enPhrase: 'linen-cotton blend',
  },
  {
    value: 'wool_blend_suiting',
    labelAr: 'قماش رسمي ناعم (Suiting)',
    descAr: 'نسيج رسمي متوسط الوزن لبناطيل البدلات والتفصيل',
    enPhrase: 'matte wool-blend suiting',
  },
  {
    value: 'athletic_mesh',
    labelAr: 'نسيج شبكي رياضي (Mesh)',
    descAr: 'قماش شبكي خفيف ومسامي للشورتات الرياضية فقط',
    enPhrase: 'breathable athletic mesh',
  },
  {
    value: 'nylon_track_weave',
    labelAr: 'نسيج رياضي ناعم (Track Weave)',
    descAr: 'قماش رياضي خفيف مطفأ مناسب للتراك والشورت الرياضي',
    enPhrase: 'matte athletic track weave',
  },
  {
    value: 'ribbed_knit',
    labelAr: 'تريكو مضلع (Ribbed Knit)',
    descAr: 'نسيج مضلع ناعم مناسب للبناطيل المنزلية والتنانير الميدي',
    enPhrase: 'ribbed knit',
  },
];

export const LOWER_GARMENT_FIT_OPTIONS: OptionItem<LowerGarmentFitType>[] = [
  {
    value: 'regular',
    labelAr: 'قصة اعتيادية (Regular)',
    descAr: 'اتزان طبيعي حول الخصر والفخذين دون ضيق',
    enPhrase: 'regular fit',
  },
  {
    value: 'relaxed',
    labelAr: 'قصة مريحة (Relaxed)',
    descAr: 'اتساع مريح ومحتشم يسمح بثنيات طبيعية',
    enPhrase: 'relaxed fit',
  },
  {
    value: 'straight',
    labelAr: 'قصة مستقيمة (Straight)',
    descAr: 'امتداد مستقيم من الركبة إلى الكاحل',
    enPhrase: 'straight-leg fit',
  },
  {
    value: 'tapered',
    labelAr: 'قصة متدرجة (Tapered)',
    descAr: 'مريحة عند الفخذ وتضيق تدريجيًا عند الكاحل',
    enPhrase: 'tapered fit',
  },
  {
    value: 'wide_leg',
    labelAr: 'أرجل واسعة (Wide-Leg)',
    descAr: 'انسدال واسع ومحتشم من الخصر للأسفل',
    enPhrase: 'wide-leg fit',
  },
  {
    value: 'loose_baggy',
    labelAr: 'فضفاضة (Loose)',
    descAr: 'اتساع واضح وطيات غنية تتجمع فوق الكاحل',
    enPhrase: 'loose oversized fit',
  },
];

export const LOWER_GARMENT_PATTERN_OPTIONS: OptionItem<LowerGarmentPatternType>[] = [
  {
    value: 'solid',
    labelAr: 'سادة (Solid)',
    descAr: 'لون موحد بدون نقوش أو شعارات',
    enPhrase: 'solid weave without logos or prints',
  },
  {
    value: 'subtle_texture',
    labelAr: 'ملمس نسيجي خفيف',
    descAr: 'تنوع دقيق في غزل الخيوط أو الملمس الطبيعي',
    enPhrase: 'subtle woven texture without logos or text',
  },
  {
    value: 'stripes',
    labelAr: 'خطوط رفيعة (Pinstripe)',
    descAr: 'تخطيط منسوج هادئ دون رسومات',
    enPhrase: 'subtle woven stripes without logos or text',
  },
  {
    value: 'plaid',
    labelAr: 'كاروهات (Plaid)',
    descAr: 'مربعات منسوجة للبيجامة أو البنطال الكلاسيكي',
    enPhrase: 'woven plaid pattern without logos or text',
  },
  {
    value: 'washed_fade',
    labelAr: 'بهتان غسيل طبيعي (Washed)',
    descAr: 'مظهر غسيل خفيف طبيعي مخصص لقماش الجينز',
    enPhrase: 'subtle natural washed fade without distressed holes or logos',
  },
  {
    value: 'side_stripe',
    labelAr: 'خط جانبي رياضي بسيط',
    descAr: 'شريط جانبي طولي هادئ خاص بالملابس الرياضية فقط',
    enPhrase: 'minimal tonal side seam stripe without brand logos or text',
  },
];

export const HAIR_OPTIONS: OptionItem<HairType>[] = [
  {
    value: 'match_reference',
    labelAr: 'مطابق للصورة المرجعية',
    enPhrase: 'preserving their exact hairstyle and hair texture from the reference image',
  },
  {
    value: 'neatly_styled',
    labelAr: 'مرتب بشكل بسيط',
    enPhrase: 'keeping the same hair length and color but neatly and simply groomed',
  },
  {
    value: 'slightly_casual',
    labelAr: 'عفوي قليلًا',
    enPhrase: 'keeping their natural hair with a slightly relaxed, effortless indoor look',
  },
  ...MIRROR_HAIR_PHYSICS_OPTIONS,
];

export const SKIN_TEXTURE_OPTIONS: OptionItem<SkinTextureType>[] = [
  {
    value: 'raw_authentic',
    labelAr: 'واقعية خام',
    descAr: 'إبراز المسام والتفاصيل الدقيقة',
    enPhrase: 'raw unedited skin, clearly visible pores, authentic micro-details',
  },
  {
    value: 'balanced_natural',
    labelAr: 'طبيعية متوازنة',
    descAr: 'مظهر طبيعي بتباين إضاءة هادئ',
    enPhrase: 'natural skin texture, balanced lighting, preserving authentic features',
  },
  {
    value: 'cinematic_clean',
    labelAr: 'نقاء سينمائي',
    descAr: 'مظهر نقي بدون فلاتر تجميل',
    enPhrase: 'cinematic clean skin, authentic biological proportions, ZERO plastic or waxy finish',
  },
];

export const ROOM_STYLE_OPTIONS: OptionItem<RoomStyleType>[] = [
  {
    value: 'modern_minimal',
    labelAr: 'عصرية بسيطة',
    enPhrase: 'a clean, modern minimalist bedroom',
  },
  {
    value: 'warm_cozy',
    labelAr: 'دافئة ومريحة',
    enPhrase: 'a warm, cozy inviting bedroom',
  },
  {
    value: 'hotel_luxury',
    labelAr: 'فندقية',
    enPhrase: 'an upscale, neatly appointed hotel-style bedroom',
  },
  {
    value: 'classic',
    labelAr: 'كلاسيكية',
    enPhrase: 'a timeless classic bedroom with traditional moldings and furniture',
  },
  {
    value: 'compact_realistic',
    labelAr: 'صغيرة وواقعية',
    enPhrase: 'a compact, realistic everyday bedroom with authentic proportions',
  },
];

export const ROOM_TIDINESS_OPTIONS: OptionItem<RoomTidinessType>[] = [
  {
    value: 'tidy',
    labelAr: 'مرتبة',
    enPhrase: 'neatly arranged with smooth, tidy surfaces',
  },
  {
    value: 'lived_in_natural',
    labelAr: 'مستخدمة بشكل طبيعي مع فوضى خفيفة',
    enPhrase: 'naturally lived-in with subtle, realistic everyday details like slightly rumpled bedding',
  },
];

export const ROOM_COLOR_OPTIONS: OptionItem<RoomColorType>[] = [
  {
    value: 'white_and_beige',
    labelAr: 'أبيض وبيج',
    enPhrase: 'a soft white and warm beige palette',
  },
  {
    value: 'warm_wood',
    labelAr: 'خشبي ودافئ',
    enPhrase: 'warm natural wood tones and earthy textiles',
  },
  {
    value: 'neutral_gray',
    labelAr: 'رمادي محايد',
    enPhrase: 'balanced neutral gray and muted stone hues',
  },
  {
    value: 'calm_tones',
    labelAr: 'ألوان هادئة',
    enPhrase: 'calm, muted pastel and oatmeal tones',
  },
  {
    value: 'custom_room_colors',
    labelAr: 'وصف مخصص',
    enPhrase: 'custom room color scheme',
  },
];

export const BACKGROUND_OPTIONS: OptionItem<BackgroundType>[] = [
  {
    value: 'bed_and_nightstand',
    labelAr: 'سرير وطاولة جانبية',
    enPhrase: 'neutral bedding, upholstered pillows, and a wooden bedside table in the background',
  },
  {
    value: 'window_and_curtains',
    labelAr: 'نافذة وستائر',
    enPhrase: 'a bedroom window framed by softly draped sheer and fabric curtains behind them',
  },
  {
    value: 'wardrobe',
    labelAr: 'خزانة',
    enPhrase: 'a clean wooden wardrobe and subtle bedroom wall decor in the background',
  },
  {
    value: 'full_length_mirror',
    labelAr: 'مرآة طويلة',
    enPhrase: 'a tall floor-length bedroom mirror reflecting the bed and tidy room interior',
  },
];

export const LIGHTING_OPTIONS: OptionItem<LightingType>[] = [
  {
    value: 'morning_window',
    labelAr: 'ضوء صباح من النافذة',
    enPhrase: 'soft morning window light gently illuminating the room',
  },
  {
    value: 'soft_daylight',
    labelAr: 'ضوء نهاري ناعم',
    enPhrase: 'even, diffused natural daylight filtering through the bedroom window',
  },
  {
    value: 'late_afternoon',
    labelAr: 'شمس العصر',
    enPhrase: 'warm late-afternoon sunlight casting gentle golden shadows across the room',
  },
  {
    value: 'warm_bedside_lamp',
    labelAr: 'مصباح جانبي دافئ',
    enPhrase: 'cozy warm ambient light from a bedside lamp',
  },
  {
    value: 'calm_ceiling_light',
    labelAr: 'إضاءة سقف هادئة',
    enPhrase: 'soft, balanced overhead bedroom lighting',
  },
  {
    value: 'mode_a_phone_screen_dark',
    labelAr: 'الوضع A: شاشة الهاتف فقط (غرفة مظلمة)',
    enPhrase: 'localized soft illumination emitted solely by the phone screen in a completely dark room with deep natural shadows',
  },
  {
    value: 'mode_b_phone_flash_mirror_dark',
    labelAr: 'الوضع B: فلاش الهاتف في المرآة (غرفة مظلمة)',
    enPhrase: 'direct camera flash in a dark room reflecting off the mirror with physically accurate flash glare and shadow falloff',
  },
];

export const PHONE_COLOR_OPTIONS: OptionItem<PhoneVisibilityColorType>[] = [
  {
    value: 'hidden_front_camera',
    labelAr: 'غير ظاهر بسبب التصوير بالكاميرا الأمامية',
    enPhrase: 'with the smartphone kept completely outside the frame',
  },
  {
    value: 'black',
    labelAr: 'هاتف أسود في المرآة',
    enPhrase: 'holding a sleek black smartphone',
  },
  {
    value: 'silver',
    labelAr: 'هاتف فضي في المرآة',
    enPhrase: 'holding a silver metallic smartphone',
  },
  {
    value: 'custom_phone_color',
    labelAr: 'بلون مخصص في المرآة',
    enPhrase: 'holding a smartphone',
  },
];

export const PHONE_HAND_OPTIONS: OptionItem<PhoneHandType>[] = [
  {
    value: 'right_hand',
    labelAr: 'اليد اليمنى',
    enPhrase: 'in the right hand',
  },
  {
    value: 'left_hand',
    labelAr: 'اليد اليسرى',
    enPhrase: 'in the left hand',
  },
  {
    value: 'both_hands',
    labelAr: 'كلتا اليدين',
    enPhrase: 'steadily with both hands',
  },
];

export const PHOTO_VIBE_OPTIONS: OptionItem<PhotoVibeType>[] = [
  {
    value: 'candid_phone_shot',
    labelAr: 'لقطة هاتف عفوية',
    enPhrase: 'the casual, unposed appearance of a candid smartphone snapshot',
  },
  {
    value: 'realistic_daily_selfie',
    labelAr: 'سيلفي يومي واقعي',
    enPhrase: 'the authentic look of an everyday smartphone photograph',
  },
  {
    value: 'neat_natural_shot',
    labelAr: 'لقطة مرتبة وطبيعية',
    enPhrase: 'a clean, well-composed yet natural smartphone portrait',
  },
];

export const IMAGE_TREATMENT_OPTIONS: OptionItem<ImageTreatmentType>[] = [
  {
    value: 'no_beauty_filter',
    labelAr: 'دون فلتر تجميلي',
    enPhrase: 'without beauty filters or artificial skin smoothing',
  },
  {
    value: 'natural_colors',
    labelAr: 'ألوان طبيعية',
    enPhrase: 'true-to-life natural color rendition',
  },
  {
    value: 'soft_contrast',
    labelAr: 'تباين ناعم',
    enPhrase: 'gentle highlight roll-off and soft contrast',
  },
  {
    value: 'subtle_grain',
    labelAr: 'حبيبات خفيفة',
    enPhrase: 'subtle, realistic mobile sensor texture',
  },
];

export const MIRROR_ASPECT_RATIO_OPTIONS: OptionItem<AspectRatioType>[] = [
  {
    value: '9:16',
    labelAr: 'طولي 9:16 (تصوير هاتف قياسي - سيلفي)',
    descAr: 'الأمثل لتصوير الهواتف الذكية العمودي ولقطات المرآة.',
    enPhrase: 'Vertical 9:16 Aspect Ratio (Smartphone Portrait)',
  },
  {
    value: '3:4',
    labelAr: 'طولي 3:4 (تصوير فوتوغرافي عمودي)',
    descAr: 'توازن كلاسيكي عمودي لمستشعر الكاميرا الخلفية.',
    enPhrase: 'Vertical 3:4 Aspect Ratio (Photography Portrait)',
  },
  {
    value: '1:1',
    labelAr: 'مربع 1:1 (مناسب لمنشورات التواصل الاجتماعي)',
    descAr: 'إطار مربع متناسق للمنشورات.',
    enPhrase: 'Square 1:1 Aspect Ratio (Social Media)',
  },
  {
    value: '16:9',
    labelAr: 'عرضي 16:9 (تصوير أفقي)',
    descAr: 'إطار أفقي عريض للمشهد الداخلي.',
    enPhrase: 'Horizontal 16:9 Aspect Ratio (Landscape)',
  },
];

export const ASPECT_RATIO_OPTIONS: { value: AspectRatioType; labelAr: string; descAr: string }[] = [
  { value: '9:16', labelAr: '9:16 (طولي للهاتف)', descAr: 'الأمثل لصور السيلفي والستوري' },
  { value: '3:4', labelAr: '3:4 (بورتريه قياسي)', descAr: 'توازن كلاسيكي لكاميرا الهاتف' },
  { value: '2:3', labelAr: '2:3 (طولي متوازن)', descAr: 'مناسب لكامل الجسم أو نصف الجسم' },
  { value: '1:1', labelAr: '1:1 (مربع)', descAr: 'مناسب للمنشورات المربعة' },
  { value: '4:3', labelAr: '4:3 (أفقي كلاسيكي)', descAr: 'يُظهر تفاصيل أكثر من غرفة النوم' },
  { value: '3:2', labelAr: '3:2 (أفقي واسع)', descAr: 'إطار واسع للمشهد الداخلي' },
  { value: '16:9', labelAr: '16:9 (بانورامي)', descAr: 'عرض سينمائي عريض للغرفة' },
  { value: '21:9', labelAr: '21:9 (فائق العرض)', descAr: 'إطار عريض جدًا للمشهد الكامل' },
];

export const DEFAULT_SELECTIONS: SelfieSelections = {
  userConcept: '',
  workflowMode: 'strict_editing',
  strictLightingMode: 'mode_a_screen',
  screenOrientation: 'facing_subject',
  flashMirrorGeometry: 'natural_glare',
  lowerBodyColor: 'charcoal_black',
  customLowerBodyColorText: '',
  strictOutputFormat: 'concise_prompt',
  selfieType: 'front_camera',
  framing: 'three_quarter',
  cameraAngle: 'eye_level',
  pose: 'pose_side_lying',
  expression: 'subtle_smile',
  gaze: 'at_camera_lens',
  clothing: 'tshirt_and_pants',
  customClothingText: '',
  clothingColor: 'beige',
  customClothingColorText: '',
  hair: 'match_reference',
  skinTexture: 'raw_authentic',
  roomStyle: 'warm_cozy',
  roomTidiness: 'tidy',
  roomColors: 'white_and_beige',
  customRoomColorsText: '',
  background: 'bed_and_nightstand',
  lighting: 'morning_window',
  mixedLightingEnabled: false,
  secondaryLighting: undefined,
  phoneColor: 'hidden_front_camera',
  customPhoneColorText: '',
  phoneHand: 'right_hand',
  keepFaceUnobstructed: true,
  photoVibe: 'realistic_daily_selfie',
  imageTreatments: ['no_beauty_filter', 'natural_colors'],
  customDetails: '',
  aspectRatio: '9:16',
  mirrorGaze: 'gaze_phone_screen',
  mirrorPose: 'pose_contrapposto_standing',
  mirrorExpression: 'neutral_exact_lock',
  mirrorHair: 'natural_gravity_lock',
  mirrorClothing: 'white_cotton_tshirt',
  mirrorBottomClothing: 'red_athletic_mesh_shorts',
  deviceModel: 'Xiaomi 15 Ultra',
  strictUpperClothingEditEnabled: false,
  mirrorLensProfile: 'main_23mm',
  mirrorStance: 'balanced_relaxed',
  mirrorTorsoOrientation: 'slight_angle_head_turned',
  mirrorPhonePosition: 'chest_level',
  mirrorFreeHandAction: 'none_relaxed',
  mirrorMovementMoment: 'still_composed',
  mirrorMotionBlurEnabled: false,
  mirrorSupportObject: undefined,
  mirrorPoseEnergy: 'relaxed',
  lockedFields: [],
};
