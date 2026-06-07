export const acquisitionParameterGuides = {
  acceleratingVoltage: {
    label: 'Accelerating voltage',
    visual: 'Band spacing changes subtly and the interaction depth idea changes. Very low voltage can make patterns dimmer; high voltage may improve signal but can increase interaction volume.',
    physical: 'Voltage changes electron wavelength and how deeply electrons interact with the sample. The app shows this conceptually, not as a calibrated beam-material model.',
    tradeoff: 'Higher voltage can help signal in many materials, but surface sensitivity, resolution, sample damage, and microscope geometry still matter.'
  },
  beamCurrent: {
    label: 'Probe current',
    visual: 'More current brightens the pattern and reduces random noise until saturation begins.',
    physical: 'More electrons reach each pixel, increasing signal. Too many counts can clip detector intensity.',
    tradeoff: 'Useful for weak patterns, but high current can worsen charging, contamination, heating, or detector clipping.'
  },
  workingDistance: {
    label: 'Working distance',
    visual: 'Working distance away from a suitable setup can lower the conceptual geometry score and make the pattern less sharp.',
    physical: 'Working distance affects detector geometry, focus, and collection conditions in a real SEM.',
    tradeoff: 'Real EBSD often has a recommended working distance. Moving away from it can reduce pattern quality or calibration reliability.'
  },
  detectorDistance: {
    label: 'Detector distance',
    visual: 'The pattern appears more compressed or expanded and band matching becomes less stable away from the study setting.',
    physical: 'Detector distance changes the projection geometry used to compare observed bands with model bands.',
    tradeoff: 'Closer screens can improve signal, but calibration and pattern coverage must still be suitable.'
  },
  exposureMs: {
    label: 'Exposure time',
    visual: 'Longer exposure reduces speckle noise and sharpens visible bands, but scan progress slows.',
    physical: 'Each pixel integrates more electrons, improving signal-to-noise.',
    tradeoff: 'Good for weak patterns; costly for large maps, drift-sensitive samples, or beam-sensitive specimens.'
  },
  gain: {
    label: 'Detector gain',
    visual: 'Moderate gain brightens features; excessive gain can amplify noise, clip bright areas, and destroy band contrast.',
    physical: 'Gain amplifies detector signal after collection. It cannot recover information already missing from the pattern.',
    tradeoff: 'Use gain carefully. Lower clipping first, then recover signal with exposure, current, or averaging.'
  },
  binning: {
    label: 'Binning',
    visual: 'Higher binning smooths noise and speeds maps but makes boundaries and small grains blockier.',
    physical: 'Neighboring detector pixels are combined, increasing apparent signal per saved pixel.',
    tradeoff: 'Helpful for weak patterns or fast surveys; harmful when spatial detail or sharp boundaries matter.'
  },
  scanSpeed: {
    label: 'Scan speed',
    visual: 'Fast scans complete quickly but can make weak-pattern and low-confidence-like regions more obvious in the conceptual map.',
    physical: 'Less time per pixel means fewer useful counts unless signal is otherwise strong.',
    tradeoff: 'Use fast scans for surveys. Slow down only when drift and beam effects are under control.'
  },
  noiseLevel: {
    label: 'Added noise',
    visual: 'Speckle increases, weak bands disappear, and the simplified confidence-like map becomes patchier.',
    physical: 'Noise can come from low counts, electronics, poor signal, or unstable acquisition conditions.',
    tradeoff: 'Improve signal first, then consider averaging, binning, preparation quality, and geometry.'
  }
};

export const patternQualityCases = [
  {
    id: 'excellent',
    title: 'Excellent pattern',
    tag: 'Clear bands',
    kind: 'excellent',
    wentWrong: 'In this reference example, bands are sharp, background is controlled, and saturation is low.',
    indexingImpact: 'Band detection has enough reliable geometry for a strong simplified match.',
    corrections: 'Use this as a reference case. Keep acquisition stable and verify phase/calibration context.'
  },
  {
    id: 'noisy',
    title: 'Noisy pattern',
    tag: 'Low counts',
    kind: 'noise',
    wentWrong: 'Random speckle may compete with weak Kikuchi bands.',
    indexingImpact: 'Band detection may miss weak bands or overfit false features.',
    corrections: 'Increase exposure, probe current, frame averaging, or binning; check preparation if bands remain weak.'
  },
  {
    id: 'overexposed',
    title: 'Overexposed pattern',
    tag: 'Clipping',
    kind: 'overexposed',
    wentWrong: 'Bright regions may be saturated, so band contrast is flattened instead of improved.',
    indexingImpact: 'Important band edges can be lost even though the image looks bright.',
    corrections: 'Lower gain first, then adjust exposure/current to recover usable signal.'
  },
  {
    id: 'underexposed',
    title: 'Underexposed pattern',
    tag: 'Too dark',
    kind: 'underexposed',
    wentWrong: 'Too few useful counts may be reaching the detector.',
    indexingImpact: 'Bands are hard to detect and confidence-like scores drop.',
    corrections: 'Increase exposure/current, consider binning or averaging, and confirm detector position.'
  },
  {
    id: 'charging',
    title: 'Charging artefacts',
    tag: 'Instability',
    kind: 'charging',
    wentWrong: 'Local intensity shifts and band distortion may be associated with charge build-up on an insulating or poorly grounded surface.',
    indexingImpact: 'The same region may index inconsistently over time.',
    corrections: 'Improve grounding/coating strategy where appropriate, lower current, reduce dwell, or improve vacuum/prep.'
  },
  {
    id: 'deformation',
    title: 'Deformation damage',
    tag: 'Broad bands',
    kind: 'deformation',
    wentWrong: 'Broad weak bands may indicate a damaged near-surface layer.',
    indexingImpact: 'Band centers become uncertain and low-confidence-like regions cluster near damaged areas.',
    corrections: 'Improve final polish, remove deformation layer, or use an appropriate low-damage preparation method.'
  },
  {
    id: 'polishing',
    title: 'Poor polishing',
    tag: 'Relief/scratches',
    kind: 'polishing',
    wentWrong: 'Scratches, relief, and uneven surfaces may reduce usable diffraction signal.',
    indexingImpact: 'Pattern quality varies spatially and boundaries can be confused with preparation artefacts.',
    corrections: 'Refine grinding/polishing sequence, reduce relief, clean between steps, and finish gently.'
  },
  {
    id: 'contamination',
    title: 'Contamination',
    tag: 'Surface film',
    kind: 'contamination',
    wentWrong: 'A surface film or deposited contamination can attenuate near-surface diffraction.',
    indexingImpact: 'Bands fade over time and dark regions may expand during scanning.',
    corrections: 'Clean the specimen, reduce beam exposure where possible, and verify vacuum/handling practice.'
  },
  {
    id: 'drift',
    title: 'Drift',
    tag: 'Map distortion',
    kind: 'drift',
    wentWrong: 'Warped map features may indicate specimen, stage, or beam-related movement during acquisition.',
    indexingImpact: 'Individual patterns may be usable, but map positions and boundaries become warped.',
    corrections: 'Let the stage settle, improve mounting, reduce map time, or use a faster survey first.'
  },
  {
    id: 'overlap',
    title: 'Overlapping patterns',
    tag: 'Mixed signal',
    kind: 'overlap',
    wentWrong: 'The pattern may include signals from multiple grains or phases.',
    indexingImpact: 'Candidate fits can compete; a single solution may be misleading.',
    corrections: 'Reduce step size near boundaries, improve pattern quality, and inspect neighboring pixels.'
  },
  {
    id: 'low-contrast',
    title: 'Low band contrast',
    tag: 'Weak guides',
    kind: 'lowContrast',
    wentWrong: 'Bands are present but weak relative to background.',
    indexingImpact: 'The detector may find too few reliable centerlines.',
    corrections: 'Improve background correction, exposure/current, surface preparation, or detector geometry.'
  },
  {
    id: 'pseudosymmetry',
    title: 'Pseudo-symmetry ambiguity',
    tag: 'Similar fits',
    kind: 'pseudosymmetry',
    wentWrong: 'Different candidate solutions can explain similar band geometry.',
    indexingImpact: 'Confidence-like scores may be close; the most convenient answer is not always correct.',
    corrections: 'Inspect relative fit cues, phase knowledge, neighboring pixels, and independent materials context.'
  }
];

export const samplePrepScenarios = [
  {
    id: 'grinding',
    title: 'Grinding damage',
    before: 'Deep deformation layer and scratches',
    after: 'Damage reduced by progressive polishing',
    note: 'EBSD is near-surface sensitive, so the last damaged layer can dominate pattern quality.',
    mistake: 'Stopping after the surface looks shiny under low magnification.'
  },
  {
    id: 'polishing',
    title: 'Final polishing quality',
    before: 'Broad weak bands from residual deformation',
    after: 'Sharper bands after gentle final polish',
    note: 'A good final polish improves band sharpness more than simply raising detector gain.',
    mistake: 'Using too much force or skipping intermediate abrasive steps.'
  },
  {
    id: 'silica',
    title: 'Colloidal silica finish',
    before: 'Fine deformation and low band contrast',
    after: 'Cleaner near-surface layer and higher band contrast',
    note: 'Colloidal silica can help many materials by gently removing the final disturbed layer.',
    mistake: 'Over-polishing or leaving residue instead of cleaning thoroughly.'
  },
  {
    id: 'electropolish',
    title: 'Electropolishing',
    before: 'Mechanical damage remains near the surface',
    after: 'Low-deformation surface for suitable conductive materials',
    note: 'Electropolishing can be excellent, but it is material-specific and not a universal recipe.',
    mistake: 'Applying a method without checking whether the material and electrolyte are appropriate.'
  },
  {
    id: 'oxidation',
    title: 'Oxidation',
    before: 'Oxide attenuates the diffraction signal',
    after: 'Fresh clean surface improves band visibility',
    note: 'Surface films matter because EBSD signal is generated close to the surface.',
    mistake: 'Preparing well, then waiting long enough for the surface to degrade before scanning.'
  },
  {
    id: 'relief',
    title: 'Relief and topography',
    before: 'Uneven surface changes local geometry and shadowing',
    after: 'Flatter surface gives more consistent patterns',
    note: 'Relief can make acquisition look like a materials feature when it is really preparation artefact.',
    mistake: 'Interpreting topographic contrast as crystallographic contrast.'
  }
];

export const mapModes = [
  {
    id: 'ipf',
    label: 'IPF map',
    notice: 'Color schematically shows orientation relative to a sample direction, not chemistry by itself.',
    prompt: 'Find grains by looking for connected areas of similar orientation color.'
  },
  {
    id: 'phase',
    label: 'Phase map',
    notice: 'Phase colors are schematic. This is not validated phase identification.',
    prompt: 'Look for where a second phase might interrupt the orientation map.'
  },
  {
    id: 'bandContrast',
    label: 'Band contrast',
    notice: 'Darker regions are qualitative cues for weaker patterns or preparation/acquisition problems.',
    prompt: 'Find low-quality areas before trusting orientation changes.'
  },
  {
    id: 'boundaries',
    label: 'Boundaries',
    notice: 'Low-angle and high-angle boundaries are conceptual overlays, not computed misorientation values.',
    prompt: 'Compare subtle orientation gradients with stronger grain boundaries.'
  },
  {
    id: 'deformation',
    label: 'Deformation',
    notice: 'Orientation gradients are schematic clues, not measured strain or HR-EBSD.',
    prompt: 'Look for smooth color changes inside grains and noisy low-confidence-like bands.'
  }
];

export const mapActivities = [
  {
    id: 'grains',
    label: 'Identify grains',
    feedback: 'Grains are connected regions with related orientation colors. Boundaries are where the color relationship changes abruptly.'
  },
  {
    id: 'noisy',
    label: 'Find noisy regions',
    feedback: 'Noisy or low-quality regions often appear dark in band-contrast view and patchy in confidence-like views.'
  },
  {
    id: 'deformation',
    label: 'Find deformation',
    feedback: 'Deformation is suggested here by smooth orientation gradients and streaked quality loss, not by a real strain calculation.'
  },
  {
    id: 'twins',
    label: 'Spot possible twins',
    feedback: 'Possible twins are shown as straight, narrow internal features. Real twin identification requires crystallographic context.'
  },
  {
    id: 'bad-indexing',
    label: 'Flag bad indexing',
    feedback: 'Bad indexing is likely where low band contrast, abrupt isolated colors, and low simplified confidence-like cues occur together.'
  }
];

export const confidenceExamples = [
  {
    id: 'clean',
    title: 'Clean pattern, clear winner',
    candidates: [
      ['Candidate A', 92, 'Best schematic fit'],
      ['Candidate B', 58, 'Several bands offset'],
      ['Candidate C', 34, 'Weak angular match']
    ],
    lesson: 'A large separation between candidates supports confidence-like evidence, but it still depends on the right phase and calibration.'
  },
  {
    id: 'noisy',
    title: 'Noisy pattern, weaker evidence',
    candidates: [
      ['Candidate A', 66, 'Uses reliable strong bands'],
      ['Candidate B', 61, 'Could be noise-assisted'],
      ['Candidate C', 42, 'Partial match']
    ],
    lesson: 'Close scores should trigger review. Better signal may matter more than forcing a solution.'
  },
  {
    id: 'pseudo',
    title: 'Pseudo-symmetry ambiguity',
    candidates: [
      ['Candidate A', 79, 'Plausible solution'],
      ['Candidate B', 77, 'Similar geometry'],
      ['Candidate C', 40, 'Different family']
    ],
    lesson: 'Similar structures can produce similar overlays. Neighbor context and materials knowledge matter.'
  },
  {
    id: 'wrong-phase',
    title: 'Wrong phase list',
    candidates: [
      ['Forced phase A', 54, 'Best of a bad list'],
      ['Forced phase B', 51, 'Also plausible-looking'],
      ['Revisit phase', 86, 'Most honest action']
    ],
    lesson: 'A tidy overlay is not proof if the candidate phase model is wrong; low fit or MAD-like cues can still mislead.'
  }
];

export const troubleshootingSymptoms = [
  {
    id: 'weak-bands',
    label: 'Weak bands',
    causes: ['Possibly low exposure/current', 'Possible damaged or oxidized surface', 'Possible detector geometry issue'],
    acquisition: 'First check exposure, current, averaging, or binning, and change one setting at a time.',
    preparation: 'Next check final polish, surface cleanliness, oxide, or contamination.',
    geometry: 'Also check sample tilt, working distance, detector position, and pattern center assumptions.'
  },
  {
    id: 'noisy-patterns',
    label: 'Noisy patterns',
    causes: ['Possibly too few electrons per pixel', 'Possibly fast scan settings', 'Possible low detector signal'],
    acquisition: 'First check dwell, current, averaging, or binning; avoid simply raising gain into clipping.',
    preparation: 'If noise remains with good counts, check for surface damage or contamination.',
    geometry: 'Confirm the detector sees the useful pattern region.'
  },
  {
    id: 'drift',
    label: 'Drift',
    causes: ['Possible stage/sample motion', 'Possible thermal settling', 'Long maps'],
    acquisition: 'Use faster survey settings or shorter maps until stable.',
    preparation: 'Improve mounting and contact. Avoid loose or charging specimens.',
    geometry: 'Recheck focus and scan conditions after settling.'
  },
  {
    id: 'charging',
    label: 'Charging',
    causes: ['Possibly insulating sample', 'Possible poor grounding', 'High current/dwell can contribute'],
    acquisition: 'Lower current, reduce dwell, and monitor intensity changes over time.',
    preparation: 'Improve conductive path or coating strategy where compatible with the study.',
    geometry: 'Confirm the apparent shift is not simply detector geometry or focus.'
  },
  {
    id: 'dark-pattern',
    label: 'Very dark pattern',
    causes: ['Possible low signal', 'Detector may be too far or poorly positioned', 'Surface may be blocking diffraction'],
    acquisition: 'Increase exposure/current and verify gain is not too low.',
    preparation: 'Clean or repolish if the surface film blocks near-surface diffraction.',
    geometry: 'Check working distance, detector distance, sample tilt, and detector insertion.'
  },
  {
    id: 'no-indexing',
    label: 'No indexing',
    causes: ['Possibly no usable bands', 'Possible wrong phase list', 'Possible calibration mismatch', 'Threshold may be too strict'],
    acquisition: 'Improve signal and lower overly strict thresholds for diagnosis.',
    preparation: 'Inspect for deformation, contamination, oxide, or severe relief.',
    geometry: 'Revisit pattern center, detector geometry, and phase list.'
  },
  {
    id: 'inconsistent',
    label: 'Inconsistent indexing',
    causes: ['Possible pseudo-symmetry', 'Possible overlapping patterns', 'Low band contrast'],
    acquisition: 'Improve pattern quality and inspect confidence-like separation between candidates.',
    preparation: 'Reduce damage and relief near boundaries.',
    geometry: 'Check phase choice and neighboring pixel continuity.'
  },
  {
    id: 'strange-map',
    label: 'Strange grain map',
    causes: ['Possible drift', 'Possible bad indexing areas', 'Step size may be too coarse', 'Possible preparation artefacts'],
    acquisition: 'Compare IPF, band contrast, confidence-like, and unindexed views.',
    preparation: 'Look for scratches, relief, contamination, or deformation bands.',
    geometry: 'Check whether apparent features line up with scan direction or detector artefacts.'
  }
];

export const learningPipeline = [
  ['Sample Prep', 'Surface condition controls whether usable diffraction starts.'],
  ['Acquisition', 'Microscope settings decide signal, noise, blur, speed, and saturation.'],
  ['Pattern Quality', 'Pattern evidence determines how many reliable bands can be used.'],
  ['Band Detection', 'Conceptual band guides turn image features into geometry.'],
  ['Indexing', 'Candidate orientations compete against the observed band geometry.'],
  ['Confidence-like cues', 'Simplified scores indicate decision strength, not truth.'],
  ['Maps', 'Pixels become orientation, phase, quality, and boundary views.'],
  ['Interpretation', 'Experienced users compare all evidence before drawing conclusions.'],
  ['Troubleshooting', 'Symptoms point back to preparation, acquisition, geometry, indexing, or interpretation checks.']
];
