import ReactMarkdown from 'react-markdown';
import { useState } from 'react';
import SourceList from './SourceList';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-xl rounded-2xl rounded-br-md bg-teal px-4 py-3 text-sm leading-6 text-white shadow-md shadow-teal/10">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="w-full max-w-3xl rounded-2xl rounded-bl-md border border-slateink/10 bg-white px-5 py-4 shadow-sm sm:px-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-dark">
          <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-teal-light text-sm text-teal">✦</span>
          Assistant
        </div>
        <div className="prose prose-sm max-w-none leading-6 prose-p:my-2 prose-headings:font-serif prose-headings:text-ink prose-a:text-teal-dark">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <SourceList sources={message.sources} />
        <button onClick={handleCopy} className="mt-4 rounded-lg px-2 py-1 text-xs font-medium text-slateink transition hover:bg-paper hover:text-ink">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
