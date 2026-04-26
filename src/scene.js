import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { activePlanes, braggThetaDeg, orientationQuat, orientedNormal, planes, state, visualThetaDeg } from './state.js';

const INTERACTION_POINT = new THREE.Vector3(0, 0.25, 0);
const LOCAL_UP = new THREE.Vector3(0, 1, 0);
const LOCAL_Z = new THREE.Vector3(0, 0, 1);

export class EbsdScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x151815, 1);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x151815);
    this.scene.fog = new THREE.Fog(0x111314, 6, 18);
    this.camera = new THREE.PerspectiveCamera(48, 1, 0.1, 100);
    this.camera.position.set(7.2, 4.8, 8.6);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(0, 0.7, 0.9);

    this.pathMats = [];
    this.coneMeshes = [];
    this.planeMeshes = [];
    this.build();
  }

  build() {
    this.scene.add(new THREE.AmbientLight(0xd9e5df, 0.58));
    const key = new THREE.DirectionalLight(0xffffff, 1.2);
    key.position.set(4, 7, 5);
    this.scene.add(key);
    const rim = new THREE.PointLight(0x6edee9, 2.1, 12);
    rim.position.set(-3, 2, 4);
    this.scene.add(rim);

    this.root = new THREE.Group();
    this.sampleGroup = new THREE.Group();
    this.beamGroup = new THREE.Group();
    this.scatterGroup = new THREE.Group();
    this.planesGroup = new THREE.Group();
    this.conesGroup = new THREE.Group();
    this.detectorGroup = new THREE.Group();
    this.traceGroup = new THREE.Group();
    this.scene.add(this.root);
    this.root.add(this.sampleGroup, this.beamGroup, this.detectorGroup);
    this.sampleGroup.add(this.scatterGroup, this.planesGroup, this.conesGroup);
    this.detectorGroup.add(this.traceGroup);

    this.buildBeam();
    this.buildSample();
    this.buildScatterPaths();
    this.buildPlanes();
    this.buildCones();
    this.buildDetector();
    this.buildReferenceFrame();
  }

  buildBeam() {
    const poleMat = new THREE.MeshStandardMaterial({ color: 0x5c635f, metalness: 0.8, roughness: 0.27 });
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.72, 0.7, 48), poleMat);
    pole.position.set(0, 4.4, 0);
    pole.rotation.x = Math.PI;
    this.beamGroup.add(pole);

    const aperture = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.16, 0.12, 32),
      new THREE.MeshBasicMaterial({ color: 0x9ff4ff })
    );
    aperture.position.set(0, 3.96, 0);
    this.beamGroup.add(aperture);

    this.beam = new THREE.Mesh(
      new THREE.CylinderGeometry(0.025, 0.05, 4.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x86eff7, transparent: true, opacity: 0.72, blending: THREE.AdditiveBlending })
    );
    this.beam.position.set(0, 2.0, 0);
    this.beamGroup.add(this.beam);

    this.beamGlow = new THREE.Mesh(
      new THREE.CylinderGeometry(0.09, 0.16, 4.1, 24),
      new THREE.MeshBasicMaterial({ color: 0x5adfff, transparent: true, opacity: 0.13, blending: THREE.AdditiveBlending })
    );
    this.beamGlow.position.copy(this.beam.position);
    this.beamGroup.add(this.beamGlow);
  }

  buildSample() {
    const sampleMat = new THREE.MeshStandardMaterial({
      color: 0x5b625d,
      metalness: 0.25,
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    const sample = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.22, 2.9), sampleMat);
    this.sampleGroup.add(sample);
    sample.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(sample.geometry),
        new THREE.LineBasicMaterial({ color: 0xd8e2dc, transparent: true, opacity: 0.45 })
      )
    );

    this.ivol = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 40, 24),
      new THREE.MeshBasicMaterial({ color: 0xe6b55a, transparent: true, opacity: 0.36, blending: THREE.AdditiveBlending })
    );
    this.ivol.scale.set(1.0, 0.42, 0.8);
    this.ivol.position.set(0, 0.22, 0);
    this.scatterGroup.add(this.ivol);

    this.ivolCore = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 24, 12),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.75, blending: THREE.AdditiveBlending })
    );
    this.ivolCore.position.copy(this.ivol.position);
    this.scatterGroup.add(this.ivolCore);
  }

  buildScatterPaths() {
    for (let i = 0; i < 26; i += 1) {
      const pts = [new THREE.Vector3(0, 0.24, 0)];
      let p = pts[0].clone();
      for (let j = 0; j < 5; j += 1) {
        p = p.clone().add(new THREE.Vector3((Math.random() - 0.5) * 0.22, (Math.random() - 0.25) * 0.12, (Math.random() - 0.5) * 0.22));
        pts.push(p);
      }
      const geom = new THREE.BufferGeometry().setFromPoints(new THREE.CatmullRomCurve3(pts).getPoints(24));
      const mat = new THREE.LineBasicMaterial({ color: 0xf0bd5e, transparent: true, opacity: 0.42 });
      this.pathMats.push(mat);
      this.scatterGroup.add(new THREE.Line(geom, mat));
    }
  }

  buildPlanes() {
    planes.forEach((pl, i) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(2.4, 1.7, 1, 1),
        new THREE.MeshBasicMaterial({ color: pl.color, transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false })
      );
      mesh.position.copy(INTERACTION_POINT);
      mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(LOCAL_Z, pl.normal.clone().normalize()));
      mesh.userData.baseNormal = pl.normal.clone();
      this.planesGroup.add(mesh);
      this.planeMeshes.push(mesh);
    });
  }

  buildCones() {
    planes.forEach((pl, planeIndex) => {
      const group = new THREE.Group();
      [-1, 1].forEach((sgn) => {
        const cone = new THREE.Mesh(
          new THREE.BufferGeometry(),
          new THREE.MeshBasicMaterial({
            color: pl.color,
            transparent: true,
            opacity: 0.18,
            side: THREE.DoubleSide,
            depthWrite: false
          })
        );
        cone.userData.planeIndex = planeIndex;
        cone.userData.side = sgn;
        group.add(cone);
        this.coneMeshes.push(cone);
      });
      this.conesGroup.add(group);
    });
  }

  buildDetector() {
    const det = new THREE.Mesh(
      new THREE.PlaneGeometry(2.6, 2.6),
      new THREE.MeshStandardMaterial({
        color: 0x20252a,
        metalness: 0.1,
        roughness: 0.45,
        transparent: true,
        opacity: 0.84,
        side: THREE.DoubleSide,
        emissive: 0x182225,
        emissiveIntensity: 0.7
      })
    );
    this.detectorGroup.add(det);
    const grid = new THREE.GridHelper(2.6, 8, 0x6edee9, 0x4d5f59);
    grid.rotation.x = Math.PI / 2;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    this.detectorGroup.add(grid);
    this.detectorGroup.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.6, 2.6)),
        new THREE.LineBasicMaterial({ color: 0xd6f5f5, transparent: true, opacity: 0.65 })
      )
    );
  }

  buildReferenceFrame() {
    const grid = new THREE.GridHelper(6, 12, 0x46524c, 0x2b302d);
    grid.position.y = -0.42;
    grid.material.transparent = true;
    grid.material.opacity = 0.34;
    this.root.add(grid);

    const axisMat = new THREE.LineBasicMaterial({ color: 0xe6b55a, transparent: true, opacity: 0.55 });
    const axisGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(-2.4, -0.38, 0),
      new THREE.Vector3(2.4, -0.38, 0)
    ]);
    this.root.add(new THREE.Line(axisGeom, axisMat));
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const width = Math.max(1, rect.width);
    const height = Math.max(1, rect.height);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update() {
    const tiltRad = THREE.MathUtils.degToRad(state.tilt);
    this.sampleGroup.rotation.x = Math.PI / 2 - tiltRad;
    this.detectorGroup.position.set(0.2, 1.1, state.distance);
    this.detectorGroup.rotation.x = THREE.MathUtils.degToRad(-7);
    this.root.updateMatrixWorld(true);
    this.sampleGroup.updateMatrixWorld(true);
    this.detectorGroup.updateMatrixWorld(true);

    this.scatterGroup.visible = state.stage >= 2;
    this.planesGroup.visible = state.showPlanes && state.stage >= 3;
    this.conesGroup.visible = state.showCones && state.stage >= 4;
    this.traceGroup.visible = state.stage >= 5;

    this.pathMats.forEach((m, i) => {
      m.opacity = state.stage >= 2 ? 0.22 + 0.18 * Math.sin(state.time * 4 + i) : 0;
    });
    this.ivol.material.opacity = state.stage >= 2 ? 0.28 + 0.09 * Math.sin(state.time * 5) : 0;
    this.ivolCore.material.opacity = state.stage >= 2 ? 0.6 + 0.2 * Math.sin(state.time * 7) : 0;
    this.beam.material.opacity = state.stage >= 1 ? 0.55 + 0.16 * Math.sin(state.time * 9) : 0.1;
    this.beamGlow.material.opacity = state.stage >= 1 ? 0.11 + 0.05 * Math.sin(state.time * 9) : 0.02;

    this.planeMeshes.forEach((mesh) => {
      const n = orientedNormal(mesh.userData.baseNormal);
      mesh.position.copy(INTERACTION_POINT);
      mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(LOCAL_Z, n));
    });
    this.coneMeshes.forEach((cone) => this.updateConePatch(cone));
    this.update3DTraces();
  }

  updateConePatch(cone) {
    const pl = planes[cone.userData.planeIndex];
    const normal = orientedNormal(pl.normal);
    const basis = this.planeBasis(normal);
    const detectorCenterWorld = this.detectorGroup.localToWorld(new THREE.Vector3(0, 0, 0));
    const detectorCenterLocal = this.sampleGroup.worldToLocal(detectorCenterWorld.clone());
    const toDetector = detectorCenterLocal.sub(INTERACTION_POINT).normalize();
    let rimCenter = toDetector.sub(normal.clone().multiplyScalar(toDetector.dot(normal)));
    if (rimCenter.lengthSq() < 0.0001) rimCenter = basis.u.clone();
    rimCenter.normalize();

    const centerPhi = Math.atan2(rimCenter.dot(basis.v), rimCenter.dot(basis.u));
    const phiSpan = THREE.MathUtils.degToRad(58);
    const phiSegments = 22;
    const radialSegments = 8;
    const theta = THREE.MathUtils.degToRad(visualThetaDeg(state.voltage, pl.d));
    const sinAlpha = Math.cos(theta);
    const cosAlpha = Math.sin(theta);
    const side = cone.userData.side;
    const vertices = [];
    const indices = [];

    for (let r = 0; r <= radialSegments; r += 1) {
      const t = THREE.MathUtils.lerp(0.08, 5.4, r / radialSegments);
      for (let p = 0; p <= phiSegments; p += 1) {
        const phi = centerPhi - phiSpan / 2 + (phiSpan * p) / phiSegments;
        const rim = basis.u.clone().multiplyScalar(Math.cos(phi)).add(basis.v.clone().multiplyScalar(Math.sin(phi)));
        const dir = rim.multiplyScalar(sinAlpha).add(normal.clone().multiplyScalar(side * cosAlpha)).normalize();
        const point = INTERACTION_POINT.clone().add(dir.multiplyScalar(t));
        vertices.push(point.x, point.y, point.z);
      }
    }

    const row = phiSegments + 1;
    for (let r = 0; r < radialSegments; r += 1) {
      for (let p = 0; p < phiSegments; p += 1) {
        const a = r * row + p;
        const b = a + 1;
        const c = a + row;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }

    cone.geometry.dispose();
    cone.geometry = new THREE.BufferGeometry();
    cone.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    cone.geometry.setIndex(indices);
    cone.geometry.computeVertexNormals();
  }

  planeBasis(normal) {
    const seed = Math.abs(normal.dot(LOCAL_UP)) > 0.92 ? new THREE.Vector3(1, 0, 0) : LOCAL_UP;
    const u = new THREE.Vector3().crossVectors(seed, normal).normalize();
    const v = new THREE.Vector3().crossVectors(normal, u).normalize();
    return { u, v };
  }

  update3DTraces() {
    this.traceGroup.clear();
    if (state.stage < 5) return;
    activePlanes().forEach((pl, i) => {
      const nWorld = orientedNormal(pl.normal).applyQuaternion(this.sampleGroup.getWorldQuaternion(new THREE.Quaternion())).normalize();
      const vertexWorld = this.sampleGroup.localToWorld(INTERACTION_POINT.clone());
      const nDet = nWorld.applyQuaternion(this.detectorGroup.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
      const vertexDet = this.detectorGroup.worldToLocal(vertexWorld);
      const nxy = new THREE.Vector2(nDet.x, nDet.y);
      if (nxy.lengthSq() < 0.0001) return;
      const unitNormal = nxy.clone().normalize();
      const lineDir = new THREE.Vector2(-unitNormal.y, unitNormal.x);
      const centerOffset = THREE.MathUtils.clamp(nDet.dot(vertexDet) / nxy.length(), -1.15, 1.15);
      const visualTheta = THREE.MathUtils.degToRad(visualThetaDeg(state.voltage, pl.d));
      const sep = THREE.MathUtils.clamp(Math.tan(visualTheta) * Math.max(1.2, vertexDet.length()) * 0.16, 0.055, 0.17);
      [-sep, sep].forEach((s) => this.addDetectorTrace(unitNormal, lineDir, centerOffset + s, pl.color));
    });
  }

  addDetectorTrace(unitNormal, lineDir, offset, color) {
    const len = 1.85;
    const center = unitNormal.clone().multiplyScalar(offset);
    const a = center.clone().add(lineDir.clone().multiplyScalar(-len));
    const b = center.clone().add(lineDir.clone().multiplyScalar(len));
    const geom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, 0.015),
      new THREE.Vector3(b.x, b.y, 0.015)
    ]);
    this.traceGroup.add(new THREE.Line(geom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.92 })));
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
