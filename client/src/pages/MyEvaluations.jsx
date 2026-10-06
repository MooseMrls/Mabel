import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api.js';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { IconChevron } from '../components/Icons.jsx';

export function EvaluationTable({ rows, base }) {
  const [search, setSearch] = useState('');

  if (!rows.length) {
    return (
      <div className="card center">
        <p className="muted">No evaluations found.</p>
      </div>
    );
  }

  const filtered = rows.filter((e) =>
    (e.book && e.book.toLowerCase().includes(search.toLowerCase())) ||
    (e.publisher && e.publisher.toLowerCase().includes(search.toLowerCase())) ||
    (e.recommendation && e.recommendation.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <>
      {rows.length > 5 && (
        <div style={{ marginBottom: '16px', maxWidth: '320px' }}>
          <input
            type="text"
            placeholder="Filter evaluations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      )}

      <div className="scroll">
        <table className="table">
          <thead>
            <tr>
              <th>Textbook Title</th>
              {rows[0].publisher !== undefined && <th>Publisher</th>}
              <th className="num">Score</th>
              <th className="num">Avg Rating</th>
              <th>Recommendation</th>
              <th>Date Evaluated</th>
              <th className="right">Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((e) => (
              <tr key={e._id}>
                <td style={{ fontWeight: 600 }}>{e.book}</td>
                {e.publisher !== undefined && <td className="muted">{e.publisher}</td>}
                <td className="num"><strong>{e.total}</strong></td>
                <td className="num">{e.average ? e.average.toFixed(2) : '-'}</td>
                <td>
                  {e.recommendation ? (
                    <span className={`badge ${e.recommendation === 'RECOMMENDED' ? 'pass' : 'fail'}`}>
                      {e.recommendation}
                    </span>
                  ) : (
                    <span className="badge neutral">-</span>
                  )}
                </td>
                <td className="muted">{new Date(e.createdAt).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })}</td>
                <td className="right">
                  <Link className="btn small" to={`${base}/${e._id}`}>
                    View Report &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="center muted pad">
                  No evaluations match "{search}".
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

export default function MyEvaluations() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/evaluations/mine')
      .then((r) => setRows(r.evaluations))
      .catch((e) => setError(e.message));
  }, []);

  return (
    <>
      <PageHead title="My Evaluations" sub="Review and download reports for textbooks you have evaluated." />
      <ErrorNote error={error} />
      {!rows ? <p className="muted pad center">Loading your evaluations...</p> : <EvaluationTable rows={rows} base="/evaluations" />}
    </>
  );
}
