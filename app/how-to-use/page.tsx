'use client';

import React from 'react';
import Image from 'next/image';
import Header from '@/components/layout/Header';
import AnimatedSection from '@/components/ui/AnimatedSection';
import styles from './page.module.css';

const CheckIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default function HowToUsePage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <AnimatedSection className={styles.header}>
          <h1 className={styles.title}>How to Use Speak Easy</h1>
          <p className={styles.subtitle}>
            Your comprehensive guide to mastering communication through AI-powered interactive training modes.
          </p>
        </AnimatedSection>

        {/* Voice Recognition Guide - Specifically answering user request */}
        <AnimatedSection delay={100}>
          <section className={styles.voiceGuideSection}>
            <div className={styles.voiceGuideHeader}>
              <h2 className={styles.voiceGuideTitle}>How Voice Recording Works</h2>
              <p className={styles.voiceGuideDescription}>
                Speak Easy processes your speech in real-time. As you talk into the microphone, you will notice two distinct types of text appearing on the screen.
              </p>
            </div>

            <div className={styles.voiceDemoGrid}>
              <div className={styles.demoCard}>
                <div className={styles.demoCardTitle}>
                  <span style={{color: 'var(--text-secondary)'}}>Gray Text (Preview)</span>
                </div>
                <p className={styles.demoCardDesc}>
                  If the text color is in <strong>Gray</strong>, it means it is not yet accepted in the system. It is just giving you a live preview of what it hears as you are speaking.
                </p>
                <div className={styles.mockTranscript}>
                  <span className={styles.textBlack}>The main reason is </span>
                  <span className={styles.textGray}>that we need to optimize...</span>
                </div>
              </div>

              <div className={styles.demoCard}>
                <div className={styles.demoCardTitle}>
                  <span style={{color: 'var(--text-primary)'}}>Solid Text (Recorded)</span>
                </div>
                <p className={styles.demoCardDesc}>
                  If it is in <strong>Solid/Black color</strong> (bright text in dark mode), that means it has been finalized and recorded in the system. The AI will analyze this exact text.
                </p>
                <div className={styles.mockTranscript}>
                  <span className={styles.textBlack}>The main reason is that we need to optimize the database queries for better performance.</span>
                </div>
              </div>
            </div>
          </section>
        </AnimatedSection>

        <AnimatedSection delay={200}>
          <h2 className={styles.sectionTitle}>Training Modes Explained</h2>
        </AnimatedSection>

        <div className={styles.featuresGrid}>
          {/* Interview Mode */}
          <AnimatedSection>
            <div className={styles.featureRow}>
              <div className={styles.featureContent}>
                <span className={`${styles.featureLabel} ${styles.labelInterview}`}>Interview Mode</span>
                <h3 className={styles.featureTitle}>Mock Interviews tailored to you</h3>
                <p className={styles.featureDesc}>
                  Simulate a real professional interview. You choose a topic (or enter a custom one), and the AI will act as a senior examiner, asking you targeted questions and adjusting to your weaknesses.
                </p>
                <ul className={styles.featureList}>
                  <li><CheckIcon /> Select a topic from the grid or type your own custom topic.</li>
                  <li><CheckIcon /> Click "Start Interview" to begin the session.</li>
                  <li><CheckIcon /> Listen to the AI's question, click the Microphone icon to speak your answer.</li>
                  <li><CheckIcon /> Get immediate speech analysis (grammar, fluency, filler words) after every response.</li>
                  <li><CheckIcon /> End the session anytime to download a comprehensive PDF report.</li>
                </ul>
              </div>
              <div className={styles.featureImage}>
                <Image 
                  src="/images/docs/INTERVIEW MODE.png" 
                  alt="Interview Mode Screenshot" 
                  width={1600}
                  height={900}
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Pressure Mode */}
          <AnimatedSection>
            <div className={styles.featureRow}>
              <div className={styles.featureContent}>
                <span className={`${styles.featureLabel} ${styles.labelPressure}`}>Pressure Mode</span>
                <h3 className={styles.featureTitle}>Think fast, speak clearly</h3>
                <p className={styles.featureDesc}>
                  Designed to train your impromptu speaking skills. The AI gives you a random trending topic, gives you a short preparation time (5-15 seconds), and expects a structured response.
                </p>
                <ul className={styles.featureList}>
                  <li><CheckIcon /> Select your preferred preparation time (5, 10, or 15 seconds).</li>
                  <li><CheckIcon /> Click "Generate Topic" to get a random subject.</li>
                  <li><CheckIcon /> When the countdown hits zero, the microphone activates automatically.</li>
                  <li><CheckIcon /> Speak clearly and structure your thoughts on the fly.</li>
                  <li><CheckIcon /> Review your detailed pacing and fluency analysis afterward.</li>
                </ul>
              </div>
              <div className={styles.featureImage}>
                <Image 
                  src="/images/docs/PRESSURE MODE.png" 
                  alt="Pressure Mode Screenshot" 
                  width={1600}
                  height={900}
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Opposite Mode */}
          <AnimatedSection>
            <div className={styles.featureRow}>
              <div className={styles.featureContent}>
                <span className={`${styles.featureLabel} ${styles.labelOpposite}`}>Opposite Mode</span>
                <h3 className={styles.featureTitle}>Build mental flexibility</h3>
                <p className={styles.featureDesc}>
                  A debate-style mode where you are forced to argue for a specific position. Mid-way through the session, the AI will yell "SWITCH SIDES" and you must immediately argue the opposite position.
                </p>
                <ul className={styles.featureList}>
                  <li><CheckIcon /> Pick a debate category (e.g., Technology, Politics).</li>
                  <li><CheckIcon /> The AI will assign you a topic and a stance (SUPPORT or OPPOSE).</li>
                  <li><CheckIcon /> Build your argument and defend it against the AI's counter-points.</li>
                  <li><CheckIcon /> When "🔄 SWITCH SIDES" appears, seamlessly transition to arguing the opposite.</li>
                </ul>
              </div>
              <div className={styles.featureImage}>
                <Image 
                  src="/images/docs/OPPOSITE MODE.png" 
                  alt="Opposite Mode Screenshot" 
                  width={1600}
                  height={900}
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </div>
            </div>
          </AnimatedSection>

          {/* Document Mode */}
          <AnimatedSection>
            <div className={styles.featureRow}>
              <div className={styles.featureContent}>
                <span className={`${styles.featureLabel} ${styles.labelDocument}`}>Document Mode</span>
                <h3 className={styles.featureTitle}>Practice with your own material</h3>
                <p className={styles.featureDesc}>
                  Upload your resume, a presentation, or any document. The AI reads it and tests your understanding of your own material, ensuring you don't just memorize, but actually comprehend it.
                </p>
                <ul className={styles.featureList}>
                  <li><CheckIcon /> Upload a PDF, PPTX, or DOCX file (up to 10MB).</li>
                  <li><CheckIcon /> Choose "Presentation" (to practice pitching) or "Interview" (to get grilled on details).</li>
                  <li><CheckIcon /> The AI extracts the text and bases all its questions strictly on your document.</li>
                  <li><CheckIcon /> Defend your design choices, explain your work experience, or practice your sales pitch.</li>
                </ul>
              </div>
              <div className={styles.featureImage}>
                <Image 
                  src="/images/docs/DOC MODE.png" 
                  alt="Document Mode Screenshot" 
                  width={1600}
                  height={900}
                  style={{ width: '100%', height: 'auto', display: 'block' }} 
                />
              </div>
            </div>
          </AnimatedSection>
        </div>
      </main>
    </>
  );
}
