import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Document Mode',
  description: 'Upload your material and practice presenting or being interviewed on your own content.',
};

export default function DocumentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
