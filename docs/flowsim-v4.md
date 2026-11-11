# FLOW V4 · Contribution Roadmap

Open `FlowSimV4.html` directly in a browser. All CSS, calculation code and UI are in this one file. No dependencies, storage, analytics, accounts or network calls are used. CSV and print-to-PDF exports are local. This is a deterministic educational model, not a borrowing recommendation or an M1 integration.

V4 is separate from V2 and V3. V3 is renamed **Fixed Financing Simulator** in its visible and browser titles; its engine remains byte-identical. V2 is unchanged.

## Five descriptive stages

1. **Foundation:** no recurring bills are financed; available wages may build investments. An optional upfront contribution is a transfer from explicitly entered starting cash, before month 1. Starting investments are never counted again as a contribution.
2. **Partial bill redirection:** more than zero but less than all recurring bills fit modeled draw capacity. Remaining bills use wages, then cash if enabled.
3. **Full bill redirection:** all recurring bills are financed, but some wages remain in cash rather than being contributed.
4. **Full-income contributions:** all recurring bills are financed and the entire positive paycheck is contributed.
5. **Reduced-contribution FLOW:** an optional user-selected month changes the percentage of available wages contributed. Salary does not disappear. Wages not contributed or spent remain in cash. The stage can be enabled even if full bill financing has not been reached; it is a contribution choice, not proof of independence.

Stage labels are descriptions, not invented FYNANC thresholds. Stages may be skipped, revisited or reversed when capacity changes. Roadmap dates are the first achievement, not guarantees that a condition lasts. Full bill financing and full-income contributions are separate milestones and can occur together. The engine’s partial-redirection milestone specifically requires partial financing, not merely any financing. If no partial month occurs but full redirection is reached, the Stage 2 roadmap card is highlighted as reached and says “Reached: full redirection reached in month N,” using the first full-redirection month. This does not invent a partial-financing month or change ledger stages. If partial financing occurs anywhere in the completed projection, its actual first month remains the Stage 2 caption, even when it follows an earlier full-redirection month.

## Assumptions and monthly sequence

The reset values are investments $25,000, debt $0, cash $0, upfront contribution $0, pay $6,338, bills $5,500, contribution percentage 100%, cash allocation $0, DTA band floor 23%, band ceiling 26%, in-band reinvestment split 50%, draw guardrail 25%, coverage floor 3×, yield 7%, APR 5.25%, annual price growth 2%, pay growth 3.1%, bill inflation 3.7%, and 120 months. These are software demonstration inputs, not recommended or FYNANC thresholds. Stage 5 and stress are disabled by default.

1. Transfer upfront contribution from starting cash to investments once. It does not change initial net equity.
2. For month `m`, apply a selected price shock once, then price growth `annual percentage / 1200` to opening investments. Pay and bills use `(1 + annual percentage / 1200)^(m−1)`, so their growth begins in month 2.
3. Calculate distributions on price-grown opening investments **before** this month’s salary contributions. All distributions are available for modeled interest first. This deliberately differs from V3, which calculates distributions after salary routing. V2 also uses pre-contribution distributions, but grows pay/bills from month 1.
4. Compute permitted recurring-bill draw from opening collateral, debt, distributions, APR and selected constraints. Salary is not collateral used to finance its own same-month redirection. Redirection can be disabled or delayed by month.
5. Pay unfinanced bills from wages first, then existing cash if enabled. If any bills remain unfunded beyond $0.0000001 numerical tolerance, stop **before** that month. The failure reports its shortfall and minimum draw needed; displayed balances and the ledger contain only completed months. No asset sale, extra loan or fictional income bridges the gap.
6. Reserve up to the requested monthly pay allocation in cash, but only from pay still available after bills. Flag any unmet allocation. Contribute the chosen percentage of the remaining available wages; retain all other wages in cash. Stage 5 changes this percentage, not employment/pay assumptions.
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

The **25% draw guardrail remains independent** of the default **26% band ceiling**. No borrowing is added to enter the band, and changing the band cannot increase the same-month permitted bill draw. The guardrail still checks price-grown opening investments before wage contributions and before distribution allocation. An inherited debt balance can be inside the distribution band while still breaching the draw guardrail. Lender maintenance, credit limit utilization, collateral eligibility, liquidation and real interest billing are **not modeled**. M1 smart transfers are not automatically recurring margin borrowing.

Coverage means distributions divided by charged interest, not household DSCR or bill coverage. Zero interest is N/A without a coverage breach. Zero investments means undefined DTA, not an invented safe ratio. Guardrail comparison tolerance is `1e-10` in ratio units; full-bill/pay and funding comparison tolerance is `1e-7` dollars. Full precision is used for calculations and CSV; displayed percentages/ratios use no more than two decimals. While a rate is being edited, the full input is visible; on blur it is rounded visually, with the exact entered number retained internally and restored on focus.

## Stress and limitations

Optional user-entered stress starts at an integer month: a one-time investment valuation drop; an ongoing proportional yield cut; an ongoing APR increase in percentage points; and a temporary proportional pay cut for the selected number of months. No stress values or probability are prescribed. A valuation shock is not an added one-time purchase. Taxes, fees, uncertain returns, lender rules and actual transfers are excluded. No boosters, high-ticket purchases, external lump-sum inflows or additional one-time transactions are included.

The model greedily takes the permitted bill draw each month. Early full capacity may later fall to partial capacity. A smaller contribution may accelerate cash accumulation while slowing investment growth. Neither outcome establishes financial independence or makes borrowing suitable.

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

`pay = bills from pay + actual contribution + retained pay`

`bills = financed bills + bills from pay + bills from cash`

`distributions = interest paid + principal repaid + reinvested distributions`

`equity change = pay − bills + price gain − shock loss + distributions − interest charged`.

Desktop and 390px mobile checks cover document overflow, keyboard controls, exports, reset and unfunded-month messaging. Screen-reader and Safari/Firefox testing are not claimed. V3’s existing engine/DOM tests are rerun, and its engine is compared byte-for-byte with the published predecessor.

## Monthly chart inspection

Hover over or tap the plot to inspect the nearest individual completed month. A guide and markers show the selected month, with balances for investments, debt, net equity including cash, and cash. The month slider and cash-flow detail stay synchronized. Slider arrow keys provide month-by-month keyboard access; Escape dismisses its tooltip. Every completed month is inspectable even when axis labels remain spaced for readability, including 600-month projections. Changing inputs or resetting clears old tooltip values. No calculation or CSV precision is changed.

`node tests/flowsim-v4-chart.cjs` verifies all monthly hover targets, values, mobile coordinate scaling, slider synchronization and edge cases (requires the same jsdom dependency as the DOM suite).

## Published URLs and synchronization

Review the current V4 features at `https://rovocapitalmanagement.llc/FlowSimV4.html`. The separate `https://rovocapitalmanagement.llc/flow-stages.html` retains its previously approved static-target model.

The Wealth Engine Journey is an intentionally V4-only review feature. Do **not** copy `FlowSimV4.html` over `flow-stages.html`: applying this feature to Flow Stages requires separate user approval. V4 now has its own authorized debt-band allocator, inputs and narrative. Flow Stages retains the previous static-target engine and every original byte. The scope test pins the Flow Stages file hash and requires the shared draw-capacity, wage-allocation and balance/stage accounting code to remain unchanged. CI runs when either HTML file changes.

## Search-engine indexing

The original `flowsim.html`, V2, V3 and both V4 URLs use a static `noindex,nofollow` robots meta tag. `robots.txt` keeps its site-wide crawl block and allows only these exact page paths and their query-string variants, so compliant search crawlers can read the noindex instruction. Other site paths remain blocked. Existing search results may take time to disappear after recrawling; this does not guarantee removal by every search engine. These are public links, not password-protected or private pages.


## Your Wealth Engine Journey (V4-only review)

A dark card directly above the month-by-month plan derives four concise executive sections from every simulation result: The Launch & Early Friction, Cash Flow Overflow, The Heavy Lifting Crossover, and The Terminal Position. It covers actual initial wage allocation, bill-financing milestones and reversals, the first and sustained reinvestment surplus, the sustained contribution crossover, and the final completed month's equity, distributions, reinvestment and continued wage dependence. Zero completed months retain the four headings with blocked-plan fallbacks. All month pills select the existing slider, chart marker/tooltip and inspector, then focus and scroll to the slider. Scenario edits and reset rebuild the story; invalid inputs hide it rather than leave stale milestones. Ledger filtering does not change it.

The requested monthly crossover measure is:

`reinvested + principal + priceGain - shockLoss > contributed + 1e-7`

Principal is paid only from distributions. Price change includes both negative growth and the separately recorded one-time shock. Paid interest is already removed before principal and reinvestment and must not be subtracted twice. Capitalized unpaid interest is **not silently added to this user-defined measure**: when a qualifying interval contains it, the narrative states the total added to debt and explicitly says this is not a net-wealth crossover. Actual net investment-side equity contribution would subtract capitalized interest as well. Neither comparison represents total household equity change, because it excludes wages retained in cash, bills, and new bill debt.

Independent backward scans find the first month in the final uninterrupted qualifying suffix for crossover, full bill financing and reinvestment, not the first temporary crossing. It is labeled as holding only **through the modeled horizon**, never forever. A one-month or final-month crossover states that no later months are tested. Early funding failure prevents a requested-horizon crossover claim. Zero bills do not generate financing milestones, and zero contributions do not imply independence. The visible prose aggregates the crossover into internal wealth generation or portfolio engine output; the expandable methodology retains its exact definition. First reinvestment is never described as debt freedom or comfortable self-servicing. Lower contributions at crossover are disclosed. The terminal section reports monthly distributions and automatic reinvestment, alongside any continuing wage contribution, wage/cash bill payments and unpaid interest.

Additional verification:

```sh
node --test --test-isolation=none tests/flowsim-v4-journey.test.cjs
node tests/flowsim-v4-journey-dom.cjs
node tests/flowsim-v4-journey-browser.js
```


## Dynamic debt band verification

The ledger and CSV retain the full-precision `Principal repaid` and `Distributions reinvested` amounts and add the actual `DTA before band allocation` and `Distribution routing` for each completed month. The print report includes these allocation fields. Inputs, validation, reset and retained full precision cover all three band controls.

With the current reset sample, the band reinvests in all of months 1–35, totaling $4,973.22, compared with $122.01 in only month 1 under the unchanged Flow Stages sample's static 20% target. This is a checked sample comparison, not a promise of earlier reinvestment or better outcomes for other assumptions. The narrative reports the selected band's split, its first actual use, actual initial reinvestment and actual first-35-month total. It does not guarantee acceleration, debt freedom or uninterrupted future overflow.

`node --test --test-isolation=none tests/flowsim-v4-band.test.cjs` covers boundaries, sequential above-ceiling repayment, residual reinvestment, split endpoints, debt caps, zero denominators, wage timing, capitalized interest, independent draw capacity, validation, exports and 200 varied paths against an independent allocation/accounting oracle. `node tests/flowsim-v4-band-dom.cjs` covers input/display/reset/precision, ledger and narrative integration, and invalid-state clearing.
