import { activePlanes, braggThetaDeg, electronWavelengthPm, orientationQuat, planes, state, visualThetaDeg } from './state.js';

export class DetectorRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { willReadFrequently: true });
    this.cssSize = 900;
  }

  resize() {
    const rect = this.canvas.getBoundingClientRect();
    const size = Math.max(280, Math.floor(Math.min(rect.width || 900, rect.height || rect.width || 900)));
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.floor(size * dpr);
    if (this.canvas.width !== px || this.canvas.height !== px) {
      this.canvas.width = px;
      this.canvas.height = px;
    }
    this.cssSize = size;
  }

  draw() {
    this.resize();
    const { canvas, ctx } = this;
    const W = canvas.width;
    const H = canvas.height;
    const cx = W / 2;
    const cy = H / 2;

    const g = ctx.createRadialGradient(cx * 0.92, cy * 0.85, 20, cx, cy, W * 0.68);
    g.addColorStop(0, '#34353b');
    g.addColorStop(0.55, '#17191e');
    g.addColorStop(1, '#050607');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    if (state.showNoise) this.drawNoise();

    ctx.save();
    ctx.strokeStyle = 'rgba(215,226,226,0.28)';
    ctx.lineWidth = Math.max(2, W / 450);
    ctx.strokeRect(W * 0.027, H * 0.027, W * 0.946, H * 0.946);
    ctx.restore();

    if (state.stage < 5) {
      this.drawWaiting(cx, cy);
      return;
    }

    const q = orientationQuat();
    const scale = W * 0.322 * (3.0 / state.distance);
    const tiltShift = (state.tilt - 70) * W * 0.0033;
    activePlanes().forEach((pl, i) => {
      const n = pl.normal.clone().applyQuaternion(q).normalize();
      const angle = Math.atan2(n.x + 0.08 * Math.sin(i), n.z + 0.06 * Math.cos(i)) + Math.PI / 2;
      const offset = ((n.y - 0.82) * 1.8 + 0.15 * Math.sin(i * 1.7)) * scale + tiltShift;
      const theta = visualThetaDeg(state.voltage, pl.d);
      const widthPx = Math.max(W * 0.018, theta * W * 0.011 * (3.0 / state.distance));
      this.drawBand(cx, cy, angle, offset, widthPx, pl, i);
    });

    this.drawPatternCenter(cx, cy);
  }

  drawNoise() {
    const { canvas, ctx } = this;
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < img.data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 22;
      img.data[i] = Math.max(0, Math.min(255, img.data[i] + noise));
      img.data[i + 1] = Math.max(0, Math.min(255, img.data[i + 1] + noise));
      img.data[i + 2] = Math.max(0, Math.min(255, img.data[i + 2] + noise));
    }
    ctx.putImageData(img, 0, 0);
  }

  drawWaiting(cx, cy) {
    const { canvas, ctx } = this;
    ctx.fillStyle = 'rgba(232,238,235,0.78)';
    ctx.font = `600 ${Math.max(18, canvas.width * 0.035)}px Segoe UI, Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('Detector waiting for Bragg cones...', cx, cy);
    ctx.font = `${Math.max(14, canvas.width * 0.024)}px Segoe UI, Arial, sans-serif`;
    ctx.fillStyle = 'rgba(176,185,181,0.86)';
    ctx.fillText('Advance to stage 5 or 6', cx, cy + canvas.width * 0.047);
  }

  drawPatternCenter(cx, cy) {
    const { canvas, ctx } = this;
    const s = canvas.width * 0.013;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = Math.max(1, canvas.width / 900);
    ctx.beginPath();
    ctx.moveTo(cx - s, cy);
    ctx.lineTo(cx + s, cy);
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx, cy + s);
    ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.78)';
    ctx.font = `${Math.max(12, canvas.width * 0.018)}px Segoe UI, Arial, sans-serif`;
    ctx.fillText('PC', cx + s * 1.5, cy - s);
    ctx.restore();
  }

  drawBand(cx, cy, angle, offset, width, pl, idx) {
    const { canvas, ctx } = this;
    const nx = Math.cos(angle + Math.PI / 2);
    const ny = Math.sin(angle + Math.PI / 2);
    const x0 = cx + nx * offset;
    const y0 = cy + ny * offset;
    const gradient = ctx.createLinearGradient(
      x0 - nx * width * 2.2,
      y0 - ny * width * 2.2,
      x0 + nx * width * 2.2,
      y0 + ny * width * 2.2
    );
    gradient.addColorStop(0.0, 'rgba(0,0,0,0)');
    gradient.addColorStop(0.24, 'rgba(255,255,255,0.025)');
    gradient.addColorStop(0.37, 'rgba(0,0,0,0.18)');
    gradient.addColorStop(0.5, 'rgba(225,235,232,0.11)');
    gradient.addColorStop(0.63, 'rgba(255,255,255,0.055)');
    gradient.addColorStop(0.78, 'rgba(0,0,0,0.14)');
    gradient.addColorStop(1.0, 'rgba(0,0,0,0)');

    ctx.save();
    ctx.translate(x0, y0);
    ctx.rotate(angle);
    ctx.fillStyle = gradient;
    // Real EBSD bands appear as diffuse bright/dark detector contrast, not
    // solid colored tubes. The colored strokes below keep the teaching link
    // to each plane family, while this grayscale envelope stays subtle.
    ctx.globalAlpha = 0.52;
    ctx.fillRect(-canvas.width * 1.4, -width * 3.2, canvas.width * 2.8, width * 6.4);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = `${pl.band}0.74)`;
    ctx.lineWidth = Math.max(1.5, canvas.width / 500);
    ctx.beginPath();
    ctx.moveTo(-canvas.width * 1.4, -width / 2);
    ctx.lineTo(canvas.width * 1.4, -width / 2);
    ctx.moveTo(-canvas.width * 1.4, width / 2);
    ctx.lineTo(canvas.width * 1.4, width / 2);
    ctx.stroke();

    if (state.showLabels) {
      ctx.fillStyle = `${pl.band}0.95)`;
      ctx.font = `700 ${Math.max(13, canvas.width * 0.024)}px Segoe UI, Arial, sans-serif`;
      ctx.fillText(pl.hkl, -canvas.width * 0.38 + idx * canvas.width * 0.09, -width - canvas.width * 0.013);
    }
    ctx.restore();
  }
}

export function detectorCaption() {
  const lambda = electronWavelengthPm(state.voltage);
  const theta = braggThetaDeg(state.voltage, planes[0].d);
  const visualTheta = visualThetaDeg(state.voltage, planes[0].d);
  return `Each pair of thin colored lines marks the two cone-cut band edges for one lattice-plane family. At ${state.voltage} kV, lambda is approximately ${lambda.toFixed(2)} pm; for ${planes[0].hkl}, physical theta is ${theta.toFixed(2)} deg and the teaching cone angle is ${visualTheta.toFixed(1)} deg.`;
}
