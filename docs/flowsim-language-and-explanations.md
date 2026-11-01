# Scenario explanations and terminology

This presentation-only change leaves the engine, routing policy unchanged; numeric presentation and the documented CSV format are updated. `explanations.js` reads the same results as the ledger. It does not infer an affordable loan or minimum outside income.

The three short paragraphs report equal-horizon net-equity difference, recorded limits/funding failures, and financed-share movement. Details disclose assumptions and scope. Failed paths never produce a full-horizon advantage. Differences below half a cent are described as equal to the nearest cent. Adaptive movement counts only transitions between funded months with nonzero bills. The first rise/fall can list accompanying changes, explicitly as observations rather than isolated causes. Recorded candidate rejection/search reasons are not a precise capacity attribution. Unknown cash, failed funding and numerical breaches remain distinct. Editing inputs hides the explanation until another valid run.

## Language decisions

| Concept | Presentation | Boundary preserved |
|---|---|---|
| Investments / debt | Freedom Engine investments / existing margin loan | Labels do not connect to an account or certify collateral eligibility. |
| Safety Buffer B2 | Safety Buffer B2 — modeled cash; B2 = Bucket 2 | Education may use invested reserves; this calculator accepts separate nonyielding cash only. No SGOV valuation, liquidation or settlement is modeled. |
| Minimum DSCR | DSCR (interest-only) consistently in the control, headline detail and audit ledger | General DSCR includes required principal plus interest. This FLOW margin scenario assumes no scheduled principal, so its denominator is interest only. Voluntary paydowns are not required debt service; other household debts are excluded. Capitalization still incurs interest expense and debt growth. Zero interest remains N/A. |
| DTA | Debt-to-Asset Ratio and DTA guardrail | Debt / investment assets, excluding separate cash; not M1 utilization, available borrowing or Margin Health. |
| Cash yield / APR | Distribution yield / margin loan APR | These are modeled rates, not MTY/MTI planning thresholds or live quotes. Price growth excludes distributions. |
| Paycheck cash | Household cash after financing / household cash allocated to investment | Pooled cash is not separately traced salary. Total investment may include excess distributions. |
| FLOW / Maximum Contribution | Systematic Bill Redirection as educational context | No claim to reproduce the full workflow, all-income contribution stage, contribution-first margin paydown or M1 sweep accounts. |

Authorized education-source review supplied the distinctions above. Private course links and proprietary excerpts are intentionally absent from this repository. Public broker references:

- [M1 Margin Loan Dashboard](https://help.m1.com/en/articles/9598312-m1-margin-loan-dashboard): utilization, available borrowing and Margin Health have broker-specific meanings.
- [M1 interest calculation and billing](https://help.m1.com/en/articles/9332232-how-m1-margin-loan-interest-is-calculated-and-charged): cash-first billing is distinct from the calculator's explicit cash/capitalization scenario policy.
- [M1 Margin Loans](https://help.m1.com/en/articles/9332210-what-is-a-margin-loan-and-how-they-work-on-m1): official product name.

CSV schema 2 rounds standalone numeric values to at most two decimals. Fractional percentage fields (DTA, financed share, APR and rate assumptions) become explicitly named `_pct` fields and are multiplied by 100; DSCR remains a multiple, not a percent. Monetary values remain dollars. This is a deliberate compatibility change: consumers must use the new header units. Flags retain full-precision engine decisions even when a displayed boundary rounds to the limit. Canonical configuration JSON preserves full-precision inputs for reproducibility; shock/policy JSON retains canonical units. Rounded ledger amounts may not sum to the cent and are not a full-precision reconciliation export. Other technical keys such as `paycheck_target_invested` and `portfolio_interest_coverage` remain. No new engine metadata, dependencies, network calls or storage. The subsequent UI sample update uses round household assumptions documented in flowsim.md; existing entered scenarios are not changed.

## Verification

Run `node tests/flowsim-explanations.test.js` for gain/loss/tie, unmatched stopped horizons, failed funding, unknown reserves, undefined ratios, adaptive stress transitions, zero bills and nonmutation. Run existing model suites directly with Node (or `node --test` where subprocess execution is permitted) plus all `tests/*.cjs` with jsdom available through `NODE_PATH`.


Numeric presentation uses whole-dollar headline cards, up to two decimals elsewhere and no unnecessary trailing zeros. Monetary inputs accept cents; a deliberate change rounds higher precision only on field commit and announces it. Initial/loaded values are not silently rewritten. Months remain integer-only. Engine values and threshold comparisons are never rounded.
