import React, { useMemo } from 'react';
import katex from 'katex';
import { FormulaDefinition } from '../../types/workbench';
import { BookOpen, AlertTriangle } from 'lucide-react';

interface FormulaPanelProps {
  formulas: FormulaDefinition[];
  substitutedLatex?: string;
  inconsistencyWarning?: string;
}

export const FormulaPanel: React.FC<FormulaPanelProps> = ({
  formulas,
  substitutedLatex,
  inconsistencyWarning,
}) => {
  const renderedFormulas = useMemo(() => {
    return formulas.map((f) => {
      try {
        const html = katex.renderToString(f.latex, {
          displayMode: true,
          throwOnError: false,
        });
        return { ...f, html };
      } catch (err) {
        return { ...f, html: `<span class="text-rose-400 font-mono">${f.latex}</span>` };
      }
    });
  }, [formulas]);

  const renderedSubstituted = useMemo(() => {
    if (!substitutedLatex) return null;
    try {
      return katex.renderToString(substitutedLatex, {
        displayMode: true,
        throwOnError: false,
      });
    } catch {
      return `<span class="text-rose-400 font-mono">${substitutedLatex}</span>`;
    }
  }, [substitutedLatex]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-3.5">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          Physical Equations &amp; Relations
        </h3>
        <span className="text-[10px] text-slate-400 font-mono">KaTeX Engine</span>
      </div>

      {inconsistencyWarning && (
        <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-semibold text-amber-200">Manual Note: </span>
            {inconsistencyWarning}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {renderedFormulas.map((f, i) => (
          <div key={i} className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-indigo-300 mb-1">{f.title}</div>
            <div
              className="overflow-x-auto py-1 text-slate-100"
              dangerouslySetInnerHTML={{ __html: f.html }}
            />
            <p className="text-[11px] text-slate-400 mt-1 leading-snug">{f.explanation}</p>
            {f.sourceNote && (
              <span className="inline-block mt-1 text-[10px] text-slate-500 font-mono">
                Source: {f.sourceNote}
              </span>
            )}
          </div>
        ))}

        {renderedSubstituted && (
          <div className="bg-indigo-950/20 border border-indigo-800/40 rounded-lg p-3">
            <div className="text-[11px] font-semibold text-indigo-400 mb-1">
              Live Evaluation with Active Parameters:
            </div>
            <div
              className="overflow-x-auto py-1 text-indigo-100"
              dangerouslySetInnerHTML={{ __html: renderedSubstituted }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
