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
        <div className="bg-teal text-white rounded-lg px-4 py-2.5 max-w-xl">
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slateink/15 rounded-lg px-4 py-3 max-w-2xl w-full">
        <div className="prose prose-sm max-w-none prose-p:my-2 prose-headings:font-serif">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
        <SourceList sources={message.sources} />
        <button onClick={handleCopy} className="mt-2 text-xs text-slateink hover:text-ink">
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
