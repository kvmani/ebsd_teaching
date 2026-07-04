import { formulaReference } from './data/formulas.js';
import { glossaryCategories, glossaryTerms } from './data/glossary.js';
import { learningModules } from './data/learningModules.js';
import {
  completionPercent,
  loadLearningProgress,
  resetLearningProgress,
  saveLearningProgress
} from './learningProgress.js';
import { electronWavelengthPm } from './state.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function listItems(items = []) {
  return items.map((item) => `<li>${escapeHtml(item)}</li>`).join('');
}

function glossaryEntry(term) {
  return glossaryTerms.find((entry) => entry.term.toLowerCase() === String(term).toLowerCase());
}

function geometryConeDiagram(index) {
  const familyOne = '#78d85e';
  const familyTwo = '#62d7f0';
  return `
    <svg class="geometry-cone-diagram" viewBox="0 0 820 390" role="img" aria-label="EBSD schematic with tilted sample, beam, diffraction cones, and detector pattern">
      <defs>
        <radialGradient id="studioBg${index}" cx="42%" cy="42%" r="70%">
          <stop offset="0" stop-color="#16303a" />
          <stop offset="0.55" stop-color="#08141a" />
          <stop offset="1" stop-color="#05090d" />
        </radialGradient>
        <linearGradient id="metalColumn${index}" x1="0" x2="1">
          <stop offset="0" stop-color="#20272a" />
          <stop offset="0.48" stop-color="#626b6d" />
          <stop offset="0.62" stop-color="#d1d7d6" />
          <stop offset="1" stop-color="#242a2c" />
        </linearGradient>
        <linearGradient id="sampleFace${index}" x1="0" x2="1">
          <stop offset="0" stop-color="#2b3031" />
          <stop offset="0.42" stop-color="#747b78" />
          <stop offset="1" stop-color="#1e2324" />
        </linearGradient>
        <linearGradient id="detectorFace${index}" x1="0" x2="1">
          <stop offset="0" stop-color="#11181b" />
          <stop offset="0.5" stop-color="#596263" />
          <stop offset="1" stop-color="#20292c" />
        </linearGradient>
        <linearGradient id="samplePlane${index}" x1="0" x2="1">
          <stop offset="0" stop-color="#d7e2df" stop-opacity="0.72" />
          <stop offset="0.48" stop-color="#ffffff" stop-opacity="0.95" />
          <stop offset="1" stop-color="#aeb9b8" stop-opacity="0.62" />
        </linearGradient>
        <filter id="softGlow${index}" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="2.6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="deepShadow${index}" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="7" stdDeviation="7" flood-color="#000" flood-opacity="0.48" />
        </filter>
      </defs>

      <rect x="10" y="10" width="800" height="370" rx="18" fill="url(#studioBg${index})" stroke="rgba(221,235,239,0.22)" />

      <g aria-label="SEM column" filter="url(#deepShadow${index})">
        <rect x="122" y="22" width="82" height="54" rx="5" fill="url(#metalColumn${index})" />
        <rect x="126" y="74" width="74" height="18" fill="#252d30" opacity="0.96" />
        <rect x="138" y="92" width="50" height="20" rx="4" fill="url(#metalColumn${index})" />
        <rect x="148" y="112" width="30" height="12" rx="3" fill="#20282b" />
      </g>

      <line x1="163" y1="124" x2="163" y2="216" stroke="#16c7ef" stroke-width="8" stroke-linecap="round" filter="url(#softGlow${index})" />

      <g aria-label="tilted sample with explicit sample plane" filter="url(#deepShadow${index})">
        <polygon points="122,103 180,263 153,273 94,113" fill="#050708" opacity="0.7" />
        <polygon points="122,103 180,263 154,273 95,113" fill="url(#sampleFace${index})" stroke="rgba(255,255,255,0.44)" />
        <line x1="122" y1="103" x2="180" y2="263" stroke="url(#samplePlane${index})" stroke-width="5.2" stroke-linecap="round" />
        <line x1="118" y1="118" x2="172" y2="266" stroke="rgba(0,0,0,0.38)" stroke-width="1.4" />
      </g>

      <circle cx="163" cy="216" r="8" fill="#f1ce70" opacity="0.86" filter="url(#softGlow${index})" />
      <circle cx="163" cy="216" r="2.8" fill="#fff7bd" />

      <g aria-label="sample normal and EBSD tilt annotations">
        <line x1="163" y1="216" x2="238" y2="189" stroke="rgba(255,255,255,0.88)" stroke-width="1.8" stroke-dasharray="7 6" />
        <path d="M229 185 L241 188 L232 197" fill="none" stroke="rgba(255,255,255,0.88)" stroke-width="1.6" />
        <rect x="216" y="164" width="100" height="22" rx="6" fill="rgba(7,12,16,0.72)" stroke="rgba(221,235,239,0.16)" />
        <text x="222" y="180" fill="#eef6f7" font-size="13" font-weight="750">sample normal</text>
        <path d="M163 174 A42 42 0 0 0 149 177" fill="none" stroke="rgba(255,255,255,0.95)" stroke-width="2" />
        <path d="M149 177 L159 170 M149 177 L152 166" stroke="rgba(255,255,255,0.95)" stroke-width="1.6" />
        <path d="M107 151 L152 151" stroke="rgba(255,255,255,0.62)" stroke-width="1" />
        <rect x="30" y="128" width="196" height="26" rx="7" fill="rgba(7,12,16,0.78)" stroke="rgba(221,235,239,0.18)" />
        <text x="38" y="146" fill="#f7fbfb" font-size="14" font-weight="800">20° beam–sample plane angle</text>
        <rect x="72" y="267" width="152" height="24" rx="7" fill="rgba(7,12,16,0.72)" stroke="rgba(230,181,90,0.24)" />
        <text x="91" y="286" fill="#ffe7b1" font-size="13" font-weight="800">70° EBSD sample tilt</text>
      </g>

      <g aria-label="two enlarged schematic Kikuchi cone families">
        <path d="M163 216 C268 92 424 80 534 108 C426 116 285 152 163 216 Z" fill="${familyOne}" opacity="0.14" />
        <path d="M163 216 C284 143 430 145 536 190 C424 168 291 174 163 216 Z" fill="${familyOne}" opacity="0.095" />
        <path d="M163 216 C268 92 424 80 534 108" fill="none" stroke="${familyOne}" stroke-width="3" opacity="0.96" />
        <path d="M163 216 C284 143 430 145 536 190" fill="none" stroke="${familyOne}" stroke-width="2.5" opacity="0.62" />

        <path d="M163 216 C282 193 424 193 538 236 C421 211 291 204 163 216 Z" fill="${familyTwo}" opacity="0.13" />
        <path d="M163 216 C296 227 423 238 540 274 C421 245 294 226 163 216 Z" fill="${familyTwo}" opacity="0.08" />
        <path d="M163 216 C282 193 424 193 538 236" fill="none" stroke="${familyTwo}" stroke-width="3" opacity="0.95" />
        <path d="M163 216 C296 227 423 238 540 274" fill="none" stroke="${familyTwo}" stroke-width="2.5" opacity="0.58" />
      </g>

      <g transform="translate(530 72) skewY(8)" aria-label="EBSD detector / phosphor screen" filter="url(#deepShadow${index})">
        <rect x="0" y="0" width="98" height="202" rx="9" fill="#111516" stroke="rgba(255,255,255,0.16)" stroke-width="8" />
        <rect x="8" y="8" width="82" height="186" rx="7" fill="url(#detectorFace${index})" stroke="rgba(255,255,255,0.26)" />
        <g opacity="0.5" stroke-linecap="round">
          <path d="M14 55 C40 42 61 48 84 66" stroke="${familyOne}" stroke-width="4" opacity="0.34" />
          <path d="M14 64 C41 51 62 56 84 74" stroke="${familyOne}" stroke-width="1.4" opacity="0.86" />
          <path d="M12 125 C42 105 62 111 86 134" stroke="${familyTwo}" stroke-width="4" opacity="0.3" />
          <path d="M12 136 C42 116 62 122 86 145" stroke="${familyTwo}" stroke-width="1.4" opacity="0.78" />
        </g>
        <circle cx="48" cy="93" r="3.6" fill="#f8ffff" opacity="0.7" />
      </g>
      <text x="498" y="56" fill="#eef6f7" font-size="13" font-weight="850">EBSD detector / phosphor screen</text>

      <g transform="translate(645 78)" aria-label="detector view inset">
        <rect x="0" y="0" width="146" height="190" rx="14" fill="rgba(8,13,18,0.86)" stroke="rgba(221,235,239,0.24)" />
        <text x="12" y="26" fill="#f7fbfb" font-size="15" font-weight="850">Detector view</text>
        <rect x="12" y="42" width="122" height="102" rx="9" fill="#171c1e" stroke="rgba(221,235,239,0.2)" />
        <g transform="translate(12 42)" opacity="0.82">
          <rect width="122" height="102" rx="9" fill="#242b2d" />
          <g opacity="0.85" stroke-linecap="round">
            <path d="M-8 25 L130 88" stroke="#0c1112" stroke-width="10" opacity="0.28" />
            <path d="M-8 23 L130 86" stroke="#e9f8f2" stroke-width="3" opacity="0.66" />
            <path d="M-8 31 L130 94" stroke="${familyOne}" stroke-width="2" opacity="0.62" />
            <path d="M-6 80 L128 18" stroke="#0c1112" stroke-width="10" opacity="0.28" />
            <path d="M-6 78 L128 16" stroke="#e9f8f2" stroke-width="3" opacity="0.62" />
            <path d="M-6 87 L128 25" stroke="${familyTwo}" stroke-width="2" opacity="0.6" />
            <path d="M42 -8 L82 110" stroke="#f6fbfb" stroke-width="2.4" opacity="0.38" />
            <path d="M51 -8 L91 110" stroke="#0a0d0e" stroke-width="4.5" opacity="0.22" />
          </g>
          <circle cx="61" cy="51" r="5.5" fill="#fff" opacity="0.56" filter="url(#softGlow${index})" />
          <circle cx="61" cy="51" r="1.8" fill="#fff" />
        </g>
        <text x="12" y="162" fill="#d6e0e3" font-size="11.5">Band = cone intersection</text>
        <text x="12" y="178" fill="#d6e0e3" font-size="11.5">with detector</text>
      </g>

      <g transform="translate(40 320)" aria-label="legend">
        <rect x="0" y="0" width="24" height="6" rx="3" fill="#16c7ef" />
        <text x="34" y="8" fill="#eef6f7" font-size="13" font-weight="650">electron beam</text>
        <rect x="160" y="0" width="24" height="6" rx="3" fill="${familyOne}" />
        <text x="194" y="8" fill="#eef6f7" font-size="13" font-weight="650">Kikuchi cone family 1</text>
        <rect x="384" y="0" width="24" height="6" rx="3" fill="${familyTwo}" />
        <text x="418" y="8" fill="#eef6f7" font-size="13" font-weight="650">Kikuchi cone family 2</text>
        <rect x="612" y="-5" width="24" height="14" rx="3" fill="url(#sampleFace${index})" stroke="rgba(255,255,255,0.34)" />
        <text x="646" y="8" fill="#eef6f7" font-size="13" font-weight="650">sample</text>
      </g>

      <text x="40" y="360" fill="#a9b9bd" font-size="13">Cones are enlarged for learning clarity.</text>
    </svg>
  `;
}

const geometryDiagramModuleIds = new Set(['intro', 'geometry', 'interaction', 'bragg', 'kikuchi', 'detector']);

function diagramForModule(index, module) {
  if (geometryDiagramModuleIds.has(module?.id)) {
    return geometryConeDiagram(index);
  }
  const colors = ['#62d7f0', '#92d46f', '#e6b55a', '#ae98e8'];
  const accent = colors[index % colors.length];
  return `
    <svg viewBox="0 0 760 260" role="img" aria-label="Schematic lesson diagram">
      <rect x="18" y="18" width="724" height="224" rx="14" fill="#0b1013" stroke="rgba(220,235,228,0.18)" />
      <g transform="translate(${40 + index * 4}, 0)">
        <rect x="76" y="28" width="64" height="58" rx="8" fill="#29343a" stroke="#6d7d83" />
        <line x1="108" y1="86" x2="108" y2="174" stroke="#62d7f0" stroke-width="5" stroke-linecap="round" />
        <circle cx="108" cy="174" r="16" fill="#e6b55a" fill-opacity="0.72" />
        <g transform="translate(72, 176) rotate(-18)">
          <rect x="0" y="0" width="190" height="28" rx="4" fill="#58615e" stroke="#ffd991" />
          <line x1="36" y1="-10" x2="158" y2="-10" stroke="${accent}" stroke-width="3" stroke-opacity="0.75" />
          <line x1="48" y1="-22" x2="170" y2="-22" stroke="${accent}" stroke-width="3" stroke-opacity="0.45" />
        </g>
        <path d="M124 174 C210 88 300 76 396 118" fill="none" stroke="#92d46f" stroke-width="3" stroke-opacity="0.7" />
        <path d="M124 174 C230 242 318 232 412 178" fill="none" stroke="#e784ba" stroke-width="3" stroke-opacity="0.65" />
        <rect x="456" y="54" width="152" height="150" rx="10" fill="#1a2a2f" stroke="#d6f5f5" stroke-opacity="0.55" />
        <line x1="470" y1="98" x2="596" y2="158" stroke="${accent}" stroke-width="8" stroke-opacity="0.26" />
        <line x1="468" y1="112" x2="592" y2="172" stroke="#f5fbfb" stroke-width="2" stroke-opacity="0.42" />
        <line x1="488" y1="176" x2="604" y2="80" stroke="#62d7f0" stroke-width="7" stroke-opacity="0.22" />
        <line x1="486" y1="188" x2="606" y2="92" stroke="#f5fbfb" stroke-width="2" stroke-opacity="0.36" />
      </g>
    </svg>
  `;
}

const activityDefaults = {
  'geometry-stage-1': {
    aim: 'Connect the SEM column, tilted sample, and detector into one geometry.',
    steps: ['Open Geometry + Pattern.', 'Start at stage 1.', 'Use Next to reveal each geometry element.', 'Name what each numbered label represents.'],
    prediction: 'Which part of the setup do you expect to control pattern visibility most strongly?',
    explanation: 'The visual geometry is simplified so students can connect the beam, near-surface scattering, cones, and detector before discussing calibration.'
  },
  'geometry-stage-2': {
    aim: 'See why EBSD is treated as a near-surface diffraction method.',
    steps: ['Open Geometry + Pattern.', 'Go to interaction volume stage.', 'Inspect the glowing near-surface marker.', 'Discuss why polishing damage matters.'],
    prediction: 'If the surface is damaged, what should happen to band sharpness?',
    explanation: 'The interaction volume is schematic. It marks the learning idea that useful EBSD signal is tied to the prepared near-surface region.'
  },
  'geometry-stage-4': {
    aim: 'Explore how voltage and d-spacing affect Bragg angle and cone visibility.',
    steps: ['Open Geometry + Pattern.', 'Go to cone formation stage.', 'Change voltage from 10 kV to 30 kV.', 'Watch wavelength and band-width readouts.'],
    prediction: 'What happens to electron wavelength when voltage increases?',
    explanation: 'Higher accelerating voltage gives shorter electron wavelength. For a fixed d-spacing, Bragg angle becomes smaller; the app magnifies cones for visual learning.'
  },
  'geometry-stage-6': {
    aim: 'Observe how crystal orientation moves Kikuchi bands.',
    steps: ['Open the full pattern stage.', 'Rotate crystal Z slowly.', 'Compare the detector pattern before and after.', 'Describe which bands moved.'],
    prediction: 'Will band positions stay fixed if the crystal rotates?',
    explanation: 'Band positions encode crystal orientation because lattice-plane normals rotate relative to the detector.'
  },
  'geometry-detector-demo': {
    aim: 'Connect detector distance and height to pattern projection.',
    steps: ['Open the detector geometry stage.', 'Adjust detector distance.', 'Adjust detector height.', 'Watch the pattern center shift conceptually.'],
    prediction: 'Does moving the detector only change brightness, or also band position?',
    explanation: 'Detector geometry controls projection. A visible pattern can still index poorly if detector geometry is wrong.'
  },
  'open-acquisition-balanced': {
    aim: 'Start from a balanced acquisition condition and inspect all quality readouts.',
    steps: ['Open Live Scan Acquisition.', 'Apply the balanced preset.', 'Compare pattern quality, confidence-like cues, and source label.', 'Switch map overlays.'],
    prediction: 'Which metric should improve when signal is balanced without clipping?',
    explanation: 'Balanced settings produce recognizable bands with moderate scan speed, so students can study signal, detail, speed, and risk together.'
  },
  'acquisition-compare-quality': {
    aim: 'Compare fast survey and high-quality acquisition trade-offs.',
    steps: ['Open Live Scan Acquisition.', 'Apply a high-quality preset.', 'Compare speed and confidence-like cues.', 'Then try Fast survey from the preset buttons.'],
    prediction: 'Which setting should scan faster, and which should show cleaner patterns?',
    explanation: 'Exposure and averaging can improve signal but cost time. Good EBSD acquisition is a trade-off, not a single best slider value.'
  },
  'acquisition-map-views': {
    aim: 'Interpret IPF, quality, confidence-like, and unindexed maps together.',
    steps: ['Open Live Scan Acquisition.', 'Switch map view to confidence-like cue.', 'Compare it with orientation and quality.', 'Look for regions where maps disagree.'],
    prediction: 'Can IPF color alone prove the data are reliable?',
    explanation: 'IPF color should be interpreted with pattern quality and confidence-like cues. A colorful map is not automatically a correct map.'
  },
  'acquisition-noisy': {
    aim: 'Diagnose weak signal and noisy indexing.',
    steps: ['Open Live Scan Acquisition.', 'Apply the noisy setup.', 'Increase exposure or averaging.', 'Watch noise and confidence-like cues change.'],
    prediction: 'Which change should reduce random noise most clearly?',
    explanation: 'Low exposure/current gives weak patterns. Averaging and longer exposure improve signal but slow the scan.'
  },
  'acquisition-clipping': {
    aim: 'Show why brighter is not always better.',
    steps: ['Open Live Scan Acquisition.', 'Apply the gain clipping preset.', 'Reduce gain first.', 'Observe clipping and band contrast.'],
    prediction: 'If the image is saturated, should gain go up or down first?',
    explanation: 'Clipping hides band contrast. Reducing gain can improve indexing even when the pattern looks less bright.'
  },
  'acquisition-drift': {
    aim: 'See how drift can distort a map even when individual patterns look usable.',
    steps: ['Open Live Scan Acquisition.', 'Apply the drift preset.', 'Watch grain boundaries bend or smear.', 'Compare with a stable preset.'],
    prediction: 'Can map geometry be wrong even when the pattern preview looks acceptable?',
    explanation: 'Drift changes where pixels are recorded. It can ruin map interpretation without making every pattern obviously bad.'
  }
};

const mapModes = {
  ipf: {
    label: 'IPF orientation map',
    meaning: 'Colors encode orientation relative to a sample direction.',
    observe: 'Look for grains with coherent color and boundaries where orientation changes.',
    mistake: 'Do not read IPF color as chemical phase by itself.',
    question: 'Which other map would you compare before trusting this color boundary?'
  },
  quality: {
    label: 'Pattern quality map',
    meaning: 'Brightness represents conceptual band clarity.',
    observe: 'Dark bands near boundaries or damaged areas can indicate weaker diffraction patterns.',
    mistake: 'Dark quality is not automatically a different phase.',
    question: 'What acquisition or preparation issue could make a region dark?'
  },
  confidence: {
    label: 'Confidence-like map',
    meaning: 'Brightness shows conceptual indexing decision strength.',
    observe: 'Low confidence-like cue regions can appear where bands are weak, clipped, or phase choice is wrong.',
    mistake: 'Confidence-like cues are not proof of physical truth.',
    question: 'What would you check first if confidence-like cues are low but the pattern is visible?'
  },
  unindexed: {
    label: 'Unindexed pixels map',
    meaning: 'Marked cells show rejected or failed indexing.',
    observe: 'Clusters of failed pixels are more diagnostic than isolated speckles.',
    mistake: 'Do not simply hide unindexed pixels without asking why they failed.',
    question: 'Would you lower the threshold or improve the pattern first?'
  },
  boundaries: {
    label: 'Grain boundary overlay',
    meaning: 'Lines schematically mark orientation discontinuities.',
    observe: 'Compare boundary locations with quality and confidence-like cues before interpreting fine features.',
    mistake: 'Every boundary-like line is not automatically a real microstructural boundary.',
    question: 'Which overlay would reveal if a boundary is caused by poor indexing?'
  }
};

const mapRegions = {
  'grain-a': { label: 'Grain A', orientation: 'blue-green orientation cue', quality: 84, confidence: 88, indexed: 'accepted cue', text: 'Coherent color and good confidence-like cue make this a good schematic example of a stable grain interior.' },
  'grain-b': { label: 'Grain B', orientation: 'amber orientation cue', quality: 76, confidence: 72, indexed: 'accepted cue', text: 'This region is usable in the exercise, but students should still compare quality and confidence-like cues before interpreting boundaries.' },
  boundary: { label: 'Boundary band', orientation: 'rapid orientation change', quality: 46, confidence: 38, indexed: 'mixed cue', text: 'Quality and confidence-like cues drop near boundaries, where patterns can overlap or become harder to index.' },
  damaged: { label: 'Prepared surface issue', orientation: 'uncertain', quality: 28, confidence: 22, indexed: 'partly unindexed cue', text: 'Low quality plus low confidence-like cue is a prompt to discuss preparation, signal, phase choice, and thresholds.' }
};

const diagnosticCases = {
  'no-bands': {
    symptom: 'No bands visible',
    causes: ['Poor surface preparation', 'Weak signal', 'Detector geometry not intercepting useful electrons'],
    firstFix: 'Check geometry and increase exposure/current before trusting indexing.',
    preset: 'geometry-stage-2',
    expected: 'The student should see where the near-surface interaction volume and detector path fit into the EBSD condition.',
    warning: 'Do not jump straight to changing phase files when the pattern has no visible bands.'
  },
  'noisy-pattern': {
    symptom: 'Very noisy pattern',
    causes: ['Exposure too short', 'Beam current too low', 'Frame averaging too low'],
    firstFix: 'Increase exposure or averaging, then check scan speed.',
    preset: 'acquisition-noisy',
    expected: 'Noise should drop and confidence-like cues should become less speckled.',
    warning: 'Increasing band detection too much may detect false bands instead of fixing the signal.'
  },
  'saturated-pattern': {
    symptom: 'Saturated pattern',
    causes: ['Gain too high', 'Exposure too long', 'Beam current too high'],
    firstFix: 'Reduce gain first, then rebalance exposure/current.',
    preset: 'acquisition-clipping',
    expected: 'Clipping should decrease and band contrast should return.',
    warning: 'A brighter pattern is not always a better pattern.'
  },
  'many-unindexed': {
    symptom: 'Many unindexed pixels',
    causes: ['Weak or clipped bands', 'Indexing threshold too strict', 'Wrong phase selection'],
    firstFix: 'Compare quality and confidence-like cues, then improve pattern or lower threshold.',
    preset: 'acquisition-map-views',
    expected: 'Unindexed regions should shrink after signal or threshold is corrected.',
    warning: 'Do not simply hide failed pixels from the map.'
  },
  drift: {
    symptom: 'Distorted map',
    causes: ['Stage drift', 'Sample charging', 'Scan too slow for stability'],
    firstFix: 'Stabilize the sample/stage or use a faster survey scan.',
    preset: 'acquisition-drift',
    expected: 'Boundaries should look less warped in a stable setup.',
    warning: 'A clean pattern preview does not guarantee a geometrically faithful map.'
  },
  'coarse-map': {
    symptom: 'Coarse map',
    causes: ['Step size too large', 'Binning too high', 'Fast survey settings'],
    firstFix: 'Reduce step size or binning when spatial detail matters.',
    preset: 'acquisition-compare-quality',
    expected: 'Fine grains and boundaries should be sampled more clearly.',
    warning: 'Do not confuse fast acquisition with adequate spatial resolution.'
  },
  'wrong-phase': {
    symptom: 'Pattern visible but indexing unstable',
    causes: ['Incorrect phase selection', 'Wrong lattice parameters', 'Bad detector geometry'],
    firstFix: 'Check phase choice and detector calibration before forcing a confidence-like result.',
    preset: 'open-acquisition-balanced',
    expected: 'A plausible phase/indexing setup should increase confidence-like evidence without inventing bands.',
    warning: 'High confidence-like evidence can still be misleading if the candidate phase is wrong.'
  },
  'strict-threshold': {
    symptom: 'Too strict indexing threshold',
    causes: ['Threshold above current pattern quality', 'Low confidence-like cues accepted too aggressively or rejected too harshly'],
    firstFix: 'Lower threshold for exploration, or improve signal for stricter maps.',
    preset: 'acquisition-map-views',
    expected: 'Rejected pixels should decrease, but students must discuss trust.',
    warning: 'Lowering the threshold is not the same as improving the experiment.'
  }
};

export class LearningPath {
  constructor({ moduleList, lessonWorkspace, miniGlossary, formulaPanel, onExperiment = () => {} }) {
    this.moduleList = moduleList;
    this.lessonWorkspace = lessonWorkspace;
    this.miniGlossary = miniGlossary;
    this.formulaPanel = formulaPanel;
    this.onExperiment = onExperiment;
    this.progress = loadLearningProgress();
    if (!['learn', 'practice', 'revise'].includes(this.progress.selectedMode)) this.progress.selectedMode = 'learn';
    this.selectedQuestionIndex = 0;
    this.glossaryQuery = '';
    this.glossaryCategory = 'all';
    this.visibleHints = new Set();
    this.visibleExplanations = new Set();
    this.flashcardFlipped = false;
    this.render();
  }

  selectedModule() {
    return learningModules.find((module) => module.id === this.progress.selectedModuleId) ?? learningModules[0];
  }

  moduleIndex(module = this.selectedModule()) {
    return Math.max(0, learningModules.findIndex((item) => item.id === module.id));
  }

  save(progress = this.progress) {
    this.progress = progress;
    saveLearningProgress(this.progress);
  }

  render() {
    this.renderModuleList();
    this.renderLesson();
    this.renderGlossary();
    this.renderFormula();
  }

  moduleStatus(module) {
    if (this.progress.completedModules.includes(module.id)) return 'complete';
    if (this.progress.inProgressModules.includes(module.id) || this.progress.quizScores[module.id]) return 'in progress';
    return 'not started';
  }

  notesCount() {
    return Object.values(this.progress.notes).filter((note) => String(note).trim()).length;
  }

  quizAverage() {
    const scores = Object.values(this.progress.quizScores).filter((score) => score.total);
    if (!scores.length) return 0;
    const correct = scores.reduce((sum, score) => sum + score.correct, 0);
    const total = scores.reduce((sum, score) => sum + score.total, 0);
    return Math.round((correct / total) * 100);
  }

  activityList(module) {
    return module.miniExperiments.map((experiment, index) => {
      const defaults = activityDefaults[experiment.action] ?? {};
      return {
        id: `${module.id}-${experiment.action}-${index}`,
        title: experiment.label,
        action: experiment.action,
        intro: experiment.text,
        aim: defaults.aim ?? `Use the simulator to connect ${module.shortTitle || module.title} to something visible.`,
        steps: defaults.steps ?? ['Open the linked simulator tab.', 'Apply the suggested state.', 'Change one setting at a time.', 'Write what changed.'],
        prediction: defaults.prediction ?? 'What do you expect to change in the pattern or map?',
        explanation: defaults.explanation ?? module.whyItMatters
      };
    });
  }

  nextRecommendedAction(module) {
    const score = this.progress.quizScores[module.id];
    const mistakes = this.progress.quizMistakes[module.id] || [];
    const incompleteActivity = this.activityList(module).find((activity) => !this.progress.completedActivities.includes(activity.id));
    if (!score || score.total < module.quizQuestions.length) return 'Next: answer the checkpoint quiz.';
    if (mistakes.length) return 'Next: review mistakes and try the weak concept again.';
    if (incompleteActivity) return `Next: try "${incompleteActivity.title}".`;
    if (!String(this.progress.notes[module.id] || '').trim()) return 'Next: write a short reflection note.';
    if (!this.progress.completedModules.includes(module.id)) return 'Next: mark this module complete.';
    return 'Next: continue to the next module.';
  }

  selectModule(moduleId) {
    this.progress.selectedModuleId = moduleId;
    if (!this.progress.inProgressModules.includes(moduleId) && !this.progress.completedModules.includes(moduleId)) {
      this.progress.inProgressModules.push(moduleId);
    }
    this.selectedQuestionIndex = 0;
    this.flashcardFlipped = false;
    this.save();
    this.render();
  }

  continueCourse() {
    const firstUnfinished = learningModules.find((module) => {
      const score = this.progress.quizScores[module.id];
      return !this.progress.completedModules.includes(module.id) || !score || score.total < module.quizQuestions.length;
    });
    this.selectModule((firstUnfinished ?? this.selectedModule()).id);
  }

  moveModule(offset) {
    const nextIndex = Math.min(learningModules.length - 1, Math.max(0, this.moduleIndex() + offset));
    this.selectModule(learningModules[nextIndex].id);
  }

  renderModuleList() {
    const percent = completionPercent(this.progress, learningModules);
    this.moduleList.innerHTML = `
      <div class="learning-progress-card">
        <div><strong>${percent}% complete</strong><span>${this.progress.completedModules.length} of ${learningModules.length} modules</span></div>
        <div class="progress-track"><b style="width:${percent}%"></b></div>
        <div class="learning-progress-actions">
          <button type="button" data-learning-action="continue">Continue course</button>
          <button type="button" data-learning-action="reset">Reset progress</button>
        </div>
      </div>
      ${learningModules.map((module, index) => {
        const status = this.moduleStatus(module);
        const selected = module.id === this.progress.selectedModuleId;
        const score = this.progress.quizScores[module.id];
        return `
          <button class="module-card ${selected ? 'active' : ''} ${status.replace(' ', '-')}" type="button" data-module="${module.id}">
            <span>${String(index + 1).padStart(2, '0')}</span>
            <strong>${escapeHtml(module.shortTitle || module.title)}</strong>
            <small>${escapeHtml(module.estimatedTime)} - ${escapeHtml(status)}${score ? ` - quiz ${score.correct}/${score.total}` : ''}</small>
          </button>
        `;
      }).join('')}
    `;

    this.moduleList.querySelectorAll('[data-module]').forEach((button) => {
      button.addEventListener('click', () => this.selectModule(button.dataset.module));
    });

    this.moduleList.querySelector('[data-learning-action="continue"]').addEventListener('click', () => this.continueCourse());
    this.moduleList.querySelector('[data-learning-action="reset"]').addEventListener('click', () => {
      this.progress = resetLearningProgress();
      this.selectedQuestionIndex = 0;
      this.flashcardFlipped = false;
      this.render();
    });
  }

  renderCourseDashboard(module) {
    const percent = completionPercent(this.progress, learningModules);
    const index = this.moduleIndex(module);
    return `
      <section class="course-dashboard" aria-label="Learning Path dashboard">
        <div class="dashboard-main">
          <span>Study dashboard</span>
          <strong>${escapeHtml(module.shortTitle || module.title)} - ${escapeHtml(this.progress.selectedMode)}</strong>
          <p>${escapeHtml(this.nextRecommendedAction(module))}</p>
        </div>
        <div class="dashboard-metrics">
          <div><b>${percent}%</b><small>overall progress</small></div>
          <div><b>${this.quizAverage()}%</b><small>quiz average</small></div>
          <div><b>${this.progress.bookmarks.length}</b><small>bookmarks</small></div>
          <div><b>${this.notesCount()}</b><small>notes</small></div>
        </div>
        <div class="dashboard-actions">
          <button type="button" data-course-action="previous" ${index === 0 ? 'disabled' : ''}>Previous module</button>
          <button type="button" data-course-action="next" ${index === learningModules.length - 1 ? 'disabled' : ''}>Next module</button>
          <button type="button" data-course-action="continue">Continue path</button>
          <button type="button" data-course-action="weak">Review weak areas</button>
        </div>
      </section>
    `;
  }

  renderLesson() {
    const module = this.selectedModule();
    const bookmarked = this.progress.bookmarks.includes(module.id);
    const note = this.progress.notes[module.id] || '';
    this.lessonWorkspace.innerHTML = `
      ${this.renderCourseDashboard(module)}
      <div class="lesson-hero">
        <div>
          <span>${escapeHtml(module.category)} - ${escapeHtml(module.difficulty)} - ${escapeHtml(module.estimatedTime)}</span>
          <h2>${escapeHtml(module.title)}</h2>
          <p>${escapeHtml(module.explanation)}</p>
        </div>
        <div class="lesson-actions">
          <button id="markModuleComplete" type="button">${this.progress.completedModules.includes(module.id) ? 'Completed' : 'Mark complete'}</button>
          <button id="bookmarkModule" type="button">${bookmarked ? 'Bookmarked' : 'Bookmark'}</button>
        </div>
      </div>
      <div class="learning-mode-selector" role="group" aria-label="Learning mode">
        ${['learn', 'practice', 'revise'].map((mode) => `
          <button type="button" class="${this.progress.selectedMode === mode ? 'active' : ''}" data-learning-mode="${mode}">${mode[0].toUpperCase() + mode.slice(1)}</button>
        `).join('')}
      </div>
      ${this.progress.weakReviewOpen ? this.renderWeakAreas() : ''}
      ${this.renderModeContent(module)}
      ${this.progress.selectedMode === 'learn' ? '' : this.renderSpecialModuleContent(module)}
      <div class="lesson-grid utility-grid">
        <article class="lesson-card notes-card">
          <span>Student notes</span>
          <textarea id="moduleNotes" rows="5" placeholder="Write local notes for this module...">${escapeHtml(note)}</textarea>
          <div class="note-actions">
            <button id="saveModuleNote" type="button">Save note</button>
            <button id="clearModuleNote" type="button">Clear note</button>
          </div>
        </article>
        <article class="lesson-card topics-card">
          <span>Glossary links</span>
          <p>${module.glossaryTerms.map((term) => `<button class="inline-term" type="button" data-glossary-term="${escapeHtml(term)}">${escapeHtml(term)}</button>`).join('')}</p>
        </article>
      </div>
    `;

    this.bindLessonEvents(module);
  }

  renderModeContent(module) {
    if (this.progress.selectedMode === 'practice') {
      return `
        <section class="mode-panel practice">
          <strong>Practice mode</strong>
          <p>Use the sequence: predict, run the simulator, observe, explain, then answer the checkpoint.</p>
        </section>
        <div class="lesson-grid practice-grid">
          ${this.renderQuiz(module)}
          ${this.renderActivityCards(module)}
          <article class="lesson-card">
            <span>Practice tasks</span>
            <ul>${listItems(module.practiceTasks)}</ul>
          </article>
        </div>
      `;
    }

    if (this.progress.selectedMode === 'revise') {
      return `
        <section class="mode-panel revise">
          <strong>Revise mode</strong>
          <p>Review the essential ideas, flip flashcards, and repair weak quiz concepts before moving on.</p>
        </section>
        <div class="lesson-grid revise-grid">
          ${this.renderFlashcards(module)}
          <article class="lesson-card concept">
            <span>Compact summary</span>
            <ul>${listItems(module.keyIdeas.slice(0, 5))}</ul>
          </article>
          <article class="lesson-card misconception">
            <span>Misconception reminder</span>
            <p>${escapeHtml(module.misconception)}</p>
          </article>
          ${this.renderModuleFormulaBlock(module)}
          ${this.renderMistakeReview(module)}
        </div>
      `;
    }

    if (false) {
      return `
        <section class="mode-panel self-study">
          <strong>Self-study sequence</strong>
          <p>Use prediction before slider movement, observation after, then a misconception check.</p>
        </section>
        <div class="lesson-grid self-study-grid">
          <article class="lesson-card self-study-note">
            <span>Suggested practice sequence</span>
            <ol>
              <li>Predict the visible change.</li>
              <li>Run the linked simulator activity.</li>
              <li>Pause on the readout or map evidence.</li>
              <li>Explain the result using one glossary term.</li>
            </ol>
          </article>
          <article class="lesson-card self-study-note">
            <span>Reflection prompts</span>
            <ul>${listItems(module.reflectionPrompts)}</ul>
          </article>
          <article class="lesson-card self-study-note">
            <span>Expected observations</span>
            <ul>${listItems(this.activityList(module).map((activity) => activity.explanation))}</ul>
          </article>
          <article class="lesson-card misconception">
            <span>Common student mistake</span>
            <p>${escapeHtml(module.misconception)}</p>
          </article>
          ${this.renderActivityCards(module, true)}
        </div>
      `;
    }

    return `
      <section class="mode-panel">
        <strong>Learn mode</strong>
        <p>Start with the concept, then try one simulator action and answer the checkpoint.</p>
      </section>
      <div class="lesson-grid learn-grid">
        <article class="lesson-card concept">
          <span>Learning objectives</span>
          <ul>${listItems(module.learningObjectives)}</ul>
        </article>
        <article class="lesson-card concept">
          <span>Key ideas</span>
          <ul>${listItems(module.keyIdeas)}</ul>
        </article>
        <article class="lesson-card">
          <span>Why this matters in real EBSD</span>
          <p>${escapeHtml(module.whyItMatters)}</p>
        </article>
        <article class="lesson-card misconception">
          <span>Common misconception</span>
          <p>${escapeHtml(module.misconception)}</p>
        </article>
        ${this.renderModuleFormulaBlock(module)}
        ${this.renderQuiz(module)}
        ${this.renderActivityCards(module)}
        ${this.renderSpecialModuleContent(module)}
        ${this.renderAdvancedConceptCards()}
      </div>
    `;
  }

  renderActivityCards(module, compactActivity = false) {
    const activities = this.activityList(module);
    if (!activities.length) return '';
    return `
      <article class="lesson-card activity-card ${compactActivity ? 'compact-activity' : ''}">
        <span>Guided activity worksheet</span>
        ${activities.map((activity) => {
          const done = this.progress.completedActivities.includes(activity.id);
          const observation = this.progress.activityObservations[activity.id] || '';
          return `
            <section class="activity-sheet">
              <div class="activity-heading">
                <strong>${escapeHtml(activity.title)}</strong>
                <small>${done ? 'done' : 'not done'}</small>
              </div>
              <p><b>Aim:</b> ${escapeHtml(activity.aim)}</p>
              <details ${compactActivity ? '' : 'open'}>
                <summary>Steps</summary>
                <ol>${listItems(activity.steps)}</ol>
              </details>
              <p><b>Prediction:</b> ${escapeHtml(activity.prediction)}</p>
              <button type="button" data-experiment="${escapeHtml(activity.action)}" data-activity-id="${escapeHtml(activity.id)}">Start guided demo</button>
              <p class="activity-expectation"><b>Expected observation:</b> ${escapeHtml(activity.explanation)}</p>
              <label class="observation-box">
                <span>What changed?</span>
                <textarea rows="3" data-activity-observation="${escapeHtml(activity.id)}" placeholder="Describe what changed in the pattern, map, or readout...">${escapeHtml(observation)}</textarea>
              </label>
              <p class="activity-explanation"><b>Explanation:</b> ${escapeHtml(activity.explanation)}</p>
              <div class="note-actions">
                <button type="button" data-save-activity="${escapeHtml(activity.id)}">Save observation</button>
                <button type="button" data-complete-activity="${escapeHtml(activity.id)}">${done ? 'Activity done' : 'Mark activity done'}</button>
              </div>
            </section>
          `;
        }).join('')}
      </article>
    `;
  }

  renderModuleFormulaBlock(module) {
    if (!module.formulas.length) return '';
    if (module.id === 'bragg') {
      return `
        <article class="lesson-card formula-focus">
          <span>Worked example</span>
          <div class="formula">${escapeHtml(formulaReference.bragg)}</div>
          <p>At 20 kV, electron wavelength is about 0.0086 nm. For d = 0.120 nm and n = 1:</p>
          <ol>
            <li>sin(theta) = 0.0086 / (2 x 0.120)</li>
            <li>sin(theta) = 0.0358</li>
            <li>theta is about 2.05°</li>
          </ol>
          <small>Learning note: the app magnifies cone angles so beginners can see the geometry.</small>
        </article>
      `;
    }
    return `
      <article class="lesson-card formula-focus">
        <span>Useful formula reference</span>
        ${module.formulas.map((id) => `<div class="formula">${escapeHtml(formulaReference[id] ?? id)}</div>`).join('')}
        <small>Conceptual learning reference, not calibrated EBSD software.</small>
      </article>
    `;
  }

  renderAdvancedConceptCards() {
    const cards = [
      ['Pattern center and detector calibration', 'Pattern center is a geometric calibration reference. If it is wrong, visible bands can still index poorly.'],
      ['Phase selection and pseudosymmetry', 'Similar symmetries can make a plausible wrong phase look tempting. Use phase knowledge and chemistry, not geometry alone.'],
      ['FCC Cu/Ni-like phases', 'Cu and Ni have similar FCC band geometry, so EBSD band positions alone may not separate them reliably.'],
      ['Binning vs exposure vs gain', 'Binning and exposure collect more usable signal; gain amplifies what is already there and can clip detail.'],
      ['Step size relative to grain size', 'Step size should be small enough to sample grains and boundaries; oversized steps can miss fine structure.'],
      ['Confidence-like cues vs pattern quality', 'Pattern quality describes image clarity; confidence-like cues describe the indexing decision. They should be interpreted together.'],
      ['Grain boundary misorientation', 'Boundaries are orientation changes. Low-angle and high-angle boundaries mean different microstructural stories.'],
      ['IPF color interpretation', 'IPF color encodes crystal direction relative to a sample axis, not composition by itself.']
    ];
    return `
      <article class="lesson-card advanced-concepts wide-card">
        <span>Advanced but safe EBSD concepts</span>
        <div>
          ${cards.map(([title, text]) => `<section><strong>${escapeHtml(title)}</strong><p>${escapeHtml(text)}</p></section>`).join('')}
        </div>
      </article>
    `;
  }

  renderSpecialModuleContent(module) {
    if (module.id === 'maps') return this.renderMapLab();
    if (module.id === 'troubleshooting') return this.renderTroubleshootingTool(module);
    return '';
  }

  renderQuiz(module) {
    const questions = module.quizQuestions;
    const question = questions[this.selectedQuestionIndex] || questions[0];
    const score = this.progress.quizScores[module.id] || { correct: 0, total: 0 };
    const answerKey = `${module.id}:${question.id}`;
    const answer = this.progress.quizAnswers[answerKey];
    const showHint = this.visibleHints.has(answerKey);
    const showExplanation = this.visibleExplanations.has(answerKey) || answer;
    return `
      <article class="lesson-card quiz-card">
        <span>Checkpoint quiz</span>
        <div class="quiz-topline">
          <strong>Question ${this.selectedQuestionIndex + 1} of ${questions.length}</strong>
          <small>${escapeHtml(question.conceptTag)} - ${escapeHtml(question.difficulty)} - Score: ${score.correct}/${questions.length}</small>
        </div>
        <p>${escapeHtml(question.question)}</p>
        <div class="quiz-options">
          ${question.options.map((option, index) => {
            const isSelected = answer?.selectedIndex === index;
            const isCorrect = index === question.answerIndex;
            const cls = answer ? `${isCorrect ? 'correct' : ''} ${isSelected && !isCorrect ? 'incorrect selected' : isSelected ? 'selected' : ''}` : '';
            return `<button type="button" class="${cls}" data-quiz-option="${index}" ${answer ? 'disabled' : ''}>${escapeHtml(option)}</button>`;
          }).join('')}
        </div>
        <div class="quiz-tools">
          <button id="showQuizHint" type="button">Show hint</button>
          <button id="explainQuizAnswer" type="button">Explain answer</button>
        </div>
        ${showHint ? `<p class="quiz-hint"><b>Hint:</b> ${escapeHtml(question.hint)}</p>` : ''}
        ${showExplanation ? `<p class="quiz-feedback ${answer?.correct ? 'correct' : answer ? 'incorrect' : ''}"><b>${answer ? (answer.correct ? 'Correct.' : 'Not quite.') : 'Explanation:'}</b> ${escapeHtml(answer && !answer.correct ? (question.wrongAnswerFeedback?.[answer.selectedIndex] || question.feedback) : question.feedback)}</p>` : '<p class="quiz-feedback muted">Choose an answer to lock it and see feedback.</p>'}
        <div class="quiz-nav">
          <button id="tryQuestionAgain" type="button">Try again</button>
          <button id="nextQuizQuestion" type="button">Next question</button>
        </div>
        ${this.renderMistakeReview(module)}
      </article>
    `;
  }

  renderMistakeReview(module) {
    const mistakes = this.progress.quizMistakes[module.id] || [];
    return `
      <div class="review-mistakes ${mistakes.length ? '' : 'empty'}">
        <strong>Review mistakes</strong>
        ${mistakes.length
          ? `<ul>${mistakes.map((m) => `<li><b>${escapeHtml(m.conceptTag || 'Concept')}:</b> ${escapeHtml(m.question)} Correct: ${escapeHtml(m.correct)}</li>`).join('')}</ul>`
          : '<p>No saved mistakes for this module yet.</p>'}
      </div>
    `;
  }

  renderWeakAreas() {
    const allMistakes = learningModules.flatMap((module) => (this.progress.quizMistakes[module.id] || []).map((mistake) => ({ module, mistake })));
    return `
      <section class="weak-areas-panel">
        <div>
          <strong>Weak concept review</strong>
          <p>${allMistakes.length ? 'These are the latest missed checkpoints saved locally.' : 'No weak areas saved yet. Answer quizzes to build this list.'}</p>
        </div>
        <button type="button" data-course-action="close-weak">Close review</button>
        ${allMistakes.length ? `<ul>${allMistakes.map(({ module, mistake }) => `<li><b>${escapeHtml(module.shortTitle)}:</b> ${escapeHtml(mistake.question)} <span>Correct: ${escapeHtml(mistake.correct)}</span></li>`).join('')}</ul>` : ''}
      </section>
    `;
  }

  renderFlashcards(module) {
    const cards = this.flashcardsForModule(module);
    const currentIndex = Math.min(this.progress.flashcardIndex[module.id] || 0, cards.length - 1);
    const card = cards[currentIndex] || cards[0];
    const status = this.progress.flashcardStatus[card.id] || 'new';
    return `
      <article class="lesson-card flashcard-card">
        <span>Flashcards</span>
        <div class="flashcard ${this.flashcardFlipped ? 'flipped' : ''}">
          <small>Card ${currentIndex + 1} of ${cards.length} - ${escapeHtml(status)}</small>
          <strong>${escapeHtml(this.flashcardFlipped ? card.back : card.front)}</strong>
        </div>
        <div class="flashcard-actions">
          <button type="button" data-flashcard-action="flip">${this.flashcardFlipped ? 'Show front' : 'Flip card'}</button>
          <button type="button" data-flashcard-action="next">Next card</button>
          <button type="button" data-flashcard-action="known">I know this</button>
          <button type="button" data-flashcard-action="review">Review again</button>
        </div>
      </article>
    `;
  }

  flashcardsForModule(module) {
    const ideaCards = module.keyIdeas.slice(0, 4).map((idea, index) => ({
      id: `${module.id}-idea-${index}`,
      front: `Key idea ${index + 1}: what should you remember?`,
      back: idea
    }));
    const glossaryCards = module.glossaryTerms.slice(0, 4).map((term) => {
      const entry = glossaryEntry(term);
      return {
        id: `${module.id}-glossary-${term}`,
        front: `Define: ${term}`,
        back: entry?.definition ?? `Review the EBSD meaning of ${term}.`
      };
    });
    return [
      ...ideaCards,
      ...glossaryCards,
      { id: `${module.id}-misconception`, front: 'What misconception should you avoid?', back: module.misconception }
    ];
  }

  renderMapLab() {
    const mode = mapModes[this.progress.selectedMapMode] ?? mapModes.ipf;
    const region = mapRegions[this.progress.selectedMapRegion] ?? mapRegions['grain-a'];
    return `
      <article class="lesson-card map-interpreter wide-card">
        <span>Interactive map interpretation lab</span>
        <div class="map-mode-buttons">
          ${Object.entries(mapModes).map(([id, item]) => `<button type="button" class="${this.progress.selectedMapMode === id ? 'active' : ''}" data-map-mode="${id}">${escapeHtml(item.label)}</button>`).join('')}
        </div>
        <div class="map-lab-layout">
          <div class="synthetic-map ${escapeHtml(this.progress.selectedMapMode)}" aria-label="Synthetic EBSD map">
            ${Object.keys(mapRegions).map((id) => `<button type="button" class="map-region ${id} ${this.progress.selectedMapRegion === id ? 'active' : ''}" data-map-region="${id}"><span>${escapeHtml(mapRegions[id].label)}</span></button>`).join('')}
          </div>
          <div class="map-reading">
            <strong>${escapeHtml(mode.label)}</strong>
            <p><b>Meaning:</b> ${escapeHtml(mode.meaning)}</p>
            <p><b>Inspect:</b> ${escapeHtml(mode.observe)}</p>
            <p><b>Common mistake:</b> ${escapeHtml(mode.mistake)}</p>
            <p><b>Diagnostic question:</b> ${escapeHtml(mode.question)}</p>
            <hr />
            <p><b>Clicked region:</b> ${escapeHtml(region.label)}</p>
            <p>Orientation cue: ${escapeHtml(region.orientation)} | Quality cue: ${region.quality}/100 | Confidence-like cue: ${region.confidence}/100 | ${escapeHtml(region.indexed)}</p>
            <p>${escapeHtml(region.text)}</p>
          </div>
        </div>
      </article>
    `;
  }

  renderTroubleshootingTool(module) {
    const selected = diagnosticCases[this.progress.diagnosticSymptom] ?? diagnosticCases['saturated-pattern'];
    return `
      <article class="lesson-card diagnostic-tool wide-card">
        <span>Diagnose EBSD problem</span>
        <div class="diagnostic-layout">
          <div class="symptom-list">
            ${Object.entries(diagnosticCases).map(([id, item]) => `<button type="button" class="${this.progress.diagnosticSymptom === id ? 'active' : ''}" data-diagnostic-symptom="${id}">${escapeHtml(item.symptom)}</button>`).join('')}
          </div>
          <div class="diagnostic-result">
            <strong>${escapeHtml(selected.symptom)}</strong>
            <p><b>Possible causes to check:</b></p>
            <ol>${listItems(selected.causes)}</ol>
            <p><b>First check:</b> ${escapeHtml(selected.firstFix)}</p>
            <p><b>Expected conceptual improvement:</b> ${escapeHtml(selected.expected)}</p>
            <p><b>Common wrong fix:</b> ${escapeHtml(selected.warning)}</p>
            <button type="button" data-experiment="${escapeHtml(selected.preset)}">Open relevant simulator preset</button>
            <div class="diagnostic-followup">
              <button type="button" data-diagnostic-followup="Improvement observed. Ask students which metric changed first.">I observed improvement</button>
              <button type="button" data-diagnostic-followup="No improvement. Try the next possible cause and compare quality plus confidence-like cues.">No improvement</button>
            </div>
            <p>${escapeHtml(this.progress.diagnosticFollowup)}</p>
          </div>
        </div>
        <details>
          <summary>Full troubleshooting reference</summary>
          ${module.troubleshootingCards.map((card) => `
            <p><b>${escapeHtml(card.problem)}:</b> ${escapeHtml(card.symptom)} Fix: ${escapeHtml(card.fix)}</p>
          `).join('')}
        </details>
      </article>
    `;
  }

  bindLessonEvents(module) {
    this.lessonWorkspace.querySelectorAll('[data-course-action]').forEach((button) => {
      button.addEventListener('click', () => {
        const action = button.dataset.courseAction;
        if (action === 'previous') this.moveModule(-1);
        if (action === 'next') this.moveModule(1);
        if (action === 'continue') this.continueCourse();
        if (action === 'weak') {
          this.progress.weakReviewOpen = true;
          this.save();
          this.renderLesson();
        }
        if (action === 'close-weak') {
          this.progress.weakReviewOpen = false;
          this.save();
          this.renderLesson();
        }
      });
    });

    this.lessonWorkspace.querySelector('#markModuleComplete')?.addEventListener('click', () => {
      if (!this.progress.completedModules.includes(module.id)) this.progress.completedModules.push(module.id);
      this.progress.inProgressModules = this.progress.inProgressModules.filter((id) => id !== module.id);
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelector('#bookmarkModule')?.addEventListener('click', () => {
      const isBookmarked = this.progress.bookmarks.includes(module.id);
      this.progress.bookmarks = isBookmarked
        ? this.progress.bookmarks.filter((id) => id !== module.id)
        : [...this.progress.bookmarks, module.id];
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelector('#saveModuleNote')?.addEventListener('click', () => {
      this.progress.notes[module.id] = this.lessonWorkspace.querySelector('#moduleNotes').value;
      this.save();
      this.renderModuleList();
    });
    this.lessonWorkspace.querySelector('#clearModuleNote')?.addEventListener('click', () => {
      delete this.progress.notes[module.id];
      this.save();
      this.render();
    });

    this.lessonWorkspace.querySelectorAll('[data-experiment]').forEach((button) => {
      button.addEventListener('click', () => {
        const activityId = button.dataset.activityId;
        if (activityId) this.saveActivityObservation(activityId);
        this.progress.demoReturn = { moduleId: module.id, mode: this.progress.selectedMode, activityId };
        this.save();
        this.onExperiment(button.dataset.experiment, {
          moduleId: module.id,
          activityId,
          instruction: this.activityList(module).find((activity) => activity.id === activityId)?.prediction ?? this.nextRecommendedAction(module)
        });
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-save-activity]').forEach((button) => {
      button.addEventListener('click', () => this.saveActivityObservation(button.dataset.saveActivity));
    });
    this.lessonWorkspace.querySelectorAll('[data-complete-activity]').forEach((button) => {
      button.addEventListener('click', () => {
        const activityId = button.dataset.completeActivity;
        this.saveActivityObservation(activityId);
        if (!this.progress.completedActivities.includes(activityId)) this.progress.completedActivities.push(activityId);
        this.save();
        this.renderLesson();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-learning-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.selectedMode = button.dataset.learningMode;
        this.save();
        this.renderLesson();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-glossary-term]').forEach((button) => {
      button.addEventListener('click', () => {
        this.glossaryQuery = button.dataset.glossaryTerm;
        this.renderGlossary();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-quiz-option]').forEach((button) => {
      button.addEventListener('click', () => this.answerQuiz(module, Number(button.dataset.quizOption)));
    });
    this.lessonWorkspace.querySelector('#nextQuizQuestion')?.addEventListener('click', () => {
      this.selectedQuestionIndex = (this.selectedQuestionIndex + 1) % module.quizQuestions.length;
      this.visibleHints.clear();
      this.visibleExplanations.clear();
      this.renderLesson();
    });
    this.lessonWorkspace.querySelector('#tryQuestionAgain')?.addEventListener('click', () => {
      const question = module.quizQuestions[this.selectedQuestionIndex];
      delete this.progress.quizAnswers[`${module.id}:${question.id}`];
      this.recalculateQuiz(module);
      this.save();
      this.renderLesson();
    });
    this.lessonWorkspace.querySelector('#showQuizHint')?.addEventListener('click', () => {
      const question = module.quizQuestions[this.selectedQuestionIndex];
      this.visibleHints.add(`${module.id}:${question.id}`);
      this.renderLesson();
    });
    this.lessonWorkspace.querySelector('#explainQuizAnswer')?.addEventListener('click', () => {
      const question = module.quizQuestions[this.selectedQuestionIndex];
      this.visibleExplanations.add(`${module.id}:${question.id}`);
      this.renderLesson();
    });

    this.lessonWorkspace.querySelectorAll('[data-flashcard-action]').forEach((button) => {
      button.addEventListener('click', () => this.handleFlashcard(module, button.dataset.flashcardAction));
    });

    this.lessonWorkspace.querySelectorAll('[data-map-mode]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.selectedMapMode = button.dataset.mapMode;
        this.save();
        this.renderLesson();
      });
    });
    this.lessonWorkspace.querySelectorAll('[data-map-region]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.selectedMapRegion = button.dataset.mapRegion;
        this.save();
        this.renderLesson();
      });
    });

    this.lessonWorkspace.querySelectorAll('[data-diagnostic-symptom]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.diagnosticSymptom = button.dataset.diagnosticSymptom;
        this.progress.diagnosticFollowup = '';
        this.save();
        this.renderLesson();
      });
    });
    this.lessonWorkspace.querySelectorAll('[data-diagnostic-followup]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.diagnosticFollowup = button.dataset.diagnosticFollowup;
        this.save();
        this.renderLesson();
      });
    });
  }

  saveActivityObservation(activityId) {
    const textarea = this.lessonWorkspace.querySelector(`[data-activity-observation="${CSS.escape(activityId)}"]`);
    if (textarea) {
      this.progress.activityObservations[activityId] = textarea.value;
      this.save();
    }
  }

  answerQuiz(module, selectedIndex) {
    const question = module.quizQuestions[this.selectedQuestionIndex];
    const answerKey = `${module.id}:${question.id}`;
    if (this.progress.quizAnswers[answerKey]) return;
    this.progress.quizAnswers[answerKey] = {
      selectedIndex,
      correct: selectedIndex === question.answerIndex
    };
    this.visibleExplanations.add(answerKey);
    this.recalculateQuiz(module);
    this.save();
    this.render();
  }

  recalculateQuiz(module) {
    const answers = module.quizQuestions.map((question) => ({
      question,
      answer: this.progress.quizAnswers[`${module.id}:${question.id}`]
    })).filter((item) => item.answer);
    const correct = answers.filter((item) => item.answer.correct).length;
    this.progress.quizScores[module.id] = { correct, total: answers.length };
    this.progress.quizMistakes[module.id] = answers
      .filter((item) => !item.answer.correct)
      .map((item) => ({
        question: item.question.question,
        selected: item.question.options[item.answer.selectedIndex],
        correct: item.question.options[item.question.answerIndex],
        conceptTag: item.question.conceptTag
      }));
  }

  handleFlashcard(module, action) {
    const cards = this.flashcardsForModule(module);
    const index = Math.min(this.progress.flashcardIndex[module.id] || 0, cards.length - 1);
    const card = cards[index];
    if (action === 'flip') this.flashcardFlipped = !this.flashcardFlipped;
    if (action === 'next') {
      this.progress.flashcardIndex[module.id] = (index + 1) % cards.length;
      this.flashcardFlipped = false;
    }
    if (action === 'known' || action === 'review') {
      this.progress.flashcardStatus[card.id] = action === 'known' ? 'known' : 'review again';
      this.progress.flashcardIndex[module.id] = (index + 1) % cards.length;
      this.flashcardFlipped = false;
    }
    this.save();
    this.renderLesson();
  }

  renderGlossary() {
    const query = this.glossaryQuery.toLowerCase();
    const terms = glossaryTerms.filter((entry) => {
      const matchesQuery = !query || entry.term.toLowerCase().includes(query) || entry.definition.toLowerCase().includes(query);
      const matchesCategory = this.glossaryCategory === 'all' || entry.category === this.glossaryCategory;
      return matchesQuery && matchesCategory;
    });
    const selected = terms[0] || glossaryTerms[0];
    this.miniGlossary.innerHTML = `
      <input id="glossarySearch" class="glossary-search" type="search" placeholder="Search glossary..." value="${escapeHtml(this.glossaryQuery)}" aria-label="Search glossary" />
      <select id="glossaryCategory" aria-label="Glossary category">
        ${glossaryCategories.map((category) => `<option value="${category}" ${category === this.glossaryCategory ? 'selected' : ''}>${category}</option>`).join('')}
      </select>
      <div class="glossary-layout">
        <div class="glossary-term-list">
          ${terms.map((entry) => `<button type="button" data-select-term="${escapeHtml(entry.term)}">${escapeHtml(entry.term)}</button>`).join('')}
        </div>
        <article class="selected-term">
          <strong>${escapeHtml(selected.term)}</strong>
          <p>${escapeHtml(selected.definition)}</p>
          <small>Related: ${selected.related.map(escapeHtml).join(', ')}</small>
          <small>Modules: ${selected.modules.map(escapeHtml).join(', ')}</small>
        </article>
      </div>
    `;

    this.miniGlossary.querySelector('#glossarySearch').addEventListener('input', (event) => {
      this.glossaryQuery = event.target.value;
      this.renderGlossary();
    });
    this.miniGlossary.querySelector('#glossaryCategory').addEventListener('change', (event) => {
      this.glossaryCategory = event.target.value;
      this.renderGlossary();
    });
    this.miniGlossary.querySelectorAll('[data-select-term]').forEach((button) => {
      button.addEventListener('click', () => {
        this.glossaryQuery = button.dataset.selectTerm;
        this.renderGlossary();
      });
    });
  }

  renderFormula() {
    this.formulaPanel.innerHTML = `
      <p class="formula-note">Conceptual learning tools, not calibrated EBSD software.</p>
      <div class="formula">${escapeHtml(formulaReference.bragg)}</div>
      <div class="formula small">${escapeHtml(formulaReference.wavelength)}</div>
      <div class="formula-explorer">
        <label><span>Voltage <output id="formulaVoltageValue">20 kV</output></span><input id="formulaVoltage" type="range" min="5" max="30" step="1" value="20" /></label>
        <label><span>d-spacing <output id="formulaSpacingValue">0.120 nm</output></span><input id="formulaSpacing" type="range" min="0.06" max="0.30" step="0.005" value="0.120" /></label>
        <label><span>Order n <output id="formulaOrderValue">1</output></span><input id="formulaOrder" type="range" min="1" max="3" step="1" value="1" /></label>
        <div class="trend-bars">
          <div><span>Voltage up, wavelength down</span><b id="voltageTrend"></b></div>
          <div><span>d-spacing down, theta up</span><b id="spacingTrend"></b></div>
        </div>
        <div class="formula-result" id="formulaResult"></div>
      </div>
      <ul>${listItems(formulaReference.constants)}</ul>
      <p>${escapeHtml(formulaReference.notes)}</p>
    `;
    this.bindFormulaExplorer();
  }

  bindFormulaExplorer() {
    const voltage = this.formulaPanel.querySelector('#formulaVoltage');
    const spacing = this.formulaPanel.querySelector('#formulaSpacing');
    const order = this.formulaPanel.querySelector('#formulaOrder');
    const update = () => {
      const voltageKv = Number(voltage.value);
      const dNm = Number(spacing.value);
      const n = Number(order.value);
      const wavelengthPm = electronWavelengthPm(voltageKv);
      const wavelengthNm = wavelengthPm * 0.001;
      const ratio = Math.min(0.999999, (n * wavelengthNm) / (2 * dNm));
      const thetaDeg = Math.asin(ratio) * 180 / Math.PI;
      const conceptualBandWidth = thetaDeg * 2;
      this.formulaPanel.querySelector('#formulaVoltageValue').textContent = `${voltageKv} kV`;
      this.formulaPanel.querySelector('#formulaSpacingValue').textContent = `${dNm.toFixed(3)} nm`;
      this.formulaPanel.querySelector('#formulaOrderValue').textContent = `${n}`;
      this.formulaPanel.querySelector('#voltageTrend').style.width = `${Math.round(((30 - voltageKv) / 25) * 100)}%`;
      this.formulaPanel.querySelector('#spacingTrend').style.width = `${Math.round(((0.30 - dNm) / 0.24) * 100)}%`;
      this.formulaPanel.querySelector('#formulaResult').innerHTML = `
        <b>${wavelengthPm.toFixed(2)} pm (${wavelengthNm.toFixed(4)} nm)</b>
        <span>electron wavelength</span>
        <b>${thetaDeg.toFixed(2)}°</b>
        <span>Bragg angle theta</span>
        <b>${conceptualBandWidth.toFixed(2)}°</b>
        <span>conceptual band-width idea</span>
        <p>Higher accelerating voltage gives shorter electron wavelength, but kV choice is a trade-off. Lower kV may improve surface sensitivity or spatial locality in some conditions.</p>
      `;
    };
    [voltage, spacing, order].forEach((input) => input.addEventListener('input', update));
    update();
  }

}
