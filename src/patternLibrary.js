import { kikuchiPatterns } from './data/kikuchiPatterns.js';

class PatternLibrary {
  constructor(patterns) {
    this.patterns = patterns;
    this.loadedPatterns = [];
    this.status = 'idle';
    this.loadPromise = null;
  }

  preload() {
    if (this.loadPromise) return this.loadPromise;
    this.status = 'loading';
    this.loadPromise = Promise.all(this.patterns.map((entry) => this.loadOne(entry)))
      .then((results) => {
        this.loadedPatterns = results.filter(Boolean);
        this.status = this.loadedPatterns.length > 0 ? 'ready' : 'fallback';
        return this.loadedPatterns;
      })
      .catch(() => {
        this.loadedPatterns = [];
        this.status = 'fallback';
        return [];
      });
    return this.loadPromise;
  }

  loadOne(entry) {
    return new Promise((resolve) => {
      const image = new Image();
      image.onload = () => resolve({ ...entry, image });
      // Broken local paths are expected while local study assets are still being curated.
      // Resolve null instead of rejecting so the app never crashes.
      image.onerror = () => resolve(null);
      image.src = entry.src;
    });
  }

  hasRealPatterns() {
    return this.loadedPatterns.length > 0;
  }

  getPatternForIndex(index) {
    if (!this.hasRealPatterns()) return null;
    const safeIndex = Math.abs(Math.floor(index)) % this.loadedPatterns.length;
    return this.loadedPatterns[safeIndex];
  }

  sourceLabel() {
    if (this.status === 'loading') return 'Pattern source: checking local image library';
    return this.hasRealPatterns()
      ? 'Pattern source: Real local Kikuchi image'
      : 'Pattern source: Fallback schematic';
  }
}

export const patternLibrary = new PatternLibrary(kikuchiPatterns);
