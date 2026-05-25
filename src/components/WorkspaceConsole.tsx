import React, { useRef, useEffect } from 'react';
import { Relay, SensorData, LogEntry } from '../types';
import { 
  Sliders, 
  Terminal, 
  Sparkles, 
  Flame, 
  Gauge, 
  Trash2, 
  Play, 
  Info,
  Power
} from 'lucide-react';

interface WorkspaceConsoleProps {
  relays: Relay[];
  sensorData: SensorData;
  onSensorChange: (temp: number, hum: number) => void;
  logs: LogEntry[];
  onClearLogs: () => void;
  isEspOnline: boolean;
  setIsEspOnline: (online: boolean) => void;
  onAddLog: (source: LogEntry['source'], message: string, type?: LogEntry['type']) => void;
}

export default function WorkspaceConsole({
  relays,
  sensorData,
  onSensorChange,
  logs,
  onClearLogs,
  isEspOnline,
  setIsEspOnline,
  onAddLog
}: WorkspaceConsoleProps) {

  const logEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll logs
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const handleTempSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const temp = parseFloat(e.target.value);
    onSensorChange(temp, sensorData.humidity);
  };

  const handleHumSlider = (e: React.ChangeEvent<HTMLInputElement>) => {
    const hum = parseInt(e.target.value);
    onSensorChange(sensorData.temperature, hum);
  };

  const toggleEspState = () => {
    const newState = !isEspOnline;
    setIsEspOnline(newState);
    if (newState) {
      onAddLog('SYSTEM', 'ESP32 Berhasil Dihidupkan. Memulai inisialisasi pin...', 'success');
      onAddLog('WIFI', 'Mencari jaringan Wi-Fi: "SmartHome_WiFi"...', 'info');
      setTimeout(() => {
        onAddLog('WIFI', 'Terhubung ke WiFi! IP: 192.168.1.134, RSSI: -58 dBm', 'success');
        onAddLog('TELEGRAM', 'Menghubungkan ke API Telegram Bot...', 'info');
        onAddLog('TELEGRAM', 'Telegram Bot Client berhasil terhubung dan siap!', 'success');
      }, 1000);
    } else {
      onAddLog('SYSTEM', 'ESP32 dimatikan secara manual.', 'warning');
      onAddLog('WIFI', 'Koneksi jaringan terputus.', 'error');
    }
  };

  // Color mappings for bulb glows
  const getBulbColor = (type: string, status: boolean) => {
    if (!status) return 'from-slate-800 to-slate-950 text-slate-700 border-slate-700 shadow-none';
    switch (type) {
      case 'utama': return 'from-amber-400 to-amber-600 border-amber-300 text-amber-950 shadow-[0_0_35px_rgba(251,191,36,0.6)]';
      case 'kamar': return 'from-emerald-400 to-emerald-600 border-emerald-300 text-emerald-950 shadow-[0_0_35px_rgba(52,211,153,0.6)]';
      case 'variasi1': return 'from-blue-400 to-blue-600 border-blue-300 text-blue-950 shadow-[0_0_35px_rgba(96,165,250,0.6)]';
      case 'variasi2': return 'from-purple-400 to-purple-600 border-purple-300 text-purple-950 shadow-[0_0_35px_rgba(192,132,252,0.6)]';
      default: return 'from-indigo-400 to-indigo-600 border-indigo-300 text-indigo-950 shadow-[0_0_35px_rgba(99,102,241,0.6)]';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="hardware-simulator-root">
      
      {/* Sensor Sliders & Virtual Breadboard */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center gap-2 mb-4">
            <Sliders className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100 tracking-tight font-sans">Simulator Lingkungan DHT</h3>
          </div>
          <p className="text-xs text-slate-400 mb-5 leading-relaxed">
            Geser slider untuk mensimulasikan perubahan suhu dan kelembaban pada sensor DHT11/DHT22 fisik di lapangan. Perubahan akan langsung dikirim ke web monitoring dan Telegram Bot.
          </p>
 
          <div className="space-y-6">
            {/* Slide Suhu */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                  <Flame className="w-4 h-4 text-red-400" />
                  Suhu Udara (DHT)
                </span>
                <span className="text-sm font-mono font-bold text-red-400">{sensorData.temperature.toFixed(1)}°C</span>
              </div>
              <input 
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={sensorData.temperature}
                onChange={handleTempSlider}
                disabled={!isEspOnline}
                id="slider-temp"
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-red-500 disabled:opacity-45 disabled:cursor-not-allowed border border-white/5"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono uppercase tracking-wider">
                <span>0°C Dingin</span>
                <span>25°C Kamar</span>
                <span>50°C Panas</span>
              </div>
            </div>
 
            {/* Slide Kelembaban */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 font-sans">
                  <Gauge className="w-4 h-4 text-blue-400" />
                  Kelembaban Udara (DHT)
                </span>
                <span className="text-sm font-mono font-bold text-blue-400">{sensorData.humidity}%</span>
              </div>
              <input 
                type="range"
                min="10"
                max="100"
                step="1"
                value={sensorData.humidity}
                onChange={handleHumSlider}
                disabled={!isEspOnline}
                id="slider-hum"
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-blue-500 disabled:opacity-45 disabled:cursor-not-allowed border border-white/5"
              />
              <div className="flex justify-between text-[10px] text-slate-500 mt-1.5 font-mono uppercase tracking-wider">
                <span>10% Kering</span>
                <span>60% Normal</span>
                <span>100% Lembab</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* LED Bulb Output visualization */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2 font-sans tracking-tight">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>Instalasi Lampu Terkoneksi (5V)</span>
            </h3>
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full font-mono font-bold">
              4 CH Relay Active
            </span>
          </div>
 
          <div className="grid grid-cols-2 gap-4">
            {relays.map((relay) => (
              <div 
                key={relay.id}
                id={`bulb-panel-${relay.id}`}
                className={`flex flex-col items-center justify-center p-4 border rounded-2xl transition-all duration-300 bg-slate-950/20 relative overflow-hidden ${
                  relay.status ? 'border-indigo-500/30 shadow-[0_0_20px_-10px_rgba(99,102,241,0.2)]' : 'border-white/5'
                }`}
              >
                {/* Visual Bulb */}
                <div 
                  className={`w-14 h-14 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${getBulbColor(relay.type, relay.status)}`}
                >
                  <span className="text-2xl font-bold select-none leading-none">
                    {relay.status ? '💡' : '🔌'}
                  </span>
                </div>
 
                <span className="text-xs font-bold text-slate-200 mt-3.5 text-center truncate max-w-[120px]">
                  {relay.name}
                </span>
                
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${relay.status ? 'bg-indigo-400 animate-ping' : 'bg-slate-600'}`} />
                  <span className="text-[10px] font-mono font-semibold text-slate-500">
                    GPIO {relay.pin} • IN{relay.id}
                  </span>
                </div>
 
                {/* Simulated Relay Click Tag */}
                {relay.status && (
                  <div className="absolute top-1 right-2 pointer-events-none text-[8px] bg-indigo-500/30 text-indigo-200 px-1 py-0.3 rounded border border-indigo-400/20 font-bold tracking-wider animate-bounce">
                    CLICK!
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
 
      {/* Styled Physical Board NodeMCU & Serial Monitor logs */}
      <div className="lg:col-span-7 flex flex-col space-y-6">
        
        {/* Virtual ESP32 Hardware Deck */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-slate-100 font-sans tracking-tight">ESP32 Pinout Controller</h3>
              <p className="text-xs text-slate-400">Representasi perangkat sirkuit mikrokontroler Anda</p>
            </div>
            
            <button
              type="button"
              id="btn-toggle-esp-power"
              onClick={toggleEspState}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-[11px] font-mono font-bold tracking-wider transition-all duration-300 shadow cursor-pointer ${
                isEspOnline 
                  ? 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20' 
                  : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20'
              }`}
            >
              <Power className="w-3.5 h-3.5" />
              <span>{isEspOnline ? 'MATIKAN' : 'HIDUPKAN'}</span>
            </button>
          </div>
 
          {/* Virtual Board SVG/CSS Diagram */}
          <div className="relative bg-slate-950/80 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center min-h-[140px] shadow-inner">
            <div className={`absolute top-3 left-4 text-[10px] font-mono px-2 py-0.5 rounded-full border ${
              isEspOnline ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}>
              POWER: {isEspOnline ? 'ON (3.3V)' : 'OFF'}
            </div>
 
            {/* Microcontroller Schematic Mockup */}
            <div className={`w-full max-w-sm rounded-xl border p-4 transition-all duration-300 flex flex-col md:flex-row items-center justify-between gap-4 mt-4 ${
              isEspOnline ? 'bg-gradient-to-r from-teal-950/20 to-indigo-950/20 border-indigo-500/30' : 'bg-slate-900/40 border-white/5'
            }`}>
              <div className="flex items-center gap-3">
                <div className="p-3 bg-slate-900 rounded-lg text-slate-400 border border-white/5 flex items-center justify-center relative">
                  <Play className={`w-6 h-6 rotate-90 ${isEspOnline ? 'text-cyan-400 animate-pulse' : 'text-slate-600'}`} />
                  {/* Built-in LED */}
                  <div className={`absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full transition-colors ${
                    isEspOnline ? 'bg-cyan-400 shadow-[0_0_8px_#22d3ee]' : 'bg-slate-950'
                  }`} title="Built-in LED (GPIO2)" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-mono text-slate-100">ESP32-WROOM-32</h4>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">WiFi-BT Dual Core SoC</p>
                </div>
              </div>
 
              {/* Pin activity meters */}
              <div className="grid grid-cols-5 gap-1 text-[9px] font-mono text-center">
                <div className="flex flex-col items-center">
                  <span className="text-slate-500 font-bold">D4</span>
                  <div className={`w-4.5 h-4.5 rounded flex items-center justify-center font-bold border ${
                    isEspOnline ? 'bg-rose-500/10 border-rose-500/30 text-rose-300' : 'bg-slate-950 text-slate-600 border-white/5'
                  }`} title="Sensor DHT Pin">S</div>
                </div>
                {relays.map((r) => (
                  <div key={r.id} className="flex flex-col items-center">
                    <span className="text-slate-500 font-bold">G{r.pin}</span>
                    <div className={`w-4.5 h-4.5 rounded flex items-center justify-center font-bold border transition-colors ${
                      isEspOnline && r.status 
                        ? 'bg-amber-400 text-amber-950 border-amber-300 font-extrabold' 
                        : 'bg-slate-800 text-slate-500 border-white/5'
                    }`}>
                      {r.id}
                    </div>
                  </div>
                ))}
              </div>
            </div>
 
            <div className="w-full flex justify-between items-center text-[9px] text-slate-600 font-mono mt-3 px-2">
              <span>TXD0/RXD0 UART</span>
              <span>ADC/GPIO PINS</span>
              <span>GND / 3V3 / EN</span>
            </div>
          </div>
        </div>
 
        {/* Arduino Serial Monitor Output Log */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl flex-grow flex flex-col min-h-[250px] relative overflow-hidden" id="card-serial-monitor">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-slate-300" />
              <h3 className="text-sm font-semibold text-slate-100 font-mono">Serial Monitor (COM5 - 1115200 bps)</h3>
            </div>
            
            <button
              type="button"
              id="btn-clear-serial-logs"
              onClick={onClearLogs}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-slate-400 hover:text-slate-200 bg-slate-850 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors cursor-pointer"
              title="Hapus Log Konsol"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Hapus Log</span>
            </button>
          </div>

          {/* Terminal log window */}
          <div className="flex-grow bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-[11px] overflow-y-auto max-h-[280px] space-y-1.5 text-slate-300 shadow-inner scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800">
            {logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 py-10">
                <Info className="w-6 h-6 mb-2 text-slate-600" />
                <p>Konsol Serial Kosong.</p>
                <p className="text-[10px] mt-1">Hidupkan/modifikasi perangkat untuk melihat logs.</p>
              </div>
            ) : (
              logs.map((log) => {
                let textClass = 'text-slate-400';
                if (log.type === 'success') textClass = 'text-emerald-400';
                if (log.type === 'warning') textClass = 'text-amber-400';
                if (log.type === 'error') textClass = 'text-rose-400';

                return (
                  <div key={log.id} className="flex gap-2 leading-relaxed hover:bg-slate-900/50 py-0.5 px-1 rounded transition-colors">
                    <span className="text-slate-600 font-mono select-none">{log.timestamp}</span>
                    <span className="text-indigo-500 font-bold select-none">[{log.source}]</span>
                    <span className={`${textClass} whitespace-pre-wrap`}>{log.message}</span>
                  </div>
                );
              })
            )}
            <div ref={logEndRef} />
          </div>
        </div>

      </div>

    </div>
  );
}
