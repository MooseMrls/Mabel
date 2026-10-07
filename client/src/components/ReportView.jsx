import { INFO_ORDER, INFO_LABELS, formatInfo } from './BookInfoFields.jsx';

export default function ReportView({ evaluation: ev, config }) {
  const book = ev.book;
  const maxTotal = config.sections.reduce((a, s) => a + s.max, 0);
  const keys = INFO_ORDER.filter((k) => (k === 'seriesLevel' ? book.isSeries : k === 'teacherManualPages' ? book.hasTeacherManual : true));

  return (
    <article className="report">
      <header className="report-head">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2>Textbook Evaluation Report</h2>
            <p className="muted">MaPSA - Manila Ecclesiastical Province School Systems Association</p>
          </div>
          <span className={`badge ${ev.recommendation === 'RECOMMENDED' ? 'pass' : 'fail'}`} style={{ fontSize: '13px', padding: '5px 14px' }}>
            {ev.recommendation}
          </span>
        </div>

        <dl className="meta">
          <div>
            <dt>Textbook Title</dt>
            <dd style={{ fontSize: '15px' }}>{book.title}</dd>
          </div>
          <div>
            <dt>Publisher</dt>
            <dd>{book.publisher?.name || '-'}</dd>
          </div>
          <div>
            <dt>Evaluator</dt>
            <dd>{ev.evaluator?.name || '-'}</dd>
          </div>
          <div>
            <dt>Date Submitted</dt>
            <dd>{(() => {
              const d = new Date(ev.createdAt);
              const pad = (n) => String(n).padStart(2, '0');
              return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
            })()}</dd>
          </div>
        </dl>
      </header>

      <h3 className="bar">Part 1: Information Regarding the Material</h3>
      <table className="grid" style={{ marginBottom: '24px' }}>
        <tbody>
          {keys.map((k) => (
            <tr key={k}>
              <th style={{ width: '280px' }}>{INFO_LABELS[k].replace('If yes, ', '').replace('If yes,', '')}</th>
              <td>{formatInfo(k, book[k])}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h3 className="bar">Part 2: Evaluation Criteria Breakdown</h3>
      {config.sections.map((s) => {
        const sc = ev.scores[s.key] || { score: 0, max: s.max, passed: false };
        return (
          <table className="grid section" key={s.key}>
            <thead>
              <tr>
                <th colSpan={2} style={{ fontWeight: 700 }}>{s.key}. {s.title.toUpperCase()}</th>
                <th className="num" style={{ width: '120px' }}>Rating</th>
              </tr>
            </thead>
            <tbody>
              {s.items.map((it) => (
                <tr key={it.id}>
                  <td className="num" style={{ width: '50px', color: 'var(--text-muted)' }}>{it.label}</td>
                  <td>{it.text}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{ev.ratings[it.id]}</td>
                </tr>
              ))}
              <tr className="sum">
                <td colSpan={2}>
                  Section Score (Passing threshold: {s.passScore} of {s.max})
                </td>
                <td className="num">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <strong>{sc.score} / {sc.max}</strong>
                    <span className={`badge ${sc.passed ? 'pass' : 'fail'}`}>
                      {sc.passed ? 'Pass' : 'Fail'}
                    </span>
                  </div>
                </td>
              </tr>
              {ev.sectionComments?.[s.key] && (
                <tr>
                  <td colSpan={3} style={{ backgroundColor: 'var(--card-subtle)' }}>
                    <strong>Remarks: </strong>{ev.sectionComments[s.key]}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        );
      })}

      <h3 className="bar">Final Evaluation Summary</h3>
      <table className="grid" style={{ marginBottom: '20px' }}>
        <tbody>
          <tr>
            <th style={{ width: '220px' }}>Overall Total Score</th>
            <td><strong>{ev.total}</strong> / {maxTotal}</td>
          </tr>
          <tr>
            <th>Average Rating</th>
            <td><strong>{ev.average.toFixed(2)}</strong> / 5.00</td>
          </tr>
          <tr>
            <th>Final Recommendation</th>
            <td>
              <span className={`badge ${ev.recommendation === 'RECOMMENDED' ? 'pass' : 'fail'}`}>
                {ev.recommendation}
              </span>
            </td>
          </tr>
          <tr>
            <th>Evaluator Comments</th>
            <td style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>{ev.comments || 'None provided.'}</td>
          </tr>
        </tbody>
      </table>

      <div style={{
        marginTop: '24px',
        padding: '14px 18px',
        backgroundColor: 'var(--card-subtle)',
        border: '1px solid var(--border)',
        borderRadius: '6px'
      }}>
        <p className="muted small" style={{ margin: 0 }}>
          <strong>Certification:</strong> I certify that this evaluation report and recommendation is my own and is without any undue influence from others.
        </p>
      </div>
    </article>
  );
}
