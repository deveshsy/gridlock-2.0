import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertOctagon, Search, Filter, MapPin, Clock, ShieldCheck, Eye } from 'lucide-react';

export default function LiveViolationLog({ activeViolations, onSelectViolation }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const handleExportPDF = async (violation) => {
    try {
      // Map severity to fine amount
      let fineAmount = 500;
      if (violation.severity === 'critical') fineAmount = 1000;
      else if (violation.severity === 'high') fineAmount = 700;

      let formattedTime = violation.timestamp;
      try {
        formattedTime = new Date(violation.timestamp).toLocaleString();
      } catch (err) {
        // fallback
      }

      const response = await fetch('http://localhost:8001/api/generate-challan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          license_plate: violation.plate,
          violation_type: violation.type,
          camera_node: violation.camera,
          timestamp: formattedTime,
          fine_amount: fineAmount
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF blob in the browser
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `BTP_Challan_${violation.plate}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to export PDF. Please check if the backend server is running on port 8001.');
    }
  };

  // Filter logs based on search query and severity selector
  const filteredViolations = activeViolations.filter(v => {
    const matchesSearch = v.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.plate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          v.vehicle.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSeverity = severityFilter === 'ALL' || v.severity.toUpperCase() === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'high':
        return 'bg-orange-50 text-orange-750 border-orange-200';
      case 'medium':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const formatTimestamp = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div className="flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header bar */}
      <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4.5 w-4.5 text-red-500 animate-pulse" />
          <h2 className="text-xs font-bold font-sans tracking-wider text-slate-800 uppercase">Real-Time Violation Feed</h2>
        </div>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-blue-50 text-[#2874f0] border border-blue-200/60 font-bold">
          {filteredViolations.length} Active
        </span>
      </div>

      {/* Filter and Search controls */}
      <div className="p-3 border-b border-slate-200 bg-slate-50/50 flex flex-col gap-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by plate, vehicle, type..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#2874f0]/50 focus:ring-1 focus:ring-[#2874f0]/20 transition-all font-sans"
          />
        </div>

        <div className="flex gap-1.5 items-center overflow-x-auto py-1 scrollbar-thin">
          <Filter className="h-3 w-3 text-slate-400 shrink-0" />
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded text-[9px] font-sans font-bold uppercase tracking-wider transition-all duration-150 cursor-pointer ${
                severityFilter === sev
                  ? 'bg-blue-50 text-[#2874f0] border border-blue-200 font-bold shadow-sm'
                  : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>
      </div>

      {/* Scrolling logs container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin min-h-[300px]">
        <AnimatePresence initial={false}>
          {filteredViolations.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center text-slate-400 py-10"
            >
              <ShieldCheck className="h-10 w-10 text-slate-300 mb-2 stroke-[1.5]" />
              <p className="text-xs font-sans font-medium">No violations detected</p>
            </motion.div>
          ) : (
            filteredViolations.map((violation) => {
              const isWrongSide = violation.type === 'Wrong-Side Driving';
              const isHighConfidence = violation.confidence >= 0.90;

              return (
                <motion.div
                  key={violation.id}
                  layoutId={violation.id}
                  initial={{ opacity: 0, x: -10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, x: 10, scale: 0.98 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className={`p-3 rounded-lg border text-left transition-all duration-200 relative overflow-hidden group cursor-pointer ${
                    isWrongSide
                      ? 'bg-red-50/40 border-red-200 hover:border-red-400'
                      : 'bg-slate-50/50 border-slate-200 hover:border-[#2874f0]/30 hover:bg-slate-50'
                  }`}
                  onClick={() => onSelectViolation && onSelectViolation(violation)}
                >
                  {/* Left indicator accent for Wrong Side Driving */}
                  {isWrongSide && (
                    <span className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                  )}

                  {/* Header info */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[9px] px-2 py-0.5 rounded font-sans font-bold border ${getSeverityStyles(violation.severity)}`}>
                          {violation.severity.toUpperCase()}
                        </span>
                        {isHighConfidence && (
                          <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-700 rounded font-sans font-bold tracking-wider">
                            CONFIRMED
                          </span>
                        )}
                      </div>
                      <h3 className={`text-xs font-bold font-sans mt-1.5 ${isWrongSide ? 'text-red-700' : 'text-slate-800'}`}>
                        {violation.type}
                      </h3>
                    </div>
                    
                    <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                      <Clock className="h-3 w-3 text-slate-400" />
                      {formatTimestamp(violation.timestamp)}
                    </span>
                  </div>

                  {/* Body description */}
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] font-sans text-slate-650 mt-2 bg-white p-2 rounded border border-slate-200/60">
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold">PLATE:</span>{' '}
                      <span className="text-[#2874f0] font-bold font-mono">{violation.plate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] font-bold">CONFIDENCE:</span>{' '}
                      <span className={`font-mono font-bold ${isHighConfidence ? 'text-emerald-600' : 'text-[#2874f0]'}`}>
                        {(violation.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 text-[10px] font-bold">VEHICLE:</span>{' '}
                      <span className="text-slate-700 font-medium">{violation.vehicle}</span>
                    </div>
                    <div className="col-span-2 flex items-center gap-1 mt-0.5">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span className="text-slate-500 text-[10px]">
                        {violation.camera === 'CAM-BEGUM-AMIN-ROAD' ? 'Begum Amin Road Cam' : violation.camera.replace('CAM-0', 'CAM ').replace('-NORTH', '').replace('-EAST', '')} (<span className="font-mono text-[9px]">{violation.gps.lat.toFixed(4)}, {violation.gps.lng.toFixed(4)}</span>)
                      </span>
                    </div>
                  </div>

                  {/* Actions Row */}
                  <div className="flex justify-between items-center mt-2.5 pt-2.5 border-t border-slate-200/60">
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                      PENDING ACTION
                    </span>
                    <div className="flex gap-1.5">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          alert(`E-Challan successfully issued for vehicle ${violation.plate}.`);
                        }}
                        className="px-2 py-1 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-[9px] font-black uppercase tracking-wider rounded transition-all cursor-pointer shadow-sm hover:shadow font-sans"
                      >
                        Issue E-Challan
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleExportPDF(violation);
                        }}
                        className="px-2 py-1 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700 text-[9px] font-bold uppercase tracking-wider rounded border border-slate-200 transition-all cursor-pointer font-sans"
                      >
                        Export PDF
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
