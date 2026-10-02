import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pressure Mode',
  description: 'Think fast and speak clearly. Practice delivering articulate answers under pressure with limited preparation time.',
};

export default function PressureLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
