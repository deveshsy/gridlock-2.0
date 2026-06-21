import React, { useEffect, useState } from 'react';
import { Map, Navigation, ShieldAlert, Pin, Radio } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MapmyIndiaIncidentMap({ latestViolation, activeCamera, setActiveCamera }) {
  const [activeAlert, setActiveAlert] = useState(null);

  // Trigger alert marker on the map when a new violation arrives
  useEffect(() => {
    if (latestViolation) {
      setActiveAlert({
        camera: latestViolation.camera,
        type: latestViolation.type,
        plate: latestViolation.plate,
        severity: latestViolation.severity,
        id: latestViolation.id
      });
      // Mute the alert popup after 4 seconds
      const timer = setTimeout(() => setActiveAlert(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [latestViolation]);

  // Coordinates mapping on our 300x200 vector grid
  const cameraNodes = [
    { id: 'CAM-01-NORTH', label: 'CAM 1 (North)', x: 150, y: 45, desc: 'Outer Ring Rd' },
    { id: 'CAM-02-EAST', label: 'CAM 2 (East)', x: 240, y: 100, desc: 'Koramangala 80ft Rd' },
    { id: 'CAM-03-SOUTH', label: 'CAM 3 (South)', x: 150, y: 155, desc: 'Sarjapur Rd Junction' },
    { id: 'CAM-04-WEST', label: 'CAM 4 (West)', x: 60, y: 100, desc: 'Hosur Road Flyover' }
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 flex flex-col h-full relative overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5 z-10">
        <div className="flex items-center gap-2">
          <Map className="h-4.5 w-4.5 text-blue-400" />
          <div className="text-left">
            <h3 className="text-xs font-bold font-sans tracking-wider text-slate-200 uppercase">MapmyIndia Spatial Tracker</h3>
            <p className="text-[9px] text-slate-500 font-sans font-semibold tracking-wider uppercase">Bengaluru Central Grid (ASTraM Hub)</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-950/35 border border-blue-900/40 rounded text-[9px] text-blue-400 font-sans font-semibold">
          <Navigation className="h-2.5 w-2.5 text-blue-450" />
          <span>LIVE GEOPLOT</span>
        </div>
      </div>

      {/* Map Content */}
      <div className="flex-1 relative bg-slate-950/70 rounded-lg border border-slate-850 overflow-hidden min-h-[180px] flex items-center justify-center">
        {/* SVG Vector Map of Koramangala / ORR Junction */}
        <svg className="w-full h-full max-w-[340px] max-h-[200px]" viewBox="0 0 300 200" xmlns="http://www.w3.org/2000/svg">
          {/* Grid lines for coordinate mapping */}
          <pattern id="mapGrid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(148, 163, 184, 0.02)" strokeWidth="1" />
          </pattern>
          <rect width="100%" height="100%" fill="url(#mapGrid)" />

          {/* Water Bodies / Green Zones (Sleek minimalist representation) */}
          <path d="M 0,180 Q 40,165 70,180 T 130,190 L 130,200 L 0,200 Z" fill="rgba(16, 185, 129, 0.03)" />
          <path d="M 220,0 Q 250,20 280,5 T 300,35 L 300,0 Z" fill="rgba(14, 165, 233, 0.02)" />

          {/* Styled Road Network Paths (Bengaluru style) */}
          {/* ORR Flyover */}
          <path d="M 150,0 L 150,200" stroke="rgba(71, 85, 105, 0.25)" strokeWidth="14" fill="none" strokeLinecap="round" />
          <path d="M 150,0 L 150,200" stroke="#1e293b" strokeWidth="12" fill="none" strokeLinecap="round" />
          <path d="M 150,0 L 150,200" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="4 4" fill="none" />

          {/* Koramangala 80ft / Hosur Crossing */}
          <path d="M 0,100 L 300,100" stroke="rgba(71, 85, 105, 0.25)" strokeWidth="10" fill="none" strokeLinecap="round" />
          <path d="M 0,100 L 300,100" stroke="#1e293b" strokeWidth="8" fill="none" strokeLinecap="round" />
          <path d="M 0,100 L 300,100" stroke="rgba(148, 163, 184, 0.2)" strokeWidth="1" strokeDasharray="3 3" fill="none" />

          {/* Diagonal Junction Ramp */}
          <path d="M 60,100 Q 150,100 150,45" stroke="rgba(71, 85, 105, 0.15)" strokeWidth="5" fill="none" />

          {/* Sector Street Labels */}
          <text x="10" y="90" fill="#64748b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">HOSUR RD FLYOVER</text>
          <text x="210" y="112" fill="#64748b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">80FT RD (KORAMANGALA)</text>
          <text x="156" y="20" fill="#64748b" fontSize="7" fontFamily="sans-serif" fontWeight="bold">OUTER RING ROAD</text>

          {/* Interactive Camera Nodes */}
          {cameraNodes.map((node) => {
            const isSelected = activeCamera === node.id;
            const hasAlert = activeAlert && activeAlert.camera === node.id;
            const isCritical = hasAlert && (activeAlert.severity === 'critical' || activeAlert.severity === 'high');

            return (
              <g key={node.id} className="cursor-pointer" onClick={() => setActiveCamera(node.id)}>
                {/* Active alert pulsing rings */}
                {hasAlert && (
                  <>
                    <circle cx={node.x} cy={node.y} r="16" fill="none" stroke={isCritical ? '#ef4444' : '#f59e0b'} strokeWidth="1" className="opacity-75">
                      <animate attributeName="r" values="6;18" dur="1.2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.8;0" dur="1.2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx={node.x} cy={node.y} r="10" fill={isCritical ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'} />
                  </>
                )}

                {/* Outer halo highlight for active selected camera */}
                {isSelected && (
                  <circle cx={node.x} cy={node.y} r="8.5" fill="none" stroke="#2874f0" strokeWidth="1.5" className="opacity-80" />
                )}

                {/* Base camera node dot */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="5"
                  fill={hasAlert ? (isCritical ? '#ef4444' : '#f59e0b') : (isSelected ? '#2874f0' : '#475569')}
                  stroke="#020617"
                  strokeWidth="1.5"
                  className="transition-colors duration-200"
                />

                {/* Camera Labels */}
                <rect x={node.x - 22} y={node.y - 14} width="44" height="7" rx="1.5" fill="#0f172a" stroke={isSelected ? '#2874f0' : 'rgba(148, 163, 184, 0.1)'} strokeWidth="0.5" />
                <text x={node.x} y={node.y - 9} fill={isSelected ? '#2874f0' : '#94a3b8'} fontSize="5.5" fontFamily="monospace" fontWeight="bold" textAnchor="middle">
                  {node.id.split('-')[0] + '-' + node.id.split('-')[2][0]}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Live Map Overlay Notification (Incident Toast) */}
        <AnimatePresence>
          {activeAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className={`absolute bottom-3 left-3 right-3 p-2 border rounded-lg bg-slate-900/95 shadow-lg flex items-center gap-2.5 z-20 ${
                activeAlert.severity === 'critical' || activeAlert.severity === 'high'
                  ? 'border-red-900/40 text-red-400'
                  : 'border-amber-900/40 text-amber-400'
              }`}
            >
              <ShieldAlert className="h-4 w-4 shrink-0 animate-bounce" />
              <div className="text-left font-sans min-w-0">
                <span className="block text-[8px] font-bold uppercase tracking-wider text-slate-500">Live Spatial Alert ({activeAlert.camera.split('-')[0]})</span>
                <span className="block text-[10px] text-slate-200 truncate font-semibold">
                  {activeAlert.type} : <span className="font-mono text-white font-bold">{activeAlert.plate}</span>
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Map Legend footer */}
      <div className="mt-2.5 flex justify-between items-center text-[9px] font-sans text-slate-500 font-semibold tracking-wider uppercase">
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2874f0]" /> Selected
        </span>
        <span className="flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" /> Incident Alert
        </span>
        <span className="text-[8px] font-bold text-slate-650 font-sans tracking-wide">
          MAP INTEGRATION: ACTIVE
        </span>
      </div>
    </div>
  );
}
