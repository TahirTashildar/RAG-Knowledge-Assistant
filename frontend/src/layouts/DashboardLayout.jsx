import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/app/chat', label: 'New chat' },
  { to: '/app/documents', label: 'Documents' },
  { to: '/app/conversations', label: 'Conversations' },
  { to: '/app/settings', label: 'Settings' },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/');
  }

  return (
    <div className="min-h-screen flex bg-paper">
      <aside className="flex w-60 shrink-0 flex-col bg-ink text-paper shadow-xl shadow-ink/10">
        <div className="border-b border-white/10 px-5 py-6">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-lg text-white shadow-lg shadow-teal/20">✦</span>
            <div>
              <p className="font-serif text-lg font-semibold leading-none">Marginal</p>
              <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-paper/45">Knowledge assistant</p>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-5">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? 'bg-teal text-white shadow-lg shadow-black/10' : 'text-paper/65 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-white/10 px-3 py-4 text-sm">
          <p className="mb-2 truncate px-3 text-xs text-paper/50">{user?.email}</p>
          <button onClick={handleLogout} className="w-full rounded-lg px-3 py-2 text-left text-paper/65 transition hover:bg-white/5 hover:text-white">
            Log out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
