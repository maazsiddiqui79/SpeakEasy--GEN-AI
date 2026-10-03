import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: {
    template: '%s | Speak Easy',
    default: 'Speak Easy — Train Under Pressure. Speak Clearly. Build Confidence.',
  },
  description: 'AI-powered voice communication trainer. Practice interviews, impromptu speaking, argumentation, and presentations with real-time speech analysis, fumbling detection, and recovery suggestions.',
  keywords: ['speech training', 'interview practice', 'AI coach', 'public speaking', 'communication skills', 'voice training'],
  authors: [{ name: 'Speak Easy' }],
  openGraph: {
    title: 'Speak Easy',
    description: 'Train Under Pressure. Speak Clearly. Build Confidence.',
    type: 'website',
  },
};

import Footer from '@/components/layout/Footer';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f0e17" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://api.fontshare.com/v2/css?f[]=clash-display@400,500,600,700&amp;f[]=satoshi@400,500,700&amp;display=swap" rel="stylesheet" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var localTheme = localStorage.getItem('theme');
                  var theme = localTheme || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body suppressHydrationWarning>
        <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
          {children}
          <Footer />
        </div>
      </body>
    </html>
  );
}
