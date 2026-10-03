'use client';

import {
  useState,
  useCallback,
  useRef,
  useEffect,
} from 'react';

import {
  useVoiceRecognition,
} from '@/hooks/useVoiceRecognition';

import {
  useVoiceSynthesis,
} from '@/hooks/useVoiceSynthesis';

import {
  VoiceState,
} from '@/types/voice';

import {
  MicIcon,
  PlayIcon,
} from '@/components/ui/Icons';

import Loader from '@/components/ui/Loader';

import styles from './VoiceEngine.module.css';

interface VoiceEngineProps {
  onTranscriptComplete: (
    transcript: string,
    duration: number
  ) => void;

  onStateChange?: (
    state: VoiceState
  ) => void;

  aiResponse?: string;

  disabled?: boolean;

  showTextFallback?: boolean;

  language?: {
    code: string;
    label: string;
    nativeLabel: string;
    flag: string;
    isEnglish: boolean;
  };
}

export default function VoiceEngine({
  onTranscriptComplete,
  onStateChange,
  aiResponse,
  disabled = false,
  showTextFallback = true,
  language,
}: VoiceEngineProps) {
  const [textInput, setTextInput] =
    useState('');

  const [showFallback, setShowFallback] =
    useState(false);

  const [recordingDuration, setRecordingDuration] =
    useState(0);

  const recordStartRef =
    useRef<number>(0);

  const accumulatedDurationRef =
    useRef<number>(0);

  const timerRef =
    useRef<
      ReturnType<typeof setInterval> | null
    >(null);

  const {
    state: recognitionState,
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
  } = useVoiceRecognition({
    onEnd: () => {
      if (
        transcript.trim()
      ) {
        const duration =
          accumulatedDurationRef.current +
          (
            recognitionState ===
              'listening'
              ? Math.floor(
                (
                  Date.now() -
                  recordStartRef.current
                ) / 1000
              )
              : 0
          );

        onTranscriptComplete(
          transcript,
          duration || 1
        );
      }
    },

    language:
      language?.code,
  });

  const {
    state: synthState,
    speak,
    pause: pauseSpeech,
    resume: resumeSpeech,
    stop: stopSpeech,
    isSupported: ttsSupported,
  } = useVoiceSynthesis({
    rate: 1.0,
    languageCode:
      language?.code,

    onEnd: () => {
      onStateChange?.(
        'ready'
      );
    },
  });

  /*
   * Derive combined voice state.
   */
  let voiceState:
    VoiceState = 'ready';

  if (
    synthState ===
    'speaking'
  ) {
    voiceState =
      'speaking';
  } else if (
    synthState ===
    'paused'
  ) {
    voiceState =
      'speaking';
  } else if (
    disabled
  ) {
    voiceState =
      'analyzing';
  } else if (
    recognitionState ===
    'listening'
  ) {
    voiceState =
      'listening';
  } else if (
    recognitionState ===
    'paused'
  ) {
    voiceState =
      'paused';
  } else if (
    recognitionState ===
    'error'
  ) {
    voiceState =
      'error';
  }

  useEffect(() => {
    onStateChange?.(
      voiceState
    );
  }, [
    voiceState,
    onStateChange,
  ]);

  /*
   * Speak AI response only when
   * explicitly requested by the parent.
   *
   * No automatic speech is triggered here.
   */
  const handlePlayAIResponse =
    useCallback(() => {
      if (
        aiResponse?.trim() &&
        ttsSupported
      ) {
        speak(
          aiResponse.trim()
        );
      }
    }, [
      aiResponse,
      ttsSupported,
      speak,
    ]);

  /*
   * Recording timer.
   */
  useEffect(() => {
    if (
      recognitionState ===
      'listening'
    ) {
      recordStartRef.current =
        Date.now();

      timerRef.current =
        setInterval(() => {
          setRecordingDuration(
            accumulatedDurationRef.current +
            Math.floor(
              (
                Date.now() -
                recordStartRef.current
              ) / 1000
            )
          );
        }, 1000);
    } else if (
      recognitionState ===
      'paused'
    ) {
      if (
        timerRef.current
      ) {
        clearInterval(
          timerRef.current
        );

        timerRef.current =
          null;
      }

      accumulatedDurationRef.current +=
        Math.floor(
          (
            Date.now() -
            recordStartRef.current
          ) / 1000
        );
    } else {
      if (
        timerRef.current
      ) {
        clearInterval(
          timerRef.current
        );

        timerRef.current =
          null;
      }

      accumulatedDurationRef.current =
        0;

      setRecordingDuration(
        0
      );
    }

    return () => {
      if (
        timerRef.current
      ) {
        clearInterval(
          timerRef.current
        );
      }
    };
  }, [
    recognitionState,
  ]);

  /*
   * Microphone button.
   */
  const handleMicClick =
    useCallback(() => {
      if (
        disabled
      ) {
        return;
      }

      /*
       * Stop AI speech before
       * starting microphone input.
       */
      if (
        synthState ===
        'speaking' ||
        synthState ===
        'paused'
      ) {
        stopSpeech();
      }

      if (
        recognitionState ===
        'listening'
      ) {
        stopListening();
      } else if (
        recognitionState ===
        'paused'
      ) {
        stopListening();
      } else {
        resetTranscript();

        accumulatedDurationRef.current =
          0;

        setRecordingDuration(
          0
        );

        startListening();
      }
    }, [
      disabled,
      recognitionState,
      synthState,
      startListening,
      stopListening,
      resetTranscript,
      stopSpeech,
    ]);

  /*
   * Text fallback submit.
   */
  const handleTextSubmit =
    useCallback(() => {
      if (
        textInput.trim()
      ) {
        onTranscriptComplete(
          textInput.trim(),
          0
        );

        setTextInput('');
      }
    }, [
      textInput,
      onTranscriptComplete,
    ]);

  /*
   * Enter key for text fallback.
   */
  const handleKeyDown =
    useCallback(
      (
        e: React.KeyboardEvent
      ) => {
        if (
          e.key === 'Enter' &&
          !e.shiftKey
        ) {
          e.preventDefault();

          handleTextSubmit();
        }
      },
      [
        handleTextSubmit,
      ]
    );

  /*
   * Format recording time.
   */
  const formatTime =
    (
      seconds: number
    ): string => {
      const mins =
        Math.floor(
          seconds / 60
        );

      const secs =
        seconds % 60;

      return `${mins}:${secs
        .toString()
        .padStart(2, '0')}`;
    };

  return (
    <div
      className={
        styles.voiceEngine
      }
    >
      {/* Voice State Indicator */}

      <div
        className={
          styles.stateBar
        }
      >
        <div
          className={
            styles.stateIndicator +
            ' ' +
            styles[
            'state_' +
            voiceState
            ]
          }
        >
          <span
            className={
              styles.stateDot
            }
          />

          <span
            className={
              styles.stateLabel
            }
            style={{
              display:
                'flex',
              alignItems:
                'center',
              gap: '8px',
            }}
          >
            {voiceState ===
              'ready' && (
                <>
                  <MicIcon />
                  Ready to speak
                </>
              )}

            {voiceState ===
              'listening' && (
                <>
                  <div
                    style={{
                      width:
                        '12px',
                      height:
                        '12px',
                      borderRadius:
                        '50%',
                      background:
                        'var(--color-error)',
                    }}
                  />

                  Listening{' '}
                  {formatTime(
                    recordingDuration
                  )}
                </>
              )}

            {voiceState ===
              'analyzing' && (
                <>
                  <Loader
                    size="small"
                  />
                  Analyzing...
                </>
              )}

            {voiceState ===
              'speaking' && (
                <>
                  <PlayIcon />
                  AI Speaking
                </>
              )}

            {voiceState ===
              'paused' && (
                <>
                  <PlayIcon />
                  Speech Paused
                </>
              )}

            {voiceState ===
              'error' && (
                <>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                    <path d="M12 9v4" />
                    <path d="M12 17h.01" />
                  </svg>

                  Error
                </>
              )}
          </span>
        </div>

        {/* AI Speech Controls */}

        {synthState ===
          'speaking' && (
            <div
              className={
                styles.playbackControls
              }
            >
              <button
                onClick={
                  pauseSpeech
                }
                className={
                  styles.controlBtn
                }
                aria-label="Pause AI speech"
                id="pause-ai-btn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="6"
                    y="4"
                    width="4"
                    height="16"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="4"
                    height="16"
                  />
                </svg>
              </button>

              <button
                onClick={
                  stopSpeech
                }
                className={
                  styles.controlBtn
                }
                aria-label="Stop AI speech"
                id="stop-ai-btn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    width="18"
                    height="18"
                    x="3"
                    y="3"
                    rx="2"
                  />
                </svg>
              </button>
            </div>
          )}

        {synthState ===
          'paused' && (
            <div
              className={
                styles.playbackControls
              }
            >
              <button
                onClick={
                  resumeSpeech
                }
                className={
                  styles.controlBtn
                }
                aria-label="Resume AI speech"
                id="resume-ai-btn"
              >
                <PlayIcon />
              </button>

              <button
                onClick={
                  stopSpeech
                }
                className={
                  styles.controlBtn
                }
                aria-label="Stop AI speech"
                id="stop-ai-btn"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    width="18"
                    height="18"
                    x="3"
                    y="3"
                    rx="2"
                  />
                </svg>
              </button>
            </div>
          )}
      </div>

      {/* AI Response Play Button */}

      {aiResponse?.trim() &&
        ttsSupported &&
        synthState ===
        'idle' && (
          <div
            style={{
              display:
                'flex',
              justifyContent:
                'center',
              marginBottom:
                '16px',
            }}
          >
            <button
              onClick={
                handlePlayAIResponse
              }
              className={
                styles.controlBtn
              }
              aria-label="Play AI response"
              id="play-ai-response-btn"
            >
              <PlayIcon />
              Play AI Response
            </button>
          </div>
        )}

      {/* Main Mic Button */}

      <div
        className={
          styles.micContainer
        }
        style={{
          display:
            'flex',
          gap: '16px',
          alignItems:
            'center',
        }}
      >
        <button
          className={
            styles.micButton +
            ' ' +
            (
              recognitionState ===
                'listening'
                ? styles.micActive
                : ''
            ) +
            ' ' +
            (
              disabled
                ? styles.micDisabled
                : ''
            )
          }
          onClick={
            handleMicClick
          }
          disabled={
            disabled
          }
          aria-label={
            (
              recognitionState ===
              'listening' ||
              recognitionState ===
              'paused'
            )
              ? 'Stop recording'
              : 'Start recording'
          }
          id="mic-button"
        >
          {recognitionState ===
            'listening' && (
              <>
                <span
                  className={
                    styles.micPulse
                  }
                />

                <span
                  className={
                    styles.micPulse
                  }
                  style={{
                    animationDelay:
                      '0.5s',
                  }}
                />
              </>
            )}

          <span
            className={
              styles.micIcon
            }
            style={{
              display:
                'flex',
              alignItems:
                'center',
              justifyContent:
                'center',
            }}
          >
            {(
              recognitionState ===
              'listening' ||
              recognitionState ===
              'paused'
            ) ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect
                  width="18"
                  height="18"
                  x="3"
                  y="3"
                  rx="2"
                />
              </svg>
            ) : (
              <MicIcon />
            )}
          </span>
        </button>

        {(
          recognitionState ===
          'listening' ||
          recognitionState ===
          'paused'
        ) && (
            <button
              className={
                styles.controlBtn
              }
              style={{
                width:
                  '56px',
                height:
                  '56px',
                borderRadius:
                  '50%',
                background:
                  'var(--bg-card)',
                border:
                  '1px solid var(--border)',
                display:
                  'flex',
                alignItems:
                  'center',
                justifyContent:
                  'center',
                color:
                  'var(--text-primary)',
                cursor:
                  'pointer',
              }}
              onClick={
                recognitionState ===
                  'listening'
                  ? pauseListening
                  : resumeListening
              }
              aria-label={
                recognitionState ===
                  'listening'
                  ? 'Pause recording'
                  : 'Resume recording'
              }
              id="pause-resume-mic-btn"
            >
              {recognitionState ===
                'listening' ? (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="6"
                    y="4"
                    width="4"
                    height="16"
                  />
                  <rect
                    x="14"
                    y="4"
                    width="4"
                    height="16"
                  />
                </svg>
              ) : (
                <svg
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
              )}
            </button>
          )}
      </div>

      <div
        style={{
          textAlign:
            'center',
          marginTop:
            '12px',
        }}
      >
        <span
          className={
            styles.micHint
          }
        >
          {!isSupported
            ? 'Voice not supported in this browser'
            : (
              recognitionState ===
              'listening' ||
              recognitionState ===
              'paused'
            )
              ? 'Click Stop to finish, Pause to take a break'
              : disabled
                ? 'Wait for AI response...'
                : 'Click to speak'}
        </span>
      </div>

      {/* Live Transcript */}

      {(transcript ||
        interimTranscript) && (
          <div
            className={
              styles.transcript
            }
          >
            <div
              className={
                styles.transcriptLabel
              }
            >
              Your speech:
            </div>

            <p
              className={
                styles.transcriptText
              }
            >
              {transcript}

              {interimTranscript && (
                <span
                  className={
                    styles.interimText
                  }
                >
                  {' '}
                  {interimTranscript}
                </span>
              )}
            </p>

            {confidence >
              0 && (
                <div
                  className={
                    styles.confidence
                  }
                >
                  Confidence:{' '}
                  {Math.round(
                    confidence *
                    100
                  )}
                  %
                </div>
              )}
          </div>
        )}

      {/* Error Display */}

      {error && (
        <div
          className={
            styles.error
          }
          role="alert"
          style={{
            display:
              'flex',
            alignItems:
              'center',
            gap: '8px',
          }}
        >
          <span
            className={
              styles.errorIcon
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
              <path d="M12 9v4" />
              <path d="M12 17h.01" />
            </svg>
          </span>

          <span>
            {error.message}
          </span>

          {error.type ===
            'permission-denied' && (
              <button
                onClick={() =>
                  setShowFallback(
                    true
                  )
                }
                className={
                  styles.errorAction
                }
              >
                Use text input instead
              </button>
            )}
        </div>
      )}

      {/* Text Fallback */}

      {showTextFallback &&
        (
          !isSupported ||
          showFallback ||
          error?.type ===
          'permission-denied'
        ) && (
          <div
            className={
              styles.fallback
            }
          >
            <div
              className={
                styles.fallbackLabel
              }
            >
              Text Input (Fallback)
            </div>

            <div
              className={
                styles.fallbackInput
              }
            >
              <textarea
                value={
                  textInput
                }
                onChange={e =>
                  setTextInput(
                    e.target
                      .value
                  )
                }
                onKeyDown={
                  handleKeyDown
                }
                placeholder="Type your response here..."
                className={
                  styles.fallbackTextarea
                }
                rows={3}
                id="text-fallback-input"
              />

              <button
                onClick={
                  handleTextSubmit
                }
                className={
                  'btn btn-primary ' +
                  styles.fallbackSubmit
                }
                disabled={
                  !textInput.trim() ||
                  disabled
                }
                id="text-submit-btn"
              >
                {disabled
                  ? 'Submitting...'
                  : 'Submit'}
              </button>
            </div>
          </div>
        )}
    </div>
  );
}