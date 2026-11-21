/* views/sales.js - record a sale (auto-reduces stock) and sales history */
const SalesView = {
  range: '7', q: '',

  openSale(preId, done) {
    const avail = Store.products().filter(p => p.qty > 0);
    if (!avail.length) { UI.toast('Nothing in stock to sell.', 'err'); return; }
    const m = UI.modal('Record a sale', '<form id="sf">' +
      '<label class="fld"><span>Product <b class="req">*</b></span><select id="sp" required>' +
        '<option value="">Select product...</option>' +
        avail.map(p => '<option value="' + p.id + '"' + (p.id === preId ? ' selected' : '') + '>' + UI.esc(p.name) + '  (' + UI.esc(p.code) + ') - ' + p.qty + ' in stock</option>').join('') + '</select></label>' +
      '<div class="form-grid">' +
        '<label class="fld"><span>Quantity sold <b class="req">*</b></span><input id="sq" type="number" min="1" step="1" value="1" required></label>' +
        '<label class="fld"><span>Selling price each (₹) <b class="req">*</b></span><input id="spr" type="number" min="0" step="any" required></label>' +
        '<label class="fld"><span>Discount (₹)</span><input id="sd" type="number" min="0" step="any" value="0"></label>' +
        '<label class="fld"><span>Payment mode <b class="req">*</b></span><select id="spay" required>' + PAYMENT_MODES.map(x => '<option>' + x + '</option>').join('') + '</select></label>' +
        '<label class="fld"><span>Customer name</span><input id="scn"></label>' +
        '<label class="fld"><span>Customer phone</span><input id="scp" inputmode="tel" maxlength="15"></label>' +
        '<label class="fld full" id="imeiwrap" hidden><span>Phone IMEI / serial number</span><input id="simei" placeholder="15-digit IMEI of the phone sold"></label>' +
        '<label class="fld full"><span>Notes (how it was sold, offers, exchange...)</span><input id="sn"></label>' +
      '</div>' +
      '<div class="summary"><div><span>Total to collect</span><b class="big" id="tot">₹0</b></div><div><span>Stock after this sale</span><b id="aft">-</b></div></div>' +
      '<div id="serr" class="form-error" hidden></div>' +
      '<div class="form-actions"><button type="button" class="btn" data-x>Cancel</button><button class="btn success">Confirm sale</button></div></form>');

    const sel = m.$('#sp'), q = m.$('#sq'), pr = m.$('#spr'), d = m.$('#sd');
    const prod = () => Store.products().find(x => x.id === sel.value);
    const calc = () => {
      const p = prod(), n = parseInt(q.value, 10) || 0;
      m.$('#tot').textContent = UI.inr(Math.max(0, (Number(pr.value) || 0) * n - (Number(d.value) || 0)));
      m.$('#aft').textContent = p ? (p.qty - n) + ' of ' + p.qty + ' left' : '-';
      m.$('#imeiwrap').hidden = !(p && p.category === 'phone');
      if (p) q.max = p.qty;
    };
    sel.onchange = () => { const p = prod(); if (p) pr.value = p.price; calc(); };
    [q, pr, d].forEach(i => i.oninput = calc);
    if (preId) sel.onchange(); else calc();
    m.$('[data-x]').onclick = m.close;

    m.$('#sf').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const sale = Service.recordSale({
          pid: sel.value, qty: parseInt(q.value, 10), price: Number(pr.value), discount: Number(d.value) || 0,
          payment: m.$('#spay').value, customer: m.$('#scn').value.trim(), phone: m.$('#scp').value.trim(),
          imei: m.$('#simei').value.trim(), note: m.$('#sn').value.trim()
        }, App.user);
        m.close();
        const left = Store.products().find(x => x.id === sale.pid).qty;
        UI.toast('Sale recorded (' + sale.receipt + '). ' + left + ' left in stock.');
        FX.confetti();
        done && done();
      } catch (err) { const b = m.$('#serr'); b.textContent = err.message; b.hidden = false; }
    });
  },

  openDetails(id) {
    const s = Store.sales().find(x => x.id === id);
    const row = (a, b) => b ? '<div><span class="muted">' + a + '</span><b>' + UI.esc(b) + '</b></div>' : '';
    UI.modal('Sale ' + s.receipt, '<div class="summary">' +
      row('Product', s.name) + row('Date', UI.dt(s.date)) + row('Quantity', s.qty) + row('Price each', UI.inr(s.price)) +
      row('Discount', s.discount ? UI.inr(s.discount) : '') + row('Total', UI.inr(s.total)) + row('Payment', s.payment) +
      row('Customer', s.customer) + row('Phone', s.phone) + row('IMEI', s.imei) + row('Notes', s.note) + row('Sold by', s.soldBy) +
      (Auth.can('cost.view') ? row('Profit', UI.inr(s.profit)) : '') +
      (s.voided ? row('CANCELLED', s.voidedBy + (s.voidReason ? ' - ' + s.voidReason : '')) : '') + '</div>');
  },

  render(el) {
    const own = !Auth.can('sales.all');
    el.innerHTML = '<div class="card"><div class="toolbar">' +
      '<input type="search" id="q" class="grow" placeholder="Search product, customer, receipt, IMEI..." value="' + UI.esc(this.q) + '">' +
      '<select id="rg"><option value="1">Today</option><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="all">All time</option></select>' +
      '<button class="btn success" id="new">+ Record a sale</button>' +
      (Auth.can('reports.view') ? '<button class="btn" id="exp">Export CSV</button>' : '') + '</div>' +
      '<div id="tot" class="muted" style="margin-bottom:10px"></div><div class="table-wrap" id="list"></div></div>';
    el.querySelector('#rg').value = this.range;

    const get = () => {
      const q = this.q.toLowerCase();
      const since = this.range === 'all' ? 0 : Date.now() - (this.range === '1' ? 0 : (Number(this.range) - 1) * 864e5);
      const start = this.range === '1' ? new Date().setHours(0, 0, 0, 0) : (this.range === 'all' ? 0 : new Date(since).setHours(0, 0, 0, 0));
      return Store.sales().filter(s => (!own || s.soldById === App.user.id) && new Date(s.date).getTime() >= start &&
        (!q || [s.name, s.customer, s.phone, s.receipt, s.imei, s.soldBy].join(' ').toLowerCase().includes(q)));
    };
    const draw = () => {
      const rows = get(), live = rows.filter(s => !s.voided);
      el.querySelector('#tot').innerHTML = rows.length + ' sales · <b>' + UI.inr(live.reduce((n, s) => n + s.total, 0)) + '</b> collected · ' + live.reduce((n, s) => n + s.qty, 0) + ' items sold';
      const list = el.querySelector('#list');
      if (!rows.length) { list.innerHTML = '<div class="empty">No sales in this period.</div>'; return; }
      list.innerHTML = '<table><thead><tr><th>Receipt</th><th>Product</th><th class="num">Qty</th><th class="num">Total</th><th>Payment</th><th>Customer</th><th>Sold by</th><th></th></tr></thead><tbody>' +
        rows.map(s => '<tr class="' + (s.voided ? 'void' : '') + '"><td><b>' + s.receipt + '</b><small>' + UI.dt(s.date) + '</small></td><td>' + UI.esc(s.name) + (s.imei ? '<small>IMEI ' + UI.esc(s.imei) + '</small>' : '') + '</td>' +
          '<td class="num">' + s.qty + '</td><td class="num"><b>' + UI.inr(s.total) + '</b></td><td>' + UI.esc(s.payment) + '</td><td>' + UI.esc(s.customer || '-') + '</td><td>' + UI.esc(s.soldBy) + '</td>' +
          '<td><div class="actions"><button class="btn sm" data-a="view" data-id="' + s.id + '">Details</button>' +
          (Auth.can('sales.void') && !s.voided ? '<button class="btn sm" data-a="void" data-id="' + s.id + '">Cancel</button>' : '') +
          (s.voided ? '<span class="badge gray">Cancelled</span>' : '') + '</div></td></tr>').join('') + '</tbody></table>';
    };
    draw();

    el.querySelector('#q').oninput = e => { this.q = e.target.value; draw(); };
    el.querySelector('#rg').onchange = e => { this.range = e.target.value; draw(); };
    el.querySelector('#new').onclick = () => this.openSale(null, () => App.render());
    const exp = el.querySelector('#exp');
    if (exp) exp.onclick = () => UI.download('sales-' + new Date().toISOString().slice(0, 10) + '.csv',
      UI.csv([['Receipt', 'Date', 'Product', 'Qty', 'Price', 'Discount', 'Total', 'Profit', 'Payment', 'Customer', 'Phone', 'IMEI', 'Sold by', 'Cancelled']]
        .concat(get().map(s => [s.receipt, UI.dt(s.date), s.name, s.qty, s.price, s.discount, s.total, s.profit, s.payment, s.customer, s.phone, s.imei, s.soldBy, s.voided ? 'Yes' : '']))));

    el.querySelector('#list').addEventListener('click', e => {
      const b = e.target.closest('button[data-a]');
      if (!b) return;
      if (b.dataset.a === 'view') return this.openDetails(b.dataset.id);
      const m = UI.modal('Cancel this sale?', '<p class="muted">The items go back into stock and the sale stays in the records marked as cancelled.</p>' +
        '<label class="fld"><span>Reason <b class="req">*</b></span><input id="vr" placeholder="Wrong entry, customer returned..."></label>' +
        '<div class="form-actions"><button class="btn" data-x>Keep sale</button><button class="btn danger" data-ok>Cancel sale</button></div>');
      m.$('[data-x]').onclick = m.close;
      m.$('[data-ok]').onclick = () => {
        const r = m.$('#vr').value.trim();
        if (!r) { m.$('#vr').focus(); return; }
        try { Service.voidSale(b.dataset.id, r, App.user); m.close(); UI.toast('Sale cancelled, stock restored'); App.render(); }
        catch (err) { UI.toast(err.message, 'err'); }
      };
    });
  }
};
Views.sales = el => SalesView.render(el);
