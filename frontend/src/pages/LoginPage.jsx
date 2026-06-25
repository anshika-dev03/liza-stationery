import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function LoginPage({ onLogin }) {
  const { login } = useAuth();
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const user = await login(form.username, form.password);
      onLogin(user);
    } catch {
      setError('Invalid username or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'var(--bg)' }}>
      <div className="card" style={{ width:'100%', maxWidth:400 }}>
        <div style={{ textAlign:'center', marginBottom:28 }}>
          <div style={{ fontSize:32, marginBottom:8 }}>🖊</div>
          <h1 style={{ fontSize:22, fontWeight:700 }}>Liza Stationery</h1>
          <p style={{ color:'var(--text3)', marginTop:4 }}>Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom:14 }}>
            <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Username</label>
            <input
              value={form.username}
              onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
              placeholder="lizastationery"
              autoFocus
              required
            />
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={{ display:'block', fontWeight:600, marginBottom:6, fontSize:13 }}>Password</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div style={{ background:'rgba(220,38,38,0.08)', border:'1px solid rgba(220,38,38,0.2)', borderRadius:8, padding:'10px 14px', color:'var(--red)', fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}

          <button type="submit" className="btn-primary" style={{ width:'100%', justifyContent:'center', padding:'10px' }} disabled={loading}>
            {loading ? <><span className="spinner" style={{ width:14, height:14 }} /> Signing in…</> : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}