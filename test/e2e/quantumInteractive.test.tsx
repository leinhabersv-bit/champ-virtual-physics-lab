import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QuantumWorkbench } from '../../src/components/workbenches/QuantumWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('QuantumWorkbench Interactive User Journey (Experiment 9)', () => {
  const expt9Metadata = EXPERIMENTS_DATA.find((e) => e.id === 'expt-9-quantum-computing')!;

  it('renders workbench, tests two-qubit circuit, Bell state entanglement, single-qubit Bloch sphere, observation tables, and python script export', () => {
    const handleBack = vi.fn();
    const handleViva = vi.fn();

    render(
      <QuantumWorkbench
        metadata={expt9Metadata}
        onBackToDashboard={handleBack}
        onOpenViva={handleViva}
      />
    );

    // 1. Initial State & Instruments Verification
    expect(screen.getByText(/Experiment 9: Qubit States & Quantum Gates/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Two-Qubit Circuit & Entanglement/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Interactive Two-Qubit Circuit/i)).toBeInTheDocument();
    expect(screen.getByText(/q₀:/i)).toBeInTheDocument();
    expect(screen.getByText(/q₁:/i)).toBeInTheDocument();

    // 2. Test Quick Circuit Recipe for Bell State |Φ+⟩
    const bellBtn = screen.getByRole('button', { name: /Bell State \|Φ\+⟩ \(H \+ CNOT\)/i });
    fireEvent.click(bellBtn);

    // Verify Output state shows Bell State and Entangled badge
    expect(screen.getAllByText(/ENTANGLED STATE/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Concurrence C = 1\.0000/i)).toBeInTheDocument();

    // 3. Test 1024 Measurement Shots Simulation
    const runShotsBtn = screen.getByRole('button', { name: /Run 1024 Shots/i });
    fireEvent.click(runShotsBtn);
    expect(screen.getByText(/Measurement Simulation \(1024 Shots\)/i)).toBeInTheDocument();

    // 4. Test Basis Convention Toggle
    const basisToggle = screen.getByRole('button', { name: /Textbook \|q₀ q₁⟩/i });
    fireEvent.click(basisToggle);
    expect(screen.getByText(/Qiskit \|q₁ q₀⟩/i)).toBeInTheDocument();
    // Toggle back
    fireEvent.click(screen.getByRole('button', { name: /Qiskit \|q₁ q₀⟩/i }));
    expect(screen.getByText(/Textbook \|q₀ q₁⟩/i)).toBeInTheDocument();

    // 5. Switch to Single Qubit & Bloch Sphere Tab
    const singleQubitTab = screen.getByRole('button', { name: /Single Qubit & Bloch Sphere/i });
    fireEvent.click(singleQubitTab);
    expect(screen.getByText(/Bloch Sphere Vector Visualizer/i)).toBeInTheDocument();
    expect(screen.getByText(/\+z \|0⟩/i)).toBeInTheDocument();
    expect(screen.getByText(/-z \|1⟩/i)).toBeInTheDocument();

    // Click Cardinal Preset |+⟩ (+X)
    const plusPresetBtn = screen.getByRole('button', { name: /\|\+⟩ \(\+X\)/i });
    fireEvent.click(plusPresetBtn);
    expect(screen.getByText(/r_x:/i)).toBeInTheDocument();

    // Test Gate Buttons: Apply X Gate
    const xGateBtn = screen.getByRole('button', { name: /X Gate/i });
    fireEvent.click(xGateBtn);
    const hGateBtn = screen.getByRole('button', { name: /H Gate/i });
    fireEvent.click(hGateBtn);

    // 6. Switch to Observation Tables Tab
    const tablesTab = screen.getByRole('button', { name: /Observation Tables \(1–5\)/i });
    fireEvent.click(tablesTab);
    expect(screen.getByText(/Table 5: CNOT & SWAP Benchmark/i)).toBeInTheDocument();
    expect(screen.getByText(/Benchmark evaluation of CNOT and SWAP gates across 10 benchmark states/i)).toBeInTheDocument();

    // Switch between table sub-tabs
    const table4Btn = screen.getByRole('button', { name: /Table 4: Two-Qubit Parameters/i });
    fireEvent.click(table4Btn);
    expect(screen.getByText(/Table 4: Two-Qubit Parameters \(p\. 81\)/i)).toBeInTheDocument();

    const table1Btn = screen.getByRole('button', { name: /Table 1: Bloch Sphere/i });
    fireEvent.click(table1Btn);
    expect(screen.getByText(/Spherical angles \(θ, ϕ\) and normalized state vector/i)).toBeInTheDocument();

    const table2Btn = screen.getByRole('button', { name: /Table 2: X, Y, Z Gates/i });
    fireEvent.click(table2Btn);
    expect(screen.getByText(/Effect of Pauli-X, Y, and Z gates on state vectors/i)).toBeInTheDocument();

    const table3Btn = screen.getByRole('button', { name: /Table 3: Hadamard Gate/i });
    fireEvent.click(table3Btn);
    expect(screen.getByText(/Hadamard gate transformations mapping cardinal states/i)).toBeInTheDocument();

    // 7. Switch to Qiskit Python Simulation Tab
    const pythonTab = screen.getByRole('button', { name: /Qiskit Python Simulation/i });
    fireEvent.click(pythonTab);
    expect(screen.getByText(/Python 3 \/ Qiskit 1\.x Verification Script/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Copy Python Code/i })).toBeInTheDocument();

    // 8. Test Ambiguities Modal (AMB-08 and AMB-09)
    const ambBtn = screen.getByRole('button', { name: /Source Ambiguities \(AMB-08\/09\)/i });
    fireEvent.click(ambBtn);
    expect(screen.getAllByText(/AMB-08/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/AMB-09/i).length).toBeGreaterThanOrEqual(1);
    const closeAmbBtn = screen.getByRole('button', { name: /Understood & Close/i });
    fireEvent.click(closeAmbBtn);

    // 9. Test Theory & Questions Modal
    const theoryBtn = screen.getByRole('button', { name: /Theory & Questions/i });
    fireEvent.click(theoryBtn);
    expect(screen.getByText(/Theory & Manual Discussion Questions/i)).toBeInTheDocument();
    const closeTheoryBtn = screen.getByRole('button', { name: /Close Reference/i });
    fireEvent.click(closeTheoryBtn);

    // 10. Test Guided Step Progression
    const nextStepBtn = screen.getByRole('button', { name: /Next Step/i });
    fireEvent.click(nextStepBtn);
    expect(screen.getByText(/Guided Step 2 of 5/i)).toBeInTheDocument();

    // 11. Navigation Callbacks
    const vivaBtn = screen.getByRole('button', { name: /Viva Voce/i });
    fireEvent.click(vivaBtn);
    expect(handleViva).toHaveBeenCalled();

    const backBtn = screen.getByRole('button', { name: /Back to Dashboard/i });
    fireEvent.click(backBtn);
    expect(handleBack).toHaveBeenCalled();
  });
});
