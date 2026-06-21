import React, { useEffect, useState } from 'react';
import { Map, Navigation, ShieldAlert } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MapWidget({ latestViolation, activeCamera, setActiveCamera, violationCount, onMarkerClick }) {
  const [isAlertActive, setIsAlertActive] = useState(false);

  // Set the Begur Amin Road marker alert state to true when a violation is triggered in the feed
  useEffect(() => {
    if (latestViolation) {
      setIsAlertActive(true);
      const timer = setTimeout(() => setIsAlertActive(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [latestViolation]);

  const isBegurSelected = activeCamera === 'CAM-BEGUM-AMIN-ROAD';

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full relative overflow-hidden shadow-sm">
      {/* Map Widget Header */}
      <div className="flex justify-between items-center mb-3.5 z-10 font-sans">
        <div className="flex items-center gap-2">
          <Map className="h-4.5 w-4.5 text-[#2874f0]" />
          <div className="text-left">
            <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase font-sans">ASTraM Bengaluru Geo-Hub</h3>
            <p className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase font-sans">Silk Board / Begum Amin Road Sector Grid</p>
          </div>
        </div>
        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-sans font-bold text-slate-650">
          <span className={`h-1.5 w-1.5 rounded-full ${isAlertActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`} />
          <span>{isAlertActive ? 'INCIDENT IN PROGRESS' : 'GRID SECURE'}</span>
        </div>
      </div>

      {/* Map Container */}
      <div className="flex-1 relative bg-slate-100 rounded-lg border border-slate-200 overflow-hidden min-h-[220px] flex items-center justify-center">
        {/* Radar Inverted Map Underlay */}
        <div 
          className="absolute inset-0 select-none opacity-60 transition-all duration-300"
          style={{
            backgroundImage: "url('/bangalore_map_bg.png')", 
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "grayscale(60%) brightness(102%) contrast(100%)" // Adjusted for clean light mode
          }}
        />

        {/* HUD grid line graphic overlays */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(40,116,240,0.015)_1px,transparent_1px),linear-gradient(90deg,rgba(40,116,240,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none" />

        {/* Interactive camera node marker */}
        <div 
          onClick={onMarkerClick}
          className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 z-20 cursor-pointer transition-all duration-200 hover:scale-125 hover:brightness-110 group"
          style={{ transformOrigin: 'center' }}
        >
          {/* Pulsing Alert Ring */}
          {isAlertActive && (
            <span className="absolute -inset-4 rounded-full border-2 border-red-500 animate-ping opacity-75" />
          )}

          {/* Selection Ring */}
          {isBegurSelected && (
            <span className="absolute -inset-2.5 rounded-full border border-[#2874f0] animate-pulse" />
          )}

          {/* Marker Dot */}
          <div className={`h-4.5 w-4.5 rounded-full border-2 border-white shadow-lg transition-colors duration-300 ${
            isAlertActive || violationCount > 0 ? 'bg-red-600' : (isBegurSelected ? 'bg-[#2874f0]' : 'bg-[#10b981]')
          }`} />

          {/* Info Label Box */}
          <div className={`absolute left-7 -top-4.5 w-[115px] p-2 bg-white border rounded-md shadow-lg text-left transition-all duration-250 backdrop-blur-sm pointer-events-none ${
            isBegurSelected ? 'border-[#2874f0]' : 'border-slate-200 group-hover:border-[#2874f0]/40'
          }`}>
            <p className="text-[7.5px] font-bold text-slate-800 tracking-wider leading-none uppercase font-sans">Begum Amin Road Cam</p>
            <p className="text-[6px] font-semibold text-[#2874f0] leading-none mt-1.5 font-sans">Central Silk Board Junction</p>
          </div>

          {/* Pulsing Alert Badge displaying total violation count */}
          {violationCount > 0 && (
            <span className="absolute -top-2.5 -right-2.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-600 border border-white text-[8px] font-bold text-white font-mono shadow-md animate-pulse">
              {violationCount}
            </span>
          )}
        </div>

        {/* Floating Quick Action hint */}
        <div className="absolute top-2.5 left-2.5 pointer-events-none text-slate-500 font-sans text-[8.5px] font-semibold uppercase tracking-wider z-20">
          Click Begum Amin Road Cam node to monitor feed
        </div>

        {/* Live Overlay Toast */}
        <AnimatePresence>
          {isAlertActive && latestViolation && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-2.5 left-2.5 right-2.5 p-2 bg-white border border-red-200 rounded-md flex items-center gap-2 shadow-lg backdrop-blur-sm z-20"
            >
              <span className="flex h-2 w-2 relative shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <div className="text-left font-sans min-w-0">
                <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-wider">Spatial Alert : Begum Amin Road Hub</span>
                <span className="block text-[10px] text-slate-800 font-semibold truncate">
                  {latestViolation.type} | Plate: <span className="font-mono text-[#2874f0] font-bold">{latestViolation.plate}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Legend */}
      <div className="mt-2.5 flex justify-between items-center text-[9px] font-sans font-bold text-slate-450 tracking-wider uppercase z-10">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" /> SECURE
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> ALERT ({violationCount})
        </span>
        <span className="text-[8px] font-black text-[#2874f0] font-sans tracking-wide">
          MAPMYINDIA RADAR INTEGRATION
        </span>
      </div>
    </div>
  );
}
