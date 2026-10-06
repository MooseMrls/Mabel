import { Router } from 'express';
import { Book, Evaluation } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { scoreEvaluation, SECTIONS, OPTIONS, MAX_EVALUATORS_PER_BOOK } from '../config.js';
import { INFO_KEYS, applies, cleanInfo, isEmpty, missingKeys, plainInfo } from '../utils/bookInfo.js';
import { streamReport } from '../utils/pdf.js';
import { fillDocxTemplate } from '../utils/docxGenerator.js';
import { reportFilename } from '../utils/filename.js';

const r = Router();
r.use(requireAuth);

const populate = (q) => q
  .populate({ path: 'book', populate: { path: 'publisher' } })
  .populate('evaluator', 'name uniqueId email');

r.post('/books/:id/evaluations', async (req, res) => {
  if (req.user.role !== 'evaluator') return res.status(403).json({ message: 'Only evaluators can submit evaluations' });
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ message: 'Book not found' });
    if (await Evaluation.exists({ book: book._id, evaluator: req.user._id })) return res.status(409).json({ message: 'You have already evaluated this book' });
    if (await Evaluation.countDocuments({ book: book._id }) >= MAX_EVALUATORS_PER_BOOK) return res.status(409).json({ message: 'This book already has the maximum number of evaluations' });

    // Part 1: only fill what is still empty on the book; never overwrite.
    const given = cleanInfo(req.body.info || {});
    const current = book.toObject();
    const merged = { ...current };
    for (const k of INFO_KEYS) if (isEmpty(current[k]) && given[k] !== undefined) merged[k] = given[k];
    const stillMissing = missingKeys(merged);
    if (stillMissing.length) return res.status(400).json({ message: `Please complete the book information: ${stillMissing.join(', ')}` });

    // Part 2: scores are always computed on the server.
    const result = scoreEvaluation(req.body.ratings);
    if (!result.complete) return res.status(400).json({ message: 'Please rate every item' });
    const { recommendation, comments, certified } = req.body;
    if (!OPTIONS.recommendations.includes(recommendation)) return res.status(400).json({ message: 'Choose a recommendation' });
    if (!String(comments || '').trim()) return res.status(400).json({ message: 'Comments are required' });
    if (certified !== true) return res.status(400).json({ message: 'You must certify the evaluation' });

    const sectionComments = {};
    for (const s of SECTIONS) sectionComments[s.key] = String(req.body.sectionComments?.[s.key] || '').trim().slice(0, 2000);

    const ev = await Evaluation.create({
      book: book._id, publisher: book.publisher, evaluator: req.user._id,
      ratings: req.body.ratings, sectionComments, scores: result.sections, total: result.total,
      average: result.average, allPassed: result.allPassed, recommendation,
      comments: String(comments).trim().slice(0, 4000), certified: true,
    });

    // Concurrency guard: only the first N evaluations (by creation order) count.
    const first = await Evaluation.find({ book: book._id }, '_id').sort({ _id: 1 }).limit(MAX_EVALUATORS_PER_BOOK);
    if (!first.some((e) => String(e._id) === String(ev._id))) {
      await ev.deleteOne();
      return res.status(409).json({ message: 'This book already has the maximum number of evaluations' });
    }

    for (const k of INFO_KEYS) {
      if (isEmpty(current[k]) && given[k] !== undefined && applies(k, merged)) {
        await Book.updateOne({ _id: book._id }, { $set: { [k]: given[k] } });
      }
    }
    res.status(201).json({ id: ev._id });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ message: 'You have already evaluated this book' });
    if (/^Invalid value/.test(e.message)) return res.status(400).json({ message: e.message });
    console.error(e);
    res.status(500).json({ message: 'Could not save the evaluation' });
  }
});

r.get('/evaluations/mine', async (req, res) => {
  const list = await populate(Evaluation.find({ evaluator: req.user._id }).sort({ createdAt: -1 }));
  res.json({ evaluations: list.map((e) => ({
    _id: e._id, createdAt: e.createdAt, book: e.book.title, publisher: e.book.publisher?.name,
    total: e.total, average: e.average, recommendation: e.recommendation,
  })) });
});

async function loadAllowed(req, res) {
  const ev = await populate(Evaluation.findById(req.params.id));
  if (!ev) { res.status(404).json({ message: 'Evaluation not found' }); return null; }
  if (!['admin', 'superadmin'].includes(req.user.role) && String(ev.evaluator._id) !== String(req.user._id)) { res.status(403).json({ message: 'Not allowed' }); return null; }
  return ev;
}

r.get('/evaluations/:id', async (req, res) => {
  const ev = await loadAllowed(req, res);
  if (ev) res.json({ evaluation: { ...ev.toObject(), filename: reportFilename(ev) } });
});

r.get('/evaluations/:id/pdf', async (req, res) => {
  const ev = await loadAllowed(req, res);
  if (!ev) return;
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${reportFilename(ev)}.pdf"`);
  streamReport(ev, res);
});

export default r;
