import React, { useEffect, useRef, useState } from 'react';
import { Map, Navigation, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';

export default function MapplsTrafficMap({ activeCamera, onCameraSelect, latestViolation, violationCount }) {
  const [mapLoaded, setMapLoaded] = useState(!!window.L);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});

  // Poll for window.L (Leaflet) script load
  useEffect(() => {
    if (window.L) {
      setMapLoaded(true);
      return;
    }

    const interval = setInterval(() => {
      if (window.L) {
        setMapLoaded(true);
        clearInterval(interval);
      }
    }, 100);

    const timeout = setTimeout(() => {
      if (!window.L) {
        setError('Failed to load MapmyIndia vector engine.');
        clearInterval(interval);
      }
    }, 5000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapLoaded || !window.L || !mapContainerRef.current) return;
    if (mapRef.current) return;

    try {
      // Initialize map centered directly on Begum Amin Road near Silk Board Junction
      const mapObj = window.L.map(mapContainerRef.current, {
        zoomControl: true,
        attributionControl: false
      }).setView([12.9180, 77.6244], 14); // Focused Zoom level 14 centered at Begum road

      mapRef.current = mapObj;

      // Add clean OpenStreetMap tile layer
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19
      }).addTo(mapObj);

      // Scattered Cameras across Bengaluru (each routes to the annotated video)
      const cameras = [
        { id: 'CAM-BEGUM-AMIN-ROAD', label: 'Begum Amin Road Cam', desc: 'Central Silk Board Junction Hub', position: [12.9180, 77.6244] },
        { id: 'CAM-ELECTRONIC-CITY', label: 'CAM Electronic City Gate', desc: 'Electronic City Toll Plaza Grid', position: [12.8452, 77.6639] },
        { id: 'CAM-INDIRANAGAR', label: 'CAM Indiranagar 100FT', desc: '100ft Road Indiranagar Metro Junction', position: [12.9719, 77.6412] },
        { id: 'CAM-MG-ROAD', label: 'CAM MG Road Metro', desc: 'MG Road Metro Station Grid', position: [12.9755, 77.6067] },
        { id: 'CAM-HEBBAL-FLYOVER', label: 'CAM Hebbal Flyover', desc: 'Hebbal Interchange Ring Road', position: [13.0359, 77.5978] },
        { id: 'CAM-WHITEFIELD-ITPL', label: 'CAM Whitefield ITPL', desc: 'ITPL Main Gate Crossing Sector', position: [12.9876, 77.7376] },
        { id: 'CAM-MAJESTIC-GATE', label: 'CAM Majestic Terminal', desc: 'KSR Bengaluru Station Road', position: [12.9779, 77.5724] },
        { id: 'CAM-YESHWANTHPUR', label: 'CAM Yeshwanthpur Crossing', desc: 'Yeshwanthpur Railway Junction Grid', position: [13.0234, 77.5503] }
      ];

      // Add circle markers (bypasses default Leaflet icon CDN asset loading bugs)
      const markerGroup = {};
      cameras.forEach((cam) => {
        const isSelected = activeCamera === cam.id;
        
        const marker = window.L.circleMarker(cam.position, {
          radius: isSelected ? 10 : 7,
          fillColor: isSelected ? '#2874f0' : '#10b981',
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        })
        .addTo(mapObj)
        .bindPopup(`
          <div style="font-family: sans-serif; padding: 4px; font-size: 11px; color: #1e293b; text-align: left; min-width: 155px;">
            <strong style="color: #2874f0; text-transform: uppercase;">${cam.label}</strong><br/>
            <span style="font-size: 9px; color: #64748b;">${cam.desc}</span><br/>
            <div style="margin-top: 5px; font-weight: bold; color: #10b981;">● FEED OPERATIONAL</div>
          </div>
        `);

        // Trigger react state update on marker click
        marker.on('click', () => {
          if (onCameraSelect) {
            onCameraSelect(cam.id);
          }
        });

        markerGroup[cam.id] = marker;
      });

      markersRef.current = markerGroup;

      // Auto-open active camera popup on initial load
      if (activeCamera && markerGroup[activeCamera]) {
        markerGroup[activeCamera].openPopup();
      }

    } catch (e) {
      console.error("MapmyIndia initialization error:", e);
      setError("Error initializing MapmyIndia Map view");
    }
  }, [mapLoaded, onCameraSelect]);

  // Handle active camera highlighting and centering dynamically
  useEffect(() => {
    const map = mapRef.current;
    const markers = markersRef.current;
    if (map && activeCamera && markers[activeCamera]) {
      const activeMarker = markers[activeCamera];
      
      // Update styling to highlight the active camera
      Object.keys(markers).forEach((camId) => {
        const marker = markers[camId];
        const isSelected = camId === activeCamera;
        marker.setStyle({
          fillColor: isSelected ? '#2874f0' : '#10b981',
          radius: isSelected ? 10 : 7
        });
      });

      activeMarker.openPopup();
      map.setView(activeMarker.getLatLng(), map.getZoom(), { animate: true });
    }
  }, [activeCamera, mapLoaded]);

  // Invalidate map size when toggling fullscreen to redraw map tiles properly
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize({ animate: true });
      }, 250);
    }
  }, [isFullscreen]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-[999] w-screen h-screen p-6 bg-white flex flex-col font-sans"
    : "bg-white border border-slate-200 rounded-xl p-4 flex flex-col h-full relative overflow-hidden shadow-sm font-sans";

  return (
    <div className={wrapperClass}>
      {/* Header */}
      <div className="flex justify-between items-center mb-3.5 z-10">
        <div className="flex items-center gap-2">
          <img src="/mappls-logo.svg" alt="Mappls Logo" className="h-5.5 w-auto object-contain" />
          <div className="text-left font-sans">
            <h3 className="text-xs font-bold tracking-wider text-slate-800 uppercase font-sans">Bengaluru Spatial Map</h3>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition-all cursor-pointer shadow-sm flex items-center gap-1.5 text-[9px] font-sans font-bold uppercase tracking-wider bg-white"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="h-3.5 w-3.5" />
                <span>Exit Fullscreen</span>
              </>
            ) : (
              <>
                <Maximize2 className="h-3.5 w-3.5" />
                <span>Fullscreen</span>
              </>
            )}
          </button>
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-sans font-bold text-slate-650">
            <Navigation className="h-2.5 w-2.5 text-[#2874f0]" />
            <span>LIVE RADAR</span>
          </div>
        </div>
      </div>

      {/* Map Element */}
      <div className="flex-1 relative bg-slate-100 rounded-lg border border-slate-200 overflow-hidden min-h-[220px] flex items-center justify-center">
        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-sans z-10">
            <ShieldAlert className="h-8 w-8 text-red-500 mb-2 animate-bounce" />
            <p className="text-xs font-semibold">{error}</p>
          </div>
        ) : !mapLoaded ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-slate-500 font-sans z-10 bg-slate-100">
            <div className="w-8 h-8 border-2 border-[#2874f0] border-t-transparent rounded-full animate-spin mb-2" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-[#2874f0] animate-pulse">Loading MapmyIndia Tiles...</p>
          </div>
        ) : null}

        {/* Map Container Div */}
        <div ref={mapContainerRef} className="absolute inset-0 w-full h-full z-0" />
      </div>

      {/* Map Legend */}
      <div className="mt-2.5 flex justify-between items-center text-[9px] font-sans font-bold text-slate-450 tracking-wider uppercase z-10">
        <span className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[#2874f0]" /> Click Node to Monitor Feed
        </span>
        <span className="text-[8px] font-black text-[#2874f0] font-sans tracking-wide">
          MAPMYINDIA VECTOR SDK v3.0.1
        </span>
      </div>
    </div>
  );
}
