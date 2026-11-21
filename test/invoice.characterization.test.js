const test = require('node:test');
const assert = require('node:assert/strict');
const { computeTotals } = require('../lib/pricing');
const { computeInvoiceFigures } = require('../lib/invoice');

const item = (hsn, price, qty = 1) => ({ hsn, price, qty });

// Amounts are subtotal, discount, GST, CGST, SGST, total.
// Line expectations are pairs of GST percentage and GST amount.
const cases = [
  {
    name: '#1008: both engines agree on 18% items without a coupon',
    items: [item('0902', 140), item('2106', 180, 2)],
    checkout: [500, 0, 90, 45, 45, 590],
    invoice: [500, 0, 90, 45, 45, 590],
    checkoutLines: [[18, 25.20], [18, 64.80]],
    invoiceLines: [[18, 25.20], [18, 64.80]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1001 invoice taxes the 5% item at 18%',
    // The invoice should show GST of 66.90 and a total of 676.90.
    items: [item('0902', 140, 2), item('0713', 165, 2)],
    checkout: [610, 0, 66.90, 33.45, 33.45, 676.90],
    invoice: [610, 0, 109.80, 54.90, 54.90, 719.80],
    checkoutLines: [[18, 50.40], [5, 16.50]],
    invoiceLines: [[18, 50.40], [18, 59.40]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1007 invoice taxes the 12% and 5% items at 18%',
    // The invoice should show GST of 127.00 and a total of 1407.00.
    items: [item('0405', 450, 2), item('1512', 190, 2)],
    checkout: [1280, 0, 127, 63.50, 63.50, 1407],
    invoice: [1280, 0, 230.40, 115.20, 115.20, 1510.40],
    checkoutLines: [[12, 108], [5, 19]],
    invoiceLines: [[18, 162], [18, 68.40]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1002 SAVE10 invoice discounts the GST-inclusive amount',
    // The invoice should show discount of 102.00, GST of 45.90 and a total of 963.90.
    items: [item('1006', 640), item('1512', 190, 2)],
    coupon: 'SAVE10',
    checkout: [1020, 102, 45.90, 22.95, 22.95, 963.90],
    invoice: [1020, 120.36, 183.60, 91.80, 91.80, 1083.24],
    checkoutLines: [[5, 28.80], [5, 17.10]],
    invoiceLines: [[18, 115.20], [18, 68.40]]
  },
  {
    name: 'CURRENT BEHAVIOUR: #1004 SAVE10 invoice ignores the 150.00 cap',
    // The invoice should show discount of 150.00, GST of 104.50 and a total of 2194.50.
    items: [item('1508', 1120, 2)],
    coupon: 'SAVE10',
    checkout: [2240, 150, 104.50, 52.25, 52.25, 2194.50],
    invoice: [2240, 264.32, 403.20, 201.60, 201.60, 2378.88],
    checkoutLines: [[5, 104.50]],
    invoiceLines: [[18, 403.20]]
  },
  {
    name: 'both engines return zero for an empty cart',
    items: [],
    checkout: [0, 0, 0, 0, 0, 0],
    invoice: [0, 0, 0, 0, 0, 0],
    checkoutLines: [],
    invoiceLines: []
  },
  {
    name: 'CURRENT BEHAVIOUR: mixed 5%, 12% and 18% cart with fractional-paise GST',
    // The invoice should show discount of 50.01, GST of 63.90 and a total of 513.99.
    items: [item('1006', 100.05), item('0405', 100.05), item('0902', 300)],
    coupon: 'SAVE10',
    checkout: [500.10, 50.01, 63.90, 31.95, 31.95, 513.99],
    invoice: [500.10, 59.01, 90.02, 45.01, 45.01, 531.11],
    checkoutLines: [[5, 4.50], [12, 10.80], [18, 48.60]],
    invoiceLines: [[18, 18.01], [18, 18.01], [18, 54]]
  },
  {
    name: 'both calculation engines apply no discount for an unknown coupon',
    items: [item('0902', 500.50)],
    coupon: 'UNKNOWN',
    checkout: [500.50, 0, 90.09, 45.05, 45.04, 590.59],
    invoice: [500.50, 0, 90.09, 45.05, 45.04, 590.59],
    checkoutLines: [[18, 90.09]],
    invoiceLines: [[18, 90.09]]
  }
];

function amounts({ subtotal, discount, tax, cgst, sgst, total }) {
  return [subtotal, discount, tax, cgst, sgst, total];
}

for (const example of cases) {
  test(example.name, () => {
    const { items, coupon = '' } = example;
    const checkout = computeTotals(items, coupon);
    const invoice = computeInvoiceFigures({ items, coupon });

    assert.deepEqual(amounts(checkout), example.checkout, 'checkout amounts');
    assert.deepEqual(amounts(invoice), example.invoice, 'invoice amounts');
    assert.deepEqual(checkout.lines.map(line => [line.gstPercent, line.tax]),
      example.checkoutLines, 'checkout line GST');
    assert.deepEqual(invoice.rows.map(row => [row.gstPercent, row.lineTax]),
      example.invoiceLines, 'invoice line GST');
  });
}
