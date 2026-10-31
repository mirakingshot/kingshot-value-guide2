# Kingshot Value Guide

Static site (no build) that reads its data from a Google Sheet.

## Run locally
    python3 -m http.server   # then visit http://localhost:8000
(Use a server, not file://.) Publish with GitHub Pages: Settings > Pages > deploy from main, root folder.

## Data: Google Sheet with 3 tabs
Import `data/values.csv`, `data/shops.csv`, `data/popups.csv` into one sheet (File > Import > Insert new sheet), naming the tabs values, shops, popups. Keep the header row exactly as is.

- **values**: item, qty, usd, source, superseded. Unit value = usd / qty. Put TRUE in superseded to ignore a line.
- **shops**: shop, item, tokens. One row per shop item. A new shop name starts a new table.
- **popups**: pack, price, limit, item, qty. One row per item in the pack; repeat the pack name and price on each row.

Then for each tab: File > Share > Publish to web > pick the tab > Comma-separated values (.csv) > Publish. Paste each link into `config.js` and commit once. After that, editing cells updates the site (Google refreshes published sheets every few minutes).

Tips: format number columns as plain numbers. Item names must match exactly between tabs. Items missing from values show as unpriced.
