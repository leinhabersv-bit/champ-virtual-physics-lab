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

