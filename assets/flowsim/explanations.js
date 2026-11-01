/* Presentation only. Reads recorded results; never changes the routing policy. */
'use strict';
(function(root){
 const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2});
 const names={peak_dta:'the stressed peak DTA guardrail',interest_coverage:'stressed interest-only DSCR',dta_undefined:'an undefined DTA ratio',coverage_undefined:'undefined interest-only DSCR',cash_funding:'available household funding',monthly_ceiling_or_grid:'the monthly increase ceiling or test grid',below_grid:'a ceiling below one test increment'};
 const months=rows=>rows.slice(0,6).map(r=>r.month).join(', ')+(rows.length>6?` and ${rows.length-6} more`:'');
 function describe(result,c){
  const f=result.flow, rows=f.monthly, done=rows.filter(r=>r.status!=='failed'), cmp=result.comparison, detail=[];
  let outcome;
  if(!cmp.same_full_horizon)outcome='Ending net equity cannot be compared at the full horizon because at least one path stopped. The last balances are not an equal-horizon result.';
  else {const diff=cmp.ending_equity_advantage;outcome=Math.abs(diff)<.005?`FLOW and paying bills directly end with the same net equity to the nearest cent at month ${c.months}.`:`FLOW ends with ${money.format(Math.abs(diff))} ${diff>0?'more':'less'} net equity than paying bills directly at month ${c.months}.`;outcome+=' Both start with the same assets and existing debt.';}
  const breached=rows.filter(r=>r.scenario_constraint_violations.length), undefinedRows=rows.filter(r=>r.scenario_constraints_undefined.length);
  let limits='';
  if(f.failure){limits=`FLOW stops in month ${f.failure.month}: ${f.failure.reason.replaceAll('_',' ')}.`;detail.push(`Failed checks: ${f.failure.failed_checks.join(', ').replaceAll('_',' ')}. Unfunded cash: ${money.format(f.failure.cash_gap)}; inaccessible-cash gap: ${money.format(f.failure.accessible_cash_gap)}.`);}
  if(breached.length){limits+=(limits?' ':'')+`Recorded guardrail breaches in months ${months(breached)}.`;const labels={max_dta:'DTA',min_interest_coverage:'interest-only DSCR'};detail.push('Breached checks: '+[...new Set(breached.flatMap(r=>r.scenario_constraint_violations))].map(x=>labels[x]||x.replaceAll('_',' ')).join(', ')+'.');}
  if(undefinedRows.length)limits+=(limits?' ':'')+'Some ratios are N/A; this is not a complete guardrail pass.';
  const known=c.evidence?.reserve_status?.startsWith('User');
  if(!known)limits+=(limits?' ':'')+'B2 cash is unknown and excluded; resilience is unresolved. B2 is optional for financing, but household funding must still work.';
  if(!limits)limits='The recorded path completes within the selected numerical guardrails. This does not establish borrowing safety or lender approval.';
  let movement;
  if(!c.adaptive_policy)movement='Fixed mode keeps the financed share of bills constant; financed dollars follow modeled bills. Guardrail warnings do not adjust that share.';
  else {
   const up=[],down=[];for(let i=1;i<done.length;i++){const a=done[i-1],b=done[i];if(a.expenses>0&&b.expenses>0){const delta=b.routed_expenses/b.expenses-a.routed_expenses/a.expenses;if(delta>1e-9)up.push(b);else if(delta< -1e-9)down.push(b);}}
   movement=`The financed share rose in ${up.length} monthly transitions and fell in ${down.length}; only funded months are counted.`;
   const reasons=[...new Set(rows.flatMap(r=>r.routing_reasons||[]))].filter(r=>names[r]);
   if(reasons.length){limits+=' Adaptive financing was limited by '+reasons.slice(0,3).map(r=>names[r]).join('; ')+(reasons.length>3?'; see context for other checks.':'.');detail.push('Recorded screens: '+reasons.map(r=>names[r]).join('; ')+'. Adaptive reasons describe rejected tested increases or the search ceiling, not an exact borrowing maximum. Zero new financing does not mean inherited debt passed the guardrails.');}
   for(const [label,list]of [['First rise',up],['First fall',down]]){if(!list.length)continue;const b=list[0],a=done[done.indexOf(b)-1],changes=[];
    const oldCollateral=a.opening_assets+a.shock_return,newCollateral=b.opening_assets+b.shock_return;if(Math.abs(newCollateral-oldCollateral)>.005)changes.push('post-shock opening investments '+(newCollateral>oldCollateral?'rose':'fell'));
    for(const[key,name]of [['opening_debt','opening margin debt'],['expenses','bills'],['distributions','distributions'],['income','take-home pay']])if(Math.abs(b[key]-a[key])>.005)changes.push(`${name} ${b[key]>a[key]?'rose':'fell'}`);
    if(b.apr!==a.apr)changes.push(`APR ${b.apr>a.apr?'rose':'fell'}`);if(b.shock_return)changes.push('a market shock was recorded');
    detail.push(`${label}: month ${b.month}, from ${Number((100*a.routed_expenses/a.expenses).toFixed(2))}% to ${Number((100*b.routed_expenses/b.expenses).toFixed(2))}%. ${changes.length?'Alongside this, '+changes.join(', ')+'. ':''}These are observations, not isolated causes.`);
   }
  }
  detail.push('More bill financing can free household cash for contribution. It does not reduce the income assumed here or calculate the minimum paycheck needed. Total invested can also include excess distributions; it is not a separately traced paycheck contribution.');
  detail.push('Rates, growth and stress paths are assumptions. B2 is modeled as separate nonyielding cash. This is a monthly FLOW illustration, not the full Maximum Contribution or M1 sweep workflow.');
  return {outcome,limits,movement,detail};
 }
 const api={describe};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FlowExplanations=api;
})(typeof window==='undefined'?globalThis:window);
