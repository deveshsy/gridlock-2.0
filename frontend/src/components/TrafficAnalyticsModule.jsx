import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { Activity, PieChart as PieIcon, TrendingUp, Info } from 'lucide-react';

export default function TrafficAnalyticsModule({ densityHistory, categoryBreakdown, stats }) {
  // Custom Tooltip component for Recharts
  const CustomAreaTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md font-sans text-[11px] text-left">
          <p className="text-slate-500 font-semibold mb-0.5 text-[10px]">LOCATION: <span className="text-[#2874f0] font-bold">Begum Amin Road</span></p>
          <p className="text-slate-500 font-semibold mb-1 text-[10px]">TIME: <span className="font-mono">{label}</span></p>
          <p className="text-[#2874f0] font-bold">
            DENSITY: <span className="text-slate-800 font-mono">{payload[0].value} veh</span>
          </p>
          {payload[1] && (
            <p className="text-red-500 font-bold">
              VIOLATIONS: <span className="text-slate-800 font-mono">{payload[1].value}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border border-slate-200 rounded-lg p-2.5 shadow-md font-sans text-[11px] text-left">
          <p className="font-bold mb-1" style={{ color: data.color || '#2874f0' }}>
            {data.name}
          </p>
          <p className="text-slate-600 font-medium">
            COUNT: <span className="text-slate-800 font-mono font-bold">{data.value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 h-full">
      {/* Component A: Traffic Density (Area Chart) */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4.5 w-4.5 text-[#2874f0]" />
            <h3 className="text-xs font-bold font-sans tracking-wider text-slate-800 uppercase">Traffic Volume Flow (Begum Amin Road)</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1 font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-slate-450" />
            FLOW: <span className="font-mono text-slate-700">{stats.systemThroughput} v/m</span>
          </span>
        </div>

        <div className="flex-1 w-full min-h-[200px] text-[10px] font-sans">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={densityHistory} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDensity" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2874f0" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2874f0" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorViolations" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#cbd5e1"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'sans-serif' }}
              />
              <YAxis
                stroke="#cbd5e1"
                tickLine={false}
                axisLine={false}
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'sans-serif' }}
              />
              <Tooltip content={<CustomAreaTooltip />} />
              <Area
                type="monotone"
                dataKey="density"
                stroke="#2874f0"
                strokeWidth={1.5}
                fillOpacity={1}
                fill="url(#colorDensity)"
              />
              <Area
                type="monotone"
                dataKey="violationsCount"
                stroke="#ef4444"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                fillOpacity={1}
                fill="url(#colorViolations)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Component B: Category Breakdown (Donut Chart) */}
      <div className="flex flex-col bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <PieIcon className="h-4.5 w-4.5 text-[#2874f0]" />
            <h3 className="text-xs font-bold font-sans tracking-wider text-slate-800 uppercase">Violation Categories</h3>
          </div>
          <span className="text-[10px] text-slate-500 font-sans flex items-center gap-1 font-semibold">
            <Info className="h-3 w-3" />
            AGGREGATED METRICS
          </span>
        </div>

        <div className="flex-1 flex flex-col sm:flex-row items-center justify-between min-h-[200px]">
          {/* Chart Canvas */}
          <div className="w-1/2 min-h-[170px] relative flex items-center justify-center">
            {categoryBreakdown.length === 0 ? (
              <span className="text-slate-400 font-sans text-[10px]">No active data</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<CustomPieTooltip />} />
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={52}
                    outerRadius={65}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            )}

            {/* Inner statistics value */}
            <div className="absolute flex flex-col items-center justify-center font-sans">
              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-bold">Alerts</span>
              <span className="text-xl font-bold font-mono text-slate-800">{stats.totalViolations}</span>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="w-full sm:w-1/2 flex flex-col justify-center gap-2.5 px-2 mt-4 sm:mt-0 max-h-[180px] overflow-y-auto scrollbar-thin">
            {categoryBreakdown.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-[10px] font-sans bg-slate-50 border border-slate-200 p-1.5 rounded">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-650 truncate font-semibold" title={item.name}>{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-slate-450">x</span>
                  <span className="text-slate-800 font-bold font-mono">{item.value}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
