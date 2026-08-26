---
name: daily-market-brief
version: 1.0.0
description: Produce a verified, decision-oriented market briefing in Pre-Market, Intraday, or Post-Market mode, with a canonical dashboard, cross-asset interpretation, portfolio implications, catalysts, regime triggers, and explicit confidence/verification notes. Designed to be portable across AI platforms with web/research access.
---

# Daily Market Brief

## Purpose

Create a concise but analytically rigorous market briefing that converts current market data into a decision framework rather than merely listing headlines. The briefing must distinguish verified facts from interpretation, cite current credible sources, explicitly identify unavailable or unconfirmed information, and connect market conditions to the user's portfolio or strategy when portfolio context is supplied.

The skill supports three session modes:

1. **Pre-Market Brief** — before the U.S. cash equity open.
2. **Intraday Brief** — while U.S. markets are open.
3. **Post-Market Brief** — after the U.S. cash equity close.

If the user does not specify a mode, determine it from the current U.S. Eastern Time:
- Pre-Market: before 9:30 a.m. ET.
- Intraday: 9:30 a.m.–4:00 p.m. ET on U.S. trading days.
- Post-Market: after 4:00 p.m. ET.

On weekends or U.S. market holidays, label the report **Market-Closed Brief** and focus on the most recent close, developments since that close, futures when available, global markets, and the next scheduled U.S. session.

## Core Operating Principles

### Truth and verification

- Use live/current research whenever tools permit.
- Verify numerical readings from credible, preferably primary or institutional sources.
- Cite factual claims and current readings.
- Never invent unavailable values.
- If a requested indicator cannot be reliably verified, write **“I cannot confirm this”** or **“Unconfirmed”** and omit it from quantitative conclusions.
- Distinguish clearly among:
  - observed data,
  - calculated values,
  - market interpretation,
  - portfolio recommendation.
- State the report's confidence level and explain material limitations.
- For calculations, show the formula or enough arithmetic that the result can be independently checked.

### Decision orientation

Do not produce a generic news digest. Answer these questions:

1. What regime is the market in now?
2. What changed since the prior relevant session?
3. Are risk, volatility, rates, liquidity, and credit confirming one another or diverging?
4. What matters most over the next several hours/session?
5. What does the environment imply for portfolio risk, leverage, liquidity, and new capital deployment?
6. What observable developments would change the conclusion?

### Source hierarchy

Prefer, when applicable:

1. Government and official institutions: Federal Reserve, U.S. Treasury, BLS, BEA, Census, CFTC, OECD, SEC.
2. Exchange/index/data publishers: Cboe, CME, S&P Dow Jones Indices, Nasdaq, NYSE, ICE.
3. Company investor-relations releases and regulatory filings for company-specific events.
4. Established financial news organizations and reputable market-data providers.
5. Sentiment publishers for proprietary indicators, such as CNN Fear & Greed and AAII.

Avoid relying on unsourced social-media posts, stale snippets, or secondary summaries when authoritative data is available.

## Required Research

Gather as many of the following as can be reliably confirmed. Use the latest observation appropriate to the report's session and note publication lags.

### Equity market

- S&P 500
- Nasdaq Composite and/or Nasdaq-100
- Dow Jones Industrial Average
- Russell 2000
- Current futures in Pre-Market mode
- Intraday percentage moves in Intraday mode
- Closing percentage moves in Post-Market mode
- Breadth/participation when reliable data is available

### Volatility and positioning

- VIX level and direction
- VIX term structure when available
- Cboe SKEW when available
- Equity put/call data when available
- Dealer gamma/GEX only if obtained from a credible and sufficiently current source; otherwise mark unconfirmed

### Sentiment

- CNN Fear & Greed headline score and classification
- Important Fear & Greed subcomponents when available
- AAII bullish/bearish/neutral readings and bull-bear spread
- Other institutional sentiment measures only when useful and current

### Rates and funding

- U.S. 2-year Treasury yield
- U.S. 10-year Treasury yield
- U.S. 30-year Treasury yield
- 2s10s curve or another relevant curve measure
- SOFR or other relevant funding benchmark
- Direction of yields relative to the previous session
- Upcoming Federal Reserve catalysts

### Credit

- Investment-grade and high-yield conditions
- HYG/LQD or equivalent liquid proxies when appropriate
- Credit spreads when reliably available
- Junk-bond demand/sentiment component when available

Do not infer a precise credit-spread signal solely from ETF price movement if direct spread data is available. If reliable current credit data cannot be found, say so.

### Commodities / macro cross-assets

At minimum when relevant:
- WTI and/or Brent crude
- Gold
- U.S. Dollar Index or a suitable dollar proxy

Add other cross-assets only when they materially explain the market regime.

### Macro / catalysts

Identify today's or the next session's important scheduled events, including:
- CPI/PCE/PPI
- employment data
- GDP
- retail sales
- ISM/PMI
- Treasury auctions
- Federal Reserve speeches/meetings/minutes
- major earnings capable of affecting indexes or market narrative
- geopolitical or policy developments with demonstrated market relevance

Use exact times and Eastern Time when confirmed.

## Analytical Framework

### Regime classification

Assign one headline regime using one of these labels or a similarly precise formulation:

- 🟢 Constructive / Risk-On
- 🟡 Constructive but Selective
- 🟡 Neutral / Mixed
- 🟠 Defensive / Deteriorating
- 🔴 Risk-Off / Stress

Do not determine the regime from a single indicator. Synthesize equities, breadth, volatility, rates, credit, sentiment, and relevant cross-assets.

### Divergence analysis

Explicitly identify meaningful disagreements among indicators. Examples:

- low VIX but weak breadth,
- rising indexes but deteriorating credit,
- bullish sentiment but weak momentum,
- falling yields accompanying growth fears rather than benign disinflation,
- strong megacap indexes but weak small caps,
- strong price action with increasingly extreme positioning.

Divergences are often more decision-useful than headline index direction.

### Portfolio translation

If the user supplies portfolio characteristics, integrate them directly. Relevant inputs may include:

- portfolio cash distribution yield,
- borrowing rate,
- future borrowing-rate changes,
- current LTV,
- lender maintenance/forced-action threshold,
- DSCR or interest-coverage requirement,
- monthly fresh capital,
- tax assumptions,
- portfolio beta/volatility,
- liquidity reserve,
- allocation constraints.

Calculate relevant economics where possible.

#### Positive-carry calculations

Gross carry spread:

`Portfolio cash yield − borrowing rate`

Example:

`15.50% − 4.15% = 11.35 percentage points`

If borrowing costs change:

`15.50% − 5.65% = 9.85 percentage points`

Carry-spread compression:

`11.35 − 9.85 = 1.50 percentage points`

Relative compression:

`1.50 / 11.35 = 13.2%`

When taxes, deductibility, or distribution composition matter, state exactly which simplified assumptions are being used rather than implying tax precision.

#### Leverage principle

Never equate the lender's maximum allowable LTV with an optimal LTV. Evaluate the distance to forced action, volatility risk, cash-flow coverage, borrowing cost, fresh-capital inflows, and event risk.

Where appropriate, classify the tactical portfolio posture using language such as:

- ADD RISK / ADD LEVERAGE
- HOLD
- HOLD / DON'T CHASE LEVERAGE
- DEPLOY FRESH EQUITY FIRST
- REDUCE LEVERAGE
- DEFENSIVE / PRESERVE LIQUIDITY

Explain why.

## Output Format

Preserve the following structure. Adapt individual fields to the session mode, but do not turn the report into a long list of headlines.

# [Pre-Market | Intraday | Post-Market | Market-Closed] Daily Brief — [Day, Month DD, YYYY]
**[Session descriptor] | [current time] ET**

## Decision Snapshot

**Regime: [emoji + concise regime]**

In 1–3 compact paragraphs, state:
- the most important market move,
- the dominant current/next catalyst,
- the immediate portfolio posture.

Use a bold line such as:

**Portfolio posture: HOLD / don't chase leverage.**

The exact recommendation must come from the evidence, not from this example.

---

## Executive Interpretation

Explain what the market is actually communicating beneath the headlines. Compare volatility, sentiment, breadth, credit, rates, and index behavior.

Highlight the key synthesis in a short blockquote when useful, for example:

> **Risk appetite remains intact, but participation is not broad enough to justify an indiscriminate risk-on posture.**

Do not reuse this conclusion mechanically; derive it from current evidence.

---

## Canonical Dashboard

Create a compact table:

| Indicator | Current reading | Signal |
|---|---:|---|
| S&P 500 | ... | 🟢/🟡/🔴 |
| Nasdaq / Nasdaq-100 | ... | ... |
| Russell 2000 | ... | ... |
| VIX | ... | ... |
| Fear & Greed | ... | ... |
| AAII Bull / Bear | ... | ... |
| 2Y Treasury | ... | ... |
| 10Y Treasury | ... | ... |
| 30Y Treasury | ... | ... |
| SOFR / funding | ... | ... |
| Credit | ... | ... |
| Oil | ... | ... |

Add/remove rows based on reliable data and relevance. Do not fabricate completeness.

The traffic-light signal represents the indicator's implication for the current risk/carry environment, not whether the raw number itself is inherently “good” or “bad.” Explain unusual classifications.

---

## Analytical Lenses

Use compact prose under these bold labels:

**Equity / volatility:** Interpret index behavior, breadth, VIX, positioning, and concentration.

**Rates / funding:** Explain Treasury/funding movements and their implications for duration, valuation, and leveraged carry.

**Credit:** Determine whether credit confirms or contradicts equities. Explicitly state when current spread information cannot be confirmed.

**Cross-assets / macro:** Include only when oil, dollar, gold, commodities, or macro developments materially affect the regime.

---

## Portfolio Decision

Translate the market regime into the user's portfolio/capital structure.

Where relevant:
- calculate current gross carry spread,
- calculate prospective spread after known funding-rate changes,
- assess LTV headroom,
- assess DSCR/interest coverage,
- incorporate scheduled fresh capital,
- distinguish deploying new equity from borrowing more,
- distinguish maintaining leverage from increasing leverage.

End with a clear sequence of preferred actions when useful, e.g.:

**Hold existing leverage → deploy fresh capital → preserve LTV headroom → reassess incremental borrowing after the catalyst.**

This is a format example, not a standing recommendation.

---

## Today's Catalyst Map

List only market-relevant catalysts. Include exact confirmed times in ET and explain why each matters.

For Post-Market mode, this section should become **Next-Session Catalyst Map** and focus on overnight and next-session events.

---

### Next-Session Triggers

Define observable regime-change conditions:

**🟢 Constructive:** Specify the combination that would justify more risk.

**🟡 Hold:** Specify the combination consistent with maintaining the current posture.

**🔴 Defensive:** Specify the combination that would require preserving liquidity, reducing leverage, or otherwise lowering risk.

Use combinations rather than single-variable triggers whenever possible. For example, a Nasdaq decline alone is generally less informative than equity weakness + VIX expansion + rising yields or worsening credit.

## Bottom line

Finish with 2–5 concise paragraphs or sentences that state:
- the core market conclusion,
- the portfolio implication,
- what would change the conclusion.

Then state:

**Confidence: [High / Moderate-high / Moderate / Low]** — [brief reason, including missing/unconfirmed indicators].

## Session-Specific Instructions

### Pre-Market Brief

Primary objective: decide how to enter the U.S. session.

Emphasize:
- prior U.S. close,
- overnight Asia/Europe when material,
- U.S. equity futures,
- overnight Treasury/yield moves,
- VIX/futures when available,
- pre-market oil/dollar/gold,
- scheduled economic releases,
- major earnings before/after close,
- whether to change leverage/risk before catalysts.

Prefer delivery sufficiently before the open to permit action while still capturing overnight information. Around 7:30–8:15 a.m. ET is generally useful, but adapt to the user's workflow and major 8:30 a.m. releases.

### Intraday Brief

Primary objective: determine whether the morning thesis is being confirmed or invalidated.

Emphasize:
- live index performance,
- market breadth,
- sector leadership,
- VIX change,
- Treasury reaction,
- credit confirmation,
- reaction to completed macro releases,
- whether price action is trend-confirming or reversing,
- remaining afternoon catalysts,
- whether the portfolio posture should change now.

Explicitly compare current conditions with the pre-market thesis if a prior brief is available. Identify what changed.

Use language such as:
- **Pre-market thesis confirmed**
- **Partially confirmed**
- **Invalidated**

Only use these when a prior thesis is actually known.

### Post-Market Brief

Primary objective: explain what actually drove the session and prepare for the next one.

Emphasize:
- closing index returns,
- breadth and leadership,
- VIX close/change,
- Treasury close/change,
- credit behavior,
- major macro/earnings reactions,
- whether the session strengthened or weakened the prevailing regime,
- implications for leverage and next capital deployment,
- after-hours earnings/events,
- next-session catalysts.

Include a short **Session Verdict** near the top, such as:

**Session verdict: constructive confirmation / mixed confirmation / regime deterioration.**

Derive it from the data.

## Continuity and Historical Trajectory

If prior briefing data or a historical log is available, use it. Do not treat each report as isolated.

Track changes in:
- regime classification,
- VIX,
- Fear & Greed,
- AAII spread,
- Treasury yields,
- curve shape,
- credit conditions,
- breadth,
- oil/dollar,
- portfolio carry spread,
- LTV and coverage when available.

Prioritize trajectory over one-day noise. Call out meaningful transitions such as:
- VIX rising for several sessions while indexes remain near highs,
- credit weakening before equities,
- breadth improving beneath flat indexes,
- yields falling for benign disinflation versus recessionary reasons,
- portfolio LTV improving through capital contributions rather than asset appreciation.

Never claim a trajectory unless prior observations are actually available.

## Optional Portfolio Configuration

Platforms implementing this skill may maintain a user-specific configuration such as:

```yaml
portfolio:
  cash_distribution_yield: null
  current_borrow_rate: null
  scheduled_borrow_rate_changes: []
  effective_tax_rate: null
  interest_deductible: null
  current_ltv: null
  lender_forced_action_ltv: null
  minimum_dscr: null
  monthly_fresh_capital: null
  liquidity_reserve: null
  portfolio_beta: null
  notes: null
```

If a field is unknown, do not invent it. Ask only when the missing value is necessary for a requested calculation; otherwise produce the market brief and mark the portfolio-specific calculation unavailable.

## Quality-Control Checklist

Before finalizing every brief, verify internally:

- Is the session label correct?
- Are current readings actually current for this session?
- Are all important factual claims sourced?
- Did I accidentally mix yesterday's close with today's live reading without labeling them?
- Did I distinguish percentage points from percent changes?
- Did I verify event times and time zone?
- Did I avoid inventing unavailable indicators?
- Did I identify meaningful divergences rather than merely summarize headlines?
- Does the portfolio recommendation logically follow from the data?
- Did I state what would invalidate the recommendation?
- Did I include a confidence assessment and limitations?
- Is the report compact enough to be decision-useful?

## Example Invocation Prompts

**Automatic mode**

`Daily Brief`

Determine the appropriate session mode from current Eastern Time and generate the full briefing.

**Explicit Pre-Market**

`Run the Pre-Market Daily Brief. Use live data, verify all readings, and translate the regime into my portfolio leverage decision.`

**Explicit Intraday**

`Run the Intraday Daily Brief. Compare the live market with this morning's thesis and tell me whether the portfolio posture should change.`

**Explicit Post-Market**

`Run the Post-Market Daily Brief. Explain what drove today's session, whether the regime changed, and what I should watch before the next session.`

## Final Constraint

The goal is not prediction for its own sake. The goal is **decision quality under uncertainty**. A successful brief tells the user what is known, what the market is signaling, where signals disagree, what that means for the portfolio, and which observable developments would justify changing course.
