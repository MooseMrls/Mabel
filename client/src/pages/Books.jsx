import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { IconBack, IconBook, IconCheck, IconLock } from '../components/Icons.jsx';

export default function Books() {
  const { pid } = useParams();
  const { config } = useAuth();
  const [data, setData] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/publishers/${pid}/books`)
      .then(setData)
      .catch((e) => setError(e.message));
  }, [pid]);

  const books = data?.books || [];
  const filtered = books.filter((b) =>
    b.title.toLowerCase().includes(search.toLowerCase()) ||
    (b.authors && b.authors.toLowerCase().includes(search.toLowerCase())) ||
    (b.subject && b.subject.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      <PageHead
        title={data?.publisher.name || 'Textbooks'}
        sub={`Each textbook accepts up to ${config.maxEvaluators} independent evaluations.`}
      >
        <Link to="/" className="btn ghost">
          <IconBack /> Back to Publishers
        </Link>
      </PageHead>
      <ErrorNote error={error} />

      {books.length > 0 && (
        <div style={{ marginBottom: '20px', maxWidth: '360px' }}>
          <input
            type="text"
            placeholder="Search textbooks or authors..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      {!data ? (
        <p className="muted">Loading textbooks...</p>
      ) : books.length === 0 ? (
        <div className="card center">
          <p className="muted">No textbooks have been added for this publisher yet.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card center">
          <p className="muted">No textbooks match "{search}".</p>
        </div>
      ) : (
        <ul className="list">
          {filtered.map((b) => {
            const isCompleted = !!b.myEvaluationId;
            const isFull = !isCompleted && b.full;
            const isOpen = !isCompleted && !isFull;

            const content = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '8px',
                    backgroundColor: isCompleted ? 'var(--pass-bg)' : isFull ? 'var(--card-muted)' : 'var(--brand-light)',
                    border: `1px solid ${isCompleted ? 'var(--pass-border)' : isFull ? 'var(--border)' : 'var(--brand-border)'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: isCompleted ? 'var(--pass)' : isFull ? 'var(--text-light)' : 'var(--brand-dark)',
                    flexShrink: 0
                  }}>
                    {isCompleted ? <IconCheck /> : isFull ? <IconLock /> : <IconBook />}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '15px' }}>{b.title}</div>
                    <div className="muted small" style={{ marginTop: '2px' }}>
                      {b.authors || 'Author not yet specified'}
                      {b.gradeLevel && <span> &bull; Grade {b.gradeLevel}</span>}
                      {b.subject && <span> &bull; {b.subject}</span>}
                    </div>
                  </div>
                </div>

                <div className="right" style={{ flexShrink: 0 }}>
                  <span className="muted small" style={{ marginRight: '6px' }}>
                    {b.evaluationCount} / {config.maxEvaluators} evaluated
                  </span>
                  {isCompleted && <span className="badge pass">Evaluated</span>}
                  {isFull && <span className="badge neutral">Quota Reached</span>}
                  {isOpen && <span className="badge open">Evaluate</span>}
                </div>
              </>
            );

            if (isCompleted) {
              return (
                <li key={b._id}>
                  <Link className="row link" to={`/evaluations/${b.myEvaluationId}`}>
                    {content}
                  </Link>
                </li>
              );
            }
            if (isFull) {
              return (
                <li key={b._id}>
                  <div className="row disabled" aria-disabled="true">
                    {content}
                  </div>
                </li>
              );
            }
            return (
              <li key={b._id}>
                <Link className="row link" to={`/books/${b._id}/evaluate`}>
                  {content}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
