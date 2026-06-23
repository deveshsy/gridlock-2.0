import React from 'react';
import { ShieldAlert } from 'lucide-react';

export default function GreenCorridorPanel({ onCancel }) {
  return (
    <div className="flex flex-col h-full bg-white border border-emerald-200 rounded-xl shadow-xl p-6 font-sans text-left justify-between">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center mr-1">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping absolute" />
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
          </div>
          <h2 className="text-emerald-600 font-mono text-sm uppercase tracking-wider font-semibold flex items-center gap-2 drop-shadow-[0_0_8px_rgba(16,185,129,0.15)]">
            <ShieldAlert className="h-4.5 w-4.5 text-emerald-600" />
            Green Corridor Active
          </h2>
        </div>
        <button 
          onClick={onCancel}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 px-2.5 py-1 rounded transition-all cursor-pointer shadow-sm"
        >
          Deactivate
        </button>
      </div>

      {/* Emergency Telemetry Banner */}
      <div className="py-2.5 px-3.5 bg-emerald-50 border border-emerald-100/70 rounded-lg flex flex-col gap-1 my-3">
        <p className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider">
          TARGET DIRECTION: APOLLO HOSPITAL
        </p>
        <p className="text-[9px] text-slate-600 font-sans leading-relaxed">
          Automated signal grid overrides are active along the transit route. Ground patrols are positioned at major lane merge junctions.
        </p>
      </div>

      {/* Timeline of chouraha operational items */}
      <div className="flex-1 my-2 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
        {/* Node 1 */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col items-center shrink-0">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-100/80 border border-emerald-500 mt-1" />
            <div className="w-0.5 h-12 bg-emerald-100 my-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[11px] font-bold text-slate-800 font-sans">Silk Board Junction</h4>
              <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded">T-2 MINS</span>
            </div>
            <p className="text-[10px] text-slate-600 font-sans mt-1 leading-relaxed">
              <span className="text-emerald-600 font-bold font-mono">COMMAND:</span> Hold Southbound traffic lanes immediately. Divert cross traffic to Outer Ring Road.
            </p>
          </div>
        </div>

        {/* Node 2 */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col items-center shrink-0">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-100/80 border border-emerald-500 mt-1" />
            <div className="w-0.5 h-12 bg-emerald-100 my-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[11px] font-bold text-slate-800 font-sans">Jayanagar 4th Block Chouraha</h4>
              <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded">T-5 MINS</span>
            </div>
            <p className="text-[10px] text-slate-600 font-sans mt-1 leading-relaxed">
              <span className="text-emerald-600 font-bold font-mono">COMMAND:</span> Override automated signal grid to hard RED for cross streets. Clear ambulance lane.
            </p>
          </div>
        </div>

        {/* Node 3 */}
        <div className="flex gap-3 items-start">
          <div className="flex flex-col items-center shrink-0">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-100/80 border border-emerald-500 mt-1" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-baseline">
              <h4 className="text-[11px] font-bold text-slate-800 font-sans">Bannerghatta Road Crossing</h4>
              <span className="text-[8px] font-mono font-bold text-emerald-700 bg-emerald-50 border border-emerald-100/60 px-1.5 py-0.5 rounded">T-8 MINS</span>
            </div>
            <p className="text-[10px] text-slate-600 font-sans mt-1 leading-relaxed">
              <span className="text-emerald-600 font-bold font-mono">COMMAND:</span> Hold pedestrian crossings. Position ground units to block incoming flyover merge lines.
            </p>
          </div>
        </div>
      </div>

      {/* Safety Sign-off Footer */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[8px] font-mono">
        <span className="text-emerald-600/90 tracking-widest uppercase">
          SECURE BYPASS SIGNAL: ACTIVE
        </span>
        <span className="text-slate-400 uppercase">
          BTP SYS-ID: #9901-COR
        </span>
      </div>
    </div>
  );
}
