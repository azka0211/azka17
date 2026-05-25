export interface Relay {
  id: number;
  name: string;
  pin: number;
  status: boolean;
  type: string; // 'utama' | 'kamar' | 'variasi1' | 'variasi2'
}

export interface SensorData {
  temperature: number;
  humidity: number;
  lastUpdated: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'SYSTEM' | 'WIFI' | 'TELEGRAM' | 'DHT' | 'RELAY';
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
  isVoice?: boolean;
}
