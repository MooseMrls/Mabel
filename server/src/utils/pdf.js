import path from 'path';
import { fileURLToPath } from 'url';
import PDFDocument from 'pdfkit';
import { SECTIONS } from '../config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../../../client/src/img/MaPSA 1.png');

const M = 36;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const W = PAGE_W - M * 2; // 523.28
const BOTTOM = PAGE_H - M - 14;

const yn = (v) => (v === true || v === 'true' || v === 'yes' || v === 'Yes' ? 'Yes' : v === false || v === 'false' || v === 'no' || v === 'No' ? 'No' : '');
const val = (v) => (v === undefined || v === null || v === '' ? '-' : String(v));

export function streamReport(ev, res) {
  const doc = new PDFDocument({
    size: 'A4',
    margin: M,
    autoFirstPage: false,
    info: { Title: `MaPSA Evaluation Report - ${ev.book?.title || 'Report'}` },
  });

  doc.pipe(res);
  const book = ev.book || {};

  let pageNum = 0;

  // Prevent PDFKit from auto-creating pages via doc.text() overflow.
  // Only our need() function should create pages.
  const _addPage = doc.addPage.bind(doc);
  let allowNewPage = true;
  doc.addPage = function (...args) {
    if (!allowNewPage) return doc; // block auto-pagination
    return _addPage(...args);
  };

  // Write "Page N" footer at the very bottom of the current page
  const writeFooter = () => {
    allowNewPage = false;
    const savedY = doc.y;
    doc.fillColor('#666666').font('Helvetica').fontSize(8)
      .text(`Page ${pageNum}`, M, PAGE_H - M + 4, { width: W, align: 'center', lineBreak: false });
    doc.y = savedY;
    doc.fillColor('#000000');
    allowNewPage = true;
  };

  // Start the first page
  _addPage();
  pageNum = 1;
  allowNewPage = false; // block auto-pagination during content rendering

  // Helper to trigger page break when remaining space is insufficient
  const need = (h) => {
    if (doc.y + h > BOTTOM) {
      writeFooter();
      allowNewPage = true;
      _addPage();
      pageNum++;
      allowNewPage = false; // re-block after page created
    }
  };

  // Bordered Table Row helper
  const drawRow = (cols, { fill = null, minH = 18, fontSize = 8.5 } = {}) => {
    let calcH = minH;
    cols.forEach((c) => {
      doc.font(c.bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(c.fontSize || fontSize);
      const th = doc.heightOfString(String(c.text ?? ''), { width: c.w - 8 }) + 6;
      if (th > calcH) calcH = th;
    });

    need(calcH);
    const y = doc.y;
    let x = M;

    cols.forEach((c) => {
      const cellFill = c.fill || fill;
      if (cellFill) {
        doc.rect(x, y, c.w, calcH).fill(cellFill);
      }
      doc.lineWidth(0.5).strokeColor('#000000').rect(x, y, c.w, calcH).stroke();

      const textColor = c.color || '#000000';
      doc.fillColor(textColor)
        .font(c.bold ? 'Helvetica-Bold' : 'Helvetica')
        .fontSize(c.fontSize || fontSize)
        .text(String(c.text ?? ''), x + 4, y + 4, {
          width: c.w - 8,
          height: calcH,
          align: c.align || 'left',
          lineGap: 1,
        });

      x += c.w;
    });

    doc.y = y + calcH;
  };

  // 1. Header Box
  const drawHeader = () => {
    need(65);
    const startY = doc.y;
    const logoW = 55;
    const headerH = 52;

    doc.lineWidth(1).strokeColor('#000000').rect(M, startY, W, headerH).stroke();

    // Render official MaPSA 1.png logo image inside header box
    try {
      doc.image(LOGO_PATH, M + 6, startY + 5, { fit: [42, 42], align: 'center', valig: 'center' });
    } catch {
      // Fallback if image fails to load
      const yellowBoxW = 42;
      doc.rect(M + 4, startY + 4, yellowBoxW, 42).fill('#FACC15');
      doc.fillColor('#000000').font('Helvetica-Bold').fontSize(14).text('M', M + 8, startY + 8);
    }

    // Title inside Header Box
    const textX = M + logoW + 4;
    const textW = W - logoW - 8;
    doc.fillColor('#000000').font('Helvetica-Bold').fontSize(10.5)
      .text('MANILA ECCLESIASTICAL PROVINCE SCHOOL SYSTEMS ASSOCIATION', textX, startY + 9, { width: textW, align: 'center' });
    doc.font('Helvetica-Bold').fontSize(9.5)
      .text('TEXTBOOK EVALUATION FORM', textX, startY + 27, { width: textW, align: 'center' });

    doc.y = startY + headerH + 6;

    // Subheader Table
    drawRow([
      { w: 60, text: 'TYPE', bold: true, align: 'center' },
      { w: 180, text: val(book.materialType), align: 'center' },
      { w: 90, text: 'SUBJECT / AREA', bold: true, align: 'center' },
      { w: W - 330, text: val(book.subject), align: 'center' },
    ], { minH: 20 });

    doc.y += 8;
  };

  drawHeader();

  // Part 1 Section Heading
  drawRow([
    { w: W, text: 'PART I: INFORMATION REGARDING THE MATERIAL TO BE EVALUATION', bold: true, align: 'center' }
  ], { fill: '#ffffff', minH: 20, fontSize: 9 });

  doc.y += 2;

  // Book Information Grid
  const colA = 180;
  const colB = W - colA;

  drawRow([{ w: colA, text: '1. Author / Authors:', bold: true }, { w: colB, text: val(book.authors) }]);
  drawRow([{ w: colA, text: '2. Title:', bold: true }, { w: colB, text: val(book.title) }]);
  drawRow([{ w: colA, text: '3. Publisher:', bold: true }, { w: colB, text: val(book.publisher?.name) }]);
  drawRow([{ w: colA, text: '4. Copyright Date:', bold: true }, { w: colB, text: val(book.copyrightYear) }]);
  drawRow([{ w: colA, text: '5. Price:', bold: true }, { w: colB, text: val(book.price) }]);
  drawRow([{ w: colA, text: '6. No. of Pages:', bold: true }, { w: colB, text: val(book.pages) }]);
  drawRow([{ w: colA, text: '7. Grade Level for which material is intended:', bold: true }, { w: colB, text: val(book.gradeLevel) }]);
  drawRow([{ w: colA, text: '8. Is this material part of a series?', bold: true }, { w: colB, text: yn(book.isSeries) }]);
  if (book.isSeries) {
    drawRow([{ w: colA, text: '   If yes, please indicate the grade level:', bold: true }, { w: colB, text: val(book.seriesLevel) }]);
  }
  drawRow([{ w: colA, text: '9. Is there an accompanying Teacher\'s Manual?', bold: true }, { w: colB, text: yn(book.hasTeacherManual) }]);
  if (book.hasTeacherManual) {
    drawRow([{ w: colA, text: '   If yes, number of pages (Teacher\'s Manual):', bold: true }, { w: colB, text: val(book.teacherManualPages) }]);
  }

  doc.y += 6;

  // Instruction Box
  drawRow([
    {
      w: W,
      text: 'Instructions: Please indicate your rating for each item by specifying a score from 1 to 5 (5 = Excellent, 1 = Poor).\n(Note: TB/WB/WT must score at least the required pass threshold per section).',
      align: 'center',
      fontSize: 8,
    }
  ], { fill: '#fafafa', minH: 26 });

  doc.y += 6;

  // Part II Section Heading
  drawRow([
    { w: W, text: 'PART II: EVALUATION CRITERIA BREAKDOWN', bold: true, align: 'center' }
  ], { fill: '#ffffff', minH: 20, fontSize: 9 });

  // Evaluation Sections
  for (const s of SECTIONS) {
    const sc = ev.scores?.[s.key] || { score: 0, max: s.max, passed: false };

    doc.y += 4;
    // Section Header Row
    drawRow([
      { w: W - 70, text: `${s.key}. ${s.title.toUpperCase()}`, bold: true, fontSize: 9 },
      { w: 70, text: 'RATING', bold: true, align: 'center', fontSize: 9 },
    ], { fill: '#fef08a' });

    // Criteria Items
    for (const it of s.items) {
      drawRow([
        { w: 32, text: it.label, align: 'center', bold: true },
        { w: W - 32 - 70, text: it.text },
        { w: 70, text: String(ev.ratings?.[it.id] ?? '-'), align: 'center', bold: true, fontSize: 9.5 }
      ]);
    }

    // Section Summary Row
    drawRow([
      { w: W - 140, text: `SECTION SCORE (Pass threshold: ${s.passScore} out of ${s.max})`, bold: true },
      { w: 70, text: `${sc.score} / ${sc.max}`, bold: true, align: 'center' },
      {
        w: 70,
        text: sc.passed ? 'PASSED' : 'FAILED',
        bold: true,
        align: 'center',
        color: sc.passed ? '#15803d' : '#b91c1c'
      }
    ], { fill: '#fefce8' });

    // Section Comments if any
    if (ev.sectionComments?.[s.key]) {
      drawRow([
        { w: 90, text: 'REMARKS:', bold: true },
        { w: W - 90, text: val(ev.sectionComments[s.key]) }
      ]);
    }
  }

  doc.y += 8;

  // Final Evaluation Summary Header
  drawRow([
    { w: W, text: 'FINAL EVALUATION SUMMARY', bold: true, align: 'center' }
  ], { fill: '#fef08a', minH: 20, fontSize: 9.5 });

  const maxTotal = Object.values(SECTIONS).reduce((a, s) => a + s.max, 0);
  drawRow([{ w: 180, text: 'Overall Total Score:', bold: true }, { w: W - 180, text: `${ev.total} / ${maxTotal}`, bold: true }]);
  drawRow([{ w: 180, text: 'Average Rating:', bold: true }, { w: W - 180, text: `${ev.average.toFixed(2)} / 5.00`, bold: true }]);
  drawRow([
    { w: 180, text: 'Final Recommendation:', bold: true },
    {
      w: W - 180,
      text: `${ev.recommendation}`,
      bold: true,
      color: ev.recommendation === 'RECOMMENDED' ? '#15803d' : '#b91c1c'
    }
  ]);
  drawRow([{ w: 180, text: 'Evaluator Remarks:', bold: true }, { w: W - 180, text: val(ev.comments) }]);

  doc.y += 8;

  // Certification & Signature Box
  need(80);
  const certH = 75;
  const certY = doc.y;

  doc.lineWidth(0.5).strokeColor('#000000').rect(M, certY, W, certH).stroke();
  doc.fillColor('#000000').font('Helvetica').fontSize(8.5)
    .text('Certification: I certify that this evaluation report and recommendation is my own and is without any undue influence from others.', M + 8, certY + 8, { width: W - 16, lineBreak: false });

  doc.font('Helvetica-Bold').fontSize(9)
    .text(ev.evaluator?.name || '________________________', M + 8, certY + 44, { width: 220, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(8)
    .text('Evaluator Signature / Name', M + 8, certY + 56, { width: 220, align: 'center', lineBreak: false });

  const dateStr = new Date(ev.createdAt || Date.now()).toLocaleDateString('en-PH', { year: 'numeric', month: 'long', day: 'numeric' });
  doc.font('Helvetica-Bold').fontSize(9)
    .text(dateStr, M + W - 228, certY + 44, { width: 220, align: 'center', lineBreak: false });
  doc.font('Helvetica').fontSize(8)
    .text('Date', M + W - 228, certY + 56, { width: 220, align: 'center', lineBreak: false });

  // Write footer on the last page
  writeFooter();

  doc.end();
}

