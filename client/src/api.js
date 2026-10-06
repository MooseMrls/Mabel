const TOKEN_KEY = 'mabel_token';
export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY));

async function request(method, path, body, { blob } = {}) {
  const res = await fetch(`/api${path}`, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    let message = 'Something went wrong';
    try { message = (await res.json()).message || message; } catch { /* ignore */ }
    if (res.status === 401 && getToken()) window.dispatchEvent(new Event('auth:expired'));
    throw new Error(message);
  }
  return blob ? res.blob() : res.json();
}

export const api = {
  get: (p) => request('GET', p),
  post: (p, b) => request('POST', p, b || {}),
  put: (p, b) => request('PUT', p, b || {}),
  blob: (p) => request('GET', p, null, { blob: true }),
};

export async function downloadPdf(evaluation) {
  const blob = await api.blob(`/evaluations/${evaluation._id}/pdf`);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${evaluation.filename || 'evaluation'}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
