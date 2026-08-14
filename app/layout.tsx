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
      {/*
        Inline script runs before first paint to apply the saved theme class,
        preventing a flash of the wrong theme on hard reload.
        Reads localStorage key "llm-kb-theme"; falls back to prefers-color-scheme.
      */}
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('llm-kb-theme');if(t==='light'){document.documentElement.classList.add('light')}else if(!t&&window.matchMedia('(prefers-color-scheme: light)').matches){document.documentElement.classList.add('light')}}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}