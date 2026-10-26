# CHAMP Virtual Physics Lab — Test Matrix & Verification Protocols

**System:** CHAMP Virtual Physics Laboratory (VIT Chennai BAPHY105)  
**Standard:** Strict Verification Before Completion & Deterministic Test Fixtures  
**Coverage Target:** 100% of mathematical contracts, core SI conversion engines, and workbench primitives  

---

## 1. Test Architecture & Verification Hierarchy

```
┌────────────────────────────────────────────────────────┐
│               End-to-End Test Skeletons                │
│    (Expt 1–9 User Journeys, Guided Mode, Viva Flow)    │
├────────────────────────────────────────────────────────┤
│           Workbench UI & Interaction Tests             │
│  (Terminal Snapping, Keyboard Wiring, Graph, Tables)   │
├────────────────────────────────────────────────────────┤
│         Deterministic Physics Engine Fixtures          │
│       (Expt 1–9 Mathematical & Physical Solvers)       │
├────────────────────────────────────────────────────────┤
│       SI Unit Conversion & Precision Utilities         │
└────────────────────────────────────────────────────────┘
```

---

## 2. Deterministic Physics Fixtures & Expected Tolerances

| Module | Test Case ID | Input Parameters | Expected Physical Outputs | Permissible Tolerance |
|---|---|---|---|---|
| **SI Units** | `TC-UNIT-01` | `convertLength(1.5, 'nm', 'm')` | `1.5e-9 m` | Exact ($\pm 10^{-15}$) |
| **SI Units** | `TC-UNIT-02` | `convertCurrent(2.5, 'mA', 'A')` | `0.0025 A` | Exact |
| **SI Units** | `TC-UNIT-03` | `convertAngle(30, 'arcmin', 'deg')` | `0.5 deg` | Exact |
| **Expt 1 (Solar Cell)** | `TC-E1-01` | Single cell, $d = 0.2\,\text{m}$, $R_L = 1000\,\Omega$ | $V_{oc} = 2.45\,\text{V}$, $I_{sc} = 14.2\,\text{mA}$, $V \approx 2.12\,\text{V}$, $I \approx 2.12\,\text{mA}$ | $\pm 1\%$ |
| **Expt 1 (Solar Cell)** | `TC-E1-02` | 3 cells Series, $R_L = 1000\,\Omega$ | $V_{total} = 3 \times V_{cell}$, $I_{total} \approx I_{cell}$ | $\pm 1\%$ |
| **Expt 1 (Solar Cell)** | `TC-E1-03` | 3 cells Parallel, $R_L = 100\,\Omega$ | $V_{total} \approx V_{cell}$, $I_{total} \approx 3 \times I_{cell}$ | $\pm 1\%$ |
| **Expt 1 (Solar Cell)** | `TC-E1-04` | $P_{max}$ & Fill Factor Calculation | $P_{max} = V_{max} \times I_{max}$, $FF = \frac{P_{max}}{V_{oc} I_{sc}} \in [0.45, 0.75]$ | $[0.4, 0.8]$ |
| **Expt 2 (Hg Grating)** | `TC-E2-01` | $\lambda = 546.1\,\text{nm}$ (Green), $N = 15000\,\text{LPI}$, $n=1$ | $e+d = 1.6933\,\mu\text{m}$, $\theta = \sin^{-1}(\frac{\lambda}{e+d}) = 18.818^\circ$ | $\pm 0.05^\circ$ |
| **Expt 3 (LED Planck)** | `TC-E3-01` | Red LED $\lambda = 660\,\text{nm}$, Knee $V_B = 1.88\,\text{V}$ | $h_{calc} = V_B \lambda \frac{e}{c} = 6.623 \times 10^{-34}\,\text{J}\cdot\text{s}$ | $\pm 3\%$ |
| **Expt 4 (Tunneling)** | `TC-E4-01` | $E = 2.0\,\text{eV}, V_0 = 6.0\,\text{eV}, a = 1.5\,\text{\AA}$ | $\kappa = 1.0245 \times 10^{10}\,\text{m}^{-1}$, $T = 0.0822$ | $\pm 0.001$ |
| **Expt 4 (Tunneling)** | `TC-E4-02` | $E \to V_0$ Limit Check ($E = 5.99\,\text{eV}, V_0 = 6.0\,\text{eV}$) | $T \to \left[1 + \frac{m V_0 a^2}{2\hbar^2}\right]^{-1} \approx 0.714$ | Continuous limit |
| **Expt 5 (Na Grating)** | `TC-E5-01` | Sodium doublet $D_1 = 589.6\,\text{nm}, D_2 = 589.0\,\text{nm}$ | Minimum deviation $D_m(D_1) = 40.85^\circ, D_m(D_2) = 40.80^\circ$ | $\pm 0.05^\circ$ |
| **Expt 6 (Photodiode)** | `TC-E6-01` | Dark current at $V_{rev} = 3\,\text{V}$ | $I_D = 0.15\,\mu\text{A} \pm 0.02\,\mu\text{A}$ | Exact model |
| **Expt 6 (Photodiode)** | `TC-E6-02` | Illuminated current at $d = 10\,\text{cm}, P_{opt} = 50\,\mu\text{W}$ | $I_{ph} = 22.5\,\mu\text{A}$, Responsivity $R = 0.45\,\text{A/W}$ | $\pm 2\%$ |
| **Expt 7 (Diffraction)**| `TC-E7-01` | $V_{anode} = 4000\,\text{V}, L = 135\,\text{mm}, d_{100} = 0.213\,\text{nm}$ | $\lambda_{dB} = 0.01939\,\text{nm}$, $D_1 = 2 \lambda L / d = 24.60\,\text{mm}$ | $\pm 0.1\,\text{mm}$ |
| **Expt 8 (Uncertainty)**| `TC-E8-01` | Slit $d = 40\,\mu\text{m}, \lambda = 650\,\text{nm}, D = 1000\,\text{mm}$ | First minimum $a_1 = 16.25\,\text{mm}$, $\Delta p_y \Delta y = h$ ($1.000$) | $\pm 0.001$ |
| **Expt 9 (Qubits)** | `TC-E9-01` | Hadamard on $|0\rangle$ | $|\psi\rangle = \frac{1}{\sqrt{2}}|0\rangle + \frac{1}{\sqrt{2}}|1\rangle$, $\theta = \pi/2, \phi = 0$ | Exact |
| **Expt 9 (Qubits)** | `TC-E9-02` | CNOT on $\frac{|0\rangle+|1\rangle}{\sqrt{2}} \otimes |0\rangle$ | Bell State $|\Phi^+\rangle = \frac{1}{\sqrt{2}}(|00\rangle+|11\rangle)$, Entangled | Exact |

---

## 3. Reusable Workbench Primitives Test Suite

### 3.1 Terminal & Wire Contract (`TC-WIRE-*`)
- `TC-WIRE-01`: Dragging wire from Anode to Cathode registers valid closed loop.
- `TC-WIRE-02`: Keyboard navigation (Tab to Terminal A $\to$ Enter $\to$ Tab to Terminal B $\to$ Enter) connects terminals identical to pointer drag.
- `TC-WIRE-03`: Terminal snapping within $15\,\text{px}$ visual radius.
- `TC-WIRE-04`: Disconnecting terminal recalculates live circuit impedance and resets meters to open-circuit state.

### 3.2 Observation Grid & Formula Panel (`TC-GRID-*`, `TC-FORMULA-*`)
- `TC-GRID-01`: "Log Reading" appends current workbench parameters and readings as an immutable observation row.
- `TC-GRID-02`: Auto-derived columns update synchronously when row inputs change.
- `TC-GRID-03`: CSV export serializes valid tabular text with column units.
- `TC-FORMULA-01`: KaTeX renders mathematical expressions without DOM layout shift.
- `TC-FORMULA-02`: Dynamic parameter substitution replaces symbolic tokens with student's active values.

### 3.3 Graphing Engine (`TC-GRAPH-*`)
- `TC-GRAPH-01`: Renders SVG polyline or bezier curve fitting through logged observation points.
- `TC-GRAPH-02`: Auto-calculates coordinate bounds with 10% padding.
- `TC-GRAPH-03`: Hovering data points reveals tooltip with coordinates and physical units.
- `TC-GRAPH-04`: Least-squares linear regression computes slope, intercept, and $R^2$ correlation.

---

## 4. Accessibility & UI Resilience Matrix

| Criterion | Standard | Test Method | Target |
|---|---|---|---|
| **Color Contrast** | WCAG 2.1 AA | Axe Core / Chrome DevTools Contrast | Text $\ge 4.5:1$, Controls $\ge 3:1$ |
| **Keyboard Navigation**| WCAG 2.1 AA | Tab order inspection & Focus Trap verification | All interactive controls reachable via Tab / Shift+Tab |
| **Touch / Tap Target** | Mobile UX | Viewport sizing ($390 \times 844\,\text{px}$) | Minimum $44 \times 44\,\text{px}$ bounding box |
| **Screen Reader** | ARIA 1.2 | Semantic markup (`role`, `aria-label`, `aria-live`) | Live readouts announced on value change |
| **Reduced Motion** | CSS Media Query | `@media (prefers-reduced-motion: reduce)` | Instant snap transitions without animations |

---

## 5. Per-Experiment End-to-End Interactive Test Suites (100% Implemented)

- `test/e2e/solarCellInteractive.test.tsx`: Load page $\to$ Guided mode $\to$ Wire breadboard $\to$ Set distance $\to$ Step resistance $100\,\Omega \dots 10\,\text{k}\Omega \to$ Check $P_{max} \to$ Validate efficiency.
- `test/e2e/mercurySpectrometerInteractive.test.tsx`: Calibrate spectrometer $V_1, V_2 \to$ Align normal incidence $\to$ Record spectral lines $\to$ Check computed wavelengths vs mercury standard.
- `test/e2e/ledPlanckInteractive.test.tsx`: Select LED color $\to$ Vary potentiometer $\to$ Measure forward $I$-$V \to$ Extrapolate $V_B \to$ Fit $V_B$ vs $1/\lambda \to$ Verify $h$.
- `test/e2e/quantumTunnelingInteractive.test.tsx`: Set $E, V_0, a \to$ Run simulation $\to$ Observe decaying $\psi(x) \to$ Validate $T$ matches closed-form solution $\to$ Test Python/.ipynb export.
- `test/e2e/sodiumSpectrometerInteractive.test.tsx`: Align spectrometer $\to$ Locate minimum deviation angle for $D_1, D_2 \to$ Verify doublet separation $\to$ Record verniers.
- `test/e2e/photodiodeInteractive.test.tsx`: Measure dark current $\to$ Illuminate at $10\,\text{cm} \to$ Measure reverse $I$-$V \to$ Compute responsivity $R \to$ Test shield toggle.
- `test/e2e/electronDiffractionInteractive.test.tsx`: Turn on heater $\to$ Set anode voltage $4\,\text{kV} \to$ Measure ring diameters $D_1, D_2 \to$ Compare Bragg vs de Broglie wavelength.
- `test/e2e/heisenbergInteractive.test.tsx`: Align laser to pinhole $\to$ Insert single slit $\to$ Transverse micrometer scan $\to$ Fit diffraction envelope $\to$ Verify $\Delta p_y \Delta y = h$.
- `test/e2e/quantumInteractive.test.tsx`: Initialize state $\to$ Apply Pauli/Hadamard gates $\to$ Check Bloch coordinates $\to$ Apply CNOT and verify Bell entanglement $\to$ Test Qiskit script export.
- `test/e2e/experiments.spec.ts`: Master multi-experiment regression suite verifying mathematical invariants across all 9 experiments.
