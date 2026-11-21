# ShopLedger repository guide

## 1. Stack

- Node.js using CommonJS. The project does not declare a required Node.js version. The entry point import and `node --test` were verified with Node.js `v25.1.0`.
- `package.json` lists `express` `^4.17.1` (the web framework) and `body-parser` `^1.19.0` (JSON request parsing).
- `lib/store.js` synchronously reads and overwrites `data/db.json` as a single JSON document.
- `server.js` serves `public/` through `express.static`. `public/index.html` loads plain CSS and JavaScript.

## 2. Module map

| Path | Responsibility |
|---|---|
| `routes/` | `products.js`, `orders.js`, `customers.js`, and `reports.js` define the `/api` handlers. |
| `lib/` | `inventory.js`, `orders.js`, `ledger.js`, `coupons.js`, `pricing.js`, `tax.js`, `invoice.js`, `reports.js`, `dates.js`, and `store.js` implement business logic and persistence. |
| `public/` | `index.html`, `css/style.css`, and `js/app.js` implement the browser interface. |
| `config.js` | Defines the port, shop details, tax, inventory, coupons, and export key. |
| `server.js` | Configures Express, mounts routers, serves static files, and defines the printable invoice route. |
| `data/` | `db.json` stores products, orders, customers, settlements, audit entries, and ID counters. |

## 3. Commands

| Task | Command |
|---|---|
| Install | `npm install` |
| Start | `npm start` runs `node server.js`. Default URL is `http://localhost:3000`. `PORT` overrides the port. |
| Test | `node --test` (no tests discovered at the time of verification) |
| Lint | none |
| Build | none |

## 4. Rules (mandatory for every task)

- Write characterization tests before changing behaviour. Include `CURRENT BEHAVIOUR` in the names of tests that pin wrong behaviour.
- Change only the module the ticket is about.
- Tests must never touch `data/db.json`. Use in-memory data. If a test or a manual check changes `data/db.json`, restore it with `git checkout data/db.json`.
- Add no dependencies.
- Make the smallest fix that works. No refactors, renames, or formatting-only changes outside the fix.
- Never commit `package-lock.json` or `data/db.json`.

## 5. Git workflow

- Name branches `fix/<short-name>`.
- Use Conventional Commits (`test:`, `fix:`, `docs:`) with a short imperative subject and a body that explains the cause.
- Keep commits small and separate. Commit tests first, then the fix, then docs.
- Never push to `main`, force-push, or merge a pull request.
- Start the PR body with `Fixes #<issue number>`, then list tests added, the cause, the fix, and the test result in that order.

## 6. Known risks

- `lib/invoice.js` `computeInvoiceFigures()` taxes gross line amounts and uses different GST and coupon rules from `lib/pricing.js` `computeTotals()`.
- `lib/orders.js` `cancel()` calls `lib/inventory.js` `release()`, which reads `productId` and changes `reserved`. New order lines carry `id`, and checkout deducts `stock`.
- `lib/inventory.js` `check()` rejects exact sellable quantities and checks duplicate product lines individually. `reserve()` deducts each line.
- `lib/ledger.js` `recordSettlement()` adds the unconverted amount to `totalSettled`. The browser sends an input string.
- `lib/store.js` `write()` overwrites the whole JSON file directly without locking or an atomic replacement.
- `lib/orders.js` `list()` filters and sorts `DD/MM/YYYY` dates as strings.
