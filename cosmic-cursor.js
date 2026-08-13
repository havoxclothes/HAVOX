(() => {
  'use strict';

  const finePointer = window.matchMedia('(pointer: fine)');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (!finePointer.matches || reducedMotion.matches) return;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.className = 'cosmic-cursor';
  document.body.appendChild(canvas);

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const mouse = { x: innerWidth / 2, y: innerHeight / 2, lastX: innerWidth / 2, lastY: innerHeight / 2, speed: 0, hovering: false, active: false };
  const head = { x: mouse.x, y: mouse.y };
  const particles = [];
  const stars = [];
  let width = innerWidth;
  let height = innerHeight;
  let dpr = Math.min(devicePixelRatio || 1, 2);
  let lastFrame = 0;
  let burstQueue = 0;

  const resize = () => {
    width = innerWidth;
    height = innerHeight;
    dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  resize();
  addEventListener('resize', resize, { passive: true });

  for (let i = 0; i < 24; i++) {
    stars.push({ angle: Math.random() * Math.PI * 2, radius: 8 + Math.random() * 38, size: 0.5 + Math.random() * 1.2, phase: Math.random() * Math.PI * 2 });
  }

  const updateHover = target => {
    mouse.hovering = !!target?.closest?.('a, button, .product, .pill, input, textarea, select, .bag-btn');
  };

  addEventListener('pointermove', event => {
    const dx = event.clientX - mouse.lastX;
    const dy = event.clientY - mouse.lastY;
    mouse.speed = Math.min(1, Math.hypot(dx, dy) / 32);
    mouse.lastX = event.clientX;
    mouse.lastY = event.clientY;
    mouse.x = event.clientX;
    mouse.y = event.clientY;
    mouse.active = true;
    updateHover(event.target);
  }, { passive: true });

  addEventListener('pointerdown', () => {
    if (!mouse.active) return;
    burstQueue = 18;
  }, { passive: true });

  const addParticle = (x, y, angle, speed, size, life) => {
    particles.push({ x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, size, life, maxLife: life });
    if (particles.length > 80) particles.splice(0, particles.length - 80);
  };

  const draw = time => {
    if (time - lastFrame < 12) {
      requestAnimationFrame(draw);
      return;
    }
    lastFrame = time;

    ctx.clearRect(0, 0, width, height);
    head.x += (mouse.x - head.x) * 0.42;
    head.y += (mouse.y - head.y) * 0.42;
    mouse.speed *= 0.88;

    const angle = Math.atan2(mouse.lastY - head.y, mouse.lastX - head.x);
    const tailAngle = angle + Math.PI;
    const intensity = mouse.hovering ? 1.35 : 1;

    if (mouse.active && mouse.speed > 0.025) {
      const count = mouse.speed > 0.55 ? 3 : 1;
      for (let i = 0; i < count; i++) {
        const spread = (Math.random() - 0.5) * 0.7;
        addParticle(
          head.x - Math.cos(angle) * (3 + Math.random() * 8),
          head.y - Math.sin(angle) * (3 + Math.random() * 8),
          tailAngle + spread,
          0.35 + mouse.speed * 1.6,
          0.7 + Math.random() * (1.5 * intensity),
          0.5 + Math.random() * 0.45
        );
      }
    }

    while (burstQueue > 0) {
      const a = Math.random() * Math.PI * 2;
      addParticle(head.x, head.y, a, 1.4 + Math.random() * 3.2, 0.8 + Math.random() * 1.8, 0.45 + Math.random() * 0.4);
      burstQueue--;
    }

    // Soft galaxy halo.
    const haloRadius = mouse.hovering ? 48 : 34;
    const halo = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, haloRadius);
    halo.addColorStop(0, mouse.hovering ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.16)');
    halo.addColorStop(0.3, 'rgba(175,205,255,.10)');
    halo.addColorStop(1, 'rgba(120,160,255,0)');
    ctx.fillStyle = halo;
    ctx.beginPath();
    ctx.arc(head.x, head.y, haloRadius, 0, Math.PI * 2);
    ctx.fill();

    // Tiny stars orbiting the comet head.
    stars.forEach(star => {
      star.angle += 0.0015 + mouse.speed * 0.002;
      const x = head.x + Math.cos(star.angle) * star.radius;
      const y = head.y + Math.sin(star.angle) * star.radius * 0.58;
      const alpha = (0.18 + (Math.sin(time * 0.002 + star.phase) + 1) * 0.16) * intensity;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(x, y, star.size * intensity, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;

    // Particle tail.
    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];
      particle.x += particle.vx;
      particle.y += particle.vy;
      particle.vx *= 0.94;
      particle.vy *= 0.94;
      particle.life -= 0.026;
      if (particle.life <= 0) {
        particles.splice(i, 1);
        continue;
      }
      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha * 0.85;
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Comet streak behind the head.
    if (mouse.speed > 0.05) {
      const length = 10 + mouse.speed * 24;
      const gradient = ctx.createLinearGradient(head.x, head.y, head.x - Math.cos(angle) * length, head.y - Math.sin(angle) * length);
      gradient.addColorStop(0, mouse.hovering ? 'rgba(255,255,255,.9)' : 'rgba(255,255,255,.65)');
      gradient.addColorStop(1, 'rgba(150,190,255,0)');
      ctx.strokeStyle = gradient;
      ctx.lineWidth = mouse.hovering ? 2.2 : 1.4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(head.x - Math.cos(angle) * 2, head.y - Math.sin(angle) * 2);
      ctx.lineTo(head.x - Math.cos(angle) * length, head.y - Math.sin(angle) * length);
      ctx.stroke();
    }

    // Sharp comet head.
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#fff';
    ctx.shadowBlur = mouse.hovering ? 20 : 12;
    ctx.shadowColor = 'rgba(175,210,255,.95)';
    ctx.beginPath();
    ctx.moveTo(mouse.hovering ? 11 : 9, 0);
    ctx.lineTo(-4, mouse.hovering ? -4.2 : -3.2);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-4, mouse.hovering ? 4.2 : 3.2);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;

    requestAnimationFrame(draw);
  };

  requestAnimationFrame(draw);
})();
