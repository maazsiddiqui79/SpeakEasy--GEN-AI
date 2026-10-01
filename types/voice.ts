/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — Voice Types
   ═══════════════════════════════════════════════════════════════ */

export type VoiceState = 'idle' | 'ready' | 'listening' | 'paused' | 'analyzing' | 'speaking' | 'error';

export interface VoiceConfig {
  language: string;
  continuous: boolean;
  interimResults: boolean;
}

export interface VoiceRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  timestamp: number;
}

export interface VoiceError {
  type: 'permission-denied' | 'not-supported' | 'network' | 'no-speech' | 'aborted' | 'unknown';
  message: string;
  timestamp: number;
}

export interface VoiceSynthesisConfig {
  rate: number;
  pitch: number;
  volume: number;
  voice?: SpeechSynthesisVoice;
}
