import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Interview Mode',
  description: 'AI-powered mock interviews that adapt to your weaknesses. Practice tailored interview questions and receive real-time feedback on your performance.',
};

export default function InterviewLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
