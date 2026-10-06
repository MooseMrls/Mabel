import jwt from 'jsonwebtoken';
import { User } from '../models/index.js';

export const signToken = (user) => jwt.sign({ sub: String(user._id) }, process.env.JWT_SECRET, { expiresIn: '7d' });

export async function requireAuth(req, res, next) {
  try {
    const token = (req.headers.authorization || '').replace(/^Bearer /, '');
    const { sub } = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(sub);
    if (!user || !user.active) return res.status(401).json({ message: 'Session expired' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ message: 'Not authenticated' });
  }
}

export const requireAdmin = (req, res, next) =>
  ['admin', 'superadmin'].includes(req.user?.role) ? next() : res.status(403).json({ message: 'Admin only' });

export const publicUser = (u) => ({ id: u._id, name: u.name, email: u.email, role: u.role, uniqueId: u.uniqueId, active: u.active });
