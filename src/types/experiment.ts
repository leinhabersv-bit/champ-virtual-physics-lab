export type LabCycle = 1 | 2;

export type ExperimentMode = 'guided' | 'independent' | 'viva';

export interface VivaQuestion {
  id: string;
  question: string;
  answerHint: string;
  sourcePage: number;
}

export interface ExperimentMetadata {
  id: string;
  number: number;
  cycle: LabCycle;
  title: string;
  shortTitle: string;
  aim: string;
  apparatus: string[];
  pdfPageRange: string;
  printedPageRange: string;
  formulaSummary: string;
  isDemoFunctional: boolean;
  statusBadge: 'Functional Demo' | 'Contract Scaffolded';
  tags: string[];
  vivaQuestions: VivaQuestion[];
  precautions?: string[];
  inconsistencies?: string[];
}
