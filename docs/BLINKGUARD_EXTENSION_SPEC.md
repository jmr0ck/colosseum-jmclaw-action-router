# BlinkGuard Browser Extension — V1 Spec

## Purpose
BlinkGuard should become a calm, trustworthy browser-side verification layer for crypto browsing.

Core promise:
- Check the **link**
- Check the **source behind the link**
- Help the user decide **before signing**

This extension should not try to be a generic antivirus or an always-yelling scam detector.
It should optimize for:
- clarity
- trust
- speed
- explainability
- educational value

## Product Thesis
People do not only get scammed by bad links.
They get scammed by **trusted-looking identities sending bad links** and by **normal-looking signing flows hiding risky intent**.

BlinkGuard V1 should therefore analyze:
1. **Destination risk** — the link/site/action itself
2. **Source risk** — the account/profile/context that sent the link
3. **Signing risk** — what the user appears to be approving

## V1 User Jobs
Users should be able to answer, quickly:
- What is this link?
- What looks risky?
- Is this source trustworthy?
- What am I about to approve/sign?
- What should I verify next?

## V1 Feature Set

### 1) Link Check (manual + context menu)
Entry points:
- Right-click any link → `Check with BlinkGuard`
- Click extension icon and paste a link manually

Output:
- Verdict: `Clean` / `Caution` / `High Risk` / `Unknown`
- 2–4 human-readable reasons
- A recommended next step

Rules:
- Never output a verdict without reasons
- Never claim certainty when confidence is low

### 2) Page Trust Context
When user is on a crypto-relevant page, the extension may show a compact badge/panel with:
- current domain
- domain consistency / spoofing signals
- urgency / suspicious CTA signals
- whether the page appears to be steering into a wallet action

UI principle:
- subtle by default
- no giant interruptive warnings unless risk is clearly elevated

### 3) Pre-Sign Explanation Helper
At signing/approval moments, BlinkGuard should summarize:
- what the request appears to do
- whether transfer / approval / authority / unknown behavior is involved
- the primary risk
- what to verify before signing

Required copy structure:
- `This appears to...`
- `Main risk...`
- `Before signing, verify...`

### 4) Source Trust Context (X-first)
For X/Twitter pages and posts, BlinkGuard should add source-level caution context.

Candidate signals:
- unusual handle-change frequency
- recent rename + outbound crypto CTA
- display-name / handle / domain mismatch
- account history vs current behavior mismatch
- urgency-heavy distribution behavior
- inconsistent linked destinations

Rules:
- Treat source signals as **caution context**, not proof of maliciousness
- Do not label accounts as “scam” based on weak heuristics
- Always prefer wording like `trust-risk signals detected`

### 5) Deep Analysis Handoff
The extension should always offer a path to full BlinkGuard analysis:
- `Open full analysis`
- `Check deeper`
- `View receipts`

The extension should remain lightweight; deeper analysis can happen in the main BlinkGuard surface.

## Trust Model
BlinkGuard should present risk as a combination of:
- **Source Risk**
- **Link Risk**
- **Behavior Risk**
- **Signing Risk**
- **Confidence**

### Recommended top-level states
- `Clean`
- `Caution`
- `High Risk`
- `Unknown`

Every result must include:
- why BlinkGuard thinks that
- what the user should verify next

## Sorsa Integration (X / source intelligence)
Sorsa should be treated as a **source intelligence layer**, not the final verdict engine.

Recommended role:
- enrich account/profile trust context
- provide account-history / rename / anomaly signals
- support source-level caution scoring

BlinkGuard should own:
- final user-facing verdict framing
- confidence wording
- explanation
- next-step guidance

### Principle
Sorsa provides evidence.
BlinkGuard explains what to do with it.

## UX Principles

### Calm, not theatrical
Good:
- `This account shows identity-change signals.`
- `We could not confidently determine intent.`
- `Verify before signing.`

Bad:
- `OMG scam detected`
- `100% safe`
- `Guaranteed malicious`

### Explainable by default
No black-box warning labels.
Every caution must have visible reasons.

### Educational, not just protective
Each interaction should teach one reusable lesson, e.g.:
- urgency is not proof
- familiar UI is not a safety signal
- permissions can be riskier than payments
- unknown intent = stop and verify

## Permissions Philosophy
V1 should request the minimum permissions needed.
Avoid broad, creepy, or hard-to-explain permissions.

Prefer:
- active tab
- context menus
- explicit site access where needed

Avoid by default:
- blanket read access on every site
- broad persistent scraping
- invasive background monitoring without clear user value

## Non-Goals (V1)
- generic antivirus behavior
- auto-blocking all risky pages
- guaranteed scam detection
- cross-platform support for every social network
- broad public scam scoring

## Success Criteria
A strong V1 should:
1. help users verify suspicious links in <10 seconds
2. reduce blind signing behavior
3. produce explanations users trust
4. avoid alert fatigue
5. reinforce BlinkGuard’s education-first brand

## Product Copy Lock
Primary CTA:
- **Verify before signing.**

Supporting positioning:
- BlinkGuard checks both the link and the source behind the link.
- Receipts over vibes.
- Clarity beats fear.

## Recommended Build Order
1. Link check popup + context-menu flow
2. Reason cards + trust labels
3. X source-trust context
4. Pre-sign explanation helper
5. Deep-analysis handoff

## Open Questions
- Which wallet/signing surfaces are realistically inspectable in-browser for V1?
- What Sorsa fields are available/reliable enough for source-trust context?
- Which destinations should be considered “crypto-relevant pages” for the passive page badge?
