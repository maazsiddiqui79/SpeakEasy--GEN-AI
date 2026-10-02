import Header from '@/components/layout/Header';
import styles from './page.module.css';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About',
  description: 'Learn about Speak Easy, our mission, and the technology behind our AI-powered voice training application.',
};
export default function AboutPage() {
  return (
    <>
      <Header />
      <main className={styles.main}>
        <div className={styles.hero}>
          <h1 className={styles.title}>About Speak Easy</h1>
          <p className={styles.subtitle}>
            Empowering communication through intelligent, real-time coaching.
          </p>
        </div>

        <section className={styles.section}>
          <h2>What is the Project?</h2>
          <p>
            Speak Easy is an advanced, voice-first coaching application designed to help individuals
            improve their communication, interviewing, debating, and presentation skills. It uses
            state-of-the-art AI to act as an interactive evaluator, providing real-time feedback on
            fluency, structure, and content.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What Problem Are We Solving?</h2>
          <p>
            Public speaking, high-stakes interviews, and intense debates are universally anxiety-inducing.
            People often struggle with filler words, weak structuring, and freezing under pressure.
            Traditional coaching is expensive, inaccessible, and lacks immediate quantitative feedback.
            We are solving the lack of accessible, personalized, and objective communication training.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How Are We Solving It?</h2>
          <p>
            We provide specialized training modes (Interview, Opposite, Document, and Pressure) that simulate
            real-world scenarios. Our proprietary Speech Analyzer processes live transcripts to detect
            filler words, fumbling, pacing issues, and weak vocabulary, while our AI Engine (powered by Groq)
            dynamically adjusts its responses to challenge the user and provide actionable coaching.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Tech Stack</h2>
          <ul className={styles.techList}>
            <li><strong>Framework:</strong> Next.js</li>
            <li><strong>AI Models:</strong> Groq API (qwen/qwen3.8-27b)</li>
            <li><strong>Voice:</strong> Web Speech API (Recognition & Synthesis)</li>
            <li><strong>Styling:</strong> Pure CSS Modules with a custom Design System</li>
            <li><strong>Deployment:</strong> Vercel</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>The Team</h2>
          <p className={styles.teamContext}>
            We built this project as part of the Gen AI competition at the TCET Zephyr event, an intensive coding challenge to push the boundaries
            of what voice-first AI applications can do.
          </p>
          <ul className={styles.teamList}>
            <li className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <h3>Anuja Yadav</h3>
              </div>
              <Link href="https://www.linkedin.com/in/anuja-yadav-5392a6376/" className={styles.connectBtn}>LinkedIn ↗</Link>
            </li>
            <li className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <h3>Maaz Siddiqui</h3>
              </div>
              <Link href="https://maaz-social-card.vercel.app/" className={styles.connectBtn}>Connect ↗</Link>
            </li>
            <li className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <h3>Payal Pokhrel</h3>
              </div>
              <Link href="https://www.linkedin.com/in/payalpokhrel?utm_source=share_via&utm_content=profile&utm_medium=member_android" className={styles.connectBtn}>LinkedIn ↗</Link>
            </li>
            <li className={styles.memberItem}>
              <div className={styles.memberInfo}>
                <h3>Shruti Padia</h3>
              </div>
              <Link href="https://www.linkedin.com/in/shruti-padia-93a322310" className={styles.connectBtn}>LinkedIn ↗</Link>
            </li>
          </ul>
        </section>
      </main>
    </>
  );
}
