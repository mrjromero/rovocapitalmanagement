# FLOW V4 · Contribution Roadmap

Open `FlowSimV4.html` directly in a browser. All CSS, calculation code and UI are in this one file. No dependencies, storage, analytics, accounts or network calls are used. CSV and print-to-PDF exports are local. This is a deterministic educational model, not a borrowing recommendation or an M1 integration.

V4 is separate from V2 and V3. V3 is renamed **Fixed Financing Simulator** in its visible and browser titles; its engine remains byte-identical. V2 is unchanged.

## Five descriptive stages

1. **Foundation:** no recurring bills are financed; available wages may build investments. An optional upfront contribution is a transfer from explicitly entered starting cash, before month 1. Starting investments are never counted again as a contribution.
2. **Partial bill redirection:** more than zero but less than all recurring bills fit modeled draw capacity. Remaining bills use wages, then cash if enabled.
3. **Full bill redirection:** all recurring bills are financed, but some wages remain in cash rather than being contributed.
4. **Full-income contributions:** all recurring bills are financed and the entire positive paycheck is contributed.
5. **Reduced-contribution FLOW:** an optional user-selected month changes the percentage of available wages contributed. Salary does not disappear. In the dashboard, uninvested Stage 5 pay after the requested cash allocation leaves FLOW; it cannot fund later months. The stage can be enabled even if full bill financing has not been reached; it is a contribution choice, not proof of independence.

Stage labels are descriptions, not invented FYNANC thresholds. Stages may be skipped, revisited or reversed when capacity changes. Roadmap dates are the first achievement, not guarantees that a condition lasts. Full bill financing and full-income contributions are separate milestones and can occur together. The engine’s partial-redirection milestone specifically requires partial financing, not merely any financing. If no partial month occurs but full redirection is reached, the Stage 2 roadmap card is highlighted as reached and says “Reached: full redirection reached in month N,” using the first full-redirection month. This does not invent a partial-financing month or change ledger stages. If partial financing occurs anywhere in the completed projection, its actual first month remains the Stage 2 caption, even when it follows an earlier full-redirection month.

## Assumptions and monthly sequence

The reset values are investments $25,000, debt $5,000, cash $0, upfront contribution $0, pay $5,000, bills $3,500, contribution percentage 100%, cash allocation $0, DTA band floor 25%, band ceiling 30%, in-band reinvestment split 70%, draw guardrail 30%, coverage floor 3×, yield 7%, APR 5.25%, annual price growth 2%, pay growth 2.5%, bill inflation 3%, and 120 months. These are software demonstration inputs, not recommended or FYNANC thresholds. Stage 5 and stress are disabled by default. The same frozen configuration supplies initial page load, reload, missing simulation inputs and every reset. Changing inputs does not persist them across reloads. The 30% draw guardrail and 30% band ceiling remain independent controls despite sharing a baseline value.

1. Transfer upfront contribution from starting cash to investments once. It does not change initial net equity.
2. For month `m`, apply a selected price shock once, then price growth `annual percentage / 1200` to opening investments. Pay and bills use `(1 + annual percentage / 1200)^(m−1)`, so their growth begins in month 2.
3. Calculate distributions on price-grown opening investments **before** this month’s salary contributions. All distributions are available for modeled interest first. This deliberately differs from V3, which calculates distributions after salary routing. V2 also uses pre-contribution distributions, but grows pay/bills from month 1.
4. Compute permitted recurring-bill draw from opening collateral, debt, distributions, APR and selected constraints. Salary is not collateral used to finance its own same-month redirection. Redirection can be disabled or delayed by month.
5. Pay unfinanced bills from wages first, then existing cash if enabled. If any bills remain unfunded beyond $0.0000001 numerical tolerance, stop **before** that month. The failure reports its shortfall and minimum draw needed; displayed balances and the ledger contain only completed months. No asset sale, extra loan or fictional income bridges the gap.
6. Reserve up to the requested monthly pay allocation in cash, but only from pay still available after bills. Flag any unmet allocation. Contribute the chosen percentage of the remaining available wages; before Stage 5, retain other uninvested wages in cash. During Stage 5 in the dashboard, uninvested pay after the requested allocation is redirected outside FLOW. Stage 5 changes allocation, not employment/pay assumptions.
7. Interest equals `(opening debt + financed bills) × APR / 1200`. Distributions pay interest; uncovered interest capitalizes into debt as an explicit hypothetical accounting assumption. Remaining distribution cash follows the debt band described below. The allocation ratio includes actual current-month wage contributions, but not current-month distribution reinvestment. Distributions cannot be used twice.
8. End cash = opening cash − cash paid toward bills + retained wages. Cash earns no return. Ending equity = investments + cash − debt. Record pre-sweep and ending DTA, coverage, financing constraint and warnings. Existing breaches can continue with no new draw while contributions and distributions potentially repair the balance sheet.

Borrowed funds pay expenses; they are not salary, returns or additional wealth. Cash retained is not automatically invested or used for discretionary debt paydown. Financed expenses are still fully counted as expenses.

## Capacity: explicit, conservative closed-form limits

Let `A` be price-grown opening investments, `D` opening debt, `C` distributions, `r = APR / 1200`, `g` DTA guardrail fraction, `k` coverage floor, and `B` recurring bills. The capacity is a maximum **within this specific pre-contribution policy**, not the largest possible ending-only draw or an optimized long-term strategy.

The pre-sweep debt including unpaid interest must satisfy:

`D + F + max(0, (D + F)r − C) ≤ gA`.

Writing `L = gA`, the maximum total pre-interest debt is `L` when `Lr ≤ C`, otherwise `(L + C) / (1 + r)`. DTA draw room is that amount minus `D`, floored at zero. Coverage draw room is `C / (kr) − D`, floored at zero, when both `k` and `r` are positive; otherwise coverage does not impose a finite draw ceiling. The draw is the minimum of bills, DTA room and coverage room. No collateral or disabled redirection means zero draw.

These constraints are monotone in the draw; closed-form intersections avoid grid-search artifacts. An inherited violation blocks new draws, even if a new salary contribution or distribution paydown might repair ending ratios. This is a deliberate conservative distinction from V2’s ending-only solver. Passing these model checks does not establish broker eligibility or maintenance compliance.

### Dynamic debt band versus draw guardrail versus lender maintenance

The band allocates only distribution cash left after interest. Let `Q` be debt after the current bill draw and unpaid-interest capitalization, `L` remaining distribution cash, and `A*` price-grown investments plus the actual current-month wage contribution. Evaluate `current DTA = Q / A*` **before** distribution reinvestment.

- Above the band ceiling `u`: `principal = min(L, max(0, Q − u × A*))`, capped at `Q`. Repay until the ratio reaches the ceiling using the current investment base, then reinvest any residual. Do not credit future reinvestment when sizing this initial sweep.
- Below the band floor: `principal = 0`, and reinvest all `L`.
- Inside the band, including exact floor and ceiling: requested reinvestment is `L × split / 100`; requested principal is the rest. Cap principal at outstanding debt and reinvest any unused principal allocation. Do not stop this split merely because the ending ratio passes below the floor.
- Zero debt sends surplus to reinvestment. With zero investments and positive debt, allocate as above-band, while showing the ratio as N/A rather than Infinity.

`ending investments = A* + reinvested`; `ending debt = Q − principal`.

Inputs require `0 ≤ floor ≤ ceiling < 100%` and `0 ≤ split ≤ 100%`. Equal floor/ceiling and split endpoints are valid. The band is not a promise that ending DTA remains within its bounds: insufficient cash may leave it above the ceiling, and repayment/reinvestment may take it below the floor. Passing the retired `target` input to `simulate()` raises a migration error; use `bandFloor`, `bandCeiling`, and `bandSplit`.

The **30% draw guardrail remains independent** of the default **30% band ceiling**; they are separate controls with equal baseline values. No borrowing is added to enter the band, and changing the band cannot increase the same-month permitted bill draw. The guardrail still checks price-grown opening investments before wage contributions and before distribution allocation. An inherited debt balance can be inside the distribution band while still breaching the draw guardrail. Lender maintenance, credit limit utilization, collateral eligibility, liquidation and real interest billing are **not modeled**. M1 smart transfers are not automatically recurring margin borrowing.

Coverage means distributions divided by charged interest, not household DSCR or bill coverage. Zero interest is N/A without a coverage breach. Zero investments means undefined DTA, not an invented safe ratio. Guardrail comparison tolerance is `1e-10` in ratio units; full-bill/pay and funding comparison tolerance is `1e-7` dollars. Full precision is used for calculations and CSV; displayed percentages/ratios use no more than two decimals. While a rate is being edited, the full input is visible; on blur it is rounded visually, with the exact entered number retained internally and restored on focus.

## Stress and limitations

Optional user-entered stress starts at an integer month: a one-time investment valuation drop; an ongoing proportional yield cut; an ongoing APR increase in percentage points; and a temporary proportional pay cut for the selected number of months. No stress values or probability are prescribed. A valuation shock is not an added one-time purchase. Taxes, fees, uncertain returns, lender rules and actual transfers are excluded. No boosters, high-ticket purchases, external lump-sum inflows or additional one-time transactions are included.

The model greedily takes the permitted bill draw each month. Early full capacity may later fall to partial capacity. A smaller Stage 5 contribution may increase cash redirected outside FLOW while slowing investment growth. Neither outcome establishes financial independence or makes borrowing suitable.

## Worked independent fixture

Opening investments $12,000, debt/cash $0, pay $5,000, bills $3,500, yield/APR 12%, no growth/inflation, band floor 23%, ceiling 26%, split 50%, DTA guardrail 25%, coverage floor 3×, 100% available-pay contribution:

- Distributions $120. DTA draw room $3,000; coverage draw room $4,000. Draw $3,000.
- Bills from pay $500; actual contribution $4,500; retained pay $0.
- Interest $30; distributions left $90; debt is below the band floor relative to the updated investment base, so reinvest $90.
- Ending investments $16,590; debt $3,000; net equity $13,590.
- Equity change $1,590 = $5,000 pay − $3,500 bills + $120 distributions − $30 interest.

## Verification and reproducibility

```sh
node --test --test-isolation=none tests/flowsim-v4.test.cjs
node tests/flowsim-v4-dom.cjs
node tests/flowsim-v4-roadmap.cjs
node tests/flowsim-v4-browser.js
```

DOM tests require `jsdom` via NODE_PATH or installed dependencies. Optional browser tests require Playwright and Chromium, or `FLOWSIM_BROWSER` pointing to an Edge/Chromium executable. They write screenshots/PDF outside the repository by default. Existing CI runs the engine and DOM tests; no browser dependency is added to CI.

Tests cover small/large/zero capital, partial/full financing, stage 3 vs 4, stage 5 retained pay, upfront cash transfers, insufficient cash allocation, capacity bounds/equality, capitalized interest, inherited breaches, cash exhaustion and disabled cash use, zero denominators, debt-band branches, split bounds and full payoff, stress timing, negative returns, pay/bill growth, 1/600 months, fractional precision, input validation, complete exports and 80 varied synthetic paths. For each completed month, independently check:

`pay = bills from pay + actual contribution + retained pay + redirected pay`

`bills = financed bills + bills from pay + bills from cash`

`distributions = interest paid + principal repaid + reinvested distributions`

`FLOW equity change = pay − bills + price gain − shock loss + distributions − interest charged − redirected pay`.

Desktop and 390px mobile checks cover document overflow, keyboard controls, exports, reset and unfunded-month messaging. Screen-reader and Safari/Firefox testing are not claimed. V3’s existing engine/DOM tests are rerun, and its engine is compared byte-for-byte with the published predecessor.

## Monthly chart inspection

Hover over or tap the plot to inspect the nearest individual completed month. A guide and markers show the selected month, with balances for investments, debt, net equity including cash, and cash. The month slider and cash-flow detail stay synchronized. Slider arrow keys provide month-by-month keyboard access; Escape dismisses its tooltip. Every completed month is inspectable even when axis labels remain spaced for readability, including 600-month projections. Changing inputs or resetting clears old tooltip values. No calculation or CSV precision is changed.

`node tests/flowsim-v4-chart.cjs` verifies all monthly hover targets, values, mobile coordinate scaling, slider synchronization and edge cases (requires the same jsdom dependency as the DOM suite).

## Published URLs and synchronization

The reviewed features are synchronized at `https://rovocapitalmanagement.llc/FlowSimV4.html` and `https://rovocapitalmanagement.llc/flow-stages.html` after the user's explicit approval on November 11, 2026. Flow Stages carries its own browser title, CSV heading/filename and print heading; all other bytes, including the engine, defaults, narrative, automatic plan and UI, match V4. The release test enforces this exact, narrowly normalized parity. V4 itself remains unchanged from commit `be3d1a689c9f871f7f51b199cce77fb82f00d2b9` (SHA-256 `5fdcfee715a28ed8ab98b3b631b163f0eb8b2cda593ad16af72b491718d98b07`). CI runs when either active HTML file changes.

### Verified pre-sync backup and restoration

Before editing Flow Stages, its entire live public HTML was copied without modification to `flow-stages-backup-2026-11-11.html`, committed separately in `d3e3194cefc42853dc5617fb492456238ece0da1`, and read back from the remote repository. Its SHA-256 is `315ccb49c8f0c78da17c5dcce1e3538fdcd7f0ae11357a5e114175b35b1725c2`. This is a standalone, runnable copy of the former static-target model, including its original defaults, title and exports. It contains app code and synthetic defaults, not any visitor's entered scenario.

- Repository backup: `https://github.com/mrjromero/rovocapitalmanagement/blob/d3e3194cefc42853dc5617fb492456238ece0da1/flow-stages-backup-2026-11-11.html`
- Runnable backup: `https://rovocapitalmanagement.llc/flow-stages-backup-2026-11-11.html`
- Restoration: copy the verified backup's exact bytes over `flow-stages.html`, reconcile the active-page parity/default tests for the intentionally restored legacy model, run the full checks, then publish and verify the live checksum. Restoring is a separate authorized change, not an automatic action.

The backup is immutable in the regression checks. It retains `noindex,nofollow` and is not added to site navigation or the robots crawl exceptions. It remains publicly accessible, not password protected. Default/reload/reset and historical debt-band comparison tests continue exercising the preserved old model.

## Search-engine indexing

The original `flowsim.html`, V2, V3 and both V4 URLs use a static `noindex,nofollow` robots meta tag. `robots.txt` keeps its site-wide crawl block and allows only these exact page paths and their query-string variants, so compliant search crawlers can read the noindex instruction. Other site paths remain blocked. Existing search results may take time to disappear after recrawling; this does not guarantee removal by every search engine. These are public links, not password-protected or private pages.


## Your Wealth Engine Journey

A dark card directly above the month-by-month plan derives four concise executive sections from every simulation result: The Launch & Early Friction, Cash Flow Overflow, The Heavy Lifting Crossover, and The Terminal Position. It covers actual initial wage allocation, bill-financing milestones and reversals, the first and sustained reinvestment surplus, the first output crossover in a separate 100%-contribution reference, and the final completed month's equity, distributions, reinvestment and continued wage dependence. Zero completed months retain the four headings with blocked-plan fallbacks. All month pills select the existing slider, chart marker/tooltip and inspector, then focus and scroll to the slider. Scenario edits and reset rebuild the story; invalid inputs hide it rather than leave stale milestones. Ledger filtering does not change it.

The requested monthly crossover measure is:

`reinvested + principal + priceGain - shockLoss >= contributed`

The comparison uses a $0.0000001 tolerance and the first qualifying month in the continuous 100%-available-pay reference, regardless of manual contribution settings. It is not an unconditional contribution-stop signal.

Principal is paid only from distributions. Price change includes both negative growth and the separately recorded one-time shock. Paid interest is already removed before principal and reinvestment and must not be subtracted twice. Capitalized unpaid interest is **not silently added to this user-defined measure**: the crossover narrative discloses any unpaid interest at the trigger. Automatic candidates must fully service interest in every remaining month. Actual net investment-side equity contribution would subtract capitalized interest as well. Neither comparison represents total household equity change, because it excludes wages retained in cash, bills, and new bill debt.

The visible output crossover is the **first** qualifying month, not a sustained-output claim. Separate backward scans find the final uninterrupted suffix for full bill financing and reinvestment. The original journey helper remains available for its historical presentation-only analysis; the live Heavy Lifting section uses the dedicated glidepath report. It is labeled as holding only **through the modeled horizon**, never forever. A one-month or final-month crossover states that no later months are tested. Early funding failure prevents a requested-horizon crossover claim. Zero bills do not generate financing milestones, and zero contributions do not imply independence. The visible prose aggregates the crossover into internal wealth generation or portfolio engine output; the expandable methodology retains its exact definition. First reinvestment is never described as debt freedom or comfortable self-servicing. Lower contributions at crossover are disclosed. The terminal section reports monthly distributions and automatic reinvestment, alongside any continuing wage contribution, wage/cash bill payments and unpaid interest.

Additional verification:

```sh
node --test --test-isolation=none tests/flowsim-v4-journey.test.cjs
node tests/flowsim-v4-journey-dom.cjs
node tests/flowsim-v4-journey-browser.js
```


## Dynamic debt band verification

The ledger and CSV retain the full-precision `Principal repaid` and `Distributions reinvested` amounts and add the actual `DTA before band allocation` and `Distribution routing` for each completed month. The print report includes these allocation fields. Inputs, validation, reset and retained full precision cover all three band controls.

With the original debt-band fixture (pay $6,338, bills $5,500, no starting debt, 23%–26% band, 50% split and 25% draw guardrail), the band reinvests in all of months 1–35, totaling $4,973.22, compared with $122.01 in only month 1 under the preserved pre-sync Flow Stages sample's static 20% target. This is a checked sample comparison, not a promise of earlier reinvestment or better outcomes for other assumptions. The narrative reports the selected band's split, its first actual use, actual initial reinvestment and actual first-35-month total. It does not guarantee acceleration, debt freedom or uninterrupted future overflow.

`node --test --test-isolation=none tests/flowsim-v4-band.test.cjs` covers boundaries, sequential above-ceiling repayment, residual reinvestment, split endpoints, debt caps, zero denominators, wage timing, capitalized interest, independent draw capacity, validation, exports and 200 varied paths against an independent allocation/accounting oracle. `node tests/flowsim-v4-band-dom.cjs` covers input/display/reset/precision, ledger and narrative integration, and invalid-state clearing.

## Operational status banner

A completed run without monthly warnings shows only a small “X months modeled” count. There is no clean-run card, badge or subtitle. When warnings exist, an amber banner directly above the Stages section shows “N Months Need Attention,” neutral wording about borrowing limits, coverage or cash allocations, and a “View Flagged Months” button. Undefined DTA and unfunded cash allocations are not mislabeled as borrowing breaches. The banner contains no legal or capacity disclaimer. Optional-stage configuration notes appear beside the input form and remain in print exports.

The banner’s quick filter and the ledger filter stay synchronized; filtering never changes model totals, milestone dates or exports. Unfunded bills take priority: a stopped projection retains its red failure banner and explanation, including when no months completed or all completed months were otherwise clear. Invalid input clears the previous status and configuration notes. Reset restores the simple baseline count and clears the filter.


## Automatic full-bill cash-redirection plan

The five cards pair cash routing with the requested autonomy labels. They describe modeled mechanics, not verified independence. Stage 5 is a compact native disclosure labeled “Coming later” until a manual Stage 5 is active in completed rows, an automatic plan is available, or a changed-plan alert needs attention. It then opens automatically. Users can inspect or collapse it with mouse, Enter or Space; their choice persists across updates with the same relevance. Reset returns to compact form. A manually active schedule is explicitly labeled a comparison, not an automatically passing plan.

Normal defaults and all input IDs remain unchanged. The three contribution schedule fields now live in **Optional · Manual contribution comparison**. The main Stage 5 result shows the calculated start, contribution, first-month outgoing cash and cumulative redirection. No personal scenario values are hard-coded or persisted.

### Goal and search order

The automatic plan asks: what is the earliest modeled month from which all entered bills can remain financed within selected constraints, while some earned income is redirected elsewhere? The portfolio-output crossover remains an informational milestone, not an activation gate.

1. Build a separate continuous-100%-available-pay reference, preserving all other assumptions.
2. Check start months from 1 through the requested horizon, in order.
3. At each start, test 0–99% contributions in ascending whole-percentage steps.
4. Select the earliest passing start, then the lowest passing percentage **on that grid**. This is not a continuous optimum, a terminal-wealth optimizer, or a guarantee that a short passing interval persists longer.

Every candidate reruns the actual altered path. From the candidate start **inclusive through the horizon**, every month must:

- Fully finance all entered bills, with no wages or existing cash supplementing them.
- Keep ending debt-to-investments inside both selected band bounds and respect the independent pre-sweep and ending draw guardrail.
- Fully service interest and meet the cash-interest coverage minimum. Zero-interest coverage is N/A, not fabricated infinity.
- Fund the requested cash allocation without inventing money.

A candidate also needs a positive amount of earned pay to redirect in at least one tested month. Zero wages cannot manufacture a benefit. Zero bills do not manufacture full-financing milestone dates. Low-debt paths can fail the selected band floor; the model does not borrow merely to satisfy that lower bound.

The search does not assume feasibility is monotonic in either percentage or time. Only same-month pre-contribution bill-funding/interest/coverage conditions can safely skip a start. Baseline ending DTA, output crossover, and later baseline failures do not prematurely rule out earlier candidates. A matching untapered prefix is reused; invalid suffixes stop at their first failed check. The winning candidate is materialized as a complete month-1-to-horizon run and checked again before display. Continuation rows match a full rerun exactly; numerical tolerances are 1e-7 for cash and 1e-10 for ratios.

### Cash that leaves FLOW

The dashboard applies this rule to both automatic Stage 5 and the optional manual Stage 5 comparison:

- Pay direct bills first, then reserve the requested cash allocation inside FLOW.
- Invest the selected percentage of the remaining available pay.
- During Stage 5, send the uninvested remainder **outside FLOW**.

Requested cash allocations stay inside FLOW and remain separately visible. Outside redirection is an outflow, not another FLOW cash balance. It cannot be recycled into later bills, collateral or interest coverage. No balances, returns, taxes, liquidity or spendability of the outside strategy are modeled. Cumulative redirection is reported separately and is never added back to FLOW net equity.

The low-level engine retains its historical retained-cash behavior when called without options for compatibility. Dashboard simulations explicitly request external Stage 5 routing. CSV records which cash destination was applied. The new redirected-pay column is appended, preserving previous ledger column positions. Inspector and print wages reconcile as bills + investment + cash kept inside FLOW + pay redirected outside. Existing baseline results remain numerically unchanged because Stage 5 is disabled by default.

### State and reporting

ON applies the calculated schedule and displays the exact validated candidate in charts, ledger, narrative and exports. Calculated fields are results; the advanced manual schedule is temporarily disabled. Other assumption changes re-evaluate the plan. If no candidate remains, automatic mode pauses, reverts to continuous 100% contributions and shows the reason. OFF also restores 100% continuous investment.

Prior manual percentages and start month are preserved with exact precision, recoverable by the Restore manual contribution settings button while OFF. Restoring affects only those three fields and is not an eligibility certification. Editing a manual contribution field replaces the snapshot; reset and reload discard it. No storage or network behavior is added.

The narrative distinguishes reference output crossover from the full-bill-financing plan, reports first-month contribution/outflow and total redirected, and states the **exact number of months tested**. A one-month candidate explicitly says no later month tests persistence. Wages continue under the entered growth and stress assumptions. Financed bills remain debt-funded spending, not passive income. The terminal result excludes all outgoing pay and states its cumulative amount separately. CSV records the objective, reference and active dates, tested period, actual parameters, routing destination and outgoing total. Print always includes all completed rows regardless of warning filters.

### Checked public baseline extensions

The unchanged 120-month default has no passing automatic plan. At 240 months:

- Informational output crossover is month 182. Borrowing then covers 96.3% of bills, leaving $203.82 to wages, so it is **not** a valid automatic start.
- The earliest passing start is month **188**, with **97%** of available pay invested. All **53 months from 188 through 240** pass the full-bill-financing checks.
- The first month invests **$7,157.47** and redirects **$221.37** outside FLOW. Across the tested interval, **$12,390.96** leaves FLOW.

At 600 months, no candidate passes the complete remaining period under the selected band floor and other constraints. The exhaustive implementation evaluates all necessary start/percentage pairs without freezing the UI for repeated full-prefix reruns. On the test machine, the 600-month case takes roughly half a second; this is a measured example, not a cross-device timing guarantee.

Tests cover an independent exhaustive full-rerun oracle, later feasible starts, output crossover independence, 100%-only cases, nonmonotonic band behavior, prefix equality, no reuse of exported cash, conservation, requested cash allocation, zero inputs/interest, shocks and later funding failures, every-month validation, horizon edge cases, invalid inputs, manual restoration, toggles, compact disclosure, reset, CSV and print. The synchronized Flow Stages app is tested for complete source parity except its explicit title/export branding. The pre-sync backup and V4 are pinned byte-for-byte for this release.
