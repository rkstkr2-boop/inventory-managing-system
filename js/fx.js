/* ==========================================================
   fx.js  -  Animation & gestures
   count-up numbers, staggered entrances, growing bars, button
   ripple, 3D card tilt, confetti on sales, swipe between screens
   ========================================================== */
const FX = {
  reduced: window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches,

  /* run after every screen is drawn */
  after(root) {
    this.stagger(root); this.countUp(root); this.grow(root); this.tilt(root);
  },

  stagger(root) {
    if (this.reduced) return;
    root.querySelectorAll('.stat, .card, .pcard, .hero, .alert-card, .rise').forEach((el, i) => {
      el.style.animationDelay = Math.min(i * 55, 700) + 'ms';
      el.classList.add('rise-in');
    });
  },

  countUp(root) {
    root.querySelectorAll('[data-count]').forEach(el => {
      const end = Number(el.dataset.count) || 0, inr = el.dataset.fmt === 'inr';
      const show = v => { el.textContent = inr ? UI.inr(Math.round(v)) : Math.round(v).toLocaleString('en-IN'); };
      if (this.reduced || end === 0) return show(end);
      const t0 = performance.now(), dur = 1000;
      const step = t => {
        const p = Math.min(1, (t - t0) / dur);
        show(end * (1 - Math.pow(1 - p, 4)));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  },

  /* bars / meters grow from zero to their value */
  grow(root) {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      root.querySelectorAll('[data-h]').forEach(e => { e.style.height = e.dataset.h; });
      root.querySelectorAll('[data-w]').forEach(e => { e.style.width = e.dataset.w; });
    }));
  },

  /* cards lean towards the mouse */
  tilt(root) {
    if (this.reduced || !window.matchMedia('(hover: hover)').matches) return;
    root.querySelectorAll('.pcard').forEach(c => {
      c.addEventListener('mousemove', e => {
        const r = c.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        c.style.transform = 'perspective(700px) rotateY(' + (x * 9) + 'deg) rotateX(' + (-y * 9) + 'deg) translateY(-4px)';
      });
      c.addEventListener('mouseleave', () => { c.style.transform = ''; });
    });
  },

  ripple() {
    document.addEventListener('click', e => {
      const b = e.target.closest('.btn, .fab, .role, .auto-btn');
      if (!b || this.reduced) return;
      const r = b.getBoundingClientRect(), d = Math.max(r.width, r.height);
      const s = document.createElement('span');
      s.className = 'rip';
      s.style.cssText = 'width:' + d + 'px;height:' + d + 'px;left:' + (e.clientX - r.left - d / 2) + 'px;top:' + (e.clientY - r.top - d / 2) + 'px';
      b.appendChild(s);
      setTimeout(() => s.remove(), 650);
    });
  },

  confetti() {
    if (this.reduced) return;
    const c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:300';
    c.width = innerWidth; c.height = innerHeight;
    document.body.appendChild(c);
    const g = c.getContext('2d'), colors = ['#4f46e5', '#22c55e', '#f59e0b', '#ec4899', '#06b6d4', '#ef4444'];
    const ps = Array.from({ length: 120 }, () => ({
      x: c.width / 2, y: c.height * .55, vx: (Math.random() - .5) * 16, vy: -Math.random() * 15 - 5,
      s: Math.random() * 7 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .4, col: colors[Math.floor(Math.random() * colors.length)]
    }));
    const t0 = performance.now();
    const frame = t => {
      g.clearRect(0, 0, c.width, c.height);
      ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .45; p.vx *= .99; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore(); });
      if (t - t0 < 1800) requestAnimationFrame(frame); else c.remove();
    };
    requestAnimationFrame(frame);
  },

  /* swipe left/right on a touch screen to change page */
  swipe(go) {
    let sx = 0, sy = 0, ok = false;
    document.addEventListener('touchstart', e => {
      const t = e.touches[0]; sx = t.clientX; sy = t.clientY;
      ok = !e.target.closest('.table-wrap, input, select, textarea, .overlay, .no-swipe');
    }, { passive: true });
    document.addEventListener('touchend', e => {
      if (!ok) return;
      const t = e.changedTouches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 80 && Math.abs(dy) < 60) go(dx < 0 ? 1 : -1);
    }, { passive: true });
  }
};
