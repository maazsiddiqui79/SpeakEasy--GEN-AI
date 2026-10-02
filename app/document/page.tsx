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
import { DocumentIcon, InterviewIcon, RobotIcon, UserIcon, PlayIcon, MicIcon } from '@/components/ui/Icons';
import LanguageSelector from '@/components/ui/LanguageSelector';
import TranslateButton from '@/components/ui/TranslateButton';
import { Language, DEFAULT_LANGUAGE } from '@/lib/languages';

type DocumentPhase = 'upload' | 'setup' | 'active' | 'complete';
type SubMode = 'presentation' | 'interview';

export default function DocumentPage() {
  const [phase, setPhase] = useState<DocumentPhase>('upload');
  const [subMode, setSubMode] = useState<SubMode>('presentation');
  const [file, setFile] = useState<File | null>(null);
  const [extractedContent, setExtractedContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');

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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    
    setFile(selected);
    setIsExtracting(true);
    setExtractError('');

    try {
      const formData = new FormData();
      formData.append('file', selected);
      const res = await fetch('/api/parse-document', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Failed to parse file');
      const data = await res.json();
      setExtractedContent(data.text);
      setPhase('setup');
    } catch (err) {
      setExtractError('Failed to read file. Please try a different format.');
    } finally {
      setIsExtracting(false);
    }
  };

  const callAI = useCallback(async (allExchanges: SessionExchange[], isStart = false) => {
    setIsAIThinking(true);
    setError('');

    try {
      const messages = allExchanges.map(e => ({
        role: e.role,
        content: e.content,
      }));

      const res = await fetch('/api/document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isStart ? 'start' : 'respond',
          subMode,
          documentContent: isStart ? extractedContent : undefined,
          messages,
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
  }, [subMode, extractedContent]);

  const handleStartSession = async () => {
    setPhase('active');
    await callAI([], true);
  };

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

    await callAI(updatedExchanges);
  }, [exchanges, callAI]);

  const handleRestart = () => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setPhase('upload');
    setFile(null);
    setExtractedContent('');
    setExchanges([]);
    setLastAnalysis(null);
    setLastSuggestions([]);
    setCurrentAIResponse('');
    setSessionId(generateSessionId());
  };

  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Language Selector */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0 12px 0' }}>
          <LanguageSelector selectedLanguage={selectedLanguage} onChange={setSelectedLanguage} />
        </div>
        {/* Upload Phase */}
        {phase === 'upload' && (
          <div className={styles.setup}>
            <div className={styles.setupHeader}>
              <span className={styles.modeIcon}><DocumentIcon /></span>
              <h1 className={styles.title}>Document Mode</h1>
              <p className={styles.subtitle}>
                Upload your material and practice presenting or being interviewed on your own content.
              </p>
            </div>

            <div className={styles.uploadArea}>
              {isExtracting ? (
                <div className={styles.extracting}>
                  <div className={styles.spinner} />
                  <p>Extracting content from document...</p>
                </div>
              ) : (
                <>
                  <label htmlFor="file-upload" className={styles.uploadLabel}>
                    <span className={styles.uploadIcon}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                    </span>
                    <span>Click to select a document</span>
                    <span className={styles.uploadHint}>Supports PDF, DOCX, DOC, PPTX, PPT, TXT</span>
                  </label>
                  <input
                    id="file-upload"
                    type="file"
                    accept=".txt,.pdf,.docx,.doc,.pptx,.ppt"
                    onChange={handleFileUpload}
                    className={styles.fileInput}
                  />
                  {extractError && <p className={styles.errorText}>{extractError}</p>}
                </>
              )}
            </div>
          </div>
        )}

        {/* Setup Phase (Mode Selection) */}
        {phase === 'setup' && (
          <div className={styles.setup}>
            <div className={styles.setupHeader}>
              <span className={styles.modeIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1Z"/></svg>
              </span>
              <h1 className={styles.title}>Select Practice Style</h1>
              <p className={styles.subtitle}>
                How would you like to practice with "{file?.name}"?
              </p>
            </div>

            <div className={styles.modeSelection}>
              <button
                className={(styles.subModeBtn) + " " + (subMode === 'presentation' ? styles.subModeBtnActive : '')}
                onClick={() => setSubMode('presentation')}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><MicIcon /> Presentation Run-through</h3>
                <p>Present the material. AI acts as your audience and evaluates your coverage.</p>
              </button>
              <button
                className={(styles.subModeBtn) + " " + (subMode === 'interview' ? styles.subModeBtnActive : '')}
                onClick={() => setSubMode('interview')}
              >
                <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}><InterviewIcon /> Document Interview</h3>
                <p>AI acts as a technical interviewer and grills you on the content.</p>
              </button>
            </div>

            <button className="btn btn-primary btn-lg" onClick={handleStartSession}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 3.81-2.24A22 22 0 0 1 15 12"/><path d="m9 9 3 3a22 22 0 0 0 2.24-3.81A22 22 0 0 0 12 9"/></svg>
                Start Session
              </span>
            </button>
            
            <button className={styles.textBtn} onClick={() => setPhase('upload')}>
              Cancel
            </button>
          </div>
        )}

        {/* Active Phase */}
        {(phase === 'active' || phase === 'complete') && (
          <div className={styles.sessionContainer}>
            <div className={styles.sessionHeader}>
              <div>
                <h1 className={styles.sessionTitle} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><DocumentIcon /> Document Session</h1>
                <p className={styles.sessionTopic}>
                  File: {file?.name} â€¢ Mode: {subMode === 'presentation' ? 'Presentation' : 'Interview'}
                </p>
              </div>
              {phase === 'active' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    if (typeof window !== 'undefined' && window.speechSynthesis) {
                      window.speechSynthesis.cancel();
                    }
                    setPhase('complete');
                  }}
                  id="end-session-btn"
                >
                  End Session
                </button>
              )}
            </div>

            <div className={styles.sessionMain}>
              <div className={styles.leftCol}>
                {/* Conversation Area */}
                <div className={styles.conversationArea} ref={exchangeContainerRef}>
                  {exchanges.map((exchange) => (
                    <div
                      key={exchange.id}
                      className={(styles.exchangeBubble) + " " + (styles["exchange_" + exchange.role])}
                    >
                      <div className={styles.exchangeRole}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{exchange.role === 'ai' ? <><RobotIcon /> AI Evaluator</> : <><UserIcon /> You</>}</span>
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
                      <div className={styles.exchangeRole} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><RobotIcon /> AI Evaluator</div>
                      <div className={styles.thinking}>
                        <span className={styles.thinkingDot} />
                        <span className={styles.thinkingDot} />
                        <span className={styles.thinkingDot} />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.rightCol}>

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
                language={selectedLanguage}
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
                  reportContext={{
                    mode: subMode === 'presentation' ? 'Document presentation' : 'Document interview',
                    subject: file?.name || 'Uploaded document',
                    analysis: lastAnalysis,
                    exchanges,
                  }}
                />
              </div>
            )}
            </div>
            </div>

            {/* Session Complete */}
            {phase === 'complete' && (
              <div className={styles.sessionComplete}>
                <h2>Session Complete</h2>
                <p>Great work incorporating your own material into your practice.</p>
                <div className={styles.completeActions}>
                  <button 
                    className="btn btn-secondary" 
                    disabled={isGeneratingPDF}
                    onClick={async () => {
                      setIsGeneratingPDF(true);
                      await new Promise(resolve => setTimeout(resolve, 50));
                      try {
                        await generatePDFReport({
                          mode: subMode === 'presentation' ? 'Document Presentation' : 'Document Interview', 
                          topic: file?.name || 'Uploaded Document', 
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
                  <button className="btn btn-primary" onClick={handleRestart}>Upload New Document
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


