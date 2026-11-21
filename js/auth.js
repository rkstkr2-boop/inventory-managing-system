/* ==========================================================
   auth.js  -  Login, session and role permissions
   ========================================================== */
const ROLES = {
  md:       { label: 'Managing Director' },
  manager:  { label: 'Inventory Manager' },
  employee: { label: 'Employee' }
};

/* What each role is allowed to do */
const PERMISSIONS = {
  md:       ['stock.view', 'stock.add', 'stock.edit', 'stock.adjust', 'stock.delete', 'cost.view', 'sell', 'sales.all', 'sales.void', 'logs.view', 'reports.view', 'users.manage', 'vendors.manage'],
  manager:  ['stock.view', 'stock.add', 'stock.edit', 'stock.adjust', 'cost.view', 'sell', 'sales.all', 'logs.view', 'reports.view', 'vendors.manage'],
  employee: ['stock.view', 'sell']
};

const Auth = {
  async login(username, password, role) {
    const user = Store.users().find(u => u.username.toLowerCase() === username.trim().toLowerCase());
    if (!user || !user.active) return { ok: false, msg: 'Invalid username or password.' };
    if ((await Store.hash(password)) !== user.pass) return { ok: false, msg: 'Invalid username or password.' };
    if (user.role !== role) return { ok: false, msg: 'This account is not a ' + ROLES[role].label + ' account.' };
    sessionStorage.setItem('ims_session', JSON.stringify({ id: user.id }));
    return { ok: true };
  },
  /* one-tap sign in: enters as the first active user of the chosen role */
  autoLogin(role) {
    const user = Store.users().find(u => u.role === role && u.active);
    if (!user) return { ok: false, msg: 'No active ' + ROLES[role].label + ' account. Ask the Managing Director to enable one.' };
    sessionStorage.setItem('ims_session', JSON.stringify({ id: user.id }));
    return { ok: true };
  },
  current() {
    try {
      const s = JSON.parse(sessionStorage.getItem('ims_session'));
      if (!s) return null;
      const u = Store.users().find(x => x.id === s.id && x.active);
      return u || null;
    } catch (e) { return null; }
  },
  can(perm) {
    const u = this.current();
    return !!u && PERMISSIONS[u.role].includes(perm);
  },
  logout() {
    sessionStorage.removeItem('ims_session');
    location.href = 'index.html';
  }
};
