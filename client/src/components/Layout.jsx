import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../auth.jsx';
import { IconLogout } from './Icons.jsx';
import mapsaLogo from '../img/MaPSA 1.png';

export function Layout() {
  const { user, logout } = useAuth();
  const admin = user.role === 'admin' || user.role === 'superadmin';
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="topbar-inner">
          <div className="brand">
            <img src={mapsaLogo} alt="MaPSA Logo" className="brand-logo" />
            <div className="brand-text">
              <span className="brand-title">MaPSA</span>
              <span className="brand-sub">Book Evaluation System</span>
            </div>
          </div>
          <nav>
            {admin ? (
              <>
                <NavLink to="/admin" end>Evaluations</NavLink>
                <NavLink to="/admin/catalog">Publishers &amp; Books</NavLink>
                <NavLink to="/admin/evaluators">Evaluators</NavLink>
              </>
            ) : (
              <>
                <NavLink to="/" end>Publishers</NavLink>
                <NavLink to="/evaluations">My Evaluations</NavLink>
              </>
            )}
          </nav>
          <div className="who">
            <div className="user-name">
              <span>{user.name}</span>
              {/* <span className="user-role-badge">{user.role}</span> */}
            </div>
            <button className="btn danger small" onClick={logout} title="Sign out">
              <IconLogout /> Sign out
            </button>
          </div>
        </div>
      </header>
      <main className="container">
        <Outlet />
      </main>
      <a
        href="https://sean-m.vercel.app/"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-pill-branding"
      >
        POWERED BY: <strong>MAPSA</strong> <span className="footer-dot">•</span> <strong>SEAN MORALES</strong>
      </a>
    </div>
  );
}

export function RequireAuth({ admin, any, children }) {
  const { user, loading, config } = useAuth();
  if (loading) return <p className="center muted pad">Loading application...</p>;
  if (!user) return <Navigate to="/login" replace />;
  const isAdmin = user.role === 'admin' || user.role === 'superadmin';
  if (!any && admin && !isAdmin) return <Navigate to="/" replace />;
  if (!any && !admin && isAdmin) return <Navigate to="/admin" replace />;
  if (!config) return <p className="center muted pad">Loading configuration...</p>;
  return children;
}

export const PageHead = ({ title, sub, children }) => (
  <div className="pagehead">
    <div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {children && <div className="actions">{children}</div>}
  </div>
);

import { useEffect } from 'react';
import { useToast } from './Toast.jsx';

export const ErrorNote = ({ error, type = 'error' }) => {
  const { addToast } = useToast();
  useEffect(() => {
    if (error) {
      addToast(error, type);
    }
  }, [error, type, addToast]);
  return null;
};

