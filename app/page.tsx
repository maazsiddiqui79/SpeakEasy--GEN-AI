'use client';

import Link from 'next/link';
import Header from '@/components/layout/Header';
import styles from './page.module.css';

const MODES = [
  {
    id: 'interview',
    icon: '👔',
    title: 'Interview Mode',
    description: 'AI-powered mock interviews that adapt to your weaknesses. Get targeted follow-ups, not generic questions.',
    features: ['Adaptive questions', 'Weakness targeting', 'Real-time speech analysis'],
    href: '/interview',
    gradient: 'var(--color-primary)',
    glowColor: 'var(--color-primary-glow)',
  },
  {
    id: 'pressure',
    icon: '⚡',
    title: 'Pressure Mode',
    description: 'Think fast, speak clearly. Practice delivering answers with 5-15 seconds of preparation time.',
    features: ['Timed preparation', 'Fluency analysis', 'Pacing feedback'],
    href: '/pressure',
    gradient: 'var(--color-warm)',
    glowColor: 'var(--color-warm-glow)',
  },
  {
    id: 'opposite',
    icon: '🔄',
    title: 'Opposite Mode',
    description: 'Build mental flexibility. Argue for a position, then switch sides mid-session.',
    features: ['Argument analysis', 'Side switching', 'Logic evaluation'],
    href: '/opposite',
    gradient: 'var(--color-accent)',
    glowColor: 'var(--color-accent-glow)',
  },
  {
    id: 'document',
    icon: '📄',
    title: 'Document Mode',
    description: 'Upload your material and practice presenting or being interviewed on your own content.',
    features: ['PDF/PPT/DOCX support', 'Content-grounded Q&A', 'Presentation evaluation'],
    href: '/document',
    gradient: 'var(--color-info)',
    glowColor: 'hsla(210, 80%, 60%, 0.25)',
  },
];

const SPEECH_FEATURES = [
  {
    icon: '🔍',
    title: 'Filler Detection',
    description: '"um", "like", "basically" — tracked and counted in real-time with cluster analysis.',
  },
  {
    icon: '🔄',
    title: 'Fumbling Recovery',
    description: 'Sentence restarts and broken thoughts detected. Get a recovery technique and alternative phrasing.',
  },
  {
    icon: '💡',
    title: '"Say This Instead"',
    description: 'Not just criticism — specific, contextual replacement phrases for every detected issue.',
  },
  {
    icon: '🎯',
    title: 'Subtle Real-Time',
    description: 'Minimal signals during speech. Detailed analysis only after you finish speaking.',
  },
];

export default function HomePage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        {/* Hero Section */}
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroContent}>
            <div className={styles.heroBadge}>
              <span className={styles.heroBadgeDot} />
              AI-Powered Voice Training
            </div>
            <h1 id="hero-title" className={styles.heroTitle}>
              Train Under Pressure.{' '}
              <span className={styles.heroTitleGradient}>Speak Clearly.</span>{' '}
              Build Confidence.
            </h1>
            <p className={styles.heroSubtitle}>
              Speak Easy doesn&apos;t just tell you what you did wrong.
              It tells you <strong>what to say instead</strong>.
            </p>
            <div className={styles.heroActions}>
              <Link href="/interview" className={"btn btn-primary btn-lg " + (styles.heroCta)} id="start-training-btn">
                🎙️ Start Training
              </Link>
              <a href="#modes" className={"btn btn-secondary btn-lg " + (styles.heroSecondary)}>
                Explore Modes
              </a>
            </div>

            {/* Voice state preview */}
            <div className={styles.voicePreview} aria-hidden="true">
              <div className={styles.voiceState}>
                <span className={styles.voiceStateDot} data-state="ready" />
                <span>🎙️ Ready</span>
              </div>
              <span className={styles.voiceArrow}>→</span>
              <div className={styles.voiceState}>
                <span className={styles.voiceStateDot} data-state="listening" />
                <span>🔴 Listening</span>
              </div>
              <span className={styles.voiceArrow}>→</span>
              <div className={styles.voiceState}>
                <span className={styles.voiceStateDot} data-state="analyzing" />
                <span>🧠 Analyzing</span>
              </div>
              <span className={styles.voiceArrow}>→</span>
              <div className={styles.voiceState}>
                <span className={styles.voiceStateDot} data-state="speaking" />
                <span>🔊 AI Responds</span>
              </div>
            </div>
          </div>
        </section>

        {/* Modes Section */}
        <section id="modes" className={styles.modesSection} aria-labelledby="modes-title">
          <div className={styles.sectionHeader}>
            <h2 id="modes-title" className={styles.sectionTitle}>Four Training Modes</h2>
            <p className={styles.sectionSubtitle}>Each mode uses voice interaction, real-time analysis, and adaptive AI</p>
          </div>
          <div className={styles.modesGrid}>
            {MODES.map((mode, index) => (
              <Link
                href={mode.href}
                key={mode.id}
                className={(styles.modeCard) + " glass-card animate-fade-in-up delay-" + (index + 1)}
                id={"mode-card-" + (mode.id)}
                style={{ '--card-color': mode.gradient, '--card-glow': mode.glowColor } as React.CSSProperties}
              >
                <div className={styles.modeCardIcon}>{mode.icon}</div>
                <h3 className={styles.modeCardTitle}>{mode.title}</h3>
                <p className={styles.modeCardDescription}>{mode.description}</p>
                <ul className={styles.modeCardFeatures}>
                  {mode.features.map((feature) => (
                    <li key={feature} className={styles.modeCardFeature}>
                      <span className={styles.featureCheck}>✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <div className={styles.modeCardArrow}>
                  Start Training →
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Speech Intelligence Section */}
        <section className={styles.intelligenceSection} aria-labelledby="intelligence-title">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionBadge}>Core Technology</div>
            <h2 id="intelligence-title" className={styles.sectionTitle}>Real-Time Speech Intelligence</h2>
            <p className={styles.sectionSubtitle}>
              Not just detection — identification, explanation, recovery technique, and alternative phrasing
            </p>
          </div>

          <div className={styles.intelligenceGrid}>
            {SPEECH_FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={(styles.intelligenceCard) + " glass-card animate-fade-in-up delay-" + (index + 1)}
              >
                <div className={styles.intelligenceIcon}>{feature.icon}</div>
                <h3 className={styles.intelligenceTitle}>{feature.title}</h3>
                <p className={styles.intelligenceDescription}>{feature.description}</p>
              </div>
            ))}
          </div>

          {/* Recovery example */}
          <div className={(styles.recoveryExample) + " glass-card"}>
            <div className={styles.recoveryHeader}>
              <span className={styles.recoveryBadge}>⚠️ Fumbling Detected</span>
            </div>
            <div className={styles.recoveryBody}>
              <div className={styles.recoveryProblem}>
                <span className={styles.recoveryLabel}>You said:</span>
                <p className={styles.recoveryText}>
                  &ldquo;The main reason... actually... what I mean is... the main reason is...&rdquo;
                </p>
              </div>
              <div className={styles.recoveryExplanation}>
                <span className={styles.recoveryLabel}>What happened:</span>
                <p>You restarted the sentence twice. This signals uncertainty to the listener.</p>
              </div>
              <div className={styles.recoveryTechnique}>
                <span className={styles.recoveryLabel}>Recovery:</span>
                <p>Pause → Breathe → Restart with a shorter sentence.</p>
              </div>
              <div className={styles.recoverySuggestion}>
                <span className={styles.recoveryLabel}>Try instead:</span>
                <p className={styles.recoverySuggestedText}>&ldquo;The main reason is...&rdquo;</p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
            Speak Easy — Voice-first communication training powered by artificial intelligence
          </p>
        </footer>
      </main>
    </>
  );
}
