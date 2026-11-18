import { describe, it, expect } from 'vitest';
import {
  DEFAULT_SELECTIONS,
  EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION,
  FRONT_POSE_OPTIONS,
  MIRROR_BOTTOM_CLOTHING_OPTIONS,
  MIRROR_CLOTHING_PHYSICS_OPTIONS,
  MIRROR_EXPRESSION_OPTIONS,
  MIRROR_GAZE_OPTIONS,
  MIRROR_HAIR_PHYSICS_OPTIONS,
  MIRROR_POSE_OPTIONS,
  MIRROR_POSE_PRESET_SPECS,
  POSE_OPTIONS,
  REAR_CAMERA_POSE_OPTIONS,
  REFERENCE_FACE_PRESERVATION_RULE,
  SelfieSelections,
  SKIN_TEXTURE_OPTIONS,
  STRICT_IMAGE_EDITING_SYSTEM_INSTRUCTION,
} from '../types/selfie';
import {
  buildDeterministicEnglishPrompt,
  buildGeminiGenerateContentRequest,
  buildMirrorStudioJsonPrompt,
  buildPhysicalCausalityInstruction,
  buildPromptGenerationRequestBody,
  buildStrictEditingPrompt,
  buildUserConceptPayload,
  callWithTransientRetry,
  classifyGeminiFallbackReason,
  cleanGeneratedPromptText,
  CONCISE_REFERENCE_FACE_PRESERVATION_RULE,
  detectSelectionConflicts,
  enforceCompatibilityRules,
  evaluateLockedMirrorConflicts,
  executeGeminiPromptGeneration,
  extractMarkdownCodeBlockContent,
  GeminiGenerateContentParams,
  generateConsistentMirrorPoseBundle,
  generateConsistentRandomSelections,
  getCompatibleFitsForGarment,
  getCompatibleMaterialsForGarment,
  getCompatibleMirrorPoseOptions,
  getCompatiblePatternsForGarment,
  hydrateLegacyClothingSelections,
  hydrateLegacySelections,
  isTransientGeminiError,
  MAX_REFERENCE_IMAGE_BYTES,
  MIRROR_POSE_CATEGORY_LIST,
  normalizeSelections,
  PHYSICAL_CAUSALITY_RULE,
  reconcileSceneWithImageAnalysis,
  renderScenePrompt,
  resolveClientGenerationOutcome,
  resolvePromptConflicts,
  resolveSceneConflicts,
  resolveValidatedPromptOrFallback,
  sanitizeCustomText,
  sanitizeReferenceImageAnalysis,
  solveBiomechanicsAndPhysics,
  validateAndAuditFinalPrompt,
  validatePromptOutput,
  validateReferenceImageInput,
  validateSceneSelections,
  validateStrictLightingSelection,
  wrapInMarkdownCodeBlock,
} from './promptRules';

describe('Prompt Generation Utils', () => {
  it('rejects mirror output that loses or swaps the selected physical phone hand', () => {
    const selections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      phoneHand: 'right_hand',
      mirrorPhonePosition: 'chest_level',
      mirrorTorsoOrientation: 'facing_mirror',
    };
    const baseline = JSON.parse(buildMirrorStudioJsonPrompt(selections));
    expect(validatePromptOutput(JSON.stringify(baseline), selections).valid).toBe(true);

    const missingPose = { ...baseline };
    delete missingPose.POSE_COMPOSITION;
    expect(validatePromptOutput(JSON.stringify(missingPose), selections).valid).toBe(false);

    const wrongHand = {
      ...baseline,
      POSE_COMPOSITION: { ...baseline.POSE_COMPOSITION, phone_hand: 'left_hand' },
    };
    expect(validatePromptOutput(JSON.stringify(wrongHand), selections).valid).toBe(false);

    const wrongHoldingArm = {
      ...baseline,
      POSE_COMPOSITION: {
        ...baseline.POSE_COMPOSITION,
        anatomical_hand_mechanics: 'holding a single smartphone in the anatomical left hand',
      },
    };
    expect(validatePromptOutput(JSON.stringify(wrongHoldingArm), selections).valid).toBe(false);

    const swappedReflection = {
      ...baseline,
      POSE_COMPOSITION: {
        ...baseline.POSE_COMPOSITION,
        mirror_reflection_side: 'anatomical left arm as the phone-holding side and anatomical right arm as the free side',
      },
    };
    expect(validatePromptOutput(JSON.stringify(swappedReflection), selections).valid).toBe(false);

    const wrongPhoneHeight = {
      ...baseline,
      POSE_COMPOSITION: { ...baseline.POSE_COMPOSITION, phone_position: 'eye_level' },
    };
    expect(validatePromptOutput(JSON.stringify(wrongPhoneHeight), selections).valid).toBe(false);
  });

  it('rejects explicit facial redesign instructions even if the reference-preservation rule is also present', () => {
    const selections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
    };
    const baseline = JSON.parse(buildMirrorStudioJsonPrompt(selections));
    const alteredIdentity = {
      ...baseline,
      GEMINI_EXECUTION_RULE:
        baseline.GEMINI_EXECUTION_RULE +
        ' Replace the reference face with a different person\'s face and reshape the nose.',
    };
    expect(validatePromptOutput(JSON.stringify(alteredIdentity), selections).valid).toBe(false);
    const outcome = resolveValidatedPromptOrFallback(
      JSON.stringify(alteredIdentity),
      selections,
      0
    );
    expect(outcome.source).toBe('deterministic');
    expect(outcome.prompt).toContain(REFERENCE_FACE_PRESERVATION_RULE);
  });

  it('keeps seated surfaces, props, and floor contacts physically consistent', () => {
    const bookOnBed = solveBiomechanicsAndPhysics({
      ...DEFAULT_SELECTIONS,
      mirrorPose: 'pose_prop_open_book',
      mirrorSupportObject: 'open_book',
      phoneHand: 'right_hand',
      framing: 'three_quarter',
    });
    expect(bookOnBed.gravityBalance.postureType).toBe('seated');
    expect(bookOnBed.gravityBalance.weightDistribution).toContain('mattress edge');
    expect(bookOnBed.gravityBalance.centerOfMassNotes).toContain('mattress indentation');
    expect(bookOnBed.visibleContactPoints).toContain(
      'seated thighs/pelvis compressing the visible mattress edge'
    );
    expect(bookOnBed.visibleContactPoints).toContain('free hand cradling an open book');
    expect(bookOnBed.gravityBalance.centerOfMassNotes).not.toContain('chair/stool');

    const chairFallback = solveBiomechanicsAndPhysics({
      ...DEFAULT_SELECTIONS,
      mirrorPose: 'pose_chair_or_stool_sitting',
      mirrorSupportObject: 'none',
    });
    expect(chairFallback.gravityBalance.postureType).toBe('seated');
    expect(chairFallback.gravityBalance.weightDistribution).toContain('chair seat');
    expect(chairFallback.gravityBalance.centerOfMassNotes).toContain('rigid chair/stool');
    expect(chairFallback.visibleContactPoints).toContain(
      'seated body resting naturally on visible chair'
    );

    const floorByBed = solveBiomechanicsAndPhysics({
      ...DEFAULT_SELECTIONS,
      mirrorPose: 'pose_floor_sitting_bed',
      mirrorSupportObject: 'bed_edge',
    });
    expect(floorByBed.gravityBalance.postureType).toBe('floor_seated');
    expect(floorByBed.visibleContactPoints).toContain(
      'seated legs/pelvis grounded cleanly on bedroom floor/rug'
    );
    expect(floorByBed.visibleContactPoints).toContain(
      'upper back resting lightly against the visible bed frame'
    );
    expect(floorByBed.visibleContactPoints).not.toContain(
      'seated thighs/pelvis compressing the visible mattress edge'
    );
  });


  it('should correctly extract content strictly from a markdown code block', () => {
    const aiResponse = `Here is your prompt:
\`\`\`markdown
[Medium: Raw candid photograph] of [Subject: person from the reference image...]
\`\`\`
Let me know if you need anything else!`;

    const result = extractMarkdownCodeBlockContent(aiResponse);
    expect(result).toBe(
      '[Medium: Raw candid photograph] of [Subject: person from the reference image...]'
    );
  });

  it('should return raw text if no markdown block exists (fallback)', () => {
    const aiResponse = `[Medium: Raw candid photograph] of [Subject: person from the reference image...]`;
    const result = extractMarkdownCodeBlockContent(aiResponse);
    expect(result).toBe(aiResponse);
  });

  it('should build the correct user concept payload including normalized scene config', () => {
    const concept = 'Coffee shop';
    const settings = { lighting: 'morning_window' as const };
    const payload = buildUserConceptPayload(concept, settings);

    expect(payload).toContain('User Concept: Coffee shop');
    expect(payload).toContain('morning_window');
    expect(payload).toContain('Normalized Scene Config:');
  });

  it('EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION defines clear priorities, guardrails against inventing details, and single markdown code block rule', () => {
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(
      'Role: Smartphone Photography Prompt Engineer'
    );
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain('Core Priorities:');
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(
      "Do NOT invent a person's gender, ethnicity, age, height, weight, location, clothing, phone model, sensor specifications, ISO, or shutter speed"
    );
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(
      'Do NOT claim "100% identity match", "undetectable AI", or guaranteed photographic realism'
    );
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(
      'Output ONLY ONE complete English prompt in a single markdown code block.'
    );
  });

  it('wrapInMarkdownCodeBlock wraps and round-trips with extractMarkdownCodeBlockContent', () => {
    const sample =
      'Use the person in the reference image as the identity reference for a vertical 9:16 front-camera smartphone selfie in a quiet bedroom.';
    const wrapped = wrapInMarkdownCodeBlock(sample);
    expect(wrapped.startsWith('```text\n')).toBe(true);
    expect(wrapped.endsWith('\n```')).toBe(true);
    expect(extractMarkdownCodeBlockContent(wrapped)).toBe(sample);
  });

  it('scene_builder: front-camera selfie hides phone, removes mirror gaze, and prevents full-body mirror framing', () => {
    const conflicting: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      framing: 'full_body_mirror',
      gaze: 'at_mirror_reflection',
      phoneColor: 'black',
      background: 'full_length_mirror',
    };

    const { selections, adjustments } = enforceCompatibilityRules(conflicting);
    expect(selections.phoneColor).toBe('hidden_front_camera');
    expect(selections.gaze).toBe('at_camera_lens');
    expect(selections.framing).toBe('half_body');
    expect(selections.background).toBe('bed_and_nightstand');
    expect(adjustments.length).toBeGreaterThanOrEqual(3);

    const prompt = buildDeterministicEnglishPrompt(selections);
    const validation = validatePromptOutput(prompt, selections);
    expect(validation.valid).toBe(true);
    expect(prompt.includes('consistent mirror reflection')).toBe(false);
    expect(prompt).toContain('outside the visible frame');
  });

  it('scene_builder: mirror selfie with full-body framing enforces full-length mirror background and standing pose', () => {
    const mirrorFullBody: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      framing: 'full_body_mirror',
      background: 'wardrobe',
      pose: 'pose_headboard_lean',
      phoneColor: 'hidden_front_camera',
    };

    const { selections } = enforceCompatibilityRules(mirrorFullBody);
    expect(selections.background).toBe('full_length_mirror');
    expect(selections.pose).toBe('rear_mirror_standing');
    expect(selections.phoneColor).toBe('black');

    const prompt = buildDeterministicEnglishPrompt(selections);
    expect(prompt).toContain('mirror reflection');
    expect(prompt).toContain('away from their face');
  });

  it('scene_builder: preserve_reference + explicit clothingColor performs a narrow lower-garment color edit without resetting color or flagging a conflict, while preserve_reference alone does not recolor', () => {
    const preserveWithBlue: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'preserve_reference',
      clothingColor: 'blue',
    };

    const { selections, adjustments, conflicts } =
      enforceCompatibilityRules(preserveWithBlue);
    // Must keep the selected color intact and not classify as a conflict
    expect(selections.clothing).toBe('preserve_reference');
    expect(selections.clothingColor).toBe('blue');
    expect(conflicts).toHaveLength(0);
    expect(adjustments).toHaveLength(0);

    const normalizedWithBlue = normalizeSelections(preserveWithBlue);
    expect(normalizedWithBlue.clothingEdits.mode).toBe('recolor_lower_only');
    expect(normalizedWithBlue.clothingEdits.preserveCutAndFabric).toBe(true);
    expect(normalizedWithBlue.clothingEdits.preserveUpperClothing).toBe(true);

    const bluePrompt = buildDeterministicEnglishPrompt(preserveWithBlue);
    const checkBlue = validatePromptOutput(bluePrompt, preserveWithBlue);
    expect(checkBlue.valid).toBe(true);
    expect(bluePrompt).toContain(
      'recoloring only the lower-body garment to muted navy and slate blue tones'
    );
    expect(bluePrompt).toContain(
      "preserving the garment's cut, fabric, fit, and construction and leaving upper-body clothing unchanged"
    );

    // Selecting preserve_reference alone (without a color change) preserves the reference outfit without recoloring
    const preserveAlone: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'preserve_reference',
      clothingColor: 'preserve_reference',
    };
    const normalizedAlone = normalizeSelections(preserveAlone);
    expect(normalizedAlone.clothingEdits.mode).toBe('preserve_reference');

    const alonePrompt = buildDeterministicEnglishPrompt(preserveAlone);
    const checkAlone = validatePromptOutput(alonePrompt, preserveAlone);
    expect(checkAlone.valid).toBe(true);
    expect(alonePrompt).toContain(
      'wearing the exact outfit from the reference image'
    );
    expect(alonePrompt).not.toMatch(/recolor|recoloring/i);

    // Switching from preserve_reference to a new outfit assigns a default neutral color ('beige')
    const switchedOutfit: SelfieSelections = {
      ...preserveAlone,
      clothing: 'hoodie_and_pants',
      clothingColor: 'preserve_reference',
    };
    const resSwitched = enforceCompatibilityRules(switchedOutfit);
    expect(resSwitched.selections.clothingColor).toBe('beige');
  });

  it('strict_editing: enforces Rule 04 lighting mode gate and generates valid Mode A & Mode B prompts', () => {
    const unselectedState: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'unselected',
    };
    const gateCheck = validateStrictLightingSelection(unselectedState);
    expect(gateCheck.valid).toBe(false);
    expect(buildStrictEditingPrompt(unselectedState)).toBe('');

    const modeAState: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      screenOrientation: 'facing_away',
      lowerBodyColor: 'deep_navy',
      strictOutputFormat: 'concise_prompt',
    };
    const promptA = buildStrictEditingPrompt(modeAState, 0);
    const checkA = validatePromptOutput(promptA, modeAState);
    expect(checkA.valid).toBe(true);
    expect(promptA).toContain('MODE A');
    expect(promptA).toContain('lower-body');
    expect(promptA).toContain('deep navy blue');
    expect(promptA).toContain('oriented away from the person');

    const modeBFull: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      flashMirrorGeometry: 'partial_face_occlusion',
      lowerBodyColor: 'charcoal_black',
      strictOutputFormat: 'full_12_rules',
    };
    const promptB = buildStrictEditingPrompt(modeBFull, 0);
    const checkB = validatePromptOutput(promptB, modeBFull);
    expect(checkB.valid).toBe(true);
    expect(promptB).toContain('MODE B');
    expect(promptB).toContain('[01 — REFERENCE IDENTITY AND FACE PRESERVATION]');
    expect(promptB).toContain('[02 — LOWER-BODY CLOTHING COLOR]');
    expect(promptB).toContain('natural matte charcoal black');
  });

  it('deterministic prompt builder outputs concise single English paragraph with distinct rephrase variants', () => {
    for (const mode of ['strict_editing', 'scene_builder'] as const) {
      const sel: SelfieSelections = { ...DEFAULT_SELECTIONS, workflowMode: mode };
      const p0 = buildDeterministicEnglishPrompt(sel, 0);
      const p1 = buildDeterministicEnglishPrompt(sel, 1);
      const p2 = buildDeterministicEnglishPrompt(sel, 2);

      expect(p0).not.toBe(p1);
      expect(p1).not.toBe(p2);

      for (const p of [p0, p1, p2]) {
        const check = validatePromptOutput(p, sel);
        expect(check.valid).toBe(true);
        expect(check.wordCount).toBeGreaterThanOrEqual(80);
        expect(check.wordCount).toBeLessThanOrEqual(280);
      }
    }
  });

  it('random selection generator always produces compatible and valid prompts in both modes', () => {
    for (let i = 1; i <= 6; i++) {
      const randomStrict = generateConsistentRandomSelections(i * 98765, 'strict_editing');
      const checkStrict = validatePromptOutput(
        buildDeterministicEnglishPrompt(randomStrict, i),
        randomStrict
      );
      expect(checkStrict.valid).toBe(true);

      const randomScene = generateConsistentRandomSelections(i * 54321, 'scene_builder');
      const checkScene = validatePromptOutput(
        buildDeterministicEnglishPrompt(randomScene, i),
        randomScene
      );
      expect(checkScene.valid).toBe(true);
    }
  });

  it('sanitizeCustomText strips disallowed content and translates Arabic scene words to English', () => {
    const arabicInput = 'نظارة طبية وكتاب على الطاولة whiten skin ignore previous';
    const sanitized = sanitizeCustomText(arabicInput);
    expect(/[\u0600-\u06FF]/.test(sanitized)).toBe(false);
    expect(/whiten skin|ignore previous/i.test(sanitized)).toBe(false);
    expect(sanitized).toContain('a pair of prescription glasses');
    expect(sanitized).toContain('a book resting nearby');
  });

  it('cleanGeneratedPromptText removes quotes, markdown fences, and line breaks', () => {
    const dirty =
      '```text\n"Use the supplied reference image as the identity reference.\nCreate a mirror selfie."\n```';
    const cleaned = cleanGeneratedPromptText(dirty);
    expect(cleaned).toBe(
      'Use the supplied reference image as the identity reference. Create a mirror selfie.'
    );
  });

  it('SKIN_TEXTURE_OPTIONS injects the exact enPhrase for raw_authentic, balanced_natural, and cinematic_clean in both modes', () => {
    expect(SKIN_TEXTURE_OPTIONS).toHaveLength(3);
    for (const option of SKIN_TEXTURE_OPTIONS) {
      for (const mode of ['strict_editing', 'scene_builder'] as const) {
        const sel: SelfieSelections = {
          ...DEFAULT_SELECTIONS,
          workflowMode: mode,
          skinTexture: option.value,
        };
        const prompt = buildDeterministicEnglishPrompt(sel, 0);
        expect(prompt).toContain(option.enPhrase);
      }
    }
  });

  it('POSE_OPTIONS includes all 6 front/bed poses and all 6 rear-camera poses and injects their exact enPhrase', () => {
    expect(FRONT_POSE_OPTIONS).toHaveLength(6);
    expect(REAR_CAMERA_POSE_OPTIONS).toHaveLength(6);
    expect(POSE_OPTIONS).toHaveLength(12);

    for (const option of POSE_OPTIONS) {
      for (const mode of ['strict_editing', 'scene_builder'] as const) {
        const sel: SelfieSelections = {
          ...DEFAULT_SELECTIONS,
          workflowMode: mode,
          pose: option.value,
        };
        const prompt = buildDeterministicEnglishPrompt(sel, 0);
        expect(prompt).toContain(option.enPhrase);
      }
    }
  });

  it('mirror_studio: generates valid structured JSON with smartphone mirror pipeline and all interactive pose groups & athletic clothing without inventing device specs', () => {
    expect(MIRROR_GAZE_OPTIONS).toHaveLength(3);
    expect(MIRROR_POSE_OPTIONS).toHaveLength(26);
    expect(MIRROR_EXPRESSION_OPTIONS).toHaveLength(6);
    expect(MIRROR_HAIR_PHYSICS_OPTIONS).toHaveLength(4);
    expect(MIRROR_CLOTHING_PHYSICS_OPTIONS).toHaveLength(4);
    expect(MIRROR_BOTTOM_CLOTHING_OPTIONS).toHaveLength(7);

    const sampleResolved = resolvePromptConflicts(
      MIRROR_POSE_OPTIONS[0].enPhrase,
      MIRROR_EXPRESSION_OPTIONS[0].enPhrase,
      MIRROR_HAIR_PHYSICS_OPTIONS[0].enPhrase,
      MIRROR_CLOTHING_PHYSICS_OPTIONS[0].enPhrase,
      MIRROR_BOTTOM_CLOTHING_OPTIONS[0].enPhrase
    );
    expect(sampleResolved).toContain(
      'The subject is visibly holding one single physical Xiaomi 15 Ultra smartphone, pointing the rear camera at the mirror'
    );

    for (const pose of MIRROR_POSE_OPTIONS) {
      expect(pose.groupAr).toBeTruthy();
      const sel: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        mirrorPose: pose.value,
        mirrorMotionBlurEnabled: pose.value === 'pose_free_hand_motion_blur',
      };
      const jsonStr = buildMirrorStudioJsonPrompt(sel);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.TARGET_AI).toBe('Google Gemini (Imagen 3 Engine)');
      expect(parsed.SYSTEM_DIRECTIVE).toBe('EXECUTE_PHOTOGRAPHIC_CAPTURE');
      expect(parsed.SCENE_LIGHTING).toContain('flash');
      expect(parsed.CAMERA_PIPELINE.Device).toContain('Xiaomi 15 Ultra rear camera');
      expect(parsed.PHYSICAL_MECHANICS).toContain('pointing the rear camera at the mirror');
      expect(parsed.PHYSICAL_MECHANICS).toContain(pose.enPhrase);
    }

    for (const bottom of MIRROR_BOTTOM_CLOTHING_OPTIONS) {
      const sel: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        mirrorBottomClothing: bottom.value,
      };
      const jsonStr = buildMirrorStudioJsonPrompt(sel);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.PHYSICAL_MECHANICS).toContain(bottom.enPhrase);

      const deterministicOut = buildDeterministicEnglishPrompt(sel);
      expect(deterministicOut).toBe(jsonStr);
      const validation = validatePromptOutput(deterministicOut, sel);
      expect(validation.valid).toBe(true);
    }
  });

  // --- Engine Requirements & Regression Tests ---

  it('rear-camera mirror photo with direct flash includes flash behavior and does not mention screen-only lighting or night mode', () => {
    const strictFlashMirror: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      selfieType: 'mirror',
    };
    const strictPrompt = buildDeterministicEnglishPrompt(strictFlashMirror);
    expect(strictPrompt).toMatch(/rear-camera.*mirror/i);
    expect(strictPrompt).toMatch(/direct (?:camera|phone) flash/i);
    expect(strictPrompt).toContain('realistic flash falloff');
    expect(strictPrompt).not.toMatch(/phone screen is the sole active light source/i);
    expect(strictPrompt).not.toMatch(/night-mode|night mode/i);

    const sceneFlashMirror: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      lighting: 'mode_b_phone_flash_mirror_dark',
    };
    const scenePrompt = buildDeterministicEnglishPrompt(sceneFlashMirror);
    expect(scenePrompt).toMatch(/rear-camera smartphone mirror selfie/i);
    expect(scenePrompt).toContain('realistic flash falloff');
    expect(scenePrompt).not.toMatch(/phone screen as the sole active light source/i);
    expect(scenePrompt).not.toMatch(/night-mode|night mode/i);
  });

  it('screen-only lighting selection never produces flash instructions', () => {
    const strictScreenOnly: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
    };
    const strictPrompt = buildDeterministicEnglishPrompt(strictScreenOnly);
    expect(strictPrompt).toMatch(
      /phone screen is the sole active light source|only the phone screen illuminates|lit solely by the smartphone screen/i
    );
    expect(strictPrompt).not.toContain('realistic flash falloff');
    expect(strictPrompt).not.toMatch(/illuminated solely by the direct camera flash/i);

    const sceneScreenOnly: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      lighting: 'mode_a_phone_screen_dark',
    };
    const scenePrompt = buildDeterministicEnglishPrompt(sceneScreenOnly);
    expect(scenePrompt).toContain('phone screen as the sole active light source');
    expect(scenePrompt).not.toContain('realistic flash falloff');
    expect(scenePrompt).not.toMatch(/exclusively with the rear smartphone flash/i);
  });

  it('night mode never produces direct-flash instructions', () => {
    const nightModeStrict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      phoneProcessingProfile: 'night_mode',
    };
    const promptStrict = buildDeterministicEnglishPrompt(nightModeStrict);
    expect(promptStrict).toMatch(/night-mode/i);
    expect(promptStrict).toMatch(
      /no direct flash|without any direct flash|flash and lamps off/i
    );
    expect(promptStrict).not.toContain('realistic flash falloff');
    expect(promptStrict).not.toMatch(/illuminated solely by the direct camera flash/i);

    const nightModeScene: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      lighting: 'mode_b_phone_flash_mirror_dark',
      phoneProcessingProfile: 'night_mode',
    };
    const promptScene = buildDeterministicEnglishPrompt(nightModeScene);
    expect(promptScene).toMatch(/night-mode/i);
    expect(promptScene).toContain('no direct flash');
    expect(promptScene).not.toContain('realistic flash falloff');
    expect(promptScene).not.toMatch(/exclusively with the rear smartphone flash/i);
  });

  it('a front-camera selfie is not described as a rear-camera mirror photo', () => {
    const frontSelfie: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      pose: 'pose_side_lying',
    };
    const prompt = buildDeterministicEnglishPrompt(frontSelfie);
    expect(prompt).toContain('front-camera smartphone selfie');
    expect(prompt).toContain('outside the visible frame');
    expect(prompt).not.toMatch(/rear-camera/i);
    expect(prompt).not.toMatch(/mirror selfie|mirror photograph|mirror reflection/i);
  });

  it('a lower-garment color change does not alter the garment cut, fabric, or upper clothing', () => {
    const lowerColorEdit: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      lowerBodyColor: 'deep_navy',
    };
    const prompt = buildDeterministicEnglishPrompt(lowerColorEdit);
    expect(prompt).toContain('deep navy blue');
    expect(prompt).toMatch(/lower-body (?:garment|clothing)/i);
    expect(prompt).toMatch(/garment cut/i);
    expect(prompt).toMatch(/fabric (?:weave|texture)/i);
    expect(prompt).toMatch(
      /upper-body (?:clothing|attire) (?:unchanged|untouched|unaltered)/i
    );
  });

  it('missing personal or device details are not invented', () => {
    const minimalSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      userConcept: '',
      customDetails: '',
      subjectTraits: undefined,
      deviceModel: undefined,
      locationText: undefined,
    };

    const prompt = buildDeterministicEnglishPrompt(minimalSelections);
    expect(prompt).not.toMatch(/Middle Eastern|Saudi Arabia|Riyadh|Jeddah/i);
    expect(prompt).not.toMatch(/\b(?:193\s*cm|83\s*kg|lean-athletic)\b/i);
    expect(prompt).not.toMatch(
      /\b(?:Xiaomi|iPhone|Samsung|Leica|Sony|LYT-900|OV32B)\b/i
    );
    expect(prompt).not.toMatch(/\b(?:ISO|shutter speed|1\/60s|1\/125s)\b/i);
    expect(prompt).not.toMatch(/100% identity|undetectable AI/i);

    const explicitSelections: SelfieSelections = {
      ...minimalSelections,
      subjectTraits: 'tall athletic adult',
      deviceModel: 'Pixel 9 Pro',
      locationText: 'Jeddah',
      phoneProcessingProfile: 'natural_hdr',
    };
    const explicitPrompt = buildDeterministicEnglishPrompt(explicitSelections);
    expect(explicitPrompt).toContain('tall athletic adult');
    expect(explicitPrompt).toContain('Pixel 9 Pro');
    expect(explicitPrompt).toContain('in Jeddah');
    expect(explicitPrompt).toContain('natural phone HDR tone mapping');
  });

  it('conflicting selections produce a validation warning rather than contradictory prompt text', () => {
    // 1. Screen-only light + direct flash
    const screenPlusFlash: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      lighting: 'mode_a_phone_screen_dark',
      mixedLightingEnabled: true,
      secondaryLighting: 'mode_b_phone_flash_mirror_dark',
    };
    const check1 = validateSceneSelections(screenPlusFlash);
    expect(check1.valid).toBe(false);
    expect(check1.conflicts).toContain('SCREEN_ONLY_WITH_FLASH');
    expect(check1.warnings.length).toBeGreaterThan(0);

    const rendered1 = buildDeterministicEnglishPrompt(screenPlusFlash);
    const outputValidation1 = validatePromptOutput(rendered1, screenPlusFlash);
    expect(outputValidation1.warnings.length).toBeGreaterThan(0);
    expect(rendered1).toContain('phone screen as the sole active light source');
    expect(rendered1).not.toContain('realistic flash falloff');

    // 2. Night mode + direct flash
    const nightPlusFlash: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      phoneProcessingProfile: 'night_mode',
    };
    const check2 = validateSceneSelections(nightPlusFlash);
    expect(check2.valid).toBe(false);
    expect(check2.conflicts).toContain('NIGHT_MODE_WITH_FLASH');
    expect(check2.warnings.length).toBeGreaterThan(0);

    const rendered2 = buildDeterministicEnglishPrompt(nightPlusFlash);
    expect(rendered2).toMatch(/night-mode/i);
    expect(rendered2).not.toContain('realistic flash falloff');

    // 3. Front-camera selfie + mirror flash / full-body mirror
    const frontPlusMirror: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      framing: 'full_body_mirror',
      lighting: 'mode_b_phone_flash_mirror_dark',
    };
    const check3 = detectSelectionConflicts(frontPlusMirror);
    expect(check3.valid).toBe(false);
    expect(check3.warnings.length).toBeGreaterThan(0);

    const rendered3 = buildDeterministicEnglishPrompt(frontPlusMirror);
    expect(rendered3).toContain('front-camera smartphone selfie');
    expect(rendered3).not.toMatch(/rear-camera/i);

    // 4. Explicit instruction forbidding all clothing-color changes combined with a color change
    const forbiddenColorChange: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'preserve_reference',
      clothingColor: 'blue',
      customDetails: 'do not change any clothing color',
    };
    const check4 = validateSceneSelections(forbiddenColorChange);
    expect(check4.valid).toBe(false);
    expect(check4.conflicts).toContain('PRESERVE_GARMENT_COLOR_CONFLICT');
    expect(check4.warnings.length).toBeGreaterThan(0);
  });

  it('changing focusTarget or exposurePreference changes the relevant prompt output in scene_builder, strict_editing, and mirror_studio modes while remaining compatible', () => {
    const baseMirrorScene: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      lighting: 'soft_daylight',
    };

    const faceFocusPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      focusTarget: 'subject_face',
    });
    const reflectionFocusPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      focusTarget: 'mirror_reflection',
    });
    const upperBodyFocusPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      focusTarget: 'upper_body',
    });

    expect(faceFocusPrompt).toContain('autofocus priority on the subject’s face');
    expect(reflectionFocusPrompt).toContain(
      'focus on the reflected subject with coherent mirror geometry'
    );
    expect(upperBodyFocusPrompt).toContain(
      'focus priority on the subject’s upper body'
    );
    expect(faceFocusPrompt).not.toBe(reflectionFocusPrompt);
    expect(reflectionFocusPrompt).not.toBe(upperBodyFocusPrompt);

    const balancedExpPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      exposurePreference: 'balanced',
    });
    const lowKeyExpPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      exposurePreference: 'low_key_shadow_preserving',
    });
    const flashControlledExpPrompt = buildDeterministicEnglishPrompt({
      ...baseMirrorScene,
      lighting: 'mode_b_phone_flash_mirror_dark',
      exposurePreference: 'flash_highlight_controlled',
    });

    expect(balancedExpPrompt).toContain(
      'natural smartphone auto-exposure balancing subject and background'
    );
    expect(lowKeyExpPrompt).toContain(
      'low-key exposure preserving the selected low-light mood without inventing extra light'
    );
    expect(flashControlledExpPrompt).toContain(
      'controlled highlight exposure retaining realistic flash highlights without clipping them unnaturally'
    );

    // Mirror Studio JSON output reflects focusTarget and exposurePreference changes
    const mirrorStudioFaceBalanced = JSON.parse(
      buildMirrorStudioJsonPrompt({
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        focusTarget: 'subject_face',
        exposurePreference: 'balanced',
      })
    );
    const mirrorStudioUpperFlash = JSON.parse(
      buildMirrorStudioJsonPrompt({
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        focusTarget: 'upper_body',
        exposurePreference: 'flash_highlight_controlled',
      })
    );

    expect(mirrorStudioFaceBalanced.CAMERA_PIPELINE.Optics_Physics).toContain(
      'autofocus priority on the subject’s face'
    );
    expect(mirrorStudioFaceBalanced.CAMERA_PIPELINE.Sensor_Response).toContain(
      'natural smartphone auto-exposure balancing subject and background'
    );
    expect(mirrorStudioUpperFlash.CAMERA_PIPELINE.Optics_Physics).toContain(
      'focus priority on the subject’s upper body'
    );
    expect(mirrorStudioUpperFlash.CAMERA_PIPELINE.Sensor_Response).toContain(
      'controlled highlight exposure retaining realistic flash highlights without clipping them unnaturally'
    );
  });

  it('validates model-generated prompts against StructuredSceneConfig and falls back to deterministic output when pose, lighting, lower-garment color, or camera mode is omitted or contradicted', () => {
    const targetSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      pose: 'pose_cross_legged',
      lighting: 'warm_bedside_lamp',
      clothing: 'preserve_reference',
      clothingColor: 'blue',
      phoneColor: 'black', // triggers a compatibility adjustment warning for front_camera
    };

    const validDeterministic = buildDeterministicEnglishPrompt(targetSelections);

    // 1. Candidate prompt that omits the selected pose (pose_cross_legged)
    const missingPosePrompt = validDeterministic.replace(
      /sitting cross-legged[^,.]*/gi,
      'standing near the doorway'
    );
    const checkMissingPose = validatePromptOutput(
      missingPosePrompt,
       enforceCompatibilityRules(targetSelections).selections
    );
    expect(checkMissingPose.valid).toBe(false);

    const fallbackPose = resolveValidatedPromptOrFallback(
      missingPosePrompt,
      targetSelections,
      0
    );
    expect(fallbackPose.source).toBe('deterministic');
    expect(fallbackPose.prompt).toContain('sitting cross-legged');
    expect(fallbackPose.adjustments.length).toBeGreaterThan(0);

    // 2. Candidate prompt that omits the selected lighting (warm_bedside_lamp)
    const missingLightingPrompt = validDeterministic.replace(
      /cozy warm ambient light from a bedside lamp/gi,
      'bright midday studio floodlights'
    );
    const checkMissingLighting = validatePromptOutput(
      missingLightingPrompt,
      enforceCompatibilityRules(targetSelections).selections
    );
    expect(checkMissingLighting.valid).toBe(false);

    const fallbackLighting = resolveValidatedPromptOrFallback(
      missingLightingPrompt,
      targetSelections,
      0
    );
    expect(fallbackLighting.source).toBe('deterministic');
    expect(fallbackLighting.prompt).toContain(
      'cozy warm ambient light from a bedside lamp'
    );

    // 3. Candidate prompt that omits the lower-garment color edit (blue)
    const missingColorPrompt = validDeterministic.replace(
      /recoloring only the lower-body garment to muted navy and slate blue tones[^.]*/gi,
      'wearing a red leather jacket'
    );
    const checkMissingColor = validatePromptOutput(
      missingColorPrompt,
      enforceCompatibilityRules(targetSelections).selections
    );
    expect(checkMissingColor.valid).toBe(false);

    const fallbackColor = resolveValidatedPromptOrFallback(
      missingColorPrompt,
      targetSelections,
      0
    );
    expect(fallbackColor.source).toBe('deterministic');
    expect(fallbackColor.prompt).toContain(
      'recoloring only the lower-body garment to muted navy and slate blue tones'
    );
    expect(fallbackColor.prompt).toContain(
      "preserving the garment's cut, fabric, fit, and construction and leaving upper-body clothing unchanged"
    );

    // 4. Candidate prompt that contradicts the selected camera mode (describes front_camera as rear-camera mirror selfie)
    const contradictingCameraPrompt = validDeterministic.replace(
      /front-camera smartphone selfie/gi,
      'rear-camera smartphone mirror selfie'
    );
    const checkContradictingCamera = validatePromptOutput(
      contradictingCameraPrompt,
      enforceCompatibilityRules(targetSelections).selections
    );
    expect(checkContradictingCamera.valid).toBe(false);

    const fallbackCamera = resolveValidatedPromptOrFallback(
      contradictingCameraPrompt,
      targetSelections,
      0
    );
    expect(fallbackCamera.source).toBe('deterministic');
    expect(fallbackCamera.prompt).toContain('front-camera smartphone selfie');
    expect(fallbackCamera.prompt).not.toMatch(/rear-camera/i);
    expect(fallbackCamera.adjustments).toContain(
      'تم إخفاء الهاتف تلقائيًا لأن التصوير بالكاميرا الأمامية.'
    );
  });

  it('the deterministic fallback produces compatible output from the same normalized scene configuration', () => {
    const raw: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      framing: 'three_quarter',
      lighting: 'warm_bedside_lamp',
      clothing: 'hoodie_and_pants',
      clothingColor: 'gray',
      phoneProcessingProfile: 'natural_hdr',
    };

    const { selections } = enforceCompatibilityRules(raw);
    const normalized = normalizeSelections(selections);
    const { config, warnings } = resolveSceneConflicts(normalized, raw);

    expect(warnings).toHaveLength(0);
    expect(config.cameraMode).toBe('rear_mirror');
    expect(config.lightingSource).toBe('warm_bedside_lamp');
    expect(config.phoneProcessingProfile).toBe('natural_hdr');

    const directRendered = renderScenePrompt(config, selections, 0);
    const fallbackRendered = buildDeterministicEnglishPrompt(raw, 0);

    expect(fallbackRendered).toBe(directRendered);
    const validation = validatePromptOutput(fallbackRendered, selections);
    expect(validation.valid).toBe(true);
    expect(fallbackRendered).toContain('natural phone HDR tone mapping');
    expect(fallbackRendered).toContain('subtle shadow noise in darker areas');
    expect(fallbackRendered).toContain(
      'cozy warm ambient light from a bedside lamp'
    );
  });

  it('includes the reference image ONLY after explicit opt-in and validates MIME type and file size', () => {
    const sampleBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

    // 1. Without opt-in (optIn = false), image is NOT included even when base64 and mimeType exist
    const noOptInCheck = validateReferenceImageInput({
      optIn: false,
      base64Data: sampleBase64,
      mimeType: 'image/png',
    });
    expect(noOptInCheck.includeImage).toBe(false);
    expect(noOptInCheck.valid).toBe(true);

    const noOptInBody = buildPromptGenerationRequestBody(DEFAULT_SELECTIONS, {
      referenceImageOptIn: false,
      imageBase64: sampleBase64,
      imageMimeType: 'image/png',
    });
    expect(noOptInBody.imageIncluded).toBe(false);
    expect(noOptInBody.body.referenceImage).toBeUndefined();

    const noOptInGeminiReq = buildGeminiGenerateContentRequest(
      DEFAULT_SELECTIONS,
      {
        referenceImageOptIn: false,
        referenceImage: {
          base64Data: sampleBase64,
          mimeType: 'image/png',
        },
      }
    );
    expect(noOptInGeminiReq.imageIncluded).toBe(false);
    expect(typeof noOptInGeminiReq.request.contents).toBe('string');

    // 2. With explicit opt-in (optIn = true) and valid PNG, image IS included as inlineData
    const optedInBody = buildPromptGenerationRequestBody(DEFAULT_SELECTIONS, {
      referenceImageOptIn: true,
      imageBase64: sampleBase64,
      imageMimeType: 'image/png',
    });
    expect(optedInBody.imageIncluded).toBe(true);
    expect(optedInBody.body.referenceImage).toEqual({
      base64Data: sampleBase64,
      mimeType: 'image/png',
      sizeBytes: expect.any(Number),
    });

    // 3. Unsupported MIME type is rejected
    const badMime = validateReferenceImageInput({
      optIn: true,
      base64Data: sampleBase64,
      mimeType: 'application/pdf',
    });
    expect(badMime.includeImage).toBe(false);
    expect(badMime.valid).toBe(false);
    expect(badMime.errorAr).toContain('JPG');

    // 4. Oversized file (> 10 MB) is rejected
    const oversized = validateReferenceImageInput({
      optIn: true,
      base64Data: sampleBase64,
      mimeType: 'image/jpeg',
      sizeBytes: MAX_REFERENCE_IMAGE_BYTES + 1024,
    });
    expect(oversized.includeImage).toBe(false);
    expect(oversized.valid).toBe(false);
    expect(oversized.errorAr).toContain('10 ميجابايت');
  });

  it('rejects oversized or malformed reference payloads even when file size metadata is forged', () => {
    // This data is larger than 10 MiB after decoding, regardless of the client size hint.
    const oversizedData = 'A'.repeat(4 * Math.ceil((MAX_REFERENCE_IMAGE_BYTES + 1) / 3));
    const forgedSmallSize = validateReferenceImageInput({
      optIn: true,
      base64Data: oversizedData,
      mimeType: 'image/png',
      sizeBytes: 1,
    });
    expect(forgedSmallSize.valid).toBe(false);
    expect(forgedSmallSize.includeImage).toBe(false);
    expect(forgedSmallSize.errorAr).toContain('10 ميجابايت');

    const invalidPadding = validateReferenceImageInput({
      optIn: true,
      base64Data: 'AAAA====',
      mimeType: 'image/png',
    });
    expect(invalidPadding.valid).toBe(false);

    const oneByteImagePayload = validateReferenceImageInput({
      optIn: true,
      base64Data: 'data:image/png;base64,AQ==',
      mimeType: 'image/png',
      sizeBytes: 999,
    });
    expect(oneByteImagePayload.valid).toBe(true);
    expect(oneByteImagePayload.sizeBytes).toBe(1);
  });

  it('sanitizes reference-image analysis so uncertain facts become unknown and sensitive traits or device specs are never inferred', () => {
    const rawNoisyAnalysis = {
      setting: 'indoor',
      backgroundElements: 'wooden headboard and warm bedside lamp',
      pose: 'not visible clearly',
      framing: 'uncertain',
      cameraPerspective: 'front_selfie shot on iPhone 16 Pro Max ISO 800 f/1.8',
      lightingDirectionAndQuality: 'warm soft bedside lamp from the left',
      colorPalette: '',
      visibleClothing: '28 years old Arab male wearing a beige cotton t-shirt 185cm 80kg',
      // Forbidden extra fields that must be stripped completely
      identity: 'John Doe',
      age: 28,
      gender: 'male',
      ethnicity: 'Middle Eastern',
      bodyMeasurements: '185cm, 80kg',
      health: 'healthy skin',
      phoneModel: 'Xiaomi 15 Ultra',
    };

    const sanitized = sanitizeReferenceImageAnalysis(rawNoisyAnalysis);

    expect(Object.keys(sanitized).sort()).toEqual(
      [
        'setting',
        'backgroundElements',
        'pose',
        'framing',
        'cameraPerspective',
        'lightingDirectionAndQuality',
        'colorPalette',
        'visibleClothing',
      ].sort()
    );
    expect(sanitized.setting).toBe('indoor');
    expect(sanitized.backgroundElements).toBe(
      'wooden headboard and warm bedside lamp'
    );
    expect(sanitized.pose).toBe('unknown');
    expect(sanitized.framing).toBe('unknown');
    expect(sanitized.colorPalette).toBe('unknown');

    // Device specs and camera settings stripped from cameraPerspective
    expect(sanitized.cameraPerspective).not.toMatch(/iphone|iso|f\/1\.8/i);
    expect(sanitized.cameraPerspective).toContain('front_selfie');

    // Age, gender, ethnicity, and body measurements stripped from visibleClothing
    expect(sanitized.visibleClothing).not.toMatch(
      /28|years|arab|male|185cm|80kg/i
    );
    expect(sanitized.visibleClothing).toContain('beige cotton t-shirt');
  });

  it('treats explicit user selections as hard constraints that override conflicting image observations and produces concise Arabic notices', () => {
    const userSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      pose: 'pose_side_lying',
      framing: 'head_and_shoulders',
      lighting: 'mode_a_phone_screen_dark',
      clothing: 'hoodie_and_pants',
      clothingColor: 'black',
    };

    const { selections } = enforceCompatibilityRules(userSelections);
    const normalized = normalizeSelections(selections);
    const { config } = resolveSceneConflicts(normalized, userSelections);

    // Image analysis conflicts with setting (outdoor), cameraPerspective (rear_mirror),
    // lighting (bright midday window sunlight), pose (standing upright), framing (full-body), and clothing (white shirt)
    const conflictingImageAnalysis = {
      setting: 'outdoor',
      backgroundElements: 'trees and street',
      pose: 'standing upright',
      framing: 'full-body floor-length shot',
      cameraPerspective: 'rear_mirror with phone visible',
      lightingDirectionAndQuality: 'bright midday window sunlight',
      colorPalette: 'neutral gray and beige tones',
      visibleClothing: 'white linen shirt',
    };

    const reconciled = reconcileSceneWithImageAnalysis(
      config,
      selections,
      conflictingImageAnalysis
    );

    // User's explicit selections in config remain untouched
    expect(reconciled.config.cameraMode).toBe('front_selfie');
    expect(reconciled.config.lightingSource).toBe('screen_only');
    expect(reconciled.config.pose).toContain('lying on the side');
    expect(reconciled.config.framing).toContain('chest and shoulders upward');
    expect(reconciled.config.clothingEdits.upperClothingPhrase).toContain(
      'matte black fabric'
    );

    // Conflicting observations were excluded from effectiveObservations
    expect(reconciled.effectiveObservations.setting).toBeUndefined();
    expect(reconciled.effectiveObservations.cameraPerspective).toBeUndefined();
    expect(
      reconciled.effectiveObservations.lightingDirectionAndQuality
    ).toBeUndefined();
    expect(reconciled.effectiveObservations.pose).toBeUndefined();
    expect(reconciled.effectiveObservations.framing).toBeUndefined();
    expect(reconciled.effectiveObservations.visibleClothing).toBeUndefined();

    // Non-conflicting colorPalette is retained
    expect(reconciled.effectiveObservations.colorPalette).toBe(
      'neutral gray and beige tones'
    );

    // Concise Arabic notices are emitted for the overridden conflicts
    expect(reconciled.hasConflictsWithImage).toBe(true);
    expect(reconciled.overrideNoticesAr.length).toBeGreaterThanOrEqual(4);
    expect(
      reconciled.overrideNoticesAr.some((msg) => msg.includes('وضع الكاميرا'))
    ).toBe(true);
    expect(
      reconciled.overrideNoticesAr.some((msg) => msg.includes('الإضاءة'))
    ).toBe(true);
    expect(
      reconciled.overrideNoticesAr.some((msg) => msg.includes('الوضعية'))
    ).toBe(true);
  });

  it('sends both inline image data and normalized scene settings to Gemini when opted in, and labels Gemini vs deterministic fallback accurately', async () => {
    const sampleBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
    const userSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      userConcept: 'سيلفي ليلي هادئ',
      selfieType: 'front_camera',
      pose: 'pose_side_lying',
      lighting: 'warm_bedside_lamp',
      clothing: 'preserve_reference',
      clothingColor: 'blue',
      referenceImageAnalysisOptIn: true,
    };

    const recordedCalls: GeminiGenerateContentParams[] = [];
    const validModelPrompt = buildDeterministicEnglishPrompt(userSelections, 1);

    const mockGenerateContent = async (params: GeminiGenerateContentParams) => {
      recordedCalls.push(params);
      if (recordedCalls.length === 1) {
        // Step 1: Image analysis response with one conflicting observation (standing pose) and one uncertain field
        return {
          text: JSON.stringify({
            setting: 'indoor',
            backgroundElements: 'wooden nightstand and upholstered headboard',
            pose: 'standing upright', // conflicts with pose_side_lying
            framing: 'unknown',
            cameraPerspective: 'front_selfie',
            lightingDirectionAndQuality: 'warm bedside lamp glow',
            colorPalette: 'warm beige and navy tones',
            visibleClothing: 'casual cotton t-shirt and lounge pants',
          }),
        };
      }
      // Step 2: Prompt generation response
      return {
        text: wrapInMarkdownCodeBlock(validModelPrompt),
      };
    };

    const successOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      concept: userSelections.userConcept,
      referenceImageOptIn: true,
      referenceImage: {
        base64Data: sampleBase64,
        mimeType: 'image/png',
      },
      generateContent: mockGenerateContent,
    });

    expect(recordedCalls.length).toBe(2);
    // Both calls received inlineData + normalized scene config
    for (const call of recordedCalls) {
      expect(typeof call.contents).toBe('object');
      if (typeof call.contents === 'object' && 'parts' in call.contents) {
        expect(call.contents.parts[0]).toEqual({
          inlineData: {
            mimeType: 'image/png',
            data: sampleBase64,
          },
        });
        const textPart = call.contents.parts[1] as { text: string };
        expect(textPart.text).toContain('User Concept:');
        expect(textPart.text).toContain('pose_side_lying');
      }
    }

    expect(successOutcome.source).toBe('gemini');
    expect(successOutcome.imageIncluded).toBe(true);
    expect(successOutcome.prompt).toContain('lying on the side');
    expect(successOutcome.prompt).not.toContain('standing upright');
    expect(
      successOutcome.imageOverrideNotices.some((n) => n.includes('الوضعية'))
    ).toBe(true);
    expect(successOutcome.statusAr).toContain('Gemini');

    // Fallback test 1: Missing configuration (generateContent = null) -> labeled 'deterministic', never 'gemini'
    const missingConfigOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      referenceImageOptIn: false,
      generateContent: null,
    });
    expect(missingConfigOutcome.source).toBe('deterministic');
    expect(missingConfigOutcome.fallbackReason).toBe('missing_configuration');
    expect(missingConfigOutcome.statusAr).toContain('deterministic');

    // Fallback test 2: Quota exceeded (429 RESOURCE_EXHAUSTED) -> labeled 'deterministic', raw error never exposed
    const quotaOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      referenceImageOptIn: false,
      generateContent: async () => {
        throw new Error('429 RESOURCE_EXHAUSTED: Secret internal stack trace');
      },
    });
    expect(quotaOutcome.source).toBe('deterministic');
    expect(quotaOutcome.fallbackReason).toBe('quota_error');
    expect(quotaOutcome.statusAr).not.toContain('Secret internal stack trace');
    expect(quotaOutcome.statusAr).toContain('deterministic');

    // Fallback test 3: Auth error (401/403) -> labeled 'deterministic' with 'auth_error', raw key/error never exposed
    const authOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      referenceImageOptIn: false,
      generateContent: async () => {
        const err = new Error('401 UNAUTHENTICATED: bad key AIzaSySecretKey');
        (err as Error & { status?: number }).status = 401;
        throw err;
      },
    });
    expect(authOutcome.source).toBe('deterministic');
    expect(authOutcome.fallbackReason).toBe('auth_error');
    expect(authOutcome.statusAr).not.toContain('AIzaSySecretKey');
    expect(authOutcome.statusAr).toContain('deterministic');

    // Fallback test 4: Connection failure (ECONNREFUSED / fetch failed) -> labeled 'deterministic' with 'connection_error'
    const connectionOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      referenceImageOptIn: false,
      generateContent: async () => {
        throw new Error('TypeError: fetch failed ECONNREFUSED');
      },
    });
    expect(connectionOutcome.source).toBe('deterministic');
    expect(connectionOutcome.fallbackReason).toBe('connection_error');
    expect(connectionOutcome.statusAr).toContain('تعذر الاتصال');

    // Fallback test 5: Explicit timeoutMs triggers 'timeout' fallback reliably
    const timeoutOutcome = await executeGeminiPromptGeneration({
      rawSelections: userSelections,
      referenceImageOptIn: false,
      timeoutMs: 25,
      generateContent: async () =>
        await new Promise<{ text?: string }>((resolve) => {
          setTimeout(() => resolve({ text: 'late response' }), 150);
        }),
    });
    expect(timeoutOutcome.source).toBe('deterministic');
    expect(timeoutOutcome.fallbackReason).toBe('timeout');
    expect(timeoutOutcome.statusAr).toContain('انتهاء مهلة');
  });

  it('routes Mirror Studio through Gemini and preserves the Mirror Studio JSON schema with deterministic fallback on invalid output', async () => {
    const mirrorSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_prop_coffee_mug',
      mirrorClothing: 'dark_oversized_hoodie',
      mirrorBottomClothing: 'navy_sports_track_pants',
      focusTarget: 'mirror_reflection',
      exposurePreference: 'flash_highlight_controlled',
    };

    const validMirrorJson = buildMirrorStudioJsonPrompt(mirrorSelections);
    let geminiCalled = false;

    const mirrorOutcome = await executeGeminiPromptGeneration({
      rawSelections: mirrorSelections,
      generateContent: async (params) => {
        geminiCalled = true;
        expect(String(params.contents)).toContain('Mirror Studio JSON Schema');
        return {
          text: `\`\`\`json\n${validMirrorJson}\n\`\`\``,
        };
      },
    });

    expect(geminiCalled).toBe(true);
    expect(mirrorOutcome.source).toBe('gemini');
    const parsed = JSON.parse(mirrorOutcome.prompt);
    expect(parsed.SYSTEM_DIRECTIVE).toBe('EXECUTE_PHOTOGRAPHIC_CAPTURE');
    expect(parsed.PHYSICAL_MECHANICS).toContain('coffee mug');
    expect(parsed.PHYSICAL_MECHANICS).toContain('dark oversized hoodie');
    expect(parsed.CAMERA_PIPELINE.Optics_Physics).toContain(
      'focus on the reflected subject with coherent mirror geometry'
    );
    expect(parsed.CAMERA_PIPELINE.Sensor_Response).toContain(
      'controlled highlight exposure retaining realistic flash highlights'
    );

    // If Gemini returns broken JSON or omits required Mirror Studio schema keys, fall back to deterministic JSON
    const brokenMirrorOutcome = await executeGeminiPromptGeneration({
      rawSelections: mirrorSelections,
      generateContent: async () => ({
        text: '{"SYSTEM_DIRECTIVE": "INVALID_SCHEMA"}',
      }),
    });
    expect(brokenMirrorOutcome.source).toBe('deterministic');
    expect(brokenMirrorOutcome.fallbackReason).toBe('invalid_model_response');
    const fallbackParsed = JSON.parse(brokenMirrorOutcome.prompt);
    expect(fallbackParsed.SYSTEM_DIRECTIVE).toBe(
      'EXECUTE_PHOTOGRAPHIC_CAPTURE'
    );
    expect(fallbackParsed.PHYSICAL_MECHANICS).toContain('coffee mug');
  });

  it('uses gemini-3.1-flash-lite by default and reserves gemini-4-hydrogen for explicit High Thinking mode', async () => {
    const defaultReq = buildGeminiGenerateContentRequest(DEFAULT_SELECTIONS, {
      fastMode: false,
      useHighThinking: false,
    });
    expect(defaultReq.request.model).toBe('gemini-3.1-flash-lite');

    const highThinkingReq = buildGeminiGenerateContentRequest(
      DEFAULT_SELECTIONS,
      {
        fastMode: false,
        useHighThinking: true,
      }
    );
    expect(highThinkingReq.request.model).toBe('gemini-4-hydrogen');

    const fallbackModelOutcome = await executeGeminiPromptGeneration({
      rawSelections: DEFAULT_SELECTIONS,
      useHighThinking: true,
      fastMode: false,
      referenceImageOptIn: true,
      referenceImage: {
        base64Data:
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
        mimeType: 'image/png',
      },
      generateContent: async (params) => {
        if (
          typeof params.contents === 'object' &&
          'parts' in params.contents &&
          params.contents.parts.some(
            (p) => 'text' in p && p.text.includes('Analyze ONLY visible scene facts')
          )
        ) {
          expect(params.model).toBe('gemini-3.1-flash-lite');
          return {
            text: JSON.stringify({
              setting: 'indoor',
              backgroundElements: 'wooden bedside table',
              pose: 'unknown',
              framing: 'unknown',
              cameraPerspective: 'front_selfie',
              lightingDirectionAndQuality: 'unknown',
              colorPalette: 'unknown',
              visibleClothing: 'unknown',
            }),
          };
        }
        return {
          text: wrapInMarkdownCodeBlock(
            buildDeterministicEnglishPrompt(DEFAULT_SELECTIONS, 0)
          ),
          model: 'gemini-3.1-flash-lite',
        };
      },
    });
    expect(fallbackModelOutcome.source).toBe('gemini');
    expect(fallbackModelOutcome.model).toBe('gemini-3.1-flash-lite');
  });

  it('resolveClientGenerationOutcome displays Gemini source only on valid Gemini output and preserves safe fallback reasons otherwise', () => {
    const targetSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      lowerBodyColor: 'charcoal_black',
    };
    const validPrompt = buildDeterministicEnglishPrompt(targetSelections, 0);

    // 1. Valid server Gemini response -> UI displays source='gemini' and no fallbackReason
    const geminiUi = resolveClientGenerationOutcome({
      ok: true,
      status: 200,
      targetSelections,
      styleVariant: 0,
      data: {
        source: 'gemini',
        result: wrapInMarkdownCodeBlock(validPrompt),
        prompt: validPrompt,
        statusAr: 'تم توليد البرومبت بنجاح عبر Gemini.',
        diagnostics: {
          requestId: 'req_12345678',
          route: '/api/generate-prompt',
          model: 'gemini-3.1-flash-lite',
          durationMs: 1420,
          httpStatusClass: '2xx',
          apiKeyPresent: true,
        },
      },
    });
    expect(geminiUi.source).toBe('gemini');
    expect(geminiUi.fallbackReason).toBeNull();
    expect(geminiUi.statusAr).toContain('Gemini');
    expect(geminiUi.diagnostics?.model).toBe('gemini-3.1-flash-lite');

    // 2. Server deterministic fallback (e.g., quota_error) -> UI stays 'deterministic' with safe reason
    const serverFallbackUi = resolveClientGenerationOutcome({
      ok: true,
      status: 200,
      targetSelections,
      styleVariant: 0,
      data: {
        source: 'deterministic',
        fallbackReason: 'quota_error',
        result: wrapInMarkdownCodeBlock(validPrompt),
        prompt: validPrompt,
        statusAr:
          'تم استخدام التوليد القياسي المحلي (deterministic) بسبب تجاوز حد الاستخدام المؤقت لخدمة Gemini.',
      },
    });
    expect(serverFallbackUi.source).toBe('deterministic');
    expect(serverFallbackUi.fallbackReason).toBe('quota_error');
    expect(serverFallbackUi.statusAr).toContain('deterministic');

    // 3. Server claims source='gemini' but prompt violates scene constraints -> client downgrades to deterministic
    const invalidClaimedUi = resolveClientGenerationOutcome({
      ok: true,
      status: 200,
      targetSelections,
      styleVariant: 0,
      data: {
        source: 'gemini',
        result: 'Invalid short prompt without required constraints',
        prompt: 'Invalid short prompt without required constraints',
      },
    });
    expect(invalidClaimedUi.source).toBe('deterministic');
    expect(invalidClaimedUi.fallbackReason).toBe('invalid_model_response');
    expect(invalidClaimedUi.statusAr).toContain('deterministic');

    // 4. Client AbortError -> timeout fallback; TypeError -> connection_error fallback
    const abortErr = new Error('The operation was aborted.');
    abortErr.name = 'AbortError';
    const abortUi = resolveClientGenerationOutcome({
      ok: false,
      status: 0,
      error: abortErr,
      targetSelections,
    });
    expect(abortUi.source).toBe('deterministic');
    expect(abortUi.fallbackReason).toBe('timeout');

    const networkUi = resolveClientGenerationOutcome({
      ok: false,
      status: 0,
      error: new TypeError('Failed to fetch'),
      targetSelections,
    });
    expect(networkUi.source).toBe('deterministic');
    expect(networkUi.fallbackReason).toBe('connection_error');
  });

  it('retries transient 503 errors with backoff, does not retry 401 auth errors, and classifies numeric 503 as connection_error', async () => {
    let attempts = 0;
    const recovered = await callWithTransientRetry(
      async () => {
        attempts += 1;
        if (attempts < 3) {
          const err = new Error('Service Unavailable');
          (err as Error & { status?: number }).status = 503;
          throw err;
        }
        return 'ok';
      },
      { maxRetries: 2, baseDelayMs: 1 }
    );
    expect(recovered).toBe('ok');
    expect(attempts).toBe(3);

    let authAttempts = 0;
    await expect(
      callWithTransientRetry(
        async () => {
          authAttempts += 1;
          const err = new Error('Unauthorized');
          (err as Error & { status?: number }).status = 401;
          throw err;
        },
        { maxRetries: 2, baseDelayMs: 1 }
      )
    ).rejects.toThrow('Unauthorized');
    expect(authAttempts).toBe(1);

    expect(isTransientGeminiError({ status: 503 })).toBe(true);
    expect(isTransientGeminiError(new Error('Model timeout after 14000ms'))).toBe(true);
    expect(isTransientGeminiError({ status: 401 })).toBe(false);
    expect(classifyGeminiFallbackReason({ status: 503 })).toBe(
      'connection_error'
    );
  });

  it('embeds the shared REFERENCE_FACE_PRESERVATION_RULE consistently across system instructions, Scene Builder, Strict Editing, Mirror Studio JSON, and deterministic fallbacks while allowing user-selected expressions', () => {
    // 1. Verify shared rule requirements (anatomy, prohibitions, allowances, and no guaranteed match claim)
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('High-priority visual-preservation goal');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('overall face shape and facial proportions');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('forehead, cheekbone contours, jawline, chin shape');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('eye shape and spacing, eyebrows, nose shape, lips');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('hairline, natural skin tone, distinctive visible features, and natural facial asymmetry');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('Do not beautify, slim or widen the face, change facial geometry, enlarge eyes or lips, narrow the nose, change skin tone, artificially symmetrize the face, or change the hairline');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('do not alter facial structure to fit a pose, lighting setup, clothing change, or beauty style');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('changing expression only, never facial anatomy');
    expect(REFERENCE_FACE_PRESERVATION_RULE).toContain('do not invent or reconstruct facial areas that are hidden or unclear');
    expect(REFERENCE_FACE_PRESERVATION_RULE).not.toMatch(/100%|guaranteed/i);

    // 2. Included in system instructions
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(STRICT_IMAGE_EDITING_SYSTEM_INSTRUCTION).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );

    // 3. Scene Builder (Gemini request + deterministic fallback) with user-selected expression
    const sceneSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      expression: 'spontaneous_laugh',
    };
    const scenePrompt = buildDeterministicEnglishPrompt(sceneSel, 0);
    expect(scenePrompt.startsWith(CONCISE_REFERENCE_FACE_PRESERVATION_RULE)).toBe(true);
    expect(scenePrompt).toContain('a warm, spontaneous candid laugh');
    expect(validatePromptOutput(scenePrompt, sceneSel).valid).toBe(true);
    const sceneGeminiReq = buildGeminiGenerateContentRequest(sceneSel);
    expect(String(sceneGeminiReq.request.contents)).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(sceneGeminiReq.request.config?.systemInstruction).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );

    // 4. Strict Editing (concise + full_12_rules + Gemini request + fallback)
    const strictConciseSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictOutputFormat: 'concise_prompt',
    };
    const strictConcise = buildDeterministicEnglishPrompt(strictConciseSel, 0);
    expect(strictConcise.startsWith(CONCISE_REFERENCE_FACE_PRESERVATION_RULE)).toBe(true);
    expect(validatePromptOutput(strictConcise, strictConciseSel).valid).toBe(true);

    const strictFullSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictOutputFormat: 'full_12_rules',
    };
    const strictFull = buildDeterministicEnglishPrompt(strictFullSel, 0);
    expect(strictFull).toContain('[01 — REFERENCE IDENTITY AND FACE PRESERVATION]');
    expect(strictFull).toContain(REFERENCE_FACE_PRESERVATION_RULE);
    expect(validatePromptOutput(strictFull, strictFullSel).valid).toBe(true);

    const strictGeminiReq = buildGeminiGenerateContentRequest(strictConciseSel);
    expect(String(strictGeminiReq.request.contents)).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );

    // 5. Mirror Studio JSON (Structural_Integrity + GEMINI_EXECUTION_RULE + user-selected expression)
    const mirrorSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorExpression: 'asymmetrical_smirk',
    };
    const mirrorJsonStr = buildMirrorStudioJsonPrompt(mirrorSel);
    const mirrorParsed = JSON.parse(mirrorJsonStr);
    expect(mirrorParsed.SYSTEM_DIRECTIVE).toBe('EXECUTE_PHOTOGRAPHIC_CAPTURE');
    expect(mirrorParsed.GEMINI_EXECUTION_RULE).toContain(
      CONCISE_REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(mirrorParsed.SUBJECT_IDENTITY_LOCK.Structural_Integrity).toBe(
      REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(mirrorParsed.PHYSICAL_MECHANICS).toContain(
      'Subtle asymmetrical half-smile on one side'
    );
    expect(validatePromptOutput(mirrorJsonStr, mirrorSel).valid).toBe(true);

    const mirrorGeminiReq = buildGeminiGenerateContentRequest(mirrorSel);
    expect(String(mirrorGeminiReq.request.contents)).toContain(
      REFERENCE_FACE_PRESERVATION_RULE
    );

    // 6. Validation rejects Gemini responses that drop face-preservation rules across workflows
    const sceneWithoutFaceRule = scenePrompt.replace(
      CONCISE_REFERENCE_FACE_PRESERVATION_RULE,
      'Use the person from the reference image for this photo.'
    );
    const missingFaceSceneCheck = validatePromptOutput(sceneWithoutFaceRule, sceneSel);
    expect(missingFaceSceneCheck.valid).toBe(false);

    const mirrorWithoutFaceRule = JSON.stringify({
      ...mirrorParsed,
      SUBJECT_IDENTITY_LOCK: {
        ...mirrorParsed.SUBJECT_IDENTITY_LOCK,
        Structural_Integrity: 'Keep face similar.',
      },
    });
    const missingFaceMirrorCheck = validatePromptOutput(mirrorWithoutFaceRule, mirrorSel);
    expect(missingFaceMirrorCheck.valid).toBe(false);

    // 7. Validation accepts natural lighting paraphrases in Scene Builder when face preservation is intact
    const bedsideParaphraseSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      lighting: 'warm_bedside_lamp',
    };
    const bedsideBase = buildDeterministicEnglishPrompt(bedsideParaphraseSel, 0);
    const bedsideParaphrased = bedsideBase.replace(
      /cozy warm ambient light from a bedside lamp/gi,
      'soft warm light from a bedside table lamp'
    );
    expect(validatePromptOutput(bedsideParaphrased, bedsideParaphraseSel).valid).toBe(true);

    // 8. Validation accepts natural anti-beauty-filter paraphrases and rejects omitting the constraint
    const strictParaphraseSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictOutputFormat: 'concise_prompt',
      strictLightingMode: 'mode_b_flash_mirror',
    };
    const strictBase = buildDeterministicEnglishPrompt(strictParaphraseSel, 0);
    const strictParaphrased = strictBase.replace(
      /without beauty filters/gi,
      'without plastic smoothing or any beauty filters'
    );
    expect(validatePromptOutput(strictParaphrased, strictParaphraseSel).valid).toBe(true);

    const strictMissingBeautyClause = strictBase.replace(
      /without beauty filters/gi,
      'with natural textures'
    );
    expect(validatePromptOutput(strictMissingBeautyClause, strictParaphraseSel).valid).toBe(false);
  });

  it('accepts natural preserve_reference, rear_mirror_standing, and mirror_studio paraphrases and performs a 1-shot repair when initial Gemini output misses a constraint', async () => {
    // 1. preserve_reference without recolor should accept "exact clothing from the reference photo without recoloring"
    const preserveOnlySel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'preserve_reference',
      clothingColor: 'preserve_reference',
    };
    const preserveBase = buildDeterministicEnglishPrompt(preserveOnlySel, 0);
    const preserveParaphrased = preserveBase.replace(
      /wearing the exact outfit from the reference image/gi,
      'wearing the exact clothing from the reference photo without recoloring'
    );
    expect(validatePromptOutput(preserveParaphrased, preserveOnlySel).valid).toBe(true);

    const preserveViolated = preserveBase.replace(
      /wearing the exact outfit from the reference image/gi,
      'wearing the exact clothing from the reference photo and recolor the pants blue'
    );
    expect(validatePromptOutput(preserveViolated, preserveOnlySel).valid).toBe(false);

    // 2. rear_mirror_standing paraphrase in strict_editing mode_b
    const modeBSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictOutputFormat: 'concise_prompt',
      strictLightingMode: 'mode_b_flash_mirror',
    };
    const modeBBase = buildDeterministicEnglishPrompt(modeBSel, 0);
    const modeBParaphrased = modeBBase.replace(
      /standing upright naturally in front of a bedroom mirror/gi,
      'standing casually in front of a bedroom mirror'
    );
    expect(validatePromptOutput(modeBParaphrased, modeBSel).valid).toBe(true);

    // 3. mirror_studio accepts natural focus & balanced exposure paraphrases
    const mirrorSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      focusTarget: 'subject_face',
      exposurePreference: 'balanced',
    };
    const mirrorParsed = JSON.parse(buildMirrorStudioJsonPrompt(mirrorSel));
    mirrorParsed.CAMERA_PIPELINE.Optics_Physics =
      'Smartphone rear camera focused on the face with authentic mirror optics.';
    mirrorParsed.CAMERA_PIPELINE.Sensor_Response =
      'Natural smartphone balanced dynamic range with subtle shadow grain.';
    expect(validatePromptOutput(JSON.stringify(mirrorParsed), mirrorSel).valid).toBe(true);

    // 4. executeGeminiPromptGeneration repairs a single missing constraint via 1 fast text-only repair pass
    let callCount = 0;
    const validBaseline = buildDeterministicEnglishPrompt(modeBSel, 0);
    const brokenDraft = validBaseline.replace(/without beauty filters/gi, 'with natural skin');
    const repairedOutcome = await executeGeminiPromptGeneration({
      rawSelections: modeBSel,
      timeoutMs: 38000,
      generateContent: async (params) => {
        callCount++;
        if (callCount === 1) {
          return { text: `\`\`\`text\n${brokenDraft}\n\`\`\``, model: 'gemini-3.1-flash-lite' };
        }
        expect(String(params.contents)).toContain('Validation failures to fix');
        return { text: `\`\`\`text\n${validBaseline}\n\`\`\``, model: 'gemini-3.1-flash-lite' };
      },
    });
    expect(callCount).toBe(2);
    expect(repairedOutcome.source).toBe('gemini');
    expect(repairedOutcome.fallbackReason).toBeUndefined();
  });

  it('supports independent structured upper-body clothing controls and realistic fabric rendering in Scene Builder without altering lower-body selections', () => {
    const selections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'tshirt_and_pants',
      clothingColor: 'blue',
      upperGarment: 'flannel_shirt',
      upperGarmentColor: 'forest_green',
      upperGarmentMaterial: 'flannel',
      upperGarmentFit: 'relaxed',
      upperGarmentPattern: 'plaid',
    };

    const normalized = normalizeSelections(selections);
    expect(normalized.clothingEdits.mode).toBe('full_outfit');
    expect(normalized.clothingEdits.preserveUpperClothing).toBe(false);
    expect(normalized.clothingEdits.upperGarment).toBe('flannel_shirt');
    expect(normalized.clothingEdits.upperGarmentColor).toBe('forest_green');
    expect(normalized.clothingEdits.upperGarmentMaterial).toBe('flannel');
    expect(normalized.clothingEdits.upperGarmentFit).toBe('relaxed');
    expect(normalized.clothingEdits.upperGarmentPattern).toBe('plaid');
    expect(normalized.clothingEdits.lowerClothingPhrase).toContain('muted navy');

    const prompt = buildDeterministicEnglishPrompt(selections, 0);
    expect(prompt.toLowerCase()).toContain('flannel shirt');
    expect(prompt.toLowerCase()).toContain('forest green');
    expect(prompt.toLowerCase()).toContain('plaid');
    expect(prompt.toLowerCase()).toContain('relaxed');
    expect(prompt.toLowerCase()).toContain('muted navy');
    // Realistic fabric rendering + negative constraints
    expect(prompt).toMatch(/weave|flannel/i);
    expect(prompt).toMatch(/collar|cuffs|seams/i);
    expect(prompt).toMatch(/shoulders, elbows, chest, and waist/i);
    expect(prompt).toMatch(/avoiding plastic cloth/i);
    expect(prompt).toMatch(/invented logos/i);
    expect(prompt.toLowerCase()).not.toContain('undetectable ai');
    expect(validatePromptOutput(prompt, selections).valid).toBe(true);

    // Gemini request includes the typed upper garment keys and custom text when specified
    const customSelections: SelfieSelections = {
      ...selections,
      upperGarment: 'custom_upper_garment',
      customUpperGarmentText: 'breathable mandarin-collar tunic',
      upperGarmentColor: 'custom_upper_color',
      customUpperColorText: 'muted terracotta',
      upperGarmentMaterial: 'linen_cotton_blend',
      upperGarmentPattern: 'subtle_texture',
    };
    const geminiReq = buildGeminiGenerateContentRequest(customSelections);
    const reqText = String(geminiReq.request.contents);
    expect(reqText).toContain('"upperGarment":"custom_upper_garment"');
    expect(reqText).toContain('"upperGarmentColor":"custom_upper_color"');
    expect(reqText).toContain('"upperGarmentMaterial":"linen_cotton_blend"');
    expect(reqText).toContain('"upperGarmentFit":"relaxed"');
    expect(reqText).toContain('"upperGarmentPattern":"subtle_texture"');

    const customPrompt = buildDeterministicEnglishPrompt(customSelections, 0);
    expect(customPrompt.toLowerCase()).toContain('mandarin-collar tunic');
    expect(customPrompt.toLowerCase()).toContain('muted terracotta');
    expect(customPrompt.toLowerCase()).toContain('linen-cotton');
    expect(validatePromptOutput(customPrompt, customSelections).valid).toBe(true);
  });

  it('wires structured upper-body selections into Mirror Studio JSON while keeping bottom clothing independent', () => {
    const mirrorSelections: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorBottomClothing: 'dark_grey_sweatpants',
      upperGarment: 'lightweight_overshirt',
      upperGarmentColor: 'denim_blue',
      upperGarmentMaterial: 'chambray_denim',
      upperGarmentFit: 'oversized',
      upperGarmentPattern: 'solid',
    };

    const jsonStr = buildMirrorStudioJsonPrompt(mirrorSelections);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.UPPER_GARMENT_SPEC).toBeDefined();
    expect(parsed.UPPER_GARMENT_SPEC.preserve_reference).toBe(false);
    expect(parsed.UPPER_GARMENT_SPEC.garment).toBe('lightweight_overshirt');
    expect(parsed.UPPER_GARMENT_SPEC.color).toBe('denim_blue');
    expect(parsed.UPPER_GARMENT_SPEC.material).toBe('chambray_denim');
    expect(parsed.UPPER_GARMENT_SPEC.fit).toBe('oversized');
    expect(parsed.UPPER_GARMENT_SPEC.pattern).toBe('solid');
    expect(parsed.UPPER_GARMENT_SPEC.fabric_physics).toMatch(
      /shoulders, elbows, chest, and waist/i
    );
    expect(parsed.PHYSICAL_MECHANICS).toContain('lightweight collared overshirt');
    expect(parsed.PHYSICAL_MECHANICS).toContain('dark grey cotton sweatpants');
    expect(parsed.SUBJECT_IDENTITY_LOCK.ANTI_AI_FILTERS).toMatch(/plastic-looking cloth/i);
    expect(parsed.SUBJECT_IDENTITY_LOCK.ANTI_AI_FILTERS).toMatch(/invented logos/i);
    expect(jsonStr.toLowerCase()).not.toContain('undetectable ai');

    expect(validatePromptOutput(jsonStr, mirrorSelections).valid).toBe(true);

    // Reject Mirror Studio JSON if model replaces upper garment spec or drops fabric/material
    const brokenMirror = JSON.stringify({
      ...parsed,
      UPPER_GARMENT_SPEC: {
        ...parsed.UPPER_GARMENT_SPEC,
        material: 'silk',
      },
      PHYSICAL_MECHANICS: parsed.PHYSICAL_MECHANICS.replace(/chambray|denim/gi, 'silk'),
    });
    expect(validatePromptOutput(brokenMirror, mirrorSelections).valid).toBe(false);
  });

  it('preserves original upper clothing in Strict Editing by default and allows independent upper+lower editing only on explicit opt-in', () => {
    // 1. Default strict_editing (strictUpperClothingEditEnabled = false) preserves upper clothing even if upper fields exist
    const defaultStrict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      strictOutputFormat: 'concise_prompt',
      lowerBodyColor: 'deep_navy',
      strictUpperClothingEditEnabled: false,
      upperGarment: 'knit_sweater',
      upperGarmentColor: 'burgundy',
    };
    const defaultNorm = normalizeSelections(defaultStrict);
    expect(defaultNorm.clothingEdits.mode).toBe('recolor_lower_only');
    expect(defaultNorm.clothingEdits.preserveUpperClothing).toBe(true);
    const defaultPrompt = buildDeterministicEnglishPrompt(defaultStrict, 0);
    expect(defaultPrompt.toLowerCase()).not.toContain('burgundy');
    expect(defaultPrompt.toLowerCase()).not.toContain('knit sweater');
    expect(defaultPrompt).toMatch(/deep navy/i);
    expect(validatePromptOutput(defaultPrompt, defaultStrict).valid).toBe(true);

    // 2. Explicit opt-in enables independent upper garment editing alongside lowerBodyColor
    const optedInConcise: SelfieSelections = {
      ...defaultStrict,
      strictUpperClothingEditEnabled: true,
      upperGarment: 'henley',
      upperGarmentColor: 'sage',
      upperGarmentMaterial: 'waffle_knit',
      upperGarmentFit: 'regular',
      upperGarmentPattern: 'subtle_texture',
    };
    const optInNorm = normalizeSelections(optedInConcise);
    expect(optInNorm.clothingEdits.mode).toBe('edit_both_independently');
    expect(optInNorm.clothingEdits.preserveUpperClothing).toBe(false);
    expect(optInNorm.clothingEdits.lowerBodyColorPhrase).toContain('deep navy');

    const concisePrompt = buildDeterministicEnglishPrompt(optedInConcise, 0);
    expect(concisePrompt.toLowerCase()).toContain('henley');
    expect(concisePrompt.toLowerCase()).toContain('sage');
    expect(concisePrompt.toLowerCase()).toContain('waffle');
    expect(concisePrompt.toLowerCase()).toContain('deep navy');
    expect(validatePromptOutput(concisePrompt, optedInConcise).valid).toBe(true);

    const optedInFull: SelfieSelections = {
      ...optedInConcise,
      strictOutputFormat: 'full_12_rules',
    };
    const fullPrompt = buildDeterministicEnglishPrompt(optedInFull, 0);
    expect(fullPrompt).toContain('[02 — INDEPENDENT LOWER & UPPER CLOTHING EDITS]');
    expect(fullPrompt.toLowerCase()).toContain('waffle');
    expect(fullPrompt.toLowerCase()).toContain('deep navy');
    expect(fullPrompt.toLowerCase()).not.toContain('undetectable ai');
    expect(validatePromptOutput(fullPrompt, optedInFull).valid).toBe(true);
  });

  it('enforces preserve_reference precedence and material/fit/pattern compatibility rules across garments', () => {
    // 1. Preserve-reference upper garment locks/overrides conflicting upper-garment color/material
    const conflictPreserve: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'tshirt_and_pants',
      clothingColor: 'gray',
      upperGarment: 'preserve_reference',
      upperGarmentColor: 'burgundy',
      upperGarmentMaterial: 'fleece',
    };
    const conflictCheck = detectSelectionConflicts(conflictPreserve);
    expect(conflictCheck.conflicts).toContain('PRESERVE_UPPER_GARMENT_CONFLICT');

    const compatPreserve = enforceCompatibilityRules(conflictPreserve);
    expect(compatPreserve.selections.upperGarmentColor).toBe('preserve_reference');
    const preservePrompt = buildDeterministicEnglishPrompt(conflictPreserve, 0);
    expect(preservePrompt.toLowerCase()).toContain('preserving the original upper-body garment');
    expect(preservePrompt.toLowerCase()).not.toContain('burgundy');
    expect(preservePrompt.toLowerCase()).toContain('soft heather gray');
    expect(validatePromptOutput(preservePrompt, conflictPreserve).valid).toBe(false);
    expect(validatePromptOutput(preservePrompt, compatPreserve.selections).valid).toBe(true);

    // 2. chambray_denim is valid on button_up_shirt / lightweight_overshirt, but auto-adjusted on knit_sweater & hoodie
    expect(getCompatibleMaterialsForGarment('button_up_shirt')).toContain('chambray_denim');
    expect(getCompatibleMaterialsForGarment('knit_sweater')).not.toContain('chambray_denim');
    expect(getCompatibleFitsForGarment('hoodie')).not.toContain('fitted');
    expect(getCompatiblePatternsForGarment('hoodie')).not.toContain('plaid');

    const incompatibleGarmentCombo: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      clothing: 'hoodie_and_pants',
      upperGarment: 'hoodie',
      upperGarmentColor: 'olive',
      upperGarmentMaterial: 'chambray_denim',
      upperGarmentFit: 'fitted',
      upperGarmentPattern: 'plaid',
    };
    const resolvedCompat = enforceCompatibilityRules(incompatibleGarmentCombo);
    expect(resolvedCompat.selections.upperGarmentMaterial).not.toBe('chambray_denim');
    expect(resolvedCompat.selections.upperGarmentFit).not.toBe('fitted');
    expect(resolvedCompat.selections.upperGarmentPattern).not.toBe('plaid');
    expect(resolvedCompat.adjustments.length).toBeGreaterThanOrEqual(3);

    const resolvedPrompt = buildDeterministicEnglishPrompt(incompatibleGarmentCombo, 0);
    expect(resolvedPrompt.toLowerCase()).toContain('hoodie');
    expect(resolvedPrompt.toLowerCase()).toContain('olive');
    expect(validatePromptOutput(resolvedPrompt, incompatibleGarmentCombo).valid).toBe(true);
  });

  it('uses Xiaomi 15 Ultra across defaults, normalized config, Gemini request, and Mirror Studio JSON without inventing metadata', () => {
    expect(DEFAULT_SELECTIONS.deviceModel).toBe('Xiaomi 15 Ultra');
    expect(DEFAULT_SELECTIONS.mirrorLensProfile).toBe('main_23mm');
    expect(DEFAULT_SELECTIONS.mirrorMotionBlurEnabled).toBe(false);

    const mirrorSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorLensProfile: 'main_23mm',
    };

    const normalized = normalizeSelections(mirrorSel);
    expect(normalized.subjectFacts.deviceModel).toBe('Xiaomi 15 Ultra');
    expect(normalized.mirrorLensProfile).toBe('main_23mm');
    expect(normalized.mirrorCameraSpec?.specSummary).toBe('23mm-equivalent, f/1.63, OIS');

    const jsonStr = buildMirrorStudioJsonPrompt(mirrorSel);
    expect(jsonStr).toContain('Xiaomi 15 Ultra');
    expect(jsonStr).not.toMatch(/\bXiaomi\s+15\b(?!\s*Ultra\b)/i);
    expect(jsonStr).not.toMatch(/\b(?:Sony|LYT-900|OV32B|ISO\s*\d+|1\/\d+s)\b/i);

    const parsed = JSON.parse(jsonStr);
    expect(parsed.CAMERA_PIPELINE.Device).toContain('Xiaomi 15 Ultra');
    expect(parsed.CAMERA_PIPELINE.Device).toContain('23mm-equivalent, f/1.63, OIS');
    expect(parsed.CAMERA_PIPELINE.Lens_Profile.equivalent_focal_length_mm).toBe(23);
    expect(parsed.CAMERA_PIPELINE.Lens_Profile.aperture).toBe('f/1.63');
    expect(parsed.SCENE_LIGHTING).toContain('rear LED flash');
    expect(parsed.SCENE_LIGHTING).toContain('flash falloff');
    expect(parsed.PHYSICAL_MECHANICS).toContain('pointing the rear camera at the mirror');
    expect(parsed.PHYSICAL_MECHANICS).toContain('no duplicate phones');

    const req = buildGeminiGenerateContentRequest(mirrorSel);
    const reqText = String(req.request.contents);
    expect(reqText).toContain('Xiaomi 15 Ultra');
    expect(reqText).toContain('23mm-equivalent, f/1.63, OIS');
    expect(validatePromptOutput(jsonStr, mirrorSel).valid).toBe(true);

    // Reject standalone "Xiaomi 15" without "Ultra" and invented ISO/Sony specs
    const wrongModelJson = JSON.stringify({
      ...parsed,
      CAMERA_PIPELINE: {
        ...parsed.CAMERA_PIPELINE,
        Device: 'Xiaomi 15 rear camera (23mm-equivalent, f/1.63, OIS)',
      },
    });
    expect(validatePromptOutput(wrongModelJson, mirrorSel).valid).toBe(false);

    const inventedMetaJson = JSON.stringify({
      ...parsed,
      CAMERA_PIPELINE: {
        ...parsed.CAMERA_PIPELINE,
        Sensor_Response: 'ISO 800 shutter speed 1/60s with Sony LYT-900 sensor.',
      },
    });
    expect(validatePromptOutput(inventedMetaJson, mirrorSel).valid).toBe(false);
  });

  it('supports all four verified Xiaomi 15 Ultra rear lens profiles with optical framing and distance rules', () => {
    const cases: Array<{
      profile: 'main_23mm' | 'telephoto_70mm' | 'ultra_telephoto_100mm' | 'ultrawide_14mm';
      mm: number;
      aperture: string;
      expectedPhrase: RegExp;
    }> = [
      {
        profile: 'main_23mm',
        mm: 23,
        aperture: 'f/1.63',
        expectedPhrase: /23mm-equivalent,\s*f\/1\.63,\s*OIS/i,
      },
      {
        profile: 'telephoto_70mm',
        mm: 70,
        aperture: 'f/1.8',
        expectedPhrase: /farther from the mirror.*optical 70mm/i,
      },
      {
        profile: 'ultra_telephoto_100mm',
        mm: 100,
        aperture: 'f/2.6',
        expectedPhrase: /greater subject-to-mirror distance.*never close range/i,
      },
      {
        profile: 'ultrawide_14mm',
        mm: 14,
        aperture: 'f/2.2',
        expectedPhrase: /115° field of view.*avoid standing very close.*near the center/i,
      },
    ];

    for (const c of cases) {
      const sel: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        mirrorLensProfile: c.profile,
      };
      const jsonStr = buildMirrorStudioJsonPrompt(sel);
      const parsed = JSON.parse(jsonStr);
      expect(parsed.CAMERA_PIPELINE.Lens_Profile.equivalent_focal_length_mm).toBe(c.mm);
      expect(parsed.CAMERA_PIPELINE.Lens_Profile.aperture).toBe(c.aperture);
      expect(`${parsed.CAMERA_PIPELINE.Device} ${parsed.CAMERA_PIPELINE.Optics_Physics}`).toMatch(
        c.expectedPhrase
      );
      expect(validatePromptOutput(jsonStr, sel).valid).toBe(true);
    }

    // Reject calling telephoto optical lenses "digital zoom"
    const teleSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorLensProfile: 'telephoto_70mm',
    };
    const teleParsed = JSON.parse(buildMirrorStudioJsonPrompt(teleSel));
    const digitalZoomBad = JSON.stringify({
      ...teleParsed,
      CAMERA_PIPELINE: {
        ...teleParsed.CAMERA_PIPELINE,
        Optics_Physics: `${teleParsed.CAMERA_PIPELINE.Optics_Physics} Shot with digital zoom from close range.`,
      },
    });
    expect(validatePromptOutput(digitalZoomBad, teleSel).valid).toBe(false);
  });

  it('composes mirror poses cleanly, keeps motion blur off by default, and resolves pose/lens/hand conflicts', () => {
    const composedSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorLensProfile: 'main_23mm',
      mirrorStance: 'light_shoulder_wall_lean',
      mirrorTorsoOrientation: 'three_quarter_look_back',
      mirrorPhonePosition: 'shoulder_level',
      mirrorFreeHandAction: 'tuck_hair_behind_ear',
      mirrorMovementMoment: 'finishing_outfit_adjustment',
    };
    const composedJson = buildMirrorStudioJsonPrompt(composedSel);
    const parsed = JSON.parse(composedJson);
    expect(parsed.POSE_COMPOSITION.stance).toBe('light_shoulder_wall_lean');
    expect(parsed.POSE_COMPOSITION.phone_position).toBe('shoulder_level');
    expect(parsed.POSE_COMPOSITION.free_hand_action).toBe('tuck_hair_behind_ear');
    expect(parsed.POSE_COMPOSITION.motion_blur_enabled).toBe(false);
    expect(parsed.PHYSICAL_MECHANICS).toContain('shoulder lean');
    expect(parsed.PHYSICAL_MECHANICS).toContain('shoulder height');
    expect(parsed.PHYSICAL_MECHANICS).toContain('tucking hair behind the ear');
    expect(parsed.PHYSICAL_MECHANICS.toLowerCase()).not.toContain('motion blur');
    expect(validatePromptOutput(composedJson, composedSel).valid).toBe(true);

    // Motion blur activates ONLY when explicitly toggled on
    const motionBlurSel: SelfieSelections = {
      ...composedSel,
      mirrorMotionBlurEnabled: true,
    };
    const motionBlurParsed = JSON.parse(buildMirrorStudioJsonPrompt(motionBlurSel));
    expect(motionBlurParsed.POSE_COMPOSITION.motion_blur_enabled).toBe(true);
    expect(motionBlurParsed.CAMERA_PIPELINE.Optics_Physics.toLowerCase()).toContain('motion blur');
    expect(validatePromptOutput(JSON.stringify(motionBlurParsed), motionBlurSel).valid).toBe(true);

    // Telephoto 100mm + mirror glass touch conflict resolves to non-close posture
    const lensTouchConflict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorLensProfile: 'ultra_telephoto_100mm',
      mirrorFreeHandAction: 'lightly_touch_mirror',
    };
    const lensConflictDetect = detectSelectionConflicts(lensTouchConflict);
    expect(lensConflictDetect.conflicts).toContain('MIRROR_LENS_DISTANCE_CONFLICT');
    const resolvedLens = enforceCompatibilityRules(lensTouchConflict);
    expect(resolvedLens.selections.mirrorFreeHandAction).toBe('none_relaxed');

    // Dual free-hand prop + action conflict resolves to single clean action
    const dualPropConflict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_prop_coffee_mug',
      mirrorFreeHandAction: 'hold_book',
    };
    const dualCheck = detectSelectionConflicts(dualPropConflict);
    expect(dualCheck.conflicts).toContain('MIRROR_FREE_HAND_CONFLICT');
    const resolvedDual = enforceCompatibilityRules(dualPropConflict);
    expect(resolvedDual.selections.mirrorPose).toBe('pose_contrapposto_standing');
    const resolvedDualJson = buildMirrorStudioJsonPrompt(resolvedDual.selections);
    const resolvedDualParsed = JSON.parse(resolvedDualJson);
    expect(resolvedDualParsed.PHYSICAL_MECHANICS).toContain('paperback book');
    expect(resolvedDualParsed.PHYSICAL_MECHANICS).not.toContain('coffee mug');
  });

  it('enforces conditional physical causality across Scene Builder, Strict Editing, Mirror Studio, and Gemini requests', () => {
    // 1. System instructions & Gemini request include reusable PHYSICAL_CAUSALITY_RULE and forbid "Generate an image of"
    expect(EXPERT_IMAGE_PROMPT_SYSTEM_INSTRUCTION).toContain(PHYSICAL_CAUSALITY_RULE);
    expect(STRICT_IMAGE_EDITING_SYSTEM_INSTRUCTION).toContain(PHYSICAL_CAUSALITY_RULE);

    const bedFrontSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      pose: 'pose_side_lying',
      lighting: 'morning_window',
    };
    const bedFullRule = buildPhysicalCausalityInstruction(
      normalizeSelections(bedFrontSel),
      bedFrontSel,
      'full'
    );
    expect(bedFullRule).toContain(
      'Every visible physical effect must follow from the selected pose, support surfaces, camera geometry, and lighting.'
    );
    const bedFrontPrompt = buildDeterministicEnglishPrompt(bedFrontSel, 0);
    // Bed pose includes mattress/pillow contact deformation & bedding drape, but NO visible phone grip or mirror geometry
    expect(bedFrontPrompt).toMatch(/mattress and pillow contacts/i);
    expect(bedFrontPrompt).toMatch(/hair, clothing, and bedding/i);
    expect(bedFrontPrompt).not.toMatch(/fingers gripping/i);
    expect(bedFrontPrompt).not.toMatch(/mirror reflection/i);
    // Identity opening remains first, no "Generate an image of", causality sits before camera processing
    expect(bedFrontPrompt.startsWith('Use the supplied reference image')).toBe(true);
    expect(bedFrontPrompt).not.toMatch(/^Generate an image of/i);
    expect(bedFrontPrompt.indexOf('Keep one balanced pose')).toBeGreaterThan(
      bedFrontPrompt.indexOf('The subject is ')
    );
    expect(bedFrontPrompt.indexOf('Keep one balanced pose')).toBeLessThan(
      bedFrontPrompt.indexOf('balanced smartphone camera processing')
    );
    expect(validatePromptOutput(bedFrontPrompt, bedFrontSel).valid).toBe(true);

    // 2. Standing mirror pose does NOT mention mattress/pillow compression, DOES mention phone grip & mirror geometry
    const standingMirrorSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'mirror',
      pose: 'rear_mirror_standing',
      gaze: 'at_mirror_reflection',
      phoneColor: 'black',
      lighting: 'mode_b_phone_flash_mirror_dark',
    };
    const standingMirrorPrompt = buildDeterministicEnglishPrompt(standingMirrorSel, 0);
    expect(standingMirrorPrompt).not.toMatch(/\b(?:compressed|indented|depressed)\s+(?:mattress|pillow)s?|(?:mattress|pillow)s?\s+contacts?\b/i);
    expect(standingMirrorPrompt).toMatch(/fingers gripping the phone/i);
    expect(standingMirrorPrompt).toMatch(/mirror reflection matching direct flash alone and camera position/i);
    expect(validatePromptOutput(standingMirrorPrompt, standingMirrorSel).valid).toBe(true);

    // Reject standing prompt if mattress/pillow compression is hallucinated, or front selfie if phone grip is hallucinated
    const hallucinatedStanding = standingMirrorPrompt.replace(
      /visible floor or prop contacts/i,
      'compressed mattress and pillow beneath the subject'
    );
    expect(validatePromptOutput(hallucinatedStanding, standingMirrorSel).valid).toBe(false);

    const hallucinatedFrontGrip = `${bedFrontPrompt} Fingers gripping the smartphone clearly visible in frame.`;
    expect(validatePromptOutput(hallucinatedFrontGrip, bedFrontSel).valid).toBe(false);

    // 3. Stationary rear camera omits mirror reflection and visible phone grip
    const stationaryStandingSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      selfieType: 'front_camera',
      pose: 'rear_desk_profile',
      gaze: 'at_camera_lens',
      framing: 'half_body',
      phoneColor: 'hidden_front_camera',
    };
    const stationaryPrompt = buildDeterministicEnglishPrompt(stationaryStandingSel, 0);
    expect(stationaryPrompt).not.toMatch(/fingers gripping/i);
    expect(stationaryPrompt).not.toMatch(/mirror reflection/i);
    expect(validatePromptOutput(stationaryPrompt, stationaryStandingSel).valid).toBe(true);

    // 4. Screen-only, direct flash, and night mode remain mutually exclusive and reject contradictions
    const screenStrictSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      strictOutputFormat: 'concise_prompt',
    };
    const screenStrictPrompt = buildDeterministicEnglishPrompt(screenStrictSel, 0);
    expect(screenStrictPrompt.startsWith('Use the supplied reference image')).toBe(true);
    expect(screenStrictPrompt).toMatch(/phone-screen light alone without flash/i);
    expect(validatePromptOutput(screenStrictPrompt, screenStrictSel).valid).toBe(true);

    const contradictedLightingPrompt = `${screenStrictPrompt} Direct rear LED flash illuminates the room.`;
    expect(validatePromptOutput(contradictedLightingPrompt, screenStrictSel).valid).toBe(false);

    const nightModeSel: SelfieSelections = {
      ...screenStrictSel,
      phoneProcessingProfile: 'night_mode',
    };
    const nightModePrompt = buildDeterministicEnglishPrompt(nightModeSel, 0);
    expect(nightModePrompt).toMatch(/night-mode illumination without flash/i);
    expect(validatePromptOutput(nightModePrompt, nightModeSel).valid).toBe(true);
    expect(
      validatePromptOutput(`${nightModePrompt} Direct camera flash fires.`, nightModeSel).valid
    ).toBe(false);

    // Strict Editing full_12_rules incorporates conditional causality in [07 & 08] and keeps edit scope
    const strictFullBedSel: SelfieSelections = {
      ...screenStrictSel,
      strictLightingMode: 'mode_b_flash_mirror',
      strictOutputFormat: 'full_12_rules',
      pose: 'rear_mirror_standing',
      gaze: 'at_mirror_reflection',
    };
    const strictFullPrompt = buildDeterministicEnglishPrompt(strictFullBedSel, 0);
    expect(strictFullPrompt).toContain('[07 & 08 — ANATOMICAL, PHYSICAL, AND MIRROR CONSISTENCY]');
    expect(strictFullPrompt).toContain('Keep edits strictly inside the selected edit scope');
    expect(strictFullPrompt).toContain('fingers gripping the single smartphone');
    expect(strictFullPrompt).not.toMatch(/mattress and pillow contacts/i);
    expect(validatePromptOutput(strictFullPrompt, strictFullBedSel).valid).toBe(true);

    // 5. Conditional motion blur: omitted when off, restricted to moving hand when on, rejected when hallucinated
    expect(standingMirrorPrompt.toLowerCase()).not.toContain('motion blur');
    expect(
      validatePromptOutput(`${standingMirrorPrompt} Subtle motion blur across the hand.`, standingMirrorSel).valid
    ).toBe(false);

    const mirrorStillSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_contrapposto_standing',
      mirrorMotionBlurEnabled: false,
    };
    const mirrorStillJson = buildMirrorStudioJsonPrompt(mirrorStillSel);
    const mirrorStillParsed = JSON.parse(mirrorStillJson);
    expect(mirrorStillJson.trim().startsWith('{')).toBe(true);
    expect(mirrorStillJson.trim().endsWith('}')).toBe(true);
    expect(mirrorStillParsed).toHaveProperty('TARGET_AI');
    expect(mirrorStillParsed).toHaveProperty('GEMINI_EXECUTION_RULE');
    expect(mirrorStillParsed).toHaveProperty('SYSTEM_DIRECTIVE', 'EXECUTE_PHOTOGRAPHIC_CAPTURE');
    expect(mirrorStillParsed).toHaveProperty('PRIORITIES');
    expect(mirrorStillParsed).toHaveProperty('SCENE_LIGHTING');
    expect(mirrorStillParsed).toHaveProperty('CAMERA_PIPELINE');
    expect(mirrorStillParsed).toHaveProperty('POSE_COMPOSITION');
    expect(mirrorStillParsed).toHaveProperty('PHYSICAL_MECHANICS');
    expect(mirrorStillParsed).toHaveProperty('SUBJECT_IDENTITY_LOCK');
    expect(mirrorStillParsed.PHYSICAL_MECHANICS.toLowerCase()).not.toContain('motion blur');
    expect(mirrorStillParsed.PHYSICAL_MECHANICS.toLowerCase()).not.toContain('mattress');
    expect(mirrorStillParsed.PHYSICAL_MECHANICS.toLowerCase()).not.toContain('pillow');
    expect(validatePromptOutput(mirrorStillJson, mirrorStillSel).valid).toBe(true);

    const mirrorBedEdgeSel: SelfieSelections = {
      ...mirrorStillSel,
      mirrorPose: 'pose_bed_edge_dynamic',
    };
    const mirrorBedParsed = JSON.parse(buildMirrorStudioJsonPrompt(mirrorBedEdgeSel));
    expect(mirrorBedParsed.PHYSICAL_MECHANICS).toMatch(/mattress and bedding contacts/i);
    expect(validatePromptOutput(JSON.stringify(mirrorBedParsed), mirrorBedEdgeSel).valid).toBe(true);

    const mirrorBlurSel: SelfieSelections = {
      ...mirrorStillSel,
      mirrorMotionBlurEnabled: true,
    };
    const mirrorBlurParsed = JSON.parse(buildMirrorStudioJsonPrompt(mirrorBlurSel));
    expect(mirrorBlurParsed.PHYSICAL_MECHANICS).toMatch(
      /motion blur only on the selected moving free hand/i
    );
    expect(validatePromptOutput(JSON.stringify(mirrorBlurParsed), mirrorBlurSel).valid).toBe(true);

    // 6. Anti-invention: no unsupported body measurements, hidden details, extra props/limbs, or camera metadata
    for (const output of [bedFrontPrompt, screenStrictPrompt, strictFullPrompt, mirrorStillJson]) {
      expect(output).not.toMatch(/^Generate an image of/i);
      expect(output).not.toMatch(/\b(?:cm|kg|lbs|inches|waist\s+size|height\s+\d|Sony|LYT-900|OV32B|ISO\s*\d+|1\/\d+s)\b/i);
    }

    // 7. Gemini request embeds conditional Physical Causality instruction and validation accepts valid paraphrases
    const geminiReq = buildGeminiGenerateContentRequest(standingMirrorSel);
    expect(String(geminiReq.request.contents)).toContain('Physical Causality Rule (Conditional on Scene Config):');
    expect(String(geminiReq.request.contents)).toContain('Do NOT prepend "Generate an image of"');

    const paraphrasedPrompt = standingMirrorPrompt.replace(
      /Keep one balanced pose[^.]+\./i,
      'Every visible physical effect follows from the standing pose, balanced feet, fingers gripping the phone, and direct flash shadows with consistent mirror reflection.'
    );
    expect(validatePromptOutput(paraphrasedPrompt, standingMirrorSel).valid).toBe(true);
  });

  it('keeps upper and lower garment controls strictly independent across Scene Builder, Strict Editing, and Mirror Studio', () => {
    // 1. Scene Builder: changing upper does not alter lower; preserving upper keeps lower edits intact
    const sbPreserveUpperEditLower: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      upperGarment: 'preserve_reference',
      upperGarmentColor: 'preserve_reference',
      lowerGarment: 'jeans',
      lowerGarmentColor: 'denim_blue',
      lowerGarmentMaterial: 'denim',
      lowerGarmentFit: 'straight',
      lowerGarmentPattern: 'washed_fade',
    };
    const sbEnforced1 = enforceCompatibilityRules(sbPreserveUpperEditLower);
    expect(sbEnforced1.selections.upperGarment).toBe('preserve_reference');
    expect(sbEnforced1.selections.lowerGarment).toBe('jeans');
    expect(sbEnforced1.selections.lowerGarmentColor).toBe('denim_blue');
    expect(sbEnforced1.selections.lowerGarmentMaterial).toBe('denim');

    const sbNorm1 = normalizeSelections(sbEnforced1.selections);
    expect(sbNorm1.clothingEdits.preserveUpperClothing).toBe(true);
    expect(sbNorm1.clothingEdits.preserveLowerClothing).toBe(false);
    expect(sbNorm1.clothingEdits.upper.preserveReference).toBe(true);
    expect(sbNorm1.clothingEdits.lower.garment).toBe('jeans');
    expect(sbNorm1.clothingEdits.lower.material).toBe('denim');

    const sbPrompt1 = buildDeterministicEnglishPrompt(sbEnforced1.selections, 0);
    expect(sbPrompt1).toMatch(/original upper-body garment/i);
    expect(sbPrompt1).toContain('denim jeans');
    expect(sbPrompt1).toContain('faded indigo denim blue');
    expect(sbPrompt1).toContain('subtle natural washed fade');
    expect(sbPrompt1).toMatch(/zero color or fabric bleed/i);
    expect(sbPrompt1).toMatch(/without invented logos|without logos/i);
    expect(validatePromptOutput(sbPrompt1, sbEnforced1.selections).valid).toBe(true);

    // 2. Scene Builder: preserve lower while editing upper
    const sbEditUpperPreserveLower: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      upperGarment: 'polo_shirt',
      upperGarmentColor: 'olive',
      upperGarmentMaterial: 'cotton_jersey',
      upperGarmentFit: 'regular',
      upperGarmentPattern: 'solid',
      lowerGarment: 'preserve_reference',
      lowerGarmentColor: 'preserve_reference',
    };
    const sbEnforced2 = enforceCompatibilityRules(sbEditUpperPreserveLower);
    expect(sbEnforced2.selections.upperGarment).toBe('polo_shirt');
    expect(sbEnforced2.selections.lowerGarment).toBe('preserve_reference');
    const sbPrompt2 = buildDeterministicEnglishPrompt(sbEnforced2.selections, 0);
    expect(sbPrompt2).toContain('classic collared polo shirt');
    expect(sbPrompt2).toContain('subdued olive green');
    expect(sbPrompt2).toMatch(/original lower-body garment/i);
    expect(validatePromptOutput(sbPrompt2, sbEnforced2.selections).valid).toBe(true);

    // Editing both independently in Scene Builder keeps separate descriptions with zero bleed
    const sbBoth: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      upperGarment: 'hoodie',
      upperGarmentColor: 'cream',
      upperGarmentMaterial: 'french_terry',
      upperGarmentFit: 'relaxed',
      upperGarmentPattern: 'solid',
      lowerGarment: 'chinos',
      lowerGarmentColor: 'navy',
      lowerGarmentMaterial: 'cotton_twill',
      lowerGarmentFit: 'tapered',
      lowerGarmentPattern: 'subtle_texture',
    };
    const sbBothPrompt = buildDeterministicEnglishPrompt(sbBoth, 0);
    expect(sbBothPrompt).toContain('modest pullover hoodie');
    expect(sbBothPrompt).toContain('subdued warm cream');
    expect(sbBothPrompt).toContain('cotton chinos trousers');
    expect(sbBothPrompt).toContain('deep navy blue');
    expect(sbBothPrompt).toMatch(/zero color bleed/i);
    expect(validatePromptOutput(sbBothPrompt, sbBoth).valid).toBe(true);

    // Validation catches missing lower specs when structured lower is active
    const brokenLowerPrompt = sbBothPrompt.replace(/cotton chinos trousers/gi, 'casual pants');
    expect(validatePromptOutput(brokenLowerPrompt, sbBoth).valid).toBe(false);
    // Validation catches preserving violation when lower is preserve_reference
    const leakedLowerEdit = sbPrompt2.replace(
      /preserving the original lower-body garment from the reference image unchanged/gi,
      'change the lower garment to red sweatpants'
    );
    expect(validatePromptOutput(leakedLowerEdit, sbEnforced2.selections).valid).toBe(false);
  });

  it('supports preserve, recolor-only, and full independent upper/lower edits in Strict Editing and catches bleed or omissions', () => {
    // 1. Preserve both upper & lower in Strict Editing
    const strictPreserveBoth: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      strictOutputFormat: 'full_12_rules',
      strictUpperClothingEditEnabled: false,
      strictLowerClothingMode: 'preserve_reference',
    };
    const enforcedPreserveBoth = enforceCompatibilityRules(strictPreserveBoth);
    const fullPreservePrompt = buildStrictEditingPrompt(enforcedPreserveBoth.selections, 0);
    expect(fullPreservePrompt).toContain('[02 — INDEPENDENT UPPER & LOWER CLOTHING CONTROLS]');
    expect(fullPreservePrompt).toContain('UPPER GARMENT: Preserve the original upper-body garment');
    expect(fullPreservePrompt).toContain('LOWER GARMENT: Preserve the original lower-body garment');
    expect(validatePromptOutput(fullPreservePrompt, enforcedPreserveBoth.selections).valid).toBe(true);

    // Switching back from preserve_reference to recolor_only respects strictLowerClothingMode
    const backToRecolor = enforceCompatibilityRules({
      ...enforcedPreserveBoth.selections,
      strictLowerClothingMode: 'recolor_only',
      lowerBodyColor: 'deep_navy',
    });
    expect(backToRecolor.selections.lowerGarment).toBeUndefined();
    const recolorFullPrompt = buildStrictEditingPrompt(backToRecolor.selections, 0);
    expect(recolorFullPrompt).toContain('[02 — LOWER-BODY CLOTHING COLOR]');
    expect(recolorFullPrompt).toContain('deep navy blue');
    expect(validatePromptOutput(recolorFullPrompt, backToRecolor.selections).valid).toBe(true);

    // 2. Independent edit of upper + lower in Strict Editing (concise & full_12_rules)
    const strictBothEdit: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_b_flash_mirror',
      strictOutputFormat: 'concise_prompt',
      strictUpperClothingEditEnabled: true,
      upperGarment: 'cardigan',
      upperGarmentColor: 'sage',
      upperGarmentMaterial: 'knit',
      upperGarmentFit: 'relaxed',
      upperGarmentPattern: 'subtle_texture',
      strictLowerClothingMode: 'edit_garment',
      lowerGarment: 'tailored_trousers',
      lowerGarmentColor: 'charcoal',
      lowerGarmentMaterial: 'wool_blend_suiting',
      lowerGarmentFit: 'straight',
      lowerGarmentPattern: 'solid',
    };
    const conciseBoth = buildStrictEditingPrompt(strictBothEdit, 0);
    expect(conciseBoth).toContain('modest long-sleeve cardigan');
    expect(conciseBoth).toContain('muted sage green');
    expect(conciseBoth).toContain('tailored trousers');
    expect(conciseBoth).toContain('dark charcoal gray');
    expect(validatePromptOutput(conciseBoth, strictBothEdit).valid).toBe(true);

    const strictBothFull = buildStrictEditingPrompt(
      { ...strictBothEdit, strictOutputFormat: 'full_12_rules' },
      0
    );
    expect(strictBothFull).toContain('[02 — INDEPENDENT LOWER & UPPER CLOTHING EDITS]');
    expect(strictBothFull).toContain('zero cross-garment color bleed');
    expect(validatePromptOutput(strictBothFull, { ...strictBothEdit, strictOutputFormat: 'full_12_rules' }).valid).toBe(true);
  });

  it('normalizes invalid lower-garment material/fit/pattern combinations with clear Arabic adjustment messages and hydrates legacy presets', () => {
    const incompatibleLower: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'scene_builder',
      lowerGarment: 'jeans',
      lowerGarmentColor: 'denim_blue',
      lowerGarmentMaterial: 'athletic_mesh', // invalid for jeans -> denim
      lowerGarmentFit: 'wide_leg',
      lowerGarmentPattern: 'side_stripe', // invalid for jeans -> washed_fade / solid
    };
    const { selections: fixedLower, adjustments } =
      enforceCompatibilityRules(incompatibleLower);
    expect(fixedLower.lowerGarmentMaterial).toBe('denim');
    expect(['solid', 'washed_fade', 'subtle_texture']).toContain(fixedLower.lowerGarmentPattern);
    expect(adjustments.some((a) => a.includes('خامة القماش السفلية'))).toBe(true);
    expect(adjustments.some((a) => a.includes('نقشة القطعة السفلية'))).toBe(true);

    // Legacy preset hydration across all 3 workflows without altering preset intent
    const legacyRecolorPreset = hydrateLegacyClothingSelections({
      workflowMode: 'scene_builder',
      clothing: 'preserve_reference',
      clothingColor: 'blue',
    });
    expect(legacyRecolorPreset.upperGarment).toBe('preserve_reference');
    expect(legacyRecolorPreset.lowerGarment).toBeUndefined();
    expect(
      normalizeSelections(legacyRecolorPreset).clothingEdits.mode
    ).toBe('recolor_lower_only');

    const legacyFullOutfitPreset = hydrateLegacyClothingSelections({
      workflowMode: 'scene_builder',
      clothing: 'hoodie_and_pants',
      clothingColor: 'black',
    });
    expect(legacyFullOutfitPreset.upperGarment).toBe('hoodie');
    expect(legacyFullOutfitPreset.upperGarmentColor).toBe('black');
    expect(legacyFullOutfitPreset.lowerGarment).toBe('sweatpants');
    expect(legacyFullOutfitPreset.lowerGarmentColor).toBe('black');

    const legacyMirrorPreset = hydrateLegacyClothingSelections({
      workflowMode: 'mirror_studio',
      mirrorClothing: 'white_cotton_tshirt',
      mirrorBottomClothing: 'faded_blue_jeans',
    });
    expect(legacyMirrorPreset.upperGarment).toBe('crew_neck_tshirt');
    expect(legacyMirrorPreset.lowerGarment).toBe('jeans');
    expect(legacyMirrorPreset.lowerGarmentColor).toBe('denim_blue');
  });

  it('emits valid Mirror Studio JSON with both UPPER_GARMENT_SPEC and LOWER_GARMENT_SPEC and rejects surrounding non-JSON prose', () => {
    const mirrorBothSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      upperGarment: 'preserve_reference',
      upperGarmentColor: 'preserve_reference',
      lowerGarment: 'joggers',
      lowerGarmentColor: 'olive',
      lowerGarmentMaterial: 'french_terry',
      lowerGarmentFit: 'tapered',
      lowerGarmentPattern: 'solid',
    };
    const jsonOut = buildMirrorStudioJsonPrompt(mirrorBothSel);
    expect(jsonOut.trim().startsWith('{')).toBe(true);
    expect(jsonOut.trim().endsWith('}')).toBe(true);
    const parsed = JSON.parse(jsonOut);
    expect(parsed.UPPER_GARMENT_SPEC.preserve_reference).toBe(true);
    expect(parsed.LOWER_GARMENT_SPEC).toMatchObject({
      preserve_reference: false,
      garment: 'joggers',
      color: 'olive',
      material: 'french_terry',
      fit: 'tapered',
      pattern: 'solid',
    });
    expect(parsed.PHYSICAL_MECHANICS).toContain('olive');
    expect(parsed.PHYSICAL_MECHANICS.toLowerCase()).toContain('french terry');
    expect(parsed.PHYSICAL_MECHANICS.toLowerCase()).toContain('zero color, dye, or fabric bleed');
    expect(validatePromptOutput(jsonOut, mirrorBothSel).valid).toBe(true);

    // Gemini request format rule requires both UPPER_GARMENT_SPEC and LOWER_GARMENT_SPEC with zero prose
    const mirrorReq = buildGeminiGenerateContentRequest(mirrorBothSel);
    expect(String(mirrorReq.request.contents)).toContain('UPPER_GARMENT_SPEC');
    expect(String(mirrorReq.request.contents)).toContain('LOWER_GARMENT_SPEC');

    // Validation catches mismatch in LOWER_GARMENT_SPEC
    const tamperedLowerJson = JSON.stringify({
      ...parsed,
      LOWER_GARMENT_SPEC: {
        ...parsed.LOWER_GARMENT_SPEC,
        color: 'white',
      },
    });
    expect(validatePromptOutput(tamperedLowerJson, mirrorBothSel).valid).toBe(false);

    // Rejects Mirror Studio response with prose outside JSON and falls back cleanly
    const proseWrappedMirror = `Here is your JSON:\n${jsonOut}\nEnjoy!`;
    const resolvedProse = resolveValidatedPromptOrFallback(proseWrappedMirror, mirrorBothSel, 0);
    expect(resolvedProse.source).toBe('deterministic');
    expect(resolvedProse.prompt.trim().startsWith('{')).toBe(true);
    expect(JSON.parse(resolvedProse.prompt).LOWER_GARMENT_SPEC.garment).toBe('joggers');
  });

  it('supports interactive, physically plausible Mirror Studio poses with canonical exclusivity, crop safety, Surprise-Me bundles, and legacy hydration', () => {
    // 1. Every coordinated pose preset builds valid Mirror Studio JSON with adult clothed framing
    for (const presetOpt of MIRROR_POSE_OPTIONS) {
      const spec = MIRROR_POSE_PRESET_SPECS[presetOpt.value];
      const presetSel: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        selfieType: 'mirror',
        mirrorPose: presetOpt.value,
        framing: spec.defaults.framing,
        mirrorStance: spec.defaults.stance,
        mirrorTorsoOrientation: spec.defaults.torsoOrientation,
        phoneHand: spec.defaults.phoneHand,
        mirrorPhonePosition: spec.defaults.phonePosition,
        mirrorFreeHandAction: spec.defaults.freeHandAction,
        mirrorMovementMoment: spec.defaults.movementMoment,
        mirrorGaze: spec.defaults.gaze,
        mirrorPoseEnergy: spec.defaults.energy,
        mirrorSupportObject: spec.defaults.supportObject,
        mirrorMotionBlurEnabled:
          presetOpt.value === 'pose_free_hand_motion_blur',
      };
      const conflictCheck = detectSelectionConflicts(presetSel);
      expect(conflictCheck.valid).toBe(true);
      const out = buildMirrorStudioJsonPrompt(presetSel);
      const parsed = JSON.parse(out);
      expect(parsed.POSE_COMPOSITION.preset).toBe(presetOpt.value);
      expect(parsed.POSE_COMPOSITION.pose_description).toContain('fully clothed adult');
      expect(parsed.PHYSICAL_MECHANICS).toContain('Xiaomi 15 Ultra');
      expect(validatePromptOutput(out, presetSel).valid).toBe(true);
    }

    // 2. Phone hand vs free hand exclusivity: both_hands clears free-hand action and disables options
    const bothHandsConflict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_candid_framing_check',
      framing: 'half_body',
      phoneHand: 'both_hands',
      mirrorFreeHandAction: 'adjust_sleeve_or_collar',
    };
    const bothCheck = detectSelectionConflicts(bothHandsConflict);
    expect(bothCheck.valid).toBe(false);
    expect(
      bothCheck.conflicts.some((c) => c === 'MIRROR_PHONE_HAND_CONFLICT')
    ).toBe(true);
    const { selections: fixedBothHands, adjustments: bothAdj } =
      enforceCompatibilityRules(bothHandsConflict);
    expect(fixedBothHands.mirrorFreeHandAction).toBe('none_relaxed');
    expect(bothAdj.some((a) => a.includes('كلتا اليدين'))).toBe(true);

    const compatBoth = getCompatibleMirrorPoseOptions({
      ...fixedBothHands,
      phoneHand: 'both_hands',
    });
    expect(compatBoth.freeHandActions.adjust_sleeve_or_collar.allowed).toBe(false);
    expect(compatBoth.freeHandActions.adjust_sleeve_or_collar.reasonAr).toBeTruthy();
    expect(compatBoth.supportObjects.coffee_mug.allowed).toBe(false);

    const validBothJson = JSON.parse(buildMirrorStudioJsonPrompt(fixedBothHands));
    const invalidBothJson = JSON.stringify({
      ...validBothJson,
      PHYSICAL_MECHANICS:
        'Holding the phone with both hands while the free hand adjusts collar.',
    });
    expect(validatePromptOutput(invalidBothJson, fixedBothHands).valid).toBe(false);

    // 3. Required support surfaces: leaning & sitting cannot use supportObject: 'none'
    const missingLeanSupport: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_vanity_casual_lean',
      framing: 'half_body',
      mirrorSupportObject: 'none',
    };
    const leanCheck = detectSelectionConflicts(missingLeanSupport);
    expect(
      leanCheck.conflicts.some((c) => c === 'MIRROR_SUPPORT_SURFACE_CONFLICT')
    ).toBe(true);
    const { selections: fixedLean, adjustments: leanAdj } =
      enforceCompatibilityRules(missingLeanSupport);
    expect(fixedLean.mirrorPose).toBe('pose_contrapposto_standing');
    expect(fixedLean.mirrorSupportObject).toBe('none');
    expect(leanAdj.some((a) => a.includes('سطح دعم'))).toBe(true);

    const missingSeatSupport: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_chair_or_stool_sitting',
      framing: 'three_quarter',
      mirrorSupportObject: 'none',
    };
    const seatCheck = detectSelectionConflicts(missingSeatSupport);
    expect(
      seatCheck.conflicts.some((c) => c === 'MIRROR_SUPPORT_SURFACE_CONFLICT')
    ).toBe(true);
    const { selections: fixedSeat, adjustments: seatAdj } =
      enforceCompatibilityRules(missingSeatSupport);
    expect(fixedSeat.mirrorPose).toBe('pose_contrapposto_standing');
    expect(seatAdj.some((a) => a.includes('مقعد'))).toBe(true);

    const validChairSeatedSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_chair_or_stool_sitting',
      framing: 'three_quarter',
      mirrorSupportObject: 'chair',
    };
    const validSeatJson = JSON.parse(
      buildMirrorStudioJsonPrompt(validChairSeatedSel)
    );
    const missingChairProseJson = JSON.stringify({
      ...validSeatJson,
      POSE_COMPOSITION: {
        ...validSeatJson.POSE_COMPOSITION,
        support_object: 'none',
        pose_description: 'Fully clothed adult standing upright in frame.',
      },
      PHYSICAL_MECHANICS:
        'Pointing the rear camera at the mirror while hovering in mid-air.',
    });
    expect(
      validatePromptOutput(missingChairProseJson, validChairSeatedSel).valid
    ).toBe(false);

    // 4. Framing & crop visibility: tight crops never mention legs/knees/feet/ankles in pose_description
    const tightCropConflict: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      framing: 'head_and_shoulders',
      mirrorPose: 'pose_one_foot_forward_knee_bend',
      mirrorStance: 'one_foot_forward',
      mirrorFreeHandAction: 'hand_at_hip_or_pocket',
    };
    const tightConflictRes = detectSelectionConflicts(tightCropConflict);
    expect(
      tightConflictRes.conflicts.some(
        (c) => c === 'MIRROR_FRAMING_VISIBILITY_CONFLICT'
      )
    ).toBe(true);
    const { selections: fixedTight, adjustments: tightAdj } =
      enforceCompatibilityRules(tightCropConflict);
    expect(fixedTight.framing).toBe('head_and_shoulders');
    expect(fixedTight.mirrorStance).toBe('balanced_relaxed');
    expect(fixedTight.mirrorFreeHandAction).toBe('none_relaxed');
    expect(tightAdj.length).toBeGreaterThan(0);

    const tightOut = buildMirrorStudioJsonPrompt(fixedTight);
    const tightParsed = JSON.parse(tightOut);
    expect(tightParsed.POSE_COMPOSITION.pose_description).not.toMatch(
      /\b(leg|legs|knee|knees|foot|feet|ankle|ankles)\b/i
    );
    expect(validatePromptOutput(tightOut, fixedTight).valid).toBe(true);

    const badTightJson = JSON.stringify({
      ...tightParsed,
      POSE_COMPOSITION: {
        ...tightParsed.POSE_COMPOSITION,
        pose_description:
          'A fully clothed adult standing with one knee bent and foot forward.',
      },
    });
    expect(validatePromptOutput(badTightJson, fixedTight).valid).toBe(false);

    // 5. Cascade UI helper checks for crop & lens constraints
    const compatTight = getCompatibleMirrorPoseOptions({
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      framing: 'head_and_shoulders',
      mirrorLensProfile: 'telephoto_70mm',
    });
    expect(compatTight.stances.one_foot_forward.allowed).toBe(false);
    expect(compatTight.stances.soft_knee_bend.allowed).toBe(false);
    expect(compatTight.supportObjects.chair.allowed).toBe(false);
    expect(compatTight.freeHandActions.lightly_touch_mirror.allowed).toBe(false);
    expect(compatTight.freeHandActions.hand_at_hip_or_pocket.allowed).toBe(false);

    // 6. Surprise me ("bundle") produces valid, conflict-free JSON across 20 seeds
    for (let i = 0; i < 20; i += 1) {
      const seed = 1000 + i * 7919;
      const bundle = generateConsistentMirrorPoseBundle(seed);
      const bundleSel: SelfieSelections = {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        selfieType: 'mirror',
        ...bundle,
        background:
          bundle.framing === 'full_body_mirror'
            ? 'full_length_mirror'
            : 'wardrobe',
      };
      expect(detectSelectionConflicts(bundleSel).valid).toBe(true);
      const bundleOut = buildMirrorStudioJsonPrompt(bundleSel);
      expect(validatePromptOutput(bundleOut, bundleSel).valid).toBe(true);

      const randomMirror = generateConsistentRandomSelections(seed, 'mirror_studio');
      expect(detectSelectionConflicts(randomMirror).valid).toBe(true);
      const randomOut = buildMirrorStudioJsonPrompt(randomMirror);
      expect(validatePromptOutput(randomOut, randomMirror).valid).toBe(true);
    }

    // 7. Legacy preset hydration supplies safe pose defaults without breaking valid user choices
    const hydratedMinimal = hydrateLegacySelections({
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_wall_lean_scurve',
    });
    expect(hydratedMinimal.phoneHand).toBeDefined();
    expect(hydratedMinimal.mirrorSupportObject).toBe('wall');
    expect(hydratedMinimal.mirrorPoseEnergy).toBeDefined();
    expect(hydratedMinimal.framing).toBe('full_body_mirror');

    const hydratedUserChoice = hydrateLegacySelections({
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_chair_or_stool_sitting',
      framing: 'three_quarter',
      mirrorSupportObject: 'stool',
      mirrorPoseEnergy: 'candid',
      phoneHand: 'left_hand',
    });
    expect(hydratedUserChoice.framing).toBe('three_quarter');
    expect(hydratedUserChoice.mirrorSupportObject).toBe('stool');
    expect(hydratedUserChoice.mirrorPoseEnergy).toBe('candid');
    expect(hydratedUserChoice.phoneHand).toBe('left_hand');
  });

  it('covers all 15 physics, biomechanics, mirror optics, locked fields, and audit-gate scenarios', async () => {
    // Verify 4 pose categories exist and cover all 26 poses
    expect(MIRROR_POSE_CATEGORY_LIST).toHaveLength(4);
    for (const p of MIRROR_POSE_OPTIONS) {
      expect(p.categoryId).toBeDefined();
    }

    // 1. Right-hand phone hold + left mirror-side correspondence
    const rightHandSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      phoneHand: 'right_hand',
      mirrorPose: 'pose_contrapposto_standing',
    };
    const rightParsed = JSON.parse(buildMirrorStudioJsonPrompt(rightHandSel));
    expect(rightParsed.POSE_COMPOSITION.phone_hand).toBe('right_hand');
    expect(rightParsed.POSE_COMPOSITION.anatomical_hand_mechanics).toMatch(/anatomical right hand/i);
    expect(rightParsed.POSE_COMPOSITION.mirror_reflection_side).toMatch(/anatomical right arm as the phone-holding side/i);
    expect(rightParsed.POSE_COMPOSITION.mirror_reflection_side).toMatch(/anatomical left arm as the free side/i);
    expect(rightParsed.PHYSICAL_MECHANICS).not.toMatch(/holding the smartphone in the left hand/i);

    // 2. Left-hand phone hold with zero right-hand phone-hold leak
    const leftHandSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      phoneHand: 'left_hand',
      mirrorPose: 'pose_contrapposto_standing',
    };
    const leftParsed = JSON.parse(buildMirrorStudioJsonPrompt(leftHandSel));
    expect(leftParsed.POSE_COMPOSITION.phone_hand).toBe('left_hand');
    expect(leftParsed.POSE_COMPOSITION.anatomical_hand_mechanics).toMatch(/anatomical left hand/i);
    expect(leftParsed.POSE_COMPOSITION.mirror_reflection_side).toMatch(/anatomical left arm as the phone-holding side/i);
    expect(leftParsed.POSE_COMPOSITION.mirror_reflection_side).toMatch(/anatomical right arm as the free side/i);
    expect(leftParsed.PHYSICAL_MECHANICS).toMatch(/left hand/i);
    expect(leftParsed.PHYSICAL_MECHANICS).not.toMatch(/holding (?:the |a )?(?:Xiaomi 15 Ultra )?(?:smart)?phone (?:in|with) (?:the )?right hand/i);

    // 3. Sitting on bed edge + localized mattress compression
    const bedSeatedSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_seated_forearm_knee_rest',
      mirrorSupportObject: 'bed_edge',
      framing: 'three_quarter',
    };
    const bedSeatedJson = buildMirrorStudioJsonPrompt(bedSeatedSel);
    const bedSeatedParsed = JSON.parse(bedSeatedJson);
    expect(bedSeatedParsed.POSE_COMPOSITION.support_object).toBe('bed_edge');
    expect(bedSeatedParsed.PHYSICAL_MECHANICS).toMatch(/mattress/i);
    expect(validatePromptOutput(bedSeatedJson, bedSeatedSel).valid).toBe(true);

    // 4. Wall lean contact & weight shift
    const wallLeanSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      selfieType: 'mirror',
      mirrorPose: 'pose_doorway_frame_lean',
      framing: 'full_body_mirror',
    };
    const wallLeanJson = buildMirrorStudioJsonPrompt(wallLeanSel);
    const wallLeanParsed = JSON.parse(wallLeanJson);
    expect(wallLeanParsed.POSE_COMPOSITION.support_object).toBe('wall');
    expect(wallLeanParsed.PHYSICAL_MECHANICS).toMatch(/leaning|weight|contact/i);
    expect(validatePromptOutput(wallLeanJson, wallLeanSel).valid).toBe(true);

    // 5. Direct flash vs angled_reflection geometry
    const directFlashSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      lighting: 'mode_b_phone_flash_mirror_dark',
      flashMirrorGeometry: 'natural_glare',
    };
    const angledFlashSel: SelfieSelections = {
      ...directFlashSel,
      flashMirrorGeometry: 'angled_reflection',
    };
    const directJson = JSON.parse(buildMirrorStudioJsonPrompt(directFlashSel));
    const angledJson = JSON.parse(buildMirrorStudioJsonPrompt(angledFlashSel));
    expect(directJson.SCENE_LIGHTING).toMatch(/flash/i);
    expect(angledJson.SCENE_LIGHTING).toMatch(/off-axis angle|avoid(?:ing)? lens flare/i);

    // 6. Low-light dark bedroom screen-only & night mode without flash
    const screenOnlyMirror: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      lighting: 'mode_a_phone_screen_dark',
      phoneProcessingProfile: 'natural_phone',
    };
    const screenOnlyJson = JSON.parse(buildMirrorStudioJsonPrompt(screenOnlyMirror));
    expect(screenOnlyJson.SCENE_LIGHTING).toMatch(/screen is the sole active light source/i);
    expect(screenOnlyJson.SCENE_LIGHTING).toMatch(/no flash/i);

    const nightModeMirror: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      phoneProcessingProfile: 'night_mode',
    };
    const nightJson = JSON.parse(buildMirrorStudioJsonPrompt(nightModeMirror));
    expect(nightJson.SCENE_LIGHTING).toMatch(/night-mode/i);
    expect(nightJson.SCENE_LIGHTING).toMatch(/no direct flash/i);

    // 7. Pose change preserves reference facial identity
    const standingPrompt = buildDeterministicEnglishPrompt({
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_contrapposto_standing',
    });
    const candidPrompt = buildDeterministicEnglishPrompt({
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_candid_framing_check',
    });
    expect(JSON.parse(standingPrompt).SUBJECT_IDENTITY_LOCK.Structural_Integrity).toBe(
      REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(JSON.parse(candidPrompt).SUBJECT_IDENTITY_LOCK.Structural_Integrity).toBe(
      REFERENCE_FACE_PRESERVATION_RULE
    );
    expect(REFERENCE_FACE_PRESERVATION_RULE).not.toMatch(/100%|height|weight|\bcm\b|\bkg\b/i);

    // 8. Outfit change preserves reference identity + independent upper/lower zero bleed + pose-coupled fabric physics
    const outfitSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_bed_edge_dynamic',
      framing: 'full_body_mirror',
      upperGarment: 'hoodie',
      upperGarmentColor: 'charcoal',
      upperGarmentMaterial: 'fleece',
      upperGarmentFit: 'relaxed',
      upperGarmentPattern: 'solid',
      lowerGarment: 'jeans',
      lowerGarmentColor: 'denim_blue',
      lowerGarmentMaterial: 'denim',
      lowerGarmentFit: 'regular',
      lowerGarmentPattern: 'washed_fade',
    };
    const outfitJson = JSON.parse(buildMirrorStudioJsonPrompt(outfitSel));
    expect(outfitJson.SUBJECT_IDENTITY_LOCK.Structural_Integrity).toBe(REFERENCE_FACE_PRESERVATION_RULE);
    expect(outfitJson.UPPER_GARMENT_SPEC.garment).toBe('hoodie');
    expect(outfitJson.LOWER_GARMENT_SPEC.garment).toBe('jeans');
    expect(outfitJson.UPPER_GARMENT_SPEC.fabric_physics).toMatch(/bend|fold|crease|elbow|seated/i);
    expect(outfitJson.LOWER_GARMENT_SPEC.fabric_physics).toMatch(/denim|seated|knee|hip/i);

    // 9. Tight framing (head_and_shoulders / half_body / three_quarter) omits hidden limbs/clothes
    const tightHeadSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      framing: 'head_and_shoulders',
      mirrorPose: 'pose_candid_framing_check',
      lowerGarment: 'jeans',
      lowerGarmentColor: 'navy',
      lowerGarmentMaterial: 'denim',
    };
    const tightBiomech = solveBiomechanicsAndPhysics(tightHeadSel);
    expect(tightBiomech.gravityBalance.weightDistribution).not.toMatch(/\b(?:feet|knees|legs)\b/i);
    expect(tightBiomech.gravityBalance.centerOfMassNotes).not.toMatch(/\b(?:feet|knees|legs)\b/i);
    const tightJson = JSON.parse(buildMirrorStudioJsonPrompt(tightHeadSel));
    expect(tightJson.LOWER_GARMENT_SPEC.fabric_physics).not.toMatch(/\b(?:knees|feet)\b/i);

    // 10. Incompatible pose + support conflict handling
    const invalidSupportSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      mirrorPose: 'pose_wall_lean_scurve',
      mirrorSupportObject: 'none',
    };
    const fixedSupport = enforceCompatibilityRules(invalidSupportSel);
    // An explicitly selected 'none' support is retained when the pose is unlocked.
    expect(fixedSupport.selections.mirrorSupportObject).toBe('none');
    expect(fixedSupport.selections.mirrorPose).toBe('pose_contrapposto_standing');

    // When the leaning pose is locked, the unlocked support adjusts instead.
    const lockedLean = enforceCompatibilityRules({
      ...invalidSupportSel,
      lockedFields: ['mirrorPose'],
    });
    expect(lockedLean.selections.mirrorPose).toBe('pose_wall_lean_scurve');
    expect(lockedLean.selections.mirrorSupportObject).toBe('wall');

    // 11. Phone-hand vs free-hand conflicts
    const bothHandsConflictSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      phoneHand: 'both_hands',
      mirrorFreeHandAction: 'hold_mug',
    };
    const fixedBothHands = enforceCompatibilityRules(bothHandsConflictSel);
    expect(fixedBothHands.selections.mirrorFreeHandAction).toBe('none_relaxed');

    // 12. lockedFields protection + LockedFieldConflict emission + 1-click minimal fix resolution
    const lockedConflictSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      framing: 'head_and_shoulders',
      mirrorPose: 'pose_bed_edge_dynamic',
      phoneHand: 'both_hands',
      mirrorFreeHandAction: 'hand_at_hip_or_pocket',
      lockedFields: ['framing', 'mirrorPose', 'phoneHand', 'mirrorFreeHandAction'],
    };
    const lockedResult = enforceCompatibilityRules(lockedConflictSel);
    // Locked fields must NOT be silently overwritten
    expect(lockedResult.selections.framing).toBe('head_and_shoulders');
    expect(lockedResult.selections.mirrorPose).toBe('pose_bed_edge_dynamic');
    expect(lockedResult.selections.phoneHand).toBe('both_hands');
    expect(lockedResult.selections.mirrorFreeHandAction).toBe('hand_at_hip_or_pocket');
    const { lockedConflicts: directConflicts } = evaluateLockedMirrorConflicts(lockedResult.selections);
    expect(directConflicts.length).toBeGreaterThanOrEqual(2);
    expect(directConflicts.some((c) => Boolean(c.suggestedFixAr) && Boolean(c.suggestedUpdates))).toBe(true);

    // 13. validateAndAuditFinalPrompt repairs buzzwords/metadata/opposite-hand/crop leaks & accepts relaxed paraphrases
    const dirtyPrompt = `${buildDeterministicEnglishPrompt({
      ...DEFAULT_SELECTIONS,
      workflowMode: 'mirror_studio',
      phoneHand: 'left_hand',
      framing: 'half_body',
    })}`;
    const dirtyParsed = JSON.parse(dirtyPrompt);
    dirtyParsed.PHYSICAL_MECHANICS += ' Hyperrealistic 8k shot using Sony LYT-900 ISO 400 while holding the smartphone in the right hand with subtle motion blur.';
    dirtyParsed.POSE_COMPOSITION.pose_description = 'Half-body pose showing feet and knees.';
    const audited = validateAndAuditFinalPrompt(
      JSON.stringify(dirtyParsed),
      {
        ...DEFAULT_SELECTIONS,
        workflowMode: 'mirror_studio',
        phoneHand: 'left_hand',
        framing: 'half_body',
      }
    );
    expect(audited.repairsApplied).toContain('buzzwords_removed');
    expect(audited.repairsApplied).toContain('unverified_metadata_removed');
    expect(audited.repairsApplied).toContain('unrequested_motion_blur_removed');
    expect(audited.repairsApplied).toContain('phone_hand_repaired_to_left');
    expect(audited.repairsApplied).toContain('crop_limb_leak_repaired');
    expect(audited.validation.valid).toBe(true);

    // Natural Gemini front_selfie + recolor_lower_only paraphrase (avoiding false invalid_model_response like req_8cb4eafd)
    const strictRecolorSel: SelfieSelections = {
      ...DEFAULT_SELECTIONS,
      workflowMode: 'strict_editing',
      strictLightingMode: 'mode_a_screen',
      strictOutputFormat: 'concise_prompt',
      lowerBodyColor: 'charcoal_black',
    };
    const strictRecolorBase = buildDeterministicEnglishPrompt(strictRecolorSel, 0);
    const strictRecolorParaphrase = strictRecolorBase
      .replace(/front-camera smartphone selfie/gi, 'handheld front selfie')
      .replace(/upper-body clothing unchanged/gi, 'top unchanged')
      .replace(/without beauty filters, plastic skin smoothing, or artificial studio lighting/gi, 'without artificial studio lighting, plastic skin smoothing, waxy finishes, or any added beauty filters');
    const resolvedParaphrase = resolveValidatedPromptOrFallback(
      `\`\`\`text\n${strictRecolorParaphrase}\n\`\`\``,
      strictRecolorSel,
      0
    );
    expect(resolvedParaphrase.source).toBe('gemini');

    // 14. Invalid / oversized / missing reference image handling
    const badMime = validateReferenceImageInput({
      optIn: true,
      base64Data: 'AAAA',
      mimeType: 'image/gif',
      sizeBytes: 100,
    });
    expect(badMime.valid).toBe(false);
    const oversized = validateReferenceImageInput({
      optIn: true,
      base64Data: 'AAAA',
      mimeType: 'image/jpeg',
      sizeBytes: MAX_REFERENCE_IMAGE_BYTES + 1024,
    });
    expect(oversized.valid).toBe(false);
    const optedOutMissing = validateReferenceImageInput({ optIn: false });
    expect(optedOutMissing.valid).toBe(true);
    expect(optedOutMissing.includeImage).toBe(false);

    // 15. Invalid / incomplete scene config graceful handling
    const incompleteOutcome = await executeGeminiPromptGeneration({
      rawSelections: {
        workflowMode: 'mirror_studio',
        mirrorPose: 'non_existent_pose' as any,
        framing: undefined as any,
      },
      generateContent: null,
    });
    expect(incompleteOutcome.validGate).toBe(true);
    expect(incompleteOutcome.source).toBe('deterministic');
    const incompleteParsed = JSON.parse(incompleteOutcome.prompt);
    expect(incompleteParsed.SYSTEM_DIRECTIVE).toBe('EXECUTE_PHOTOGRAPHIC_CAPTURE');
  });
});




