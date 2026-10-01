/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — useVoiceRecognition Hook
   
   Wraps the Web Speech API SpeechRecognition with:
   - State management (idle/ready/listening/error)
   - Interim and final transcript handling
   - Error recovery with descriptive messages
   - Microphone permission handling
   - Automatic pause detection
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { VoiceState, VoiceError, VoiceRecognitionResult } from '@/types/voice';
import { DEFAULT_VOICE_CONFIG } from '@/lib/constants';

interface UseVoiceRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (result: VoiceRecognitionResult) => void;
  onInterim?: (transcript: string) => void;
  onEnd?: () => void;
  onPause?: (timestamp: number, duration: number) => void;
}

interface UseVoiceRecognitionReturn {
  state: VoiceState;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  error: VoiceError | null;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  pauseListening: () => void;
  resumeListening: () => void;
  resetTranscript: () => void;
  pauseTimestamps: Array<{ start: number; duration: number }>;
}

// Extend Window for SpeechRecognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = DEFAULT_VOICE_CONFIG.language,
    continuous = DEFAULT_VOICE_CONFIG.continuous,
    interimResults = DEFAULT_VOICE_CONFIG.interimResults,
    onResult,
    onInterim,
    onEnd,
    onPause,
  } = options;

  const [state, setState] = useState<VoiceState>('idle');
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [error, setError] = useState<VoiceError | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [pauseTimestamps, setPauseTimestamps] = useState<Array<{ start: number; duration: number }>>([]);

  const recognitionRef = useRef<any>(null);
  const lastSpeechTimeRef = useRef<number>(0);
  const pauseCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(0);

  // Check browser support
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      setState('ready');
    }

    return () => {
      if (pauseCheckIntervalRef.current) {
        clearInterval(pauseCheckIntervalRef.current);
      }
    };
  }, []);

  // Initialize recognition instance
  const initRecognition = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return null;

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState('listening');
      setError(null);
      startTimeRef.current = Date.now();
      lastSpeechTimeRef.current = Date.now();
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      lastSpeechTimeRef.current = Date.now();
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
          setConfidence(result[0].confidence);
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript(prev => {
          const updated = prev + (prev ? ' ' : '') + finalTranscript;
          onResult?.({
            transcript: finalTranscript,
            confidence: event.results[event.results.length - 1][0].confidence,
            isFinal: true,
            timestamp: Date.now(),
          });
          return updated;
        });
        setInterimTranscript('');
      }

      if (interim) {
        setInterimTranscript(interim);
        onInterim?.(interim);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const errorMap: Record<string, VoiceError['type']> = {
        'not-allowed': 'permission-denied',
        'no-speech': 'no-speech',
        'network': 'network',
        'aborted': 'aborted',
      };

      const errorType = errorMap[event.error] || 'unknown';
      const errorMessages: Record<VoiceError['type'], string> = {
        'permission-denied': 'Microphone access was denied. Please allow microphone access in your browser settings and try again.',
        'not-supported': 'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',
        'network': 'Network error during speech recognition. Please check your connection and try again.',
        'no-speech': 'No speech was detected. Please try speaking again.',
        'aborted': 'Speech recognition was interrupted. Click the microphone to try again.',
        'unknown': `Speech recognition error: ${event.error}. Please try again.`,
      };

      const voiceError: VoiceError = {
        type: errorType,
        message: errorMessages[errorType],
        timestamp: Date.now(),
      };

      setError(voiceError);

      // Only set error state for critical errors, not 'no-speech'
      if (errorType !== 'no-speech') {
        setState('error');
      }
    };

    recognition.onend = () => {
      if (state === 'listening') {
        // Auto-restart if continuous mode and not manually stopped
        if (continuous && recognitionRef.current) {
          try {
            recognition.start();
          } catch {
            setState('ready');
            onEnd?.();
          }
        } else {
          setState('ready');
          onEnd?.();
        }
      }
    };

    return recognition;
  }, [language, continuous, interimResults, onResult, onInterim, onEnd, state]);

  // Start listening
  const startListening = useCallback(() => {
    if (!isSupported) {
      setError({
        type: 'not-supported',
        message: 'Speech recognition is not supported in this browser.',
        timestamp: Date.now(),
      });
      return;
    }

    // Stop existing instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
    }

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;
    setPauseTimestamps([]);

    try {
      recognition.start();
    } catch (err) {
      setError({
        type: 'unknown',
        message: 'Failed to start speech recognition. Please try again.',
        timestamp: Date.now(),
      });
      setState('error');
    }

    // Start pause detection
    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
    }

    pauseCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const silenceDuration = (now - lastSpeechTimeRef.current) / 1000;

      if (silenceDuration >= 2) {
        const pauseStart = (lastSpeechTimeRef.current - startTimeRef.current) / 1000;
        onPause?.(pauseStart, silenceDuration);
      }
    }, 500);
  }, [isSupported, initRecognition, onPause]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // Set to null before stop to prevent auto-restart

      try {
        ref.stop();
      } catch {}
    }

    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
      pauseCheckIntervalRef.current = null;
    }

    setState('ready');
    setInterimTranscript('');
    onEnd?.();
  }, [onEnd]);

  // Pause listening
  const pauseListening = useCallback(() => {
    if (recognitionRef.current) {
      const ref = recognitionRef.current;
      recognitionRef.current = null; // Set to null before stop to prevent auto-restart
      try {
        ref.stop();
      } catch {}
    }

    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
      pauseCheckIntervalRef.current = null;
    }

    setState('paused');
  }, []);

  // Resume listening
  const resumeListening = useCallback(() => {
    if (!isSupported) return;

    const recognition = initRecognition();
    if (!recognition) return;

    recognitionRef.current = recognition;

    try {
      recognition.start();
      setState('listening');
    } catch (err) {
      setState('error');
    }

    if (pauseCheckIntervalRef.current) {
      clearInterval(pauseCheckIntervalRef.current);
    }

    pauseCheckIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const silenceDuration = (now - lastSpeechTimeRef.current) / 1000;

      if (silenceDuration >= 2) {
        const pauseStart = (lastSpeechTimeRef.current - startTimeRef.current) / 1000;
        onPause?.(pauseStart, silenceDuration);
      }
    }, 500);
  }, [isSupported, initRecognition, onPause]);

  // Reset transcript
  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
    setError(null);
    setPauseTimestamps([]);
  }, []);

  return {
    state,
    transcript,
    interimTranscript,
    confidence,
    error,
    isSupported,
    startListening,
    stopListening,
    pauseListening,
    resumeListening,
    resetTranscript,
    pauseTimestamps,
  };
}
