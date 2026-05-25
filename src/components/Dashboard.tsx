import React from 'react';
import { Relay, SensorData } from '../types';
import { 
  Power, 
  Thermometer, 
  Droplets, 
  Activity, 
  Clock, 
  Wifi, 
  Lightbulb, 
  Cpu,
  RefreshCw
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';

interface DashboardProps {
  relays: Relay[];
  setRelays: React.Dispatch<React.SetStateAction<Relay[]>>;
  sensorData: SensorData;
  historyData: Array<{ time: string; temp: number; hum: number }>;
  onToggleRelay: (id: number) => void;
  isEspOnline: boolean;
  onRefreshData: () => void;
}

export default function Dashboard({
  relays,
  sensorData,
  historyData,
  onToggleRelay,
  isEspOnline,
  onRefreshData
}: DashboardProps) {

  // Modern Bento Theme Colors for Relays
  const getRelayColor = (type: string, status: boolean) => {
    if (!status) return 'bg-slate-900/45 border-white/5 text-slate-400 hover:border-white/10';
    switch (type) {
      case 'utama': return 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-[0_0_25px_-5px_rgba(245,158,11,0.15)]';
      case 'kamar': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_25px_-5px_rgba(16,185,129,0.15)]';
      case 'variasi1': return 'bg-blue-500/10 text-blue-400 border-blue-500/30 shadow-[0_0_25px_-5px_rgba(59,130,246,0.15)]';
      case 'variasi2': return 'bg-purple-500/10 text-purple-400 border-purple-500/30 shadow-[0_0_25px_-5px_rgba(168,85,247,0.15)]';
      default: return 'bg-teal-500/10 text-teal-400 border-teal-500/30 shadow-[0_0_25px_-5px_rgba(20,184,166,0.15)]';
    }
  };

  const getRelayIconColor = (type: string, status: boolean) => {
    if (!status) return 'text-slate-600 bg-slate-950/40 border-white/5';
    switch (type) {
      case 'utama': return 'text-amber-400 bg-amber-500/20 border-amber-500/30 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'kamar': return 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]';
      case 'variasi1': return 'text-blue-400 bg-blue-500/20 border-blue-500/30 drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'variasi2': return 'text-purple-400 bg-purple-500/20 border-purple-500/30 drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]';
      default: return 'text-teal-400 bg-teal-500/20 border-teal-500/30';
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn" id="web-dashboard">
      {/* Upper Status Bar - Bento Styled Pill */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-3xl p-5 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="relative flex h-3 w-3">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isEspOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isEspOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-100 tracking-tight font-sans">ESP32 SmartHub Board</span>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 font-mono border border-white/5">192.168.1.134</span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
              <Wifi className="w-3.5 h-3.5 text-slate-500" /> RSSI: -58 dBm • Koneksi stabil
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="hidden sm:flex items-center gap-2 text-slate-400 bg-slate-950/60 px-3.5 py-1.5 rounded-xl border border-white/5">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Update: <span className="text-slate-100 font-semibold">{sensorData.lastUpdated}</span></span>
          </div>
          <button 
            type="button"
            onClick={onRefreshData}
            id="btn-refresh-dashboard"
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition-all text-slate-200 cursor-pointer shadow-md font-sans border border-white/10 hover:border-white/20"
          >
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400" />
            <span className="font-medium text-xs">Paksa Refresh</span>
          </button>
        </div>
      </div>

      {/* Sensor Gauges/Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Temperature Card */}
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl group transition-all duration-300 hover:border-red-500/20" id="card-temperature">
          <div className="absolute top-0 right-0 w-40 h-40 bg-red-500/5 rounded-full filter blur-3xl -mr-10 -mt-10 group-hover:bg-red-500/10 transition-colors duration-300" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 font-sans">Suhu Ruangan (DHT)</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-6xl sm:text-7xl font-sans font-light tracking-tighter text-slate-100 tabular-nums">
                  {sensorData.temperature.toFixed(1)}
                </span>
                <span className="text-2xl text-red-400 font-light ml-1">°C</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-sans">
                <span className={`w-2 h-2 rounded-full ${sensorData.temperature > 30 ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'}`} />
                <span>{sensorData.temperature > 30 ? 'Kondisi Hangat' : 'Kondisi Normal / Ideal'}</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400">
              <Thermometer className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar visualizer */}
          <div className="mt-8">
            <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-wider">
              <span>0°C (Min)</span>
              <span>50°C (Max)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-teal-500 via-amber-400 to-red-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, (sensorData.temperature / 50) * 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Humidity Card */}
        <div className="relative overflow-hidden bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl group transition-all duration-300 hover:border-blue-500/20" id="card-humidity">
          <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 rounded-full filter blur-3xl -mr-10 -mt-10 group-hover:bg-blue-500/10 transition-colors duration-300" />
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400 font-sans">Kelembaban Udara</span>
              <div className="flex items-baseline gap-1 mt-3">
                <span className="text-6xl sm:text-7xl font-sans font-light tracking-tighter text-slate-100 tabular-nums">
                  {sensorData.humidity.toFixed(0)}
                </span>
                <span className="text-2xl text-blue-400 font-light ml-1">%</span>
              </div>
              <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Sangat Nyaman (Kelembaban Ideal)</span>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Droplets className="w-6 h-6" />
            </div>
          </div>
          {/* Progress bar visualizer */}
          <div className="mt-8">
            <div className="flex justify-between text-[10px] text-slate-500 mb-2 font-mono uppercase tracking-wider">
              <span>0% (Sangat Kering)</span>
              <span>100% (Saturasi)</span>
            </div>
            <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${sensorData.humidity}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Relays Section */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span>Pengendali Relay Listrik (4 Channel)</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {relays.map((relay) => (
            <div 
              key={relay.id}
              id={`relay-card-${relay.id}`}
              className={`flex flex-col justify-between border rounded-[2rem] p-6 transition-all duration-300 shadow-xl ${getRelayColor(relay.type, relay.status)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-950/60 text-indigo-300 border border-white/5">
                      GPIO {relay.pin}
                    </span>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                      CH {relay.id}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-slate-100 mt-3.5 tracking-tight truncate max-w-[130px]" title={relay.name}>
                    {relay.name}
                  </h4>
                </div>
                <div className={`p-2.5 rounded-2xl border ${getRelayIconColor(relay.type, relay.status)}`}>
                  <Lightbulb className="w-5 h-5" />
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-white/5 flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400">
                  Status: <span className={`font-bold transition-colors ${relay.status ? 'text-emerald-400' : 'text-slate-500'}`}>{relay.status ? 'ON' : 'OFF'}</span>
                </span>
                <button
                  type="button"
                  id={`btn-relay-${relay.id}`}
                  onClick={() => onToggleRelay(relay.id)}
                  className={`relative inline-flex h-5.5 w-10 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-all duration-350 ease-in-out focus:outline-none ${relay.status ? 'bg-indigo-500' : 'bg-slate-800'}`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-4.5 w-4.5 transform rounded-full bg-white shadow-md ring-0 transition duration-300 ease-in-out ${relay.status ? 'translate-x-4.5 text-indigo-505' : 'translate-x-0'}`}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Historical Real-time Charts */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl relative overflow-hidden" id="card-charts">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <h3 className="text-base font-semibold text-slate-100 font-sans tracking-tight">Grafik Monitoring DHT Sensor</h3>
              <p className="text-xs text-slate-400">Data periodik suhu (°C) dan kelembaban (%) terbaru</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
              <span className="text-slate-300">Suhu (°C)</span>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-950/40 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400" />
              <span className="text-slate-300">Kelembaban (%)</span>
            </div>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f87171" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#f87171" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorHum" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.15}/>
                  <stop offset="95%" stopColor="#60a5fa" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#09090b', 
                  borderColor: 'rgba(255,255,255,0.08)', 
                  borderRadius: '16px',
                  color: '#f8fafc',
                  fontSize: '12px',
                  boxShadow: '0 10px 25px -5px rgba(0,0,0,0.4)'
                }} 
              />
              <Area 
                type="monotone" 
                dataKey="temp" 
                stroke="#f87171" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorTemp)" 
                name="Suhu (°C)"
              />
              <Area 
                type="monotone" 
                dataKey="hum" 
                stroke="#60a5fa" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHum)" 
                name="Kelembaban (%)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
