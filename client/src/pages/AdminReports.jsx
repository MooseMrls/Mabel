import { useEffect, useState } from 'react';
import { api } from '../api.js';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { EvaluationTable } from './MyEvaluations.jsx';

export default function AdminReports() {
  const [publishers, setPublishers] = useState([]);
  const [pub, setPub] = useState('');
  const [evaluators, setEvaluators] = useState(null);
  const [evaluator, setEvaluator] = useState('');
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/publishers')
      .then((r) => setPublishers(r.publishers))
      .catch((e) => setError(e.message));
  }, []);

  const pickPublisher = async (id) => {
    setPub(id);
    setEvaluator('');
    setRows(null);
    setEvaluators(null);
    setError('');
    if (!id) return;
    try {
      const res = await api.get(`/admin/publishers/${id}/evaluators`);
      setEvaluators(res.evaluators);
    } catch (e) {
      setError(e.message);
    }
  };

  const pickEvaluator = async (id) => {
    setEvaluator(id);
    setRows(null);
    setError('');
    if (!id) return;
    try {
      const res = await api.get(`/admin/evaluations?publisher=${pub}&evaluator=${id}`);
      setRows(res.evaluations);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <>
      <PageHead
        title="Evaluations &amp; Reports Directory"
        sub="Filter by publisher and evaluator to review and download official evaluation reports."
      />
      <ErrorNote error={error} />

      <div className="card">
        <h2 style={{ fontSize: '15px', marginBottom: '14px' }}>Filter Evaluations</h2>
        <div className="two">
          <div>
            <label className="label" htmlFor="pub">1. Select Publisher</label>
            <select id="pub" value={pub} onChange={(e) => pickPublisher(e.target.value)}>
              <option value="">Choose a publisher...</option>
              {publishers.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ev">2. Select Evaluator</label>
            <select
              id="ev"
              value={evaluator}
              disabled={!evaluators}
              onChange={(e) => pickEvaluator(e.target.value)}
            >
              <option value="">
                {!pub
                  ? 'First select a publisher above'
                  : evaluators && evaluators.length === 0
                  ? 'No evaluations found for this publisher'
                  : 'Choose an evaluator...'}
              </option>
              {(evaluators || []).map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.count} {u.count === 1 ? 'evaluation' : 'evaluations'})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {rows && (
        <section className="card">
          <div className="between" style={{ marginBottom: '16px' }}>
            <h2 style={{ margin: 0 }}>Matching Evaluations ({rows.length})</h2>
          </div>
          <EvaluationTable rows={rows} base="/admin/evaluations" />
        </section>
      )}
    </>
  );
}
