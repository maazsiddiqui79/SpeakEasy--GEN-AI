'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import Header from '@/components/layout/Header';
import VoiceEngine from '@/components/voice/VoiceEngine';
import SpeechFeedback from '@/components/analysis/SpeechFeedback';
import { analyzeSpeech, getSuggestions, getPositiveMessage, getFocusMessage, getFillerDisplay } from '@/lib/speech-analyzer';
import { SessionExchange } from '@/types/session';
import { SpeechAnalysis, RecoverySuggestion } from '@/types/speech';
import { VoiceState } from '@/types/voice';
import { generateSessionId } from '@/lib/session-store';
import { generatePDFReport } from '@/lib/pdf-generator';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import styles from './page.module.css';
import { InterviewIcon, MicIcon, RobotIcon, UserIcon, PlayIcon } from '@/components/ui/Icons';
import LanguageSelector from '@/components/ui/LanguageSelector';
import TranslateButton from '@/components/ui/TranslateButton';
import { Language, DEFAULT_LANGUAGE } from '@/lib/languages';

type InterviewPhase = 'setup' | 'active' | 'analyzing' | 'complete';

const TOPICS = [
  'Software Engineering',
  'Data Science & Machine Learning',
  'Product Management',
  'System Design',
  'Behavioral & Leadership',
  'Web Development',
  'Cloud & DevOps',
  'General Professional',
];

export default function InterviewPage() {
  const [phase, setPhase] = useState<InterviewPhase>('setup');
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [exchanges, setExchanges] = useState<SessionExchange[]>([]);
  const [currentAIResponse, setCurrentAIResponse] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [lastAnalysis, setLastAnalysis] = useState<SpeechAnalysis | null>(null);
  const [lastSuggestions, setLastSuggestions] = useState<RecoverySuggestion[]>([]);
  const [lastPositive, setLastPositive] = useState('');
  const [lastFocus, setLastFocus] = useState('');
  const [lastFillerDisplay, setLastFillerDisplay] = useState('');
  const [error, setError] = useState('');
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(DEFAULT_LANGUAGE);
  const exchangeContainerRef = useRef<HTMLDivElement>(null);
  const [sessionId, setSessionId] = useState('');

  useEffect(() => {
    setSessionId(generateSessionId());
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).isSessionActive = phase === 'active';
    }
    return () => {
      if (typeof window !== 'undefined') {
        (window as any).isSessionActive = false;
      }
    };
  }, [phase]);

  const scrollToBottom = () => {
    setTimeout(() => {
      exchangeContainerRef.current?.scrollTo({
        top: exchangeContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }, 100);
  };

  const callInterviewAPI = useCallback(async (allExchanges: SessionExchange[]) => {
    setIsAIThinking(true);
    setError('');

    try {
      const messages = allExchanges.map(e => ({
        role: e.role,
        content: e.content,
      }));

      const res = await fetch('/api/interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          topic: selectedTopic,
          customTopic: customTopic || undefined,
          language: selectedLanguage.label,
          languageCode: selectedLanguage.code,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const aiExchange: SessionExchange = {
        id: "ai_" + Date.now(),
        role: 'ai',
        content: data.response,
        timestamp: Date.now(),
      };

      setExchanges(prev => [...prev, aiExchange]);
      setCurrentAIResponse(data.response);
      scrollToBottom();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Something went wrong';
      setError(msg);
    } finally {
      setIsAIThinking(false);
    }
  }, [selectedTopic, customTopic]);

  const handleStartInterview = useCallback(async () => {
    if (!selectedTopic && !customTopic.trim()) return;
    setPhase('active');
    await callInterviewAPI([]);
  }, [selectedTopic, customTopic, callInterviewAPI]);

  const handleTranscriptComplete = useCallback(async (transcript: string, duration: number) => {
    // Analyze speech
    const analysis = analyzeSpeech({ transcript, durationSeconds: Math.max(duration, 1) });
    const suggestions = getSuggestions(analysis);
    const positive = getPositiveMessage(analysis);
    const focus = getFocusMessage(analysis);
    const fillerDisplay = getFillerDisplay(analysis);

    setLastAnalysis(analysis);
    setLastSuggestions(suggestions);
    setLastPositive(positive);
    setLastFocus(focus);
    setLastFillerDisplay(fillerDisplay);

    // Add user exchange
    const userExchange: SessionExchange = {
      id: "user_" + Date.now(),
      role: 'user',
      content: transcript,
      speechAnalysis: analysis,
      suggestions,
      timestamp: Date.now(),
      duration,
    };

    const updatedExchanges = [...exchanges, userExchange];
    setExchanges(updatedExchanges);
    setCurrentAIResponse('');
    scrollToBottom();

    // Get AI follow-up
    await callInterviewAPI(updatedExchanges);
  }, [exchanges, callInterviewAPI]);

  const handleEndSession = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase('complete');
  }, []);

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Language Selector */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '0 0 12px 0' }}>
          <LanguageSelector selectedLanguage={selectedLanguage} onChange={setSelectedLanguage} />
        </div>
        {/* Setup Phase */}
        {phase === 'setup' && (
          <div className={styles.setup}>
            <div className={styles.setupHeader}>
              <span className={styles.modeIcon}><InterviewIcon /></span>
              <h1 className={styles.title}>Interview Mode</h1>
              <p className={styles.subtitle}>
                AI-powered mock interview that adapts to your weaknesses
              </p>
            </div>

            <div className={styles.topicSelection}>
              <h2 className={styles.topicTitle}>Choose a Topic</h2>
              <div className={styles.topicGrid}>
                {TOPICS.map((topic) => (
                  <button
                    key={topic}
                    className={(styles.topicBtn) + " " + (selectedTopic === topic ? styles.topicBtnActive : '')}
                    onClick={() => { setSelectedTopic(topic); setCustomTopic(''); }}
                    id={"topic-" + (topic.toLowerCase().replace(/\s+/g, '-'))}
                  >
                    {topic}
                  </button>
                ))}
              </div>

              <div className={styles.customTopicSection}>
                <label className={styles.customLabel} htmlFor="custom-topic-input">
                  Or enter a custom topic:
                </label>
                <input
                  id="custom-topic-input"
                  type="text"
                  value={customTopic}
                  onChange={(e) => { setCustomTopic(e.target.value); setSelectedTopic(''); }}
                  placeholder="e.g., React performance optimization"
                  className={styles.customInput}
                />
              </div>

              <button
                className="btn btn-primary btn-lg"
                onClick={handleStartInterview}
                disabled={!selectedTopic && !customTopic.trim()}
                id="start-interview-btn"
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><MicIcon /> Start Interview</span>
              </button>
            </div>
          </div>
        )}

        {/* Active Phase */}
        {(phase === 'active' || phase === 'complete') && (
          <div className={styles.sessionContainer}>
            <div className={styles.sessionHeader}>
              <div>
                <h1 className={styles.sessionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><InterviewIcon /> Interview Session</h1>
                <p className={styles.sessionTopic}>
                  Topic: {customTopic || selectedTopic}
                </p>
              </div>
              {phase === 'active' && (
                <button
                  className="btn btn-secondary"
                  onClick={handleEndSession}
                  id="end-session-btn"
                >
                  End Session
                </button>
              )}
            </div>

            {/* Conversation */}
            <div className={styles.conversationArea} ref={exchangeContainerRef}>
              {exchanges.map((exchange) => (
                <div
                  key={exchange.id}
                  className={(styles.exchangeBubble) + (styles["exchange_" + exchange.role])}
                >
                  <div className={styles.exchangeRole}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{exchange.role === 'ai' ? <><RobotIcon /> AI Interviewer</> : <><UserIcon /> You</>}</span>
                    {exchange.role === 'ai' && (
                      <button 
                        className={styles.playBtn}
                        title="Play Response"
                        onClick={() => {
                          if (typeof window !== 'undefined' && window.speechSynthesis) {
                            if (window.speechSynthesis.speaking) {
                              window.speechSynthesis.cancel();
                              return;
                            }
                            window.speechSynthesis.cancel();
                            const text = exchange.content.replace(/[*#]/g, '');
                            window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
                          }
                        }}
                      >
                        <span style={{ width: '16px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><PlayIcon /></span>
                      </button>
                    )}
                  </div>
                  <div className={styles.exchangeContent}>
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.content}</ReactMarkdown>
                      {exchange.translatedContent && (
                        <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid var(--border)', fontSize: '0.95em', color: 'var(--text-secondary)' }}>
                          <strong>English:</strong> <ReactMarkdown remarkPlugins={[remarkGfm]}>{exchange.translatedContent}</ReactMarkdown>
                        </div>
                      )}
                  </div>
                </div>
              ))}

              <TranslateButton exchanges={exchanges} onTranslateComplete={setExchanges} languageCode={selectedLanguage.code} />

              {isAIThinking && (
                <div className={(styles.exchangeBubble) + " " + (styles.exchange_ai)}>
                  <div className={styles.exchangeRole} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RobotIcon /> AI Interviewer</div>
                  <div className={styles.thinking}>
                    <span className={styles.thinkingDot} />
                    <span className={styles.thinkingDot} />
                    <span className={styles.thinkingDot} />
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className={styles.apiError} role="alert" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
                {error}
                <button onClick={() => setError('')} className={styles.dismissBtn}>Dismiss</button>
              </div>
            )}

            {/* Voice Input (only during active phase) */}
            {phase === 'active' && (
              <VoiceEngine
                onTranscriptComplete={handleTranscriptComplete}
                onStateChange={setVoiceState}
                aiResponse={currentAIResponse}
                disabled={isAIThinking}
                language={selectedLanguage}
              />
            )}

            {/* Speech Analysis (after user speaks) */}
            {lastAnalysis && lastSuggestions.length > 0 && (
              <div className={styles.analysisPanel}>
                <SpeechFeedback
                  suggestions={lastSuggestions}
                  positiveMessage={lastPositive}
                  focusArea={lastFocus}
                  fillerDisplay={lastFillerDisplay}
                  overallScore={lastAnalysis.overallScore}
                  reportContext={{
                    mode: 'Interview',
                    subject: customTopic || selectedTopic,
                    analysis: lastAnalysis,
                    exchanges,
                  }}
                />
              </div>
            )}

            {/* Session Complete */}
            {phase === 'complete' && (
              <div className={styles.sessionComplete}>
                <h2>Session Complete</h2>
                <p>Great practice session! Review the conversation above for your full interview performance.</p>
                <div className={styles.completeActions}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={isGeneratingPDF}
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      await new Promise(resolve => setTimeout(resolve, 50));
                      try {
                        generatePDFReport({
                          mode: 'Interview Mode', 
                          topic: selectedTopic === 'Custom' ? customTopic : selectedTopic, 
                          exchanges: exchanges, 
                          speechAnalysis: lastAnalysis || undefined, 
                          suggestions: lastSuggestions
                        });
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }} 
                    style={{ marginRight: '12px' }}
                  >
                    {isGeneratingPDF ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div className={styles.spinner} style={{ width: '16px', height: '16px', borderWidth: '2px' }} /> Generating...
                      </span>
                    ) : 'Download PDF Report'}
                  </button><button
                    className="btn btn-primary"
                    onClick={() => {
                      if (typeof window !== 'undefined' && window.speechSynthesis) {
                        window.speechSynthesis.cancel();
                      }
                      setPhase('setup');
                      setExchanges([]);
                      setLastAnalysis(null);
                      setLastSuggestions([]);
                      setCurrentAIResponse('');
                      setSessionId(generateSessionId());
                    }}
                    id="new-session-btn"
                  >
                    Start New Session
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </>
  );
}
