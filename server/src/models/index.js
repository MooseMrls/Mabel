import mongoose from 'mongoose';
const { Schema } = mongoose;

const userSchema = new Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, lowercase: true, trim: true, unique: true, sparse: true },
  uniqueId: { type: String, required: true, unique: true, uppercase: true, trim: true },
  role: { type: String, enum: ['evaluator', 'admin', 'superadmin'], default: 'evaluator' },
  active: { type: Boolean, default: true },
}, { timestamps: true });

const publisherSchema = new Schema({
  name: { type: String, required: true, trim: true, unique: true },
}, { timestamps: true });

const bookSchema = new Schema({
  publisher: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true, index: true },
  title: { type: String, required: true, trim: true },
  // Part 1 information (filled by admin or by the first evaluator(s))
  authors: String,
  materialType: String,
  subject: String,
  copyrightYear: Number,
  price: Number,
  pages: Number,
  gradeLevel: String,
  isSeries: Boolean,
  seriesLevel: String,
  hasTeacherManual: Boolean,
  teacherManualPages: Number,
}, { timestamps: true });

const evaluationSchema = new Schema({
  book: { type: Schema.Types.ObjectId, ref: 'Book', required: true, index: true },
  publisher: { type: Schema.Types.ObjectId, ref: 'Publisher', required: true, index: true },
  evaluator: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  ratings: { type: Schema.Types.Mixed, required: true },
  sectionComments: { type: Schema.Types.Mixed, default: {} },
  scores: { type: Schema.Types.Mixed, required: true },
  total: { type: Number, required: true },
  average: { type: Number, required: true },
  allPassed: { type: Boolean, required: true },
  recommendation: { type: String, enum: ['RECOMMENDED', 'NOT RECOMMENDED'], required: true },
  comments: { type: String, required: true, trim: true },
  certified: { type: Boolean, required: true },
}, { timestamps: true });
evaluationSchema.index({ book: 1, evaluator: 1 }, { unique: true });

export const User = mongoose.model('User', userSchema);
export const Publisher = mongoose.model('Publisher', publisherSchema);
export const Book = mongoose.model('Book', bookSchema);
export const Evaluation = mongoose.model('Evaluation', evaluationSchema);
