global.sessionStorage = {
  _d: {},
  clear() { this._d = {}; },
  getItem(k) { return this._d[k] || null; },
  setItem(k, v) { this._d[k] = v; }
};

const IntentEngine = require('../src/engine.js');
const fs = require('fs');
const path = require('path');

const THRESHOLD = 1.0;

const engine = new IntentEngine({
  threshold: THRESHOLD,
  affirmContinuations: {
    departments: 'Sure! I can go into more depth on any of these. Ask me about CSE, AIML, ISE, AI&DS, ECE, Mechanical, Civil, Aeronautical, M.Tech, MBA, MCA, or the PhD research centre.',
    college_info: 'Of course! I can tell you more about SDIT\'s establishment, vision & mission, affiliation, CET/PGCET codes, contact details, or campus facilities.',
    admissions: 'Happy to help! I can walk you through B.E eligibility, MBA/MCA/M.Tech eligibility, documents, how to apply, or fees.',
    campus: 'Sure! I can cover the hostel, labs, library, classrooms, sports, canteen, transport, seminar hall, or the open-air theatre.',
    placement: 'Absolutely! I can tell you more about placement statistics, recruiters, training, the placement officer, or facilities.'
  }
});

const dataDir = path.join(__dirname, '..', 'data');
const dataFiles = [
  'college_info.json', 'departments.json', 'admissions.json',
  'campus.json', 'placement.json'
];

dataFiles.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, f), 'utf8'));
  engine.addCategory(f.replace('.json', ''), data);
});

engine.train();

const testSet = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_queries.json'), 'utf8'));

let passed = 0;
let failed = 0;
let total = 0;
const failures = [];

for (const t of testSet) {
  total++;
  global.sessionStorage.clear();
  if (t.before && Array.isArray(t.before)) {
    for (const bq of t.before) engine.query(bq);
  }
  const result = engine.query(t.query);

  const gotTag = result.match ? result.intent.tag : null;
  const isCorrect = gotTag === t.expectedTag;

  const status = isCorrect ? 'PASS' : 'FAIL';
  if (isCorrect) {
    passed++;
  } else {
    failed++;
    failures.push({
      query: (t.before ? t.before.join(' → ') + ' → ' : '') + t.query.slice(0, 60),
      expected: t.expectedTag,
      got: gotTag,
      score: result.score,
      category: t.category
    });
  }

  const prefix = t.before ? ('[' + t.before.length + ' prior] ') : '';
  console.log(
    `[${status}] (${t.category.padEnd(20)}) Q="${prefix}${t.query.slice(0, 50).padEnd(45)}" → tag=${String(gotTag).padEnd(30)} score=${result.score}`
  );
}

console.log('\n========================================');
console.log(`RESULTS: ${passed} passed / ${total} total (${failed} failures)`);
console.log(`Threshold: ${THRESHOLD}`);
console.log('========================================\n');

if (failures.length > 0) {
  console.log('FAILURES:');
  failures.forEach(f => {
    console.log(`  Q="${f.query}" | expected=${f.expected} | got=${f.got} | score=${f.score}`);
  });
}
