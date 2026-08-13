(() => {
  if (window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'cosmic-cursor';
  canvas.setAttribute('aria-hidden', 'true');
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  let w = 0, h = 0, dpr = 1;
  const pointer = { x: innerWidth / 2, y: innerHeight / 2, tx: innerWidth / 2, ty: innerHeight / 2, vx: 0, vy: 0, speed: 0 };
  const particles = [];
  const stars = [];
  const MAX = 90;

  function resize() {
    dpr = Math.min(devicePixelRatio || 1, 2);
    w = innerWidth; h = innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize, { passive: true });

  for (let i = 0; i < 32; i++) stars.push({
    a: Math.random() * Math.PI * 2,
    r: 10 + Math.random() * 42,
    s: 0.15 + Math.random() * 0.55,
    size: 0.5 + Math.random() * 1.2,
    phase: Math.random() * Math.PI * 2
  });

  addEventListener('pointermove', e => {
    const dx = e.clientX - pointer.tx, dy = e.clientY - pointer.ty;
    pointer.vx = dx; pointer.vy = dy;
    pointer.speed = Math.min(1, Math.hypot(dx, dy) / 45);
    pointer.tx = e.clientX; pointer.ty = e.clientY;
  }, { passive: true });

  addEventListener('pointerdown', () => {
    for (let i = 0; i < 18; i++) {
      const a = Math.random() * Math.PI * 2, s = 1.2 + Math.random() * 3.5;
      particles.push({ x: pointer.x, y: pointer.y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1, size: 0.8 + Math.random() * 2 });
    }
  }, { passive: true });

  const cursor = { x: pointer.x, y: pointer.y };
  function spawnTail() {
    const speed = pointer.speed;
    if (speed < 0.03) return;
    const angle = Math.atan2(pointer.y - pointer.ty, pointer.x - pointer.tx) + Math.PI;
    for (let i = 0; i < (speed > 0.55 ? 2 : 1); i++) {
      const spread = (Math.random() - 0.5) * 1.1;
      const a = angle + spread;
      const distance = 4 + Math.random() * 8;
      particles.push({
        x: cursor.x + Math.cos(a) * distance,
        y: cursor.y + Math.sin(a) * distance,
        vx: Math.cos(a) * (0.3 + speed * 1.8) + (Math.random() - 0.5) * 0.7,
        vy: Math.sin(a) * (0.3 + speed * 1.8) + (Math.random() - 0.5) * 0.7,
        life: 1,
        decay: 0.018 + Math.random() * 0.024,
        size: 0.6 + Math.random() * (1.5 + speed * 1.8)
      });
    }
    if (particles.length > MAX) particles.splice(0, particles.length - MAX);
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    cursor.x += (pointer.tx - cursor.x) * 0.34;
    cursor.y += (pointer.ty - cursor.y) * 0.34;
    pointer.speed *= 0.92;
    spawnTail();

    const glow = ctx.createRadialGradient(cursor.x, cursor.y, 0, cursor.x, cursor.y, 30 + pointer.speed * 20);
    glow.addColorStop(0, 'rgba(255,255,255,.18)');
    glow.addColorStop(.25, 'rgba(180,210,255,.09)');
    glow.addColorStop(1, 'rgba(120,160,255,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(cursor.x, cursor.y, 34 + pointer.speed * 20, 0, Math.PI * 2); ctx.fill();

    stars.forEach(star => {
      star.a += star.s * 0.0025;
      const pulse = 0.35 + (Math.sin(t * 0.002 + star.phase) + 1) * 0.25;
      const x = cursor.x + Math.cos(star.a) * star.r;
      const y = cursor.y + Math.sin(star.a) * star.r * 0.62;
      ctx.globalAlpha = pulse * (0.35 + pointer.speed * 0.8);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x, y, star.size, 0, Math.PI * 2); ctx.fill();
    });
    ctx.globalAlpha = 1;

    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.vx *= 0.96; p.vy *= 0.96; p.life -= p.decay || 0.025;
      if (p.life <= 0) return;
      const a = Math.max(0, p.life);
      ctx.globalAlpha = a * 0.8;
      ctx.fillStyle = '#fff';
      ctx.shadowBlur = 8; ctx.shadowColor = 'rgba(160,200,255,.8)';
      ctx.beginPath(); ctx.arc(p.x, p.y, p.size * a, 0, Math.PI * 2); ctx.fill();
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;

    const angle = Math.atan2(pointer.ty - cursor.y, pointer.tx - cursor.x);
    ctx.save(); ctx.translate(cursor.x, cursor.y); ctx.rotate(angle);
    ctx.fillStyle = '#fff'; ctx.shadowBlur = 14; ctx.shadowColor = 'rgba(180,210,255,.95)';
    ctx.beginPath(); ctx.moveTo(9, 0); ctx.lineTo(-4, -3.5); ctx.lineTo(-1, 0); ctx.lineTo(-4, 3.5); ctx.closePath(); ctx.fill();
    ctx.restore(); ctx.shadowBlur = 0;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
