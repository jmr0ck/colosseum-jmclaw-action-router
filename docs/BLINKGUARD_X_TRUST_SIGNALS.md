# BlinkGuard X Trust Signals — Product Spec

## Purpose
A large share of crypto scam discovery begins on X.
Users do not only need link verification; they also need **source trust context** for the account pushing the link.

BlinkGuard should help answer:
- Does this source look trustworthy?
- Are there identity or behavior signals that raise caution?
- What should I verify before clicking or signing?

## Positioning
BlinkGuard should never present weak social heuristics as proof of maliciousness.

Correct framing:
- `This account shows trust-risk signals.`
- `Proceed with caution.`
- `Verify via official sources.`

Incorrect framing:
- `This account is a scam.`
- `Guaranteed malicious.`

## X-Specific Signals (V1)

### 1) Handle change frequency
Useful because repeated handle changes can indicate:
- account recycling
- post-hack repurposing
- impersonation shifts
- narrative pivots into crypto bait

Recommended wording:
- `This account has changed handles unusually often.`

### 2) Recent rename + outbound crypto CTA
Higher-signal than rename alone.

Recommended wording:
- `Recent identity change combined with outbound crypto CTA increases caution.`

### 3) Display name / handle / linked domain mismatch
Useful for impersonation detection.

Examples:
- project-like display name but off-handle
- handle implies one brand, links point elsewhere
- identity claims not corroborated by linked destinations

Recommended wording:
- `Identity signals are inconsistent across name, handle, and linked destination.`

### 4) Behavior-history mismatch
Examples:
- dormant or unrelated account pivots sharply into crypto promotions
- long-standing profile suddenly pushes urgent claim/mint/support flows

Recommended wording:
- `Current posting behavior differs sharply from the account’s earlier profile history.`

### 5) Linked destination inconsistency
Examples:
- profile bio links and tweet links disagree
- official-looking identity with non-matching destination domains

Recommended wording:
- `Linked destinations are inconsistent with the stated identity.`

### 6) Urgency-heavy distribution patterns
Examples:
- repeated limited-time CTAs
- “final call” / “claim now” / “support DM” patterns
- repetition across replies or quote posts

Recommended wording:
- `Urgency-driven distribution behavior increases caution.`

## Trust Context Model
BlinkGuard should present a compact **Trust Context** section on X pages.

Recommended categories:
- Identity consistency
- Handle-change risk
- Destination consistency
- Distribution behavior
- Confidence

## Suggested Output Model
Top-level states:
- `Clean`
- `Caution`
- `High Risk`
- `Unknown`

Every result must include:
- reason(s)
- one recommended next action

Example:

Verdict: `Caution`

Reasons:
- recent handle changes detected
- identity and linked destination do not cleanly match
- outbound crypto CTA pattern is elevated

Next step:
- verify the official domain from project docs before clicking or signing

## Sorsa Integration Role
Sorsa is a good fit for **source/account intelligence** if the data quality is reliable.

Recommended Sorsa scope:
- account history enrichment
- rename / identity-change context
- anomaly signals
- source credibility evidence

BlinkGuard should own:
- final user-facing verdict wording
- confidence framing
- instructional guidance
- actionable next step

### Principle
Sorsa is evidence.
BlinkGuard is judgment framing.

## UX Rules
- no public “scammer score” in V1
- no accusations from weak heuristics
- no alert without reasons
- no certainty beyond evidence

## Education Tie-In
Every X trust result should reinforce one reusable lesson, e.g.:
- A verified-looking account is not the same as a verified source.
- A renamed account pushing a claim link deserves caution.
- Familiar branding can still route to the wrong domain.

## V1 Scope Recommendation
Implement only:
1. X profile-page trust context
2. X post-with-link trust context
3. pre-click caution when outbound crypto links are present
4. deep-analysis handoff into BlinkGuard main analysis surface

Do not attempt all social platforms at once.

## KPI Impact Hypothesis
If implemented well, X trust signals should increase:
- perceived product usefulness
- save/share quality for educational content
- trust in BlinkGuard’s brand authority

The goal is not fear amplification.
The goal is better source verification behavior.
