'use client';

import { useState, useCallback } from 'react';

type Props = {
  url: string;
  modelNames: string[];
};

export function ShareButtons({ url, modelNames }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select a temporary input
      const input = document.createElement('input');
      input.value = url;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [url]);

  const modelList = modelNames.slice(0, 3).join(', ');
  const tweetText = encodeURIComponent(`Comparing ${modelList} on LLM Knowledge Base — ${url}`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}`;

  return (
    <div className="flex items-center gap-2">
      {/* Copy link */}
      <button
        type="button"
        onClick={handleCopy}
        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2"
        style={{
          background: copied ? 'var(--color-panel-bg-alt)' : 'var(--color-surface)',
          borderColor: copied ? 'var(--color-secondary)' : 'var(--color-border)',
          color: copied ? 'var(--color-secondary)' : 'var(--color-text-muted)',
        }}
        aria-label="Copy shareable link"
      >
        {copied ? (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path
                d="M2 7l3.5 3.5L12 3"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Copied!
          </>
        ) : (
          <>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <rect
                x="4"
                y="4"
                width="8"
                height="8"
                rx="1.5"
                stroke="currentColor"
                strokeWidth="1.5"
              />
              <path d="M2 10V2h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            Copy link
          </>
        )}
      </button>

      {/* Twitter/X share */}
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
        aria-label="Share on X (Twitter)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
          <path d="M10.97 1h2.08L8.48 6.26 14 13H9.68L6.37 8.77 2.58 13H.5l4.84-5.54L0 1h4.43l2.98 3.94L10.97 1zm-.73 10.8h1.15L3.8 2.18H2.57l7.67 9.62z" />
        </svg>
        Share
      </a>
    </div>
  );
}
