# FLOW Sim

`flowsim.html` is a client-only educational household ledger. It does not connect to financial accounts or execute any financial action. The initial household is synthetic; its values are not claims about a real person's account.

## Run

Serve this repository with a static server, for example `python3 -m http.server 8000`, then open `/flowsim.html`. Assets are local; there are no third-party scripts, fonts, analytics or requests. Inputs are not persisted. CSV is generated in the browser.

## Model and policies

The JavaScript engine independently matches a deterministic Python reference over 15 recorded scenarios. Both FLOW and pay-cash start with identical investments, debt, separate reserves, income, expenses and rate paths. Pay-cash disables only new bill borrowing; existing debt remains.

The default uses 36 months, $10,000 investments, no debt, $5,000 take-home, $3,500 bills, $900 initial borrowing, 7.390497057934528% annual cash yield, 2% annual **price-only** growth, 5.9% borrowing APR and 3.2% annual pay/bill growth. The financed fraction stays constant; $900 therefore increases with bill inflation. These are assumptions, not a current rate quote or recommended portfolio.

Each month uses annual rates divided by 12. Price changes/distributions apply to opening assets (after any shock). Interest applies to opening debt plus current bill borrowing for the full month. Direct bills and cash-paid interest reduce investable paycheck cash. Positive household cash is invested; remaining distributions repay debt; excess is reinvested. Capitalized interest remains an economic cost and adds debt. Month 1 uses the starting budget; pay and all bills grow thereafter.

Entered cash reserves are held outside investments at a protected target. Under the explicit reserve-use policy they can fund a shortfall; future available cash rebuilds the target before allocation. Blank reserve means **unknown/excluded**; the numerical zero sensitivity is not factual zero savings. There is no automatic emergency pause or restart of borrowing. The combined stress can therefore show why continuing borrowing during income loss is dangerous.

Market stress applies an assumed 20% asset decline once, a persistent 25% yield reduction and a persistent 2-percentage-point APR increase at the selected month. Combined stress also sets take-home pay to zero for three months. These severities are scenarios, not probabilities.

Every month checks:

`change in equity = household surplus + economic return - interest - fees - taxes`

Debt/asset and interest-coverage limits are illustrative screens. Coverage is distributions / interest only, **not household DSCR**. A zero denominator is N/A, never an automatic pass. Funding or insolvency failures stop the path. Breaches flag a path but do not simulate lender liquidation. Comparisons at different/failing horizons are undefined.

The default month 36 ends with investments $101,456.89, debt $22,072.55 and equity $79,384.34, compared with pay-cash equity about $78,176.70. These rounded reference values are examples, not forecasts. The baseline is not stress-approved capacity.

## Limits

Taxes/fees, scheduled principal payments, exact daily timing, lender eligibility/maintenance and real dividend schedules are not modeled in the UI. Yield is not proof of sustainable economic return. Separate reserves, hypothetical checks and a completed run cannot certify safety. Noindex is a crawler hint, not privacy or access control.

## Verification

Run calculation and regression tests with:

```
node --test tests/flowsim.test.js
```

The 43 tests include 15 Python-generated reference cases (cash/capitalized interest, existing debt, market shocks, zero APR/yield, negative returns, cash/access gaps, reserves, asset sales, inflation, actual day counts, and monthly paths), monthly identity checks, invalid input and overflow.

Optional DOM test: install jsdom from the npm registry in a temporary dependency directory, then run `NODE_PATH=/path/to/node_modules node tests/flowsim-dom.cjs`. DOM integration was checked in JSDOM: default values, 36 rows, chart series, full/learning ledger, pay-cash view, repeated CSV downloads and readback, invalid routing, reset, stress, funding failure, zero APR, capitalized interest and reserve scenario. Browser-level visual/mobile rendering remains unverified in the current environment because Chromium launch is restricted and the cloud browser cannot reach the local server. Responsive styles are supplied but this is not a claim of visual QA.

No deployment workflow is added and no existing site files are changed.
