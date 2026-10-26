import React from 'react';
import { ObservationColumn, ObservationRow } from '../../types/workbench';
import { Download, Trash2, PlusCircle, Printer } from 'lucide-react';

interface ObservationGridProps {
  title: string;
  columns: ObservationColumn[];
  rows: ObservationRow[];
  onAddCurrentReading?: () => void;
  onRemoveRow?: (rowId: string) => void;
  onClearAll?: () => void;
  tableSubtitle?: string;
}

export const ObservationGrid: React.FC<ObservationGridProps> = ({
  title,
  columns,
  rows,
  onAddCurrentReading,
  onRemoveRow,
  onClearAll,
  tableSubtitle,
}) => {
  const exportCSV = () => {
    if (rows.length === 0) return;
    const header = ['Sl.No', ...columns.map((c) => `${c.label} (${c.unit ?? ''})`)].join(',');
    const csvRows = rows.map((r, idx) => {
      const rowVals = [
        idx + 1,
        ...columns.map((col) => r.values[col.key]?.value ?? ''),
      ];
      return rowVals.join(',');
    });
    const blob = new Blob([[header, ...csvRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_observations.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl shadow-lg p-4 space-y-3 lab-card">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <div>
          <h3 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-2">
            {title}
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-950/70 border border-indigo-800 text-indigo-300 font-mono">
              {rows.length} {rows.length === 1 ? 'Reading' : 'Readings'}
            </span>
          </h3>
          {tableSubtitle && (
            <p className="text-xs text-slate-400 mt-0.5">{tableSubtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-1.5 no-print">
          {onAddCurrentReading && (
            <button
              type="button"
              onClick={onAddCurrentReading}
              className="px-2.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              Log Current Reading
            </button>
          )}

          <button
            type="button"
            onClick={exportCSV}
            disabled={rows.length === 0}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs flex items-center gap-1"
            title="Export CSV"
            aria-label="Export CSV"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1"
            title="Print Table"
            aria-label="Print Table"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>

          {onClearAll && (
            <button
              type="button"
              onClick={onClearAll}
              disabled={rows.length === 0}
              className="p-1.5 rounded-lg bg-rose-950/40 hover:bg-rose-900/60 border border-rose-900/40 text-rose-300 disabled:opacity-40 disabled:cursor-not-allowed text-xs"
              title="Clear All Readings"
              aria-label="Clear All Readings"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Observation Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-800 max-h-72">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-950/80 border-b border-slate-800 font-semibold text-slate-400 font-mono">
              <th className="p-2 w-12 text-center">Sl.</th>
              {columns.map((c) => (
                <th key={c.key} className="p-2 whitespace-nowrap">
                  {c.label} {c.unit ? <span className="text-slate-500">({c.unit})</span> : ''}
                </th>
              ))}
              <th className="p-2 w-10 text-center no-print"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 2}
                  className="p-6 text-center text-slate-500 font-sans text-xs"
                >
                  No readings logged yet. Configure apparatus parameters and click &ldquo;Log Current Reading&rdquo;.
                </td>
              </tr>
            ) : (
              rows.map((r, idx) => (
                <tr
                  key={r.id}
                  className="hover:bg-slate-800/40 transition-colors text-slate-200"
                >
                  <td className="p-2 text-center text-slate-400 font-medium">
                    {idx + 1}
                  </td>
                  {columns.map((col) => {
                    const cell = r.values[col.key];
                    const val = cell?.value;
                    const formatted =
                      typeof val === 'number'
                        ? col.precision !== undefined
                          ? val.toFixed(col.precision)
                          : val
                        : val ?? '—';
                    return (
                      <td
                        key={col.key}
                        className={`p-2 whitespace-nowrap ${
                          col.isCalculated ? 'text-indigo-300 font-semibold' : ''
                        }`}
                      >
                        {formatted}
                      </td>
                    );
                  })}
                  <td className="p-2 text-center no-print">
                    {onRemoveRow && (
                      <button
                        type="button"
                        onClick={() => onRemoveRow(r.id)}
                        className="text-slate-500 hover:text-rose-400 transition-colors"
                        title="Delete reading"
                        aria-label={`Delete reading ${idx + 1}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
