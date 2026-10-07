import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { api } from '../api.js';
import { ErrorNote } from '../components/Layout.jsx';
import sedesImg from '../img/sedes.png';
import mapsaLogo from '../img/MaPSA 1.png';

export default function Login() {
  const { user, login } = useAuth();
  const nav = useNavigate();
  const [uniqueId, setUniqueId] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [busy, setBusy] = useState(false);

  const isAdmin = user?.role === 'admin' || user?.role === 'superadmin';
  if (user) return <Navigate to={isAdmin ? '/admin' : '/'} replace />;

  const run = async (fn) => {
    setError(''); setInfo(''); setBusy(true);
    try { await fn(); } catch (e) { setError(e.message); } finally { setBusy(false); }
  };

  const submitLogin = (e) => {
    e.preventDefault();
    run(async () => {
      const u = await login(uniqueId);
      const uIsAdmin = u.role === 'admin' || u.role === 'superadmin';
      nav(uIsAdmin ? '/admin' : '/');
    });
  };

  return (
    <div className="login-wrap">
      <img src={sedesImg} alt="" className="sedes-watermark" />
      <div className="login-card">
        <div className="login-brand">
          <img src={mapsaLogo} alt="MaPSA Logo" className="login-logo" />
          <div className="brand-text" style={{ alignItems: 'center' }}>
            <h1>MaPSA</h1>
            <p className="muted">Book Evaluation System</p>
          </div>
        </div>

        <ErrorNote error={error} />
        <ErrorNote error={info} type="info" />

        <form onSubmit={submitLogin}>
          <div className="field">
            <label className="label" htmlFor="uid">Input ID</label>
            <input
              id="uid"
              autoFocus
              value={uniqueId}
              onChange={(e) => setUniqueId(e.target.value)}
              placeholder="e.g. MBE-ABCDE"
              autoComplete="off"
              required
            />
          </div>
          <button className="btn primary block" disabled={busy}>
            {busy ? 'Verifying...' : 'Sign In'}
          </button>
          <p className="muted small center" style={{ marginTop: '14px', marginBottom: 0 }}>
            Account IDs are issued by the system administrator.
          </p>
        </form>
      </div>
      <a
        href="https://sean-m.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-pill-branding login"
      >
        POWERED BY: <strong>MAPSA</strong> <span className="footer-dot">•</span> <strong>SEAN MORALES</strong>
      </a>
    </div>
  );
}
