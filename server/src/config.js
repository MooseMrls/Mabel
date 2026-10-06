// Single source of truth for the evaluation form. Edit wording or pass scores here.
const item = (id, label, text) => ({ id, label, text });

export const RATING_VALUES = [5, 4, 3, 2, 1];
export const MAX_EVALUATORS_PER_BOOK = 3;

export const SECTIONS = [
  {
    key: 'A', title: 'Learning Competencies', passScore: 6,
    items: [
      item('A1', '1', "Covers DepEd's minimum requirements/learning competencies of the subject and contains enough lessons and learning activities aligned to content and performance standards that will ensure development of learning competencies."),
      item('A2', '2', 'Presents logical sequencing and gradation of lessons in accordance with the K to 12 / MATATAG curriculum.'),
    ],
  },
  {
    key: 'B', title: 'Philosophy and Objectives', passScore: 12,
    items: [
      item('B1', '1', 'Conforms to the provision of the Constitution, the national development goals and all laws pertaining to education.'),
      item('B2a', '2a', 'Manifests commitment to excellence.'),
      item('B2b', '2b', 'Manifests commitment to social transformation.'),
      item('B3', '3', 'Has clearly defined objectives from the viewpoint of learners.'),
    ],
  },
  {
    key: 'C', title: 'Appropriateness of Material', passScore: 30,
    items: [
      item('C1', '1', "Uses language that is appropriate to learners' grade level."),
      item('C2', '2', 'Provides a variety of exercises and drills for enrichment, reinforcement and mastery of concepts/skills.'),
      item('C3', '3', 'Contains varied assessment tools to evaluate learning outcomes/objectives.'),
      item('C4a', '4a', 'Is consistent with the teachings of the Church and the Word of MaPSA: Contains a wide range of significant human experiences.'),
      item('C4b', '4b', 'Is consistent with the teachings of the Church and the Word of MaPSA: Presents relevant traits and values of contemporary living in a developing society.'),
      item('C4c', '4c', 'Is consistent with the teachings of the Church and the Word of MaPSA: Takes into account diversity of cultural, religious, economic and family backgrounds.'),
      item('C4d', '4d', 'Is consistent with the teachings of the Church and the Word of MaPSA: Has balanced treatment of gender in roles, occupation and contribution.'),
      item('C4e', '4e', 'Is consistent with the teachings of the Church and the Word of MaPSA: Presents controversial and sensitive issues objectively.'),
      item('C4f', '4f', 'Is consistent with the teachings of the Church and the Word of MaPSA: Enriches concerns for justice and peace, and respect for integrity of creation.'),
      item('C4g', '4g', 'Is consistent with the teachings of the Church and the Word of MaPSA: Cultivates pro-life values.'),
    ],
  },
  {
    key: 'D', title: 'Presentation and Organization of Material', passScore: 39,
    items: [
      item('D1', '1', 'Has a conceptual framework and unifying philosophy.'),
      item('D2', '2', 'Includes data/information that are up-to-date and relevant.'),
      item('D3', '3', 'Addresses the learning level of learners.'),
      item('D4', '4', 'Is articulated or linked with books immediately preceding and succeeding in the series.'),
      item('D5', '5', 'Provides for integration of concepts and skills learned with other subject areas and disciplines.'),
      item('D6', '6', 'Promotes development of higher cognitive, critical and analytical thinking skills.'),
      item('D7', '7', 'Includes practical applications and real life situations.'),
      item('D8', '8', 'Is free from typographical errors.'),
      item('D9', '9', 'Is free from factual errors.'),
      item('D10', '10', 'Is free from conceptual errors.'),
      item('D11', '11', 'Is free from grammatical errors.'),
      item('D12', '12', 'Is free from computational errors.'),
      item('D13', '13', 'Has readable texts, visuals, illustrations, lay-out and design that are interesting and suitable for learners.'),
    ],
  },
  {
    key: 'E', title: 'Format and Design', passScore: 15,
    items: [
      item('E1', '1', 'Has correct spacing, figures, charts and illustrations that clarify/simplify main ideas.'),
      item('E2', '2', 'Contains glossary of terms, index, appendix and bibliography, including footnotes.'),
      item('E3', '3', 'Has cover that is attractive, colorful and durable.'),
      item('E4', '4', 'Uses good quality of paper.'),
      item('E5', '5', 'States the credentials of the author.'),
    ],
  },
  {
    key: 'F', title: 'Price', passScore: 6,
    items: [
      item('F1', '1', 'Price is reasonable/affordable.'),
      item('F2', '2', 'Price is commensurate to the quality of the material.'),
    ],
  },
].map((s) => ({ ...s, max: s.items.length * 5 }));

export const ALL_ITEM_IDS = SECTIONS.flatMap((s) => s.items.map((i) => i.id));

export const OPTIONS = {
  materialTypes: ['TB-Textbook', 'TB/WB with Workbook', 'WT-Worktext', 'E-Book', 'Module'],
  seriesLevels: ['Grade School 1-6', 'Junior High School (7-10)', 'Senior High School (11-12)'],
  gradeLevels: ['Kindergarten', ...Array.from({ length: 12 }, (_, i) => String(i + 1))],
  recommendations: ['RECOMMENDED', 'NOT RECOMMENDED'],
};

/** Computes all scores from a ratings map { itemId: 1..5 }. */
export function scoreEvaluation(ratings = {}) {
  const sections = {};
  let total = 0;
  let complete = true;
  let allPassed = true;
  for (const s of SECTIONS) {
    let score = 0;
    let done = true;
    for (const it of s.items) {
      const v = Number(ratings[it.id]);
      if (Number.isInteger(v) && v >= 1 && v <= 5) score += v;
      else done = false;
    }
    const passed = done && score >= s.passScore;
    sections[s.key] = { score, max: s.max, passScore: s.passScore, passed };
    total += score;
    if (!done) complete = false;
    if (!passed) allPassed = false;
  }
  const max = SECTIONS.reduce((a, s) => a + s.max, 0);
  const average = Math.round((total / ALL_ITEM_IDS.length) * 100) / 100;
  return { sections, total, max, average, complete, allPassed };
}
