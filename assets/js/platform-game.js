/* A continuous, document-space playground. Pure physics is exported for tests. */
(function () {
  'use strict';
  const PLAYER_W = 26, PLAYER_H = 32, GRAVITY = 1400, JUMP_SPEED = 880;
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  function createWorld(width, layout) {
    const ledgeWidth = Math.min(112, width * .28);
    let seed = layout.seed || 72831;
    const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
    const nodes = [layout.spawn, ...(layout.waypoints || []), ...layout.stops, { id: 'finish', x: width * .42, y: layout.endY }].sort((a,b) => a.y - b.y);
    const platforms = [];
    nodes.forEach((node, index) => {
      if (index) {
        const previous = platforms[platforms.length - 1];
        const count = Math.max(1, Math.ceil((node.y - previous.y) / 115), Math.ceil(Math.abs(node.x - previous.x) / 135));
        const startY = previous.y;
        for (let j = 1; j < count; j++) {
          const last = platforms[platforms.length - 1];
          const remaining = count - j;
          const targetX = clamp(node.x, 18, width - ledgeWidth - 18);
          const lo = Math.max(18, last.x - 175, targetX - remaining * 175);
          const hi = Math.min(width - ledgeWidth - 18, last.x + 175, targetX + remaining * 175);
          const x = lo + random() * Math.max(0, hi - lo);
          const y = startY + (node.y - startY) * (j + (random() - .5) * .45) / count;
          platforms.push({ id: `path-${node.id}-${j}`, x, y, w: ledgeWidth * (.8 + random() * .2) });
        }
      }
      platforms.push({ id: node.id, x: clamp(node.x, 18, width - ledgeWidth - 18), y: node.y, w: ledgeWidth });
    });
    const sparks = layout.stops.map(stop => { const p = platforms.find(p => p.id === stop.id); return { id: stop.id, label: stop.label, x: p.x + p.w / 2, y: p.y - 40, collected: false }; });
    const first = platforms[0];
    return { width, platforms, sparks, player: { x: first.x + 20, y: first.y - PLAYER_H, vx: 0, vy: 0, grounded: true }, checkpoint: first.id, jumpHeld: false, falls: 0 };
  }
  function respawn(world) {
    const landing = world.platforms.find(p => p.id === world.checkpoint) || world.platforms[0];
    Object.assign(world.player, { x: landing.x + landing.w / 2 - PLAYER_W / 2, y: landing.y - PLAYER_H, vx: 0, vy: 0, grounded: true });
    world.checkpoint = landing.id;
  }
  function step(world, input, dt) {
    dt = clamp(dt, 0, .033);
    const p = world.player, oldBottom = p.y + PLAYER_H;
    if (input.down && p.grounded) { world.dropPlatform = world.checkpoint; p.y += 3; p.vy = 60; p.grounded = false; }
    p.vx = (Number(Boolean(input.right)) - Number(Boolean(input.left))) * 240;
    if (input.jump && !world.jumpHeld && p.grounded) { p.vy = -JUMP_SPEED; p.grounded = false; }
    world.jumpHeld = Boolean(input.jump);
    p.vy = Math.min(660, p.vy + GRAVITY * dt);
    p.x = clamp(p.x + p.vx * dt, 0, world.width - PLAYER_W);
    p.y += p.vy * dt; p.grounded = false;
    for (const platform of world.platforms) {
      if (platform.id !== world.dropPlatform && p.vy >= 0 && oldBottom <= platform.y + 1 && p.y + PLAYER_H >= platform.y && p.x + PLAYER_W > platform.x && p.x < platform.x + platform.w) {
        p.y = platform.y - PLAYER_H; p.vy = 0; p.grounded = true; world.checkpoint = platform.id; break;
      }
    }
    const dropped = world.platforms.find(p => p.id === world.dropPlatform);
    if (dropped && p.y > dropped.y + 10) world.dropPlatform = null;
    const collected = [];
    for (const spark of world.sparks) {
      if (!spark.collected && Math.abs(p.x + PLAYER_W / 2 - spark.x) < 25 && Math.abs(p.y + PLAYER_H / 2 - spark.y) < 30) { spark.collected = true; collected.push(spark); }
    }
    let fell = false;
    if (!p.grounded && p.y > (world.platforms.find(ledge => ledge.id === world.checkpoint)?.y || 0) + 650) { world.falls++; respawn(world); fell = true; }
    return { collected, fell };
  }
  if (typeof module !== 'undefined' && module.exports) { module.exports = { createWorld, step, respawn, PLAYER_W, PLAYER_H, JUMP_SPEED, GRAVITY }; return; }

  const toggle = document.getElementById('game-toggle'), surface = document.getElementById('platform-game');
  const canvas = document.getElementById('game-canvas'), ctx = canvas.getContext('2d');
  if (!ctx) return;
  const progress = document.getElementById('game-progress'), message = document.getElementById('game-message');
  const locationLabel = document.getElementById('game-location'), pauseButton = document.getElementById('game-pause');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const keys = new Set(), touches = new Set();
  const stops = [
    { id: 'hello-spark', selector: '.hero-footer', label: 'Hello, human!', fraction: .68 },
    { id: 'skills-spark', selector: '#skills h2', label: 'A few tools I reach for', fraction: .18 },
    { id: 'experience-spark', selector: '#experience h2', label: 'Things I’ve helped build', fraction: .61 },
    { id: 'projects-spark', selector: '#project-toxicology h3', label: 'A little more possibility', fraction: .3 },
    { id: 'human-spark', selector: '#beyond h2', label: 'The whole human', fraction: .72 }
  ];
  let active = false, paused = false, world, raf = 0, lastTime = 0, elapsed = 0, jumpQueued = false, routeSeed = 72831;
  const headerHeight = () => document.querySelector('.site-header').getBoundingClientRect().bottom;
  const documentBox = selector => { const r = document.querySelector(selector).getBoundingClientRect(); return { x: r.left, y: r.top + scrollY, bottom: r.bottom + scrollY }; };
  function layout() {
    const hello = documentBox('.hello');
    const actions = documentBox('.hero-actions'), about = documentBox('#about h2');
    return { seed: routeSeed, spawn: { id: 'spawn', x: hello.x, y: hello.y + 12 }, waypoints: [{id:'explore-work',x:actions.x + 45,y:actions.bottom + 14},{id:'turn-back',x:Math.max(18,actions.x-35),y:actions.bottom+120},{id:'about-entry',x:about.x,y:about.bottom+15}], stops: stops.map(stop => ({ ...stop, x: clamp(innerWidth * stop.fraction, 18, innerWidth - 132), y: documentBox(stop.selector).bottom + 24 })), endY: documentBox('#contact').y + 80 };
  }
  function rebuild() {
    if (!active) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(innerWidth * dpr); canvas.height = Math.round(innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const old = world;
    world = createWorld(innerWidth, layout());
    if (old) {
      world.sparks.forEach(s => { s.collected = old.sparks.some(o => o.id === s.id && o.collected); });
      world.player.x = old.player.x / old.width * innerWidth;
      world.player.y = old.player.y;
      world.checkpoint = old.checkpoint;
    }
    const textLines = [];
    const walker = document.createTreeWalker(document.querySelector('main'), NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (!node.textContent.trim() || node.parentElement.closest('[hidden], [aria-hidden="true"]')) continue;
      const range = document.createRange(); range.selectNodeContents(node);
      for (const rect of range.getClientRects()) if (rect.width && rect.height) textLines.push({ left: rect.left, right: rect.right, top: rect.top + scrollY, bottom: rect.bottom + scrollY });
    }
    for (const ledge of world.platforms) {
      if (ledge.id === 'spawn') continue;
      for (let pass = 0; pass < 8; pass++) {
        const hit = textLines.find(r => ledge.x < r.right + 3 && ledge.x + ledge.w > r.left - 3 && ledge.y < r.bottom + 1 && ledge.y + 6 > r.top - 1);
        if (!hit) break;
        ledge.y = hit.bottom + 2;
      }
      const spark = world.sparks.find(s => s.id === ledge.id);
      if (spark) spark.y = ledge.y - 40;
    }
    world.platforms.sort((a,b) => a.y - b.y);
    if (old) respawn(world);
    draw();
  }
  function focusGame() { canvas.focus({ preventScroll: true }); }
  function setActive(value) {
    active = value; toggle.setAttribute('aria-checked', String(value));
    document.getElementById('game-state').textContent = value ? 'on' : 'off';
    surface.hidden = !value;
    keys.clear(); touches.clear(); jumpQueued = false; cancelAnimationFrame(raf); raf = 0;
    if (value) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      routeSeed = Math.floor(Math.random() * 4294967295);
      world = null; paused = false; elapsed = 0; lastTime = 0;
      pauseButton.textContent = 'Pause'; progress.textContent = '0 / 5 sparks';
      message.textContent = 'Scroll to explore. Five sparks to find.';
      rebuild(); focusGame(); raf = requestAnimationFrame(tick);
    } else toggle.focus({ preventScroll: true });
  }
  function setPaused(value) {
    if (!active) return;
    paused = value; keys.clear(); touches.clear(); jumpQueued = false;
    pauseButton.textContent = value ? 'Resume' : 'Pause';
    cancelAnimationFrame(raf); raf = 0;
    if (!value) { lastTime = 0; focusGame(); raf = requestAnimationFrame(tick); }
    else pauseButton.focus({ preventScroll: true });
    draw();
  }
  function drawPlayer() {
    const p = world.player;
    ctx.save(); ctx.translate(Math.round(p.x), Math.round(p.y - scrollY));
    const stride = !reduced.matches && p.grounded && p.vx ? Math.sin(elapsed * 20) * 2 : 0;
    ctx.fillStyle = '#64ffda'; ctx.fillRect(3, 7, 20, 20); ctx.fillRect(6, 3, 14, 6);
    ctx.fillRect(3, 0, 6, 9); ctx.fillRect(17, 0, 6, 9);
    ctx.fillStyle = '#ac9de8'; ctx.fillRect(-2, 11, 5, 12);
    ctx.fillStyle = '#0a192f'; ctx.fillRect(7, 11, 4, 5); ctx.fillRect(16, 11, 4, 5); ctx.fillRect(11, 21, 5, 2);
    ctx.fillStyle = '#f8b87a'; ctx.fillRect(4, 27 + stride, 7, 5); ctx.fillRect(16, 27 - stride, 7, 5);
    ctx.restore();
  }
  function draw() {
    if (!world) return;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (const p of world.platforms) {
      const y = p.y - scrollY;
      if (y < headerHeight() || y > innerHeight) continue;
      ctx.fillStyle = '#081526ef'; ctx.fillRect(p.x, y, p.w, 6);
      ctx.fillStyle = '#64ffdab0'; ctx.fillRect(p.x, y, p.w, 2);
      ctx.fillStyle = '#345972'; for (let x = p.x + 8; x < p.x + p.w - 5; x += 14) ctx.fillRect(x, y + 4, 4, 2);
    }
    for (const spark of world.sparks) {
      const y = spark.y - scrollY;
      if (spark.collected || y < headerHeight() + 12 || y > innerHeight + 12) continue;
      const bob = reduced.matches ? 0 : Math.sin(elapsed * 3) * 3;
      ctx.save(); ctx.translate(spark.x, y + bob);
      ctx.fillStyle = '#c8b6ff'; ctx.shadowColor = '#ac9de8'; ctx.shadowBlur = reduced.matches ? 0 : 12;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) { const a = Math.PI * i / 4, r = i % 2 ? 4 : 12; if (i) ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); else ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
      ctx.closePath(); ctx.fill(); ctx.restore();
    }
    drawPlayer();
    const nearest = world.sparks.filter(s => !s.collected).sort((a,b) => Math.abs(a.y - world.player.y) - Math.abs(b.y - world.player.y))[0];
    const hint = nearest ? `${nearest.y < world.player.y - 80 ? '↑' : nearest.y > world.player.y + 120 ? '↓' : '✦'} ${nearest.label}` : 'Every spark found. Keep exploring!';
    if (locationLabel.textContent !== hint) locationLabel.textContent = hint;
  }
  function syncScroll() {
    if (!active || !world) return;
    draw();
  }
  function tick(time) {
    raf = 0;
    if (!active || paused || document.hidden) return;
    syncScroll();
    const dt = lastTime ? (time - lastTime) / 1000 : 1 / 60;
    lastTime = time; elapsed += Math.min(dt, .033);
    const jump = jumpQueued || keys.has('Tab') || keys.has('Space') || keys.has('ArrowUp') || keys.has('KeyW') || touches.has('jump');
    const result = step(world, { left: keys.has('ArrowLeft') || keys.has('KeyA') || touches.has('left'), right: keys.has('ArrowRight') || keys.has('KeyD') || touches.has('right'), down: keys.has('ArrowDown') || keys.has('KeyS') || touches.has('down'), jump }, dt);
    jumpQueued = false;
    if (result.collected.length) {
      const count = world.sparks.filter(s => s.collected).length;
      progress.textContent = `${count} / 5 sparks`;
      message.textContent = count === 5 ? 'All five! A curious cat after my own heart. Keep wandering, or play again.' : 'Found one! There’s more hiding down the page.';
    } else if (result.fell) message.textContent = 'Back on your paws. Scroll and keep exploring.';
    draw(); raf = requestAnimationFrame(tick);
  }
  toggle.hidden = false;
  toggle.addEventListener('click', () => setActive(!active));
  document.getElementById('game-close').addEventListener('click', () => setActive(false));
  pauseButton.addEventListener('click', () => setPaused(!paused));
  document.getElementById('game-restart').addEventListener('click', () => setActive(true));
  canvas.addEventListener('keydown', event => {
    if (!active) return;
    if (event.code === 'Escape') { event.preventDefault(); setPaused(true); return; }
    if (event.code === 'Tab' && event.shiftKey) return;
    if (!['Tab','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space','KeyA','KeyD','KeyW','KeyS'].includes(event.code)) return;
    event.preventDefault();
    if (paused) return;
    keys.add(event.code);
    if (!event.repeat && ['Tab','Space','ArrowUp','KeyW'].includes(event.code)) jumpQueued = true;
  });
  window.addEventListener('keyup', event => keys.delete(event.code));
  canvas.addEventListener('blur', () => { keys.clear(); jumpQueued = false; });
  document.querySelectorAll('[data-move]').forEach(button => {
    const stop = () => touches.delete(button.dataset.move);
    button.addEventListener('pointerdown', event => { if (!active || paused) return; event.preventDefault(); button.setPointerCapture(event.pointerId); focusGame(); touches.add(button.dataset.move); if (button.dataset.move === 'jump') jumpQueued = true; });
    button.addEventListener('pointerup', stop); button.addEventListener('pointercancel', stop); button.addEventListener('lostpointercapture', stop);
    button.addEventListener('keydown', event => { if (!paused && (event.code === 'Space' || event.code === 'Enter')) { event.preventDefault(); touches.add(button.dataset.move); if (button.dataset.move === 'jump') jumpQueued = true; } });
    button.addEventListener('keyup', stop); button.addEventListener('blur', stop);
  });
  window.addEventListener('scroll', syncScroll, { passive: true });
  window.addEventListener('resize', rebuild);
  // Tab changes and image/font reflow change document-space platform positions.
  new ResizeObserver(() => { if (active) rebuild(); }).observe(document.querySelector('main'));
  window.addEventListener('blur', () => { if (active) setPaused(true); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && active) setPaused(true); });
})();
