const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Keep the pre-sync Flow Stages backup defaults pinned separately.
const legacyExpected = {
  assets: 25000, debt: 0, cash: 0, upfront: 0, pay: 6338, bills: 5500,
  retain: 0, contribution: 100, financeStart: 1, target: 20, maxDta: 25,
  minCoverage: 3, yield: 7, apr: 5.25, growth: 2, payGrowth: 3.1,
  inflation: 3.7, months: 120, useCash: 1, reduceStart: 0, reduced: 50,
  stressStart: 0, shock: 0, yieldCut: 0, aprRise: 0, payCut: 0,
  payCutMonths: 0
};
const baselineExpected = {...legacyExpected, debt: 5000, pay: 5000, bills: 3500,
  maxDta: 30, bandFloor: 25, bandCeiling: 30, bandSplit: 70,
  payGrowth: 2.5, inflation: 3};
delete baselineExpected.target;

(async () => {
for (const filename of ['FlowSimV4.html', 'flow-stages.html', 'flow-stages-backup-2026-11-11.html']) {
  const source = fs.readFileSync(path.join(__dirname, '..', filename), 'utf8');
  const expected = filename === 'flow-stages-backup-2026-11-11.html' ? legacyExpected : baselineExpected;
  let cleanSnapshot;
  // A fresh document on each pass exercises initial load and a fresh reload.
  for (let load = 0; load < 2; load++) {
    const dom = new JSDOM(source, { runScripts: 'dangerously', url: 'http://localhost/' + filename });
    const w = dom.window, d = w.document, F = w.FlowSimV4, $ = id => d.getElementById(id);
    let exportedBlob, prints = 0;
    w.URL.createObjectURL = blob => (exportedBlob = blob, 'blob:test');
    w.URL.revokeObjectURL = () => {};
    w.HTMLAnchorElement.prototype.click = () => {};
    w.print = () => prints++;
    const set = (key, value) => { $(key).value = value; $(key).dispatchEvent(new w.Event('input', {bubbles:true})); };
    const snapshot = () => Object.fromEntries(['ledgerBody','chart','metrics','roadmap','monthDetail',...(filename!=='flow-stages-backup-2026-11-11.html'?['journeyCopy']:[])].map(id=>[id,$(id).innerHTML]));
    function checkDefaults() {
      assert.deepEqual({ ...F.defaults }, expected, filename + ': exact defaults');
      assert.deepEqual({ ...F.simulate({}).config }, expected, 'Omitted simulation inputs use the same defaults');
      for (const [key, value] of Object.entries(expected)) {
        assert.equal(Number($(key).value), value, filename + ': ' + key);
        assert.equal($(key).getAttribute('aria-invalid'), 'false');
      }
      assert($('error').hidden);
      assert.equal($('ledgerBody').rows.length, 120);
      assert.equal($('warningsOnly').getAttribute('aria-pressed'), 'false');
      assert.equal($('inspect').min, '1');
      assert.equal($('inspect').max, '120');
      assert.equal($('inspect').value, '1');
      assert.equal($('reduceStart').value, '0');
      assert.match($('roadmap').lastElementChild.textContent, /Disabled/);
      assert.equal($('apr').value, '5.25');
      assert.equal($('payGrowth').value, expected.payGrowth.toFixed(2));
      assert.equal($('inflation').value, expected.inflation.toFixed(2));
      if (filename !== 'flow-stages-backup-2026-11-11.html') {
        // Independently worked first month: $25,000 grows to $25,041.6667;
        // 30% draw room minus $5,000 debt is $2,512.50. $987.50 of bills
        // use wages, leaving $4,012.50 contributed. Interest is paid first,
        // then the 25.8569% in-band ratio sends 70% of surplus to reinvestment.
        const row = $('ledgerBody').rows[0];
        for (const [column, value] of [[2,'$5,000.00'],[3,'$3,500.00'],[4,'$2,512.50'],[6,'$987.50'],[8,'$4,012.50'],[12,'$32.87'],[15,'$33.96'],[16,'$79.25'],[17,'$29,133.41'],[18,'$7,478.54']]) assert.equal(row.cells[column].textContent, value);
        assert.match($('journeyCopy').textContent, /25%–30% debt band/);
        assert.match($('journeyCopy').textContent, /70% of surplus/);
        assert.match($('journeyCopy').textContent, /\$4,012\.50 of your \$5,000\.00 paycheck/);
        assert.match($('journeyCopy').textContent, /\$390,602\.38/);
        assert.match($('metrics').textContent, /\$390,602\.38/);
      }
    }
    try {
      checkDefaults();
      const initial = snapshot();
      if (cleanSnapshot) assert.deepEqual(initial, cleanSnapshot, 'Fresh reload restores all baseline rendering');
      cleanSnapshot = initial;
      for (let repeat = 0; repeat < 2; repeat++) {
        set('months', 37);
        assert.equal($('inspect').max, '37');
        assert.notEqual($('chart').innerHTML, initial.chart);
        for (const [key, value] of Object.entries(expected)) $(key).value = value + 1;
        // Cached fractional values must not survive reset either.
        for (const key of ['apr', 'payGrowth', 'inflation', ...(filename!=='flow-stages-backup-2026-11-11.html'?['bandSplit']:[])]) {
          $(key).value = '8.123456';
          $(key).dispatchEvent(new w.FocusEvent('focusout', { bubbles: true }));
        }
        $('warningsOnly').click();
        $('inspect').value = 37;
        $('reset').click();
        checkDefaults();
        assert.deepEqual(snapshot(), initial, 'Reset restores chart, ledger, roadmap, narrative and inspector');
        for (const key of ['apr', 'payGrowth', 'inflation']) {
          $(key).dispatchEvent(new w.FocusEvent('focusin', { bubbles: true }));
          assert.equal(Number($(key).value), expected[key], 'Reset clears cached precision');
        }
      }
      $('csv').click();
      const csv = await new Promise(resolve => { const reader=new w.FileReader(); reader.onload=()=>resolve(reader.result); reader.readAsText(exportedBlob); });
      for (const [key, value] of Object.entries(expected)) assert(csv.includes('"'+F.labels[key]+'","'+value+'"'), 'Export baseline '+key);
      $('pdf').click();
      assert.equal(prints, 1);
      assert.equal($('printReport').querySelectorAll('.print-section tbody tr').length, 360);
      assert.match($('printReport').textContent, new RegExp(filename!=='flow-stages-backup-2026-11-11.html'?'390,602\\.38':'[0-9]'));
      // Leave edited state before closing, so the next load cannot inherit it.
      set('pay', 1234);
      set('months', 7);
    } finally { w.close(); }
  }
}
console.log('V4 defaults PASS: synced active defaults and preserved backup baseline, initial/fresh reload, repeated reset, cached precision, charts, slider bounds, Stage 5 disabled, narrative, CSV and print.');
})().catch(error=>{console.error(error);process.exitCode=1;});
