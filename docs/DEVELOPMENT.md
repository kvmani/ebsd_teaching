# Development Guide

This guide is for contributors working on EBSD Learning Studio locally.

## Local Setup

Install dependencies:

```bash
npm.cmd install
```

Run the app:

```bash
npm.cmd run dev
```

Run a production build:

```bash
npm.cmd run build
```

Run the optional DA Ni backend:

```bash
npm.cmd run backend
```

Regenerate DA Ni browser assets:

```bash
npm.cmd run extract:da
```

## Change Philosophy

This project is a teaching tool. Prefer changes that make the learning model clearer, more honest, and easier to inspect.

Good changes:

- improve conceptual clarity
- make visual feedback more legible
- keep controls responsive and accessible
- document approximations
- preserve offline/browser-local behavior
- keep code readable for future students and maintainers

Risky changes:

- adding heavy dependencies
- introducing hidden backend requirements for core app flows
- silently making physics more complex
- presenting schematic scores as real measurements
- changing localStorage keys without migration
- altering the visual feedback loop between controls and renderers

## Feature Workflow

1. Identify the learning goal.
2. Find the owning module in `docs/ARCHITECTURE.md`.
3. Keep state and rendering changes local to that module when possible.
4. Add visible scientific-honesty labels when the feature could be mistaken for real analysis.
5. Test the changed tab across mobile, tablet, desktop, and ultrawide widths.
6. Run `npm.cmd run build`.

## Documentation Workflow

Update docs when you:

- add a new tab or major learning activity
- add a new data source
- change localStorage behavior
- add or remove npm/Python setup requirements
- add a backend endpoint
- change scientific scope or terminology
- add a new renderer or canvas-heavy layout

Documentation should explain what a module teaches, what it does not do, and where the relevant files live.

## Responsive QA Checklist

Check these widths at minimum:

- 320 px mobile
- 768 px tablet
- 1366 px desktop
- 1920 px ultrawide

Look for:

- horizontal overflow
- clipped canvases
- distorted circles or maps
- overlapping labels
- controls squeezed below readable size
- excessive empty space on wide screens
- cards with awkward final rows

For canvas-based scientific diagrams, verify both the CSS box and the canvas drawing buffer keep the intended aspect ratio.

## Accessibility Checklist

Before handing off UI work:

- controls are keyboard reachable
- active tabs have correct `aria-selected`
- hidden views use `aria-hidden`
- sliders have explicit labels and visible values
- Play/Pause controls have clear accessible labels
- canvas content has nearby explanatory text or an `aria-label`
- feedback regions use understandable text, not color alone
- focus states are visible
- reduced-motion mode still works

## Scientific Wording Checklist

Use careful wording for educational approximations:

- conceptual
- schematic
- simplified
- qualitative
- educational guide
- not calibrated
- not a solver
- not a measurement engine

Avoid overclaims:

- "verified orientation"
- "confirmed phase"
- "measured strain"
- "true grain size"
- "real confidence"
- "validated indexing"
- "definitely charging"
- "proves poor polishing"

Use diagnostic language:

- possible cause
- may indicate
- often associated with
- first check
- next check
- likely effect
- compare with

## Build Notes

The build currently emits a large chunk warning because the app ships Three.js and the full learning studio together for offline use. This is acceptable unless load time becomes a practical problem for students.

Do not commit `node_modules` or `dist` unless the project owner explicitly requests a packaged static build.

## Git Notes

This directory may be copied without its `.git` folder. If it is not a Git repository, make local changes normally and copy them back into the tracked checkout before committing.

When committing from a tracked checkout:

```bash
git status --short
npm.cmd run build
git add <changed files>
git commit -m "Clear short message"
git push origin main
```

Review untracked files carefully. Local-only dev configs, logs, and generated folders should usually stay uncommitted.

