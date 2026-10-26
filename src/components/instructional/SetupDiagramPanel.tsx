import React, { useState } from 'react';
import { ApparatusConfiguration } from '../../types/instructional';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Pin,
  PinOff,
  ChevronDown,
  ChevronUp,
  Maximize2,
  X,
  Layers,
  Info,
} from 'lucide-react';

export interface SetupDiagramPanelProps {
  configurations: ApparatusConfiguration[];
  activeConfigId?: string;
  onSelectConfig?: (configId: string) => void;
  highlightedElementId?: string;
  currentStepNumber?: number;
  isPinned?: boolean;
  onTogglePin?: (pinned: boolean) => void;
  defaultCollapsed?: boolean;
  className?: string;
}

export const SetupDiagramPanel: React.FC<SetupDiagramPanelProps> = ({
  configurations,
  activeConfigId,
  onSelectConfig,
  highlightedElementId,
  currentStepNumber,
  isPinned = false,
  onTogglePin,
  defaultCollapsed = false,
  className = '',
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(defaultCollapsed);
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>(
    activeConfigId || configurations[0]?.id || ''
  );

  const currentConfig =
    configurations.find((c) => c.id === (activeConfigId || activeTab)) ||
    configurations[0];

  const handleSelectTab = (id: string) => {
    setActiveTab(id);
    onSelectConfig?.(id);
  };

  const handleZoomIn = () => setZoomLevel((z) => Math.min(2.0, z + 0.2));
  const handleZoomOut = () => setZoomLevel((z) => Math.max(0.6, z - 0.2));
  const handleResetZoom = () => setZoomLevel(1.0);

  if (!currentConfig) return null;

  return (
    <section
      aria-label="Circuit Diagram and Apparatus Setup"
      className={`rounded-xl border border-slate-800 bg-slate-900/95 shadow-xl transition-all duration-200 ${
        isPinned ? 'ring-2 ring-indigo-500/50' : ''
      } ${className}`}
    >
      {/* Panel Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 px-4 py-3 bg-slate-950/50">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-950/80 text-indigo-400 border border-indigo-800/60">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Apparatus Setup &amp; Circuit Diagram
            </h3>
            <div className="text-[10px] font-mono text-slate-400">
              {currentConfig.sourceManualFigure} (Manual p. {currentConfig.sourceManualPage})
            </div>
          </div>
        </div>

        {/* Header Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* Multi-configuration tabs if more than 1 */}
          {configurations.length > 1 && (
            <div className="flex rounded-lg bg-slate-950 p-0.5 border border-slate-800 mr-1">
              {configurations.map((cfg) => (
                <button
                  key={cfg.id}
                  type="button"
                  onClick={() => handleSelectTab(cfg.id)}
                  aria-pressed={cfg.id === currentConfig.id}
                  className={`px-2.5 py-1 text-[11px] font-medium rounded-md transition-colors ${
                    cfg.id === currentConfig.id
                      ? 'bg-indigo-600 text-white font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {cfg.name}
                </button>
              ))}
            </div>
          )}

          {/* Desktop Pin Button */}
          {onTogglePin && (
            <button
              type="button"
              onClick={() => onTogglePin(!isPinned)}
              title={isPinned ? 'Unpin diagram' : 'Pin diagram beside simulator'}
              aria-label={isPinned ? 'Unpin diagram' : 'Pin diagram'}
              className={`p-1.5 rounded-lg border text-xs transition-colors hidden md:flex items-center gap-1 ${
                isPinned
                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-700'
                  : 'bg-slate-800/80 text-slate-400 border-slate-700 hover:text-slate-200'
              }`}
            >
              {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
              <span className="text-[10px] font-mono">{isPinned ? 'Pinned' : 'Pin'}</span>
            </button>
          )}

          {/* Maximize Fullscreen Modal Button */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            title="Expand diagram modal"
            aria-label="Expand diagram modal"
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Collapse / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-expanded={!isCollapsed}
            aria-label={isCollapsed ? 'Expand diagram panel' : 'Collapse diagram panel'}
            className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
          >
            {isCollapsed ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Collapsible Panel Body */}
      {!isCollapsed && (
        <div className="p-4 space-y-3">
          {/* Diagram Toolbar: Zoom and Current Step Highlight */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Step Highlight Alert */}
            {currentStepNumber && (
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/60 border border-indigo-800/60 text-indigo-300 text-[11px] font-mono">
                <span className="inline-block w-2 h-2 rounded-full bg-indigo-400 animate-ping mr-0.5" />
                Step {currentStepNumber} Active Focus
              </div>
            )}

            {/* Zoom Controls */}
            <div className="flex items-center gap-1 ml-auto bg-slate-950 rounded-lg p-0.5 border border-slate-800">
              <button
                type="button"
                onClick={handleZoomOut}
                title="Zoom out"
                aria-label="Zoom out"
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <span className="text-[10px] font-mono text-slate-300 px-1.5 min-w-[3rem] text-center">
                {Math.round(zoomLevel * 100)}%
              </span>
              <button
                type="button"
                onClick={handleZoomIn}
                title="Zoom in"
                aria-label="Zoom in"
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleResetZoom}
                title="Reset zoom"
                aria-label="Reset zoom"
                className="p-1 text-slate-400 hover:text-slate-200 border-l border-slate-800 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SVG Diagram Canvas */}
          <div className="relative overflow-hidden rounded-lg bg-slate-950 border border-slate-800/80 min-h-[200px] flex items-center justify-center p-2">
            <div
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: 'transform 0.15s ease-out',
                width: '100%',
                maxHeight: '320px',
              }}
              className="flex items-center justify-center"
            >
              {currentConfig.renderSvg(highlightedElementId, zoomLevel > 1.0)}
            </div>
          </div>

          {/* Wiring Notes & Key Connections */}
          {currentConfig.wiringNotes && currentConfig.wiringNotes.length > 0 && (
            <div className="rounded-lg bg-slate-950/60 p-3 border border-slate-800 text-[11px] space-y-1.5">
              <div className="font-semibold text-slate-300 flex items-center gap-1.5 text-xs">
                <Info className="w-3.5 h-3.5 text-sky-400" />
                Connection Protocol (per manual):
              </div>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-1 text-slate-400">
                {currentConfig.wiringNotes.map((note, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 font-mono text-[10px]">
                    <span className="text-indigo-400 font-bold">•</span>
                    <span>{note}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Expanded Modal View for Detailed Examination */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Expanded Apparatus Setup Diagram"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in"
        >
          <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950">
              <div>
                <h2 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-400" />
                  {currentConfig.name} — Detailed Blueprint
                </h2>
                <p className="text-xs text-slate-400 font-mono">
                  {currentConfig.sourceManualFigure} (Manual p. {currentConfig.sourceManualPage})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                aria-label="Close expanded diagram modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 p-6 overflow-auto flex items-center justify-center bg-slate-950">
              <div className="w-full max-w-2xl">
                {currentConfig.renderSvg(highlightedElementId, true)}
              </div>
            </div>

            {/* Component Inventory in Modal */}
            <div className="p-4 border-t border-slate-800 bg-slate-900/90 text-xs">
              <div className="font-semibold text-slate-300 mb-2">Identified Apparatus Components:</div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {currentConfig.components.map((comp) => (
                  <div
                    key={comp.id}
                    className={`p-2 rounded-lg border text-[11px] ${
                      highlightedElementId === comp.id
                        ? 'bg-indigo-950 border-indigo-500 text-indigo-200 ring-1 ring-indigo-400'
                        : 'bg-slate-950 border-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="font-bold">{comp.name}</div>
                    <div className="text-[10px] text-slate-400">{comp.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
