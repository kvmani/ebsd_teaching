const DATA_URL = '/teaching-data/da-ni/da_indexing_examples.json';
const BACKEND_URL = 'http://127.0.0.1:8765';

const STAGES = [
  {
    id: 'raw',
    title: 'Raw Ni EBSP',
    tag: '1. Raw detector evidence',
    image: 'rawImage',
    overlay: 'none',
    key: 'Start with the unprocessed experimental pattern. Students should first judge whether band contrast is actually present before trusting any indexing result.',
    math: 'No Hough or crystallography is used yet. This is the measured detector intensity from DA.oh5.'
  },
  {
    id: 'corrected',
    title: 'Background correction',
    tag: '2. Pattern correction',
    image: 'correctedImage',
    overlay: 'none',
    key: 'A smooth background is reduced so line-like Kikuchi bands carry more visual weight. The correction is for contrast, not a change of phase or orientation.',
    math: 'Teaching correction: subtract a blurred background and normalize intensity for display.'
  },
  {
    id: 'hough',
    title: 'Hough / Radon transform',
    tag: '3. Voting space',
    hough: true,
    overlay: 'none',
    key: 'Each bright spot in Hough space is evidence for a line-like band in the corrected pattern. The accumulator is grayscale so intensity is read as evidence, not decoration.',
    math: 'A line is parameterized by rho and theta. PyEBSDIndex stores the selected peak coordinates in this Hough/Radon space.'
  },
  {
    id: 'peaks',
    title: 'Peak selection',
    tag: '4. Select Hough peaks',
    hough: true,
    overlay: 'selected',
    key: 'Click a peak in Hough space. The nearest selected PyEBSDIndex peak is highlighted and the corresponding band centerline appears on the pattern.',
    math: 'Selected peak: (theta_Hough, rho_Hough). Display line: theta_line = 180 - theta_Hough and rho_line = -rho_Hough.'
  },
  {
    id: 'overlay',
    title: 'Peaks projected onto pattern',
    tag: '5. Hough peak to band line',
    image: 'correctedImage',
    overlay: 'all',
    key: 'The accepted Hough peaks are projected back as band centerlines. This is the visual audit stage: the selected lines must be compared against real Kikuchi bands.',
    math: 'PyEBSDIndex converts peaks with a bottom-left detector origin; on the canvas the projected line is (x - cx) cos(theta) - (y - cy) sin(theta) = rho.'
  },
  {
    id: 'angles',
    title: 'Angle measurements',
    tag: '6. Band geometry',
    image: 'correctedImage',
    overlay: 'all',
    key: 'Indexing uses angular relationships between detected bands, not just brightness. The same selected lines become geometric constraints.',
    math: 'The table reports 3D angles between detected band normals using the same PC convention as the solver.'
  },
  {
    id: 'lookup',
    title: 'Ni lookup and hkl assignment',
    tag: '7. Candidate planes to indexed bands',
    image: 'correctedImage',
    overlay: 'indexed',
    key: 'The solver compares measured band geometry against the Ni FCC reflector families, then assigns hkl labels only after a consistent orientation is found.',
    math: 'Ni FCC, SG 225, a = 3.5236 Angstrom. Reflections use the FCC all-odd/all-even rule; residuals are measured against the accepted indexed hkl pairs.'
  },
  {
    id: 'orientation',
    title: 'Orientation solution',
    tag: '8. Crystal to sample frame',
    image: 'correctedImage',
    overlay: 'indexed',
    key: 'After hkl assignment, the orientation matrix maps crystal-frame plane normals into the sample frame. This is the final indexed orientation.',
    math: 'g maps crystal Cartesian vectors into sample-frame vectors; Euler angles are Bunge ZXZ as returned by orix/kikuchipy.'
  }
];

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function lineAngleDeg(line) {
  return (Math.atan2(line.y1 - line.y0, line.x1 - line.x0) * 180 / Math.PI + 180) % 180;
}

function angleDifferenceDeg(a, b) {
  const diff = Math.abs(a - b) % 180;
  return Math.min(diff, 180 - diff);
}

function acuteHklAngleDeg(firstHkl = [], secondHkl = []) {
  if (firstHkl.length < 3 || secondHkl.length < 3) return null;
  const dot = firstHkl[0] * secondHkl[0] + firstHkl[1] * secondHkl[1] + firstHkl[2] * secondHkl[2];
  const firstNorm = Math.hypot(firstHkl[0], firstHkl[1], firstHkl[2]);
  const secondNorm = Math.hypot(secondHkl[0], secondHkl[1], secondHkl[2]);
  if (!firstNorm || !secondNorm) return null;
  const cosine = clamp(dot / (firstNorm * secondNorm), -1, 1);
  const angle = Math.acos(cosine) * 180 / Math.PI;
  return Math.min(angle, 180 - angle);
}

function acuteVectorAngleDeg(firstVector = [], secondVector = []) {
  if (firstVector.length < 3 || secondVector.length < 3) return null;
  const dot = firstVector[0] * secondVector[0] + firstVector[1] * secondVector[1] + firstVector[2] * secondVector[2];
  const firstNorm = Math.hypot(firstVector[0], firstVector[1], firstVector[2]);
  const secondNorm = Math.hypot(secondVector[0], secondVector[1], secondVector[2]);
  if (!firstNorm || !secondNorm) return null;
  const cosine = clamp(Math.abs(dot / (firstNorm * secondNorm)), -1, 1);
  return Math.acos(cosine) * 180 / Math.PI;
}

export class RealIndexingLab {
  constructor({ root }) {
    this.root = root;
    this.data = null;
    this.currentIndex = 0;
    this.stageIndex = 0;
    this.selectedPeakIndex = 0;
    this.rawImage = null;
    this.correctedImage = null;
    this.currentSolution = null;
    this.backendReady = false;
    this.loading = false;
    this.eventsBound = false;
    this.pc = [0.547, 0.711, 0.696];
  }

  async init() {
    if (!this.root) return;
    this.root.innerHTML = this.loadingMarkup();
    try {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`Could not load ${DATA_URL}`);
      this.data = await response.json();
      this.pc = [...this.data.metadata.pc];
      this.currentSolution = this.data.examples[0]?.summary || null;
      await this.checkBackend();
      this.render();
      this.loadCurrentImages();
    } catch (error) {
      this.root.innerHTML = `
        <section class="real-indexing-lab indexing-lab-card">
          <div class="lab-card-heading">
            <h3>Real Ni indexing lab</h3>
            <p>Generated DA teaching data is not available yet. Run <code>python scripts/extract_da_indexing_examples.py</code>.</p>
          </div>
          <p class="lab-note">${escapeHtml(error.message)}</p>
        </section>
      `;
    }
  }

  loadingMarkup() {
    return `
      <section class="real-indexing-lab indexing-lab-card">
        <div class="lab-card-heading">
          <h3>Real Ni indexing lab</h3>
          <p>Loading local DA Ni pattern examples.</p>
        </div>
      </section>
    `;
  }

  async checkBackend() {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, { signal: AbortSignal.timeout?.(1200) });
      this.backendReady = response.ok;
    } catch {
      this.backendReady = false;
    }
  }

  currentExample() {
    return this.data.examples[this.currentIndex] || this.data.examples[0];
  }

  currentStage() {
    return STAGES[this.stageIndex] || STAGES[0];
  }

  render() {
    const example = this.currentExample();
    const metadata = this.data.metadata;
    const solution = this.currentSolution || example.summary || {};
    const stage = this.currentStage();
    this.root.innerHTML = `
      <section class="real-indexing-lab indexing-lab-card">
        <div class="lab-card-heading">
          <span class="fidelity-label">Real DA Ni data</span>
          <h3>Worked Ni EBSD Indexing Example</h3>
          <p>Step through a real Ni pattern from raw EBSP to corrected image, Hough/Radon transform, peak selection, band projection, phase lookup, hkl assignment, and orientation matrix.</p>
        </div>

        <div class="real-stage-topbar">
          <label class="select-row">
            <span>Pattern</span>
            <select id="realIndexingPattern">
              ${this.data.examples.map((item, index) => `<option value="${index}" ${index === this.currentIndex ? 'selected' : ''}>${escapeHtml(item.id)} / DA index ${item.patternIndex}</option>`).join('')}
            </select>
          </label>
          <div class="real-stage-actions">
            <button id="realStagePrev" type="button" ${this.stageIndex === 0 ? 'disabled' : ''}>Previous</button>
            <button id="realStageNext" type="button" ${this.stageIndex === STAGES.length - 1 ? 'disabled' : ''}>Next</button>
          </div>
        </div>

        <div class="real-stage-strip" aria-label="Real indexing stages">
          ${STAGES.map((item, index) => `
            <button class="${index === this.stageIndex ? 'active' : ''}" data-real-stage="${index}" type="button">
              <b>${index + 1}</b><span>${escapeHtml(item.title)}</span>
            </button>
          `).join('')}
        </div>

        <div class="real-stage-grid">
          <div class="real-stage-visual">
            <div class="real-stage-canvas-grid ${stage.hough ? 'with-hough' : ''}">
              <figure class="real-canvas-frame">
                <canvas id="realIndexingCanvas" width="760" height="760" aria-label="Real EBSD pattern indexing canvas"></canvas>
                <figcaption>${escapeHtml(stage.overlay === 'none' ? stage.title : 'Pattern-space line projection')}</figcaption>
              </figure>
              ${stage.hough ? `
                <figure class="real-canvas-frame">
                  <canvas id="realHoughCanvas" width="760" height="520" aria-label="Clickable Hough transform canvas"></canvas>
                  <figcaption>Clickable grayscale Hough space: theta versus rho</figcaption>
                </figure>
              ` : ''}
            </div>
            <div class="real-stage-controls">
              <button id="clearSelectedPeak" type="button">Clear selected peak</button>
              <button id="useBaselineSolution" type="button">Use saved result</button>
              <button id="solveWithBackend" type="button">Re-index with PC</button>
            </div>
          </div>

          <aside class="real-stage-readout">
            <span class="fidelity-label">${escapeHtml(stage.tag)}</span>
            <h4>${escapeHtml(stage.title)}</h4>
            <p>${escapeHtml(stage.key)}</p>
            <div class="stage-math-note">${escapeHtml(stage.math)}</div>
            ${this.stageSpecificMarkup(stage, solution, metadata)}
            <div class="real-indexing-status ${this.backendReady ? 'ready' : 'offline'}">
              <b>${this.backendReady ? 'Python backend ready' : 'Python backend offline'}</b>
              <span>${this.backendReady ? 'Optional PC changes can be sent to kikuchipy.' : 'Offline worked example is loaded. Start python python_backend/server.py for live PC re-indexing.'}</span>
            </div>
          </aside>
          ${stage.id === 'lookup' ? this.lookupAssignmentTables(solution.validDetectedBands || []) : ''}
        </div>
      </section>
    `;
    this.bind();
  }

  stageSpecificMarkup(stage, solution, metadata) {
    if (stage.id === 'raw') return this.rawReadout(metadata, solution);
    if (stage.id === 'corrected') return this.correctionReadout();
    if (stage.id === 'hough' || stage.id === 'peaks') return this.houghReadout(solution);
    if (stage.id === 'overlay') return this.indexingEvidenceTable(solution.validDetectedBands || [], { showAssignments: false });
    if (stage.id === 'angles') return this.angleTable(solution.validDetectedBands || []);
    if (stage.id === 'lookup') return this.phaseLookupTable(metadata.phase?.lookupTable || [], metadata.phase);
    if (stage.id === 'orientation') return this.orientationMarkup(solution);
    return '';
  }

  rawReadout(metadata, solution) {
    return `
      <div class="stage-fact-grid">
        ${this.metric('Scan grid', `${metadata.grid.rows} x ${metadata.grid.columns}`)}
        ${this.metric('Pattern size', `${metadata.patternShape.width} x ${metadata.patternShape.height}`)}
        ${this.metric('OH5 index', solution.patternIndex ?? '-')}
        ${this.metric('Phase model', `${metadata.phase.name} SG ${metadata.phase.spaceGroup}`)}
      </div>
    `;
  }

  correctionReadout() {
    return `
      <div class="stage-math-note">
        In this teaching extraction, correction is deliberately simple: a blurred background is subtracted and the image is normalized. This makes the band evidence easier to see without claiming a proprietary correction model.
      </div>
    `;
  }

  houghReadout(solution) {
    const bands = solution.validDetectedBands || [];
    const selected = bands[this.selectedPeakIndex] || bands[0] || {};
    return `
      <div class="selected-peak-readout">
        <strong>Selected peak ${this.selectedPeakIndex + 1}</strong>
        <span>theta_Hough = ${this.formatNumber(selected.houghPeakThetaDeg, 2)} deg</span>
        <span>rho_Hough = ${this.formatNumber(selected.houghPeakRhoPx, 2)} px</span>
        <span>maxloc = [${(selected.houghMaxLocationIndex || []).map((value) => this.formatNumber(value, 1)).join(', ')}]</span>
        <span>hkl assignment is intentionally withheld until the lookup/indexing stage.</span>
      </div>
      ${this.indexingEvidenceTable(bands, { showAssignments: false })}
    `;
  }

  orientationMarkup(solution) {
    return `
      <div class="stage-fact-grid">
        ${this.metric('Mean angular fit', `${this.formatNumber(solution.fit, 3)} deg`)}
        ${this.metric('Confidence', this.formatNumber(solution.confidence, 3))}
        ${this.metric('Matched bands', solution.nmatch ?? '-')}
        ${this.metric('(phi1, Phi, phi2)', this.formatEuler(solution.eulerDeg))}
      </div>
      <div class="scientific-readout">
        <strong>PC = (PCx, PCy, DD)</strong>
        <code>${this.formatPc(solution.solverPc || solution.pc || this.data.metadata.pc)}</code>
        <span>${escapeHtml(solution.solverPcConvention || '')}</span>
        <strong>Orientation matrix g</strong>
        ${this.matrixMarkup(solution.orientationMatrixG)}
        <span>${escapeHtml(solution.orientationMatrixDefinition || '')}</span>
      </div>
      <div class="band-vector-table">
        <strong>Plane normals transformed into sample frame</strong>
        ${this.bandVectorTable(solution.validDetectedBands || [])}
      </div>
    `;
  }

  metric(label, value) {
    return `<div class="metric"><b>${escapeHtml(value)}</b><span>${escapeHtml(label)}</span></div>`;
  }

  formatNumber(value, digits) {
    return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : '-';
  }

  formatEuler(values) {
    if (!Array.isArray(values)) return '-';
    return values.map((value) => Number(value).toFixed(1)).join(', ');
  }

  formatPc(values) {
    if (!Array.isArray(values)) return 'PC unavailable';
    const labels = ['PCx', 'PCy', 'DD'];
    return values.map((value, index) => `${labels[index]}=${Number(value).toFixed(6)}`).join(', ');
  }

  matrixMarkup(matrix) {
    if (!Array.isArray(matrix)) return '<code>g unavailable</code>';
    return `
      <table class="matrix-table" aria-label="orientation matrix g">
        <tbody>${matrix.map((row) => `<tr>${row.map((value) => `<td>${Number(value).toFixed(6)}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    `;
  }

  indexingEvidenceTable(bands, options = {}) {
    const showAssignments = options.showAssignments !== false;
    const rows = bands.slice(0, 8).map((band, index) => `
      <tr class="${index === this.selectedPeakIndex ? 'selected-row' : ''}">
        <td>${index + 1}</td>
        <td>${this.formatNumber(band.houghPeakThetaDeg, 2)}</td>
        <td>${this.formatNumber(band.houghPeakRhoPx, 2)}</td>
        <td>[${(band.houghMaxLocationIndex || []).map((value) => this.formatNumber(value, 1)).join(', ')}]</td>
        <td>${this.formatNumber(band.score, 3)}</td>
        ${showAssignments ? `<td>${escapeHtml(band.hklLabel || '-')}</td>` : ''}
      </tr>
    `).join('');
    return `
      <div class="band-vector-table">
        <strong>Selected Hough peaks</strong>
        <p class="table-note">Peak strength is the normalized PyEBSDIndex Hough/Radon local-maximum intensity. It ranks band-detection evidence only; it is not an hkl indexing score.</p>
        <table>
          <thead><tr><th>Peak</th><th>theta_H</th><th>rho_H</th><th>maxloc [rho, theta]</th><th>Peak strength</th>${showAssignments ? '<th>Assigned hkl</th>' : ''}</tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    `;
  }

  angleTable(bands) {
    const angleRows = bands.slice(0, 8).map((band, index) => `
      <tr class="${index === this.selectedPeakIndex ? 'selected-row' : ''}">
        <td>${index + 1}</td>
        <td>${this.formatNumber(band.houghPeakThetaDeg, 2)}</td>
        <td>${this.formatNumber(band.houghPeakRhoPx, 2)}</td>
        <td>${this.formatNumber(band.thetaDeg, 2)}</td>
        <td>[${(band.detectedBandNormal_d || []).map((value) => Number(value).toFixed(4)).join(', ')}]</td>
      </tr>
    `).join('');
    const pairRows = [];
    bands.slice(0, 8).forEach((firstBand, firstIndex) => {
      bands.slice(firstIndex + 1, 8).forEach((secondBand, offset) => {
        const secondIndex = firstIndex + offset + 1;
        const measured = acuteVectorAngleDeg(firstBand.detectedBandNormal_d, secondBand.detectedBandNormal_d);
        pairRows.push(`
          <tr>
            <td>${firstIndex + 1}-${secondIndex + 1}</td>
            <td>${measured === null ? '-' : this.formatNumber(measured, 2)}</td>
          </tr>
        `);
      });
    });
    return `
      <div class="band-vector-table">
        <strong>Measured band geometry before hkl assignment</strong>
        <p class="table-note">These are detected-band normals from the same PC convention used by PyEBSDIndex. No hkl labels are assigned at this stage.</p>
        <table>
          <thead><tr><th>Peak</th><th>theta_H</th><th>rho_H</th><th>line theta</th><th>detected normal d</th></tr></thead>
          <tbody>${angleRows}</tbody>
        </table>
      </div>
      <div class="band-vector-table">
        <strong>Experimental inter-band angles</strong>
        <p class="table-note">Angles are measured between 3D detected band normals. The next stage compares these values with Ni lookup-table angles.</p>
        <table>
          <thead><tr><th>Peak pair</th><th>measured / deg</th></tr></thead>
          <tbody>${pairRows.join('')}</tbody>
        </table>
      </div>
    `;
  }

  phaseLookupTable(rows, phase = {}) {
    const body = rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.familyLabel)}</td>
        <td>[${(row.representativeHkl || []).join(' ')}]</td>
        <td>${this.formatNumber(row.dSpacingAngstrom, 4)}</td>
        <td>[${(row.unitNormalCrystal || []).map((value) => Number(value).toFixed(4)).join(', ')}]</td>
        <td>${escapeHtml(row.selectionRule || '')}</td>
      </tr>
    `).join('');
    const angleRows = (phase.interplanarAngles || []).map((row) => `
      <tr>
        <td>${escapeHtml(row.familyA)}-${escapeHtml(row.familyB)}</td>
        <td>[${(row.hklA || []).join(' ')}] vs [${(row.hklB || []).join(' ')}]</td>
        <td>${this.formatNumber(row.angleDeg, 2)}</td>
      </tr>
    `).join('');
    return `
      <div class="band-vector-table">
        <strong>Ni phase lookup table</strong>
        <p class="table-note">${escapeHtml(phase.name || 'Ni')} FCC, space group ${escapeHtml(phase.spaceGroup || 225)}, lattice a=${this.formatNumber(phase.lattice?.[0], 4)} Angstrom.</p>
        <table>
          <thead><tr><th>Family</th><th>hkl</th><th>d / Angstrom</th><th>normal in c</th><th>Rule</th></tr></thead>
          <tbody>${body}</tbody>
        </table>
      </div>
      <div class="band-vector-table">
        <strong>Complete representative-family interplanar-angle lookup</strong>
        <p class="table-note">These are the plane-family angle combinations available before the experimental bands are assigned.</p>
        <table>
          <thead><tr><th>Family pair</th><th>Representative hkl pair</th><th>Angle / deg</th></tr></thead>
          <tbody>${angleRows}</tbody>
        </table>
      </div>
    `;
  }

  assignmentRemark(residual) {
    if (residual === null) return 'Missing geometry; not used.';
    if (residual <= 1) return 'Selected: tight match.';
    if (residual <= 2) return 'Selected: within solver tolerance.';
    return 'Review: exceeds tolerance.';
  }

  lookupAssignmentRows(bands) {
    const rows = [];
    bands.slice(0, 8).forEach((firstBand, firstIndex) => {
      bands.slice(firstIndex + 1, 8).forEach((secondBand, offset) => {
        const secondIndex = firstIndex + offset + 1;
        const measured = acuteVectorAngleDeg(firstBand.detectedBandNormal_d, secondBand.detectedBandNormal_d);
        const lookup = acuteHklAngleDeg(firstBand.matchedCrystalPlane_k, secondBand.matchedCrystalPlane_k);
        const residual = measured === null || lookup === null ? null : Math.abs(measured - lookup);
        rows.push({
          pair: `${firstIndex + 1}-${secondIndex + 1}`,
          planes: `${firstBand.hklLabel || '-'} vs ${secondBand.hklLabel || '-'}`,
          measured,
          lookup,
          residual,
          remark: this.assignmentRemark(residual)
        });
      });
    });
    return rows;
  }

  lookupAssignmentTables(bands) {
    const rows = this.lookupAssignmentRows(bands);
    const midpoint = Math.ceil(rows.length / 2);
    const renderRows = (items) => items.map((row) => `
      <tr class="${row.residual !== null && row.residual <= 2 ? 'accepted-match' : 'review-match'}">
        <td>${escapeHtml(row.pair)}</td>
        <td>${escapeHtml(row.planes)}</td>
        <td>${row.measured === null ? '-' : this.formatNumber(row.measured, 2)}</td>
        <td>${row.lookup === null ? '-' : this.formatNumber(row.lookup, 2)}</td>
        <td>${row.residual === null ? '-' : this.formatNumber(row.residual, 2)}</td>
        <td>${escapeHtml(row.remark)}</td>
      </tr>
    `).join('');
    const table = (items, label) => `
      <div class="band-vector-table lookup-assignment-table">
        <strong>${escapeHtml(label)}</strong>
        <table class="compact-indexing-table">
          <thead><tr><th>Pair</th><th>Assigned planes</th><th>Meas.</th><th>Lookup</th><th>Delta</th><th>Remarks</th></tr></thead>
          <tbody>${renderRows(items)}</tbody>
        </table>
      </div>
    `;
    return `
      <section class="lookup-assignment-panel" aria-label="Accepted hkl assignment residuals">
        <div>
          <strong>Accepted hkl assignment: measured vs lookup angles</strong>
          <p class="table-note">This comparison is made after indexing. It uses 3D detected-band normals and the assigned Ni hkl planes in the same solver PC convention. Highlighted rows are the pair constraints accepted by the indexed solution.</p>
        </div>
        <div class="lookup-assignment-grid">
          ${table(rows.slice(0, midpoint), 'Accepted pairs 1-14')}
          ${table(rows.slice(midpoint), 'Accepted pairs 15-28')}
        </div>
      </section>
    `;
  }

  bandVectorTable(bands) {
    const rows = bands.slice(0, 8).map((band, index) => {
      const normal = band.vectorRepresentation?.normal_g || [];
      const sample = band.matchedSampleNormal_s || [];
      return `
        <tr>
          <td>${index + 1}</td>
          <td>${escapeHtml(band.hklLabel || '-')}</td>
          <td>[${normal.map((value) => Number(value).toFixed(4)).join(', ')}]</td>
          <td>[${sample.map((value) => Number(value).toFixed(4)).join(', ')}]</td>
        </tr>
      `;
    }).join('');
    return `
      <table>
        <thead><tr><th>#</th><th>hkl</th><th>normal in g</th><th>normal in s</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  bind() {
    this.canvas = this.root.querySelector('#realIndexingCanvas');
    this.ctx = this.canvas?.getContext('2d') || null;
    this.houghCanvas = this.root.querySelector('#realHoughCanvas');
    this.houghCtx = this.houghCanvas?.getContext('2d') || null;

    if (this.eventsBound) return;
    this.eventsBound = true;
    this.root.addEventListener('change', (event) => {
      if (event.target?.id !== 'realIndexingPattern') return;
      this.currentIndex = Number(event.target.value);
      this.currentSolution = this.currentExample().summary;
      this.selectedPeakIndex = 0;
      this.render();
      this.loadCurrentImages();
    });
    this.root.addEventListener('click', (event) => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') return;
      const stageButton = target.closest('[data-real-stage]');
      if (stageButton) {
        this.setStage(Number(stageButton.dataset.realStage));
        return;
      }
      const actionButton = target.closest('button');
      if (!actionButton) return;
      if (actionButton.id === 'realStagePrev') this.setStage(this.stageIndex - 1);
      if (actionButton.id === 'realStageNext') this.setStage(this.stageIndex + 1);
      if (actionButton.id === 'clearSelectedPeak') {
        this.selectedPeakIndex = -1;
        this.draw();
        this.drawHough();
      }
      if (actionButton.id === 'useBaselineSolution') {
        this.currentSolution = this.currentExample().summary;
        this.pc = [...this.data.metadata.pc];
        this.selectedPeakIndex = 0;
        this.render();
        this.loadCurrentImages();
      }
      if (actionButton.id === 'solveWithBackend') this.solveWithBackend();
    });
    this.root.addEventListener('click', (event) => {
      if (event.target?.id === 'realHoughCanvas') this.handleHoughClick(event);
    });
  }

  setStage(index) {
    this.stageIndex = clamp(index, 0, STAGES.length - 1);
    this.render();
    this.draw();
    this.drawHough();
  }

  loadCurrentImages() {
    const example = this.currentExample();
    this.loadImage(example.rawImage, (image) => {
      this.rawImage = image;
      this.draw();
    });
    this.loadImage(example.correctedImage || example.rawImage, (image) => {
      this.correctedImage = image;
      this.draw();
    });
  }

  loadImage(src, onload) {
    const image = new Image();
    image.onload = () => onload(image);
    image.src = src;
  }

  handleHoughClick(event) {
    const bands = this.currentSolution?.validDetectedBands || [];
    if (!bands.length) return;
    const houghArray = this.currentHoughArray();
    if (!houghArray.length || !houghArray[0]?.length) return;
    const clientRect = this.houghCanvas.getBoundingClientRect();
    const canvasX = (event.clientX - clientRect.left) * (this.houghCanvas.width / clientRect.width);
    const canvasY = (event.clientY - clientRect.top) * (this.houghCanvas.height / clientRect.height);
    const plotRect = this.houghPlotRect(this.houghCanvas.width, this.houghCanvas.height);
    const rows = houghArray.length;
    const cols = houghArray[0].length;
    const thetaIndex = clamp((canvasX - plotRect.x) / plotRect.width, 0, 1) * Math.max(1, cols - 1);
    const rhoIndex = clamp((canvasY - plotRect.y) / plotRect.height, 0, 1) * Math.max(1, rows - 1);
    let bestIndex = 0;
    let bestScore = Infinity;
    bands.forEach((band, index) => {
      const location = this.houghLocationForBand(band);
      if (!location) return;
      const score = Math.hypot(thetaIndex - location.thetaIndex, rhoIndex - location.rhoIndex);
      if (score < bestScore) {
        bestScore = score;
        bestIndex = index;
      }
    });
    this.selectedPeakIndex = bestIndex;
    this.render();
    requestAnimationFrame(() => {
      this.draw();
      this.drawHough();
    });
  }

  currentHoughArray() {
    const hough = this.currentSolution?.solverHough;
    return hough?.displayArrays?.convolvedAccumulator || hough?.displayArrays?.radonAccumulator || [];
  }

  houghPlotRect(w, h) {
    return { x: 48, y: 18, width: w - 70, height: h - 62 };
  }

  houghLocationForBand(band) {
    const location = band?.houghMaxLocationIndex || band?.houghAverageLocationIndex;
    if (!Array.isArray(location) || location.length < 2) return null;
    return {
      rhoIndex: Number(location[0]),
      thetaIndex: Number(location[1])
    };
  }

  houghPointForBand(band, array, plotRect) {
    const location = this.houghLocationForBand(band);
    if (!location || !array.length || !array[0]?.length) return null;
    const rows = array.length;
    const cols = array[0].length;
    return {
      x: plotRect.x + (clamp(location.thetaIndex, 0, cols - 1) / Math.max(1, cols - 1)) * plotRect.width,
      y: plotRect.y + (clamp(location.rhoIndex, 0, rows - 1) / Math.max(1, rows - 1)) * plotRect.height
    };
  }

  draw() {
    if (!this.ctx) return;
    const stage = this.currentStage();
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const image = stage.id === 'raw' ? this.rawImage : this.correctedImage;
    ctx.clearRect(0, 0, w, h);
    if (image) ctx.drawImage(image, 0, 0, w, h);
    this.drawPc(ctx, w, h);
    const bands = this.currentSolution?.validDetectedBands || [];
    if (stage.overlay === 'selected' && this.selectedPeakIndex >= 0) {
      this.drawBands(ctx, [bands[this.selectedPeakIndex]].filter(Boolean), '#62d7f0', 0.94, 'Selected peak');
    }
    if (stage.overlay === 'all') {
      this.drawBands(ctx, bands, '#62d7f0', 0.88, 'Peak');
    }
    if (stage.overlay === 'indexed') {
      this.drawBands(ctx, bands, '#62d7f0', 0.88, 'hkl');
    }
    this.drawHough();
  }

  drawHough() {
    if (!this.houghCtx || !this.houghCanvas) return;
    const ctx = this.houghCtx;
    const w = this.houghCanvas.width;
    const h = this.houghCanvas.height;
    const array = this.currentHoughArray();
    const plotRect = this.houghPlotRect(w, h);
    ctx.clearRect(0, 0, w, h);
    if (array.length && array[0]?.length) {
      const rows = array.length;
      const cols = array[0].length;
      const image = ctx.createImageData(cols, rows);
      for (let y = 0; y < rows; y += 1) {
        for (let x = 0; x < cols; x += 1) {
          const value = clamp(Number(array[y][x]) || 0, 0, 1);
          const pixel = Math.round(value * 255);
          const i = (y * cols + x) * 4;
          image.data[i] = pixel;
          image.data[i + 1] = pixel;
          image.data[i + 2] = pixel;
          image.data[i + 3] = 255;
        }
      }
      const offscreen = document.createElement('canvas');
      offscreen.width = cols;
      offscreen.height = rows;
      offscreen.getContext('2d').putImageData(image, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(offscreen, plotRect.x, plotRect.y, plotRect.width, plotRect.height);
    }
    this.drawHoughAxes(ctx, w, h, plotRect);
    this.drawHoughPeaks(ctx, w, h, plotRect, array);
  }

  drawHoughAxes(ctx, w, h, plotRect = this.houghPlotRect(w, h)) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.fillStyle = '#eef6f7';
    ctx.font = '700 13px Segoe UI, Arial';
    ctx.strokeRect(plotRect.x, plotRect.y, plotRect.width, plotRect.height);
    ctx.fillText('theta / deg', w * 0.48, h - 14);
    ctx.translate(14, h * 0.58);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('rho / px', 0, 0);
    ctx.restore();
  }

  drawHoughPeaks(ctx, w, h, plotRect = this.houghPlotRect(w, h), array = this.currentHoughArray()) {
    const bands = this.currentSolution?.validDetectedBands || [];
    ctx.save();
    bands.forEach((band, index) => {
      const point = this.houghPointForBand(band, array, plotRect);
      if (!point) return;
      const { x, y } = point;
      ctx.fillStyle = index === this.selectedPeakIndex ? '#ffe7b1' : '#62d7f0';
      ctx.strokeStyle = '#05070a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, index === this.selectedPeakIndex ? 8 : 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#05070a';
      ctx.font = '800 10px Segoe UI, Arial';
      ctx.fillText(String(index + 1), x - 3, y + 4);
    });
    ctx.restore();
  }

  drawPc(ctx, w, h) {
    const x = this.pc[0] * w;
    const y = this.pc[1] * h;
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 231, 177, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 5]);
    ctx.beginPath();
    ctx.moveTo(x - 36, y);
    ctx.lineTo(x + 36, y);
    ctx.moveTo(x, y - 36);
    ctx.lineTo(x, y + 36);
    ctx.stroke();
    ctx.fillStyle = 'rgba(7, 10, 12, 0.75)';
    ctx.fillRect(x + 8, y + 8, 86, 24);
    ctx.fillStyle = '#ffe7b1';
    ctx.font = '700 13px Segoe UI, Arial';
    ctx.fillText('PC', x + 18, y + 25);
    ctx.restore();
  }

  drawBands(ctx, bands, color, alpha, label) {
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.save();
    ctx.lineCap = 'round';
    bands.forEach((band, index) => {
      if (!band) return;
      const x0 = band.x0 * w;
      const y0 = band.y0 * h;
      const x1 = band.x1 * w;
      const y1 = band.y1 * h;
      ctx.strokeStyle = color;
      ctx.globalAlpha = alpha * 0.18;
      ctx.lineWidth = 10;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.globalAlpha = alpha;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
      ctx.fillStyle = color;
      ctx.font = '700 12px Segoe UI, Arial';
      const hkl = band.hklLabel ? ` ${band.hklLabel}` : '';
      const peakLabel = bands.length === 1 ? this.selectedPeakIndex + 1 : index + 1;
      ctx.fillText(`${label} ${peakLabel}${hkl}`, x0 + 5, y0 + 14);
    });
    ctx.restore();
  }

  async solveWithBackend() {
    if (this.loading) return;
    this.loading = true;
    const button = this.root.querySelector('#solveWithBackend');
    button.textContent = 'Indexing...';
    button.disabled = true;
    try {
      const example = this.currentExample();
      const response = await fetch(`${BACKEND_URL}/api/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patternIndex: example.patternIndex,
          pc: this.pc,
          manualBands: []
        })
      });
      const result = await response.json();
      if (!response.ok || result.ok === false) throw new Error(result.error || 'Backend indexing failed');
      this.currentSolution = result;
      this.backendReady = true;
      this.render();
      this.loadCurrentImages();
    } catch (error) {
      this.backendReady = false;
      this.root.querySelector('.real-indexing-status').innerHTML = `<b>Backend error</b><span>${escapeHtml(error.message)}</span>`;
    } finally {
      this.loading = false;
      const currentButton = this.root.querySelector('#solveWithBackend');
      if (currentButton) {
        currentButton.textContent = 'Re-index with PC';
        currentButton.disabled = false;
      }
    }
  }
}
