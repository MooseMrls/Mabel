import { useEffect, useState } from 'react';
import * as XLSX from 'xlsx';
import { api } from '../api.js';
import { useAuth } from '../auth.jsx';
import { PageHead, ErrorNote } from '../components/Layout.jsx';
import { BookInfoFields, INFO_ORDER } from '../components/BookInfoFields.jsx';
import { IconBuilding, IconBook, IconPlus, IconUpload, IconDownload } from '../components/Icons.jsx';

export default function AdminCatalog() {
  const { config } = useAuth();
  const [publishers, setPublishers] = useState([]);
  const [pid, setPid] = useState('');
  const [books, setBooks] = useState([]);
  const [pubSearch, setPubSearch] = useState('');
  const [bookSearch, setBookSearch] = useState('');
  const [pubForm, setPubForm] = useState(null); // { id?, name }
  const [bookForm, setBookForm] = useState(null); // { id?, title, ...info }
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Book Excel Import state
  const [importingBooks, setImportingBooks] = useState(false);
  const [bookFile, setBookFile] = useState(null);
  const [uploadingBooks, setUploadingBooks] = useState(false);
  const [importBookResult, setImportBookResult] = useState(null);

  const loadPublishers = async () => setPublishers((await api.get('/publishers')).publishers);
  const loadBooks = async (id) => setBooks(id ? (await api.get(`/admin/publishers/${id}/books`)).books : []);
  useEffect(() => { loadPublishers().catch((e) => setError(e.message)); }, []);

  const guard = async (fn) => { setError(''); setMsg(''); try { await fn(); } catch (e) { setError(e.message); } };
  const choose = (id) => { setPid(id); setBookForm(null); setImportingBooks(false); guard(() => loadBooks(id)); };

  const downloadBookSampleTemplate = () => {
    const wsData = [
      ['Title'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Books');
    const pubName = selectedPub ? selectedPub.name.replace(/[^a-zA-Z0-9]/g, '_') : 'Publisher';
    XLSX.writeFile(wb, `${pubName}_Books_Template.xlsx`);
  };

  const handleBookFileUpload = async (e) => {
    e.preventDefault();
    if (!bookFile || !pid) return;
    setUploadingBooks(true);
    setImportBookResult(null);
    try {
      const fd = new FormData();
      fd.append('file', bookFile);
      const res = await api.upload(`/admin/publishers/${pid}/books/import-excel`, fd);
      setImportBookResult(res);
      setMsg(res.message);
      await loadBooks(pid);
    } catch (e) {
      setError(e.message);
    } finally {
      setUploadingBooks(false);
    }
  };

  const savePublisher = (e) => {
    e.preventDefault();
    guard(async () => {
      const r = pubForm.id ? await api.put(`/admin/publishers/${pubForm.id}`, { name: pubForm.name }) : await api.post('/admin/publishers', { name: pubForm.name });
      setPubForm(null); await loadPublishers();
      if (!pubForm.id) choose(r.publisher._id);
    });
  };

  const saveBook = (e) => {
    e.preventDefault();
    guard(async () => {
      const payload = { title: bookForm.title, publisher: pid };
      INFO_ORDER.forEach((k) => { payload[k] = bookForm[k] ?? ''; });
      if (bookForm.id) await api.put(`/admin/books/${bookForm.id}`, payload); else await api.post('/admin/books', payload);
      setBookForm(null); await loadBooks(pid);
    });
  };

  const editBook = (b) => setBookForm({ id: b._id, title: b.title, ...Object.fromEntries(INFO_ORDER.map((k) => [k, b[k]])) });

  const selectedPub = publishers.find((p) => p._id === pid);
  const filteredPubs = publishers.filter((p) => p.name.toLowerCase().includes(pubSearch.toLowerCase()));
  const filteredBooks = books.filter((b) =>
    b.title.toLowerCase().includes(bookSearch.toLowerCase()) ||
    (b.authors && b.authors.toLowerCase().includes(bookSearch.toLowerCase()))
  );

  return (
    <>
      <PageHead
        title="Publishers &amp; Catalog Management"
        sub="Manage publishers, textbook catalog items, and technical specifications."
      />
      <ErrorNote error={error} />

      <div className="split">
        {/* Left Column: Publishers */}
        <section className="card">
          <div className="between">
            <h2 style={{ margin: 0 }}>Publishers</h2>
            <button className="btn small primary" onClick={() => setPubForm({ name: '' })}>
              <IconPlus /> Add
            </button>
          </div>

          {pubForm && (
            <form onSubmit={savePublisher} className="inlineform" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
              <div style={{ fontWeight: 600, fontSize: '12.5px', marginBottom: '4px' }}>
                {pubForm.id ? 'Edit Publisher' : 'New Publisher'}
              </div>
              <input
                autoFocus
                value={pubForm.name}
                onChange={(e) => setPubForm({ ...pubForm, name: e.target.value })}
                placeholder="Enter publisher name"
                required
              />
              <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', marginTop: '6px' }}>
                <button type="button" className="btn ghost small" onClick={() => setPubForm(null)}>Cancel</button>
                <button className="btn primary small">Save</button>
              </div>
            </form>
          )}

          {publishers.length > 5 && (
            <div style={{ marginBottom: '12px' }}>
              <input
                type="text"
                placeholder="Search publishers..."
                value={pubSearch}
                onChange={(e) => setPubSearch(e.target.value)}
                style={{ padding: '6px 10px', fontSize: '13px' }}
              />
            </div>
          )}

          <ul className="plain">
            {filteredPubs.map((p) => (
              <li key={p._id} className={p._id === pid ? 'sel' : ''}>
                <button className="linkbtn" onClick={() => choose(p._id)} style={{ flex: 1, padding: '4px 0' }}>
                  {p.name}
                </button>
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button className="btn info small" onClick={() => setPubForm({ id: p._id, name: p.name })}>
                    Edit
                  </button>
                  <button
                    className="btn danger small"
                    onClick={() => guard(async () => {
                      if (window.confirm(`Delete publisher "${p.name}" and its books?`)) {
                        await api.delete(`/admin/publishers/${p._id}`);
                        if (pid === p._id) setPid('');
                        await loadPublishers();
                      }
                    })}
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
            {filteredPubs.length === 0 && (
              <li className="muted small center">No publishers found.</li>
            )}
          </ul>
        </section>

        {/* Right Column: Books */}
        <section className="card">
          {!pid ? (
            <div className="center pad">
              <p className="muted">Please select a publisher from the left panel to manage its textbooks.</p>
            </div>
          ) : (
            <>
              <div className="between">
                <div>
                  <h2 style={{ margin: 0 }}>{selectedPub?.name} Books</h2>
                  <p className="muted small" style={{ margin: '2px 0 0' }}>{books.length} textbook(s) registered</p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button className="btn secondary small" onClick={() => { setImportingBooks(true); setImportBookResult(null); setBookFile(null); }}>
                    <IconUpload /> Import Excel
                  </button>
                  <button className="btn small primary" onClick={() => setBookForm({ title: '' })}>
                    <IconPlus /> Add Textbook
                  </button>
                </div>
              </div>

              <ErrorNote error={msg} type="success" />

              {importingBooks && (
                <div className="card" style={{ marginTop: '16px', marginBottom: '16px', borderLeft: '4px solid #10b981' }}>
                  <div className="between">
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <IconUpload /> Import Books for {selectedPub?.name}
                    </h3>
                    <button type="button" className="btn ghost small" onClick={() => setImportingBooks(false)}>Cancel</button>
                  </div>
                  <p className="muted" style={{ fontSize: '13px', margin: '8px 0 16px' }}>
                    Upload an Excel file (.xlsx or .xls).
                  </p>

                  <form onSubmit={handleBookFileUpload} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                      <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={(e) => setBookFile(e.target.files[0] || null)}
                        required
                        style={{ flex: 1, minWidth: '220px' }}
                      />
                      <button className="btn primary small" type="submit" disabled={uploadingBooks || !bookFile}>
                        {uploadingBooks ? 'Processing...' : 'Upload & Import'}
                      </button>
                      <button type="button" className="btn ghost small" onClick={downloadBookSampleTemplate}>
                        <IconDownload />Template
                      </button>
                    </div>
                  </form>

                  {importBookResult && (
                    <div style={{ marginTop: '14px', background: '#f8fafc', padding: '12px', borderRadius: '6px', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{importBookResult.message}</div>
                      {importBookResult.errors && importBookResult.errors.length > 0 && (
                        <div style={{ marginTop: '8px', color: '#dc2626' }}>
                          <strong>Warnings / Skipped Rows:</strong>
                          <ul style={{ margin: '4px 0 0 18px', padding: 0 }}>
                            {importBookResult.errors.map((err, idx) => (
                              <li key={idx}>{err}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {bookForm && (
                <form onSubmit={saveBook} className="subcard">
                  <div className="between">
                    <h3 style={{ margin: 0 }}>{bookForm.id ? 'Edit Textbook Information' : 'Register New Textbook'}</h3>
                    <button type="button" className="btn ghost small" onClick={() => setBookForm(null)}>Cancel</button>
                  </div>
                  <div className="field" style={{ marginTop: '12px' }}>
                    <label className="label">Textbook Title <span className="req">*</span></label>
                    <input
                      value={bookForm.title}
                      onChange={(e) => setBookForm({ ...bookForm, title: e.target.value })}
                      placeholder="Enter book title"
                      required
                    />
                  </div>
                  <p className="muted small" style={{ marginTop: '10px' }}>
                    Note: Blank bibliographic details will be collected from evaluators during Part 1 evaluation.
                  </p>
                  <BookInfoFields book={{}} draft={bookForm} onChange={(d) => setBookForm({ ...bookForm, ...d })} mode="all" options={config.options} />
                  <div className="actions end">
                    <button type="button" className="btn ghost" onClick={() => setBookForm(null)}>Cancel</button>
                    <button className="btn primary">Save Textbook</button>
                  </div>
                </form>
              )}

              {books.length > 4 && (
                <div style={{ marginBottom: '14px', maxWidth: '320px' }}>
                  <input
                    type="text"
                    placeholder="Search books..."
                    value={bookSearch}
                    onChange={(e) => setBookSearch(e.target.value)}
                    style={{ padding: '7px 12px', fontSize: '13.5px' }}
                  />
                </div>
              )}

              {books.length === 0 ? (
                <div className="card-subtle center pad" style={{ border: '1px dashed var(--border)', borderRadius: '8px' }}>
                  <p className="muted">No textbooks registered for this publisher yet.</p>
                  <button className="btn small primary" onClick={() => setBookForm({ title: '' })}>Add the first textbook</button>
                </div>
              ) : filteredBooks.length === 0 ? (
                <p className="muted center pad">No textbooks match "{bookSearch}".</p>
              ) : (
                <ul className="plain">
                  {filteredBooks.map((b) => (
                    <li key={b._id} style={{ padding: '12px 16px' }}>
                      <div>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '14.5px' }}>{b.title}</div>
                        <div className="muted small" style={{ marginTop: '2px' }}>
                          {b.authors || 'Author not set'} &bull; {b.evaluationCount} / {config.maxEvaluators} evaluations completed
                        </div>
                      </div>
                      <div className="actions">
                        <button className="btn info small" onClick={() => editBook(b)}>Edit</button>
                        <button
                          className="btn danger small"
                          onClick={() => guard(async () => {
                            if (window.confirm(`Delete textbook "${b.title}"?`)) {
                              await api.delete(`/admin/books/${b._id}`);
                              await loadBooks(pid);
                            }
                          })}
                        >
                          Delete
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </>
  );
}
