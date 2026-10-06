import { Router } from 'express';
import { Book, Publisher, Evaluation } from '../models/index.js';
import { requireAuth } from '../middleware/auth.js';
import { SECTIONS, OPTIONS, RATING_VALUES, MAX_EVALUATORS_PER_BOOK } from '../config.js';
import { missingKeys, plainInfo } from '../utils/bookInfo.js';

const r = Router();
r.use(requireAuth);

r.get('/config', (req, res) => res.json({ sections: SECTIONS, options: OPTIONS, ratingValues: RATING_VALUES, maxEvaluators: MAX_EVALUATORS_PER_BOOK }));

r.get('/publishers', async (req, res) => {
  res.json({ publishers: await Publisher.find().sort({ name: 1 }) });
});

export async function booksWithCounts(filter, userId) {
  const books = await Book.find(filter).sort({ title: 1 }).lean();
  const evals = await Evaluation.find({ book: { $in: books.map((b) => b._id) } }, 'book evaluator').lean();
  return books.map((b) => {
    const mine = evals.find((e) => String(e.book) === String(b._id) && String(e.evaluator) === String(userId));
    const count = evals.filter((e) => String(e.book) === String(b._id)).length;
    return { ...b, evaluationCount: count, full: count >= MAX_EVALUATORS_PER_BOOK, myEvaluationId: mine?._id || null };
  });
}

r.get('/publishers/:id/books', async (req, res) => {
  const publisher = await Publisher.findById(req.params.id);
  if (!publisher) return res.status(404).json({ message: 'Publisher not found' });
  res.json({ publisher, books: await booksWithCounts({ publisher: publisher._id }, req.user._id) });
});

r.get('/books/:id', async (req, res) => {
  const book = await Book.findById(req.params.id).populate('publisher');
  if (!book) return res.status(404).json({ message: 'Book not found' });
  const [count, mine] = await Promise.all([
    Evaluation.countDocuments({ book: book._id }),
    Evaluation.findOne({ book: book._id, evaluator: req.user._id }, '_id'),
  ]);
  res.json({
    book, evaluationCount: count, full: count >= MAX_EVALUATORS_PER_BOOK,
    myEvaluationId: mine?._id || null, info: plainInfo(book), missing: missingKeys(book),
  });
});

export default r;
