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
  const [tab, setTab] = useState('login');
  const [uniqueId, setUniqueId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
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

  const submitRegister = (e) => {
    e.preventDefault();
    run(async () => {
      const r = await api.post('/auth/register', { name, email });
      setInfo(r.message + ' Please use your issued ID to sign in.');
      setTab('login');
      setUniqueId('');
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

        <div className="tabs">
          <button
            type="button"
            className={tab === 'login' ? 'on' : ''}
            onClick={() => { setTab('login'); setError(''); }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={tab === 'register' ? 'on' : ''}
            onClick={() => { setTab('register'); setError(''); setInfo(''); }}
          >
            Register
          </button>
        </div>

        <ErrorNote error={error} />
        <ErrorNote error={info} type="info" />

        {tab === 'login' ? (
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
              Don't have an ID? Switch to the Register tab above to register.
            </p>
          </form>
        ) : (
          <form onSubmit={submitRegister}>
            <div className="fields">
              <div className="field">
                <label className="label" htmlFor="name">Full Name</label>
                <input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Dr. Juan dela Cruz"
                  required
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@school.edu.ph"
                  required
                />
              </div>
            </div>
            <button className="btn primary block" disabled={busy}>
              {busy ? 'Registering...' : 'Register & Generate ID'}
            </button>
            <p className="muted small center" style={{ marginTop: '14px', marginBottom: 0 }}>
              Your ID will be generated and sent through email.
            </p>
          </form>
        )}
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
