/*
 * ═══════════════════════════════════════════════════════════════
 *  SPEAK EASY — useVoiceRecognition Hook
 *
 *  Web Speech API SpeechRecognition wrapper
 *
 *  Features:
 *  - Mobile-safe speech recognition
 *  - Duplicate-result protection
 *  - Overlap-aware transcript merging
 *  - Interim transcript handling
 *  - Continuous recognition
 *  - Automatic mobile recognition restart
 *  - Pause detection
 *  - Microphone permission handling
 *  - Safe recognition lifecycle
 * ═══════════════════════════════════════════════════════════════
 */

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  VoiceState,
  VoiceError,
  VoiceRecognitionResult,
} from '@/types/voice';
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

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

function normalizeForComparison(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

function appendWithoutDuplicate(
  existing: string,
  incoming: string
): string {
  const cleanIncoming = incoming.trim();

  if (!cleanIncoming) {
    return existing;
  }

  if (!existing.trim()) {
    return cleanIncoming;
  }

  const existingNormalized =
    normalizeForComparison(existing);

  const incomingNormalized =
    normalizeForComparison(cleanIncoming);

  if (
    existingNormalized ===
    incomingNormalized
  ) {
    return existing;
  }

  if (
    existingNormalized.endsWith(
      ` ${incomingNormalized}`
    ) ||
    existingNormalized.endsWith(
      incomingNormalized
    )
  ) {
    return existing;
  }

  if (
    incomingNormalized.startsWith(
      `${existingNormalized} `
    )
  ) {
    const remaining =
      cleanIncoming
        .slice(existing.length)
        .trim();

    if (remaining) {
      return `${existing} ${remaining}`;
    }

    return existing;
  }

  const existingWords =
    existingNormalized.split(' ');

  const incomingWords =
    incomingNormalized.split(' ');

  const maxOverlap = Math.min(
    existingWords.length,
    incomingWords.length
  );

  for (
    let length = maxOverlap;
    length >= 1;
    length--
  ) {
    const existingTail =
      existingWords
        .slice(
          existingWords.length - length
        )
        .join(' ');

    const incomingHead =
      incomingWords
        .slice(0, length)
        .join(' ');

    if (
      existingTail ===
      incomingHead
    ) {
      const incomingOriginalWords =
        cleanIncoming.split(/\s+/);

      const remainingWords =
        incomingOriginalWords.slice(
          length
        );

      if (
        remainingWords.length === 0
      ) {
        return existing;
      }

      return `${existing} ${remainingWords.join(' ')}`;
    }
  }

  return `${existing} ${cleanIncoming}`;
}

export function useVoiceRecognition(
  options: UseVoiceRecognitionOptions = {}
): UseVoiceRecognitionReturn {
  const {
    language = DEFAULT_VOICE_CONFIG.language,
    continuous = DEFAULT_VOICE_CONFIG.continuous,
    interimResults =
      DEFAULT_VOICE_CONFIG.interimResults,
    onResult,
    onInterim,
    onEnd,
    onPause,
  } = options;

  const [state, setState] =
    useState<VoiceState>('idle');

  const [transcript, setTranscript] =
    useState('');

  const [interimTranscript, setInterimTranscript] =
    useState('');

  const [confidence, setConfidence] =
    useState(0);

  const [error, setError] =
    useState<VoiceError | null>(null);

  const [isSupported, setIsSupported] =
    useState(false);

  const [pauseTimestamps, setPauseTimestamps] =
    useState<
      Array<{
        start: number;
        duration: number;
      }>
    >([]);

  const recognitionRef =
    useRef<any>(null);

  /*
   * Permanent transcript.
   */
  const transcriptRef =
    useRef('');

  /*
   * Transcript generated during the
   * current recognition instance.
   */
  const sessionTranscriptRef =
    useRef('');

  /*
   * Prevent stale recognition instances
   * from modifying current state.
   */
  const sessionIdRef =
    useRef(0);

  /*
   * Whether the user currently wants
   * recognition to continue.
   */
  const listeningRef =
    useRef(false);

  /*
   * Whether the user explicitly stopped
   * the recording.
   */
  const manuallyStoppedRef =
    useRef(false);

  /*
   * Automatic restart timer.
   */
  const restartTimeoutRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null
    );

  /*
   * Pause detection.
   */
  const lastSpeechTimeRef =
    useRef(0);

  const startTimeRef =
    useRef(0);

  const pauseIntervalRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null
    );

  const pauseReportedRef =
    useRef(false);

  /*
   * Prevent duplicate final callbacks.
   */
  const endHandledRef =
    useRef(false);

  /*
   * Latest start function.
   */
  const startListeningRef =
    useRef<(() => void) | null>(null);

  /*
   * Final recognition results already
   * processed by the current browser
   * recognition instance.
   */
  const processedFinalResultsRef =
    useRef<Set<string>>(new Set());

  /*
   * Check browser support.
   */
  useEffect(() => {
    if (
      typeof window === 'undefined'
    ) {
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    const supported =
      !!SpeechRecognition;

    setIsSupported(supported);

    if (supported) {
      setState('ready');
    }

    return () => {
      listeningRef.current =
        false;

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      if (
        pauseIntervalRef.current
      ) {
        clearInterval(
          pauseIntervalRef.current
        );

        pauseIntervalRef.current =
          null;
      }

      const recognition =
        recognitionRef.current;

      recognitionRef.current =
        null;

      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, []);

  /*
   * Pause detection.
   */
  const startPauseDetection =
    useCallback(() => {
      if (
        pauseIntervalRef.current
      ) {
        clearInterval(
          pauseIntervalRef.current
        );
      }

      pauseReportedRef.current =
        false;

      pauseIntervalRef.current =
        setInterval(() => {
          if (
            !listeningRef.current
          ) {
            return;
          }

          const now =
            Date.now();

          const silenceDuration =
            (now -
              lastSpeechTimeRef.current) /
            1000;

          if (
            silenceDuration >= 2 &&
            !pauseReportedRef.current
          ) {
            const pauseStart =
              (lastSpeechTimeRef.current -
                startTimeRef.current) /
              1000;

            pauseReportedRef.current =
              true;

            const pause = {
              start: pauseStart,
              duration: silenceDuration,
            };

            setPauseTimestamps(
              previous => [
                ...previous,
                pause,
              ]
            );

            onPause?.(
              pauseStart,
              silenceDuration
            );
          }
        }, 500);
    }, [onPause]);

  const stopPauseDetection =
    useCallback(() => {
      if (
        pauseIntervalRef.current
      ) {
        clearInterval(
          pauseIntervalRef.current
        );

        pauseIntervalRef.current =
          null;
      }

      pauseReportedRef.current =
        false;
    }, []);

  /*
   * Create a recognition instance.
   */
  const createRecognition =
    useCallback(() => {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        return null;
      }

      const recognition =
        new SpeechRecognition();

      recognition.lang =
        language;

      recognition.continuous =
        continuous;

      recognition.interimResults =
        interimResults;

      recognition.maxAlternatives =
        1;

      const sessionId =
        ++sessionIdRef.current;

      processedFinalResultsRef.current =
        new Set();

      recognition.onstart = () => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        setState('listening');
        setError(null);

        startTimeRef.current =
          Date.now();

        lastSpeechTimeRef.current =
          Date.now();

        pauseReportedRef.current =
          false;
      };

      recognition.onresult = (
        event: SpeechRecognitionEvent
      ) => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        lastSpeechTimeRef.current =
          Date.now();

        pauseReportedRef.current =
          false;

        let newFinal = '';
        let currentInterim = '';

        const startIndex =
          Math.max(
            0,
            event.resultIndex || 0
          );

        for (
          let i = startIndex;
          i < event.results.length;
          i++
        ) {
          const result =
            event.results[i];

          if (
            !result ||
            !result[0]
          ) {
            continue;
          }

          const text =
            result[0].transcript
              ?.trim();

          if (!text) {
            continue;
          }

          if (
            result.isFinal
          ) {
            const normalized =
              normalizeForComparison(
                text
              );

            if (
              processedFinalResultsRef
                .current
                .has(normalized)
            ) {
              continue;
            }

            processedFinalResultsRef
              .current
              .add(normalized);

            newFinal =
              appendWithoutDuplicate(
                newFinal,
                text
              );

            setConfidence(
              result[0].confidence ||
                0
            );
          } else {
            currentInterim =
              appendWithoutDuplicate(
                currentInterim,
                text
              );
          }
        }

        if (newFinal) {
          sessionTranscriptRef.current =
            appendWithoutDuplicate(
              sessionTranscriptRef.current,
              newFinal
            );
        }

        const completeTranscript =
          appendWithoutDuplicate(
            transcriptRef.current,
            sessionTranscriptRef.current
          );

        setTranscript(
          completeTranscript
        );

        setInterimTranscript(
          currentInterim
        );

        if (newFinal) {
          onResult?.({
            transcript:
              completeTranscript,
            confidence:
              event.results[
                event.results.length - 1
              ]?.[0]?.confidence || 0,
            isFinal: true,
            timestamp: Date.now(),
          });
        }

        if (currentInterim) {
          onInterim?.(
            currentInterim
          );
        }
      };

      recognition.onerror = (
        event: SpeechRecognitionErrorEvent
      ) => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        /*
         * no-speech is normal on mobile.
         * Let onend handle the restart.
         */
        if (
          event.error ===
          'no-speech'
        ) {
          return;
        }

        const errorMap: Record<
          string,
          VoiceError['type']
        > = {
          'not-allowed':
            'permission-denied',
          'service-not-allowed':
            'permission-denied',
          'no-speech':
            'no-speech',
          network:
            'network',
          aborted:
            'aborted',
        };

        const errorType =
          errorMap[event.error] ||
          'unknown';

        const errorMessages: Record<
          VoiceError['type'],
          string
        > = {
          'permission-denied':
            'Microphone access was denied. Please allow microphone access in your browser settings and try again.',

          'not-supported':
            'Speech recognition is not supported in this browser. Please use Chrome, Edge, or Safari.',

          network:
            'Network error during speech recognition. Please check your connection and try again.',

          'no-speech':
            'No speech was detected. Please try speaking again.',

          aborted:
            'Speech recognition was interrupted. Please try again.',

          unknown:
            `Speech recognition error: ${event.error}. Please try again.`,
        };

        setError({
          type: errorType,
          message:
            errorMessages[errorType],
          timestamp: Date.now(),
        });

        setState('error');
      };

      recognition.onend = () => {
        if (
          sessionId !==
          sessionIdRef.current
        ) {
          return;
        }

        /*
         * Commit the current session.
         */
        if (
          sessionTranscriptRef.current
        ) {
          transcriptRef.current =
            appendWithoutDuplicate(
              transcriptRef.current,
              sessionTranscriptRef.current
            );

          sessionTranscriptRef.current =
            '';

          setTranscript(
            transcriptRef.current
          );
        }

        setInterimTranscript('');

        /*
         * Browser ended recognition,
         * but the user still wants recording.
         *
         * Restart without calling onEnd.
         */
        if (
          listeningRef.current &&
          continuous
        ) {
          if (
            restartTimeoutRef.current
          ) {
            clearTimeout(
              restartTimeoutRef.current
            );
          }

          restartTimeoutRef.current =
            setTimeout(() => {
              restartTimeoutRef.current =
                null;

              if (
                listeningRef.current &&
                startListeningRef.current
              ) {
                startListeningRef.current();
              }
            }, 150);

          return;
        }

        /*
         * Actual user stop / pause.
         */
        setState('ready');

        if (
          !endHandledRef.current &&
          !manuallyStoppedRef.current
        ) {
          endHandledRef.current =
            true;

          onEnd?.();
        }
      };

      return recognition;
    }, [
      language,
      continuous,
      interimResults,
      onResult,
      onInterim,
      onEnd,
    ]);

  /*
   * Start listening.
   */
  const startListening =
    useCallback(() => {
      if (!isSupported) {
        setError({
          type: 'not-supported',
          message:
            'Speech recognition is not supported in this browser.',
          timestamp: Date.now(),
        });

        return;
      }

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      const oldRecognition =
        recognitionRef.current;

      recognitionRef.current =
        null;

      if (oldRecognition) {
        try {
          oldRecognition.stop();
        } catch {}
      }

      listeningRef.current =
        true;

      manuallyStoppedRef.current =
        false;

      endHandledRef.current =
        false;

      startTimeRef.current =
        Date.now();

      lastSpeechTimeRef.current =
        Date.now();

      const recognition =
        createRecognition();

      if (!recognition) {
        listeningRef.current =
          false;

        return;
      }

      recognitionRef.current =
        recognition;

      try {
        recognition.start();

        setState('listening');
        setError(null);

        startPauseDetection();
      } catch {
        recognitionRef.current =
          null;

        listeningRef.current =
          false;

        setState('error');

        setError({
          type: 'unknown',
          message:
            'Failed to start speech recognition. Please try again.',
          timestamp: Date.now(),
        });
      }
    }, [
      isSupported,
      createRecognition,
      startPauseDetection,
    ]);

  useEffect(() => {
    startListeningRef.current =
      startListening;
  }, [startListening]);

  /*
   * Stop listening.
   */
  const stopListening =
    useCallback(() => {
      listeningRef.current =
        false;

      manuallyStoppedRef.current =
        true;

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      stopPauseDetection();

      sessionIdRef.current++;

      const recognition =
        recognitionRef.current;

      recognitionRef.current =
        null;

      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }

      if (
        sessionTranscriptRef.current
      ) {
        transcriptRef.current =
          appendWithoutDuplicate(
            transcriptRef.current,
            sessionTranscriptRef.current
          );

        sessionTranscriptRef.current =
          '';
      }

      setTranscript(
        transcriptRef.current
      );

      setInterimTranscript('');

      setState('ready');

      if (
        !endHandledRef.current
      ) {
        endHandledRef.current =
          true;

        onEnd?.();
      }
    }, [
      stopPauseDetection,
      onEnd,
    ]);

  /*
   * Pause listening.
   */
  const pauseListening =
    useCallback(() => {
      listeningRef.current =
        false;

      manuallyStoppedRef.current =
        false;

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      stopPauseDetection();

      sessionIdRef.current++;

      const recognition =
        recognitionRef.current;

      recognitionRef.current =
        null;

      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }

      if (
        sessionTranscriptRef.current
      ) {
        transcriptRef.current =
          appendWithoutDuplicate(
            transcriptRef.current,
            sessionTranscriptRef.current
          );

        sessionTranscriptRef.current =
          '';
      }

      setTranscript(
        transcriptRef.current
      );

      setInterimTranscript('');

      setState('paused');
    }, [
      stopPauseDetection,
    ]);

  /*
   * Resume listening.
   */
  const resumeListening =
    useCallback(() => {
      if (!isSupported) {
        return;
      }

      if (
        restartTimeoutRef.current
      ) {
        clearTimeout(
          restartTimeoutRef.current
        );

        restartTimeoutRef.current =
          null;
      }

      listeningRef.current =
        true;

      manuallyStoppedRef.current =
        false;

      endHandledRef.current =
        false;

      const recognition =
        createRecognition();

      if (!recognition) {
        return;
      }

      recognitionRef.current =
        recognition;

      try {
        recognition.start();

        setState('listening');
        setError(null);

        startTimeRef.current =
          Date.now();

        lastSpeechTimeRef.current =
          Date.now();

        startPauseDetection();
      } catch {
        recognitionRef.current =
          null;

        listeningRef.current =
          false;

        setState('error');
      }
    }, [
      isSupported,
      createRecognition,
      startPauseDetection,
    ]);

  /*
   * Reset transcript.
   */
  const resetTranscript =
    useCallback(() => {
      transcriptRef.current =
        '';

      sessionTranscriptRef.current =
        '';

      processedFinalResultsRef
        .current
        .clear();

      setTranscript('');

      setInterimTranscript('');

      setConfidence(0);

      setError(null);

      setPauseTimestamps([]);

      pauseReportedRef.current =
        false;
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