const IntentEngine = require('../src/engine.js');
const fs = require('fs');

const engine = new IntentEngine({ threshold: 1.0 });

const files = [
  'college_info',
  'departments',
  'admissions',
  'campus',
  'placement'
];

files.forEach(f => {
  const data = JSON.parse(fs.readFileSync(`./data/${f}.json`, 'utf8'));
  engine.addCategory(f, data);
});

engine.train();

const testQueries = [
  // Short phrases / single words
  "info",
  "BE",
  "B.E",
  "b.e",
  "b.e.",
  "cse",
  "mba",
  "mca",
  "mtech",
  "phd",
  "placement",
  "placements",
  "hostel",
  "fees",
  "bus",
  "cet",
  "address",
  "contact",
  "hi",
  "hello",
  "thanks",
  "bye",
  "help",
  "labs",
  "sports",
  "library",
  "aiml",
  "aids",
  "ise",
  "ece",
  "civil",
  "mechanical",
  "aero",

  // Long & complex / unnecessarily worded sentences
  "Could you please provide me with detailed information about the Bachelor of Engineering courses offered at your institution?",
  "I am interested in knowing what the placement statistics and top recruiting companies look like for recent graduates.",
  "Can you tell me what documents I need to bring along when I come for admission to the CSE department?",
  "I would like to inquire about whether the college provides hostel accommodation and transport facilities for outstation students.",
  "Could you tell me if SDIT is recognized by AICTE and affiliated to VTU university?",

  // New pages added to dataset: clubs, committees, collaborations, industrial exposure, IQAC, NAAC, NIRF, scholarship, student progression
  "clubs",
  "what clubs can I join at sdit",
  "committees",
  "anti-ragging",
  "collaborations",
  "which companies has sdit signed MoUs with",
  "industrial visits",
  "industrial exposure",
  "iqac",
  "naac",
  "what is the nirf ranking of sdit",
  "scholarship",
  "are there scholarships available",
  "financial aid",
  "student progression",
  "do sdit students go abroad for higher studies",

  // Fixed overrides (BM25 collision prevention)
  "placement",
  "placements",
  "how are the placements",
  "how are placements",
  "is sdit good",
  "is sdit a good college",

  // Chit-chat / smalltalk fixed responses
  "hi how are you",
  "how are you",
  "how are you doing",
  "who are you",
  "what is your name",
  "tell me about yourself",
  "are you a bot",

  // Adversarial / Edge Cases (Expected to return fallback properly)
  "",
  "   ",
  "???!!!",
  "random gibberish string asdfghjkl"
];

console.log("=== RUNNING ACCURACY & EDGE CASE TESTS ===\n");

testQueries.forEach((q, idx) => {
  const res = engine.query(q);
  const tag = res.intent ? res.intent.tag : res.category;
  const status = res.match ? `MATCH [${tag}] (score: ${res.score})` : `FALLBACK`;
  console.log(`${(idx + 1).toString().padStart(2, ' ')}. Query: "${q}" -> ${status}`);
});
