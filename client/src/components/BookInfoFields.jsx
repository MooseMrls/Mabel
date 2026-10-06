import { useState } from 'react';

export const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
const applies = (k, m) => (k === 'seriesLevel' ? m.isSeries === true : k === 'teacherManualPages' ? m.hasTeacherManual === true : true);

export const INFO_ORDER = ['authors', 'materialType', 'subject', 'copyrightYear', 'price', 'pages', 'gradeLevel',
  'isSeries', 'seriesLevel', 'hasTeacherManual', 'teacherManualPages'];

export const INFO_LABELS = {
  authors: 'Author(s)', materialType: 'Type of Material', subject: 'Subject', copyrightYear: 'Copyright Date',
  price: 'Price', pages: 'No. of Pages', gradeLevel: 'Grade Level', isSeries: 'Is this material part of a series?',
  seriesLevel: 'If yes, please indicate the grade level', hasTeacherManual: "Is there an accompanying Teacher's Manual?",
  teacherManualPages: "If yes, number of pages (Teacher's Manual)",
};

/** Keys to show: in "missing" mode only those the book does not have yet. */
export function visibleKeys(book, draft, mode) {
  const merged = { ...book, ...draft };
  return INFO_ORDER.filter((k) => applies(k, merged) && (mode === 'all' || isEmpty(book[k])));
}

export const formatInfo = (k, v) =>
  v === true || v === 'true' || v === 'yes' || v === 'Yes' ? 'Yes' : v === false || v === 'false' || v === 'no' || v === 'No' ? 'No' : isEmpty(v) ? '-' : String(v);

function OptionOther({ name, options, value, onChange }) {
  const [other, setOther] = useState(() => !isEmpty(value) && !options.includes(value));
  return (
    <div className="choices">
      {options.map((o) => (
        <label key={o} className="choice">
          <input type="radio" name={name} checked={!other && value === o} onChange={() => { setOther(false); onChange(o); }} /> {o}
        </label>
      ))}
      <label className="choice">
        <input type="radio" name={name} checked={other} onChange={() => { setOther(true); onChange(''); }} /> Other:
        {other && <input className="inline" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="Please specify" />}
      </label>
    </div>
  );
}

const YesNo = ({ name, value, onChange }) => {
  const boolVal = value === true || value === 'true' || value === 'yes' || value === 'Yes' ? true : value === false || value === 'false' || value === 'no' || value === 'No' ? false : undefined;
  return (
    <div className="choices">
      {[['Yes', true], ['No', false]].map(([l, v]) => (
        <label key={l} className="choice"><input type="radio" name={name} checked={boolVal === v} onChange={() => onChange(v)} /> {l}</label>
      ))}
    </div>
  );
};

export function BookInfoFields({ book, draft, onChange, mode = 'missing', options }) {
  const merged = { ...book, ...draft };
  const set = (k) => (v) => onChange({ ...draft, [k]: v });
  const text = (k, type = 'text') => (
    <input type={type} min={type === 'number' ? 0 : undefined} step={k === 'price' ? '0.01' : undefined}
      value={merged[k] ?? ''} onChange={(e) => set(k)(e.target.value)} />
  );
  const input = {
    authors: () => text('authors'),
    subject: () => text('subject'),
    copyrightYear: () => text('copyrightYear', 'number'),
    price: () => text('price', 'number'),
    pages: () => text('pages', 'number'),
    teacherManualPages: () => text('teacherManualPages', 'number'),
    materialType: () => <OptionOther name="materialType" options={options.materialTypes} value={merged.materialType} onChange={set('materialType')} />,
    seriesLevel: () => <OptionOther name="seriesLevel" options={options.seriesLevels} value={merged.seriesLevel} onChange={set('seriesLevel')} />,
    gradeLevel: () => (
      <select value={merged.gradeLevel ?? ''} onChange={(e) => set('gradeLevel')(e.target.value)}>
        <option value="">Choose</option>
        {options.gradeLevels.map((g) => <option key={g}>{g}</option>)}
      </select>
    ),
    isSeries: () => <YesNo name="isSeries" value={merged.isSeries} onChange={set('isSeries')} />,
    hasTeacherManual: () => <YesNo name="hasTeacherManual" value={merged.hasTeacherManual} onChange={set('hasTeacherManual')} />,
  };
  return (
    <div className="fields">
      {visibleKeys(book, draft, mode).map((k) => (
        <div className="field" key={k}>
          <label className="label">{INFO_LABELS[k]}{mode === 'missing' && <span className="req"> *</span>}</label>
          {input[k]()}
        </div>
      ))}
    </div>
  );
}
