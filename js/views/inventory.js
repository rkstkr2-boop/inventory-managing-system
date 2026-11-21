/* views/inventory.js - stock with photos: grid/table, add/edit, full details, receive/remove stock */
const InventoryView = {
  filters: { q: '', cat: '', status: '' },
  mode: 'grid',

  /* ---------- add / edit product form (with photo) ---------- */
  openProductForm(id, done) {
    const editing = id ? Store.products().find(p => p.id === id) : null;
    const m = UI.modal(editing ? 'Edit product' : 'Add new stock', '<form id="pf"></form>', true);
    const form = m.$('#pf');
    const catKeys = Object.keys(CATEGORIES);
    let cat = editing ? editing.category : catKeys[0];
    let photo = editing ? editing.photo || '' : '';

    const drawPhoto = () => {
      const box = form.querySelector('#photobox');
      box.innerHTML = (photo ? '<img src="' + photo + '" alt="Product photo">' : '<span>📷<br>Add photo</span>');
      form.querySelector('#rmphoto').hidden = !photo;
    };

    const draw = () => {
      const c = CATEGORIES[cat];
      const old = editing && editing.category === cat ? editing.attrs : {};
      form.innerHTML =
        '<div class="photo-row"><label class="photo-pick" title="Tap to take or choose a photo"><div id="photobox"></div>' +
          '<input type="file" id="pfile" accept="image/*" hidden></label>' +
          '<div><b>Product photo</b><p class="muted" style="margin:4px 0 8px">Take a picture or choose one. It is shrunk automatically.</p>' +
          '<button type="button" class="btn sm" id="rmphoto">Remove photo</button></div></div>' +
        '<div class="section-title">Product type</div>' +
        '<label class="fld"><span>Category <b class="req">*</b></span><select id="pcat"' + (editing ? ' disabled' : '') + '>' +
          catKeys.map(k => '<option value="' + k + '"' + (k === cat ? ' selected' : '') + '>' + CATEGORIES[k].icon + ' ' + CATEGORIES[k].label + '</option>').join('') + '</select></label>' +
        '<div class="section-title">' + UI.esc(c.label) + ' details</div>' +
        '<div class="form-grid">' + c.fields.map(f => UI.field(f, old[f.k], 'a_')).join('') + '</div>' +
        '<div class="section-title">Pricing &amp; stock</div>' +
        '<div class="form-grid">' +
          '<label class="fld"><span>Selling price (₹) <b class="req">*</b></span><input name="price" type="number" min="0" step="any" required value="' + (editing ? editing.price : '') + '"></label>' +
          '<label class="fld"><span>Purchase / cost price (₹) <b class="req">*</b></span><input name="cost" type="number" min="0" step="any" required value="' + (editing ? editing.cost : '') + '"></label>' +
          (editing ? '' : '<label class="fld"><span>Quantity received <b class="req">*</b></span><input name="qty" type="number" min="0" step="1" required></label>') +
          '<label class="fld"><span>Show "Restock" when fewer than <b class="req">*</b></span><input name="min" type="number" min="0" step="1" required value="' + (editing ? editing.min : 5) + '"></label>' +
          '<label class="fld"><span>Vendor (bought from)</span><input name="supplier" list="vlist" placeholder="Pick or type a new vendor" value="' + UI.esc(editing ? editing.supplier : '') + '">' + UI.vendorList() + '</label>' +
          '<label class="fld full"><span>Notes</span><input name="notes" value="' + UI.esc(editing ? editing.notes : '') + '" placeholder="Anything else worth remembering"></label>' +
        '</div><div id="perr" class="form-error" hidden></div>' +
        '<div class="form-actions"><button type="button" class="btn" data-close2>Cancel</button><button class="btn primary">' + (editing ? 'Save changes' : 'Add to stock') + '</button></div>';
      drawPhoto();
      form.querySelector('#pcat').onchange = e => { cat = e.target.value; draw(); };
      form.querySelector('[data-close2]').onclick = m.close;
      form.querySelector('.photo-pick').onclick = () => form.querySelector('#pfile').click();
      form.querySelector('#rmphoto').onclick = () => { photo = ''; drawPhoto(); };
      form.querySelector('#pfile').onchange = async e => {
        try { photo = await UI.readPhoto(e.target.files[0]); drawPhoto(); }
        catch (err) { UI.toast(err.message, 'err'); }
      };
    };
    draw();

    form.addEventListener('submit', e => {
      e.preventDefault();
      const fd = new FormData(form);
      const attrs = {};
      CATEGORIES[cat].fields.forEach(f => { attrs[f.k] = (fd.get('a_' + f.k) || '').toString().trim(); });
      const data = {
        category: cat, attrs, photo, price: Number(fd.get('price')), cost: Number(fd.get('cost')),
        qty: Number(fd.get('qty') || 0), min: Number(fd.get('min')),
        supplier: (fd.get('supplier') || '').trim(), notes: (fd.get('notes') || '').trim()
      };
      const err = form.querySelector('#perr');
      const fail = msg => { err.textContent = msg; err.hidden = false; };
      if (data.price < 0 || data.cost < 0 || data.min < 0 || data.qty < 0) return fail('Numbers cannot be negative.');
      if (!editing && !Number.isInteger(data.qty)) return fail('Quantity must be a whole number.');
      try {
        if (editing) Service.updateProduct(editing.id, data); else Service.addProduct(data, App.user);
      } catch (ex) { return fail('Browser storage is full. Remove some photos or download a backup and clear old data.'); }
      m.close();
      UI.toast(editing ? 'Product updated' : 'Stock added: ' + Service.buildName(cat, attrs));
      done && done();
    });
  },

  /* ---------- receive more stock / remove stock ---------- */
  openStockUpdate(id, done) {
    const p = Store.products().find(x => x.id === id);
    const m = UI.modal('Update stock', '<form id="sf">' +
      '<div class="summary"><div><span>' + UI.esc(p.name) + '</span><b>' + UI.esc(p.code) + '</b></div><div><span>Current stock</span><b>' + p.qty + '</b></div></div>' +
      '<div class="form-grid"><label class="fld full"><span>What happened?</span><select id="mode">' +
        '<option value="in">Received new stock (purchase)</option><option value="out">Remove stock (damaged / lost / returned to supplier)</option></select></label>' +
      '<label class="fld"><span>Quantity <b class="req">*</b></span><input id="q" type="number" min="1" step="1" required></label>' +
      (Auth.can('cost.view') ? '<label class="fld" id="costwrap"><span>New cost price (₹)</span><input id="nc" type="number" min="0" step="any" placeholder="' + p.cost + '"></label>' : '') +
      '<label class="fld full" id="vwrap"><span>Vendor (bought from)</span><input id="vn" list="vlist" placeholder="Pick or type a new vendor" value="' + UI.esc(p.supplier || '') + '">' + UI.vendorList() + '</label>' +
      '<label class="fld full"><span>Reason / note <b class="req">*</b></span><input id="r" required placeholder="e.g. Bill no. 123, or damaged in shipping"></label></div>' +
      '<div class="summary"><div><span>Stock after update</span><b class="big" id="after">' + p.qty + '</b></div></div>' +
      '<div id="serr" class="form-error" hidden></div>' +
      '<div class="form-actions"><button type="button" class="btn" data-x>Cancel</button><button class="btn primary">Update stock</button></div></form>');
    const q = m.$('#q'), mode = m.$('#mode');
    const upd = () => {
      const n = parseInt(q.value, 10) || 0;
      m.$('#after').textContent = p.qty + (mode.value === 'in' ? n : -n);
      const cw = m.$('#costwrap'); if (cw) cw.hidden = mode.value !== 'in';
      m.$('#vwrap').hidden = mode.value !== 'in';
    };
    q.oninput = upd; mode.onchange = upd;
    m.$('[data-x]').onclick = m.close;
    m.$('#sf').addEventListener('submit', e => {
      e.preventDefault();
      try {
        const n = parseInt(q.value, 10);
        if (!(n >= 1)) throw new Error('Enter a quantity of 1 or more.');
        const nc = m.$('#nc');
        Service.changeStock(p.id, mode.value === 'in' ? n : -n, m.$('#r').value.trim(), App.user, nc ? Number(nc.value) : 0, mode.value === 'in' ? m.$('#vn').value.trim() : '');
        m.close(); UI.toast('Stock updated'); done && done();
      } catch (err) { const b = m.$('#serr'); b.textContent = err.message; b.hidden = false; }
    });
  },

  /* ---------- full details of one product ---------- */
  openDetails(id, done) {
    const p = Store.products().find(x => x.id === id);
    if (!p) return;
    const c = CATEGORIES[p.category], st = Service.stockStatus(p), cost = Auth.can('cost.view');
    const sold = Store.sales().filter(s => s.pid === p.id && !s.voided);
    const row = (a, b) => (b === '' || b == null) ? '' : '<div><span class="muted">' + UI.esc(a) + '</span><b>' + UI.esc(b) + '</b></div>';
    const moves = Store.logs().filter(l => l.pid === p.id).slice(0, 5);
    const m = UI.modal(p.name, '<div class="detail-top">' + UI.thumb(p, 'detail-img') +
      '<div><div class="muted">' + c.icon + ' ' + UI.esc(c.label) + ' · ' + UI.esc(p.code) + '</div>' +
      '<div class="detail-price">' + UI.inr(p.price) + '</div>' + UI.badge(st) +
      '<div class="detail-qty"><b>' + p.qty + '</b> in stock</div></div></div>' +
      '<div class="section-title first">Details</div><div class="summary">' +
        c.fields.map(f => row(f.l, p.attrs[f.k])).join('') + '</div>' +
      '<div class="section-title">Business</div><div class="summary">' +
        (cost ? row('Cost price', UI.inr(p.cost)) + row('Profit per piece', UI.inr(p.price - p.cost)) : '') +
        row('Restock alert below', p.min) + row('Supplier', p.supplier) + row('Notes', p.notes) +
        row('Total sold', sold.reduce((n, s) => n + s.qty, 0) + ' pcs · ' + UI.inr(sold.reduce((n, s) => n + s.total, 0))) +
        row('Added', UI.dt(p.addedAt) + ' by ' + p.addedBy) + '</div>' +
      (moves.length ? '<div class="section-title">Recent stock movement</div><div class="summary">' +
        moves.map(l => '<div><span class="muted">' + UI.dt(l.date) + ' · ' + UI.esc(l.reason) + '</span><b>' + (l.qty > 0 ? '+' : '') + l.qty + '</b></div>').join('') + '</div>' : '') +
      '<div class="form-actions">' +
        (Auth.can('sell') ? '<button class="btn success" data-a="sell"' + (p.qty < 1 ? ' disabled' : '') + '>Sell</button>' : '') +
        (Auth.can('stock.adjust') ? '<button class="btn" data-a="stock">Stock +/-</button>' : '') +
        (Auth.can('stock.edit') ? '<button class="btn primary" data-a="edit">Edit / change photo</button>' : '') + '</div>', true);
    m.root.addEventListener('click', e => {
      const b = e.target.closest('button[data-a]'); if (!b) return;
      m.close();
      if (b.dataset.a === 'sell') SalesView.openSale(id, done);
      if (b.dataset.a === 'stock') this.openStockUpdate(id, done);
      if (b.dataset.a === 'edit') this.openProductForm(id, done);
    });
  },

  /* ---------- the list ---------- */
  render(el) {
    const f = this.filters;
    const canAdd = Auth.can('stock.add'), canEdit = Auth.can('stock.edit'), canAdj = Auth.can('stock.adjust'), canDel = Auth.can('stock.delete'), cost = Auth.can('cost.view');
    const refresh = () => App.render();

    el.innerHTML = '<div class="card no-swipe"><div class="toolbar">' +
      '<input type="search" id="q" class="grow" placeholder="Search name, code, brand, model..." value="' + UI.esc(f.q) + '">' +
      '<select id="cat"><option value="">All categories</option>' + Object.keys(CATEGORIES).map(k => '<option value="' + k + '"' + (f.cat === k ? ' selected' : '') + '>' + CATEGORIES[k].label + '</option>').join('') + '</select>' +
      '<select id="st"><option value="">All stock levels</option><option value="low"' + (f.status === 'low' ? ' selected' : '') + '>Need restock</option><option value="out"' + (f.status === 'out' ? ' selected' : '') + '>Out of stock</option></select>' +
      '<div class="seg"><button id="mg" class="' + (this.mode === 'grid' ? 'on' : '') + '">Photos</button><button id="mt" class="' + (this.mode === 'table' ? 'on' : '') + '">Table</button></div>' +
      (canAdd ? '<button class="btn primary" id="add">+ Add new stock</button>' : '') +
      (cost ? '<button class="btn" id="exp">Export CSV</button>' : '') + '</div>' +
      '<div id="list"></div></div>';

    const list = el.querySelector('#list');
    const buttons = p =>
      (Auth.can('sell') ? '<button class="btn sm success" data-a="sell" data-id="' + p.id + '"' + (p.qty < 1 ? ' disabled' : '') + '>Sell</button>' : '') +
      (canAdj ? '<button class="btn sm" data-a="stock" data-id="' + p.id + '">Stock +/-</button>' : '') +
      (canEdit ? '<button class="btn sm" data-a="edit" data-id="' + p.id + '">Edit</button>' : '') +
      (canDel ? '<button class="btn sm" data-a="del" data-id="' + p.id + '">Delete</button>' : '');

    const draw = () => {
      const q = f.q.toLowerCase(), all = Store.products();
      const rows = all.filter(p =>
        (!f.cat || p.category === f.cat) &&
        (!f.status || (f.status === 'out' ? p.qty <= 0 : Service.stockStatus(p) !== 'ok')) &&
        (!q || (p.name + ' ' + p.code + ' ' + Object.values(p.attrs).join(' ')).toLowerCase().includes(q)));
      if (!rows.length) { list.innerHTML = '<div class="empty">No products found.</div>'; return; }
      const top = Math.max(1, ...all.map(p => p.qty));

      if (this.mode === 'grid') {
        list.innerHTML = '<div class="pgrid">' + rows.map(p => {
          const st = Service.stockStatus(p);
          return '<article class="pcard ' + st + '" data-id="' + p.id + '" tabindex="0">' +
            '<div class="pimg">' + UI.thumb(p, 'pphoto') + (st !== 'ok' ? '<span class="ribbon ' + st + '">' + (st === 'out' ? 'Out of stock' : 'Restock!') + '</span>' : '') + '</div>' +
            '<div class="pbody"><b class="pname">' + UI.esc(p.name) + '</b><small>' + UI.esc(p.code) + ' · ' + UI.esc(CATEGORIES[p.category].label) + '</small>' +
            '<div class="prow"><span class="price">' + UI.inr(p.price) + '</span><span class="pq"><b>' + p.qty + '</b> left</span></div>' +
            '<div class="meter ' + st + '"><i data-w="' + Math.max(3, p.qty / top * 100) + '%"></i></div>' +
            '<div class="actions">' + buttons(p) + '</div></div></article>';
        }).join('') + '</div>';
      } else {
        list.innerHTML = '<div class="table-wrap"><table><thead><tr><th>Product</th><th class="hm">Category</th>' + (cost ? '<th class="num hm">Cost</th>' : '') + '<th class="num">Price</th><th class="num">In stock</th><th>Status</th><th></th></tr></thead><tbody>' +
          rows.map(p => {
            const c = CATEGORIES[p.category];
            return '<tr class="clickrow" data-id="' + p.id + '"><td><div class="rowprod">' + UI.thumb(p, 'thumb') + '<div><b>' + UI.esc(p.name) + '</b><small>' + UI.esc(p.code) + '</small></div></div></td>' +
              '<td class="hm">' + UI.esc(c.label) + '</td>' + (cost ? '<td class="num hm">' + UI.inr(p.cost) + '</td>' : '') +
              '<td class="num">' + UI.inr(p.price) + '</td><td class="num"><span class="qty">' + p.qty + '</span></td><td>' + UI.badge(Service.stockStatus(p)) + '</td>' +
              '<td><div class="actions">' + buttons(p) + '</div></td></tr>';
          }).join('') + '</tbody></table></div>';
      }
      FX.after(list);
    };
    draw();
    FX.after(el);

    el.querySelector('#q').oninput = e => { f.q = e.target.value; draw(); };
    el.querySelector('#cat').onchange = e => { f.cat = e.target.value; draw(); };
    el.querySelector('#st').onchange = e => { f.status = e.target.value; draw(); };
    el.querySelector('#mg').onclick = () => { this.mode = 'grid'; App.render(); };
    el.querySelector('#mt').onclick = () => { this.mode = 'table'; App.render(); };
    const add = el.querySelector('#add'); if (add) add.onclick = () => this.openProductForm(null, refresh);
    const exp = el.querySelector('#exp');
    if (exp) exp.onclick = () => UI.download('stock-' + new Date().toISOString().slice(0, 10) + '.csv',
      UI.csv([['Code', 'Name', 'Category', 'Cost', 'Price', 'Qty', 'Restock below', 'Supplier']].concat(Store.products().map(p => [p.code, p.name, CATEGORIES[p.category].label, p.cost, p.price, p.qty, p.min, p.supplier]))));

    list.addEventListener('click', async e => {
      const b = e.target.closest('button[data-a]');
      if (b) {
        const id = b.dataset.id;
        if (b.dataset.a === 'sell') SalesView.openSale(id, refresh);
        if (b.dataset.a === 'stock') this.openStockUpdate(id, refresh);
        if (b.dataset.a === 'edit') this.openProductForm(id, refresh);
        if (b.dataset.a === 'del') {
          const p = Store.products().find(x => x.id === id);
          if (await UI.confirm('Delete product?', 'Delete "' + p.name + '" permanently? Past sales records are kept.', 'Delete')) {
            Service.deleteProduct(id); UI.toast('Product deleted'); refresh();
          }
        }
        return;
      }
      const card = e.target.closest('[data-id]');
      if (card) this.openDetails(card.dataset.id, refresh);
    });
  }
};
Views.inventory = el => InventoryView.render(el);
