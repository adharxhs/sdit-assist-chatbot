# SDIT Assist

A client-side retrieval chatbot for Shree Devi Institute of Technology (SDIT), embedded as a floating widget on a mock SDIT homepage. No LLM, no backend, no runtime network calls — every answer is matched and returned entirely in the browser.

## Overview

SDIT Assist answers questions about SDIT — college info, departments, admissions, campus facilities, and placements — using an Okapi BM25 retrieval engine running in vanilla JavaScript. `index.html` doubles as a demo SDIT homepage with a floating chat bubble that opens a modal chat window, so the widget can be evaluated in a realistic embedded context rather than a bare chat page.

## Features

- **Static, zero-backend deployment** — pure HTML/CSS/JS, deployable to GitHub Pages or any static host
- **BM25 matching engine** — Okapi BM25 (`k1 = 1.5`, `b = 0.75`) over abbreviation-expanded, stemmed, stopword-filtered text, replacing an earlier TF-IDF baseline for better ranking on both short and verbose queries
- **Tiered response layer** — greetings, thanks, goodbyes, "how are you", "who are you", and help requests are detected and answered before falling through to BM25 matching
- **Session-aware follow-ups** — `sessionStorage`-backed context tracking remembers the last topic discussed, so bare replies like "yes", "tell me more", or "no" are resolved against the ongoing conversation instead of being treated as new, unmatched queries
- **Consistent response voice** — all response text follows a documented style guide (first-person, warm-but-professional, 40–80 word target) rather than being written ad hoc
- **Chalkboard-themed UI** — dark green glassmorphism chat modal over an educational graffiti background, opened via a floating bubble or inline suggestion chips
- **Keyboard accessible & mobile responsive**

## Project Structure

```
/
├── index.html                 # Demo SDIT homepage + chat widget markup
├── style.css                  # Chalkboard-green theme + glassmorphism
├── src/
│   ├── engine.js              # BM25 matching engine + session context tracking (UMD, browser/Node)
│   └── app.js                 # UI wiring, data loading, widget open/close, event handlers
├── data/
│   ├── college_info.json      # General college info, vision, mission, contact, CET/PGCET codes
│   ├── departments.json       # All departments (CSE, CSE-AIML, ISE, AI&DS, ECE, ME, CE, Aero, MBA, MCA, M.Tech, PhD)
│   ├── admissions.json        # Eligibility, documents, how to apply, fees
│   ├── campus.json            # Facilities: hostel, labs, library, sports, canteen, transport
│   ├── placement.json         # Statistics, recruiters, training, TPO
│   ├── continuations.json     # Follow-up responses for affirm/decline/no-topic replies
│   └── style-guide.md         # Response voice, tone, and length rules for all data JSON
├── assets/
│   ├── logo.png
│   └── gate-banner.jpg
├── tools/
│   ├── smoke_test.js          # Current test runner (loads all data, runs test_queries.json, mocks sessionStorage)
│   ├── test_accuracy.js       # Earlier, simpler accuracy runner (superseded by smoke_test.js)
│   ├── test_queries.json      # Query/expectedTag/category test cases, incl. follow-up scenarios
│   ├── calibrate_bm25.js      # Script used to score the BM25 threshold against test_queries.json
│   ├── bm25_calibration.md    # Written record of the BM25 threshold calibration and TF-IDF comparison
│   └── scrape_source.md       # Dev-time-only map of source URLs on sdit.ac.in for each raw data file
├── package.json
└── LICENSE.md                 # Apache License 2.0
```

## How It Works

### Matching Engine (`src/engine.js`)

1. **Input normalization** — handles `B.E.`, `M.Tech`, `C.S.E.` and other fragmented abbreviations
2. **Abbreviation expansion** — maps `cse` → `computer science engineering`, `mba` → `master business administration management`, etc.
3. **Stopword filtering + lightweight stemming**
4. **Tiered pre-checks** — greeting/thanks/bye/how-are-you/who-are-you/help detection, and single-word topic shortcuts (e.g. bare `placement`) run before retrieval
5. **BM25 scoring** — Okapi BM25 over patterns (and, at a lower weight, response text) for every intent, with `k1 = 1.5`, `b = 0.75`
6. **Threshold gating** — a match must score ≥ `1.0` (calibrated in `tools/bm25_calibration.md`); below that, a fallback response listing available topics is returned
7. **Session context** — the matched topic's category is written to `sessionStorage`; a bare affirmative/negative reply on the next turn is resolved against that stored topic via `continuations.json` instead of failing to match

### Data Format

Each intent in `data/*.json`:

```json
{
  "tag": "dept_cse",
  "patterns": [
    "cse",
    "computer science",
    "what is cse",
    "tell me about the cse department",
    "could you please tell me everything about the computer science and engineering program"
  ],
  "response": "The Department of Computer Science and Engineering..."
}
```

Patterns include single-word abbreviations, common synonyms, natural questions, and verbose complex sentences. Response text follows `data/style-guide.md`: first-person voice, direct opening, 40–80 words (120-word hard ceiling), and no unverifiable figures.

## Testing

Run the current test suite:

```
node tools/smoke_test.js
```

This loads all five data categories plus `continuations.json`, mocks `sessionStorage`, and runs the query/expected-tag pairs (and follow-up scenarios) in `tools/test_queries.json`. `tools/test_accuracy.js` is an earlier, simpler runner kept for reference.

To re-derive or check the BM25 threshold against the same query set:

```
node tools/calibrate_bm25.js
```

## Deployment

### GitHub Pages

1. Push to a GitHub repository
2. Go to **Settings → Pages**
3. Set source to the `main` branch
4. Access at `https://yourusername.github.io/sdit-assist-chatbot/`

### Manual

Upload all files except `node_modules/`, `tools/`, and `data/raw/` (gitignored, dev-time-only scraped source text) to any static hosting service.

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Android)

## Limitations

- **No LLM** — pure lexical retrieval (BM25), cannot generate novel responses
- **No semantic search yet** — matching is term-based, not embedding-based; queries with no lexical overlap to any pattern will miss
- **No runtime network** — all content is bundled at build time; sdit.ac.in is not contacted during use
- **Static data** — updates require redeployment
- **English only** — no multilingual support

## Data Sources

All information sourced from `https://sdit.ac.in` (see `tools/scrape_source.md` for the full URL map): college overview, vision/mission, campus facilities, admissions eligibility, all department pages, and placement statistics/recruiters/training pages. No fabricated data — all figures are verified against source text.

## Tech Stack

- **HTML5** — semantic markup, ARIA accessibility
- **CSS3** — glassmorphism, backdrop-filter, CSS custom properties
- **Vanilla JavaScript** — no frameworks; `src/engine.js` is UMD (works as a browser script tag or a Node `require`)
- **BM25** — custom implementation in `src/engine.js`
- **Static hosting** — zero server-side dependencies

## Development

### Prerequisites

- Node.js 16+ (for `http-server` only)
- A modern browser with DevTools

### Local Development

```
npm install
npm run dev
```

Open `http://localhost:8080`. Hot-reload is not included — refresh the browser after changes.

### Adding New Intents

1. Edit the relevant file in `data/`
2. Add a new intent object with `tag`, `patterns` array, and `response` string, following `data/style-guide.md` for tone
3. Include short patterns (single words), abbreviations, and verbose variants
4. Add a corresponding case to `tools/test_queries.json` and re-run `node tools/smoke_test.js`

### Modifying Matching Behavior

Edit `src/engine.js`:

- `threshold` — lower = more matches, higher = stricter (default: `1.0`)
- `k1` / `b` — BM25 term-frequency saturation / length normalization
- `ABBREVIATION_MAP` — add new abbreviation expansions
- `DEFAULT_STOP_WORDS` — add/remove stopwords

## License

Apache License 2.0 — see `LICENSE.md`.

## Credits

- **Institution** — Shree Devi Institute of Technology, Kenjar, Mangaluru
- **Data Source** — [sdit.ac.in](https://sdit.ac.in)

---

**SDIT Assist** — a client-side guide to Shree Devi Institute of Technology.
