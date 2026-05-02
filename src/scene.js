import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { activePlanes, braggThetaDeg, orientationQuat, orientedNormal, planes, state, visualThetaDeg } from './state.js';

const INTERACTION_POINT = new THREE.Vector3(0, 0.25, 0);
const LOCAL_UP = new THREE.Vector3(0, 1, 0);
const LOCAL_Z = new THREE.Vector3(0, 0, 1);
const DETECTOR_WIDTH = 4.25;
const DETECTOR_HEIGHT = 3.05;
const DETECTOR_THICKNESS = 0.14;
const SAMPLE_SURFACE_LENGTH = 2.0;
const SAMPLE_TEACHING_YAW_DEG = 24;

function coneColorVariant(baseColorHex, useBrightTeachingVariant) {
  const color = new THREE.Color(baseColorHex);
  // A slight tone lift keeps translucent teaching cones readable against the
  // dark scene while preserving each plane family's color identity.
  return useBrightTeachingVariant ? color.offsetHSL(0, 0.06, 0.12) : color.offsetHSL(0, -0.03, -0.16);
}

export class EbsdScene {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x151815, 1);
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x151815);
    this.scene.fog = new THREE.Fog(0x111314, 6, 18);
    this.camera = new THREE.PerspectiveCamera(44, 1, 0.1, 100);
    this.camera.position.set(4.15, 3.35, 10.4);
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.target.set(1.25, 0.38, 1.05);

    this.pathMats = [];
    this.coneMeshes = [];
    this.planeMeshes = [];
    this.tiltGuideMats = [];
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
    this.buildTiltGuide();
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
      color: 0x747b76,
      metalness: 0.25,
      roughness: 0.45,
      side: THREE.DoubleSide
    });
    const sample = new THREE.Mesh(new THREE.BoxGeometry(3.65, 0.2, 2.55), sampleMat);
    this.sampleGroup.add(sample);
    sample.add(
      new THREE.LineSegments(
        new THREE.EdgesGeometry(sample.geometry),
        new THREE.LineBasicMaterial({ color: 0xffe0a3, transparent: true, opacity: 0.76 })
      )
    );

    this.ivol = new THREE.Mesh(
      new THREE.SphereGeometry(0.28, 40, 24),
      new THREE.MeshBasicMaterial({ color: 0xe6b55a, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending })
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
      mesh.userData.planeIndex = i;
      this.planesGroup.add(mesh);
      this.planeMeshes.push(mesh);
    });
  }

  buildCones() {
    planes.forEach((pl, planeIndex) => {
      const group = new THREE.Group();
      const cone = new THREE.Mesh(
        new THREE.BufferGeometry(),
        new THREE.MeshBasicMaterial({
          color: coneColorVariant(pl.color, true),
          transparent: true,
          opacity: 0.13,
          side: THREE.DoubleSide,
          depthWrite: false
        })
      );
      const boundary = new THREE.LineSegments(
        new THREE.BufferGeometry(),
        new THREE.LineBasicMaterial({
          color: pl.color,
          transparent: true,
          opacity: 0.92,
          depthWrite: false,
          depthTest: false
        })
      );
      boundary.renderOrder = 5;
      cone.userData.planeIndex = planeIndex;
      cone.userData.boundary = boundary;
      cone.add(boundary);
      group.add(cone);
      this.coneMeshes.push(cone);
      this.conesGroup.add(group);
    });
  }

  buildDetector() {
    this.detectorBody = new THREE.Mesh(
      new THREE.BoxGeometry(DETECTOR_WIDTH, DETECTOR_HEIGHT, DETECTOR_THICKNESS),
      new THREE.MeshStandardMaterial({
        color: 0x1b2427,
        metalness: 0.28,
        roughness: 0.24,
        transparent: true,
        opacity: 0.72,
        emissive: 0x0d1719,
        emissiveIntensity: 0.48
      })
    );
    // The slab is only a visual cue: detector cuts are still drawn on the
    // front z=0 plane so the pedagogical band overlay remains unchanged.
    this.detectorBody.position.z = -DETECTOR_THICKNESS / 2;
    this.detectorGroup.add(this.detectorBody);

    this.detectorScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(DETECTOR_WIDTH, DETECTOR_HEIGHT),
      new THREE.MeshPhysicalMaterial({
        color: 0x26343a,
        metalness: 0.18,
        roughness: 0.16,
        clearcoat: 0.85,
        clearcoatRoughness: 0.18,
        transparent: true,
        opacity: 0.56,
        side: THREE.DoubleSide,
        depthWrite: false,
        emissive: 0x182b30,
        emissiveIntensity: 0.65
      })
    );
    this.detectorScreen.position.z = 0.004;
    this.detectorGroup.add(this.detectorScreen);
    const grid = new THREE.GridHelper(Math.max(DETECTOR_WIDTH, DETECTOR_HEIGHT), 10, 0x6edee9, 0x4d5f59);
    grid.scale.x = DETECTOR_WIDTH / Math.max(DETECTOR_WIDTH, DETECTOR_HEIGHT);
    grid.scale.z = DETECTOR_HEIGHT / Math.max(DETECTOR_WIDTH, DETECTOR_HEIGHT);
    grid.rotation.x = Math.PI / 2;
    grid.position.z = 0.018;
    grid.material.transparent = true;
    grid.material.opacity = 0.28;
    this.detectorGroup.add(grid);
    const slabEdges = new THREE.LineSegments(
      new THREE.EdgesGeometry(new THREE.BoxGeometry(DETECTOR_WIDTH, DETECTOR_HEIGHT, DETECTOR_THICKNESS)),
      new THREE.LineBasicMaterial({ color: 0xd6f5f5, transparent: true, opacity: 0.82 })
    );
    slabEdges.position.z = -DETECTOR_THICKNESS / 2;
    this.detectorGroup.add(slabEdges);

    const centerMark = new THREE.Group();
    const markerMat = new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.58 });
    const markerLength = 0.18;
    [
      [new THREE.Vector3(-markerLength, 0, 0.02), new THREE.Vector3(markerLength, 0, 0.02)],
      [new THREE.Vector3(0, -markerLength, 0.02), new THREE.Vector3(0, markerLength, 0.02)]
    ].forEach((points) => {
      centerMark.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), markerMat));
    });
    this.detectorGroup.add(centerMark);
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

  buildTiltGuide() {
    this.tiltGuide = new THREE.Group();
    this.tiltGuide.position.set(-1.35, -0.34, -0.72);
    this.root.add(this.tiltGuide);
    this.tiltGuideMaterials = {
      horizontal: new THREE.LineBasicMaterial({ color: 0xd8e2dc, transparent: true, opacity: 0.58 }),
      sample: new THREE.LineBasicMaterial({ color: 0xe6b55a, transparent: true, opacity: 0.95 }),
      arc: new THREE.LineBasicMaterial({ color: 0x62d7f0, transparent: true, opacity: 0.95 })
    };

    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    this.tiltLabelContext = canvas.getContext('2d');
    this.tiltLabelTexture = new THREE.CanvasTexture(canvas);
    this.tiltLabel = new THREE.Sprite(new THREE.SpriteMaterial({
      map: this.tiltLabelTexture,
      transparent: true,
      depthTest: false,
      depthWrite: false
    }));
    this.tiltLabel.renderOrder = 10;
    this.tiltLabel.scale.set(1.72, 0.43, 1);
    this.tiltLabel.position.set(-1.36, 0.62, 0.08);
    this.root.add(this.tiltLabel);
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
    // The slider defines the specimen-surface angle from the negative X-axis.
    // This is a teaching convention: the sample surface ray starts at -X and
    // rotates upward by the selected tilt angle.
    this.sampleGroup.rotation.set(
      0,
      THREE.MathUtils.degToRad(SAMPLE_TEACHING_YAW_DEG),
      -tiltRad,
      'XYZ'
    );
    this.root.updateMatrixWorld(true);
    this.sampleGroup.updateMatrixWorld(true);
    this.updateDetectorPose();
    this.detectorGroup.updateMatrixWorld(true);
    this.updateTiltGuide(tiltRad);

    this.scatterGroup.visible = state.stage >= 2;
    this.planesGroup.visible = state.showPlanes && state.stage >= 3;
    this.conesGroup.visible = state.showCones && state.stage >= 4;
    this.traceGroup.visible = state.showIntersections && state.stage >= 5;

    this.pathMats.forEach((m, i) => {
      m.opacity = state.stage >= 2 ? 0.22 + 0.18 * Math.sin(state.time * 4 + i) : 0;
    });
    this.ivol.material.opacity = state.stage >= 2 ? 0.28 + 0.09 * Math.sin(state.time * 5) : 0;
    this.ivolCore.material.opacity = state.stage >= 2 ? 0.6 + 0.2 * Math.sin(state.time * 7) : 0;
    this.beam.material.opacity = state.stage >= 1 ? 0.55 + 0.16 * Math.sin(state.time * 9) : 0.1;
    this.beamGlow.material.opacity = state.stage >= 1 ? 0.11 + 0.05 * Math.sin(state.time * 9) : 0.02;

    this.planeMeshes.forEach((mesh) => {
      mesh.visible = activePlanes().includes(planes[mesh.userData.planeIndex]);
      const n = orientedNormal(mesh.userData.baseNormal);
      mesh.position.copy(INTERACTION_POINT);
      mesh.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(LOCAL_Z, n));
    });

    const geometryKey = [
      state.stage,
      state.tilt,
      state.distance,
      state.detectorHeight,
      state.voltage,
      state.rx,
      state.ry,
      state.rz,
      state.coneScale,
      state.planeCount,
      state.showIntersections
    ].join('|');
    const shouldRebuildGeometry = geometryKey !== this.lastGeometryKey;
    if (shouldRebuildGeometry) this.lastGeometryKey = geometryKey;

    this.coneMeshes.forEach((cone) => {
      cone.visible = activePlanes().includes(planes[cone.userData.planeIndex]);
      if (shouldRebuildGeometry) this.updateConePatch(cone);
    });
    if (shouldRebuildGeometry) this.update3DTraces();
  }

  updateDetectorPose() {
    const interactionWorld = this.sampleGroup.localToWorld(INTERACTION_POINT.clone());
    const sampleSurfaceNormalWorld = LOCAL_UP.clone()
      .applyQuaternion(this.sampleGroup.getWorldQuaternion(new THREE.Quaternion()))
      .normalize();

    // Teaching alignment: keep the EBSD detector plane parallel to the sample
    // surface, so their normals share one axis. The detector front normal
    // points back toward the sample, making the two surfaces face each other.
    const detectorNormalWorld = sampleSurfaceNormalWorld.clone().multiplyScalar(-1);
    const detectorDistance = 1.25 + state.distance * 0.58;
    const heightOffset = LOCAL_UP.clone().multiplyScalar((state.detectorHeight - 1.3) * 0.42);
    this.detectorGroup.position.copy(
      interactionWorld.clone()
        .add(sampleSurfaceNormalWorld.clone().multiplyScalar(detectorDistance))
        .add(heightOffset)
    );
    this.detectorGroup.quaternion.copy(new THREE.Quaternion().setFromUnitVectors(LOCAL_Z, detectorNormalWorld));
  }

  updateTiltGuide(tiltRad) {
    if (this.lastTiltGuideDeg === state.tilt) {
      this.updateTiltLabel();
      return;
    }
    this.lastTiltGuideDeg = state.tilt;

    this.tiltGuide.children.forEach((child) => {
      child.geometry?.dispose();
    });
    this.tiltGuide.clear();

    const origin = new THREE.Vector3(0, 0, 0);
    const negativeXEnd = new THREE.Vector3(-SAMPLE_SURFACE_LENGTH, 0, 0);
    const sampleEnd = new THREE.Vector3(
      -Math.cos(tiltRad) * SAMPLE_SURFACE_LENGTH,
      Math.sin(tiltRad) * SAMPLE_SURFACE_LENGTH,
      0
    );

    this.tiltGuide.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin, negativeXEnd]), this.tiltGuideMaterials.horizontal));
    this.tiltGuide.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints([origin, sampleEnd]), this.tiltGuideMaterials.sample));

    const arcPoints = [];
    const arcRadius = 0.78;
    for (let i = 0; i <= 28; i += 1) {
      const angle = Math.PI - (tiltRad * i) / 28;
      arcPoints.push(new THREE.Vector3(Math.cos(angle) * arcRadius, Math.sin(angle) * arcRadius, 0));
    }
    this.tiltGuide.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(arcPoints), this.tiltGuideMaterials.arc));

    this.updateTiltLabel();
  }

  updateTiltLabel() {
    const text = `${Math.round(state.tilt)} deg from -X`;
    if (this.lastTiltLabelText === text) return;
    this.lastTiltLabelText = text;

    const ctx = this.tiltLabelContext;
    ctx.clearRect(0, 0, 256, 64);
    ctx.fillStyle = 'rgba(12, 14, 13, 0.72)';
    ctx.strokeStyle = 'rgba(230, 181, 90, 0.75)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(8, 8, 240, 48, 10);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#fff3cf';
    ctx.font = '700 25px Segoe UI, Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, 128, 33);
    this.tiltLabelTexture.needsUpdate = true;
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
    const phiSegments = 56;
    const radialSegments = 12;
    const theta = THREE.MathUtils.degToRad(visualThetaDeg(state.voltage, pl.d));
    const sinAlpha = Math.cos(theta);
    const cosAlpha = Math.sin(theta);
    const vertices = [];
    const indices = [];
    const boundaryVertices = [];
    const row = phiSegments + 1;
    const addBoundarySegment = (a, b) => {
      boundaryVertices.push(a.x, a.y, a.z, b.x, b.y, b.z);
    };

    const addConeLobe = (axis) => {
      const baseIndex = vertices.length / 3;
      const points = [];
      const lobeBasis = this.axisBasis(axis);
      // The transparent body is intentionally a readable teaching cone around
      // the diffracted direction. The detector band spacing still comes from
      // the Bragg angle; this wider shell helps students see the cone shape.
      const teachingConeHalfAngle = THREE.MathUtils.degToRad(
        THREE.MathUtils.clamp(visualThetaDeg(state.voltage, pl.d) * 2.2, 15, 28)
      );
      const coneLength = 5.2;

      for (let r = 0; r <= radialSegments; r += 1) {
        const rowPoints = [];
        const t = THREE.MathUtils.lerp(0.02, coneLength, r / radialSegments);
        const radius = t * Math.tan(teachingConeHalfAngle);
        for (let p = 0; p <= phiSegments; p += 1) {
          const phi = (Math.PI * 2 * p) / phiSegments;
          const rimOffset = lobeBasis.u.clone().multiplyScalar(Math.cos(phi) * radius)
            .add(lobeBasis.v.clone().multiplyScalar(Math.sin(phi) * radius));
          const point = INTERACTION_POINT.clone()
            .add(axis.clone().multiplyScalar(t))
            .add(rimOffset);
          rowPoints.push(point);
          vertices.push(point.x, point.y, point.z);
        }
        points.push(rowPoints);
      }

      for (let r = 0; r < radialSegments; r += 1) {
        for (let p = 0; p < phiSegments; p += 1) {
          const a = baseIndex + r * row + p;
          const b = a + 1;
          const c = a + row;
          const d = c + 1;
          indices.push(a, c, b, b, c, d);
        }
      }

      // Strong boundary strokes make the circular cone form legible, similar
      // to textbook Debye-Scherrer cone sketches.
      const farRow = points[points.length - 1];
      for (let p = 0; p < phiSegments; p += 1) {
        addBoundarySegment(farRow[p], farRow[p + 1]);
      }
      [0, Math.floor(phiSegments / 4), Math.floor(phiSegments / 2), Math.floor((3 * phiSegments) / 4)].forEach((p) => {
        addBoundarySegment(points[0][p], farRow[p]);
      });
    };

    // One selected plane family should read as one visible cone system.
    // The paired Kikuchi band edges are still shown by the detector cuts;
    // duplicating solid upper/lower bodies made "2 families" look like many
    // unrelated cone systems.
    const braggConeAxis = basis.u.clone().multiplyScalar(Math.cos(centerPhi) * sinAlpha)
      .add(basis.v.clone().multiplyScalar(Math.sin(centerPhi) * sinAlpha))
      .add(normal.clone().multiplyScalar(cosAlpha))
      .normalize();
    const coneAxis = pl.teachingConeAxis
      ? pl.teachingConeAxis.clone().applyQuaternion(orientationQuat()).normalize()
      : braggConeAxis;
    [coneAxis, coneAxis.clone().multiplyScalar(-1)].forEach((axis) => {
      addConeLobe(axis);
    });

    cone.geometry.dispose();
    cone.geometry = new THREE.BufferGeometry();
    cone.geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    cone.geometry.setIndex(indices);
    cone.geometry.computeVertexNormals();
    cone.userData.boundary.geometry.dispose();
    cone.userData.boundary.geometry = new THREE.BufferGeometry();
    cone.userData.boundary.geometry.setAttribute('position', new THREE.Float32BufferAttribute(boundaryVertices, 3));
  }

  planeBasis(normal) {
    const seed = Math.abs(normal.dot(LOCAL_UP)) > 0.92 ? new THREE.Vector3(1, 0, 0) : LOCAL_UP;
    const u = new THREE.Vector3().crossVectors(seed, normal).normalize();
    const v = new THREE.Vector3().crossVectors(normal, u).normalize();
    return { u, v };
  }

  axisBasis(axis) {
    const seed = Math.abs(axis.dot(LOCAL_UP)) > 0.92 ? new THREE.Vector3(1, 0, 0) : LOCAL_UP;
    const u = new THREE.Vector3().crossVectors(seed, axis).normalize();
    const v = new THREE.Vector3().crossVectors(axis, u).normalize();
    return { u, v };
  }

  update3DTraces() {
    this.traceGroup.clear();
    if (state.stage < 5 || !state.showIntersections) return;
    const traceSpecs = [];

    activePlanes().forEach((pl) => {
      const nWorld = orientedNormal(pl.normal).applyQuaternion(this.sampleGroup.getWorldQuaternion(new THREE.Quaternion())).normalize();
      const vertexWorld = this.sampleGroup.localToWorld(INTERACTION_POINT.clone());
      const nDet = nWorld.applyQuaternion(this.detectorGroup.getWorldQuaternion(new THREE.Quaternion()).invert()).normalize();
      const vertexDet = this.detectorGroup.worldToLocal(vertexWorld);
      const nxy = new THREE.Vector2(nDet.x, nDet.y);
      if (nxy.lengthSq() < 0.0001) return;
      const unitNormal = nxy.clone().normalize();
      const lineDir = new THREE.Vector2(-unitNormal.y, unitNormal.x);
      const rawCenterOffset = THREE.MathUtils.clamp(nDet.dot(vertexDet) / nxy.length(), -1.15, 1.15);
      const visualTheta = THREE.MathUtils.degToRad(visualThetaDeg(state.voltage, pl.d));
      const sep = THREE.MathUtils.clamp(Math.tan(visualTheta) * Math.max(1.2, vertexDet.length()) * 0.16, 0.055, 0.17);
      [-sep, sep].forEach((s) => {
        traceSpecs.push({
          unitNormal,
          lineDir,
          offset: rawCenterOffset + s,
          color: pl.color
        });
      });
    });

    if (traceSpecs.length === 0) return;

    // A true cone-plane intersection can project mostly to one side for a
    // given teaching pose. For this classroom overlay we recentre the family
    // of cuts on the detector so students can compare both band edges instead
    // of reading the view as a failed alignment.
    const averageOffset = traceSpecs.reduce((sum, trace) => sum + trace.offset, 0) / traceSpecs.length;
    traceSpecs.forEach((trace) => {
      const teachingOffset = THREE.MathUtils.clamp((trace.offset - averageOffset) * 0.82, -1.05, 1.05);
      this.addDetectorTrace(trace.unitNormal, trace.lineDir, teachingOffset, trace.color);
    });
  }

  addDetectorTrace(unitNormal, lineDir, offset, color) {
    const halfWidth = DETECTOR_WIDTH / 2 - 0.08;
    const halfHeight = DETECTOR_HEIGHT / 2 - 0.08;
    const clippedLine = this.clipLineToDetector(unitNormal, lineDir, offset, halfWidth, halfHeight);
    if (!clippedLine) return;
    const { a, b } = clippedLine;
    const bandWidth = 0.028;
    const normalOffset = unitNormal.clone().multiplyScalar(bandWidth);
    const stripVertices = [
      a.clone().add(normalOffset), b.clone().add(normalOffset),
      a.clone().sub(normalOffset), b.clone().add(normalOffset),
      b.clone().sub(normalOffset), a.clone().sub(normalOffset)
    ];
    const stripGeom = new THREE.BufferGeometry().setFromPoints(stripVertices.map((p) => new THREE.Vector3(p.x, p.y, 0.018)));
    this.traceGroup.add(new THREE.Mesh(
      stripGeom,
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false })
    ));

    const lineGeom = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(a.x, a.y, 0.026),
      new THREE.Vector3(b.x, b.y, 0.026)
    ]);
    this.traceGroup.add(new THREE.Line(lineGeom, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.96 })));
  }

  clipLineToDetector(unitNormal, lineDir, offset, halfWidth, halfHeight) {
    const center = unitNormal.clone().multiplyScalar(offset);
    const candidates = [];

    if (Math.abs(lineDir.x) > 0.0001) {
      [-halfWidth, halfWidth].forEach((x) => {
        const t = (x - center.x) / lineDir.x;
        const y = center.y + lineDir.y * t;
        if (y >= -halfHeight && y <= halfHeight) candidates.push({ t, point: new THREE.Vector2(x, y) });
      });
    }

    if (Math.abs(lineDir.y) > 0.0001) {
      [-halfHeight, halfHeight].forEach((y) => {
        const t = (y - center.y) / lineDir.y;
        const x = center.x + lineDir.x * t;
        if (x >= -halfWidth && x <= halfWidth) candidates.push({ t, point: new THREE.Vector2(x, y) });
      });
    }

    if (candidates.length < 2) return null;
    candidates.sort((left, right) => left.t - right.t);
    return {
      a: candidates[0].point,
      b: candidates[candidates.length - 1].point
    };
  }

  render() {
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }
}
