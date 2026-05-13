# Local Kikuchi Pattern Images

Put real or realistic Kikuchi pattern images in this folder when you want the
Live Scan Acquisition tab to use image-based pattern previews.

Suggested file names:

- `pattern_001.png`
- `pattern_002.png`
- `pattern_003.png`

Bundled examples restored from the previous project version:

- `ebsd-si-001.png`: EBSD pattern for (001) single crystal silicon at 20 kV, Wikimedia Commons, FuzzyMagma, CC0 1.0.
- `ebsd-nist.jpg`: NIST EBSD pattern, public domain as a work of the United States Federal Government.
- `ebsd-si-square.png`: Silicon EBSD detail, Wikimedia Commons, FuzzyMagma, CC0 1.0.

`kikuchipy-bands.json` is retained from the previous version as optional local
band-center reference data. The browser app does not run KikuchiPy directly.

PNG, JPG, JPEG, and WebP images should all work in the browser.

These files are loaded locally from the Vite public folder, so they remain
available on an offline or air-gapped Windows PC after `npm install`.

After adding images, update:

`src/data/kikuchiPatterns.js`

Each entry should point to the local public URL, for example:

```js
{
  id: "pattern_001",
  src: "/kikuchi-patterns/pattern_001.png",
  label: "Educational review example 1",
  grainLabel: "Example pattern 1",
  orientationLabel: "Source-provided note, if available"
}
```

If an image path is missing or broken, the app skips it and falls back to the
schematic pattern preview without crashing.
