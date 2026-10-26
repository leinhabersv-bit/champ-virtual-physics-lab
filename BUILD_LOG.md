# CHAMP Virtual Physics Lab — Engineering Build Log & Audit Record

**Project:** CHAMP Virtual Physics Laboratory (BAPHY105 Engineering Physics)  
**Workspace:** `c:\Users\sandy\OneDrive\Pictures\Documents\PHYLAB EXP`  
**Host Environment:** Windows x64, Node v24.19.0, npm 11.17.0  
**Initial Baseline Date:** 2026-10-26  

---

## 1. Toolchain & Foundation Setup

| Step | Action | Outcome | Status |
|---|---|---|---|
| **01** | Git Repository Initialization | Initialized empty git repo in workspace root | PASSED |
| **02** | Comprehensive PDF Manual Audit | Read all 86 pages of `BAPHY105 Manual_SCOPE.pdf`, verified all front matter, preparatory modules, and experiments 1–9 | PASSED |
| **03** | Visual Audit of Experiment 8 | Visual inspection of photographic pages 66–74 (rail, laser kinematic mount, pinhole detector, digital readout, single slit carriage) | PASSED |
| **04** | Architecture & Traceability Docs | Authored `PROJECT_SPEC.md`, `MANUAL_TRACEABILITY.md`, `TEST_MATRIX.md` | PASSED |
| **05** | React + Vite + TypeScript Toolchain | Provisioned `package.json`, `vite.config.ts`, `tsconfig.json`, `tailwind.config.js` | PASSED |
| **06** | Mathematical & Vector Dependencies | Added KaTeX (`katex`), Lucide Icons (`lucide-react`), Vitest (`vitest`) | PASSED |
| **07** | Reusable Workbench Primitives | Implemented SVG apparatus, interactive wiring, parameter controls, KaTeX formula panel, observation grid, responsive graph | PASSED |
| **08** | Primary Demo Implementation | Shipped fully functional Experiment 1 (Solar Cell Characterization Workbench) | PASSED |
| **09** | Deterministic Test Suite | Unit tests for SI units, simulator engines, wiring logic, and smoke tests (27/27 passed) | PASSED |
| **10** | Production Build & Lint Gate | Executed `npm run build` and `tsc --noEmit` with zero errors | PASSED |

---

## 2. Dependency Rationale & Security Assessment

1. **React 18 / 19 + TypeScript**:
   - Provides deterministic state transitions, strict type checking across physical models, and zero runtime overhead.
2. **Tailwind CSS**:
   - Modern, high-contrast accessible design system with customizable color tokens (`slate`, `emerald`, `amber`, `indigo`, `rose`).
3. **KaTeX (`katex`)**:
   - Lightweight, pure CSS/JS mathematical typesetting engine without external browser network dependencies. Crucial for offline PWA operation.
4. **Lucide React (`lucide-react`)**:
   - Clean, lightweight vector iconography for laboratory instruments, controls, and feedback.
5. **Vitest + JSDOM**:
   - Ultra-fast native Vite test runner for executing deterministic unit tests on physics solvers and SI conversions.

---

## 3. Ambiguities & Engineering Resolutions Log

- **Log ID AMB-01 (Unit consistency in Solar Cell Power):**
  - *Finding:* Manual p. 28 lists current in $\text{mA}$ and power in $\text{W}$, but direct product $V \times I$ produces $\text{mW}$.
  - *Resolution:* Stored internally as standard SI Watts ($\text{W}$). Displayed with explicit micro-unit toggle ($\text{mW}$ / $\text{W}$) with a pedagogical tooltip clarifying the conversion factor $1\,\text{W} = 1000\,\text{mW}$.
- **Log ID AMB-02 (Typographic inversion in Mercury Grating Formula):**
  - *Finding:* Manual p. 34 writes `(e+d) = n λ / sin θ`.
  - *Resolution:* Formula panel documents both the printed version from manual and the rearranged version $\lambda = \frac{(e+d)\sin\theta}{n}$ used for calculation.
- **Log ID AMB-03 (Spectrometer Minimum Deviation Formula in Table Header):**
  - *Finding:* Manual p. 55 column header writes `2Dm= (a-b)/2`.
  - *Resolution:* Automated calculation computes true angle $D_m = \frac{|a - b|}{2}$ while rendering a helpful alert badge explaining the typo in the printed syllabus.
- **Log ID AMB-04 (Electron Diffraction Voltage Scaling):**
  - *Finding:* Manual p. 64 step 6 writes "changing the voltage by a difference of 0.5V" for a system operating at $4\,\text{kV}$.
  - *Resolution:* Calibrated step to $0.5\,\text{kV}$ ($500\,\text{V}$) with annotation.

---

## 4. Experiment 1: Solar Cell Renewable Energy Circuit Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Graph Netlist Topology Engine** | Graph analysis of leads & terminals | `src/engine/circuitNetlist.ts` analyzes graph components, detects `OPEN_CIRCUIT_DISCONNECTED`, `OPEN_CIRCUIT_VOC_MEASUREMENT`, `SHORT_CIRCUIT_ISC_MEASUREMENT`, `ERROR_VOLTMETER_SERIES`, `ERROR_AMMETER_PARALLEL`, `ERROR_SERIES_MISWIRED`, `ERROR_PARALLEL_MISWIRED`, reversed polarity | VERIFIED |
| **Observation Tables 1–4 Parity** | Manual pp. 28–31 (Table 1: Dist 1 25cm, Table 2: Least Dist 12cm, Table 3: Series 3 cells, Table 4: Parallel 3 cells) | Exact 13 resistance values `[0.1, 0.22, 0.5, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] kΩ`, Voc, Isc, area A, Io, Sl. No, R, I(mA), V(V), P=VI (W & mW) | VERIFIED |
| **Master Results Summary Table** | Manual p. 32 | Comparison of Pmax, Vmax, Imax, FF, η across single cell (Dist 1 & 2), series, and parallel configurations | VERIFIED |
| **Radiometry vs Photometry** | Lux $\neq$ W/m² flag & calibration | Explicit educational alert badge, justified $K_{calib} = 0.0125\,\text{W}/(\text{m}^2\cdot\text{lx})$ calibration factor, zero-denominator guard | VERIFIED |
| **Procedure B Appliance Variant** | Real-time appliance load testing | Switchable load (Red, Green, Blue LEDs, DC Motor) with series current-limiting resistor (100, 220, 330, 470 Ω) | VERIFIED |
| **Pedagogical Features** | Guided & Exam modes, line-by-line calculations, viva | Step-by-step walkthrough, exam mode with rubric, KaTeX line-by-line sample calculations, 4 viva questions | VERIFIED |
| **Automated Test Coverage** | Netlist, table parity, unit, and interactive E2E | 43 / 43 tests passing across 7 suites (`circuitNetlist.test.ts`, `solarCellTables.test.ts`, `solarCellInteractive.test.tsx`, etc.) | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean build with zero errors, gzip bundle 161.56 kB | VERIFIED |

---

## 5. Experiment 2: Mercury Lamp Spectral Wavelengths (Normal Incidence) Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Circular Modular Arithmetic Engine** | Circular angle difference with 0°/360° wraparound | `src/engine/mercuryGratingEngine.ts`: `circularDistance(a, b)` computes shortest arc across 0°/360°; `normalizeAngle(deg)` maps to [0, 360) | VERIFIED |
| **Spectrometer Scale & Least Count** | Manual p. 19 & p. 36 ($1\text{ MSD} = 0.5^\circ$, $30\text{ VSD} = 29\text{ MSD}$, $\text{LC} = 1'$) | MSR, VSC, TR decomposition: $TR = MSR + (VSC \times 1')$; DMS conversion format (e.g. $110^\circ 30' + 9' = 110^\circ 39'$) | VERIFIED |
| **Grating Element Conversion** | Manual p. 36: $(e+d) = \frac{2.54 \times 10^{-2}}{N}\text{ m}$ | Computes lines/m ($590,551\text{ lines/m}$) and $(e+d) = 1.69333 \times 10^{-6}\text{ m}$ for $15,000\text{ LPI}$ | VERIFIED |
| **Observation Table Parity** | Manual p. 36: 1st order spectrum table (4 colors $\times$ 2 verniers $V_1, V_2$ = 8 rows) | Left (a) and Right (b) MSR, VSC, TR, $2\theta = |a - b|$, $\theta = (a - b)/2$, Mean $\theta$, Calculated $\lambda$ | VERIFIED |
| **Mercury Reference Wavelengths** | Manual p. 36 & p. 37: Blue ($4693\text{ \AA}$), Green ($5461\text{ \AA}$), Yellow ($5770\text{ \AA}$), Red ($6238\text{ \AA}$) | Recovered wavelengths: Blue ($4691\text{ \AA}$, $0.04\%$), Green ($5462\text{ \AA}$, $0.01\%$), Yellow ($5768\text{ \AA}$, $0.03\%$), Red ($6238\text{ \AA}$, $0.00\%$) | VERIFIED |
| **Interactive Vector Apparatus** | SVG Spectrometer Chassis & Eyepiece Reticle | Rotating telescope arm, collimator with slit adjustment screw, transmission grating on spirit-leveled prism table, 4° FOV ocular reticle with centered crosshairs | VERIFIED |
| **Dual Vernier Magnifiers** | Magnifier views for $V_1$ and $V_2$ ($180^\circ$ offset) | Live readout of MSR (degrees + minutes), VSC (0–29 div), TR, and DMS | VERIFIED |
| **Normal Incidence Alignment Wizard** | 4-step sequence from manual pp. 34–35 | Direct ray (180°) $\to$ $90^\circ$ swing $\to$ $45^\circ$ reflection $\to$ $45^\circ$ normal setting, plus one-click auto-align | VERIFIED |
| **Automated Test Coverage** | Unit tests + interactive integration test | 53 / 53 tests passing across 9 test suites (`mercuryGratingEngine.test.ts`, `mercurySpectrometerInteractive.test.tsx`, etc.) | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean compilation with zero errors, gzip bundle 170.96 kB | VERIFIED |

---

## 6. Experiment 3: Planck Constant via Semiconductor LEDs Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Semiconductor Conduction Engine** | Shockley diode forward bias with series ohmic limit | `src/engine/ledPlanckSimulator.ts`: Sub-threshold exponential conduction ($V_d < V_B$) transitions into linear conduction governed by internal die resistance ($25\,\Omega$) and external limiter ($10-100\,\Omega$). Clamped safely at $\le 2900\,\mu\text{A}$ per manual p. 42. | VERIFIED |
| **Source Wavelengths & SI Units** | Exact manual wavelengths & SI physical constants | Manual pp. 38, 43, 44: Blue ($470\,\text{nm}$), Yellow ($500\,\text{nm}$), Green ($565\,\text{nm}$), Red ($660\,\text{nm}$). Wavelengths converted to metres ($10^{-9}\,\text{m}$); $e = 1.602 \times 10^{-19}\,\text{C}$, $c = 2.998 \times 10^8\,\text{m/s}$, $h = 6.626 \times 10^{-34}\,\text{J}\cdot\text{s}$. | VERIFIED |
| **Circuit Netlist Topology Analyzer** | Directed graph analysis of breadboard wiring | `src/engine/ledPlanckNetlist.ts`: Graph adjacency solver detects `VALID_FORWARD_BIAS`, `REVERSED_LED_POLARITY`, `ERROR_AMMETER_PARALLEL`, `ERROR_VOLTMETER_SERIES`, `WARNING_MISSING_LIMITER`, `OPEN_CIRCUIT_DISCONNECTED`, and meter polarity inversion. | VERIFIED |
| **Observation Table 1 Parity** | Manual p. 43: 15 voltage rows per LED | 15 discrete points per LED (Blue, Yellow, Green, Red = 60 points) spanning sub-threshold, knee, and linear conduction regimes with Sl. No, potentiometer setting (%), applied voltage, diode voltage $V_d$, and current $I\,(\mu\text{A})$. | VERIFIED |
| **Linear Tangent Fitting & Barrier $V_B$** | Extrapolation on linear region to X-axis intercept | `fitLinearTangent()`: Least-squares regression $I = m \cdot V + c$, $V$-intercept $V_B = -c/m$. Enforces $R^2 \ge 0.90$ and $m > 0$; strictly rejects sub-threshold/non-linear points without fabricating intercepts. | VERIFIED |
| **Observation Table 2 Parity** | Manual p. 44: Summary across LEDs | Computes direct $h = e \cdot V_B \cdot \lambda / c$ for each LED, error percentage vs $6.626 \times 10^{-34}\,\text{J}\cdot\text{s}$, and mean $\bar{h}$ across all 4 LEDs. | VERIFIED |
| **Graphical Planck Constant ($V_B$ vs $1/\lambda$)** | Manual p. 41: Linear slope $\Delta V_B / \Delta(1/\lambda) = hc/e$ | Linear regression on $V_B$ vs $1/\lambda$ ($R^2 \ge 0.99$), extracting $h_{\text{graph}} = \text{Slope} \cdot e / c$ with comparison to accepted value. | VERIFIED |
| **Interactive SVG Vector Workbench** | Full interactive circuit on breadboard | 3V DC regulated supply, selectable limiter ($10\,\Omega, 47\,\Omega, 100\,\Omega$), rotary potentiometer dial with step nudges, glowing color-matched LED dome, parallel voltmeter, series microammeter, interactive wire snapping. | VERIFIED |
| **Pedagogical Features** | Guided, Exam, Viva, Calculations drawer | 4-step guided progression, exam mode with rubric, KaTeX sample calculation drawer, and CSV export for Table 1 and Table 2. | VERIFIED |
---

## 7. Experiment 4: Quantum Tunneling Through a Finite Potential Barrier Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Schrödinger Boundary Matching Solver** | Finite rectangular potential barrier solver across all 3 energy regimes ($E < V_0$, $E = V_0$, $E > V_0$) | `src/engine/tunnelingSimulator.ts`: Exact boundary coefficient solver matching $\psi(x)$ and $\psi'(x)$ at $x=0$ and $x=a$. Closed-form $T = \left[1 + \frac{V_0^2 \sinh^2(\kappa a)}{4E(V_0 - E)}\right]^{-1}$ for $E < V_0$, $T = \left[1 + \frac{m V_0 a^2}{2\hbar^2}\right]^{-1}$ at $E = V_0$, and $T = \left[1 + \frac{V_0^2 \sin^2(k_2 a)}{4E(E - V_0)}\right]^{-1}$ for $E > V_0$. | VERIFIED |
| **Unitarity & Boundary Continuity** | Strictly $T + R = 1.0000$ and continuous $\psi(x)$ across all regions | $r = A + B - 1$ and $u = t e^{i k_1 a}$ guarantee $|\psi_I(0) - \psi_{II}(0)| < 10^{-14}$ and $|t|^2 + |r|^2 = 1.000000$ to machine precision. Verified by unit test `TC-E4-01`. | VERIFIED |
| **Amplitude vs Probability Distinction** | Explicit distinction between complex amplitude $t \in \mathbb{C}$ and scalar probability $T = |t|^2$ | UI HUD and Observation Tables explicitly separate transmitted complex amplitude $t = t_{\text{re}} + i t_{\text{im}}$, magnitude $|t| = \sqrt{T}$, and probability $T = |t|^2$. Never conflates amplitude with probability. | VERIFIED |
| **Wavefunction Spatial Visualizer** | Image176 (manual p. 46) replication with 3 regions & barrier shading | Interactive SVG dual-axis visualizer showing $V(x)$ potential step profile, Region II shaded hatch block, particle energy $E$ horizontal line, zero axis, and switchable $\text{Re}(\psi)$, $\text{Im}(\psi)$, and $|\psi|^2$ probability density curves. | VERIFIED |
| **Observation Tables 1.1–2.2 Parity** | Manual pp. 45–47 (Tables 1.1, 1.2, 2.1, 2.2 with 15 rows each) | Table 1.1: $T$ vs $E$ ($a=1.5\,\text{\AA}, V_0=6\,\text{eV}$, $E \in [0.5, 6.0]\,\text{eV}$); Table 1.2: $T$ vs $E$ ($a=2.0\,\text{\AA}, V_0=6\,\text{eV}$, $E \in [0.5, 6.0]\,\text{eV}$); Table 2.1: $T$ vs $a$ ($E=2.0\,\text{eV}, V_0=6\,\text{eV}$, $a \in [0.5, 4.0]\,\text{\AA}$); Table 2.2: $\ln(T)$ vs $a$ ($E=3.0\,\text{eV}, V_0=6\,\text{eV}$, $a \in [0.5, 4.0]\,\text{\AA}$). CSV export supported. | VERIFIED |
| **Python Jupyter Parity Panel** | Standalone NumPy/SciPy/Matplotlib code with copy & download (.py/.ipynb) | Dedicated code panel with one-click clipboard copy, `.py` script download, and valid Jupyter Notebook (`.ipynb`) JSON download. Clearly disclaims that browser executes validated TypeScript while providing exact source code for local execution. | VERIFIED |
| **Analytical Written Questions & Viva** | Manual pp. 48–49 questions on decay, critical limit & resonances | Expandable Theory & Derivations drawer with complete derivations, time-independent Schrödinger equations, barrier matching matrices, and explicit answers to manual questions. | VERIFIED |
| **Automated Test Coverage** | Pure engine unit tests and full interactive E2E user journey | 70 / 70 tests passing across 13 test suites (`tunnelingEngine.test.ts`, `quantumTunnelingInteractive.test.tsx`, etc.). Verified $T(E) \in [0, 1]$, exponential decay $T(a)$, resonant transmission $T(E > V_0)$, and UI interactivity. | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean compilation with zero TypeScript errors or warnings. Vite bundle built in 14.8s. | VERIFIED |

---

## 8. Experiment 5: Sodium Lamp Minimum Deviation Grating Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Oblique Incidence Grating Physics** | Complete physical model $(e+d)(\sin i + \sin\theta) = n\lambda$ with $D(i) = i + \theta(i)$ | `src/engine/sodiumGratingEngine.ts`: Calculates exact diffraction angle $\theta(i) = \arcsin\left(\frac{n\lambda}{e+d} - \sin i\right)$, total deviation $D(i) = i + \theta(i)$, and gradient $\frac{dD}{di} = 1 - \frac{\cos i}{\cos\theta}$. Does not reuse normal incidence shortcuts. | VERIFIED |
| **Minimum Deviation Stationary Point** | Extremum condition $dD/di = 0 \implies i = \theta = D_m / 2$ | At $i = D_m/2$, path difference symmetric $AL + AM = 2(e+d)\sin(D_m/2) = n\lambda$. Stationarity verified by unit test `TC-E5-03` ($\frac{dD}{di} \approx 0$ at $i = 10.026^\circ$ for Yellow 1). | VERIFIED |
| **Grating Element Conversion** | Manual p. 54: $(e+d) = \frac{2.54 \times 10^{-2}}{N}\text{ m}$ | Computes lines/m ($590,551\text{ lines/m}$) and $(e+d) = 1.69333 \times 10^{-6}\text{ m} = 16,933.3\text{ \AA}$ for $15,000\text{ LPI}$. Verified by unit test `TC-E5-01`. | VERIFIED |
| **Spectrometer Mechanics & Scales** | Dual verniers $V_1$ and $V_2$ ($180^\circ$ offset), $1\text{ MSD} = 0.5^\circ = 30'$, $30\text{ VSD} = 29\text{ MSD} \implies \text{LC} = 1'$ | `decomposeAngleToVernier()` generates realistic MSR (degrees + minutes), VSC ($0-29$), and Total Reading TR with circular modular wraparound across $0^\circ / 360^\circ$. | VERIFIED |
| **Observation Table Parity** | Manual p. 55: 1st order spectrum table (2 colors $\times$ 2 verniers $V_1, V_2$ = 4 rows) | Left (a) and Right (b) MSR, VSC, TR, $2D_m = |a - b|$, $D_m = |a - b|/2$, Mean $D_m$, Calculated $\lambda$ in nm and $\text{\AA}$, and percentage error vs reference doublet. | VERIFIED |
| **Printed Erratum AMB-03 Resolution** | Manual p. 55 table header writes `2Dm = (a-b)/2` | Explicit alert badge in UI explains the printing typo: $2D_m = |a - b|$ and $D_m = |a - b|/2$. The software computes physically sound $D_m$ without silently distorting the math. | VERIFIED |
| **Sodium Doublet Spectral Lines** | Yellow 1 ($D_1 = 589.6\,\text{nm}$) and Yellow 2 ($D_2 = 589.0\,\text{nm}$) | Yellow 1 $D_m = 20.052^\circ = 20^\circ 3'$, Yellow 2 $D_m = 20.032^\circ = 20^\circ 2'$. Separated by $\Delta D_m \approx 1.25'$, resolvable on a $1'$ spectrometer. Recovered: Yellow 1 ($589.5\,\text{nm}$, $0.01\%$), Yellow 2 ($589.1\,\text{nm}$, $0.01\%$). | VERIFIED |
| **Interactive Vector Apparatus** | SVG Spectrometer Chassis, Prism Table & Eyepiece Reticle | Independent rotating prism table ($i$), rotating telescope arm, collimator with slit adjustment screw, transmission grating on spirit-leveled table, 4° FOV ocular reticle with moving spectral lines that turn back through minimum deviation extremum. | VERIFIED |
| **Dual Vernier Magnifiers** | Magnifier views for $V_1$ and $V_2$ ($180^\circ$ offset) | Live readout of MSR (degrees + minutes), VSC ($0-29\text{ div}$), TR, and DMS. | VERIFIED |
| **Pedagogical Features** | Guided, Exam, Viva, Calculations drawer | 4-step guided progression, exam mode, theory & derivation drawer with LaTeX formulas, one-click CSV export. | VERIFIED |
| **Automated Test Coverage** | Unit tests + interactive integration test | 78 / 78 tests passing across 15 test suites (`sodiumGratingEngine.test.ts`, `sodiumSpectrometerInteractive.test.tsx`, etc.). Verified turning point, angular conversions, wavelength recovery, and UI interaction. | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean compilation with zero TypeScript errors or warnings. Vite production bundle built cleanly. | VERIFIED |

---

## 9. Experiment 6: Photodiode I–V Characteristics Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **Reverse Bias Photoconductive Engine** | Complete physical model $I = I_D + I_{ph}$ under reverse bias $V_R \in [0, 5]\,\text{V}$ | `src/engine/photodiodeSimulator.ts`: Thermal saturation dark current $I_0(1 - e^{-V_R/\eta V_T})$ + surface shunt leakage $V_R / R_{sh}$. Verified by unit test `TC-E6-01`. | VERIFIED |
| **Inverse-Square Optical Power** | $P_{opt}(d) \propto 1/d^2$ distance dependence | $P_{opt}(d) = P_{ref} \cdot (d_{ref}/d)^2$. At 10 cm: $45\,\mu\text{W}$; at 20 cm: $11.25\,\mu\text{W}$ ($1/4\times$); at 5 cm: $180\,\mu\text{W}$ ($4\times$). Verified by unit test `TC-E6-02`. Zero optical power strictly enforced when lamp is OFF or opaque shielding is ON. | VERIFIED |
| **Photocurrent & Responsivity** | $I_{ph} = I_{illum} - I_D\text{ (A)}$ and $R = I_{ph} / P_{opt}\text{ (A/W)}$ | Computes true photocurrent $I_{ph}$ with explicit $\mu\text{A} \leftrightarrow \text{A}$ conversion. Responsivity $R = 0.45\,\text{A/W}$ matching standard silicon optoelectronic specifications. Verified by unit test `TC-E6-03`. | VERIFIED |
| **Percentage Change & Zero-Protection** | $\% \Delta = \frac{I_{illum} - I_D}{I_D} \times 100$ | Evaluates relative photo-response with zero-dark-current protection: safely returns `null`/undefined when $I_D \to 0$ (e.g. at $V_R = 0$) to eliminate division-by-zero crashes. Verified by unit test `TC-E6-04`. | VERIFIED |
| **Observation Tables 1, 2, and 3 Parity** | Manual pp. 58–59 exact table reproductions | Table 1: Dark current ($0-5\,\text{V}$ in $0.5\,\text{V}$ steps). Table 2: Photocurrent at fixed distances ($D_1 = 10\,\text{cm}$ and $D_2 = 15\,\text{cm}$). Table 3: Photocurrent at fixed reverse voltages ($1\,\text{V}, 2\,\text{V}, 3\,\text{V}$) across distances ($5, 10, 15, 20\,\text{cm}$). CSV export supported. | VERIFIED |
| **Circuit Topology & Polarity Validator** | Netlist graph validation of breadboard wiring | `src/engine/photodiodeNetlist.ts`: Validates complete loop from DC Supply (+) through 1 kΩ resistor and microammeter to Photodiode Cathode (-), and Anode (+) to Supply (-). Detects `FORWARD_BIAS_WARNING` on inverted polarity, `AMMETER_PARALLEL_SHORT`, and `OPEN_CIRCUIT`. Verified by unit test `TC-E6-06`. | VERIFIED |
| **Dual-Mode Interactive Visual Plotter** | Manual p. 58 Image225 3rd-quadrant curves & $I_{ph}$ vs $1/d^2$ | SVG plotter renders 3 curves: Dark current (dashed), $D_1 = 10\,\text{cm}$ (amber), and $D_2 = 15\,\text{cm}$ (sky) with live operating point cursor. Switchable to linear $I_{ph}$ vs $1/d^2$ scatter plot. | VERIFIED |
| **Interactive Vector Apparatus** | SVG testbench with DC supply, meters, optical rail & shield | Regulated supply ($0-30\,\text{V}$), microammeter ($0-100\,\mu\text{A}$), voltmeter ($0-10\,\text{V}$), 1 kΩ resistor with color bands, photodiode mount, movable optical lamp carriage ($5-25\,\text{cm}$), and removable opaque shielding box. | VERIFIED |
| **Pedagogical Modes & Viva** | Guided, Exam, Viva Voce, Theory drawer | 4-step guided progression, exam mode with rubric, KaTeX mathematical derivation drawer, and complete observation table CSV export. | VERIFIED |
| **Automated Test Coverage** | Unit tests + interactive integration test | 86 / 86 tests passing across 17 test suites (`photodiodeSimulator.test.ts`, `photodiodeInteractive.test.tsx`, `simulators.test.ts`, etc.). | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean compilation with zero TypeScript errors or warnings. Vite bundle built in 4.19s. | VERIFIED |

---

## 10. Experiment 7: Electron Diffraction & de Broglie Wavelength Verification Log

| Component | Target Spec | Implementation & Evidence | Status |
|---|---|---|---|
| **de Broglie Wave Mechanics Engine** | $\lambda_{dB} = \frac{h}{p} = \frac{h}{\sqrt{2 m_e e V_A}}$ across $V_A \in [2.0, 5.0]\,\text{kV}$ | `src/engine/electronDiffractionSimulator.ts`: Implements exact de Broglie wavelength in metres, nanometres, and Angstroms. At $4.0\,\text{kV}$, $\lambda_{dB} = 0.01939\,\text{nm} = 0.1939\,\text{\AA}$. Verified by unit test `TC-E7-01`. | VERIFIED |
| **Dual Graphite Lattice Geometry** | Inner Ring $d_1 = 0.213\,\text{nm}$ ($\{10\bar{1}0\}$) & Outer Ring $d_2 = 0.123\,\text{nm}$ ($\{11\bar{2}0\}$) | Models both lattice plane spacings from manual Fig. 5. Preserves fixed screen distance $L = 135.0\,\text{mm}$. Verified by unit test `TC-E7-03`: Ring 1 diameter $D_1 \approx 24.66\,\text{mm}$ is smaller than Ring 2 diameter $D_2 \approx 42.97\,\text{mm}$ because $D \propto 1/d$. | VERIFIED |
| **Inverse Voltage Scaling $D \propto 1/\sqrt{V_A}$** | Ring diameter shrinks as accelerating voltage increases | Strict inverse square-root dependence modeled across $2.5, 3.0, 3.5, 4.0, 4.5, 5.0\,\text{kV}$. Product $D \cdot \sqrt{V_A} \approx \text{constant}$ within $0.5\%$. Verified by unit test `TC-E7-02` and E2E interactive test. | VERIFIED |
| **Exact Bragg vs Small-Angle Parity** | $\lambda_{\text{Bragg}} = 2d \sin\left(\frac{1}{2}\arctan\left(\frac{D}{2L}\right)\right)$ (Image 49) | Implements both the exact trigonometric formula from manual Image 49 and small-angle approximation $\lambda \approx \frac{d D}{2L}$. Discrepancy between exact Bragg and de Broglie is $< 0.01\%$. Verified by unit test `TC-E7-04`. | VERIFIED |
| **Electron Kinetic Energy & Dynamics** | $K = e V_A$ in Joules and $\text{eV}$, electron speed $v$, and relativistic $\beta, \gamma$ | Computes $K = 4000\,\text{eV} = 6.4087 \times 10^{-16}\,\text{J}$, momentum $p = 3.417 \times 10^{-23}\,\text{kg}\cdot\text{m/s}$, $v \approx 3.75 \times 10^7\,\text{m/s}$, $\beta = v/c \approx 0.125$, and $\gamma \approx 1.008$ (<1% relativistic deviation, justifying non-relativistic model). Verified by unit test `TC-E7-05`. | VERIFIED |
| **Vernier Caliper Decomposition** | $\text{MSR} = \lfloor D \rfloor$, $\text{VSC} = \text{round}((D - \text{MSR})/0.1)$, $\text{TR} = \text{MSR} + \text{VSC} \times 0.1\,\text{mm}$ | Caliper least count $\text{LC} = 0.1\,\text{mm}$. Live decomposed readouts with graphical vernier slider and fine adjustment. Verified by unit test `TC-E7-06`. | VERIFIED |
| **Observation Table Parity** | Manual p. 65 Table (Voltage, Ring 1 & Ring 2 MSR, VSC, TR, $\tan 2\theta$, $\theta$, Bragg $\lambda$, de Broglie $\lambda$, % Error) | `generateObservationTable` produces full 5-row table for $3.0, 3.5, 4.0, 4.5, 5.0\,\text{kV}$ with complete sub-columns. Live table allows recording measurements and exporting to CSV. Verified by unit test `TC-E7-08`. | VERIFIED |
| **Flagged Manual Ambiguities (AMB-04 & AMB-05)** | AMB-04 ($0.5\,\text{V}$ step erratum) and AMB-05 ($0.213\,\text{nm}$ "outer" erratum) | Explicit educational callout card and modal display source text, issue, and resolution without silently altering the math. Verified by unit test `TC-E7-09`. | VERIFIED |
| **Cathode Thermal Stabilization** | Thermionic emission warm-up period (~60s with skip option) | Models cathode warm-up timer ($0-100\%$). Cold filament suppresses beam current and diffraction rings; warm filament produces glowing rings and $75\,\mu\text{A}$ anode current. Verified by unit test `TC-E7-07`. | VERIFIED |
| **Interactive Vector Apparatus** | SVG Electron Diffraction Tube & P31 Phosphor Luminescent Screen | High-voltage supply ($0-5\,\text{kV}$), analogue microammeter with needle deflection, darkroom chamber toggle, concentric millimeter grid overlay, draggable Vernier calipers, and central undeflected beam spot. | VERIFIED |
| **Analytical Graph: $D$ vs $1/\sqrt{V_A}$** | Linear confirmation of de Broglie relation ($R^2 \approx 0.999$) | Interactive SVG plot shows measured data points for both rings against theoretical linear regression lines. | VERIFIED |
| **Automated Test Coverage** | 9 unit tests + full E2E user journey test | 96 / 96 tests passing across 19 test suites (`electronDiffractionSimulator.test.ts`, `electronDiffractionInteractive.test.tsx`, `simulators.test.ts`, etc.). | VERIFIED |
| **Production Build** | `tsc && vite build` | Clean compilation with zero TypeScript errors or warnings. Built in 3.61s. | VERIFIED |






