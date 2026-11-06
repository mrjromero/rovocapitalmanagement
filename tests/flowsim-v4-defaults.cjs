const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

const expected = {
  assets: 25000, debt: 0, cash: 8200, upfront: 0, pay: 6338, bills: 5500,
  retain: 0, contribution: 100, financeStart: 1, target: 20, maxDta: 25,
  minCoverage: 3, yield: 7, apr: 5.25, growth: 2, payGrowth: 3.1,
  inflation: 3.7, months: 120, useCash: 1, reduceStart: 0, reduced: 50,
  stressStart: 0, shock: 0, yieldCut: 0, aprRise: 0, payCut: 0,
  payCutMonths: 0
};

for (const filename of ['FlowSimV4.html', 'flow-stages.html']) {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), {
    runScripts: 'dangerously', url: 'http://localhost/' + filename
  });
  const w = dom.window, d = w.document, F = w.FlowSimV4;
  const $ = id => d.getElementById(id);
  function checkDefaults() {
    assert.deepEqual({ ...F.defaults }, expected, filename + ': exact defaults');
    for (const [key, value] of Object.entries(expected)) {
      assert.equal(Number($(key).value), value, filename + ': ' + key);
      assert.equal($(key).getAttribute('aria-invalid'), 'false');
    }
    assert($('error').hidden);
    assert.equal($('ledgerBody').rows.length, 120);
    assert.equal($('warningsOnly').getAttribute('aria-pressed'), 'false');
    assert.equal($('inspect').value, '1');
    assert.equal($('cash').value, '8200');
    assert.equal($('pay').value, '6338');
    assert.equal($('bills').value, '5500');
    assert.equal($('apr').value, '5.25');
    assert.equal($('payGrowth').value, '3.10');
    assert.equal($('inflation').value, '3.70');
  }
  try {
    checkDefaults();
    const initialLedger = $('ledgerBody').innerHTML;
    for (let repeat = 0; repeat < 2; repeat++) {
      for (const [key, value] of Object.entries(expected)) $(key).value = value + 1;
      // Exercise cached full precision as well as ordinary edited values.
      for (const key of ['apr', 'payGrowth', 'inflation']) {
        $(key).value = '8.123456';
        $(key).dispatchEvent(new w.FocusEvent('focusout', { bubbles: true }));
      }
      $('warningsOnly').click();
      $('inspect').value = 37;
      $('reset').click();
      checkDefaults();
      assert.equal($('ledgerBody').innerHTML, initialLedger);
      for (const key of ['apr', 'payGrowth', 'inflation']) {
        $(key).dispatchEvent(new w.FocusEvent('focusin', { bubbles: true }));
        assert.equal(Number($(key).value), expected[key], 'Reset clears cached precision');
      }
    }
  } finally {
    w.close();
  }
}
console.log('V4 defaults PASS: all initial values and repeated resets match at both URLs; edited values, precision, filter and month selection are cleared.');
