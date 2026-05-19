import { kikuchiPatterns } from './data/kikuchiPatterns.js';
import { patternLibrary } from './patternLibrary.js';

const STORAGE_KEY = 'ebsdLearningStudio.indexingPhase2.v1';

const bands = [
  { x0: 0.04, y0: 0.28, x1: 0.96, y1: 0.66, width: 30, color: '#62d7f0', hkl: '(111)' },
  { x0: 0.14, y0: 0.84, x1: 0.86, y1: 0.08, width: 24, color: '#92d46f', hkl: '(200)' },
  { x0: 0.50, y0: 0.02, x1: 0.56, y1: 0.98, width: 22, color: '#e6b55a', hkl: '(220)' },
  { x0: 0.02, y0: 0.54, x1: 0.98, y1: 0.48, width: 18, color: '#e784ba', hkl: '(311)' }
];

const walkthroughSteps = [
  {
    title: 'Raw EBSD pattern',
    tag: 'Conceptual',
    notice: 'The pattern contains several Kikuchi bands on top of background intensity and noise.',
    matters: 'Real indexing starts with image evidence. A visually bright pattern is not automatically a useful pattern.',
    caption: 'Kikuchi bands are formed by diffraction from many lattice-plane families.'
  },
  {
    title: 'Background correction',
    tag: 'Schematic',
    notice: 'The smooth background is reduced so bands become easier to distinguish.',
    matters: 'Background correction improves band visibility, but over-correction can distort weak bands or create artefacts.',
    caption: 'Before/after contrast is shown schematically, not as a calibrated correction algorithm.'
  },
  {
    title: 'Band detection',
    tag: 'Hough-style conceptual detection',
    notice: 'Band guides appear one by one to show how line-like features can be selected.',
    matters: 'This is not a real Hough implementation. It shows why Hough-style voting is useful for finding band centerlines.',
    caption: 'Detected bands are highlighted as educational overlays.'
  },
  {
    title: 'Band position measurement',
    tag: 'Simplified measurement',
    notice: 'Each conceptual band guide has a centerline, width, and angular relationship to other bands.',
    matters: 'EBSD indexing uses band geometry, not just brightness. Geometry is what connects a pattern to crystal planes.',
    caption: 'Band centerline, width, and angles are conceptual measurements here.'
  },
  {
    title: 'Candidate phase/orientation matching',
    tag: 'Simplified scoring',
    notice: 'Candidate orientations compete based on how well their theoretical band geometry matches the detected bands.',
    matters: 'Wrong phase choice or pseudosymmetry can produce plausible but incorrect solutions.',
    caption: 'Scores are schematic decision-strength values, not real solver output.'
  },
  {
    title: 'Best schematic match and confidence',
    tag: 'Not a real indexing engine',
    notice: 'The strongest schematic candidate is highlighted, but confidence is a simplified score, not proof of truth.',
    matters: 'Multiple candidates can be close. Fit, confidence, phase knowledge, and pattern quality should be interpreted together.',
    caption: 'The selected orientation is educational, not measured.'
  },
  {
    title: 'Failure modes',
    tag: 'Failure-mode review',
    notice: 'Too few bands, poor pattern center, wrong phase, overlap, deformation, noise, and pseudosymmetry can all reduce confidence.',
    matters: 'Good-looking maps can still be wrong when the pattern evidence or calibration model is weak.',
    caption: 'Failure labels show why indexing can fail or return low confidence.'
  }
];

const candidateScores = [
  { name: 'Candidate orientation A', phase: 'FCC-like phase', score: 92, note: 'Band angles and centerlines align best.' },
  { name: 'Candidate orientation B', phase: 'FCC-like phase', score: 67, note: 'Several bands align, but one major band is displaced.' },
  { name: 'Candidate orientation C', phase: 'BCC-like phase', score: 41, note: 'Similar-looking features exist, but the angular relationships are poor.' }
];

const matchingScenarios = [
  {
    id: 'clear',
    title: 'Clear pattern, correct phase',
    prompt: 'Which candidate best matches the detected band geometry?',
    difficulty: 'Clear pattern',
    correct: 'a',
    notes: 'Candidate A aligns with all major detected centerlines and has the strongest angular consistency.',
    misleading: 'Brightness alone can distract you; the important evidence is band geometry.',
    noise: 0.08,
    candidates: [
      { id: 'a', label: 'A: FCC orientation 1', score: 94, offset: 0 },
      { id: 'b', label: 'B: FCC orientation 2', score: 66, offset: 0.08 },
      { id: 'c', label: 'C: BCC candidate', score: 38, offset: -0.13 }
    ]
  },
  {
    id: 'noisy',
    title: 'Noisy pattern',
    prompt: 'Noise hides weaker bands. Which candidate still fits the reliable bands best?',
    difficulty: 'Low signal-to-noise',
    correct: 'b',
    notes: 'Candidate B fits the strongest reliable bands. Candidate A overfits noisy features.',
    misleading: 'False band candidates can appear when detection thresholds are too aggressive.',
    noise: 0.35,
    candidates: [
      { id: 'a', label: 'A: Overfit noisy peaks', score: 58, offset: -0.1 },
      { id: 'b', label: 'B: Robust orientation', score: 78, offset: 0.02 },
      { id: 'c', label: 'C: Weak geometry match', score: 44, offset: 0.16 }
    ]
  },
  {
    id: 'wrong-phase',
    title: 'Wrong phase selected',
    prompt: 'The selected phase model is wrong. Which answer is most scientifically honest?',
    difficulty: 'Phase selection',
    correct: 'c',
    notes: 'The best action is to question the phase model. A forced orientation can look tidy and still be wrong.',
    misleading: 'A confident-looking overlay is not evidence if the candidate phase list is wrong.',
    noise: 0.16,
    candidates: [
      { id: 'a', label: 'A: Force candidate A', score: 52, offset: 0.12 },
      { id: 'b', label: 'B: Force candidate B', score: 49, offset: -0.08 },
      { id: 'c', label: 'C: Revisit phase choice', score: 86, offset: 0 }
    ]
  },
  {
    id: 'competing',
    title: 'Similar competing candidates',
    prompt: 'Two candidates are close. Which response is best?',
    difficulty: 'Pseudosymmetry / similar structures',
    correct: 'b',
    notes: 'Candidate B is slightly better, but the close scores mean you should inspect confidence, fit, phase knowledge, and neighboring pixels.',
    misleading: 'Small score differences can be misleading in pseudosymmetric or similar crystal structures.',
    noise: 0.18,
    candidates: [
      { id: 'a', label: 'A: Similar solution', score: 82, offset: 0.04 },
      { id: 'b', label: 'B: Best match, inspect carefully', score: 88, offset: 0.01 },
      { id: 'c', label: 'C: Different phase family', score: 55, offset: -0.18 }
    ]
  }
];

const failureModes = [
  ['Too few visible bands', 'Band detection cannot constrain orientation well.'],
  ['Poor pattern center', 'Projected theoretical bands shift away from observed band guides.'],
  ['Wrong phase selected', 'A real solver would compare the pattern to the wrong crystal geometry.'],
  ['Overlapping phases', 'Signals from multiple crystals or phases can confuse band evidence.'],
  ['Poor polishing / deformation', 'Damaged surfaces broaden or weaken Kikuchi bands.'],
  ['Low signal-to-noise', 'Noise can hide real bands and create false candidates.'],
  ['Pseudosymmetry', 'Similar structures can produce competing plausible solutions.']
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveProgress(progress) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
}

function defaultCalibrationEvidence() {
  return {
    movedAwayFromDefault: false,
    observedDegradedConfidence: false,
    restoredNearCorrect: false,
    resetAfterDegraded: false
  };
}

function calibrationIsComplete(evidence) {
  return Boolean(
    evidence?.movedAwayFromDefault
    && evidence?.observedDegradedConfidence
    && (evidence?.restoredNearCorrect || evidence?.resetAfterDegraded)
  );
}

function lineEndpoint(band, width, height, offset = 0) {
  return {
    x0: band.x0 * width,
    y0: (band.y0 + offset) * height,
    x1: band.x1 * width,
    y1: (band.y1 + offset) * height
  };
}

function drawBand(ctx, band, width, height, options = {}) {
  const { offset = 0, alpha = 0.75, centerline = true, widthScale = 1, color = band.color } = options;
  const p = lineEndpoint(band, width, height, offset);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * 0.26;
  ctx.lineWidth = Math.max(8, band.width * widthScale);
  ctx.beginPath();
  ctx.moveTo(p.x0, p.y0);
  ctx.lineTo(p.x1, p.y1);
  ctx.stroke();
  if (centerline) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x0, p.y0);
    ctx.lineTo(p.x1, p.y1);
    ctx.stroke();
  }
  ctx.restore();
}

function drawBandInRect(ctx, band, rect, options = {}) {
  const { offset = 0, alpha = 0.75, centerline = true, widthScale = 1, color = band.color } = options;
  const p = {
    x0: rect.x + band.x0 * rect.width,
    y0: rect.y + (band.y0 + offset) * rect.height,
    x1: rect.x + band.x1 * rect.width,
    y1: rect.y + (band.y1 + offset) * rect.height
  };
  ctx.save();
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha * 0.26;
  ctx.lineWidth = Math.max(8, (band.width || 20) * widthScale);
  ctx.beginPath();
  ctx.moveTo(p.x0, p.y0);
  ctx.lineTo(p.x1, p.y1);
  ctx.stroke();
  if (centerline) {
    ctx.globalAlpha = alpha;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x0, p.y0);
    ctx.lineTo(p.x1, p.y1);
    ctx.stroke();
  }
  ctx.restore();
}

function imageContainRect(image, width, height) {
  const imageAspect = image.naturalWidth / image.naturalHeight;
  const canvasAspect = width / height;
  if (imageAspect > canvasAspect) {
    const drawWidth = width;
    const drawHeight = width / imageAspect;
    return { x: 0, y: (height - drawHeight) / 2, width: drawWidth, height: drawHeight };
  }
  const drawHeight = height;
  const drawWidth = height * imageAspect;
  return { x: (width - drawWidth) / 2, y: 0, width: drawWidth, height: drawHeight };
}

function drawPatternBase(ctx, width, height, noise = 0.16, corrected = false) {
  const gradient = ctx.createRadialGradient(width * 0.48, height * 0.48, 10, width * 0.52, height * 0.52, width * 0.62);
  gradient.addColorStop(0, corrected ? '#31383a' : '#3f4240');
  gradient.addColorStop(0.5, corrected ? '#171d20' : '#202628');
  gradient.addColorStop(1, '#07090b');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  ctx.save();
  ctx.globalAlpha = corrected ? 0.07 : 0.16;
  ctx.fillStyle = '#ffffff';
  const count = Math.round(220 * noise);
  for (let i = 0; i < count; i += 1) {
    const x = (Math.sin(i * 37.1) * 0.5 + 0.5) * width;
    const y = (Math.sin(i * 71.7 + 2) * 0.5 + 0.5) * height;
    ctx.fillRect(x, y, 1.4, 1.4);
  }
  ctx.restore();
}

function drawCrosshair(ctx, x, y, label = 'pattern center') {
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 231, 177, 0.95)';
  ctx.lineWidth = 1.8;
  ctx.setLineDash([5, 5]);
  ctx.beginPath();
  ctx.moveTo(x - 34, y);
  ctx.lineTo(x + 34, y);
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x, y + 34);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#ffe7b1';
  ctx.font = '700 12px Segoe UI, Arial';
  ctx.fillText(label, x + 8, y - 10);
  ctx.restore();
}

export class IndexingStudio {
  constructor({ root, getReduceMotion = () => false }) {
    this.root = root;
    this.getReduceMotion = getReduceMotion;
    this.step = 0;
    this.playing = false;
    this.showBands = true;
    this.pc = { x: 0.5, y: 0.5, scale: 1, noise: false };
    this.practiceIndex = 0;
    this.reviewIndex = 0;
    this.reviewOverlay = 'none';
    this.progress = {
      completedSteps: [],
      checkpoints: {},
      matchingAnswers: {},
      calibrationComplete: false,
      calibrationEvidence: defaultCalibrationEvidence(),
      ...loadProgress()
    };
    this.progress.calibrationEvidence = {
      ...defaultCalibrationEvidence(),
      ...(this.progress.calibrationEvidence || {})
    };
    this.progress.calibrationComplete = calibrationIsComplete(this.progress.calibrationEvidence);
    this.timer = null;
    this.realPatterns = [];
    this.render();
    patternLibrary.preload().then((patterns) => {
      this.realPatterns = patterns;
      this.renderRealPatternReview();
      this.drawRealPatternReview();
    });
  }

  render() {
    this.root.innerHTML = `
      <section class="indexing-lab-grid" aria-label="Interactive indexing understanding tools">
        <article class="indexing-lab-card walkthrough-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Not a real indexing engine</span>
            <h3>Animated Indexing Walkthrough</h3>
            <p>Step through a conceptual path from pattern evidence to a candidate orientation.</p>
          </div>
          <div class="walkthrough-stage">
            <canvas id="indexingWalkthroughCanvas" width="760" height="420" aria-label="Conceptual indexing walkthrough canvas"></canvas>
            <div class="walkthrough-side">
              <span id="walkthroughTag" class="fidelity-label">Conceptual</span>
              <h4 id="walkthroughTitle"></h4>
              <p id="walkthroughCaption"></p>
              <div class="candidate-score-table" id="walkthroughCandidates"></div>
            </div>
          </div>
          <div class="walkthrough-controls" role="group" aria-label="Indexing walkthrough controls">
            <button id="indexingPlayPause" type="button">Play</button>
            <button id="indexingPrevStep" type="button">Previous step</button>
            <button id="indexingNextStep" type="button">Next step</button>
            <button id="indexingResetStep" type="button">Reset</button>
            <label class="compact-check"><input id="indexingBandOverlayToggle" type="checkbox" checked /> Band overlays</label>
          </div>
          <div class="indexing-progress-row">
            <span id="indexingStepIndicator"></span>
            <div class="progress-track" aria-hidden="true"><b id="indexingStepProgress"></b></div>
          </div>
          <div class="indexing-explain-grid">
            <section><strong>What should I notice?</strong><p id="indexingNotice"></p></section>
            <section><strong>Why this matters in real EBSD</strong><p id="indexingMatters"></p></section>
          </div>
        </article>

        <article class="indexing-lab-card calibration-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Conceptual calibration exercise</span>
            <h3>Pattern Center / Calibration</h3>
            <p>Move the pattern center and detector scale to see why calibration affects band matching confidence.</p>
          </div>
          <div class="calibration-layout">
            <canvas id="patternCenterCanvas" width="620" height="420" aria-label="Conceptual pattern center exercise canvas"></canvas>
            <div class="calibration-controls">
              <label class="slider-row"><span>PCx <output id="pcxValue">0.50</output></span><input id="pcxControl" type="range" min="0.35" max="0.65" step="0.01" value="0.50" aria-label="Pattern center x"></label>
              <label class="slider-row"><span>PCy <output id="pcyValue">0.50</output></span><input id="pcyControl" type="range" min="0.35" max="0.65" step="0.01" value="0.50" aria-label="Pattern center y"></label>
              <label class="slider-row"><span>Detector scale <output id="pcScaleValue">1.00x</output></span><input id="pcScaleControl" type="range" min="0.82" max="1.18" step="0.01" value="1.00" aria-label="Detector distance or scale"></label>
              <label class="compact-check"><input id="pcNoiseToggle" type="checkbox" /> Add noise / poor calibration</label>
              <button id="pcResetButton" type="button">Reset to correct pattern center</button>
              <div class="confidence-meter" role="status" aria-live="polite" aria-label="Conceptual confidence meter"><b id="pcConfidenceBar"></b><span id="pcConfidenceText">High confidence</span></div>
              <p id="pcCalibrationStatus" class="calibration-status" aria-live="polite"></p>
            </div>
          </div>
          <p class="lab-note">Not a real pattern-center refinement engine. Calibration standards or known phases are useful because they anchor the projection geometry used during matching.</p>
        </article>

        <article class="indexing-lab-card matching-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Simplified scoring</span>
            <h3>Band Matching Practice</h3>
            <p>Choose the candidate that best explains the detected band geometry. Feedback is saved locally for review.</p>
          </div>
          <div class="matching-layout">
            <canvas id="bandMatchingCanvas" width="620" height="380" aria-label="Band matching practice pattern"></canvas>
            <div>
              <div class="scenario-tabs" id="matchingScenarioTabs"></div>
              <h4 id="matchingTitle"></h4>
              <p id="matchingPrompt"></p>
              <div id="matchingCandidates" class="matching-candidates"></div>
              <p id="matchingFeedback" class="checkpoint-feedback" aria-live="polite"></p>
            </div>
          </div>
        </article>

        <article class="indexing-lab-card real-review-card">
          <div class="lab-card-heading">
          <span class="fidelity-label">Reference images only</span>
          <h3>Reference Kikuchi Pattern Review</h3>
          <p>Inspect separate Si/NIST example images with optional conceptual overlays and quality notes.</p>
          <p class="lab-note">This review is not the Ni worked example below. Its overlays are learning guides only, not measured band detections.</p>
          </div>
          <div class="real-review-layout" id="realPatternReview"></div>
        </article>

        <article class="indexing-lab-card weak-review-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Local self-review</span>
            <h3>Indexing Weak-Area Review</h3>
            <p>Use this summary to decide which indexing ideas to revisit. It is stored in this browser only.</p>
          </div>
          <div id="indexingWeakReview"></div>
        </article>
      </section>
    `;
    this.bindEvents();
    this.updateAll();
  }

  bindEvents() {
    this.root.querySelector('#indexingPlayPause').setAttribute('aria-label', 'Play animated indexing walkthrough');
    this.root.querySelector('#indexingPlayPause').setAttribute('aria-pressed', 'false');
    this.root.querySelector('#indexingPlayPause').addEventListener('click', () => this.togglePlay());
    this.root.querySelector('#indexingPrevStep').addEventListener('click', () => this.setStep(this.step - 1));
    this.root.querySelector('#indexingNextStep').addEventListener('click', () => this.setStep(this.step + 1));
    this.root.querySelector('#indexingResetStep').addEventListener('click', () => {
      this.stop();
      this.setStep(0);
    });
    this.root.querySelector('#indexingBandOverlayToggle').addEventListener('change', (event) => {
      this.showBands = event.target.checked;
      this.drawWalkthrough();
    });

    ['pcxControl', 'pcyControl', 'pcScaleControl'].forEach((id) => {
      this.root.querySelector(`#${id}`).addEventListener('input', () => this.updateCalibrationFromControls());
    });
    this.root.querySelector('#pcNoiseToggle').addEventListener('change', (event) => {
      this.pc.noise = event.target.checked;
      this.updateCalibration();
    });
    this.root.querySelector('#pcResetButton').addEventListener('click', () => this.resetCalibration());
  }

  updateAll() {
    this.updateWalkthrough();
    this.updateCalibration();
    this.renderMatchingPractice();
    this.renderRealPatternReview();
    this.renderWeakReview();
  }

  setReduceMotion() {
    if (this.getReduceMotion()) this.stop();
  }

  markStepComplete(step = this.step) {
    if (!this.progress.completedSteps.includes(step)) {
      this.progress.completedSteps.push(step);
      this.save();
    }
  }

  recordCheckpoint(index, correct) {
    if (index < 0) return;
    this.progress.checkpoints[`indexing-step-${index}`] = Boolean(correct);
    this.save();
  }

  save() {
    saveProgress(this.progress);
    this.renderWeakReview();
  }

  togglePlay() {
    if (this.getReduceMotion()) {
      this.stop();
      this.setStep(this.step + 1);
      return;
    }
    this.playing ? this.stop() : this.play();
  }

  play() {
    this.playing = true;
    const button = this.root.querySelector('#indexingPlayPause');
    button.textContent = 'Pause';
    button.setAttribute('aria-label', 'Pause animated indexing walkthrough');
    button.setAttribute('aria-pressed', 'true');
    this.timer = window.setInterval(() => this.setStep(this.step + 1), 2400);
  }

  stop() {
    this.playing = false;
    const button = this.root.querySelector('#indexingPlayPause');
    button?.replaceChildren(document.createTextNode('Play'));
    button?.setAttribute('aria-label', 'Play animated indexing walkthrough');
    button?.setAttribute('aria-pressed', 'false');
    if (this.timer) window.clearInterval(this.timer);
    this.timer = null;
  }

  setStep(value) {
    this.step = (value + walkthroughSteps.length) % walkthroughSteps.length;
    this.markStepComplete(this.step);
    this.updateWalkthrough();
  }

  updateWalkthrough() {
    const step = walkthroughSteps[this.step];
    this.root.querySelector('#walkthroughTag').textContent = step.tag;
    this.root.querySelector('#walkthroughTitle').textContent = step.title;
    this.root.querySelector('#walkthroughCaption').textContent = step.caption;
    this.root.querySelector('#indexingNotice').textContent = step.notice;
    this.root.querySelector('#indexingMatters').textContent = step.matters;
    this.root.querySelector('#indexingStepIndicator').textContent = `Step ${this.step + 1} of ${walkthroughSteps.length}`;
    this.root.querySelector('#indexingStepProgress').style.width = `${((this.step + 1) / walkthroughSteps.length) * 100}%`;
    this.root.querySelector('#walkthroughCandidates').innerHTML = this.step >= 4
      ? candidateScores.map((candidate, index) => `
        <div class="${this.step >= 5 && index === 0 ? 'selected' : ''}">
          <strong>${candidate.name}</strong>
          <span>${candidate.phase}</span>
          <b style="width:${candidate.score}%"></b>
          <small>${candidate.score}% schematic score - ${candidate.note}</small>
        </div>
      `).join('')
      : '';
    this.drawWalkthrough();
  }

  drawWalkthrough() {
    const canvas = this.root.querySelector('#indexingWalkthroughCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    drawPatternBase(ctx, w, h, this.step === 6 ? 0.38 : 0.18, this.step >= 1);
    if (this.step === 1) {
      ctx.save();
      ctx.fillStyle = 'rgba(255,255,255,0.09)';
      ctx.fillRect(w / 2, 0, w / 2, h);
      ctx.fillStyle = '#dff8d3';
      ctx.font = '700 13px Segoe UI, Arial';
      ctx.fillText('After correction', w * 0.58, 28);
      ctx.fillStyle = '#a9b9bd';
      ctx.fillText('Raw background', 24, 28);
      ctx.restore();
    }

    if (this.showBands) {
      const visibleCount = this.step < 2 ? bands.length : this.step === 2 ? 2 + (this.progress.completedSteps.length % 3) : bands.length;
      bands.slice(0, visibleCount).forEach((band, index) => {
        const emphasize = this.step === 2 && index === visibleCount - 1;
        drawBand(ctx, band, w, h, {
          alpha: this.step === 0 ? 0.32 : emphasize ? 1 : 0.78,
          centerline: this.step >= 2,
          widthScale: this.step >= 3 ? 1.1 : 0.86
        });
      });
    }

    if (this.step >= 3) this.drawBandMeasurements(ctx, w, h);
    if (this.step >= 4) this.drawCandidateOverlay(ctx, w, h, this.step >= 5 ? 0 : 1);
    if (this.step === 6) this.drawFailureLabels(ctx, w, h);
  }

  drawBandMeasurements(ctx, w, h) {
    const band = bands[0];
    const p = lineEndpoint(band, w, h);
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 231, 177, 0.9)';
    ctx.fillStyle = '#ffe7b1';
    ctx.font = '700 12px Segoe UI, Arial';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(p.x0, p.y0 - 16);
    ctx.lineTo(p.x1, p.y1 - 16);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('centerline position', w * 0.12, h * 0.19);
    ctx.fillText('band width', w * 0.62, h * 0.69);
    ctx.fillText('angle relationships', w * 0.46, h * 0.18);
    ctx.restore();
  }

  drawCandidateOverlay(ctx, w, h, candidateOffsetIndex = 0) {
    const offsets = [0, 0.055, -0.12];
    const offset = offsets[candidateOffsetIndex] ?? 0;
    bands.forEach((band) => drawBand(ctx, band, w, h, {
      offset,
      color: candidateOffsetIndex === 0 ? '#ffffff' : '#ee6074',
      alpha: candidateOffsetIndex === 0 ? 0.72 : 0.42,
      centerline: true,
      widthScale: 0.45
    }));
  }

  drawFailureLabels(ctx, w, h) {
    ctx.save();
    ctx.fillStyle = 'rgba(7, 10, 12, 0.76)';
    ctx.strokeStyle = 'rgba(238, 96, 116, 0.45)';
    ctx.lineWidth = 1;
    failureModes.slice(0, 4).forEach(([title], index) => {
      const x = index % 2 ? w * 0.57 : w * 0.06;
      const y = index < 2 ? h * 0.1 : h * 0.78;
      ctx.fillRect(x, y, w * 0.36, 34);
      ctx.strokeRect(x, y, w * 0.36, 34);
      ctx.fillStyle = '#ffd0d7';
      ctx.font = '700 12px Segoe UI, Arial';
      ctx.fillText(title, x + 10, y + 22);
      ctx.fillStyle = 'rgba(7, 10, 12, 0.76)';
    });
    ctx.restore();
  }

  updateCalibrationFromControls() {
    this.pc.x = Number(this.root.querySelector('#pcxControl').value);
    this.pc.y = Number(this.root.querySelector('#pcyControl').value);
    this.pc.scale = Number(this.root.querySelector('#pcScaleControl').value);
    this.updateCalibration();
  }

  resetCalibration() {
    const confidenceBeforeReset = this.calibrationConfidence();
    if (this.calibrationMovedAway() && confidenceBeforeReset <= 75) {
      this.progress.calibrationEvidence.movedAwayFromDefault = true;
      this.progress.calibrationEvidence.observedDegradedConfidence = true;
    }
    if (this.progress.calibrationEvidence.observedDegradedConfidence) {
      this.progress.calibrationEvidence.resetAfterDegraded = true;
    }
    this.pc = { x: 0.5, y: 0.5, scale: 1, noise: false };
    this.root.querySelector('#pcxControl').value = this.pc.x;
    this.root.querySelector('#pcyControl').value = this.pc.y;
    this.root.querySelector('#pcScaleControl').value = this.pc.scale;
    this.root.querySelector('#pcNoiseToggle').checked = false;
    this.progress.calibrationComplete = calibrationIsComplete(this.progress.calibrationEvidence);
    this.save();
    this.updateCalibration();
  }

  calibrationError() {
    return Math.hypot(this.pc.x - 0.5, this.pc.y - 0.5) * 3.4 + Math.abs(this.pc.scale - 1) * 1.8 + (this.pc.noise ? 0.16 : 0);
  }

  calibrationConfidence() {
    return clamp(Math.round((1 - this.calibrationError()) * 100), 8, 98);
  }

  calibrationMovedAway() {
    return Math.abs(this.pc.x - 0.5) > 0.04 || Math.abs(this.pc.y - 0.5) > 0.04 || Math.abs(this.pc.scale - 1) > 0.05;
  }

  calibrationNearCorrect(confidence) {
    return confidence >= 86
      && Math.abs(this.pc.x - 0.5) <= 0.02
      && Math.abs(this.pc.y - 0.5) <= 0.02
      && Math.abs(this.pc.scale - 1) <= 0.03;
  }

  updateCalibration() {
    this.root.querySelector('#pcxValue').textContent = this.pc.x.toFixed(2);
    this.root.querySelector('#pcyValue').textContent = this.pc.y.toFixed(2);
    this.root.querySelector('#pcScaleValue').textContent = `${this.pc.scale.toFixed(2)}x`;
    this.drawCalibration();
    const confidence = this.calibrationConfidence();
    const label = confidence > 78 ? 'High confidence' : confidence > 46 ? 'Medium confidence' : 'Low confidence';
    this.root.querySelector('#pcConfidenceBar').style.width = `${confidence}%`;
    this.root.querySelector('#pcConfidenceText').textContent = `${label} (${confidence}%)`;
    if (this.calibrationMovedAway()) {
      this.progress.calibrationEvidence.movedAwayFromDefault = true;
    }
    if (this.progress.calibrationEvidence.movedAwayFromDefault && confidence <= 75) {
      this.progress.calibrationEvidence.observedDegradedConfidence = true;
    }
    if (this.progress.calibrationEvidence.observedDegradedConfidence && this.calibrationNearCorrect(confidence)) {
      this.progress.calibrationEvidence.restoredNearCorrect = true;
    }
    const wasComplete = this.progress.calibrationComplete;
    this.progress.calibrationComplete = calibrationIsComplete(this.progress.calibrationEvidence);
    this.updateCalibrationStatus(confidence);
    if (wasComplete !== this.progress.calibrationComplete || this.progress.calibrationEvidence.movedAwayFromDefault) {
      this.save();
    }
  }

  updateCalibrationStatus(confidence) {
    const status = this.root.querySelector('#pcCalibrationStatus');
    if (!status) return;
    if (this.progress.calibrationComplete) {
      status.textContent = 'Calibration review complete: you degraded the schematic pattern center and then restored or reset to a high-confidence condition.';
      return;
    }
    if (!this.progress.calibrationEvidence.movedAwayFromDefault) {
      status.textContent = 'Move PCx, PCy, or detector scale far enough to see the confidence drop.';
      return;
    }
    if (!this.progress.calibrationEvidence.observedDegradedConfidence) {
      status.textContent = `Keep adjusting until the confidence clearly degrades; current simplified confidence is ${confidence}%.`;
      return;
    }
    status.textContent = 'Now restore near the correct pattern center, or use Reset after seeing the degraded confidence.';
  }

  drawCalibration() {
    const canvas = this.root.querySelector('#patternCenterCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    drawPatternBase(ctx, w, h, this.pc.noise ? 0.42 : 0.18, true);
    const dx = (this.pc.x - 0.5) * 0.34;
    const dy = (this.pc.y - 0.5) * 0.34;
    bands.forEach((band) => drawBand(ctx, band, w, h, { alpha: 0.42, centerline: true, color: '#62d7f0' }));
    bands.forEach((band) => {
      const shifted = { ...band, x0: 0.5 + (band.x0 - 0.5) * this.pc.scale + dx, x1: 0.5 + (band.x1 - 0.5) * this.pc.scale + dx };
      drawBand(ctx, shifted, w, h, { offset: dy, alpha: 0.82, centerline: true, color: '#ffe7b1', widthScale: 0.42 });
    });
    drawCrosshair(ctx, w * this.pc.x, h * this.pc.y);
    ctx.save();
    ctx.fillStyle = '#a9b9bd';
    ctx.font = '700 12px Segoe UI, Arial';
    ctx.fillText('cyan = detected bands', 18, h - 38);
    ctx.fillText('amber = projected model bands', 18, h - 18);
    ctx.restore();
  }

  renderMatchingPractice() {
    const scenario = matchingScenarios[this.practiceIndex];
    this.root.querySelector('#matchingScenarioTabs').innerHTML = matchingScenarios.map((item, index) => `
      <button type="button" class="${index === this.practiceIndex ? 'active' : ''}" data-scenario-index="${index}">${index + 1}</button>
    `).join('');
    this.root.querySelector('#matchingTitle').textContent = scenario.title;
    this.root.querySelector('#matchingPrompt').textContent = scenario.prompt;
    const selected = this.progress.matchingAnswers[scenario.id];
    this.root.querySelector('#matchingCandidates').innerHTML = scenario.candidates.map((candidate) => `
      <button type="button" class="${selected === candidate.id ? 'selected' : ''}" data-matching-answer="${candidate.id}">
        <strong>${candidate.label}</strong>
        <span>${candidate.score}% schematic match</span>
      </button>
    `).join('');
    this.root.querySelector('#matchingFeedback').textContent = selected
      ? this.feedbackForScenario(scenario, selected)
      : `${scenario.difficulty}: choose the best evidence-based response.`;
    this.root.querySelectorAll('[data-scenario-index]').forEach((button) => {
      button.addEventListener('click', () => {
        this.practiceIndex = Number(button.dataset.scenarioIndex);
        this.renderMatchingPractice();
      });
    });
    this.root.querySelectorAll('[data-matching-answer]').forEach((button) => {
      button.addEventListener('click', () => {
        this.progress.matchingAnswers[scenario.id] = button.dataset.matchingAnswer;
        this.save();
        this.renderMatchingPractice();
      });
    });
    this.drawMatchingScenario();
  }

  feedbackForScenario(scenario, answerId) {
    if (answerId === scenario.correct) return `Correct. ${scenario.notes}`;
    return `Not quite. ${scenario.misleading} Better answer: ${scenario.candidates.find((item) => item.id === scenario.correct)?.label}.`;
  }

  drawMatchingScenario() {
    const scenario = matchingScenarios[this.practiceIndex];
    const canvas = this.root.querySelector('#bandMatchingCanvas');
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    drawPatternBase(ctx, w, h, scenario.noise, true);
    bands.forEach((band, index) => {
      if (scenario.id === 'noisy' && index === 3) return;
      drawBand(ctx, band, w, h, { alpha: 0.7, color: '#62d7f0', centerline: true });
    });
    const selected = this.progress.matchingAnswers[scenario.id];
    const candidate = scenario.candidates.find((item) => item.id === selected);
    if (candidate) {
      bands.forEach((band) => drawBand(ctx, band, w, h, {
        offset: candidate.offset,
        color: selected === scenario.correct ? '#92d46f' : '#ee6074',
        alpha: 0.72,
        centerline: true,
        widthScale: 0.38
      }));
    }
  }

  renderRealPatternReview() {
    const container = this.root.querySelector('#realPatternReview');
    if (!container) return;
    const patterns = this.realPatterns.length ? this.realPatterns : kikuchiPatterns;
    const pattern = patterns[this.reviewIndex % patterns.length];
    container.innerHTML = `
      <div class="real-pattern-frame">
        <canvas id="realPatternReviewCanvas" width="640" height="420" aria-label="Real Kikuchi pattern review canvas"></canvas>
      </div>
      <div class="real-pattern-controls">
        <label class="select-row"><span>Pattern</span><select id="realPatternSelect" aria-label="Select real Kikuchi pattern">
          ${patterns.map((item, index) => `<option value="${index}" ${index === this.reviewIndex ? 'selected' : ''}>${item.label || item.id}</option>`).join('')}
        </select></label>
        <label class="select-row"><span>Overlay</span><select id="realPatternOverlay" aria-label="Real pattern overlay mode">
          <option value="none" ${this.reviewOverlay === 'none' ? 'selected' : ''}>No overlay</option>
          <option value="bands" ${this.reviewOverlay === 'bands' ? 'selected' : ''}>Conceptual band guide</option>
          <option value="quality" ${this.reviewOverlay === 'quality' ? 'selected' : ''}>Quality notes</option>
          <option value="difficulty" ${this.reviewOverlay === 'difficulty' ? 'selected' : ''}>Indexing difficulty notes</option>
        </select></label>
        <p><b>Source note:</b> ${pattern?.credit || 'No source note supplied yet.'}</p>
        <p><b>Pattern note:</b> ${pattern?.orientationLabel || 'Example pattern; orientation and phase are not confirmed in this app.'}</p>
        <p><b>Review note:</b> ${this.realPatterns.length ? 'This is a local example image with educational overlays only.' : 'No loaded image is available, so the studio is showing metadata and schematic fallback guidance.'}</p>
        <p class="lab-note">Overlay guides are conceptual and may not align with every real Kikuchi band in the image. The publication-quality Ni indexing audit is the dedicated DA Ni section below.</p>
      </div>
    `;
    container.querySelector('#realPatternSelect').addEventListener('change', (event) => {
      this.reviewIndex = Number(event.target.value);
      this.renderRealPatternReview();
      this.drawRealPatternReview();
    });
    container.querySelector('#realPatternOverlay').addEventListener('change', (event) => {
      this.reviewOverlay = event.target.value;
      this.drawRealPatternReview();
    });
  }

  drawRealPatternReview() {
    const canvas = this.root.querySelector('#realPatternReviewCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    const patterns = this.realPatterns.length ? this.realPatterns : kikuchiPatterns;
    const pattern = patterns[this.reviewIndex % patterns.length];
    ctx.clearRect(0, 0, w, h);
    let imageRect = { x: 0, y: 0, width: w, height: h };
    if (pattern?.image) {
      imageRect = imageContainRect(pattern.image, w, h);
      ctx.save();
      ctx.fillStyle = '#050708';
      ctx.fillRect(0, 0, w, h);
      ctx.filter = 'grayscale(100%) contrast(1.08)';
      ctx.drawImage(pattern.image, imageRect.x, imageRect.y, imageRect.width, imageRect.height);
      ctx.restore();
    } else {
      drawPatternBase(ctx, w, h, 0.2, true);
      bands.forEach((band) => drawBand(ctx, band, w, h, { alpha: 0.42 }));
    }
    if (this.reviewOverlay === 'bands') {
      (pattern?.bandCenters || bands).forEach((band) => {
        const normalized = { ...band, width: band.width || 20, color: band.color || '#ffe7b1' };
        drawBandInRect(ctx, normalized, imageRect, { alpha: 0.84, color: '#ffe7b1', widthScale: 0.45 });
      });
    }
    if (this.reviewOverlay === 'quality' || this.reviewOverlay === 'difficulty') {
      ctx.save();
      ctx.fillStyle = 'rgba(7, 10, 12, 0.78)';
      ctx.fillRect(18, 18, w - 36, 86);
      ctx.fillStyle = '#eef6f7';
      ctx.font = '700 15px Segoe UI, Arial';
      ctx.fillText(this.reviewOverlay === 'quality' ? 'Quality notes' : 'Indexing difficulty notes', 34, 45);
      ctx.fillStyle = '#a9b9bd';
      ctx.font = '13px Segoe UI, Arial';
      const text = this.reviewOverlay === 'quality'
        ? 'Inspect band sharpness, background, saturation, and noise before trusting confidence.'
        : 'Possible issues: weak bands, wrong phase, poor pattern center, overlap, or pseudosymmetry.';
      ctx.fillText(text, 34, 72);
      ctx.restore();
    }
  }

  renderWeakReview() {
    const container = this.root.querySelector('#indexingWeakReview');
    if (!container) return;
    const answered = Object.keys(this.progress.matchingAnswers).length;
    const correct = matchingScenarios.filter((scenario) => this.progress.matchingAnswers[scenario.id] === scenario.correct).length;
    const checkpointAnswers = Object.values(this.progress.checkpoints);
    const checkpointCorrect = checkpointAnswers.filter(Boolean).length;
    const weak = [];
    if (this.progress.completedSteps.length < walkthroughSteps.length || checkpointAnswers.includes(false)) weak.push('band detection');
    if (!this.progress.calibrationComplete) weak.push('pattern center');
    if ((this.progress.matchingAnswers['wrong-phase'] || '') !== 'c') weak.push('phase selection');
    if (answered && correct < answered) weak.push('confidence/fit');
    if (this.progress.completedSteps.length < 7) weak.push('failure modes');
    container.innerHTML = `
      <div class="weak-review-grid">
        <div><b>${this.progress.completedSteps.length}/${walkthroughSteps.length}</b><span>walkthrough steps visited</span></div>
        <div><b>${checkpointCorrect}/${checkpointAnswers.length || 7}</b><span>foundation checkpoints correct</span></div>
        <div><b>${answered}/${matchingScenarios.length}</b><span>practice scenarios answered</span></div>
        <div><b>${correct}/${matchingScenarios.length}</b><span>best-match choices correct</span></div>
        <div><b>${this.progress.calibrationComplete ? 'done' : 'try it'}</b><span>calibration exercise</span></div>
      </div>
      <section class="weak-concepts">
        <strong>Weak concepts to revisit</strong>
        <p>${weak.length ? weak.join(', ') : 'No weak areas flagged yet. Keep comparing confidence, pattern quality, and phase choice.'}</p>
      </section>
    `;
  }
}
