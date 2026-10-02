import Link from 'next/link';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <p className={styles.footerText}>
        Speak Easy — Voice-first communication training powered by artificial intelligence
      </p>
      <div className={styles.footerLinks}>
        <Link href="/privacy-policy">Privacy Policy</Link>
        <Link href="/terms-and-conditions">Terms & Conditions</Link>
      </div>
    </footer>
  );
}
