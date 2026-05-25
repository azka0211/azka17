import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Relay, SensorData } from '../types';
import { 
  Send, 
  Mic, 
  MicOff, 
  MessageSquare, 
  CheckCheck, 
  Volume2, 
  HelpCircle,
  Sparkles,
  Command
} from 'lucide-react';

interface TelegramSimulatorProps {
  relays: Relay[];
  sensorData: SensorData;
  chatMessages: ChatMessage[];
  onSendMessage: (text: string, isVoice?: boolean) => void;
  onSelectVoicePreset?: (text: string) => void;
  isEspOnline: boolean;
}

export default function TelegramSimulator({
  relays,
  sensorData,
  chatMessages,
  onSendMessage,
  isEspOnline
}: TelegramSimulatorProps) {
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [speechFeedback, setSpeechFeedback] = useState('');
  const [isSpeechSupported, setIsSpeechSupported] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);
  
  // Speech Recognition reference
  const recognitionRef = useRef<any>(null);

  // Auto-scroll chats
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  // Check Web Speech API support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setIsSpeechSupported(true);
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.lang = 'id-ID'; // Indonesian Language
      rec.interimResults = false;
      rec.maxAlternatives = 1;

      rec.onstart = () => {
        setIsRecording(true);
        setSpeechFeedback('Mendengarkan... Silakan bicara dalam Bahasa Indonesia');
      };

      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setSpeechFeedback(`Mendeteksi: "${transcript}"`);
        setTimeout(() => {
          onSendMessage(transcript, true);
          setIsRecording(false);
          setSpeechFeedback('');
        }, 1200);
      };

      rec.onerror = (e: any) => {
        console.error('Speech recognition error', e);
        setIsRecording(false);
        setSpeechFeedback('Gagal mendeteksi suara. Coba klik preset suara.');
        setTimeout(() => setSpeechFeedback(''), 3000);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, [onSendMessage]);

  const handleSendText = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText.trim(), false);
    setInputText('');
  };

  const toggleRecording = () => {
    if (!isSpeechSupported) {
      alert('Browser Anda tidak mendukung Web Speech API secara native. Silakan gunakan tombol preset suara di bawah!');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      try {
        recognitionRef.current?.start();
      } catch (err) {
        console.error(err);
        setIsRecording(false);
      }
    }
  };

  // Preset suara simulasi
  const voicePresets = [
    { text: 'Nyalakan lampu', icon: '💡' },
    { text: 'Matikan lampu', icon: '🔌' },
    { text: 'Berapa Temperatur', icon: '🌡️' },
    { text: 'Berapa Kelembapan', icon: '💧' },
    { text: 'Nyalakan Variasi 1', icon: '🎭' },
    { text: 'Nyalakan Variasi 2', icon: '✨' },
  ];

  // Quick Command Keyboard Telegram
  const quickKeyboards = [
    { cmd: '/start', desc: 'Menu' },
    { cmd: '/sensor', desc: 'DHT11' },
    { cmd: '/lampu1_on', desc: 'L1 On' },
    { cmd: '/lampu1_off', desc: 'L1 Off' },
    { cmd: '/all_off', desc: 'Semua Off' },
  ];

  return (
    <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col h-[580px] md:h-[620px] transition-all duration-300 hover:border-white/20" id="telegram-simulator-frame">
      
      {/* Telegram App Header */}
      <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-400 to-blue-600 flex items-center justify-center font-bold text-slate-100 shadow">
            TB
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-1.5">
              <span>SmartHome Bot</span>
              <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            </h3>
            <p className="text-[10px] text-sky-400 font-medium">bot • online</p>
          </div>
        </div>

        {/* Telegram Icon badge */}
        <div className="flex items-center gap-2 text-slate-400 bg-sky-950/40 border border-sky-450/10 px-2.5 py-1 rounded-full text-[10px] font-mono select-none">
          <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
          <span>TELEGRAM WEB</span>
        </div>
      </div>

      {/* Connection Indicator Warning */}
      {!isEspOnline && (
        <div className="bg-amber-950/40 border-b border-amber-500/10 px-4 py-2 text-center text-[11px] text-amber-400 font-medium flex items-center justify-center gap-1">
          ⚠️ ESP32 offline! Bot dapat merespon tetapi perubahan tidak akan tersinkronisasi ke hardware.
        </div>
      )}

      {/* Voice feedback line */}
      {speechFeedback && (
        <div className="bg-indigo-950/70 border-b border-indigo-500/20 px-4 py-1.5 text-center text-xs text-indigo-300 font-medium flex items-center justify-center gap-2">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400 animate-bounce" />
          <span>{speechFeedback}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-grow p-4 overflow-y-auto space-y-3 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 scrollbar-thin">
        
        {/* Info start bubble */}
        <div className="mx-auto max-w-[280px] bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3 text-center text-[11px] text-slate-400 leading-relaxed shadow-sm">
          <HelpCircle className="w-4 h-4 mx-auto mb-1 text-sky-400" />
          <span className="font-bold text-slate-300">Selamat datang di SmartHome Bot!</span> 
          <p className="mt-1">Ketik perintah, klik menu cepat, atau gunakan fitur suara untuk mengendalikan sirkuit rumah tangga secara instan.</p>
        </div>

        {chatMessages.map((msg) => {
          const isUser = msg.sender === 'user';
          return (
            <div 
              key={msg.id}
              className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
            >
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-xs relative ${
                  isUser 
                    ? 'bg-sky-605 text-slate-100 rounded-tr-none shadow-md' 
                    : 'bg-slate-900 text-slate-200 border border-slate-800/80 rounded-tl-none shadow'
                }`}
              >
                {/* Voice message tag */}
                {msg.isVoice && (
                  <div className="flex items-center gap-1.5 mb-1 bg-sky-700/30 text-sky-100 px-1.5 py-0.5 rounded text-[10px] font-mono">
                    <Volume2 className="w-3 h-3 text-sky-300" />
                    <span>Perintah Suara</span>
                  </div>
                )}
                
                {/* Text body */}
                <div className="whitespace-pre-wrap leading-relaxed">
                  {msg.text}
                </div>

                {/* Footer status / meta */}
                <div className="flex items-center justify-end gap-1 mt-1 text-[9px] text-slate-400/80 font-mono">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-sky-200" />}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={chatEndRef} />
      </div>

      {/* Simulated Interactive Keyboards (ReplyKeyboardMarkup) */}
      <div className="p-3 bg-slate-950 border-t border-slate-850 space-y-2.5">
        
        {/* Quick Menu Commands */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono flex items-center gap-1">
            <Command className="w-3 h-3 text-sky-400" />
            <span>Menu Cepat Telegram (Inline Buttons)</span>
          </span>
          <div className="flex flex-wrap gap-1.5">
            {quickKeyboards.map((kb) => (
              <button
                key={kb.cmd}
                type="button"
                id={`btn-quick-cmd-${kb.cmd}`}
                onClick={() => onSendMessage(kb.cmd)}
                className="bg-slate-900 border border-slate-800 hover:bg-sky-950 hover:border-sky-800/50 transition-colors text-slate-300 hover:text-sky-300 font-mono text-[10px] px-2.5 py-1 rounded-md text-left flex items-center justify-between gap-1.5 cursor-pointer shadow-sm font-semibold"
                title={kb.desc}
              >
                <span>{kb.cmd}</span>
                <span className="text-[9px] opacity-60 font-sans italic">({kb.desc})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Voice presets simulation buttons */}
        <div>
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block mb-1.5 font-mono flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" />
            <span>Simulasi Ucap Suara (Voice Presets)</span>
          </span>
          <div className="grid grid-cols-3 gap-1">
            {voicePresets.map((preset) => (
              <button
                key={preset.text}
                type="button"
                id={`btn-voice-preset-${preset.text.replace(/\s+/g, '-').toLowerCase()}`}
                onClick={() => onSendMessage(`“${preset.text}”`, true)}
                className="bg-slate-900 border border-slate-800/80 hover:bg-indigo-950 hover:border-indigo-800/50 transition-colors text-[10.5px] text-slate-300 font-medium py-1 px-1.5 rounded-lg text-center flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>{preset.icon}</span>
                <span className="truncate">{preset.text}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Traditional Input Bar with speech recognition toggle */}
        <form onSubmit={handleSendText} className="flex items-center gap-2 pt-1 border-t border-slate-800/40">
          
          {/* Micro Recording Button */}
          <button
            type="button"
            id="btn-telegram-mic"
            onClick={toggleRecording}
            className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors cursor-pointer shadow-md ${
              isRecording 
                ? 'bg-red-600 border-red-500 text-white animate-pulse' 
                : 'bg-slate-900 hover:bg-slate-850 border-slate-800 text-slate-400 hover:text-sky-400'
            }`}
            title={isSpeechSupported ? "Gunakan mikrofon Anda untuk perintah suara asli" : "Mikrofon tidak didukung browser ini"}
          >
            {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          
          <input 
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            id="telegram-text-input"
            placeholder="Tulis pesan atau jalankan cmd..."
            className="flex-grow bg-slate-900 border border-slate-800 focus:border-sky-500 rounded-xl px-3.5 py-2 text-xs text-slate-200 outline-none placeholder-slate-500 shadow-inner"
          />

          <button
            type="submit"
            id="btn-telegram-submit"
            disabled={!inputText.trim()}
            className="p-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 transition-colors text-slate-100 flex items-center justify-center cursor-pointer shadow-md disabled:bg-slate-800 disabled:text-slate-600 disabled:cursor-not-allowed"
          >
            <Send className="w-4 h-4" />
          </button>

        </form>
      </div>

    </div>
  );
}
