import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { BookInfoFields, INFO_LABELS, INFO_ORDER, formatInfo, isEmpty, visibleKeys } from '../components/BookInfoFields.jsx';
import { IconBack, IconCheck } from '../components/Icons.jsx';

export default function Evaluate() {
  const { bid } = useParams();
  const { config } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState(null);
  const [step, setStep] = useState(null);
  const [draft, setDraft] = useState({});
  const [ratings, setRatings] = useState({});
  const [sectionComments, setSectionComments] = useState({});
  const [recommendation, setRecommendation] = useState('');
  const [comments, setComments] = useState('');
  const [certified, setCertified] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get(`/books/${bid}`).then((d) => {
      setData(d);
      setStep(visibleKeys(d.book, {}, 'missing').length ? 1 : 2);
    }).catch((e) => setError(e.message));
  }, [bid]);

  const sectionStats = useMemo(() => {
    if (!config?.sections) return {};
    return Object.fromEntries(config.sections.map((s) => {
      const vals = s.items.map((i) => ratings[i.id]);
      const done = vals.every(Boolean);
      const score = vals.reduce((a, v) => a + (v || 0), 0);
      return [s.key, { score, done, passed: done && score >= s.passScore }];
    }));
  }, [ratings, config]);

  const totalItems = config?.sections?.reduce((a, s) => a + s.items.length, 0) || 0;
  const total = Object.values(sectionStats).reduce((a, s) => a + s.score, 0);
  const maxTotal = config?.sections?.reduce((a, s) => a + s.max, 0) || 0;
  const allRated = Object.values(sectionStats).length > 0 && Object.values(sectionStats).every((s) => s.done);
  const anyFailed = Object.values(sectionStats).some((s) => s.done && !s.passed);

  if (error && !data) return <><PageHead title="Evaluation" /><ErrorNote error={error} /></>;
  if (!data) return <p className="muted pad center">Loading evaluation form...</p>;
  const { book } = data;
  const back = <Link to={`/publishers/${book.publisher._id}`} className="btn ghost"><IconBack /> Back to Books</Link>;

  if (data.myEvaluationId || data.full) {
    return (
      <>
        <PageHead title={book.title}>{back}</PageHead>
        <ErrorNote error={data.myEvaluationId
          ? 'You have already evaluated this textbook. You can review your submission from My Evaluations.'
          : 'This textbook already has reached the maximum number of evaluations.'} type="warning" />
      </>
    );
  }

  const nextFromInfo = () => {
    const missing = visibleKeys(book, draft, 'missing').filter((k) => isEmpty({ ...book, ...draft }[k]));
    if (missing.length) return setError(`Please complete required field(s): ${missing.map((k) => INFO_LABELS[k]).join(', ')}`);
    setError(''); setStep(2); window.scrollTo(0, 0);
  };

  const submit = async () => {
    setError('');
    if (!allRated) return setError('Please rate every criterion item across all sections.');
    if (!recommendation) return setError('Please select a final recommendation.');
    if (!comments.trim()) return setError('Please provide your evaluative comments.');
    if (!certified) return setError('Please certify that this evaluation is your own.');
    setBusy(true);
    try {
      const r = await api.post(`/books/${bid}/evaluations`, {
        info: draft,
        ratings,
        sectionComments,
        recommendation,
        comments,
        certified
      });
      nav(`/evaluations/${r.id}`, { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  };

  const known = INFO_ORDER.filter((k) => !isEmpty(book[k]));
  const hasMissingInfo = visibleKeys(book, {}, 'missing').length > 0;

  return (
    <>
      <PageHead
        title={book.title}
        sub={`${book.publisher.name}  \u2022  Textbook Evaluation Form`}
      >
        {back}
      </PageHead>

      {/* Stepper Header if Step 1 was required */}
      {hasMissingInfo && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '14px'
        }}>
          <div style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor: step === 1 ? 'var(--card-muted)' : 'var(--card-subtle)',
            color: step === 1 ? 'var(--text-main)' : 'var(--text-muted)',
            border: `1px solid ${step === 1 ? 'var(--border-strong)' : 'var(--border)'}`
          }}>
            1. Material Information {step === 2 && '\u2713'}
          </div>
          <div style={{
            padding: '6px 14px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 700,
            backgroundColor: step === 2 ? 'var(--card-muted)' : 'var(--card-subtle)',
            color: step === 2 ? 'var(--text-main)' : 'var(--text-muted)',
            border: `1px solid ${step === 2 ? 'var(--border-strong)' : 'var(--border)'}`
          }}>
            2. Criteria Evaluation
          </div>
        </div>
      )}

      {known.length > 0 && (
        <details className="card known" open={step === 1}>
          <summary>Textbook information on record ({known.length} fields)</summary>
          <dl className="kv">
            {known.map((k) => (
              <div key={k}>
                <dt>{INFO_LABELS[k].replace('If yes, ', '').replace('If yes,', '')}</dt>
                <dd>{formatInfo(k, book[k])}</dd>
              </div>
            ))}
          </dl>
        </details>
      )}

      {step === 1 && (
        <section className="card">
          <h2 className="bar">Part 1: Information Regarding the Material to be Evaluated</h2>
          <p className="muted small">
            Please fill in the missing bibliographic and technical specifications for this textbook before proceeding to evaluation.
          </p>
          <BookInfoFields book={book} draft={draft} onChange={setDraft} mode="missing" options={config.options} />
          <ErrorNote error={error} />
          <div className="actions end">
            <button className="btn primary" onClick={nextFromInfo}>
              Continue to Evaluation Criteria &rarr;
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <>
          {config.sections.map((s) => {
            const st = sectionStats[s.key] || { score: 0, done: false, passed: false };
            return (
              <section className="card" key={s.key}>
                <div className="between" style={{ marginBottom: '14px' }}>
                  <h2 style={{ margin: 0 }}>{s.key}. {s.title}</h2>
                  {st.done ? (
                    <span className={`badge ${st.passed ? 'pass' : 'fail'}`}>
                      {st.passed ? 'Section Passed' : 'Section Failed'} ({st.score}/{s.max})
                    </span>
                  ) : (
                    <span className="badge open">In Progress</span>
                  )}
                </div>

                <div className="scroll">
                  <table className="matrix">
                    <thead>
                      <tr>
                        <th>Criteria</th>
                        {config.ratingValues.map((v) => (
                          <th key={v} className="num">{v}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {s.items.map((it) => (
                        <tr key={it.id}>
                          <td><span className="ilabel">{it.label}.</span> {it.text}</td>
                          {config.ratingValues.map((v) => (
                            <td key={v} className="num">
                              <input
                                type="radio"
                                name={it.id}
                                aria-label={`${it.label} rating ${v}`}
                                checked={ratings[it.id] === v}
                                onChange={() => setRatings({ ...ratings, [it.id]: v })}
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="scorebox">
                  <div>
                    <span className="muted small">Section Score (Minimum pass threshold: {s.passScore} / {s.max})</span>
                    <strong className="big">{st.score} / {s.max}</strong>
                  </div>
                  {st.done ? (
                    <span className={`badge ${st.passed ? 'pass' : 'fail'}`}>
                      {st.passed ? 'Passed' : 'Below Threshold'}
                    </span>
                  ) : (
                    <span className="badge open">Needs Ratings</span>
                  )}
                </div>

                <label className="label" htmlFor={`c-${s.key}`}>Section Notes / Comments (Optional)</label>
                <textarea
                  id={`c-${s.key}`}
                  rows={2}
                  placeholder={`Specific remarks for ${s.title.toLowerCase()}...`}
                  value={sectionComments[s.key] || ''}
                  onChange={(e) => setSectionComments({ ...sectionComments, [s.key]: e.target.value })}
                />
              </section>
            );
          })}

          <section className="card">
            <h2 className="bar">Overall Summary &amp; Final Recommendation</h2>
            <div className="summary">
              <div>
                <span className="muted small">Total Cumulative Score</span>
                <strong className="big">{total} / {maxTotal}</strong>
              </div>
              <div>
                <span className="muted small">Overall Average Rating</span>
                <strong className="big">{(allRated ? total / totalItems : 0).toFixed(2)}</strong>
              </div>
            </div>

            <label className="label">
              Based on the foregoing evaluation, this material is: <span className="req">*</span>
            </label>
            <div className="choices">
              {config.options.recommendations.map((o) => (
                <label key={o} className="choice">
                  <input
                    type="radio"
                    name="rec"
                    checked={recommendation === o}
                    onChange={() => setRecommendation(o)}
                  />
                  {o}
                </label>
              ))}
            </div>

            {anyFailed && (
              <ErrorNote error="Note: A textbook that failed at least one of the six main criteria is rendered Not Recommended under MaPSA guidelines." type="warning" />
            )}

            <div style={{ marginTop: '18px' }}>
              <label className="label" htmlFor="comments">
                Comprehensive Evaluator Comments &amp; Justification <span className="req">*</span>
              </label>
              <textarea
                id="comments"
                rows={4}
                placeholder="State your comprehensive findings, strengths, areas for improvement, and reasoning..."
                value={comments}
                onChange={(e) => setComments(e.target.value)}
              />
            </div>

            <label className="choice certify">
              <input
                type="checkbox"
                checked={certified}
                onChange={(e) => setCertified(e.target.checked)}
              />
              <span>I hereby certify that this evaluation report and recommendation is my own professional assessment and is free from any undue influence.</span>
            </label>

            <ErrorNote error={error} />

            <div className="actions end">
              {hasMissingInfo && (
                <button type="button" className="btn ghost" onClick={() => setStep(1)}>
                  &larr; Back to Information
                </button>
              )}
              <button
                className="btn primary"
                disabled={busy}
                onClick={submit}
              >
                {busy ? 'Submitting Evaluation...' : 'Submit Evaluation Report'}
              </button>
            </div>
          </section>
        </>
      )}
    </>
  );
}
