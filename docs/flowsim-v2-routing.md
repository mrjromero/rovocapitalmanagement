# Local routing comparison

This local extension keeps the original full-bill, warning-only planner available. It adds an A/B distribution-cash comparison and a separately selected maximum-financing rule. Generic defaults are unchanged; personal observations must stay in runtime inputs, never source or URLs.

## Two cash sweeps

Both choices use identical starting assets/debt, household assumptions, immediate reinvestment/cash allocation, growth, rates, stress and financing rule. First, cash distributions pay interest. Only uncovered interest capitalizes, as an explicit hypothetical borrowing assumption.

- A pays remaining distribution cash toward principal; cash left after all debt clears accumulates separately without return and cannot fund bills.
- B pays only the principal needed toward a chosen ending DTA target, then reinvests the rest. Insufficient cash pays as much principal as possible. It does not borrow merely to reach the target. The immediate reinvestment allocation remains separate and cannot pay interest.

Let Q be debt after the bill draw and uncovered interest; L the distribution cash remaining after interest; A the price-grown investments plus available-pay contributions and immediate reinvestment; t the target ratio (0 <= t < 1). Principal payment is clamp((Q - t(A+L))/(1-t), 0, min(Q,L)). Ending investments are A+L-payment and debt Q-payment. Thus reinvestment is included in the target denominator. A target can be missed when cash is insufficient, or already exceeded downward through contributions. It is not the hard DTA ceiling or lender capacity.

## Monthly maximum financing

Finance F of the entered bills B, pay B-F directly from take-home pay P, and invest P-B+F. Funding requires F >= max(0,B-P); financing cannot exceed B. Distributions use price-grown opening investments before new pay/reinvestment. Period interest is (opening debt+F)*APR/12. Ending DTA excludes generated cash; cash-interest coverage is the cash allocation before the sweep divided by period interest. Cash later reinvested by B was available to pay interest first. The immediate reinvestment allocation is excluded. Zero interest is N/A, not an infinite coverage value. Zero investment assets do not establish feasible capacity.

The solver partitions all piecewise-affine regions (interest shortfall, debt clearance and target payment clamp boundaries). In each region it intersects ending debt minus DTA ceiling times assets <= 0 and required interest coverage minus cash <= 0. It considers the largest cent-denominated financed amount in every feasible interval, plus the exact entered expense ceiling. This is a monthly maximum under this model at one-cent precision, not a continuous exact maximum, sustainable whole-horizon bill budget, or verified broker limit. There is no coarse scan, binary monotonicity assumption, or search truncation. Final feasibility uses the same 1e-12 ratio tolerance as row guardrail checks; household contribution tolerance is 1e-7 dollars. Full precision is retained internally; UI displays two decimals. A sub-cent-only feasible interval yields no feasible cent route unless the exact expense ceiling is feasible.

If no feasible funded amount exists, simulation stops before that month. The failure includes the required financing to pay all bills, and no negative-pay investment, reserve withdrawal, asset sale or invented loan bridges the gap. The last completed balances and horizon are displayed explicitly. A/B results with different stop horizons must not be interpreted as a full-horizon performance comparison. The full-financing alternative deliberately continues after guardrail breaches and is labeled warning-only.

## Stress, timing and limits

The bundled illustrative combined stress applies a one-time 30% asset decline at month 13, then monthly price growth. From month 13 onward yield is multiplied by 0.70 and APR increases by 3 percentage points. Pay is zero during months 13–18, then resumes its uninterrupted growth path. Bills keep growing. Generated cash is inaccessible for bill funding in both baseline and stress. These severities are assumptions, not calibrated forecasts.

Pay, bills and prices grow by nominal annual rate/12 starting in month 1. Price growth excludes distributions. All completed rows reconcile equity change = take-home pay - all bills + price gain - shock loss + distributions - interest. Equity includes only modeled investments plus generated surplus minus debt; external reserves are excluded. Both warning and enforced modes use ending ratios; they do not enforce peak or post-shock DTA and cannot certify intramonth liquidity or avoid a real margin call. Voluntary principal sweeps are not amortizing installments. M1 daily accrual, payment dates, collateral eligibility, maintenance, liquidation and permission to capitalize interest are not modeled. Taxes/fees are excluded.

## Validation

Existing 12 engine regressions retain legacy fixed-sweep behavior. Added routing tests cover hand-calculated targets and capacity, split conservation, zero target/debt/interest/assets, interest capitalization, off-grid expense ceilings, inherited breaches, funding failure, stress timing, large values and exhaustive cent comparison over 300 deterministic synthetic cases. Separate DOM regression checks comparison, mode and target changes, failure horizons, chart/ledger counts, invalid clearing and reset. All committed examples are synthetic. CSV retains legacy keys and appends routing/failure information and additional flow columns.

## Labels, help and percentage precision

Short labels such as Price growth have native expandable ? help. Price growth means annual investment price change excluding distributions. Help is outside input labels, has descriptive accessible names, and opens with click/touch or Enter/Space; it is not hover-only. Mobile targets are 44 pixels. Material inputs and the four summary metrics use the same pattern.

Committed percentage fields display at most two decimals. During editing, users can enter additional digits; on change/blur the display rounds, while a separate in-memory value retains the full entered JavaScript numeric precision. Unrelated edits and rerenders do not replace it with the rounded display. Re-editing the field deliberately replaces its value; reset clears retained precision. Allocation complements retain full precision. Existing engine input keys and scenario semantics are unchanged. There is no automatic persistence; reloading still resets the app as before.

The normal user CSV rounds percentage inputs, DTA percentages and APR to two decimals. Existing fraction-valued financedShare and failure-DTA fields retain their units and use four decimal places, equivalent to 0.01 percentage-point resolution. Both the UI and CSV explain that rounded exports cannot exactly reproduce a full-precision scenario. Programmatic consumers can request `FlowSimV2.toCsv(result, {fullPrecision:true})` for unrounded numeric values with the same canonical column names. This option does not add a normal-screen control. Calculation and guardrail checks always retain full precision.
