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
  const groups = new Map();
  const key = name === "shops" ? "shop" : "pack";
  for (const r of rows.filter(r => r[key] && r.item)) {
    if (!groups.has(r[key])) groups.set(r[key], { name: r[key], price: num(r.price), limit: r.limit, list: [] });
    groups.get(r[key]).list.push(name === "shops" ? { item: r.item, tokens: num(r.tokens) } : { item: r.item, qty: num(r.qty) });
  }
  return name === "shops"
    ? { shops: [...groups.values()].map(g => ({ name: g.name, items: g.list })) }
    : { popups: [...groups.values()].map(g => ({ name: g.name, price: g.price, limit: g.limit, contents: g.list })) };
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

function header(active) {
  const pages = [["index.html", "Item values"], ["shops.html", "Event shops"], ["popups.html", "Pop-up packs"]];
  document.body.insertAdjacentHTML("afterbegin",
    `<header><h1>Kingshot Value Guide</h1><p class="sub">Item worth in dollars, based on what regular packs charge for them.</p>
    <nav>${pages.map(([h, t]) => `<a href="${h}"${h === active ? " aria-current=page" : ""}>${t}</a>`).join("")}</nav></header>`);
}

// cols: [{key, label, text:(row)=>html, num:true}]; sortable, searchable on col 0
function render(el, cols, rows, search) {
  let key = cols[0].key, dir = 1, q = "";
  const val = (r, c) => (c.sort ? c.sort(r) : r[c.key]);
  function draw() {
    const c = cols.find(c => c.key === key);
    const list = rows.filter(r => String(r[cols[0].key]).toLowerCase().includes(q))
      .sort((a, b) => {
        const x = val(a, c), y = val(b, c);
        if (x == null) return 1; if (y == null) return -1;
        return (x > y ? 1 : x < y ? -1 : 0) * dir;
      });
    el.querySelector("tbody").innerHTML = list.map(r => `<tr>${cols.map(c => `<td>${c.text(r)}</td>`).join("")}</tr>`).join("");
  }
  el.innerHTML = (search ? `<input type="search" placeholder="Search items" aria-label="Search items">` : "") +
    `<div class="wrap"><table><thead><tr>${cols.map(c => `<th><button data-k="${c.key}">${c.label}</button></th>`).join("")}</tr></thead><tbody></tbody></table></div>`;
  el.addEventListener("click", e => {
    const k = e.target.dataset && e.target.dataset.k;
    if (!k) return;
    dir = k === key ? -dir : 1; key = k; draw();
  });
  if (search) el.querySelector("input").addEventListener("input", e => { q = e.target.value.toLowerCase(); draw(); });
  draw();
}
