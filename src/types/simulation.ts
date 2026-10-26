export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ISimulationEngine<TParams, TReadings, TDerived> {
  readonly experimentId: string;
  readonly defaultParams: TParams;
  validateParams(params: TParams): ValidationResult;
  calculateReadings(params: TParams): TReadings;
  computeDerived(readings: TReadings, params: TParams): TDerived;
  generateModelCurve?(params: TParams, sampleCount?: number): Array<{ x: number; y: number; label?: string }>;
}
