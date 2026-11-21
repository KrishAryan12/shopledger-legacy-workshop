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
    name: '#1001 invoice applies the 5% HSN rate',
    items: [item('0902', 140, 2), item('0713', 165, 2)],
    checkout: [610, 0, 66.90, 33.45, 33.45, 676.90],
    invoice: [610, 0, 66.90, 33.45, 33.45, 676.90],
    checkoutLines: [[18, 50.40], [5, 16.50]],
    invoiceLines: [[18, 50.40], [5, 16.50]]
  },
  {
    name: '#1007 invoice applies the 12% and 5% HSN rates',
    items: [item('0405', 450, 2), item('1512', 190, 2)],
    checkout: [1280, 0, 127, 63.50, 63.50, 1407],
    invoice: [1280, 0, 127, 63.50, 63.50, 1407],
    checkoutLines: [[12, 108], [5, 19]],
    invoiceLines: [[12, 108], [5, 19]]
  },
  {
    name: '#1002 invoice applies SAVE10 before GST',
    items: [item('1006', 640), item('1512', 190, 2)],
    coupon: 'SAVE10',
    checkout: [1020, 102, 45.90, 22.95, 22.95, 963.90],
    invoice: [1020, 102, 45.90, 22.95, 22.95, 963.90],
    checkoutLines: [[5, 28.80], [5, 17.10]],
    invoiceLines: [[5, 28.80], [5, 17.10]]
  },
  {
    name: '#1004 invoice applies the 150.00 SAVE10 cap before GST',
    items: [item('1508', 1120, 2)],
    coupon: 'SAVE10',
    checkout: [2240, 150, 104.50, 52.25, 52.25, 2194.50],
    invoice: [2240, 150, 104.50, 52.25, 52.25, 2194.50],
    checkoutLines: [[5, 104.50]],
    invoiceLines: [[5, 104.50]]
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
    name: 'mixed-slab invoice uses the same line GST rounding as checkout',
    items: [item('1006', 100.05), item('0405', 100.05), item('0902', 300)],
    coupon: 'SAVE10',
    checkout: [500.10, 50.01, 63.90, 31.95, 31.95, 513.99],
    invoice: [500.10, 50.01, 63.90, 31.95, 31.95, 513.99],
    checkoutLines: [[5, 4.50], [12, 10.80], [18, 48.60]],
    invoiceLines: [[5, 4.50], [12, 10.80], [18, 48.60]]
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

const billedOrders = [
  [1008, cases[0]],
  [1001, cases[1]],
  [1007, cases[2]],
  [1002, cases[3]],
  [1004, cases[4]]
];

for (const [id, example] of billedOrders) {
  test(`#${id} invoice preserves the billed amounts and checkout line GST`, () => {
    const [subtotal, discount, tax, , , total] = example.checkout;
    const invoice = computeInvoiceFigures({
      id, items: example.items, coupon: example.coupon || '', subtotal, discount, tax, total
    });

    assert.deepEqual(amounts(invoice), example.checkout, 'billed amounts');
    assert.deepEqual(invoice.rows.map(row => [row.gstPercent, row.lineTax]),
      example.checkoutLines, 'billed line GST');
  });
}
