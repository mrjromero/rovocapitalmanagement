# Adaptive bill routing — educational design

Fixed routing remains the default and retains its original calculation and CSV. Adaptive routing is an optional scenario policy, not lender capacity or a recommended allowance. It changes new bill financing only; existing debt stays in all alternatives.

## Decision at the start of each month

After budget inflation and any opening shock, use opening investment assets, debt, accessible separate cash, current assumed payout rate and APR. Do not use future path entries, positive current price returns, current contributions or anticipated debt repayment as collateral. The policy evaluates an explicitly disclosed dollar grid from zero through the lesser of all modeled bills and the previous financed dollars plus the chosen monthly increase. Month one uses the entered initial financed bills as a ceiling. Candidates are enumerated from highest to lowest, without assuming cash feasibility improves at lower financing. Each candidate must also fund the actual current cash waterfall without relying on an asset sale to qualify. At most 10,000 candidates are allowed per month; a larger search requires increasing the disclosed grid size. The highest *tested* passing positive candidate is selected; no positive candidate means zero new bill financing. A decrease can be immediate; increases are bounded. Grid rounding can leave unused headroom and does not find an exact maximum.

For each candidate, apply additional user-entered asset haircut, payout reduction and APR increase to the current state. Stressed DTA is (opening debt + candidate + stressed capitalized interest, if applicable) / stressed opening investments. Interest-only coverage is stressed portfolio distributions / stressed interest on opening debt plus the entire candidate for a full month. Positive contributions, same-month repayments and price appreciation cannot hide this screening leverage. The actual accounting still uses the chosen cash-paid/capitalized interest convention. Zero assets or zero candidate interest are undefined, not unlimited capacity.

Require explicitly known accessible cash sufficient for the selected number of months of all current bills plus stressed interest, without credit for salary, distributions, borrowing or invested securities. This is a deliberately conservative, user-defined income-interruption cash screen. Unknown cash blocks new adaptive borrowing and leaves resilience unresolved. Existing debt can already breach a guardrail: routing zero does not erase that breach or repair a household funding gap. Existing engine funding checks continue to stop unfunded paths.

The defaults for these added controls are labeled hypothetical stress assumptions (20% asset haircut, 25% payout reduction, +2 APR points, three months of reserve coverage, $100 grid and $100 monthly increase), not universal policy. The main DTA and interest-only coverage thresholds remain explicit scenario inputs. Actual lender eligibility, maintenance, settlement and capitalized-interest permission are unmodeled. Extra stress screens are separate from the path's opening shocks and can deliberately compound those shocks.

## Accounting and comparison

The selected amount enters the existing monthly cash/debt waterfall. Every month's equity identity must still reconcile. Distributions cannot simultaneously pay bills, repay debt and be reinvested. Show realized paycheck-target investment separately from total investment, and show all-bills distribution coverage; more bill borrowing frees paycheck cash for investment but does not reduce the modeled income requirement or establish financial independence.

For adaptive runs compare adaptive, the original fixed share (from initial financed bills / initial bills), and matched pay-cash under identical starting debt/assets/cash, budgets, shocks, interest convention and allocations. If either path stops, full-horizon superiority is undefined. Fixed runs retain their existing outputs. Adaptive ledger/CSV add chosen share, ceiling, screening ratios, reserve requirement, decision/reasons and paycheck-target investment. The timeline uses these exact rows and shows direct-paid versus financed bills and financed percentage. It must not force an increasing share.

## Required evidence

Synthetic tests cover cash/capitalized interest, opening leverage, zero denominators, unknown/limited/restricted cash, zero bills, payout/rate/market shocks, income interruption, shrinkage and bounded increases; prefix invariance establishes no look-ahead. Compare a selected routing path replayed through the unchanged fixed engine, reconcile every monthly identity and preserve original regression fixtures. UI tests verify fixed defaults and adaptive ledger/CSV/timeline synchronization. Personal scenario tabs remain untouched.

## Narrow limitations and reporting

The opening accessible-cash screen is not a full stressed survival simulation. Including interest in cash coverage even when capitalized is a conservative scenario choice. Additional cushions compound path shocks. The monthly ramp can slow recovery and does not measure economic capacity. Zero-income borrowing may occur when the declared constraints permit; that is not paycheck independence. The model does not solve for minimum outside income. Candidates round down to grid increments; an off-grid ceiling is not separately tested.

The headline maximum DTA includes actual debt immediately after new financing/capitalized interest divided by post-shock pre-contribution collateral, alongside the existing opening/post-shock/closing measurements. Original accounting and its audit metric remain unchanged. Adaptive mode explicitly rejects day-count and interest-timing conventions other than nominal monthly opening-plus-routing.
