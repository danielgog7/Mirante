'use strict';
/* Mirante — gráficos em SVG, desenhados à largura real do ecrã para o texto ficar sempre nítido.
   Cores por papel: comida (verde-pirilampo), treino (brasa), peso (azul-estrela). O dourado é só para metas. */

const COR = {comida: '#9AC74B', treino: '#EE6A22', peso: '#7AA2F5', ouro: '#C9A86A', luar: '#ECE8DE', nevoa: '#A2A8B7', bruma: '#6D7385', aresta: '#262D3D', aresta2: '#353D52'};
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
const r1 = v => Math.round(v * 10) / 10;

/* ---------- Dicas (tooltips) ---------- */
const DICAS = new Map(), LINHAS = new Map();
let nDica = 0;
const dica = html => { const id = 'd' + (++nDica); DICAS.set(id, html); return id; };
function limparDicas(){ DICAS.clear(); LINHAS.clear(); }

// Gerador pseudoaleatório com semente, para o céu ser sempre o mesmo para a mesma semana.
function semente(n){ let s = n | 0; return () => { s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const estrela = (x, y, r) => `M${r1(x)} ${r1(y - r)}L${r1(x + r * .26)} ${r1(y - r * .26)}L${r1(x + r)} ${r1(y)}L${r1(x + r * .26)} ${r1(y + r * .26)}L${r1(x)} ${r1(y + r)}L${r1(x - r * .26)} ${r1(y + r * .26)}L${r1(x - r)} ${r1(y)}L${r1(x - r * .26)} ${r1(y - r * .26)}Z`;
const dataCurta = n => new Date(n * DIA).toLocaleDateString('pt-PT', {day: 'numeric', month: 'short', timeZone: 'UTC'}).replace('.', '');

/* ---------- O horizonte da semana ----------
   Céu: o peso, como uma constelação. Terra: as calorias de cada dia, como montes; a linha dourada é a meta.
   Chão: as brasas dos treinos. Cada coluna é um dia e abre o detalhe ao tocar. */
function svgHorizonte(S, W, anim, exp){
  const H = 300, L = 10, R = 10, colW = (W - L - R) / 7, X = i => L + colW * (i + .5);
  const ceu = [30, 86], topoTerra = 112, chao = 222, yBrasa = 240;
  const m = S.metas.kcal, maxK = Math.max(m * 1.42, ...S.dias.map(d => d.kcal)) * 1.04;
  const Y = k => chao - k / maxK * (chao - topoTerra);
  const rnd = semente(S.ini * 7 + 3), out = [];
  const limiar = Math.min(1000, m * .5);

  out.push(`<defs>
    <linearGradient id="hzCeu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#151b2c"/><stop offset=".62" stop-color="#121725"/><stop offset="1" stop-color="#1a2130"/></linearGradient>
    <linearGradient id="hzMonte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#34452a"/><stop offset=".55" stop-color="#1d2620"/><stop offset="1" stop-color="#141921"/></linearGradient>
    <linearGradient id="hzHoje" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#28331f"/><stop offset="1" stop-color="#141921"/></linearGradient>
    <radialGradient id="hzBrasa"><stop offset="0" stop-color="#FFE7B0"/><stop offset=".32" stop-color="#FF9A3C"/><stop offset=".68" stop-color="#EE6A22" stop-opacity=".75"/><stop offset="1" stop-color="#EE6A22" stop-opacity="0"/></radialGradient>
    <radialGradient id="hzEst"><stop offset="0" stop-color="#7AA2F5" stop-opacity=".45"/><stop offset="1" stop-color="#7AA2F5" stop-opacity="0"/></radialGradient>
  </defs>`);
  out.push(`<rect x="0" y="0" width="${W}" height="${chao}" fill="url(#hzCeu)"/>`);
  // Pó de estrelas (decorativo, fixo para cada semana)
  let pó = '';
  for (let i = 0; i < Math.round(W / 12); i++) pó += `<circle cx="${r1(rnd() * W)}" cy="${r1(6 + rnd() * (topoTerra - 4))}" r="${r1(.4 + rnd() * .7)}" opacity="${r1(.12 + rnd() * .3)}"/>`;
  out.push(`<g fill="#cfd8f0" class="hz-po">${pó}</g>`);

  // Meta (faixa de ±10% e linha)
  out.push(`<rect x="${L}" y="${r1(Y(m * 1.1))}" width="${W - L - R}" height="${r1(Y(m * .9) - Y(m * 1.1))}" fill="${COR.ouro}" opacity=".07"/>`);

  // Montes: os mais altos desenham-se primeiro, para os baixos ficarem à frente.
  const montes = S.dias.filter(d => !d.futuro && d.kcal > 0).sort((a, b) => b.kcal - a.kcal);
  for (const d of montes){
    const x = X(d.i), top = Y(d.kcal), h = chao - top, bw = colW * .94, j = semente(d.n)();
    const p = [[x - bw, chao], [x - bw * .56, chao - h * (.3 + j * .12)], [x - bw * .2, top + h * .11], [x, top], [x + bw * .17, top + h * (.08 + j * .06)], [x + bw * .52, chao - h * (.28 + (1 - j) * .1)], [x + bw, chao]];
    const pts = p.map(q => r1(q[0]) + ' ' + r1(q[1])).join(' L');
    const emCurso = d.hoje && S.emCurso && d.kcal < m * .9 && new Date().getHours() < 21;
    const fraco = d.kcal < limiar;
    out.push(`<g class="monte" style="--i:${d.i}"><path d="M${pts}Z" fill="url(#${emCurso ? 'hzHoje' : 'hzMonte'})"/>
      <path d="M${pts}" fill="none" stroke="${COR.comida}" stroke-width="${fraco ? 1.2 : 1.8}" stroke-linejoin="round" stroke-linecap="round"${emCurso || fraco ? ' stroke-dasharray="4 3"' : ''} opacity="${fraco ? .55 : 1}"/></g>`);
  }
  // Dias passados sem registo: um marco vazio no chão.
  for (const d of S.dias) if (!d.futuro && !d.kcal && !d.hoje)
    out.push(`<path d="M${r1(X(d.i) - 7)} ${chao}L${r1(X(d.i))} ${chao - 9}L${r1(X(d.i) + 7)} ${chao}" fill="none" stroke="${COR.bruma}" stroke-width="1.2" stroke-dasharray="2 2"/>`);

  out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(m))}" y2="${r1(Y(m))}" stroke="${COR.ouro}" stroke-width="1.2" opacity=".9"/>`);
  out.push(`<text x="${W - R - 2}" y="${r1(Y(m * 1.1) - 5)}" text-anchor="end" class="hz-meta">meta ${fmtInt(m)} kcal</text>`);

  // Céu: pesagens
  const pg = S.peso.pesagens;
  if (pg.length){
    const vs = pg.map(d => d.peso), mid = (Math.max(...vs) + Math.min(...vs)) / 2, amp = Math.max(1.2, Math.max(...vs) - Math.min(...vs) + .4);
    const YP = v => ceu[1] - ((v - (mid - amp / 2)) / amp) * (ceu[1] - ceu[0]);
    const pts = pg.map(d => [X(d.i), YP(d.peso), d.peso]);
    if (pts.length > 1) out.push(`<path d="M${pts.map(p => r1(p[0]) + ' ' + r1(p[1])).join(' L')}" fill="none" stroke="${COR.peso}" stroke-width="1.1" opacity=".5"/>`);
    out.push(`<g class="hz-est">${pts.map((p, k) => `<circle cx="${r1(p[0])}" cy="${r1(p[1])}" r="11" fill="url(#hzEst)"/><path d="${estrela(p[0], p[1], 6)}" fill="${COR.peso}" style="--k:${k}"/>`).join('')}</g>`);
    const rot = (p, anc, dy) => `<text x="${r1(p[0] + (anc === 'start' ? -4 : anc === 'end' ? 4 : 0))}" y="${r1(p[1] + dy)}" text-anchor="${anc}" class="hz-kg">${fmt1(p[2])}</text>`;
    const a = pts[0], b = pts[pts.length - 1];
    const ancora = p => p[0] - 18 < 0 ? 'start' : p[0] + 18 > W ? 'end' : 'middle';
    out.push(rot(a, ancora(a), a[1] < ceu[0] + 14 ? 20 : -11));
    if (pts.length > 1) out.push(rot(b, ancora(b), b[1] < ceu[0] + 14 ? 20 : -11));
  } else if (!S.futura){
    out.push(`<text x="${W / 2}" y="${(ceu[0] + ceu[1]) / 2 + 4}" text-anchor="middle" class="hz-vazio">Sem pesagens nesta semana</text>`);
  }

  // Chão e brasas dos treinos
  out.push(`<line x1="0" x2="${W}" y1="${chao}" y2="${chao}" stroke="${COR.aresta2}" stroke-width="1"/>`);
  for (const d of S.dias){
    d.treinos.forEach((t, k) => {
      const n = t.itens.reduce((a, it) => a + (it.fase ? 0 : it.series.length), 0), r = 7 + Math.min(5, n / 6);
      const x = X(d.i) + (d.treinos.length > 1 ? (k - (d.treinos.length - 1) / 2) * 16 : 0), sr = semente(t.inicio % 100000);
      let fa = '';
      for (let q = 0; q < 3; q++) fa += `<circle cx="${r1(x - 6 + sr() * 12)}" cy="${r1(yBrasa - r - 3 - sr() * 9)}" r="${r1(.8 + sr() * .7)}" fill="#FF9A3C" opacity="${r1(.5 + sr() * .4)}"/>`;
      out.push(`<g class="brasa" style="--i:${d.i}"><circle cx="${r1(x)}" cy="${yBrasa}" r="${r1(r * 1.9)}" fill="url(#hzBrasa)" opacity=".55"/><circle cx="${r1(x)}" cy="${yBrasa}" r="${r1(r * .62)}" fill="#FFB766"/><circle cx="${r1(x)}" cy="${yBrasa}" r="${r1(r * .3)}" fill="#FFE9C2"/>${fa}</g>`);
    });
  }
  // Rótulos dos dias e zonas de toque
  for (const d of S.dias){
    const x = X(d.i), cls = d.hoje ? 'hz-dia hoje' : d.futuro ? 'hz-dia futuro' : 'hz-dia';
    if (d.hoje) out.push(`<rect x="${r1(x - 15)}" y="258" width="30" height="36" rx="10" fill="#222a3b"/>`);
    out.push(`<text x="${r1(x)}" y="274" text-anchor="middle" class="${cls}">${INICIAIS[d.i]}</text><text x="${r1(x)}" y="289" text-anchor="middle" class="${cls} n">${new Date(d.n * DIA).getUTCDate()}</text>`);
    if (!d.futuro && !exp){
      const t = d.treinos.map(t => `${esc(t.nome || 'Treino')}, ${Math.round((t.fim - t.inicio) / 60000)} min`).join('<br>');
      const html = `<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b>` +
        (d.kcal ? `<span><i class="mk comida"></i>${fmtInt(d.kcal)} kcal de ${fmtInt(m)}, ${fmtInt(d.prot)} g de proteína</span>` : `<span><i class="mk vazio"></i>Sem registo de comida</span>`) +
        (t ? `<span><i class="mk treino"></i>${t}</span>` : '') + (d.peso != null ? `<span><i class="mk peso"></i>${fmt1(d.peso)} kg</span>` : '');
      out.push(`<rect x="${r1(L + colW * d.i)}" y="0" width="${r1(colW)}" height="${H}" fill="transparent" class="hz-toque" data-dica="${dica(html)}" data-acao="dia" data-v="${d.k}" tabindex="0" role="button" aria-label="${DIAS_SEM[d.i]}: ver o dia"/>`);
    }
  }
  const estilo = exp ? '<style>.hz-meta{font:500 11px sans-serif;fill:#A2A8B7}.hz-kg{font:600 11.5px sans-serif;fill:#ECE8DE}.hz-vazio{font:italic 13px serif;fill:#6D7385}.hz-dia{font:600 12px sans-serif;fill:#A2A8B7}.hz-dia.n{font-weight:400;font-size:11px;fill:#6D7385}.hz-dia.hoje{fill:#ECE8DE}.hz-dia.futuro{fill:#474d60}</style>' : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" class="horizonte${anim ? ' anim' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Horizonte da semana: peso no céu, calorias nos montes, treinos no chão">${estilo}${out.join('')}</svg>`;
}

/* ---------- Anel da nota ---------- */
function arco(cx, cy, r, a0, a1){
  const p = a => [cx + r * Math.cos(a), cy + r * Math.sin(a)], [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${r1(x0)} ${r1(y0)}A${r} ${r} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${r1(x1)} ${r1(y1)}`;
}
function svgNota(nota, tam = 176){
  const c = tam / 2, r = c - 10, gap = .11, partes = ['comida', 'treino', 'peso'].filter(k => nota.c[k] != null);
  const tot = partes.reduce((a, k) => a + NOTA_PESOS[k], 0);
  let a = -Math.PI / 2 + gap / 2, out = '';
  for (const k of partes){
    const span = (Math.PI * 2) * NOTA_PESOS[k] / tot - gap, f = clamp(nota.c[k] / 100, 0, 1);
    out += `<path d="${arco(c, c, r, a, a + span)}" stroke="${COR.aresta2}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    if (f > .01) out += `<path class="nota-arco" d="${arco(c, c, r, a, a + Math.max(.02, span * f))}" stroke="${COR[k]}" stroke-width="7" fill="none" stroke-linecap="round"/>`;
    a += span + gap;
  }
  return `<svg class="nota-anel" viewBox="0 0 ${tam} ${tam}" width="${tam}" height="${tam}" aria-hidden="true">${out}</svg>`;
}

/* ---------- Linha do peso ---------- */
function svgPeso(pts, W, H, objetivo){
  // pts: [{n, kg, t}]
  if (pts.length < 2) return '';
  const L = 38, R = 12, T = 14, B = 26;
  const n0 = pts[0].n, n1 = pts[pts.length - 1].n;
  let lo = Math.min(...pts.map(p => Math.min(p.kg, p.t))), hi = Math.max(...pts.map(p => Math.max(p.kg, p.t)));
  const comObj = objetivo && objetivo > lo - 4 && objetivo < hi + 4;
  if (comObj){ lo = Math.min(lo, objetivo); hi = Math.max(hi, objetivo); }
  const pad = Math.max(.4, (hi - lo) * .1); lo -= pad; hi += pad;
  const X = n => L + (n1 === n0 ? .5 : (n - n0) / (n1 - n0)) * (W - L - R), Y = v => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
  const out = [];
  const passo = [.5, 1, 2, 5, 10].find(s => (hi - lo) / s <= 5) || 10;
  for (let v = Math.ceil(lo / passo) * passo; v <= hi; v += passo)
    out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" class="grelha"/><text x="${L - 6}" y="${r1(Y(v) + 4)}" text-anchor="end" class="eixo">${fmt1(v).replace(',0', '')}</text>`);
  const nt = Math.min(5, Math.max(2, Math.floor((W - L - R) / 80)));
  for (let i = 0; i < nt; i++){ const n = Math.round(n0 + (n1 - n0) * i / (nt - 1)); out.push(`<text x="${r1(X(n))}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === nt - 1 ? 'end' : 'middle'}" class="eixo">${dataCurta(n)}</text>`); }
  if (comObj) out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(objetivo))}" y2="${r1(Y(objetivo))}" stroke="${COR.ouro}" stroke-width="1.2" stroke-dasharray="5 4"/><text x="${W - R}" y="${r1(Y(objetivo) - 6)}" text-anchor="end" class="eixo forte">objetivo ${fmt1(objetivo)} kg</text>`);
  out.push(`<g fill="${COR.peso}" opacity=".42">${pts.map(p => `<circle cx="${r1(X(p.n))}" cy="${r1(Y(p.kg))}" r="2.4"/>`).join('')}</g>`);
  out.push(`<path d="M${pts.map(p => r1(X(p.n)) + ' ' + r1(Y(p.t))).join(' L')}" fill="none" stroke="${COR.peso}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>`);
  const u = pts[pts.length - 1];
  out.push(`<circle cx="${r1(X(u.n))}" cy="${r1(Y(u.t))}" r="4.5" fill="${COR.peso}" stroke="#151923" stroke-width="2"/>`);
  const id = 'l' + (++nDica);
  LINHAS.set(id, {pts: pts.map(p => ({x: X(p.n), y: Y(p.t), html: `<b>${dataCurta(p.n)}</b><span><i class="mk peso"></i>Pesagem ${fmt1(p.kg)} kg</span><span><i class="mk linha"></i>Tendência ${fmt1(p.t)} kg</span>`})), W, H, T, B});
  out.push(`<line class="guia" x1="0" x2="0" y1="${T}" y2="${H - B}" hidden/><circle class="guia-pt" r="5" fill="${COR.peso}" stroke="#151923" stroke-width="2" hidden/>`);
  out.push(`<rect x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent" data-linha="${id}"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf" role="img" aria-label="Peso ao longo do tempo: pesagens e tendência">${out.join('')}</svg>`;
}

/* ---------- Barras semanais ---------- */
function svgBarras(itens, W, H, op){
  // itens: [{rot, v, dica, atual}] ; op: {cor, meta, rotMeta, fmt, max}
  const L = 34, R = 10, T = 16, B = 24, n = itens.length;
  if (!n) return '';
  const max = Math.max(op.max || 0, op.meta ? op.meta * 1.15 : 0, ...itens.map(i => i.v || 0)) * 1.06 || 1;
  const banda = (W - L - R) / n, bw = Math.min(22, banda * .64), Y = v => T + (1 - v / max) * (H - T - B);
  const out = [];
  const passo = [1, 2, 5, 10, 20, 50, 100, 200, 250, 500, 1000, 2000, 2500, 5000, 10000, 20000, 50000].find(s => max / s <= 4) || 100000;
  for (let v = 0; v <= max; v += passo) out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" class="grelha"/><text x="${L - 6}" y="${r1(Y(v) + 4)}" text-anchor="end" class="eixo">${op.fmtEixo ? op.fmtEixo(v) : fmtInt(v)}</text>`);
  const salto = Math.ceil(n / Math.max(2, Math.floor((W - L - R) / 46)));
  itens.forEach((it, i) => {
    const x = L + banda * (i + .5), y = Y(it.v || 0), h = H - B - y, cor = it.cor || op.cor;
    if (it.v > 0){
      const rr = Math.min(4, h, bw / 2);
      out.push(`<path d="M${r1(x - bw / 2)} ${H - B}V${r1(y + rr)}Q${r1(x - bw / 2)} ${r1(y)} ${r1(x - bw / 2 + rr)} ${r1(y)}H${r1(x + bw / 2 - rr)}Q${r1(x + bw / 2)} ${r1(y)} ${r1(x + bw / 2)} ${r1(y + rr)}V${H - B}Z" fill="${cor}" opacity="${it.atual ? .55 : 1}"/>`);
    }
    if (i % salto === (n - 1) % salto) out.push(`<text x="${r1(x)}" y="${H - 7}" text-anchor="middle" class="eixo">${esc(it.rot)}</text>`);
    out.push(`<rect x="${r1(L + banda * i)}" y="${T}" width="${r1(banda)}" height="${H - T - B}" fill="transparent" data-dica="${dica(it.dica)}"/>`);
  });
  if (op.meta){
    out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(op.meta))}" y2="${r1(Y(op.meta))}" stroke="${COR.ouro}" stroke-width="1.2"/>`);
    out.push(`<text x="${L + 2}" y="${r1(Y(op.meta) - 5)}" class="eixo forte">${esc(op.rotMeta || 'meta')}</text>`);
  }
  const u = itens[n - 1];
  if (u && u.v > 0) out.push(`<text x="${r1(L + banda * (n - .5))}" y="${r1(Y(u.v) - 6)}" text-anchor="middle" class="valor">${op.fmt ? op.fmt(u.v) : fmtInt(u.v)}</text>`);
  out.push(`<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="${COR.aresta2}"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf" role="img" aria-label="${esc(op.titulo || 'Gráfico de barras')}">${out.join('')}</svg>`;
}

/* ---------- Calendário de constância ---------- */
const RAMPA = ['#1c2230', '#33402a', '#557433', '#7aa53e', '#9AC74B'];
function svgCalendario(ini, nSem, W){
  const T = 18, Lr = 30, gap = 3, cel = Math.max(9, Math.min(17, Math.floor((W - Lr - 4) / nSem) - gap)), passo = cel + gap;
  const H = T + 7 * passo + 4, h = hojeN(), m = IDX.metas, out = [];
  let mesAnt = '', xAnt = -99;
  ['seg', '', 'qua', '', 'sex', '', 'dom'].forEach((t, i) => t && out.push(`<text x="0" y="${r1(T + i * passo + cel - 2)}" class="eixo">${t}</text>`));
  for (let s = 0; s < nSem; s++){
    const n0 = ini + s * 7, x = Lr + s * passo, mes = new Date(n0 * DIA).toLocaleDateString('pt-PT', {month: 'short', timeZone: 'UTC'}).replace('.', '');
    if (mes !== mesAnt && s < nSem - 1){ if (x - xAnt >= 30){ out.push(`<text x="${x}" y="11" class="eixo">${mes}</text>`); xAnt = x; } mesAnt = mes; }
    for (let i = 0; i < 7; i++){
      const n = n0 + i; if (n > h) continue;
      const k = chaveDe(n), c = IDX.dias.get(k), tr = IDX.treinosDia.get(k) || [];
      let nv = 0;
      if (c && c.kcal > 0){
        const dk = Math.abs(c.kcal - m.kcal) / m.kcal;
        nv = c.kcal < Math.min(1000, m.kcal * .5) ? 1 : dk <= .1 ? (c.prot >= m.prot * .9 ? 4 : 3) : dk <= .2 ? 2 : 1;
      }
      const y = T + i * passo;
      const html = `<b>${DIAS_SEM[i]}, ${dataCurta(n)}</b>` + (c ? `<span><i class="mk comida"></i>${fmtInt(c.kcal)} kcal, ${fmtInt(c.prot)} g de proteína</span>` : `<span><i class="mk vazio"></i>Sem registo</span>`) + (tr.length ? `<span><i class="mk treino"></i>${tr.map(t => esc(t.nome || 'Treino')).join(', ')}</span>` : '');
      out.push(`<rect x="${x}" y="${y}" width="${cel}" height="${cel}" rx="3" fill="${RAMPA[nv]}"${n === h ? ` stroke="${COR.luar}" stroke-width="1.2"` : ''} data-dica="${dica(html)}" data-acao="dia" data-v="${k}"/>`);
      if (tr.length) out.push(`<circle cx="${r1(x + cel / 2)}" cy="${r1(y + cel / 2)}" r="${r1(Math.max(2, cel * .17))}" fill="${COR.treino}" stroke="${RAMPA[nv]}" stroke-width="1.5" pointer-events="none"/>`);
    }
  }
  const Wf = Lr + nSem * passo;
  return `<svg viewBox="0 0 ${Wf} ${H}" width="${Wf}" height="${H}" class="graf cal" role="img" aria-label="Calendário: cada quadrado é um dia">${out.join('')}</svg>`;
}

/* ---------- Mini-linha (progressão de um exercício) ---------- */
function svgMini(vals, W, H, cor){
  if (vals.length < 2) return '';
  const lo = Math.min(...vals), hi = Math.max(...vals), amp = hi - lo || 1, X = i => 3 + i / (vals.length - 1) * (W - 6), Y = v => 4 + (1 - (v - lo) / amp) * (H - 8);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" aria-hidden="true"><path d="M${vals.map((v, i) => r1(X(i)) + ' ' + r1(Y(v))).join(' L')}" fill="none" stroke="${cor}" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/><circle cx="${r1(X(vals.length - 1))}" cy="${r1(Y(vals[vals.length - 1]))}" r="3.5" fill="${cor}" stroke="#151923" stroke-width="2"/></svg>`;
}

/* ---------- Mapa muscular (formas da Forja) ---------- */
const nivelSeries = s => s <= 0 ? 0 : s < 3 ? 1 : s < 6 ? 2 : s < 10 ? 3 : s < 16 ? 4 : 5;
function svgCorpo(musc){
  const nv = {}; for (const k of Object.keys(MUSC)) nv[k] = nivelSeries(musc[k] || 0);
  return corpoSVG(nv, {acao: 'musc', anim: false});
}
