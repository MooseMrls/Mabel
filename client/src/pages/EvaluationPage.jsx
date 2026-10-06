import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, downloadPdf } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import ReportView from '../components/ReportView.jsx';
import { IconBack, IconDownload } from '../components/Icons.jsx';

export default function EvaluationPage() {
  const { id } = useParams();
  const { user, config } = useAuth();
  const [ev, setEv] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/evaluations/${id}`)
      .then((r) => setEv(r.evaluation))
      .catch((e) => setError(e.message));
  }, [id]);

  const download = async () => {
    setBusy(true);
    try {
      await downloadPdf(ev);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHead title="Evaluation Report">
        <Link to={['admin', 'superadmin'].includes(user?.role) ? '/admin' : '/evaluations'} className="btn ghost">
          <IconBack /> Back
        </Link>
        {ev && (
          <button className="btn primary" disabled={busy} onClick={download}>
            <IconDownload /> {busy ? 'Generating PDF...' : 'Download Official PDF'}
          </button>
        )}
      </PageHead>
      <ErrorNote error={error} />
      {ev && config && <ReportView evaluation={ev} config={config} />}
    </>
  );
}
