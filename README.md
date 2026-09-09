# SDIT Assist

Client-side retrieval chatbot for **Shree Devi Institute of Technology (SDIT)**.

## Overview
SDIT Assist answers questions about SDIT using a fully client-side matching engine (no LLM), loaded with intent/pattern data from `data/*.json`.

## Key improvements
- **BM25** intent matching (Okapi BM25) in `src/engine.js`
- **Session context** for short follow-ups (stored in `sessionStorage`)
- **Yes / No / Help tiers** (answers like `yes`, `sure`, `tell me more`, `no`, `help`) now behave as intended
- **Dataset expansion** with additional common intents (e.g. `faculty`, `internships`) built from verified source text in `data/raw/`

## Quick Start
```bash
npm install
npm run dev
```

## How it works
### Matching Engine (`src/engine.js`)
1. Normalize input (includes abbreviation normalization)
2. Tokenize with stopword filtering + stemming
3. Score patterns using **BM25**
4. Apply a threshold; otherwise return fallback
5. For short queries, optionally re-match within the **last resolved topic** from session context
6. Special-case tiers for:
   - greetings / thanks / bye
   - chit-chat (`how are you`, `who are you` / `what is your name`)
   - `yes`/`sure`/`tell me more` (continuation menus)
   - `no`/`that's all` (decline)
   - `help` (help menu)

### Data Format
`data/*.json` contains arrays of intents:
```json
{
  "tag": "dept_cse",
  "patterns": ["cse", "tell me about the cse department"],
  "response": "..."
}
```

### Continuations
`data/continuations.json` drives the response menus used after trailing questions.

## Testing
Run:
```bash
node tools/smoke_test.js
node tools/test_accuracy.js
```

## Deployment
Static hosting (GitHub Pages / Netlify / any static host). No runtime network calls are required.

## License
Apache-2.0. See `LICENSE.md`.

## Credits / Data sources
Intent content is sourced from `https://sdit.ac.in` and figures are reproduced verbatim from the archived raw text in `data/raw/`.
