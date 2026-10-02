'use client';

import styles from './Loader.module.css';

interface LoaderProps {
  size?: 'small' | 'medium' | 'large';
  text?: string;
  className?: string;
}

export default function Loader({ size = 'medium', text, className = '' }: LoaderProps) {
  return (
    <div className={`${styles.loaderContainer} ${className}`} role="status" aria-live="polite">
      <div className={`${styles.spinner} ${styles[size]}`}></div>
      {text && <span className={styles.text}>{text}</span>}
      <span className="sr-only">Loading...</span>
    </div>
  );
}
