import React from 'react';
import { Terminal, WireConnection } from '../../types/workbench';

interface DraggableWireProps {
  wire: WireConnection;
  fromTerminal: Terminal;
  toTerminal: Terminal;
  onRemove?: (wireId: string) => void;
}

export const DraggableWire: React.FC<DraggableWireProps> = ({
  wire,
  fromTerminal,
  toTerminal,
  onRemove,
}) => {
  const x1 = fromTerminal.x;
  const y1 = fromTerminal.y;
  const x2 = toTerminal.x;
  const y2 = toTerminal.y;

  // Natural catenary curve simulation using cubic bezier
  const dx = x2 - x1;
  const dy = y2 - y1;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const sag = Math.min(80, Math.max(30, dist * 0.25));

  const cx1 = x1 + dx * 0.25;
  const cy1 = y1 + dy * 0.25 + sag;
  const cx2 = x1 + dx * 0.75;
  const cy2 = y1 + dy * 0.75 + sag;

  const pathData = `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`;

  return (
    <g
      className="group cursor-pointer select-none"
      onClick={() => onRemove?.(wire.id)}
      role="button"
      tabIndex={0}
      aria-label={`Wire connecting ${fromTerminal.componentName} to ${toTerminal.componentName}, click to disconnect`}
      onKeyDown={(e) => {
        if (e.key === 'Backspace' || e.key === 'Delete') {
          onRemove?.(wire.id);
        }
      }}
    >
      {/* Generous invisible hit region for clicking */}
      <path
        d={pathData}
        fill="none"
        stroke="transparent"
        strokeWidth={16}
        className="transition-colors group-hover:stroke-white/10"
      />

      {/* Wire outer insulation shadow */}
      <path
        d={pathData}
        fill="none"
        stroke="rgba(0,0,0,0.4)"
        strokeWidth={4.5}
        strokeLinecap="round"
      />

      {/* Core colored conductor */}
      <path
        d={pathData}
        fill="none"
        stroke={wire.color}
        strokeWidth={3}
        strokeLinecap="round"
        className="transition-all group-hover:stroke-amber-400 group-hover:stroke-[4]"
      />

      {/* Terminal end connectors */}
      <circle cx={x1} cy={y1} r={3} fill="#cbd5e1" />
      <circle cx={x2} cy={y2} r={3} fill="#cbd5e1" />
    </g>
  );
};
