/* UI only: calculations are in the separately regression-tested engine. */
'use strict';
(() => {
const form=document.querySelector('#scenario'), $=id=>document.getElementById(id);
const money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:2});
const compact=new Intl.NumberFormat('en-US',{notation:'compact',maximumFractionDigits:1});
const pct=v=>v===null?'N/A':`${(100*v).toFixed(2)}%`, cash=v=>money.format(v);
let latest=null, latestConfig=null;
const columns=[['month','Month','int'],['opening_assets','Opening investments'],['opening_debt','Opening debt'],['opening_cash','Opening reserve'],['income','Take-home pay'],['expenses','All bills'],['unrouted_expenses','Bills paid directly'],['routed_expenses','Bills financed'],['interest','Interest cost'],['interest_paid','Interest paid in cash'],['capitalized_interest','Interest added to debt'],['household_cash_after_financing','Paycheck cash after financing'],['invested','Total invested'],['distributions','Cash distributions'],['principal_repaid','Debt repaid'],['price_gain','Price change'],['shock_return','Shock gain / loss'],['assets','Ending investments'],['cash','Ending reserve'],['debt','Ending debt'],['net_equity','Net equity'],['real_net_equity','Inflation-adjusted equity'],['external_surplus','Household surplus'],['economic_return','Economic return'],['dta','Debt / investments','pct'],['period_max_dta','Highest monthly debt ratio','pct'],['portfolio_interest_coverage','Interest coverage','ratio'],['accounting_residual','Reconciliation error'],['status','Funding status','text'],['scenario_constraint_violations','Limits breached','list']];
const simple=['month','income','unrouted_expenses','routed_expenses','interest_paid','capitalized_interest','invested','distributions','principal_repaid','assets','debt','net_equity','dta'];
function num(name){const raw=form.elements[name].value;if(raw.trim()==='')throw new Error(`Please enter ${name}.`);const n=Number(raw);if(!Number.isFinite(n))throw new Error(`Invalid ${name}.`);return n;}
function configuration(){
 const c=FlowSim.defaultConfig();c.months=num('months');c.initial_assets=num('assets');c.initial_debt=num('debt');
 const known=form.elements.reserve.value.trim()!=='';c.initial_cash=known?num('reserve'):0;
 c.monthly_take_home=num('income');const bills=num('bills'),routed=num('routing');if(routed>bills)throw new Error('Bills financed cannot exceed total bills.');
 c.expenses=[{name:'All household living expenses',monthly_amount:bills,routed_fraction:bills>0?routed/bills:0}];
 c.annual_distribution_yield=num('yield')/100;c.annual_price_return=num('growth')/100;c.annual_apr=num('apr')/100;c.annual_income_growth=num('payGrowth')/100;c.annual_inflation=num('inflation')/100;c.interest_payment_policy=form.elements.interest.value;
 c.allocation.reserve_floor=c.initial_cash;c.shortfall_policy=known?'use_cash_reserves':'stop';
 c.scenario_constraints={max_dta:num('maxDta')/100,min_interest_coverage:num('coverage')};c.shocks=[];
 const stress=form.elements.stress.value,month=num('shockMonth');if(stress!=='none'){
  if(month>c.months)throw new Error('The shock month must be within the simulation.');
  const s={month,asset_multiplier:.8,distribution_multiplier:.75,apr_override:c.annual_apr+.02};if(stress==='combined')s.income_multiplier=0;c.shocks.push(s);
  if(stress==='combined'&&month+3<=c.months)c.shocks.push({month:month+3,income_multiplier:1});
 }
 c.evidence={classification:'Hypothetical educational scenario',currency:'USD',reserve_status:known?'User-entered hypothetical reserve':'Unknown / excluded; zero is a numerical sensitivity, not a factual statement',limitations:'No taxes, fees, daily timing or actual lender checks. No automatic emergency pause or restart policy.'};return c;
}
function fmt(v,type){if(v===null||v===undefined)return 'N/A';if(type==='pct')return pct(v);if(type==='ratio')return v.toFixed(2)+'×';if(type==='int')return v;if(type==='text')return v;if(type==='list')return v.join('; ')||'None';return cash(v);}
function table(){if(!latest)return;const mode=$('ledgerMode').value,cs=$('columnMode').value==='full'?columns:columns.filter(c=>simple.includes(c[0]));
 $('ledgerHead').replaceChildren();let hr=document.createElement('tr');for(const [,label]of cs){const th=document.createElement('th');th.textContent=label;th.scope='col';hr.append(th);}$('ledgerHead').append(hr);
 $('ledgerBody').replaceChildren();for(const row of latest[mode].monthly){const tr=document.createElement('tr');tr.className=row.status==='failed'?'failed':row.scenario_constraint_violations.length?'breach':'';for(const[key,,type]of cs){let td=document.createElement('td');td.textContent=fmt(row[key],type);tr.append(td);}$('ledgerBody').append(tr);}
}
function chart(){const c=latestConfig,series=[['FLOW investments',latest.flow,'assets','#adbdb5'],['FLOW debt',latest.flow,'debt','#bd7b2e'],['Pay-cash net equity',latest.pay_cash,'net_equity','#527ab0'],['FLOW net equity',latest.flow,'net_equity','#147b72']];
 const W=900,H=320,L=65,R=18,T=20,B=40;const initial=c.initial_assets+c.initial_cash-c.initial_debt;
 const points=series.map(([label,s,key,color])=>({label,color,values:[[0,key==='assets'?c.initial_assets:key==='debt'?c.initial_debt:initial],...s.monthly.map(r=>[r.month,r[key]])]}));
 const vals=points.flatMap(s=>s.values.map(p=>p[1]));let lo=Math.min(0,...vals),hi=Math.max(1,...vals);if(hi===lo)hi=lo+1;const x=m=>L+m/c.months*(W-L-R),y=v=>T+(hi-v)/(hi-lo)*(H-T-B);
 let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-labelledby="chartTitle chartDesc"><title id="chartTitle">Investments, debt, and net equity</title><desc id="chartDesc">Month-by-month values are also available in the accessible ledger and CSV. Lines stop if funding fails.</desc>`;
 for(let n=0;n<=4;n++){const v=lo+(hi-lo)*n/4;svg+=`<line x1="${L}" x2="${W-R}" y1="${y(v)}" y2="${y(v)}" stroke="#e2eae6"/><text x="${L-10}" y="${y(v)+4}" text-anchor="end" fill="#5b7075" font-size="11">$${compact.format(v)}</text>`;}
 for(const m of [...new Set([0,Math.round(c.months/2),c.months])])svg+=`<text x="${x(m)}" y="${H-12}" text-anchor="middle" fill="#5b7075" font-size="11">Month ${m}</text>`;
 for(const s of points)svg+=`<polyline fill="none" stroke="${s.color}" stroke-width="${s.label==='FLOW net equity'?3:2}" stroke-linejoin="round" points="${s.values.map(([m,v])=>`${x(m)},${y(v)}`).join(' ')}"/>`;
 $('chart').innerHTML=svg+'</svg>';
}
function render(){const f=latest.flow,p=latest.pay_cash,c=latestConfig;const breaches=f.monthly.filter(r=>r.scenario_constraint_violations.length);const undefinedLimits=f.monthly.some(r=>r.scenario_constraints_undefined.length);const known=c.evidence.reserve_status.startsWith('User');
 $('equity').textContent=cash(f.final.net_equity);$('equityDetail').textContent=`Month ${f.final.month}: ${cash(f.final.assets)} invested · ${cash(f.final.debt)} debt`;
 $('advantage').textContent=latest.comparison.same_full_horizon?cash(latest.comparison.ending_equity_advantage):'Not comparable';
 $('maxDta').textContent=pct(f.max_dta);const cov=f.monthly.map(r=>r.portfolio_interest_coverage).filter(v=>v!==null);$('coverageDetail').textContent=`Lowest interest coverage: ${cov.length?Math.min(...cov).toFixed(2)+'×':'N/A (no interest)'}`;
 const status=$('resultStatus');status.className='notice'+(f.status==='failed'||p.status==='failed'?' failed':breaches.length||undefinedLimits?' warning':'');
 let msg=f.status==='failed'?`FLOW stopped in month ${f.failure.month}: ${f.failure.reason.replaceAll('_',' ')}. No hidden borrowing covers the gap.`:breaches.length?`FLOW completes the modeled period but breaches an illustrative limit in month ${breaches[0].month}. This is not a safe borrowing amount.`:(undefinedLimits?'FLOW completes, but some limit ratios are undefined (N/A). This is not a complete limit pass or lender approval.':'FLOW completes the modeled period within the defined numerical limits. This is not a safety or lender approval.');
 if(p.status==='failed')msg+=` Pay-cash also stops in month ${p.failure.month}.`;
 msg+=known?' Entered reserves are included separately.':' Emergency reserves are unknown / excluded; resilience is unresolved.';status.textContent=msg;
 const r=f.monthly[0];$('routingSummary').replaceChildren();for(const[label,value]of [['Bills paid directly',r.unrouted_expenses],['Bills financed',r.routed_expenses],['Total invested',r.invested]]){const div=document.createElement('div');div.textContent=label;const strong=document.createElement('strong');strong.textContent=cash(value);div.append(strong);$('routingSummary').append(div);}
 $('monthOneExplanation').textContent=`Month 1 household surplus: ${cash(r.external_surplus)}. Economic return after interest: ${cash(r.economic_return-r.interest-r.fees-r.taxes)}. Debt repaid: ${cash(r.principal_repaid)}. Interest ${c.interest_payment_policy==='cash'?'paid in cash':'added to debt'}: ${cash(r.interest)}. Distributions are not counted twice.`;
 $('export').disabled=false;chart();table();
}
function csvEscape(v){const s=v===null||v===undefined?'':Array.isArray(v)?v.join('; '):String(v);return '"'+s.replaceAll('"','""')+'"';}
function exportCsv(){if(!latest)return;const records=[['FLOW Sim — hypothetical educational scenario'],['Model','Nominal annual / 12; opening-assets returns; opening debt + current bill borrowing interest'],['Costs','Taxes and fees excluded; no lender approval or daily timing model'],['Reserve status',latestConfig.evidence.reserve_status]];
 for(const key of ['months','initial_assets','initial_debt','initial_cash','monthly_take_home','annual_income_growth','annual_inflation','annual_distribution_yield','annual_price_return','annual_apr','interest_payment_policy'])records.push(['Assumption',key,latestConfig[key]]);
 records.push(['Assumption','initial_monthly_bills',latestConfig.expenses[0].monthly_amount],['Assumption','constant_routed_fraction',latestConfig.expenses[0].routed_fraction],['Assumption','maximum_dta',latestConfig.scenario_constraints.max_dta],['Assumption','minimum_interest_coverage',latestConfig.scenario_constraints.min_interest_coverage],['Assumption','shocks',JSON.stringify(latestConfig.shocks)],[]);
 const keys=Object.keys(latest.flow.monthly[0]);records.push(['Strategy',...keys]);for(const strategy of ['flow','pay_cash'])for(const r of latest[strategy].monthly)records.push([strategy,...keys.map(k=>r[k])]);
 const blob=new Blob(['\ufeff'+records.map(row=>row.map(csvEscape).join(',')).join('\r\n')],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='flowsim-monthly-ledger.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
function run(e){if(e)e.preventDefault();$('error').textContent='';try{if(!form.reportValidity())return;const c=configuration();const result=FlowSim.compare(c);latest=result;latestConfig=c;render();}catch(err){latest=null;latestConfig=null;$('error').textContent=err.message;$('export').disabled=true;$('resultStatus').className='notice failed';$('resultStatus').textContent='Scenario invalid. Correct the inputs and run again; no current result is available.';$('equity').textContent=$('advantage').textContent=$('maxDta').textContent='—';$('equityDetail').textContent=$('coverageDetail').textContent='';$('chart').replaceChildren();$('ledgerHead').replaceChildren();$('ledgerBody').replaceChildren();$('routingSummary').replaceChildren();$('monthOneExplanation').textContent='';}}
form.addEventListener('submit',run);$('reset').addEventListener('click',()=>{form.reset();run();});$('ledgerMode').addEventListener('change',table);$('columnMode').addEventListener('change',table);$('export').addEventListener('click',exportCsv);
form.addEventListener('input',()=>{if(latest){$('resultStatus').textContent='Inputs changed. Run the scenario to update results and CSV.';$('resultStatus').className='notice warning';$('export').disabled=true;}});run();
})();
