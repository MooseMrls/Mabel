import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Book } from './models/index.js';
import { ALL_ITEM_IDS, SECTIONS } from './config.js';
import jwt from 'jsonwebtoken';

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}

const PORT = process.env.PORT || 5002;
const BASE_URL = `http://localhost:${PORT}/api`;

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB for Load Test');

// Fetch 30 evaluators created by seed
const evaluators = await User.find({ uniqueId: { $regex: /^EVAL/ } }).limit(30);
if (evaluators.length < 30) {
  console.error(`Found only ${evaluators.length} evaluators. Please run seed.js first.`);
  process.exit(1);
}

// Find a book to evaluate
const book = await Book.findOne();
if (!book) {
  console.error('No book found to evaluate. Please run seed.js first.');
  process.exit(1);
}

console.log(`Starting load test with ${evaluators.length} concurrent users evaluating book: "${book.title}"...`);

const generateRatings = () => {
  const ratings = {};
  ALL_ITEM_IDS.forEach(id => { ratings[id] = 5; });
  return ratings;
};

const generateSectionComments = () => {
  const sectionComments = {};
  SECTIONS.forEach(s => { sectionComments[s.key] = 'Load test sample comment'; });
  return sectionComments;
};

// Fire 30 requests simultaneously
const startTime = Date.now();
const results = await Promise.allSettled(
  evaluators.map(async (user, index) => {
    // Sign token directly to simulate authenticated session without triggering IP rate limiter on login
    const token = jwt.sign(
      { sub: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    const payload = {
      info: {
        authors: book.authors || 'Author',
        materialType: book.materialType || 'TB-Textbook',
        subject: book.subject || 'General',
        copyrightYear: book.copyrightYear || 2024,
        price: book.price || 500,
        pages: book.pages || 200,
        gradeLevel: book.gradeLevel || '1',
        isSeries: true,
        seriesLevel: 'Grade School 1-6',
        hasTeacherManual: true,
        teacherManualPages: 45,
      },
      ratings: generateRatings(),
      sectionComments: generateSectionComments(),
      recommendation: 'RECOMMENDED',
      comments: `Simulated stress evaluation from ${user.name}`,
      certified: true,
    };

    const res = await fetch(`${BASE_URL}/books/${book._id}/evaluations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    const status = res.status;
    const body = await res.json();
    return { user: user.name, status, body };
  })
);

const duration = Date.now() - startTime;
console.log(`\n--- Load Test Finished in ${duration}ms ---`);

let successCount = 0;
let conflictCount = 0; // expected after MAX_EVALUATORS_PER_BOOK (3) limit reached
let errorCount = 0;

results.forEach((res, i) => {
  if (res.status === 'fulfilled') {
    const { status, body } = res.value;
    if (status === 201) successCount++;
    else if (status === 409) conflictCount++;
    else {
      errorCount++;
      console.log(`User ${i + 1} unexpected response: ${status} -`, body);
    }
  } else {
    errorCount++;
    console.error(`User ${i + 1} network error:`, res.reason);
  }
});

console.log(`Successful submissions (HTTP 201): ${successCount}`);
console.log(`Safely capped limit reached (HTTP 409): ${conflictCount}`);
console.log(`System Errors (HTTP 500/Failed): ${errorCount}`);

await mongoose.disconnect();
process.exit(0);
