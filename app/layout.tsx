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

/** Inline script that runs before first paint to apply the saved theme class,
 *  preventing a flash of the wrong theme on page load. */
const themeScript = `
(function(){
  try {
    var t = localStorage.getItem('llm-kb-theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    if (t === 'light') document.documentElement.classList.add('light');
  } catch(e) {}
})();
`

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
