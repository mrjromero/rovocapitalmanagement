const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Synthetic inputs keep the milestone dates exact and independent of returns.
const base = {
  assets: 10000, debt: 0, cash: 0, upfront: 0, pay: 5000, bills: 1000,
  retain: 0, contribution: 100, financeStart: 1, target: 0, maxDta: 25,
  minCoverage: 0, yield: 0, apr: 0, growth: 0, payGrowth: 0, inflation: 0,
  months: 3, useCash: 0, reduceStart: 0, stressStart: 0
};

for (const filename of ['FlowSimV4.html', 'flow-stages.html']) {
  const dom = new JSDOM(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), {
    runScripts: 'dangerously', url: 'http://localhost/' + filename
  });
  const w = dom.window, d = w.document, F = w.FlowSimV4;
  const cards = () => [...d.querySelectorAll('#roadmap .step')];
  const caption = index => cards()[index].querySelector('.caption').textContent;
  function configure(overrides = {}) {
    const config = { ...F.defaults, ...base, ...overrides };
    for (const [key, value] of Object.entries(config)) d.getElementById(key).value = value;
    d.getElementById('months').dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(d.getElementById('error').hidden, filename + ': valid scenario');
    return F.simulate(config);
  }
  function check(overrides, partial, fullBills, text, reached = true) {
    const result = configure(overrides);
    assert.equal(result.milestones.partial, partial, 'Do not invent a partial month');
    assert.equal(result.milestones.fullBills, fullBills);
    assert.equal(caption(1), text, filename + ': Stage 2 caption');
    assert.equal(cards()[1].classList.contains('reached'), reached);
    assert.equal(caption(0), 'Starting plan');
    assert.equal(caption(2), fullBills === null ? 'Not reached' : 'First reached: month ' + fullBills);
    assert.equal(caption(3), result.milestones.fullPay === null ? 'Not reached' : 'First reached: month ' + result.milestones.fullPay);
    assert.equal(caption(4), 'Disabled');
    return result;
  }
  try {
    check({}, null, 1, 'Reached: full redirection reached in month 1');
    check({ financeStart: 2 }, null, 2, 'Reached: full redirection reached in month 2');
    check({ contribution: 50 }, null, 1, 'Reached: full redirection reached in month 1');
    check({ assets: 2000, months: 1 }, 1, null, 'First reached: month 1');
    check({ financeStart: 0 }, null, null, 'Not reached', false);
    check({ financeStart: 4 }, null, null, 'Not reached', false);
    check({ financeStart: 4, months: 4 }, null, 4, 'Reached: full redirection reached in month 4');
    check({ pay: 1000, months: 4 }, 4, 1, 'First reached: month 4');
    check({ assets: 2000 }, 1, 2, 'First reached: month 1');
    const unfunded = check({ assets: 0, pay: 0 }, null, null, 'Not reached', false);
    assert.equal(unfunded.rows.length, 0);
    assert.equal(unfunded.failure.month, 1);
    check({ bills: 0 }, null, null, 'Not reached', false);
    // Extending the horizon can reveal a later partial month. Shortening it
    // restores the full-redirection fallback without leaving stale captions.
    check({ pay: 1000, months: 3 }, null, 1, 'Reached: full redirection reached in month 1');
    check({ pay: 1000, months: 4 }, 4, 1, 'First reached: month 4');
    check({ pay: 1000, months: 3 }, null, 1, 'Reached: full redirection reached in month 1');
    d.getElementById('months').value = 1.5;
    d.getElementById('months').dispatchEvent(new w.Event('input', { bubbles: true }));
    assert(!d.getElementById('error').hidden);
    assert.equal(cards().length, 0, 'Invalid input clears the previous milestone');
    d.getElementById('reset').click();
    assert.equal(caption(1), 'First reached: month 2');
    assert(cards()[1].classList.contains('reached'));
    assert.equal(d.querySelector('meta[name="robots"]').content, 'noindex,nofollow');
  } finally {
    w.close();
  }
}
console.log('V4 roadmap PASS: both URLs; immediate/later full redirection, partial-only, neither, reversed stages, no completed months, zero bills, repeated horizon changes, validation and reset.');
