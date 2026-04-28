# Agent Guidelines for EBSD Teaching Simulation

This document provides guidance for agents (AI assistants) contributing to this codebase. **The core mission is pedagogical: help students understand EBSD concepts through clear, interactive visualization.**

## Core Principles

### 1. **Pedagogical First, Physics Second**
- **Prioritize clarity** over realism
- Use **schematic simplifications** to highlight core concepts
- Annotate code liberally explaining *why* we simplify physics
- Example: We use cones for Bragg diffraction, not rigorous dynamical theory
- **Never silently add complex physics** without discussing educational trade-offs

### 2. **Simplicity & Maintainability**
- Keep code readable by students (this is a teaching tool)
- Avoid advanced techniques that obscure intent
- Use clear variable names: `electronWavelengthPm`, `braggAngleDeg`, not `lambda`, `theta`
- Write functions that do one thing well
- Comment liberally, especially explaining physics mappings

### 3. **Interactive 3D Graphics Matter**
- All changes must render correctly in Three.js
- Test both guided and manual modes after changes
- Visual feedback is how students learn—keep it responsive and clear
- Don't break the detector pattern visualization or 3D scene

## Architecture Overview

| Module | Purpose | Educational Goal |
|--------|---------|------------------|
| `main.js` | UI event handling, state updates | Show how user inputs drive simulation |
| `scene.js` | 3D visualization (beam, sample, cones, detector) | Visualize SEM/EBSD geometry |
| `detector.js` | 2D Kikuchi band pattern on detector | Show real output of diffraction |
| `state.js` | Physics constants, simulation state | Centralized physical parameters |
| `styles.css` | Layout and visual design | Clear, accessible interface |

## When Adding Features

### ✅ Do This
- **Add new visualization modes** that clarify concepts (e.g., "show only first-order Bragg cones")
- **Extend the guided explanation** with more detailed stages
- **Add interactive controls** for student exploration (voltage, tilt, orientation sliders)
- **Improve annotations** and labels in the 3D scene
- **Optimize rendering** while maintaining pedagogical clarity
- **Refactor** for readability and maintainability

### ❌ Avoid This
- **Adding physically realistic dynamics** (e.g., phonon interactions, thermal effects) without clear pedagogical benefit
- **Complex mathematical formulations** that hide conceptual understanding
- **Performance optimizations** that sacrifices code clarity
- **Removing or obscuring the schematic nature** of the simulation
- **Changes that break the visual feedback loop** between user input and output

## Code Style

### Comments & Explanations
```javascript
// ✅ Good: Explains the pedagogical choice
// We use cone half-angle = 2*braggAngle (schematic) rather than full dynamical theory.
// This clearly shows diffraction geometry without overwhelming complexity.
const coneHalfAngle = 2 * braggAngleDeg;

// ❌ Avoid: No context, or unexplained simplifications
const angle = 2 * theta;
```

### Variable Naming
```javascript
// ✅ Good: Clear, domain-specific names
const electronWavelengthPm = 0.123; // pm units make small wavelengths intuitive
const braggAngleDeg = 15.5; // Degrees are familiar to students
const detectorTiltDeg = 70; // Explicit units and meaning

// ❌ Avoid: Unclear abbreviations
const lambda = 0.123;
const theta = 15.5;
const tilt = 70;
```

### Physics Constants
- Keep all constants in `state.js`
- Clearly label units and reference papers/textbooks where applicable
- Add comments explaining approximations or simplifications

## Testing Checklist

When submitting changes:
- [ ] **Guided mode works**: Step through all 6 stages without errors
- [ ] **Manual mode works**: All sliders adjust smoothly, detector updates
- [ ] **3D visualization renders**: No broken geometry or Three.js errors
- [ ] **Detector pattern updates**: Changes in rotation/voltage affect bands
- [ ] **Code is readable**: Comments explain pedagogical choices
- [ ] **No silent physics changes**: Any new complexity is justified educationally

## Examples of Good Changes

### Adding a Feature
```javascript
// In state.js - add a new control for students to explore
// Purpose: Let students see how Bragg angle changes with electron wavelength
export const minVoltage = 5;  // kV, typical SEM range
export const maxVoltage = 30;

// In main.js - bind voltage slider
bindRange('voltageSlider', 'voltage', Number);

// In detector.js - update pattern when voltage changes
// This teaches: shorter wavelength → smaller Bragg angle → narrower bands
function updateBandsForVoltage(voltage) {
  const lambda = electronWavelengthPm(voltage);
  const braggAngle = braggThetaDeg(voltage, planes[0].d);
  // Render bands with new angles...
}
```

### Improving Code Clarity
```javascript
// ❌ Before: Unclear what this does
const p = Math.sin(r * Math.PI / 180) * d;

// ✅ After: Clear pedagogical meaning
// Project the lattice plane spacing onto the Bragg diffraction direction
// Using Bragg's law: nλ = 2d*sin(θ)
const effectiveSpacing = Math.sin(braggAngleDeg * Math.PI / 180) * latticeSpacing;
```

## Communication with Contributors

When reviewing or suggesting changes:
- **Ask why**: "Does this simplification help or hurt understanding?"
- **Clarify intent**: "Is this for students to explore, or to show a specific concept?"
- **Test pedagogically**: "Did you verify both guided and manual modes work well?"
- **Document choices**: "Why did you choose this physics model over that one?"

## Questions to Ask About Any Change

1. **Does this help students understand EBSD better?**
2. **Is it simple enough for students to follow the code?**
3. **Does it render correctly in Three.js?**
4. **Is the educational trade-off (if any) clearly documented?**
5. **Does it work in both guided and manual modes?**

---

## Summary

This is an **educational tool**, not a research simulator. Code should be:
- **Clear** over clever
- **Pedagogical** over realistic
- **Maintainable** over optimized
- **Visual** and interactive
- **Honest** about simplifications

When in doubt, prioritize student understanding.

---

**Last Updated**: April 2026  
**Audience**: Future developers, contributors, and AI agents working on this codebase
