/* ═══════════════════════════════════════════════════════════════
   SPEAK EASY — useVoiceSynthesis Hook
   
   Wraps the Web Speech API SpeechSynthesis with:
   - Voice selection (preferring natural-sounding voices)
   - Playback controls (play, pause, resume, stop)
   - State management
   - Queue management
   ═══════════════════════════════════════════════════════════════ */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

type SynthesisState = 'idle' | 'speaking' | 'paused';

interface UseVoiceSynthesisOptions {
  rate?: number;
  pitch?: number;
  volume?: number;
  preferredVoiceName?: string;
  languageCode?: string;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

interface UseVoiceSynthesisReturn {
  state: SynthesisState;
  speak: (text: string) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  isSupported: boolean;
  availableVoices: SpeechSynthesisVoice[];
  selectedVoice: SpeechSynthesisVoice | null;
  setVoice: (voice: SpeechSynthesisVoice) => void;
}

export function useVoiceSynthesis(
  options: UseVoiceSynthesisOptions = {}
): UseVoiceSynthesisReturn {
  const {
    rate = 1.0,
    pitch = 1.0,
    volume = 1.0,
    preferredVoiceName,
    languageCode,
    onStart,
    onEnd,
    onError,
  } = options;

  const [state, setState] = useState<SynthesisState>('idle');
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Check support and load voices
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const supported = 'speechSynthesis' in window;
    setIsSupported(supported);

    if (!supported) return;

    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      setAvailableVoices(voices);

      // Select preferred voice
      if (voices.length > 0) {
        let voice: SpeechSynthesisVoice | undefined;

        // Try languageCode first
        if (languageCode) {
          const langCodeBase = languageCode.split('-')[0].toLowerCase();
          const langVoices = voices.filter(v => v.lang.toLowerCase().startsWith(langCodeBase));
          if (langVoices.length > 0) {
            // prefer natural
            voice = langVoices.find(v => v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')) || langVoices[0];
          }
        }

        // Try preferred voice name if no voice found yet
        if (!voice && preferredVoiceName) {
          voice = voices.find(v =>
            v.name.toLowerCase().includes(preferredVoiceName.toLowerCase())
          );
        }

        // Fallback: prefer English, natural-sounding voices
        if (!voice) {
          const englishVoices = voices.filter(v => v.lang.startsWith('en'));

          // Prefer Google or Microsoft voices (tend to sound more natural)
          voice = englishVoices.find(v =>
            v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural')
          );

          // Fallback to any English female voice (typically clearer for instruction)
          if (!voice) {
            voice = englishVoices.find(v =>
              v.name.includes('Female') || v.name.includes('Samantha') || v.name.includes('Zira')
            );
          }

          // Fallback to any English voice
          if (!voice && englishVoices.length > 0) {
            voice = englishVoices[0];
          }
        }

        // Last resort: first available voice
        if (!voice) voice = voices[0];

        setSelectedVoice(voice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [preferredVoiceName, languageCode]);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!isSupported || !text.trim()) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = rate;
    utterance.pitch = pitch;
    utterance.volume = volume;

    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }

    utterance.onstart = () => {
      setState('speaking');
      onStart?.();
    };

    utterance.onend = () => {
      setState('idle');
      onEnd?.();
    };

    utterance.onerror = (event) => {
      setState('idle');
      onError?.(event.error);
    };

    utterance.onpause = () => {
      setState('paused');
    };

    utterance.onresume = () => {
      setState('speaking');
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [isSupported, rate, pitch, volume, selectedVoice, onStart, onEnd, onError]);

  // Pause speech
  const pause = useCallback(() => {
    if (isSupported && state === 'speaking') {
      window.speechSynthesis.pause();
    }
  }, [isSupported, state]);

  // Resume speech
  const resume = useCallback(() => {
    if (isSupported && state === 'paused') {
      window.speechSynthesis.resume();
    }
  }, [isSupported, state]);

  // Stop speech
  const stop = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setState('idle');
    }
  }, [isSupported]);

  // Set voice
  const setVoice = useCallback((voice: SpeechSynthesisVoice) => {
    setSelectedVoice(voice);
  }, []);

  return {
    state,
    speak,
    pause,
    resume,
    stop,
    isSupported,
    availableVoices,
    selectedVoice,
    setVoice,
  };
}
