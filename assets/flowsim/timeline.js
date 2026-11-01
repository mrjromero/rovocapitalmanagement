/* Read-only view of the same monthly rows used by the ledger and CSV. */
'use strict';
window.FlowTimeline=(()=>{
 const $=id=>document.getElementById(id), money=new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',minimumFractionDigits:0,maximumFractionDigits:2});
 const lanes=[['unrouted_expenses','Bills paid directly','outflow'],['routed_expenses','Bills financed','borrowing'],['financed_share','Share of bills financed','share'],['income','Take-home pay','inflow'],['distributions','Cash distributions','inflow'],['interest_paid','Interest paid in cash','outflow'],['capitalized_interest','Interest added to debt','borrowing'],['invested','Total invested','allocation'],['principal_repaid','Debt repaid','allocation'],['assets','Ending investments','balance'],['debt','Ending debt','balance'],['cash','Ending B2 modeled cash','balance'],['net_equity','Net equity','balance']];
 const reasonLabels={"reserve_unknown":"Cash reserves are unknown","reserve_screen":"Limited by accessible cash reserves","dta_undefined":"Debt ratio cannot be calculated","peak_dta":"Limited by stressed peak debt ratio","coverage_undefined":"DSCR (interest-only) cannot be calculated","interest_coverage":"Limited by stressed DSCR (interest-only)","cash_funding":"Current bills and interest cannot be funded","monthly_ceiling_or_grid":"At the monthly financing ceiling or grid limit","below_grid":"Financing ceiling is below one grid increment","pay_cash":"Bills are paid directly","fixed":"Original fixed share of bills"};
 const explainReasons=reasons=>reasons.map(r=>reasonLabels[r]??r).join("; ");
 let result=null,config=null,month=1;
 const dialog=$('timelineDialog'),grid=$('timelineGrid'),detail=$('timelineDetail');
 const element=(tag,text,cls)=>{const e=document.createElement(tag);e.textContent=text;if(cls)e.className=cls;return e;};
 const activeLanes=()=>config?.adaptive_policy?lanes.concat([['paycheck_target_invested','Household cash allocated to investment','allocation'],['distribution_expense_coverage','Distributions / all bills','share']]):lanes;
 const known=()=>config.evidence.reserve_status.startsWith('User');
 function rowAt(m){return result[$('timelineMode').value].monthly.find(r=>r.month===m);}
 function amount(row,key){if(row&&key==='financed_share')return row.expenses>0?Number((100*row.routed_expenses/row.expenses).toFixed(2))+'%':'N/A (no bills)';if(row&&key==='distribution_expense_coverage')return row[key]===null?'N/A':Number((100*row[key]).toFixed(2))+'%';return key==='cash'&&!known()?'Unknown / excluded':row?money.format(Math.abs(row[key])<.005?0:row[key]):'Not modeled';}
 function state(m){const path=result[$('timelineMode').value],r=rowAt(m);return r?(r.status==='failed'?'Funding failed':r.scenario_constraint_violations.length?'Guardrail breached':r.scenario_constraints_undefined.length?'Ratio undefined':'Modeled'):(path.failure&&m>path.failure.month?'Stopped — not modeled':'No row available');}
 function inspect(m,scroll=false){
  if(!result)return;
  month=Math.max(1,Math.min(config.months,Math.round(m)));$('timelineMonth').value=month;$('timelineMonth').setAttribute('aria-valuetext',`Month ${month}`);
  $('timelinePrevious').disabled=month===1;$('timelineNext').disabled=month===config.months;
  const r=rowAt(month);const summary=$('timelineSummary');summary.replaceChildren(element('strong',`Month ${month} - ${state(month)}`));if(r)summary.append(element('p',`Direct: ${amount(r,'unrouted_expenses')} | Financed: ${amount(r,'routed_expenses')} (${amount(r,'financed_share')})`));detail.replaceChildren(element('h3',`${$('timelineMode').selectedOptions[0].textContent} · Month ${month}`),element('p',state(month),'timeline-state'));
  if(r){if(r.routing_decision){detail.append(element('p',`Routing: ${r.routing_decision}. ${explainReasons(r.routing_reasons)}`));detail.append(element('p','Financing changes how bills are paid; it does not reduce the take-home income assumed here.','hint'));}if(r.status==='failed')detail.append(element('p','This is the failed-month ledger snapshot, not a successfully funded month.'));
   if(config.adaptive_policy)detail.append(element('p','Household cash allocated to investment comes from pooled available cash, not separately traced salary dollars.','hint'));detail.append(element('p',`Highest monthly DTA including borrowing peak: ${r.period_max_dta===null?'N/A':Number((r.period_max_dta*100).toFixed(2))+'%'}`));if(r.scenario_constraint_violations.length)detail.append(element('p',`Limits: ${r.scenario_constraint_violations.join(', ')}`));
   const dl=element('dl','');for(const[key,label]of activeLanes()){dl.append(element('dt',label),element('dd',amount(r,key)));}detail.append(dl);
  }else detail.append(element('p','No amounts are projected after the path stops. Earlier months remain available.'));
  grid.querySelectorAll('[data-month]').forEach(e=>{const selected=Number(e.dataset.month)===month;e.classList.toggle('selected',selected);if(e.tagName==='BUTTON'){e.setAttribute('aria-pressed',String(selected));e.tabIndex=selected?0:-1;}});
  if(scroll){const e=grid.querySelector(`[data-month="${month}"]`);e?.scrollIntoView?.({block:'nearest',inline:'center'});}
 }
 function draw(){
  grid.replaceChildren();if(!result){$('timelineSummary').replaceChildren();detail.replaceChildren(element('p','Run a valid scenario to view its monthly timeline.'));return;}
  const table=element('table','');table.className='timeline-table';table.append(element('caption','Monthly amounts from the last run. Colored bands identify categories; their widths represent one month, not dollar magnitude. In the financed-share row, gold is financed and gray is direct-paid.'));
  const head=element('thead',''),hr=element('tr','');hr.append(element('th','Monthly ledger'));
  for(let m=1;m<=config.months;m++){const th=element('th','');th.scope='col';th.dataset.month=m;const b=element('button',`M${m}`);b.type='button';b.dataset.month=m;b.setAttribute('aria-label',`Inspect month ${m}`);th.append(b);hr.append(th);}head.append(hr);table.append(head);
  const body=element('tbody','');const statusRow=element('tr','');const sh=element('th','Path status');sh.scope='row';statusRow.append(sh);
  for(let m=1;m<=config.months;m++){const td=element('td',state(m),rowAt(m)?.status==='failed'?'timeline-failed':state(m).startsWith('Guardrail')?'timeline-breach':'timeline-state');td.dataset.month=m;statusRow.append(td);}body.append(statusRow);
  for(const[key,label,cls]of activeLanes()){const tr=element('tr','');const th=element('th',label);th.scope='row';tr.append(th);
   for(let m=1;m<=config.months;m++){const r=rowAt(m),td=element('td','');td.dataset.month=m;const value=amount(r,key);if(r){const b=element('button',value,`timeline-band ${cls}${r[key]===0?' zero':''}`);if(key==='financed_share'&&r.expenses>0)b.style.background=`linear-gradient(to right,#98631e ${100*r.routed_expenses/r.expenses}%,#566660 ${100*r.routed_expenses/r.expenses}%)`;b.type='button';b.dataset.month=m;b.setAttribute('aria-label',`Month ${m}, ${label}: ${value}. ${state(m)}. Inspect month.`);td.append(b);}else td.append(element('span','—','timeline-stopped'));tr.append(td);}body.append(tr);
  }table.append(body);grid.append(table);$('timelineMonth').max=config.months;
  $('timelineReserve').textContent=known()?'Safety Buffer B2 is separate nonyielding cash.':'Safety Buffer B2 is unknown / excluded, not a verified zero balance.';
  inspect(month);
 }
 grid.addEventListener('click',e=>{const b=e.target.closest('button[data-month]');if(b)inspect(Number(b.dataset.month));});
 grid.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||(e.movementX===0&&e.movementY===0))return;const b=e.target.closest('button[data-month]');if(b)inspect(Number(b.dataset.month));});
 grid.addEventListener('focusin',e=>{if(e.target.dataset.month)inspect(Number(e.target.dataset.month));});
 grid.addEventListener('keydown',e=>{const b=e.target.closest('button[data-month]');if(!b)return;const offset={ArrowLeft:-1,ArrowRight:1,PageUp:-12,PageDown:12}[e.key];if(offset!==undefined||e.key==='Home'||e.key==='End'){e.preventDefault();inspect(e.key==='Home'?1:e.key==='End'?config.months:month+offset,true);grid.querySelector(`thead button[data-month="${month}"]`)?.focus();}});
 $('timelineMonth').addEventListener('input',e=>inspect(Number(e.target.value),true));
 $('timelinePrevious').addEventListener('click',()=>inspect(month-1,true));$('timelineNext').addEventListener('click',()=>inspect(month+1,true));
 $('timelineMode').addEventListener('change',draw);
 $('viewTimeline').addEventListener('click',()=>{draw();dialog.showModal();$('timelineClose').focus();});
 $('timelineClose').addEventListener('click',()=>dialog.close());
 dialog.addEventListener('close',()=>$('viewTimeline').focus());
 return {explainReasons,update(r,c){result=r;config=c;$('viewTimeline').disabled=!r;if(dialog.open)draw();},clear(){result=null;config=null;$('viewTimeline').disabled=true;if(dialog.open)draw();}};
})();
