export interface Terminal {
  id: string;
  name: string;
  polarity: '+' | '-' | 'neutral';
  color: string;
  x: number; // SVG viewBox coordinates
  y: number;
  componentId: string;
  componentName: string;
}

export interface WireConnection {
  id: string;
  fromTerminalId: string;
  toTerminalId: string;
  color: string;
}

export interface ObservationCell {
  value: number | string | null;
  unit?: string;
  isAutoCalculated?: boolean;
}

export interface ObservationRow {
  id: string;
  timestamp: number;
  values: Record<string, ObservationCell>;
}

export interface ObservationColumn {
  key: string;
  label: string;
  unit?: string;
  isCalculated?: boolean;
  precision?: number;
}

export interface FormulaDefinition {
  title: string;
  latex: string;
  explanation: string;
  sourceNote?: string;
}

export interface StepInstruction {
  stepNumber: number;
  instruction: string;
  targetComponent?: string;
  targetTerminals?: [string, string];
  completionCheck?: string;
}
