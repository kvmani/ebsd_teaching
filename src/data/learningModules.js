const commonReflectionPrompts = [
  'Predict the visual change before moving a slider.',
  'Separate pattern quality from confidence-like indexing evidence.',
  'Name the simplification used in the simulator.'
];

function q(id, type, question, options, answerIndex, feedback, extra = {}) {
  return {
    id,
    type,
    question,
    options,
    answerIndex,
    feedback,
    wrongAnswerFeedback: extra.wrongAnswerFeedback ?? options.map((option, index) => (
      index === answerIndex
        ? feedback
        : `This option points to ${option.toLowerCase()}, but the checkpoint is asking for the EBSD concept linked to ${feedback.toLowerCase()}`
    )),
    hint: extra.hint ?? 'Look for the option that best connects the visual evidence to the EBSD concept, not the brightest or most familiar word.',
    conceptTag: extra.conceptTag ?? id.split('-')[0],
    difficulty: extra.difficulty ?? 'basic'
  };
}

export const learningModules = [
  {
    id: 'intro',
    title: 'Introduction to EBSD',
    shortTitle: 'Intro',
    category: 'Foundation',
    estimatedTime: '12 min',
    difficulty: 'Beginner',
    learningObjectives: ['Define what EBSD measures.', 'Connect patterns to orientation maps.', 'Recognize why data quality matters.'],
    topics: ['What EBSD measures', 'Orientation maps', 'Phase identification', 'Grain boundaries', 'Texture', 'Pattern quality'],
    keyIdeas: ['EBSD is a SEM-based diffraction method.', 'Each scan pixel needs a usable Kikuchi pattern.', 'Orientation color is not chemistry by itself.', 'Poor acquisition can create misleading maps.', 'Quality and confidence should be checked together.'],
    explanation: 'EBSD converts local diffraction patterns into maps of crystal orientation and sometimes phase. This app keeps the chain visible: beam, sample, diffraction, detector pattern, indexing, and map.',
    whyItMatters: 'In real EBSD, a beautiful map can still be untrustworthy if patterns are noisy, saturated, or indexed against the wrong phase.',
    misconception: 'A colorful EBSD map is not automatically a correct EBSD map.',
    formulas: [],
    glossaryTerms: ['EBSD', 'Kikuchi band', 'IPF map', 'pattern quality'],
    quizQuestions: [
      q('intro-q1', 'multiple-choice', 'What does EBSD primarily measure at each scan pixel?', ['Surface height only', 'Crystal orientation and sometimes phase', 'Bulk temperature', 'Beam current'], 1, 'EBSD uses Kikuchi patterns to infer local crystal orientation and sometimes phase.'),
      q('intro-q2', 'identify-misconception', 'Which statement is the misconception?', ['Pattern quality should be inspected.', 'Orientation colors encode crystal direction.', 'A bright map is always trustworthy.', 'Unindexed pixels can be meaningful.'], 2, 'Brightness or color alone does not prove a correct result.')
    ],
    miniExperiments: [{ label: 'Compare map quality', action: 'open-acquisition-balanced', text: 'Open Live Scan Acquisition and compare orientation and confidence views.' }],
    practiceTasks: ['Switch map modes and describe what each one means.'],
    simulatorLinks: ['Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Reflect on why EBSD is a diffraction method rather than a color camera.'],
    troubleshootingCards: []
  },
  {
    id: 'geometry',
    title: 'Geometry and sample tilt',
    shortTitle: 'Geometry',
    category: 'Geometry',
    estimatedTime: '14 min',
    difficulty: 'Beginner',
    learningObjectives: ['Identify beam, sample, and detector geometry.', 'Explain why high sample tilt is common.', 'Predict detector visibility changes.'],
    topics: ['SEM column', 'Incident beam', 'Tilted specimen', 'Detector position', 'Working distance', 'Pattern visibility'],
    keyIdeas: ['The SEM beam strikes a tilted crystal.', 'High tilt helps useful electrons escape toward the detector.', 'Detector distance changes projection.', 'Detector height shifts the visible pattern.', 'Geometry affects whether a pattern is easy to index.'],
    explanation: 'The geometry tab uses a readable learning convention: the sample is tilted toward the detector so students can see why backscattered electrons reach the phosphor screen.',
    whyItMatters: 'Bad geometry can reduce pattern intensity before software has any chance to index the pattern.',
    misconception: 'Sample tilt is not just a viewing angle; it changes electron escape and detector visibility.',
    formulas: [],
    glossaryTerms: ['SEM', 'sample tilt', 'detector', 'phosphor screen'],
    quizQuestions: [
      q('geometry-q1', 'multiple-choice', 'Why is high sample tilt common in EBSD?', ['To remove diffraction', 'To help backscattered electrons reach the detector', 'To cool the sample', 'To increase keyboard response'], 1, 'High tilt improves the path from near-surface scattering to the EBSD detector.'),
      q('geometry-q2', 'true-false', 'Detector distance can change where bands appear in the pattern.', ['True', 'False'], 0, 'Detector distance is part of the projection geometry.')
    ],
    miniExperiments: [{ label: 'Open geometry demo', action: 'geometry-stage-1', text: 'Open the geometry tab and step through beam, interaction volume, and detector.' }],
    practiceTasks: ['Move sample tilt and describe what becomes easier or harder to see.'],
    simulatorLinks: ['Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask yourself to predict what happens when tilt is reduced.'],
    troubleshootingCards: []
  },
  {
    id: 'interaction',
    title: 'Interaction volume and electron scattering',
    shortTitle: 'Scattering',
    category: 'Scattering',
    estimatedTime: '13 min',
    difficulty: 'Beginner',
    learningObjectives: ['Describe the interaction volume.', 'Explain surface sensitivity.', 'Connect preparation quality to pattern quality.'],
    topics: ['Backscattered electrons', 'Elastic scattering', 'Inelastic scattering', 'Surface preparation', 'Surface sensitivity'],
    keyIdeas: ['Useful signal is near-surface.', 'Backscattered electrons carry diffraction information.', 'Damaged surface layers weaken bands.', 'The app volume is schematic.', 'Good preparation improves real EBSD reliability.'],
    explanation: 'The glowing volume is a schematic marker for where useful backscattered electrons originate. It is not a Monte Carlo simulation.',
    whyItMatters: 'Real EBSD is very sensitive to polishing damage, oxidation, contamination, and deformation near the surface.',
    misconception: 'EBSD does not directly measure deep bulk orientation.',
    formulas: [],
    glossaryTerms: ['interaction volume', 'backscattered electron', 'pattern quality'],
    quizQuestions: [
      q('interaction-q1', 'multiple-choice', 'Why does sample preparation matter for EBSD?', ['It changes keyboard shortcuts', 'EBSD is surface sensitive', 'It removes the detector', 'It stops all scattering'], 1, 'The useful diffraction signal comes from near the surface.'),
      q('interaction-q2', 'choose-best', 'Best explanation of the glowing volume in this app:', ['A validated Monte Carlo result', 'A schematic learning marker', 'A chemical map', 'A thermal image'], 1, 'The app is conceptual and uses simplified visual anchors.')
    ],
    miniExperiments: [{ label: 'Show interaction volume', action: 'geometry-stage-2', text: 'Open stage 2 and discuss why the volume is schematic.' }],
    practiceTasks: ['List three surface issues that could lower pattern quality.'],
    simulatorLinks: ['Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Reflect on why EBSD is surface sensitive.'],
    troubleshootingCards: []
  },
  {
    id: 'bragg',
    title: 'Bragg law and diffraction cones',
    shortTitle: 'Bragg',
    category: 'Diffraction',
    estimatedTime: '18 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Use Bragg law conceptually.', 'Relate wavelength to voltage.', 'Explain why cones become detector bands.'],
    topics: ['Bragg law', 'Electron wavelength', 'd-spacing', 'Diffraction cones', 'Band width'],
    keyIdeas: ['Bragg law links wavelength, spacing, and angle.', 'Higher voltage gives shorter wavelength.', 'Real EBSD angles are small.', 'Cones are magnified for learning clarity.', 'Cone cuts explain band edges.'],
    explanation: 'Each lattice-plane family can be represented by a diffraction cone. The detector cuts the cone, and the cut appears as a Kikuchi band edge.',
    whyItMatters: 'This geometry explains why changing orientation moves bands and why detector calibration matters.',
    misconception: 'The large visual cones are not real physical angles; they are magnified for learning clarity.',
    formulas: ['bragg', 'wavelength'],
    glossaryTerms: ['Bragg law', 'Bragg angle', 'interplanar spacing', 'hkl'],
    quizQuestions: [
      q('bragg-q1', 'multiple-choice', 'What does Bragg law describe?', ['Surface roughness contrast', 'Constructive diffraction from lattice planes', 'Chemical composition directly', 'Beam current calibration'], 1, 'Bragg law relates wavelength, plane spacing, and diffraction angle.'),
      q('bragg-q2', 'true-false', 'Increasing accelerating voltage generally shortens electron wavelength.', ['True', 'False'], 0, 'Higher voltage gives faster electrons and shorter wavelength.')
    ],
    miniExperiments: [{ label: 'Show cone formation', action: 'geometry-stage-4', text: 'Open cone stage and compare voltage/cone magnifier.' }],
    practiceTasks: ['Use the formula explorer to calculate theta for d = 0.120 nm at 20 kV.'],
    simulatorLinks: ['Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Reflect on why the app magnifies cone angles.'],
    troubleshootingCards: []
  },
  {
    id: 'kikuchi',
    title: 'Kikuchi bands and band geometry',
    shortTitle: 'Bands',
    category: 'Diffraction',
    estimatedTime: '16 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Identify Kikuchi bands and edges.', 'Explain why bands move with orientation.', 'Relate band sharpness to indexing.'],
    topics: ['Kikuchi band', 'Band edge', 'Zone axis', 'Band width', 'Crystal rotation'],
    keyIdeas: ['Bands encode orientation.', 'Band crossings can reveal zone axes.', 'Rotating the crystal moves bands.', 'Sharp bands are easier to detect.', 'Bands are not scratches or contamination.'],
    explanation: 'Kikuchi bands are detector traces of diffraction geometry. Their position changes when crystal orientation changes.',
    whyItMatters: 'Indexing software depends on band positions and quality. Weak or blurred bands reduce confidence.',
    misconception: 'Kikuchi bands are not surface scratches or topography lines.',
    formulas: ['bragg'],
    glossaryTerms: ['Kikuchi band', 'band edge', 'zone axis'],
    quizQuestions: [
      q('kikuchi-q1', 'multiple-choice', 'What moves when crystal orientation changes?', ['Band positions', 'The app folder', 'The SEM column material', 'The electron charge'], 0, 'Orientation changes the plane normals relative to the detector.'),
      q('kikuchi-q2', 'identify-misconception', 'Which is wrong?', ['Sharp bands help indexing.', 'Bands encode orientation.', 'Bands are caused only by contamination.', 'Band crossings can be useful.'], 2, 'Kikuchi bands arise from diffraction, not only contamination.')
    ],
    miniExperiments: [{ label: 'Show full Kikuchi pattern', action: 'geometry-stage-6', text: 'Open full pattern and rotate crystal Z.' }],
    practiceTasks: ['Rotate Z and describe how band positions move.'],
    simulatorLinks: ['Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Reflect on why band position matters more than band color.'],
    troubleshootingCards: []
  },
  {
    id: 'detector',
    title: 'Detector geometry and phosphor screen',
    shortTitle: 'Detector',
    category: 'Detector',
    estimatedTime: '15 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Explain phosphor screen role.', 'Define pattern/projection center conceptually.', 'Predict detector-distance effects.'],
    topics: ['Phosphor screen', 'Projection center', 'Detector distance', 'Pattern center', 'Camera length', 'Distortion'],
    keyIdeas: ['The detector records projected directions.', 'Pattern center is a calibration idea.', 'Detector distance affects band placement.', 'Detector height shifts the pattern.', 'Bad calibration can hurt indexing.'],
    explanation: 'The phosphor screen converts electron intensity into a pattern. Indexing needs geometry, including pattern center and detector position.',
    whyItMatters: 'Incorrect detector geometry can make a good pattern index poorly.',
    misconception: 'Detector distance is not just a zoom control.',
    formulas: [],
    glossaryTerms: ['detector', 'phosphor screen', 'projection center', 'pattern center'],
    quizQuestions: [
      q('detector-q1', 'multiple-choice', 'What does pattern center help describe?', ['Detector projection geometry', 'Sample color', 'Room temperature', 'File size'], 0, 'Pattern center is part of detector geometry.'),
      q('detector-q2', 'true-false', 'A good EBSD pattern can still index badly if detector geometry is wrong.', ['True', 'False'], 0, 'Indexing compares observed bands with projected model bands.')
    ],
    miniExperiments: [{ label: 'Move detector', action: 'geometry-detector-demo', text: 'Open geometry tab and adjust detector distance/height.' }],
    practiceTasks: ['Compare short and long detector distance.'],
    simulatorLinks: ['Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Reflect on why calibration matters even with visible bands.'],
    troubleshootingCards: []
  },
  {
    id: 'indexing',
    title: 'How Kikuchi Bands Are Indexed',
    shortTitle: 'Indexing basics',
    category: 'Indexing',
    estimatedTime: '20 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Describe the simplified indexing workflow.', 'Explain how Hough-style band detection supports indexing.', 'Interpret confidence as decision strength, not proof.'],
    topics: ['Raw pattern', 'Background correction', 'Band detection', 'Hough transform', 'Band angle matching', 'Orientation solution', 'Confidence and failure modes'],
    keyIdeas: ['Indexing starts with a raw Kikuchi pattern and background correction.', 'The Hough transform helps detect Kikuchi bands as line-like features.', 'Detected band positions and angles are compared with theoretical crystal plane geometry.', 'The selected phase and detector calibration strongly affect the solution.', 'Good-looking EBSD maps can still be wrong.'],
    explanation: 'This module introduces the indexing pipeline step by step: raw pattern, background correction, band detection, Hough transform, band angle matching, orientation solution, and confidence checks.',
    whyItMatters: 'Understanding indexing prevents blind trust in software output. Indexing is evidence-based, and it can fail when patterns, calibration, phase selection, or thresholds are poor.',
    misconception: 'Indexing is not magic, and confidence is not the same thing as truth or brightness.',
    formulas: [],
    glossaryTerms: ['indexing', 'Hough transform', 'Euler angles', 'orientation matrix', 'confidence index'],
    quizQuestions: [
      q('indexing-q1', 'multiple-choice', 'Why can too much gain reduce indexing quality?', ['It clips pixels and hides band contrast', 'It improves all bands forever', 'It changes the crystal', 'It removes drift'], 0, 'Clipping removes useful contrast.'),
      q('indexing-q2', 'choose-best', 'Best description of confidence index:', ['A guarantee of truth', 'A decision-strength score', 'A chemical assay', 'A sample tilt angle'], 1, 'Confidence is a useful score, not proof by itself.')
    ],
    miniExperiments: [{ label: 'Try indexing preset', action: 'open-acquisition-balanced', text: 'Open acquisition and compare the confidence-like map.' }],
    practiceTasks: ['Raise threshold and observe unindexed area.'],
    simulatorLinks: ['Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask whether brighter is always better.'],
    troubleshootingCards: []
  },
  {
    id: 'acquisition',
    title: 'Live scan acquisition and data quality',
    shortTitle: 'Acquisition',
    category: 'Acquisition',
    estimatedTime: '22 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Balance signal, detail, speed, and risk.', 'Recognize noise and clipping.', 'Choose settings for a study goal.'],
    topics: ['Gain', 'Exposure time', 'Beam current', 'Binning', 'Frame averaging', 'Drift', 'Thresholds'],
    keyIdeas: ['Exposure improves signal but slows scan.', 'Gain can clip signal.', 'Binning reduces noise but loses detail.', 'Averaging reduces random noise.', 'Drift distorts maps.'],
    explanation: 'Acquisition is a trade-off. The best setting depends on whether the goal is speed, spatial detail, or reliable indexing.',
    whyItMatters: 'Most real EBSD problems are acquisition trade-offs, not mysterious software failures.',
    misconception: 'A brighter pattern is not always a better pattern.',
    formulas: [],
    glossaryTerms: ['gain', 'exposure time', 'binning', 'frame averaging', 'drift', 'step size'],
    quizQuestions: [
      q('acquisition-q1', 'multiple-choice', 'What is the first fix for saturation?', ['Increase gain', 'Reduce gain', 'Increase drift', 'Use larger step size'], 1, 'Reduce gain first because clipping destroys contrast.'),
      q('acquisition-q2', 'true-false', 'Frame averaging can reduce random noise but increases acquisition time.', ['True', 'False'], 0, 'Averaging repeats measurements, so it costs time.')
    ],
    miniExperiments: [{ label: 'Compare fast vs high quality', action: 'acquisition-compare-quality', text: 'Open acquisition and compare Fast survey with High quality.' }],
    practiceTasks: ['Demonstrate noisy, clipped, coarse, and drift cases.'],
    simulatorLinks: ['Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask yourself to diagnose the coach warning.'],
    troubleshootingCards: []
  },
  {
    id: 'maps',
    title: 'EBSD map interpretation',
    shortTitle: 'Maps',
    category: 'Mapping',
    estimatedTime: '18 min',
    difficulty: 'Intermediate',
    learningObjectives: ['Interpret IPF, quality, confidence, and unindexed maps.', 'Avoid confusing color with phase.', 'Use overlays to diagnose acquisition.'],
    topics: ['IPF orientation map', 'Pattern quality map', 'Confidence map', 'Unindexed pixels', 'Grain boundary overlay'],
    keyIdeas: ['IPF color encodes orientation.', 'Pattern quality shows pattern clarity.', 'Confidence shows indexing decision strength.', 'Unindexed pixels show rejected solutions.', 'Boundaries often reduce quality.'],
    explanation: 'EBSD maps are different views of the same scan. A good interpretation compares orientation, quality, confidence, and unindexed regions.',
    whyItMatters: 'Map interpretation is how EBSD becomes materials insight rather than just colored pixels.',
    misconception: 'A color change in an IPF map does not automatically mean a phase change.',
    formulas: [],
    glossaryTerms: ['IPF map', 'pattern quality', 'confidence index', 'unindexed pixel', 'grain boundary'],
    quizQuestions: [
      q('maps-q1', 'multiple-choice', 'What does an IPF map color mainly encode?', ['Orientation', 'Temperature', 'Detector brand', 'Exact chemical composition'], 0, 'IPF color encodes orientation relative to a sample direction.'),
      q('maps-q2', 'identify-misconception', 'Which is wrong?', ['Dark quality may mean weak patterns.', 'Confidence should be inspected.', 'IPF color always means phase.', 'Unindexed pixels can reveal problems.'], 2, 'Phase identification needs more than IPF color.')
    ],
    miniExperiments: [{ label: 'Switch map views', action: 'acquisition-map-views', text: 'Open acquisition and switch orientation, quality, and confidence views.' }],
    practiceTasks: ['Explain one possible reason for dark pattern-quality regions.'],
    simulatorLinks: ['Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask yourself to distinguish orientation color from phase.'],
    troubleshootingCards: []
  },
  {
    id: 'pattern-quality',
    title: 'Pattern quality and failure analysis',
    shortTitle: 'Pattern quality',
    category: 'Interpretation',
    estimatedTime: '22 min',
    difficulty: 'Applied',
    learningObjectives: ['Diagnose common pattern-quality failures.', 'Connect pattern artefacts to indexing risk.', 'Choose a reasonable first correction.'],
    topics: ['Excellent patterns', 'Noise', 'Overexposure', 'Underexposure', 'Charging', 'Damage', 'Contamination', 'Overlapping patterns', 'Pseudo-symmetry'],
    keyIdeas: ['Pattern quality is evidence quality.', 'Bright is not always better.', 'Weak bands can produce false confidence.', 'Overlapping signals can create plausible wrong solutions.', 'Corrections should target the observed symptom.'],
    explanation: 'This module teaches diagnostic review of EBSD pattern examples before trusting a map or confidence-like score.',
    whyItMatters: 'Experienced EBSD users interpret the pattern, acquisition context, and map together rather than accepting a single output.',
    misconception: 'A high-looking score or bright image always means the pattern is reliable.',
    formulas: [],
    glossaryTerms: ['pattern quality', 'Kikuchi band', 'confidence index', 'pseudo-symmetry'],
    quizQuestions: [
      q('quality-q1', 'multiple-choice', 'Why can an overexposed pattern index poorly?', ['Clipping destroys band contrast', 'It guarantees phase identity', 'It removes all noise perfectly', 'It fixes deformation'], 0, 'Clipping can flatten useful band contrast.'),
      q('quality-q2', 'choose-best', 'Best response to close competing candidate fits:', ['Trust the first answer automatically', 'Inspect pattern quality, phase context, and neighbors', 'Ignore calibration', 'Increase color saturation'], 1, 'Close candidate fits need evidence review.')
    ],
    miniExperiments: [{ label: 'Open pattern quality cases', action: 'interpretation-quality', text: 'Open Interpretation and compare failure cases.' }],
    practiceTasks: ['For three cases, write symptom, possible cause, and first correction.'],
    simulatorLinks: ['Interpretation Studio', 'Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask what evidence would make this pattern trustworthy.'],
    troubleshootingCards: []
  },
  {
    id: 'sample-prep',
    title: 'Sample preparation impact',
    shortTitle: 'Sample prep',
    category: 'Preparation',
    estimatedTime: '20 min',
    difficulty: 'Applied',
    learningObjectives: ['Explain why EBSD is surface-sensitive.', 'Identify preparation artefacts.', 'Relate preparation quality to Kikuchi band sharpness.'],
    topics: ['Grinding damage', 'Deformation layer', 'Final polishing', 'Colloidal silica', 'Electropolishing', 'Oxidation', 'Contamination', 'Relief'],
    keyIdeas: ['EBSD signal is near-surface.', 'A shiny surface can still be damaged.', 'Final polishing can sharpen bands.', 'Surface films reduce band contrast.', 'Relief can mimic meaningful contrast.'],
    explanation: 'Preparation controls whether useful near-surface diffraction survives. The app shows before/after conceptual patterns without prescribing material-specific chemistry.',
    whyItMatters: 'Many EBSD failures start before acquisition: damaged or contaminated surfaces cannot produce reliable bands.',
    misconception: 'If the sample looks mirror-polished, EBSD quality must be good.',
    formulas: [],
    glossaryTerms: ['interaction volume', 'pattern quality', 'sample preparation'],
    quizQuestions: [
      q('prep-q1', 'multiple-choice', 'Why does a deformation layer hurt EBSD?', ['It weakens near-surface diffraction', 'It improves all phases', 'It changes the keyboard', 'It validates the map'], 0, 'EBSD is sensitive to the near-surface region.'),
      q('prep-q2', 'identify-misconception', 'Which statement is the misconception?', ['Relief can affect patterns.', 'Contamination can weaken bands.', 'A shiny surface always gives good EBSD.', 'Cleaning matters before scanning.'], 2, 'Shiny is not the same as EBSD-ready.')
    ],
    miniExperiments: [{ label: 'Open prep impact module', action: 'sample-prep-impact', text: 'Open Interpretation and compare poor prep with improved prep.' }],
    practiceTasks: ['List two preparation issues and how each would change the pattern.'],
    simulatorLinks: ['Interpretation Studio'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask whether the problem is acquisition or surface condition.'],
    troubleshootingCards: []
  },
  {
    id: 'interpretation-studio',
    title: 'Real EBSD interpretation workflow',
    shortTitle: 'Interpretation',
    category: 'Interpretation',
    estimatedTime: '28 min',
    difficulty: 'Applied',
    learningObjectives: ['Connect sample prep, acquisition, indexing, confidence, and maps.', 'Interpret map views together.', 'Use troubleshooting trees before changing settings randomly.'],
    topics: ['IPF maps', 'Phase maps', 'Band contrast', 'Grain boundaries', 'Twins', 'Deformation', 'Recrystallized grains', 'Confidence and fit'],
    keyIdeas: ['No single EBSD view is enough.', 'IPF color is orientation, not chemistry.', 'Band contrast and confidence guide trust.', 'Possible twins need crystallographic context.', 'Troubleshooting starts from symptoms.'],
    explanation: 'This capstone module uses the Interpretation Studio to connect the whole EBSD workflow from surface preparation to map interpretation.',
    whyItMatters: 'EBSD interpretation is a chain of evidence. Students should learn to compare patterns, settings, confidence, and maps before making claims.',
    misconception: 'Map interpretation is just reading colors.',
    formulas: [],
    glossaryTerms: ['IPF map', 'phase map', 'grain boundary', 'confidence index', 'fit'],
    quizQuestions: [
      q('interpret-q1', 'multiple-choice', 'What should you compare before trusting an EBSD map?', ['Only IPF color', 'Pattern quality, confidence, phase context, and acquisition conditions', 'Only file size', 'Only the legend'], 1, 'Reliable interpretation compares several evidence views.'),
      q('interpret-q2', 'true-false', 'The Interpretation Studio performs real grain-size or phase quantification.', ['True', 'False'], 1, 'It uses schematic maps and educational overlays only.')
    ],
    miniExperiments: [{ label: 'Open Interpretation Studio', action: 'open-interpretation', text: 'Open the full Phase 3 interpretation workspace.' }],
    practiceTasks: ['Use the map studio to identify grains, noisy regions, deformation clues, and likely bad indexing areas.'],
    simulatorLinks: ['Interpretation Studio', 'Indexing Basics', 'Live Scan Acquisition'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask what additional evidence you would need in real EBSD software.'],
    troubleshootingCards: []
  },
  {
    id: 'troubleshooting',
    title: 'Troubleshooting and practice',
    shortTitle: 'Troubleshoot',
    category: 'Practice',
    estimatedTime: '25 min',
    difficulty: 'Applied',
    learningObjectives: ['Diagnose common EBSD failure modes.', 'Choose a reasonable first fix.', 'Connect symptoms to simulator controls.'],
    topics: ['No bands', 'Noisy pattern', 'Saturated pattern', 'Poor indexing', 'Drift', 'Coarse step size', 'Bad preparation', 'Wrong phase', 'Wrong geometry', 'Strict threshold'],
    keyIdeas: ['Diagnose symptom before changing settings.', 'Clipping hides detail.', 'Noise can be improved with signal or averaging.', 'Wrong phase selection can mislead indexing.', 'Drift can ruin maps even with good patterns.'],
    explanation: 'Troubleshooting is a loop: observe symptom, identify possible causes, change one setting, and compare result.',
    whyItMatters: 'Real EBSD sessions are limited by time and sample condition. Efficient troubleshooting saves microscope time.',
    misconception: 'There is one universal best EBSD setting.',
    formulas: [],
    glossaryTerms: ['gain', 'drift', 'phase selection', 'unindexed pixel', 'detector'],
    quizQuestions: [
      q('trouble-q1', 'multiple-choice', 'Saturated pattern: what should you change first?', ['Lower gain', 'Increase gain', 'Increase threshold only', 'Ignore it'], 0, 'Lower gain first, then recover signal if needed.'),
      q('trouble-q2', 'choose-best', 'Warped grain boundaries with decent patterns suggest:', ['Stage drift', 'Perfect setup', 'Only phase change', 'No detector'], 0, 'Drift distorts map positions.')
    ],
    miniExperiments: [
      { label: 'Noisy indexing preset', action: 'acquisition-noisy', text: 'Apply a weak noisy setup.' },
      { label: 'Gain clipping preset', action: 'acquisition-clipping', text: 'Apply a saturated setup.' },
      { label: 'Drift preset', action: 'acquisition-drift', text: 'Apply a drift-visible setup.' }
    ],
    practiceTasks: ['For each failure card, state symptom, cause, and first fix.'],
    simulatorLinks: ['Live Scan Acquisition', 'Geometry + Pattern'],
    reflectionPrompts: [...commonReflectionPrompts, 'Ask yourself why a brighter pattern can be worse.'],
    troubleshootingCards: [
      { problem: 'No bands visible', symptom: 'Pattern is mostly flat.', causes: 'Poor surface, bad geometry, weak signal.', fix: 'Improve preparation, geometry, exposure/current.', observe: 'Bands become visible.' },
      { problem: 'Very noisy pattern', symptom: 'Random speckle hides bands.', causes: 'Low exposure/current, fast scan.', fix: 'Increase exposure, averaging, or current.', observe: 'Noise decreases.' },
      { problem: 'Saturated pattern', symptom: 'Bright regions clipped; band contrast lost.', causes: 'Gain, exposure, or current too high.', fix: 'Reduce gain first.', observe: 'Band contrast returns.' },
      { problem: 'Poor indexing', symptom: 'Many low-confidence-like pixels.', causes: 'Weak bands, possible wrong phase, strict threshold.', fix: 'Improve pattern or review threshold/phase.', observe: 'Confidence-like cues improve.' },
      { problem: 'Drift / distorted map', symptom: 'Boundaries bend or smear.', causes: 'Stage/sample drift during scan.', fix: 'Stabilize or scan faster.', observe: 'Boundaries straighten.' },
      { problem: 'Coarse step size', symptom: 'Small grains missed.', causes: 'Step size too large.', fix: 'Reduce step size.', observe: 'More spatial detail.' },
      { problem: 'Bad sample preparation', symptom: 'Broad weak bands.', causes: 'Damage, contamination, oxide.', fix: 'Improve polish/cleaning.', observe: 'Sharper bands.' },
      { problem: 'Incorrect phase selection', symptom: 'Confident but wrong-looking solution.', causes: 'Wrong candidate phase.', fix: 'Use correct phase list.', observe: 'Indexing becomes plausible.' },
      { problem: 'Wrong detector geometry', symptom: 'Bands visible but indexing unstable.', causes: 'Bad pattern center/distance.', fix: 'Recalibrate detector geometry.', observe: 'Solutions stabilize.' },
      { problem: 'Too strict threshold', symptom: 'Many rejected pixels.', causes: 'Threshold higher than data quality.', fix: 'Lower threshold or improve signal.', observe: 'Unindexed area decreases.' }
    ]
  }
];
