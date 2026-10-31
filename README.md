# Mira’s KS Value Guide

Static site (no build) that reads its data from a Google Sheet.

## Run locally
    python3 -m http.server   # then visit http://localhost:8000
(Use a server, not file://.) Publish with GitHub Pages: Settings > Pages > deploy from main, root folder.

## Data: Google Sheet with 4 tabs
Import `data/values.csv`, `data/shops.csv`, `data/popups.csv`, `data/featured.csv` into one sheet (File > Import > Insert new sheet), naming the tabs values, shops, popups, featured. Keep the header row exactly as is.

- **values**: item, qty, usd, source, superseded. Unit value = usd / qty. Put TRUE in superseded to ignore a line.
- **shops**: shop, item, tokens, event (optional). One row per shop item. A new shop name starts a new table.
- **featured**: title, description, url, badge (optional `event` column too). If the url is an event page (event.html?e=Halloween) or the `event` column names an event with dates in the `events` tab, the button shows its active, upcoming or ended tag, and ended events are greyed and listed last. Each row becomes a big button on the dashboard under Special event packs. url can be a page in this site (popups.html) or a full link; badge is optional (e.g. Ends Nov 7).
- **popups**: pack, price, limit, item, qty, event (optional). One row per item in the pack; repeat the pack name and price on each row.

Then for each tab: File > Share > Publish to web > pick the tab > Comma-separated values (.csv) > Publish. Paste each link into `config.js` and commit once. After that, editing cells updates the site (Google refreshes published sheets every few minutes).

Tips: format number columns as plain numbers. Item names must match exactly between tabs. Items missing from values show as unpriced.

## Active and past events
Add an optional `events` tab with the columns `event, start, end` (dates like 2026-10-25, or whatever format Google Sheets shows). The event name must match the `event` column on shops and packs. Events whose end date has passed are greyed out and listed last, still clickable, with an "Ended" label. Events with a future start show "Starts ...". An event with no row is treated as active. Publish the tab as CSV and paste the link into `config.js` on the `events` line.

## Pack builder
`build.html` lets visitors type items from the masterlist plus a total price and see the pack's worth and ratio at baseline. It uses the `values` tab, so it needs no extra setup.

## Special events
Special events are holiday or limited-time events (like Halloween) that can have a currency shop and pop-up packs. Recurring minigame shops, such as Tidal Shop, stay on the Event shops page: leave their `event` column empty. Give a shop or pop-up pack the same text in its `event` column (for example Halloween) and it appears on that event's page (`event.html?e=Halloween`) together with every other shop and pack that uses the same event name. A shop with an event is shown on its event page instead of the Event shops page; packs with an event are shown on their event page instead of the Pop-up packs page. `event.html` with no event lists all events. To feature an event on the dashboard, add a row to the `featured` tab with url `event.html?e=Halloween`.
