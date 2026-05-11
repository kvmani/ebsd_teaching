# EBSD Learning Studio

An offline-first, browser-based learning studio for students studying Electron Backscatter Diffraction (EBSD) concepts through clear schematic visualization, guided activities, and self-study resources.

This is a conceptual learning simulator, not validated EBSD software. It is designed to help students reason about geometry, Kikuchi patterns, scan quality, indexing confidence, and common acquisition trade-offs. It should not be used for quantitative indexing, phase identification, detector calibration, or research-grade EBSD analysis.

## What It Teaches

- EBSD geometry: 70° sample tilt, 20° beam-sample-plane angle, detector facing the tilted sample, and the role of the interaction volume.
- Bragg law, electron wavelength, schematic Kikuchi cone formation, and cone intersections with the detector.
- Pattern center and detector calibration as conceptual influences on indexing.
- Hough band detection, indexing confidence, pattern quality, MAD/fit, CI, and common failure modes.
- Acquisition trade-offs among gain, exposure, binning, beam current, frame averaging, scan speed, step size, drift, and thresholding.
- IPF maps, confidence maps, pattern quality maps, grain boundaries, unindexed pixels, pseudosymmetry, and phase-selection ambiguity such as Cu/Ni-like FCC cases.

## Key Features

- Preserved core simulators plus student-first navigation: Start Here, Geometry, Acquisition, Indexing Basics, Learning Path, and Glossary / Resources.
- Real local Kikuchi image support from `public/kikuchi-patterns`, with graceful schematic fallback when image assets are missing.
- Interactive Three.js EBSD geometry with guided stages, sample/detector controls, cone magnification, crystal orientation, labels, detector noise, contrast, and pattern inversion.
- Live scan acquisition trainer with map modes, pause/resume, reset, warning badges, presets, beginner/advanced controls, diagnosis activity, quality checklist, and named scenario save/restore in localStorage.
- Interactive Indexing Basics studio with a pausable conceptual walkthrough, pattern-center calibration exercise, band matching practice, real pattern review overlays, and local weak-area review.
- Learning Path modules with quizzes, hints, flashcards, bookmarks, notes, guided demos, expected observations, and reflection prompts.
- Top-bar tools for Notes, Screenshot, offline Resource Export, Glossary, Help, and scene reset.
- Offline HTML/text exports for worksheets, lesson cards, formula sheets, practice questions, preset references, and self-study guides.

## Local Kikuchi Images

Place curated study images in:

```text
public/kikuchi-patterns
```

The app preloads the local pattern catalog and reports whether the current view is using a real local Kikuchi image or the fallback schematic pattern. Keep image files small enough for student laptops and document sources in `public/kikuchi-patterns/README.md` when adding new assets.

## Project Structure

```text
.
|-- index.html
|-- package.json
|-- public/
|   `-- kikuchi-patterns/
|-- src/
|   |-- acquisition.js
|   |-- detector.js
|   |-- learningPath.js
|   |-- learningProgress.js
|   |-- indexingStudio.js
|   |-- main.js
|   |-- patternLibrary.js
|   |-- scene.js
|   |-- state.js
|   |-- styles.css
|   `-- data/
|       |-- formulas.js
|       |-- glossary.js
|       |-- kikuchiPatterns.js
|       `-- learningModules.js
```

## Setup

Prerequisites:

- Node.js 16 or newer
- npm

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the URL printed by Vite, usually:

```text
http://127.0.0.1:5173
```

Build for production:

```bash
npm run build
```

On Windows PowerShell systems that block `npm.ps1`, use `npm.cmd install`, `npm.cmd run dev`, and `npm.cmd run build`.

## Self-Study Use

1. Start with Start Here to choose a study path.
2. Use Geometry to inspect the beam, tilted sample, detector, enlarged schematic cones, and Kikuchi band formation.
3. Move to Acquisition to explore how acquisition parameters influence pattern quality, confidence, unindexed pixels, and map stability.
4. Use Learning Path for guided modules, quizzes, notes, flashcards, bookmarks, and mini experiments that jump into the relevant tab with presets applied.
5. Use Indexing Basics to review the simplified workflow from raw pattern to confidence, practice band matching, and explore pattern-center sensitivity.
6. Use Resource Export to generate offline worksheets, and Screenshot to capture the current visible study state.

## Conceptual Simplifications

- Kikuchi cones are enlarged for learning clarity and are not a full dynamical electron diffraction model.
- Detector bands are schematic projections intended to explain how cone intersections become bands.
- Acquisition quality, confidence, drift, saturation, and threshold effects are qualitative learning models.
- IPF maps and grain boundaries are synthetic visuals, not measured microstructure.
- Hough-style band detection, candidate scoring, pattern-center confidence, and band matching activities are conceptual teaching tools, not actual indexing engines or calibrated refinement software.

## Performance Notes

The production build may report a large Vite chunk warning because Three.js and the learning studio ship together for offline use. This is acceptable for the current app. Future code-splitting may be useful if the studio grows substantially, but it is not necessary for the present workflow.

## Development Guidelines

- Preserve the core simulator behavior and existing localStorage behavior.
- Preserve real local Kikuchi image support and the schematic fallback.
- Keep new features directly useful for EBSD learning.
- Prefer clear pedagogical comments over unvalidated physics complexity.
- Test geometry controls, acquisition controls, learning progress, notes, glossary, screenshots, exports, and responsive layouts before release.

## Repository

Clone:

```bash
git clone https://github.com/kvmani/ebsd_teaching.git
```

Use GitHub Issues or Discussions on the repository for questions, study feedback, and future feature requests.

## License

No license file is currently included. Add a license before public redistribution or reuse outside the project owner's intended setting.

## Audit Report - May 2026

Implemented and verified:

- Notes, glossary, screenshot, export/resource view, help, reset, progress, bookmarks, local notes, guided demos, presets, warning badges, scenario save/restore, and offline fallback behavior.
- EBSD learning modules covering geometry, interaction volume, Bragg law, band formation, pattern center, indexing, confidence, acquisition trade-offs, sample preparation, phase ambiguity, pseudosymmetry, IPF maps, grain boundaries, and troubleshooting.
- Phase 2 Indexing Basics activities covering conceptual band detection, band position measurement, candidate orientation matching, pattern-center sensitivity, real pattern review, and weak-area self-review.
- Responsive layout checks for desktop, laptop, tablet, and narrow mobile widths.

Known future ideas:

- Optional student lesson packs.
- More curated real Kikuchi images with source notes.
- A printable multi-week lab worksheet sequence.
- Import/export of complete practice scenario bundles.
- Optional advanced indexing comparison activities, still clearly labeled as conceptual unless a real solver is implemented.
