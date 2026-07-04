import {
  confidenceExamples,
  learningPipeline,
  mapActivities,
  mapModes,
  patternQualityCases,
  samplePrepScenarios,
  troubleshootingSymptoms
} from './phase3Data.js';

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function drawBasePattern(ctx, w, h, options = {}) {
  const {
    noise = 0.14,
    brightness = 0.9,
    contrast = 1,
    blur = 0,
    clipped = false,
    deformation = false,
    overlap = false
  } = options;
  const gradient = ctx.createRadialGradient(w * 0.48, h * 0.46, 8, w * 0.5, h * 0.52, w * 0.64);
  gradient.addColorStop(0, `rgba(${Math.round(86 * brightness)}, ${Math.round(100 * brightness)}, ${Math.round(104 * brightness)}, 1)`);
  gradient.addColorStop(0.52, `rgba(${Math.round(32 * brightness)}, ${Math.round(38 * brightness)}, ${Math.round(42 * brightness)}, 1)`);
  gradient.addColorStop(1, '#050709');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const bands = [
    [-0.52, h * 0.32, '#62d7f0', 22],
    [0.74, h * 0.08, '#92d46f', 19],
    [-1.25, h * 0.86, '#e6b55a', 17],
    [0.08, h * 0.54, '#e784ba', 15]
  ];
  if (overlap) bands.push([1.18, -h * 0.08, '#ae98e8', 16], [-0.18, h * 0.74, '#f49a62', 12]);
  bands.forEach(([slope, offset, color, width], index) => {
    const bandWidth = Math.max(4, width - blur * 4);
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.strokeStyle = color;
    ctx.globalAlpha = clamp(0.16 + contrast * 0.28 - blur * 0.02, 0.05, 0.62);
    ctx.lineWidth = bandWidth;
    ctx.beginPath();
    ctx.moveTo(0, offset + (deformation ? Math.sin(index) * 14 : 0));
    ctx.lineTo(w, offset + slope * w + (deformation ? Math.cos(index) * 24 : 0));
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.38)';
    ctx.globalAlpha = clamp(0.08 + contrast * 0.2, 0.04, 0.44);
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.moveTo(0, offset + 12);
    ctx.lineTo(w, offset + 12 + slope * w);
    ctx.stroke();
    ctx.restore();
  });

  if (clipped) {
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    for (let i = 0; i < 12; i += 1) {
      const x = (Math.sin(i * 37.7) * 0.5 + 0.5) * w;
      const y = (Math.sin(i * 19.3) * 0.5 + 0.5) * h;
      ctx.beginPath();
      ctx.arc(x, y, 12 + (i % 3) * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  ctx.save();
  const count = Math.round(360 * noise);
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  for (let i = 0; i < count; i += 1) {
    const x = (Math.sin(i * 78.233) * 0.5 + 0.5) * w;
    const y = (Math.sin(i * 41.771 + 1.7) * 0.5 + 0.5) * h;
    const size = noise > 0.45 ? 1.8 : 1;
    ctx.fillRect(x, y, size, size);
  }
  ctx.restore();
}

function drawCasePattern(ctx, w, h, kind) {
  const options = {
    excellent: { noise: 0.08, brightness: 1, contrast: 1.25 },
    noise: { noise: 0.62, brightness: 0.82, contrast: 0.82 },
    overexposed: { noise: 0.1, brightness: 1.35, contrast: 0.7, clipped: true },
    underexposed: { noise: 0.28, brightness: 0.45, contrast: 0.62 },
    charging: { noise: 0.32, brightness: 1.1, contrast: 0.7, deformation: true },
    deformation: { noise: 0.24, brightness: 0.84, contrast: 0.72, blur: 2.6, deformation: true },
    polishing: { noise: 0.26, brightness: 0.8, contrast: 0.65, blur: 1.8 },
    contamination: { noise: 0.2, brightness: 0.6, contrast: 0.52 },
    drift: { noise: 0.16, brightness: 0.9, contrast: 0.9, deformation: true },
    overlap: { noise: 0.2, brightness: 0.88, contrast: 0.9, overlap: true },
    lowContrast: { noise: 0.18, brightness: 0.82, contrast: 0.38 },
    pseudosymmetry: { noise: 0.14, brightness: 0.9, contrast: 0.86, overlap: true }
  }[kind] || {};
  drawBasePattern(ctx, w, h, options);

  ctx.save();
  if (kind === 'polishing') {
    ctx.strokeStyle = 'rgba(255,255,255,0.32)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 5; i += 1) {
      ctx.beginPath();
      ctx.moveTo(-20, h * (0.18 + i * 0.17));
      ctx.lineTo(w + 20, h * (0.02 + i * 0.17));
      ctx.stroke();
    }
  }
  if (kind === 'contamination') {
    ctx.fillStyle = 'rgba(18, 22, 20, 0.48)';
    ctx.fillRect(w * 0.18, h * 0.1, w * 0.62, h * 0.78);
  }
  if (kind === 'charging') {
    ctx.strokeStyle = 'rgba(238,96,116,0.6)';
    ctx.setLineDash([8, 7]);
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.12, h * 0.18);
    ctx.bezierCurveTo(w * 0.45, h * 0.1, w * 0.45, h * 0.88, w * 0.88, h * 0.76);
    ctx.stroke();
  }
  ctx.restore();
}

function drawPrepPair(ctx, w, h, scenario) {
  ctx.clearRect(0, 0, w, h);
  const gap = 18;
  const panelW = (w - gap) / 2;
  ctx.save();
  ctx.fillStyle = '#070a0d';
  ctx.fillRect(0, 0, w, h);
  ctx.translate(0, 0);
  drawBasePattern(ctx, panelW, h, { noise: 0.36, brightness: 0.68, contrast: 0.55, blur: 2.2, deformation: true });
  ctx.translate(panelW + gap, 0);
  drawBasePattern(ctx, panelW, h, { noise: 0.1, brightness: 0.96, contrast: 1.08, blur: 0.2 });
  ctx.restore();
  ctx.save();
  ctx.fillStyle = 'rgba(7,10,12,0.74)';
  ctx.fillRect(10, 10, panelW - 20, 52);
  ctx.fillRect(panelW + gap + 10, 10, panelW - 20, 52);
  ctx.fillStyle = '#ffe7b1';
  ctx.font = '700 13px Segoe UI, Arial';
  ctx.fillText('Before: poor prep', 22, 32);
  ctx.fillText('After: improved prep', panelW + gap + 22, 32);
  ctx.fillStyle = '#a9b9bd';
  ctx.font = '12px Segoe UI, Arial';
  ctx.fillText(scenario.before, 22, 51);
  ctx.fillText(scenario.after, panelW + gap + 22, 51);
  ctx.restore();
}

function grainColor(index, mode, quality = 1) {
  const ipf = [
    [92, 205, 232],
    [146, 212, 111],
    [231, 132, 186],
    [230, 181, 90],
    [174, 152, 232],
    [244, 154, 98]
  ][index % 6];
  if (mode === 'phase') return index === 4 ? [238, 96, 116] : [98, 215, 240];
  if (mode === 'bandContrast') {
    const v = Math.round(55 + quality * 170);
    return [v, v, Math.round(v * 0.9)];
  }
  if (mode === 'boundaries') return ipf.map((v) => Math.round(v * 0.68));
  if (mode === 'deformation') return [
    Math.round(ipf[0] * (0.75 + quality * 0.2)),
    Math.round(ipf[1] * (0.72 + quality * 0.25)),
    Math.round(ipf[2] * (0.82 + quality * 0.12))
  ];
  return ipf;
}

function drawConceptMap(ctx, w, h, mode, zoom = 1) {
  ctx.clearRect(0, 0, w, h);
  const cells = [
    { x: 0, y: 0, width: 0.34, height: 0.42, g: 0, q: 0.92 },
    { x: 0.34, y: 0, width: 0.28, height: 0.42, g: 1, q: 0.86 },
    { x: 0.62, y: 0, width: 0.38, height: 0.5, g: 2, q: 0.76 },
    { x: 0, y: 0.42, width: 0.44, height: 0.58, g: 3, q: 0.68 },
    { x: 0.44, y: 0.42, width: 0.28, height: 0.58, g: 4, q: 0.46 },
    { x: 0.72, y: 0.5, width: 0.28, height: 0.5, g: 5, q: 0.82 }
  ];
  ctx.save();
  const scale = zoom;
  ctx.translate((w - w * scale) / 2, (h - h * scale) / 2);
  ctx.scale(scale, scale);
  cells.forEach((cell) => {
    const [r, g, b] = grainColor(cell.g, mode, cell.q);
    ctx.fillStyle = `rgb(${r},${g},${b})`;
    ctx.fillRect(cell.x * w, cell.y * h, cell.width * w, cell.height * h);
  });

  if (mode === 'deformation' || mode === 'ipf') {
    const grad = ctx.createLinearGradient(w * 0.02, h * 0.62, w * 0.42, h * 0.98);
    grad.addColorStop(0, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(255,255,255,0.22)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, h * 0.42, w * 0.44, h * 0.58);
  }

  if (mode === 'bandContrast' || mode === 'deformation') {
    ctx.fillStyle = 'rgba(10,12,14,0.55)';
    ctx.fillRect(w * 0.44, h * 0.42, w * 0.28, h * 0.58);
    ctx.fillStyle = 'rgba(238,96,116,0.38)';
    for (let i = 0; i < 12; i += 1) ctx.fillRect(w * (0.46 + (i % 3) * 0.07), h * (0.48 + i * 0.037), w * 0.04, h * 0.018);
  }

  if (mode === 'phase') {
    ctx.fillStyle = 'rgba(238,96,116,0.78)';
    ctx.beginPath();
    ctx.ellipse(w * 0.56, h * 0.69, w * 0.09, h * 0.18, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.strokeStyle = mode === 'boundaries' ? 'rgba(255,255,255,0.9)' : 'rgba(8,10,12,0.55)';
  ctx.lineWidth = mode === 'boundaries' ? 3 : 2;
  cells.forEach((cell) => ctx.strokeRect(cell.x * w, cell.y * h, cell.width * w, cell.height * h));
  ctx.strokeStyle = 'rgba(255,231,177,0.88)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(w * 0.65, h * 0.08);
  ctx.lineTo(w * 0.95, h * 0.44);
  ctx.stroke();
  ctx.fillStyle = 'rgba(255,231,177,0.16)';
  ctx.fillRect(w * 0.66, h * 0.12, w * 0.26, h * 0.035);
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(7,10,12,0.72)';
  ctx.fillRect(14, 14, 220, 54);
  ctx.fillStyle = '#eef6f7';
  ctx.font = '700 14px Segoe UI, Arial';
  ctx.fillText(mapModes.find((item) => item.id === mode)?.label || 'Map', 28, 36);
  ctx.fillStyle = '#a9b9bd';
  ctx.font = '12px Segoe UI, Arial';
  ctx.fillText('schematic map, not measured data', 28, 56);
  ctx.restore();
}

export class InterpretationStudio {
  constructor({ root, onNavigate = () => {}, getReduceMotion = () => false }) {
    this.root = root;
    this.onNavigate = onNavigate;
    this.getReduceMotion = getReduceMotion;
    this.caseIndex = 0;
    this.prepIndex = 0;
    this.mapMode = 'ipf';
    this.mapZoom = 1;
    this.confidenceIndex = 0;
    this.symptomId = troubleshootingSymptoms[0].id;
    this.render();
  }

  render() {
    this.root.innerHTML = `
      <section class="interpretation-grid" aria-label="Conceptual EBSD interpretation and experimental understanding">
        <article class="interpretation-card pipeline-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Connected learning pipeline</span>
            <h3>From Sample Surface to Interpretation</h3>
            <p>Follow the conceptual chain from preparation through acquisition, pattern evidence, indexing, confidence-like cues, maps, interpretation, and troubleshooting.</p>
          </div>
          <div class="pipeline-strip">${learningPipeline.map(([title, text]) => `
            <button type="button" data-pipeline="${escapeHtml(title)}"><strong>${escapeHtml(title)}</strong><span>${escapeHtml(text)}</span></button>
          `).join('')}</div>
          <p id="pipelineFeedback" class="checkpoint-feedback" aria-live="polite">Start with sample preparation: if the surface is damaged, every later step becomes less trustworthy.</p>
        </article>

        <article class="interpretation-card acquisition-bridge-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Experimental bridge</span>
            <h3>Experimental Acquisition Explorer</h3>
            <p>Use the Acquisition tab to change voltage, probe current, working distance, detector distance, exposure, gain, binning, speed, and noise.</p>
          </div>
          <div class="bridge-actions">
            <button type="button" data-nav="acquisition">Open Acquisition Explorer</button>
            <button type="button" data-nav="indexing">Review Indexing Logic</button>
          </div>
          <p class="lab-note">The controls are educational approximations. They are not calibrated microscope, detector, or material simulations. If the geometry feels confusing, revisit Acquisition and Pattern Center in Indexing Studio.</p>
        </article>

        <article class="interpretation-card pattern-quality-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Educational overlay</span>
            <h3>Pattern Quality & Failure Analysis</h3>
            <p>Inspect curated conceptual cases and practice the diagnostic questions experienced EBSD users ask.</p>
          </div>
          <div class="case-layout">
            <canvas id="patternQualityCanvas" width="620" height="390" aria-label="Conceptual pattern quality case"></canvas>
            <div class="case-panel">
              <div id="patternQualityTabs" class="case-tabs"></div>
              <h4 id="patternCaseTitle"></h4>
              <p><b>What might the student see?</b> <span id="patternCaseWrong"></span></p>
              <p><b>Likely indexing effect:</b> <span id="patternCaseImpact"></span></p>
              <p><b>First checks / possible corrections:</b> <span id="patternCaseCorrections"></span></p>
            </div>
          </div>
        </article>

        <article class="interpretation-card sample-prep-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Near-surface sensitive</span>
            <h3>Sample Preparation Impact</h3>
            <p>Compare poor and improved preparation to see why near-surface condition controls EBSD pattern quality.</p>
          </div>
          <div class="case-layout">
            <canvas id="samplePrepCanvas" width="620" height="340" aria-label="Conceptual sample preparation before and after"></canvas>
            <div class="case-panel">
              <div id="prepTabs" class="case-tabs"></div>
              <h4 id="prepTitle"></h4>
              <p id="prepNote"></p>
              <p><b>Beginner mistake:</b> <span id="prepMistake"></span></p>
              <p class="lab-note">General preparation guidance only. Validate with pattern quality after prep rather than treating one symptom as a diagnosis.</p>
            </div>
          </div>
        </article>

        <article class="interpretation-card map-studio-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Schematic map analysis</span>
            <h3>Map Interpretation Studio</h3>
            <p>Compare IPF, phase-like, band contrast, boundary, and possible deformation views before deciding what the map may mean.</p>
          </div>
          <div class="map-studio-layout">
            <canvas id="mapStudioCanvas" width="760" height="470" aria-label="Conceptual EBSD map interpretation canvas"></canvas>
            <div class="map-controls">
              <label class="select-row"><span>Map view</span><select id="mapModeSelect" aria-label="Map interpretation view">
                ${mapModes.map((mode) => `<option value="${mode.id}">${escapeHtml(mode.label)}</option>`).join('')}
              </select></label>
              <label class="slider-row"><span>Zoom <output id="mapZoomValue">1.0x</output></span><input id="mapZoom" type="range" min="1" max="1.8" step="0.1" value="1" aria-label="Conceptual map zoom"></label>
              <p class="lab-note">These views are conceptual teaching overlays. They do not compute real grain size, phase fraction, KAM, GOS, HR-EBSD strain, or validated twin relationships.</p>
              <div class="map-activity-buttons">${mapActivities.map((activity) => `<button type="button" data-map-activity="${activity.id}">${escapeHtml(activity.label)}</button>`).join('')}</div>
              <section class="notice-panel">
                <strong>What should I notice?</strong>
                <p id="mapNotice"></p>
              </section>
              <p id="mapActivityFeedback" class="checkpoint-feedback" aria-live="polite"></p>
            </div>
          </div>
        </article>

        <article class="interpretation-card confidence-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Simplified scoring</span>
            <h3>Confidence-like / MAD / Fit Intuition</h3>
            <p>Compare candidate-strength cues without treating the numbers as proof of correctness.</p>
            <p class="lab-note">Confidence-like values are evidence cues, not proof of correctness. Their meaning depends on the indexing method and software.</p>
          </div>
          <div class="confidence-layout">
            <canvas id="confidenceCanvas" width="520" height="320" aria-label="Conceptual confidence-like and fit comparison"></canvas>
            <div>
              <div id="confidenceTabs" class="case-tabs"></div>
              <h4 id="confidenceTitle"></h4>
              <div id="confidenceScores" class="candidate-score-table"></div>
              <p id="confidenceLesson" class="lab-note"></p>
            </div>
          </div>
        </article>

        <article class="interpretation-card troubleshooting-card">
          <div class="lab-card-heading">
            <span class="fidelity-label">Guided troubleshooting</span>
            <h3>Why Is My Indexing Poor?</h3>
            <p>Select a symptom and compare possible acquisition, preparation, and geometry causes.</p>
          </div>
          <div class="troubleshooting-layout">
            <label class="select-row"><span>Symptom</span><select id="phase3TroubleshootSymptom" aria-label="Troubleshooting symptom">
              ${troubleshootingSymptoms.map((item) => `<option value="${item.id}">${escapeHtml(item.label)}</option>`).join('')}
            </select></label>
            <div id="troubleshootingResult" class="troubleshooting-result"></div>
          </div>
        </article>
      </section>
    `;
    this.bindEvents();
    this.updateAll();
  }

  bindEvents() {
    this.root.querySelectorAll('[data-pipeline]').forEach((button) => {
      button.addEventListener('click', () => {
        const item = learningPipeline.find(([title]) => title === button.dataset.pipeline);
        this.root.querySelector('#pipelineFeedback').textContent = item
          ? `${item[0]}: ${item[1]}`
          : 'Use the modules together rather than trusting one view alone.';
      });
    });
    this.root.querySelectorAll('[data-nav]').forEach((button) => {
      button.addEventListener('click', () => this.onNavigate(button.dataset.nav));
    });
    this.root.querySelector('#mapModeSelect').addEventListener('change', (event) => {
      this.mapMode = event.target.value;
      this.updateMapStudio();
    });
    this.root.querySelector('#mapZoom').addEventListener('input', (event) => {
      this.mapZoom = Number(event.target.value);
      this.updateMapStudio();
    });
    this.root.querySelectorAll('[data-map-activity]').forEach((button) => {
      button.addEventListener('click', () => {
        const activity = mapActivities.find((item) => item.id === button.dataset.mapActivity);
        this.root.querySelector('#mapActivityFeedback').textContent = activity?.feedback || '';
      });
    });
    this.root.querySelector('#phase3TroubleshootSymptom').addEventListener('change', (event) => {
      this.symptomId = event.target.value;
      this.updateTroubleshooting();
    });
  }

  updateAll() {
    this.updatePatternQuality();
    this.updateSamplePrep();
    this.updateMapStudio();
    this.updateConfidence();
    this.updateTroubleshooting();
  }

  updatePatternQuality() {
    this.root.querySelector('#patternQualityTabs').innerHTML = patternQualityCases.map((item, index) => `
      <button type="button" class="${index === this.caseIndex ? 'active' : ''}" data-case-index="${index}">
        <span>${index + 1}</span>${escapeHtml(item.tag)}
      </button>
    `).join('');
    this.root.querySelectorAll('[data-case-index]').forEach((button) => {
      button.addEventListener('click', () => {
        this.caseIndex = Number(button.dataset.caseIndex);
        this.updatePatternQuality();
      });
    });
    const item = patternQualityCases[this.caseIndex];
    this.root.querySelector('#patternCaseTitle').textContent = item.title;
    this.root.querySelector('#patternCaseWrong').textContent = item.wentWrong;
    this.root.querySelector('#patternCaseImpact').textContent = item.indexingImpact;
    this.root.querySelector('#patternCaseCorrections').textContent = item.corrections;
    const canvas = this.root.querySelector('#patternQualityCanvas');
    const ctx = canvas.getContext('2d');
    drawCasePattern(ctx, canvas.width, canvas.height, item.kind);
  }

  updateSamplePrep() {
    this.root.querySelector('#prepTabs').innerHTML = samplePrepScenarios.map((item, index) => `
      <button type="button" class="${index === this.prepIndex ? 'active' : ''}" data-prep-index="${index}">${escapeHtml(item.title)}</button>
    `).join('');
    this.root.querySelectorAll('[data-prep-index]').forEach((button) => {
      button.addEventListener('click', () => {
        this.prepIndex = Number(button.dataset.prepIndex);
        this.updateSamplePrep();
      });
    });
    const item = samplePrepScenarios[this.prepIndex];
    this.root.querySelector('#prepTitle').textContent = item.title;
    this.root.querySelector('#prepNote').textContent = item.note;
    this.root.querySelector('#prepMistake').textContent = item.mistake;
    const canvas = this.root.querySelector('#samplePrepCanvas');
    drawPrepPair(canvas.getContext('2d'), canvas.width, canvas.height, item);
  }

  updateMapStudio() {
    const mode = mapModes.find((item) => item.id === this.mapMode) || mapModes[0];
    this.root.querySelector('#mapNotice').textContent = `${mode.notice} ${mode.prompt}`;
    this.root.querySelector('#mapZoomValue').textContent = `${this.mapZoom.toFixed(1)}x`;
    const canvas = this.root.querySelector('#mapStudioCanvas');
    drawConceptMap(canvas.getContext('2d'), canvas.width, canvas.height, this.mapMode, this.mapZoom);
  }

  updateConfidence() {
    this.root.querySelector('#confidenceTabs').innerHTML = confidenceExamples.map((item, index) => `
      <button type="button" class="${index === this.confidenceIndex ? 'active' : ''}" data-confidence-index="${index}">${escapeHtml(item.title)}</button>
    `).join('');
    this.root.querySelectorAll('[data-confidence-index]').forEach((button) => {
      button.addEventListener('click', () => {
        this.confidenceIndex = Number(button.dataset.confidenceIndex);
        this.updateConfidence();
      });
    });
    const item = confidenceExamples[this.confidenceIndex];
    this.root.querySelector('#confidenceTitle').textContent = item.title;
    this.root.querySelector('#confidenceLesson').textContent = item.lesson;
    this.root.querySelector('#confidenceScores').innerHTML = item.candidates.map(([name, score, note], index) => `
      <div class="${index === 0 ? 'selected' : ''}">
        <strong>${escapeHtml(name)}</strong>
        <span>Relative schematic fit cue: ${score}/100</span>
        <b style="width:${score}%"></b>
        <small>${escapeHtml(note)}</small>
      </div>
    `).join('');
    const canvas = this.root.querySelector('#confidenceCanvas');
    const ctx = canvas.getContext('2d');
    drawBasePattern(ctx, canvas.width, canvas.height, {
      noise: item.id === 'noisy' ? 0.48 : 0.14,
      contrast: item.id === 'pseudo' ? 0.78 : 1,
      overlap: item.id === 'pseudo' || item.id === 'wrong-phase'
    });
  }

  updateTroubleshooting() {
    const item = troubleshootingSymptoms.find((symptom) => symptom.id === this.symptomId) || troubleshootingSymptoms[0];
    this.root.querySelector('#troubleshootingResult').innerHTML = `
      <section><strong>Possible causes</strong><ul>${item.causes.map((cause) => `<li>${escapeHtml(cause)}</li>`).join('')}</ul></section>
      <section><strong>First acquisition checks</strong><p>${escapeHtml(item.acquisition)}</p></section>
      <section><strong>Preparation checks</strong><p>${escapeHtml(item.preparation)}</p></section>
      <section><strong>Geometry/calibration checks</strong><p>${escapeHtml(item.geometry)}</p></section>
    `;
  }
}
