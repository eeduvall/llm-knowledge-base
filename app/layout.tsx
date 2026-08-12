import type { Metadata } from 'next';
import '../styles/globals.css';
import { QueryProvider } from '@/components/QueryProvider';

export const metadata: Metadata = {
  title: 'LLM Knowledge Base — Stop guessing which model to ship',
  description:
    'A living map of the language-model landscape — models pulled together by what they can actually do, not by who markets them hardest.',
};

type Props = {
  children: React.ReactNode;
};

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
