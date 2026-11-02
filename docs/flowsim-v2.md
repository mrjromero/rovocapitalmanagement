# FlowSim V2

Standalone, original expense-coverage planner in FlowSimV2.html. Open directly in Chrome or serve locally. Embedded CSS/JavaScript and SVG charts; no external runtime dependencies, account connections, storage or network calls. Generic hypothetical defaults only. Original FlowSim is unchanged.

## Model

Invest all take-home pay; finance all bills. Annual nominal price/pay/bill growth divided by 12 applies from month one. Distributions use price-grown opening investments before new pay or DRIP. Interest uses opening debt plus the current bill draw. Cash distributions pay interest, then principal; uncovered interest capitalizes. DRIP increases investments and never interest coverage. Cash remaining after debt clears is separate generated surplus (starts zero, earns no return, never funds bills).

Ending DTA excludes surplus. Coverage divides cash distributions by the modeled month's interest. Threshold equality passes; zero interest is N/A, and positive debt with zero investments is infinite DTA/Fail. Warnings never block draws or truncate the scenario. Net equity includes generated surplus. Each month reconciles equity change to pay minus bills plus price gain plus distributions minus interest. Taxes, fees, daily lender billing, eligibility, forced liquidation and payout sustainability are not modeled.

## Reference review (2026-11-02)

Reviewed https://expense-coverage-sim-43lw.bolt.host/ in Chrome using only synthetic inputs. Observed grouped sidebar, live updates, linked cash/DRIP split, four summary cards, balance chart, ledger, breach filter and mobile input drawer. No CSV or month-inspection control was observed. No source, branding or assets copied.

Synthetic probes revealed differences from requested V2 semantics: reference pay/bill growth starts month two; its distribution base includes newly invested pay; cash left after debt clears is reinvested. In a zero-income/distribution debt case, the reference displayed negative debt repaid and labeled charged interest as covered. V2 instead displays actual paid interest, capitalized interest and nonnegative principal repayment separately. Its requested timing is explained in the app.

## Validation

- node --test --test-isolation=none tests/flowsim-v2.test.cjs (12 passing tests)
- node tests/flowsim-v2-dom.cjs (requires jsdom; all assertions pass)
- Engine tests include independent first-month calculation and independent 60-month rollforwards at 0/30/100 percent cash, interest shortfall, continuing warning trajectory, surplus separation, zero rates/debt/assets, equality, fractional rates, invalid input, CSV units and no external runtime/storage/transmission.
- DOM checks cover linked allocation, presets, invalid-result clearing, warning filtering, CSV Blob content, four chart series, timeline/ledger agreement and reset.
- Actual Chrome: hand case confirmed month-one investments 13130, debt 2914.86, equity 10215.14. 30% cash/70% DRIP confirmed cash36.36, DRIP84.84, debt2999.70 and coverage1.21 Fail. Month60 inspection, 58/60 default breach filtering and invalid fractional-month clearing confirmed.
- Desktop width1665 and mobile viewport390x844 had no horizontal document overflow after fixing grid minimum sizing. Mobile input disclosure and summary layout visually checked.
- Browser control detached during final mobile chart/download check. Actual CSV download completion and final viewport reset are unverified; no completed download found. Automated CSV content test passes. Preview tab remained listed at http://127.0.0.1:8767/FlowSimV2.html.

No public push, merge or deployment is part of this local version.
