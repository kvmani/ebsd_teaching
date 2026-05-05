# EBSD Pattern Sources

These images are bundled locally so the Live Scan Acquisition tab can use real-looking Kikuchi patterns even without network access.

- `ebsd-si-001.png`: "EBSD (001) Si.png", Wikimedia Commons, FuzzyMagma, CC0 1.0. Original description: electron backscatter diffraction pattern for (001) single crystal silicon at 20 kV using an Oxford S2 detector.
- `ebsd-nist.jpg`: "Ebsd.jpg", Wikimedia Commons mirror of a NIST image, public domain as a work of the United States Federal Government.
- `ebsd-si-square.png`: "EBSD Si.png", Wikimedia Commons, FuzzyMagma, CC0 1.0. Used as a third real EBSD-like pattern so the live view remains visually consistent.

The browser app does not run KikuchiPy directly. The live overlay uses simple author-marked Hough-style band centers to preserve the teaching point without adding a Python processing service to this client-side simulation.

Band-center overlays can be regenerated with:

```bash
npm run bands
```

This runs `scripts/generate_kikuchipy_bands.py`, which uses `pyebsdindex.band_detect.BandDetect`, the Radon/Hough band detector used by KikuchiPy's Hough indexing workflow, and writes `kikuchipy-bands.json`.
