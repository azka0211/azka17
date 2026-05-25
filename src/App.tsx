import React, { useState, useEffect } from 'react';
import { Relay, SensorData, LogEntry, ChatMessage } from './types';
import Dashboard from './components/Dashboard';
import WorkspaceConsole from './components/WorkspaceConsole';
import TelegramSimulator from './components/TelegramSimulator';
import ArduinoGenerator from './components/ArduinoGenerator';
import { 
  AppWindow, 
  MessageSquare, 
  Settings, 
  Flame, 
  Droplets, 
  Cpu, 
  FolderGit, 
  Bookmark,
  Activity,
  User,
  GraduationCap
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'telegram' | 'arduino'>('dashboard');
  
  // Physical ESP32 connectivity state
  const [isEspOnline, setIsEspOnline] = useState(true);

  // 1. Relays State
  const [relays, setRelays] = useState<Relay[]>([
    { id: 1, name: 'Lampu Utama (Living)', pin: 25, status: false, type: 'utama' },
    { id: 2, name: 'Lampu Kamar (Sleep)', pin: 26, status: false, type: 'kamar' },
    { id: 3, name: 'Variasi Lampu 1 (Relay 3)', pin: 27, status: false, type: 'variasi1' },
    { id: 4, name: 'Variasi Lampu 2 (Relay 4)', pin: 14, status: false, type: 'variasi2' },
  ]);

  // 2. Sensor State (DHT)
  const [sensorData, setSensorData] = useState<SensorData>({
    temperature: 28.5,
    humidity: 62,
    lastUpdated: new Date().toLocaleTimeString('id-ID'),
  });

  // 3. Historical Data State (for graphs)
  const [historyData, setHistoryData] = useState<Array<{ time: string; temp: number; hum: number }>>([
    { time: '12:00', temp: 26.5, hum: 60 },
    { time: '12:05', temp: 27.0, hum: 58 },
    { time: '12:10', temp: 27.5, hum: 61 },
    { time: '12:15', temp: 28.0, hum: 65 },
    { time: '12:20', temp: 28.2, hum: 63 },
    { time: '12:25', temp: 28.5, hum: 62 },
  ]);

  // 4. Arduino Serial Logs State
  const [logs, setLogs] = useState<LogEntry[]>([
    { id: '1', timestamp: '01:04:12', source: 'SYSTEM', message: 'ESP32 system booting, CPU frequency: 240MHz.', type: 'info' },
    { id: '2', timestamp: '01:04:13', source: 'SYSTEM', message: 'Configuring output pins. RELAY_1=GPIO25, RELAY_2=GPIO26, RELAY_3=GPIO27, RELAY_4=GPIO14', type: 'info' },
    { id: '3', timestamp: '01:04:13', source: 'DHT', message: 'DHT11 sensor initialized on GPIO 4 successfully.', type: 'success' },
    { id: '4', timestamp: '01:04:14', source: 'WIFI', message: 'Searching networks... Connecting to "SmartHome_WiFi"...', type: 'info' },
    { id: '5', timestamp: '01:04:15', source: 'WIFI', message: 'WiFi Connected! Local IP Address: 192.168.1.134, RSSI: -58 dBm', type: 'success' },
    { id: '6', timestamp: '01:04:15', source: 'TELEGRAM', message: 'Secure client setup completed. Starting UniversalTelegramBot engine in insecure SSL mode.', type: 'info' },
    { id: '7', timestamp: '01:04:16', source: 'TELEGRAM', message: 'Notification sent to Telegram: [System Online Message]', type: 'success' },
    { id: '8', timestamp: '01:04:18', source: 'DHT', message: 'Telemetry telemetry: Temp=28.5C, Hum=62%', type: 'success' }
  ]);

  // 5. Telegram Messages Chat State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'bot',
      text: '🏡 SISTEM SMART HOME TELAH ONLINE!\n\nKetik /start untuk membuka konsol kendali dan melihat fungsi perintah suara.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const addLog = (source: LogEntry['source'], message: string, type: LogEntry['type'] = 'info') => {
    const timestamp = new Date().toLocaleTimeString('id-ID');
    const newLog: LogEntry = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp,
      source,
      message,
      type
    };
    setLogs((prev) => [...prev, newLog]);
  };

  // Keep track of temperature and humidity changes
  const handleSensorChange = (temp: number, hum: number) => {
    const lastStr = new Date().toLocaleTimeString('id-ID');
    setSensorData({ temperature: temp, humidity: hum, lastUpdated: lastStr });
    
    // Add point to graph history
    const shortTime = lastStr.substring(0, 5); // hh:mm
    setHistoryData(prev => {
      const next = [...prev, { time: shortTime, temp, hum }];
      if (next.length > 10) next.shift(); // keep last 10 ticks
      return next;
    });

    addLog('DHT', `Sensor update: Suhu=${temp.toFixed(1)}°C, Kelembaban=${hum.toFixed(0)}%`, 'success');
  };

  // Toggle Relay states
  const toggleRelay = (id: number, notifyTelecom: boolean = true) => {
    setRelays((prev) =>
      prev.map((r) => {
        if (r.id === id) {
          const newStatus = !r.status;
          
          // Print on physical ESP32 terminal logs
          addLog(
            'RELAY', 
            `Sinyal ${newStatus ? 'LOW (ON)' : 'HIGH (OFF)'} dikirim ke GPIO ${r.pin}. Driver Relay ${id} ${newStatus ? 'Aktif' : 'Nonaktif'}.`, 
            newStatus ? 'success' : 'warning'
          );

          // Update Telegram chats
          if (notifyTelecom) {
            const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
            const notifMsg: ChatMessage = {
              id: `${Date.now()}-notif`,
              sender: 'bot',
              text: `🔔 [NOTIFIKASI]: ${r.name} telah ${newStatus ? 'Dinyalakan 💡' : 'Dimatikan 🔌'} melalui Web Dashboard.`,
              timestamp: timeStr
            };
            setChatMessages(prev => [...prev, notifMsg]);
          }

          return { ...r, status: newStatus };
        }
        return r;
      })
    );
  };

  // Perform "Variasi Lampu 1" animation (Relay 3 + 4 sequence flickering matched on screen!)
  const runVariasi1Animation = () => {
    addLog('SYSTEM', 'Memulai Variasi Lampu 1 di ESP32...', 'info');
    
    // Quick state sequence simulator
    let step = 0;
    const interval = setInterval(() => {
      setRelays(prev => prev.map(r => {
        if (r.id === 3) return { ...r, status: step % 2 === 0 };
        if (r.id === 4) return { ...r, status: step % 2 !== 0 };
        return r;
      }));
      addLog('RELAY', `Variasi 1 Langkah ${step+1}: GPIO 27=${step % 2 === 0 ? 'LOW' : 'HIGH'}, GPIO 14=${step % 2 !== 0 ? 'LOW' : 'HIGH'}`, 'info');
      step++;
      
      if (step >= 8) {
        clearInterval(interval);
        // Turn both ON at the end
        setRelays(prev => prev.map(r => {
          if (r.id === 3 || r.id === 4) return { ...r, status: true };
          return r;
        }));
        addLog('RELAY', 'Variasi 1 Selesai! Relay 3 dan 4 berada dalam posisi aktif.', 'success');
      }
    }, 400);
  };

  // Perform "Variasi Lampu 2" animation (All relay strobe sequence)
  const runVariasi2Animation = () => {
    addLog('SYSTEM', 'Memulai Variasi Lampu 2 di ESP32...', 'info');
    
    let step = 0;
    const interval = setInterval(() => {
      setRelays(prev => prev.map(r => {
        return { ...r, status: step % 2 === 0 };
      }));
      addLog('RELAY', `Variasi 2 Strobe ${step+1}: Pin 25,26,27,14 ter-modulasi bersamaan.`, 'info');
      step++;

      if (step >= 10) {
        clearInterval(interval);
        // Leave Lamp 1 & 2 ON
        setRelays(prev => prev.map(r => {
          if (r.id === 1 || r.id === 2) return { ...r, status: true };
          if (r.id === 3 || r.id === 4) return { ...r, status: false };
          return r;
        }));
        addLog('RELAY', 'Variasi 2 Selesai! Lampu Utama & Kamar di-set menyala.', 'success');
      }
    }, 250);
  };

  // Process incoming telegram message strings & voice queries (NLP command core)
  const handleTelegramMessage = (text: string, isVoice: boolean = false) => {
    const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    
    // 1. User Message
    const userMsg: ChatMessage = {
      id: `${Date.now()}-user`,
      sender: 'user',
      text,
      timestamp: timeStr,
      isVoice
    };

    setChatMessages((prev) => [...prev, userMsg]);
    
    // Log the incoming command on serial console
    addLog('TELEGRAM', `Request masuk dari ChatID 987654321: Msg="${text}"`, 'info');

    // Make Bot respond with delay (simulating network poll delay)
    setTimeout(() => {
      let botResponse = '';
      const cleanText = text.toLowerCase().replace(/[““”"]/g, '').trim();

      // Bot start command
      if (cleanText === '/start') {
        botResponse = `=== 🏡 MENU UTAMA BOT SMART HOME ===\n\n` +
                      `🛰️ MONITOR SENSOR:\n` +
                      `/sensor - Baca Keadaan Suhu & Kelembaban\n\n` +
                      `💡 PERINTAH RELAY LAMPU:\n` +
                      `/lampu1_on  - Nyalakan Lampu Utama\n` +
                      `/lampu1_off - Matikan Lampu Utama\n` +
                      `/lampu2_on  - Nyalakan Lampu Kamar\n` +
                      `/lampu2_off - Matikan Lampu Kamar\n\n` +
                      `🎭 FITUR KHUSUS VARIASI:\n` +
                      `/variasi1_on  - Aktifkan Variasi Lampu 1\n` +
                      `/variasi2_on  - Aktifkan Variasi Lampu 2\n` +
                      `/all_off      - Nonaktifkan Semua Switch Lampu\n\n` +
                      `🎙️ PERINTAH SUARA POPULER:\n` +
                      `• "Nyalakan lampu" (untuk Lampu 1)\n` +
                      `• "Matikan lampu"\n` +
                      `• "Berapa Temperatur"\n` +
                      `• "Berapa Kelembapan"`;
      } 
      
      // Sensor Command
      else if (cleanText === '/sensor' || cleanText.includes('temperatur') || cleanText.includes('suhu') || cleanText.includes('kelembaban') || cleanText.includes('kelembapan')) {
        const tempVal = sensorData.temperature.toFixed(1);
        const humVal = sensorData.humidity.toFixed(0);
        botResponse = `📊 [LAPORAN SENSOR KONDISI RUMAH]:\n\n` +
                      `🌡️ Suhu Ruangan: ${tempVal} °C\n` +
                      `💧 Kelembaban    : ${humVal} %\n\n` +
                      `${sensorData.temperature > 30 ? '⚠️ STATUS: Suhu di atas ambang batas ideal (Kondisi Hangat)!' : '✅ STATUS: Kondisi udara sangat nyaman.'}`;
      }

      // Lamp 1 ON
      else if (cleanText === '/lampu1_on' || cleanText === 'nyalakan lampu' || cleanText === 'nyalakan lampu 1' || cleanText === 'nyalakan lampu utama') {
        const r = relays.find(r => r.id === 1);
        if (r && !r.status) {
          toggleRelay(1, false);
        }
        botResponse = `Lampu Utama [1] Berhasil Dinyalakan! 💡 (Relay GPIO 25 aktif)`;
      }

      // Lamp 1 OFF
      else if (cleanText === '/lampu1_off' || cleanText === 'matikan lampu' || cleanText === 'matikan lampu 1' || cleanText === 'matikan lampu utama') {
        const r = relays.find(r => r.id === 1);
        if (r && r.status) {
          toggleRelay(1, false);
        }
        botResponse = `Lampu Utama [1] Berhasil Dimatikan! 🔌 (Relay GPIO 25 mati)`;
      }

      // Lamp 2 ON
      else if (cleanText === '/lampu2_on' || cleanText === 'nyalakan lampu kamar' || cleanText === 'nyalakan lampu 2') {
        const r = relays.find(r => r.id === 2);
        if (r && !r.status) {
          toggleRelay(2, false);
        }
        botResponse = `Lampu Kamar [2] Berhasil Dinyalakan! 💡 (Relay GPIO 26 aktif)`;
      }

      // Lamp 2 OFF
      else if (cleanText === '/lampu2_off' || cleanText === 'matikan lampu kamar' || cleanText === 'matikan lampu 2') {
        const r = relays.find(r => r.id === 2);
        if (r && r.status) {
          toggleRelay(2, false);
        }
        botResponse = `Lampu Kamar [2] Berhasil Dimatikan! 🔌 (Relay GPIO 26 mati)`;
      }

      // Variasi Lampu 1 Trigger
      else if (cleanText === '/variasi1_on' || cleanText.includes('variasi 1') || cleanText === 'variasi 1') {
        runVariasi1Animation();
        botResponse = `Menerima Perintah: Memulai Pola Variasi Lampu 1 pada GPIO 27 & 14... 🎭`;
      }

      // Variasi Lampu 2 Trigger
      else if (cleanText === '/variasi2_on' || cleanText.includes('variasi 2') || cleanText === 'variasi 2') {
        runVariasi2Animation();
        botResponse = `Menerima Perintah: Memulai Pola Strobo Variasi Lampu 2 pada seluruh Lampu... ✨`;
      }

      // All Off
      else if (cleanText === '/all_off' || cleanText === 'matikan semua' || cleanText === 'matikan semua lampu') {
        setRelays(prev => prev.map(r => ({ ...r, status: false })));
        addLog('RELAY', 'Semua Relay (GPIO 25,26,27,14) dimatikan serentak via Telegram.', 'warning');
        botResponse = `Semua Relay (1-4) Telah Dinonaktifkan! 🔌❌`;
      }

      // Unknown request
      else {
        botResponse = `⚠️ Perintah "${text}" tidak terdaftar di sistem.\n\nKetik /start untuk membuka daftar bantuan kendali otomatis.`;
      }

      const botMsg: ChatMessage = {
        id: `${Date.now()}-bot`,
        sender: 'bot',
        text: botResponse,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      };

      setChatMessages((prev) => [...prev, botMsg]);
      addLog('TELEGRAM', `Bot membalas ChatID 987654321 dengan pesan konfirmasi sukses.`, 'success');

    }, 1000);
  };

  const handleManualRefresh = () => {
    const freshTime = new Date().toLocaleTimeString('id-ID');
    setSensorData(prev => ({
      ...prev,
      lastUpdated: freshTime
    }));
    addLog('SYSTEM', 'Paksa pembaruan data sensor (Force Refresh) dilakukan dari Web Dashboard.', 'info');
  };

  return (
    <div className="min-h-screen bg-[#070709] text-slate-100 flex flex-col font-sans" id="application-container">
      
      {/* Visual Header / Banner */}
      <header className="border-b border-white/5 bg-[#09090c]/60 backdrop-blur-md sticky top-0 z-50 px-6 py-4 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-sky-500 text-white flex items-center justify-center shadow-lg shadow-indigo-500/10 border border-white/10">
              <Cpu className="w-5.5 h-5.5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white font-sans">Lab IoT Smart Home</h1>
                <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 uppercase tracking-widest font-mono">QUIZ MAHASISWA</span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Pengendali Lampu 4 Relay &amp; Monitoring Sensor Suhu/Kelembaban DHT + Telegram Bot</p>
            </div>
          </div>

          {/* Academic Info Badge */}
          <div className="flex items-center gap-3 bg-slate-950/40 border border-white/5 rounded-2xl px-4 py-2 text-xs">
            <GraduationCap className="w-5 h-5 text-indigo-400 animate-pulse" />
            <div>
              <p className="font-bold text-slate-200 font-sans tracking-tight">Lab IoT &amp; Embedded System</p>
              <p className="text-[10px] text-slate-500 font-mono mt-0.5">S1 Teknik Komputer / Teknik Elektro</p>
            </div>
          </div>
        </div>
      </header>

      {/* Primary Tab Selector Navigation */}
      <nav className="border-b border-white/5 bg-[#070709] px-6 py-2 md:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap gap-2.5">
          <button
            type="button"
            id="tab-btn-dashboard"
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
              activeTab === 'dashboard'
                ? 'bg-white/[0.06] text-indigo-400 border-white/10 font-bold'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <AppWindow className="w-4 h-4" />
            <span>🖥️ Web Dashboard &amp; Hardware</span>
          </button>

          <button
            type="button"
            id="tab-btn-telegram"
            onClick={() => setActiveTab('telegram')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
              activeTab === 'telegram'
                ? 'bg-white/[0.06] text-indigo-400 border-white/10 font-bold'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>💬 Telegram Bot Simulator</span>
          </button>

          <button
            type="button"
            id="tab-btn-arduino"
            onClick={() => setActiveTab('arduino')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide transition-all cursor-pointer border ${
              activeTab === 'arduino'
                ? 'bg-white/[0.06] text-indigo-400 border-white/10 font-bold'
                : 'bg-transparent border-transparent text-slate-400 hover:text-slate-200 hover:bg-white/[0.03]'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>💾 Code Generator &amp; Panduan</span>
          </button>
        </div>
      </nav>

      {/* Main Container Contents */}
      <main className="flex-grow p-4 md:p-8 max-w-7xl w-full mx-auto">
        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Split Layout: Control Dashboard Web vs ESP32 Simulator deck side-by-side */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
              
              {/* Left Column: Web Control Dashboard Interface (Student's requirement) */}
              <div className="xl:col-span-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <AppWindow className="text-indigo-400" />
                    <span>Interface Web Monitoring (Tugas Quiz)</span>
                  </h2>
                  <span className="text-[10px] bg-slate-900 px-2.5 py-1 rounded-full text-slate-400 font-semibold font-mono border border-slate-800">HTML-CSS-JS Webpage</span>
                </div>
                <Dashboard 
                  relays={relays}
                  setRelays={setRelays}
                  sensorData={sensorData}
                  historyData={historyData}
                  onToggleRelay={(id) => toggleRelay(id, true)}
                  isEspOnline={isEspOnline}
                  onRefreshData={handleManualRefresh}
                />
              </div>

              {/* Right Column: ESP32 Hardware Deck & Sliders & Real Terminal console */}
              <div className="xl:col-span-6 space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                    <Cpu className="text-indigo-400" />
                    <span>ESP32 Physical Hardware Simulator</span>
                  </h2>
                  <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2.5 py-1 rounded-full font-semibold font-mono border border-indigo-500/20">ESP32 Hardware Module</span>
                </div>
                <WorkspaceConsole 
                  relays={relays}
                  sensorData={sensorData}
                  onSensorChange={handleSensorChange}
                  logs={logs}
                  onClearLogs={() => setLogs([])}
                  isEspOnline={isEspOnline}
                  setIsEspOnline={setIsEspOnline}
                  onAddLog={addLog}
                />
              </div>

            </div>
          </div>
        )}

        {activeTab === 'telegram' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div className="text-center space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-white flex items-center justify-center gap-2">
                <MessageSquare className="text-sky-400" />
                <span>Simulasi Chatbot Telegram</span>
              </h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Kirim pesan teks atau manfaatkan preset audio/mikrofon langsung untuk mensimulasikan perintah suara pada bot Telegram Anda!
              </p>
            </div>
            
            <TelegramSimulator 
              relays={relays}
              sensorData={sensorData}
              chatMessages={chatMessages}
              onSendMessage={handleTelegramMessage}
              isEspOnline={isEspOnline}
            />
          </div>
        )}

        {activeTab === 'arduino' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <Settings className="text-indigo-400" />
                  <span>Pinout, Panduan Listrik &amp; Generator Kode Arduino C++</span>
                </h2>
                <p className="text-xs text-slate-400 mt-1">Gunakan kode ini untuk mengunggah aplikasi IoT asli pada mikrokontroler Anda.</p>
              </div>
            </div>
            <ArduinoGenerator />
          </div>
        )}
      </main>

      {/* Dashboard Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-4 py-6 md:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 Laboratorium Internet-of-Things (IoT). Hak Cipta Dilindungi Terhadap Quiz Mahasiswa.</p>
          <div className="flex gap-4">
            <span className="hover:text-slate-300 font-mono">ESP32-STABLE-v1.3</span>
            <span>•</span>
            <span className="hover:text-slate-300 font-mono">UNIVERSAL-TELEGRAM-READY</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
