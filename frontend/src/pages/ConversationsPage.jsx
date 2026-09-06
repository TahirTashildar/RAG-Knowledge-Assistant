import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { deleteConversation, listConversations, updateConversation } from '../services/conversationService';

export default function ConversationsPage() {
  const [conversations, setConversations] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const navigate = useNavigate();

  function refresh() {
    listConversations().then(setConversations).catch(() => {});
  }

  useEffect(refresh, []);

  async function handleRename(id) {
    await updateConversation(id, { title: editTitle });
    setEditingId(null);
    refresh();
  }

  async function handleDelete(id) {
    await deleteConversation(id);
    refresh();
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-serif text-2xl text-ink">Conversations</h1>
        <button
          onClick={() => navigate('/app/chat')}
          className="bg-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-teal-dark transition-colors"
        >
          New chat
        </button>
      </div>

      {conversations.length === 0 && <p className="text-slateink text-sm">No conversations yet.</p>}

      <div className="space-y-2">
        {conversations.map((c) => (
          <div key={c._id} className="flex items-center justify-between border border-slateink/15 rounded-lg px-4 py-3">
            {editingId === c._id ? (
              <input
                autoFocus
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={() => handleRename(c._id)}
                onKeyDown={(e) => e.key === 'Enter' && handleRename(c._id)}
                className="border border-slateink/30 rounded px-2 py-1 text-sm flex-1 mr-3"
              />
            ) : (
              <Link to={`/app/chat/${c._id}`} className="text-ink font-medium truncate hover:text-teal">
                {c.title}
              </Link>
            )}
            <div className="flex items-center gap-3 text-sm shrink-0">
              <button
                onClick={() => {
                  setEditingId(c._id);
                  setEditTitle(c.title);
                }}
                className="text-slateink hover:text-ink"
              >
                Rename
              </button>
              <button onClick={() => handleDelete(c._id)} className="text-slateink hover:text-red-700">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
