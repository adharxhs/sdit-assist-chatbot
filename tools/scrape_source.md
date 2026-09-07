# Data Sourcing Map (dev-time only)

Resolved canonical URLs for `https://sdit.ac.in`, verified 200 on 2026-09-07.
Raw text lives in `/data/raw/<file>.txt`. Fetch at dev-time only; never ship a fetch.

| Raw file | Canonical URL | Notes |
|---|---|---|
| `college-about.txt` | `/about/` | |
| `college-vision-mission.txt` | `/vision-mission/` | |
| `college-campus.txt` | `/campus/` | |
| `dept-cse.txt` | `/computer-science-engineering/` | `/cse/` + `/computer-science/` redirect here |
| `dept-cse-aiml.txt` | `/cseartificial-intelligence-machine-learning/` | |
| `dept-ise.txt` | `/information-science-and-engineering/` | |
| `dept-ai-ds.txt` | `/artificial-intelligence-data-science/` | hyphenated form is 404 |
| `dept-me.txt` | `/mechanical-engineering/` | |
| `dept-ce.txt` | `/civil-engineering/` | |
| `dept-ece.txt` | `/electronics-and-communication-engineering/` | |
| `dept-aero.txt` | `/aeronautical-engineering/` | |
| `dept-mba.txt` | `/master-of-business-administration/` | `/mba/` and `/mba-brochure/` are a PDF stub; `mba-brochure.pdf`/`.txt` kept separately |
| `dept-mca.txt` | `/master-of-computer-application/` | `/mca/` redirects to a brochure |
| `dept-mtech.txt` | `/m-tech-construction-technology/` | |
| `dept-phd.txt` | `/research-centrephd/` | |
| `admissions-eligibility.txt` | `/eligibility/` | |
| `admissions-application-form.txt` | `/application-form/` | |
| `campus-sports.txt` | `/sports/` | |
| `placement-message-from-tpo.txt` | `/message-from-tpo/` | |
| `placement-about.txt` | `/about-the-placement/` | |
| `placement-training.txt` | `/placement-training/` | |
| `placement-companies.txt` | `/category/company/` | recruiter list |

Note: `dept-*` files include site nav/footer boilerplate — content extraction starts at the page heading. Validate any figure (placement %, fees, dates) against the raw file before putting it in a `response`.