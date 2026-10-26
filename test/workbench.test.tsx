import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Instrument } from '../src/components/primitives/Instrument';
import { ParameterControl } from '../src/components/primitives/ParameterControl';
import { ObservationGrid } from '../src/components/primitives/ObservationGrid';
import { FormulaPanel } from '../src/components/primitives/FormulaPanel';

describe('Shared Workbench UI Primitives', () => {
  it('renders Instrument with LCD digital readout and units', () => {
    render(
      <Instrument
        type="voltmeter"
        title="Voltmeter"
        value={2.45}
        unit="V"
        range="0–20V DC"
      />
    );
    expect(screen.getByText('Voltmeter')).toBeInTheDocument();
    expect(screen.getByText('2.45')).toBeInTheDocument();
    expect(screen.getByText('V')).toBeInTheDocument();
    expect(screen.getByText('0–20V DC')).toBeInTheDocument();
  });

  it('renders ParameterControl with discrete buttons and steppers', () => {
    let currentVal = 1000;
    render(
      <ParameterControl
        label="Load Resistance"
        value={currentVal}
        min={100}
        max={10000}
        step={500}
        unit="Ω"
        onChange={(val) => { currentVal = val; }}
        discreteOptions={[
          { label: '100 Ω', value: 100 },
          { label: '1 kΩ', value: 1000 },
        ]}
      />
    );
    expect(screen.getByText('Load Resistance')).toBeInTheDocument();
    expect(screen.getByText('100 Ω')).toBeInTheDocument();
    expect(screen.getByText('1 kΩ')).toBeInTheDocument();
  });

  it('renders ObservationGrid with logged rows and columns', () => {
    const columns = [
      { key: 'voltage', label: 'Voltage', unit: 'V' },
      { key: 'current', label: 'Current', unit: 'mA' },
    ];
    const rows = [
      {
        id: 'r1',
        timestamp: 1000,
        values: {
          voltage: { value: 2.15, unit: 'V' },
          current: { value: 12.4, unit: 'mA' },
        },
      },
    ];

    render(
      <ObservationGrid
        title="I-V Characteristics"
        columns={columns}
        rows={rows}
      />
    );
    expect(screen.getByText(/I-V Characteristics/i)).toBeInTheDocument();
    expect(screen.getByText('2.15')).toBeInTheDocument();
    expect(screen.getByText('12.4')).toBeInTheDocument();
  });

  it('renders FormulaPanel with KaTeX equations without errors', () => {
    const formulas = [
      {
        title: 'Fill Factor',
        latex: 'FF = \\frac{P_{max}}{V_{oc} \\times I_{sc}}',
        explanation: 'Junction quality factor',
      },
    ];
    render(<FormulaPanel formulas={formulas} />);
    expect(screen.getByText('Fill Factor')).toBeInTheDocument();
    expect(screen.getByText('Junction quality factor')).toBeInTheDocument();
  });
});
