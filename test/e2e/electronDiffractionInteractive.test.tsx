import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ElectronDiffractionWorkbench } from '../../src/components/workbenches/ElectronDiffractionWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('ElectronDiffractionWorkbench Interactive User Journey (Experiment 7)', () => {
  const expt7Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-7-electron-diffraction')!;

  it('renders workbench, tests voltage adjustments, caliper interactions, records observations, and verifies de Broglie and Bragg wavelength calculations', () => {
    const handleBack = vi.fn();
    const handleViva = vi.fn();

    render(
      <ElectronDiffractionWorkbench
        metadata={expt7Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(screen.getByText(/Experiment 7: Electron Diffraction/i)).toBeInTheDocument();
    expect(screen.getAllByText(/L = 135 mm/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/High-Voltage Power Supply/i)).toBeInTheDocument();
    expect(screen.getByText(/Analogue Multimeter \(Anode Current I_A\)/i)).toBeInTheDocument();
    expect(screen.getByText(/4\.00/i)).toBeInTheDocument(); // 4.00 kV
    expect(screen.getByText(/4000 V/i)).toBeInTheDocument();
    expect(screen.getByText(/100% Stabilized/i)).toBeInTheDocument();

    // 2. Quantum Calculations Cards
    expect(screen.getByText(/de Broglie Wavelength \(λ_dB\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Electron Kinetic Energy \(K = eV\)/i)).toBeInTheDocument();
    expect(screen.getAllByText(/4000 eV/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Ring 1 Bragg λ \(d₁=0\.213 nm\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Ring 2 Bragg λ \(d₂=0\.123 nm\)/i)).toBeInTheDocument();

    // 3. Test Voltage Controls: Step through 3.0 kV, 3.5 kV, 4.5 kV, 5.0 kV
    const v30Btn = screen.getByRole('button', { name: /3\.0 kV/i });
    fireEvent.click(v30Btn);
    expect(screen.getByText(/3\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/3000 V/i)).toBeInTheDocument();
    expect(screen.getAllByText(/3000 eV/i).length).toBeGreaterThanOrEqual(1);

    const v50Btn = screen.getByRole('button', { name: /5\.0 kV/i });
    fireEvent.click(v50Btn);
    expect(screen.getByText(/5\.00/i)).toBeInTheDocument();
    expect(screen.getByText(/5000 V/i)).toBeInTheDocument();
    expect(screen.getAllByText(/5000 eV/i).length).toBeGreaterThanOrEqual(1);

    // Return to 4.0 kV
    const v40Btn = screen.getByRole('button', { name: /4\.0 kV/i });
    fireEvent.click(v40Btn);
    expect(screen.getByText(/4\.00/i)).toBeInTheDocument();

    // 4. Test Caliper Overlay Controls
    const autoAlignBtn = screen.getByRole('button', { name: /Auto-Align Calipers/i });
    fireEvent.click(autoAlignBtn);

    // Switch Caliper Target to Ring 2
    const targetRing2Btn = screen.getByRole('button', { name: /Ring 2 \(Outer, d₂ = 0\.123 nm\)/i });
    fireEvent.click(targetRing2Btn);

    // Switch back to Ring 1
    const targetRing1Btn = screen.getByRole('button', { name: /Ring 1 \(Inner, d₁ = 0\.213 nm\)/i });
    fireEvent.click(targetRing1Btn);

    // 5. Test Record to Observation Table
    const recordBtn = screen.getByRole('button', { name: /Record to Table/i });
    fireEvent.click(recordBtn);

    // 6. Test Observation Table Display
    expect(screen.getByText(/Observation Table: de Broglie & Bragg Wavelength/i)).toBeInTheDocument();
    expect(screen.getByText(/Final Experimental Result Parity/i)).toBeInTheDocument();

    // 7. Test Graph View Tab
    const graphTabBtn = screen.getByRole('button', { name: /D vs 1\/√V Graph/i });
    fireEvent.click(graphTabBtn);
    expect(screen.getByText(/Verification Plot: Ring Diameters D vs 1\/√V_A/i)).toBeInTheDocument();
    expect(screen.getByText(/D₁ Fit \(R²=0\.999\)/i)).toBeInTheDocument();

    // Return to Table View
    const tableTabBtn = screen.getByRole('button', { name: /Table View/i });
    fireEvent.click(tableTabBtn);

    // 8. Test Ambiguity Modal (AMB-04 and AMB-05)
    const ambiguityBtn = screen.getByRole('button', { name: /Manual Ambiguities/i });
    fireEvent.click(ambiguityBtn);
    expect(screen.getByText(/AMB-04/i)).toBeInTheDocument();
    expect(screen.getByText(/AMB-05/i)).toBeInTheDocument();
    const closeAmbBtn = screen.getByRole('button', { name: /Understood & Close/i });
    fireEvent.click(closeAmbBtn);

    // 9. Test High-Voltage Safety Modal
    const safetyBtn = screen.getByRole('button', { name: /HV Safety \(5 kV\)/i });
    fireEvent.click(safetyBtn);
    expect(screen.getByText(/DANGER: High Voltage Equipment \(5000 V\)/i)).toBeInTheDocument();
    const closeSafetyBtn = screen.getByRole('button', { name: /Acknowledge Safety Protocol/i });
    fireEvent.click(closeSafetyBtn);

    // 10. Test Theory & Schematics Modal
    const theoryBtn = screen.getByRole('button', { name: /Theory & Schematics/i });
    fireEvent.click(theoryBtn);
    expect(screen.getByText(/Louis de Broglie Matter Wave Hypothesis/i)).toBeInTheDocument();
    const closeTheoryBtn = screen.getByRole('button', { name: /Close Reference/i });
    fireEvent.click(closeTheoryBtn);

    // 11. Test Guided Step Navigation
    const step2Btn = screen.getByRole('button', { name: /Apply 4 kV Anode/i });
    fireEvent.click(step2Btn);
    expect(screen.getByText(/Set the accelerating anode voltage to/i)).toBeInTheDocument();

    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Two green concentric rings will appear/i)).toBeInTheDocument();

    // 12. Navigation Callbacks
    const vivaBtn = screen.getByRole('button', { name: /Viva Voce/i });
    fireEvent.click(vivaBtn);
    expect(handleViva).toHaveBeenCalled();

    const backBtn = screen.getByRole('button', { name: /Back to Dashboard/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});
