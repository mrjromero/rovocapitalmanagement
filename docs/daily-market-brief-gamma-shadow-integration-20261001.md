# Daily Market Brief — CarryPilot Gamma Shadow Integration

**Date:** 2026-10-01  
**Status:** Active synthesis contract  
**Daily Market Brief skill:** v1.2.0

## Purpose

Allow the Daily Market Brief to consume CarryPilot Gamma observe-only evidence without prematurely promoting Gamma inside CarryPilot Market Monitor.

## Source

When connected Google Sheets access is available, read the latest completed-session row from:

- Spreadsheet: **CarryPilot History**
- Tab: **CarryPilot_Gamma_Shadow**

The Daily Market Brief must not infer a Gamma state if the row is unavailable, malformed, or stale.

## Authority

- CarryPilot v1 remains the authoritative CarryPilot production status.
- Gamma remains an independent observe-only sensor.
- The Daily Market Brief may reconcile both because its job is synthesis, not reproduction of any one sensor.

## Minimum fields

Read:
- Run Timestamp
- Target Session
- Model Version
- Raw State
- Smoothed State
- Gate Reason
- v1 Score
- v1 State
- Disagreement
- Disagreement Reason
- Credit Phase
- Funding State / Evidence
- Capital State / Evidence
- Credit State / Evidence
- Market Stress State / Evidence
- Liquidity State
- Macro Catalyst State
- Structured JSON when available for provenance

## Interpretation rule

The Daily Market Brief should ask:

1. What is CarryPilot v1 saying?
2. What is Gamma saying?
3. Which Gamma channels explain any disagreement?
4. Do MacroRadar, MarketGuru, MarketGuruLite, direct market data, and current portfolio/account evidence confirm, contradict, or not address those channels?
5. What is the positive-carry consequence?
6. Do Spread management, Leverage posture, or Velocity of money routing actually need to change?

## Example

A valid synthesis can be:

- CarryPilot v1: NORMAL
- Gamma: WATCH
- Funding Plumbing: NORMAL
- Market Stress: NORMAL
- Capital Environment: WATCH
- Credit Conditions: WATCH

Plain-English interpretation:

> Markets and funding can remain orderly while the marginal economics of positive carry deteriorate through higher rates and wider credit spreads. That supports preserving optionality without declaring broad market stress.

This is not an automatic leverage or allocation instruction.

## Output policy

While Gamma is observe-only:
- do not add a permanent headline Gamma status to the user-facing brief;
- do use its channel evidence internally;
- name Gamma explicitly when the v1/Gamma disagreement is materially decision-relevant;
- preserve missing channels as insufficient evidence.

## Portfolio boundary

Any account-specific decision still requires current live portfolio evidence, including connected Freedom Engine state when available.

Gamma alone cannot determine:
- add/reduce leverage;
- LTV target;
- debt migration;
- Safety Buffer target;
- P1–P5 allocation changes.

## Acceptance

The integration is successful when the Daily Market Brief can explain divergences such as calm volatility plus deteriorating credit/rates without either:
- ignoring the deterioration because v1 is NORMAL; or
- overstating deterioration as broad stress merely because Gamma is WATCH.
