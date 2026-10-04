(() => {
  'use strict';
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  document.getElementById('year').textContent = new Date().getFullYear();

  // Reading never depends on JavaScript. This only adds an active section marker.
  const indexLinks = [...document.querySelectorAll('.side-index a')];
  const sectionObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      indexLinks.forEach(link => {
        const active = link.hash === `#${entry.target.id}`;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }
  }, { rootMargin: '-20% 0px -55% 0px' });
  ['intro', 'about', 'skills', 'experience', 'projects', 'beyond'].forEach(id => sectionObserver.observe(document.getElementById(id)));

  // Company tabs enhance ordinary articles; every role stays readable without JS.
  const experiencePanels = [...document.querySelectorAll('.experience')];
  const tabList = document.querySelector('.experience-tabs');
  let selectedExperience = experiencePanels[0].id;
  const activateExperience = (id, focus = false) => {
    selectedExperience = id;
    experiencePanels.forEach(panel => { panel.hidden = panel.id !== id; });
    [...tabList.children].forEach(tab => {
      const selected = tab.getAttribute('aria-controls') === id;
      tab.setAttribute('aria-selected', String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (selected) {
        // Only scroll the tab strip. Do not move the reader's page position.
        const left = tab.offsetLeft - tabList.offsetLeft;
        if (left < tabList.scrollLeft) tabList.scrollLeft = left;
        else if (left + tab.offsetWidth > tabList.scrollLeft + tabList.clientWidth) tabList.scrollLeft = left + tab.offsetWidth - tabList.clientWidth;
        if (focus) tab.focus({ preventScroll: true });
      }
    });
  };
  experiencePanels.forEach((panel, index) => {
    const tab = document.createElement('button');
    tab.type = 'button';
    tab.id = `tab-${panel.id}`;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-controls', panel.id);
    tab.textContent = panel.dataset.company;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', tab.id);
    panel.tabIndex = 0;
    tab.addEventListener('click', () => activateExperience(panel.id));
    tab.addEventListener('keydown', event => {
      let next;
      if (event.key === 'ArrowRight') next = (index + 1) % experiencePanels.length;
      if (event.key === 'ArrowLeft') next = (index - 1 + experiencePanels.length) % experiencePanels.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = experiencePanels.length - 1;
      if (next !== undefined) { event.preventDefault(); activateExperience(experiencePanels[next].id, true); }
    });
    tabList.appendChild(tab);
  });
  tabList.hidden = false;
  activateExperience(experiencePanels.some(panel => `#${panel.id}` === location.hash) ? location.hash.slice(1) : selectedExperience);
  window.addEventListener('hashchange', () => {
    const panel = experiencePanels.find(panel => `#${panel.id}` === location.hash);
    if (panel) { activateExperience(panel.id); panel.scrollIntoView({ block: 'start' }); }
  });

  // Build a halftone portrait directly from Mythri's original photo.
  // Spring motion runs only while visible, and settles when the pointer leaves.
  const canvas = document.getElementById('portrait');
  const fallback = document.getElementById('portrait-fallback');
  const ctx = canvas.getContext('2d');
  const source = new Image();
  // A tiny fixed note lives among the southwest dots. Only searching near it
  // gradually makes it readable; there is no overlay, badge, or pop-up.
  let secretClarity = 0, formationStarted = null, formationDone = false;
  let particles = [], width = 0, height = 0, frame = 0, visible = true;
  let pointer = { x: -999, y: -999, active: false };
  const render = (time) => {
    frame = 0;
    if (!ctx || !visible || document.hidden) return;
    if (formationStarted === null) formationStarted = time;
    const age = time - formationStarted;
    formationDone = motion.matches || age >= 2250;
    canvas.dataset.phase = formationDone ? 'ready' : 'forming';
    ctx.clearRect(0, 0, width, height);
    let unsettled = false;
    const secretX = width * .28, secretY = height * .66;
    const distanceToNote = Math.hypot(pointer.x - secretX, pointer.y - secretY);
    const targetClarity = formationDone && pointer.active ? Math.max(0, 1 - distanceToNote / 48) : 0;
    secretClarity = motion.matches ? targetClarity : secretClarity + (targetClarity - secretClarity) * .1;
    const noteSettling = Math.abs(targetClarity - secretClarity) > .002;
    for (const p of particles) {
      let arrival = 1;
      if (!formationDone) {
        const progress = Math.max(0, Math.min(1, (age - p.delay) / 1850));
        const ease = 1 - Math.pow(1 - progress, 3);
        p.x = p.startX + (p.homeX - p.startX) * ease;
        p.y = p.startY + (p.homeY - p.startY) * ease;
        arrival = Math.min(1, progress * 3);
        unsettled = true;
      } else if (!motion.matches) {
        if (pointer.active) {
          const dx = p.x - pointer.x, dy = p.y - pointer.y;
          const distance = Math.hypot(dx, dy);
          if (distance < 68 && distance > 0) {
            const force = (1 - distance / 68) * 2.2;
            p.vx += dx / distance * force;
            p.vy += dy / distance * force;
          }
        }
        p.vx = (p.vx + (p.homeX - p.x) * .045) * .83;
        p.vy = (p.vy + (p.homeY - p.y) * .045) * .83;
        p.x += p.vx; p.y += p.vy;
        if (Math.abs(p.x - p.homeX) + Math.abs(p.y - p.homeY) > .12) unsettled = true;
      } else { p.x = p.homeX; p.y = p.homeY; p.vx = p.vy = 0; }
      ctx.beginPath(); ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      const nearNote = Math.hypot(p.homeX - secretX, p.homeY - secretY) < 33;
      ctx.globalAlpha = arrival * (nearNote ? 1 - secretClarity * .86 : 1);
      ctx.fillStyle = p.color; ctx.fill();
    }
    ctx.save();
    ctx.globalAlpha = formationDone ? secretClarity : 0;
    ctx.fillStyle = '#e6f1ff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '8px monospace';
    ctx.fillText('Dude, I just', secretX, secretY - 10);
    ctx.fillText('made you look.', secretX, secretY + 1);
    ctx.font = '11px sans-serif';
    ctx.fillText('🙃', secretX, secretY + 15);
    ctx.restore();
    ctx.globalAlpha = 1;
    if (!motion.matches && (unsettled || pointer.active || noteSettling)) frame = requestAnimationFrame(render);
  };
  const wake = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(render); };
  const buildPortrait = () => {
    if (!ctx || !source.complete || !source.naturalWidth) return;
    const rect = canvas.parentElement.getBoundingClientRect();
    width = rect.width; height = rect.height;
    if (!width || !height) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const sample = document.createElement('canvas');
    sample.width = Math.ceil(width); sample.height = Math.ceil(height);
    const sampleCtx = sample.getContext('2d', { willReadFrequently: true });
    const scale = Math.max(width / source.naturalWidth, height / source.naturalHeight);
    sampleCtx.drawImage(source, (width - source.naturalWidth * scale) / 2, (height - source.naturalHeight * scale) / 2, source.naturalWidth * scale, source.naturalHeight * scale);
    const { data } = sampleCtx.getImageData(0, 0, sample.width, sample.height);
    const firstBuild = !particles.length;
    if (firstBuild) formationStarted = null;
    if (motion.matches) formationDone = true;
    particles = [];
    const gap = width < 320 ? 4 : 5;
    const lightAt = (x,y) => {
      const index = (Math.max(0,Math.min(sample.height-1,Math.floor(y))) * sample.width + Math.max(0,Math.min(sample.width-1,Math.floor(x)))) * 4;
      return (data[index]*.299 + data[index+1]*.587 + data[index+2]*.114)/255;
    };
    for (let y = 2; y < height; y += gap) {
      for (let x = 2; x < width; x += gap) {
        const i = (Math.floor(y) * sample.width + Math.floor(x)) * 4;
        const light = (data[i] * .299 + data[i + 1] * .587 + data[i + 2] * .114) / 255;
        // A sparse, single-tone impression, rather than a full-color photograph.
        const darkness = 1 - light;
        const photoX = (x - (width-source.naturalWidth*scale)/2)/scale;
        const photoY = (y - (height-source.naturalHeight*scale)/2)/scale;
        const face = Math.exp(-Math.pow((photoX-300)/90,4)-Math.pow((photoY-150)/83,4));
        const neighborhood = (lightAt(x-7,y)+lightAt(x+7,y)+lightAt(x,y-7)+lightAt(x,y+7))/4;
        const detail = Math.max(0, neighborhood-light) * face * 5;
        const radius = .3 + Math.pow(darkness,1.25) * (1.05 + face*.22) + Math.min(.5,detail);
        const edge = Math.max(0, 1 - Math.pow(Math.hypot((x-width*.5)/(width*.55), (y-height*.48)/(height*.6)), 4));
        const alpha = Math.min(.95, .3 + darkness * .55 + face*.16 + detail*.35) * Math.max(.18, edge);
        particles.push({ homeX: x, homeY: y, x, y, startX: x + (Math.random()-.5)*width*1.7, startY: y + (Math.random()-.5)*height*1.7, delay: Math.random()*350, vx: 0, vy: 0, radius, color: `rgba(120, 183, 174, ${alpha})` });
      }
    }
    fallback.hidden = true; canvas.hidden = false;
    document.getElementById('portrait-hint').textContent = motion.matches ? "yes, that's me. in dots." : 'go on, move the dots. ↖';
    wake();
  };
  source.onload = buildPortrait;
  source.src = fallback.getAttribute('src');
  new ResizeObserver(buildPortrait).observe(canvas.parentElement);
  canvas.addEventListener('pointermove', event => {
    // Let touch visitors scroll naturally; tap provides a brief particle nudge.
    if (event.pointerType === 'touch') return;
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }; wake();
  });
  canvas.addEventListener('pointerleave', () => { pointer.active = false; wake(); });
  let touchReset;
  canvas.addEventListener('pointerdown', event => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }; wake();
    clearTimeout(touchReset);
    touchReset = setTimeout(() => { pointer.active = false; wake(); }, 1600);
  });
  canvas.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    if (!formationDone) return;
    pointer = { x: width * .28, y: height * .66, active: true };
    canvas.setAttribute('aria-label', 'Dude, I just made you look. Upside-down smile.');
    wake();
  });
  canvas.addEventListener('blur', () => { pointer.active = false; wake(); });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; }
    else if (visible) wake();
  }).observe(canvas.parentElement);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(frame); frame = 0; pointer.active = false; }
    else wake();
  });
  motion.addEventListener('change', () => { pointer.active = false; buildPortrait(); });

  // Print all roles, then restore the selected company.
  window.addEventListener('beforeprint', () => experiencePanels.forEach(panel => { panel.hidden = false; }));
  window.addEventListener('afterprint', () => activateExperience(selectedExperience));
})();
