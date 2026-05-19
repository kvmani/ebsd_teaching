import './styles.css';
import { glossaryTerms } from './data/glossary.js';
import { AcquisitionRenderer } from './acquisition.js';
import { formulaReference } from './data/formulas.js';
import { learningModules } from './data/learningModules.js';
import { DetectorRenderer, detectorCaption } from './detector.js';
import { EulerOrientationStudio } from './eulerOrientationStudio.js';
import { IndexingStudio } from './indexingStudio.js';
import { InterpretationStudio } from './interpretationStudio.js';
import { LearningPath } from './learningPath.js';
import { loadLearningProgress } from './learningProgress.js';
import { acquisitionParameterGuides, learningPipeline, patternQualityCases, troubleshootingSymptoms } from './phase3Data.js';
import { RealIndexingLab } from './realIndexingLab.js';
import { EbsdScene } from './scene.js';
import { braggThetaDeg, electronWavelengthPm, planes, stages, state } from './state.js';

const qs = (id) => document.getElementById(id);
const sceneView = new EbsdScene(qs('scene'));
const detector = new DetectorRenderer(qs('detector'), qs('detectorInset'));
const acquisition = new AcquisitionRenderer(qs('scanMap'), qs('patternPreview'));
const indexingStudio = new IndexingStudio({
  root: qs('indexingStudio'),
  getReduceMotion: () => reduceMotion
});
const interpretationStudio = new InterpretationStudio({
  root: qs('interpretationStudio'),
  getReduceMotion: () => reduceMotion,
  onNavigate: (view) => setActiveView(view)
});
const realIndexingLab = new RealIndexingLab({
  root: qs('realIndexingLab')
});
const eulerOrientationStudio = new EulerOrientationStudio({
  root: qs('eulerOrientationStudio'),
  getReduceMotion: () => reduceMotion
});
const learningPath = new LearningPath({
  moduleList: qs('moduleList'),
  lessonWorkspace: qs('lessonWorkspace'),
  miniGlossary: qs('miniGlossary'),
  formulaPanel: qs('formulaPanel'),
  onExperiment: handleLearningExperiment
});

let playAccum = 0;
let last = performance.now();
let activeView = 'start';
let indexingMode = 'concept';
let currentResourceAction = 'worksheet-view';
let controlLevel = localStorage.getItem('ebsdTeachingStudio.controlLevel.v1') || 'beginner';
const savedReduceMotion = localStorage.getItem('ebsdLearningStudio.reduceMotion.v1');
let reduceMotion = savedReduceMotion === null
  ? window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true
  : savedReduceMotion === 'true';

const TEACHING_DEFAULT_ACQUISITION = { gain: 1.2, acceleratingVoltage: 20, workingDistance: 15, detectorDistance: 1.0, noiseLevel: 12, binning: 2, exposureMs: 28, beamCurrent: 55, frameAverage: 2, scanSpeed: 1.0, stepSize: 0.25, drift: 0, bandDetection: 65, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'none', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true };
const HIGH_QUALITY_PRESET = { gain: 1.0, acceleratingVoltage: 20, workingDistance: 15, detectorDistance: 0.95, noiseLevel: 4, binning: 2, exposureMs: 80, beamCurrent: 60, frameAverage: 5, scanSpeed: 0.55, stepSize: 0.12, drift: 5, bandDetection: 58, indexingThreshold: 55, indexingMode: 'dictionary', qualityOverlay: 'confidence', mapUpdate: 'line', autoIndex: true, confirmLowConfidence: true, backgroundCorrection: true };
const FAST_SURVEY_PRESET = { gain: 1.8, acceleratingVoltage: 25, workingDistance: 16, detectorDistance: 1.1, noiseLevel: 22, binning: 4, exposureMs: 10, beamCurrent: 70, frameAverage: 1, scanSpeed: 1.8, stepSize: 0.55, drift: 8, bandDetection: 72, indexingThreshold: 36, indexingMode: 'hough', qualityOverlay: 'none', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true };
const NOISY_PATTERN_PRESET = { gain: 1.4, acceleratingVoltage: 12, workingDistance: 18, detectorDistance: 1.15, noiseLevel: 56, binning: 1, exposureMs: 6, beamCurrent: 25, frameAverage: 1, scanSpeed: 1.7, stepSize: 0.35, drift: 0, bandDetection: 55, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'unindexed', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true };
const SATURATED_PATTERN_PRESET = { gain: 2.8, acceleratingVoltage: 25, workingDistance: 15, detectorDistance: 0.9, noiseLevel: 6, binning: 1, exposureMs: 22, beamCurrent: 95, frameAverage: 1, scanSpeed: 1.1, stepSize: 0.25, drift: 0, bandDetection: 80, indexingThreshold: 52, indexingMode: 'hough', qualityOverlay: 'confidence', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: false };
const DRIFT_MAP_PRESET = { gain: 1.1, acceleratingVoltage: 20, workingDistance: 15, detectorDistance: 1.0, noiseLevel: 14, binning: 2, exposureMs: 42, beamCurrent: 55, frameAverage: 3, scanSpeed: 0.75, stepSize: 0.25, drift: 55, bandDetection: 65, indexingThreshold: 45, indexingMode: 'hough', qualityOverlay: 'boundaries', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true };

function deg(value) {
  return `${value}°`;
}

function updateReadouts() {
  qs('tiltValue').textContent = deg(state.tilt);
  qs('annSample').textContent = `Sample surface: ${state.tilt}° from -X axis`;
  qs('distanceValue').textContent = state.distance.toFixed(1);
  qs('detectorHeightValue').textContent = state.detectorHeight.toFixed(2);
  qs('voltageValue').textContent = `${state.voltage} kV`;
  qs('rxValue').textContent = deg(state.rx);
  qs('ryValue').textContent = deg(state.ry);
  qs('rzValue').textContent = deg(state.rz);
  qs('coneScaleValue').textContent = `${state.coneScale.toFixed(1)}x`;
  qs('planeCountValue').textContent = `${state.planeCount}`;
  qs('stageValue').textContent = `${state.stage} / 6`;

  const lambda = electronWavelengthPm(state.voltage);
  const theta = braggThetaDeg(state.voltage, planes[0].d);
  qs('lambdaValue').textContent = `${lambda.toFixed(2)} pm`;
  qs('thetaValue').textContent = `${theta.toFixed(2)}°`;
  qs('bandValue').textContent = `${(2 * theta).toFixed(2)}°`;
  qs('modeValue').textContent = state.stage === 6 ? 'All visible' : `Stage ${state.stage}`;

  const stage = stages[state.stage - 1];
  qs('stageEyebrow').textContent = `Stage ${state.stage} of 6`;
  qs('stageTitle').textContent = stage.title.replace(/^\d+\.\s*/, '');
  qs('stageExplanation').textContent = stage.text;
  qs('stageProgress').style.width = `${(state.stage / 6) * 100}%`;
  qs('nowCard').textContent = stage.text;
  qs('explainTitle').textContent = stage.title.replace(/^\d+\.\s*/, '');
  qs('explainText').textContent = stage.text;
  qs('patternCaption').textContent = detectorCaption();
  qs('playStage').textContent = state.playing ? 'Pause' : 'Play';
  updateMiniFormula();
}

function updateMiniFormula() {
  const spacingInput = qs('miniDSpacing');
  if (!spacingInput) return;
  const dNm = Number(spacingInput.value);
  const lambda = electronWavelengthPm(state.voltage);
  const theta = braggThetaDeg(state.voltage, dNm);
  qs('miniSpacingValue').textContent = `${dNm.toFixed(3)} nm`;
  qs('miniLambdaValue').textContent = `${lambda.toFixed(2)} pm`;
  qs('miniThetaValue').textContent = `${theta.toFixed(2)}°`;
}

function updateAll() {
  updateReadouts();
  sceneView.update();
  detector.draw();
  updateAcquisitionReadouts();
}

function bindRange(id, key, parse = Number) {
  const el = qs(id);
  el.addEventListener('input', () => {
    state[key] = parse(el.value);
    updateAll();
  });
}

function bindCheck(id, key) {
  qs(id).addEventListener('change', (event) => {
    state[key] = event.target.checked;
    updateAll();
  });
}

['tilt', 'distance', 'detectorHeight', 'voltage', 'rx', 'ry', 'rz', 'coneScale', 'planeCount', 'stage'].forEach((id) => bindRange(id, id, Number));
['patternContrast'].forEach((id) => bindRange(id, id, Number));
['showCones', 'showPlanes', 'showIntersections', 'showLabels', 'showNoise', 'invertPattern'].forEach((id) => bindCheck(id, id));

function updateAcquisitionReadouts() {
  const liveLabel = state.acquisition.live ? 'Pause live scan' : 'Resume live scan';
  const livePressed = String(!state.acquisition.live);
  qs('scanPauseButton').textContent = liveLabel;
  qs('patternPauseButton').textContent = liveLabel;
  qs('scanPauseButton').setAttribute('aria-pressed', livePressed);
  qs('patternPauseButton').setAttribute('aria-pressed', livePressed);
  qs('scanMap').classList.toggle('paused', !state.acquisition.live);
  qs('patternPreview').classList.toggle('paused', !state.acquisition.live);

  qs('gainValue').textContent = `${state.acquisition.gain.toFixed(1)}x`;
  qs('acqVoltageValue').textContent = `${state.acquisition.acceleratingVoltage} kV`;
  qs('workingDistanceValue').textContent = `${state.acquisition.workingDistance} mm`;
  qs('acqDetectorDistanceValue').textContent = `${state.acquisition.detectorDistance.toFixed(2)}x`;
  qs('noiseLevelValue').textContent = `${state.acquisition.noiseLevel}%`;
  qs('binningValue').textContent = `${state.acquisition.binning} x ${state.acquisition.binning}`;
  qs('exposureValue').textContent = `${state.acquisition.exposureMs} ms`;
  qs('beamCurrentValue').textContent = `${state.acquisition.beamCurrent}%`;
  qs('frameAverageValue').textContent = `${state.acquisition.frameAverage} ${state.acquisition.frameAverage === 1 ? 'frame' : 'frames'}`;
  qs('scanSpeedValue').textContent = `${state.acquisition.scanSpeed.toFixed(1)}x`;
  qs('stepSizeValue').textContent = `${state.acquisition.stepSize.toFixed(2)} um`;
  qs('driftValue').textContent = `${state.acquisition.drift}%`;
  qs('bandDetectionValue').textContent = `${state.acquisition.bandDetection}%`;
  qs('indexingThresholdValue').textContent = `${state.acquisition.indexingThreshold}%`;

  const metrics = acquisition.metrics();
  qs('scanQuality').textContent = `${metrics.quality}%`;
  qs('scanIndexRate').textContent = metrics.indexRate;
  qs('scanResolution').textContent = metrics.resolution;
  qs('scanSpeed').textContent = metrics.speed;
  qs('scanWarning').textContent = metrics.warning;
  qs('scanProgress').textContent = metrics.progress;
  qs('scanPixel').textContent = metrics.pixel;
  qs('scanStatusPixel').textContent = metrics.pixel;
  qs('scanStatusProgress').textContent = metrics.progress;
  qs('scanStatusState').textContent = metrics.warning;
  qs('patternPixel').textContent = metrics.pixel;
  qs('patternGrain').textContent = metrics.grain;
  qs('patternLabel').textContent = metrics.patternLabel;
  qs('patternSource').textContent = metrics.patternSource;
  qs('acquisitionState').textContent = metrics.warning;
  qs('scanDwell').textContent = metrics.dwell;
  const mapModeLabels = { orientation: 'orientation', quality: 'pattern quality', confidence: 'confidence cue' };
  qs('scanMode').textContent = mapModeLabels[state.acquisition.mapMode] || state.acquisition.mapMode;
  qs('scaleBarText').textContent = metrics.scaleBar;
  setBar('noiseBar', metrics.pattern.noise, true);
  setBar('clippingBar', metrics.pattern.saturation, true);
  setBar('sharpnessBar', metrics.pattern.sharpness);
  qs('noiseValue').textContent = `${metrics.pattern.noise}%`;
  qs('clippingValue').textContent = `${metrics.pattern.saturation}%`;
  qs('sharpnessValue').textContent = `${metrics.pattern.sharpness}%`;
  qs('parameterStory').textContent = acquisitionStory();
  updateCoach(metrics);
  updateMapModeButtons();
  updateWarningBadges(metrics);
  updateQualityChecklist(metrics);
  updateDiagnosis();
  updateParameterGuide();
}

function setBar(id, value, invert = false) {
  const bar = qs(id);
  bar.style.width = `${value}%`;
  bar.classList.toggle('caution', invert ? value > 55 : value < 45);
}

function updateCoach(metrics) {
  setBar('barSignal', metrics.scores.signal);
  setBar('barDetail', metrics.scores.detail);
  setBar('barSpeed', metrics.scores.speed);
  setBar('barRisk', metrics.scores.risk, true);

  if (metrics.warning === 'gain clipping') {
    qs('coachTitle').textContent = 'Reduce gain or beam current';
    qs('coachText').textContent = 'The pattern is bright, but the signal is saturated. Lower gain first; if bands become too dim, recover signal with exposure or averaging.';
    return;
  }
  if (metrics.warning === 'noisy indexing') {
    qs('coachTitle').textContent = 'Add electrons per pixel';
    qs('coachText').textContent = 'The scan is fast but weak. Increase exposure, beam current, binning, or averaging and watch the confidence-like map cue stabilize.';
    return;
  }
  if (metrics.warning === 'coarse pixels') {
    qs('coachTitle').textContent = 'Trade signal for spatial detail';
    qs('coachText').textContent = 'Binning cleaned the signal, but grain boundaries are blocky. Reduce binning when students need spatial resolution.';
    return;
  }
  if (metrics.warning === 'drift visible') {
    qs('coachTitle').textContent = 'Stabilize before trusting the map';
    qs('coachText').textContent = 'The raster is shifting during acquisition. Slower maps are not always better if the specimen or stage drifts.';
    return;
  }
  if (metrics.warning === 'missed bands') {
    qs('coachTitle').textContent = 'Increase band detection sensitivity';
    qs('coachText').textContent = 'The pattern may contain useful bands, but the indexing step is not finding enough of them. Raise band detection before increasing exposure.';
    return;
  }
  if (metrics.warning === 'geometry mismatch') {
    qs('coachTitle').textContent = 'Check geometry before forcing indexing';
    qs('coachText').textContent = 'Working distance or detector distance is away from the balanced study setup. The bands may be visible, but projection geometry is less trustworthy.';
    return;
  }
  if (metrics.warning === 'strict threshold') {
    qs('coachTitle').textContent = 'Lower the index threshold or improve signal';
    qs('coachText').textContent = 'The threshold is rejecting patterns that are close to usable. Lower it for exploration, or improve exposure/current for stricter indexing.';
    return;
  }
  qs('coachTitle').textContent = 'Balanced learning setup';
  qs('coachText').textContent = 'The current settings should produce recognizable bands while keeping the scan lively enough to watch.';
}

function acquisitionStory() {
  if (state.acquisition.drift > 35) {
    return 'Stage drift is intentionally high here. Watch the raster bend the grain boundaries: the pattern at each point may be good, but the scan no longer represents the true position cleanly.';
  }
  if (Math.abs(state.acquisition.workingDistance - 15) > 5 || Math.abs(state.acquisition.detectorDistance - 1) > 0.25) {
    return 'Geometry is away from the study optimum. In real EBSD, working distance and detector distance affect pattern projection and calibration reliability before indexing begins.';
  }
  if (state.acquisition.noiseLevel > 40) {
    return 'Added noise is high. Students should see speckle hide weak bands and reduce confidence-like map stability even before changing the indexing threshold.';
  }
  if (!state.acquisition.autoIndex) {
    return 'Auto-indexing is paused. This is useful for learning: students can see that pattern formation and indexing are separate steps in the EBSD workflow.';
  }
  if (state.acquisition.confirmLowConfidence) {
    return 'Low-confidence confirmation is enabled. Borderline pixels are held back so students can discuss whether strict rejection improves trust or simply creates more unindexed area.';
  }
  if (state.acquisition.bandDetection < 35) {
    return 'Band detection is too conservative. The simulated indexing step misses weak Kikuchi bands, so otherwise usable pixels may fail to index.';
  }
  if (state.acquisition.indexingThreshold > acquisition.metrics().quality) {
    return 'The indexing threshold is stricter than the current pattern quality. Students should see more unindexed pixels until signal or band detection improves.';
  }
  if (!state.acquisition.backgroundCorrection) {
    return 'Without background correction, diffuse intensity competes with the Kikuchi bands. Students should see why EBSD software removes smooth background before indexing.';
  }
  if (state.acquisition.gain > 2.2 && state.acquisition.beamCurrent > 65) {
    return 'High gain can make bands look bright, but the brightest pixels saturate. Students should notice that clipping destroys band detail instead of improving indexing.';
  }
  if (state.acquisition.exposureMs < 14) {
    return 'Short exposure scans quickly, but each pixel gets fewer electrons. The map becomes lively and fast, with noisy colors and weaker confidence-like pattern cues.';
  }
  if (state.acquisition.binning >= 5) {
    return 'Large binning combines many detector pixels. Noise drops, but fine spatial detail is sacrificed, so grain boundaries look blocky.';
  }
  if (state.acquisition.stepSize > 0.7) {
    return 'Large step size samples fewer positions. The map appears faster and simpler, but narrow grains and boundary detail can be missed.';
  }
  if (state.acquisition.frameAverage >= 5) {
    return 'Frame averaging cleans random noise by repeating measurements. It is excellent for weak patterns, but the scan takes longer.';
  }
  return 'This is a balanced setup: enough exposure for recognizable bands, moderate binning for signal, and gain below the clipping region.';
}

function bindAcquisitionRange(id, key, parse = Number) {
  const el = qs(id);
  el.addEventListener('input', () => {
    state.acquisition[key] = parse(el.value);
    if (acquisitionParameterGuides[key] && qs('parameterFocus')) qs('parameterFocus').value = key;
    acquisition.drawPatternPreview();
    updateAcquisitionReadouts();
  });
}

function bindAcquisitionCheck(id, key) {
  qs(id).addEventListener('change', (event) => {
    state.acquisition[key] = event.target.checked;
    acquisition.drawPatternPreview();
    updateAcquisitionReadouts();
  });
}

function toggleLiveAcquisition() {
  state.acquisition.live = !state.acquisition.live;
  qs('liveAcquisition').checked = state.acquisition.live;
  acquisition.drawPatternPreview();
  updateAcquisitionReadouts();
  qs('explainTitle').textContent = state.acquisition.live ? 'Live scan resumed' : 'Live scan paused';
  qs('explainText').textContent = state.acquisition.live
    ? 'The raster is acquiring again. Click the scan map or Kikuchi pattern preview to pause it.'
    : 'The current pixel and Kikuchi pattern are frozen for discussion. Click the scan map or pattern preview again to resume.';
}

function setAcquisitionPreset(values) {
  Object.assign(state.acquisition, values);
  qs('gain').value = state.acquisition.gain;
  qs('acqVoltage').value = state.acquisition.acceleratingVoltage;
  qs('workingDistance').value = state.acquisition.workingDistance;
  qs('acqDetectorDistance').value = state.acquisition.detectorDistance;
  qs('noiseLevel').value = state.acquisition.noiseLevel;
  qs('binning').value = state.acquisition.binning;
  qs('exposureMs').value = state.acquisition.exposureMs;
  qs('beamCurrent').value = state.acquisition.beamCurrent;
  qs('frameAverage').value = state.acquisition.frameAverage;
  qs('scanSpeedControl').value = state.acquisition.scanSpeed;
  qs('stepSize').value = state.acquisition.stepSize;
  qs('drift').value = state.acquisition.drift;
  qs('bandDetection').value = state.acquisition.bandDetection;
  qs('indexingThreshold').value = state.acquisition.indexingThreshold;
  qs('indexingMode').value = state.acquisition.indexingMode;
  qs('qualityOverlay').value = state.acquisition.qualityOverlay;
  qs('mapUpdate').value = state.acquisition.mapUpdate;
  qs('autoIndex').checked = state.acquisition.autoIndex;
  qs('confirmLowConfidence').checked = state.acquisition.confirmLowConfidence;
  qs('backgroundCorrection').checked = state.acquisition.backgroundCorrection;
  acquisition.reset();
  acquisition.drawPatternPreview();
  updateAcquisitionReadouts();
}

function updateParameterGuide() {
  const focus = qs('parameterFocus')?.value || 'acceleratingVoltage';
  const guide = acquisitionParameterGuides[focus] || acquisitionParameterGuides.acceleratingVoltage;
  qs('parameterVisual').textContent = guide.visual;
  qs('parameterPhysical').textContent = guide.physical;
  qs('parameterTradeoff').textContent = guide.tradeoff;
}

const scenarioKey = 'ebsdTeachingStudio.scenarios.v1';

function loadScenarios() {
  try {
    return JSON.parse(localStorage.getItem(scenarioKey) || '[]');
  } catch {
    return [];
  }
}

function saveScenarios(scenarios) {
  localStorage.setItem(scenarioKey, JSON.stringify(scenarios));
}

function currentScenarioPayload(name) {
  return {
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    name,
    savedAt: new Date().toISOString(),
    geometry: {
      stage: state.stage,
      tilt: state.tilt,
      distance: state.distance,
      detectorHeight: state.detectorHeight,
      voltage: state.voltage,
      rx: state.rx,
      ry: state.ry,
      rz: state.rz,
      coneScale: state.coneScale,
      planeCount: state.planeCount,
      patternContrast: state.patternContrast,
      invertPattern: state.invertPattern
    },
    acquisition: { ...state.acquisition }
  };
}

function renderScenarioSelect() {
  const scenarios = loadScenarios();
  qs('scenarioSelect').innerHTML = scenarios.length
    ? scenarios.map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`).join('')
    : '<option value="">No saved scenarios</option>';
}

function applyGeometryValues(values = {}) {
  Object.assign(state, values);
  ['stage', 'tilt', 'distance', 'detectorHeight', 'voltage', 'rx', 'ry', 'rz', 'coneScale', 'planeCount', 'patternContrast'].forEach((id) => {
    if (values[id] !== undefined) qs(id).value = state[id];
  });
  ['invertPattern'].forEach((id) => {
    if (values[id] !== undefined) qs(id).checked = state[id];
  });
  updateAll();
}

function saveCurrentScenario() {
  const name = qs('scenarioName').value.trim() || 'EBSD practice scenario';
  const scenarios = loadScenarios().filter((item) => item.name !== name);
  scenarios.unshift(currentScenarioPayload(name));
  saveScenarios(scenarios.slice(0, 12));
  renderScenarioSelect();
  qs('explainTitle').textContent = 'Scenario saved';
  qs('explainText').textContent = `"${name}" is stored in this browser localStorage for offline self-study.`;
}

function restoreSelectedScenario() {
  const scenario = loadScenarios().find((item) => item.id === qs('scenarioSelect').value);
  if (!scenario) return;
  applyGeometryValues(scenario.geometry);
  setAcquisitionPreset(scenario.acquisition);
  qs('scenarioName').value = scenario.name;
  qs('explainTitle').textContent = 'Scenario restored';
  qs('explainText').textContent = `"${scenario.name}" restored geometry and acquisition controls from localStorage.`;
}

function setMapMode(mode) {
  state.acquisition.mapMode = mode;
  acquisition.reset();
  acquisition.drawPatternPreview();
  updateAcquisitionReadouts();
}

function updateMapModeButtons() {
  [
    ['modeOrientation', 'orientation'],
    ['modeQuality', 'quality'],
    ['modeConfidence', 'confidence']
  ].forEach(([id, mode]) => {
    qs(id).classList.toggle('active', state.acquisition.mapMode === mode);
  });
}

function updateWarningBadges(metrics) {
  const badges = [];
  if (metrics.pattern.saturation > 10 || metrics.warning === 'gain clipping') badges.push(['risk of saturation', 'Lower gain first.']);
  if (metrics.pattern.noise > 50 || metrics.warning === 'noisy indexing') badges.push(['low signal', 'Add exposure, current, or averaging.']);
  if (state.acquisition.binning >= 4 || state.acquisition.stepSize >= 0.55) badges.push(['coarse spatial sampling', 'Reduce binning or step size for fine grains.']);
  if (state.acquisition.drift > 30) badges.push(['drift risk', 'Stabilize or scan faster.']);
  if (metrics.warning === 'geometry mismatch') badges.push(['geometry mismatch', 'Revisit working distance or detector distance.']);
  if (state.acquisition.noiseLevel > 40) badges.push(['added noise', 'Improve signal before trusting weak bands.']);
  if (state.acquisition.indexingThreshold > metrics.quality) badges.push(['strict threshold', 'Improve signal or lower threshold for exploration.']);
  if (!badges.length) badges.push(['balanced setup healthy', 'Balanced signal, detail, and speed.']);
  qs('warningBadges').innerHTML = badges.map(([label, title]) => `<span title="${escapeHtml(title)}">${escapeHtml(label)}</span>`).join('');
}

function updateQualityChecklist(metrics) {
  const items = [
    ['sharp bands', metrics.pattern.sharpness >= 55, 'Raise exposure/current or reduce binning if bands are blurred.'],
    ['no clipping', metrics.pattern.saturation <= 8, 'Lower gain before increasing other signal controls.'],
    ['enough contrast', metrics.quality >= 50, 'Use background correction and enough electrons per pixel.'],
    ['geometry near setup', metrics.warning !== 'geometry mismatch', 'Working distance and detector distance affect projection and calibration reliability.'],
    ['stable map', state.acquisition.drift <= 25, 'Drift can bend boundaries even with usable patterns.'],
    ['reasonable threshold', state.acquisition.indexingThreshold <= metrics.quality + 12, 'Thresholds should match the study goal and data quality.']
  ];
  qs('qualityChecklist').innerHTML = items.map(([label, ok, tip]) => `
    <div class="${ok ? 'ok' : 'caution'}"><b>${ok ? 'OK' : 'Check'}</b><span>${escapeHtml(label)}</span><small>${escapeHtml(tip)}</small></div>
  `).join('');
}

function updateDiagnosis() {
  const symptom = qs('diagnoseSymptom')?.value || 'noisy';
  const fixes = {
    noisy: ['Very noisy pattern', 'Possible low exposure/current or too little averaging.', 'Increase exposure or frame averaging, then compare confidence-like cues.'],
    saturated: ['Bright clipped pattern', 'Possible excessive detector gain or beam current.', 'Reduce gain first; recover signal with exposure only if needed.'],
    coarse: ['Blocky map detail', 'Possible large binning or step size.', 'Reduce binning or step size when grain-boundary detail matters.'],
    drift: ['Bent grain boundaries', 'Possible stage drift during acquisition.', 'Stabilize the sample/stage or use a faster survey scan.'],
    threshold: ['Many rejected pixels', 'Possible threshold stricter than current pattern quality.', 'Improve signal before lowering threshold for final interpretation.'],
    geometry: ['Bands visible but fit feels unstable', 'Working distance, detector distance, or pattern center may be inconsistent with the projection model.', 'Return geometry to the study setup before adjusting confidence-like thresholds.']
  };
  const [title, cause, fix] = fixes[symptom];
  qs('diagnoseResult').innerHTML = `<strong>${escapeHtml(title)}</strong><p>${escapeHtml(cause)}</p><p><b>First check:</b> ${escapeHtml(fix)}</p>`;
}

function setControlLevel(level) {
  controlLevel = level;
  localStorage.setItem('ebsdTeachingStudio.controlLevel.v1', level);
  document.body.classList.toggle('beginner-mode', level === 'beginner');
  qs('beginnerMode').classList.toggle('active', level === 'beginner');
  qs('advancedMode').classList.toggle('active', level === 'advanced');
}

function updateReduceMotionButton() {
  qs('reduceMotionButton').setAttribute('aria-pressed', String(reduceMotion));
  qs('reduceMotionButton').textContent = reduceMotion ? 'Motion paused' : 'Reduce motion';
  document.body.classList.toggle('reduce-motion', reduceMotion);
}

function setReduceMotion(value) {
  reduceMotion = value;
  localStorage.setItem('ebsdLearningStudio.reduceMotion.v1', String(reduceMotion));
  if (reduceMotion) {
    state.playing = false;
    state.acquisition.live = false;
    qs('liveAcquisition').checked = false;
  }
  updateReduceMotionButton();
  indexingStudio.setReduceMotion();
  updateAll();
}

function setActiveView(view) {
  activeView = view;
  const isStart = view === 'start';
  const isGeometry = view === 'geometry';
  const isAcquisition = view === 'acquisition';
  const isIndexing = view === 'indexing';
  const isEuler = view === 'euler';
  const isInterpretation = view === 'interpretation';
  const isLearning = view === 'learning';
  const isResources = view === 'resources';
  qs('startView').classList.toggle('active', isStart);
  qs('geometryView').classList.toggle('active', isGeometry);
  qs('acquisitionView').classList.toggle('active', isAcquisition);
  qs('indexingView').classList.toggle('active', isIndexing);
  qs('eulerView').classList.toggle('active', isEuler);
  qs('interpretationView').classList.toggle('active', isInterpretation);
  qs('learningView').classList.toggle('active', isLearning);
  qs('resourcesView').classList.toggle('active', isResources);
  [
    ['startView', isStart],
    ['geometryView', isGeometry],
    ['acquisitionView', isAcquisition],
    ['indexingView', isIndexing],
    ['eulerView', isEuler],
    ['interpretationView', isInterpretation],
    ['learningView', isLearning],
    ['resourcesView', isResources]
  ].forEach(([id, isActive]) => {
    qs(id).setAttribute('aria-hidden', String(!isActive));
  });
  qs('tabStart').classList.toggle('active', isStart);
  qs('tabGeometry').classList.toggle('active', isGeometry);
  qs('tabAcquisition').classList.toggle('active', isAcquisition);
  qs('tabIndexing').classList.toggle('active', isIndexing);
  qs('tabEuler').classList.toggle('active', isEuler);
  qs('tabInterpretation').classList.toggle('active', isInterpretation);
  qs('tabLearning').classList.toggle('active', isLearning);
  qs('tabResources').classList.toggle('active', isResources);
  qs('geometryLegend').classList.toggle('hidden', !isGeometry);
  qs('tabStart').setAttribute('aria-selected', String(isStart));
  qs('tabGeometry').setAttribute('aria-selected', String(isGeometry));
  qs('tabAcquisition').setAttribute('aria-selected', String(isAcquisition));
  qs('tabIndexing').setAttribute('aria-selected', String(isIndexing));
  qs('tabEuler').setAttribute('aria-selected', String(isEuler));
  qs('tabInterpretation').setAttribute('aria-selected', String(isInterpretation));
  qs('tabLearning').setAttribute('aria-selected', String(isLearning));
  qs('tabResources').setAttribute('aria-selected', String(isResources));
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.tabIndex = button.classList.contains('active') ? 0 : -1;
  });
  if (isStart) {
    qs('explainTitle').textContent = 'Start Here';
    qs('explainText').textContent = 'Choose a student path, then move between geometry, acquisition, indexing, and revision at your own pace.';
  } else if (isGeometry) {
    resize();
    updateReadouts();
  } else if (isAcquisition) {
    qs('explainTitle').textContent = 'Live Scan Acquisition';
    qs('explainText').textContent = 'Gain, binning, exposure, beam current, and averaging trade speed, noise, saturation, and spatial resolution. The scan view is schematic but designed to make those trade-offs visible.';
    updateAcquisitionReadouts();
  } else if (isIndexing) {
    qs('explainTitle').textContent = 'How Kikuchi Bands Are Indexed';
    qs('explainText').textContent = 'This foundation module explains the simplified indexing pipeline without adding a full Hough transform simulator.';
  } else if (isEuler) {
    qs('explainTitle').textContent = 'Euler Angles / Pole Figures';
    qs('explainText').textContent = 'Rotate cubic and hexagonal cells with Bunge ZXZ angles, then connect the 3D pole to pole figure and inverse pole figure views.';
    eulerOrientationStudio.init();
    eulerOrientationStudio.resize();
  } else if (isInterpretation) {
    qs('explainTitle').textContent = 'Interpretation Studio';
    qs('explainText').textContent = 'Compare preparation, acquisition, pattern quality, confidence-like evidence, and map views before drawing EBSD conclusions.';
    interpretationStudio.updateAll();
  } else {
    if (isLearning) {
      qs('explainTitle').textContent = 'Learning Path';
      qs('explainText').textContent = 'A self-study path: geometry, scattering, Bragg diffraction, Kikuchi bands, detector calibration, indexing, and acquisition troubleshooting.';
      learningPath.render();
    } else if (isResources) {
      qs('explainTitle').textContent = 'Glossary / Resources';
      qs('explainText').textContent = 'Open local glossary entries, notes, worksheets, practice questions, and self-study exports.';
    }
  }
}

function moveSectionFocus(delta) {
  const tabs = Array.from(document.querySelectorAll('.tab-button'));
  const currentIndex = Math.max(0, tabs.findIndex((button) => button.classList.contains('active')));
  const nextIndex = (currentIndex + delta + tabs.length) % tabs.length;
  tabs[nextIndex].focus();
  tabs[nextIndex].click();
}

function showDemoBanner(title, text) {
  qs('demoBannerTitle').textContent = title;
  qs('demoBannerText').textContent = text;
  qs('demoBanner').classList.remove('hidden');
}

function hideDemoBanner() {
  qs('demoBanner').classList.add('hidden');
}

function highlightControls(ids = []) {
  document.querySelectorAll('.control-highlight').forEach((item) => item.classList.remove('control-highlight'));
  ids.forEach((id) => qs(id)?.closest('label, .control-group, button')?.classList.add('control-highlight'));
  window.setTimeout(() => {
    ids.forEach((id) => qs(id)?.closest('label, .control-group, button')?.classList.remove('control-highlight'));
  }, 9000);
}

function handleLearningExperiment(action, context = {}) {
  const showInstruction = (title, text) => {
    qs('explainTitle').textContent = title;
    qs('explainText').textContent = text;
    showDemoBanner(title, context.instruction || text);
  };

  if (action === 'geometry-stage-1') {
    setActiveView('geometry');
    state.stage = 1;
    qs('stage').value = state.stage;
    updateAll();
    highlightControls(['stage', 'nextStage']);
    showInstruction('Geometry demo', 'Step through the guided stages and ask what each visual element represents.');
    return;
  }
  if (action === 'geometry-stage-2') {
    setActiveView('geometry');
    state.stage = 2;
    qs('stage').value = state.stage;
    updateAll();
    highlightControls(['stage', 'tilt']);
    showInstruction('Interaction volume demo', 'The glowing volume is schematic: it marks where useful near-surface scattering begins.');
    return;
  }
  if (action === 'geometry-stage-4') {
    setActiveView('geometry');
    state.stage = 4;
    state.coneScale = 7;
    qs('stage').value = state.stage;
    qs('coneScale').value = state.coneScale;
    updateAll();
    highlightControls(['voltage', 'coneScale']);
    showInstruction('Cone formation demo', 'Bragg cones are magnified here so students can see how detector bands originate.');
    return;
  }
  if (action === 'geometry-stage-6') {
    setActiveView('geometry');
    state.stage = 6;
    qs('stage').value = state.stage;
    updateAll();
    highlightControls(['rz', 'rx', 'ry']);
    showInstruction('Full pattern demo', 'Rotate crystal Z and watch the band network move across the detector.');
    return;
  }
  if (action === 'geometry-detector-demo') {
    setActiveView('geometry');
    state.stage = 5;
    qs('stage').value = state.stage;
    updateAll();
    highlightControls(['distance', 'detectorHeight']);
    showInstruction('Detector geometry demo', 'Adjust detector distance and height, then watch cone intersections shift.');
    return;
  }

  const acquisitionActions = {
    'open-acquisition-balanced': TEACHING_DEFAULT_ACQUISITION,
    'acquisition-compare-quality': HIGH_QUALITY_PRESET,
    'acquisition-map-views': { ...TEACHING_DEFAULT_ACQUISITION, qualityOverlay: 'confidence' },
    'acquisition-noisy': NOISY_PATTERN_PRESET,
    'acquisition-clipping': SATURATED_PATTERN_PRESET,
    'acquisition-drift': DRIFT_MAP_PRESET
  };

  if (acquisitionActions[action]) {
    setActiveView('acquisition');
    setAcquisitionPreset(acquisitionActions[action]);
    if (action === 'acquisition-map-views') setMapMode('confidence');
    highlightControls(['gain', 'exposureMs', 'beamCurrent', 'binning', 'frameAverage', 'indexingThreshold']);
    showInstruction('Acquisition demo', 'The Learning Path applied a local preset. Compare the pattern preview, map, and coach warning.');
    return;
  }

  if (['open-interpretation', 'interpretation-map', 'interpretation-quality', 'interpretation-troubleshooting', 'sample-prep-impact'].includes(action)) {
    setActiveView('interpretation');
    showInstruction('Interpretation studio', 'Compare pattern evidence, preparation, acquisition, confidence-like cues, maps, and troubleshooting before drawing conclusions.');
  }
}

bindAcquisitionRange('gain', 'gain', Number);
bindAcquisitionRange('acqVoltage', 'acceleratingVoltage', Number);
bindAcquisitionRange('workingDistance', 'workingDistance', Number);
bindAcquisitionRange('acqDetectorDistance', 'detectorDistance', Number);
bindAcquisitionRange('noiseLevel', 'noiseLevel', Number);
bindAcquisitionRange('binning', 'binning', Number);
bindAcquisitionRange('exposureMs', 'exposureMs', Number);
bindAcquisitionRange('beamCurrent', 'beamCurrent', Number);
bindAcquisitionRange('frameAverage', 'frameAverage', Number);
bindAcquisitionRange('scanSpeedControl', 'scanSpeed', Number);
bindAcquisitionRange('stepSize', 'stepSize', Number);
bindAcquisitionRange('drift', 'drift', Number);
bindAcquisitionRange('bandDetection', 'bandDetection', Number);
bindAcquisitionRange('indexingThreshold', 'indexingThreshold', Number);
bindAcquisitionCheck('autoIndex', 'autoIndex');
bindAcquisitionCheck('confirmLowConfidence', 'confirmLowConfidence');
bindAcquisitionCheck('backgroundCorrection', 'backgroundCorrection');
bindAcquisitionCheck('showIndexing', 'showIndexing');
bindAcquisitionCheck('showScanLine', 'showScanLine');
bindAcquisitionCheck('liveAcquisition', 'live');
qs('miniDSpacing').addEventListener('input', updateMiniFormula);
qs('beginnerMode').addEventListener('click', () => setControlLevel('beginner'));
qs('advancedMode').addEventListener('click', () => setControlLevel('advanced'));
qs('parameterFocus').addEventListener('change', updateParameterGuide);
qs('diagnoseSymptom').addEventListener('change', updateDiagnosis);
qs('saveScenario').addEventListener('click', saveCurrentScenario);
qs('loadScenario').addEventListener('click', restoreSelectedScenario);
qs('resetAcquisitionDefaults').addEventListener('click', () => {
  setAcquisitionPreset(TEACHING_DEFAULT_ACQUISITION);
  qs('explainTitle').textContent = 'Balanced setup restored';
  qs('explainText').textContent = 'Acquisition controls are back to a balanced setup for self-study comparisons.';
});
qs('scanMap').addEventListener('click', toggleLiveAcquisition);
qs('patternPreview').addEventListener('click', toggleLiveAcquisition);
qs('scanPauseButton').addEventListener('click', toggleLiveAcquisition);
qs('patternPauseButton').addEventListener('click', toggleLiveAcquisition);

['indexingMode', 'qualityOverlay', 'mapUpdate'].forEach((id) => {
  qs(id).addEventListener('change', (event) => {
    state.acquisition[id] = event.target.value;
    acquisition.reset();
    acquisition.drawPatternPreview();
    updateAcquisitionReadouts();
  });
});

qs('tabStart').addEventListener('click', () => setActiveView('start'));
qs('tabGeometry').addEventListener('click', () => setActiveView('geometry'));
qs('tabAcquisition').addEventListener('click', () => setActiveView('acquisition'));
qs('tabIndexing').addEventListener('click', () => setActiveView('indexing'));
qs('tabEuler').addEventListener('click', () => setActiveView('euler'));
qs('tabInterpretation').addEventListener('click', () => setActiveView('interpretation'));
qs('tabLearning').addEventListener('click', () => {
  hideDemoBanner();
  setActiveView('learning');
});
qs('tabResources').addEventListener('click', () => setActiveView('resources'));
qs('indexingConceptTab').addEventListener('click', () => setIndexingMode('concept'));
qs('indexingRealTab').addEventListener('click', () => setIndexingMode('real'));
document.querySelector('.view-tabs').addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveSectionFocus(1);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveSectionFocus(-1);
  }
  if (event.key === 'Home') {
    event.preventDefault();
    qs('tabStart').focus();
    setActiveView('start');
  }
  if (event.key === 'End') {
    event.preventDefault();
    qs('tabResources').focus();
    setActiveView('resources');
  }
});
qs('returnToLesson').addEventListener('click', () => {
  hideDemoBanner();
  setActiveView('learning');
});
qs('resetScan').addEventListener('click', () => {
  acquisition.reset();
  updateAcquisitionReadouts();
});
qs('presetFast').addEventListener('click', () => setAcquisitionPreset(FAST_SURVEY_PRESET));
qs('presetBalanced').addEventListener('click', () => setAcquisitionPreset(TEACHING_DEFAULT_ACQUISITION));
qs('presetHighQuality').addEventListener('click', () => setAcquisitionPreset(HIGH_QUALITY_PRESET));
qs('presetNoisy').addEventListener('click', () => setAcquisitionPreset(NOISY_PATTERN_PRESET));
qs('presetSaturated').addEventListener('click', () => setAcquisitionPreset(SATURATED_PATTERN_PRESET));
qs('presetDrift').addEventListener('click', () => setAcquisitionPreset(DRIFT_MAP_PRESET));
qs('modeOrientation').addEventListener('click', () => setMapMode('orientation'));
qs('modeQuality').addEventListener('click', () => setMapMode('quality'));
qs('modeConfidence').addEventListener('click', () => setMapMode('confidence'));

qs('resetScene').addEventListener('click', () => {
  Object.assign(state, {
    stage: 6,
    tilt: 70,
    distance: 2.9,
    detectorHeight: 1.3,
    voltage: 20,
    rx: 0,
    ry: 0,
    rz: 0,
    coneScale: 6,
    planeCount: 4,
    showCones: true,
    showPlanes: true,
    showIntersections: true,
    showLabels: true,
    showNoise: true,
    patternContrast: 100,
    invertPattern: false,
    playing: false
  });
  ['stage', 'tilt', 'distance', 'detectorHeight', 'voltage', 'rx', 'ry', 'rz', 'coneScale', 'planeCount', 'patternContrast'].forEach((id) => {
    qs(id).value = state[id];
  });
  ['showCones', 'showPlanes', 'showIntersections', 'showLabels', 'showNoise', 'invertPattern'].forEach((id) => {
    qs(id).checked = state[id];
  });
  updateAll();
});

qs('notesButton').addEventListener('click', openNotesModal);
qs('learningNotesShortcut').addEventListener('click', openNotesModal);
qs('learningBookmarksShortcut').addEventListener('click', () => {
  openNotesModal('bookmarks');
});
qs('learningScenariosShortcut').addEventListener('click', () => {
  setActiveView('acquisition');
  qs('scenarioName').focus();
});
qs('learningIndexingShortcut').addEventListener('click', () => setActiveView('indexing'));
qs('learningInterpretationShortcut').addEventListener('click', () => setActiveView('interpretation'));
qs('screenshotButton').addEventListener('click', exportCurrentScreenshot);
qs('exportButton').addEventListener('click', () => {
  openResource(activeView === 'learning' ? 'worksheet-view' : 'self-study-view');
});
qs('glossaryButton').addEventListener('click', () => openGlossaryModal());
qs('resourcesGlossaryButton').addEventListener('click', () => openGlossaryModal());
qs('resourcesNotesButton').addEventListener('click', openNotesModal);
qs('downloadModules').addEventListener('click', () => exportResource('all-modules-view'));

document.querySelectorAll('[data-start-target]').forEach((button) => {
  button.addEventListener('click', () => {
    const target = button.dataset.startTarget;
    if (target === 'learning-intro') {
      learningPath.selectModule('intro');
      learningPath.progress.selectedMode = 'learn';
      learningPath.save();
      setActiveView('learning');
      return;
    }
    if (target === 'acquisition') {
      setActiveView('acquisition');
      return;
    }
    if (target === 'indexing') {
      setActiveView('indexing');
      return;
    }
    if (target === 'interpretation') {
      setActiveView('interpretation');
      return;
    }
    if (target === 'revise') {
      learningPath.progress.selectedMode = 'revise';
      learningPath.save();
      setActiveView('learning');
    }
  });
});

document.querySelectorAll('[data-indexing-answer]').forEach((button) => {
  button.addEventListener('click', () => {
    const correct = button.dataset.indexingAnswer === 'correct';
    qs('indexingCheckpointFeedback').textContent = correct
      ? 'Correct. Indexing is a decision process that depends on band evidence, geometry, phase choice, and confidence.'
      : 'Try again. Look for the answer that treats indexing as evidence-based rather than automatic truth.';
    const card = button.closest('.indexing-step-card');
    const cards = Array.from(document.querySelectorAll('.indexing-step-card'));
    indexingStudio.recordCheckpoint(cards.indexOf(card), correct);
  });
});

qs('reduceMotionButton').addEventListener('click', () => setReduceMotion(!reduceMotion));

document.querySelectorAll('.checkpoint-card [data-answer]').forEach((button) => {
  button.addEventListener('click', () => {
    const correct = button.dataset.answer === 'correct';
    qs('geometryQuizFeedback').textContent = correct
      ? 'Correct. Coherent diffraction from crystal planes is the key idea.'
      : 'Try again. Look for the answer that connects bands to crystal planes and Bragg diffraction.';
  });
});

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function slug(value) {
  return String(value || 'ebsd-resource').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ebsd-resource';
}

function downloadBlob(filename, content, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function downloadCanvas(canvas, filename) {
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, 'image/png');
}

function learningSnapshotCanvas() {
  const module = currentLearningModule();
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0b1117';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#62d7f0';
  ctx.font = '700 34px Segoe UI, Arial';
  ctx.fillText('EBSD Learning Studio', 54, 72);
  ctx.fillStyle = '#eef6f7';
  ctx.font = '700 46px Segoe UI, Arial';
  ctx.fillText(module.title, 54, 145);
  ctx.fillStyle = '#a9b9bd';
  ctx.font = '24px Segoe UI, Arial';
  wrapText(ctx, module.explanation, 54, 205, 1120, 34);
  ctx.fillStyle = '#e6b55a';
  ctx.font = '700 26px Segoe UI, Arial';
  ctx.fillText('Current learning focus', 54, 390);
  ctx.fillStyle = '#eef6f7';
  ctx.font = '22px Segoe UI, Arial';
  module.keyIdeas.slice(0, 5).forEach((idea, index) => ctx.fillText(`- ${idea}`, 78, 440 + index * 38));
  ctx.fillStyle = '#a9b9bd';
  ctx.font = '18px Segoe UI, Arial';
  ctx.fillText('Conceptual learning simulator, not validated EBSD software.', 54, 680);
  return canvas;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text).split(/\s+/);
  let line = '';
  words.forEach((word) => {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  });
  if (line) ctx.fillText(line, x, y);
}

function exportCurrentScreenshot() {
  if (activeView === 'geometry') {
    downloadCanvas(qs('detector'), 'ebsd-geometry-pattern.png');
  } else if (activeView === 'acquisition') {
    downloadCanvas(qs('scanMap'), 'ebsd-acquisition-map.png');
  } else if (activeView === 'interpretation') {
    downloadCanvas(qs('mapStudioCanvas'), 'ebsd-interpretation-map.png');
  } else {
    downloadCanvas(learningSnapshotCanvas(), 'ebsd-learning-path.png');
  }
  qs('explainTitle').textContent = 'Screenshot exported';
  qs('explainText').textContent = 'A PNG was generated from the current study canvas for offline use.';
}

function notesPlainText(progress = loadLearningProgress()) {
  const lines = ['EBSD Learning Studio Notes', 'Conceptual learning simulator, not validated EBSD software.', ''];
  learningModules.forEach((module) => {
    const note = String(progress.notes[module.id] || '').trim();
    const activities = Object.entries(progress.activityObservations || {}).filter(([key, value]) => key.startsWith(`${module.id}-`) && String(value).trim());
    if (!note && !activities.length && !progress.bookmarks.includes(module.id)) return;
    lines.push(`# ${module.title}`);
    if (progress.bookmarks.includes(module.id)) lines.push('Bookmarked: yes');
    if (note) lines.push(`Note: ${note}`);
    activities.forEach(([key, value]) => {
      lines.push(`Observation (${key}): ${String(value).trim()}`);
    });
    lines.push('');
  });
  return lines.join('\n');
}

function openNotesModal(focus = 'notes') {
  const progress = loadLearningProgress();
  const text = notesPlainText(progress);
  const hasContent = text.split('\n').length > 3;
  qs('notesContent').innerHTML = hasContent
    ? learningModules.map((module) => {
        const note = String(progress.notes[module.id] || '').trim();
        const bookmarked = progress.bookmarks.includes(module.id);
        const activities = Object.entries(progress.activityObservations || {}).filter(([key, value]) => key.startsWith(`${module.id}-`) && String(value).trim());
        if (!note && !activities.length && !bookmarked) return '';
        return `<section><h2>${escapeHtml(module.title)}</h2>${bookmarked ? '<p><b>Bookmarked.</b></p>' : ''}${note ? `<p>${escapeHtml(note)}</p>` : ''}${activities.map(([key, value]) => `<p><b>${escapeHtml(key)}:</b> ${escapeHtml(value)}</p>`).join('')}</section>`;
      }).join('')
    : '<p>No saved notes yet. Write module notes or activity observations in Learning Path and they will appear here.</p>';
  qs('notesPlainText').value = text;
  qs('notesModal').showModal();
  if (focus === 'bookmarks') qs('notesContent').scrollTop = 0;
}

function openGlossaryModal(query = '') {
  qs('topGlossarySearch').value = query;
  renderTopGlossary();
  qs('glossaryModal').showModal();
}

function renderTopGlossary() {
  const query = qs('topGlossarySearch').value.toLowerCase();
  const matches = glossaryTerms.filter((entry) => {
    return !query || entry.term.toLowerCase().includes(query) || entry.definition.toLowerCase().includes(query) || entry.related.join(' ').toLowerCase().includes(query);
  });
  qs('topGlossaryContent').innerHTML = (matches.length ? matches : glossaryTerms).map((entry) => `
    <article>
      <strong>${escapeHtml(entry.term)}</strong>
      <p>${escapeHtml(entry.definition)}</p>
      <small>Related: ${entry.related.map(escapeHtml).join(', ')}</small>
    </article>
  `).join('');
}

function currentLearningModule() {
  const saved = JSON.parse(localStorage.getItem('ebsdTeachingStudio.learningProgress.v1') || '{}');
  return learningModules.find((module) => module.id === saved.selectedModuleId) ?? learningModules[0];
}

function resourceMarkup(action) {
  const module = currentLearningModule();
  if (action === 'worksheet-view') {
    return {
      title: `Worksheet: ${module.title}`,
      body: `
        <section><h2>Learning objectives</h2><ul>${module.learningObjectives.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><h2>Key ideas</h2><ul>${module.keyIdeas.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul></section>
        <section><h2>Checkpoint questions</h2><ol>${module.quizQuestions.map((q) => `<li>${escapeHtml(q.question)}</li>`).join('')}</ol></section>
        <section><h2>Activity</h2><p>${escapeHtml(module.miniExperiments[0]?.text || module.whyItMatters)}</p><div class="print-box">Observation:</div><div class="print-box">Reflection:</div></section>
      `
    };
  }
  if (action === 'lesson-cards-view') {
    return {
      title: 'Lesson cards',
      body: learningModules.map((item) => `
        <article class="print-card"><h2>${escapeHtml(item.title)}</h2><p>${escapeHtml(item.explanation)}</p><p><b>Misconception:</b> ${escapeHtml(item.misconception)}</p></article>
      `).join('')
    };
  }
  if (action === 'formula-view') {
    return {
      title: 'Formula cheat sheet',
      body: `
        <section><h2>Bragg law</h2><p class="formula">${escapeHtml(formulaReference.bragg)}</p></section>
        <section><h2>Electron wavelength</h2><p class="formula">${escapeHtml(formulaReference.wavelength)}</p></section>
        <section><h2>Constants and notes</h2><ul>${formulaReference.constants.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</ul><p>${escapeHtml(formulaReference.notes)}</p></section>
      `
    };
  }
  if (action === 'practice-view') {
    return {
      title: 'Practice questions',
      body: learningModules.map((item) => `
        <section><h2>${escapeHtml(item.shortTitle || item.title)}</h2><ol>${item.quizQuestions.map((q) => `<li>${escapeHtml(q.question)}</li>`).join('')}</ol></section>
      `).join('')
    };
  }
  if (action === 'datasets-view') {
    return {
      title: 'Sample datasets and presets',
      body: `
        <section><h2>Local synthetic scan presets</h2><ul><li>Fast survey</li><li>Balanced</li><li>High quality slow scan</li><li>Noisy pattern</li><li>Saturated pattern</li><li>Drift-distorted map</li></ul></section>
        <section><h2>Real Kikuchi image folder</h2><p><code>public/kikuchi-patterns</code></p><p>Add local assets there, then update <code>src/data/kikuchiPatterns.js</code>.</p></section>
      `
    };
  }
  if (action === 'interpretation-guide-view') {
    return {
      title: 'Phase 3 interpretation guide',
      body: `
        <section><h2>Connected EBSD workflow</h2><ol>${learningPipeline.map(([title, text]) => `<li><b>${escapeHtml(title)}:</b> ${escapeHtml(text)}</li>`).join('')}</ol></section>
        <section><h2>Pattern-quality cases</h2><ul>${patternQualityCases.map((item) => `<li><b>${escapeHtml(item.title)}:</b> ${escapeHtml(item.indexingImpact)}</li>`).join('')}</ul></section>
        <section><h2>Troubleshooting prompts</h2><ul>${troubleshootingSymptoms.map((item) => `<li><b>${escapeHtml(item.label)}:</b> check acquisition, preparation, and geometry before trusting a map.</li>`).join('')}</ul></section>
        <section><h2>Scientific honesty</h2><p>These prompts are conceptual learning aids. They are not calibrated EBSD quantification, phase identification, crystallographic refinement, or research-grade map analysis.</p></section>
      `
    };
  }
  if (action === 'self-study-view') {
    return {
      title: 'Self-study guide',
      body: learningModules.map((item, index) => `
        <section><h2>${index + 1}. ${escapeHtml(item.title)}</h2><p><b>Time:</b> ${escapeHtml(item.estimatedTime)}</p><ul>${(item.reflectionPrompts || []).map((prompt) => `<li>${escapeHtml(prompt)}</li>`).join('')}</ul><p><b>Why it matters:</b> ${escapeHtml(item.whyItMatters)}</p></section>
      `).join('')
    };
  }
  if (action === 'all-modules-view') {
    return {
      title: 'Complete offline module pack',
      body: learningModules.map((item, index) => `
        <section>
          <h2>${index + 1}. ${escapeHtml(item.title)}</h2>
          <p>${escapeHtml(item.explanation)}</p>
          <p><b>Why this matters:</b> ${escapeHtml(item.whyItMatters)}</p>
          <p><b>Common mistake:</b> ${escapeHtml(item.misconception)}</p>
          <ul>${item.keyIdeas.map((idea) => `<li>${escapeHtml(idea)}</li>`).join('')}</ul>
        </section>
      `).join('')
    };
  }
  return {
    title: 'Offline EBSD learning export',
    body: '<p>Select a resource card to view, print, or export a local HTML handout.</p>'
  };
}

function openResource(action) {
  const resource = resourceMarkup(action);
  currentResourceAction = action;
  qs('resourceTitle').textContent = resource.title;
  qs('resourceContent').innerHTML = resource.body;
  qs('resourceModal').showModal();
  qs('explainTitle').textContent = 'Offline resource';
  qs('explainText').textContent = 'This resource is generated from local Learning Path content. It does not require internet access.';
}

function resourceDocument(resource) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(resource.title)}</title>
  <style>
    body { font-family: Segoe UI, Arial, sans-serif; max-width: 900px; margin: 32px auto; line-height: 1.5; color: #142027; }
    h1 { color: #0b5f73; }
    section, .print-card { break-inside: avoid; border: 1px solid #d8e4e6; border-radius: 8px; padding: 14px; margin: 12px 0; }
    .formula { font-family: Consolas, monospace; background: #eef7f8; padding: 10px; border-radius: 6px; }
    .print-box { min-height: 80px; border: 1px dashed #8ba4aa; border-radius: 6px; margin: 10px 0; padding: 8px; }
  </style>
</head>
<body>
  <h1>${escapeHtml(resource.title)}</h1>
  <p><b>EBSD Learning Studio:</b> conceptual learning simulator, not validated EBSD software.</p>
  ${resource.body}
</body>
</html>`;
}

function exportResource(action = currentResourceAction) {
  const resource = resourceMarkup(action);
  downloadBlob(`${slug(resource.title)}.html`, resourceDocument(resource), 'text/html');
  qs('explainTitle').textContent = 'Offline export ready';
  qs('explainText').textContent = `${resource.title} was exported as a local HTML handout.`;
}

document.querySelectorAll('[data-resource]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.resource;
    if (action === 'print') {
      const viewAction = button.closest('article')?.querySelector('[data-resource$="-view"]')?.dataset.resource;
      if (viewAction) openResource(viewAction);
      window.print();
      return;
    }
    openResource(action);
  });
});

document.querySelectorAll('[data-resource-export]').forEach((button) => {
  button.addEventListener('click', () => exportResource(button.dataset.resourceExport));
});

qs('printResource').addEventListener('click', () => window.print());
qs('resourceExportButton').addEventListener('click', () => exportResource(currentResourceAction));
qs('copyNotesButton').addEventListener('click', async () => {
  await navigator.clipboard.writeText(qs('notesPlainText').value);
  qs('explainTitle').textContent = 'Notes copied';
  qs('explainText').textContent = 'Saved Learning Path notes were copied as plain text.';
});
qs('exportNotesButton').addEventListener('click', () => {
  downloadBlob('ebsd-learning-notes.txt', qs('notesPlainText').value, 'text/plain');
});
qs('topGlossarySearch').addEventListener('input', renderTopGlossary);

const helpKey = 'ebsdTeachingStudio.helpDismissed.v1';
let helpInteractionStarted = false;

document.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape') return;
  const openDialogs = Array.from(document.querySelectorAll('dialog[open]'));
  if (!openDialogs.length) return;
  event.preventDefault();
  openDialogs.at(-1).close();
});

qs('helpButton').addEventListener('click', () => {
  helpInteractionStarted = true;
  if (!qs('helpOverlay').open) qs('helpOverlay').showModal();
});
qs('helpOverlay').addEventListener('close', () => {
  helpInteractionStarted = true;
});
qs('helpOverlay').addEventListener('cancel', () => {
  helpInteractionStarted = true;
});
qs('dontShowHelpAgain').addEventListener('change', (event) => {
  localStorage.setItem(helpKey, event.target.checked ? 'true' : 'false');
});
if (localStorage.getItem(helpKey) !== 'true') {
  window.setTimeout(() => {
    if (helpInteractionStarted || localStorage.getItem(helpKey) === 'true') return;
    if (document.querySelector('dialog[open]')) return;
    qs('helpOverlay').showModal();
  }, 900);
}

qs('nextStage').addEventListener('click', () => {
  state.stage = Math.min(6, state.stage + 1);
  qs('stage').value = state.stage;
  updateAll();
});

qs('prevStage').addEventListener('click', () => {
  state.stage = Math.max(1, state.stage - 1);
  qs('stage').value = state.stage;
  updateAll();
});

qs('playStage').addEventListener('click', () => {
  state.playing = !state.playing;
  updateAll();
});

function resize() {
  sceneView.resize();
  detector.draw();
  if (indexingMode === 'real') realIndexingLab.draw();
}

function setIndexingMode(mode) {
  indexingMode = mode === 'real' ? 'real' : 'concept';
  const isReal = indexingMode === 'real';
  qs('indexingConceptTab').classList.toggle('active', !isReal);
  qs('indexingRealTab').classList.toggle('active', isReal);
  qs('indexingConceptTab').setAttribute('aria-selected', String(!isReal));
  qs('indexingRealTab').setAttribute('aria-selected', String(isReal));
  qs('indexingConceptPanel').hidden = isReal;
  qs('indexingRealPanel').hidden = !isReal;
  if (isReal) requestAnimationFrame(() => realIndexingLab.draw());
}

window.addEventListener('resize', resize);

function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!reduceMotion) state.time += dt;

  if (state.playing && !reduceMotion) {
    playAccum += dt;
    if (playAccum > 2.3) {
      playAccum = 0;
      state.stage = state.stage >= 6 ? 1 : state.stage + 1;
      qs('stage').value = state.stage;
      updateAll();
    }
  }

  sceneView.update();
  if (!reduceMotion && state.showNoise && Math.floor(state.time * 10) !== Math.floor((state.time - dt) * 10)) {
    detector.draw();
  }
  if (!reduceMotion) acquisition.update(dt);
  if (!reduceMotion && activeView === 'acquisition' && Math.floor(state.time * 3) !== Math.floor((state.time - dt) * 3)) {
    updateAcquisitionReadouts();
  }
  sceneView.render();
  requestAnimationFrame(animate);
}

setControlLevel(controlLevel);
updateReduceMotionButton();
if (reduceMotion) {
  state.playing = false;
  state.acquisition.live = false;
  qs('liveAcquisition').checked = false;
}
renderScenarioSelect();
realIndexingLab.init();
resize();
updateAll();
acquisition.drawPatternPreview();
setActiveView('start');
requestAnimationFrame(animate);
