import React, { useEffect, useRef, useState } from 'react';
import { Map, Navigation, ShieldAlert, Maximize2, Minimize2 } from 'lucide-react';
import GreenCorridorPanel from './GreenCorridorPanel';

export default function MapplsTrafficMap({ activeCamera, onCameraSelect, latestViolation, violationCount, greenCorridorActive, setGreenCorridorActive }) {
  const [mapLoaded, setMapLoaded] = useState(!!window.L);
  const [error, setError] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef({});
  const polylineRef = useRef(null);

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

      // Curated base cameras (28 nodes)
      const baseCameras = [
        { id: 'CAM-BEGUM-AMIN-ROAD', label: 'Begum Amin Road Cam', desc: 'Central Silk Board Junction Hub', position: [12.9180, 77.6244] },
        { id: 'CAM-ELECTRONIC-CITY', label: 'CAM Electronic City Gate', desc: 'Electronic City Toll Plaza Grid', position: [12.8452, 77.6639] },
        { id: 'CAM-INDIRANAGAR', label: 'CAM Indiranagar 100FT', desc: '100ft Road Indiranagar Metro Junction', position: [12.9719, 77.6412] },
        { id: 'CAM-MG-ROAD', label: 'CAM MG Road Metro', desc: 'MG Road Metro Station Grid', position: [12.9755, 77.6067] },
        { id: 'CAM-HEBBAL-FLYOVER', label: 'CAM Hebbal Flyover', desc: 'Hebbal Interchange Ring Road', position: [13.0359, 77.5978] },
        { id: 'CAM-WHITEFIELD-ITPL', label: 'CAM Whitefield ITPL', desc: 'ITPL Main Gate Crossing Sector', position: [12.9876, 77.7376] },
        { id: 'CAM-MAJESTIC-GATE', label: 'CAM Majestic Terminal', desc: 'KSR Bengaluru Station Road', position: [12.9779, 77.5724] },
        { id: 'CAM-YESHWANTHPUR', label: 'CAM Yeshwanthpur Crossing', desc: 'Yeshwanthpur Railway Junction Grid', position: [13.0234, 77.5503] },
        { id: 'CAM-SILK-BOARD', label: 'CAM Silk Board Flyover', desc: 'Central Silk Board Junction', position: [12.9176, 77.6225] },
        { id: 'CAM-KORAMANGALA', label: 'CAM Sony World Junction', desc: 'Koramangala 80ft Road Crossing', position: [12.9348, 77.6231] },
        { id: 'CAM-MARATHAHALLI', label: 'CAM Marathahalli Bridge', desc: 'Outer Ring Road - Marathahalli', position: [12.9592, 77.6974] },
        { id: 'CAM-BELLANDUR', label: 'CAM Bellandur Flyover', desc: 'Outer Ring Road Tech Corridor', position: [12.9279, 77.6803] },
        { id: 'CAM-SARJAPUR', label: 'CAM Ibblur Junction', desc: 'ORR - Sarjapur Road Intersection', position: [12.9197, 77.6712] },
        { id: 'CAM-DAIRY-CIRCLE', label: 'CAM Dairy Circle Flyover', desc: 'Hosur Main Road Transit Point', position: [12.9429, 77.6015] },
        { id: 'CAM-RICHMOND-RD', label: 'CAM Richmond Circle', desc: 'Richmond Road Flyover Hub', position: [12.9665, 77.6012] },
        { id: 'CAM-TOWN-HALL', label: 'CAM Town Hall Crossing', desc: 'JC Road - Corporation Circle', position: [12.9638, 77.5816] },
        { id: 'CAM-KR-PURAM', label: 'CAM KR Puram Bridge', desc: 'Hanging Bridge Outer Ring Road', position: [13.0006, 77.6750] },
        { id: 'CAM-KALYAN-NAGAR', label: 'CAM Kalyan Nagar', desc: 'Outer Ring Road North', position: [13.0236, 77.6411] },
        { id: 'CAM-MEKHRI-CIRCLE', label: 'CAM Mekhri Circle', desc: 'Bellary Road Airport Corridor', position: [13.0142, 77.5831] },
        { id: 'CAM-TUMKUR-ROAD', label: 'CAM Goraguntepalya', desc: 'Tumkur Main Road Gate', position: [13.0298, 77.5401] },
        { id: 'CAM-RAJAJINAGAR', label: 'CAM Rajajinagar 1st Block', desc: 'Dr. Rajkumar Road Sector', position: [13.0031, 77.5542] },
        { id: 'CAM-MALLESHWARAM', label: 'CAM Malleshwaram 8th Cross', desc: 'Margosa Road Market', position: [12.9984, 77.5711] },
        { id: 'CAM-BOMMANAHALLI', label: 'CAM Bommanahalli', desc: 'Hosur Road Expressway Entrance', position: [12.9030, 77.6243] },
        { id: 'CAM-JP-NAGAR', label: 'CAM JP Nagar 24th Main', desc: 'JP Nagar 3rd Phase Ring Road', position: [12.9069, 77.5901] },
        { id: 'CAM-BANASHANKARI', label: 'CAM Banashankari TTMC', desc: 'Kanakapura Road Junction', position: [12.9272, 77.5726] },
        { id: 'CAM-JAYANAGAR', label: 'CAM Jayanagar 4th Block', desc: 'Jayanagar Boulevard', position: [12.9298, 77.5912] },
        { id: 'CAM-DOMSLUR', label: 'CAM Domlur Flyover', desc: 'Inner Ring Road Segment', position: [12.9610, 77.6385] },
        { id: 'CAM-TRINITY', label: 'CAM Trinity Circle', desc: 'MG Road / Halasuru Junction', position: [12.9734, 77.6169] }
      ];

      // Define geographical ranges for major Bangalore sectors to place markers realistically
      const sectors = [
        { name: 'Koramangala', lat: [12.925, 12.940], lng: [77.610, 77.635] },
        { name: 'Indiranagar', lat: [12.960, 12.980], lng: [77.635, 77.650] },
        { name: 'Jayanagar', lat: [12.920, 12.935], lng: [77.580, 77.600] },
        { name: 'JP Nagar', lat: [12.895, 12.915], lng: [77.580, 77.600] },
        { name: 'HSR Layout', lat: [12.905, 12.918], lng: [77.630, 77.655] },
        { name: 'Whitefield', lat: [12.965, 12.990], lng: [77.710, 77.750] },
        { name: 'Electronic City', lat: [12.835, 12.855], lng: [77.650, 77.680] },
        { name: 'Hebbal', lat: [13.020, 13.045], lng: [77.585, 77.605] },
        { name: 'Banashankari', lat: [12.915, 12.935], lng: [77.555, 77.575] },
        { name: 'Malleshwaram', lat: [12.985, 13.010], lng: [77.565, 77.580] },
        { name: 'Rajajinagar', lat: [12.980, 13.005], lng: [77.545, 77.560] },
        { name: 'Kalyan Nagar', lat: [13.015, 13.030], lng: [77.630, 77.650] },
        { name: 'Marathahalli', lat: [12.945, 12.965], lng: [77.685, 77.710] },
        { name: 'Bellandur', lat: [12.920, 12.935], lng: [77.665, 77.685] },
        { name: 'Sarjapur Rd', lat: [12.905, 12.920], lng: [77.660, 77.690] },
        { name: 'Yelahanka', lat: [13.090, 13.110], lng: [77.585, 77.610] },
        { name: 'Ulsoor', lat: [12.970, 12.985], lng: [77.615, 77.630] },
        { name: 'Basavanagudi', lat: [12.935, 12.948], lng: [77.565, 77.580] }
      ];

      const generatedList = [];
      const countToGenerate = 100;
      
      // Seeded LCG random generator to ensure exact same coordinates on hot reload / re-renders
      let rSeed = 101;
      const getSeededRandom = () => {
        const x = Math.sin(rSeed++) * 10000;
        return x - Math.floor(x);
      };

      for (let i = 1; i <= countToGenerate; i++) {
        const sector = sectors[Math.floor(getSeededRandom() * sectors.length)];
        const latVal = sector.lat[0] + getSeededRandom() * (sector.lat[1] - sector.lat[0]);
        const lngVal = sector.lng[0] + getSeededRandom() * (sector.lng[1] - sector.lng[0]);
        
        const types = ['Junction Crossing', 'Underpass Link', 'Flyover Loop', 'Expressway Portal', 'Signal Block'];
        const typeSelected = types[Math.floor(getSeededRandom() * types.length)];
        
        generatedList.push({
          id: `CAM-GEN-${100 + i}`,
          label: `CAM ${sector.name} ${typeSelected} #${i}`,
          desc: `${sector.name} Sector Grid Sensor Node ${100 + i}`,
          position: [parseFloat(latVal.toFixed(6)), parseFloat(lngVal.toFixed(6))]
        });
      }

      const cameras = [...baseCameras, ...generatedList];

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
  }, [activeCamera, mapLoaded]);  // Handle Green Corridor route polyline overlay
  useEffect(() => {
    const map = mapRef.current;
    if (!mapLoaded || !map) return;

    const cleanupOverlay = () => {
      if (polylineRef.current) {
        try {
          if (typeof polylineRef.current.remove === 'function') {
            polylineRef.current.remove();
          } else if (typeof polylineRef.current.setMap === 'function') {
            polylineRef.current.setMap(null);
          } else if (polylineRef.current.clear === 'function') {
            polylineRef.current.clear();
          }
        } catch (e) {
          console.error("Error clearing map overlay:", e);
        }
        polylineRef.current = null;
      }
    };

    const renderRouteOnMap = (coords) => {
      cleanupOverlay();

      if (window.mappls && window.mappls.Polyline) {
        polylineRef.current = new window.mappls.Polyline({
          map: map,
          paths: coords,
          strokeColor: '#10b981',
          strokeWidth: 8,
          strokeOpacity: 0.8
        });
      } else if (window.L) {
        polylineRef.current = window.L.polyline(
          coords.map(c => [c.lat, c.lng]),
          {
            color: '#10b981',
            weight: 8,
            opacity: 0.8
          }
        ).addTo(map);
      }
    };

    const drawPolylineFallback = () => {
      const controlPoints = [
        { lat: 12.9180, lng: 77.6244 }, // Begum Amin Road Cam / Silk Board Junction
        { lat: 12.9177, lng: 77.6212 }, // ORR BTM Layout stretch
        { lat: 12.9176, lng: 77.6200 },
        { lat: 12.9174, lng: 77.6180 },
        { lat: 12.9172, lng: 77.6160 },
        { lat: 12.9170, lng: 77.6140 },
        { lat: 12.9168, lng: 77.6120 },
        { lat: 12.9166, lng: 77.6100 },
        { lat: 12.9165, lng: 77.6082 }, // BTM Layout Metro Station
        { lat: 12.9164, lng: 77.6055 },
        { lat: 12.9163, lng: 77.6030 },
        { lat: 12.9165, lng: 77.6008 }, // Jayadeva Hospital Junction (turning South onto Bannerghatta Road)
        { lat: 12.9145, lng: 77.6009 }, // Heading South along Bannerghatta Road
        { lat: 12.9120, lng: 77.6010 },
        { lat: 12.9090, lng: 77.6011 },
        { lat: 12.9060, lng: 77.6011 },
        { lat: 12.9030, lng: 77.6012 }, // Bilekahalli Area
        { lat: 12.9000, lng: 77.6012 },
        { lat: 12.8975, lng: 77.6006 },
        { lat: 12.8968, lng: 77.5995 }, // Approaching Apollo Hospital
        { lat: 12.8961, lng: 77.5985 }  // Apollo Hospital Entrance
      ];

      // Programmatically interpolate to get exactly 100 coordinates
      const routeCoords = [];
      const targetCount = 100;
      
      const segmentLengths = [];
      let totalLength = 0;
      for (let i = 0; i < controlPoints.length - 1; i++) {
        const dx = controlPoints[i+1].lat - controlPoints[i].lat;
        const dy = controlPoints[i+1].lng - controlPoints[i].lng;
        const len = Math.sqrt(dx*dx + dy*dy);
        segmentLengths.push(len);
        totalLength += len;
      }
      
      routeCoords.push({ ...controlPoints[0] });
      
      for (let j = 1; j < targetCount - 1; j++) {
        const targetDist = (j / (targetCount - 1)) * totalLength;
        let accumDist = 0;
        let segIndex = 0;
        while (segIndex < segmentLengths.length && accumDist + segmentLengths[segIndex] < targetDist) {
          accumDist += segmentLengths[segIndex];
          segIndex++;
        }
        if (segIndex >= segmentLengths.length) {
          segIndex = segmentLengths.length - 1;
        }
        
        const p1 = controlPoints[segIndex];
        const p2 = controlPoints[segIndex + 1];
        const segLength = segmentLengths[segIndex];
        
        let t = 0;
        if (segLength > 0) {
          t = (targetDist - accumDist) / segLength;
        }
        
        const lat = p1.lat + t * (p2.lat - p1.lat);
        const lng = p1.lng + t * (p2.lng - p1.lng);
        routeCoords.push({ lat, lng });
      }
      
      routeCoords.push({ ...controlPoints[controlPoints.length - 1] });

      renderRouteOnMap(routeCoords);
    };

    const fetchOSRMRoute = () => {
      const startLat = 12.9180;
      const startLng = 77.6244;
      const endLat = 12.8961;
      const endLng = 77.5985;
      
      const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${startLng},${startLat};${endLng},${endLat}?overview=full&geometries=geojson`;
      
      fetch(osrmUrl)
        .then(res => res.json())
        .then(data => {
          if (data && data.routes && data.routes.length > 0 && data.routes[0].geometry) {
            const geojsonCoords = data.routes[0].geometry.coordinates.map(coord => ({
              lat: coord[1],
              lng: coord[0]
            }));
            renderRouteOnMap(geojsonCoords);
          } else {
            console.warn("OSRM returned invalid route structure, using dense fallback.");
            drawPolylineFallback();
          }
        })
        .catch(err => {
          console.error("Failed to fetch dynamic OSRM route, falling back to static:", err);
          drawPolylineFallback();
        });
    };

    if (greenCorridorActive) {
      // Smoothly refocus center onto the transit area
      map.setView([12.9060, 77.6100], 14, { animate: true });

      // Use the direction plugin if available; otherwise draw the custom OSRM or Polyline fallback
      if (window.mappls && window.mappls.direction) {
        try {
          cleanupOverlay();
          window.mappls.direction({
            map: map,
            start: "12.9180,77.6244",
            end: "12.8961,77.5985",
            strokeColor: '#10b981',
            strokeWidth: 8,
            strokeOpacity: 0.8
          }, function(pluginInstance) {
            polylineRef.current = pluginInstance;
          });
        } catch (e) {
          console.error("Mappls direction plugin error, falling back to OSRM route:", e);
          fetchOSRMRoute();
        }
      } else {
        fetchOSRMRoute();
      }
    } else {
      // Tear down overlay
      cleanupOverlay();

      // Smoothly refocus back onto default camera position
      map.setView([12.9172, 77.6228], 14, { animate: true });
    }
  }, [greenCorridorActive, mapLoaded]);

  // Invalidate map size when toggling fullscreen to redraw map tiles properly
  useEffect(() => {
    if (mapRef.current) {
      setTimeout(() => {
        mapRef.current.invalidateSize({ animate: true });
      }, 250);
    }
  }, [isFullscreen]);

  // Handle auto-fullscreen when green corridor is activated
  useEffect(() => {
    if (greenCorridorActive) {
      setIsFullscreen(true);
    } else {
      setIsFullscreen(false);
    }
  }, [greenCorridorActive]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const wrapperClass = isFullscreen
    ? "fixed inset-0 z-[45] w-screen h-screen p-6 bg-white flex flex-col font-sans"
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
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-sans font-bold text-slate-600">
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

        {/* Overlay Green Corridor Panel */}
        {greenCorridorActive && (
          <div className="absolute top-4 right-4 z-[1000] w-80 h-[calc(100%-2rem)] max-h-[500px] shadow-2xl transition-all duration-300">
            <GreenCorridorPanel onCancel={() => setGreenCorridorActive && setGreenCorridorActive(false)} />
          </div>
        )}
      </div>

      {/* Map Legend */}
      <div className="mt-2.5 flex justify-between items-center text-[9px] font-sans font-bold text-slate-500 tracking-wider uppercase z-10">
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
