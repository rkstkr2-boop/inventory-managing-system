/* ==========================================================
   storage.js  -  Data layer (browser localStorage)
   All shop data lives here: users, products, sales, stock log
   ========================================================== */
const Store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem('ims_' + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) { localStorage.setItem('ims_' + key, JSON.stringify(value)); },
  uid(prefix) {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  },

  async hash(text) {
    if (window.crypto && crypto.subtle) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('ims|' + text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }
    return 'x' + btoa(unescape(encodeURIComponent(text)));
  },

  users()    { return this.get('users', []); },
  products() { return this.get('products', []); },
  sales()    { return this.get('sales', []); },
  logs()     { return this.get('logs', []); },
  vendors()   { return this.get('vendors', []); },
  purchases() { return this.get('purchases', []); },
  saveVendors(v)   { this.set('vendors', v); },
  savePurchases(v) { this.set('purchases', v); },
  saveUsers(v)    { this.set('users', v); },
  saveProducts(v) { this.set('products', v); },
  saveSales(v)    { this.set('sales', v); },
  saveLogs(v)     { this.set('logs', v); },

  nextCode(prefix) {
    const c = this.get('counters', {});
    c[prefix] = (c[prefix] || 0) + 1;
    this.set('counters', c);
    return prefix + '-' + String(c[prefix]).padStart(4, '0');
  },

  /* First run: default logins + full sample data (see demo.js) */
  async init() {
    if (!this.get('seeded', false)) {
      this.saveUsers([
        { id: 'u1', name: 'Managing Director', username: 'director', role: 'md',       pass: await this.hash('director123'), active: true },
        { id: 'u2', name: 'Inventory Manager', username: 'manager',  role: 'manager',  pass: await this.hash('manager123'),  active: true },
        { id: 'u3', name: 'Shop Employee',     username: 'employee', role: 'employee', pass: await this.hash('employee123'), active: true }
      ]);
      Demo.load();
      this.set('seeded', true);
      return;
    }
    /* older installs that only hold the small sample set get the full one once */
    if (!this.get('demo2', false)) {
      this.set('demo2', true);
      if (this.products().every(p => p.demo)) Demo.load();
    }
  }
};
