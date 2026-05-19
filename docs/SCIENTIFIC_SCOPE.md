# Scientific Scope

EBSD Learning Studio is designed for conceptual training. It teaches how experienced EBSD users think through geometry, acquisition, indexing evidence, pattern quality, sample preparation, and map interpretation. It is not a replacement for commercial or research EBSD software.

## What The App Can Teach

- How SEM/EBSD geometry relates beam, tilted sample, detector, and interaction volume.
- Why Bragg diffraction can be introduced with schematic cones and detector intersections.
- How Kikuchi band visibility depends on contrast, noise, saturation, and pattern quality.
- How acquisition parameters trade signal, spatial detail, scan speed, and risk.
- Why pattern center and detector geometry affect indexing confidence-like evidence.
- How Euler angles, pole figures, and IPF views connect orientation representations.
- Why candidate indexing solutions can compete.
- Why high confidence-like evidence is not the same as truth.
- How sample preparation, contamination, drift, charging, deformation, overlap, and pseudo-symmetry can affect interpretation.
- How to compare IPF, phase-like, band contrast, confidence-like, boundary, and troubleshooting views before making claims.

## What The App Does Not Do

The browser app does not perform:

- calibrated SEM or detector simulation
- dynamical electron diffraction
- true Hough transform indexing
- crystallographic orientation solving
- HR-EBSD
- TKD
- dictionary indexing
- machine-learning indexing
- real phase identification
- true MAD/fit/confidence computation
- real grain-size or phase-fraction measurement
- true misorientation calculation
- strain or deformation quantification
- research-grade map cleanup or analysis

## Real Data Boundary

The project includes some real or source-derived assets:

- local Kikuchi images in `public/kikuchi-patterns`
- DA Ni teaching data in `data/da-ni`
- browser-ready DA Ni assets in `public/teaching-data/da-ni`
- an optional local Python backend for re-indexing DA Ni examples

Real assets should be described with source-backed labels only. If metadata does not verify orientation, phase, or indexing status, the UI should say so.

Preferred labels:

- example pattern
- source-provided note
- possible visual example
- educational review example
- conceptual guide only

Avoid unsupported labels:

- verified orientation
- confirmed phase
- indexed result
- measured pattern center
- validated solution

## Confidence, MAD, Fit, And CI

Commercial EBSD systems define and report confidence, MAD, fit, and CI differently. In this project these ideas are used only to teach intuition:

- strong separation between candidates can be useful evidence
- close candidate scores deserve review
- weak patterns can produce misleading solutions
- wrong phase lists can make the best available solution wrong
- pseudo-symmetry can produce plausible competing answers
- map cleanup can hide problems if used uncritically

Use "confidence-like", "relative", "simplified", or "schematic" when displaying these ideas.

## Pattern Quality And Failure Cases

Failure cases should be diagnostic, not declarative.

Use:

- may indicate
- possible cause
- often associated with
- likely effect
- check by comparing
- first correction to try

Avoid:

- this proves charging
- this confirms deformation
- this is definitely poor polishing
- this validates phase selection

## Map Interpretation

Maps in the browser are conceptual unless explicitly stated otherwise. IPF colors, phase-like colors, boundary overlays, twins, deformation gradients, and recrystallized-looking structures are educational visuals.

Do not present:

- exact grain size
- exact phase fraction
- exact misorientation angle
- true strain
- validated twin identification

Recommended note:

```text
Schematic map only. Use pattern quality, confidence-like evidence, phase context, and acquisition/preparation history before interpreting the map.
```

## Documentation Standard

When adding or editing a module, include enough visible text or nearby documentation for a student to know:

- what the visual is showing
- what physical idea it approximates
- what it leaves out
- what a real EBSD user would check next

