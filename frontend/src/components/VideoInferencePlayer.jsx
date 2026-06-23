import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, ShieldAlert, Layers, Activity, Tv, Power } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function VideoInferencePlayer({ latestViolation, frameIndex, activeCamera, setActiveCamera, isFeedActive, isStreaming, onToggleStreaming, onFrameUpdate }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [showGrid, setShowGrid] = useState(false);
  const [showAlertHUD, setShowAlertHUD] = useState(false);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);

  // Trigger HUD alarm flash when a new critical/high violation occurs
  useEffect(() => {
    if (isFeedActive && latestViolation && (latestViolation.severity === 'critical' || latestViolation.severity === 'high')) {
      setShowAlertHUD(true);
      const timer = setTimeout(() => setShowAlertHUD(false), 1500);
      return () => clearTimeout(timer);
    }
  }, [latestViolation, isFeedActive]);

  // Handle video source reload when camera changes
  useEffect(() => {
    const video = videoRef.current;
    if (video && isFeedActive) {
      video.load();
    }
  }, [activeCamera]);

  // Handle Play/Pause side-effects explicitly for dynamically mounted video tags
  useEffect(() => {
    const video = videoRef.current;
    if (video && isFeedActive) {
      video.muted = true;
      if (isPlaying && isStreaming) {
        video.play().catch((err) => {
          if (err.name !== 'AbortError') {
            console.warn("Autoplay blocked or play failed: ", err);
          }
        });
      } else {
        video.pause();
      }
    }
  }, [isPlaying, isFeedActive, isStreaming]);

  // Handle canvas rendering of tracking boxes and overlay diagnostics
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationId;

    // Set canvas dimensions
    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight || (canvas.parentElement.clientWidth * 3) / 4;
      }
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Mock active normal vehicles to draw on the screen
    const normalVehicles = [
      { id: 1, base: [120, 160], speed: 1.2, type: 'car' },
      { id: 2, base: [320, 90], speed: 0.7, type: 'truck' },
      { id: 3, base: [480, 220], speed: 1.9, type: 'moto' },
      { id: 4, base: [600, 140], speed: 1.0, type: 'car' }
    ];

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (!isFeedActive) {
        animationId = requestAnimationFrame(render);
        return;
      }

      if (showGrid) {
        // Draw very subtle grid if explicitly toggled on
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.04)';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < canvas.width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y < canvas.height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw Normal Traffic Bounding Boxes (only for simulated standalone cameras)
      if (isPlaying && activeCamera !== 'CAM-BEGUM-AMIN-ROAD') {
        normalVehicles.forEach(v => {
          const xProgress = (v.base[0] + (frameIndex * v.speed * 2)) % (canvas.width + 100) - 50;
          const y = v.base[1] + (xProgress * 0.08); // slight angle
          const w = 65;
          const h = 45;

          // Subtle slate bounding box
          ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
          ctx.lineWidth = 1;
          ctx.strokeRect(xProgress, y, w, h);

          // Small metadata label
          ctx.fillStyle = 'rgba(71, 85, 105, 0.5)';
          ctx.font = '8px sans-serif';
          ctx.fillText(v.type, xProgress + 2, y - 4);
        });
      }

      // Draw active/latest violation bounding box on canvas (only for CAM-01/02 mock streams)
      // Begum Amin Road Cam has pixel-perfect annotations pre-baked directly in the video file
      if (latestViolation && latestViolation.camera === activeCamera && activeCamera !== 'CAM-BEGUM-AMIN-ROAD') {
        const [vx, vy, vw, vh] = latestViolation.bbox;
        const scaleX = canvas.width / 800;
        const scaleY = canvas.height / 450;
        const x = vx * scaleX;
        const y = vy * scaleY;
        const w = vw * scaleX;
        const h = vh * scaleY;

        const isCritical = latestViolation.severity === 'critical' || latestViolation.severity === 'high';
        const strokeColor = isCritical ? '#ef4444' : '#2874f0';

        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, w, h);

        ctx.fillStyle = strokeColor;
        ctx.fillRect(x, y - 18, w, 18);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText(
          `${latestViolation.type.toUpperCase()} ${(latestViolation.confidence * 100).toFixed(0)}%`,
          x + 5,
          y - 5
        );

        ctx.fillStyle = 'rgba(30, 41, 59, 0.9)';
        ctx.fillRect(x, y + h, w, 16);
        ctx.strokeStyle = strokeColor;
        ctx.strokeRect(x, y + h, w, 16);
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px monospace';
        ctx.fillText(
          `${latestViolation.plate} | ${latestViolation.speed} km/h`,
          x + 4,
          y + h + 12
        );
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [latestViolation, frameIndex, activeCamera, showGrid, isPlaying, isFeedActive]);

  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="relative flex flex-col h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
      {/* Header telemetry info bar */}
      <div className="flex justify-between items-center px-4 py-2.5 bg-slate-50 border-b border-slate-200 text-[11px] font-sans text-slate-500">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isPlaying && isFeedActive ? 'bg-emerald-400' : 'bg-amber-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isPlaying && isFeedActive ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
          </span>
          <span className="font-semibold text-slate-700 text-[10px] tracking-wider uppercase">Live Video Stream</span>
          <span className="text-slate-350">|</span>
          <span className="text-[#2874f0] font-mono font-bold">{activeCamera}</span>
        </div>
        <div className="flex items-center gap-4 font-mono text-[10px]">
          <span>FPS: <strong className="text-slate-700 font-bold">{isPlaying && isFeedActive && isStreaming ? '30.0' : '0.0'}</strong></span>
          <span>LATENCY: <strong className="text-[#2874f0] font-bold">{isFeedActive ? '42ms' : '--'}</strong></span>
          <span>RESOLUTION: <strong className="text-slate-700 font-bold">{isFeedActive ? '1920x1080' : 'STANDBY'}</strong></span>
        </div>
      </div>

      {/* Main Video & Canvas Container */}
      <div className="relative w-full aspect-[4/3] bg-slate-950 flex items-center justify-center overflow-hidden">
        {/* Standby/Idle Scanning State Placeholder */}
        {!isFeedActive && (
          <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center p-6 text-center z-30 select-none">
            <div className="absolute inset-0 bg-gradient-to-tr from-slate-200/5 to-[#2874f0]/5 pointer-events-none opacity-40" />
            <div className="w-14 h-14 border border-dashed border-slate-300 rounded-full flex items-center justify-center mb-3.5 animate-spin" style={{ animationDuration: '8s' }}>
              <Tv className="h-5 w-5 text-slate-400" />
            </div>
            <h3 className="text-xs font-bold text-slate-700 font-sans tracking-wider uppercase">Surveillance Standby Mode</h3>
            <p className="text-[11px] text-slate-500 max-w-sm mt-1.5 leading-relaxed font-sans">
              OMNI-GAZE node is standby. Click the <strong className="text-[#2874f0] font-bold">Begum Amin Road Cam</strong> node on the map widget to connect the live CCTV video feed.
            </p>
            <div className="absolute bottom-4 left-4 right-4 flex justify-between font-mono text-[8px] text-slate-400">
              <span>SCAN_NODE: STANDBY</span>
              <span>GEOPLOT_LINK_WAIT</span>
            </div>
          </div>
        )}

        {/* Flashing screen boundary overlay for critical alarms */}
        <AnimatePresence>
          {showAlertHUD && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.3, 0, 0.3, 0] }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.2 }}
              className="absolute inset-0 pointer-events-none border-2 border-red-500/30 bg-red-500/5 z-20"
            />
          )}
        </AnimatePresence>

        {/* Real video background loop (object-contain ensures the vertical video fits fully) */}
        {isFeedActive && (
          <video
            ref={videoRef}
            src="/cctv_1_processed.mp4"
            autoPlay
            muted
            playsInline
            onTimeUpdate={(e) => {
              const frame = Math.floor(e.target.currentTime * 30);
              if (onFrameUpdate) onFrameUpdate(frame);
              // Loop after 22 seconds (660 frames)
              if (e.target.currentTime >= 22) {
                e.target.currentTime = 0;
                e.target.play().catch(() => {});
              }
            }}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none"
            onError={(e) => {
              console.log("video load failed, check public folder.");
            }}
          />
        )}

        {/* If the stream is stopped/paused, display the BTP logo placeholder overlay */}
        {isFeedActive && !isStreaming && (
          <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center p-6 text-center z-25 select-none">
            <img src="/Bengaluru-Traffic.webp" alt="BTP Logo" className="h-28 w-28 object-contain mb-3 opacity-90" />
            <h3 className="text-xs font-bold text-slate-350 font-sans tracking-widest uppercase">Telemetry Stream Stopped</h3>
            <p className="text-[10px] text-slate-500 mt-1 font-sans">ASTraM Telemetry Stream Paused. Type "start stream" in Chronos to resume.</p>
          </div>
        )}

        {/* Subtle shadow overlay to ensure text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/20 via-transparent to-transparent pointer-events-none z-10" />

        {/* Intercept Canvas Layer */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-15 pointer-events-none" />

        {/* HUD Alert Box (Critical event banner overlay) */}
        <AnimatePresence>
          {showAlertHUD && latestViolation && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: -10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-white border border-red-500/20 rounded-lg px-4 py-2 flex items-center gap-3 z-30 shadow-md backdrop-blur-md"
            >
              <ShieldAlert className="h-4.5 w-4.5 text-red-500 animate-pulse" />
              <div className="text-left font-sans">
                <p className="text-[10px] font-bold text-red-650 tracking-wider uppercase">VIOLATION DETECTED</p>
                <p className="text-[11px] text-slate-800 font-medium">
                  {latestViolation.type} | Plate: <span className="font-mono text-[#2874f0] font-bold">{latestViolation.plate}</span>
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Control Panel / Camera Switcher */}
      <div className="px-4 py-2.5 bg-white border-t border-slate-200 flex flex-wrap gap-4 items-center justify-between z-20">
        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            disabled={!isFeedActive}
            className={`p-2 rounded-lg border text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all duration-150 cursor-pointer ${
              !isFeedActive ? 'opacity-40 cursor-not-allowed border-slate-200' :
              isPlaying
                ? 'bg-slate-50 border-slate-200'
                : 'bg-blue-50 border-blue-200 text-[#2874f0]'
            }`}
            title={isPlaying ? "Pause Feed" : "Start Live Feed"}
          >
            {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </button>

          <button
            onClick={onToggleStreaming}
            disabled={!isFeedActive}
            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
              !isFeedActive ? 'opacity-40 cursor-not-allowed border-slate-200' :
              isStreaming
                ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100'
                : 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
            }`}
            title={isStreaming ? "Stop Stream" : "Start Stream"}
          >
            <Power className="h-4 w-4" />
          </button>

          <button
            onClick={() => setShowGrid(!showGrid)}
            disabled={!isFeedActive}
            className={`p-2 rounded-lg border transition-all duration-150 cursor-pointer ${
              !isFeedActive ? 'opacity-40 cursor-not-allowed border-slate-200' :
              showGrid
                ? 'bg-blue-50 border-blue-200 text-[#2874f0]'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:text-slate-600'
            }`}
            title="Toggle Grid Diagnostics"
          >
            <Layers className="h-4 w-4" />
          </button>
        </div>

        {/* Camera Selector Tabs */}
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 font-sans text-[10px] font-semibold">
          {['CAM-01-NORTH', 'CAM-02-EAST', 'CAM-BEGUM-AMIN-ROAD'].map((cam) => {
            const isSelected = activeCamera === cam;
            return (
              <button
                key={cam}
                onClick={() => {
                  setActiveCamera(cam);
                }}
                className={`px-3 py-1.5 rounded transition-all duration-150 cursor-pointer ${
                  isSelected
                    ? 'bg-white text-[#2874f0] border border-slate-200 shadow-sm font-bold'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {cam === 'CAM-BEGUM-AMIN-ROAD' ? 'CAM BEGUM AMIN ROAD' : cam.replace('CAM-0', 'CAM ').replace('-NORTH', '').replace('-EAST', '')}
              </button>
            );
          })}
        </div>

        {/* HUD Indicator Status */}
        <div className="flex items-center gap-2 text-[10px] font-sans text-slate-450">
          <Activity className="h-3.5 w-3.5 text-[#2874f0]" />
          <span className="font-bold">EDGE ANALYSIS: {isFeedActive ? 'ACTIVE' : 'STANDBY'}</span>
        </div>
      </div>
    </div>
  );
}
