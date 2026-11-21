/* views/vendors.js - people / companies we buy stock from, with purchase history */
const VendorsView = {
  q: '',
  TERMS: ['Cash on delivery', 'Advance payment', '7 days credit', '15 days credit', '30 days credit'],

  stats(v) {
    const buys = Store.purchases().filter(b => b.vid === v.id);
    return { buys, total: buys.reduce((n, b) => n + b.total, 0), units: buys.reduce((n, b) => n + b.qty, 0), last: buys[0] ? buys[0].date : null };
  },

  openForm(id, done) {
    const v = id ? Store.vendors().find(x => x.id === id) : null;
    const g = k => UI.esc(v ? v[k] : '');
    const m = UI.modal(v ? 'Edit vendor' : 'Add vendor', '<form id="vf"><div class="form-grid">' +
      '<label class="fld full"><span>Vendor / company name <b class="req">*</b></span><input id="vn" required value="' + g('name') + '"></label>' +
      '<label class="fld"><span>Contact person</span><input id="vc" value="' + g('contact') + '"></label>' +
      '<label class="fld"><span>Phone</span><input id="vp" inputmode="tel" value="' + g('phone') + '"></label>' +
      '<label class="fld"><span>Email</span><input id="ve" type="email" value="' + g('email') + '"></label>' +
      '<label class="fld"><span>GST number</span><input id="vg" value="' + g('gstin') + '"></label>' +
      '<label class="fld full"><span>Address / city</span><input id="va" value="' + g('address') + '"></label>' +
      '<label class="fld"><span>Payment terms</span><select id="vt"><option value="">Select...</option>' +
        this.TERMS.map(t => '<option' + (v && v.terms === t ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></label>' +
      '<label class="fld"><span>Notes</span><input id="vo" value="' + g('notes') + '" placeholder="Best rates for phones, etc."></label></div>' +
      '<div id="ve2" class="form-error" hidden></div>' +
      '<div class="form-actions"><button type="button" class="btn" data-x>Cancel</button><button class="btn primary">' + (v ? 'Save changes' : 'Add vendor') + '</button></div></form>');
    m.$('[data-x]').onclick = m.close;
    m.$('#vf').addEventListener('submit', e => {
      e.preventDefault();
      const name = m.$('#vn').value.trim();
      const all = Store.vendors();
      if (all.some(x => x.id !== id && x.name.toLowerCase() === name.toLowerCase())) {
        const b = m.$('#ve2'); b.textContent = 'A vendor with this name already exists.'; b.hidden = false; return;
      }
      const data = { name, contact: m.$('#vc').value.trim(), phone: m.$('#vp').value.trim(), email: m.$('#ve').value.trim(),
        gstin: m.$('#vg').value.trim(), address: m.$('#va').value.trim(), terms: m.$('#vt').value, notes: m.$('#vo').value.trim() };
      if (v) {
        const cur = all.find(x => x.id === id), oldName = cur.name;
        Object.assign(cur, data);
        if (oldName !== name) {   // keep product "bought from" labels in step
          const ps = Store.products(); ps.forEach(p => { if (p.supplier === oldName) p.supplier = name; });
          Store.saveProducts(ps);
          const bs = Store.purchases(); bs.forEach(b => { if (b.vid === id) b.vendor = name; }); Store.savePurchases(bs);
        }
      } else {
        all.unshift(Object.assign({ id: Store.uid('v'), addedAt: new Date().toISOString() }, data));
      }
      Store.saveVendors(all);
      m.close(); UI.toast(v ? 'Vendor updated' : 'Vendor added'); done && done();
    });
  },

  openDetails(id, done) {
    const v = Store.vendors().find(x => x.id === id);
    if (!v) return;
    const s = this.stats(v);
    const row = (a, b, html) => b ? '<div><span class="muted">' + a + '</span><b>' + (html || UI.esc(b)) + '</b></div>' : '';
    /* products bought from this vendor */
    const byProd = {};
    s.buys.forEach(b => { const x = byProd[b.pid] || (byProd[b.pid] = { name: b.name, qty: 0, cost: b.cost, last: b.date }); x.qty += b.qty; });
    const prods = Object.values(byProd).sort((a, b) => b.qty - a.qty);
    const m = UI.modal(v.name, '<div class="stats vstats">' +
      '<div class="stat"><small>Total bought</small><b>' + UI.inr(s.total) + '</b></div>' +
      '<div class="stat"><small>Units bought</small><b>' + s.units + '</b></div>' +
      '<div class="stat"><small>Last purchase</small><b style="font-size:16px">' + (s.last ? UI.dt(s.last) : 'None yet') + '</b></div></div>' +
      '<div class="section-title first">Contact details</div><div class="summary">' +
        row('Contact person', v.contact) + row('Phone', v.phone, v.phone ? '<a class="link" href="tel:' + UI.esc(v.phone) + '">' + UI.esc(v.phone) + ' 📞</a>' : '') +
        row('Email', v.email, v.email ? '<a class="link" href="mailto:' + UI.esc(v.email) + '">' + UI.esc(v.email) + '</a>' : '') +
        row('Address', v.address) + row('GST number', v.gstin) + row('Payment terms', v.terms) + row('Notes', v.notes) +
        (!v.contact && !v.phone && !v.email && !v.address ? '<div class="muted">No contact details saved yet. Tap Edit to add them.</div>' : '') + '</div>' +
      '<div class="section-title">What we buy from them</div>' +
      (prods.length ? '<div class="summary">' + prods.map(p => '<div><span>' + UI.esc(p.name) + '</span><b>' + p.qty + ' pcs @ ' + UI.inr(p.cost) + '</b></div>').join('') + '</div>' : '<div class="muted" style="margin-bottom:10px">Nothing yet. Choose this vendor when you add or receive stock.</div>') +
      '<div class="section-title">Purchase history</div>' +
      (s.buys.length ? '<div class="table-wrap"><table><thead><tr><th>Date</th><th>Product</th><th class="num">Qty</th><th class="num">Cost each</th><th class="num">Total</th></tr></thead><tbody>' +
        s.buys.slice(0, 25).map(b => '<tr><td>' + UI.dt(b.date) + '<small>' + UI.esc(b.by) + '</small></td><td>' + UI.esc(b.name) + (b.note ? '<small>' + UI.esc(b.note) + '</small>' : '') + '</td><td class="num">' + b.qty + '</td><td class="num">' + UI.inr(b.cost) + '</td><td class="num"><b>' + UI.inr(b.total) + '</b></td></tr>').join('') + '</tbody></table></div>' : '<div class="muted">No purchases recorded.</div>') +
      '<div class="form-actions"><button class="btn" data-a="del"' + (Auth.can('stock.delete') ? '' : ' hidden') + '>Delete vendor</button><button class="btn primary" data-a="edit">Edit vendor</button></div>', true);
    m.root.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      if (b.dataset.a === 'edit') { m.close(); this.openForm(id, done); }
      if (b.dataset.a === 'del' && await UI.confirm('Delete vendor?', 'Delete "' + v.name + '"? Past purchase records are kept.', 'Delete')) {
        Store.saveVendors(Store.vendors().filter(x => x.id !== id)); m.close(); UI.toast('Vendor deleted'); done && done();
      }
    });
  },

  render(el) {
    Service.syncVendors();
    const vendors = Store.vendors();
    const withStats = vendors.map(v => Object.assign({ v }, this.stats(v)));
    const spent = withStats.reduce((n, x) => n + x.total, 0);
    const refresh = () => App.render();

    el.innerHTML = '<div class="stats"><div class="stat"><small>Vendors</small><b data-count="' + vendors.length + '">0</b></div>' +
      '<div class="stat"><small>Total bought (all time)</small><b data-count="' + spent + '" data-fmt="inr">0</b></div>' +
      '<div class="stat"><small>Purchases recorded</small><b data-count="' + Store.purchases().length + '">0</b></div></div>' +
      '<div class="card no-swipe"><div class="toolbar"><input type="search" id="q" class="grow" placeholder="Search vendor, contact, phone, city..." value="' + UI.esc(this.q) + '">' +
      '<button class="btn primary" id="add">+ Add vendor</button></div><div id="list"></div></div>';

    const draw = () => {
      const q = this.q.toLowerCase();
      const rows = withStats.filter(x => !q || [x.v.name, x.v.contact, x.v.phone, x.v.address, x.v.gstin].join(' ').toLowerCase().includes(q));
      el.querySelector('#list').innerHTML = !rows.length
        ? '<div class="empty">' + (vendors.length ? 'No vendor matches your search.' : 'No vendors yet. Tap "+ Add vendor", or pick a vendor name when you add stock and it will appear here.') + '</div>'
        : '<div class="vgrid">' + rows.map(x => '<article class="vcard" data-id="' + x.v.id + '" tabindex="0">' +
          '<div class="vav">' + UI.esc(x.v.name.charAt(0).toUpperCase()) + '</div><div class="grow"><b>' + UI.esc(x.v.name) + '</b>' +
          '<small>' + UI.esc([x.v.contact, x.v.phone].filter(Boolean).join(' · ') || 'No contact saved') + '</small>' +
          '<div class="vrow"><span><b>' + UI.inr(x.total) + '</b> bought</span><span><b>' + x.units + '</b> pcs</span></div>' +
          '<small>' + (x.last ? 'Last: ' + UI.dt(x.last) : 'No purchases yet') + '</small></div></article>').join('') + '</div>';
      FX.after(el.querySelector('#list'));
    };
    draw();
    el.querySelector('#q').oninput = e => { this.q = e.target.value; draw(); };
    el.querySelector('#add').onclick = () => this.openForm(null, refresh);
    el.querySelector('#list').addEventListener('click', e => {
      const c = e.target.closest('[data-id]'); if (c) this.openDetails(c.dataset.id, refresh);
    });
  }
};
Views.vendors = el => VendorsView.render(el);
