/* ==========================================================
   ui.js  -  Small helpers: escaping, money, dates, toast, modal
   ========================================================== */
const Views = {};   // each file in js/views/ adds one screen here

const UI = {
  esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, c =>
      ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  },
  short(n) {   // compact money for small chart labels: 1.2L, 64k
    n = Number(n || 0);
    if (n >= 1e7) return '₹' + (n / 1e7).toFixed(1).replace(/\.0$/, '') + 'Cr';
    if (n >= 1e5) return '₹' + (n / 1e5).toFixed(1).replace(/\.0$/, '') + 'L';
    if (n >= 1e3) return '₹' + (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'k';
    return '₹' + Math.round(n);
  },
  inr(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 }); },
  dt(d) {
    return new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  },
  isToday(d) { return new Date(d).toDateString() === new Date().toDateString(); },

  toast(msg, type) {
    let box = document.getElementById('toasts');
    if (!box) { box = document.createElement('div'); box.id = 'toasts'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || 'ok');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), 3500);
  },

  modal(title, html, wide) {
    const root = document.createElement('div');
    root.className = 'overlay';
    root.innerHTML = '<div class="modal' + (wide ? ' wide' : '') + '" role="dialog" aria-modal="true">' +
      '<div class="modal-h"><h3>' + UI.esc(title) + '</h3><button class="icon-btn" data-close aria-label="Close">✕</button></div>' +
      '<div class="modal-b">' + html + '</div></div>';
    document.body.appendChild(root);
    const close = () => root.remove();
    root.addEventListener('mousedown', e => { if (e.target === root) close(); });
    root.querySelector('[data-close]').onclick = close;
    return { root, close, $: s => root.querySelector(s), $$: s => root.querySelectorAll(s) };
  },

  confirm(title, message, okLabel) {
    return new Promise(resolve => {
      const m = UI.modal(title, '<p class="muted">' + UI.esc(message) + '</p>' +
        '<div class="form-actions"><button class="btn" data-no>Cancel</button><button class="btn danger" data-yes>' + UI.esc(okLabel || 'Confirm') + '</button></div>');
      m.$('[data-no]').onclick = () => { m.close(); resolve(false); };
      m.$('[data-yes]').onclick = () => { m.close(); resolve(true); };
    });
  },

  download(filename, text, mime) {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([text], { type: mime || 'text/csv' }));
    a.download = filename; a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  },
  csv(rows) {
    return rows.map(r => r.map(c => '"' + String(c == null ? '' : c).replace(/"/g, '""') + '"').join(',')).join('\n');
  },

  badge(status) {
    const map = { ok: ['In stock', 'ok'], low: ['Restock!', 'warn pulse'], out: ['Out of stock', 'bad pulse'] };
    return '<span class="badge ' + map[status][1] + '">' + map[status][0] + '</span>';
  },

  /* suggestion list of saved vendors for the "bought from" boxes */
  vendorList() {
    return '<datalist id="vlist">' + Store.vendors().map(v => '<option value="' + UI.esc(v.name) + '">').join('') + '</datalist>';
  },

  /* product photo, or a big emoji if there is none */
  thumb(p, cls) {
    return p.photo ? '<img class="' + (cls || 'thumb') + '" src="' + p.photo + '" alt="' + UI.esc(p.name) + '" loading="lazy">'
      : '<span class="' + (cls || 'thumb') + ' ph">' + CATEGORIES[p.category].icon + '</span>';
  },

  /* shrink a chosen photo so many products fit in browser storage */
  readPhoto(file) {
    return new Promise((res, rej) => {
      if (!file || !file.type.startsWith('image/')) return rej(new Error('Please choose an image file.'));
      const r = new FileReader();
      r.onerror = () => rej(new Error('Could not read that image.'));
      r.onload = () => {
        const img = new Image();
        img.onerror = () => rej(new Error('Could not read that image.'));
        img.onload = () => {
          const s = Math.min(1, 520 / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * s); c.height = Math.round(img.height * s);
          const x = c.getContext('2d'); x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height);
          x.drawImage(img, 0, 0, c.width, c.height);
          res(c.toDataURL('image/jpeg', 0.78));
        };
        img.src = r.result;
      };
      r.readAsDataURL(file);
    });
  },

  /* Build one input from a field definition (see categories.js) */
  field(f, value, prefix) {
    const id = (prefix || 'f_') + f.k;
    const v = value == null ? '' : value;
    const req = f.req ? ' required' : '';
    let input;
    if (f.t === 'select') {
      input = '<select name="' + id + '"' + req + '><option value="">Select...</option>' +
        f.o.map(o => '<option' + (o === v ? ' selected' : '') + '>' + UI.esc(o) + '</option>').join('') + '</select>';
    } else {
      input = '<input name="' + id + '" type="' + (f.t === 'number' ? 'number' : 'text') + '"' +
        (f.t === 'number' ? ' min="0" step="any"' : '') + ' value="' + UI.esc(v) + '" placeholder="' + UI.esc(f.ph || '') + '"' + req + '>';
    }
    return '<label class="fld"><span>' + UI.esc(f.l) + (f.req ? ' <b class="req">*</b>' : '') + '</span>' + input + '</label>';
  }
};

/* Simple line icons for the menu */
const ICONS = {
  dashboard: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
  stock: '<svg viewBox="0 0 24 24"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
  sales: '<svg viewBox="0 0 24 24"><path d="M6 2l-2 4v14a2 2 0 002 2h12a2 2 0 002-2V6l-2-4z"/><path d="M4 6h16M16 10a4 4 0 01-8 0"/></svg>',
  vendors: '<svg viewBox="0 0 24 24"><path d="M1 6h13v11H1zM14 10h4l3 3v4h-7"/><circle cx="6" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>',
  log: '<svg viewBox="0 0 24 24"><path d="M12 8v4l3 2"/><circle cx="12" cy="12" r="9"/></svg>',
  reports: '<svg viewBox="0 0 24 24"><path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/></svg>',
  users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0114 0M17 11a3 3 0 100-6M22 21a6 6 0 00-4-5.6"/></svg>',
  logout: '<svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg>'
};
