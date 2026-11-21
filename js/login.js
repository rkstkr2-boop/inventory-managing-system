/* login.js - sign-in page: particles, 3D phone, tilt, magnetic buttons,
   tap or swipe-right to enter, keyboard 1/2/3 */
(async function () {
  await Store.init();
  if (Auth.current()) { location.href = 'app.html'; return; }
  const reduced = FX.reduced;
  const mouse = { x: -999, y: -999 };

  /* ---------- live numbers from the shop ---------- */
  const prods = Store.products();
  document.getElementById('k1').dataset.count = prods.length;
  document.getElementById('k2').dataset.count = prods.reduce((n, p) => n + p.qty, 0);
  document.getElementById('k3').dataset.count = Store.sales().filter(s => !s.voided).length;
  FX.countUp(document.getElementById('kpis'));

  /* ---------- rotating tagline ---------- */
  const lines = ['Track every phone.', 'Never run out of stock.', 'Know your profit daily.', 'Every sale updates stock instantly.'];
  const rot = document.getElementById('rot');
  let li = 0;
  if (!reduced) setInterval(() => {
    rot.classList.add('out');
    setTimeout(() => { li = (li + 1) % lines.length; rot.textContent = lines[li]; rot.classList.remove('out'); }, 350);
  }, 2800);

  /* ---------- floating particles that react to the pointer ---------- */
  const cv = document.getElementById('bg'), g = cv.getContext('2d');
  let W = 0, H = 0, pts = [];
  const resize = () => {
    W = cv.width = innerWidth; H = cv.height = innerHeight;
    const n = Math.min(70, Math.floor(W / 18));
    pts = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .5, vy: (Math.random() - .5) * .5, r: Math.random() * 2 + 1 }));
  };
  resize(); addEventListener('resize', resize);
  const draw = () => {
    g.clearRect(0, 0, W, H);
    for (const p of pts) {
      const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
      if (d < 130) { p.x += dx / d * 2.2; p.y += dy / d * 2.2; }
      p.x += p.vx; p.y += p.vy;
      if (p.x < 0 || p.x > W) p.vx *= -1;
      if (p.y < 0 || p.y > H) p.vy *= -1;
      g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill();
    }
    for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
      const d = Math.hypot(pts[i].x - pts[j].x, pts[i].y - pts[j].y);
      if (d < 115) { g.strokeStyle = 'rgba(255,255,255,' + (0.22 * (1 - d / 115)) + ')'; g.beginPath(); g.moveTo(pts[i].x, pts[i].y); g.lineTo(pts[j].x, pts[j].y); g.stroke(); }
    }
    requestAnimationFrame(draw);
  };
  if (!reduced) draw();

  /* ---------- pointer: tilt the card, move the blobs ---------- */
  const wrap = document.getElementById('wrap'), blobs = document.querySelectorAll('.blob');
  addEventListener('pointermove', e => {
    mouse.x = e.clientX; mouse.y = e.clientY;
    if (reduced || e.pointerType === 'touch') return;
    const x = e.clientX / innerWidth - .5, y = e.clientY / innerHeight - .5;
    wrap.style.transform = 'perspective(1400px) rotateY(' + (x * 5) + 'deg) rotateX(' + (-y * 5) + 'deg)';
    blobs.forEach(b => { const d = Number(b.dataset.depth) || 20; b.style.translate = (x * d) + 'px ' + (y * d) + 'px'; });
  });
  addEventListener('pointerleave', () => { mouse.x = mouse.y = -999; wrap.style.transform = ''; });

  /* ---------- 3D phone: spins by itself, drag to spin it yourself ---------- */
  const phone = document.getElementById('phone'), stage = document.getElementById('stage');
  let ry = -25, rx = -8, vel = 0.5, dragging = false, lastX = 0, lastY = 0;
  stage.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; lastY = e.clientY; try { stage.setPointerCapture(e.pointerId); } catch (x) {} });
  stage.addEventListener('pointermove', e => {
    if (!dragging) return;
    vel = (e.clientX - lastX) * .6; ry += vel; rx = Math.max(-35, Math.min(25, rx - (e.clientY - lastY) * .3));
    lastX = e.clientX; lastY = e.clientY;
  });
  const release = () => { dragging = false; };
  stage.addEventListener('pointerup', release); stage.addEventListener('pointercancel', release);
  const spin = () => {
    if (!dragging) { ry += vel; vel += (0.5 - vel) * .03; rx += (-8 - rx) * .03; }   // glide back to a gentle auto-spin
    phone.style.setProperty('--ry', ry + 'deg'); phone.style.setProperty('--rx', rx + 'deg');
    requestAnimationFrame(spin);
  };
  if (reduced) { phone.style.setProperty('--ry', '-25deg'); } else spin();

  /* ---------- entering ---------- */
  const err = document.getElementById('err');
  let entering = false;
  const enter = btn => {
    if (entering) return;
    const role = btn.dataset.role;
    const res = Auth.autoLogin(role);
    if (!res.ok) { err.textContent = res.msg; err.hidden = false; return; }
    entering = true;
    btn.classList.add('go');
    FX.confetti();
    const w = document.createElement('div');
    w.className = 'welcome';
    w.innerHTML = '<div><div class="w-ic">' + btn.dataset.icon + '</div><h2>Welcome, ' + ROLES[role].label + '</h2><p>Opening your shop...</p><div class="bar"><i></i></div></div>';
    document.body.appendChild(w);
    document.body.classList.add('leaving');
    setTimeout(() => { location.href = 'app.html'; }, 1150);
  };

  const btns = [...document.querySelectorAll('.auto-btn')];
  btns.forEach(b => {
    let sx = 0, down = false, moved = false;
    const reset = () => { b.classList.remove('dragging'); b.style.setProperty('--dx', '0px'); b.style.setProperty('--fill', '0%'); };
    b.addEventListener('pointerdown', e => {
      if (e.button) return;
      down = true; moved = false; sx = e.clientX; b.classList.add('dragging');
      try { b.setPointerCapture(e.pointerId); } catch (x) {}
    });
    b.addEventListener('pointermove', e => {
      if (down) {
        const dx = Math.max(0, Math.min(170, e.clientX - sx));
        if (dx > 8) moved = true;
        b.style.setProperty('--dx', dx + 'px'); b.style.setProperty('--fill', Math.min(100, dx / 120 * 100) + '%');
      } else if (!reduced && e.pointerType !== 'touch') {         // magnetic pull towards the cursor
        const r = b.getBoundingClientRect();
        b.style.setProperty('--mx', ((e.clientX - r.left) / r.width - .5) * 8 + 'px');
        b.style.setProperty('--my', ((e.clientY - r.top) / r.height - .5) * 6 + 'px');
      }
    });
    b.addEventListener('pointerleave', () => { b.style.setProperty('--mx', '0px'); b.style.setProperty('--my', '0px'); });
    b.addEventListener('pointerup', () => {
      if (!down) return;
      down = false;
      const dx = parseFloat(b.style.getPropertyValue('--dx')) || 0;
      reset();
      if (dx >= 110 || !moved) enter(b);            // swiped far enough, or a plain tap
    });
    b.addEventListener('pointercancel', () => { down = false; reset(); });
    b.addEventListener('click', e => { if (e.detail === 0) enter(b); });   // keyboard Enter / Space
  });

  addEventListener('keydown', e => {
    const i = ['1', '2', '3'].indexOf(e.key);
    if (i >= 0 && btns[i]) enter(btns[i]);
  });
})();
