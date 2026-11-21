/* views/dashboard.js - the whole business at a glance:
   today's sales, what is left in stock, what needs restocking */
Views.dashboard = function (el) {
  const products = Store.products();
  const allSales = Store.sales();
  const sales = allSales.filter(s => !s.voided);
  const canCost = Auth.can('cost.view'), canAdj = Auth.can('stock.adjust');
  const today = sales.filter(s => UI.isToday(s.date));
  const sum = (a, f) => a.reduce((n, x) => n + f(x), 0);
  const units = sum(products, p => p.qty);
  const need = products.filter(p => Service.stockStatus(p) !== 'ok').sort((a, b) => a.qty - b.qty);
  const hr = new Date().getHours();
  const greet = hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';

  /* last 7 days */
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const ds = sales.filter(s => new Date(s.date).toDateString() === d.toDateString());
    days.push({ label: i === 0 ? 'Today' : d.toLocaleDateString('en-IN', { weekday: 'short' }), tot: sum(ds, s => s.total), n: sum(ds, s => s.qty) });
  }
  const dmax = Math.max(1, ...days.map(d => d.tot));

  /* stock by category */
  const cats = Object.keys(CATEGORIES).map(k => {
    const ps = products.filter(p => p.category === k);
    return { k, n: ps.length, units: sum(ps, p => p.qty), low: ps.filter(p => Service.stockStatus(p) !== 'ok').length };
  }).filter(c => c.n);
  const cmax = Math.max(1, ...cats.map(c => c.units));

  /* best sellers */
  const bs = {};
  sales.forEach(s => { bs[s.name] = (bs[s.name] || 0) + s.qty; });
  const best = Object.entries(bs).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const bmax = best.length ? best[0][1] : 1;

  const tile = (label, val, fmt, cls, sub) => '<div class="stat ' + (cls || '') + '"><small>' + label + '</small><b data-count="' + val + '"' + (fmt ? ' data-fmt="' + fmt + '"' : '') + '>0</b>' + (sub ? '<em>' + sub + '</em>' : '') + '</div>';

  let h = '<section class="hero"><div><div class="hero-hi">' + greet + ', ' + UI.esc(App.user.name.split(' ')[0]) + ' 👋</div>' +
    '<div class="hero-big" data-count="' + sum(today, s => s.total) + '" data-fmt="inr">0</div>' +
    '<div class="hero-sub">sold today · ' + sum(today, s => s.qty) + ' items · ' + today.length + ' bills' + (canCost ? ' · profit ' + UI.inr(sum(today, s => s.profit)) : '') + '</div></div>' +
    '<div class="hero-act"><button class="btn white" data-act="sell">⚡ Record a sale</button>' +
    (Auth.can('stock.add') ? '<button class="btn ghost" data-act="add">+ Add new stock</button>' : '') + '</div></section>';

  h += '<div class="stats">' +
    tile('Products', products.length) + tile('Units in stock', units) +
    tile('Sold this week', sum(days, d => d.tot), 'inr', 'ok') +
    (canCost ? tile('Stock value (cost)', sum(products, p => p.qty * p.cost), 'inr') : '') +
    tile('Need restock', need.length, '', need.length ? 'bad' : 'ok', need.length ? 'fewer than 5 left' : 'all good') + '</div>';

  /* restock alerts */
  if (need.length) {
    h += '<div class="card alert-wrap"><div class="card-h"><h3>🔔 Restock now <span class="badge bad pulse">' + need.length + '</span></h3></div><div class="alerts">' +
      need.map(p => '<div class="alert-card" data-id="' + p.id + '">' + UI.thumb(p, 'thumb') +
        '<div class="grow"><b>' + UI.esc(p.name) + '</b><small>' + (p.qty <= 0 ? 'Out of stock!' : 'Only ' + p.qty + ' left') + '</small></div>' +
        (canAdj ? '<button class="btn sm primary" data-restock="' + p.id + '">Restock</button>' : '') + '</div>').join('') + '</div></div>';
  }

  h += '<div class="two-col"><div class="card"><div class="card-h"><h3>Sales - last 7 days</h3><span class="muted">' + UI.inr(sum(days, d => d.tot)) + '</span></div><div class="bars">' +
    days.map((d, i) => '<div class="bar' + (i === 6 ? ' now' : '') + '"><span>' + (d.tot ? UI.short(d.tot) : '') + '</span><i data-h="' + Math.max(2, d.tot / dmax * 100) + '%"></i>' + d.label + '</div>').join('') + '</div></div>' +
    '<div class="card"><div class="card-h"><h3>Stock by category</h3></div>' + (cats.length ? cats.map(c =>
      '<div class="hbar"><span class="l">' + CATEGORIES[c.k].icon + ' ' + CATEGORIES[c.k].label + '</span><span class="t"><i data-w="' + Math.max(3, c.units / cmax * 100) + '%"></i></span><span class="v">' + c.units + ' pcs' + (c.low ? ' <span class="dot"></span>' : '') + '</span></div>').join('') : '<div class="empty">No stock yet</div>') + '</div></div>';

  h += '<div class="card no-swipe"><div class="card-h"><h3>📦 What is left in stock</h3><input type="search" id="dq" placeholder="Search..." style="max-width:220px"></div><div class="remain" id="remain"></div></div>';

  h += '<div class="two-col"><div class="card"><div class="card-h"><h3>🏆 Best sellers</h3></div>' + (best.length ? best.map(b =>
    '<div class="hbar"><span class="l" title="' + UI.esc(b[0]) + '">' + UI.esc(b[0]) + '</span><span class="t"><i data-w="' + (b[1] / bmax * 100) + '%"></i></span><span class="v">' + b[1] + ' sold</span></div>').join('') : '<div class="empty">Sell something to see your best sellers</div>') + '</div>';
  const recent = allSales.filter(s => Auth.can('sales.all') || s.soldById === App.user.id).slice(0, 6);
  h += '<div class="card"><div class="card-h"><h3>🧾 Recent sales</h3><a class="link" href="#sales">View all</a></div>' + (recent.length ? '<div class="table-wrap"><table><tbody>' + recent.map(s =>
    '<tr><td class="' + (s.voided ? 'void' : '') + '">' + UI.esc(s.name) + '<small>' + UI.dt(s.date) + ' · ' + UI.esc(s.soldBy) + '</small></td><td class="num ' + (s.voided ? 'void' : '') + '"><b>' + UI.inr(s.total) + '</b><small>× ' + s.qty + '</small></td></tr>').join('') + '</tbody></table></div>' : '<div class="empty">No sales recorded yet</div>') + '</div></div>';

  el.innerHTML = h;

  /* "what is left" list, lowest first */
  const remain = el.querySelector('#remain');
  const top = Math.max(1, ...products.map(p => p.qty));
  const drawRemain = q => {
    const rows = products.slice().sort((a, b) => a.qty - b.qty).filter(p => !q || (p.name + p.code).toLowerCase().includes(q));
    remain.innerHTML = rows.length ? rows.map(p => {
      const st = Service.stockStatus(p);
      return '<div class="rem-row" data-id="' + p.id + '">' + UI.thumb(p, 'thumb') + '<div class="grow"><b>' + UI.esc(p.name) + '</b>' +
        '<div class="meter ' + st + '"><i data-w="' + Math.max(3, p.qty / top * 100) + '%"></i></div></div>' +
        '<div class="rem-q"><b>' + p.qty + '</b><small>left</small></div>' + UI.badge(st) + '</div>';
    }).join('') : '<div class="empty">Nothing found</div>';
    FX.grow(remain);
  };
  drawRemain('');
  el.querySelector('#dq').oninput = e => drawRemain(e.target.value.toLowerCase());

  const refresh = () => App.render();
  el.querySelector('[data-act=sell]').onclick = () => SalesView.openSale(null, refresh);
  const add = el.querySelector('[data-act=add]');
  if (add) add.onclick = () => InventoryView.openProductForm(null, refresh);
  const onPick = e => {
    const r = e.target.closest('[data-restock]');
    if (r) return InventoryView.openStockUpdate(r.dataset.restock, refresh);
    const c = e.target.closest('[data-id]');
    if (c) InventoryView.openDetails(c.dataset.id, refresh);
  };
  remain.addEventListener('click', onPick);
  const al = el.querySelector('.alerts');
  if (al) al.addEventListener('click', onPick);
};
