# EBSD Learning Studio

EBSD Learning Studio is an offline-first browser app for learning Electron Backscatter Diffraction concepts through schematic visualization, guided activities, curated examples, and self-study resources.

This is an educational learning environment, not validated EBSD analysis software. It helps students reason about EBSD geometry, Kikuchi patterns, acquisition tradeoffs, conceptual indexing, confidence-like evidence, map interpretation, sample preparation, and common failure modes. It must not be used for quantitative indexing, phase identification, detector calibration, grain-size measurement, strain analysis, or research-grade EBSD interpretation.

## Quick Start

Prerequisites:

- Node.js 16 or newer
- npm

Install and run:

```bash
npm install
npm run dev
```

Open the Vite URL, usually:

```text
http://127.0.0.1:5173
```

On Windows PowerShell systems that block `npm.ps1`, use:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
```

Build for production:

```bash
npm run build
```

The production build may report a large chunk warning because Three.js and the offline learning studio ship together. That warning is currently expected.

## Main Learning Areas

- **Start Here**: student pathways for geometry, acquisition, indexing, interpretation, and revision.
- **Geometry**: Three.js beam/sample/detector scene, schematic Bragg cones, detector bands, guided stages, and manual controls.
- **Acquisition**: conceptual scan map, pattern preview, detector settings, parameter explorer, presets, quality checklist, troubleshooting prompts, and saved scenarios.
- **Euler / Pole Figures**: Bunge ZXZ angle controls, unit cell orientation, stereographic projection, pole figure, and IPF views.
- **Indexing Basics**: conceptual indexing walkthrough, calibration exercise, band matching, real pattern review, weak-area review, and the optional real DA Ni lab.
- **Interpretation**: pattern-quality cases, sample-preparation impact, map interpretation, confidence/MAD/fit intuition, and guided troubleshooting.
- **Learning Path**: modules, quizzes, hints, flashcards, bookmarks, notes, guided demos, and reflection prompts.
- **Glossary / Resources**: local glossary, worksheets, lesson cards, formula sheet, practice questions, datasets, interpretation guide, and export tools.

## Scientific Scope

The app deliberately favors conceptual clarity over full physical realism.

- Kikuchi cones and detector bands are schematic teaching visuals.
- Acquisition quality, drift, saturation, noise, and threshold effects are qualitative learning models.
- Confidence, fit, MAD, and CI are taught as intuition, not as commercial-system metrics.
- IPF maps, phase maps, grain boundaries, twins, deformation gradients, and pattern-quality cases are schematic unless explicitly labeled as real source data.
- Real Kikuchi examples are local study images with source notes; the browser overlays are conceptual guides.
- The optional Python backend can re-run a small real DA Ni indexing example, but the browser app is still an educational interface, not a replacement for Oxford Aztec, EDAX OIM, Bruker ESPRIT, CHANNEL5, or research workflows.

For more detail, see [Scientific Scope](docs/SCIENTIFIC_SCOPE.md).

## Project Structure

```text
.
|-- index.html                         # Main app shell and tab markup
|-- package.json                       # npm scripts and browser dependencies
|-- src/
|   |-- main.js                        # App wiring, tab navigation, exports, dialogs
|   |-- state.js                       # Shared simulation state and constants
|   |-- scene.js                       # Three.js geometry simulator
|   |-- detector.js                    # Schematic Kikuchi detector renderer
|   |-- acquisition.js                 # Acquisition map and pattern preview renderer
|   |-- eulerOrientationStudio.js      # Euler angles, pole figure, and IPF studio
|   |-- indexingStudio.js              # Conceptual indexing activities
|   |-- realIndexingLab.js             # Optional DA Ni real indexing teaching lab
|   |-- interpretationStudio.js        # Phase 3 interpretation workspace
|   |-- phase3Data.js                  # Interpretation cases and guide data
|   |-- learningPath.js                # Learning modules UI and practice tools
|   |-- learningProgress.js            # localStorage progress persistence
|   |-- patternLibrary.js              # Real/fallback Kikuchi pattern loading
|   |-- styles.css                     # Responsive app styling
|   `-- data/
|       |-- formulas.js
|       |-- glossary.js
|       |-- kikuchiPatterns.js
|       `-- learningModules.js
|-- public/
|   |-- kikuchi-patterns/              # Local real-pattern examples and source notes
|   `-- teaching-data/da-ni/           # Browser-ready DA Ni teaching assets
|-- data/da-ni/                        # Source DA Ni data used by extraction script
|-- python_backend/                    # Optional local indexing backend
|-- scripts/                           # Data extraction utilities
|-- docs/                              # Maintainer documentation
`-- references/                        # Local reference material
```

See [Architecture](docs/ARCHITECTURE.md) for module responsibilities and data flow.

## Real Kikuchi Images

Curated local Kikuchi images live in:

```text
public/kikuchi-patterns
```

The app preloads the catalog in `src/data/kikuchiPatterns.js` and falls back to schematic patterns when an image asset is missing. When adding images:

- Keep files small enough for student laptops.
- Document source and usage notes in `public/kikuchi-patterns/README.md`.
- Avoid unverified labels such as confirmed phase, verified orientation, or indexed result unless those claims are supported by source metadata.

## Optional Real DA Ni Indexing Lab

The repository includes a small DA Ni teaching dataset under `data/da-ni` and browser-ready derived assets under `public/teaching-data/da-ni`.

Regenerate browser teaching assets:

```bash
npm.cmd run extract:da
```

Run the optional local Python backend:

```bash
npm.cmd run backend
```

Python dependencies for the backend include `kikuchipy`, `h5py`, `numpy`, `pyyaml`, `matplotlib`, `scikit-image`, `orix`, `diffsims`, and `diffpy.structure`.

Teaching boundary: the backend re-runs real `kikuchipy` Hough indexing with supplied pattern-center values. Browser-picked bands are compared visually; they are not injected directly into PyEBSDIndex as replacement detections.

## Development Workflow

Common commands:

```bash
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run backend
npm.cmd run extract:da
```

Before handing off changes:

- Run `npm.cmd run build`.
- Check the changed tab at mobile, tablet, desktop, and ultrawide widths.
- Confirm no horizontal overflow or distorted canvases.
- Smoke-test affected controls, localStorage paths, notes/bookmarks, resources, and exports.
- Keep new labels scientifically honest: conceptual, schematic, simplified, qualitative, not calibrated, not a solver.

See [Development Guide](docs/DEVELOPMENT.md) for a longer checklist.

## Local Persistence

The app stores learning progress, notes, bookmarks, scenario presets, help dismissal, reduced-motion state, and some activity state in browser `localStorage`. Keep storage keys stable when possible so student progress is not lost between versions.

## Repository

Clone:

```bash
git clone https://github.com/kvmani/ebsd_teaching.git
```

This checkout may be used as a local teaching build. Add a license file before public redistribution or reuse outside the project owner's intended setting.

