import './styles.css';
import { DetectorRenderer, detectorCaption } from './detector.js';
import { EbsdScene } from './scene.js';
import { braggThetaDeg, electronWavelengthPm, planes, stages, state } from './state.js';

const qs = (id) => document.getElementById(id);
const sceneView = new EbsdScene(qs('scene'));
const detector = new DetectorRenderer(qs('detector'));

let playAccum = 0;
let last = performance.now();

function deg(value) {
  return `${value} deg`;
}

function updateReadouts() {
  qs('tiltValue').textContent = deg(state.tilt);
  qs('distanceValue').textContent = state.distance.toFixed(1);
  qs('voltageValue').textContent = `${state.voltage} kV`;
  qs('rxValue').textContent = deg(state.rx);
  qs('ryValue').textContent = deg(state.ry);
  qs('rzValue').textContent = deg(state.rz);
  qs('stageValue').textContent = `${state.stage} / 6`;

  const lambda = electronWavelengthPm(state.voltage);
  const theta = braggThetaDeg(state.voltage, planes[0].d);
  qs('lambdaValue').textContent = `${lambda.toFixed(2)} pm`;
  qs('thetaValue').textContent = `${theta.toFixed(2)} deg`;
  qs('bandValue').textContent = `${(2 * theta).toFixed(2)} deg`;
  qs('modeValue').textContent = state.stage === 6 ? 'All visible' : `Stage ${state.stage}`;

  const stage = stages[state.stage - 1];
  qs('explainTitle').textContent = stage.title;
  qs('explainText').textContent = stage.text;
  qs('patternCaption').textContent = detectorCaption();
  qs('playStage').textContent = state.playing ? 'Pause' : 'Play';
}

function updateAll() {
  updateReadouts();
  sceneView.update();
  detector.draw();
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

['tilt', 'distance', 'voltage', 'rx', 'ry', 'rz', 'stage'].forEach((id) => bindRange(id, id, Number));
['showCones', 'showPlanes', 'showLabels', 'showNoise'].forEach((id) => bindCheck(id, id));

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
  sceneView.render();
  requestAnimationFrame(animate);
}

resize();
updateAll();
requestAnimationFrame(animate);
