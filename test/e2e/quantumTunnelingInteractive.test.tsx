import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuantumTunnelingWorkbench } from '../../src/components/workbenches/QuantumTunnelingWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('QuantumTunnelingWorkbench Interactive User Journey (Experiment 4)', () => {
  const expt4Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-4-quantum-tunneling')!;

  it('renders workbench, controls parameters, switches wavefunction views, navigates observation tables, tests Python export, and advances guided steps', () => {
    const handleBack = vi.fn();
    const handleViva = vi.fn();

    // Mock window.URL.createObjectURL and revokeObjectURL for notebook downloads
    const mockCreateObjectURL = vi.fn(() => 'blob:mock-url');
    const mockRevokeObjectURL = vi.fn();
    window.URL.createObjectURL = mockCreateObjectURL;
    window.URL.revokeObjectURL = mockRevokeObjectURL;

    // Mock clipboard writeText
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });

    render(
      <QuantumTunnelingWorkbench
        metadata={expt4Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Header
    expect(screen.getByText(/Simulating Quantum Tunneling Through a Potential Barrier/i)).toBeInTheDocument();
    expect(screen.getByText(/SIMULATED DATA - VALIDATED SCHRÖDINGER SOLVER/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sub-barrier Tunneling \(E < V0\)/i).length).toBeGreaterThanOrEqual(1);

    // Verify Region boundaries displayed in SVG annotations
    expect(screen.getByText(/REGION I \(x < 0\)/i)).toBeInTheDocument();
    expect(screen.getByText(/REGION II \(0 ≤ x ≤ a\)/i)).toBeInTheDocument();
    expect(screen.getByText(/REGION III \(x > a\)/i)).toBeInTheDocument();

    // 2. Initial Scientific Instruments Readings (E = 2.0 eV, V0 = 6.0 eV, a = 1.5 Å)
    expect(screen.getByText(/Transmission Prob T/i)).toBeInTheDocument();
    expect(screen.getByText(/Transmitted Amp \|t\|/i)).toBeInTheDocument();
    expect(screen.getByText(/Attenuation κ/i)).toBeInTheDocument();
    expect(screen.getByText(/Penetration Depth δ/i)).toBeInTheDocument();
    expect(screen.getByText(/Complex Amplitudes & Unitarity/i)).toBeInTheDocument();
    expect(screen.getByText(/1\.00000/i)).toBeInTheDocument();

    // 3. Parameter Sliders (E, V0, a)
    const energySlider = screen.getByLabelText(/Adjust particle energy E/i);
    const barrierSlider = screen.getByLabelText(/Adjust barrier height V0/i);
    const widthSlider = screen.getByLabelText(/Adjust barrier width a/i);

    expect(energySlider).toBeInTheDocument();
    expect(barrierSlider).toBeInTheDocument();
    expect(widthSlider).toBeInTheDocument();

    // Adjust Energy Slider to 4.0 eV
    fireEvent.change(energySlider, { target: { value: '4.0' } });
    expect(screen.getByText(/4\.00 eV/i)).toBeInTheDocument();

    // Adjust Barrier Height to 8.0 eV
    fireEvent.change(barrierSlider, { target: { value: '8.0' } });
    expect(screen.getByText(/8\.00 eV/i)).toBeInTheDocument();

    // Adjust Barrier Width to 2.5 Å
    fireEvent.change(widthSlider, { target: { value: '2.5' } });
    expect(screen.getByText(/2\.50 Å/i)).toBeInTheDocument();

    // Set Over-barrier Energy E = 9.0 eV > V0 = 8.0 eV
    fireEvent.change(energySlider, { target: { value: '9.0' } });
    expect(screen.getAllByText(/Resonant Transmission \(E > V0\)/i).length).toBeGreaterThanOrEqual(1);

    // Reset back to Manual p. 46 default preset
    const manualPresetBtn = screen.getByRole('button', { name: /Manual \(2eV, 6eV, 1\.5Å\)/i });
    fireEvent.click(manualPresetBtn);
    expect(screen.getAllByText(/Sub-barrier Tunneling \(E < V0\)/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/2\.00 eV/i)).toBeInTheDocument();

    // 4. Wavefunction Representation Component Toggles (Re, Im, Density)
    const imagBtn = screen.getByRole('button', { name: /Im\(ψ\)/i });
    fireEvent.click(imagBtn);
    expect(screen.getAllByText(/Im\(ψ\)/i).length).toBeGreaterThanOrEqual(1);

    const densityBtn = screen.getByRole('button', { name: /\|ψ\|² \(Probability Density\)/i });
    fireEvent.click(densityBtn);
    expect(screen.getAllByText(/\|ψ\|²/i).length).toBeGreaterThanOrEqual(1);

    const realBtn = screen.getByRole('button', { name: /Re\(ψ\) \[Manual\]/i });
    fireEvent.click(realBtn);

    // 5. Main Tab Switching: Analytical Curves
    // Tab 2: T vs E
    const tabTvE = screen.getByRole('button', { name: /^T vs Energy \(E\)$/i });
    fireEvent.click(tabTvE);
    expect(screen.getByText(/Transmission Probability T vs Particle Energy E/i)).toBeInTheDocument();

    // Tab 3: T vs a
    const tabTva = screen.getByRole('button', { name: /^T vs Width \(a\)$/i });
    fireEvent.click(tabTva);
    expect(screen.getByText(/Transmission Probability T vs Barrier Width a/i)).toBeInTheDocument();

    // Tab 4: ln(T) vs a
    const tabLnT = screen.getByRole('button', { name: /^ln\(T\) vs a$/i });
    fireEvent.click(tabLnT);
    expect(screen.getByText(/Logarithmic Transmission ln\(T\) vs Barrier Width a/i)).toBeInTheDocument();

    // Return to Wavefunction Tab
    const tabWave = screen.getByRole('button', { name: /Wavefunction & Barrier/i });
    fireEvent.click(tabWave);

    // 6. Observation Tables 1.1, 1.2, 2.1, 2.2 Navigation
    // Verify Table 1.1 active by default
    expect(screen.getByText(/Observation Table 1\.1: Square of Transmitted Amplitude as a Function of Energy/i)).toBeInTheDocument();

    // Switch to Table 1.2
    const table1_2Btn = screen.getByRole('button', { name: /Table 1\.2: T vs E/i });
    fireEvent.click(table1_2Btn);
    expect(screen.getByText(/Observation Table 1\.2: Square of Transmitted Amplitude as a Function of Energy/i)).toBeInTheDocument();

    // Switch to Table 2.1
    const table2_1Btn = screen.getByRole('button', { name: /Table 2\.1: T vs a/i });
    fireEvent.click(table2_1Btn);
    expect(screen.getByText(/Observation Table 2\.1: Transmission Probability T vs Barrier Width a/i)).toBeInTheDocument();

    // Switch to Table 2.2 (ln(T) column)
    const table2_2Btn = screen.getByRole('button', { name: /Table 2\.2: ln\(T\) vs a/i });
    fireEvent.click(table2_2Btn);
    expect(screen.getByText(/Observation Table 2\.2: Decay Analysis with Width a/i)).toBeInTheDocument();
    expect(screen.getAllByText(/log_e\(T\)/i).length).toBeGreaterThanOrEqual(1);

    // Test Populate All Tables button
    const populateTablesBtn = screen.getByRole('button', { name: /Populate All Tables/i });
    fireEvent.click(populateTablesBtn);

    // Test Export CSV button
    const exportCsvBtn = screen.getByRole('button', { name: /Export CSV/i });
    fireEvent.click(exportCsvBtn);
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // 7. Python Code (Jupyter / Local IDE) Panel
    const expandCodeBtn = screen.getByRole('button', { name: /Expand Code/i });
    fireEvent.click(expandCodeBtn);
    expect(screen.getByText(/Collapse Code/i)).toBeInTheDocument();

    // Test Copy Python button
    const copyBtn = screen.getByRole('button', { name: /Copy Python/i });
    fireEvent.click(copyBtn);
    expect(navigator.clipboard.writeText).toHaveBeenCalled();

    // Test Download .py
    const downloadPyBtn = screen.getByRole('button', { name: /\.py/i });
    fireEvent.click(downloadPyBtn);
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // Test Download .ipynb
    const downloadIpynbBtn = screen.getByRole('button', { name: /\.ipynb/i });
    fireEvent.click(downloadIpynbBtn);
    expect(mockCreateObjectURL).toHaveBeenCalled();

    // 8. Theory & Written Analysis Questions Drawer
    const theoryToggleBtn = screen.getByRole('button', { name: /Theory & Derivations/i });
    fireEvent.click(theoryToggleBtn);
    expect(screen.getByText(/Experiment 4 Mathematical Derivations/i)).toBeInTheDocument();
    expect(screen.getByText(/Time-Independent Schrödinger Equation/i)).toBeInTheDocument();
    expect(screen.getByText(/Closed-Form Transmission Coefficient T/i)).toBeInTheDocument();

    // Close theory drawer
    const closeTheoryBtn = screen.getByRole('button', { name: /Close/i });
    fireEvent.click(closeTheoryBtn);

    // 9. Guided Mode Progression
    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Step 2: Study Dependence on Particle Energy E/i)).toBeInTheDocument();

    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Step 3: Study Exponential Decay with Barrier Width a/i)).toBeInTheDocument();

    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Step 4: Inspect Python Notebook Parity/i)).toBeInTheDocument();

    const prevStepBtn = screen.getByRole('button', { name: /Prev/i });
    fireEvent.click(prevStepBtn);
    expect(screen.getByText(/Step 3: Study Exponential Decay with Barrier Width a/i)).toBeInTheDocument();

    // 10. Viva Voce modal trigger & Back button
    const vivaBtn = screen.getByRole('button', { name: /Viva Voce/i });
    fireEvent.click(vivaBtn);
    expect(handleViva).toHaveBeenCalled();

    const backBtn = screen.getByRole('button', { name: /Return to Dashboard/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});
