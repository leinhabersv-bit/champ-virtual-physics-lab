import { useState, useEffect } from 'react';
import { EXPERIMENTS_DATA } from './data/experiments';
import { Dashboard } from './components/dashboard/Dashboard';
import { SolarCellWorkbench } from './components/workbenches/SolarCellWorkbench';
import { MercurySpectrometerWorkbench } from './components/workbenches/MercurySpectrometerWorkbench';
import { LedPlanckWorkbench } from './components/workbenches/LedPlanckWorkbench';
import { QuantumTunnelingWorkbench } from './components/workbenches/QuantumTunnelingWorkbench';
import { SodiumSpectrometerWorkbench } from './components/workbenches/SodiumSpectrometerWorkbench';
import { PhotodiodeWorkbench } from './components/workbenches/PhotodiodeWorkbench';
import { ElectronDiffractionWorkbench } from './components/workbenches/ElectronDiffractionWorkbench';
import { HeisenbergWorkbench } from './components/workbenches/HeisenbergWorkbench';
import { QuantumWorkbench } from './components/workbenches/QuantumWorkbench';
import { ScaffoldedWorkbench } from './components/workbenches/ScaffoldedWorkbench';
import { VivaModal } from './components/dashboard/VivaModal';
import { Atom, Wifi, WifiOff, Globe, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  loadStudentProgress,
  subscribeToStudentProgress,
  recordVivaScore,
  StudentProgressState,
} from './services/studentProgress';
import {
  getPwaStatus,
  subscribePwaStatus,
  PwaStatusState,
} from './services/pwaStatus';

export function App() {
  const [activeExptId, setActiveExptId] = useState<string | null>(null);
  const [vivaModalExptId, setVivaModalExptId] = useState<string | null>(null);

  // Truthful student progress state
  const [progressState, setProgressState] = useState<StudentProgressState>(() => loadStudentProgress());

  // Truthful PWA and offline connectivity state
  const [pwaStatus, setPwaStatus] = useState<PwaStatusState>(() => getPwaStatus());

  // Subscribe to real student progress changes
  useEffect(() => {
    return subscribeToStudentProgress((latest) => {
      setProgressState(latest);
    });
  }, []);

  // Subscribe to real PWA & offline status changes
  useEffect(() => {
    return subscribePwaStatus((latest) => {
      setPwaStatus(latest);
    });
  }, []);

  const handleSaveVivaScore = (exptId: string, score: number) => {
    recordVivaScore(exptId, score);
  };

  const activeExperiment = EXPERIMENTS_DATA.find((e) => e.id === activeExptId);
  const vivaExperiment = EXPERIMENTS_DATA.find((e) => e.id === vivaModalExptId);

  // Badge styling depending on truthful PWA readiness level
  const getBadgeStyle = (level: PwaStatusState['level']) => {
    switch (level) {
      case 'pwa_active':
        return {
          classes: 'bg-emerald-950/60 text-emerald-300 border-emerald-700/60',
          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />,
        };
      case 'pwa_installed':
        return {
          classes: 'bg-teal-950/60 text-teal-300 border-teal-700/60',
          icon: <Wifi className="w-3.5 h-3.5 text-teal-400" />,
        };
      case 'web_online':
        return {
          classes: 'bg-cyan-950/50 text-cyan-300 border-cyan-800/60',
          icon: <Globe className="w-3.5 h-3.5 text-cyan-400" />,
        };
      case 'offline_ready':
        return {
          classes: 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60',
          icon: <WifiOff className="w-3.5 h-3.5 text-indigo-400" />,
        };
      case 'offline_limited':
      default:
        return {
          classes: 'bg-amber-950/70 text-amber-300 border-amber-800',
          icon: <AlertCircle className="w-3.5 h-3.5 text-amber-400" />,
        };
    }
  };

  const badgeConfig = getBadgeStyle(pwaStatus.level);

  return (
    <div className="min-h-screen bg-[#0c1322] text-slate-100 flex flex-col">
      {/* Top Navigation Bar with Manus Dark Navy Header */}
      <header className="sticky top-0 z-40 bg-[#0c1322]/85 backdrop-blur-md border-b border-slate-800/80 no-print">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setActiveExptId(null)}
            className="flex items-center gap-2.5 text-left group focus:outline-none"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/30 group-hover:bg-indigo-500 transition-colors">
              <Atom className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100 tracking-tight group-hover:text-indigo-300 transition-colors">
                CHAMP Virtual Physics Lab
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                VIT Chennai • BAPHY105
              </div>
            </div>
          </button>

          <div className="flex items-center gap-3">
            {/* Truthful Offline / PWA Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border transition-all ${badgeConfig.classes}`}
              title={pwaStatus.tooltipText}
            >
              {badgeConfig.icon}
              <span>{pwaStatus.statusLabel}</span>
            </div>

            {activeExptId && (
              <button
                type="button"
                onClick={() => setActiveExptId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors border border-slate-700"
              >
                Dashboard
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main View Router */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {activeExperiment ? (
          activeExperiment.id === 'expt-1-solar-cell' ? (
            <SolarCellWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-2-mercury-grating' ? (
            <MercurySpectrometerWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-3-led-planck' ? (
            <LedPlanckWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-4-quantum-tunneling' ? (
            <QuantumTunnelingWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-5-sodium-grating' ? (
            <SodiumSpectrometerWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-6-photodiode' ? (
            <PhotodiodeWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-7-electron-diffraction' ? (
            <ElectronDiffractionWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-8-heisenberg-slit' ? (
            <HeisenbergWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : activeExperiment.id === 'expt-9-quantum-computing' ? (
            <QuantumWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          ) : (
            <ScaffoldedWorkbench
              metadata={activeExperiment}
              onBackToDashboard={() => setActiveExptId(null)}
              onOpenViva={() => setVivaModalExptId(activeExperiment.id)}
            />
          )
        ) : (
          <Dashboard
            onSelectExperiment={(id) => setActiveExptId(id)}
            onOpenViva={(id) => setVivaModalExptId(id)}
            completedExptIds={progressState.completedExperimentIds}
            vivaScores={progressState.vivaScores}
          />
        )}
      </main>

      {/* Viva Voce Assessment Modal */}
      {vivaExperiment && (
        <VivaModal
          metadata={vivaExperiment}
          isOpen={true}
          onClose={() => setVivaModalExptId(null)}
          onScoreSaved={(score) => handleSaveVivaScore(vivaExperiment.id, score)}
        />
      )}

      {/* Standard Laboratory Footer */}
      <footer className="border-t border-slate-900 bg-[#080d18] py-4 px-4 text-center text-xs text-slate-500 font-mono no-print">
        CHAMP Lab Manual (Engineering Physics BAPHY105) • School of Advanced Sciences (SAS) &amp; SCOPE • VIT Chennai
      </footer>
    </div>
  );
}

export default App;
