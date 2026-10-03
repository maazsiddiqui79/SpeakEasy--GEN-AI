'use client';

import React, { useEffect, useRef, useState } from 'react';
import styles from './AnimatedSection.module.css';

interface AnimatedSectionProps {
  children: React.ReactNode;
  className?: string;
  delay?: 0 | 100 | 200 | 300 | 400 | 500;
  threshold?: number;
}

export default function AnimatedSection({ 
  children, 
  className = '', 
  delay = 0,
  threshold = 0.1
}: AnimatedSectionProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold]);

  const delayClass = delay ? styles[`delay${delay}`] : '';

  return (
    <div
      ref={ref}
      className={`${styles.hidden} ${isVisible ? styles.visible : ''} ${delayClass} ${className}`}
    >
      {children}
    </div>
  );
}
