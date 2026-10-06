import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Publisher, Book } from './models/index.js';

dotenv.config();

const mockTitles = [
  "Gawa at Galing: Kasanayan para sa Kinabukasan 4",
  "Linangan Tungo sa Maginhawang Lipunan 1 TX (MAKABANSA)",
  "Linangan Tungo sa Maginhawang Lipunan 2 TX (MAKABANSA)",
  "Linangan Tungo sa Maginhawang Lipunan 3 TX (MAKABANSA)",
  "Mabuting Gawi, Dangal ng Lahi 1 TX",
  "Mabuting Gawi, Dangal ng Lahi 2 TX",
  "Mabuting Gawi, Dangal ng Lahi 3 TX",
  "Mabuting Gawi, Dangal ng Lahi 4 TX",
  "Mabuting Gawi, Dangal ng Lahi 7 TX",
  "Power Up!: Active Bodies, Healthy Lives 4 TX",
  "Power Up!: Active Bodies, Healthy Lives 5 TX",
  "Power Up!: Active Bodies, Healthy Lives 7 TX",
  "Power Up!: Active Bodies, Healthy Lives 8 TX",
  "Real World Math 1 TX",
  "Real World Math 2 TX",
  "Real World Math 3 TX",
  "Real World Math 4 TX",
  "Real World Math 5 TX",
  "Real World Math 7 TX",
  "Real World Math 8 TX",
  "Science for Futures Thinking 1 TX",
  "Science for Futures Thinking 3 TX",
  "Science for Futures Thinking 4 TX",
  "Science for Futures Thinking 5 TX",
  "Science for Futures Thinking 7 TX",
  "Science for Futures Thinking 8 TX",
  "TALAS 8 TX",
  "TALAS: Tungo sa Mapanuri at Malikhaing Pag-isip 1 (PAGBASA at LITERASI) TX",
  "TALAS: Tungo sa Mapanuri at Malikhaing Pag-isip 1 (WIKA) TX",
  "Tools for Life: Mastering Tech and Trade Skills 8",
  "TRAILS 1 (Language) TX",
  "TRAILS 1 (Reading & Literacy) TX",
  "TRAILS 3 TX",
  "TRAILS 4 TX",
  "TRAILS 5 TX",
  "TRAILS 7 TX",
  "TRAILS 8 TX"
];

async function seedBooks() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const publishers = await Publisher.find();
    if (publishers.length === 0) {
      console.log('No publishers found.');
      process.exit(1);
    }

    const docs = [];
    for (const pub of publishers) {
      for (const title of mockTitles) {
        docs.push({
          publisher: pub._id,
          title
        });
      }
    }

    // Insert all missing books in bulk using ordered: false to skip duplicates silently
    try {
      await Book.insertMany(docs, { ordered: false });
    } catch (e) {
      // Ignore duplicate key errors if any exist
    }

    console.log(`Seeding finished. Added sample books for ${publishers.length} publishers.`);
  } catch (err) {
    console.error('Error seeding books:', err);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seedBooks();
