// Local-only Kikuchi pattern library entries.
// Add your own images under public/kikuchi-patterns/ and update this list.
// Missing files are skipped gracefully by patternLibrary.js.
export const kikuchiPatterns = [
  {
    id: 'ebsd_si_001',
    src: '/kikuchi-patterns/ebsd-si-001.png',
    label: 'Si (001), 20 kV',
    grainLabel: 'Silicon grain 1',
    orientationLabel: 'Near (001) orientation',
    credit: 'Wikimedia Commons, FuzzyMagma, CC0',
    bandCenters: [
      { x0: 0, y0: 0.54, x1: 1, y1: 0.49 },
      { x0: 0.06, y0: 0.12, x1: 0.91, y1: 0.9 },
      { x0: 0.1, y0: 0.88, x1: 0.9, y1: 0.06 }
    ]
  },
  {
    id: 'ebsd_nist',
    src: '/kikuchi-patterns/ebsd-nist.jpg',
    label: 'NIST EBSD pattern',
    grainLabel: 'Reference grain 2',
    orientationLabel: 'Reference orientation B',
    credit: 'NIST / Wikimedia Commons, public domain',
    bandCenters: [
      { x0: 0.5, y0: 0, x1: 0.5, y1: 1 },
      { x0: 0.1, y0: 0, x1: 0.58, y1: 1 }
    ]
  },
  {
    id: 'ebsd_si_square',
    src: '/kikuchi-patterns/ebsd-si-square.png',
    label: 'Si EBSD detail',
    grainLabel: 'Silicon grain 3',
    orientationLabel: 'Orientation C detail',
    credit: 'Wikimedia Commons, FuzzyMagma, CC0',
    bandCenters: [
      { x0: 0, y0: 0.5, x1: 1, y1: 0.48 },
      { x0: 0.49, y0: 0, x1: 0.49, y1: 1 },
      { x0: 0.07, y0: 0.12, x1: 0.94, y1: 0.88 }
    ]
  }
];
