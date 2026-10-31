const fmt = (n, d = 4) => (n == null ? "unpriced" : "$" + n.toFixed(d));
const num = s => parseFloat(String(s).replace(/[$,\s]/g, ""));

function parseCSV(t) {
  const rows = []; let r = [], c = "", q = false;
  for (let i = 0; i < t.length; i++) {
    const ch = t[i];
    if (q) { if (ch === '"') { if (t[i + 1] === '"') { c += '"'; i++; } else q = false; } else c += ch; }
    else if (ch === '"') q = true;
    else if (ch === ",") { r.push(c); c = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && t[i + 1] === "\n") i++; r.push(c); rows.push(r); r = []; c = ""; }
    else c += ch;
  }
  if (c || r.length) { r.push(c); rows.push(r); }
  const [h, ...b] = rows.filter(x => x.some(v => v.trim()));
  return b.map(x => Object.fromEntries(h.map((k, i) => [k.trim().toLowerCase(), (x[i] || "").trim()])));
}

async function table(name) {
  const url = (window.SHEETS || {})[name] || `data/${name}.csv`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`the "${name}" sheet returned ${res.status}`);
  return parseCSV(await res.text());
}

async function get(name) {
  const rows = await table(name);
  if (name === "values")
    return { values: rows.filter(r => r.item).map(r => ({ item: r.item, qty: num(r.qty), usd: num(r.usd), source: r.source, superseded: /^(true|yes|1|x)$/i.test(r.superseded) })) };
  if (name === "featured") return { featured: rows.filter(r => r.title) };
  const groups = new Map();
  const key = name === "shops" ? "shop" : "pack";
  for (const r of rows.filter(r => r[key] && r.item)) {
    if (!groups.has(r[key])) groups.set(r[key], { name: r[key], price: num(r.price), limit: r.limit, event: r.event || "", list: [] });
    groups.get(r[key]).list.push(name === "shops" ? { item: r.item, tokens: num(r.tokens) } : { item: r.item, qty: num(r.qty) });
  }
  return name === "shops"
    ? { shops: [...groups.values()].map(g => ({ name: g.name, event: g.event, items: g.list })) }
    : { popups: [...groups.values()].map(g => ({ name: g.name, price: g.price, limit: g.limit, event: g.event, contents: g.list })) };
}

window.addEventListener("unhandledrejection", e =>
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<p class="bad">Couldn't load the data: ${e.reason.message}. Check the links in config.js.</p>`));

async function unitValues() {
  const { values } = await get("values");
  const m = {};
  for (const v of values) if (!v.superseded) m[v.item] = { unit: v.usd / v.qty, source: v.source };
  return m;
}

const ICONS = {
  list: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  bag: '<path d="M5 8h14l-1 12H6L5 8z"/><path d="M9 8a3 3 0 016 0"/>',
  gift: '<rect x="4" y="9" width="16" height="11" rx="2"/><path d="M12 9v11M4 14h16M12 9C8 9 8 4 10.5 5S12 9 12 9zm0 0c4 0 4-5 1.5-4S12 9 12 9z"/>',
  bars: '<path d="M6 20V11M12 20V5M18 20v-6"/>',
  gem: '<path d="M12 3l8 6-8 12L4 9z"/><path d="M4 9h16"/>',
  calc: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M8 7h8M8 12h1M12 12h1M16 12h0M8 16h1M12 16h1M16 16h0"/>',
  star: '<path d="M12 3l2.6 5.6 6.1.7-4.5 4.2 1.2 6L12 16.5 6.6 19.5l1.2-6L3.3 9.3l6.1-.7z"/>',
  home: '<path d="M4 11l8-7 8 7v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1z"/>',
  go: '<path d="M5 12h14M13 6l6 6-6 6"/>'
};
const icon = k => `<svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[k]}</svg>`;
const hue = s => "c" + ([...String(s)].reduce((h, ch) => (h * 31 + ch.charCodeAt(0)) >>> 0, 7) % 5);

function header(active) {
  const pages = [
    ["index.html", "Dashboard", "home", "Track what Kingshot packs, shops and events are really worth."],
    ["event.html", "Special events", "star", "Holiday and limited-time events, each with its currency shop and pop-up packs."],
    ["shops.html", "Event shops", "bag", "Currency shops from recurring minigame events, ranked by dollars of value per token."],
    ["popups.html", "Pop-up packs", "gift", "How special event packs compare with the same contents at regular prices."],
    ["build.html", "Pack builder", "calc", "Type in a pack's items and price to see how it compares with regular packs."],
    ["masterlist.html", "Masterlist", "list", "What every upgrade item is worth in dollars, based on regular packs."]
  ];
  const cur = pages.find(p => p[0] === active);
  const logo = `<svg class="logo" viewBox="0 0 32 32" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5fa8"/><stop offset="1" stop-color="#7c5ce6"/></linearGradient></defs><path d="M16 3l11 8-11 18L5 11z" fill="url(#lg)"/></svg>`;
  document.body.insertAdjacentHTML("afterbegin",
    `<aside class="side"><div class="brand">${logo}<span>Mira’s KS<small>Value Guide</small></span></div>
    <nav aria-label="Pages">${pages.map(([h, t, i]) => `<a href="${h}"${h === active ? " aria-current=page" : ""}>${icon(i)}${t}</a>`).join("")}</nav>
    <p class="tagline">Know what every pack is really worth.</p></aside>`);
  document.querySelector("main").insertAdjacentHTML("afterbegin",
    `<p class="eyebrow">Mira’s KS Value Guide</p><h1>${cur[1]}</h1><p class="sub">${cur[3]}</p><div class="stats" id="stats"></div>`);
  document.querySelector("main").insertAdjacentHTML("beforeend", `<footer class="credits">made with love by Mira [221330479]</footer>`);
}

// list: [[label, value, iconKey, tone("" | "pink" | "peach")]]
function stats(list) {
  document.getElementById("stats").innerHTML = list.map(([l, v, i, t]) =>
    `<div class="stat ${t || ""}"><span class="tile">${icon(i)}</span><div><p>${l}</p><strong>${v}</strong></div></div>`).join("");
}

// cols: [{key, label, text:(row)=>html, num:true}]; sortable, searchable on col 0
function render(el, cols, rows, search, head, init, expand) {
  let key = init ? init[0] : cols[0].key, dir = init ? init[1] : 1, q = "";
  const open = new Set();
  const val = (r, c) => (c.sort ? c.sort(r) : r[c.key]);
  function draw() {
    const c = cols.find(c => c.key === key);
    const list = rows.filter(r => String(r[cols[0].key]).toLowerCase().includes(q))
      .sort((a, b) => {
        const x = val(a, c), y = val(b, c);
        if (x == null) return 1; if (y == null) return -1;
        return (x > y ? 1 : x < y ? -1 : 0) * dir;
      });
    el.querySelector("tbody").innerHTML = list.map(r => {
      const o = expand && open.has(r);
      const cells = cols.map((c, i) => `<td>${i === 0 && expand ? `<button class="chev" aria-expanded="${!!o}" aria-label="Show breakdown"></button>` : ""}${c.text(r)}</td>`).join("");
      return `<tr${expand ? ` class="exp" data-i="${rows.indexOf(r)}"` : ""}>${cells}</tr>` +
        (o ? `<tr class="detail"><td colspan="${cols.length}">${expand(r)}</td></tr>` : "");
    }).join("");
    el.querySelectorAll("th button").forEach(b => {
      const on = b.dataset.k === key;
      b.querySelector(".arrow").textContent = on ? (dir === 1 ? "▲" : "▼") : "↕";
      b.classList.toggle("on", on);
      b.parentElement.setAttribute("aria-sort", on ? (dir === 1 ? "ascending" : "descending") : "none");
    });
  }
  const input = search ? `<input type="search" placeholder="Search items" aria-label="Search items">` : "";
  const tbl = `<div class="wrap"><table><thead><tr>${cols.map(c => `<th><button data-k="${c.key}">${c.label}<span class="arrow" aria-hidden="true"></span></button></th>`).join("")}</tr></thead><tbody></tbody></table></div>`;
  el.innerHTML = head
    ? `<div class="card"><div class="card-head"><div><h2>${head[0]}</h2><p>${head[1]}</p></div>${input}</div>${tbl}</div>`
    : input + tbl;
  el.addEventListener("click", e => {
    const k = e.target.closest("button[data-k]")?.dataset.k;
    if (k) { dir = k === key ? -dir : 1; key = k; draw(); return; }
    const tr = expand && e.target.closest("tr.exp");
    if (tr) {
      const i = tr.dataset.i, r = rows[+i];
      open.has(r) ? open.delete(r) : open.add(r);
      draw();
      el.querySelector(`tr[data-i="${i}"] .chev`)?.focus();
    }
  });
  if (search) el.querySelector("input").addEventListener("input", e => { q = e.target.value.toLowerCase(); draw(); });
  draw();
}

const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function scorePacks(m, popups) {
  return popups.map(p => {
    let worth = 0;
    const lines = p.contents.map(c => {
      const u = m[c.item] ? m[c.item].unit : null;
      const w = u == null ? null : u * c.qty;
      if (w != null) worth += w;
      return { item: c.item, qty: c.qty, unit: u, worth: w };
    });
    return { name: p.name, sample: p.sample, price: p.price, limit: p.limit, event: p.event, worth, ratio: worth / p.price, lines, missing: lines.filter(l => l.worth == null).map(l => l.item) };
  });
}
const verdict = r => r.ratio >= 1.25 ? ["Great", "green"] : r.ratio >= 0.9 ? ["Fair", "amber"] : ["Poor", "rose"];

function bigLink(href, ic, title, desc, badge) {
  const url = /^\s*javascript:/i.test(href) ? "#" : href;
  const ext = /^https?:/i.test(url);
  return `<a class="big-link" href="${esc(url)}"${ext ? ' target="_blank" rel="noopener"' : ""}><span class="tile">${icon(ic)}</span>` +
    `<strong>${esc(title)}</strong><span class="desc">${esc(desc || "")}</span>` +
    `<span class="go">${badge ? `<span class="pill amber">${esc(badge)}</span>` : "<span></span>"}<span class="go-arrow">${icon("go")}</span></span></a>`;
}

function packDetail(r) {
  const unpriced = '<span class="pill amber">unpriced</span>';
  const body = r.lines.map(l => {
    const share = l.worth != null && r.worth ? l.worth / r.worth : null;
    return `<tr><td>${esc(l.item)}</td><td>${l.qty.toLocaleString()}</td><td>${l.unit == null ? unpriced : fmt(l.unit)}</td>` +
      `<td>${l.worth == null ? unpriced : `<span class="strong">${fmt(l.worth, 2)}</span>`}</td>` +
      `<td>${share == null ? '<span class="dim">-</span>' : Math.round(share * 100) + `%<span class="meter" style="width:${Math.round(share * 60)}px"></span>`}</td></tr>`;
  }).join("");
  const diff = r.worth - r.price;
  const miss = r.missing.length
    ? `<p class="dim">${r.missing.length === 1 ? "1 item has" : r.missing.length + " items have"} no pack price yet (${esc(r.missing.join(", "))}), so the total is partial and the real ratio is higher.</p>` : "";
  return `<div class="breakdown"><p class="dim">${r.limit ? "Limit " + esc(r.limit) + ". " : ""}Every item is valued at what regular packs charge for it.</p>` +
    `<table><thead><tr><th>Item</th><th>Qty</th><th>$ each</th><th>Worth</th><th>Share of worth</th></tr></thead><tbody>${body}</tbody>` +
    `<tfoot><tr><td>Total at regular pack rates</td><td></td><td></td><td>${fmt(r.worth, 2)}</td><td></td></tr>` +
    `<tr><td>Pack price</td><td></td><td></td><td>${fmt(r.price, 2)}</td><td></td></tr>` +
    `<tr><td>Difference</td><td></td><td></td><td><span class="${diff >= 0 ? "pos" : "neg"}">${diff >= 0 ? "+" : "-"}${fmt(Math.abs(diff), 2)}</span></td><td>${r.ratio.toFixed(2)}x</td></tr></tfoot></table>${miss}</div>`;
}

const packCols = [
  { key: "name", label: "Pack", text: r => esc(r.name) + (r.sample ? '<span class="tag">sample</span>' : "") },
  { key: "price", label: "Price", text: r => fmt(r.price, 2) },
  { key: "worth", label: "Worth at pack rates", text: r => fmt(r.worth, 2) + (r.missing.length ? ` <span class="dim" title="Unpriced: ${esc(r.missing.join(", "))}">(partial)</span>` : "") },
  { key: "ratio", label: "Ratio", text: r => `<span class="strong">${r.ratio.toFixed(2)}x</span>` },
  { key: "v", label: "Verdict", sort: r => r.ratio, text: r => { const [t, c] = verdict(r); return `<span class="pill ${c}">${t}</span>`; } }
];

function shopView(m, s) {
  const rows = s.items.map(x => {
    const u = m[x.item] ? m[x.item].unit : null;
    return { item: x.item, tokens: x.tokens, unit: u, perToken: u == null ? null : u / x.tokens };
  });
  const best = Math.max(0, ...rows.map(r => r.perToken || 0));
  rows.forEach(r => (r.pct = r.perToken == null ? null : r.perToken / best));
  return { name: s.name, event: s.event, rows, best, unpriced: rows.filter(r => r.perToken == null).length };
}

const shopCols = [
  { key: "item", label: "Item", text: r => esc(r.item) },
  { key: "tokens", label: "Tokens", text: r => r.tokens.toLocaleString() },
  { key: "unit", label: "Baseline", text: r => fmt(r.unit) },
  { key: "perToken", label: "$ per token", text: r => `<span class="strong">${fmt(r.perToken, 6)}</span>` },
  { key: "pct", label: "% of best", text: r => r.pct == null ? `<span class="pill amber">unpriced</span>` : `${Math.round(r.pct * 100)}%<span class="meter" style="width:${Math.round(r.pct * 60)}px"></span>` }
];
