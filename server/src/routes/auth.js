import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { User } from '../models/index.js';
import { createUserWithId } from '../utils/id.js';
import { sendUniqueId } from '../utils/mailer.js';
import { signToken, requireAuth, publicUser } from '../middleware/auth.js';

const r = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 30, message: { message: 'Too many attempts. Try again later.' } });
const registerLimiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, message: { message: 'Too many attempts. Try again later.' } });

r.post('/login', loginLimiter, async (req, res) => {
  const uniqueId = String(req.body.uniqueId || '').trim().toUpperCase();
  const user = uniqueId && await User.findOne({ uniqueId, active: true });
  if (!user) return res.status(401).json({ message: 'ID not found' });
  res.json({ token: signToken(user), user: publicUser(user) });
});

r.post('/register', registerLimiter, async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ message: 'Enter your name and a valid email' });
  const done = { message: 'Your ID has been sent to your email.' };
  try {
    const existing = await User.findOne({ email });
    if (existing) {
      if (existing.active) await sendUniqueId(existing); // resend; response is identical either way
      return res.json(done);
    }
    const user = await createUserWithId(User, { name, email });
    await sendUniqueId(user);
    res.status(201).json(done);
  } catch (e) {
    console.error('register failed:', e.message);
    res.status(502).json({ message: 'We could not send the email. Please try registering again in a moment.' });
  }
});

r.get('/me', requireAuth, (req, res) => res.json({ user: publicUser(req.user) }));

export default r;
