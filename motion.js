'use strict';
// Motion layer. Animates existing content only; skipped entirely for reduced-motion users.
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  document.documentElement.classList.add('m');
  const sbw = () => document.documentElement.style.setProperty('--m-sbw', (innerWidth - document.documentElement.clientWidth) + 'px');
  sbw(); addEventListener('resize', sbw);

  const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const fine = matchMedia('(pointer:fine)').matches;

  // Visibility tracking: loops wait while off-screen, CSS loops pause.
  const vis = new WeakMap(), waiters = new Map();
  const io = new IntersectionObserver(es => es.forEach(e => {
    vis.set(e.target, e.isIntersecting);
    e.target.classList.toggle('m-paused', !e.isIntersecting);
    if (e.isIntersecting && waiters.has(e.target)) { waiters.get(e.target).forEach(f => f()); waiters.delete(e.target); }
  }), { threshold: 0.05 });
  const watch = el => el && io.observe(el);
  const whenVisible = el => vis.get(el) ? Promise.resolve() : new Promise(r => { if (!waiters.has(el)) waiters.set(el, []); waiters.get(el).push(r); });
  const once = (el, fn, threshold = 0.4) => {
    if (!el) return;
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { o.disconnect(); fn(); } }, { threshold });
    o.observe(el);
  };
  $$('main > section, .proof').forEach(watch);

  /* ---------- scroll progress + cursor glow ---------- */
  const bar = document.createElement('div'); bar.className = 'm-progress'; document.body.append(bar);
  const glow = document.createElement('div'); glow.className = 'm-glow'; glow.setAttribute('aria-hidden', 'true'); document.body.prepend(glow);
  let gx = innerWidth / 2, gy = innerHeight / 3, tx = gx, ty = gy;
  addEventListener('pointermove', e => { tx = e.clientX; ty = e.clientY; }, { passive: true });
  (function tickGlow() { gx += (tx - gx) * .12; gy += (ty - gy) * .12; glow.style.transform = `translate(${gx - 260}px,${gy - 260}px)`; requestAnimationFrame(tickGlow); })();

  /* ---------- hero network mesh ---------- */
  const hero = $('.hero, .case-hero');
  if (hero) {
    const wrap = document.createElement('div'); wrap.className = 'm-net'; wrap.setAttribute('aria-hidden', 'true');
    const c = document.createElement('canvas'); wrap.append(c); hero.prepend(wrap);
    const x = c.getContext('2d'); watch(hero);
    let W, H, nodes = [], packets = [];
    const m = { x: -1e4, y: -1e4 }, D = 140;
    const resize = () => {
      const d = Math.min(devicePixelRatio || 1, 2); W = c.clientWidth; H = c.clientHeight;
      c.width = W * d; c.height = H * d; x.setTransform(d, 0, 0, d, 0, 0);
      const n = Math.round(Math.min(90, W * H / 16000));
      nodes = Array.from({ length: n }, () => ({ x: Math.random() * W, y: Math.random() * H, vx: rnd(-.22, .22), vy: rnd(-.22, .22), r: rnd(.8, 1.9), hub: Math.random() < .09 }));
      packets = [];
    };
    resize(); addEventListener('resize', resize);
    addEventListener('pointermove', e => { const r = c.getBoundingClientRect(); m.x = e.clientX - r.left; m.y = e.clientY - r.top; }, { passive: true });
    const frame = now => {
      requestAnimationFrame(frame);
      if (vis.get(hero) === false) return;
      x.clearRect(0, 0, W, H);
      for (const n of nodes) {
        n.x += n.vx; n.y += n.vy;
        if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
        const dx = m.x - n.x, dy = m.y - n.y; if (Math.hypot(dx, dy) < 200) { n.x += dx * .005; n.y += dy * .005; }
      }
      const edges = [];
      for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
        const a = nodes[i], b = nodes[j], d = Math.hypot(a.x - b.x, a.y - b.y);
        if (d < D) {
          const near = Math.hypot(m.x - a.x, m.y - a.y) < 200;
          x.strokeStyle = near ? `rgba(76,226,160,${(1 - d / D) * .45})` : `rgba(103,212,237,${(1 - d / D) * .16})`;
          x.lineWidth = 1; x.beginPath(); x.moveTo(a.x, a.y); x.lineTo(b.x, b.y); x.stroke(); edges.push([a, b]);
        }
      }
      if (edges.length && packets.length < 20 && Math.random() < .14) {
        const [a, b] = edges[Math.random() * edges.length | 0];
        packets.push({ a, b, t: 0, s: rnd(.012, .03), c: Math.random() < .82 ? '76,226,160' : '255,189,102' });
      }
      packets = packets.filter(p => {
        p.t += p.s; if (p.t >= 1) return false;
        const px = p.a.x + (p.b.x - p.a.x) * p.t, py = p.a.y + (p.b.y - p.a.y) * p.t;
        x.fillStyle = `rgb(${p.c})`; x.shadowColor = `rgb(${p.c})`; x.shadowBlur = 12;
        x.beginPath(); x.arc(px, py, 2, 0, 7); x.fill(); x.shadowBlur = 0; return true;
      });
      for (const n of nodes) {
        x.fillStyle = n.hub ? '#4ce2a0' : 'rgba(234,242,242,.4)';
        x.beginPath(); x.arc(n.x, n.y, n.hub ? n.r + 1.2 : n.r, 0, 7); x.fill();
        if (n.hub) { x.strokeStyle = 'rgba(76,226,160,.25)'; x.beginPath(); x.arc(n.x, n.y, 7 + Math.sin(now / 400 + n.x) * 2.5, 0, 7); x.stroke(); }
      }
    };
    requestAnimationFrame(frame);
  }

  /* ---------- terminal replay (same lines as the static HTML) ---------- */
  const tb = $('#terminal-body');
  if (tb) {
    const sr = document.createElement('div'); sr.className = 'm-sr'; sr.textContent = tb.textContent.replace(/\s+/g, ' ').trim();
    tb.after(sr); tb.setAttribute('aria-hidden', 'true');
    const script = [...tb.children].map(p => {
      const path = p.querySelector('.path');
      if (!path || p.classList.contains('terminal-cursor')) return { type: 'out', node: p.cloneNode(true) };
      let prefix = '', text = '', after = false;
      p.childNodes.forEach(n => { if (after) text += n.textContent; else { prefix += n.nodeType === 3 ? n.textContent : n.outerHTML; if (n === path) after = true; } });
      return { type: 'cmd', cls: p.className, prefix, text: text.replace(/^\s+/, '') };
    });
    const term = tb.closest('.terminal'); watch(term);
    (async () => {
      await sleep(600);
      while (true) {
        await whenVisible(term);
        tb.classList.remove('m-out'); tb.replaceChildren();
        for (const s of script) {
          await whenVisible(term);
          if (s.type === 'cmd') {
            const p = document.createElement('p'); p.className = s.cls;
            p.innerHTML = s.prefix + ' <span class="m-typed"></span><span class="cursor"></span>'; tb.append(p);
            const t = p.querySelector('.m-typed');
            await sleep(350);
            for (const ch of s.text) { t.textContent += ch; await sleep(rnd(28, 70)); }
            await sleep(280); p.querySelector('.cursor').remove();
          } else {
            await sleep(420);
            const n = s.node.cloneNode(true); n.classList.add('m-in'); tb.append(n);
          }
        }
        await sleep(5200);
        tb.classList.add('m-out'); await sleep(550);
      }
    })();
  }

  /* ---------- count-up numbers ---------- */
  $$('.proof strong, .signal-number, .reliability-facts strong').forEach(el => {
    const tn = el.firstChild; if (!tn || tn.nodeType !== 3) return;
    const mt = tn.textContent.match(/^(\D*)([\d,]+)(\D*)$/); if (!mt) return;
    const [, pre, num, post] = mt, end = parseInt(num.replace(/,/g, ''), 10), comma = num.includes(',');
    const fmt = v => pre + (comma ? v.toLocaleString('en-US') : String(v)) + post;
    tn.textContent = fmt(0);
    once(el, () => {
      const st = performance.now(), D = 1700;
      (function f(t) { const p = Math.min((t - st) / D, 1); tn.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 4)))); if (p < 1) requestAnimationFrame(f); })(st);
    }, 0.6);
  });

  /* ---------- signal graph grow-in ---------- */
  const graph = $('.signal-graph');
  if (graph) { [...graph.children].forEach((s, i) => s.style.transitionDelay = i * 70 + 'ms'); once(graph, () => graph.classList.add('m-on'), 0.5); }

  /* ---------- migration phase tabs: auto-advance until the visitor takes over ---------- */
  const tabs = $('.pipeline-steps');
  if (tabs) {
    const btns = [...tabs.querySelectorAll('[role=tab]')], viz = tabs.closest('.pipeline-viz') || tabs;
    let stopped = false, hover = false, timer;
    const stop = () => { stopped = true; tabs.classList.remove('m-auto'); clearTimeout(timer); };
    tabs.addEventListener('pointerdown', stop); tabs.addEventListener('keydown', stop);
    viz.addEventListener('pointerenter', () => hover = true); viz.addEventListener('pointerleave', () => { hover = false; if (!stopped) schedule(); });
    const restartBar = () => { tabs.classList.remove('m-auto'); void tabs.offsetWidth; if (!stopped) tabs.classList.add('m-auto'); };
    const schedule = () => {
      clearTimeout(timer); if (stopped) return;
      restartBar();
      timer = setTimeout(async () => {
        if (stopped) return;
        if (hover) { tabs.classList.remove('m-auto'); return; }
        await whenVisible(viz);
        const i = btns.findIndex(b => b.getAttribute('aria-selected') === 'true');
        btns[(i + 1) % btns.length].click(); schedule();
      }, 4200);
    };
    watch(viz); once(viz, schedule, 0.4);
  }

  /* ---------- career git line draws on scroll ---------- */
  const entries = $$('.career-entry');
  if (entries.length) {
    let ticking = false;
    const update = () => {
      ticking = false; const line = innerHeight * .62;
      entries.forEach(e => {
        const r = e.getBoundingClientRect();
        const p = Math.max(0, Math.min(1, (line - (r.top + 51)) / Math.max(1, r.height - 15)));
        e.style.setProperty('--p', p.toFixed(3));
        e.classList.toggle('m-lit', r.top + 43 < line);
      });
    };
    addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    addEventListener('resize', update); update();
  }

  /* ---------- case study page ---------- */
  if ($('.case-main')) {
    // staggered reveals (the homepage gets these from app.js)
    const groups = [['.case-context'], ['.case-rule'], ['.method-grid article', 90], ['.evidence-list a', 110], ['.evidence-note'], ['.case-limits > div', 120], ['.case-next']];
    groups.forEach(([sel, step = 0]) => $$(sel).forEach((el, i) => {
      el.classList.add('m-rv'); el.style.transitionDelay = i * step + 'ms';
      once(el, () => el.classList.add('m-rv-on'), 0.15);
    }));
    // kicker decode
    const chars = '!<>-_\\/[]{}=+*^?#01';
    $$('.case-main .kicker').forEach(k => {
      const text = k.textContent; k.setAttribute('aria-label', text);
      once(k, () => {
        const st = performance.now(), D = 900;
        (function f(t) {
          const p = Math.min((t - st) / D, 1), n = Math.floor(p * text.length);
          let out = text.slice(0, n);
          for (let i = n; i < text.length; i++) out += text[i] === ' ' ? ' ' : chars[Math.random() * chars.length | 0];
          k.textContent = out; if (p < 1) requestAnimationFrame(f); else k.textContent = text;
        })(st);
      }, 0.8);
    });
    // engineering question highlight
    const rule = $('.case-rule strong');
    if (rule) { rule.innerHTML = rule.innerHTML.replace(/(“workflow succeeded”)/, '<mark class="m-mark">$1</mark>'); once(rule, () => rule.classList.add('m-on'), 0.6); }
    // method pipeline rail
    const grid = $('.method-grid');
    if (grid) {
      const steps = [...grid.children];
      const rail = document.createElement('div'); rail.className = 'm-rail'; rail.setAttribute('aria-hidden', 'true');
      rail.innerHTML = '<i class="m-rail-fill"></i><b class="m-rail-dot"></b>' + steps.map((_, i) => `<span style="left:${(i + .5) / steps.length * 100}%"></span>`).join('');
      grid.before(rail); watch(grid);
      const nodes = [...rail.querySelectorAll('span')], fill = rail.querySelector('.m-rail-fill'), dot = rail.querySelector('.m-rail-dot');
      const setPos = i => { const pct = (i + .5) / steps.length * 100; fill.style.width = pct + '%'; dot.style.left = pct + '%'; };
      once(grid, async () => {
        while (true) {
          for (let i = 0; i < steps.length; i++) {
            await whenVisible(grid);
            setPos(i);
            steps.forEach((s, j) => { s.classList.toggle('m-active', j === i); s.classList.toggle('m-done', j < i); });
            nodes.forEach((n, j) => n.classList.toggle('m-lit', j <= i));
            await sleep(2300);
          }
          steps.forEach(s => { s.classList.remove('m-active'); s.classList.add('m-done'); });
          await sleep(1800);
          steps.forEach(s => s.classList.remove('m-done')); nodes.forEach(n => n.classList.remove('m-lit'));
          fill.style.transition = 'none'; dot.style.transition = 'none'; fill.style.width = '0'; dot.style.left = '0';
          void fill.offsetWidth; fill.style.transition = ''; dot.style.transition = '';
          await sleep(400);
        }
      }, 0.3);
    }
    // live status dot on the CI evidence link
    const ci = $$('.evidence-list a').find(a => /actions\/runs/.test(a.href));
    if (ci) { const d = document.createElement('i'); d.className = 'm-live'; d.setAttribute('aria-hidden', 'true'); ci.querySelector('strong')?.prepend(d); }
  }

  /* ---------- scroll progress ---------- */
  const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; bar.style.transform = `scaleX(${h > 0 ? scrollY / h : 0})`; };
  addEventListener('scroll', prog, { passive: true }); prog();

  /* ---------- toolkit marquee (decorative copy of the listed tools) ---------- */
  const tg = $('.tool-groups');
  if (tg) {
    const tools = [...new Set([...tg.querySelectorAll('p')].flatMap(p => p.textContent.split('·').map(s => s.trim())).filter(Boolean))];
    const cols = ['#4ce2a0', '#67d4ed', '#ffbd66', '#a99bff'];
    const half = Math.ceil(tools.length / 2);
    const row = list => { const h = list.map((t, i) => `<span class="m-chip"><i style="background:${cols[i % 4]}"></i>${t}</span>`).join(''); return `<div class="m-track">${h}${h}</div>`; };
    const mq = document.createElement('div'); mq.className = 'm-marquee'; mq.setAttribute('aria-hidden', 'true');
    mq.innerHTML = row(tools.slice(0, half)) + row(tools.slice(half));
    tg.after(mq);
  }

  /* ---------- spotlight cards + magnetic buttons ---------- */
  if (fine) {
    $$('.feature, .platform-map, .signal-card, .project-card, .tool-groups > div, .terminal, .case-context, .method-grid article').forEach(el => {
      el.classList.add('m-host');
      const s = document.createElement('span'); s.className = 'm-spot'; s.setAttribute('aria-hidden', 'true'); el.prepend(s);
      el.addEventListener('pointermove', e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px'); });
    });
    $$('.button').forEach(b => {
      b.addEventListener('pointermove', e => { const r = b.getBoundingClientRect(); b.style.transition = 'none'; b.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * .22}px,${(e.clientY - r.top - r.height / 2) * .32}px)`; });
      b.addEventListener('pointerleave', () => { b.style.transition = 'transform .5s cubic-bezier(.3,1.6,.5,1)'; b.style.transform = ''; });
    });
  }
})();
