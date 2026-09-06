import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/app');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong logging in');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link to="/" className="font-serif text-xl font-semibold text-ink block mb-8 text-center">
          Marginal
        </Link>
        <h1 className="font-serif text-2xl text-ink mb-6 text-center">Log in</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>}
          <div>
            <label className="block text-sm text-slateink mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slateink/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <div>
            <label className="block text-sm text-slateink mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slateink/30 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-teal"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-teal text-white py-2 rounded font-medium hover:bg-teal-dark transition-colors disabled:opacity-60"
          >
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <p className="text-sm text-slateink text-center mt-6">
          No account yet?{' '}
          <Link to="/register" className="text-teal hover:underline">
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
