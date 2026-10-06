export const INFO_KEYS = ['authors', 'materialType', 'subject', 'copyrightYear', 'price', 'pages',
  'gradeLevel', 'isSeries', 'seriesLevel', 'hasTeacherManual', 'teacherManualPages'];
const NUMBERS = ['copyrightYear', 'price', 'pages', 'teacherManualPages'];
const BOOLEANS = ['isSeries', 'hasTeacherManual'];

export const isEmpty = (v) => v === undefined || v === null || (typeof v === 'string' && v.trim() === '');

/** Conditional fields only apply when their parent answer is "Yes". */
export function applies(key, m) {
  if (key === 'seriesLevel') return m.isSeries === true;
  if (key === 'teacherManualPages') return m.hasTeacherManual === true;
  return true;
}

export const missingKeys = (book) => INFO_KEYS.filter((k) => isEmpty(book[k]) && applies(k, book));

/** Coerces raw input. Keys present but blank come back as undefined (meaning "unset"). */
export function cleanInfo(raw = {}) {
  const out = {};
  for (const k of INFO_KEYS) {
    if (!(k in raw)) continue;
    let v = raw[k];
    if (isEmpty(v)) { out[k] = undefined; continue; }
    if (NUMBERS.includes(k)) {
      v = Number(v);
      if (!Number.isFinite(v) || v < 0) throw new Error(`Invalid value for ${k}`);
    } else if (BOOLEANS.includes(k)) {
      if (v === 'true' || v === 'yes' || v === 'Yes' || v === 1 || v === '1') v = true;
      else if (v === 'false' || v === 'no' || v === 'No' || v === 0 || v === '0') v = false;
      if (typeof v !== 'boolean') throw new Error(`Invalid value for ${k}`);
    } else {
      v = String(v).trim().slice(0, 300);
    }
    out[k] = v;
  }
  return out;
}

export const plainInfo = (book) => Object.fromEntries(INFO_KEYS.map((k) => [k, book[k]]));
