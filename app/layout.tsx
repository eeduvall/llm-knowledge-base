import type { Metadata } from 'next'
import '../styles/globals.css'

export const metadata: Metadata = {
  title: 'LLM Knowledge Base — Stop guessing which model to ship',
  description:
    'A living map of the language-model landscape — models pulled together by what they can actually do, not by who markets them hardest.',
}

type Props = {
  children: React.ReactNode
}

/**
 * Inline script injected before first paint to apply the saved theme class.
 * This prevents a flash of the wrong theme on hard reload.
 * Reads localStorage key `llm-kb-theme`; falls back to `prefers-color-scheme`.
 */
const themeScript = `
(function() {
  try {
    var saved = localStorage.getItem('llm-kb-theme');
    if (saved === 'light') {
      document.documentElement.classList.add('light');
    } else if (!saved) {
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (!prefersDark) {
        document.documentElement.classList.add('light');
      }
    }
  } catch (e) {}
})();
`.trim()

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      {/* eslint-disable-next-line react/no-danger */}
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
