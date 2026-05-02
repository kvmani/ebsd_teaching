import { state } from './state.js';

const GRAIN_COLORS = [
  [96, 215, 240],
  [146, 212, 111],
  [231, 132, 186],
  [230, 181, 90],
  [174, 152, 232],
  [244, 154, 98]
];

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function hashNoise(x, y, seed = 0) {
  const n = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothstep(edge0, edge1, value) {
  const x = clamp((value - edge0) / (edge1 - edge0), 0, 1);
  return x * x * (3 - 2 * x);
}

export class AcquisitionRenderer {
  constructor(scanCanvas, patternCanvas) {
    this.scanCanvas = scanCanvas;
    this.scanContext = scanCanvas.getContext('2d', { willReadFrequently: true });
    this.patternCanvas = patternCanvas;
    this.patternContext = patternCanvas.getContext('2d');
    this.width = scanCanvas.width;
    this.height = scanCanvas.height;
    this.scanX = 0;
    this.scanY = 0;
    this.frame = 0;
    this.scanAccumulator = 0;
    this.lastKey = '';
    this.lastPatternBucket = '';
    this.imageData = this.scanContext.createImageData(this.width, this.height);
    this.baseMap = new Uint8Array(this.width * this.height);
    this.confidenceMap = new Float32Array(this.width * this.height);
    this.buildMicrostructure();
    this.clearScan();
  }

  buildMicrostructure() {
    const centers = [
      { x: 0.14, y: 0.18, color: 0 },
      { x: 0.38, y: 0.16, color: 1 },
      { x: 0.72, y: 0.18, color: 2 },
      { x: 0.18, y: 0.55, color: 3 },
      { x: 0.48, y: 0.52, color: 4 },
      { x: 0.78, y: 0.58, color: 5 },
      { x: 0.32, y: 0.86, color: 2 },
      { x: 0.64, y: 0.84, color: 0 }
    ];

    for (let y = 0; y < this.height; y += 1) {
      for (let x = 0; x < this.width; x += 1) {
        const nx = x / this.width;
        const ny = y / this.height;
        let best = centers[0];
        let bestDist = Infinity;
        let secondDist = Infinity;

        centers.forEach((center) => {
          const warp = (hashNoise(x * 0.035, y * 0.035, center.color) - 0.5) * 0.09;
          const dx = nx - center.x + warp;
          const dy = ny - center.y - warp * 0.55;
          const dist = dx * dx + dy * dy;
          if (dist < bestDist) {
            secondDist = bestDist;
            bestDist = dist;
            best = center;
          } else if (dist < secondDist) {
            secondDist = dist;
          }
        });

        const boundary = 1 - smoothstep(0.001, 0.024, secondDist - bestDist);
        const idx = y * this.width + x;
        this.baseMap[idx] = best.color;
        this.confidenceMap[idx] = clamp(0.96 - boundary * 0.48 - hashNoise(x, y, 8) * 0.08, 0.35, 0.98);
      }
    }
  }

  clearScan() {
    const data = this.imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      data[i] = 11;
      data[i + 1] = 14;
      data[i + 2] = 15;
      data[i + 3] = 255;
    }
    this.scanContext.putImageData(this.imageData, 0, 0);
  }

  reset() {
    this.scanX = 0;
    this.scanY = 0;
    this.scanAccumulator = 0;
    this.lastPatternBucket = '';
    this.frame += 1;
    this.clearScan();
  }

  update(dt) {
    const key = [
      state.acquisition.gain,
      state.acquisition.binning,
      state.acquisition.exposureMs,
      state.acquisition.beamCurrent,
      state.acquisition.frameAverage,
      state.acquisition.drift,
      state.acquisition.bandDetection,
      state.acquisition.indexingThreshold,
      state.acquisition.mapMode,
      state.acquisition.backgroundCorrection
    ].join('|');

    if (key !== this.lastKey) {
      this.lastKey = key;
      this.reset();
      this.drawPatternPreview();
    }

    if (!state.acquisition.live) {
      this.scanContext.putImageData(this.imageData, 0, 0);
      this.drawRasterCursor();
      return;
    }

    const dwellPenalty = state.acquisition.exposureMs * state.acquisition.frameAverage;
    const pixelsPerSecond = (this.width * 48 * state.acquisition.scanSpeed) / Math.max(8, dwellPenalty);
    this.scanAccumulator += pixelsPerSecond * dt;
    const pixelsToDraw = Math.max(1, Math.floor(this.scanAccumulator));
    this.scanAccumulator -= pixelsToDraw;
    const previousPatternBucket = this.patternBucket();

    for (let i = 0; i < pixelsToDraw; i += 1) {
      this.drawPixel(this.scanX, this.scanY);
      this.scanX += 1;
      if (this.scanX >= this.width) {
        this.scanX = 0;
        this.scanY += 1;
        if (this.scanY >= this.height) this.scanY = 0;
      }
    }
    this.scanContext.putImageData(this.imageData, 0, 0);
    this.drawRasterCursor();
    const nextPatternBucket = this.patternBucket();
    if (nextPatternBucket !== previousPatternBucket && nextPatternBucket !== this.lastPatternBucket) {
      this.lastPatternBucket = nextPatternBucket;
      this.drawPatternPreview();
    }
  }

  patternBucket() {
    return `${Math.floor(this.scanX / 36)}:${Math.floor(this.scanY / 24)}`;
  }

  qualityModel() {
    const exposureSignal = Math.sqrt(state.acquisition.exposureMs / 28);
    const currentSignal = Math.sqrt(state.acquisition.beamCurrent / 55);
    const binningSignal = Math.sqrt(state.acquisition.binning);
    const averagingSignal = Math.sqrt(state.acquisition.frameAverage);
    const signalToNoise = exposureSignal * currentSignal * binningSignal * averagingSignal;
    const clipping = Math.max(0, state.acquisition.gain * state.acquisition.beamCurrent / 92 - 1);
    const spatialLoss = (state.acquisition.binning - 1) * 0.055;
    const driftLoss = state.acquisition.drift * 0.005;
    const correctionBoost = state.acquisition.backgroundCorrection ? 0.07 : -0.03;
    const detectionBoost = (state.acquisition.bandDetection - 65) * 0.0018;
    const quality = clamp(0.22 + signalToNoise * 0.22 - clipping * 0.26 - spatialLoss - driftLoss + correctionBoost + detectionBoost, 0.05, 0.98);
    return { signalToNoise, clipping, spatialLoss, driftLoss, quality };
  }

  drawPixel(x, y) {
    const data = this.imageData.data;
    const { quality, clipping } = this.qualityModel();
    const binning = state.acquisition.binning;
    const gain = state.acquisition.gain;
    const driftPixels = (state.acquisition.drift / 100) * y * 0.26;
    const sampleX = clamp(Math.round(x + driftPixels), 0, this.width - 1);
      const sampleY = y;
      const idx = sampleY * this.width + sampleX;
      const grainColor = GRAIN_COLORS[this.baseMap[idx]];
      const confidence = this.confidenceMap[idx] * quality;
      const indexed = this.isIndexed(confidence);
      const noiseAmp = (1 - quality) * 130;
    const shade = 0.74 + confidence * 0.32;
    const seed = this.frame * 17 + y * 0.13;
    const darkPixels = confidence < 0.38 && hashNoise(x, y, seed + 3) > confidence + 0.25;
    const pq = clamp(confidence * 255, 0, 255);
    const ci = confidence > 0.68 ? [95, 215, 170] : confidence > 0.44 ? [230, 181, 90] : [238, 96, 116];

      let color = indexed ? grainColor : [44, 49, 50];
      if (state.acquisition.mapMode === 'quality') color = [pq, pq * 0.92, pq * 0.72];
      if (state.acquisition.mapMode === 'confidence') color = ci;

    for (let bx = 0; bx < binning && x + bx < this.width; bx += 1) {
      for (let by = 0; by < binning && y + by < this.height; by += 1) {
        const out = ((y + by) * this.width + x + bx) * 4;
        const noise = (hashNoise(x + bx, y + by, seed) - 0.5) * noiseAmp;
        const banding = Math.sin((x + y * 0.55) * 0.11 + this.frame) * (1 - quality) * 20;
        const hotPixel = hashNoise(x + bx, y + by, seed + 99) > 0.996 - clipping * 0.01;
        const clippedBoost = clipping > 0 ? 42 * clipping : 0;

        data[out] = hotPixel ? 255 : clamp(color[0] * shade * gain + noise + banding + clippedBoost, darkPixels ? 10 : 0, 255);
        data[out + 1] = hotPixel ? 255 : clamp(color[1] * shade * gain + noise * 0.85 + clippedBoost, darkPixels ? 10 : 0, 255);
        data[out + 2] = hotPixel ? 255 : clamp(color[2] * shade * gain + noise * 1.1 - banding + clippedBoost, darkPixels ? 12 : 0, 255);
        data[out + 3] = 255;
      }
    }
  }

  drawRasterCursor() {
    if (!state.acquisition.showScanLine) return;
    const ctx = this.scanContext;
    ctx.save();
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = 'rgba(255, 239, 176, 0.82)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.scanY + 0.5);
    ctx.lineTo(this.width, this.scanY + 0.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(this.scanX + 0.5, Math.max(0, this.scanY - 10));
    ctx.lineTo(this.scanX + 0.5, Math.min(this.height, this.scanY + 10));
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 239, 176, 0.95)';
    ctx.fillRect(this.scanX - 2, this.scanY - 2, 5, 5);
    ctx.restore();
  }

  drawPatternPreview() {
    const ctx = this.patternContext;
    const { quality, clipping } = this.qualityModel();
    const w = this.patternCanvas.width;
    const h = this.patternCanvas.height;
    const current = this.currentPatternState();
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0a0d0e';
    ctx.fillRect(0, 0, w, h);

    const gradient = ctx.createRadialGradient(w * 0.52, h * 0.46, 8, w * 0.5, h * 0.5, w * 0.58);
    gradient.addColorStop(0, `rgba(${current.color.join(',')}, ${0.18 + current.confidence * 0.42})`);
    gradient.addColorStop(0.42, `rgba(120, 210, 220, ${0.1 + quality * 0.22})`);
    gradient.addColorStop(1, 'rgba(8, 10, 11, 1)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    const angleShift = (current.grainIndex - 2.5) * 0.22 + Math.sin(this.scanY * 0.014) * 0.08;
    const offsetShift = (current.grainIndex - 2) * 20 + Math.cos(this.scanX * 0.018) * 14;
    const bands = [
      { a: -0.55 + angleShift, b: 132 + offsetShift, color: '98,215,240' },
      { a: 0.72 - angleShift * 0.55, b: 44 - offsetShift * 0.35, color: '146,212,111' },
      { a: -1.45 + angleShift * 0.35, b: 238 + offsetShift * 0.48, color: '231,132,186' },
      { a: 0.18 + angleShift * 0.8, b: 170 - offsetShift * 0.25, color: '230,181,90' }
    ];
    bands.forEach((band, i) => {
      ctx.strokeStyle = `rgba(${band.color}, ${0.18 + current.confidence * 0.62})`;
      ctx.lineWidth = Math.max(2, 9 - state.acquisition.binning * 0.8);
      ctx.beginPath();
      ctx.moveTo(0, band.b);
      ctx.lineTo(w, band.b + band.a * w);
      ctx.stroke();
      ctx.strokeStyle = `rgba(255,255,255, ${0.08 + quality * 0.2})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, band.b + 18 + i * 2);
      ctx.lineTo(w, band.b + 18 + i * 2 + band.a * w);
      ctx.stroke();
    });
    ctx.restore();

    const image = ctx.getImageData(0, 0, w, h);
    const data = image.data;
    for (let i = 0; i < data.length; i += 4) {
      const n = (hashNoise(i, this.frame + this.scanX * 0.03 + this.scanY * 0.07, 4) - 0.5) * (1 - current.confidence) * 110;
      const background = state.acquisition.backgroundCorrection ? 0.88 : 1.12;
      data[i] = clamp(data[i] * state.acquisition.gain * background + n + clipping * 38, 0, 255);
      data[i + 1] = clamp(data[i + 1] * state.acquisition.gain * background + n + clipping * 38, 0, 255);
      data[i + 2] = clamp(data[i + 2] * state.acquisition.gain * background + n + clipping * 38, 0, 255);
    }
    ctx.putImageData(image, 0, 0);

    if (state.acquisition.showIndexing) {
      ctx.strokeStyle = `rgba(255, 238, 174, ${0.28 + quality * 0.55})`;
      ctx.lineWidth = 1;
      const indexAlpha = current.indexed
        ? clamp((0.24 + current.confidence * 0.58) * (state.acquisition.bandDetection / 65), 0.12, 0.95)
        : 0.18;
      ctx.strokeStyle = `rgba(255, 238, 174, ${indexAlpha})`;
      const spacing = state.acquisition.bandDetection >= 75 ? 46 : state.acquisition.bandDetection <= 35 ? 72 : 56;
      for (let x = 42 + current.grainIndex * 3; x < w; x += spacing) {
        ctx.beginPath();
        ctx.moveTo(x, 26);
        ctx.lineTo(x, 38);
        ctx.moveTo(x - 6, 32);
        ctx.lineTo(x + 6, 32);
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.fillStyle = 'rgba(8, 10, 11, 0.68)';
    ctx.strokeStyle = 'rgba(220, 235, 228, 0.16)';
    ctx.lineWidth = 1;
    ctx.roundRect(12, h - 44, 172, 30, 7);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#eef7f2';
    ctx.font = '600 12px Segoe UI, Arial, sans-serif';
    ctx.fillText(`pixel ${this.scanX}, ${this.scanY}`, 24, h - 24);
    ctx.restore();
  }

  currentPatternState() {
    const driftPixels = (state.acquisition.drift / 100) * this.scanY * 0.26;
    const x = clamp(Math.round(this.scanX + driftPixels), 0, this.width - 1);
    const y = clamp(this.scanY, 0, this.height - 1);
    const idx = y * this.width + x;
    const grainIndex = this.baseMap[idx];
    const { quality } = this.qualityModel();
    const confidence = clamp(this.confidenceMap[idx] * quality, 0.04, 0.98);
    return {
      grainIndex,
      color: GRAIN_COLORS[grainIndex],
      confidence,
      indexed: this.isIndexed(confidence)
    };
  }

  isIndexed(confidence) {
    const detectionHelp = (state.acquisition.bandDetection - 65) * 0.0025;
    return confidence + detectionHelp >= state.acquisition.indexingThreshold / 100;
  }

  metrics() {
    const { quality, clipping } = this.qualityModel();
    const current = this.currentPatternState();
    const dwellMs = state.acquisition.exposureMs * state.acquisition.frameAverage;
    const speed = 1000 / Math.max(1, dwellMs) * state.acquisition.scanSpeed;
    const pixelSize = state.acquisition.binning;
    const progress = ((this.scanY * this.width + this.scanX) / (this.width * this.height)) * 100;
    const detail = clamp(1 - (pixelSize - 1) / 7 - state.acquisition.drift / 120, 0.05, 1);
    const speedScore = clamp(speed / 120, 0.05, 1);
    const falseBandRisk = state.acquisition.bandDetection > 85 ? (state.acquisition.bandDetection - 85) / 80 : 0;
    const thresholdRisk = state.acquisition.indexingThreshold > quality * 100 ? 0.24 : 0;
    const risk = clamp(clipping * 0.7 + (1 - quality) * 0.35 + state.acquisition.drift / 120 + falseBandRisk + thresholdRisk, 0.02, 1);
    const indexRate = clamp(quality + (state.acquisition.bandDetection - 65) / 160 - (state.acquisition.indexingThreshold - 42) / 120, 0.02, 0.99);
    return {
      quality: Math.round(quality * 100),
      speed: `${speed.toFixed(1)} px/ms`,
      resolution: `${Math.round(this.width / pixelSize)} x ${Math.round(this.height / pixelSize)}`,
      progress: `${Math.floor(progress)}%`,
      pixel: `${this.scanX}, ${this.scanY}`,
      grain: `grain ${current.grainIndex + 1}`,
      dwell: `${dwellMs} ms`,
      indexRate: `${Math.round(indexRate * 100)}%`,
      scores: {
        signal: Math.round(quality * 100),
        detail: Math.round(detail * 100),
        speed: Math.round(speedScore * 100),
        risk: Math.round(risk * 100)
      },
      warning: clipping > 0.18 ? 'gain clipping' : quality < 0.45 ? 'noisy indexing' : pixelSize >= 4 ? 'coarse pixels' : state.acquisition.drift > 35 ? 'drift visible' : state.acquisition.bandDetection < 35 ? 'missed bands' : state.acquisition.indexingThreshold > quality * 100 ? 'strict threshold' : 'stable scan'
    };
  }
}
