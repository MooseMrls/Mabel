import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATE_PATH = path.join(__dirname, '../templates/TB_Eval_Form 2025.docx');

const yn = (v) => (v === true || v === 'true' || v === 'yes' || v === 'Yes' ? 'Yes' : v === false || v === 'false' || v === 'no' || v === 'No' ? 'No' : '');
const val = (v) => (v === undefined || v === null || v === '' ? '' : String(v));

export function fillDocxTemplate(ev) {
  const content = fs.readFileSync(TEMPLATE_PATH, 'binary');
  const zip = new PizZip(content);
  
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '<<', end: '>>' },
  });

  const book = ev.book || {};
  const ratings = ev.ratings || {};
  const scores = ev.scores || {};
  const pad = (n) => String(n).padStart(2, '0');
  const createdAt = new Date(ev.createdAt || Date.now());
  const dateStr = `${createdAt.getFullYear()}-${pad(createdAt.getMonth() + 1)}-${pad(createdAt.getDate())} ${pad(createdAt.getHours())}:${pad(createdAt.getMinutes())}:${pad(createdAt.getSeconds())}`;

  const pubName = book.publisher?.name || '';

  const getRating = (id) => (ratings[id] !== undefined && ratings[id] !== null ? String(ratings[id]) : '');
  const getSectionScore = (key) => scores[key]?.score !== undefined ? String(scores[key].score) : '';
  const getSectionPassed = (key) => scores[key]?.passed ? 'PASSED' : 'FAILED';
  const getSectionComment = (key) => val(ev.sectionComments?.[key]);

  const data = {
    'Increment': '1',
    'Timestamp': dateStr,
    "EVALUATOR'S NAME": ev.evaluator?.name || '',
    'Publishers': pubName,

    // Publishers Match
    'TITLE (Amari Publishing)': pubName.toLowerCase().includes('amari') ? book.title : '',
    'TITLE (Abiva Publishing House Inc.)': pubName.toLowerCase().includes('abiva') ? book.title : '',
    'TITLE (Brilliant Creations Publishing, Inc.)': pubName.toLowerCase().includes('brilliant') ? book.title : '',
    'TITLE (C&E Publishing, Inc.)': pubName.toLowerCase().includes('c&e') || pubName.toLowerCase().includes('c & e') ? book.title : '',
    'TITLE (Diwa Learning Systems, Inc.)': pubName.toLowerCase().includes('diwa') ? book.title : '',
    'TITLE (Ibon Foundation)': pubName.toLowerCase().includes('ibon') ? book.title : '',
    'TITLE (Dane Publishing House, Inc.)': pubName.toLowerCase().includes('dane') ? book.title : '',
    'TITLE (INNOVATIVE EDUCATIONAL MATERIALS, INC.)': pubName.toLowerCase().includes('innovative') ? book.title : '',
    'TITLE (Jo-Es Publishing House)': pubName.toLowerCase().includes('jo-es') ? book.title : '',
    'TITLE (Phoenix Publishing House, Inc.)': pubName.toLowerCase().includes('phoenix') ? book.title : '',
    'TITLE (Rex Book Store Inc.)': pubName.toLowerCase().includes('rex') ? book.title : '',
    'TITLE (Sibs Publishing House, Inc.)': pubName.toLowerCase().includes('sibs') ? book.title : '',
    'TITLE (INSTRUCTIONAL COVERAGE SYSTEM (ICS) PUBLISHING, INC.)': pubName.toLowerCase().includes('instructional') || pubName.toLowerCase().includes('ics') ? book.title : '',
    'TITLE (Golden Cronica Publishing, Inc.)': pubName.toLowerCase().includes('golden') ? book.title : '',
    'TITLE (Techfactors Inc.)': pubName.toLowerCase().includes('techfactors') ? book.title : '',
    'TITLE (The Library Publishing House, Inc.)': pubName.toLowerCase().includes('library') ? book.title : '',
    'TITLE (THE INTELIGENTE PUBLISHING, INC.)': pubName.toLowerCase().includes('inteligente') ? book.title : '',
    'TITLE (EPHESIANS PUBLISHING INC.)': pubName.toLowerCase().includes('ephesians') ? book.title : '',
    'TITLE (Quipper Philippines, Inc)': pubName.toLowerCase().includes('quipper') ? book.title : '',
    'TITLE (iBook Publishing Inc.)': pubName.toLowerCase().includes('ibook') ? book.title : '',
    'TITLE (FNB EDUCATIONAL, INC.)': pubName.toLowerCase().includes('fnb') ? book.title : '',
    'TITLE (ST. BERNADETTE PUBLISHING HOUSE CORPORATION)': pubName.toLowerCase().includes('bernadette') ? book.title : '',
    'TITLE (Johnny and Hansel Publications)': pubName.toLowerCase().includes('johnny') ? book.title : '',
    'TITLE (AVINYA, Inc.)': pubName.toLowerCase().includes('avinya') ? book.title : '',
    'TITLE (St. Augustine Publications Inc)': pubName.toLowerCase().includes('augustine') ? book.title : '',
    'TITLE (THE BOOKMARK, INC.)': pubName.toLowerCase().includes('bookmark') ? book.title : '',
    'TITLE (ENCAZA PUBLICATIONS COMPANY)': pubName.toLowerCase().includes('encaza') ? book.title : '',
    'TITLE (SUNSHINE INTERLINKS PUBLISHING HOUSE, INC.)': pubName.toLowerCase().includes('sunshine') ? book.title : '',
    'TITLE (PLATINUM PUBLICATIONS)': pubName.toLowerCase().includes('platinum') ? book.title : '',
    'TITLE (VIBAL GROUP)': pubName.toLowerCase().includes('vibal') ? book.title : '',

    'Author(s)': val(book.authors),
    'Type of Material:': val(book.materialType),
    'Subject:': val(book.subject),
    'Copyright Date:': val(book.copyrightYear),
    'Price:': val(book.price),
    'No. of Pages:': val(book.pages),
    'Grade Level:': val(book.gradeLevel),
    'Is this material part of a series?': yn(book.isSeries),
    'IF Yes, please indicate the grade level': val(book.seriesLevel),
    'Is there accompanying Teacher’s Manual?': yn(book.hasTeacherManual),
    'IF YES, please indicate the number of pages (Teacher’s Manual)': val(book.teacherManualPages),

    // Section A Ratings
    'A.LEARNING COMPETENCIES [1.Covers DepEd’s minimum requirements/learning competencies of the basic education curriculum and contains enough lessons and learning activities aligned to content and performance standards that will ensure development of learning competencies.]': getRating('A1'),
    'A.LEARNING COMPETENCIES [2.Presents logical sequencing and graduation of lessons in accordance with basic education / K to 12 / MATATAG curriculum.]': getRating('A2'),
    'SCORE (A. LEARNING COMPETENCIES)': getSectionScore('A'),
    'PASSED/FAILED (A. LEARNING COMPETENCIES)': getSectionPassed('A'),
    'COMMENT(S) (A. LEARNING COMPETENCIES)': getSectionComment('A'),

    // Section B Ratings
    'B.PHILOSOPHY AND OBJECTIVES [1. Conforms to the provision of the Constitution, to the national development goals and to all laws pertaining to education.]': getRating('B1'),
    'B.PHILOSOPHY AND OBJECTIVES [2a.Manifests commitment to excellence; and]': getRating('B2a'),
    'B.PHILOSOPHY AND OBJECTIVES [2b. Manifests commitment to social transformation]': getRating('B2b'),
    'B.PHILOSOPHY AND OBJECTIVES [4. Has clearly defined objectives from the viewpoint of learners.]': getRating('B3'),
    'SCORE (B. PHILOSOPHY AND OBJECTIVES)': getSectionScore('B'),
    'PASSED/FAILED (B. PHILOSOPHY AND OBJECTIVES)': getSectionPassed('B'),
    'COMMENT(S) (B. PHILOSOPHY AND OBJECTIVES)': getSectionComment('B'),

    // Section C Ratings
    'C.APPROPRIATENESS OF MATERIAL [1. Uses language that is appropriate to learners’ grade level.]': getRating('C1'),
    'C.APPROPRIATENESS OF MATERIAL [2. Provides a variety of exercises and drills for enrichment, reinforcement & mastery of concepts/skills.]': getRating('C2'),
    'C.APPROPRIATENESS OF MATERIAL [3. Contains varied assessment tools to evaluate learning outcomes/objectives.]': getRating('C3'),
    'C.APPROPRIATENESS OF MATERIAL [4a. (Is consistent with the teachings of the Church and the thrust of MaPSA.) Contains a wide range of significant human experiences.]': getRating('C4a'),
    'C.APPROPRIATENESS OF MATERIAL [4b. (Is consistent with the teachings of the Church and the thrust of MaPSA.)Presents relevant traits and values of contemporary living in a developing society.]': getRating('C4b'),
    'C.APPROPRIATENESS OF MATERIAL [4c. (Is consistent with the teachings of the Church and the thrust of MaPSA.)Takes into account diversity of cultural, religious, economic & family backgrounds.]': getRating('C4c'),
    'C.APPROPRIATENESS OF MATERIAL [4d. (Is consistent with the teachings of the Church and the thrust of MaPSA.)Has balanced treatment of gender in roles, occupation and contribution.]': getRating('C4d'),
    'C.APPROPRIATENESS OF MATERIAL [4e. (Is consistent with the teachings of the Church and the thrust of MaPSA.)Presents controversial and sensitive issues objectively.]': getRating('C4e'),
    'C.APPROPRIATENESS OF MATERIAL [4f.  (Is consistent with the teachings of the Church and the thrust of MaPSA.)Underlines concerns for justice and peace, and respect for integrity of creation.]': getRating('C4f'),
    'C.APPROPRIATENESS OF MATERIAL [4g. (Is consistent with the teachings of the Church and the thrust of MaPSA.)Cultivates pro-life values.]': getRating('C4g'),
    'SCORE (C. APPROPRIATENESS OF MATERIAL)': getSectionScore('C'),
    'PASSED/FAILED (C. APPROPRIATENESS OF MATERIAL)': getSectionPassed('C'),
    'COMMENT(S) (C. APPROPRIATENESS OF MATERIAL)': getSectionComment('C'),

    // Section D Ratings
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [1.Has a conceptual framework and unifying philosophy.]': getRating('D1'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [2.Includes data/information that are up-to-date and relevant.]': getRating('D2'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [3.Addresses the learning level of learners.]': getRating('D3'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [4.Is articulated or linked with books immediately preceding and succeeding in the series.]': getRating('D4'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [5.Provides for integration of concepts and skills learned with other subject areas and disciplines.]': getRating('D5'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [6.Promotes development of higher cognitive, critical and analytical thinking skills.]': getRating('D6'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [7.Includes practical applications and real life situations.]': getRating('D7'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [8.Is free from typographical errors.]': getRating('D8'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [9.Is free from factual errors.]': getRating('D9'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [10.Is free from conceptual errors.]': getRating('D10'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [11.Is free from grammatical errors.]': getRating('D11'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [12.Is free from computational errors.]': getRating('D12'),
    'D.PRESENTATION AND ORGANIZATION OF MATERIAL [13.Has readable texts, visuals, illustrations, lay-out and design that are interesting & suitable for learners.]': getRating('D13'),
    'SCORE (D.PRESENTATION AND ORGANIZATION OF MATERIAL)': getSectionScore('D'),
    'PASSED/FAILED (D. PRESENTATION AND ORGANIZATION OF MATERIAL)': getSectionPassed('D'),
    'COMMENT(S) (D. PRESENTATION AND ORGANIZATION OF MATERIAL)': getSectionComment('D'),

    // Section E Ratings
    'E.FORMAT AND DESIGN [1.Has correct spacing, figures, charts and illustrations that clarify/amplify main ideas.]': getRating('E1'),
    'E.FORMAT AND DESIGN [2.Contains glossary of terms, index, appendix and bibliography including websites.]': getRating('E2'),
    'E.FORMAT AND DESIGN [3.Has cover that is attractive, colorful and durable.]': getRating('E3'),
    'E.FORMAT AND DESIGN [4.Uses good quality of paper,]': getRating('E4'),
    'E.FORMAT AND DESIGN [5.States the credentials of the author.]': getRating('E5'),
    'SCORE (E.FORMAT AND DESIGN)': getSectionScore('E'),
    'PASSED/FAILED (E. FORMAT AND DESIGN)': getSectionPassed('E'),
    'COMMENT(S) (E. FORMAT AND DESIGN)': getSectionComment('E'),

    // Section F Ratings
    'F.PRICE [1.Price is reasonable/affordable.]': getRating('F1'),
    'F.PRICE [2.Price is commensurate to the quality of the material.]': getRating('F2'),
    'SCORE (F. PRICE)': getSectionScore('F'),
    'PASSED/FAILED (F. PRICE)': getSectionPassed('F'),
    'COMMENT(S) (F. PRICE)': getSectionComment('F'),

    // Final Summary
    'OVER-ALL TOTAL': String(ev.total || 0),
    'Ave Rating: Over-all total/36': ev.average ? ev.average.toFixed(2) : '0.00',
    'Based on the foregoing evaluation, this TB/WB/WT is: RECOMMENDED or NOT RECOMMENDED for adoption in the School Year 2026-2027.': ev.recommendation || '',
    'COMMENT(S)': val(ev.comments),
    'Today': dateStr,
  };

  doc.render(data);

  const buf = doc.getZip().generate({ type: 'nodebuffer' });
  return buf;
}
