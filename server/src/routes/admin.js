import { Router } from 'express';
import mongoose from 'mongoose';
import multer from 'multer';
import XLSX from 'xlsx';
import { User, Publisher, Book, Evaluation } from '../models/index.js';
import { requireAuth, requireAdmin, publicUser } from '../middleware/auth.js';
import { createUserWithId } from '../utils/id.js';
import { sendUniqueId } from '../utils/mailer.js';
import { cleanInfo, INFO_KEYS } from '../utils/bookInfo.js';
import { booksWithCounts } from './catalog.js';

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const r = Router();
r.use(requireAuth, requireAdmin);

const dup = (e, res, what) => (e.code === 11000 ? res.status(409).json({ message: `${what} already exists` }) : null);
const isId = (v) => mongoose.isValidObjectId(v);

// Bulk User Import via Excel
r.post('/users/import-excel', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No Excel file provided' });
  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ message: 'Excel file is empty' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows.length) return res.status(400).json({ message: 'No rows found in Excel sheet' });

    let createdCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // header is row 1

      // Find field names case-insensitively
      const findVal = (keys) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(k.trim().toLowerCase())) return String(row[k]).trim();
        }
        return '';
      };

      const name = findVal(['name', 'full name', 'fullname']);
      const email = findVal(['email', 'email address', 'emailaddress']);
      let roleRaw = findVal(['account type', 'accounttype', 'role', 'type']).toLowerCase();

      let role = 'evaluator';
      if (roleRaw.includes('super')) role = 'superadmin';
      else if (roleRaw.includes('admin')) role = 'admin';

      if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        failedCount++;
        errors.push(`Row ${rowNum}: Invalid name or email (${email || 'empty'})`);
        continue;
      }

      try {
        const user = await createUserWithId(User, { name, email, role });
        try { await sendUniqueId(user); } catch (e) { console.error(`Email send error row ${rowNum}:`, e.message); }
        createdCount++;
      } catch (e) {
        failedCount++;
        if (e.code === 11000) errors.push(`Row ${rowNum}: Email ${email} already exists`);
        else errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    res.json({
      message: `Import completed: ${createdCount} created, ${failedCount} failed.`,
      createdCount,
      failedCount,
      errors,
    });
  } catch (e) {
    res.status(400).json({ message: `Failed to process Excel file: ${e.message}` });
  }
});


// ---- Users (Evaluators & Admins)
r.get('/users', async (req, res) => {
  const query = {};
  if (req.query.role) query.role = req.query.role;
  const users = await User.find(query).sort({ role: 1, name: 1 });
  res.json({ users: users.map(publicUser) });
});

r.post('/users', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const role = ['admin', 'superadmin'].includes(req.body.role) ? req.body.role : 'evaluator';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Name and a valid email are required' });
  try {
    const user = await createUserWithId(User, { name, email, role });
    let emailed = true;
    try { await sendUniqueId(user); } catch (e) { emailed = false; console.error(e.message); }
    res.status(201).json({ user: publicUser(user), emailed });
  } catch (e) { dup(e, res, 'That email') || res.status(500).json({ message: 'Could not create user' }); }
});

r.put('/users/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (req.body.name !== undefined) user.name = String(req.body.name).trim() || user.name;
  if (req.body.email !== undefined) user.email = String(req.body.email).trim().toLowerCase() || user.email;
  if (req.body.role !== undefined && ['evaluator', 'admin', 'superadmin'].includes(req.body.role)) user.role = req.body.role;
  if (req.body.active !== undefined) user.active = !!req.body.active;
  try { await user.save(); res.json({ user: publicUser(user) }); }
  catch (e) { dup(e, res, 'That email') || res.status(500).json({ message: 'Could not update user' }); }
});

r.post('/users/:id/resend', async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  try { await sendUniqueId(user); res.json({ message: 'ID sent' }); }
  catch (e) { console.error(e.message); res.status(502).json({ message: 'Email could not be sent' }); }
});

r.delete('/users/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  if (String(req.params.id) === String(req.user._id)) return res.status(400).json({ message: 'You cannot delete your own account' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  if (user.role === 'superadmin') return res.status(403).json({ message: 'Super Admin accounts cannot be deleted' });
  await User.deleteOne({ _id: user._id });
  res.json({ message: 'Account deleted' });
});

// ---- Publishers
r.post('/publishers', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!name) return res.status(400).json({ message: 'Name is required' });
  try { res.status(201).json({ publisher: await Publisher.create({ name }) }); }
  catch (e) { dup(e, res, 'Publisher') || res.status(500).json({ message: 'Could not create publisher' }); }
});

r.put('/publishers/:id', async (req, res) => {
  const name = String(req.body.name || '').trim();
  if (!isId(req.params.id) || !name) return res.status(400).json({ message: 'Name is required' });
  try {
    const p = await Publisher.findByIdAndUpdate(req.params.id, { name }, { new: true });
    p ? res.json({ publisher: p }) : res.status(404).json({ message: 'Publisher not found' });
  } catch (e) { dup(e, res, 'Publisher') || res.status(500).json({ message: 'Could not update publisher' }); }
});

r.delete('/publishers/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  await Publisher.deleteOne({ _id: req.params.id });
  await Book.deleteMany({ publisher: req.params.id });
  res.json({ message: 'Publisher deleted' });
});

// ---- Books
r.get('/publishers/:id/books', async (req, res) => {
  res.json({ books: await booksWithCounts({ publisher: req.params.id }, req.user._id) });
});

function applyBody(book, body) {
  const info = cleanInfo(body);
  for (const k of INFO_KEYS) if (k in body) book[k] = info[k];
  if (info.isSeries !== true) book.seriesLevel = undefined;
  if (info.hasTeacherManual !== true) book.teacherManualPages = undefined;
}

// Bulk Book Import via Excel for a specific Publisher
r.post('/publishers/:id/books/import-excel', upload.single('file'), async (req, res) => {
  if (!isId(req.params.id) || !(await Publisher.exists({ _id: req.params.id }))) {
    return res.status(400).json({ message: 'Valid publisher ID is required' });
  }
  if (!req.file) return res.status(400).json({ message: 'No Excel file provided' });

  try {
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ message: 'Excel file is empty' });
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: '' });

    if (!rows.length) return res.status(400).json({ message: 'No rows found in Excel sheet' });

    let createdCount = 0;
    let failedCount = 0;
    const errors = [];

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      const rowNum = index + 2; // header is row 1

      const findVal = (keys) => {
        for (const k of Object.keys(row)) {
          if (keys.includes(k.trim().toLowerCase())) return String(row[k]).trim();
        }
        return '';
      };

      const title = findVal(['title', 'book title', 'textbook title', 'book_title']);

      if (!title) {
        failedCount++;
        errors.push(`Row ${rowNum}: Missing book title`);
        continue;
      }

      try {
        await Book.create({
          title,
          publisher: req.params.id,
        });
        createdCount++;
      } catch (e) {
        failedCount++;
        errors.push(`Row ${rowNum}: ${e.message}`);
      }
    }

    res.json({
      message: `Import completed: ${createdCount} books created, ${failedCount} failed.`,
      createdCount,
      failedCount,
      errors,
    });
  } catch (e) {
    res.status(400).json({ message: `Failed to process Excel file: ${e.message}` });
  }
});

r.post('/books', async (req, res) => {
  try {
    const title = String(req.body.title || '').trim();
    if (!title || !isId(req.body.publisher) || !(await Publisher.exists({ _id: req.body.publisher }))) return res.status(400).json({ message: 'Title and publisher are required' });
    const book = new Book({ title, publisher: req.body.publisher });
    applyBody(book, req.body);
    await book.save();
    res.status(201).json({ book });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.put('/books/:id', async (req, res) => {
  try {
    const book = isId(req.params.id) && await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (req.body.title !== undefined) book.title = String(req.body.title).trim() || book.title;
    applyBody(book, req.body);
    await book.save();
    res.json({ book });
  } catch (e) { res.status(400).json({ message: e.message }); }
});

r.delete('/books/:id', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  await Book.deleteOne({ _id: req.params.id });
  res.json({ message: 'Book deleted' });
});

// ---- Reports: publisher -> evaluator -> evaluations
r.get('/publishers/:id/evaluators', async (req, res) => {
  if (!isId(req.params.id)) return res.status(400).json({ message: 'Invalid id' });
  const rows = await Evaluation.aggregate([
    { $match: { publisher: new mongoose.Types.ObjectId(req.params.id) } },
    { $group: { _id: '$evaluator', count: { $sum: 1 } } },
  ]);
  const users = await User.find({ _id: { $in: rows.map((x) => x._id) } }).sort({ name: 1 });
  res.json({ evaluators: users.map((u) => ({ ...publicUser(u), count: rows.find((x) => String(x._id) === String(u._id)).count })) });
});

r.get('/evaluations', async (req, res) => {
  const { publisher, evaluator } = req.query;
  if (!isId(publisher) || !isId(evaluator)) return res.status(400).json({ message: 'publisher and evaluator are required' });
  const list = await Evaluation.find({ publisher, evaluator }).populate('book', 'title').sort({ createdAt: -1 });
  res.json({ evaluations: list.map((e) => ({
    _id: e._id, createdAt: e.createdAt, book: e.book?.title, total: e.total, average: e.average, recommendation: e.recommendation,
  })) });
});

export default r;
