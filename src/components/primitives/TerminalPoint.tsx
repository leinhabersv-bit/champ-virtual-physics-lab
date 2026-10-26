import React from 'react';
import { Terminal } from '../../types/workbench';

interface TerminalPointProps {
  terminal: Terminal;
  isSelected?: boolean;
  isConnected?: boolean;
  onClick?: (terminal: Terminal) => void;
}

export const TerminalPoint: React.FC<TerminalPointProps> = ({
  terminal,
  isSelected = false,
  isConnected = false,
  onClick,
}) => {
  const isPositive = terminal.polarity === '+';
  const isNegative = terminal.polarity === '-';
  const fillColor = isPositive ? '#ef4444' : isNegative ? '#0f172a' : '#64748b';
  const strokeColor = isPositive ? '#f87171' : isNegative ? '#94a3b8' : '#cbd5e1';

  return (
    <g
      className="cursor-pointer group select-none transition-transform"
      transform={`translate(${terminal.x}, ${terminal.y})`}
      onClick={() => onClick?.(terminal)}
      role="button"
      tabIndex={0}
      aria-label={`${terminal.componentName} ${terminal.name} terminal, polarity ${terminal.polarity}, ${isConnected ? 'connected' : 'unconnected'}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.(terminal);
        }
      }}
    >
      {/* Target snap halo */}
      <circle
        r={isSelected ? 16 : 12}
        fill={isSelected ? 'rgba(99, 102, 241, 0.35)' : 'transparent'}
        stroke={isSelected ? '#818cf8' : 'transparent'}
        strokeWidth={2}
        className="transition-all group-hover:fill-indigo-500/20 group-hover:stroke-indigo-400"
      />

      {/* Terminal post base */}
      <circle r={8} fill="#1e293b" stroke="#475569" strokeWidth={1.5} />

      {/* Center conductive core */}
      <circle r={5} fill={fillColor} stroke={strokeColor} strokeWidth={1} />

      {/* Polarity indicator symbol */}
      {terminal.polarity !== 'neutral' && (
        <text
          y={-11}
          textAnchor="middle"
          fill={isPositive ? '#f87171' : '#94a3b8'}
          fontSize={10}
          fontWeight="bold"
          fontFamily="monospace"
        >
          {terminal.polarity}
        </text>
      )}

      {/* Label tooltip */}
      <text
        y={15}
        textAnchor="middle"
        fill="#94a3b8"
        fontSize={8}
        fontFamily="sans-serif"
        className="opacity-80 group-hover:opacity-100 font-medium"
      >
        {terminal.name}
      </text>
    </g>
  );
};
