const IntentEngine = require('../src/engine.js');
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const dataFiles = [
  'college_info', 'departments', 'admissions', 'campus', 'placement'
];

const testSet = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_queries.json'), 'utf8'));

// Get raw scores (thrersehold 0 means everything matches) to log distributions
const rawEngine = new IntentEngine({ threshold: 0 });
dataFiles.forEach(f => {
  const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${f}.json`), 'utf8'));
  rawEngine.addCategory(f, data);
});
rawEngine.train();

console.log("=== BM25 RAW SCORE DISTRIBUTION (correct vs incorrect) ===\n");

const correctScores = [];
const incorrectScores = [];
const adversarialScores = [];
let correctTopWrong = [];

testSet.forEach((t, idx) => {
  // reset session state to avoid cross-query context interference in calibration
  try { sessionStorage.clear(); } catch (e) {}

  const rawRes = rawEngine.query(t.query);
  const gotTag = rawRes.match ? rawRes.intent.tag : null;
  const isCorrect = gotTag === t.expectedTag;

  if (t.expectedTag === null) {
    adversarialScores.push(rawRes.score);
    console.log(`[ADV] Q="${t.query.slice(0, 30).padEnd(30)}" score=${rawRes.score} got=${gotTag}`);
  } else if (isCorrect) {
    correctScores.push(rawRes.score);
    console.log(`[OK ] Q="${t.query.slice(0, 45).padEnd(45)}" score=${rawRes.score} got=${gotTag} (want ${t.expectedTag})`);
  } else {
    incorrectScores.push(rawRes.score);
    correctTopWrong.push({ query: t.query, got: gotTag, want: t.expectedTag, score: rawRes.score });
    console.log(`[BAD] Q="${t.query.slice(0, 45).padEnd(45)}" score=${rawRes.score} got=${gotTag} (want ${t.expectedTag})`);
  }
});

function summary(name, arr) {
  if (arr.length === 0) return `${name}: (none)`;
  const min = Math.min(...arr);
  const max = Math.max(...arr);
  const avg = arr.reduce((a, b) => a + b, 0) / arr.length;
  return `${name}: n=${arr.length} min=${min.toFixed(3)} max=${max.toFixed(3)} avg=${avg.toFixed(3)}`;
}

console.log("\n" + summary("CORRECT", correctScores));
console.log(summary("INCORRECT", incorrectScores));
console.log(summary("ADVERSARIAL", adversarialScores));

if (correctTopWrong.length > 0) {
  console.log("\nIncorrect matches (would be scored as correct if below threshold):");
  correctTopWrong.forEach(c => console.log(`  Q="${c.query}" got=${c.got} want=${c.want} score=${c.score.toFixed(3)}`));
}

// Find lowest correct score (the max threshold we can afford)
const minCorrect = Math.min(...correctScores);
console.log(`\n=== Lowest correct-match score: ${minCorrect.toFixed(3)} ===`);
console.log("Any threshold <= this value keeps all correct matches.");

// Highest incorrect/adversarial score (threshold must be above this to reject them)
const bad = incorrectScores.concat(adversarialScores);
if (bad.length > 0) {
  const maxBad = Math.max(...bad);
  console.log(`=== Highest incorrect/adversarial score: ${maxBad.toFixed(3)} ===`);
  console.log("Any threshold > this value rejects all incorrect/adversarial queries.");
}

// Evaluate a range of thresholds
console.log("\n=== THRESHOLD SWEEP ===\n");
[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15].forEach(th => {
  const engine = new IntentEngine({ threshold: th });
  dataFiles.forEach(f => {
    const data = JSON.parse(fs.readFileSync(path.join(dataDir, `${f}.json`), 'utf8'));
    engine.addCategory(f, data);
  });
  engine.train();

  let passed = 0;
  let failed = 0;
  // Reset session before each query to avoid context bleed in calibration
  const testSet2 = JSON.parse(fs.readFileSync(path.join(__dirname, 'test_queries.json'), 'utf8'));
  testSet2.forEach(t => {
    try { sessionStorage.clear(); } catch (e) {}
    const res = engine.query(t.query);
    const gotTag = res.match ? res.intent.tag : null;
    if (gotTag === t.expectedTag) passed++;
    else failed++;
  });

  const total = passed + failed;
  console.log(`Threshold ${String(th).padEnd(4)}: ${passed}/${total} passed (${failed} failed)`);
});
