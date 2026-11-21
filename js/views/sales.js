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
        '<div class="fld full"><span>Payment screenshot (optional)</span><div class="proof-row"><label class="proof-pick" id="ppick"><div id="pbox"></div><input type="file" id="pfile" accept="image/*" hidden></label>' +
          '<div><small class="muted">UPI, card or bank transfer proof. Tap to take a photo or choose one.</small><br><button type="button" class="btn sm" id="prm" hidden>Remove screenshot</button></div></div></div>' +
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
    let proof = '';
    const drawProof = () => { m.$('#pbox').innerHTML = proof ? '<img src="' + proof + '" alt="Payment screenshot">' : '<span>📎<br>Add<br>screenshot</span>'; m.$('#prm').hidden = !proof; };
    drawProof();
    m.$('#ppick').onclick = () => m.$('#pfile').click();
    m.$('#prm').onclick = () => { proof = ''; drawProof(); };
    m.$('#pfile').onchange = async e => { try { proof = await UI.readPhoto(e.target.files[0], 1000, 0.8); drawProof(); } catch (err) { UI.toast(err.message, 'err'); } };

    m.$('#sf').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const sale = Service.recordSale({
          pid: sel.value, qty: parseInt(q.value, 10), price: Number(pr.value), discount: Number(d.value) || 0,
          payment: m.$('#spay').value, customer: m.$('#scn').value.trim(), phone: m.$('#scp').value.trim(),
          imei: m.$('#simei').value.trim(), note: m.$('#sn').value.trim(), proof
        }, App.user);
        m.close();
        const left = Store.products().find(x => x.id === sale.pid).qty;
        UI.toast('Sale recorded (' + sale.receipt + '). ' + left + ' left in stock.');
        FX.confetti();
        if (sale.proofDropped) UI.toast('Sale saved, but the screenshot was too large for storage.', 'err');
        done && done();
      } catch (err) { const b = m.$('#serr'); b.textContent = err.message; b.hidden = false; }
    });
  },

  /* centered preview with every detail of one sale + payment screenshot */
  openDetails(id) {
    const s = Store.sales().find(x => x.id === id);
    if (!s) return;
    const p = Store.products().find(x => x.id === s.pid);
    const cat = CATEGORIES[s.category] || CATEGORIES.other;
    const cell = (label, val, html) => (val === '' || val == null) ? '' : '<div><span>' + label + '</span><b>' + (html || UI.esc(val)) + '</b></div>';
    const thumb = p ? UI.thumb(p, 'thumb') : '<span class="thumb ph">' + cat.icon + '</span>';
    const canCost = Auth.can('cost.view');
    const status = s.voided ? '<span class="badge gray">Cancelled</span>' : '<span class="badge ok">Paid</span>';

    const m = UI.modal('Sale details', '<div class="sd-head"><div><div class="sd-receipt">' + UI.esc(s.receipt) + '</div><div class="muted">' + UI.dt(s.date) + '</div></div>' + status + '</div>' +
      '<div class="sd-prod">' + thumb + '<div class="grow"><b>' + UI.esc(s.name) + '</b><small class="muted" style="display:block">' + UI.esc(s.code) + ' · ' + UI.esc(cat.label) + '</small></div><div class="sd-qty">× ' + s.qty + '</div></div>' +
      '<div class="summary">' +
        '<div><span>Price each</span><b>' + UI.inr(s.price) + '</b></div>' +
        '<div><span>Quantity</span><b>' + s.qty + '</b></div>' +
        '<div><span>Discount</span><b>' + (s.discount ? '- ' + UI.inr(s.discount) : 'None') + '</b></div>' +
        '<div><span>Total paid</span><b class="big">' + UI.inr(s.total) + '</b></div>' +
        (canCost ? '<div><span>Profit on this sale</span><b>' + UI.inr(s.profit) + '</b></div>' : '') + '</div>' +
      '<div class="sd-grid">' + cell('Payment mode', s.payment) + cell('Sold by', s.soldBy) + cell('Customer', s.customer) +
        cell('Customer phone', s.phone, s.phone ? '<a class="link" href="tel:' + UI.esc(s.phone) + '">' + UI.esc(s.phone) + ' 📞</a>' : '') +
        cell('Phone IMEI', s.imei) + cell('Notes', s.note) + '</div>' +
      (s.voided ? '<div class="form-error" style="margin-top:12px"><b>Cancelled</b> by ' + UI.esc(s.voidedBy || '') + (s.voidReason ? ': ' + UI.esc(s.voidReason) : '') + '. Stock was put back.</div>' : '') +
      '<div class="section-title">Payment screenshot</div><div class="sd-proof" id="proofbox"></div>' +
      '<input type="file" id="pfile" accept="image/*" hidden>' +
      '<div class="form-actions"><button class="btn" data-a="close">Close</button></div>', false, true);

    const box = m.$('#proofbox'), file = m.$('#pfile');
    const drawProof = () => {
      const cur = Store.sales().find(x => x.id === id);
      box.innerHTML = cur.proof
        ? '<img src="' + cur.proof + '" alt="Payment screenshot"><div class="proof-actions"><button class="btn sm" data-a="zoom">🔍 View full screen</button>' +
          '<a class="btn sm" href="' + cur.proof + '" download="' + UI.esc(cur.receipt) + '-payment.jpg">⬇ Download</a>' +
          '<button class="btn sm" data-a="add">Replace</button>' + (Auth.can('sales.void') ? '<button class="btn sm" data-a="rm">Remove</button>' : '') + '</div>'
        : '<div class="proof-empty">No payment screenshot added yet.<br><button class="btn primary sm" data-a="add" style="margin-top:10px">📎 Add payment screenshot</button></div>';
    };
    drawProof();
    m.root.addEventListener('click', e => {
      const b = e.target.closest('[data-a]'); if (!b) return;
      const a = b.dataset.a;
      if (a === 'close') m.close();
      if (a === 'add') file.click();
      if (a === 'zoom') UI.lightbox(Store.sales().find(x => x.id === id).proof);
      if (a === 'rm') { Service.setProof(id, ''); drawProof(); App.render(); UI.toast('Screenshot removed'); }
    });
    box.addEventListener('click', e => { if (e.target.tagName === 'IMG') UI.lightbox(e.target.src); });
    file.onchange = async e => {
      try { Service.setProof(id, await UI.readPhoto(e.target.files[0], 1000, 0.8)); drawProof(); App.render(); UI.toast('Payment screenshot saved'); }
      catch (err) { UI.toast(err.message, 'err'); }
      file.value = '';
    };
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
      list.innerHTML = '<table><thead><tr><th>Receipt</th><th>Product</th><th class="num">Qty</th><th class="num">Total</th><th class="hm">Payment</th><th class="hm">Customer</th><th class="hm">Sold by</th><th></th></tr></thead><tbody>' +
        rows.map(s => '<tr class="' + (s.voided ? 'void' : '') + '"><td><b>' + s.receipt + '</b><small>' + UI.dt(s.date) + '</small></td><td>' + UI.esc(s.name) + (s.proof ? ' <span title="Payment screenshot attached">📎</span>' : '') + (s.imei ? '<small>IMEI ' + UI.esc(s.imei) + '</small>' : '') + '</td>' +
          '<td class="num">' + s.qty + '</td><td class="num"><b>' + UI.inr(s.total) + '</b></td><td class="hm">' + UI.esc(s.payment) + '</td><td class="hm">' + UI.esc(s.customer || '-') + '</td><td class="hm">' + UI.esc(s.soldBy) + '</td>' +
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
