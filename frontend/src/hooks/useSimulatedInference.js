import { useState, useEffect, useRef } from 'react';

// Synced violations inside the 22-second (660 frames) loop of output_annotated.mp4
const SYNCED_VIOLATIONS = [
  {
    frame: 63,
    type: "Triple Riding",
    vehicle: "Black Motorcycle (Hero Splendor)",
    plate: "KA-03-HA-8821",
    severity: "critical",
    bbox: [130, 183, 144, 269], // [xmin, ymin, w, h] from [130, 183, 274, 452]
    gps: { lat: 12.9180, lng: 77.6244 },
    confidence: 0.82,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 28
  },
  {
    frame: 156,
    type: "No Helmet",
    vehicle: "Red Sportbike (Yamaha FZ)",
    plate: "KA-05-JK-9045",
    severity: "high",
    bbox: [266, 1016, 59, 109], // [xmin, ymin, w, h] from [266, 1016, 325, 1125]
    gps: { lat: 12.9182, lng: 77.6246 },
    confidence: 0.75,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 32
  },
  {
    frame: 193,
    type: "Wrong-Side Driving",
    vehicle: "Black Scooter (Honda Activa)",
    plate: "KA-51-EF-1044",
    severity: "critical",
    bbox: [30, 392, 252, 87], // [xmin, ymin, w, h] from [30, 392, 282, 479]
    gps: { lat: 12.9178, lng: 77.6240 },
    confidence: 0.92,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 35
  },
  {
    frame: 206,
    type: "No Helmet",
    vehicle: "Blue Scooter (TVS Jupiter)",
    plate: "KA-01-MM-3344",
    severity: "high",
    bbox: [293, 924, 47, 86], // [xmin, ymin, w, h] from [293, 924, 340, 1010]
    gps: { lat: 12.9184, lng: 77.6248 },
    confidence: 0.75,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 24
  },
  {
    frame: 567,
    type: "Wrong-Side Driving",
    vehicle: "White Sedan (Suzuki Dzire)",
    plate: "KA-53-MD-0988",
    severity: "critical",
    bbox: [201, 440, 223, 39], // [xmin, ymin, w, h] from [201, 440, 424, 479]
    gps: { lat: 12.9179, lng: 77.6242 },
    confidence: 0.92,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 42
  }
];

const getHistoricalViolations = () => [
  {
    id: "VIOL-2026-098",
    timestamp: new Date(Date.now() - 120000).toISOString(),
    type: "Red Light Violation",
    vehicle: "Yellow Taxi (Toyota Camry)",
    plate: "KA-03-MM-1212",
    severity: "high",
    bbox: [320, 180, 140, 100],
    gps: { lat: 12.9180, lng: 77.6244 },
    confidence: 0.94,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 45
  },
  {
    id: "VIOL-2026-097",
    timestamp: new Date(Date.now() - 300000).toISOString(),
    type: "Illegal Parking",
    vehicle: "White Delivery Van",
    plate: "KA-51-ZZ-9900",
    severity: "medium",
    bbox: [450, 220, 200, 130],
    gps: { lat: 12.9182, lng: 77.6246 },
    confidence: 0.91,
    camera: "CAM-BEGUM-AMIN-ROAD",
    speed: 0
  }
];

const BASE_TIMELINE = [
  { second: 0, density: 4 },
  { second: 1, density: 4 },
  { second: 2, density: 5 },
  { second: 3, density: 5 },
  { second: 4, density: 5 },
  { second: 5, density: 6 },
  { second: 6, density: 8 },
  { second: 7, density: 8 },
  { second: 8, density: 7 },
  { second: 9, density: 6 },
  { second: 10, density: 5 },
  { second: 11, density: 4 },
  { second: 12, density: 4 },
  { second: 13, density: 5 },
  { second: 14, density: 5 },
  { second: 15, density: 6 },
  { second: 16, density: 7 },
  { second: 17, density: 7 },
  { second: 18, density: 6 },
  { second: 19, density: 8 },
  { second: 20, density: 8 },
  { second: 21, density: 6 }
];

export default function useSimulatedInference(isStreaming = true, externalFrameIndex = 0, activeCamera = 'CAM-BEGUM-AMIN-ROAD') {
  const historicalList = getHistoricalViolations();
  const [activeViolations, setActiveViolations] = useState([]);
  const [latestViolation, setLatestViolation] = useState(null);
  const [frameIndex, setFrameIndex] = useState(0);
  const [densityHistory, setDensityHistory] = useState([]);
  const [stats, setStats] = useState({
    totalViolations: historicalList.length,
    activeAlerts: historicalList.filter(v => v.severity === 'critical' || v.severity === 'high').length,
    averageConfidence: 92.5,
    systemThroughput: 142,
    healthScore: 99.8,
  });

  const [categoryBreakdown, setCategoryBreakdown] = useState([]);

  // 1. Sync frameIndex with external video time updates
  useEffect(() => {
    if (isStreaming) {
      setFrameIndex(externalFrameIndex);
    }
  }, [externalFrameIndex, isStreaming]);

  // 3. Dynamically compute live violations & density history inside the video loop based on current frameIndex
  useEffect(() => {
    if (!isStreaming) {
      const hist = getHistoricalViolations();
      setActiveViolations(hist);
      setLatestViolation(null);
      // Static history when paused/standby - using real times
      const now = new Date();
      const staticData = [];
      for (let i = 9; i >= 0; i--) {
        const pointTime = new Date(now.getTime() - i * 1000);
        const timeStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        staticData.push({
          time: timeStr,
          density: BASE_TIMELINE[9 - i].density,
          violationsCount: (9 - i) > 5 ? 2 : 0
        });
      }
      setDensityHistory(staticData);
      return;
    }

    // Determine which violations are triggered in the current frame loop
    const liveViolations = [];
    let currentLatest = null;

    // Check triggers in reverse order to keep newest at the top
    if (frameIndex >= 567) {
      const v = SYNCED_VIOLATIONS[4];
      liveViolations.push({ ...v, camera: "CAM-BEGUM-AMIN-ROAD", id: "VIOL-CSB-105", timestamp: new Date(Date.now() - (660 - frameIndex) * 33).toISOString() });
      currentLatest = liveViolations[liveViolations.length - 1];
    }
    if (frameIndex >= 206) {
      const v = SYNCED_VIOLATIONS[3];
      liveViolations.push({ ...v, camera: "CAM-BEGUM-AMIN-ROAD", id: "VIOL-CSB-104", timestamp: new Date(Date.now() - (206 - frameIndex) * -33).toISOString() });
      if (!currentLatest) currentLatest = liveViolations[liveViolations.length - 1];
    }
    if (frameIndex >= 193) {
      const v = SYNCED_VIOLATIONS[2];
      liveViolations.push({ ...v, camera: "CAM-BEGUM-AMIN-ROAD", id: "VIOL-CSB-103", timestamp: new Date(Date.now() - (193 - frameIndex) * -33).toISOString() });
      if (!currentLatest) currentLatest = liveViolations[liveViolations.length - 1];
    }
    if (frameIndex >= 156) {
      const v = SYNCED_VIOLATIONS[1];
      liveViolations.push({ ...v, camera: "CAM-BEGUM-AMIN-ROAD", id: "VIOL-CSB-102", timestamp: new Date(Date.now() - (156 - frameIndex) * -33).toISOString() });
      if (!currentLatest) currentLatest = liveViolations[liveViolations.length - 1];
    }
    if (frameIndex >= 63) {
      const v = SYNCED_VIOLATIONS[0];
      liveViolations.push({ ...v, camera: "CAM-BEGUM-AMIN-ROAD", id: "VIOL-CSB-101", timestamp: new Date(Date.now() - (63 - frameIndex) * -33).toISOString() });
      if (!currentLatest) currentLatest = liveViolations[liveViolations.length - 1];
    }

    // Combine live and historical violations
    const combined = [...liveViolations, ...getHistoricalViolations()];
    setActiveViolations(combined);
    setLatestViolation(currentLatest);

    // Compute rolling density history linked directly to the video playback second - using real times
    const currentSec = Math.floor(frameIndex / 30) % 22;
    const rollingData = [];
    const now = new Date();
    for (let i = 9; i >= 0; i--) {
      const targetSec = (currentSec - i + 22) % 22;
      const basePoint = BASE_TIMELINE[targetSec];
      const activeLiveCount = SYNCED_VIOLATIONS.filter(v => v.frame <= targetSec * 30).length;

      const pointTime = new Date(now.getTime() - i * 1000);
      const timeStr = pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

      rollingData.push({
        time: timeStr,
        density: basePoint.density + Math.floor(Math.random() * 3) - 1, // subtle live jitter
        violationsCount: activeLiveCount
      });
    }
    setDensityHistory(rollingData);

    // Update stats dynamically
    const total = combined.length;
    const avgConf = combined.reduce((acc, v) => acc + v.confidence, 0) / total;
    const activeAl = combined.filter(v => v.severity === 'critical' || v.severity === 'high').length;

    setStats(prev => ({
      ...prev,
      totalViolations: total,
      activeAlerts: activeAl,
      averageConfidence: parseFloat((avgConf * 100).toFixed(1)),
      systemThroughput: isStreaming ? Math.floor(130 + Math.random() * 15) : 0,
      healthScore: parseFloat((99.5 + Math.random() * 0.4).toFixed(2)),
    }));
  }, [frameIndex, isStreaming]);

  // 4. Calculate Category Breakdown chart data whenever activeViolations changes
  useEffect(() => {
    const counts = {};
    activeViolations.forEach(v => {
      counts[v.type] = (counts[v.type] || 0) + 1;
    });

    const colors = {
      'Wrong-Side Driving': '#ef4444', // Red
      'Red Light Violation': '#f97316', // Orange
      'No Helmet': '#ffe500', // Yellow (Flipkart Yellow)
      'Triple Riding': '#2874f0', // Blue (Flipkart Blue)
      'Illegal Parking': '#64748b', // Slate
    };

    const formatted = Object.keys(counts).map(key => ({
      name: key,
      value: counts[key],
      color: colors[key] || '#3b82f6',
    }));

    setCategoryBreakdown(formatted);
  }, [activeViolations]);

  return {
    activeViolations,
    latestViolation,
    frameIndex,
    densityHistory,
    stats,
    categoryBreakdown,
  };
}
