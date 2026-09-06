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
      <aside className="w-60 shrink-0 bg-ink text-paper flex flex-col">
        <div className="px-5 py-5 font-serif text-lg font-semibold border-b border-white/10">Marginal</div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-3 py-2 rounded text-sm transition-colors ${
                  isActive ? 'bg-teal/20 text-white' : 'text-paper/70 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-3 py-4 border-t border-white/10 text-sm">
          <p className="px-3 text-paper/60 truncate mb-2">{user?.email}</p>
          <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded text-paper/70 hover:bg-white/5 hover:text-white">
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
