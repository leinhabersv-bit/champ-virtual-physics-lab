# CHAMP Virtual Physics Laboratory — Technical & Architectural Specification

**Institution:** Vellore Institute of Technology (VIT) Chennai  
**Department:** Department of Physics, School of Advanced Sciences (SAS)  
**Target Course:** Engineering Physics (BAPHY105) — CHAMP Lab Manual (B.Tech First Year, SCOPE)  
**System Version:** 1.0.0 (Production Foundation)  

---

## 1. System Vision & Product Mandate

The **CHAMP Virtual Physics Lab** is an interactive, browser-based simulation platform providing rigorous, syllabus-faithful laboratory experiences for Engineering Physics students at VIT Chennai. Built to replace passive screen-based mockups with deterministic, high-fidelity physical systems, it provides tactile workbench interactions, real-time mathematical analysis via KaTeX, automated observation grids, and multi-tier pedagogical modes.

### 1.1 Core Principles
1. **Mathematical Fidelity**: All physics engines execute closed-form analytical or numerical physics equations derived directly from course theory. No random jitter or arbitrary mock numbers.
2. **Pedagogical Integrity**: Supports three structured student learning modes:
   - **Guided Mode**: Interactive step-by-step causal prompts, circuit wiring guides, and terminal highlights.
   - **Independent Mode**: Open sandbox where students assemble apparatus, calibrate parameters, and record experimental data freely.
   - **Viva Mode**: Interactive oral exam simulator aligned with the manual's 10-mark evaluation scheme (7 lab marks + 3 viva marks).
3. **Accessibility Baseline**: Fully compliant with WCAG 2.1 AA standards. Direct drag-and-drop actions for circuit wiring always provide equivalent single-click or keyboard-navigable terminal selection alternatives.
4. **Resilience & Offline Autonomy**: Zero external cloud runtime dependency. Installable as a Progressive Web Application (PWA) with persistent local state.

---

## 2. Technology Stack & Architectural Patterns

| Layer | Technology | Specification / Standard |
|---|---|---|
| **Core Framework** | React 18+ & TypeScript 5+ | Strict type safety, deterministic functional components, custom hooks |
| **Build & Dev Tool** | Vite 5+ | Instant HMR, ESM native bundling, tree-shaking, optimized asset pipeline |
| **Styling & Design System** | Tailwind CSS 3.4+ | Utility-first CSS, custom semantic scientific color tokens, fluid typography |
| **Mathematical Rendering**| KaTeX 0.16+ | High-performance LaTeX formula rendering with live parameter substitution |
| **Vector Graphics & UI** | Pure SVG + Lucide Icons | Scalable, high-DPI apparatus illustrations with exact physical terminal geometries |
| **Plotting Engine** | Custom Responsive SVG Engine | Zero-dependency, accessible SVG graphing engine supporting multi-axis curves, point inspection, and linear regression |
| **Persistence** | Browser `localStorage` API | Schema-versioned offline store for observation data, circuit topologies, and progress |
| **Test Framework** | Vitest + React Testing Library | Unit verification of SI unit engines, simulation solvers, and component smoke tests |

---

## 3. Domain Model & Contract Interfaces

### 3.1 Simulator Core Contract
Every experiment adheres to a standardized lifecycle contract defined in `types/simulation.ts`:

```typescript
export interface ISimulationEngine<TParams, TReadings, TDerived> {
  readonly experimentId: string;
  readonly defaultParams: TParams;
  validateParams(params: TParams): ValidationResult;
  calculateReadings(params: TParams): TReadings;
  computeDerived(readings: TReadings, params: TParams): TDerived;
  generateModelCurve(params: TParams, sampleCount?: number): Array<{ x: number; y: number }>;
}
```

### 3.2 Workbench Primitives & Topology
The shared workbench defines declarative terminal and wiring contracts:

```typescript
export interface Terminal {
  id: string;
  name: string;
  type: 'anode' | 'cathode' | 'ground' | 'signal' | 'load';
  polarity: '+' | '-' | 'neutral';
  color: string;
  x: number; // SVG viewBox coordinates
  y: number;
  componentId: string;
}

export interface WireConnection {
  id: string;
  fromTerminalId: string;
  toTerminalId: string;
  color: string;
  status: 'valid' | 'invalid' | 'incomplete';
}

export interface ObservationCell {
  value: number | string | null;
  unit?: string;
  isAutoCalculated?: boolean;
  isValid?: boolean;
}

export interface ObservationRow {
  id: string;
  timestamp: number;
  data: Record<string, ObservationCell>;
}
```

---

## 4. Reusable Workbench Primitives

1. **Apparatus & Instrument Primitives (`<Instrument />`)**:
   - Digital multimeters (dual-range voltage 0–20V DC, current microammeter 0–20μA / milliammeter 0–100mA).
   - Optical mounts: Single slit kinematic holder, laser diode mount, pinhole detector with translational stage.
   - Spectrometer table with verniers $V_1, V_2$, collimator, and telescope circular scale ($0.5^\circ$ main scale, $1'$ vernier).
   - Photodiode dark box with adjustable lux illumination source.

2. **Draggable & Accessible Terminal Wire (`<DraggableWire />` & `<TerminalPoint />`)**:
   - Pointer-event drag-and-drop with geometric snap radius ($15\text{px}$).
   - **Keyboard Alternative**: Select source terminal via Space/Enter, focus target terminal, and press Enter to complete connection.
   - Visual inspection of open circuits and polarity mismatch.

3. **Parameter Controls (`<ParameterControl />`)**:
   - Precision slider with coarse/fine stepping.
   - Rotary decade resistance box (discrete settings: $100\,\Omega, 220\,\Omega, 500\,\Omega, 1\,\text{k}\Omega \dots 10\,\text{k}\Omega$).
   - Direct numerical keyboard input with clamp boundaries.

4. **Dynamic Observation Grid (`<ObservationGrid />`)**:
   - Live logging of current workbench state with a single keystroke/button click.
   - Column-level formula derivation (e.g. $P = V \times I$, $\theta = (a - b)/2$, $\Delta p_y$).
   - Export to CSV format and high-contrast print stylesheet.

5. **Formula Panel (`<FormulaPanel />`)**:
   - KaTeX-powered live equation viewer.
   - Substituted mode displaying student's actual current readings inside the algebraic formula.

6. **Scientific Plotting Engine (`<LabGraph />`)**:
   - Responsive vector canvas with auto-scaling coordinate axes.
   - Simultaneous plotting of multiple curves (e.g. $I$-$V$ and $P$-$V$ on twin Y-axes).
   - Dynamic point markers, hover tooltip inspection, and automated slope/intercept computation via least-squares linear regression.

7. **Workbench Control Strip (`<WorkbenchToolbar />`)**:
   - System controls: Run/Halt, Reset Apparatus, Tiered Hints (Hint 1: Concept, Hint 2: Formula, Hint 3: Connection Guide), Save Run, Print Report.

---

## 5. Offline Shell & Local Persistence Specification

### 5.1 Storage Schema (`champ_vlab_state_v1`)
Stored under `localStorage` with versioned key names:
```json
{
  "version": 1,
  "activeExperimentId": "expt-1-solar-cell",
  "activeMode": "guided",
  "experiments": {
    "expt-1-solar-cell": {
      "status": "in_progress",
      "completedSteps": [1, 2, 3],
      "observations": [ ... ],
      "wires": [ ... ],
      "circuitMode": "single",
      "lastParams": { "distance": 0.25, "loadResistance": 1000 },
      "vivaScore": null
    }
  }
}
```

### 5.2 PWA Offline Manifest & Service Worker
- Progressive Web App manifest (`manifest.webmanifest`) declaring name, standalone display mode, orientation, and high-resolution icons.
- Cache-First service worker caching index HTML, JS bundle, CSS stylesheets, and KaTeX WOFF2 fonts for offline lab use.

---

## 6. Unit Conversion & Constant Engine

Standardized physical constants and unit converters implemented in `utils/units.ts`:
- **Fundamental Constants**:
  - Speed of light: $c = 2.99792458 \times 10^8\,\text{m/s}$ (Manual standard: $3 \times 10^8\,\text{m/s}$)
  - Elementary charge: $e = 1.602176634 \times 10^{-19}\,\text{C}$
  - Planck's constant: $h = 6.62607015 \times 10^{-34}\,\text{J}\cdot\text{s}$
  - Electron rest mass: $m_e = 9.1093837 \times 10^{-31}\,\text{kg}$
  - Reduced Planck constant: $\hbar = h / (2\pi)$
- **Units**:
  - Distance: $\text{m} \leftrightarrow \text{cm} \leftrightarrow \text{mm} \leftrightarrow \mu\text{m} \leftrightarrow \text{nm} \leftrightarrow \text{\AA}$
  - Voltage: $\text{V} \leftrightarrow \text{mV} \leftrightarrow \text{kV}$
  - Current: $\text{A} \leftrightarrow \text{mA} \leftrightarrow \mu\text{A}$
  - Angle: $\text{Degrees} \leftrightarrow \text{Radians} \leftrightarrow \text{Arcminutes}$
