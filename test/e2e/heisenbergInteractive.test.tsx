import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { HeisenbergWorkbench } from '../../src/components/workbenches/HeisenbergWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('HeisenbergWorkbench Interactive User Journey (Experiment 8)', () => {
  const expt8Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-8-heisenberg-slit')!;

  it('renders workbench, tests slit width variation, micrometer scan, records observations, and verifies uncertainty principle calculations across all tables', () => {
    const handleBack = vi.fn();
    const handleViva = vi.fn();

    render(
      <HeisenbergWorkbench
        metadata={expt8Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(screen.getByText(/Experiment 8: Heisenberg Single-Slit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Diode Laser λ = 650 nm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Digital Output Measurement Unit/i)).toBeInTheDocument();
    expect(screen.getAllByText(/85\.00/i).length).toBeGreaterThanOrEqual(1); // 85.00 µA at center
    expect(screen.getAllByText(/16\.25 mm/i).length).toBeGreaterThanOrEqual(1); // 1st minima distance at 40 um

    // 2. Quantum Uncertainty Cards Verification
    expect(screen.getByText(/Uncertainty Principle Verification \(Δy · Δp_y = h\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Position Uncertainty \(Δy = d\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/40\.0 µm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Momentum Uncertainty \(Δp_y\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Product \(Δy · Δp_y\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ratio to Planck h \(Manual eq\. 11\)/i)).toBeInTheDocument();

    // 3. Test Slit Width Presets & Squeezing / Broadening Behavior
    // Switch to 80 µm
    const slit80Btn = screen.getByRole('button', { name: /^80 µm$/i });
    fireEvent.click(slit80Btn);
    expect(screen.getAllByText(/8\.13 mm/i).length).toBeGreaterThanOrEqual(1); // a1 shrinks to 8.13 mm

    // Switch to 120 µm
    const slit120Btn = screen.getByRole('button', { name: /^120 µm$/i });
    fireEvent.click(slit120Btn);
    expect(screen.getAllByText(/5\.42 mm/i).length).toBeGreaterThanOrEqual(1); // a1 shrinks to 5.42 mm

    // Switch back to 40 µm
    const slit40Btn = screen.getByRole('button', { name: /^40 µm$/i });
    fireEvent.click(slit40Btn);
    expect(screen.getAllByText(/16\.25 mm/i).length).toBeGreaterThanOrEqual(1);

    // 4. Test Translation Stage Micrometer Controls
    const plus1Btn = screen.getByRole('button', { name: /\+1\.0mm/i });
    fireEvent.click(plus1Btn);
    const minus1Btn = screen.getByRole('button', { name: /-1\.0mm/i });
    fireEvent.click(minus1Btn);

    const centerBtn = screen.getByRole('button', { name: /Center \(0\.0\)/i });
    fireEvent.click(centerBtn);

    // Record Point to Table 1
    const recordBtn = screen.getByRole('button', { name: /Record Point/i });
    fireEvent.click(recordBtn);

    // Auto-Scan Table 1
    const autoScanBtn = screen.getByRole('button', { name: /Auto-Scan Table 1/i });
    fireEvent.click(autoScanBtn);

    // 5. Switch to Table 1 View
    const table1Tab = screen.getByRole('button', { name: /Table 1: Profile Scan/i });
    fireEvent.click(table1Tab);
    expect(screen.getByText(/Table 1: Scanning micrometer position to plot diffraction intensity profile/i)).toBeInTheDocument();

    // 6. Switch to Table 2 View (Slit Width Calculation)
    const table2Tab = screen.getByRole('button', { name: /Table 2: Slit Width/i });
    fireEvent.click(table2Tab);
    expect(screen.getByText(/Table 2: Distance between central maximum and m\^th order minima/i)).toBeInTheDocument();
    expect(screen.getByText(/Mean Slit Width d =/i)).toBeInTheDocument();

    // 7. Switch to Table 3 View (Uncertainty Verification)
    const table3Tab = screen.getByRole('button', { name: /Table 3: Uncertainty Verification/i });
    fireEvent.click(table3Tab);
    expect(screen.getByText(/Table 3: Verifying Heisenberg's Uncertainty Principle quantitatively/i)).toBeInTheDocument();

    // 8. Switch back to Graph View
    const graphTab = screen.getByRole('button', { name: /Intensity Graph/i });
    fireEvent.click(graphTab);
    expect(screen.getByText(/Fraunhofer Diffraction Intensity Profile/i)).toBeInTheDocument();

    // 9. Test Ambiguities Modal (AMB-06 and AMB-07)
    const ambBtn = screen.getByRole('button', { name: /Source Ambiguities/i });
    fireEvent.click(ambBtn);
    expect(screen.getByText(/AMB-06/i)).toBeInTheDocument();
    expect(screen.getByText(/AMB-07/i)).toBeInTheDocument();
    const closeAmbBtn = screen.getByRole('button', { name: /Understood & Close/i });
    fireEvent.click(closeAmbBtn);

    // 10. Test Laser Safety Modal
    const safetyBtn = screen.getByRole('button', { name: /Laser Safety/i });
    fireEvent.click(safetyBtn);
    expect(screen.getByText(/CAUTION: Direct Laser Radiation Hazard/i)).toBeInTheDocument();
    const closeSafetyBtn = screen.getByRole('button', { name: /Acknowledge Safety Protocol/i });
    fireEvent.click(closeSafetyBtn);

    // 11. Test Theory & Formulas Modal
    const theoryBtn = screen.getByRole('button', { name: /Theory & Formulas/i });
    fireEvent.click(theoryBtn);
    expect(screen.getByText(/Diffraction Minima Condition/i)).toBeInTheDocument();
    const closeTheoryBtn = screen.getByRole('button', { name: /Close Reference/i });
    fireEvent.click(closeTheoryBtn);

    // 12. Test Guided Step Progression
    const step2Btn = screen.getByRole('button', { name: /Slit Squeezing & Spread/i });
    fireEvent.click(step2Btn);
    expect(screen.getByText(/Mount the single-slit carriage cell on the rail/i)).toBeInTheDocument();

    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Scan the micrometer translation stage from left to right/i)).toBeInTheDocument();

    // 13. Navigation Callbacks
    const vivaBtn = screen.getByRole('button', { name: /Viva Voce/i });
    fireEvent.click(vivaBtn);
    expect(handleViva).toHaveBeenCalled();

    const backBtn = screen.getByRole('button', { name: /Back to Dashboard/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});
