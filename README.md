# EBSD Teaching Studio

An offline-first, browser-based learning studio for teaching Electron Backscatter Diffraction (EBSD) concepts through clear schematic visualization, guided activities, and classroom-ready resources.

This is a conceptual teaching simulator, not validated EBSD software. It is designed to help students reason about geometry, Kikuchi patterns, scan quality, and common acquisition trade-offs. It should not be used for quantitative indexing, phase identification, detector calibration, or research-grade EBSD analysis.

## What It Teaches

- EBSD geometry: 70° sample tilt, 20° beam-sample-plane angle, detector facing the tilted sample, and the role of the interaction volume.
- Bragg law, electron wavelength, schematic Kikuchi cone formation, and cone intersections with the detector.
- Pattern center and detector calibration as conceptual influences on indexing.
- Hough band detection, indexing confidence, pattern quality, MAD/fit, CI, and common failure modes.
- Acquisition trade-offs among gain, exposure, binning, beam current, frame averaging, scan speed, step size, drift, and thresholding.
- IPF maps, confidence maps, pattern quality maps, grain boundaries, unindexed pixels, pseudosymmetry, and phase-selection ambiguity such as Cu/Ni-like FCC cases.

## Key Features

- Three preserved studio tabs: Geometry + Pattern, Live Scan Acquisition, and Learning Path.
- Real local Kikuchi image support from `public/kikuchi-patterns`, with graceful schematic fallback when image assets are missing.
- Interactive Three.js EBSD geometry with guided stages, sample/detector controls, cone magnification, crystal orientation, labels, detector noise, contrast, and pattern inversion.
- Live scan acquisition trainer with map modes, pause/resume, reset, warning badges, presets, beginner/advanced controls, diagnosis activity, quality checklist, and named scenario save/restore in localStorage.
- Learning Path modules with quizzes, hints, flashcards, bookmarks, notes, guided demos, expected observations, and reflection prompts.
- Top-bar tools for Notes, Screenshot, offline Resource Export, Glossary, Help, and scene reset.
- Offline HTML/text exports for worksheets, lesson cards, formula sheets, practice questions, preset references, and teacher demo plans.

## Local Kikuchi Images

Place curated teaching images in:

```text
public/kikuchi-patterns
```

The app preloads the local pattern catalog and reports whether the current view is using a real local Kikuchi image or the fallback schematic pattern. Keep image files small enough for classroom laptops and document sources in `public/kikuchi-patterns/README.md` when adding new assets.

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

## Classroom Use

1. Start with Geometry + Pattern to show the beam, tilted sample, detector, enlarged teaching cones, and Kikuchi band formation.
2. Move to Live Scan Acquisition to demonstrate how acquisition parameters influence pattern quality, confidence, unindexed pixels, and map stability.
3. Use Learning Path for guided modules, quizzes, notes, flashcards, bookmarks, and mini experiments that jump into the relevant tab with presets applied.
4. Use Resource Export to generate offline handouts or worksheets, and Screenshot to capture the current visible teaching state.

## Conceptual Simplifications

- Kikuchi cones are enlarged for teaching clarity and are not a full dynamical electron diffraction model.
- Detector bands are schematic projections intended to explain how cone intersections become bands.
- Acquisition quality, confidence, drift, saturation, and threshold effects are qualitative classroom models.
- IPF maps and grain boundaries are synthetic visuals, not measured microstructure.
- Hough/dictionary/manual indexing controls are conceptual comparisons, not actual indexing engines.

## Performance Notes

The production build may report a large Vite chunk warning because Three.js and the learning studio ship together for offline classroom use. This is acceptable for the current app. Future code-splitting may be useful if the studio grows substantially, but it is not necessary for the present teaching workflow.

## Development Guidelines

- Preserve the three-tab structure and existing localStorage behavior.
- Preserve real local Kikuchi image support and the schematic fallback.
- Keep new features directly useful for EBSD teaching.
- Prefer clear pedagogical comments over unvalidated physics complexity.
- Test geometry controls, acquisition controls, learning progress, notes, glossary, screenshots, exports, and responsive layouts before release.

## Repository

Clone:

```bash
git clone https://github.com/kvmani/ebsd_teaching.git
```

Use GitHub Issues or Discussions on the repository for questions, classroom feedback, and future feature requests.

## License

No license file is currently included. Add a license before public redistribution or reuse outside the project owner's intended classroom setting.

## Audit Report - May 2026

Implemented and verified:

- Notes, glossary, screenshot, export/resource view, help, reset, progress, bookmarks, local notes, guided demos, presets, warning badges, scenario save/restore, and offline fallback behavior.
- EBSD teaching modules covering geometry, interaction volume, Bragg law, band formation, pattern center, indexing, confidence, acquisition trade-offs, sample preparation, phase ambiguity, pseudosymmetry, IPF maps, grain boundaries, and troubleshooting.
- Responsive layout checks for desktop, laptop, tablet, and narrow mobile widths.

Known future ideas:

- Optional instructor-authored lesson packs.
- More curated real Kikuchi images with source notes.
- A printable multi-week lab worksheet sequence.
- Import/export of complete classroom scenario bundles.
- A calibration activity using an intentionally wrong pattern center.
