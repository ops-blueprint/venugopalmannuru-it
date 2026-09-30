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

  /* ---------- Kubernetes simulation: animates the static snapshot in #k-svg ---------- */
  const kSvg = $('#k-svg');
  if (kSvg) {
    const NS = 'http://www.w3.org/2000/svg', C = 250, sim = $('#k8s-sim'), podLayer = $('#k-pods'), ev = $('#k-ev');
    const nodesEl = $$('#k-svg .knode');
    const slots = $$('#k-svg .k-slot').map(r => ({ node: +r.dataset.node, x: +r.getAttribute('x'), y: +r.getAttribute('y'), pod: null, dying: false, name: '' }));
    const hex = n => Array.from({ length: n }, () => '0123456789abcdef'[Math.random() * 16 | 0]).join('');
    let desired = 6, cpu = 48, phase = 0, healed = 0;
    const running = () => slots.filter(s => s.pod && s.pod !== 'pending' && !s.dying);
    const ui = () => {
      $('#k-rep').textContent = running().length + '/' + desired; $('#k-cpu').textContent = Math.round(cpu) + '%';
      const b = $('#k-cpubar'); b.style.width = cpu + '%'; b.style.background = cpu > 75 ? '#ff6b81' : cpu > 55 ? 'var(--amber)' : 'var(--green)';
      $('#k-heal').textContent = healed;
    };
    const log = (cls, tag, msg) => {
      const li = document.createElement('li'); li.className = cls; li.innerHTML = `<b>${tag}</b><span>${msg}</span>`;
      ev.prepend(li); while (ev.children.length > 5) ev.lastChild.remove();
    };
    const mk = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); podLayer.append(e); return e; };
    const spawn = reason => {
      const free = slots.filter(s => !s.pod); if (!free.length) return;
      const load = n => slots.filter(s => s.node === n && s.pod).length;
      free.sort((a, b) => load(a.node) - load(b.node)); const s = free[0]; s.pod = 'pending';
      s.name = 'api-7f9c2-' + hex(5);
      log(reason === 'heal' ? 'g' : 'c', reason === 'heal' ? 'Healed' : 'Scheduled', `${s.name} → node-${s.node + 1}`);
      const pk = mk('circle', { cx: C, cy: C, r: 4, fill: '#67d4ed', style: 'filter:drop-shadow(0 0 6px #67d4ed)' });
      const tx = s.x + 10, ty = s.y + 10, st = performance.now(), D = 550;
      (function fly(t) {
        const p = Math.min((t - st) / D, 1), e = p < .5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        pk.setAttribute('cx', C + (tx - C) * e); pk.setAttribute('cy', C + (ty - C) * e);
        if (p < 1) return requestAnimationFrame(fly);
        pk.remove(); s.pod = mk('rect', { class: 'k-pod', x: s.x, y: s.y, width: 20, height: 20, rx: 5 });
        const n = nodesEl[s.node]; n.classList.add('hot'); setTimeout(() => n.classList.remove('hot'), 600); ui();
      })(st);
    };
    const kill = (s, crash) => {
      s.dying = true;
      if (crash) { s.pod.classList.add('crash'); log('r', 'BackOff', `${s.name} OOMKilled, restarting`); }
      else { s.pod.classList.add('out'); log('a', 'Killing', `${s.name} (scale-down)`); }
      setTimeout(() => { s.pod.classList.add('out'); setTimeout(() => { s.pod.remove(); s.pod = null; s.dying = false; ui(); if (crash) { healed++; spawn('heal'); } }, 450); }, crash ? 700 : 0);
    };
    watch(sim);
    once(sim, async () => {
      podLayer.replaceChildren(); ev.replaceChildren(); healed = 0;
      for (let i = 0; i < 6; i++) { spawn(); await sleep(180); }
      while (true) {
        await whenVisible(sim); await sleep(950);
        phase += .09; cpu = Math.max(8, Math.min(96, 52 + 38 * Math.sin(phase) + rnd(-6, 6)));
        const nd = Math.max(4, Math.min(16, Math.round(2 + cpu / 7)));
        if (nd !== desired) { log('a', 'HPA', `scaled api ${desired} → ${nd} (cpu ${Math.round(cpu)}%)`); desired = nd; }
        const r = running(), pending = slots.filter(s => s.pod === 'pending').length;
        if (r.length + pending < desired) spawn();
        else if (r.length > desired) kill(r[Math.random() * r.length | 0], false);
        else if (r.length && Math.random() < .2) kill(r[Math.random() * r.length | 0], true);
        ui();
      }
    }, 0.25);
  }

  /* ---------- Azure IaC replay: reads the static main.tf from the page ---------- */
  const iacCode = $('#iac-code');
  if (iacCode) {
    const grid = iacCode.closest('.iac-grid'), pre = iacCode.parentElement, apply = $('#iac-apply'), count = $('#iac-count');
    const items = $$('#iac-res li'), byAddr = Object.fromEntries(items.map(li => [li.dataset.addr, li]));
    const lines = [...iacCode.querySelectorAll('.l')].map(l => l.textContent);
    let cur = null;
    const plan = lines.map(l => {
      const mt = l.match(/^resource "(\w+)" "(\w+)"/); if (mt) cur = mt[1] + '.' + mt[2];
      let done = null; if (l === '}' && cur) { done = cur; cur = null; }
      return { l, done };
    });
    const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
    const hl = s => esc(s).replace(/("[^"]*"?)|\b(provider|resource|true|false)\b|\b([a-z_]+)(?=\s*=)|\b(\d[\d.]*)\b|([{}\[\]=])/g,
      (m, str, kw, at, num, p) => str ? `<span class="s">${str}</span>` : kw ? `<span class="k">${kw}</span>` : at ? `<span class="a">${at}</span>` : num ? `<span class="n">${num}</span>` : `<span class="p">${p}</span>`);
    pre.setAttribute('aria-hidden', 'true');
    const sr = document.createElement('p'); sr.className = 'm-sr'; sr.textContent = 'Illustrative Terraform configuration that provisions an Azure virtual network, AKS cluster, container registry, PostgreSQL server, Key Vault and a metric alert in westeurope.'; pre.after(sr);
    watch(grid);
    let made = 0;
    const setCount = () => count.textContent = `${made} / ${items.length} CREATED`;
    const provision = async li => {
      const d = rnd(1300, 2300), st = li.querySelector('.iac-st');
      li.className = 'm-creating'; st.textContent = '+ creating…';
      li.style.setProperty('--d', '0s'); li.style.setProperty('--b', '0%'); void li.offsetWidth;
      li.style.setProperty('--d', d + 'ms'); li.style.setProperty('--b', '100%');
      await sleep(d);
      li.className = 'm-made'; st.textContent = '✓ created'; li.style.setProperty('--b', '0%'); li.style.setProperty('--d', '0s');
      made++; setCount();
    };
    once(grid, async () => {
      while (true) {
        await whenVisible(grid);
        made = 0; setCount();
        items.forEach(li => { li.className = 'm-pend'; li.querySelector('.iac-st').textContent = 'pending'; });
        iacCode.replaceChildren(); pre.scrollTop = 0;
        apply.classList.add('m-busy'); apply.textContent = '$ terraform apply';
        const jobs = [];
        for (const { l, done } of plan) {
          await whenVisible(grid);
          const row = document.createElement('span'); row.className = 'l'; iacCode.append(row, '\n');
          for (let c = 2; c < l.length + 2; c += 2) { row.innerHTML = hl(l.slice(0, c)); await sleep(14); }
          pre.scrollTop = pre.scrollHeight;
          if (done && byAddr[done]) { apply.textContent = `${done}: Creating...`; jobs.push(provision(byAddr[done])); }
          await sleep(55);
        }
        await Promise.all(jobs);
        apply.classList.remove('m-busy'); apply.textContent = `Apply complete! Resources: ${items.length} added, 0 changed, 0 destroyed.`;
        await sleep(5500);
      }
    }, 0.3);
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
    $$('.feature, .platform-map, .signal-card, .project-card, .tool-groups > div, .terminal, .case-context, .method-grid article, .iac-cloud, .k8s-panel').forEach(el => {
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
