/* login.js - behaviour of the sign-in page only */
(async function () {
  await Store.init();
  if (Auth.current()) { location.href = 'app.html'; return; }

  let role = 'md';
  const roles = document.getElementById('roles');
  roles.addEventListener('click', e => {
    const b = e.target.closest('.role');
    if (!b) return;
    role = b.dataset.role;
    roles.querySelectorAll('.role').forEach(x => x.classList.toggle('active', x === b));
    document.getElementById('username').focus();
  });

  const pw = document.getElementById('password');
  document.getElementById('showpw').onclick = function () {
    const show = pw.type === 'password';
    pw.type = show ? 'text' : 'password';
    this.textContent = show ? 'Hide' : 'Show';
  };

  const err = document.getElementById('err');
  document.getElementById('loginForm').addEventListener('submit', async e => {
    e.preventDefault();
    err.hidden = true;
    const res = await Auth.login(document.getElementById('username').value, pw.value, role);
    if (res.ok) { location.href = 'app.html'; }
    else { err.textContent = res.msg; err.hidden = false; pw.value = ''; pw.focus(); }
  });
})();
