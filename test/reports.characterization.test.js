const test = require('node:test');
const assert = require('node:assert/strict');
const { getGstReconciliation } = require('../lib/reports');

test('CURRENT BEHAVIOUR: GST Audit flags #1002 and matches #1008', () => {
  // #1002 should match the ledger at 45.90 GST and 963.90 total, with zero mismatches.
  const result = getGstReconciliation({ orders: [
    {
      id: 1002, coupon: 'SAVE10', subtotal: 1020, discount: 102, tax: 45.90, total: 963.90,
      items: [{ hsn: '1006', price: 640, qty: 1 }, { hsn: '1512', price: 190, qty: 2 }]
    },
    {
      id: 1008, coupon: '', subtotal: 500, discount: 0, tax: 90, total: 590,
      items: [{ hsn: '0902', price: 140, qty: 1 }, { hsn: '2106', price: 180, qty: 2 }]
    }
  ] });

  assert.equal(result.totalChecked, 2);
  assert.equal(result.mismatchCount, 1);
  assert.equal(result.totalDelta, 119.34);
  assert.deepEqual(result.rows.map(row => [
    row.orderId, row.ledgerTax, row.invoiceTax, row.ledgerTotal, row.invoiceTotal, row.delta, row.matched
  ]), [
    [1002, 45.90, 183.60, 963.90, 1083.24, 119.34, false],
    [1008, 90, 90, 590, 590, 0, true]
  ]);
});
