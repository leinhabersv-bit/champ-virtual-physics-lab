import React, { useState } from 'react';
import { ExperimentMetadata } from '../../types/experiment';
import { Award, CheckCircle, HelpCircle, X, Eye, EyeOff } from 'lucide-react';

interface VivaModalProps {
  metadata: ExperimentMetadata;
  isOpen: boolean;
  onClose: () => void;
  onScoreSaved?: (scoreOutOf3: number) => void;
}

export const VivaModal: React.FC<VivaModalProps> = ({
  metadata,
  isOpen,
  onClose,
  onScoreSaved,
}) => {
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({});
  const [selfScore, setSelfScore] = useState<number>(3);
  const [submitted, setSubmitted] = useState<boolean>(false);

  if (!isOpen) return null;

  const toggleHint = (id: string) => {
    setRevealedHints(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveScore = () => {
    onScoreSaved?.(selfScore);
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                Laboratory Evaluation • 3 Viva Marks
              </span>
              <h2 className="text-base font-bold text-slate-100">
                Viva Voce: Experiment {metadata.number} ({metadata.shortTitle})
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200"
            aria-label="Close Viva Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800">
          As per VIT Chennai regulations (Manual p. 4 regulation 9), each lab session carries <strong>10 total marks</strong> (7 for laboratory procedure &amp; calculations + 3 for oral viva evaluation). Review each question below and assess your understanding.
        </div>

        {/* Questions list */}
        <div className="space-y-3">
          {metadata.vivaQuestions.map((q, idx) => {
            const isRevealed = !!revealedHints[q.id];
            return (
              <div
                key={q.id}
                className="bg-slate-950/90 border border-slate-800 rounded-xl p-3.5 space-y-2 transition-all hover:border-slate-700"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <span className="w-5 h-5 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                      Q{idx + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      {q.question}
                    </p>
                  </div>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 whitespace-nowrap">
                    Manual p. {q.sourcePage}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => toggleHint(q.id)}
                    className="text-[11px] font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
                  >
                    {isRevealed ? (
                      <>
                        <EyeOff className="w-3.5 h-3.5" /> Hide Expected Concept
                      </>
                    ) : (
                      <>
                        <Eye className="w-3.5 h-3.5" /> Reveal Expected Concept
                      </>
                    )}
                  </button>
                </div>

                {isRevealed && (
                  <div className="p-2.5 rounded-lg bg-indigo-950/30 border border-indigo-800/50 text-[11px] text-indigo-200 leading-relaxed animate-fadeIn">
                    <span className="font-semibold text-indigo-300">Faculty Evaluation Criteria: </span>
                    {q.answerHint}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Self Assessment Score Input */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-1">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              Self-Assessed Score:
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((score) => (
                <button
                  key={score}
                  type="button"
                  onClick={() => setSelfScore(score)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs font-mono transition-all ${
                    selfScore === score
                      ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {score}/3
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSaveScore}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              submitted
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md'
            }`}
          >
            <CheckCircle className="w-3.5 h-3.5" />
            {submitted ? 'Recorded!' : 'Record Viva Evaluation'}
          </button>
        </div>
      </div>
    </div>
  );
};
