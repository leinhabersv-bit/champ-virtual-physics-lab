/**
 * Typed Definitions for the Reusable Instructional & Guided Lab System
 * CHAMP Virtual Physics Lab — VIT Chennai BAPHY105
 */

export type InstructionalMode = 'beginner' | 'practice' | 'exam';

export interface StepValidationResult {
  isComplete: boolean;
  feedback?: string;
  details?: string;
  completedCriteria?: string[];
  missingCriteria?: string[];
}

export interface ShowMeCue {
  selector?: string;
  targetId?: string;
  elementLabel?: string;
  message: string;
  recommendedValue?: string | number;
}

export interface GuidedStep<TState = any> {
  id: string;
  number: number;
  title: string;
  shortTask: string;
  
  // 5 Mandatory Instructional Pillars
  what: string;       // WHAT to do (action)
  where: string;      // WHERE to click/connect/adjust (component/terminal/control location)
  why: string;        // WHY the action is necessary (physical/theoretical rationale)
  observe: string;    // WHAT the student should observe (readings/visual changes)
  mistakes: string;   // HOW to identify mistakes (pitfalls, short circuits, polarity errors)
  
  hint: string;       // Contextual hint (never auto-completes)
  
  // Linking with Apparatus & UI
  targetElementId?: string;       // UI control / terminal ID to highlight in workbench
  apparatusHighlightId?: string;  // Component ID in Setup Diagram to highlight
  configurationId?: string;       // Active apparatus configuration required for this step
  
  // Validation against real simulator state
  validate: (state: TState) => StepValidationResult;
  
  // Optional Step Actions
  resetAction?: () => void;
  showMeCue?: ShowMeCue;
}

export interface DiagramComponentItem {
  id: string;
  name: string;
  type: 'source' | 'meter' | 'passive' | 'optical' | 'detector' | 'quantum';
  description: string;
  specifications?: string;
  terminals?: Array<{
    id: string;
    name: string;
    polarity?: '+' | '-' | 'neutral';
    relativeX: number; // 0 to 100%
    relativeY: number; // 0 to 100%
  }>;
}

export interface ApparatusConfiguration {
  id: string;
  name: string;
  subtitle?: string;
  sourceManualFigure: string; // e.g. "Figure 1, p. 24"
  sourceManualPage: number | string;
  svgViewBox: string;
  components: DiagramComponentItem[];
  wiringNotes: string[];
  renderSvg: (highlightedId?: string, isZoomed?: boolean) => React.ReactNode;
}

export interface ExperimentProcedure<TState = any> {
  experimentId: string;
  experimentNumber: number;
  experimentTitle: string;
  sourcePages: string;
  rubric: {
    labPerformanceMarks: number;
    vivaMarks: number;
    totalMarks: number;
  };
  configurations: ApparatusConfiguration[];
  steps: GuidedStep<TState>[];
}

export interface InstructionalProgress {
  experimentId: string;
  mode: InstructionalMode;
  currentStepIndex: number;
  completedStepIds: string[];
  isDiagramPinned: boolean;
  activeConfigurationId: string;
  hintsUsedCount: number;
  lastUpdated: number;
}
