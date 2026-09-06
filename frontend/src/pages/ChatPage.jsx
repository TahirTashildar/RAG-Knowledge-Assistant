import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import MessageBubble from '../components/MessageBubble';
import {
  createConversation,
  getConversation,
  listMessages,
  sendMessage,
} from '../services/conversationService';
import { listDocuments } from '../services/documentService';
import { loadSettings } from '../utils/ragSettings';

export default function ChatPage() {
  const { conversationId } = useParams();
  const navigate = useNavigate();

  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [input, setInput] = useState('');
  const [status, setStatus] = useState(null); // null | 'searching' | 'generating'
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    listDocuments().then(setDocuments).catch(() => {});
  }, []);

  useEffect(() => {
    if (!conversationId) {
      setConversation(null);
      setMessages([]);
      return;
    }
    (async () => {
      try {
        const [conv, msgs] = await Promise.all([getConversation(conversationId), listMessages(conversationId)]);
        setConversation(conv);
        setMessages(msgs);
      } catch {
        setError('Could not load this conversation');
      }
    })();
  }, [conversationId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, status]);

  async function handleSend(e) {
  e.preventDefault();

  const content = input.trim();
  if (!content || status) return;

  setError('');
  setInput('');

  // Create a unique temporary ID
  const tempId = `temp-${Date.now()}`;

  let convId = conversationId;
  let conv = conversation;

  try {
    // Create conversation if one doesn't exist
    if (!convId) {
      const settings = loadSettings();

      conv = await createConversation({
        title: content.slice(0, 60),
        documentIds: documents.map((d) => d._id),
        retrievalMode: settings.retrievalMode,
        topK: settings.topK,
      });

      convId = conv._id;
      setConversation(conv);

      navigate(`/app/chat/${convId}`, { replace: true });
    }

    // Add user message locally ONCE
    setMessages((prev) => [
      ...prev,
      {
        role: 'user',
        content,
        _id: tempId,
      },
    ]);

    setStatus('searching');

    const settings = loadSettings();

    const result = await sendMessage(convId, {
      content,
      temperature: settings.temperature,
    });

    setStatus('generating');

    // Replace temporary user message with the real backend message
    setMessages((prev) => [
      ...prev.map((message) =>
        message._id === tempId ? result.userMessage : message
      ),
      result.assistantMessage,
    ]);

  } catch (err) {
    // Remove temporary message if request fails
    setMessages((prev) =>
      prev.filter((message) => message._id !== tempId)
    );

    setError(
      err.response?.data?.message ||
      'Something went wrong sending that message'
    );
  } finally {
    setStatus(null);
  }
}
  const hasDocuments = documents.length > 0;

  return (
    <div className="h-screen flex flex-col bg-[radial-gradient(circle_at_top_right,_rgba(47,111,98,0.08),_transparent_32rem)]">
      <header className="shrink-0 border-b border-slateink/10 bg-paper/85 px-4 py-4 backdrop-blur sm:px-8">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-dark">Research workspace</p>
            <h1 className="mt-1 text-xl font-semibold text-ink sm:text-2xl">
              {conversation?.title || 'New conversation'}
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-teal/15 bg-teal-light px-3 py-1.5 text-xs font-medium text-teal-dark sm:flex">
            <span className="h-2 w-2 rounded-full bg-teal shadow-[0_0_0_3px_rgba(47,111,98,0.12)]" />
            {documents.length} {documents.length === 1 ? 'document' : 'documents'} indexed
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
        <div className="mx-auto max-w-4xl space-y-5">
        {messages.length === 0 && (
          <div className="mx-auto max-w-2xl py-12 text-center sm:py-20">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal text-2xl text-white shadow-lg shadow-teal/20">
              ✦
            </div>
            <h2 className="font-serif text-2xl text-ink sm:text-3xl">
              {hasDocuments ? 'Ask something about your documents' : 'Upload a document to get started'}
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slateink">
              {hasDocuments
                ? 'Every answer will point back to the page it came from.'
                : 'Head to Documents in the sidebar to upload a PDF, TXT, or DOCX file.'}
            </p>
            {hasDocuments && (
              <div className="mx-auto mt-7 max-w-md rounded-2xl border border-amber/20 bg-amber-light/60 px-4 py-3 text-left text-xs leading-5 text-body/75">
                <span className="font-semibold text-amber">Tip</span> Ask for a summary, a specific fact, or a comparison across your uploaded files.
              </div>
            )}
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m._id} message={m} />
        ))}

        {status && (
          <div className="flex items-center gap-3 text-sm text-slateink">
            <span className="flex gap-1">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal [animation-delay:-0.2s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal [animation-delay:-0.1s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-teal" />
            </span>
            {status === 'searching' ? 'Searching your documents…' : 'Generating answer…'}
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </p>
          )}

        <div ref={bottomRef} />
        </div>
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-slateink/10 bg-paper/90 px-4 py-4 backdrop-blur sm:px-8 sm:py-5">
        <div className="mx-auto flex max-w-4xl items-end gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents…"
            aria-label="Question"
            className="min-w-0 flex-1 rounded-xl border border-slateink/20 bg-white px-4 py-3 text-sm text-ink shadow-sm outline-none transition placeholder:text-slateink/60 focus:border-teal focus:ring-4 focus:ring-teal/10"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== null}
            className="rounded-xl bg-teal px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-teal/20 transition hover:-translate-y-0.5 hover:bg-teal-dark hover:shadow-md disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-40"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
