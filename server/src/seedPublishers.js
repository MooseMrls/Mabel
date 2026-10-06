import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Publisher } from './models/index.js';

dotenv.config();

const publishersList = [
  "Amari Publishing",
  "Abiva Publishing House Inc.",
  "Brilliant Creations Publishing, Inc.",
  "C&E Publishing, Inc.",
  "Dane Publishing House, Inc.",
  "Diwa Learning Systems, Inc.",
  "ENCAZA PUBLICATIONS COMPANY",
  "EPHESIANS PUBLISHING INC.",
  "FNB EDUCATIONAL, INC.",
  "Golden Cronica Publishing, Inc.",
  "Ibon Foundation",
  "iBook Publishing Inc.",
  "INNOVATIVE EDUCATIONAL MATERIALS, INC.",
  "INSTRUCTIONAL COVERAGE SYSTEM (ICS) PUBLISHING, INC.",
  "Jo-Es Publishing House",
  "Johnny and Hansel Publication",
  "AVINYA, Inc.",
  "PLATINUM PUBLICATIONS",
  "Phoenix Publishing House, Inc.",
  "Quipper Philippines, Inc",
  "Rex Book Store Inc.",
  "Sibs Publishing",
  "St. Augustine Publications Inc",
  "ST. BERNADETTE PUBLISHING HOUSE CORPORATION",
  "SUNSHINE INTERLINKS PUBLISHING HOUSE, INC.",
  "Techfactors Inc.",
  "The Inteligente Publishing, Inc.",
  "The Library Publishing House, Inc.",
  "THE BOOKMARK, INC.",
  "Vibal Group"
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    let inserted = 0;
    let skipped = 0;

    for (const name of publishersList) {
      const trimmedName = name.trim();
      const existing = await Publisher.findOne({ name: trimmedName });
      if (!existing) {
        await Publisher.create({ name: trimmedName });
        inserted++;
        console.log(`Inserted: ${trimmedName}`);
      } else {
        skipped++;
        console.log(`Skipped (already exists): ${trimmedName}`);
      }
    }

    console.log(`\nSeeding completed! Inserted: ${inserted}, Skipped: ${skipped}`);
  } catch (err) {
    console.error('Error seeding publishers:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
