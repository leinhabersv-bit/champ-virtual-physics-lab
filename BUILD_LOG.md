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
