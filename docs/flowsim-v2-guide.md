# FlowSim V2: FLOW roadmap and expense coverage planner

[Open the app](https://rovocapitalmanagement.llc/FlowSimV2.html) · [Calculation/solver specification](flowsim-v2-routing.md) · [Source](../FlowSimV2.html)

## Purpose

FlowSim V2 is a standalone educational scenario planner for understanding how take-home pay, investment distributions, living expenses and margin debt interact over time. Its main purpose is to make cash routing visible: how much pay is invested, how much of the entered bills is financed, what distributions pay toward interest and principal, and what happens to investments, debt and net equity.

It is a conditional roadmap, not an account manager, trade executor, borrowing recommendation, lender eligibility check or optimized forecast. It has no M1 connection. Bills that fit this app's selected mathematical checks are not necessarily approved expenses or available draws at a brokerage.

## How the FLOW strategy works here

FLOW separates household earning/spending from investment distribution cash:

1. Household take-home pay can build investments rather than immediately paying every bill.
2. Some entered bills can instead be funded by a margin draw. That draw increases debt and pays the bill. **Borrowing is financing, not income, investment return or an increase in net wealth.**
3. Investments change in price and produce distributions. Price growth and distributions are separate assumptions. A high distribution rate is not proof of investment profit, sustainable yield or capital preservation.
4. Distributions allocated to cash pay modeled interest first. Remaining cash either reduces principal or pays toward a target debt-to-investments ratio and then returns to investments.
5. Outcomes depend on the entire balance sheet and funding path. More investments accompanied by more debt can produce little additional net equity and less unused modeled headroom.

In **Maximum within ending guardrails** mode, the app finances the greatest permitted portion of entered bills that month. Unfinanced bills are paid from take-home pay, and **only the remaining pay is invested**. No dollar of pay is simultaneously spent and invested. Existing debt stays in the model. No reserve withdrawal, asset sale or discretionary loan is invented to close a shortfall.

In **All bills — warnings only** mode, all pay is invested and all bills are financed even when selected ratios fail. This hypothetical comparison exposes the debt path; it is not an executable borrowing plan. Failure warnings never imply the lender would permit continued draws.

### Capital growth, purchasing power and the RIGGED discussion

The broader objective is to understand capital accumulation and household flexibility in a changing cost environment. The planner addresses that question through separate pay growth, bill inflation, price growth, yield and APR assumptions. It does not establish that leverage necessarily accelerates wealth, defeats inflation or improves a particular user's position.

All displayed balances are **nominal dollars**. Higher nominal investments do not necessarily provide greater purchasing power. Bill inflation increases expenses; it does not CPI-adjust net equity. Purchasing-power analysis requires an explicitly chosen price-level path outside this version. Net equity subtracts debt. Distributions must not be added on top of a total-return input: **price growth must exclude distributions**.

## Quick start and controls

1. Enter investment assets and existing debt within the same account boundary. Exclude external reserves.
2. Enter monthly **take-home** pay and all household bills you want modeled. Gross salary is not spendable pay without a tax bridge.
3. Enter annual distribution yield and margin APR. Even a dated account observation is an assumption about future months, not a guarantee.
4. Choose bill financing and the cash sweep. The visible UI starts with **Maximum within ending guardrails** and **B · Pay toward target, then reinvest**. The A/B table compares both sweeps under the selected assumptions.
5. Set the target DTA, ending DTA ceiling and minimum cash-interest coverage. These have distinct meanings below.
6. Review the immediate reinvestment/cash split. Editing either side adjusts the other to total 100%.
7. Open **Forecast & stress assumptions** for annual price/pay/bill growth and the combined shock. The comparison summary states whether stress is active. Collapsed settings still affect the calculation.
8. Read completion/failure first. Compare investments **and debt** alongside net equity, interest, financed bills and direct bill payments. Inspect months with the chart/slider and ledger; filter warning breaches if helpful.

Generic reset values: investments $100,000; debt $20,000; monthly pay $5,000; bills $3,500; yield 7%; APR 4.24%; annual price growth 2%; pay/bill growth 3%; 100% cash distributions; target DTA 20%; ceiling 25%; coverage floor 3×; 60 months. These are software examples, not recommended settings. For backward compatibility the engine API's omitted routing options retain fixed financing/principal sweep; the visible UI explicitly selects the new constrained target mode.

### Short labels and accessible explanations

Open **?** for a plain-language explanation. Native expandable help works by click/touch, Tab, Enter and Space; it is not hover-only. Mobile targets are 44 pixels. Material inputs and the four summary metrics use the same pattern. **Price growth** means annual investment price change excluding distributions.

## Features and completeness

| Feature | Implemented behavior | Interpretation limit |
|---|---|---|
| Monthly maximum financing | Largest feasible cent amount/share of entered bills, with pay-funding and ending checks | Not a sustainable whole-horizon spending budget or lender capacity |
| A: Principal sweep | Remaining distribution cash pays principal as far as possible | Voluntary, not a scheduled amortizing payment |
| B: Target then reinvest | Pays principal toward ending target DTA, then reinvests remaining cash | Does not guarantee the target or borrow solely to reach it |
| A/B comparison | Same starting values, horizon, financing rule and stress | Each path recalculates its own capacity; later financed amounts can differ |
| Distribution split | Immediate reinvestment is separate from cash available for interest | Immediately reinvested distributions do not provide cash coverage |
| Guardrails | Ending DTA and period cash-interest coverage | No intraday/peak or actual lending checks |
| Combined stress | Specified asset/yield/rate/income shocks | Sensitivity, not calibrated forecast/probability |
| Chart and timeline | Investments, debt, net equity, generated surplus and monthly inspection | Balance-sheet values, not price-only performance |
| Ledger/CSV | Monthly flows, financing constraint and checks | Standard rounded export cannot exactly recreate a full-precision run |

### DTA, utilization, target and ceiling

**DTA = margin debt ÷ investment assets.** Generated surplus is excluded. This remains DTA throughout the app; it is **not M1 Smart Rules utilization**. Translate utilization separately using the applicable M1 credit limit/current terms. Do not copy the same percentage or assume the denominators match. Credit eligibility, borrowing limits and maintenance requirements differ from this model.

The **target** guides B's allocation of cash after interest. It is measured after the draw, interest treatment, principal payment and reinvestment. If the account is below target, B does not manufacture borrowing to raise it. If cash is insufficient, it pays available cash toward principal and remains above target.

The **ceiling** limits financing only in Maximum mode. A lower target is an operating aim, not a second hard threshold. A target above the ceiling does not override it. Equality passes within the documented numerical tolerance.

**Cash-interest coverage = cash-allocated distributions ÷ modeled period interest.** Interest is measured before the sweep, not recomputed from ending debt. Immediate reinvestment is excluded. Cash that B later reinvests was available to pay interest first and remains in this numerator. This is not household DSCR, total-bill coverage or principal-service coverage. Zero interest is N/A.

## Exact monthly calculation sequence

1. Apply any one-time asset shock, then annual price growth divided by 12 to opening investments. Grow the pay and bill baselines similarly, including **month one**. Apply income interruption to grown pay.
2. Calculate distributions on price-grown opening investments **before** new pay or reinvestment. Divide annual yield by 12 and apply any yield-stress multiplier.
3. Split distributions into immediate reinvestment R and cash C. These sum to total distributions before display rounding.
4. Choose financed bills F. Fixed mode uses all bills B. Maximum requires 0≤F≤B and invested pay P−(B−F)≥0, then tests ending checks. Unfinanced bills B−F are paid directly from pay P.
5. Interest I=(opening debt D+F)×APR/12. Cash pays min(C,I). Only uncovered interest max(0,I−C) capitalizes into debt. Capitalization is a hypothetical model choice, not verified lender permission.
6. Define Q=D+F+uncovered interest; cash remaining L=max(0,C−I); and base investments A*=price-grown investments+remaining pay+R. A repays min(Q,L) principal and retains any remainder as generated surplus. B calculates the target payment below.
7. Update investments, debt and surplus, then evaluate ending DTA and coverage. Fixed mode records failures and continues; Maximum stops before a month with no feasible funded route.
8. Reconcile net equity for every completed row.

For B and target fraction t, where 0≤t<1:

```text
principal payment = clamp((Q − t × (A* + L)) / (1 − t), 0, min(Q,L))
cash reinvested = L − principal payment
ending investments = A* + cash reinvested
ending debt = Q − principal payment
```

Reinvesting remaining cash itself lowers DTA, so it must be included in the target denominator. Principal payment and reinvestment are different internal allocations, not new income.

```text
net equity = investments + generated surplus − debt
change in equity = take-home pay − all bills + price gain − shock loss
                   + total distributions − interest
```

Borrowing is not extra income; principal repayment is not an extra loss. Capitalized interest remains an economic cost even when no cash pays it. Generated surplus starts at zero, earns no return and never funds bills.

### Solver and failure treatment

Maximum financing enumerates all piecewise-linear regions created by interest shortfall, debt clearance and target-payment clamping. It intersects funding and ratio constraints in each region and considers the greatest cent amount in every feasible interval, plus the exact bill ceiling. It does not assume a coarse scan or binary monotonic search is sufficient and does not silently truncate a search. See the [specification](flowsim-v2-routing.md) for tolerances.

This is a **monthly model maximum at cent precision**, not a continuous exact optimum, guaranteed long-horizon budget or actual lender limit. If no feasible cent amount exists, the path stops, including when inherited debt prevents a route. Zero financing is not automatically passing; zero investment assets do not establish feasible capacity. The failure reports the minimum draw needed to fund bills. Displayed balances belong to the last completed month, not an unfunded failed balance sheet. Paths ending at different months cannot be compared as full-horizon performance outcomes.

## Worked month-by-month example — synthetic data only

This 12-month example is generated and verified against the implemented engine. Starting investments are **$10,000**, debt **$2,400**, equity **$7,600**, monthly take-home pay **$1,000** and bills **$300**. Annual price/pay/bill growth, distribution yield and APR are each **12%**, giving 1% monthly rates. Cash allocation is **100%** and immediate reinvestment **0%**. Mode: Maximum; sweep B; target 20%; ceiling 25%; coverage floor 3×; no stress. The conspicuous rates are teaching assumptions, not forecasts or recommendations.

Month one in order:

1. Investments gain $100 to $10,100. Pay grows to $1,010 and bills to $303.
2. Distributions are $10,100×1%=$101: $101 cash and $0 immediate reinvestment.
3. The full $303 bill draw is feasible. All $1,010 pay is invested. Interest is ($2,400+$303)×1%=$27.03, paid from distributions. Capitalization is $0.
4. Cash after interest is $73.97. Reaching target would require more principal payment than available, so all $73.97 reduces principal; cash redirected to investments is $0.
5. Ending investments=$11,110; debt=$2,629.03; equity=$8,480.97; DTA=23.66%; coverage=3.74×. Both checks pass even though the 20% target has not yet been reached.
6. Equity rises **$880.97 = $1,010−$303+$100+$101−$27.03**. The $303 borrowed does not itself create wealth.

The tables show two-decimal values; checks and accounting retain full precision. Here interest charged equals interest cash-paid; capitalized interest, immediate reinvestment, directly paid bills and retained generated cash are zero throughout. All listed pay is invested and all bills financed. In month 10, B can first reach target and reinvest residual cash.

<!-- BEGIN VERIFIED EXAMPLE -->
| Month | Pay invested | Bills financed | Distributions (cash) | Interest paid | Principal paid | Cash reinvested after target |
|---:|---:|---:|---:|---:|---:|---:|
| 1 | 1010.00 | 303.00 | 101.00 | 27.03 | 73.97 | 0.00 |
| 2 | 1020.10 | 306.03 | 112.21 | 29.35 | 82.86 | 0.00 |
| 3 | 1030.30 | 309.09 | 123.64 | 31.61 | 92.02 | 0.00 |
| 4 | 1040.60 | 312.18 | 135.28 | 33.81 | 101.46 | 0.00 |
| 5 | 1051.01 | 315.30 | 147.14 | 35.95 | 111.19 | 0.00 |
| 6 | 1061.52 | 318.46 | 159.23 | 38.03 | 121.20 | 0.00 |
| 7 | 1072.14 | 321.64 | 171.54 | 40.03 | 131.51 | 0.00 |
| 8 | 1082.86 | 324.86 | 184.09 | 41.96 | 142.12 | 0.00 |
| 9 | 1093.69 | 328.11 | 196.86 | 43.82 | 153.04 | 0.00 |
| 10 | 1104.62 | 331.39 | 209.88 | 45.61 | 136.66 | 27.62 |
| 11 | 1115.67 | 334.70 | 223.41 | 47.59 | 40.20 | 135.62 |
| 12 | 1126.83 | 338.05 | 238.28 | 50.57 | 34.94 | 152.78 |

| Month | Opening investments | Price gain | Ending investments | Ending debt | Net equity | Equity change | DTA | Cash coverage | Decision |
|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| 1 | 10000.00 | 100.00 | 11110.00 | 2629.03 | 8480.97 | 880.97 | 23.66% | 3.74× | Pass; All entered bills |
| 2 | 11110.00 | 111.10 | 12241.20 | 2852.20 | 9389.00 | 908.03 | 23.30% | 3.82× | Pass; All entered bills |
| 3 | 12241.20 | 122.41 | 13393.91 | 3069.27 | 10324.65 | 935.65 | 22.92% | 3.91× | Pass; All entered bills |
| 4 | 13393.91 | 133.94 | 14568.46 | 3279.98 | 11288.47 | 963.83 | 22.51% | 4.00× | Pass; All entered bills |
| 5 | 14568.46 | 145.68 | 15765.15 | 3484.10 | 12281.05 | 992.58 | 22.10% | 4.09× | Pass; All entered bills |
| 6 | 15765.15 | 157.65 | 16984.32 | 3681.35 | 13302.97 | 1021.92 | 21.68% | 4.19× | Pass; All entered bills |
| 7 | 16984.32 | 169.84 | 18226.30 | 3871.48 | 14354.82 | 1051.85 | 21.24% | 4.29× | Pass; All entered bills |
| 8 | 18226.30 | 182.26 | 19491.42 | 4054.22 | 15437.21 | 1082.38 | 20.80% | 4.39× | Pass; All entered bills |
| 9 | 19491.42 | 194.91 | 20780.02 | 4229.28 | 16550.74 | 1113.53 | 20.35% | 4.49× | Pass; All entered bills |
| 10 | 20780.02 | 207.80 | 22120.06 | 4424.01 | 17696.05 | 1145.31 | 20.00% | 4.60× | Pass; All entered bills |
| 11 | 22120.06 | 221.20 | 23592.55 | 4718.51 | 18874.04 | 1177.99 | 20.00% | 4.69× | Pass; All entered bills |
| 12 | 23592.55 | 235.93 | 25108.08 | 5021.62 | 20086.46 | 1212.42 | 20.00% | 4.71× | Pass; All entered bills |
<!-- END VERIFIED EXAMPLE -->

### Partial financing and a no-feasible-path example

A separate one-month example uses investments $10,000, debt $2,500, pay $1,000, bills $500, zero growth/yield/APR, ceiling 25% and no interest-coverage minimum. Ending investments=$10,500+F and debt=$2,500+F. `(2500+F)/(10500+F)≤0.25` gives F≤$166.666… . The greatest cent draw is **$166.66**. Pay covers **$333.34** of bills and **$666.66** is invested. The app cannot also invest the full $1,000.

Change only the main 12-month example's split to **30% immediate reinvestment / 70% cash**. Month-one cash becomes $70.70. Even with zero new financing, interest on existing debt is $24 and cash coverage is **2.95×**, below the selected 3× floor. Maximum stops before month one. It does not count immediate reinvestment as cash coverage or relax the floor to force a result. This constraint failure occurs even though pay could cover bills directly.

## Stress assumptions

- Month 13: one-time 30% investment decline before monthly growth.
- Month 13 onward: yield multiplied by 0.70; APR rises 3 percentage points.
- Months 13–18: zero take-home pay. Month 19 resumes the uninterrupted grown baseline; lost pay is not recovered.
- Bills keep growing. Generated cash cannot fund bills in either baseline or stress.

Asset decline and yield cut compound multiplicatively in distribution dollars. Price growth resumes at the entered rate; this is not a 30% monthly decline. APR/yield otherwise remain constant. Stopped paths have no fabricated recovery projection. Warning-only paths can continue with breaches. These severities are sensitivities, not probabilities, calibrated forecasts or all possible adverse conditions.

## Results, exports and privacy

The comparison reports completion, investments/debt/equity/cash, charged/capitalized interest, principal, redirected cash, financed/direct bills, invested pay, worst ending checks and all breach months. Four chart series, the inspector and the ledger use the same rows. Principal payments are separate from interest and household expenses.

Percentage inputs display at most two decimals after editing. Users can type more digits; the full numeric value stays in memory. Unrelated edits/help do not round it. Deliberately replacing the field replaces its value. There is no automatic persistence: reload/reset behavior is unchanged.

Standard CSV percentage inputs, DTA and APR round to two decimals. Legacy fraction fields retain units and round to equivalent percentage resolution. The UI/file disclose that rounded inputs cannot exactly reproduce a full-precision scenario. Canonical internal keys such as `drip` remain compatible; the visible description is Reinvested distributions. Programmatic `toCsv(result,{fullPrecision:true})` preserves unrounded numeric values without another normal-screen control.

The single HTML includes CSS/JavaScript/SVG, with no external runtime dependencies, account linking, analytics, storage or input transmission. CSP blocks network connections. The public host receives ordinary page requests, but the app does not send inputs or place them in URLs. CSV contains the user's entered scenario and should be handled accordingly. Repository defaults/examples/tests are synthetic. The original `flowsim.html` is a separate app, unchanged by this iteration.

## What is not implemented

The current deterministic planner is functional, but is not a complete financial plan or brokerage simulator. It excludes:

- Actual M1 credit limits/utilization translation, collateral eligibility/haircuts, maintenance calls, forced liquidation and permission to capitalize unpaid interest.
- Daily accrual, billing dates, payment/distribution settlement calendars and intramonth liquidity. APR/12 on opening debt plus the full draw is an approximation. Voluntary principal reduction is **not an amortizing installment**.
- Peak/post-shock enforcement. Ending-only checks can conceal an intramonth breach.
- Taxes, fees, fund-level payout sustainability, tax return-of-capital character, portfolio composition and total-return research.
- Real purchasing-power balances, a matched unlevered pay-cash benchmark, optimized sustainable budgets or stochastic probabilities.
- External reserves, asset sales to bridge gaps, custom stress paths, scenario import/save, account synchronization and transactions.

Zero interest is N/A coverage. Positive debt with zero assets has undefined numeric DTA and an infinite/Fail state. Zero debt and zero assets is N/A, not certification. Warning-only mode can continue into negative equity. These are diagnostic states, not permission.

## Verification and development direction

Tests cover independent first-month and 60-month calculations, cash splits, target math, cent reference cases, narrow/no feasible intervals, large values, inherited breaches, zero denominators, capitalization, stress timing, reconciliation, invalid clearing, comparison/chart/ledger agreement, CSV, precision retention, help and reset. `tests/flowsim-v2-docs.cjs` checks this worked example against the engine. Desktop/mobile browser checks cover layout, keyboard/click help and representative mode transitions. CSV Blob content is verified automatically; a completed Chrome filesystem download has not been independently verified.

With Node 24 and jsdom available through NODE_PATH:

```sh
node --test --test-isolation=none tests/flowsim*.test.js
for test in tests/flowsim*.cjs; do node "$test"; done
```

GitHub Actions runs relevant checks sequentially on PRs/site-branch updates. Future development may add an explicit pay-cash benchmark, real-dollar purchasing-power views, custom stress paths, dated lender limits distinct from DTA, scenario portability and richer failure diagnostics. These are directions, **not implemented features or release promises**. Changes should preserve reconciliation, privacy and the distinction between modeling and lender permission.

Initial V2's grouped inputs/live projection experience was informed by a reference planner. No reference branding, assets or code were copied. V2 uses its own stated timing, unpaid-interest accounting and surplus treatment. Its current source, specification and tests—not another app—define behavior.
