import 'dotenv/config';
import mongoose from 'mongoose';
import { User, Publisher, Book, Evaluation } from './models/index.js';
import { ALL_ITEM_IDS, SECTIONS } from './config.js';

if (!process.env.MONGO_URI) {
  console.error('Missing MONGO_URI');
  process.exit(1);
}

await mongoose.connect(process.env.MONGO_URI);
console.log('Connected to MongoDB');

// Create Publishers
const pubNames = [
  'Rex Book Store',
  'Vibal Group Inc.',
  'Phoenix Publishing House',
  'Abiva Publishing House',
  'St. Augustine Publications'
];

const publishers = [];
for (const name of pubNames) {
  let pub = await Publisher.findOne({ name });
  if (!pub) {
    pub = await Publisher.create({ name });
  }
  publishers.push(pub);
}
console.log(`Ensured ${publishers.length} sample publishers.`);

// Create Books
const bookSamples = [
  { title: 'Sining at Kasanayan sa Filipino 1', subject: 'Filipino', gradeLevel: '1', price: 450, pages: 210, materialType: 'WT-Worktext', authors: 'Maria Santos', copyrightYear: 2024 },
  { title: 'Exploring Life Through Science 7', subject: 'Science', gradeLevel: '7', price: 620, pages: 320, materialType: 'TB-Textbook', authors: 'Dr. Juan Dela Cruz', copyrightYear: 2023 },
  { title: 'Next Century Mathematics 10', subject: 'Mathematics', gradeLevel: '10', price: 580, pages: 280, materialType: 'TB-Textbook', authors: 'Ana Reyes', copyrightYear: 2024 },
  { title: 'World History and Civilizations 9', subject: 'Araling Panlipunan', gradeLevel: '9', price: 510, pages: 260, materialType: 'TB-Textbook', authors: 'Pedro Penduko', copyrightYear: 2022 },
  { title: 'Living in the IT Era 11', subject: 'ICT', gradeLevel: '11', price: 490, pages: 200, materialType: 'Module', authors: 'Liza Soberano', copyrightYear: 2024 }
];

const books = [];
for (let i = 0; i < bookSamples.length; i++) {
  const sample = bookSamples[i];
  const pub = publishers[i % publishers.length];
  let b = await Book.findOne({ title: sample.title, publisher: pub._id });
  if (!b) {
    b = await Book.create({
      ...sample,
      publisher: pub._id,
      isSeries: true,
      seriesLevel: sample.gradeLevel <= '6' ? 'Grade School 1-6' : 'Junior High School (7-10)',
      hasTeacherManual: true,
      teacherManualPages: 45
    });
  }
  books.push(b);
}
console.log(`Ensured ${books.length} sample books.`);

// Create Evaluators (30 evaluators for stress testing)
const evaluators = [];
for (let i = 1; i <= 30; i++) {
  const uniqueId = `EVAL${String(i).padStart(3, '0')}`; // EVAL001, EVAL002...
  let user = await User.findOne({ uniqueId });
  if (!user) {
    user = await User.create({
      name: `Evaluator ${i}`,
      email: `evaluator${i}@mapsa-test.ph`,
      uniqueId,
      role: 'evaluator',
      active: true
    });
  }
  evaluators.push(user);
}
console.log(`Ensured ${evaluators.length} evaluators.`);

// Generate a few sample evaluations
let evalCount = 0;
for (const b of books) {
  for (let i = 0; i < 2; i++) {
    const evaluator = evaluators[evalCount % evaluators.length];
    const exists = await Evaluation.exists({ book: b._id, evaluator: evaluator._id });
    if (!exists) {
      const ratings = {};
      ALL_ITEM_IDS.forEach(id => { ratings[id] = Math.floor(Math.random() * 2) + 4; });
      const sectionComments = {};
      SECTIONS.forEach(s => { sectionComments[s.key] = `Good quality for section ${s.title}`; });

      await Evaluation.create({
        book: b._id,
        publisher: b.publisher,
        evaluator: evaluator._id,
        ratings,
        sectionComments,
        scores: { A: { score: 10, max: 10, passScore: 6, passed: true } },
        total: 130,
        average: 4.64,
        allPassed: true,
        recommendation: 'RECOMMENDED',
        comments: 'Overall an excellent textbook aligned with MAPSA standards.',
        certified: true
      });
      evalCount++;
    }
  }
}

console.log(`Seed completed successfully! Total created evaluations: ${evalCount}`);
await mongoose.disconnect();
process.exit(0);
