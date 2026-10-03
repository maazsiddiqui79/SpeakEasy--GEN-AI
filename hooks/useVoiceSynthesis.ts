/*
 * ═══════════════════════════════════════════════════════════════
 *  SPEAK EASY — useVoiceSynthesis Hook
 *
 *  Wraps the Web Speech API SpeechSynthesis with:
 *  - Voice selection
 *  - Natural-sounding voice preference
 *  - Playback controls
 *  - State management
 *  - Queue management
 *  - Safe utterance lifecycle
 * ═══════════════════════════════════════════════════════════════
 */

'use client';

import {
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';

type SynthesisState =
  | 'idle'
  | 'speaking'
  | 'paused';

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
  setVoice: (
    voice: SpeechSynthesisVoice
  ) => void;
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

  const [state, setState] =
    useState<SynthesisState>('idle');

  const [isSupported, setIsSupported] =
    useState(false);

  const [availableVoices, setAvailableVoices] =
    useState<SpeechSynthesisVoice[]>([]);

  const [selectedVoice, setSelectedVoice] =
    useState<SpeechSynthesisVoice | null>(
      null
    );

  const utteranceRef =
    useRef<SpeechSynthesisUtterance | null>(
      null
    );

  /*
   * Used to invalidate callbacks belonging
   * to an old utterance.
   */
  const utteranceIdRef =
    useRef(0);

  /*
   * Prevent stale callbacks after stop/cancel.
   */
  const stoppedRef =
    useRef(false);

  /*
   * Keep callbacks current without
   * rebuilding speech functions unnecessarily.
   */
  const onStartRef =
    useRef(onStart);

  const onEndRef =
    useRef(onEnd);

  const onErrorRef =
    useRef(onError);

  useEffect(() => {
    onStartRef.current =
      onStart;

    onEndRef.current =
      onEnd;

    onErrorRef.current =
      onError;
  }, [
    onStart,
    onEnd,
    onError,
  ]);

  /*
   * Check support and load voices.
   */
  useEffect(() => {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    const supported =
      'speechSynthesis' in window &&
      'SpeechSynthesisUtterance' in
        window;

    setIsSupported(supported);

    if (!supported) {
      return;
    }

    const loadVoices = () => {
      const voices =
        window.speechSynthesis
          .getVoices();

      setAvailableVoices(
        voices
      );

      if (
        voices.length === 0
      ) {
        return;
      }

      let voice:
        | SpeechSynthesisVoice
        | undefined;

      /*
       * 1. Explicit preferred voice.
       */
      if (
        preferredVoiceName
      ) {
        voice =
          voices.find(v =>
            v.name
              .toLowerCase()
              .includes(
                preferredVoiceName
                  .toLowerCase()
              )
          );
      }

      /*
       * 2. Requested language.
       */
      if (
        !voice &&
        languageCode
      ) {
        const languageBase =
          languageCode
            .split('-')[0]
            .toLowerCase();

        const languageVoices =
          voices.filter(v =>
            v.lang
              .toLowerCase()
              .startsWith(
                languageBase
              )
          );

        if (
          languageVoices.length > 0
        ) {
          voice =
            languageVoices.find(v =>
              /natural|neural|google|microsoft/i.test(
                v.name
              )
            ) ||
            languageVoices[0];
        }
      }

      /*
       * 3. English natural voice.
       */
      if (!voice) {
        const englishVoices =
          voices.filter(v =>
            v.lang
              .toLowerCase()
              .startsWith('en')
          );

        voice =
          englishVoices.find(v =>
            /natural|neural|google|microsoft/i.test(
              v.name
            )
          );
      }

      /*
       * 4. English female/clear voices.
       */
      if (!voice) {
        const englishVoices =
          voices.filter(v =>
            v.lang
              .toLowerCase()
              .startsWith('en')
          );

        voice =
          englishVoices.find(v =>
            /female|samantha|zira|aria|jenny/i.test(
              v.name
            )
          );
      }

      /*
       * 5. Any English voice.
       */
      if (!voice) {
        const englishVoices =
          voices.filter(v =>
            v.lang
              .toLowerCase()
              .startsWith('en')
          );

        if (
          englishVoices.length > 0
        ) {
          voice =
            englishVoices[0];
        }
      }

      /*
       * 6. Last available voice.
       */
      if (!voice) {
        voice = voices[0];
      }

      /*
       * Don't overwrite a manually
       * selected voice.
       */
      setSelectedVoice(
        previous =>
          previous || voice || null
      );
    };

    loadVoices();

    window.speechSynthesis
      .addEventListener(
        'voiceschanged',
        loadVoices
      );

    return () => {
      window.speechSynthesis
        .removeEventListener(
          'voiceschanged',
          loadVoices
        );

      window.speechSynthesis
        .cancel();
    };
  }, [
    preferredVoiceName,
    languageCode,
  ]);

  /*
   * Speak.
   */
  const speak =
    useCallback(
      (text: string) => {
        if (
          !isSupported ||
          !text.trim()
        ) {
          return;
        }

        const speech =
          window.speechSynthesis;

        /*
         * Cancel previous speech.
         */
        speech.cancel();

        const utterance =
          new SpeechSynthesisUtterance(
            text.trim()
          );

        const currentId =
          ++utteranceIdRef.current;

        stoppedRef.current =
          false;

        utterance.rate =
          Math.min(
            Math.max(rate, 0.1),
            10
          );

        utterance.pitch =
          Math.min(
            Math.max(pitch, 0),
            2
          );

        utterance.volume =
          Math.min(
            Math.max(volume, 0),
            1
          );

        /*
         * Set language even when no
         * matching voice exists.
         */
        if (languageCode) {
          utterance.lang =
            languageCode;
        }

        if (selectedVoice) {
          utterance.voice =
            selectedVoice;
        }

        utterance.onstart =
          () => {
            if (
              currentId !==
              utteranceIdRef.current ||
              stoppedRef.current
            ) {
              return;
            }

            setState('speaking');

            onStartRef.current?.();
          };

        utterance.onpause =
          () => {
            if (
              currentId !==
              utteranceIdRef.current ||
              stoppedRef.current
            ) {
              return;
            }

            setState('paused');
          };

        utterance.onresume =
          () => {
            if (
              currentId !==
              utteranceIdRef.current ||
              stoppedRef.current
            ) {
              return;
            }

            setState('speaking');
          };

        utterance.onend =
          () => {
            if (
              currentId !==
              utteranceIdRef.current ||
              stoppedRef.current
            ) {
              return;
            }

            setState('idle');

            utteranceRef.current =
              null;

            onEndRef.current?.();
          };

        utterance.onerror =
          event => {
            if (
              currentId !==
              utteranceIdRef.current ||
              stoppedRef.current
            ) {
              return;
            }

            /*
             * "canceled" and "interrupted"
             * can occur when another utterance
             * starts. Don't treat them as a
             * serious application error.
             */
            if (
              event.error ===
                'canceled' ||
              event.error ===
                'interrupted'
            ) {
              setState('idle');

              utteranceRef.current =
                null;

              return;
            }

            setState('idle');

            utteranceRef.current =
              null;

            onErrorRef.current?.(
              event.error
            );
          };

        utteranceRef.current =
          utterance;

        /*
         * Some mobile browsers can retain
         * a paused speech queue.
         */
        try {
          speech.resume();
        } catch {}

        speech.speak(
          utterance
        );
      },
      [
        isSupported,
        rate,
        pitch,
        volume,
        languageCode,
        selectedVoice,
      ]
    );

  /*
   * Pause.
   */
  const pause =
    useCallback(() => {
      if (
        !isSupported
      ) {
        return;
      }

      if (
        state !== 'speaking'
      ) {
        return;
      }

      try {
        window.speechSynthesis
          .pause();

        setState('paused');
      } catch {}
    }, [
      isSupported,
      state,
    ]);

  /*
   * Resume.
   */
  const resume =
    useCallback(() => {
      if (
        !isSupported
      ) {
        return;
      }

      if (
        state !== 'paused'
      ) {
        return;
      }

      try {
        window.speechSynthesis
          .resume();

        setState('speaking');
      } catch {}
    }, [
      isSupported,
      state,
    ]);

  /*
   * Stop.
   */
  const stop =
    useCallback(() => {
      if (
        !isSupported
      ) {
        return;
      }

      stoppedRef.current =
        true;

      /*
       * Invalidate callbacks.
       */
      utteranceIdRef.current++;

      try {
        window.speechSynthesis
          .cancel();
      } catch {}

      utteranceRef.current =
        null;

      setState('idle');
    }, [
      isSupported,
    ]);

  /*
   * Select voice manually.
   */
  const setVoice =
    useCallback(
      (
        voice: SpeechSynthesisVoice
      ) => {
        setSelectedVoice(
          voice
        );
      },
      []
    );

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