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
import { OppositeIcon, RobotIcon, UserIcon, PlayIcon } from '@/components/ui/Icons';
import LanguageSelector from '@/components/ui/LanguageSelector';
import TranslateButton from '@/components/ui/TranslateButton';
import { Language, DEFAULT_LANGUAGE } from '@/lib/languages';

type OppositePhase = 'setup' | 'loading-topic' | 'active' | 'analyzing' | 'complete';

const CATEGORIES = [
  'Technology & AI',
  'Politics & Society',
  'Environment & Nature',
  'Sports & Entertainment',
  'Education & Philosophy'
];

export default function OppositePage() {
  const [phase, setPhase] = useState<OppositePhase>('setup');
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [topicData, setTopicData] = useState<{ topic: string, position: string } | null>(null);
  const [exchanges, setExchanges] = useState<SessionExchange[]>([]);
  const [currentAIResponse, setCurrentAIResponse] = useState('');
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [voiceState, setVoiceState] = useState<VoiceState>('ready');
  const [hasSwitched, setHasSwitched] = useState(false);
  
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

  const generateTopic = useCallback(async () => {
    setPhase('loading-topic');
    setError('');
    try {
      const res = await fetch('/api/opposite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate-topic', category: selectedCategory }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      
      const responseText = data.response;
      const topicMatch = responseText.match(/TOPIC:\s*(.*)/i);
      const positionMatch = responseText.match(/POSITION:\s*(SUPPORT|OPPOSE)/i);
      
      if (topicMatch && positionMatch) {
        setTopicData({
          topic: topicMatch[1].trim(),
          position: positionMatch[1].trim().toUpperCase()
        });
        setPhase('active');
        
        // Add initial AI instruction
        const initialAi: SessionExchange = {
          id: "ai_" + Date.now(),
          role: 'ai',
          content: `Your topic is: ${topicMatch[1].trim()}. You must argue ${positionMatch[1].trim().toUpperCase()} this topic. Begin when you are ready.`,
          timestamp: Date.now(),
        };
        setExchanges([initialAi]);
        setCurrentAIResponse(initialAi.content);
      } else {
        throw new Error('Failed to parse topic and position');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate topic');
      setPhase('setup');
    }
  }, []);

  const callAI = useCallback(async (allExchanges: SessionExchange[], forceSwitch: boolean) => {
    setIsAIThinking(true);
    setError('');

    try {
      const messages = allExchanges.map(e => ({
        role: e.role,
        content: e.content,
      }));

      const res = await fetch('/api/opposite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: forceSwitch ? 'switch' : 'respond',
          messages,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to get AI response');
      }

      const isSwitching = data.response.includes('SWITCH SIDES') || forceSwitch;
      if (isSwitching) {
        setHasSwitched(true);
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
  }, []);

  const handleTranscriptComplete = useCallback(async (transcript: string, duration: number) => {
    // Local speech analysis
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

    // Trigger switch sides on the 2nd user response if not already switched
    const userResponsesCount = updatedExchanges.filter(e => e.role === 'user').length;
    const shouldSwitch = userResponsesCount === 2 && !hasSwitched;

    await callAI(updatedExchanges, shouldSwitch);
  }, [exchanges, hasSwitched, callAI]);

  const handleEndSession = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase('complete');
  };

  const handleRestart = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase('setup');
    setTopicData(null);
    setExchanges([]);
    setLastAnalysis(null);
    setLastSuggestions([]);
    setCurrentAIResponse('');
    setHasSwitched(false);
    setSessionId(generateSessionId());
  };

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
              <span className={styles.modeIcon}><OppositeIcon /></span>
              <h1 className={styles.title}>Opposite Mode</h1>
              <p className={styles.subtitle}>
                Build mental flexibility. Argue a position, then switch sides mid-session.
              </p>
            </div>

            <div className={styles.categorySelect}>
              <label>Choose a Topic Category:</label>
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="form-control"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <button
              className="btn btn-primary btn-lg"
              onClick={generateTopic}
              id="generate-opposite-topic-btn"
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><OppositeIcon /> Generate Topic & Position</span>
            </button>

            {error && <div className={styles.error} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> {error}
            </div>}
          </div>
        )}

        {/* Loading Topic */}
        {phase === 'loading-topic' && (
          <div className={styles.centerState}>
            <div className={styles.spinner} />
            <p>Generating a debatable topic...</p>
          </div>
        )}

        {/* Active Phase */}
        {(phase === 'active' || phase === 'complete') && topicData && (
          <div className={styles.sessionContainer}>
            <div className={styles.sessionHeader}>
              <div className={styles.headerContent}>
                <h1 className={styles.sessionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><OppositeIcon /> Opposite Mode Session</h1>
                <div className={styles.topicInfo}>
                  <p className={styles.sessionTopic}><strong>Topic:</strong> {topicData.topic}</p>
                  <div className={styles.positionIndicator}>
                    Your Role: 
                    <span className={(styles.positionBadge) + " " + (styles[topicData.position.toLowerCase()])}>
                      {topicData.position}
                    </span>
                  </div>
                </div>
              </div>
              {phase === 'active' && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      await new Promise(resolve => setTimeout(resolve, 50));
                      try {
                        generatePDFReport({
                          mode: 'Opposite Mode',
                          topic: topicData?.topic || 'Assigned Topic',
                          exchanges: exchanges,
                          speechAnalysis: lastAnalysis || undefined,
                          suggestions: lastSuggestions
                        });
                      } finally {
                        setIsGeneratingPDF(false);
                      }
                    }}
                    title="Download current report"
                    disabled={isGeneratingPDF}
                  >
                    {isGeneratingPDF ? 'Generating...' : 'Download Report'}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={handleEndSession}
                    id="end-session-btn"
                  >
                    End Session
                  </button>
                </div>
              )}
            </div>

            {hasSwitched && phase === 'active' && (
              <div className={styles.switchBanner} style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg> 
                <strong>SWITCH SIDES!</strong> You must now argue the OPPOSITE position.
              </div>
            )}

            {/* Conversation */}
            <div className={styles.conversationArea} ref={exchangeContainerRef}>
              {exchanges.map((exchange) => {
                const isSwitchCmd = exchange.role === 'ai' && exchange.content.includes('SWITCH SIDES');
                
                return (
                  <div
                    key={exchange.id}
                    className={(styles.exchangeBubble) + (styles["exchange_" + exchange.role]) + (isSwitchCmd ? styles.switchBubble : '')}
                  >
                    <div className={styles.exchangeRole}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{exchange.role === 'ai' ? <><RobotIcon /> Debate Coach</> : <><UserIcon /> You</>}</span>
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
                );
              })}

              <TranslateButton exchanges={exchanges} onTranslateComplete={setExchanges} languageCode={selectedLanguage.code} />

              {isAIThinking && (
                <div className={(styles.exchangeBubble) + " " + (styles.exchange_ai)}>
                  <div className={styles.exchangeRole} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RobotIcon /> Debate Coach</div>
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

            {/* Voice Input */}
            {phase === 'active' && (
              <VoiceEngine
                onTranscriptComplete={handleTranscriptComplete}
                onStateChange={setVoiceState}
                aiResponse={currentAIResponse}
                disabled={isAIThinking}
              />
            )}

            {/* Speech Analysis */}
            {lastAnalysis && lastSuggestions.length > 0 && (
              <div className={styles.analysisPanel}>
                <SpeechFeedback
                  suggestions={lastSuggestions}
                  positiveMessage={lastPositive}
                  focusArea={lastFocus}
                  fillerDisplay={lastFillerDisplay}
                  overallScore={lastAnalysis.overallScore}
                />
              </div>
            )}

            {/* Session Complete */}
            {phase === 'complete' && (
              <div className={styles.sessionComplete}>
                <h2>Session Complete</h2>
                <p>Great job! Mental flexibility is key to powerful communication.</p>
                <div className={styles.completeActions}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={isGeneratingPDF}
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      await new Promise(resolve => setTimeout(resolve, 50));
                      try {
                        generatePDFReport({
                          mode: 'Opposite Mode', 
                          topic: topicData?.topic || 'Assigned Topic', 
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
                  </button>
                  <button className="btn btn-primary" onClick={handleRestart} id="new-session-btn">
                    Try Another Topic
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
