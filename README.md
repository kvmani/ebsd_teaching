# EBSD Teaching Simulation

An interactive 3D web-based teaching tool for understanding Electron Backscatter Diffraction (EBSD) principles through schematic simulations.

## Overview

This repository contains a pedagogical simulation that visualizes the core concepts of EBSD:

- **Electron beam interaction** with a tilted crystalline sample
- **Bragg cone formation** from crystal lattice planes
- **Kikuchi pattern generation** on an EBSD detector
- **Dynamic visualization** of how crystal orientation affects detector patterns

The simulation prioritizes **conceptual clarity and educational value** over physical accuracy. It uses schematic geometry and simplified physics to help students intuitively grasp EBSD fundamentals.

## Key Features

- **Interactive 3D Scene**: Orbit, zoom, and explore the SEM/EBSD geometry
- **Live Detector Pattern**: Watch Kikuchi bands form in real-time as you rotate the crystal
- **Guided Explanation Mode**: 6-stage walkthrough covering electron wavelength, Bragg diffraction, cone geometry, and band formation
- **Manual Control Mode**: Adjust voltage, sample tilt, crystal orientation, and detector distance
- **Educational Annotations**: Clear labels for physical concepts at each stage

## Project Structure

```
.
├── index.html              # Main HTML entry point
├── package.json            # Dependencies (Three.js, Vite)
├── src/
│   ├── main.js            # App initialization and UI event handling
│   ├── scene.js           # 3D scene rendering (beam, sample, cones, detector)
│   ├── detector.js        # 2D detector pattern visualization
│   ├── state.js           # Simulation state and physical constants
│   └── styles.css         # UI styling
```

## Installation & Setup

### Prerequisites
- Node.js 16+
- npm or yarn

### Steps

1. Clone the repository:
   ```bash
   git clone https://github.com/YOUR_USERNAME/ebsd-teaching-simulation.git
   cd ebsd-teaching-simulation
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   Open your browser to `http://127.0.0.1:5173` (or the address shown in terminal)

4. Build for production:
   ```bash
   npm run build
   ```

## Usage

### Guided Mode
Click **Previous/Next** buttons to step through six stages of EBSD formation:
1. Electron wavelength and Bragg's law
2. Crystal planes and Bragg angles
3. Bragg cones from diffraction
4. Cone intersection with detector plane
5. Kikuchi band formation
6. Full pattern with all orientations visible

### Manual Exploration Mode
Use sliders to control:
- **Voltage**: Accelerating voltage (affects electron wavelength)
- **Tilt**: Sample tilt angle relative to detector
- **Rotation (Rx, Ry, Rz)**: Crystal orientation
- **Detector Distance**: Distance to EBSD detector

Watch how the detector pattern changes as you adjust each parameter.

## Important Note

⚠️ **This is a pedagogical schematic simulation**, not a validated physics simulation. Its purpose is to teach EBSD concepts visually and intuitively. The geometry and calculations are simplified for clarity, not computational accuracy.

## Technology Stack

- **Three.js**: 3D visualization
- **Vite**: Fast build tool and dev server
- **Vanilla JavaScript**: No framework dependencies

## Contributing

Contributions are welcome! Please ensure any changes:
- Maintain pedagogical clarity and simplicity
- Include clear comments explaining conceptual mappings
- Preserve the schematic nature (don't add unvalidated physics complexity)
- Test both guided and manual modes

## License

[Add your chosen license here, e.g., MIT, CC-BY-4.0]

## References

Educational references on EBSD:
- Electron Backscatter Diffraction (EBSD) principles and crystal orientation mapping
- Bragg's Law and X-ray/electron diffraction basics
- SEM sample geometry and tilting conventions

## Contact

[Add contact or discussion info]

---

**Last Updated**: April 2026  
**Educational Purpose**: Understanding EBSD through interactive 3D visualization
