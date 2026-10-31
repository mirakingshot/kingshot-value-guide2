# Kingshot Value Guide

Static site (no build). Open through a web server, not file://:

    python3 -m http.server   # then visit http://localhost:8000

Publish with GitHub Pages: Settings > Pages > deploy from the main branch root.

## Updating data (all in `data/`)
- `values.json`: one line per anchor valuation (pack share in USD for a quantity of one item). Unit value = usd / qty. Mark old lines `"superseded": true`.
- `shops.json`: event shops with token cost per item (1 unit per purchase). Add a shop by adding an object to `shops`.
- `popups.json`: pop-up packs with price and contents. Remove the sample entry.

Last updated: 2026-10-30
