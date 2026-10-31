# FLOW Sim

`flowsim.html` is a client-only educational household ledger. It does not connect to financial accounts or execute any financial action. The initial household is synthetic; its values are not claims about a real person's account.

## Run

Serve this repository with a static server, for example `python3 -m http.server 8000`, then open `/flowsim.html`. Assets are local; there are no third-party scripts, fonts, analytics or requests. Inputs are not persisted. CSV is generated in the browser.

## Model and policies

The JavaScript engine independently matches a deterministic Python reference over 15 recorded scenarios. Both FLOW and pay-cash start with identical investments, debt, separate reserves, income, expenses and rate paths. Pay-cash disables only new bill borrowing; existing debt remains.

The default uses 36 months, $10,000 investments, no debt, $5,000 take-home, $3,500 bills, $900 initial borrowing, 7.390497057934528% annual cash yield, 2% annual **price-only** growth, 5.9% borrowing APR and 3.2% annual pay/bill growth. The financed fraction stays constant; $900 therefore increases with bill inflation. These are assumptions, not a current rate quote or recommended portfolio.

Each month uses annual rates divided by 12. Price changes/distributions apply to opening assets (after any shock). Interest applies to opening debt plus current bill borrowing for the full month. Direct bills and cash-paid interest reduce investable paycheck cash. Positive household cash is invested; remaining distributions repay debt; excess is reinvested. Capitalized interest remains an economic cost and adds debt. Month 1 uses the starting budget; pay and all bills grow thereafter.

The Safety Buffer B2 field represents separate available cash earning no yield, not invested SGOV or margin collateral. Entered cash reserves are held outside investments at a protected target. Under the explicit reserve-use policy they can fund a shortfall; future available cash rebuilds the target before allocation. Blank reserve means **unknown/excluded**; the numerical zero sensitivity is not factual zero savings. There is no automatic emergency pause or restart of borrowing. The combined stress can therefore show why continuing borrowing during income loss is dangerous.

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

Optional DOM test: install jsdom from the npm registry in a temporary dependency directory, then run `NODE_PATH=/path/to/node_modules node tests/flowsim-dom.cjs`. DOM integration was checked in JSDOM: default values, 36 rows, chart series, full/learning ledger, pay-cash view, repeated CSV downloads and readback, invalid routing, reset, stress, funding failure, zero APR, capitalized interest and reserve scenario. The monthly chart update was additionally checked in Chrome at desktop, 375px and 320px widths, with 36/60-month endpoints, keyboard inspection and legend toggles. Touch pointer mapping is covered by DOM tests; physical-device touch testing is not claimed.

No deployment workflow is added. Chart changes are confined to the FLOW simulator UI.

## Monthly chart inspection

Each plotted month has a marker. Hover or tap to select the nearest month; the persistent readout below the chart lists dollar values without an edge-clipped popup. The month slider supports arrow keys, Home and End. Click, tap, Space or Enter on a legend button to hide/show a series. The axis and readout use visible series; hiding every series shows a recovery prompt. Selection and legend state survive redraws. Stopped paths report N/A after their last calculated month. Chart controls never alter scenario inputs, the ledger, or CSV.

Run `node tests/flowsim-chart.cjs` with the same temporary jsdom dependency as the DOM suite. It covers 36/60-month endpoints, mouse/touch pointer mapping, all-hidden recovery, resize state, failed paths, and byte-identical CSV before/after chart interaction.

The always-visible Scenario guardrails section exposes the existing DTA guardrail (%) and Minimum DSCR (interest-only) inputs. DTA is debt divided by investment assets, excluding separate cash. In fixed mode, editing the threshold changes breach checks only. Adaptive mode also uses the threshold to screen new modeled bill financing; neither mode rebalances investments or represents lender maintenance limits.

Minimum DSCR (interest-only), expressed in multiples (x), is portfolio cash distributions divided by margin interest only. It excludes principal repayments and other household debt service. The underlying interest coverage calculation and output terminology are unchanged.

## Monthly ledger timeline

`View timeline` beside the dynamic ledger opens a native modal dialog inspired by Cashflow Stacker's month grid, horizontal colored bands and drill-down interaction. FLOW uses cash-flow categories and ending balances rather than inventing investment cohorts or daily timing. Each band cell spans one month; its text gives the dollar amount, not its width. All compared strategies read the same monthly result rows used by the ledger and CSV.

Hover, click/tap or keyboard focus selects a month. The slider, previous/next buttons, arrow keys, Page Up/Down (12 months) and Home/End support long horizons. A sticky month header and category column support horizontal scrolling; the detail panel moves below the grid on narrow screens. Escape closes the dialog and restores focus. Only the selected month's cells enter the tab order.

Failed-month snapshots are explicitly marked; later months have no projected amounts. Unknown reserves remain unknown/excluded. Undefined ratios and guardrail breaches are distinguished from modeled months. Values always refer to the last run, as described in the timeline, including when the main form has unrun edits.

Run `node tests/flowsim-timeline.cjs` with the existing temporary jsdom dependency via NODE_PATH. It verifies 36/60-month navigation, both strategies, keyboard and touch-click event handling, failed/stopped/invalid states, reserve semantics, undefined ratios, unchanged ledger/equity and byte-identical CSV. Chrome checks cover desktop, 375px and 320px, final-month inspection and Escape focus restoration. Physical touch-device testing is not claimed. No new runtime dependency or external service is used.

## Optional adaptive routing

Fixed share remains the default. Adaptive mode selects the highest tested amount on an explicit dollar grid using current opening state, additional stress screens, known accessible cash and actual cash-funding feasibility. Financing can shrink immediately; increases are bounded. See [the adaptive design](flowsim-adaptive-design.md) for timing, denominators and limitations. The financed-share band shows financed bills in gold and direct-paid bills in gray. Household cash allocated to investment and distribution coverage of all bills remain separate measures; financing more does not establish lower income dependence.

Adaptive comparisons add the original fixed share with the same initial debt, alongside pay-cash. New audit columns include pre-contribution peak debt and screening reasons. Fixed-mode cash accounting is unchanged; CSV now includes peak-risk measurements and consistent breach flags. Run `node --test tests/flowsim-adaptive.test.js` and `node tests/flowsim-adaptive-dom.cjs` (the latter uses the temporary jsdom dependency), as well as existing engine, DOM, chart and timeline tests.

## Review fixes and regression checks

`period_max_dta` and the path maximum now include opening, post-shock, pre-contribution borrowing peak and closing ratios. `observed_max_dta` preserves the prior opening/post-shock/closing measure. Peak financing debt/DTA appear for every strategy, including fixed and pay-cash. Monthly violations, timeline status, headline and CSV use the same engine measurement. Default sample months 10–26 breach the 25% guardrail; month 16 reaches 25.9989864%. No cash allocations or equity calculations changed.

The reset handler calls the native HTMLFormElement reset method explicitly because a control named/id reset masks form.reset in Chrome. Run `node tests/flowsim-review-fixes.cjs` with jsdom to emulate that masking and verify reset plus cross-surface peak reporting. Also verify in real Chrome: change income/months, click Reset sample, check 5000/36, 36 rows and $79,384.34 ending equity, with no console error.

Timeline instructions are expandable; an accessible compact selected-month summary sits above the grid on desktop and mobile. Household cash allocated to investment is an allocation from pooled available cash, not separately traced salary dollars, and does not imply reduced required income.

The 15 original Python fixtures still verify financial accounting. Risk fields intentionally superseded by peak reporting are checked separately against independently recomputed peak ratios and unchanged non-DTA violations. No reference fixture was rewritten.
