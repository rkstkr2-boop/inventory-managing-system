/* ==========================================================
   demo.js  -  Sample shop data: vendors, ~40 products with
   pictures, purchases, 30 days of sales and the stock log.
   Everything is consistent: stock left = bought - sold.
   Used on first run and by Users > "Load full demo data".
   ========================================================== */
const Demo = {
  /* ---------- product pictures (drawn as SVG, work offline) ---------- */
  lum(hex) {
    const n = parseInt(hex.slice(1), 16);
    return (0.299 * (n >> 16) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255;
  },
  art(cat, c, label) {
    const L = String(label || '').replace(/[<>&"']/g, '');
    const ink = this.lum(c) > 0.62 ? '#0f172a' : '#ffffff';
    const bgs = { phone: ['#e0e7ff', '#fce7f3'], battery: ['#dcfce7', '#d1fae5'], watch: ['#fef3c7', '#ffedd5'], cover: ['#cffafe', '#e0f2fe'],
      screenguard: ['#e0f2fe', '#ede9fe'], charger: ['#fee2e2', '#ffe4e6'], earphones: ['#f3e8ff', '#fae8ff'], other: ['#f1f5f9', '#e2e8f0'] }[cat];
    const t = (y, s, sz, f) => '<text x="200" y="' + y + '" text-anchor="middle" font-family="Arial,sans-serif" font-weight="700" font-size="' + sz + '" fill="' + f + '">' + s + '</text>';
    const lens = (x, y) => '<circle cx="' + x + '" cy="' + y + '" r="12" fill="#1e293b" stroke="#94a3b8" stroke-width="3"/><circle cx="' + x + '" cy="' + y + '" r="4" fill="#64748b"/>';
    let g = '';
    if (cat === 'phone') {
      g = '<rect x="125" y="36" width="150" height="312" rx="28" fill="' + c + '"/><path d="M125 150 L275 50 L275 66 Q275 36 245 36 L155 36 Q125 36 125 66Z" fill="#fff" opacity=".14"/>' +
        '<rect x="138" y="50" width="68" height="68" rx="18" fill="#0f172a" opacity=".85"/>' + lens(158, 70) + lens(186, 70) + lens(158, 98) +
        '<circle cx="190" cy="100" r="5" fill="#fde68a"/>' + t(250, L, 19, ink) + '<rect x="275" y="120" width="4" height="40" rx="2" fill="' + c + '"/>';
    } else if (cat === 'watch') {
      g = '<rect x="168" y="30" width="64" height="130" rx="18" fill="' + c + '"/><rect x="168" y="240" width="64" height="130" rx="18" fill="' + c + '"/>' +
        '<circle cx="200" cy="200" r="78" fill="#0f172a" stroke="#cbd5e1" stroke-width="9"/><circle cx="200" cy="200" r="64" fill="#1e293b"/>' +
        t(212, '10:09', 34, '#38bdf8') + '<circle cx="282" cy="180" r="6" fill="#cbd5e1"/>' + t(250, L, 15, '#94a3b8');
    } else if (cat === 'battery') {
      g = '<rect x="105" y="125" width="190" height="150" rx="18" fill="' + c + '"/><rect x="295" y="175" width="20" height="50" rx="6" fill="#94a3b8"/>' +
        '<path d="M205 140 L165 210 H198 L188 262 L238 185 H204Z" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>' + t(310, L, 22, '#334155');
    } else if (cat === 'cover') {
      g = '<rect x="122" y="36" width="156" height="312" rx="36" fill="' + c + '"/><rect x="136" y="50" width="72" height="72" rx="20" fill="#0f172a" opacity=".75"/>' +
        lens(158, 72) + lens(186, 72) + lens(158, 100) + '<rect x="122" y="110" width="156" height="200" rx="0" fill="#fff" opacity=".1"/>' + t(250, L, 18, ink);
    } else if (cat === 'screenguard') {
      g = '<rect x="125" y="40" width="150" height="310" rx="26" fill="#fff" fill-opacity=".55" stroke="#38bdf8" stroke-width="6"/>' +
        '<path d="M150 330 L255 60 L275 60 L275 90 L175 345Z" fill="#fff" opacity=".7"/><rect x="170" y="52" width="60" height="10" rx="5" fill="#64748b" opacity=".6"/>' + t(215, '9H', 64, '#0284c7') + t(260, L, 17, '#0369a1');
    } else if (cat === 'charger') {
      g = '<rect x="168" y="112" width="12" height="36" rx="3" fill="#94a3b8"/><rect x="220" y="112" width="12" height="36" rx="3" fill="#94a3b8"/>' +
        '<rect x="145" y="145" width="110" height="120" rx="18" fill="' + c + '"/><rect x="190" y="268" width="20" height="22" fill="#475569"/>' +
        '<path d="M200 290 C200 330 130 320 140 355 C148 380 215 365 250 372" fill="none" stroke="#1e293b" stroke-width="9" stroke-linecap="round"/>' + t(215, L, 22, ink);
    } else if (cat === 'earphones') {
      g = '<rect x="120" y="205" width="160" height="115" rx="46" fill="' + c + '"/><rect x="120" y="205" width="160" height="50" rx="30" fill="#fff" opacity=".18"/>' +
        '<circle cx="200" cy="262" r="10" fill="#22c55e"/><ellipse cx="150" cy="140" rx="30" ry="36" fill="#f8fafc" stroke="' + c + '" stroke-width="6"/><rect x="141" y="165" width="16" height="44" rx="8" fill="#f8fafc" stroke="' + c + '" stroke-width="4"/>' +
        '<ellipse cx="250" cy="140" rx="30" ry="36" fill="#f8fafc" stroke="' + c + '" stroke-width="6"/><rect x="243" y="165" width="16" height="44" rx="8" fill="#f8fafc" stroke="' + c + '" stroke-width="4"/>' + t(350, L, 17, '#6b21a8');
    } else {
      g = '<path d="M110 150 L200 105 L290 150 V270 L200 315 L110 270Z" fill="' + c + '"/><path d="M110 150 L200 195 L290 150 M200 195 V315" stroke="#fff" stroke-width="5" fill="none" opacity=".7"/>' + t(355, L, 18, '#334155');
    }
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + bgs[0] + '"/><stop offset="1" stop-color="' + bgs[1] + '"/></linearGradient></defs>' +
      '<rect width="400" height="400" fill="url(#g)"/><ellipse cx="200" cy="378" rx="100" ry="10" fill="#0f172a" opacity=".1"/>' + g + '</svg>';
    return 'data:image/svg+xml,' + encodeURIComponent(svg);
  },

  /* ---------- vendors (names, numbers and GST numbers are made up) ---------- */
  VENDORS: [
    { name: 'Sharma Mobile Distributors', contact: 'Rajesh Sharma', phone: '+91 98100 12345', email: 'orders@sharmamobiles.example', address: 'Nehru Place, New Delhi 110019', gstin: '07AAAPS1234A1Z5', terms: '15 days credit', notes: 'Apple and Samsung phones. Best rates on bulk orders.' },
    { name: 'Metro Mobile Wholesale', contact: 'Imran Khan', phone: '+91 98200 23456', email: 'sales@metromobile.example', address: 'Lamington Road, Mumbai 400007', gstin: '27AABCM5678B1Z2', terms: '7 days credit', notes: 'Redmi, Realme, Vivo, OnePlus, Oppo, Nothing.' },
    { name: 'Bharat Accessories Hub', contact: 'Sunita Verma', phone: '+91 98300 34567', email: 'hello@bharatacc.example', address: 'Burrabazar, Kolkata 700007', gstin: '19AAFCB9012C1Z8', terms: 'Cash on delivery', notes: 'Chargers, cables, power banks and earphones.' },
    { name: 'TechZone Wearables', contact: 'Arjun Mehta', phone: '+91 98400 45678', email: 'arjun@techzone.example', address: 'Ritchie Street, Chennai 600002', gstin: '33AAGCT3456D1Z1', terms: '30 days credit', notes: 'Smart watches and fitness bands. Offers 6-month replacement.' },
    { name: 'Sai Cases & Guards', contact: 'Venkat Rao', phone: '+91 98500 56789', email: 'venkat@saicases.example', address: 'Begum Bazaar, Hyderabad 500012', gstin: '36AAHCS7890E1Z4', terms: 'Advance payment', notes: 'Covers and screen guards for all new models within a week.' },
    { name: 'Power Plus Batteries', contact: 'Kiran Patel', phone: '+91 98600 67890', email: 'kiran@powerplus.example', address: 'Relief Road, Ahmedabad 380001', gstin: '24AAICP1234F1Z7', terms: '7 days credit', notes: 'Original and OEM batteries, 6-month warranty.' }
  ],

  /* [category, details, cost, price, left in stock now, vendor #, colour, picture label, popularity] */
  PRODUCTS() {
    const ph = (brand, model, storage, ram, color, cond) => ({ brand, model, storage, ram, color, condition: cond || 'New', warranty: cond === 'Refurbished' ? 6 : 12 });
    return [
      ['phone', ph('Apple', 'iPhone 15', '128GB', '6GB', 'Black'), 62000, 69900, 18, 0, '#1f2937', 'iPhone 15', 5],
      ['phone', ph('Apple', 'iPhone 15 Pro', '256GB', '8GB', 'Natural Titanium'), 104000, 119900, 6, 0, '#a8a29e', 'iPhone 15 Pro', 3],
      ['phone', ph('Apple', 'iPhone 14', '128GB', '6GB', 'Blue'), 51000, 57900, 9, 0, '#60a5fa', 'iPhone 14', 3],
      ['phone', ph('Apple', 'iPhone 13', '128GB', '4GB', 'Midnight', 'Refurbished'), 33500, 38900, 4, 0, '#334155', 'iPhone 13', 2],
      ['phone', ph('Samsung', 'Galaxy S24', '256GB', '8GB', 'Onyx Black'), 58000, 64999, 11, 0, '#111827', 'Galaxy S24', 3],
      ['phone', ph('Samsung', 'Galaxy A55 5G', '128GB', '8GB', 'Awesome Navy'), 31000, 36999, 14, 0, '#1e3a8a', 'Galaxy A55', 4],
      ['phone', ph('Samsung', 'Galaxy M15 5G', '128GB', '6GB', 'Celestial Blue'), 11500, 13999, 22, 1, '#0ea5e9', 'Galaxy M15', 5],
      ['phone', ph('Redmi', 'Note 13 Pro', '256GB', '8GB', 'Midnight Black'), 21000, 24999, 25, 1, '#0f172a', 'Redmi Note 13', 7],
      ['phone', ph('Redmi', '13C', '128GB', '4GB', 'Starry Black'), 7200, 8999, 3, 1, '#1f2937', 'Redmi 13C', 6],
      ['phone', ph('OnePlus', '12R', '256GB', '8GB', 'Iron Gray'), 36000, 39999, 7, 1, '#52525b', 'OnePlus 12R', 3],
      ['phone', ph('Vivo', 'V30', '128GB', '8GB', 'Peacock Green'), 31500, 35999, 10, 1, '#0d9488', 'Vivo V30', 3],
      ['phone', ph('Realme', 'Narzo 70 Pro', '128GB', '8GB', 'Glass Green'), 15500, 18999, 13, 1, '#16a34a', 'Narzo 70 Pro', 4],
      ['phone', ph('Oppo', 'A18', '64GB', '4GB', 'Glowing Black'), 8000, 9999, 17, 1, '#27272a', 'Oppo A18', 4],
      ['phone', ph('Nothing', 'Phone (2a)', '128GB', '8GB', 'White'), 21500, 25999, 0, 1, '#f1f5f9', 'Nothing 2a', 3],

      ['battery', { brand: 'Samsung', model: 'Galaxy A52', capacity: '4500', type: 'Li-ion', grade: 'Original', warranty: 6 }, 450, 900, 20, 5, '#2563eb', '4500 mAh', 3],
      ['battery', { brand: 'Apple', model: 'iPhone 11', capacity: '3110', type: 'Li-ion', grade: 'Original', warranty: 6 }, 900, 1800, 2, 5, '#16a34a', '3110 mAh', 2],
      ['battery', { brand: 'Redmi', model: 'Note 10', capacity: '5000', type: 'Li-Polymer', grade: 'OEM / Compatible', warranty: 3 }, 320, 700, 15, 5, '#f97316', '5000 mAh', 3],
      ['battery', { brand: 'Realme', model: '8 Pro', capacity: '4500', type: 'Li-Polymer', grade: 'OEM / Compatible', warranty: 3 }, 340, 750, 8, 5, '#eab308', '4500 mAh', 2],

      ['watch', { brand: 'Noise', model: 'ColorFit Pro 4', type: 'Smart Watch', strap: 'Silicone', color: 'Jet Black', warranty: 12 }, 1800, 2999, 12, 3, '#111827', 'ColorFit Pro 4', 3],
      ['watch', { brand: 'boAt', model: 'Wave Call 3', type: 'Smart Watch', strap: 'Silicone', color: 'Active Black', warranty: 12 }, 1300, 2199, 4, 3, '#374151', 'Wave Call 3', 3],
      ['watch', { brand: 'Fire-Boltt', model: 'Ninja Call Pro', type: 'Smart Watch', strap: 'Silicone', color: 'Blue', warranty: 12 }, 1100, 1999, 15, 3, '#2563eb', 'Ninja Call Pro', 3],
      ['watch', { brand: 'Apple', model: 'Watch SE 2 GPS 40mm', type: 'Smart Watch', strap: 'Silicone', color: 'Midnight', warranty: 12 }, 24500, 29900, 3, 0, '#1e293b', 'Watch SE 2', 1],

      ['cover', { brand: 'Generic', model: 'iPhone 15', type: 'Silicone', color: 'Blue' }, 90, 349, 35, 4, '#3b82f6', 'iPhone 15', 8],
      ['cover', { brand: 'Spigen', model: 'iPhone 15 Pro', type: 'Clear / Transparent', color: 'Clear' }, 70, 299, 28, 4, '#cbd5e1', 'iPhone 15 Pro', 5],
      ['cover', { brand: 'Generic', model: 'Galaxy S24', type: 'Rugged', color: 'Black' }, 110, 399, 18, 4, '#1f2937', 'Galaxy S24', 4],
      ['cover', { brand: 'Generic', model: 'Redmi Note 13 Pro', type: 'Flip Cover', color: 'Brown' }, 85, 299, 24, 4, '#92400e', 'Redmi Note 13', 5],
      ['cover', { brand: 'Generic', model: 'Vivo V30', type: 'Hard Case', color: 'Green' }, 60, 249, 9, 4, '#059669', 'Vivo V30', 3],

      ['screenguard', { brand: 'Generic', model: 'iPhone 15', type: 'Tempered 9H' }, 40, 199, 60, 4, '#38bdf8', 'iPhone 15', 9],
      ['screenguard', { brand: 'Generic', model: 'Galaxy A55', type: 'Tempered 9H' }, 35, 179, 4, 4, '#38bdf8', 'Galaxy A55', 8],
      ['screenguard', { brand: 'Generic', model: 'Redmi Note 13 Pro', type: 'Privacy' }, 45, 249, 30, 4, '#38bdf8', 'Redmi Note 13', 6],
      ['screenguard', { brand: 'Generic', model: 'OnePlus 12R', type: 'UV Glass' }, 90, 399, 12, 4, '#38bdf8', 'OnePlus 12R', 3],

      ['charger', { brand: 'Apple', type: 'Adapter', watt: '20W', connector: 'USB-C', warranty: 12 }, 1100, 1900, 15, 2, '#f8fafc', '20W Adapter', 3],
      ['charger', { brand: 'Samsung', type: 'Adapter', watt: '25W', connector: 'USB-C', warranty: 12 }, 600, 1199, 20, 2, '#e2e8f0', '25W Adapter', 4],
      ['charger', { brand: 'Mi', type: 'Adapter', watt: '33W', connector: 'USB-C', warranty: 12 }, 550, 999, 18, 2, '#fb923c', '33W SonicCharge', 4],
      ['charger', { brand: 'Generic', type: 'Cable', watt: '1 metre', connector: 'USB-C', warranty: 3 }, 80, 299, 45, 2, '#475569', 'Type-C Cable', 8],
      ['charger', { brand: 'Generic', type: 'Cable', watt: '1 metre', connector: 'Lightning', warranty: 3 }, 250, 599, 25, 2, '#e2e8f0', 'Lightning Cable', 5],
      ['charger', { brand: 'Mi', type: 'Power Bank', watt: '20000mAh', connector: 'USB-C', warranty: 6 }, 1100, 1799, 10, 2, '#1f2937', '20000 mAh', 3],

      ['earphones', { brand: 'boAt', model: 'Airdopes 141', type: 'TWS Earbuds', color: 'Black', warranty: 12 }, 800, 1299, 22, 2, '#1f2937', 'Airdopes 141', 6],
      ['earphones', { brand: 'Realme', model: 'Buds T300', type: 'TWS Earbuds', color: 'Blue', warranty: 12 }, 1500, 2299, 9, 2, '#3b82f6', 'Buds T300', 3],
      ['earphones', { brand: 'OnePlus', model: 'Bullets Z2', type: 'Neckband', color: 'Black', warranty: 12 }, 1100, 1699, 14, 2, '#27272a', 'Bullets Z2', 3],
      ['earphones', { brand: 'Samsung', model: 'Galaxy Buds2 Pro', type: 'TWS Earbuds', color: 'Graphite', warranty: 12 }, 7500, 9999, 5, 0, '#3f3f46', 'Buds2 Pro', 1],
      ['earphones', { brand: 'Generic', model: '3.5mm Wired', type: 'Wired', color: 'White', warranty: 1 }, 50, 199, 40, 2, '#f1f5f9', 'Wired', 5]
    ];
  },

  CUSTOMERS: ['Amit Kumar', 'Priya Singh', 'Rahul Verma', 'Sneha Reddy', 'Mohammed Faiz', 'Anjali Gupta', 'Vikram Joshi', 'Pooja Nair', 'Suresh Babu', 'Kavita Iyer',
    'Deepak Yadav', 'Neha Kapoor', 'Arun Menon', 'Divya Bhat', 'Sanjay Patil', 'Ritu Agarwal', 'Karan Malhotra', 'Lakshmi Devi', 'Harish Chandra', 'Farah Sheikh'],
  NOTES: ['Exchange offer applied', 'Free screen guard given', 'Festival offer', 'Referred by a friend', 'Bill sent on WhatsApp', 'EMI on 6 months'],

  load() {
    let seed = 20261121;
    const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
    const ri = (a, b) => a + Math.floor(rnd() * (b - a + 1));
    const pick = a => a[Math.floor(rnd() * a.length)];
    const DAY = 864e5, now = Date.now();
    const users = Store.users();
    const staff = { md: users.find(u => u.role === 'md') || users[0], manager: users.find(u => u.role === 'manager') || users[0], employee: users.find(u => u.role === 'employee') || users[0] };

    /* vendors */
    const vendors = this.VENDORS.map((v, i) => Object.assign({ id: 'vdemo' + i, addedAt: new Date(now - 60 * DAY).toISOString() }, v));

    /* products */
    const counters = {};
    const prods = this.PRODUCTS().map((r, i) => {
      const cat = r[0], prefix = CATEGORIES[cat].prefix;
      counters[prefix] = (counters[prefix] || 0) + 1;
      return { id: 'pdemo' + i, code: prefix + '-' + String(counters[prefix]).padStart(4, '0'), category: cat, name: CATEGORIES[cat].name(r[1]).trim(), attrs: r[1],
        cost: r[2], price: r[3], qty: r[4], min: 5, supplier: vendors[r[5]].name, notes: '', photo: this.art(cat, r[6], r[7]), demo: true,
        addedAt: new Date(now - 40 * DAY).toISOString(), addedBy: staff.manager.name, _vid: vendors[r[5]].id, _pop: r[8] };
    });
    const totalPop = prods.reduce((n, p) => n + p._pop, 0);
    const pickProd = () => { let r = rnd() * totalPop; for (const p of prods) { r -= p._pop; if (r <= 0) return p; } return prods[0]; };

    /* 30 days of sales */
    const raw = [];
    for (let d = 29; d >= 0; d--) {
      const n = d === 0 ? 6 : ri(2, 6) + (d % 7 === 6 ? 2 : 0);
      for (let k = 0; k < n; k++) {
        let t;
        if (d === 0) { t = now - ri(5, 400) * 60000; const s0 = new Date().setHours(0, 0, 0, 0); if (t < s0) t = s0 + (k + 1) * 60000; }
        else { const day = new Date(now - d * DAY); day.setHours(ri(10, 20), ri(0, 59), ri(0, 59), 0); t = day.getTime(); }
        const p = pickProd(), phone = p.category === 'phone';
        const qty = phone ? 1 : (p.price < 400 ? ri(1, 3) : p.price < 2500 ? ri(1, 2) : 1);
        const disc = phone ? pick([0, 0, 0, 500, 1000, Math.min(1500, Math.round(p.price * 0.02 / 100) * 100)]) : (p.price >= 299 ? pick([0, 0, 0, 0, 20, 50]) : 0);
        const pay = p.price > 20000 ? pick(['UPI', 'UPI', 'Card', 'Cash', 'EMI / Finance', 'EMI / Finance']) : pick(['UPI', 'UPI', 'UPI', 'Cash', 'Cash', 'Card']);
        const u = rnd(), by = u < 0.1 ? staff.md : u < 0.4 ? staff.manager : staff.employee;
        const named = phone || rnd() < 0.35;
        raw.push({ t, p, qty, disc, pay, by, named });
      }
    }
    raw.sort((a, b) => a.t - b.t);
    const voidAt = new Set([Math.floor(raw.length * 0.3), Math.floor(raw.length * 0.6)]);
    const sales = raw.map((r, i) => {
      const total = r.p.price * r.qty - r.disc, voided = voidAt.has(i) && now - r.t > 2 * DAY;
      const s = { id: 'sdemo' + i, receipt: 'INV-' + String(i + 1).padStart(5, '0'), date: new Date(r.t).toISOString(), pid: r.p.id, code: r.p.code, name: r.p.name, category: r.p.category,
        qty: r.qty, price: r.p.price, discount: r.disc, total, cost: r.p.cost, profit: total - r.p.cost * r.qty, payment: r.pay,
        customer: r.named ? pick(this.CUSTOMERS) : '', phone: r.named ? '9' + ri(100000000, 999999999) : '',
        imei: r.p.category === 'phone' ? '35' + String(ri(1000000, 9999999)) + String(ri(100000, 999999)).slice(0, 6) : '',
        note: rnd() < 0.15 ? pick(this.NOTES) : '', soldBy: r.by.name, soldById: r.by.id, voided: false, _t: r.t };
      if (voided) { s.voided = true; s.voidReason = 'Customer changed mind'; s.voidedBy = staff.md.name; }
      return s;
    });

    /* work out purchases so that "left in stock" matches what was set above */
    const purchases = [], events = [];
    const vname = id => vendors.find(v => v.id === id).name;
    prods.forEach(p => {
      const mine = sales.filter(s => s.pid === p.id && !s.voided);
      const sold = mine.reduce((n, s) => n + s.qty, 0);
      const cut = now - 12 * DAY;
      const after = mine.filter(s => s._t >= cut).reduce((n, s) => n + s.qty, 0);
      const restock = sold >= 6 ? after : 0;
      const open = p.qty + sold - restock;
      const buy = (qty, t, note) => {
        if (qty < 1) return;
        purchases.push({ id: 'bdemo' + purchases.length, date: new Date(t).toISOString(), vid: p._vid, vendor: vname(p._vid), pid: p.id, code: p.code, name: p.name, qty, cost: p.cost, total: qty * p.cost, by: staff.manager.name, note });
        events.push({ t, type: 'in', p, d: qty, reason: note + ' - ' + vname(p._vid), by: staff.manager.name, ref: '' });
      };
      buy(open, now - 40 * DAY - ri(0, 5) * 3600000, 'Opening stock, Bill ' + ri(1000, 9999));
      buy(restock, cut + ri(1, 8) * 3600000, 'Restock, Bill ' + ri(1000, 9999));
    });
    sales.forEach(s => {
      const p = prods.find(x => x.id === s.pid);
      events.push({ t: s._t, type: 'sale', p, d: -s.qty, reason: 'Sold ' + s.receipt, by: s.soldBy, ref: s.receipt });
      if (s.voided) events.push({ t: s._t + 1800000, type: 'void', p, d: s.qty, reason: 'Cancelled ' + s.receipt + ': ' + s.voidReason, by: s.voidedBy, ref: s.receipt });
    });
    events.sort((a, b) => a.t - b.t);
    const run = {}, logs = events.map((e, i) => {
      const before = run[e.p.id] || 0, after = before + e.d; run[e.p.id] = after;
      return { id: 'ldemo' + i, date: new Date(e.t).toISOString(), pid: e.p.id, code: e.p.code, name: e.p.name, type: e.type, qty: e.d, before, after, reason: e.reason, by: e.by, ref: e.ref };
    }).reverse();

    /* save (newest first, without helper fields) */
    prods.forEach(p => { delete p._vid; delete p._pop; });
    sales.forEach(s => { delete s._t; });
    Store.saveVendors(vendors);
    Store.saveProducts(prods);
    Store.savePurchases(purchases.sort((a, b) => b.date.localeCompare(a.date)));
    Store.saveSales(sales.reverse());
    Store.saveLogs(logs);
    Store.set('counters', counters);
    Store.set('demo2', true);
  }
};
