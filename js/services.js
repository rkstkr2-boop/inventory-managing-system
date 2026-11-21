/* ==========================================================
   services.js  -  Business rules
   Every stock change goes through here so it is always logged.
   ========================================================== */
const Service = {
  _log(p, type, qty, before, after, reason, user, ref) {
    const logs = Store.logs();
    logs.unshift({ id: Store.uid('l'), date: new Date().toISOString(), pid: p.id, code: p.code, name: p.name,
                   type, qty, before, after, reason: reason || '', by: user.name, ref: ref || '' });
    Store.saveLogs(logs);
  },

  /* ---------- vendors ---------- */
  vendorByName(name) {
    const n = (name || '').trim().toLowerCase();
    return n ? Store.vendors().find(v => v.name.toLowerCase() === n) : null;
  },
  /* find a vendor by name, creating a basic record if it is new */
  ensureVendor(name) {
    name = (name || '').trim();
    if (!name) return null;
    let v = this.vendorByName(name);
    if (!v) {
      v = { id: Store.uid('v'), name, contact: '', phone: '', email: '', address: '', gstin: '', terms: '', notes: '', addedAt: new Date().toISOString() };
      const all = Store.vendors(); all.unshift(v); Store.saveVendors(all);
    }
    return v;
  },
  /* make sure every supplier already typed on a product has a vendor record */
  syncVendors() {
    Store.products().forEach(p => { if (p.supplier && !p.demo) this.ensureVendor(p.supplier); });
  },
  _purchase(p, qty, cost, vendorName, user, note) {
    const v = this.ensureVendor(vendorName);
    if (!v || qty < 1) return;
    const list = Store.purchases();
    list.unshift({ id: Store.uid('b'), date: new Date().toISOString(), vid: v.id, vendor: v.name, pid: p.id, code: p.code,
                   name: p.name, qty, cost, total: qty * cost, by: user.name, note: note || '' });
    Store.savePurchases(list);
  },

  buildName(category, attrs) {
    return CATEGORIES[category].name(attrs).trim() || 'Unnamed item';
  },

  /* Add a brand-new product with opening stock */
  addProduct(d, user) {
    const products = Store.products();
    const p = {
      id: Store.uid('p'), code: Store.nextCode(CATEGORIES[d.category].prefix),
      category: d.category, name: this.buildName(d.category, d.attrs), attrs: d.attrs,
      cost: d.cost, price: d.price, qty: d.qty, min: d.min, supplier: d.supplier, notes: d.notes, photo: d.photo || '',
      addedAt: new Date().toISOString(), addedBy: user.name
    };
    products.unshift(p);
    Store.saveProducts(products);
    this._log(p, 'in', d.qty, 0, d.qty, 'Opening stock' + (d.supplier ? ' from ' + d.supplier : ''), user);
    if (d.supplier) { if (d.qty > 0) this._purchase(p, d.qty, d.cost, d.supplier, user, 'Opening stock'); else this.ensureVendor(d.supplier); }
    return p;
  },

  /* Edit product details (not quantity - use changeStock for that) */
  updateProduct(id, d) {
    const products = Store.products();
    const p = products.find(x => x.id === id);
    if (!p) return null;
    Object.assign(p, { attrs: d.attrs, name: this.buildName(p.category, d.attrs),
                       cost: d.cost, price: d.price, min: d.min, supplier: d.supplier, notes: d.notes, photo: d.photo || '' });
    Store.saveProducts(products);
    if (d.supplier) this.ensureVendor(d.supplier);
    return p;
  },

  deleteProduct(id) {
    Store.saveProducts(Store.products().filter(p => p.id !== id));
  },

  /* delta > 0 = stock received, delta < 0 = removed (damaged, lost, returned) */
  changeStock(id, delta, reason, user, newCost, vendorName) {
    const products = Store.products();
    const p = products.find(x => x.id === id);
    if (!p) throw new Error('Product not found');
    if (p.qty + delta < 0) throw new Error('Cannot remove more than the ' + p.qty + ' in stock.');
    const before = p.qty;
    p.qty += delta;
    if (delta > 0 && newCost > 0) p.cost = newCost;
    Store.saveProducts(products);
    this._log(p, delta > 0 ? 'in' : 'adjust', delta, before, p.qty, reason, user);
    if (delta > 0 && vendorName) this._purchase(p, delta, p.cost, vendorName, user, reason);
    return p;
  },

  /* A sale: reduces stock automatically and records everything */
  recordSale(s, user) {
    const products = Store.products();
    const p = products.find(x => x.id === s.pid);
    if (!p) throw new Error('Product not found');
    if (s.qty < 1) throw new Error('Quantity must be at least 1.');
    if (s.qty > p.qty) throw new Error('Only ' + p.qty + ' in stock.');
    if (s.discount > s.price * s.qty) throw new Error('Discount is more than the sale amount.');
    const before = p.qty;
    p.qty -= s.qty;
    Store.saveProducts(products);

    const total = s.price * s.qty - s.discount;
    const sale = {
      id: Store.uid('s'), receipt: 'INV-' + String(Store.sales().length + 1).padStart(5, '0'),
      date: new Date().toISOString(), pid: p.id, code: p.code, name: p.name, category: p.category,
      qty: s.qty, price: s.price, discount: s.discount, total, cost: p.cost,
      profit: total - p.cost * s.qty, payment: s.payment, customer: s.customer, phone: s.phone,
      imei: s.imei, note: s.note, soldBy: user.name, soldById: user.id, voided: false
    };
    const sales = Store.sales();
    sales.unshift(sale);
    Store.saveSales(sales);
    this._log(p, 'sale', -s.qty, before, p.qty, 'Sold ' + sale.receipt, user, sale.receipt);
    return sale;
  },

  /* Cancel a sale (wrong entry / return): puts stock back */
  voidSale(id, reason, user) {
    const sales = Store.sales();
    const s = sales.find(x => x.id === id);
    if (!s || s.voided) throw new Error('Sale already cancelled.');
    s.voided = true; s.voidReason = reason; s.voidedBy = user.name;
    Store.saveSales(sales);
    const products = Store.products();
    const p = products.find(x => x.id === s.pid);
    if (p) {
      const before = p.qty;
      p.qty += s.qty;
      Store.saveProducts(products);
      this._log(p, 'void', s.qty, before, p.qty, 'Cancelled ' + s.receipt + (reason ? ': ' + reason : ''), user, s.receipt);
    }
  },

  stockStatus(p) {
    if (p.qty <= 0) return 'out';
    if (p.qty < p.min) return 'low';   // fewer than the alert level (default 5) = restock
    return 'ok';
  }
};
