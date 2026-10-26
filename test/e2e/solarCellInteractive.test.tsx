import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SolarCellWorkbench } from '../../src/components/workbenches/SolarCellWorkbench';
import { EXPERIMENTS_DATA } from '../../src/data/experiments';

describe('SolarCellWorkbench Interactive User Journey (Experiment 1)', () => {
  const metadata = EXPERIMENTS_DATA[0];

  it('demonstrates real user interaction, measurement generation, and table completion', () => {
    render(
      <SolarCellWorkbench
        metadata={metadata}
        onBackToDashboard={() => {}}
        onOpenViva={() => {}}
      />
    );

    // 1. Verify apparatus elements exist on bench
    expect(screen.getByText(/Physical Solar Cell Workbench/i)).toBeInTheDocument();
    expect(screen.getAllByText(/VOLTMETER/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/AMMETER/i).length).toBeGreaterThanOrEqual(1);

    // 2. Interact with Distance Presets
    const leastDistBtn = screen.getByRole('button', { name: /Least Dist \(12cm\)/i });
    fireEvent.click(leastDistBtn);
    expect(screen.getByText(/Distance: 12 cm/i)).toBeInTheDocument();

    // 3. Interact with Resistance Buttons
    const twoKBtn = screen.getByRole('button', { name: '2k' });
    fireEvent.click(twoKBtn);
    expect(screen.getByText(/Selected: 2 kΩ/i)).toBeInTheDocument();

    // 4. Test Step-by-Step Sample Calculations Drawer
    const calcToggleBtn = screen.getByRole('button', { name: /Step-by-Step Calc/i });
    fireEvent.click(calcToggleBtn);
    expect(screen.getByText(/Line-by-Line Sample Calculations:/i)).toBeInTheDocument();
    expect(screen.getByText(/1\. Power Calculation:/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Fill Factor/i).length).toBeGreaterThanOrEqual(1);

    // 5. Interact with Table Tabs
    const table2Tab = screen.getByRole('button', { name: /Table 2: Single \(Least Dist\)/i });
    fireEvent.click(table2Tab);
    expect(screen.getByText(/Table 2: Single Cell I-V Characteristics \(Least Distance\)/i)).toBeInTheDocument();

    // 6. Test Auto-Sweep 13 Rows
    const autoSweepBtn = screen.getByRole('button', { name: /Auto-Sweep 13 Rows/i });
    fireEvent.click(autoSweepBtn);

    // Verify all 13 rows exist in table
    const tableRows = screen.getAllByRole('row');
    // Header row + 13 data rows = 14 rows
    expect(tableRows.length).toBeGreaterThanOrEqual(14);

    // 7. Verify Results Summary Table Tab
    const resultsTab = screen.getByRole('button', { name: /Results Summary Table/i });
    fireEvent.click(resultsTab);
    expect(screen.getByText(/Master Results Summary/i)).toBeInTheDocument();
    expect(screen.getByText(/Solar cells in series/i)).toBeInTheDocument();
    expect(screen.getByText(/Solar cells in parallel/i)).toBeInTheDocument();
  });
});
