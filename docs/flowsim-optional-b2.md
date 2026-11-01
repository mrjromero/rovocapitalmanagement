# Optional B2 in adaptive mode

Adaptive admission no longer requires known B2 cash or a minimum number of months of bills/interest in reserve. The UI removes the reserve-months control. Blank means unknown/excluded, zero means no modeled cash, and positive cash remains a separate asset. None is a safety certification.

Only the two reserve admission predicates are removed. Stressed peak DTA, interest-only DSCR, actual cash funding/access, grid/ramp limits, shock timing and no-look-ahead remain. Missing reserve dollars are not invented. Cash shortfalls can still stop a path. Positive B2 still funds shortfalls and is replenished to its original target; distributions, debt and net equity follow the existing waterfall.

The unchanged round sample in adaptive mode starts with $200 financed on its $100 test grid despite blank B2 (the $250 ceiling is off-grid). Fixed mode still starts at $250. These are hypothetical choices, not recommended capacity.

## Legacy and CSV compatibility

Engine configurations containing `adaptive_policy.reserve_known` or `reserve_months` are rejected with an explicit migration message, including false/zero values. They are not silently ignored or rewritten. To opt into this changed policy, a caller must deliberately remove both retired fields and review the scenario. The app has no persisted scenarios or import mechanism; existing open tabs are untouched.

The prior presentation CSV lacked its documented explicit schema marker and full canonical configuration record (individual assumptions and shock/policy JSON were present). This update adds both records and verifies full-precision configuration readback. CSV schema 3 retains schema 2 rounding and `_pct` units but removes the obsolete `screen_reserve_required` column and retired policy fields/reasons. Canonical configuration JSON records the new policy without a fictitious reserve setting. Consumers should handle the removed column. Historical CSVs remain historical records; do not reinterpret their reserve-gated decisions using this policy.

## Verification

Five dedicated tests cover blank versus explicit zero, positive cash without collateral inflation, unfunded no-reserve failure, hand-calculated interruption draw/replenishment and accounting identity, and explicit nonmutating rejection of legacy configurations. Existing adaptive replay, peak constraints, cash/capitalized interest, stress shrinkage, income/access failures and no-look-ahead tests remain. Fixed accounting fixtures remain unchanged.
