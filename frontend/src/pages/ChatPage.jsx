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
    <div className="h-screen flex flex-col">
      <div className="flex-1 overflow-y-auto px-6 py-6 max-w-3xl mx-auto w-full space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-20">
            <h2 className="font-serif text-xl text-ink mb-2">
              {hasDocuments ? 'Ask something about your documents' : 'Upload a document to get started'}
            </h2>
            <p className="text-slateink text-sm">
              {hasDocuments
                ? 'Every answer will point back to the page it came from.'
                : 'Head to Documents in the sidebar to upload a PDF, TXT, or DOCX file.'}
            </p>
          </div>
        )}

        {messages.map((m) => (
          <MessageBubble key={m._id} message={m} />
        ))}

        {status && (
          <p className="text-sm text-slateink italic">
            {status === 'searching' ? 'Searching your documents…' : 'Generating answer…'}
          </p>
        )}

        {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}

        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-slateink/15 px-6 py-4">
        <div className="max-w-3xl mx-auto flex gap-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents…"
            className="flex-1 border border-slateink/30 rounded px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-teal"
          />
          <button
            type="submit"
            disabled={!input.trim() || status !== null}
            className="bg-teal text-white px-5 py-2.5 rounded font-medium hover:bg-teal-dark transition-colors disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
