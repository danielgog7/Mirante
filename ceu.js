'use strict';
/* Mirante — o céu por trás da app.
   Estrelas que rodam devagar à volta do polo (uma volta em 30 minutos), algumas a cintilar, a Via Láctea,
   as serras ao fundo e, de vez em quando, uma estrela cadente. ~30 imagens por segundo; para quando a app não está à vista. */
const Ceu = (() => {
  const cv = document.getElementById('ceu'), ctx = cv.getContext('2d');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)');
  const OMEGA = Math.PI * 2 / 1800;           // rad/s
  let W = 0, H = 0, dpr = 1, P = {x: 0, y: 0}, estrelas = [], nuvens = [], serra = null, fundo = null, brilho = null, nuvem = null;
  let raf = 0, ultimo = 0, ativo = false, cadentes = [], proxCad = 0, rato = {x: 0, y: 0, ax: 0, ay: 0};
  const rnd = Math.random;

  // Sprites: um brilho redondo para as estrelas maiores e uma nuvem suave para a Via Láctea.
  function sprite(tam, paragens){
    const c = document.createElement('canvas'); c.width = c.height = tam;
    const g = c.getContext('2d'), gr = g.createRadialGradient(tam / 2, tam / 2, 0, tam / 2, tam / 2, tam / 2);
    paragens.forEach(([o, cor]) => gr.addColorStop(o, cor));
    g.fillStyle = gr; g.fillRect(0, 0, tam, tam); return c;
  }
  function medir(){
    dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    P = {x: W * .62, y: -H * .2};
    fundo = ctx.createLinearGradient(0, 0, 0, H);
    fundo.addColorStop(0, '#18203a'); fundo.addColorStop(.45, '#111523'); fundo.addColorStop(.82, '#0f121a'); fundo.addColorStop(1, '#141a28');
    if (!brilho) brilho = sprite(32, [[0, 'rgba(255,255,255,.9)'], [.18, 'rgba(210,225,255,.45)'], [.5, 'rgba(160,190,255,.08)'], [1, 'rgba(160,190,255,0)']]);
    if (!nuvem) nuvem = sprite(64, [[0, 'rgba(255,255,255,1)'], [.5, 'rgba(255,255,255,.35)'], [1, 'rgba(255,255,255,0)']]);
    gerar(); desenharSerra();
  }
  function gerar(){
    // As estrelas vivem num anel à volta do polo, largo o suficiente para a rotação nunca mostrar zonas vazias.
    const cantos = [[0, 0], [W, 0], [0, H + 340], [W, H + 340]].map(([x, y]) => Math.hypot(x - P.x, y - P.y));
    const rMin = Math.max(0, -P.y - 40), rMax = Math.max(...cantos) + 40;
    const n = Math.min(4200, Math.round(Math.PI * (rMax * rMax - rMin * rMin) / 1500));
    estrelas = [];
    for (let i = 0; i < n; i++){
      const u = rnd(), s = .35 + Math.pow(rnd(), 3.2) * 1.7, c = rnd();
      estrelas.push({r: Math.sqrt(rMin * rMin + rnd() * (rMax * rMax - rMin * rMin)), a: rnd() * Math.PI * 2, s,
        al: .25 + rnd() * .55 + (s > 1.2 ? .2 : 0), cor: c < .7 ? 0 : c < .88 ? 1 : 2,
        tw: u < .3 ? .35 + rnd() * .5 : 0, f: .6 + rnd() * 1.8, ph: rnd() * 6.28});
    }
    estrelas.sort((a, b) => a.cor - b.cor);
    // Via Láctea: duas faixas de nuvens suaves, em coordenadas do céu (rodam com as estrelas).
    nuvens = [];
    for (const [ang, dist] of [[.7, rMax * .45], [3.9, rMax * .62]]){
      const nx = Math.cos(ang), ny = Math.sin(ang);
      for (let i = 0; i < 90; i++){
        const t = (rnd() * 2 - 1) * rMax, off = (rnd() + rnd() + rnd() - 1.5) * 70;
        const x = nx * dist - ny * t + nx * off, y = ny * dist + nx * t + ny * off;
        nuvens.push({r: Math.hypot(x, y), a: Math.atan2(y, x), tam: 50 + rnd() * 130, al: .025 + rnd() * .05, cor: rnd() < .6 ? 'rgba(130,150,230,' : 'rgba(175,140,215,'});
      }
    }
  }
  // As serras do horizonte: duas camadas, desenhadas uma vez por tamanho de ecrã.
  function desenharSerra(){
    serra = document.createElement('canvas'); serra.width = Math.round(W * dpr); serra.height = Math.round(150 * dpr);
    const g = serra.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const h = 150, luz = g.createLinearGradient(0, 0, 0, h);
    luz.addColorStop(0, 'rgba(122,162,245,0)'); luz.addColorStop(.55, 'rgba(122,162,245,.06)'); luz.addColorStop(1, 'rgba(122,162,245,0)');
    g.fillStyle = luz; g.fillRect(0, 0, W, h);
    const cume = (base, amp, passo, cor, rim) => {
      g.beginPath(); g.moveTo(0, h);
      let y = base;
      for (let x = 0; x <= W + passo; x += passo){ y = Math.max(base - amp * 1.6, Math.min(base + amp * .6, y + (rnd() - .5) * amp)); g.lineTo(x, y); }
      g.lineTo(W, h); g.closePath(); g.fillStyle = cor; g.fill();
      if (rim){ g.strokeStyle = rim; g.lineWidth = 1; g.stroke(); }
    };
    cume(78, 26, 34, '#121826', 'rgba(170,190,240,.10)');
    cume(112, 16, 22, '#0c1018', 'rgba(170,190,240,.06)');
  }
  const CORES = ['#E8ECF8', '#B9CDFF', '#FFE6C2'];
  function pintar(t, mover){
    const seg = t / 1000, rot = mover ? seg * OMEGA : 0;
    const sc = Math.min(scrollY * .05, 300);
    rato.ax += (rato.x - rato.ax) * .05; rato.ay += (rato.y - rato.ay) * .05;
    const ox = P.x + rato.ax * 10, oy = P.y - sc + rato.ay * 8;
    ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = fundo; ctx.fillRect(0, 0, W, H);
    // Via Láctea
    ctx.globalCompositeOperation = 'lighter';
    for (const n of nuvens){
      const a = n.a + rot, x = ox + n.r * Math.cos(a), y = oy + n.r * Math.sin(a);
      if (x < -n.tam || x > W + n.tam || y < -n.tam || y > H + n.tam) continue;
      ctx.globalAlpha = n.al; ctx.drawImage(nuvem, x - n.tam / 2, y - n.tam / 2, n.tam, n.tam);
    }
    ctx.globalCompositeOperation = 'source-over';
    // Estrelas
    let corAtual = -1;
    for (const e of estrelas){
      const a = e.a + rot, x = ox + e.r * Math.cos(a), y = oy + e.r * Math.sin(a);
      if (x < -4 || x > W + 4 || y < -4 || y > H + 4) continue;
      let al = e.al;
      if (e.tw && mover) al *= 1 - e.tw * (.5 + .5 * Math.sin(seg * e.f + e.ph));
      if (e.cor !== corAtual){ corAtual = e.cor; ctx.fillStyle = CORES[e.cor]; }
      ctx.globalAlpha = al;
      if (e.s > 1.25){ ctx.drawImage(brilho, x - e.s * 4, y - e.s * 4, e.s * 8, e.s * 8); }
      else ctx.fillRect(x, y, e.s, e.s);
    }
    // Estrelas cadentes
    ctx.globalAlpha = 1;
    cadentes = cadentes.filter(c => {
      const k = (t - c.t0) / c.dur; if (k >= 1) return false;
      const e = 1 - Math.pow(1 - k, 2), hx = c.x + c.dx * e, hy = c.y + c.dy * e, f = k < .15 ? k / .15 : k > .7 ? (1 - k) / .3 : 1;
      const cauda = 70 + 60 * Math.min(1, k * 3), n = Math.hypot(c.dx, c.dy), tx = hx - c.dx / n * cauda, ty = hy - c.dy / n * cauda;
      const gr = ctx.createLinearGradient(tx, ty, hx, hy); gr.addColorStop(0, 'rgba(200,215,255,0)'); gr.addColorStop(1, `rgba(240,245,255,${.85 * f})`);
      ctx.strokeStyle = gr; ctx.lineWidth = 1.6; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.globalAlpha = f; ctx.drawImage(brilho, hx - 7, hy - 7, 14, 14); ctx.globalAlpha = 1;
      return true;
    });
    if (serra) ctx.drawImage(serra, 0, H - 150, W, 150);
  }
  function quadro(t){
    raf = requestAnimationFrame(quadro);
    if (t - ultimo < 33) return;
    ultimo = t;
    if (!proxCad) proxCad = t + 9000 + rnd() * 12000;
    if (t > proxCad){ cadente(t); proxCad = t + 14000 + rnd() * 18000; }
    pintar(t, true);
  }
  function cadente(t = performance.now()){
    if (!ativo || reduz.matches || document.hidden) return;
    const dir = rnd() < .5 ? -1 : 1, ang = (.22 + rnd() * .3), dist = 260 + rnd() * 240;
    cadentes.push({x: W * (.15 + rnd() * .7), y: H * (.04 + rnd() * .3), dx: Math.cos(ang) * dist * dir, dy: Math.sin(ang) * dist, t0: t, dur: 800 + rnd() * 450});
  }
  function iniciar(){
    cancelAnimationFrame(raf);
    if (!ativo) return;
    if (reduz.matches){ pintar(0, false); return; }
    if (document.hidden) return;
    ultimo = 0; raf = requestAnimationFrame(quadro);
  }
  let tRz;
  addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => { if (ativo){ medir(); iniciar(); } }, 120); });
  document.addEventListener('visibilitychange', iniciar);
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse'){ rato.x = e.clientX / innerWidth - .5; rato.y = e.clientY / innerHeight - .5; } }, {passive: true});
  addEventListener('scroll', () => { if (ativo && reduz.matches) pintar(0, false); }, {passive: true});
  return {
    ligar(){ ativo = true; cv.hidden = false; medir(); iniciar(); },
    desligar(){ ativo = false; cancelAnimationFrame(raf); cv.hidden = true; },
    cadente(atraso = 0){ setTimeout(() => cadente(), atraso); },
    get ativo(){ return ativo; }
  };
})();

/* ---------- Centelhas: uma pequena explosão de estrelas em cada toque ---------- */
const Centelhas = (() => {
  const cv = document.getElementById('centelhas'), ctx = cv.getContext('2d');
  const reduz = matchMedia('(prefers-reduced-motion: reduce)');
  let parts = [], raf = 0, dpr = 1, W = 0, H = 0;
  const PALETAS = {base: ['#E6CC93', '#ECE8DE', '#A9C8FF'], comida: ['#C6F36B', '#9AC74B', '#ECE8DE'], treino: ['#FFB766', '#FF9A3C', '#FFE9C2'], peso: ['#A9C8FF', '#7AA2F5', '#ECE8DE'], ouro: ['#E6CC93', '#C9A86A', '#FFF4D8']};
  function medir(){ dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.width = W + 'px'; cv.style.height = H + 'px'; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function astro(x, y, r){ ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * .28, y - r * .28); ctx.lineTo(x + r, y); ctx.lineTo(x + r * .28, y + r * .28); ctx.lineTo(x, y + r); ctx.lineTo(x - r * .28, y + r * .28); ctx.lineTo(x - r, y); ctx.lineTo(x - r * .28, y - r * .28); ctx.closePath(); ctx.fill(); }
  function passo(t){
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter(p => {
      const k = (t - p.t0) / p.vida; if (k >= 1) return false;
      p.vx *= .93; p.vy = p.vy * .93 + .025; p.x += p.vx; p.y += p.vy;
      ctx.globalAlpha = (1 - k) * (k < .1 ? k / .1 : 1); ctx.fillStyle = p.cor;
      if (p.astro) astro(p.x, p.y, p.r * (1 - k * .4)); else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r * .45, 0, 6.283); ctx.fill(); }
      return true;
    });
    ctx.globalAlpha = 1;
    raf = parts.length ? requestAnimationFrame(passo) : 0;
  }
  addEventListener('resize', medir);
  medir();
  return {
    explodir(x, y, tipo = 'base', n = 11){
      if (reduz.matches) return;
      const pal = PALETAS[tipo] || PALETAS.base, t0 = performance.now();
      for (let i = 0; i < n; i++){
        const a = Math.PI * 2 * i / n + Math.random() * .5, v = 1.6 + Math.random() * 2.6;
        parts.push({x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - .6, r: 2 + Math.random() * 2.6, cor: pal[i % pal.length], astro: Math.random() < .55, t0, vida: 520 + Math.random() * 380});
      }
      if (!raf) raf = requestAnimationFrame(passo);
    }
  };
})();
