import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Opposite Mode',
  description: 'Build mental flexibility and debate skills. Practice arguing for a position and dynamically switching sides.',
};

export default function OppositeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
