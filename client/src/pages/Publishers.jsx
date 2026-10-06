import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { IconChevron, IconBuilding, IconSearch } from '../components/Icons.jsx';

export default function Publishers() {
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/publishers')
      .then((r) => setList(r.publishers))
      .catch((e) => setError(e.message));
  }, []);

  const filtered = (list || []).filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <PageHead title="Publishers" sub="Select a publisher to view and evaluate textbooks." />
      <ErrorNote error={error} />

      {list && list.length > 0 && (
        <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search publishers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {!list ? (
        <p className="muted">Loading publishers...</p>
      ) : list.length === 0 ? (
        <div className="card center">
          <p className="muted">No publishers have been added yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card center">
          <p className="muted">No publishers match "{search}".</p>
        </div>
      ) : (
        <div className="cards">
          {filtered.map((p) => (
            <Link key={p._id} to={`/publishers/${p._id}`} className="card link">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--card-muted)',
                  border: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)'
                }}>
                  <IconBuilding />
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{p.name}</div>
                  <div className="muted small">View textbook catalog</div>
                </div>
              </div>
              <IconChevron style={{ color: 'var(--text-light)', flexShrink: 0 }} />
            </Link>
          ))}
        </div>
      )}
    </>
  );
}
