import * as THREE from 'three';

const DEG = Math.PI / 180;

const POLE_PRESETS = {
  cubic: [
    { label: '(100)', value: '100', vector: [1, 0, 0] },
    { label: '(110)', value: '110', vector: [1, 1, 0] },
    { label: '(111)', value: '111', vector: [1, 1, 1] }
  ],
  hexagonal: [
    { label: '(0001)', value: '0001', vector: [0, 0, 1] },
    { label: '(10-10)', value: '10-10', vector: [1, 0, 0] },
    { label: '(11-20)', value: '11-20', vector: [Math.cos(30 * DEG), Math.sin(30 * DEG), 0] }
  ]
};

const SAMPLE_DIRECTIONS = {
  Xs: [1, 0, 0],
  Ys: [0, 1, 0],
  Zs: [0, 0, 1]
};

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

function normalize(vector) {
  const length = Math.hypot(vector[0], vector[1], vector[2]) || 1;
  return [vector[0] / length, vector[1] / length, vector[2] / length];
}

function dot(a, b) {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

function matMul(a, b) {
  return [
    [
      a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0],
      a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1],
      a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2]
    ],
    [
      a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0],
      a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1],
      a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2]
    ],
    [
      a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0],
      a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1],
      a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2]
    ]
  ];
}

function matVec(matrix, vector) {
  return [
    dot(matrix[0], vector),
    dot(matrix[1], vector),
    dot(matrix[2], vector)
  ];
}

function transpose(matrix) {
  return [
    [matrix[0][0], matrix[1][0], matrix[2][0]],
    [matrix[0][1], matrix[1][1], matrix[2][1]],
    [matrix[0][2], matrix[1][2], matrix[2][2]]
  ];
}

function rz(angleDeg) {
  const a = angleDeg * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    [c, -s, 0],
    [s, c, 0],
    [0, 0, 1]
  ];
}

function rx(angleDeg) {
  const a = angleDeg * DEG;
  const c = Math.cos(a);
  const s = Math.sin(a);
  return [
    [1, 0, 0],
    [0, c, -s],
    [0, s, c]
  ];
}

function bungeMatrix(phi1, Phi, phi2) {
  // Teaching convention used here: crystal-to-sample active rotation,
  // g = Rz(phi1) Rx(Phi) Rz(phi2), matching the Bunge ZXZ sequence.
  return matMul(matMul(rz(phi1), rx(Phi)), rz(phi2));
}

function uniqueVectors(vectors) {
  const seen = new Set();
  const unique = [];
  vectors.forEach((vector) => {
    const n = normalize(vector);
    const key = n.map((value) => value.toFixed(5)).join(',');
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(n);
    }
  });
  return unique;
}

function cubicFamily(vector) {
  const [h, k, l] = vector.map((value) => Math.round(value));
  const base = [h, k, l];
  const permutations = [
    [base[0], base[1], base[2]],
    [base[0], base[2], base[1]],
    [base[1], base[0], base[2]],
    [base[1], base[2], base[0]],
    [base[2], base[0], base[1]],
    [base[2], base[1], base[0]]
  ];
  const vectors = [];
  permutations.forEach((p) => {
    [-1, 1].forEach((sx) => {
      [-1, 1].forEach((sy) => {
        [-1, 1].forEach((sz) => vectors.push([sx * p[0], sy * p[1], sz * p[2]]));
      });
    });
  });
  return uniqueVectors(vectors);
}

function hexFamily(value) {
  if (value === '0001') return [[0, 0, 1], [0, 0, -1]];
  const offset = value === '11-20' ? 30 : 0;
  const vectors = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (offset + i * 60) * DEG;
    vectors.push([Math.cos(angle), Math.sin(angle), 0]);
  }
  return uniqueVectors(vectors);
}

function poleFamily(system, preset) {
  return system === 'cubic' ? cubicFamily(preset.vector) : hexFamily(preset.value);
}

function stereographic(vector) {
  let v = normalize(vector);
  let hemisphere = v[2] >= 0 ? 'upper' : 'lower';
  if (v[2] < 0) v = [-v[0], -v[1], -v[2]];
  const denominator = 1 + v[2];
  return {
    x: v[0] / denominator,
    y: v[1] / denominator,
    hemisphere
  };
}

function projectionPointOnEquator(vector) {
  const v = normalize(vector);
  const denominator = 1 + v[2];
  if (Math.abs(denominator) < 1e-6) return [0, 0, 0];
  return [v[0] / denominator, v[1] / denominator, 0];
}

function drawCirclePlot(ctx, title) {
  const { width, height } = ctx.canvas;
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#070b0f';
  ctx.fillRect(0, 0, width, height);
  const cx = width / 2;
  const cy = height / 2;
  const r = Math.min(width, height) * 0.39;
  ctx.strokeStyle = 'rgba(230,181,90,0.82)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(238,246,247,0.14)';
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.moveTo(cx, cy - r);
  ctx.lineTo(cx, cy + r);
  ctx.stroke();
  ctx.fillStyle = '#eef6f7';
  ctx.font = '700 13px Segoe UI, Arial';
  ctx.fillText(title, 12, 22);
  return { cx, cy, r };
}

function drawPoint(ctx, plot, point, color, label) {
  const x = plot.cx + point.x * plot.r;
  const y = plot.cy - point.y * plot.r;
  ctx.fillStyle = color;
  ctx.strokeStyle = '#05070a';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (label) {
    ctx.fillStyle = '#dff8d3';
    ctx.font = '700 11px Segoe UI, Arial';
    ctx.fillText(label, x + 7, y - 7);
  }
}

function prepareSquareCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const cssSize = Math.max(180, Math.round(Math.min(
    rect.width || canvas.clientWidth || 360,
    rect.height || canvas.clientHeight || rect.width || 360
  )));
  if (canvas.width !== cssSize || canvas.height !== cssSize) {
    canvas.width = cssSize;
    canvas.height = cssSize;
  }
  return canvas.getContext('2d');
}

function makeLine(points, color) {
  const geometry = new THREE.BufferGeometry().setFromPoints(points.map((p) => new THREE.Vector3(p[0], p[1], p[2])));
  return new THREE.LineSegments(geometry, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
}

function makeArrow(direction, color, length = 1.25) {
  const dir = new THREE.Vector3(direction[0], direction[1], direction[2]).normalize();
  return new THREE.ArrowHelper(dir, new THREE.Vector3(0, 0, 0), length, color, 0.09, 0.045);
}

function makeCubicCell() {
  const s = 0.36;
  const pts = [
    [-s, -s, -s], [s, -s, -s], [s, -s, -s], [s, s, -s], [s, s, -s], [-s, s, -s], [-s, s, -s], [-s, -s, -s],
    [-s, -s, s], [s, -s, s], [s, -s, s], [s, s, s], [s, s, s], [-s, s, s], [-s, s, s], [-s, -s, s],
    [-s, -s, -s], [-s, -s, s], [s, -s, -s], [s, -s, s], [s, s, -s], [s, s, s], [-s, s, -s], [-s, s, s]
  ];
  return makeLine(pts, 0x62d7f0);
}

function makeHexagonalCell() {
  const r = 0.36;
  const z = 0.31;
  const top = [];
  const bottom = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (30 + i * 60) * DEG;
    top.push([r * Math.cos(a), r * Math.sin(a), z]);
    bottom.push([r * Math.cos(a), r * Math.sin(a), -z]);
  }
  const pts = [];
  for (let i = 0; i < 6; i += 1) {
    const next = (i + 1) % 6;
    pts.push(top[i], top[next], bottom[i], bottom[next], top[i], bottom[i]);
  }
  return makeLine(pts, 0x62d7f0);
}

export class EulerOrientationStudio {
  constructor({ root, getReduceMotion }) {
    this.root = root;
    this.getReduceMotion = getReduceMotion;
    this.state = {
      system: 'cubic',
      pole: '100',
      sampleDirection: 'Zs',
      phi1: 35,
      Phi: 45,
      phi2: 20
    };
    this.viewRotation = { x: 0, y: 0 };
    this.dragState = null;
    this.eventsBound = false;
    this.initialized = false;
  }

  init() {
    if (!this.root || this.initialized) return;
    this.initialized = true;
    this.render();
    this.setupScene();
    this.bind();
    this.update();
  }

  render() {
    this.root.innerHTML = `
      <section class="panel euler-panel" aria-label="Euler angle orientation studio">
        <div class="euler-heading">
          <span class="fidelity-label">Bunge ZXZ orientation</span>
          <h2>Euler Angles, Unit Cells, Pole Figures, and IPF</h2>
          <p>Change phi1, Phi, and phi2 to rotate a crystal unit cell, then watch the selected pole family move through the unit sphere, pole figure, and inverse pole figure.</p>
        </div>
        <div class="euler-layout">
          <aside class="euler-controls">
            <label class="select-row"><span>Crystal system</span><select id="eulerCrystalSystem">
              <option value="cubic">Cubic</option>
              <option value="hexagonal">Hexagonal</option>
            </select></label>
            <label class="select-row"><span>Pole family</span><select id="eulerPoleFamily"></select></label>
            <label class="select-row"><span>IPF sample direction</span><select id="eulerSampleDirection">
              <option value="Xs">Xs</option>
              <option value="Ys">Ys</option>
              <option value="Zs">Zs</option>
            </select></label>
            ${this.slider('phi1', 'phi1', 0, 360)}
            ${this.slider('Phi', 'Phi', 0, 180)}
            ${this.slider('phi2', 'phi2', 0, 360)}
            <div class="euler-button-row">
              <button id="eulerReset" type="button">Reset</button>
              <button id="eulerCube" type="button">Cube orientation</button>
            </div>
            <div class="euler-readout">
              <strong>Convention</strong>
              <span>g = Rz(phi1) Rx(Phi) Rz(phi2), crystal vector to sample vector.</span>
              <strong>Rotation matrix g</strong>
              <table id="eulerMatrix" class="matrix-table"></table>
              <strong>Selected pole</strong>
              <code id="eulerPoleReadout"></code>
            </div>
          </aside>
          <div class="euler-visuals">
            <figure class="euler-card euler-scene-card">
              <div id="eulerScene" class="euler-scene" aria-label="3D oriented unit cell in unit sphere"></div>
              <figcaption>Wireframe unit cell inside the unit sphere. Cyan axes are crystal axes after Bunge rotation; gray axes are sample axes.</figcaption>
            </figure>
            <figure class="euler-card">
              <canvas id="stereoCanvas" width="520" height="360" aria-label="Stereographic projection construction"></canvas>
              <figcaption>The selected pole touches the sphere surface; a ray from the south pole through that pole cuts the equatorial plane at the pole-figure point.</figcaption>
            </figure>
            <figure class="euler-card">
              <canvas id="poleFigureCanvas" width="520" height="360" aria-label="Pole figure"></canvas>
              <figcaption>Pole figure for the selected pole family after orientation.</figcaption>
            </figure>
            <figure class="euler-card">
              <canvas id="ipfCanvas" width="520" height="360" aria-label="Inverse pole figure"></canvas>
              <figcaption>Inverse pole figure point for the selected sample direction.</figcaption>
            </figure>
          </div>
        </div>
      </section>
    `;
    this.populatePoleOptions();
  }

  slider(id, label, min, max) {
    return `
      <label class="euler-slider">
        <span>${escapeHtml(label)} <b id="${id}Value">${this.state[id].toFixed(0)} deg</b></span>
        <input id="${id}" type="range" min="${min}" max="${max}" step="1" value="${this.state[id]}">
      </label>
    `;
  }

  bind() {
    if (this.eventsBound) return;
    this.eventsBound = true;
    this.root.addEventListener('input', (event) => {
      if (!['phi1', 'Phi', 'phi2'].includes(event.target?.id)) return;
      this.state[event.target.id] = Number(event.target.value);
      this.update();
    });
    this.root.addEventListener('change', (event) => {
      if (event.target?.id === 'eulerCrystalSystem') {
        this.state.system = event.target.value;
        this.state.pole = POLE_PRESETS[this.state.system][0].value;
        this.populatePoleOptions();
      }
      if (event.target?.id === 'eulerPoleFamily') this.state.pole = event.target.value;
      if (event.target?.id === 'eulerSampleDirection') this.state.sampleDirection = event.target.value;
      this.update();
    });
    this.root.addEventListener('click', (event) => {
      if (event.target?.id === 'eulerReset') {
        this.state.phi1 = 35;
        this.state.Phi = 45;
        this.state.phi2 = 20;
        this.syncControls();
        this.update();
      }
      if (event.target?.id === 'eulerCube') {
        this.state.phi1 = 0;
        this.state.Phi = 0;
        this.state.phi2 = 0;
        this.syncControls();
        this.update();
      }
    });
    window.addEventListener('resize', () => this.resize());
  }

  populatePoleOptions() {
    const select = this.root.querySelector('#eulerPoleFamily');
    if (!select) return;
    select.innerHTML = POLE_PRESETS[this.state.system].map((item) => `<option value="${item.value}">${escapeHtml(item.label)}</option>`).join('');
    select.value = this.state.pole;
    const system = this.root.querySelector('#eulerCrystalSystem');
    if (system) system.value = this.state.system;
  }

  setupScene() {
    this.sceneRoot = this.root.querySelector('#eulerScene');
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    this.camera.position.set(0, -0.08, 3.05);
    this.camera.up.set(0, 1, 0);
    this.camera.lookAt(0, 0, 0);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.sceneRoot.appendChild(this.renderer.domElement);
    this.viewGroup = new THREE.Group();
    this.scene.add(this.viewGroup);
    this.group = new THREE.Group();
    this.viewGroup.add(this.group);
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.9));
    this.scene.add(new THREE.HemisphereLight(0x9adceb, 0x111111, 0.65));
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.04, 32, 18),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.055, wireframe: true })
    );
    this.viewGroup.add(sphere);
    const equator = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 129 }, (_, index) => {
          const angle = (index / 128) * Math.PI * 2;
          return new THREE.Vector3(Math.cos(angle), Math.sin(angle), 0);
        })
      ),
      new THREE.LineBasicMaterial({ color: 0xe6b55a, transparent: true, opacity: 0.95 })
    );
    this.viewGroup.add(equator);
    this.viewGroup.add(makeArrow([1, 0, 0], 0xb8c8cc, 1.45));
    this.viewGroup.add(makeArrow([0, 1, 0], 0xb8c8cc, 1.45));
    this.viewGroup.add(makeArrow([0, 0, 1], 0xb8c8cc, 1.45));
    this.bindSceneDrag();
    this.resize();
    this.animate();
  }

  resize() {
    if (!this.renderer || !this.sceneRoot) return;
    const rect = this.sceneRoot.getBoundingClientRect();
    const width = Math.max(320, rect.width || 520);
    const height = Math.max(320, rect.height || 420);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
    this.drawCanvases();
  }

  animate() {
    if (!this.renderer) return;
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(() => this.animate());
  }

  bindSceneDrag() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', (event) => {
      canvas.setPointerCapture(event.pointerId);
      this.dragState = {
        x: event.clientX,
        y: event.clientY,
        startX: this.viewRotation.x,
        startY: this.viewRotation.y
      };
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.dragState || !this.viewGroup) return;
      const dx = event.clientX - this.dragState.x;
      const dy = event.clientY - this.dragState.y;
      this.viewRotation.y = this.dragState.startY + dx * 0.01;
      this.viewRotation.x = clamp(this.dragState.startX + dy * 0.01, -Math.PI * 0.48, Math.PI * 0.48);
      this.viewGroup.rotation.set(this.viewRotation.x, this.viewRotation.y, 0);
    });
    canvas.addEventListener('pointerup', () => {
      this.dragState = null;
    });
    canvas.addEventListener('pointercancel', () => {
      this.dragState = null;
    });
  }

  currentPolePreset() {
    return POLE_PRESETS[this.state.system].find((item) => item.value === this.state.pole) || POLE_PRESETS[this.state.system][0];
  }

  syncControls() {
    ['phi1', 'Phi', 'phi2'].forEach((id) => {
      const input = this.root.querySelector(`#${id}`);
      if (input) input.value = this.state[id];
    });
  }

  update() {
    ['phi1', 'Phi', 'phi2'].forEach((id) => {
      const value = this.root.querySelector(`#${id}Value`);
      if (value) value.textContent = `${this.state[id].toFixed(0)} deg`;
    });
    this.updateScene();
    this.updateReadout();
    this.drawCanvases();
  }

  updateScene() {
    if (!this.group) return;
    this.group.clear();
    const g = bungeMatrix(this.state.phi1, this.state.Phi, this.state.phi2);
    const matrix = new THREE.Matrix4().set(
      g[0][0], g[0][1], g[0][2], 0,
      g[1][0], g[1][1], g[1][2], 0,
      g[2][0], g[2][1], g[2][2], 0,
      0, 0, 0, 1
    );
    const cell = this.state.system === 'cubic' ? makeCubicCell() : makeHexagonalCell();
    cell.applyMatrix4(matrix);
    this.group.add(cell);
    [[1, 0, 0, 0x62d7f0], [0, 1, 0, 0x92d46f], [0, 0, 1, 0xe6b55a]].forEach(([x, y, z, color]) => {
      this.group.add(makeArrow(matVec(g, [x, y, z]), color, 1.18));
    });
    const poles = poleFamily(this.state.system, this.currentPolePreset()).map((pole) => matVec(g, pole));
    poles.slice(0, 12).forEach((pole) => this.group.add(makeArrow(pole, 0xae98e8, 1.06)));
    const selectedPole = normalize(matVec(g, normalize(this.currentPolePreset().vector)));
    const intersection = new THREE.Vector3(selectedPole[0], selectedPole[1], selectedPole[2]);
    const equatorPoint = projectionPointOnEquator(selectedPole);
    const southPole = new THREE.Vector3(0, 0, -1);
    const projectionLine = makeLine(
      [
        [southPole.x, southPole.y, southPole.z],
        [intersection.x, intersection.y, intersection.z]
      ],
      0xe6b55a
    );
    projectionLine.material.opacity = 0.9;
    this.group.add(projectionLine);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffe7b1 });
    const projectedMaterial = new THREE.MeshBasicMaterial({ color: 0x92d46f });
    const southMaterial = new THREE.MeshBasicMaterial({ color: 0xee6074 });
    const intersectionMarker = new THREE.Mesh(new THREE.SphereGeometry(0.035, 16, 10), markerMaterial);
    intersectionMarker.position.copy(intersection);
    this.group.add(intersectionMarker);
    const equatorMarker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), projectedMaterial);
    equatorMarker.position.set(equatorPoint[0], equatorPoint[1], 0);
    this.group.add(equatorMarker);
    const southMarker = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 10), southMaterial);
    southMarker.position.copy(southPole);
    this.group.add(southMarker);
  }

  updateReadout() {
    const g = bungeMatrix(this.state.phi1, this.state.Phi, this.state.phi2);
    const matrix = this.root.querySelector('#eulerMatrix');
    if (matrix) {
      matrix.innerHTML = `<tbody>${g.map((row) => `<tr>${row.map((value) => `<td>${value.toFixed(4)}</td>`).join('')}</tr>`).join('')}</tbody>`;
    }
    const pole = normalize(this.currentPolePreset().vector);
    const rotated = matVec(g, pole);
    const projected = stereographic(rotated);
    const readout = this.root.querySelector('#eulerPoleReadout');
    if (readout) {
      readout.textContent = `c=[${pole.map((v) => v.toFixed(3)).join(', ')}] -> s=[${rotated.map((v) => v.toFixed(3)).join(', ')}], stereo=(${projected.x.toFixed(3)}, ${projected.y.toFixed(3)})`;
    }
  }

  drawCanvases() {
    this.drawStereographicConstruction();
    this.drawPoleFigure();
    this.drawIpf();
  }

  drawStereographicConstruction() {
    const canvas = this.root.querySelector('#stereoCanvas');
    if (!canvas) return;
    const ctx = prepareSquareCanvas(canvas);
    const plot = drawCirclePlot(ctx, 'Stereographic projection');
    const g = bungeMatrix(this.state.phi1, this.state.Phi, this.state.phi2);
    const pole = matVec(g, normalize(this.currentPolePreset().vector));
    const projected = stereographic(pole);
    drawPoint(ctx, plot, projected, '#ae98e8', 'pole');
    ctx.strokeStyle = 'rgba(230,181,90,0.8)';
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(plot.cx, plot.cy + plot.r);
    ctx.lineTo(plot.cx + projected.x * plot.r, plot.cy - projected.y * plot.r);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ee6074';
    ctx.beginPath();
    ctx.arc(plot.cx, plot.cy + plot.r, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#92d46f';
    ctx.beginPath();
    ctx.arc(plot.cx + projected.x * plot.r, plot.cy - projected.y * plot.r, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a9b9bd';
    ctx.font = '12px Segoe UI, Arial';
    ctx.fillText(`projected (${projected.x.toFixed(3)}, ${projected.y.toFixed(3)})`, 12, canvas.height - 16);
  }

  drawPoleFigure() {
    const canvas = this.root.querySelector('#poleFigureCanvas');
    if (!canvas) return;
    const ctx = prepareSquareCanvas(canvas);
    const plot = drawCirclePlot(ctx, `Pole figure ${this.currentPolePreset().label}`);
    const g = bungeMatrix(this.state.phi1, this.state.Phi, this.state.phi2);
    poleFamily(this.state.system, this.currentPolePreset()).forEach((pole, index) => {
      const point = stereographic(matVec(g, pole));
      drawPoint(ctx, plot, point, point.hemisphere === 'upper' ? '#62d7f0' : '#e6b55a', String(index + 1));
    });
  }

  drawIpf() {
    const canvas = this.root.querySelector('#ipfCanvas');
    if (!canvas) return;
    const ctx = prepareSquareCanvas(canvas);
    const plot = drawCirclePlot(ctx, `IPF ${this.state.sampleDirection}`);
    const g = bungeMatrix(this.state.phi1, this.state.Phi, this.state.phi2);
    const crystalDirection = normalize(matVec(transpose(g), SAMPLE_DIRECTIONS[this.state.sampleDirection]));
    const reduced = this.state.system === 'cubic'
      ? normalize(crystalDirection.map(Math.abs).sort((a, b) => b - a))
      : normalize([Math.abs(crystalDirection[0]), Math.abs(crystalDirection[1]), Math.abs(crystalDirection[2])]);
    const point = stereographic(reduced);
    if (this.state.system === 'cubic') {
      const corners = [[0, 0, 1], normalize([1, 0, 1]), normalize([1, 1, 1])].map(stereographic);
      ctx.strokeStyle = 'rgba(146,212,111,0.75)';
      ctx.beginPath();
      corners.forEach((corner, index) => {
        const x = plot.cx + corner.x * plot.r;
        const y = plot.cy - corner.y * plot.r;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      ctx.stroke();
    } else {
      ctx.strokeStyle = 'rgba(146,212,111,0.75)';
      ctx.beginPath();
      ctx.moveTo(plot.cx, plot.cy);
      ctx.lineTo(plot.cx + 0.48 * plot.r, plot.cy);
      ctx.arc(plot.cx, plot.cy, 0.48 * plot.r, 0, -30 * DEG, true);
      ctx.closePath();
      ctx.stroke();
    }
    drawPoint(ctx, plot, point, '#92d46f', 'IPF');
    ctx.fillStyle = '#a9b9bd';
    ctx.font = '12px Segoe UI, Arial';
    ctx.fillText(`dir [${crystalDirection.map((v) => v.toFixed(3)).join(', ')}]`, 12, canvas.height - 16);
  }
}
