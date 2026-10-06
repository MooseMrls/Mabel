import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { IconPlus } from '../components/Icons.jsx';

export default function AdminEvaluators() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState(null); // { id?, name, email, role }
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  const isSuperAdmin = user?.role === 'superadmin';

  const load = async () => setUsers((await api.get('/admin/users')).users);
  useEffect(() => {
    if (isSuperAdmin) {
      load().catch((e) => setError(e.message));
    }
  }, [isSuperAdmin]);

  const guard = async (fn) => { setError(''); setMsg(''); try { await fn(); } catch (e) { setError(e.message); } };

  if (!isSuperAdmin) {
    return (
      <div className="card center pad" style={{ marginTop: '40px' }}>
        <h2>Access Restricted</h2>
        <p className="muted">Only Super Admins can access and manage account credentials.</p>
      </div>
    );
  }

  const save = (e) => {
    e.preventDefault();
    guard(async () => {
      if (form.id) {
        await api.put(`/admin/users/${form.id}`, { name: form.name, email: form.email, role: form.role });
        setMsg('User profile updated.');
      } else {
        const r = await api.post('/admin/users', { name: form.name, email: form.email, role: form.role || 'evaluator' });
        setMsg(r.emailed ? `${form.role.toUpperCase()} added. Their ID was emailed.` : `User added, but the email failed. ID: ${r.user.uniqueId}`);
      }
      setForm(null);
      await load();
    });
  };

  const filtered = users.filter((u) =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    (u.uniqueId && u.uniqueId.toLowerCase().includes(search.toLowerCase())) ||
    (u.role && u.role.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHead
        title="Account Management"
        sub="Manage evaluator, admin, and superadmin accounts and credentials. System automatically generates and emails secure IDs."
      >
        <button className="btn primary" onClick={() => setForm({ name: '', email: '', role: 'evaluator' })}>
          <IconPlus /> Add
        </button>
      </PageHead>

      <ErrorNote error={error} />
      <ErrorNote error={msg} type="success" />

      {form && (
        <form className="card" onSubmit={save}>
          <div className="between">
            <h2 style={{ margin: 0 }}>{form.id ? 'Edit User Profile' : 'Register New User'}</h2>
            <button type="button" className="btn ghost small" onClick={() => setForm(null)}>Cancel</button>
          </div>
          <div className="two" style={{ marginTop: '16px' }}>
            <div>
              <label className="label">Full Name <span className="req">*</span></label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Dr. Maria Santos"
                required
              />
            </div>
            <div>
              <label className="label">Email Address <span className="req">*</span></label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="user@school.edu.ph"
                required
              />
            </div>
          </div>
          <div style={{ marginTop: '14px' }}>
            <label className="label">Account Role <span className="req">*</span></label>
            <div className="choices">
              <label className="choice">
                <input
                  type="radio"
                  name="userRole"
                  checked={form.role === 'evaluator'}
                  onChange={() => setForm({ ...form, role: 'evaluator' })}
                /> Evaluator
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="userRole"
                  checked={form.role === 'admin'}
                  onChange={() => setForm({ ...form, role: 'admin' })}
                /> Admin
              </label>
              <label className="choice">
                <input
                  type="radio"
                  name="userRole"
                  checked={form.role === 'superadmin'}
                  onChange={() => setForm({ ...form, role: 'superadmin' })}
                /> Super Admin
              </label>
            </div>
          </div>
          <div className="actions end">
            <button type="button" className="btn ghost" onClick={() => setForm(null)}>Cancel</button>
            <button className="btn primary">Save Account</button>
          </div>
        </form>
      )}

      {users.length > 5 && (
        <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Search accounts by name, email, ID, or role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email Address</th>
              <th>Role</th>
              <th>ID</th>
              <th>Status</th>
              <th className="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((u) => (
              <tr key={u.id}>
                <td style={{ fontWeight: 600 }}>{u.name}</td>
                <td className="muted">{u.email}</td>
                <td>
                  <span className={`badge ${u.role === 'superadmin' ? 'pass' : u.role === 'admin' ? 'open' : 'neutral'}`}>
                    {u.role ? u.role.toUpperCase() : 'EVALUATOR'}
                  </span>
                </td>
                <td><code>{u.uniqueId}</code></td>
                <td>
                  <span className={`badge ${u.active !== false ? 'pass' : 'fail'}`}>
                    {u.active !== false ? 'Active' : 'Disabled'}
                  </span>
                </td>
                <td className="right nowrap" style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                  <button
                    className="btn info small"
                    onClick={() => setForm({ id: u.id, name: u.name, email: u.email, role: u.role || 'evaluator' })}
                  >
                    Edit
                  </button>
                  <button
                    className="btn warn small"
                    onClick={() => guard(async () => {
                      await api.post(`/admin/users/${u.id}/resend`);
                      setMsg(`ID sent to ${u.email}.`);
                    })}
                  >
                    Resend ID
                  </button>
                  <button
                    className="btn danger small"
                    disabled={u.role === 'superadmin'}
                    title={u.role === 'superadmin' ? 'Super Admin accounts cannot be deleted' : 'Delete account'}
                    onClick={() => guard(async () => {
                      if (window.confirm(`Are you sure you want to delete account "${u.name}"?`)) {
                        await api.delete(`/admin/users/${u.id}`);
                        setMsg(`Account for "${u.name}" was deleted.`);
                        await load();
                      }
                    })}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="muted center pad">
                  {users.length === 0 ? 'No accounts registered yet.' : `No accounts match "${search}".`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
