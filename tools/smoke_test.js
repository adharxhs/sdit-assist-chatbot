const IntentEngine = require('../src/engine.js');
const fs = require('fs');
const path = require('path');

const THRESHOLD = 0.35;

const engine = new IntentEngine({ threshold: THRESHOLD });

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
  const result = engine.query(t.query);

  const gotTag = result.match ? result.intent.tag : null;
  const isCorrect = gotTag === t.expectedTag;

  const status = isCorrect ? 'PASS' : 'FAIL';
  if (isCorrect) {
    passed++;
  } else {
    failed++;
    failures.push({
      query: t.query.slice(0, 60),
      expected: t.expectedTag,
      got: gotTag,
      score: result.score,
      category: t.category
    });
  }

  console.log(
    `[${status}] (${t.category.padEnd(18)}) Q="${t.query.slice(0, 50).padEnd(50)}" → tag=${String(gotTag).padEnd(28)} score=${result.score}`
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
