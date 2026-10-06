import 'dotenv/config';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { User } from './models/index.js';
import authRoutes from './routes/auth.js';
import catalogRoutes from './routes/catalog.js';
import evaluationRoutes from './routes/evaluations.js';
import adminRoutes from './routes/admin.js';

for (const k of ['MONGO_URI', 'JWT_SECRET']) if (!process.env[k]) { console.error(`Missing ${k} in server/.env`); process.exit(1); }

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', catalogRoutes);
app.use('/api', evaluationRoutes);
app.use('/api', (req, res) => res.status(404).json({ message: 'Not found' }));

// Serve the built client in production (npm run build at the project root)
const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../client/dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => res.sendFile(path.join(dist, 'index.html')));
}

async function seedAdmin() {
  const uniqueId = (process.env.ADMIN_ID || '').trim().toUpperCase();
  if (!uniqueId) return console.warn('ADMIN_ID is not set; no super admin was created.');
  await User.findOneAndUpdate(
    { uniqueId },
    { $set: { role: 'superadmin', active: true, name: process.env.ADMIN_NAME || 'Super Admin' } },
    { upsert: true },
  );
  console.log(`Super admin ready (ID: ${uniqueId})`);
}

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`MaBEL server on http://localhost:${port}`));

mongoose.connect(process.env.MONGO_URI, {
  serverSelectionTimeoutMS: 10000,
})
  .then(async () => {
    console.log('MongoDB connected successfully');
    await seedAdmin();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
  });

