import * as THREE from 'three';

export const state = {
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
  playing: false,
  time: 0,
  acquisition: {
    gain: 1.2,
    binning: 2,
    exposureMs: 28,
    beamCurrent: 55,
    frameAverage: 2,
    scanSpeed: 1.0,
    stepSize: 0.25,
    drift: 0,
    bandDetection: 65,
    indexingThreshold: 42,
    indexingMode: 'hough',
    qualityOverlay: 'none',
    mapUpdate: 'live',
    autoIndex: true,
    confirmLowConfidence: false,
    mapMode: 'orientation',
    backgroundCorrection: true,
    showIndexing: true,
    showScanLine: true,
    live: true
  }
};

export const stages = [
  {
    title: '1. Incident electron beam',
    text: 'Primary SEM electrons travel from the pole piece toward a strongly tilted crystalline specimen. The high tilt helps backscattered electrons escape toward the EBSD detector.'
  },
  {
    title: '2. Interaction volume',
    text: 'After impact, electrons scatter in a small near-surface region. The glowing volume is schematic: it shows where useful backscattered electrons originate, not a Monte Carlo calculation.'
  },
  {
    title: '3. Crystal lattice planes',
    text: 'Scattered electrons encounter families of crystal planes. Some directions satisfy Bragg diffraction conditions for specific d-spacings and plane orientations.'
  },
  {
    title: '4. Bragg diffraction cones',
    text: 'Each active plane family emits a schematic Bragg/Kossel cone system from the impact point. The cone angles are magnified so students can see geometry that is physically only a few degrees wide.'
  },
  {
    title: '5. Cone intersection with detector',
    text: 'The phosphor screen cuts the cone surfaces. The two nearby cut edges define the visible Kikuchi band edges on the detector pattern.'
  },
  {
    title: '6. Kikuchi bands and full pattern',
    text: 'Multiple plane families produce a network of Kikuchi bands. Rotating the crystal moves the bands; changing voltage changes wavelength and band width subtly.'
  }
];

export const planes = [
  { hkl: '(001)', normal: new THREE.Vector3(0, 1, 0).normalize(), d: 0.203, color: 0x62d7f0, band: 'rgba(98,215,240,' },
  { hkl: '(101)', normal: new THREE.Vector3(0.28, 1, 0.12).normalize(), d: 0.176, color: 0x92d46f, band: 'rgba(146,212,111,' },
  // Teaching visual override: this family is drawn perpendicular to the
  // horizontal family so students can compare a clear cross direction.
  { hkl: '(011)', normal: new THREE.Vector3(-0.32, 1, 0.16).normalize(), teachingConeAxis: new THREE.Vector3(0, 1, 0).normalize(), d: 0.124, color: 0xe784ba, band: 'rgba(231,132,186,' },
  // Teaching visual override: this family is drawn at an approximate
  // 45 degree incline for a deliberately readable diagonal cone family.
  { hkl: '(112)', normal: new THREE.Vector3(0.18, 1, -0.34).normalize(), teachingConeAxis: new THREE.Vector3(1, 1, 0).normalize(), d: 0.144, color: 0xe6b55a, band: 'rgba(230,181,90,' },
  { hkl: '(123)', normal: new THREE.Vector3(-0.44, 1, -0.2).normalize(), d: 0.094, color: 0xae98e8, band: 'rgba(174,152,232,' }
];

export function electronWavelengthPm(kV) {
  const V = kV * 1000.0;
  return 1226.39 / Math.sqrt(V * (1 + 0.97845e-6 * V));
}

export function braggThetaDeg(kV, dNm) {
  const lambdaNm = electronWavelengthPm(kV) * 1e-3;
  const value = Math.min(0.999999, lambdaNm / (2 * dNm));
  return THREE.MathUtils.radToDeg(Math.asin(value));
}

export function visualThetaDeg(kV, dNm) {
  // EBSD Bragg angles are only a few degrees, which is too subtle for a
  // classroom 3D schematic. The slider-controlled scale keeps the mapping
  // honest while letting instructors enlarge the cone opening for discussion.
  return THREE.MathUtils.clamp(braggThetaDeg(kV, dNm) * state.coneScale, 3.5, 12);
}

export function orientationQuat() {
  const euler = new THREE.Euler(
    THREE.MathUtils.degToRad(state.rx),
    THREE.MathUtils.degToRad(state.ry),
    THREE.MathUtils.degToRad(state.rz),
    'XYZ'
  );
  return new THREE.Quaternion().setFromEuler(euler);
}

export function orientedNormal(normal) {
  return normal.clone().applyQuaternion(orientationQuat()).normalize();
}

export function activePlanes() {
  const requestedPlaneCount = THREE.MathUtils.clamp(Math.round(state.planeCount), 1, planes.length);
  if (state.stage >= 6) return planes.slice(0, requestedPlaneCount);
  if (state.stage >= 4) return planes.slice(0, Math.min(3, requestedPlaneCount));
  if (state.stage >= 3) return planes.slice(0, Math.min(2, requestedPlaneCount));
  return [];
}
