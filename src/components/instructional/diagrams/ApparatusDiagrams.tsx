import React from 'react';

interface DiagramRenderProps {
  highlightedId?: string;
  isZoomed?: boolean;
}

export const SolarCellSingleDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>
      <rect width="500" height="320" fill="transparent" />
      <rect width="500" height="320" fill="url(#grid-pattern)" />

      {/* Main Circuit Loop Wires */}
      <path
        d="M 120 160 L 120 70 L 220 70"
        fill="none"
        stroke={isHigh('wire-series') ? '#f59e0b' : '#64748b'}
        strokeWidth={isHigh('wire-series') ? 3.5 : 2}
        strokeDasharray={isHigh('wire-series') ? '6 3' : 'none'}
      />
      <path
        d="M 280 70 L 380 70 L 380 120"
        fill="none"
        stroke={isHigh('wire-series') ? '#f59e0b' : '#64748b'}
        strokeWidth={isHigh('wire-series') ? 3.5 : 2}
      />
      <path
        d="M 380 200 L 380 250 L 120 250 L 120 190"
        fill="none"
        stroke={isHigh('wire-return') ? '#f59e0b' : '#64748b'}
        strokeWidth={isHigh('wire-return') ? 3.5 : 2}
      />

      {/* Parallel Voltmeter Wires */}
      <path
        d="M 340 70 L 340 160 L 320 160"
        fill="none"
        stroke={isHigh('wire-voltmeter') ? '#38bdf8' : '#475569'}
        strokeWidth={isHigh('wire-voltmeter') ? 3 : 1.5}
        strokeDasharray="4 2"
      />
      <path
        d="M 320 180 L 340 180 L 340 250"
        fill="none"
        stroke={isHigh('wire-voltmeter') ? '#38bdf8' : '#475569'}
        strokeWidth={isHigh('wire-voltmeter') ? 3 : 1.5}
        strokeDasharray="4 2"
      />

      {/* Light Source / Lamp */}
      <g id="component-lamp" className={isHigh('component-lamp') ? 'animate-pulse' : ''}>
        <circle cx="50" cy="175" r="28" fill="#fef08a" fillOpacity="0.15" stroke="#eab308" strokeWidth="2" />
        <circle cx="50" cy="175" r="14" fill="#fde047" fillOpacity="0.8" stroke="#ca8a04" strokeWidth="1.5" />
        <text x="50" y="140" textAnchor="middle" className="text-[11px] font-bold fill-amber-300">5W Lamp</text>
        {/* Light rays */}
        <line x1="80" y1="170" x2="105" y2="170" stroke="#facc15" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow)" />
        <line x1="80" y1="160" x2="105" y2="155" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
        <line x1="80" y1="180" x2="105" y2="185" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3 3" markerEnd="url(#arrow)" />
      </g>

      {/* Solar Cell */}
      <g id="component-solar-cell">
        <rect
          x="105"
          y="150"
          width="30"
          height="50"
          rx="4"
          fill={isHigh('component-solar-cell') ? '#1e293b' : '#0f172a'}
          stroke={isHigh('component-solar-cell') ? '#38bdf8' : '#334155'}
          strokeWidth={isHigh('component-solar-cell') ? 3 : 2}
        />
        {/* Cell Grid Lines */}
        <line x1="112" y1="150" x2="112" y2="200" stroke="#38bdf8" strokeWidth="1" />
        <line x1="120" y1="150" x2="120" y2="200" stroke="#38bdf8" strokeWidth="1" />
        <line x1="128" y1="150" x2="128" y2="200" stroke="#38bdf8" strokeWidth="1" />
        {/* Terminal dots */}
        <circle cx="120" cy="150" r="4" fill="#ef4444" />
        <circle cx="120" cy="200" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="120" y="142" textAnchor="middle" className="text-[10px] font-bold fill-rose-400">+</text>
        <text x="120" y="214" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">-</text>
        <text x="120" y="230" textAnchor="middle" className="text-[11px] font-semibold fill-slate-200">Solar Cell</text>
      </g>

      {/* Series Milliammeter (mA) */}
      <g id="component-ammeter">
        <circle
          cx="250"
          cy="70"
          r="24"
          fill={isHigh('component-ammeter') ? '#1e1b4b' : '#0f172a'}
          stroke={isHigh('component-ammeter') ? '#818cf8' : '#475569'}
          strokeWidth={isHigh('component-ammeter') ? 3 : 2}
        />
        <text x="250" y="75" textAnchor="middle" className="text-[14px] font-mono font-bold fill-indigo-300">mA</text>
        {/* Terminals */}
        <circle cx="226" cy="70" r="3.5" fill="#ef4444" />
        <circle cx="274" cy="70" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="218" y="65" textAnchor="middle" className="text-[9px] font-bold fill-rose-400">+</text>
        <text x="282" y="65" textAnchor="middle" className="text-[9px] font-bold fill-slate-300">-</text>
        <text x="250" y="38" textAnchor="middle" className="text-[11px] font-semibold fill-slate-200">Milliammeter (Series)</text>
      </g>

      {/* Parallel Voltmeter (V) */}
      <g id="component-voltmeter">
        <circle
          cx="295"
          cy="170"
          r="22"
          fill={isHigh('component-voltmeter') ? '#0c4a6e' : '#0f172a'}
          stroke={isHigh('component-voltmeter') ? '#38bdf8' : '#475569'}
          strokeWidth={isHigh('component-voltmeter') ? 3 : 2}
        />
        <text x="295" y="175" textAnchor="middle" className="text-[14px] font-mono font-bold fill-sky-300">V</text>
        {/* Terminals */}
        <circle cx="295" cy="148" r="3.5" fill="#ef4444" />
        <circle cx="295" cy="192" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="284" y="152" textAnchor="middle" className="text-[9px] font-bold fill-rose-400">+</text>
        <text x="284" y="196" textAnchor="middle" className="text-[9px] font-bold fill-slate-300">-</text>
        <text x="295" y="210" textAnchor="middle" className="text-[11px] font-semibold fill-slate-200">Voltmeter (Parallel)</text>
      </g>

      {/* Variable Load Resistor (RL) */}
      <g id="component-load">
        <rect
          x="365"
          y="120"
          width="30"
          height="80"
          rx="4"
          fill={isHigh('component-load') ? '#312e81' : '#0f172a'}
          stroke={isHigh('component-load') ? '#a855f7' : '#64748b'}
          strokeWidth={isHigh('component-load') ? 3 : 2}
        />
        {/* Resistor Zig-Zag */}
        <path d="M 380 130 L 372 140 L 388 150 L 372 160 L 388 170 L 372 180 L 380 190" fill="none" stroke="#e2e8f0" strokeWidth="2" />
        {/* Arrow for variable resistance */}
        <line x1="355" y1="185" x2="405" y2="135" stroke="#a855f7" strokeWidth="2" markerEnd="url(#arrow)" />
        <text x="420" y="165" className="text-[12px] font-bold font-mono fill-purple-300">R_L</text>
        <text x="380" y="220" textAnchor="middle" className="text-[11px] font-semibold fill-slate-200">Decade Box</text>
        <text x="380" y="235" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">0.1 – 10 kΩ</text>
      </g>

      {/* Manual Figure Watermark / Caption */}
      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual Page 24, Figure 1 — Single Solar Cell Circuit
      </text>
    </svg>
  );
};

export const SolarCellArrayDiagram: React.FC<DiagramRenderProps & { mode: 'series' | 'parallel' }> = ({
  highlightedId,
  mode,
}) => {
  const isHigh = (id: string) => highlightedId === id;
  const isSeries = mode === 'series';

  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern-array" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="500" height="320" fill="url(#grid-pattern-array)" />

      <text x="250" y="30" textAnchor="middle" className="text-[13px] font-bold fill-amber-300">
        {isSeries ? 'Figure 3 (p. 26): 3 Solar Cells in Series' : 'Figure 4 (p. 27): 3 Solar Cells in Parallel'}
      </text>

      {/* 3 Solar Cells */}
      {[0, 1, 2].map((idx) => {
        const xOffset = isSeries ? 60 + idx * 80 : 120;
        const yOffset = isSeries ? 120 : 70 + idx * 60;
        return (
          <g key={idx} id={`cell-${idx + 1}`}>
            <rect
              x={xOffset}
              y={yOffset}
              width={isSeries ? 45 : 60}
              height={isSeries ? 65 : 40}
              rx="4"
              fill={isHigh(`cell-${idx + 1}`) ? '#1e293b' : '#0f172a'}
              stroke="#38bdf8"
              strokeWidth="2"
            />
            <text
              x={xOffset + (isSeries ? 22 : 30)}
              y={yOffset + (isSeries ? 35 : 24)}
              textAnchor="middle"
              className="text-[10px] font-mono font-bold fill-sky-200"
            >
              SC{idx + 1}
            </text>
          </g>
        );
      })}

      {/* Load & Meter Box */}
      <rect x="360" y="100" width="80" height="110" rx="6" fill="#0f172a" stroke="#64748b" strokeWidth="2" strokeDasharray="4 2" />
      <text x="400" y="125" textAnchor="middle" className="text-[11px] font-bold fill-purple-300">Decade Box</text>
      <text x="400" y="145" textAnchor="middle" className="text-[10px] font-mono fill-slate-300">R_L (0.1-10k)</text>
      <text x="400" y="175" textAnchor="middle" className="text-[11px] font-bold fill-indigo-300">mA Meter</text>
      <text x="400" y="195" textAnchor="middle" className="text-[11px] font-bold fill-sky-300">V Meter</text>

      {/* Wiring Representation */}
      {isSeries ? (
        <g stroke="#f59e0b" strokeWidth="2.5" fill="none">
          <line x1="105" y1="152" x2="140" y2="152" />
          <line x1="185" y1="152" x2="220" y2="152" />
          <path d="M 265 152 L 360 152" />
          <path d="M 60 152 L 40 152 L 40 250 L 400 250 L 400 210" />
          <text x="250" y="280" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300">
            Total Voltage V_total = V1 + V2 + V3 | Current I_total ≈ I1
          </text>
        </g>
      ) : (
        <g stroke="#38bdf8" strokeWidth="2.5" fill="none">
          <path d="M 180 90 L 230 90 L 230 150 L 360 150" />
          <path d="M 180 150 L 230 150" />
          <path d="M 180 210 L 230 210 L 230 150" />
          <path d="M 120 90 L 80 90 L 80 250 L 400 250 L 400 210" />
          <line x1="120" y1="150" x2="80" y2="150" />
          <line x1="120" y1="210" x2="80" y2="210" />
          <text x="250" y="280" textAnchor="middle" className="text-[11px] font-mono fill-emerald-300">
            Total Current I_total = I1 + I2 + I3 | Voltage V_total ≈ V1
          </text>
        </g>
      )}

      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 26–27 — Multi-Cell Topology
      </text>
    </svg>
  );
};

export const SpectrometerNormalIncidenceDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-spec" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <marker id="ray-arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>
      <rect width="500" height="320" fill="url(#grid-spec)" />

      {/* Circular Spectrometer Disc */}
      <circle cx="250" cy="160" r="95" fill="#0f172a" stroke="#475569" strokeWidth="2.5" />
      <circle cx="250" cy="160" r="90" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
      <circle cx="250" cy="160" r="40" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />

      {/* Collimator (Left) */}
      <g id="collimator" className={isHigh('collimator') ? 'animate-pulse' : ''}>
        <rect x="50" y="148" width="100" height="24" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="50" cy="160" r="16" fill="#0284c7" fillOpacity="0.4" stroke="#0ea5e9" strokeWidth="1.5" />
        <text x="100" y="140" textAnchor="middle" className="text-[11px] font-bold fill-sky-300">Collimator</text>
        <text x="45" y="164" textAnchor="middle" className="text-[9px] font-mono fill-sky-100">Hg</text>
      </g>

      {/* Incident Central Beam */}
      <line x1="150" y1="160" x2="250" y2="160" stroke="#38bdf8" strokeWidth="2.5" markerEnd="url(#ray-arrow)" />

      {/* Transmission Grating at Center */}
      <g id="grating" className={isHigh('grating') ? 'animate-pulse' : ''}>
        <line x1="250" y1="125" x2="250" y2="195" stroke="#f59e0b" strokeWidth="4" />
        <rect x="247" y="125" width="6" height="70" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="2 2" />
        <text x="250" y="115" textAnchor="middle" className="text-[11px] font-bold fill-amber-300">Grating (15000 LPI)</text>
      </g>

      {/* Dual Verniers V1 and V2 */}
      <g id="vernier-v1">
        <circle cx="250" cy="65" r="14" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
        <text x="250" y="69" textAnchor="middle" className="text-[11px] font-mono font-bold fill-indigo-300">V1</text>
      </g>
      <g id="vernier-v2">
        <circle cx="250" cy="255" r="14" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
        <text x="250" y="259" textAnchor="middle" className="text-[11px] font-mono font-bold fill-indigo-300">V2</text>
        <text x="250" y="280" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">180° Offset</text>
      </g>

      {/* Diffracted Beams (Left and Right Orders) */}
      <line x1="250" y1="160" x2="380" y2="110" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
      <line x1="250" y1="160" x2="380" y2="210" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
      <text x="400" y="105" className="text-[10px] font-bold fill-emerald-400">Left (a) Order</text>
      <text x="400" y="215" className="text-[10px] font-bold fill-emerald-400">Right (b) Order</text>

      {/* Rotating Telescope Arm */}
      <g id="telescope" className={isHigh('telescope') ? 'animate-pulse' : ''}>
        <line x1="250" y1="160" x2="410" y2="160" stroke="#94a3b8" strokeWidth="3" />
        <rect x="360" y="148" width="60" height="24" rx="3" fill="#1e293b" stroke="#e2e8f0" strokeWidth="2" />
        <text x="390" y="140" textAnchor="middle" className="text-[11px] font-bold fill-slate-200">Telescope</text>
      </g>

      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 33–36 — Spectrometer Normal Incidence Setup
      </text>
    </svg>
  );
};

export const LedPlanckCircuitDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-led" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="500" height="320" fill="url(#grid-led)" />

      {/* 3V DC Power Supply */}
      <g id="component-supply" className={isHigh('component-supply') ? 'animate-pulse' : ''}>
        <rect x="40" y="120" width="60" height="80" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth={isHigh('component-supply') ? 3 : 2} />
        <text x="70" y="155" textAnchor="middle" className="text-[11px] font-bold fill-rose-300">3V DC</text>
        <circle cx="90" cy="140" r="3.5" fill="#ef4444" />
        <circle cx="90" cy="180" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="100" y="144" className="text-[10px] font-bold fill-rose-400">+</text>
        <text x="100" y="184" className="text-[10px] font-bold fill-slate-300">-</text>
      </g>

      {/* Potentiometer */}
      <g id="component-pot" className={isHigh('component-pot') ? 'animate-pulse' : ''}>
        <rect x="150" y="110" width="40" height="100" rx="4" fill="#1e293b" stroke="#f59e0b" strokeWidth={isHigh('component-pot') ? 3 : 2} />
        <text x="170" y="100" textAnchor="middle" className="text-[11px] font-bold fill-amber-300">Potentiometer</text>
        <path d="M 170 120 L 170 200" stroke="#e2e8f0" strokeWidth="2" strokeDasharray="3 3" />
        <polygon points="190,160 210,155 210,165" fill="#f59e0b" />
      </g>

      {/* Limiting Resistor (10-100 Ohm) */}
      <g id="component-resistor" className={isHigh('component-resistor') ? 'animate-pulse' : ''}>
        <rect x="230" y="145" width="40" height="30" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth={isHigh('component-resistor') ? 3 : 2} />
        <text x="250" y="138" textAnchor="middle" className="text-[10px] font-bold fill-purple-300">Limiter</text>
        <text x="250" y="165" textAnchor="middle" className="text-[9px] font-mono fill-purple-200">47 Ω</text>
      </g>

      {/* Series Microammeter */}
      <g id="component-ammeter" className={isHigh('component-ammeter') ? 'animate-pulse' : ''}>
        <circle cx="320" cy="160" r="22" fill="#0f172a" stroke="#818cf8" strokeWidth={isHigh('component-ammeter') ? 3 : 2} />
        <text x="320" y="165" textAnchor="middle" className="text-[12px] font-mono font-bold fill-indigo-300">µA</text>
        <text x="320" y="130" textAnchor="middle" className="text-[11px] font-bold fill-indigo-200">Ammeter (Series)</text>
      </g>

      {/* LED */}
      <g id="component-led" className={isHigh('component-led') ? 'animate-pulse' : ''}>
        <circle cx="410" cy="160" r="20" fill="#0f172a" stroke="#22c55e" strokeWidth={isHigh('component-led') ? 3.5 : 2.5} />
        <polygon points="402,150 418,160 402,170" fill="#22c55e" />
        <line x1="418" y1="150" x2="418" y2="170" stroke="#22c55e" strokeWidth="2" />
        <text x="410" y="130" textAnchor="middle" className="text-[11px] font-bold fill-emerald-300">LED</text>
        <text x="410" y="195" textAnchor="middle" className="text-[9px] font-mono fill-emerald-200">R, G, Y, B</text>
      </g>

      {/* Parallel Voltmeter */}
      <g id="component-voltmeter" className={isHigh('component-voltmeter') ? 'animate-pulse' : ''}>
        <circle cx="410" cy="245" r="20" fill="#0f172a" stroke="#38bdf8" strokeWidth={isHigh('component-voltmeter') ? 3 : 2} />
        <text x="410" y="250" textAnchor="middle" className="text-[12px] font-mono font-bold fill-sky-300">V</text>
        <path d="M 390 160 L 375 160 L 375 245 L 390 245" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
        <path d="M 430 160 L 445 160 L 445 245 L 430 245" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
        <text x="410" y="280" textAnchor="middle" className="text-[11px] font-bold fill-sky-200">Voltmeter (Parallel)</text>
      </g>

      {/* Connections */}
      <path
        id="wire-supply-pos"
        d="M 90 140 L 150 140"
        fill="none"
        stroke={isHigh('wire-supply-pos') || isHigh('wire-1') ? '#f59e0b' : '#ef4444'}
        strokeWidth={isHigh('wire-supply-pos') || isHigh('wire-1') ? 3.5 : 2}
      />
      <path
        id="wire-supply-neg"
        d="M 90 180 L 150 180"
        fill="none"
        stroke={isHigh('wire-supply-neg') || isHigh('wire-3') ? '#f59e0b' : '#3b82f6'}
        strokeWidth={isHigh('wire-supply-neg') || isHigh('wire-3') ? 3.5 : 2}
      />
      <path
        id="wire-wiper"
        d="M 210 160 L 230 160"
        fill="none"
        stroke={isHigh('wire-wiper') || isHigh('wire-2') ? '#f59e0b' : '#f59e0b'}
        strokeWidth={isHigh('wire-wiper') || isHigh('wire-2') ? 3.5 : 2}
      />
      <path
        id="wire-resistor"
        d="M 270 160 L 298 160"
        fill="none"
        stroke={isHigh('wire-resistor') || isHigh('wire-4') ? '#f59e0b' : '#f59e0b'}
        strokeWidth={isHigh('wire-resistor') || isHigh('wire-4') ? 3.5 : 2}
      />
      <path
        id="wire-ammeter"
        d="M 342 160 L 390 160"
        fill="none"
        stroke={isHigh('wire-ammeter') || isHigh('wire-5') ? '#f59e0b' : '#818cf8'}
        strokeWidth={isHigh('wire-ammeter') || isHigh('wire-5') ? 3.5 : 2}
      />
      <path
        id="wire-led-ground"
        d="M 430 160 L 470 160 L 470 290 L 170 290 L 170 210"
        fill="none"
        stroke={isHigh('wire-led-ground') || isHigh('wire-6') ? '#f59e0b' : '#3b82f6'}
        strokeWidth={isHigh('wire-led-ground') || isHigh('wire-6') ? 3.5 : 2}
      />
      {/* Voltmeter taps */}
      <path
        id="wire-voltmeter-pos"
        d="M 390 160 L 375 160 L 375 245 L 390 245"
        fill="none"
        stroke={isHigh('wire-voltmeter') || isHigh('wire-7') ? '#f59e0b' : '#38bdf8'}
        strokeWidth={isHigh('wire-voltmeter') || isHigh('wire-7') ? 3 : 1.5}
        strokeDasharray="3 3"
      />
      <path
        id="wire-voltmeter-neg"
        d="M 430 160 L 445 160 L 445 245 L 430 245"
        fill="none"
        stroke={isHigh('wire-voltmeter') || isHigh('wire-8') ? '#f59e0b' : '#38bdf8'}
        strokeWidth={isHigh('wire-voltmeter') || isHigh('wire-8') ? 3 : 1.5}
        strokeDasharray="3 3"
      />

      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual p. 40, Figure 2 — Planck's Constant LED Circuit
      </text>
    </svg>
  );
};

export const QuantumTunnelingBarrierDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="barrier-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#ef4444" strokeWidth="2" strokeOpacity="0.4" />
        </pattern>
      </defs>

      {/* Potential Energy Profile V(x) */}
      <rect
        x="200"
        y="70"
        width="100"
        height="150"
        fill="url(#barrier-hatch)"
        stroke={isHigh('region-2') ? '#fbbf24' : '#ef4444'}
        strokeWidth={isHigh('region-2') ? 3.5 : 2.5}
      />
      <line x1="50" y1="220" x2="200" y2="220" stroke="#64748b" strokeWidth="2" />
      <line x1="300" y1="220" x2="450" y2="220" stroke="#64748b" strokeWidth="2" />

      {/* Axis & Boundaries */}
      <line x1="200" y1="220" x2="200" y2="245" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
      <line x1="300" y1="220" x2="300" y2="245" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
      <text x="200" y="260" textAnchor="middle" className="text-[11px] font-mono fill-slate-300">x = 0</text>
      <text x="300" y="260" textAnchor="middle" className="text-[11px] font-mono fill-slate-300">x = a</text>
      <text x="250" y="55" textAnchor="middle" className="text-[13px] font-bold fill-rose-400">Barrier Height V0</text>
      <text x="250" y="200" textAnchor="middle" className="text-[11px] font-mono fill-rose-200">Width a</text>

      {/* Particle Energy Level E */}
      <line x1="50" y1="140" x2="450" y2="140" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 2" />
      <text x="70" y="132" className="text-[11px] font-bold fill-sky-300">Energy E (E &lt; V0)</text>

      {/* Spatial Regions */}
      <text x="125" y="90" textAnchor="middle" className={`text-[12px] font-bold ${isHigh('region-1') ? 'fill-sky-300 font-extrabold' : 'fill-slate-200'}`}>REGION I</text>
      <text x="125" y="106" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">x &lt; 0 (V=0)</text>
      <text x="250" y="90" textAnchor="middle" className={`text-[12px] font-bold ${isHigh('region-2') ? 'fill-amber-300 font-extrabold' : 'fill-rose-300'}`}>REGION II</text>
      <text x="250" y="106" textAnchor="middle" className="text-[10px] font-mono fill-rose-200">0 ≤ x ≤ a (V=V0)</text>
      <text x="375" y="90" textAnchor="middle" className={`text-[12px] font-bold ${isHigh('region-3') ? 'fill-emerald-300 font-extrabold' : 'fill-slate-200'}`}>REGION III</text>
      <text x="375" y="106" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">x &gt; a (V=0)</text>

      {/* Wavefunction Sketch */}
      <path
        d="M 50 140 Q 80 115 110 140 T 170 140 T 200 140 Q 235 155 265 170 T 300 178 Q 330 162 360 178 T 420 178 T 450 178"
        fill="none"
        stroke="#22c55e"
        strokeWidth="2.5"
      />
      <text x="140" y="180" textAnchor="middle" className="text-[10px] font-bold fill-emerald-400">e^(ik1 x) + r·e^(-ik1 x)</text>
      <text x="250" y="160" textAnchor="middle" className="text-[10px] font-bold fill-amber-300">A·e^(-κx) + B·e^(κx)</text>
      <text x="380" y="200" textAnchor="middle" className="text-[10px] font-bold fill-emerald-400">t·e^(ik1 x)</text>

      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual p. 46, Image 176 — Finite Rectangular Barrier
      </text>
    </svg>
  );
};

export const SolarCellApplianceDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pattern-appliance" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <marker id="arrow-app" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
        </marker>
      </defs>
      <rect width="500" height="320" fill="url(#grid-pattern-appliance)" />

      {/* Title */}
      <text x="250" y="30" textAnchor="middle" className="text-[13px] font-bold fill-amber-300">
        Procedure B: Solar Cell Driving Practical Appliance (LED / DC Motor)
      </text>

      {/* 5W Lamp */}
      <g id="component-lamp" className={isHigh('component-lamp') ? 'animate-pulse' : ''}>
        <circle cx="50" cy="165" r="24" fill="#fef08a" fillOpacity="0.2" stroke="#eab308" strokeWidth="2" />
        <circle cx="50" cy="165" r="12" fill="#fde047" fillOpacity="0.8" stroke="#ca8a04" strokeWidth="1.5" />
        <text x="50" y="132" textAnchor="middle" className="text-[10px] font-bold fill-amber-300">5W Lamp</text>
        <line x1="75" y1="165" x2="105" y2="165" stroke="#facc15" strokeWidth="2" strokeDasharray="3 3" markerEnd="url(#arrow-app)" />
      </g>

      {/* Solar Panel */}
      <g id="component-solar-cell" className={isHigh('component-solar-cell') ? 'animate-pulse' : ''}>
        <rect x="110" y="135" width="40" height="60" rx="4" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <line x1="120" y1="135" x2="120" y2="195" stroke="#38bdf8" strokeWidth="1" />
        <line x1="130" y1="135" x2="130" y2="195" stroke="#38bdf8" strokeWidth="1" />
        <line x1="140" y1="135" x2="140" y2="195" stroke="#38bdf8" strokeWidth="1" />
        <circle cx="130" cy="135" r="4" fill="#ef4444" />
        <circle cx="130" cy="195" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="130" y="125" textAnchor="middle" className="text-[10px] font-bold fill-rose-400">+</text>
        <text x="130" y="210" textAnchor="middle" className="text-[10px] font-bold fill-slate-300">-</text>
        <text x="130" y="225" textAnchor="middle" className="text-[11px] font-semibold fill-slate-200">Solar Array</text>
      </g>

      {/* 220 Ω Limiting Resistor */}
      <g id="component-resistor" className={isHigh('component-resistor') ? 'animate-pulse' : ''}>
        <rect x="205" y="145" width="80" height="30" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth="2" />
        <text x="245" y="164" textAnchor="middle" className="text-[10px] font-bold fill-purple-300">220 Ω Limiter</text>
      </g>

      {/* Appliance: LED / Motor */}
      <g id="component-appliance" className={isHigh('component-appliance') ? 'animate-pulse' : ''}>
        <circle cx="370" cy="160" r="28" fill="#0f172a" stroke="#22c55e" strokeWidth="2.5" />
        <polygon points="360,150 380,160 360,170" fill="#22c55e" />
        <line x1="380" y1="150" x2="380" y2="170" stroke="#22c55e" strokeWidth="2" />
        <circle cx="370" cy="160" r="34" fill="none" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 3" />
        <text x="370" y="120" textAnchor="middle" className="text-[11px] font-bold fill-emerald-300">LED / DC Motor</text>
        <text x="370" y="205" textAnchor="middle" className="text-[9px] font-mono fill-emerald-200">Appliance Load</text>
      </g>

      {/* Parallel Voltmeter across Appliance */}
      <g id="component-voltmeter" className={isHigh('component-voltmeter') ? 'animate-pulse' : ''}>
        <circle cx="370" cy="255" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
        <text x="370" y="260" textAnchor="middle" className="text-[13px] font-mono font-bold fill-sky-300">V</text>
        <text x="370" y="292" textAnchor="middle" className="text-[10px] font-semibold fill-sky-200">Voltmeter</text>
      </g>

      {/* Wiring paths */}
      <path
        d="M 130 135 L 130 90 L 245 90 L 245 145"
        fill="none"
        stroke={isHigh('wire-series') ? '#f59e0b' : '#ef4444'}
        strokeWidth="2.5"
      />
      <path
        d="M 270 160 L 340 160"
        fill="none"
        stroke={isHigh('wire-series') ? '#f59e0b' : '#f59e0b'}
        strokeWidth="2.5"
      />
      <path
        d="M 398 160 L 450 160 L 450 220 L 130 220 L 130 195"
        fill="none"
        stroke={isHigh('wire-return') ? '#f59e0b' : '#3b82f6'}
        strokeWidth="2.5"
      />
      {/* Voltmeter taps */}
      <path d="M 335 160 L 335 255 L 348 255" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />
      <path d="M 405 160 L 405 255 L 392 255" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 3" />

      <text x="250" y="308" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual p. 29 — Procedure B Photovoltaic Appliance Circuit
      </text>
    </svg>
  );
};

export const PhotodiodeCircuitDiagram: React.FC<DiagramRenderProps & { isShieldedMode?: boolean }> = ({
  highlightedId,
  isShieldedMode = false,
}) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-pd" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <pattern id="shield-hatch" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke="#475569" strokeWidth="2" strokeOpacity="0.6" />
        </pattern>
      </defs>
      <rect width="500" height="320" fill="url(#grid-pd)" />

      {/* Title */}
      <text x="250" y="28" textAnchor="middle" className="text-[13px] font-bold fill-amber-300">
        {isShieldedMode
          ? 'Table 1: Dark Current ID Measurement (Shielded Condition)'
          : 'Table 2 & 3: Illuminated Reverse Bias Circuit (Fixed d & Fixed V)'}
      </text>

      {/* 0-30V DC Supply */}
      <g id="component-supply" className={isHigh('component-supply') ? 'animate-pulse' : ''}>
        <rect x="40" y="110" width="70" height="90" rx="4" fill="#0f172a" stroke="#ef4444" strokeWidth={isHigh('component-supply') ? 3 : 2} />
        <text x="75" y="145" textAnchor="middle" className="text-[11px] font-bold fill-rose-300">0–30V DC</text>
        <text x="75" y="160" textAnchor="middle" className="text-[9px] font-mono fill-rose-200">Supply</text>
        <circle cx="95" cy="130" r="3.5" fill="#ef4444" />
        <circle cx="95" cy="175" r="3.5" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="105" y="134" className="text-[10px] font-bold fill-rose-400">+</text>
        <text x="105" y="179" className="text-[10px] font-bold fill-slate-300">-</text>
      </g>

      {/* 1 kΩ Limiting Resistor */}
      <g id="component-resistor" className={isHigh('component-resistor') ? 'animate-pulse' : ''}>
        <rect x="150" y="115" width="45" height="30" rx="3" fill="#0f172a" stroke="#a855f7" strokeWidth={isHigh('component-resistor') ? 3 : 2} />
        <text x="172" y="134" textAnchor="middle" className="text-[10px] font-bold fill-purple-300">1 kΩ</text>
        <text x="172" y="105" textAnchor="middle" className="text-[9px] font-mono fill-purple-200">Limiter</text>
      </g>

      {/* Microammeter in series */}
      <g id="component-ammeter" className={isHigh('component-ammeter') ? 'animate-pulse' : ''}>
        <circle cx="250" cy="130" r="22" fill="#0f172a" stroke="#818cf8" strokeWidth={isHigh('component-ammeter') ? 3 : 2} />
        <text x="250" y="135" textAnchor="middle" className="text-[12px] font-mono font-bold fill-indigo-300">µA</text>
        <text x="250" y="98" textAnchor="middle" className="text-[11px] font-bold fill-indigo-200">µA-Meter (Series)</text>
      </g>

      {/* Photodiode (Strict Reverse Bias: Cathode to +, Anode to -) */}
      <g id="photodiode" className={isHigh('photodiode') ? 'animate-pulse' : ''}>
        <circle cx="350" cy="130" r="24" fill="#0f172a" stroke="#f59e0b" strokeWidth={isHigh('photodiode') ? 3.5 : 2.5} />
        {/* Diode symbol pointing left (reverse bias) */}
        <polygon points="358,120 342,130 358,140" fill="#f59e0b" />
        <line x1="342" y1="120" x2="342" y2="140" stroke="#f59e0b" strokeWidth="2" />
        <text x="328" y="118" className="text-[9px] font-bold fill-amber-400">K (-)</text>
        <text x="365" y="118" className="text-[9px] font-bold fill-amber-400">A (+)</text>
        <text x="350" y="92" textAnchor="middle" className="text-[11px] font-bold fill-amber-300">Photodiode</text>
      </g>

      {/* Optical Lamp or Dark Shield */}
      {isShieldedMode ? (
        <g id="component-shield" className={isHigh('component-shield') ? 'animate-pulse' : ''}>
          <rect x="315" y="60" width="70" height="95" rx="6" fill="url(#shield-hatch)" stroke="#64748b" strokeWidth="2" strokeDasharray="3 3" />
          <text x="350" y="50" textAnchor="middle" className="text-[11px] font-bold fill-slate-300">
            Opaque Dark Shield
          </text>
          <text x="350" y="145" textAnchor="middle" className="text-[10px] font-mono fill-emerald-300">
            [DARK CURRENT ID ONLY]
          </text>
        </g>
      ) : (
        <g id="lamp" className={isHigh('lamp') ? 'animate-pulse' : ''}>
          <circle cx="350" cy="48" r="16" fill="#fef08a" fillOpacity="0.2" stroke="#eab308" strokeWidth={isHigh('lamp') ? 2.5 : 1.5} />
          <text x="350" y="24" textAnchor="middle" className="text-[10px] font-bold fill-amber-300">LED Lamp (Dist d = 10 cm)</text>
          <line x1="350" y1="64" x2="350" y2="102" stroke="#fde047" strokeWidth="2" strokeDasharray="3 2" />
        </g>
      )}

      {/* Voltmeter in parallel across photodiode */}
      <g id="component-voltmeter" className={isHigh('component-voltmeter') ? 'animate-pulse' : ''}>
        <circle cx="350" cy="225" r="22" fill="#0f172a" stroke="#38bdf8" strokeWidth={isHigh('component-voltmeter') ? 3 : 2} />
        <text x="350" y="230" textAnchor="middle" className="text-[12px] font-mono font-bold fill-sky-300">V</text>
        <text x="350" y="262" textAnchor="middle" className="text-[11px] font-bold fill-sky-200">Voltmeter (0–10V Parallel)</text>
      </g>

      {/* Loop connections */}
      <path
        id="wire-1"
        d="M 95 130 L 150 130"
        fill="none"
        stroke={isHigh('wire-1') ? '#f59e0b' : '#ef4444'}
        strokeWidth={isHigh('wire-1') ? 3.5 : 2}
      />
      <path
        id="wire-2"
        d="M 195 130 L 228 130"
        fill="none"
        stroke={isHigh('wire-2') ? '#f59e0b' : '#ef4444'}
        strokeWidth={isHigh('wire-2') ? 3.5 : 2}
      />
      <path
        id="wire-3"
        d="M 272 130 L 326 130"
        fill="none"
        stroke={isHigh('wire-3') ? '#f59e0b' : '#ef4444'}
        strokeWidth={isHigh('wire-3') ? 3.5 : 2}
      />
      <path
        id="wire-4"
        d="M 374 130 L 440 130 L 440 175 L 95 175"
        fill="none"
        stroke={isHigh('wire-4') ? '#f59e0b' : '#64748b'}
        strokeWidth={isHigh('wire-4') ? 3.5 : 2}
      />

      {/* Voltmeter taps */}
      <path
        id="wire-5"
        d="M 315 130 L 315 225 L 328 225"
        fill="none"
        stroke={isHigh('wire-5') ? '#f59e0b' : '#38bdf8'}
        strokeWidth={isHigh('wire-5') ? 3 : 1.5}
        strokeDasharray="3 3"
      />
      <path
        id="wire-6"
        d="M 385 130 L 385 225 L 372 225"
        fill="none"
        stroke={isHigh('wire-6') ? '#f59e0b' : '#38bdf8'}
        strokeWidth={isHigh('wire-6') ? 3 : 1.5}
        strokeDasharray="3 3"
      />

      <text x="250" y="305" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual p. 57, Figure 1 — Photodiode Reverse Bias Circuit
      </text>
    </svg>
  );
};

// ============================================================================
// EXPERIMENT 5: SODIUM SPECTRUM (MINIMUM DEVIATION METHOD)
// ============================================================================
export const SodiumMinimumDeviationDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-sodium" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <marker id="arrow-sodium" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#facc15" />
        </marker>
      </defs>
      <rect width="500" height="320" fill="url(#grid-sodium)" />

      {/* Title */}
      <text x="250" y="26" textAnchor="middle" className="text-[13px] font-bold fill-amber-300">
        Spectrometer Setup: Minimum Deviation Method (Sodium D1 &amp; D2 Doublet)
      </text>

      {/* Sodium Lamp Source */}
      <g id="sodium-lamp" className={isHigh('sodium-lamp') ? 'animate-pulse' : ''}>
        <circle cx="50" cy="160" r="26" fill="#fef08a" fillOpacity="0.15" stroke="#eab308" strokeWidth="2" />
        <circle cx="50" cy="160" r="14" fill="#facc15" fillOpacity="0.8" stroke="#ca8a04" strokeWidth="1.5" />
        <text x="50" y="125" textAnchor="middle" className="text-[10px] font-bold fill-amber-300">Sodium (Na) Lamp</text>
        <text x="50" y="200" textAnchor="middle" className="text-[9px] font-mono fill-amber-200">589.0 &amp; 589.6 nm</text>
      </g>

      {/* Collimator */}
      <g id="collimator" className={isHigh('collimator') ? 'animate-pulse' : ''}>
        <rect x="95" y="145" width="85" height="30" rx="3" fill="#0f172a" stroke="#64748b" strokeWidth="2" />
        <line x1="95" y1="160" x2="180" y2="160" stroke="#facc15" strokeWidth="2" strokeDasharray="4 2" />
        <text x="137" y="140" textAnchor="middle" className="text-[10px] font-semibold fill-slate-300">Collimator (Fixed)</text>
        <text x="137" y="190" textAnchor="middle" className="text-[9px] font-mono fill-slate-400">Parallel Beam</text>
      </g>

      {/* Prism / Grating Table at Minimum Deviation */}
      <g id="prism-table" className={isHigh('prism-table') ? 'animate-pulse' : ''}>
        <circle cx="250" cy="160" r="50" fill="#090d16" stroke="#d49a3e" strokeWidth="2.5" />
        {/* Grating Element inside */}
        <line x1="250" y1="125" x2="250" y2="195" stroke="#f59e0b" strokeWidth="4" />
        <text x="250" y="105" textAnchor="middle" className="text-[11px] font-bold fill-amber-300">Grating / Prism Table</text>
        <text x="250" y="222" textAnchor="middle" className="text-[9px] font-mono fill-amber-200">Table Rotation θ_table</text>

        {/* Vernier V1 & V2 callouts */}
        <g id="vernier-v1" className={isHigh('vernier-v1') ? 'animate-pulse' : ''}>
          <rect x="235" y="112" width="30" height="12" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="250" y="121" textAnchor="middle" className="text-[8px] font-mono font-bold fill-sky-300">V1</text>
        </g>
        <g id="vernier-v2" className={isHigh('vernier-v2') ? 'animate-pulse' : ''}>
          <rect x="235" y="196" width="30" height="12" rx="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
          <text x="250" y="205" textAnchor="middle" className="text-[8px] font-mono font-bold fill-sky-300">V2</text>
        </g>
      </g>

      {/* Direct ray & Diffracted rays at Minimum Deviation Angle D */}
      <line x1="180" y1="160" x2="250" y2="160" stroke="#facc15" strokeWidth="2.5" markerEnd="url(#arrow-sodium)" />
      {/* Diffracted path turned by angle D */}
      <path d="M 250 160 L 370 95" fill="none" stroke="#facc15" strokeWidth="2.5" markerEnd="url(#arrow-sodium)" />
      {/* Direct ray reference */}
      <line x1="250" y1="160" x2="380" y2="160" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 3" />

      {/* Angle of Minimum Deviation Arc */}
      <path d="M 310 160 A 60 60 0 0 0 302 132" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="2 2" />
      <text x="325" y="142" className="text-[11px] font-mono font-bold fill-sky-300">D_min</text>

      {/* Movable Telescope at Minimum Deviation */}
      <g id="telescope" className={isHigh('telescope') ? 'animate-pulse' : ''}>
        <g transform="translate(370, 95) rotate(-28)">
          <rect x="0" y="-14" width="80" height="28" rx="3" fill="#0f172a" stroke="#818cf8" strokeWidth="2" />
          <line x1="0" y1="0" x2="80" y2="0" stroke="#facc15" strokeWidth="1.5" />
          <circle cx="75" cy="0" r="6" fill="#38bdf8" fillOpacity="0.4" />
        </g>
        <text x="430" y="55" textAnchor="middle" className="text-[10px] font-bold fill-indigo-300">Telescope (Crosswire)</text>
        <text x="430" y="70" textAnchor="middle" className="text-[9px] font-mono fill-emerald-300">Turning Point (Extremum)</text>
      </g>

      {/* Turning point explanation badge */}
      <rect x="70" y="245" width="360" height="45" rx="6" fill="#0f172a" stroke="#d49a3e" strokeWidth="1" strokeOpacity="0.6" />
      <text x="250" y="262" textAnchor="middle" className="text-[10px] font-medium fill-slate-200">
        Turning Point Rule: As table rotates, spectral line moves, stops, and reverses direction.
      </text>
      <text x="250" y="278" textAnchor="middle" className="text-[10px] font-mono fill-amber-300">
        Lock telescope exactly at this turning point: 2 sin(D/2) = n · N · λ
      </text>

      <text x="250" y="306" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 48–53 — Minimum Deviation Determination of Wavelengths
      </text>
    </svg>
  );
};

// ============================================================================
// EXPERIMENT 7: ELECTRON DIFFRACTION (DE BROGLIE & BRAGG RINGS)
// ============================================================================
export const ElectronDiffractionDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-ed" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="ring-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.1" />
          <stop offset="60%" stopColor="#22c55e" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#22c55e" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="500" height="320" fill="url(#grid-ed)" />

      {/* Title */}
      <text x="250" y="24" textAnchor="middle" className="text-[13px] font-bold fill-indigo-300">
        Electron Diffraction Apparatus: Cathode Tube &amp; Polycrystalline Graphite Foil
      </text>

      {/* 0-5 kV High Voltage Supply */}
      <g id="ht-power-supply" className={isHigh('ht-power-supply') ? 'animate-pulse' : ''}>
        <rect x="30" y="80" width="85" height="120" rx="5" fill="#0f172a" stroke="#ef4444" strokeWidth={isHigh('ht-power-supply') ? 3 : 2} />
        <text x="72" y="105" textAnchor="middle" className="text-[11px] font-bold fill-rose-300">HT Supply</text>
        <text x="72" y="120" textAnchor="middle" className="text-[9px] font-mono fill-rose-200">0–5.0 kV DC</text>
        <circle cx="50" cy="155" r="4" fill="#ef4444" />
        <circle cx="95" cy="155" r="4" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="50" y="175" textAnchor="middle" className="text-[9px] font-bold fill-rose-400">Anode (+)</text>
        <text x="95" y="175" textAnchor="middle" className="text-[9px] font-bold fill-slate-300">Cathode (-)</text>
      </g>

      {/* Evacuated Tube with Electron Gun */}
      <g id="electron-gun" className={isHigh('electron-gun') ? 'animate-pulse' : ''}>
        <rect x="140" y="125" width="45" height="50" rx="3" fill="#1e293b" stroke="#64748b" strokeWidth="1.5" />
        <text x="162" y="115" textAnchor="middle" className="text-[9px] font-bold fill-slate-300">Electron Gun</text>
        {/* Filament & Anode Aperture */}
        <line x1="145" y1="150" x2="160" y2="150" stroke="#f59e0b" strokeWidth="2" />
        <line x1="175" y1="135" x2="175" y2="165" stroke="#38bdf8" strokeWidth="2" strokeDasharray="3 3" />
      </g>

      {/* Graphite Foil Target */}
      <g id="graphite-target" className={isHigh('graphite-target') ? 'animate-pulse' : ''}>
        <rect x="210" y="130" width="12" height="40" rx="1" fill="#475569" stroke="#94a3b8" strokeWidth="1.5" />
        <text x="216" y="115" textAnchor="middle" className="text-[9px] font-bold fill-amber-300">Graphite Foil</text>
        <text x="216" y="185" textAnchor="middle" className="text-[8px] font-mono fill-amber-200">d1=0.213 nm</text>
        <text x="216" y="195" textAnchor="middle" className="text-[8px] font-mono fill-amber-200">d2=0.123 nm</text>
      </g>

      {/* Primary Electron Beam */}
      <line x1="175" y1="150" x2="210" y2="150" stroke="#38bdf8" strokeWidth="2" />

      {/* Spherical Glass Bulb with Fluorescent Screen */}
      <g id="fluorescent-screen" className={isHigh('fluorescent-screen') ? 'animate-pulse' : ''}>
        <circle cx="360" cy="150" r="75" fill="#090d16" stroke="#22c55e" strokeWidth="2" strokeDasharray="4 2" />
        <text x="360" y="65" textAnchor="middle" className="text-[11px] font-bold fill-emerald-300">Fluorescent Screen Bulb</text>
        <text x="360" y="80" textAnchor="middle" className="text-[9px] font-mono fill-emerald-200">Distance L = 13.5 cm</text>

        {/* Central un-diffracted spot */}
        <circle cx="360" cy="150" r="3.5" fill="#ffffff" />

        {/* Inner Ring D1 */}
        <circle cx="360" cy="150" r="28" fill="none" stroke="#4ade80" strokeWidth="2.5" strokeOpacity="0.85" />
        <text x="395" y="142" className="text-[9px] font-mono font-bold fill-emerald-400">D1 (Inner)</text>

        {/* Outer Ring D2 */}
        <circle cx="360" cy="150" r="48" fill="none" stroke="#22c55e" strokeWidth="2" strokeOpacity="0.7" />
        <text x="415" y="125" className="text-[9px] font-mono font-bold fill-emerald-400">D2 (Outer)</text>
      </g>

      {/* Caliper Measurement Overlay */}
      <g id="caliper" className={isHigh('caliper') ? 'animate-pulse' : ''}>
        <line x1="332" y1="150" x2="388" y2="150" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="2 2" />
        <line x1="332" y1="145" x2="332" y2="155" stroke="#f59e0b" strokeWidth="2" />
        <line x1="388" y1="145" x2="388" y2="155" stroke="#f59e0b" strokeWidth="2" />
        <text x="360" y="165" textAnchor="middle" className="text-[9px] font-mono font-bold fill-amber-300">↔ D1 Measured</text>
      </g>

      {/* Diffracted conical rays */}
      <line x1="222" y1="150" x2="332" y2="150" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="222" y1="150" x2="388" y2="150" stroke="#4ade80" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="222" y1="150" x2="312" y2="150" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" />
      <line x1="222" y1="150" x2="408" y2="150" stroke="#22c55e" strokeWidth="1" strokeDasharray="3 2" />

      {/* De Broglie & Bragg Relations box */}
      <rect x="50" y="240" width="400" height="48" rx="6" fill="#0f172a" stroke="#818cf8" strokeWidth="1" strokeOpacity="0.6" />
      <text x="250" y="258" textAnchor="middle" className="text-[10px] font-mono fill-indigo-300">
        de Broglie Wavelength: λ = h / √(2 m_e e V_A)
      </text>
      <text x="250" y="275" textAnchor="middle" className="text-[10px] font-mono fill-emerald-300">
        Bragg Condition: 2 d sin θ = λ  ⇒  r / L ≈ tan 2θ ≈ 2θ  ⇒  D = 2 L λ / d
      </text>

      <text x="250" y="306" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 57–62 — Electron Diffraction with Polycrystalline Target
      </text>
    </svg>
  );
};

// ============================================================================
// EXPERIMENT 8: HEISENBERG UNCERTAINTY PRINCIPLE (SINGLE-SLIT DIFFRACTION)
// ============================================================================
export const SingleSlitHeisenbergDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-hs" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
        <marker id="arrow-laser" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#ef4444" />
        </marker>
      </defs>
      <rect width="500" height="320" fill="url(#grid-hs)" />

      {/* Title */}
      <text x="250" y="24" textAnchor="middle" className="text-[13px] font-bold fill-sky-300">
        Heisenberg Uncertainty Bench: Monochromatic Laser, Variable Single Slit &amp; Photodetector
      </text>

      {/* Red Laser Diode Source */}
      <g id="laser-source" className={isHigh('laser-source') ? 'animate-pulse' : ''}>
        <rect x="30" y="135" width="70" height="30" rx="3" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
        <circle cx="95" cy="150" r="5" fill="#ef4444" />
        <text x="65" y="125" textAnchor="middle" className="text-[10px] font-bold fill-rose-300">Red Laser Diode</text>
        <text x="65" y="154" textAnchor="middle" className="text-[9px] font-mono fill-rose-200">λ = 650 nm</text>
      </g>

      {/* Monochromatic Laser Beam */}
      <line x1="100" y1="150" x2="180" y2="150" stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-laser)" />

      {/* Adjustable Single Slit with Micrometer Screw */}
      <g id="single-slit" className={isHigh('single-slit') ? 'animate-pulse' : ''}>
        <rect x="180" y="80" width="16" height="55" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
        <rect x="180" y="165" width="16" height="55" rx="2" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
        {/* Slit Aperture a */}
        <line x1="188" y1="135" x2="188" y2="165" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2 1" />
        <text x="188" y="70" textAnchor="middle" className="text-[10px] font-bold fill-sky-300">Slit (Width a)</text>
        <text x="188" y="235" textAnchor="middle" className="text-[9px] font-mono fill-sky-200">a = Δx (0.1–0.4 mm)</text>
      </g>

      {/* Optical Bench Rail (Distance L) */}
      <line x1="196" y1="205" x2="380" y2="205" stroke="#64748b" strokeWidth="1.5" strokeDasharray="4 2" />
      <text x="288" y="220" textAnchor="middle" className="text-[10px] font-mono fill-slate-300">Distance L = 100 cm</text>

      {/* Diffracted Rays to First Minima */}
      <line x1="196" y1="150" x2="380" y2="100" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />
      <line x1="196" y1="150" x2="380" y2="150" stroke="#ef4444" strokeWidth="2.5" />
      <line x1="196" y1="150" x2="380" y2="200" stroke="#ef4444" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* Traveling Photodetector & Micrometer Screen */}
      <g id="photodetector" className={isHigh('photodetector') ? 'animate-pulse' : ''}>
        <rect x="380" y="60" width="30" height="180" rx="3" fill="#090d16" stroke="#64748b" strokeWidth="1.5" />
        {/* Central Maximum Profile Curve */}
        <path
          d="M 380 75 Q 395 100 380 115 Q 435 150 380 185 Q 395 200 380 225"
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
        />
        {/* Photodetector Head */}
        <rect x="415" y="135" width="45" height="30" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
        <circle cx="415" cy="150" r="4" fill="#38bdf8" />
        <text x="438" y="153" textAnchor="middle" className="text-[9px] font-bold fill-sky-300">Sensor</text>
        <text x="438" y="180" textAnchor="middle" className="text-[8px] font-mono fill-slate-300">Micrometer y</text>
      </g>

      {/* Central Fringe Width 2y1 */}
      <line x1="375" y1="115" x2="375" y2="185" stroke="#facc15" strokeWidth="1.5" />
      <line x1="370" y1="115" x2="380" y2="115" stroke="#facc15" strokeWidth="1.5" />
      <line x1="370" y1="185" x2="380" y2="185" stroke="#facc15" strokeWidth="1.5" />
      <text x="350" y="153" textAnchor="end" className="text-[10px] font-mono font-bold fill-amber-300">2 y1</text>

      {/* Uncertainty Relation Equation Box */}
      <rect x="40" y="245" width="420" height="42" rx="5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" strokeOpacity="0.6" />
      <text x="250" y="262" textAnchor="middle" className="text-[10px] font-mono fill-sky-300">
        Spatial Uncertainty: Δx = a  |  Angular Spread: sin θ ≈ y1 / L
      </text>
      <text x="250" y="278" textAnchor="middle" className="text-[10px] font-mono fill-amber-300">
        Momentum Uncertainty: Δpx = p sin θ = (h/λ)(y1/L)  ⇒  Δx · Δpx ≥ h/2
      </text>

      <text x="250" y="306" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 63–70 — Single-Slit Diffraction Verification of Uncertainty
      </text>
    </svg>
  );
};

// ============================================================================
// EXPERIMENT 9: QUANTUM CIRCUIT & GATES ARCHITECTURE (BLOCH & TWO-QUBIT)
// ============================================================================
export const QuantumCircuitDiagram: React.FC<DiagramRenderProps> = ({ highlightedId }) => {
  const isHigh = (id: string) => highlightedId === id;
  return (
    <svg viewBox="0 0 500 320" className="w-full h-full select-none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="grid-qc" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" className="text-slate-800/40" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="500" height="320" fill="url(#grid-qc)" />

      {/* Title */}
      <text x="250" y="24" textAnchor="middle" className="text-[13px] font-bold fill-purple-300">
        Quantum Computing: Bloch Sphere Representation &amp; Two-Qubit Entanglement Circuit
      </text>

      {/* Single-Qubit Bloch Sphere Vector Projection */}
      <g id="bloch-sphere" className={isHigh('bloch-sphere') ? 'animate-pulse' : ''}>
        <circle cx="100" cy="140" r="55" fill="#090d16" stroke="#9333ea" strokeWidth="1.5" strokeDasharray="3 2" />
        {/* Equator ellipse */}
        <ellipse cx="100" cy="140" rx="55" ry="18" fill="none" stroke="#7e22ce" strokeWidth="1" strokeDasharray="2 2" />
        {/* Axes: z, x, y */}
        <line x1="100" y1="75" x2="100" y2="205" stroke="#c084fc" strokeWidth="1.5" />
        <line x1="45" y1="140" x2="155" y2="140" stroke="#64748b" strokeWidth="1" />
        {/* Poles |0> and |1> */}
        <text x="100" y="70" textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-300">|0⟩</text>
        <text x="100" y="218" textAnchor="middle" className="text-[11px] font-mono font-bold fill-purple-300">|1⟩</text>
        {/* State vector |ψ> */}
        <line x1="100" y1="140" x2="135" y2="100" stroke="#facc15" strokeWidth="2.5" />
        <circle cx="135" cy="100" r="3.5" fill="#facc15" />
        <text x="145" y="98" className="text-[10px] font-mono font-bold fill-amber-300">|ψ⟩</text>
        <text x="100" y="235" textAnchor="middle" className="text-[9px] font-semibold fill-slate-300">Single Qubit Bloch Sphere</text>
      </g>

      {/* Two-Qubit Circuit Rails */}
      <g id="quantum-circuit" className={isHigh('quantum-circuit') ? 'animate-pulse' : ''}>
        {/* Wire 0 (|q0>) */}
        <text x="190" y="115" className="text-[11px] font-mono font-bold fill-sky-300">|q0⟩ = |0⟩</text>
        <line x1="250" y1="110" x2="460" y2="110" stroke="#38bdf8" strokeWidth="2" />

        {/* Wire 1 (|q1>) */}
        <text x="190" y="175" className="text-[11px] font-mono font-bold fill-sky-300">|q1⟩ = |0⟩</text>
        <line x1="250" y1="170" x2="460" y2="170" stroke="#38bdf8" strokeWidth="2" />

        {/* Hadamard Gate H on q0 */}
        <g id="gate-h" className={isHigh('gate-h') ? 'animate-pulse' : ''}>
          <rect x="275" y="95" width="30" height="30" rx="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
          <text x="290" y="114" textAnchor="middle" className="text-[12px] font-mono font-bold fill-sky-300">H</text>
          <text x="290" y="85" textAnchor="middle" className="text-[8px] font-mono fill-slate-400">Superposition</text>
        </g>

        {/* CNOT Entangling Gate (Control on q0, Target on q1) */}
        <g id="gate-cnot" className={isHigh('gate-cnot') ? 'animate-pulse' : ''}>
          {/* Vertical entangling connector */}
          <line x1="360" y1="110" x2="360" y2="170" stroke="#c084fc" strokeWidth="2.5" />
          {/* Control point dot on q0 */}
          <circle cx="360" cy="110" r="5" fill="#c084fc" />
          {/* Target XOR circle on q1 */}
          <circle cx="360" cy="170" r="12" fill="#0f172a" stroke="#c084fc" strokeWidth="2" />
          <line x1="348" y1="170" x2="372" y2="170" stroke="#c084fc" strokeWidth="2" />
          <line x1="360" y1="158" x2="360" y2="182" stroke="#c084fc" strokeWidth="2" />
          <text x="360" y="85" textAnchor="middle" className="text-[8px] font-mono fill-purple-300">CNOT Entangler</text>
        </g>

        {/* Measurement Detectors on both rails */}
        <g id="gate-measure" className={isHigh('gate-measure') ? 'animate-pulse' : ''}>
          <rect x="420" y="98" width="24" height="24" rx="3" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M 424 116 A 8 8 0 0 1 440 116" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="432" y1="116" x2="438" y2="104" stroke="#22c55e" strokeWidth="1.5" />

          <rect x="420" y="158" width="24" height="24" rx="3" fill="#1e293b" stroke="#22c55e" strokeWidth="1.5" />
          <path d="M 424 176 A 8 8 0 0 1 440 176" fill="none" stroke="#22c55e" strokeWidth="1.5" />
          <line x1="432" y1="176" x2="438" y2="164" stroke="#22c55e" strokeWidth="1.5" />
        </g>
      </g>

      {/* Bell State Formula Callout Box */}
      <rect x="50" y="250" width="400" height="42" rx="5" fill="#0f172a" stroke="#c084fc" strokeWidth="1" strokeOpacity="0.6" />
      <text x="250" y="267" textAnchor="middle" className="text-[10px] font-mono fill-purple-300">
        Maximally Entangled Bell State: |Φ⁺⟩ = (|00⟩ + |11⟩) / √2
      </text>
      <text x="250" y="282" textAnchor="middle" className="text-[9px] font-mono fill-emerald-300">
        Measurement Statistics: P(00) = 50%  |  P(11) = 50%  |  P(01) = P(10) = 0%
      </text>

      <text x="250" y="306" textAnchor="middle" className="text-[10px] font-mono fill-slate-400">
        BAPHY105 Manual pp. 75–86 — Single-Qubit &amp; Two-Qubit Quantum Gates Simulation
      </text>
    </svg>
  );
};

