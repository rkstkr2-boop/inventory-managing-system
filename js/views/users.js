/* views/users.js - Managing Director only: staff logins and data backup */
Views.users = function (el) {
  const users = Store.users();
  el.innerHTML = '<div class="card"><div class="card-h"><h3>Staff logins</h3><button class="btn primary" id="add">+ Add user</button></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Username</th><th>Role</th><th>Status</th><th></th></tr></thead><tbody>' +
    users.map(u => '<tr><td><b>' + UI.esc(u.name) + '</b></td><td>' + UI.esc(u.username) + '</td><td>' + ROLES[u.role].label + '</td>' +
      '<td><span class="badge ' + (u.active ? 'ok' : 'gray') + '">' + (u.active ? 'Active' : 'Disabled') + '</span></td>' +
      '<td><div class="actions"><button class="btn sm" data-a="pw" data-id="' + u.id + '">Change password</button>' +
      (u.id !== App.user.id ? '<button class="btn sm" data-a="tog" data-id="' + u.id + '">' + (u.active ? 'Disable' : 'Enable') + '</button>' : '') + '</div></td></tr>').join('') +
    '</tbody></table></div></div>' +
    '<div class="card"><div class="card-h"><h3>Data &amp; backup</h3></div>' +
    '<p class="muted">Data is stored in this browser. Download a backup regularly and keep it safe.</p><div class="actions" style="justify-content:flex-start">' +
    '<button class="btn" id="bk">Download backup</button><label class="btn" style="margin:0">Restore backup<input id="rs" type="file" accept=".json" hidden></label>' +
    '<button class="btn" id="demo">Load full demo data</button>' +
    '<button class="btn danger" id="clr">Clear demo / all data</button></div></div>';

  el.querySelector('#add').onclick = () => {
    const m = UI.modal('Add user', '<form id="uf"><div class="form-grid">' +
      '<label class="fld"><span>Full name <b class="req">*</b></span><input id="n" required></label>' +
      '<label class="fld"><span>Role <b class="req">*</b></span><select id="r"><option value="employee">Employee</option><option value="manager">Inventory Manager</option><option value="md">Managing Director</option></select></label>' +
      '<label class="fld"><span>Username <b class="req">*</b></span><input id="u" required autocomplete="off"></label>' +
      '<label class="fld"><span>Password (min 6) <b class="req">*</b></span><input id="p" type="text" minlength="6" required autocomplete="off"></label></div>' +
      '<div id="e" class="form-error" hidden></div><div class="form-actions"><button type="button" class="btn" data-x>Cancel</button><button class="btn primary">Create user</button></div></form>');
    m.$('[data-x]').onclick = m.close;
    m.$('#uf').addEventListener('submit', async ev => {
      ev.preventDefault();
      const un = m.$('#u').value.trim();
      if (Store.users().some(x => x.username.toLowerCase() === un.toLowerCase())) { const b = m.$('#e'); b.textContent = 'That username is already taken.'; b.hidden = false; return; }
      const all = Store.users();
      all.push({ id: Store.uid('u'), name: m.$('#n').value.trim(), username: un, role: m.$('#r').value, pass: await Store.hash(m.$('#p').value), active: true });
      Store.saveUsers(all); m.close(); UI.toast('User created'); App.render();
    });
  };

  el.querySelector('table').addEventListener('click', e => {
    const b = e.target.closest('button[data-a]');
    if (!b) return;
    const all = Store.users(), u = all.find(x => x.id === b.dataset.id);
    if (b.dataset.a === 'tog') { u.active = !u.active; Store.saveUsers(all); App.render(); return; }
    const m = UI.modal('Change password for ' + u.name, '<label class="fld"><span>New password (min 6)</span><input id="np" type="text" autocomplete="off"></label><div class="form-actions"><button class="btn" data-x>Cancel</button><button class="btn primary" data-ok>Save</button></div>');
    m.$('[data-x]').onclick = m.close;
    m.$('[data-ok]').onclick = async () => {
      const v = m.$('#np').value;
      if (v.length < 6) { UI.toast('Use at least 6 characters.', 'err'); return; }
      u.pass = await Store.hash(v); Store.saveUsers(all); m.close(); UI.toast('Password changed');
    };
  });

  el.querySelector('#bk').onclick = () => {
    const data = {};
    ['users', 'products', 'sales', 'logs', 'counters', 'vendors', 'purchases'].forEach(k => data[k] = Store.get(k, null));
    UI.download('shop-backup-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(data), 'application/json');
  };
  el.querySelector('#rs').onchange = e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = async () => {
      try {
        const d = JSON.parse(r.result);
        if (!Array.isArray(d.users) || !Array.isArray(d.products) || !Array.isArray(d.sales)) throw new Error();
        if (!(await UI.confirm('Restore backup?', 'This replaces ALL current data with the backup file.', 'Restore'))) return;
        Object.keys(d).forEach(k => { if (d[k] !== null) Store.set(k, d[k]); });
        Store.set('seeded', true);
        Auth.logout();
      } catch (err) { UI.toast('That is not a valid backup file.', 'err'); }
    };
    r.readAsText(f);
  };
  el.querySelector('#demo').onclick = async () => {
    if (await UI.confirm('Load sample data?', 'Replaces all products, vendors, sales and the stock log with about 40 sample products, 6 vendors and 30 days of sales. Staff logins are kept. Download a backup first if you have real data.', 'Load sample data')) {
      Demo.load(); UI.toast('Sample data loaded'); location.hash = '#dashboard'; App.render();
    }
  };
  el.querySelector('#clr').onclick = async () => {
    if (await UI.confirm('Delete products, sales and stock log?', 'Staff logins are kept. This cannot be undone. Download a backup first.', 'Delete everything')) {
      Store.saveProducts([]); Store.saveSales([]); Store.saveLogs([]); Store.savePurchases([]); Store.set('counters', {});
      UI.toast('All stock data cleared'); App.render();
    }
  };
};
