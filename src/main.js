import './styles.css';
import { AcquisitionRenderer } from './acquisition.js';
import { DetectorRenderer, detectorCaption } from './detector.js';
import { LearningPath } from './learningPath.js';
import { EbsdScene } from './scene.js';
import { braggThetaDeg, electronWavelengthPm, planes, stages, state } from './state.js';

const qs = (id) => document.getElementById(id);
const sceneView = new EbsdScene(qs('scene'));
const detector = new DetectorRenderer(qs('detector'), qs('detectorInset'));
const acquisition = new AcquisitionRenderer(qs('scanMap'), qs('patternPreview'));
const learningPath = new LearningPath({
  moduleList: qs('moduleList'),
  lessonWorkspace: qs('lessonWorkspace'),
  miniGlossary: qs('miniGlossary'),
  formulaPanel: qs('formulaPanel'),
  onExperiment: handleLearningExperiment
});

let playAccum = 0;
let last = performance.now();
let activeView = 'geometry';

function deg(value) {
  return `${value} deg`;
}

function updateReadouts() {
  qs('tiltValue').textContent = deg(state.tilt);
  qs('annSample').textContent = `Sample surface: ${state.tilt} deg from -X axis`;
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
  qs('thetaValue').textContent = `${theta.toFixed(2)} deg`;
  qs('bandValue').textContent = `${(2 * theta).toFixed(2)} deg`;
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
  qs('gainValue').textContent = `${state.acquisition.gain.toFixed(1)}x`;
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
  qs('scanMode').textContent = state.acquisition.mapMode;
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
    qs('coachText').textContent = 'The scan is fast but weak. Increase exposure, beam current, binning, or averaging and watch the confidence map stabilize.';
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
  if (!state.acquisition.autoIndex) {
    return 'Auto-indexing is paused. This is useful for teaching: students can see that pattern formation and indexing are separate steps in the EBSD workflow.';
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
    return 'Short exposure scans quickly, but each pixel gets fewer electrons. The map becomes lively and fast, with noisy colors and weaker pattern confidence.';
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

function setAcquisitionPreset(values) {
  Object.assign(state.acquisition, values);
  qs('gain').value = state.acquisition.gain;
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

function setActiveView(view) {
  activeView = view;
  const isGeometry = view === 'geometry';
  const isAcquisition = view === 'acquisition';
  const isLearning = view === 'learning';
  qs('geometryView').classList.toggle('active', isGeometry);
  qs('acquisitionView').classList.toggle('active', isAcquisition);
  qs('learningView').classList.toggle('active', isLearning);
  qs('tabGeometry').classList.toggle('active', isGeometry);
  qs('tabAcquisition').classList.toggle('active', isAcquisition);
  qs('tabLearning').classList.toggle('active', isLearning);
  qs('geometryLegend').classList.toggle('hidden', !isGeometry);
  qs('tabGeometry').setAttribute('aria-selected', String(isGeometry));
  qs('tabAcquisition').setAttribute('aria-selected', String(isAcquisition));
  qs('tabLearning').setAttribute('aria-selected', String(isLearning));
  if (isGeometry) {
    resize();
    updateReadouts();
  } else if (isAcquisition) {
    qs('explainTitle').textContent = 'Live Scan Acquisition';
    qs('explainText').textContent = 'Gain, binning, exposure, beam current, and averaging trade speed, noise, saturation, and spatial resolution. The scan view is schematic but designed to make those trade-offs visible.';
    updateAcquisitionReadouts();
  } else {
    qs('explainTitle').textContent = 'Learning Path';
    qs('explainText').textContent = 'A complete offline curriculum: geometry, scattering, Bragg diffraction, Kikuchi bands, detector calibration, indexing, and acquisition troubleshooting.';
    learningPath.render();
  }
}

function handleLearningExperiment(action) {
  const showInstruction = (title, text) => {
    qs('explainTitle').textContent = title;
    qs('explainText').textContent = text;
  };

  if (action === 'geometry-stage-1') {
    setActiveView('geometry');
    state.stage = 1;
    qs('stage').value = state.stage;
    updateAll();
    showInstruction('Geometry demo', 'Step through the guided stages and ask what each visual element represents.');
    return;
  }
  if (action === 'geometry-stage-2') {
    setActiveView('geometry');
    state.stage = 2;
    qs('stage').value = state.stage;
    updateAll();
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
    showInstruction('Cone formation demo', 'Bragg cones are magnified here so students can see how detector bands originate.');
    return;
  }
  if (action === 'geometry-stage-6') {
    setActiveView('geometry');
    state.stage = 6;
    qs('stage').value = state.stage;
    updateAll();
    showInstruction('Full pattern demo', 'Rotate crystal Z and watch the band network move across the detector.');
    return;
  }
  if (action === 'geometry-detector-demo') {
    setActiveView('geometry');
    state.stage = 5;
    qs('stage').value = state.stage;
    updateAll();
    showInstruction('Detector geometry demo', 'Adjust detector distance and height, then watch cone intersections shift.');
    return;
  }

  const acquisitionActions = {
    'open-acquisition-balanced': { gain: 1.2, binning: 2, exposureMs: 28, beamCurrent: 55, frameAverage: 2, scanSpeed: 1.0, stepSize: 0.25, drift: 0, bandDetection: 65, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'none', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true },
    'acquisition-compare-quality': { gain: 1.0, binning: 2, exposureMs: 80, beamCurrent: 60, frameAverage: 5, scanSpeed: 0.55, stepSize: 0.12, drift: 5, bandDetection: 58, indexingThreshold: 55, indexingMode: 'dictionary', qualityOverlay: 'confidence', mapUpdate: 'line', autoIndex: true, confirmLowConfidence: true, backgroundCorrection: true },
    'acquisition-map-views': { gain: 1.2, binning: 2, exposureMs: 28, beamCurrent: 55, frameAverage: 2, scanSpeed: 1.0, stepSize: 0.25, drift: 0, bandDetection: 65, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'confidence', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true },
    'acquisition-noisy': { gain: 1.4, binning: 1, exposureMs: 6, beamCurrent: 25, frameAverage: 1, scanSpeed: 1.7, stepSize: 0.35, drift: 0, bandDetection: 55, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'unindexed', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true },
    'acquisition-clipping': { gain: 2.8, binning: 1, exposureMs: 22, beamCurrent: 95, frameAverage: 1, scanSpeed: 1.1, stepSize: 0.25, drift: 0, bandDetection: 80, indexingThreshold: 52, indexingMode: 'hough', qualityOverlay: 'confidence', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: false },
    'acquisition-drift': { gain: 1.1, binning: 2, exposureMs: 42, beamCurrent: 55, frameAverage: 3, scanSpeed: 0.75, stepSize: 0.25, drift: 55, bandDetection: 65, indexingThreshold: 45, indexingMode: 'hough', qualityOverlay: 'boundaries', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true }
  };

  if (acquisitionActions[action]) {
    setActiveView('acquisition');
    setAcquisitionPreset(acquisitionActions[action]);
    if (action === 'acquisition-map-views') setMapMode('confidence');
    showInstruction('Acquisition demo', 'The Learning Path applied a local preset. Compare the pattern preview, map, and coach warning.');
  }
}

bindAcquisitionRange('gain', 'gain', Number);
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

['indexingMode', 'qualityOverlay', 'mapUpdate'].forEach((id) => {
  qs(id).addEventListener('change', (event) => {
    state.acquisition[id] = event.target.value;
    acquisition.reset();
    acquisition.drawPatternPreview();
    updateAcquisitionReadouts();
  });
});

qs('tabGeometry').addEventListener('click', () => setActiveView('geometry'));
qs('tabAcquisition').addEventListener('click', () => setActiveView('acquisition'));
qs('tabLearning').addEventListener('click', () => setActiveView('learning'));
qs('resetScan').addEventListener('click', () => {
  acquisition.reset();
  updateAcquisitionReadouts();
});
qs('presetFast').addEventListener('click', () => setAcquisitionPreset({ gain: 1.8, binning: 4, exposureMs: 10, beamCurrent: 70, frameAverage: 1, scanSpeed: 1.8, stepSize: 0.55, drift: 8, bandDetection: 72, indexingThreshold: 36, indexingMode: 'hough', qualityOverlay: 'none', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true }));
qs('presetBalanced').addEventListener('click', () => setAcquisitionPreset({ gain: 1.2, binning: 2, exposureMs: 28, beamCurrent: 55, frameAverage: 2, scanSpeed: 1.0, stepSize: 0.25, drift: 0, bandDetection: 65, indexingThreshold: 42, indexingMode: 'hough', qualityOverlay: 'none', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: true }));
qs('presetHighQuality').addEventListener('click', () => setAcquisitionPreset({ gain: 1.0, binning: 2, exposureMs: 80, beamCurrent: 60, frameAverage: 5, scanSpeed: 0.55, stepSize: 0.12, drift: 5, bandDetection: 58, indexingThreshold: 55, indexingMode: 'dictionary', qualityOverlay: 'confidence', mapUpdate: 'line', autoIndex: true, confirmLowConfidence: true, backgroundCorrection: true }));
qs('presetBadSetup').addEventListener('click', () => setAcquisitionPreset({ gain: 2.8, binning: 1, exposureMs: 6, beamCurrent: 95, frameAverage: 1, scanSpeed: 1.6, stepSize: 0.8, drift: 45, bandDetection: 95, indexingThreshold: 68, indexingMode: 'hough', qualityOverlay: 'unindexed', mapUpdate: 'live', autoIndex: true, confirmLowConfidence: false, backgroundCorrection: false }));
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

['notesButton', 'screenshotButton', 'exportButton', 'glossaryButton', 'downloadModules'].forEach((id) => {
  qs(id).addEventListener('click', () => {
    qs('explainTitle').textContent = 'Offline classroom tool';
    qs('explainText').textContent = 'This button is a local placeholder for classroom workflows. It does not call a cloud service or require internet access.';
  });
});

document.querySelectorAll('.checkpoint-card [data-answer]').forEach((button) => {
  button.addEventListener('click', () => {
    const correct = button.dataset.answer === 'correct';
    qs('geometryQuizFeedback').textContent = correct
      ? 'Correct. Coherent diffraction from crystal planes is the key idea.'
      : 'Try again. Look for the answer that connects bands to crystal planes and Bragg diffraction.';
  });
});

document.querySelectorAll('[data-resource]').forEach((button) => {
  button.addEventListener('click', () => {
    const action = button.dataset.resource;
    if (action === 'print') {
      window.print();
      return;
    }
    qs('explainTitle').textContent = 'Offline resource';
    qs('explainText').textContent = action === 'export-placeholder'
      ? 'Export is a local-only placeholder for now. Use Print for a simple offline handout workflow.'
      : 'This resource is generated from local teaching content in the Learning Path. It does not require internet access.';
  });
});

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
}

window.addEventListener('resize', resize);

function animate(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  state.time += dt;

  if (state.playing) {
    playAccum += dt;
    if (playAccum > 2.3) {
      playAccum = 0;
      state.stage = state.stage >= 6 ? 1 : state.stage + 1;
      qs('stage').value = state.stage;
      updateAll();
    }
  }

  sceneView.update();
  if (state.showNoise && Math.floor(state.time * 10) !== Math.floor((state.time - dt) * 10)) {
    detector.draw();
  }
  acquisition.update(dt);
  if (activeView === 'acquisition' && Math.floor(state.time * 3) !== Math.floor((state.time - dt) * 3)) {
    updateAcquisitionReadouts();
  }
  sceneView.render();
  requestAnimationFrame(animate);
}

resize();
updateAll();
acquisition.drawPatternPreview();
requestAnimationFrame(animate);
