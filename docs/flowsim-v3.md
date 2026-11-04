# FlowSim V3

`FlowSimV3.html` is a self-contained educational scenario app: inline CSS, SVG chart, pure JavaScript calculation engine and separate rendering script. Open it directly in a modern browser. There are no runtime dependencies, accounts, network calls or persistent storage. Input values exist only in browser memory. CSV and PDF exports remain local until the user chooses to share them.

This implementation follows the reviewed specification for https://expense-coverage-sim-43lw.bolt.host/. It does not reuse V2's different calculation order or target-DTA routing. No existing simulator is modified.

## Calculation contract

The pure `window.FlowSimV3.simulate(config)` function accepts percentage inputs as numbers (7.35 means 7.35%, not 0.0735), merges omitted inputs with synthetic defaults, validates without mutating the caller, and returns the complete ledger, summary totals, warnings and extrema. The engine is isolated in `<script id="engine">` so tests can execute it independently. Presentation helpers and CSV serialization are separate from simulation; the UI is in `<script id="ui">`.

For month `m`, starting at 1:

1. Bills = initial monthly bills × `(1 + inflation / 1200)^(m − 1)`. Pay uses the same formula with pay growth. There is no pay/bill growth in month 1.
2. Opening investments grow by `opening investments × price growth / 1200`.
3. Pick the phase: a nonzero freedom start at or before `m` wins; otherwise a nonzero deleveraging start at or before `m` applies; otherwise FLOW. Starts are inclusive. Zero disables a phase. Warn when freedom prevents deleveraging or a phase starts beyond the horizon.
4. FLOW adds the entire pay amount to investments and finances all bills through debt. Deleveraging pays `min(pay, bills)` in cash, adds any bill shortfall to debt, pays debt down using income surplus, and invests surplus beyond full debt payoff. Freedom sets pay to zero and finances all bills through debt.
5. Total distributions = investment balance after growth and current-month routing × yield / 1200. Split into reinvested distributions and cash distributions using complementary percentages.
6. Interest = debt after financing and paycheck-surplus paydown × APR / 1200. Cash distributions pay interest first. Any unpaid interest is capitalized. Remaining cash pays principal, capped at debt. Cash beyond full payoff is reinvested along with the allocated reinvested distributions. No distribution is counted twice.
7. Net equity = ending investments − ending debt. DTA = ending debt / ending investments. Coverage = cash distributions / interest charged. Coverage is specifically margin-interest coverage, not household debt-service coverage.
8. Test ending DTA against its maximum and finite coverage against its minimum. Strictly outside the threshold fails; equality passes. A breach never changes the modeled routing or prevents borrowing. Extrema retain the earliest month in a tie.

Full precision is retained internally and in CSV values. Currency, ratios and percentages are rounded only for display. A useful accounting invariant tested for every month is:

`change in equity = price gain + pay − bills + total distributions − charged interest`.

## Validation and edge cases

- Financial inputs and thresholds must be finite and nonnegative, except negative price growth is allowed. Price growth below −1200% is rejected because the monthly multiplier would be negative; annual price growth at or below −100% produces an explicit extreme-assumption warning. Monthly division is not an effective annual growth convention.
- Allocations are 0–100% and total 100%. Editing either percentage or the slider updates its complement. The engine rejects inconsistent allocations.
- UI month inputs round to the nearest integer. The engine requires integer horizons 1–600 and phase starts 0–600. Blank, out-of-range or non-finite inputs clear the prior projection and disable exports.
- Zero charged interest produces N/A coverage and no coverage breach. If there is no finite coverage in any month, the minimum is N/A with no month number.
- Zero investments produce N/A DTA, a warning and an incomplete assessment rather than an invented safe ratio. A simultaneous finite coverage breach is still flagged. Undefined-only rows do not enter the breach filter; the banner explicitly identifies the incomplete assessment.
- Full debt payoff reinvests excess distributions; principal repayment never becomes negative. Paycheck surplus debt paydown is recorded separately from distribution principal repayment.
- Extreme assumptions that produce non-finite balances, ratios or cumulative totals stop the projection with a clear error. Negative net equity is valid and remains visible; negative investments are not presented as a meaningful result.

## Interface and exports

Desktop has a stationary header and independently scrolling 340px parameter sidebar and results region. Mobile stacks parameters above results; the ledger scrolls horizontally. Native labeled inputs, visible focus styles, keyboard/touch disclosure explanations and an accessible month slider provide non-pointer paths to the chart data. Pointer movement also updates month inspection. The chart includes phase markers and an accessible description; the full ledger contains all chart data.

CSV always includes the full scenario assumptions and all months, regardless of the visual breach filter. Columns use explicit USD, percentage and ratio units, and undefined values are N/A.

The PDF control opens the native print dialog. Choose **Save as PDF**. The print report includes title, generation date, all assumptions, methodology and every month. To keep text readable, the ledger is split into two tables joined by month/phase: cash routing and ending balances. It uses landscape A4, repeating headers and row break protection. This is a deliberate implementation choice instead of an external PDF dependency or automatic binary download. Printing through the browser menu uses the same report.

Reset restores every model default, inspection month and allocation slider, and clears the breach filter. It does not close explanatory disclosures the user opened.

## Reference corrections and boundaries

Corrected defects: reset/filter state; charged versus actually paid versus capitalized interest; negative “Debt Repaid”; cash-paid expenses mislabeled as financed; and a zero-interest minimum shown at month 0. The underlying specified routing is preserved. The KPI principal total includes cash-distribution sweeps only, with paycheck surplus shown separately in the ledger.

The app uses no optimizer, target-DTA strategy, investment selection or personalized recommendation. Taxes, fees, rate changes, volatility, loan eligibility, liquidation rules and real broker daily-interest conventions are omitted. Freedom is a scenario assumption, not proof of sustainable spending or financial independence. Passing modeled thresholds is not lender approval.

The reference's unverified mobile/hover behavior is implemented as the reviewed usability requirement, not represented as a pixel-identical reconstruction. PDF uses native printing as described above. No deployment is part of this change.

## Validation

Node 24 commands, from the repository root:

```sh
node --test --test-isolation=none tests/flowsim-v3.test.cjs
# Install jsdom in an isolated directory and expose its node_modules with NODE_PATH:
node tests/flowsim-v3-dom.cjs
# Optional browser check; requires Playwright and Chromium or FLOWSIM_BROWSER:
node tests/flowsim-v3-browser.js
```

Browser script configuration: `FLOWSIM_BROWSER` supplies an Edge/Chromium executable; `FLOWSIM_ARTIFACTS` selects a screenshot/PDF output folder (default: sibling `qa` folder outside the repository). The existing CI workflow picks up the V3 unit and DOM tests. Optional real-browser validation is run locally, not added as a CI dependency.

Verified locally: 15 engine tests covering acceptance fixtures A–E, exact threshold equality, zero assets, full payoff, insufficient pay, phase order, negative growth, 1/600 months, decimal rates, conservation, validation, complete CSV and absence of network/persistence code. DOM checks cover live recalculation, complementary allocation, rounding, invalid clearing, filter/reset, all-month CSV/print report and accessible labels. Headless Edge checks desktop and 390px mobile, document overflow, keyboard disclosure and slider navigation, chart markers, 600 ledger rows, actual CSV download, PDF generation, no page errors and no network requests.

Verified default 60-month results: ending investments **$2,750,000.00**, ending debt **$828,978.30**, ending equity **$1,921,021.70**; principal swept from cash distributions **$644,662.53**, charged/paid interest **$127,454.97**, capitalized interest **$0.00**. Peak DTA **30.14%** and minimum coverage **5.66×**, both month 60.

Independent decimal arithmetic for fixture B gives month 2 investments 127689.4308 and debt 10973.6692; month 3 investments 131621.15673354 and debt 11438.57426646. Fixture C gives month 2 investments 125679.4308 and debt 8963.6692; month 3 investments 127570.90623354 and debt 9428.62476646. These match the specification's approximate figures.
