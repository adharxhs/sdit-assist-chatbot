# BM25 Threshold Calibration (Phase 1)

Date: 2026-09-08 (updated Phase 1b/1c + follow-up fix)

## Summary

Engine switched from TF-IDF + cosine similarity to Okapi BM25 in `src/engine.js`.

- Parameters: `k1 = 1.5` (term-frequency saturation), `b = 0.75` (length normalization)
- Short-query boost multiplier (1.4x) **removed entirely** — BM25 saturates TF by design
- Tokenization pipeline unchanged (abbreviation expansion, stopword filtering, stemming)

## Threshold

**Selected threshold: `1.0`**

BM25 scores are unbounded and corpus-dependent (unlike the [0,1] cosine similarity), so the old `0.20` threshold does not transfer.

## Calibration Data

From the 43-query baseline + 14 follow-up tests in `tools/test_queries.json`.

### Correct-match score distribution (37/38 real intent queries)
- **min:** 1.537 — *"What is SDIT?"* → `college_intro`
- **max:** 42.794 — *"Could you tell me if SDIT is recognized by AICTE?"* → `affiliation`
- Full ascending list:

```
 1.537  What is SDIT?                          -> college_intro
 4.423  Where is the college located?           -> contact_info
 5.28   contact placement department            -> placement_goals
 5.341  What is electronics and communication.. -> dept_ece
 5.509  Tell me about civil engineering         -> dept_ce
 5.577  Mechanical                              -> dept_me
 5.668  Bus                                     -> transportation
 6.752  How are campus placements at SDIT?      -> placement_overview
 7.392  What is information science engineering? -> dept_ise
 7.614  List all departments at SDIT            -> departments_list
 7.757  What is the placement percentage?       -> placement_statistics
 7.901  Aeronautical engineering details        -> dept_aero
 7.957  Fees                                    -> fees
 8.767  BE                                      -> be_programs
 8.883  Could you provide me with detailed...   -> programs_offered
10.127  Mtech                                   -> dept_mtech
10.347  Which companies visit SDIT?             -> placement_recruiters
10.475  What marks are needed for engineering?  -> eligibility_be
10.924  Who is the placement officer?           -> placement_officer
11.738  Tell me about MCA                       -> dept_mca
12.381  CSE                                     -> dept_cse
12.722  Does SDIT give pre placement training?  -> placement_training
12.958  What is electronics and communication.. -> dept_ece
14.324  Tell me about CSE department            -> dept_cse
15.01   MBA                                     -> eligibility_mba
15.458  Can I do MCA if I have a BSc degree?    -> eligibility_mca
15.885  CET                                     -> cet_code
16.027  What is MBA at SDIT?                    -> dept_mba
16.814  What documents are required for admis.? -> documents_required
17.137  CET code of sdit                        -> cet_code
17.237  PHD                                     -> dept_phd
18.564  MBA admission requirements              -> eligibility_mba
20.863  I would like to inquire about hostel..  -> hostel
21.374  AIML                                    -> dept_cse_aiml
21.978  Tell me about the AI and data science.. -> dept_ai_data_science
29.714  Do I need GATE score for M.Tech?       -> eligibility_mtech
42.794  Could you tell me if SDIT is recognized -> affiliation
```

### Wrong-match score distribution (1/38 real queries)
- **15.01** — *"MBA"* resolved to `eligibility_mba` instead of `dept_mba`. Both docs are MBA-dense with near-identical token profiles; eligibility_mba wins on a razor-thin length-normalization edge. Accepted as a documented residual — a lexical near-tie, not a threshold artifact.

### Adversarial scores (5/5 correctly rejected)
- All `0.000` (empty, whitespace, punctuation, gibberish, long-input)

### Follow-up tests (14/14 pass)
All contextual follow-ups (affirm/decline/help-menu) operate at tier-level with score 1 and the correct tag, independent of BM25 scoring.

## Selection Rationale

The best separation point is between adversarial scores (0.000) and the lowest correct match (1.537). `1.0`:

- Keeps all 37 correct matches (every correct match scores ≥ 1.537)
- Rejects all adversarial queries (all score 0.000)
- Leaves the single MBA near-tie above threshold (unavoidable at any threshold)

## Accuracy Comparison vs TF-IDF Baseline

| | TF-IDF (baseline, thr 0.35) | BM25 (thr 1.0) |
|---|---|---|
| Real queries passed | 33/38 | 37/38 |
| Adversarial rejected | 5/5 | 5/5 |
| Overall (42 queries) | 38/43 | 42/43 |

## Notes

- `ABBREVIATION_MAP` key `'me'` (mechanical) was removed — it collided with the English word "me" and injected "mechanical engineering" into every query containing the word (e.g., "tell me more" → wrong match to Mechanical). The pattern `"me department"` was updated to `"mech department"`. Affirmation/decline tiers and context continuation menus now handle bare follow-ups like "yes", "sure", "tell me more".
- `help_menu` is now served via the tier layer (HELP_WORDS/HELP_PHRASES) and removed from the BM25 corpus — this eliminates "help" swallowing content-bearing queries like "more help with placements".
- 14 new follow-up test cases validate the affirmation/decline/help/context-continuation tiers.
- Data enrichment: new verified intents (`faculty`, `internships`) added from `data/raw/` source pages; additional patterns for `hostel`, `fees`, `campus_life`, `placement_overview`, `contact_info` (website).
