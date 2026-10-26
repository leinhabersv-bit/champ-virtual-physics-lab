import React, { useState } from 'react';
import { TrendingUp } from 'lucide-react';

export interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

export interface GraphSeries {
  id: string;
  name: string;
  points: DataPoint[];
  color: string;
  unitY: string;
  isSecondaryY?: boolean;
}

interface LabGraphProps {
  title: string;
  series: GraphSeries[];
  xLabel: string;
  xUnit: string;
  yLabel: string;
  secondaryYLabel?: string;
  highlightPoint?: { x: number; y: number; label: string; color?: string };
  aspectRatio?: number;
}

export const LabGraph: React.FC<LabGraphProps> = ({
  title,
  series,
  xLabel,
  xUnit,
  yLabel,
  secondaryYLabel,
  highlightPoint,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<{ x: number; y: number; seriesName: string } | null>(null);

  // SVG dimensions & margins
  const width = 640;
  const height = 360;
  const margin = { top: 30, right: secondaryYLabel ? 65 : 30, bottom: 50, left: 60 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  // Calculate domain bounds
  const allPoints = series.flatMap((s) => s.points);
  const primaryPoints = series.filter((s) => !s.isSecondaryY).flatMap((s) => s.points);
  const secondaryPoints = series.filter((s) => s.isSecondaryY).flatMap((s) => s.points);

  const xMin = allPoints.length > 0 ? Math.min(0, Math.min(...allPoints.map((p) => p.x))) : 0;
  const xMax = allPoints.length > 0 ? Math.max(1, Math.max(...allPoints.map((p) => p.x)) * 1.05) : 10;

  const y1Min = primaryPoints.length > 0 ? Math.min(0, Math.min(...primaryPoints.map((p) => p.y))) : 0;
  const y1Max = primaryPoints.length > 0 ? Math.max(1, Math.max(...primaryPoints.map((p) => p.y)) * 1.08) : 10;

  const y2Min = secondaryPoints.length > 0 ? Math.min(0, Math.min(...secondaryPoints.map((p) => p.y))) : 0;
  const y2Max = secondaryPoints.length > 0 ? Math.max(1, Math.max(...secondaryPoints.map((p) => p.y)) * 1.08) : 10;

  const scaleX = (x: number) => margin.left + ((x - xMin) / (xMax - xMin || 1)) * plotWidth;
  const scaleY1 = (y: number) => margin.top + plotHeight - ((y - y1Min) / (y1Max - y1Min || 1)) * plotHeight;
  const scaleY2 = (y: number) => margin.top + plotHeight - ((y - y2Min) / (y2Max - y2Min || 1)) * plotHeight;

  // Generate SVG path for a series
  const generatePath = (s: GraphSeries) => {
    if (s.points.length === 0) return '';
    return s.points
      .map((p, idx) => {
        const px = scaleX(p.x);
        const py = s.isSecondaryY ? scaleY2(p.y) : scaleY1(p.y);
        return `${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`;
      })
      .join(' ');
  };

  // 5 grid ticks
  const xTicks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => xMin + f * (xMax - xMin));
  const y1Ticks = [0, 0.25, 0.5, 0.75, 1.0].map((f) => y1Min + f * (y1Max - y1Min));
  const y2Ticks = secondaryYLabel ? [0, 0.25, 0.5, 0.75, 1.0].map((f) => y2Min + f * (y2Max - y2Min)) : [];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-lg space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
        <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          {title}
        </h3>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          {series.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
              <span className="text-slate-300 font-medium">{s.name}</span>
            </div>
          ))}
          {highlightPoint && (
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-amber-300 font-medium">{highlightPoint.label}</span>
            </div>
          )}
        </div>
      </div>

      {/* Responsive SVG Graphic */}
      <div className="relative w-full aspect-[16/9] bg-slate-950/90 rounded-lg border border-slate-800/80 overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full"
          role="img"
          aria-label={`${title} chart`}
        >
          {/* Horizontal grid lines */}
          {y1Ticks.map((val, idx) => {
            const yPos = scaleY1(val);
            return (
              <g key={`ygrid-${idx}`}>
                <line
                  x1={margin.left}
                  y1={yPos}
                  x2={width - margin.right}
                  y2={yPos}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={margin.left - 8}
                  y={yPos + 3}
                  textAnchor="end"
                  fill="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {val.toFixed(val < 10 ? 2 : 1)}
                </text>
              </g>
            );
          })}

          {/* Secondary Y axis ticks */}
          {y2Ticks.map((val, idx) => {
            const yPos = scaleY2(val);
            return (
              <text
                key={`y2grid-${idx}`}
                x={width - margin.right + 8}
                y={yPos + 3}
                textAnchor="start"
                fill="#818cf8"
                fontSize={10}
                fontFamily="monospace"
              >
                {val.toFixed(val < 1 ? 3 : 1)}
              </text>
            );
          })}

          {/* Vertical grid lines & X ticks */}
          {xTicks.map((val, idx) => {
            const xPos = scaleX(val);
            return (
              <g key={`xgrid-${idx}`}>
                <line
                  x1={xPos}
                  y1={margin.top}
                  x2={xPos}
                  y2={height - margin.bottom}
                  stroke="#1e293b"
                  strokeDasharray="3 3"
                />
                <text
                  x={xPos}
                  y={height - margin.bottom + 16}
                  textAnchor="middle"
                  fill="#64748b"
                  fontSize={10}
                  fontFamily="monospace"
                >
                  {val.toFixed(val < 10 ? 2 : 1)}
                </text>
              </g>
            );
          })}

          {/* Axis Borders */}
          <line
            x1={margin.left}
            y1={height - margin.bottom}
            x2={width - margin.right}
            y2={height - margin.bottom}
            stroke="#475569"
            strokeWidth={1.5}
          />
          <line
            x1={margin.left}
            y1={margin.top}
            x2={margin.left}
            y2={height - margin.bottom}
            stroke="#475569"
            strokeWidth={1.5}
          />
          {secondaryYLabel && (
            <line
              x1={width - margin.right}
              y1={margin.top}
              x2={width - margin.right}
              y2={height - margin.bottom}
              stroke="#6366f1"
              strokeWidth={1}
            />
          )}

          {/* Series Curves */}
          {series.map((s) => (
            <g key={s.id}>
              <path
                d={generatePath(s)}
                fill="none"
                stroke={s.color}
                strokeWidth={2.5}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {/* Data points */}
              {s.points.map((pt, pIdx) => {
                const cx = scaleX(pt.x);
                const cy = s.isSecondaryY ? scaleY2(pt.y) : scaleY1(pt.y);
                return (
                  <circle
                    key={pIdx}
                    cx={cx}
                    cy={cy}
                    r={3}
                    fill={s.color}
                    className="hover:r-5 cursor-pointer transition-all"
                    onMouseEnter={() =>
                      setHoveredPoint({ x: pt.x, y: pt.y, seriesName: `${s.name} (${s.unitY})` })
                    }
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                );
              })}
            </g>
          ))}

          {/* Highlight special point */}
          {highlightPoint && (
            <g>
              <circle
                cx={scaleX(highlightPoint.x)}
                cy={scaleY1(highlightPoint.y)}
                r={6}
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth={2}
                className="animate-pulse"
              />
              <line
                x1={scaleX(highlightPoint.x)}
                y1={scaleY1(highlightPoint.y)}
                x2={scaleX(highlightPoint.x)}
                y2={height - margin.bottom}
                stroke="#f59e0b"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              <line
                x1={margin.left}
                y1={scaleY1(highlightPoint.y)}
                x2={scaleX(highlightPoint.x)}
                y2={scaleY1(highlightPoint.y)}
                stroke="#f59e0b"
                strokeDasharray="2 2"
                strokeWidth={1}
              />
              <text
                x={scaleX(highlightPoint.x) + 8}
                y={scaleY1(highlightPoint.y) - 8}
                fill="#fcd34d"
                fontSize={10}
                fontWeight="bold"
                fontFamily="sans-serif"
              >
                {highlightPoint.label}
              </text>
            </g>
          )}

          {/* Axis Labels */}
          <text
            x={margin.left + plotWidth / 2}
            y={height - 12}
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {xLabel} ({xUnit})
          </text>
          <text
            x={-(margin.top + plotHeight / 2)}
            y={18}
            transform="rotate(-90)"
            textAnchor="middle"
            fill="#94a3b8"
            fontSize={11}
            fontWeight="bold"
            fontFamily="sans-serif"
          >
            {yLabel}
          </text>
          {secondaryYLabel && (
            <text
              x={margin.top + plotHeight / 2}
              y={-(width - 15)}
              transform="rotate(90)"
              textAnchor="middle"
              fill="#818cf8"
              fontSize={11}
              fontWeight="bold"
              fontFamily="sans-serif"
            >
              {secondaryYLabel}
            </text>
          )}
        </svg>

        {/* Hover Tooltip Overlay */}
        {hoveredPoint && (
          <div className="absolute top-3 left-16 bg-slate-900/95 border border-indigo-500/50 text-slate-100 text-[11px] font-mono px-2.5 py-1.5 rounded shadow-xl pointer-events-none">
            <span className="text-indigo-300 font-semibold">{hoveredPoint.seriesName}:</span>{' '}
            X = {hoveredPoint.x} {xUnit}, Y = {hoveredPoint.y}
          </div>
        )}
      </div>
    </div>
  );
};
