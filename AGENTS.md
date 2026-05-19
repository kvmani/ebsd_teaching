# Agent Guidelines For EBSD Learning Studio

This repository is an educational EBSD learning environment. The core mission is to help students understand EBSD concepts through clear, interactive, scientifically honest visualization.

Before making substantial changes, read:

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/DEVELOPMENT.md`
- `docs/SCIENTIFIC_SCOPE.md`

## Core Principles

### 1. Pedagogy First

- Prioritize student understanding over physical completeness.
- Use schematic simplifications when they make the concept clearer.
- Explain approximations in visible text, docs, or concise code comments.
- Never silently add complex physics or real-analysis claims.

### 2. Scientific Honesty

The app is not validated EBSD software. It must not imply that it performs calibrated microscope simulation, true indexing, phase identification, grain-size measurement, strain analysis, or research-grade map interpretation.

Use careful labels:

- conceptual
- schematic
- simplified
- qualitative
- educational guide
- not calibrated
- not a solver
- confidence-like

Avoid unsupported claims:

- verified orientation
- confirmed phase
- measured strain
- true grain size
- real confidence metric
- validated indexing result

### 3. Maintainability

- Keep modules readable.
- Prefer explicit names with units, such as `acceleratingVoltageKv` or `braggAngleDeg`.
- Keep state logic, rendering logic, and data definitions separated where practical.
- Avoid dependency bloat.
- Preserve offline-first browser behavior.

### 4. Visual Feedback Matters

- Three.js and canvas visuals are the learning surface.
- Test changed visual modules at mobile, tablet, desktop, and ultrawide sizes.
- Keep scientific circles circular by preserving square canvas buffers and square CSS boxes.
- Do not break detector rendering, acquisition maps, Euler/pole figures, indexing overlays, or interpretation canvases.

## Current Architecture

| Module | Purpose |
| --- | --- |
| `src/main.js` | App bootstrap, tab navigation, UI wiring, dialogs, exports |
| `src/state.js` | Shared simulation state and constants |
| `src/scene.js` | Three.js EBSD geometry scene |
| `src/detector.js` | Schematic Kikuchi detector bands |
| `src/acquisition.js` | Conceptual acquisition map and pattern preview |
| `src/eulerOrientationStudio.js` | Euler angles, unit cell, stereographic projection, pole figure, IPF |
| `src/indexingStudio.js` | Conceptual indexing studio |
| `src/realIndexingLab.js` | Optional DA Ni indexing teaching lab |
| `src/interpretationStudio.js` | Pattern quality, sample prep, maps, confidence intuition, troubleshooting |
| `src/learningPath.js` | Guided learning modules, quizzes, notes, flashcards |
| `src/styles.css` | Responsive app layout and visual design |

See `docs/ARCHITECTURE.md` for the fuller map.

## When Adding Or Editing Features

Do:

- keep changes scoped to the requested module
- preserve localStorage compatibility when possible
- add student-facing explanations for new controls
- include scientific-honesty labels where needed
- test keyboard reachability and responsive layout
- run `npm.cmd run build`

Avoid:

- hidden server dependencies for core browser flows
- large rewrites unrelated to the request
- presenting schematic scores as real measurements
- changing data labels beyond what source metadata supports
- removing existing tabs, notes, bookmarks, quizzes, exports, or real-pattern fallback behavior

## Testing Checklist

Before handoff:

- [ ] `npm.cmd run build` passes
- [ ] affected tab renders without console errors
- [ ] 320 px mobile layout has no horizontal overflow
- [ ] tablet/desktop/ultrawide layouts avoid awkward empty space
- [ ] controls remain keyboard reachable
- [ ] canvases keep intended aspect ratios
- [ ] notes/bookmarks/localStorage behavior is not broken
- [ ] exports and resource dialogs still open if touched
- [ ] scientific labels remain honest and non-misleading

## Documentation Checklist

Update docs when you:

- add a new tab or learning module
- add a new data source
- add a backend endpoint
- change setup commands or dependencies
- change localStorage behavior
- change scientific scope
- add a new renderer or canvas-heavy layout

## Summary

This is a conceptual learning studio, not research software. Code and documentation should be clear, visual, maintainable, accessible, and honest about simplifications.

