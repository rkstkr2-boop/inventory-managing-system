/* views/stocklog.js - every stock movement (in, sold, removed, cancelled) */
Views.stocklog = function (el) {
  const labels = { in: ['Stock in', 'ok'], sale: ['Sold', 'warn'], adjust: ['Removed', 'bad'], void: ['Sale cancelled', 'gray'] };
  let q = '';
  el.innerHTML = '<div class="card"><div class="toolbar"><input type="search" id="q" class="grow" placeholder="Search product, code, person..."></div><div class="table-wrap" id="list"></div></div>';
  const draw = () => {
    const rows = Store.logs().filter(l => !q || [l.name, l.code, l.by, l.reason, l.ref].join(' ').toLowerCase().includes(q)).slice(0, 300);
    el.querySelector('#list').innerHTML = !rows.length ? '<div class="empty">No stock movements yet.</div>' :
      '<table><thead><tr><th>When</th><th>Product</th><th>Type</th><th class="num">Change</th><th class="num hm">Before → After</th><th>Reason</th><th class="hm">By</th></tr></thead><tbody>' +
      rows.map(l => '<tr><td>' + UI.dt(l.date) + '</td><td>' + UI.esc(l.name) + '<small>' + UI.esc(l.code) + '</small></td>' +
        '<td><span class="badge ' + labels[l.type][1] + '">' + labels[l.type][0] + '</span></td>' +
        '<td class="num"><b>' + (l.qty > 0 ? '+' : '') + l.qty + '</b></td><td class="num hm">' + l.before + ' → ' + l.after + '</td>' +
        '<td>' + UI.esc(l.reason) + '</td><td class="hm">' + UI.esc(l.by) + '</td></tr>').join('') + '</tbody></table>';
  };
  draw();
  el.querySelector('#q').oninput = e => { q = e.target.value.toLowerCase(); draw(); };
};
