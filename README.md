# SDIT Assist

Client-side retrieval chatbot for Shree Devi Institute of Technology.

## Overview

SDIT Assist is a client-side retrieval chatbot that answers queries about SDIT — courses, departments, admissions, campus facilities, and placements. No LLM, no backend, no runtime computation surprises. Pure TF-IDF + cosine similarity matching running entirely in the browser.

## Features

- **Static deployment** — Pure client-side JavaScript, deployable to GitHub Pages, Netlify, or any static host
- **No backend required** — Static files deployable to GitHub Pages, Netlify, or any static host
- **TF-IDF matching engine** — Vanilla JavaScript implementation with abbreviation expansion and short-query boosting
- **Chalkboard-themed UI** — Dark green glassmorphism interface over an educational graffiti background
- **Keyboard accessible** — Full keyboard navigation support
- **Mobile responsive** — Adapts to all screen sizes

## Quick Start

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open `http://localhost:8080` in your browser.

## Project Structure

```
/
├── index.html              # Main HTML shell
├── style.css               # Chalkboard-green theme + glassmorphism
├── src/
│   ├── engine.js           # TF-IDF + cosine similarity matching engine
│   └── app.js              # UI wiring, data loading, event handlers
├── data/
│   ├── college_info.json   # General college info, vision, mission, contact
│   ├── departments.json    # All departments (CSE, ISE, AIML, ECE, ME, CE, Aero, MBA, MCA, M.Tech, PhD)
│   ├── admissions.json     # Eligibility, documents, how to apply
│   ├── campus.json         # Facilities: hostel, labs, library, sports, transport
│   ├── placement.json      # Statistics, recruiters, training, TPO
│   └── raw/                # Source text scraped from sdit.ac.in
├── assets/
│   └── background.jpg      # Chalkboard educational graffiti background
├── tools/
│   └── test_accuracy.js    # Node script to test query matching
└── package.json
```

## How It Works

### Matching Engine (`src/engine.js`)

1. **Input normalization** — Handles `B.E.`, `M.Tech`, `C.S.E.` and other fragmented abbreviations
2. **Abbreviation expansion** — Maps `cse` → `computer science engineering`, `mba` → `master business administration`, etc.
3. **Stopword filtering + stemming** — Lightweight English stemmer removes noise
4. **TF-IDF vectorization** — Builds term frequency-inverse document frequency vectors for all patterns
5. **Cosine similarity scoring** — Matches user query against all intent patterns
6. **Short-query boost** — 1-2 token queries get a 1.4x score multiplier to compensate for TF-IDF bias
7. **Threshold gating** — Below-threshold queries return fallback instead of wrong matches

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

Patterns include:
- Single-word abbreviations (`cse`)
- Common synonyms (`computer science`)
- Natural questions (`what is cse`)
- Verbose complex sentences (`could you please tell me everything about...`)

## Testing

Run the accuracy test suite:

```bash
node tools/test_accuracy.js
```

Tests 42 queries covering:
- Single words: `info`, `BE`, `cse`, `mba`, `placement`, `hostel`
- Abbreviations: `B.E.`, `M.Tech`, `AICTE`, `VTU`
- Complex sentences: *"Could you please provide me with detailed information about the Bachelor of Engineering courses offered at your institution?"*
- Edge cases: empty input, pure punctuation, gibberish

## Deployment

### GitHub Pages

1. Push to GitHub repository
2. Go to Settings → Pages
3. Set source to `main` branch
4. Access at `https://yourusername.github.io/sdit-assist/`

### Manual

Upload all files (except `node_modules/`, `tools/`, `data/raw/`) to any static hosting service.

## Browser Support

- Chrome/Edge 80+
- Firefox 75+
- Safari 13+
- Mobile browsers (iOS Safari, Chrome Android)

## Limitations

- **No LLM** — Pure retrieval, cannot generate novel responses
- **No runtime network** — All content is bundled at build time; sdit.ac.in is not contacted during use
- **Static data** — Updates require redeployment
- **English only** — No multilingual support

## Data Sources

All information sourced from `https://sdit.ac.in`:
- `/about` — College overview
- `/vision-mission` — Vision and mission statements
- `/campus` — Campus facilities
- `/eligibility` — Admission requirements
- Department pages — CSE, ISE, AIML, AI&DS, ECE, ME, CE, Aeronautical, MBA, MCA, M.Tech, PhD
- Placement pages — Statistics, recruiters, training

No fabricated data. All statistics (placement percentages, offer counts, recruiter names) verified against source text.

## Tech Stack

- **HTML5** — Semantic markup, ARIA accessibility
- **CSS3** — Glassmorphism, backdrop-filter, CSS custom properties
- **Vanilla JavaScript** — No frameworks, ES5-compatible for broad browser support
- **TF-IDF** — Custom implementation, ~300 lines
- **Static hosting** — Zero server-side dependencies

## Development

### Prerequisites

- Node.js 16+ (for `http-server` only)
- Modern browser with DevTools

### Local Development

```bash
npm install
npm run dev
```

Hot-reload not included — refresh browser after changes.

### Adding New Intents

1. Edit relevant file in `data/`
2. Add new intent object with `tag`, `patterns` array, `response` string
3. Include short patterns (single words), abbreviations, and verbose variants
4. Reload browser to see changes

### Modifying Matching Behavior

Edit `src/engine.js`:
- `threshold` — Lower = more matches, higher = stricter (default: 0.20)
- `ABBREVIATION_MAP` — Add new abbreviation expansions
- `DEFAULT_STOP_WORDS` — Add/remove stopwords
- Short-query boost multiplier — Adjust score scaling for 1-4 token queries

## License

UNLICENSED — All rights reserved.

## Credits

- **Institution** — Shree Devi Institute of Technology, Kenjar, Mangalore
- **Department** — Computer Science & Engineering
- **Data Source** — [sdit.ac.in](https://sdit.ac.in)
- **Background** — Educational chalkboard graffiti theme

---

**SDIT Assist** — Your guide to Shree Devi Institute of Technology.
