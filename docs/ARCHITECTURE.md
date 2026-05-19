# Architecture

EBSD Learning Studio is a single-page Vite application. It keeps the core learning experience browser-local and offline-capable, with an optional Python backend only for the DA Ni indexing lab.

## Runtime Shape

```text
index.html
  |
  | imports src/main.js
  v
main.js
  |-- creates shared renderers and studios
  |-- wires tab navigation, controls, dialogs, exports, and shortcuts
  |-- updates shared state and calls renderer update methods
```

Most modules are plain JavaScript classes or data files. There is no frontend framework. This keeps the project approachable for students and makes the educational mappings easier to inspect.

## Main Modules

| File | Responsibility | Notes |
| --- | --- | --- |
| `src/main.js` | App bootstrap, tab switching, UI binding, resource exports, notes/glossary dialogs | Keep broad orchestration here, but avoid adding heavy rendering logic. |
| `src/state.js` | Shared geometry/acquisition state and physics constants | Prefer explicit units in variable names and comments. |
| `src/scene.js` | Three.js geometry simulator | Beam, tilted sample, detector, schematic cones, labels, and manual/guided stages. |
| `src/detector.js` | 2D detector-band rendering | Schematic Kikuchi bands linked to orientation/voltage controls. |
| `src/acquisition.js` | Conceptual scan map and pattern preview | Simulates qualitative effects of acquisition parameters, not calibrated SEM behavior. |
| `src/eulerOrientationStudio.js` | Euler angles, unit cell, stereographic projection, pole figure, and IPF views | Uses square canvases for pole-figure correctness and Three.js for the unit-sphere view. |
| `src/indexingStudio.js` | Conceptual indexing walkthrough and activities | Includes calibration, band matching, real pattern review, and weak-area review. |
| `src/realIndexingLab.js` | Browser UI for DA Ni indexing examples | Can call optional Python backend when available. |
| `src/interpretationStudio.js` | Interpretation workspace | Pattern quality, sample prep, maps, confidence intuition, and troubleshooting. |
| `src/learningPath.js` | Self-study module UI | Quizzes, flashcards, notes, bookmarks, guided demos, and glossary links. |
| `src/learningProgress.js` | localStorage persistence helpers | Keep storage keys stable. |
| `src/patternLibrary.js` | Real/fallback Kikuchi image loading | Handles local pattern catalog and graceful schematic fallback. |
| `src/styles.css` | All app styling and responsive behavior | This is large; keep new sections grouped by feature. |

## Data Modules

| File | Data |
| --- | --- |
| `src/data/learningModules.js` | Learning Path modules, quizzes, activities, troubleshooting cards |
| `src/data/glossary.js` | Glossary terms and related modules |
| `src/data/formulas.js` | Formula/reference content for resource exports |
| `src/data/kikuchiPatterns.js` | Local real-pattern catalog and source notes |
| `src/phase3Data.js` | Interpretation cases, map activities, confidence examples, troubleshooting symptoms |

Data files should use cautious scientific language. If a label is not backed by source metadata, prefer "example pattern", "source-provided note", "possible visual example", or "conceptual guide only".

## Browser Data Flow

1. User changes a control in the active tab.
2. `main.js` or the relevant studio class updates local state.
3. The renderer redraws the Three.js scene, canvas, DOM cards, or readouts.
4. If needed, local progress is persisted in `localStorage`.
5. Export tools generate HTML/text directly from local data.

No network access is required for the main learning app after assets are available locally.

## Optional Backend Flow

The optional Python backend is used only by the DA Ni indexing lab.

```text
realIndexingLab.js
  -> POST local pattern-center settings
  -> python_backend/server.py
  -> python_backend/indexing_core.py
  -> kikuchipy / PyEBSDIndex-style indexing
  -> JSON result returned to browser
```

The browser must remain useful when the backend is not running. Always provide clear fallback or disabled-state messaging.

## Styling Layout Notes

- The app uses CSS Grid heavily for top-level panels and card groups.
- Fixed-format visuals such as maps, pole figures, and detector canvases should use stable aspect ratios.
- Canvases that draw scientific circles should keep square drawing buffers and square CSS boxes.
- Avoid layout rules that make final rows look abandoned on ultrawide screens.
- Mobile layouts should stack controls before dense visualization only when that improves usability.

## Scientific-Honesty Boundaries

The code should not imply:

- calibrated microscope simulation
- true crystallographic solving
- verified phase identification
- real confidence/MAD/fit computation
- true misorientation, phase fraction, grain size, or strain measurement
- research-grade map analysis

Use explicit language such as conceptual, schematic, qualitative, simplified, not calibrated, not a solver, and educational overlay.

