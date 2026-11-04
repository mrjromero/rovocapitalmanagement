# FLOW V4 · Contribution Roadmap

Open `FlowSimV4.html` directly in a browser. All CSS, calculation code and UI are in this one file. No dependencies, storage, analytics, accounts or network calls are used. CSV and print-to-PDF exports are local. This is a deterministic educational model, not a borrowing recommendation or an M1 integration.

V4 is separate from V2 and V3. V3 is renamed **Fixed Financing Simulator** in its visible and browser titles; its engine remains byte-identical. V2 is unchanged.

## Five descriptive stages

1. **Foundation:** no recurring bills are financed; available wages may build investments. An optional upfront contribution is a transfer from explicitly entered starting cash, before month 1. Starting investments are never counted again as a contribution.
2. **Partial bill redirection:** more than zero but less than all recurring bills fit modeled draw capacity. Remaining bills use wages, then cash if enabled.
3. **Full bill redirection:** all recurring bills are financed, but some wages remain in cash rather than being contributed.
4. **Full-income contributions:** all recurring bills are financed and the entire positive paycheck is contributed.
5. **Reduced-contribution FLOW:** an optional user-selected month changes the percentage of available wages contributed. Salary does not disappear. Wages not contributed or spent remain in cash. The stage can be enabled even if full bill financing has not been reached; it is a contribution choice, not proof of independence.

Stage labels are descriptions, not invented FYNANC thresholds. Stages may be skipped, revisited or reversed when capacity changes. Roadmap dates are the first achievement, not guarantees that a condition lasts. Full bill financing and full-income contributions are separate milestones and can occur together. Stage 2’s milestone specifically requires partial financing, not merely any financing.

## Assumptions and monthly sequence

The generic reset values are investments $25,000, debt $0, cash $5,000, upfront contribution $0, pay $5,000, bills $3,500, contribution percentage 100%, cash allocation $0, target DTA 20%, draw guardrail 25%, coverage floor 3×, yield 7%, APR 4.24%, annual price growth 2%, pay growth 0%, bill inflation 3%, and 120 months. These are software demonstration inputs, not recommended or FYNANC thresholds. Stage 5 and stress are disabled by default.

1. Transfer upfront contribution from starting cash to investments once. It does not change initial net equity.
2. For month `m`, apply a selected price shock once, then price growth `annual percentage / 1200` to opening investments. Pay and bills use `(1 + annual percentage / 1200)^(m−1)`, so their growth begins in month 2.
3. Calculate distributions on price-grown opening investments **before** this month’s salary contributions. All distributions are available for modeled interest first. This deliberately differs from V3, which calculates distributions after salary routing. V2 also uses pre-contribution distributions, but grows pay/bills from month 1.
4. Compute permitted recurring-bill draw from opening collateral, debt, distributions, APR and selected constraints. Salary is not collateral used to finance its own same-month redirection. Redirection can be disabled or delayed by month.
5. Pay unfinanced bills from wages first, then existing cash if enabled. If any bills remain unfunded beyond $0.0000001 numerical tolerance, stop **before** that month. The failure reports its shortfall and minimum draw needed; displayed balances and the ledger contain only completed months. No asset sale, extra loan or fictional income bridges the gap.
6. Reserve up to the requested monthly pay allocation in cash, but only from pay still available after bills. Flag any unmet allocation. Contribute the chosen percentage of the remaining available wages; retain all other wages in cash. Stage 5 changes this percentage, not employment/pay assumptions.
7. Interest equals `(opening debt + financed bills) × APR / 1200`. Distributions pay interest; uncovered interest capitalizes into debt as an explicit hypothetical accounting assumption. Remaining distribution cash pays principal toward the target, then is reinvested. Distributions cannot be used twice.
8. End cash = opening cash − cash paid toward bills + retained wages. Cash earns no return. Ending equity = investments + cash − debt. Record pre-sweep and ending DTA, coverage, financing constraint and warnings. Existing breaches can continue with no new draw while contributions and distributions potentially repair the balance sheet.

Borrowed funds pay expenses; they are not salary, returns or additional wealth. Cash retained is not automatically invested or used for discretionary debt paydown. Financed expenses are still fully counted as expenses.

## Capacity: explicit, conservative closed-form limits

Let `A` be price-grown opening investments, `D` opening debt, `C` distributions, `r = APR / 1200`, `g` DTA guardrail fraction, `k` coverage floor, and `B` recurring bills. The capacity is a maximum **within this specific pre-contribution policy**, not the largest possible ending-only draw or an optimized long-term strategy.

The pre-sweep debt including unpaid interest must satisfy:

`D + F + max(0, (D + F)r − C) ≤ gA`.

Writing `L = gA`, the maximum total pre-interest debt is `L` when `Lr ≤ C`, otherwise `(L + C) / (1 + r)`. DTA draw room is that amount minus `D`, floored at zero. Coverage draw room is `C / (kr) − D`, floored at zero, when both `k` and `r` are positive; otherwise coverage does not impose a finite draw ceiling. The draw is the minimum of bills, DTA room and coverage room. No collateral or disabled redirection means zero draw.

These constraints are monotone in the draw; closed-form intersections avoid grid-search artifacts. An inherited violation blocks new draws, even if a new salary contribution or distribution paydown might repair ending ratios. This is a deliberate conservative distinction from V2’s ending-only solver. Passing these model checks does not establish broker eligibility or maintenance compliance.

### Target versus guardrail versus lender maintenance

The target guides distribution cash allocation only. With `Q` debt after draw/capitalization, `L` remaining distribution cash, `A*` grown investments plus contributed wages, and target fraction `t`:

`principal = clamp((Q − t(A* + L)) / (1 − t), 0, min(Q, L))`.

`ending investments = A* + L − principal`; `ending debt = Q − principal`.

No borrowing is added to reach a target. Target must be no higher than the guardrail, and guardrail must be below 100%. The guardrail restricts new modeled draws before pay contributions and before principal sweep; ending DTA is also displayed. Lender maintenance, credit limit utilization, collateral eligibility, liquidation and real interest billing are **not modeled**. M1 smart transfers are not automatically recurring margin borrowing.

Coverage means distributions divided by charged interest, not household DSCR or bill coverage. Zero interest is N/A without a coverage breach. Zero investments means undefined DTA, not an invented safe ratio. Guardrail comparison tolerance is `1e-10` in ratio units; full-bill/pay and funding comparison tolerance is `1e-7` dollars. Full precision is used for calculations and CSV; displayed percentages/ratios use no more than two decimals. While a rate is being edited, the full input is visible; on blur it is rounded visually, with the exact entered number retained internally and restored on focus.

## Stress and limitations

Optional user-entered stress starts at an integer month: a one-time investment valuation drop; an ongoing proportional yield cut; an ongoing APR increase in percentage points; and a temporary proportional pay cut for the selected number of months. No stress values or probability are prescribed. A valuation shock is not an added one-time purchase. Taxes, fees, uncertain returns, lender rules and actual transfers are excluded. No boosters, high-ticket purchases, external lump-sum inflows or additional one-time transactions are included.

The model greedily takes the permitted bill draw each month. Early full capacity may later fall to partial capacity. A smaller contribution may accelerate cash accumulation while slowing investment growth. Neither outcome establishes financial independence or makes borrowing suitable.

## Worked independent fixture

Opening investments $12,000, debt/cash $0, pay $5,000, bills $3,500, yield/APR 12%, no growth/inflation, target 20%, DTA guardrail 25%, coverage floor 3×, 100% available-pay contribution:

- Distributions $120. DTA draw room $3,000; coverage draw room $4,000. Draw $3,000.
- Bills from pay $500; actual contribution $4,500; retained pay $0.
- Interest $30; distributions left $90; debt is already below target relative to the updated investment base, so reinvest $90.
- Ending investments $16,590; debt $3,000; net equity $13,590.
- Equity change $1,590 = $5,000 pay − $3,500 bills + $120 distributions − $30 interest.

## Verification and reproducibility

```sh
node --test --test-isolation=none tests/flowsim-v4.test.cjs
node tests/flowsim-v4-dom.cjs
node tests/flowsim-v4-browser.js
```

DOM tests require `jsdom` via NODE_PATH or installed dependencies. Optional browser tests require Playwright and Chromium, or `FLOWSIM_BROWSER` pointing to an Edge/Chromium executable. They write screenshots/PDF outside the repository by default. Existing CI runs the engine and DOM tests; no browser dependency is added to CI.

Tests cover small/large/zero capital, partial/full financing, stage 3 vs 4, stage 5 retained pay, upfront cash transfers, insufficient cash allocation, capacity bounds/equality, capitalized interest, inherited breaches, cash exhaustion and disabled cash use, zero denominators, target/full payoff, stress timing, negative returns, pay/bill growth, 1/600 months, fractional precision, input validation, complete exports and 80 varied synthetic paths. For each completed month, independently check:

`pay = bills from pay + actual contribution + retained pay`

`bills = financed bills + bills from pay + bills from cash`

`distributions = interest paid + principal repaid + reinvested distributions`

`equity change = pay − bills + price gain − shock loss + distributions − interest charged`.

Desktop and 390px mobile checks cover document overflow, keyboard controls, exports, reset and unfunded-month messaging. Screen-reader and Safari/Firefox testing are not claimed. V3’s existing engine/DOM tests are rerun, and its engine is compared byte-for-byte with the published predecessor.
