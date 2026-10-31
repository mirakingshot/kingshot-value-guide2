const fmt = (n, d = 4) => (n == null ? "unpriced" : "$" + n.toFixed(d));
const get = f => fetch("data/" + f).then(r => r.json());

async function unitValues() {
  const { values } = await get("values.json");
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
