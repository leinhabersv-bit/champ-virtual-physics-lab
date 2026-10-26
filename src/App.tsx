import { useState, useEffect } from 'react';
import { EXPERIMENTS_DATA } from './data/experiments';
import { Dashboard } from './components/dashboard/Dashboard';
import { SolarCellWorkbench } from './components/workbenches/SolarCellWorkbench';
import { ScaffoldedWorkbench } from './components/workbenches/ScaffoldedWorkbench';
import { VivaModal } from './components/dashboard/VivaModal';
import { Atom, Wifi, WifiOff } from 'lucide-react';

export function App() {
  const [activeExptId, setActiveExptId] = useState<string | null>(null);
  const [vivaModalExptId, setVivaModalExptId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);

  // Persistent progress state in localStorage
  const [vivaScores, setVivaScores] = useState<Record<string, number>>(() => {
    try {
      const saved = localStorage.getItem('champ_vlab_viva_scores');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const [completedExptIds] = useState<string[]>(['expt-1-solar-cell']);

  // Network offline listener for PWA resilience
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSaveVivaScore = (exptId: string, score: number) => {
    setVivaScores(prev => {
      const updated = { ...prev, [exptId]: score };
      try {
        localStorage.setItem('champ_vlab_viva_scores', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return updated;
    });
  };

  const activeExperiment = EXPERIMENTS_DATA.find(e => e.id === activeExptId);
  const vivaExperiment = EXPERIMENTS_DATA.find(e => e.id === vivaModalExptId);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80 no-print">
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
            {/* Offline Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium border ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-900/50'
                  : 'bg-amber-950/60 text-amber-300 border-amber-800'
              }`}
            >
              {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
              <span>{isOnline ? 'PWA Ready' : 'Offline Mode'}</span>
            </div>

            {activeExptId && (
              <button
                type="button"
                onClick={() => setActiveExptId(null)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
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
            completedExptIds={completedExptIds}
            vivaScores={vivaScores}
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
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 px-4 text-center text-xs text-slate-500 font-mono no-print">
        CHAMP Lab Manual (Engineering Physics BAPHY105) • School of Advanced Sciences (SAS) &amp; SCOPE • VIT Chennai
      </footer>
    </div>
  );
}

export default App;
