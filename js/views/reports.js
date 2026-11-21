/* views/reports.js - sales trend, best sellers, category and payment split */
Views.reports = function (el) {
  const sales = Store.sales().filter(s => !s.voided);
  const canCost = Auth.can('cost.view');
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
    const tot = sales.filter(s => new Date(s.date).toDateString() === d.toDateString()).reduce((n, s) => n + s.total, 0);
    days.push({ label: d.toLocaleDateString('en-IN', { weekday: 'short' }), tot });
  }
  const max = Math.max(1, ...days.map(d => d.tot));

  const group = (keyFn, valFn) => {
    const m = {};
    sales.forEach(s => { const k = keyFn(s); m[k] = (m[k] || 0) + valFn(s); });
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const hbars = (rows, fmt) => {
    if (!rows.length) return '<div class="empty">No sales yet</div>';
    const top = Math.max(1, rows[0][1]);
    return rows.slice(0, 8).map(r => '<div class="hbar"><span class="l" title="' + UI.esc(r[0]) + '">' + UI.esc(r[0]) + '</span><span class="t"><i data-w="' + (r[1] / top * 100) + '%"></i></span><span class="v">' + fmt(r[1]) + '</span></div>').join('');
  };

  const rev = sales.reduce((n, s) => n + s.total, 0), profit = sales.reduce((n, s) => n + s.profit, 0);
  el.innerHTML = '<div class="stats">' +
    '<div class="stat"><small>Total sales (all time)</small><b>' + UI.inr(rev) + '</b></div>' +
    '<div class="stat"><small>Items sold</small><b>' + sales.reduce((n, s) => n + s.qty, 0) + '</b></div>' +
    (canCost ? '<div class="stat ok"><small>Total profit</small><b>' + UI.inr(profit) + '</b></div>' +
               '<div class="stat"><small>Profit margin</small><b>' + (rev ? (profit / rev * 100).toFixed(1) : 0) + '%</b></div>' : '') + '</div>' +
    '<div class="card"><div class="card-h"><h3>Sales, last 7 days</h3></div><div class="bars">' +
      days.map(d => '<div class="bar"><span>' + (d.tot ? UI.short(d.tot) : '') + '</span><i data-h="' + Math.max(2, d.tot / max * 100) + '%"></i>' + d.label + '</div>').join('') + '</div></div>' +
    '<div class="two-col"><div class="card"><div class="card-h"><h3>Best sellers (units)</h3></div>' + hbars(group(s => s.name, s => s.qty), v => v + ' pcs') + '</div>' +
    '<div class="card"><div class="card-h"><h3>Sales by category</h3></div>' + hbars(group(s => (CATEGORIES[s.category] || { label: 'Other' }).label, s => s.total), UI.inr) + '</div></div>' +
    '<div class="two-col"><div class="card"><div class="card-h"><h3>Payment modes</h3></div>' + hbars(group(s => s.payment, s => s.total), UI.inr) + '</div>' +
    '<div class="card"><div class="card-h"><h3>Sales by staff</h3></div>' + hbars(group(s => s.soldBy, s => s.total), UI.inr) + '</div></div>';
};
