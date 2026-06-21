import React, { useState, useEffect } from 'react';
import { ShieldAlert, Activity, Cpu, Sparkles, Server, Clock, Power } from 'lucide-react';

// Import custom hooks and components
import useSimulatedInference from './hooks/useSimulatedInference';
import VideoInferencePlayer from './components/VideoInferencePlayer';
import LiveViolationLog from './components/LiveViolationLog';
import TrafficAnalyticsModule from './components/TrafficAnalyticsModule';
import ChronosRagAssistant from './components/ChronosRagAssistant';
import MapplsTrafficMap from './components/MapplsTrafficMap';

export default function App() {
  const [isStreaming, setIsStreaming] = useState(true);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [activeCamera, setActiveCamera] = useState('CAM-BEGUM-AMIN-ROAD');
  const [isFeedActive, setIsFeedActive] = useState(false);
  const [violationCount, setViolationCount] = useState(0);
  const [videoFrame, setVideoFrame] = useState(0);
  
  // Custom hook returns state updated by simulated WebSocket stream synced to the video frame index
  const {
    activeViolations,
    latestViolation,
    frameIndex,
    densityHistory,
    stats,
    categoryBreakdown,
  } = useSimulatedInference(isFeedActive && isStreaming, videoFrame, activeCamera);

  const [selectedViolation, setSelectedViolation] = useState(null);

  const handleSelectViolation = (violation) => {
    setSelectedViolation(violation);
    setActiveCamera(violation.camera);
    setIsAssistantOpen(true);
  };

  // Handle camera selection from Mappls interactive map
  const handleCameraSelect = (camId) => {
    setActiveCamera(camId);
    setIsFeedActive(true);
  };

  // Automatically activate feed if camera switches to Begum Amin Road
  useEffect(() => {
    if (activeCamera === 'CAM-BEGUM-AMIN-ROAD') {
      setIsFeedActive(true);
    }
  }, [activeCamera]);

  // Reactive Violation Counter
  useEffect(() => {
    if (latestViolation && isFeedActive) {
      setViolationCount(prev => prev + 1);
    }
  }, [latestViolation, isFeedActive]);

  // Live Timestamp formatting
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex flex-col font-sans antialiased overflow-x-hidden selection:bg-[#2874f0]/20 selection:text-[#2874f0]">
      {/* Flipkart Branded Top Header Header */}
      <header className="sticky top-0 z-30 w-full bg-[#2874f0] text-white shadow-md border-b-4 border-[#ffe500] px-6 py-4 flex flex-col xl:flex-row gap-4 justify-between items-center">
        <div className="flex items-center gap-3">
          <img src="/Bengaluru-Traffic.webp" alt="BTP Logo" className="h-9 w-9 object-contain border border-white/20 rounded-lg bg-white p-1" />
          <div className="text-left">
            <h1 className="text-sm md:text-base font-bold tracking-wider font-sans text-white flex items-center gap-2">
              ASTraM / OMNI-GAZE
            </h1>
            <p className="text-[9px] text-blue-100 font-sans tracking-widest font-semibold uppercase">Neural Network Traffic Monitoring Command Centre</p>
          </div>
        </div>

        {/* Global Telemetry Metrics */}
        <div className="flex flex-wrap gap-4 items-center text-xs font-sans">
          <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-blue-100" />
            <span className="text-white font-medium font-mono">{time.toLocaleTimeString()}</span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5">
            <Server className="h-3.5 w-3.5 text-blue-100" />
            <span className="text-blue-200 font-semibold uppercase tracking-wider text-[9px]">NODE:</span>
            <span className="text-white font-mono text-[11px]">EDGE-IN-SOUTH-1</span>
            <span className="text-[#ffe500] font-bold font-mono text-[10px] border-l border-white/25 pl-2">HEALTH {stats.healthScore}%</span>
          </div>

          <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-1.5">
            <span className="text-blue-200 font-bold uppercase tracking-wider text-[9px]">ACCURACY:</span>
            <span className="text-white font-bold font-mono text-[11px]">{stats.averageConfidence}%</span>
          </div>


        </div>
      </header>

      {/* Main Layout Container */}
      <main className="flex-1 p-6 space-y-6 max-w-7xl mx-auto w-full">
        {/* Bento Stats Row */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* MapmyIndia spatial tracking MapWidget (spans 2 columns) */}
          <div className="lg:col-span-2">
            <MapplsTrafficMap
              activeCamera={activeCamera}
              onCameraSelect={handleCameraSelect}
              latestViolation={latestViolation}
              violationCount={violationCount}
            />
          </div>

          {/* Card 1: Total Alerts */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#2874f0]/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <Activity className="h-10 w-10 text-blue-500" />
            </div>
            <p className="text-[10px] font-sans text-slate-400 font-bold uppercase tracking-wider text-left">TOTAL INFERENCES LOGGED</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-slate-800 tracking-tight">{isFeedActive ? stats.totalViolations : 0}</span>
              <span className="text-[10px] font-sans text-emerald-600 font-bold font-medium">+100% (LIVE)</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Processed across 4 camera nodes in the last 60 minutes.</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-[#2874f0] rounded-full transition-all duration-300" style={{ width: isFeedActive ? '68%' : '0%' }} />
            </div>
          </div>

          {/* Card 2: Active Risks */}
          <div className="bg-white border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between shadow-sm relative overflow-hidden group hover:border-[#2874f0]/30 transition-all">
            <div className="absolute top-0 right-0 p-3 opacity-5">
              <ShieldAlert className="h-10 w-10 text-red-500" />
            </div>
            <p className="text-[10px] font-sans text-slate-400 font-bold uppercase tracking-wider text-left">CRITICAL RISK COUNT</p>
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-3xl font-bold font-mono text-red-600 tracking-tight">{isFeedActive ? stats.activeAlerts : 0}</span>
              <span className="text-[9px] font-sans text-red-500 font-bold uppercase tracking-wider">ACTION REQUIRED</span>
            </div>
            <p className="text-xs text-slate-400 mt-2">Dispatched to nearest BTP rapid response unit.</p>
            <div className="h-1.5 w-full bg-slate-100 rounded-full mt-3 overflow-hidden">
              <div className="h-full bg-red-500 rounded-full transition-all duration-300" style={{ width: isFeedActive ? `${Math.min(100, stats.activeAlerts * 12)}%` : '0%' }} />
            </div>
          </div>
        </section>

        {/* Workspace Bento Section */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
          {/* Main surveillance feed */}
          <div className="xl:col-span-8 flex flex-col">
            <VideoInferencePlayer
              latestViolation={latestViolation}
              frameIndex={frameIndex}
              activeCamera={activeCamera}
              setActiveCamera={setActiveCamera}
              isFeedActive={isFeedActive}
              isStreaming={isStreaming}
              onToggleStreaming={() => setIsStreaming(!isStreaming)}
              onFrameUpdate={setVideoFrame}
            />
          </div>

          {/* Real-time event log */}
          <div className="xl:col-span-4 flex flex-col">
            <LiveViolationLog
              activeViolations={isFeedActive ? activeViolations : []}
              onSelectViolation={handleSelectViolation}
            />
          </div>
        </section>

        {/* Analytics Section */}
        <section className="w-full">
          <TrafficAnalyticsModule
            densityHistory={isFeedActive ? densityHistory : []}
            categoryBreakdown={isFeedActive ? categoryBreakdown : []}
            stats={stats}
          />
        </section>
      </main>

      {/* RAG Copilot Slide-out Sidebar Panel */}
      <ChronosRagAssistant
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
        activeViolations={isFeedActive ? activeViolations : []}
        onActivateCamera={(camName) => {
          setActiveCamera(camName);
          setIsFeedActive(true);
        }}
        isStreaming={isStreaming}
        onSetStreaming={setIsStreaming}
      />

      {/* Footer bar */}
      <footer className="mt-auto py-6 border-t border-slate-200 bg-white text-center font-sans text-[9px] text-slate-500 flex flex-col sm:flex-row justify-between items-center px-6 gap-3">
        <p className="flex items-center gap-1.5 font-semibold">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block animate-pulse" />
          INFRASTRUCTURE OPERATIONAL & SECURED VIA BTP TECH DIVISION
        </p>
        <div className="flex flex-col items-center gap-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md shadow-sm">
          <span className="text-[8px] font-bold text-slate-455 tracking-widest uppercase font-sans leading-none">
            Powered By
          </span>
          <img 
            src="/flipkart_LOGO.webp" 
            alt="Flipkart Logo" 
            className="h-14 w-auto object-contain" 
          />
        </div>
        <p>© 2026 ASTraM / OMNI-GAZE INC. BENGALURU TRAFFIC POLICE TMC CONTROL PANEL.</p>
      </footer>

      {/* Floating Mascot Widget */}
      {!isAssistantOpen && (
        <div 
          onClick={() => setIsAssistantOpen(true)}
          className="fixed bottom-6 right-6 bg-white/5 backdrop-blur-[2px] p-2.5 rounded-2xl border border-white/10 flex items-center justify-center z-40 cursor-pointer group transition-all duration-200 select-none hover:scale-[1.02] shadow-sm animate-bounce"
          style={{ animationDuration: '3s' }}
        >
          <div className="relative">
            <img 
              src="/ask_chronos.png" 
              alt="Ask Chronos Mascot" 
              className="h-28 md:h-32 w-auto object-contain transition-all duration-200 filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
            />
            {/* Live status pulsing dot */}
            <span className="absolute bottom-1.5 right-1.5 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-white animate-pulse" />
          </div>
        </div>
      )}
    </div>
  );
}
