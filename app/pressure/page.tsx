'use client';

import { useState, useCallback, useEffect, useRef } from 'react';

import Header from '@/components/layout/Header';

import VoiceEngine from '@/components/voice/VoiceEngine';

import SpeechFeedback from '@/components/analysis/SpeechFeedback';

import ReactMarkdown from 'react-markdown';

import {
  analyzeSpeech,
  getSuggestions,
  getPositiveMessage,
  getFocusMessage,
  getFillerDisplay,
} from '@/lib/speech-analyzer';

import { SpeechAnalysis, RecoverySuggestion } from '@/types/speech';

import { generatePDFReport } from '@/lib/pdf-generator';

import { PressureIcon, RobotIcon } from '@/components/ui/Icons';

import LanguageSelector from '@/components/ui/LanguageSelector';

import { Language, DEFAULT_LANGUAGE } from '@/lib/languages';

import styles from './page.module.css';

type PressurePhase =
  | 'setup'
  | 'loading-topic'
  | 'preparing'
  | 'speaking'
  | 'reviewing'
  | 'analyzing'
  | 'feedback';

export default function PressurePage() {
  const [phase, setPhase] = useState<PressurePhase>('setup');

  const [prepTime, setPrepTime] = useState<5 | 10 | 15>(10);

  const [countdown, setCountdown] = useState(0);

  const [topic, setTopic] = useState('');

  const [error, setError] = useState('');

  const [analysis, setAnalysis] = useState<SpeechAnalysis | null>(null);

  const [suggestions, setSuggestions] = useState<RecoverySuggestion[]>([]);

  const [positive, setPositive] = useState('');

  const [focus, setFocus] = useState('');

  const [fillerDisplay, setFillerDisplay] = useState('');

  const [customTopic, setCustomTopic] = useState('');

  const [aiFeedback, setAiFeedback] = useState('');

  const [translatedAiFeedback, setTranslatedAiFeedback] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);

  const [editableTranscript, setEditableTranscript] = useState('');

  const [speechDuration, setSpeechDuration] = useState(0);

  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const [selectedLanguage, setSelectedLanguage] =
    useState<Language>(DEFAULT_LANGUAGE);

  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown timer
  useEffect(() => {
    if (phase === 'preparing' && countdown > 0) {
      countdownRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownRef.current) {
              clearInterval(countdownRef.current);
              countdownRef.current = null;
            }

            setPhase('speaking');

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
          countdownRef.current = null;
        }
      };
    }

    return undefined;
  }, [phase, countdown]);

  const generateTopic = useCallback(async () => {
    setPhase('loading-topic');
    setError('');

    try {
      const res = await fetch('/api/pressure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generate-topic',
          customTopic,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate topic');
      }

      setTopic(data.topic);

      setCountdown(prepTime);

      setPhase('preparing');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to generate topic'
      );

      setPhase('setup');
    }
  }, [prepTime, customTopic]);

  const handleTranscriptComplete = useCallback(
    (transcript: string, duration: number) => {
      setEditableTranscript(transcript);

      setSpeechDuration(duration);

      setPhase('reviewing');
    },
    []
  );

  const submitTranscriptForAnalysis = useCallback(async () => {
    setPhase('analyzing');

    // Local speech analysis
    const speechAnalysis = analyzeSpeech({
      transcript: editableTranscript,
      durationSeconds: Math.max(speechDuration, 1),
    });

    const speechSuggestions = getSuggestions(speechAnalysis);

    const positiveMsg = getPositiveMessage(speechAnalysis);

    const focusMsg = getFocusMessage(speechAnalysis);

    const fillers = getFillerDisplay(speechAnalysis);

    setAnalysis(speechAnalysis);

    setSuggestions(speechSuggestions);

    setPositive(positiveMsg);

    setFocus(focusMsg);

    setFillerDisplay(fillers);

    // Get AI feedback
    try {
      const res = await fetch('/api/pressure', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'feedback',
          messages: [
            {
              role: 'ai',
              content: `Topic: ${topic}`,
            },
            {
              role: 'user',
              content: editableTranscript,
            },
          ],
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setAiFeedback(data.response || '');
      }
    } catch (err) {
      console.error('Pressure AI feedback error:', err);
    }

    setPhase('feedback');
  }, [topic, editableTranscript, speechDuration]);

  const handleRestart = () => {
    setPhase('setup');

    setTopic('');

    setAnalysis(null);

    setSuggestions([]);

    setPositive('');

    setFocus('');

    setFillerDisplay('');

    setAiFeedback('');

    setTranslatedAiFeedback('');

    setEditableTranscript('');

    setSpeechDuration(0);

    setError('');
  };

  return (
    <>
      <Header />

      <main className={styles.main}>
        {/* Language Selector */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            padding: '0 0 12px 0',
          }}
        >
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onChange={setSelectedLanguage}
          />
        </div>

        {/* Setup */}
        {phase === 'setup' && (
          <div className={styles.setup}>
            <span className={styles.modeIcon}>
              <PressureIcon />
            </span>

            <h1 className={styles.title}>Pressure Mode</h1>

            <p className={styles.subtitle}>
              Think fast. Speak clearly. Practice under time pressure.
            </p>

            <div className={styles.prepSelect}>
              <h2 className={styles.prepTitle}>Preparation Time</h2>

              <div className={styles.prepOptions}>
                {([5, 10, 15] as const).map((time) => (
                  <button
                    key={time}
                    className={
                      styles.prepBtn +
                      ' ' +
                      (prepTime === time
                        ? styles.prepBtnActive
                        : '')
                    }
                    onClick={() => setPrepTime(time)}
                    id={`prep-${time}s-btn`}
                  >
                    {time}s
                  </button>
                ))}
              </div>
            </div>

            <div
              className={styles.customTopicSection}
              style={{
                width: '100%',
                maxWidth: '400px',
                margin: '0 auto',
                textAlign: 'left',
              }}
            >
              <label
                className={styles.customLabel}
                htmlFor="custom-topic-input"
                style={{
                  display: 'block',
                  marginBottom: '8px',
                  fontWeight: 'bold',
                }}
              >
                Or enter a custom topic (optional):
              </label>

              <input
                id="custom-topic-input"
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="e.g., Is AI dangerous?"
                className="form-control"
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '24px',
                }}
              />
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={generateTopic}
              id="generate-topic-btn"
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  justifyContent: 'center',
                }}
              >
                <PressureIcon />

                Generate{' '}
                {customTopic ? 'Custom' : 'Random Trending'} Topic
              </span>
            </button>

            {error && (
              <div
                className={styles.error}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
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

                {error}
              </div>
            )}
          </div>
        )}

        {/* Loading Topic */}
        {phase === 'loading-topic' && (
          <div className={styles.centerState}>
            <div className={styles.spinner} />

            <p>Generating topic...</p>
          </div>
        )}

        {/* Preparation Countdown */}
        {phase === 'preparing' && (
          <div className={styles.prepPhase}>
            <div className={styles.topicDisplay}>
              <div className={styles.topicLabel}>Your Topic</div>

              <p className={styles.topicText}>{topic}</p>
            </div>

            <div className={styles.countdownContainer}>
              <div className={styles.countdown}>{countdown}</div>

              <p className={styles.countdownLabel}>
                seconds to prepare
              </p>
            </div>

            <p className={styles.prepHint}>
              Think about your main points. You&apos;ll start speaking
              when the timer reaches 0.
            </p>
          </div>
        )}

        {/* Speaking */}
        {phase === 'speaking' && (
          <div className={styles.speakingPhase}>
            <div className={styles.topicDisplay}>
              <div className={styles.topicLabel}>Topic</div>

              <p className={styles.topicTextSmall}>{topic}</p>
            </div>

            <VoiceEngine
              onTranscriptComplete={handleTranscriptComplete}
              disabled={false}
              language={selectedLanguage}
            />
          </div>
        )}

        {/* Reviewing */}
        {phase === 'reviewing' && (
          <div
            className={styles.reviewPhase}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              maxWidth: '600px',
              margin: '0 auto',
            }}
          >
            <h2
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <RobotIcon />

              Review Transcript
            </h2>

            <p style={{ color: 'var(--text-secondary)' }}>
              You can edit the transcribed text before submitting it to
              the AI for feedback.
            </p>

            <textarea
              className="form-control"
              value={editableTranscript}
              onChange={(e) =>
                setEditableTranscript(e.target.value)
              }
              rows={6}
              style={{
                padding: '16px',
                borderRadius: '12px',
                fontSize: '16px',
                lineHeight: '1.5',
                resize: 'vertical',
              }}
            />

            <button
              className="btn btn-primary"
              onClick={submitTranscriptForAnalysis}
              style={{
                alignSelf: 'flex-end',
                padding: '12px 24px',
              }}
              disabled={!editableTranscript.trim()}
            >
              Submit for Analysis
            </button>
          </div>
        )}

        {/* Analyzing */}
        {phase === 'analyzing' && (
          <div className={styles.centerState}>
            <div className={styles.spinner} />

            <p>Analyzing your speech...</p>
          </div>
        )}

        {/* Feedback */}
        {phase === 'feedback' && analysis && (
          <div className={styles.feedbackPhase}>
            <div className={styles.feedbackHeader}>
              <h2
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <PressureIcon />

                Performance Review
              </h2>

              <p className={styles.feedbackTopic}>
                Topic: {topic}
              </p>
            </div>

            {aiFeedback && (
              <div className={styles.aiFeedbackCard}>
                <h3
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <RobotIcon />

                  AI Feedback
                </h3>

                <div style={{ lineHeight: '1.6' }}>
                  <ReactMarkdown>{aiFeedback}</ReactMarkdown>

                  {translatedAiFeedback && (
                    <div
                      style={{
                        marginTop: '16px',
                        paddingTop: '16px',
                        borderTop:
                          '1px solid var(--border)',
                      }}
                    >
                      <strong>English:</strong>

                      <ReactMarkdown>
                        {translatedAiFeedback}
                      </ReactMarkdown>
                    </div>
                  )}

                  {!selectedLanguage.isEnglish &&
                    !translatedAiFeedback && (
                      <button
                        className="btn btn-secondary"
                        onClick={async () => {
                          setIsTranslating(true);

                          try {
                            const res = await fetch(
                              '/api/translate',
                              {
                                method: 'POST',
                                headers: {
                                  'Content-Type':
                                    'application/json',
                                },
                                body: JSON.stringify({
                                  text: aiFeedback,
                                  fromLanguage:
                                    selectedLanguage.code,
                                }),
                              }
                            );

                            if (res.ok) {
                              const data = await res.json();

                              setTranslatedAiFeedback(
                                data.translatedText || ''
                              );
                            } else {
                              console.error(
                                'Translation request failed:',
                                res.status
                              );
                            }
                          } catch (error) {
                            console.error(
                              'Translation error:',
                              error
                            );
                          } finally {
                            setIsTranslating(false);
                          }
                        }}
                        disabled={isTranslating}
                        style={{ marginTop: '16px' }}
                      >
                        {isTranslating
                          ? 'Translating...'
                          : 'Translate to English'}
                      </button>
                    )}
                </div>
              </div>
            )}

            <SpeechFeedback
              suggestions={suggestions}
              positiveMessage={positive}
              focusArea={focus}
              fillerDisplay={fillerDisplay}
              overallScore={analysis.overallScore}
            />

            <div
              className={styles.feedbackActions}
              style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              <button
                className="btn btn-primary"
                onClick={generateTopic}
                id="try-another-btn"
              >
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <PressureIcon />

                  Try Another Topic
                </span>
              </button>

              <button
                className="btn btn-secondary"
                disabled={isGeneratingPDF}
                onClick={async () => {
                  setIsGeneratingPDF(true);

                  // Allow UI to update before blocking thread
                  await new Promise((resolve) =>
                    setTimeout(resolve, 50)
                  );

                  try {
                    generatePDFReport({
                      mode: 'Pressure Mode',
                      topic: topic,
                      transcript: editableTranscript,
                      aiFeedback: aiFeedback,
                      speechAnalysis: analysis,
                      suggestions: suggestions,
                    });
                  } finally {
                    setIsGeneratingPDF(false);
                  }
                }}
              >
                {isGeneratingPDF ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <div
                      className={styles.spinner}
                      style={{
                        width: '16px',
                        height: '16px',
                        borderWidth: '2px',
                      }}
                    />

                    Generating...
                  </span>
                ) : (
                  'Download PDF Report'
                )}
              </button>

              <button
                className="btn btn-secondary"
                onClick={handleRestart}
                id="back-setup-btn"
              >
                Back to Setup
              </button>
            </div>
          </div>
        )}
      </main>
    </>
  );
}