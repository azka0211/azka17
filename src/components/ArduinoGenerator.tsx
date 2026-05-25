import React, { useState } from 'react';
import { 
  Copy, 
  Check, 
  Settings, 
  BookOpen, 
  CheckCircle2, 
  Hash, 
  HelpCircle,
  Code2,
  AlertTriangle,
  FileCode
} from 'lucide-react';

export default function ArduinoGenerator() {
  const [boardType, setBoardType] = useState<'ESP32' | 'ESP8266'>('ESP32');
  const [wifiSsid, setWifiSsid] = useState('Infinix HOT 50');
  const [wifiPassword, setWifiPassword] = useState('123456789');
  const [botToken, setBotToken] = useState('8894584427:AAGpWAZklMgGn7e4FZT-JfqCgjvAvGPN7V4');
  const [chatId, setChatId] = useState('6127805495');
  const [dhtType, setDhtType] = useState<'DHT22' | 'DHT11'>('DHT11');
  
  const [pinDht, setPinDht] = useState('4');
  const [pinR1, setPinR1] = useState('25');
  const [pinR2, setPinR2] = useState('26');
  const [pinR3, setPinR3] = useState('27');
  const [pinR4, setPinR4] = useState('14');

  const [copied, setCopied] = useState(false);

  // Switch pin templates when board changes
  const handleBoardChange = (type: 'ESP32' | 'ESP8266') => {
    setBoardType(type);
    if (type === 'ESP8266') {
      setPinDht('2'); // D4
      setPinR1('5');  // D1
      setPinR2('4');  // D2
      setPinR3('14'); // D5
      setPinR4('12'); // D6
    } else {
      setPinDht('4');
      setPinR1('25');
      setPinR2('26');
      setPinR3('27');
      setPinR4('14');
    }
  };

  const getFullSourceCode = () => {
    const isEsp32 = boardType === 'ESP32';
    const wifiHeaders = isEsp32 
      ? '#include <WiFi.h>' 
      : '#include <ESP8266WiFi.h>';
    
    const clientSecureSetup = isEsp32
      ? 'WiFiClientSecure client;\nUniversalTelegramBot bot(BOT_token, client);'
      : 'X509List cert(TELEGRAM_CERTIFICATE_ROOT);\nWiFiClientSecure client;\nUniversalTelegramBot bot(BOT_token, client);';

    return `/**
 * PROYEK SMART HOME IOT SMART BOT - QUIZ MAHASISWA
 * Board: ${boardType}
 * Sensor Suhu: ${dhtType} (GPIO ${pinDht})
 * Relay Output: 1: GPIO ${pinR1}, 2: GPIO ${pinR2}, 3: GPIO ${pinR3}, 4: GPIO ${pinR4}
 * 
 * Dependencies Library (Instal di Arduino IDE):
 * 1. DHT Sensor Library by Adafruit
 * 2. Adafruit Unified Sensor
 * 3. UniversalTelegramBot by Brian Lough (v1.3.0+)
 * 4. ArduinoJson by Benoit Blanchon (Versi 6.x wajib!)
 */

${wifiHeaders}
#include <WiFiClientSecure.h>
#include <UniversalTelegramBot.h>
#include <ArduinoJson.h>
#include <DHT.h>

// ========== KONFIGURASI KREDENSIAL ==========
#define WIFI_SSID "${wifiSsid}"
#define WIFI_PASSWORD "${wifiPassword}"
#define BOT_TOKEN "${botToken}"
#define CHAT_ID "${chatId}"

// ========== PARAMETER HARDWARE ==========
#define DHTPIN ${pinDht}
#define DHTTYPE ${dhtType}

#define RELAY_1 ${pinR1} // Lampu Utama
#define RELAY_2 ${pinR2} // Lampu Kamar
#define RELAY_3 ${pinR3} // Variasi Lampu 1
#define RELAY_4 ${pinR4} // Variasi Lampu 2

DHT dht(DHTPIN, DHTTYPE);

// Inisialisasi Klien Telegram Bot
const char* BOT_token = BOT_TOKEN;
WiFiClientSecure client;
UniversalTelegramBot bot(BOT_token, client);

// Parameter polling Telegram
unsigned long lastTimeBotRan = 0;
const unsigned long botRequestDelay = 2000; // interval chat polling (2 Detik)

// State Relay
bool relay1Status = false;
bool relay2Status = false;
bool relay3Status = false;
bool relay4Status = false;

// Format Tampilan Menu Bot
String getBotMenu() {
  String menu = "=== 🏡 MENU KENDALI SMART HOME ===\\n\\n";
  menu += "🛰️ SENSOR DATA:\\n";
  menu += "/sensor - Baca Suhu & Kelembaban\\n\\n";
  menu += "💡 KENDALI LAMPU:\\n";
  menu += "/lampu1_on  - Nyalakan Lampu Utama (1)\\n";
  menu += "/lampu1_off - Matikan Lampu Utama (1)\\n";
  menu += "/lampu2_on  - Nyalakan Lampu Kamar (2)\\n";
  menu += "/lampu2_off - Matikan Lampu Kamar (2)\\n\\n";
  menu += "🎭 FITUR VARIASI LAMPU:\\n";
  menu += "/variasi1_on  - Nyalakan Variasi Lampu 1\\n";
  menu += "/variasi2_on  - Nyalakan Variasi Lampu 2\\n";
  menu += "/all_off      - Matikan Semua Relay\\n\\n";
  menu += "🎤 MENDUKUNG PERINTAH SUARA (Ketik kalimat):\\n";
  menu += '\\"' + String("Nyalakan lampu") + '\\"\\n';
  menu += '\\"' + String("Matikan lampu") + '\\"\\n';
  menu += '\\"' + String("Berapa Temperatur") + '\\"\\n';
  menu += '\\"' + String("Berapa Kelembapan") + '\\"\\n';
  menu += '\\"' + String("Nyalakan Variasi 1") + '\\"\\n';
  menu += '\\"' + String("Nyalakan Variasi 2") + '\\"';
  return menu;
}

// Handler pesan Telegram masuk (termasuk deteksi teks & perintah suara)
void handleNewMessages(int numNewMessages) {
  for (int i = 0; i < numNewMessages; i++) {
    String chat_id = String(bot.messages[i].chat_id);
    if (chat_id != CHAT_ID) {
      bot.sendMessage(chat_id, "Akses Ditolak! Anda bukan pemilik rumah.", "");
      continue;
    }

    String text = bot.messages[i].text;
    text.trim();
    
    Serial.println("Telegram Msg Terbaca: " + text);

    // 1. Perintah Standar Telegram
    if (text == "/start") {
      bot.sendMessage(chat_id, getBotMenu(), "");
    }
    
    // Relay 1 Control
    else if (text == "/lampu1_on" || text.equalsIgnoreCase("nyalakan lampu") || text.equalsIgnoreCase("nyalakan lampu 1")) {
      digitalWrite(RELAY_1, LOW); // Active Low Relay
      relay1Status = true;
      bot.sendMessage(chat_id, "Lampu Utama [1] Berhasil Dinyalakan! 💡", "");
    }
    else if (text == "/lampu1_off" || text.equalsIgnoreCase("matikan lampu") || text.equalsIgnoreCase("matikan lampu 1")) {
      digitalWrite(RELAY_1, HIGH);
      relay1Status = false;
      bot.sendMessage(chat_id, "Lampu Utama [1] Berhasil Dimatikan! 🔌", "");
    }

    // Relay 2 Control
    else if (text == "/lampu2_on" || text.equalsIgnoreCase("nyalakan lampu kamar") || text.equalsIgnoreCase("nyalakan lampu 2")) {
      digitalWrite(RELAY_2, LOW);
      relay2Status = true;
      bot.sendMessage(chat_id, "Lampu Kamar [2] Berhasil Dinyalakan! 💡", "");
    }
    else if (text == "/lampu2_off" || text.equalsIgnoreCase("matikan lampu kamar") || text.equalsIgnoreCase("matikan lampu 2")) {
      digitalWrite(RELAY_2, HIGH);
      relay2Status = false;
      bot.sendMessage(chat_id, "Lampu Kamar [2] Berhasil Dimatikan! 🔌", "");
    }

    // Variasi Lampu 1 & 2
    else if (text == "/variasi1_on" || text.equalsIgnoreCase("nyalakan variasi 1") || text.equalsIgnoreCase("variasi 1")) {
      // Efek Variasi 1: Lampu 1 & 2 Berkedip bergantian, lalu Aktif keduanya
      bot.sendMessage(chat_id, "Memulai Variasi Lampu 1... 🎭", "");
      for(int idx = 0; idx < 4; idx++) {
        digitalWrite(RELAY_3, LOW);  digitalWrite(RELAY_4, HIGH); delay(400);
        digitalWrite(RELAY_3, HIGH); digitalWrite(RELAY_4, LOW);  delay(400);
      }
      digitalWrite(RELAY_3, LOW);
      digitalWrite(RELAY_4, LOW);
      relay3Status = true; relay4Status = true;
      bot.sendMessage(chat_id, "Variasi Lampu 1 Aktif! (Relay 3 & 4 ON)", "");
    }
    else if (text == "/variasi2_on" || text.equalsIgnoreCase("nyalakan variasi 2") || text.equalsIgnoreCase("variasi 2")) {
      // Efek Variasi 2: Strobe cepat semua lampu bersamaan
      bot.sendMessage(chat_id, "Memulai Variasi Lampu 2... ✨", "");
      for(int idx = 0; idx < 6; idx++) {
        digitalWrite(RELAY_1, LOW);  digitalWrite(RELAY_2, LOW);  digitalWrite(RELAY_3, LOW);  digitalWrite(RELAY_4, LOW);  delay(150);
        digitalWrite(RELAY_1, HIGH); digitalWrite(RELAY_2, HIGH); digitalWrite(RELAY_3, HIGH); digitalWrite(RELAY_4, HIGH); delay(150);
      }
      digitalWrite(RELAY_1, LOW);
      digitalWrite(RELAY_2, LOW);
      relay1Status = true; relay2Status = true;
      bot.sendMessage(chat_id, "Variasi Lampu 2 Selesai! Rumah dalam mode Terang benderang! 🎉", "");
    }

    // All Relay Off
    else if (text == "/all_off" || text.equalsIgnoreCase("matikan semua lampu") || text.equalsIgnoreCase("matikan semua")) {
      digitalWrite(RELAY_1, HIGH);
      digitalWrite(RELAY_2, HIGH);
      digitalWrite(RELAY_3, HIGH);
      digitalWrite(RELAY_4, HIGH);
      relay1Status = false; relay2Status = false; relay3Status = false; relay4Status = false;
      bot.sendMessage(chat_id, "Semua Relay (1-4) Telah Dinonaktifkan! 🔌❌", "");
    }

    // DHT Data Sensor Readings
    else if (text == "/sensor" || text.equalsIgnoreCase("berapa temperatur") || text.equalsIgnoreCase("berapa kelembapan") || text.equalsIgnoreCase("status sensor")) {
      float t = dht.readTemperature();
      float h = dht.readHumidity();

      if (isnan(t) || isnan(h)) {
        bot.sendMessage(chat_id, "Gagal membaca data dari sensor DHT! Periksa kebersihan kabel.", "");
      } else {
        String balasan = "📋 LAPORAN KONDISI RUMAH:\\n\\n";
        balasan += "🌡️ Suhu Udara: " + String(t, 1) + " °C\\n";
        balasan += "💧 Kelembaban: " + String(h, 0) + " %\\n\\n";
        balasan += (t > 30.0) ? "⚠️ STATUS: Suhu di atas batas ideal (Hangat!)." : "✅ STATUS: Kondisi suhu rumah aman.";
        bot.sendMessage(chat_id, balasan, "");
      }
    }
    
    else {
      bot.sendMessage(chat_id, "Perintah tidak dikenal. Ketik /start untuk melihat opsi kendali atau gunakan perintah suara populer.", "");
    }
  }
}

void setup() {
  Serial.begin(115200);
  delay(10);
  
  // Inisialisasi Hardware Pin Out
  pinMode(RELAY_1, OUTPUT);
  pinMode(RELAY_2, OUTPUT);
  pinMode(RELAY_3, OUTPUT);
  pinMode(RELAY_4, OUTPUT);

  // Default: Matikan relay (Active High, ganti LOW jika Active Low relay module sebaliknya)
  digitalWrite(RELAY_1, HIGH);
  digitalWrite(RELAY_2, HIGH);
  digitalWrite(RELAY_3, HIGH);
  digitalWrite(RELAY_4, HIGH);

  dht.begin();

  // Koneksi ke WiFi
  Serial.println();
  Serial.print("Menghubungkan ke Wi-Fi: ");
  Serial.println(WIFI_SSID);
  
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("Wi-Fi Terhubung!");
  Serial.print("IP Address: ");
  Serial.println(WiFi.localIP());

  // Set WiFiClientSecure agar tidak membutuhkan cert pembanding SSL yang ribet
  #if defined(ESP8266)
    client.setInsecure();
  #elif defined(ESP32)
    client.setInsecure();
  #endif
  
  // Mengirim notifikasi boot awal sistem ke Telegram Anda
  bot.sendMessage(CHAT_ID, "🏡 SISTEM SMART HOME TELAH ONLINE!\\n\\nKetik /start untuk membuka konsol kendali.", "");
}

void loop() {
  // Polling Telegram untuk pesan baru
  if (millis() > lastTimeBotRan + botRequestDelay) {
    int numNewMessages = bot.getUpdates(bot.last_message_received + 1);

    while(numNewMessages) {
      Serial.println("Menerima respons pesan...");
      handleNewMessages(numNewMessages);
      numNewMessages = bot.getUpdates(bot.last_message_received + 1);
    }
    lastTimeBotRan = millis();
  }
}
`;
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(getFullSourceCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6" id="documentation-wizard">
      
      {/* Configuration Wizard bar */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Settings className="w-5 h-5 text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-100 font-sans tracking-tight">Konfigurasi Wizard Code Generator</h3>
        </div>
        <p className="text-xs text-slate-400 mb-5 leading-relaxed">
          Isi pengaturan jaringan Wi-Fi dan kredensial Telegram Bot Anda di bawah ini. Kode Arduino siap-kompilasi di samping/bawah akan terbarui secara dinamis, sehingga Anda tinggal menyalin dan mengunggahnya!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Board & WiFi Panel */}
          <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">1. Perangkat & WiFi</span>
            
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pilih Board Mikrokontroler</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handleBoardChange('ESP32')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    boardType === 'ESP32' ? 'bg-indigo-600 text-slate-100' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  ESP32 Board
                </button>
                <button
                  type="button"
                  onClick={() => handleBoardChange('ESP8266')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    boardType === 'ESP8266' ? 'bg-indigo-600 text-slate-100' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  ESP8266 (NodeMCU)
                </button>
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">SSID Jaringan Wi-Fi</label>
              <input 
                type="text" 
                value={wifiSsid}
                onChange={(e) => setWifiSsid(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none" 
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Password Wi-Fi</label>
              <input 
                type="password" 
                value={wifiPassword}
                onChange={(e) => setWifiPassword(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none" 
              />
            </div>
          </div>

          {/* Telegram Credentials */}
          <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-white/5 font-sans">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block">2. Telegram Kredensial</span>
            
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Bot Token API</label>
              <input 
                type="text" 
                value={botToken}
                onChange={(e) => setBotToken(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono" 
              />
              <span className="text-[9px] text-slate-500">Buat via bot Telegram @BotFather</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Pemilik Chat ID</label>
              <input 
                type="text" 
                value={chatId}
                onChange={(e) => setChatId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 focus:border-indigo-500 outline-none font-mono" 
              />
              <span className="text-[9px] text-slate-500">Cari Chat ID Anda via bot @userinfobot</span>
            </div>

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Jenis Sensor Suhu</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDhtType('DHT22')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    dhtType === 'DHT22' ? 'bg-indigo-600 text-slate-100' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  DHT22 Sensor
                </button>
                <button
                  type="button"
                  onClick={() => setDhtType('DHT11')}
                  className={`py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                    dhtType === 'DHT11' ? 'bg-indigo-600 text-slate-100' : 'bg-slate-900 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  DHT11 Sensor
                </button>
              </div>
            </div>
          </div>

          {/* Pin Configuration Mapping */}
          <div className="space-y-4 bg-slate-950/40 p-5 rounded-2xl border border-white/5">
            <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider block font-mono">3. Pin GPIO Mapping</span>
            
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">GPIO DHT Sensor</label>
                <input 
                  type="text" 
                  value={pinDht} 
                  onChange={(e) => setPinDht(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-slate-100 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">GPIO Relay 1 (Utama)</label>
                <input 
                  type="text" 
                  value={pinR1} 
                  onChange={(e) => setPinR1(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-slate-100 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">GPIO Relay 2 (Kamar)</label>
                <input 
                  type="text" 
                  value={pinR2} 
                  onChange={(e) => setPinR2(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-slate-100 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-0.5">GPIO Relay 3 (Var 1)</label>
                <input 
                  type="text" 
                  value={pinR3} 
                  onChange={(e) => setPinR3(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-slate-100 focus:border-indigo-500 outline-none" 
                />
              </div>
              <div className="col-span-2">
                <label className="text-[10px] text-slate-400 block mb-0.5">GPIO Relay 4 (Var 2)</label>
                <input 
                  type="text" 
                  value={pinR4} 
                  onChange={(e) => setPinR4(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded p-1 text-center font-mono text-slate-100 focus:border-indigo-500 outline-none" 
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assembly Pinout diagram & setup steps */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Assembly Wiring Manual */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl space-y-5">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">Panduan Perakitan Fisik & Wiring Skema</h3>
          </div>

          <div className="space-y-4">
            {/* Table layout of pins */}
            <div className="border border-slate-800 rounded-2xl overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 font-mono text-slate-400 border-b border-slate-800">
                    <th className="p-3">Nama Perangkat</th>
                    <th className="p-3">Pin Perangkat</th>
                    <th className="p-3">Koneksi ESP32</th>
                    <th className="p-3">Koneksi ESP8266</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300 font-medium">
                  <tr>
                    <td className="p-3 font-semibold text-red-400">Sensor DHT11/22</td>
                    <td className="p-3">VCC • DATA • GND</td>
                    <td className="p-3">3V3 • GPIO {pinDht} • GND</td>
                    <td className="p-3">3V3 • GPIO {pinDht} (D4) • GND</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-amber-400">Relay 1 Lampu Utama</td>
                    <td className="p-3">VCC • IN1 • GND</td>
                    <td className="p-3">5V • GPIO {pinR1} • GND</td>
                    <td className="p-3">5V (VIN) • GPIO {pinR1} (D1) • GND</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-emerald-400">Relay 2 Lampu Kamar</td>
                    <td className="p-3">VCC • IN2 • GND</td>
                    <td className="p-3">5V • GPIO {pinR2} • GND</td>
                    <td className="p-3">5V (VIN) • GPIO {pinR2} (D2) • GND</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-blue-400">Relay 3 Variasi 1</td>
                    <td className="p-3">VCC • IN3 • GND</td>
                    <td className="p-3">5V • GPIO {pinR3} • GND</td>
                    <td className="p-3">5V (VIN) • GPIO {pinR3} (D5) • GND</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-purple-400">Relay 4 Variasi 2</td>
                    <td className="p-3">VCC • IN4 • GND</td>
                    <td className="p-3">5V • GPIO {pinR4} • GND</td>
                    <td className="p-3">5V (VIN) • GPIO {pinR4} (D6) • GND</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-4 rounded-2xl border border-slate-800/80">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-wider block flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>PENTING - PERHATIAN ARUS LISTRIK!</span>
              </span>
              <p>Relay digunakan untuk menyambungkan fitting lampu ke aliran listrik PLNAC 220V. Pastikan Anda merakit rangkaian dalam keadaan steker listrik tercabut demi keselamatan jiwa. Minta bimbingan asisten laboratorium jika perlu.</p>
            </div>

            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Langkah-Langkah Instalasi Software:</h4>
              <div className="space-y-2 text-xs text-slate-400">
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Buka **Arduino IDE** (Versi terbaru disarankan).</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Masuk ke **Sketch** &gt; **Include Library** &gt; **Manage Libraries...**</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Ketik dan instal library yang dibutuhkan (DHT Sensor Library, Adafruit Unified Sensor, UniversalTelegramBot, dan **ArduinoJson versi 6.x**). Jangan menggunakan ArduinoJson versi 7 karena ada ketidakcocokan fungsi pada driver Telegram!</span>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  <span>Hubungkan board ESP32/ESP8266 ke USB Laptop, pilih board tipe dan port COM yang sesuai, lalu tekan **Upload**.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Code Compiler-Ready Output Container */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 shadow-xl flex flex-col h-full space-y-4 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4.5 h-4.5 text-indigo-400" />
              <h3 className="text-sm font-semibold text-slate-100 font-mono">Source Code Arduino C++ (.ino)</h3>
            </div>
            
            <button
              type="button"
              id="btn-copy-code"
              onClick={copyToClipboard}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-xl font-medium cursor-pointer transition-all duration-300 shadow ${
                copied 
                  ? 'bg-emerald-600 border border-emerald-500 text-white' 
                  : 'bg-indigo-600 hover:bg-indigo-505 border border-indigo-500/30 text-slate-100'
              }`}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Tersalin' : 'Salin Kode'}</span>
            </button>
          </div>

          {/* Raw scrollable C++ code code-block */}
          <div className="flex-grow bg-slate-950 p-4 rounded-2xl border border-slate-800/80 font-mono text-[10.5px] overflow-y-auto max-h-[380px] text-slate-300 scrollbar-thin max-w-full">
            <span className="text-[10px] bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md font-sans text-slate-400 uppercase tracking-widest font-bold mb-3 inline-block">
              {boardType} SOURCE CODE
            </span>
            <pre className="whitespace-pre overflow-x-auto text-left py-1 text-slate-300 select-all font-mono leading-relaxed" id="code-block-arduino">
              {getFullSourceCode()}
            </pre>
          </div>
        </div>

      </div>

    </div>
  );
}
