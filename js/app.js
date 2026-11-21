/* app.js - page shell: menu, routing, refresh */
const App = {
  user: null,
  pages: [
    { id: 'dashboard', label: 'Dashboard',  icon: 'dashboard', perm: null },
    { id: 'inventory', label: 'Stock',      icon: 'stock',     perm: 'stock.view' },
    { id: 'vendors',   label: 'Vendors',    icon: 'vendors',   perm: 'vendors.manage' },
    { id: 'sales',     label: 'Sales',      icon: 'sales',     perm: 'sell' },
    { id: 'stocklog',  label: 'Stock Log',  icon: 'log',       perm: 'logs.view' },
    { id: 'reports',   label: 'Reports',    icon: 'reports',   perm: 'reports.view' },
    { id: 'users',     label: 'Users',      icon: 'users',     perm: 'users.manage' }
  ],

  current() {
    const id = location.hash.replace('#', '');
    const page = this.pages.find(p => p.id === id && (!p.perm || Auth.can(p.perm)));
    return page || this.pages[0];
  },

  render() {
    const page = this.current();
    document.getElementById('title').textContent = page.label;
    document.getElementById('nav').innerHTML = this.pages
      .filter(p => !p.perm || Auth.can(p.perm))
      .map(p => '<a href="#' + p.id + '" class="' + (p.id === page.id ? 'active' : '') + '">' + ICONS[p.icon] + '<span>' + p.label + '</span></a>').join('');
    const el = document.getElementById('view');
    el.innerHTML = '';
    el.classList.remove('page-in'); void el.offsetWidth; el.classList.add('page-in');
    Views[page.id](el);
    FX.after(el);
  },

  /* swipe gesture: move to the next / previous screen */
  go(dir) {
    const vis = this.pages.filter(p => !p.perm || Auth.can(p.perm));
    const n = vis[vis.findIndex(p => p.id === this.current().id) + dir];
    if (n) location.hash = n.id;
  }
};

(async function () {
  await Store.init();
  App.user = Auth.current();
  if (!App.user) { location.href = 'index.html'; return; }

  document.getElementById('uname').textContent = App.user.name;
  document.getElementById('urole').textContent = ROLES[App.user.role].label;
  document.getElementById('uav').textContent = App.user.name.charAt(0).toUpperCase();
  const lo = document.getElementById('logout');
  lo.innerHTML = ICONS.logout + '<span>Sign out</span>';
  lo.onclick = () => Auth.logout();

  window.addEventListener('hashchange', () => App.render());
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') { const o = document.querySelectorAll('.overlay'); if (o.length) o[o.length - 1].remove(); }
  });
  FX.ripple();
  FX.swipe(d => App.go(d));
  if (Auth.can('sell')) {
    const fab = document.createElement('button');
    fab.className = 'fab'; fab.textContent = '⚡ Sell';
    fab.onclick = () => SalesView.openSale(null, () => App.render());
    document.body.appendChild(fab);
  }
  App.render();
  if ('ontouchstart' in window && !Store.get('swipehint', false)) {
    Store.set('swipehint', true);
    setTimeout(() => UI.toast('Tip: swipe left or right to switch screens'), 1500);
  }
})();
