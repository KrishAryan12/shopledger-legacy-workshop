const test = require('node:test');
const assert = require('node:assert/strict');
const { computeTotals } = require('../lib/pricing');

test('CURRENT BEHAVIOUR: independently rounded line discounts exceed the cart discount by one paisa', () => {
  // The line discounts should add up to the cart discount of 50.01.
  const totals = computeTotals([
    { hsn: '1006', price: 100.05, qty: 1 },
    { hsn: '0405', price: 100.05, qty: 1 },
    { hsn: '0902', price: 300, qty: 1 }
  ], 'SAVE10');

  assert.equal(totals.discount, 50.01);
  assert.deepEqual(totals.lines.map(line => line.discount), [10.01, 10.01, 30]);
  assert.deepEqual(totals.lines.map(line => line.taxable), [90.04, 90.04, 270]);
  assert.equal(totals.taxable, 450.09);
});
