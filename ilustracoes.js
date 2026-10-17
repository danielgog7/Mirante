'use strict';
/* Mirante — ilustrações que mostram números: o jarro de água, a balança da semana, o trilho até ao cume,
   a peça da semana (com as formas da Forja) e o vigia. Tudo em SVG, no traço noturno do resto da app. */

const fx = v => (Math.round(v * 10) / 10).toString();

/* ---------- Jarro de água: enche até à média diária; cheio = meta ---------- */
function svgJarro(frac, anim){
  const f = clamp(frac || 0, 0, 1.06), topo = 24, fundo = 104, y = fundo - f * (fundo - topo), h = fundo - y;
  const corpo = 'M15 16Q38 11.5 61 16L63 24Q68 62 63 98Q62 108 51 108L25 108Q14 108 13 98Q8 62 13 24Z';
  const dentro = 'M17.6 19Q38 15 58.4 19L60 25.6Q64.6 62 60.4 97.4Q59.5 105.3 50.6 105.3L25.4 105.3Q16.5 105.3 15.6 97.4Q11.4 62 16 25.6Z';
  const onda = (yy, a) => `M-40 ${fx(yy)}q9.5 ${-a} 19 0t19 0t19 0t19 0t19 0t19 0t19 0t19 0V120H-40Z`;
  const bolhas = f > .08 ? [[30, 0], [44, 1.3], [37, 2.4]].map(([x, d]) => `<circle class="ja-bolha" cx="${x}" cy="${fundo - 4}" r="${1.1 + d * .25}" style="animation-delay:${d}s"/>`).join('') : '';
  return `<svg class="jarro${anim ? ' anim' : ''}" viewBox="0 0 86 116" aria-hidden="true">
    <defs><clipPath id="jaClip"><path d="${dentro}"/></clipPath>
      <linearGradient id="jaAgua" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fd8ff" stop-opacity=".9"/><stop offset="1" stop-color="#1c5d8a" stop-opacity=".95"/></linearGradient>
      <linearGradient id="jaVidro" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#c8d8f5" stop-opacity=".16"/><stop offset=".5" stop-color="#c8d8f5" stop-opacity=".04"/><stop offset="1" stop-color="#c8d8f5" stop-opacity=".12"/></linearGradient></defs>
    <path d="M61.5 31C83 30 86 72 63.5 82" fill="none" stroke="rgba(190,210,245,.42)" stroke-width="4.2" stroke-linecap="round"/>
    <path d="M61.5 31C79 31 81 70 63.5 78" fill="none" stroke="rgba(15,18,26,.65)" stroke-width="1.4" stroke-linecap="round"/>
    <path d="${corpo}" fill="url(#jaVidro)"/>
    <g clip-path="url(#jaClip)">
      <g class="ja-nivel" style="--h:${fx(h)}px">
        ${f > 0 ? `<g class="ja-onda tras"><path d="${onda(y - 1, 2.6)}" fill="#4FC3F7" opacity=".45"/></g>
        <g class="ja-onda"><path d="${onda(y + 1, 3.2)}" fill="url(#jaAgua)"/></g>
        <path d="M-40 ${fx(y + 1.2)}H120" stroke="#d6f3ff" stroke-width=".8" opacity=".5"/>` : ''}
        ${bolhas}
      </g>
      <path d="M10 ${topo}H70" stroke="${COR.ouro}" stroke-width="1.1" stroke-dasharray="3 3" opacity=".9"/>
    </g>
    <path d="${corpo}" fill="none" stroke="rgba(190,210,245,.55)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M15 16L9 10.5L16.5 21" fill="none" stroke="rgba(190,210,245,.55)" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M20 32Q17 62 20 92" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" opacity=".16"/>
    <path d="M${fx(66)} ${topo}h6" stroke="${COR.ouro}" stroke-width="1.6" stroke-linecap="round"/>
  </svg>`;
}

/* ---------- A balança da semana: constelação da Balança, com pratos, correntes e fiel ---------- */
function svgBalanca(B, W, anim){
  const H = 244, cx = W / 2, py = 72, half = Math.min(W * .37, 150), out = [];
  const ang = B.ing == null ? 0 : -clamp(B.dif / 600, -1, 1) * 15;   // graus; positivo = desce à direita (gastas mais)
  const sr = semente(7);
  // Constelação de fundo (decorativa): as estrelas da Balança, ligadas por linhas ténues
  const lib = [[.12, .2], [.27, .1], [.47, .16], [.71, .08], [.88, .22], [.66, .34]].map(([a, b]) => [a * W, b * H + 6]);
  out.push(lib.map(p => `<circle cx="${fx(p[0])}" cy="${fx(p[1])}" r="${fx(.8 + sr() * .8)}" fill="#cfd8f0" opacity=".45"/>`).join(''));
  // Coluna e base
  out.push(`<ellipse cx="${fx(cx)}" cy="${H - 22}" rx="58" ry="8" fill="url(#baChao)"/>`);
  out.push(`<path d="M${fx(cx - 34)} ${H - 22}Q${fx(cx)} ${H - 36} ${fx(cx + 34)} ${H - 22}" fill="#1c2232" stroke="#B4C4EC" stroke-opacity=".5" stroke-width="1"/>`);
  out.push(`<path d="M${fx(cx - 2.2)} ${H - 30}L${fx(cx - 1.4)} ${py + 8}H${fx(cx + 1.4)}L${fx(cx + 2.2)} ${H - 30}Z" fill="url(#baColuna)"/>`);
  [.32, .55, .78].forEach(t => out.push(`<circle cx="${fx(cx)}" cy="${fx(py + 8 + (H - 38 - py) * t)}" r="1.6" fill="#B4C4EC" opacity=".6"/>`));
  // Mostrador do fiel
  const rD = 54, tique = a => { const r = a * Math.PI / 180; return [cx + rD * Math.sin(r), py - rD * Math.cos(r)]; };
  out.push(`<path d="${(() => { const [x0, y0] = tique(-24), [x1, y1] = tique(24); return `M${fx(x0)} ${fx(y0)}A${rD} ${rD} 0 0 1 ${fx(x1)} ${fx(y1)}`; })()}" fill="none" stroke="#B4C4EC" stroke-opacity=".35" stroke-width="1"/>`);
  for (const a of [-20, -15, -10, -5, 0, 5, 10, 15, 20]){
    const r = a * Math.PI / 180, l = a === 0 ? 7 : a % 10 === 0 ? 5 : 3;
    out.push(`<path d="M${fx(cx + rD * Math.sin(r))} ${fx(py - rD * Math.cos(r))}L${fx(cx + (rD - l) * Math.sin(r))} ${fx(py - (rD - l) * Math.cos(r))}" stroke="${a === 0 ? COR.ouro : '#B4C4EC'}" stroke-opacity="${a === 0 ? .9 : .5}" stroke-width="1"/>`);
  }
  const [lx, ly] = tique(-22), [rx, ry] = tique(22);
  out.push(`<text x="${fx(lx - 6)}" y="${fx(ly - 2)}" text-anchor="end" class="bal-rot">excedente</text><text x="${fx(rx + 6)}" y="${fx(ry - 2)}" class="bal-rot">défice</text>`);
  // Braço, fiel e pratos (rodam juntos; os pratos mantêm-se na vertical)
  const prato = (x, lado) => {
    const y0 = py + 78, cor = lado === 'e' ? COR.comida : COR.peso, n = lado === 'e' ? B.ing : B.gasto;
    const qtd = n == null ? 0 : clamp(Math.round(n / 220), 3, 14);
    let carga = '';
    const filas = [5, 4, 3, 2];
    let k = 0;
    filas.forEach((m, fi) => { for (let j = 0; j < m && k < qtd; j++, k++){ const xx = x + (j - (m - 1) / 2) * 9, yy = y0 - 4 - fi * 7;
      carga += lado === 'e' ? `<circle cx="${fx(xx)}" cy="${fx(yy)}" r="3.4" fill="url(#baGrao)"/>` : `<path d="${estrela(xx, yy, 4.6)}" fill="${COR.peso}" opacity=".95"/>`; } });
    return `<g class="bal-prato" style="transform-origin:${fx(x)}px ${py}px">
      <path d="M${fx(x)} ${py}L${fx(x - 36)} ${y0}M${fx(x)} ${py}L${fx(x + 36)} ${y0}M${fx(x)} ${py}L${fx(x)} ${y0 - 2}" stroke="#B4C4EC" stroke-opacity=".55" stroke-width="1" stroke-dasharray="1.5 2.6" stroke-linecap="round"/>
      <ellipse cx="${fx(x)}" cy="${y0 - 6}" rx="26" ry="10" fill="${cor}" opacity=".12"/>
      ${carga}
      <path d="M${fx(x - 40)} ${y0}Q${fx(x)} ${y0 + 30} ${fx(x + 40)} ${y0}Z" fill="url(#baPrato)"/>
      <path d="M${fx(x - 40)} ${y0}H${fx(x + 40)}" stroke="${cor}" stroke-width="1.6" stroke-linecap="round"/>
      <path d="M${fx(x - 30)} ${y0 + 9}Q${fx(x)} ${y0 + 22} ${fx(x + 30)} ${y0 + 9}" fill="none" stroke="#B4C4EC" stroke-opacity=".25" stroke-width=".8"/>
      <circle cx="${fx(x)}" cy="${py}" r="2.4" fill="#cfd8f0"/></g>`;
  };
  out.push(`<g class="bal-braco" style="--af:${fx(ang)}deg;--a:${fx(ang)}deg;transform-origin:${fx(cx)}px ${py}px">
    <path d="M${fx(cx)} ${py}L${fx(cx)} ${py - 38}" stroke="${COR.ouro}" stroke-width="1.8" stroke-linecap="round"/>
    <path d="${estrela(cx, py - 40, 4)}" fill="${COR.ouro}"/>
    <path d="M${fx(cx - half)} ${py}L${fx(cx + half)} ${py}" stroke="url(#baBraco)" stroke-width="2.4" stroke-linecap="round"/>
    ${prato(cx - half, 'e')}${prato(cx + half, 'd')}</g>`);
  out.push(`<circle cx="${fx(cx)}" cy="${py}" r="14" fill="url(#baBrilho)"/><path d="${estrela(cx, py, 7.5)}" fill="${COR.ouro}"/>`);
  return `<svg class="balanca${anim && window.CSS && CSS.registerProperty ? ' anim' : ''}" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="Balança: o que comeste contra o que gastas">
    <defs><radialGradient id="baBrilho"><stop offset="0" stop-color="#E6CC93" stop-opacity=".55"/><stop offset="1" stop-color="#E6CC93" stop-opacity="0"/></radialGradient>
      <radialGradient id="baChao"><stop offset="0" stop-color="#7AA2F5" stop-opacity=".18"/><stop offset="1" stop-color="#7AA2F5" stop-opacity="0"/></radialGradient>
      <radialGradient id="baGrao" cx="40%" cy="35%"><stop offset="0" stop-color="#E4FFAE"/><stop offset=".6" stop-color="${COR.comida}"/><stop offset="1" stop-color="#4d6a22"/></radialGradient>
      <linearGradient id="baColuna" x1="0" x2="1"><stop offset="0" stop-color="#5a6684"/><stop offset=".5" stop-color="#c4d0ee"/><stop offset="1" stop-color="#5a6684"/></linearGradient>
      <linearGradient id="baBraco" gradientUnits="userSpaceOnUse" x1="${fx(cx - half)}" y1="0" x2="${fx(cx + half)}" y2="0"><stop offset="0" stop-color="#8d9bc0"/><stop offset=".5" stop-color="#e6ecfa"/><stop offset="1" stop-color="#8d9bc0"/></linearGradient>
      <linearGradient id="baPrato" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a3246"/><stop offset="1" stop-color="#121722"/></linearGradient></defs>
    ${out.join('')}</svg>`;
}

/* ---------- O trilho até ao cume ----------
   Tempo na horizontal, percentagem do caminho na altura. O trilho percorrido é a tendência real do peso;
   a linha pontilhada é a projeção pelo ritmo atual; as curvas de nível marcam 25, 50 e 75% do caminho. */
function svgTrilho(C, W, anim){
  const H = W < 560 ? 300 : 340, L = 50, R = 24, T = 52, B = 42, base = H - B, out = [];
  const rnd = semente(31);
  const defs = `<defs>
    <linearGradient id="trCeu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#18203a"/><stop offset="1" stop-color="#121725"/></linearGradient>
    <linearGradient id="trMonte" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26304a"/><stop offset=".5" stop-color="#1a2133"/><stop offset="1" stop-color="#11151f"/></linearGradient>
    <linearGradient id="trLonge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1b2236"/><stop offset="1" stop-color="#141927"/></linearGradient>
    <radialGradient id="trLuz"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".75"/><stop offset=".35" stop-color="#E6CC93" stop-opacity=".25"/><stop offset="1" stop-color="#E6CC93" stop-opacity="0"/></radialGradient>
    <linearGradient id="trFeixe" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#FFF4D8" stop-opacity=".5"/><stop offset="1" stop-color="#FFF4D8" stop-opacity="0"/></linearGradient>
    <filter id="trBlur" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3"/></filter>
  </defs>`;
  out.push(`<rect width="${W}" height="${H}" fill="url(#trCeu)"/>`);
  let po = ''; for (let i = 0; i < Math.round(W / 9); i++) po += `<circle cx="${fx(rnd() * W)}" cy="${fx(rnd() * (H * .55))}" r="${fx(.4 + rnd() * .7)}" opacity="${fx(.12 + rnd() * .35)}"/>`;
  out.push(`<g fill="#cfd8f0">${po}</g>`);
  const serra = (yb, amp, passo, fill) => { let y = yb, d = `M-5 ${H}L-5 ${yb}`; for (let x = 0; x <= W + passo; x += passo){ y = clamp(y + (rnd() - .5) * amp, yb - amp * 1.4, yb + amp * .5); d += `L${fx(x)} ${fx(y)}`; } return `<path d="${d}L${W + 5} ${H}Z" fill="${fill}"/>`; };

  if (C.vazio){
    // Sem objetivo: a montanha à espera de um cume
    out.push(serra(H * .55, 26, 40, 'url(#trLonge)'));
    const xs = W * .68, ys = T + 6;
    out.push(`<path d="M-5 ${H}L${fx(W * .12)} ${fx(base - 10)}L${fx(W * .36)} ${fx(H * .55)}L${fx(W * .5)} ${fx(H * .48)}L${fx(xs)} ${ys}L${fx(W * .84)} ${fx(H * .42)}L${W + 5} ${fx(H * .6)}L${W + 5} ${H}Z" fill="url(#trMonte)" stroke="#B4C4EC" stroke-opacity=".3" stroke-width="1"/>`);
    out.push(`<path d="M${fx(xs)} ${ys}V${ys - 26}" stroke="${COR.luar}" stroke-width="1.4"/><path class="tr-bandeira" style="transform-origin:${fx(xs)}px ${ys - 26}px" d="M${fx(xs)} ${ys - 26}Q${fx(xs + 9)} ${ys - 24} ${fx(xs + 17)} ${ys - 20}Q${fx(xs + 9)} ${ys - 17} ${fx(xs)} ${ys - 15}Z" fill="${COR.ouro}" opacity=".5"/>`);
    out.push(`<text x="${fx(xs + 22)}" y="${ys - 16}" class="tr-rot forte">?</text>`);
    return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf trilho" role="img" aria-label="Montanha sem objetivo definido">${defs}${out.join('')}</svg>`;
  }

  const h = hojeN(), nFim = C.eta && !C.chegou ? C.eta : Math.max(h + 21, h + (h - C.n0) * .35);
  const xMax = W - R - 34, X = n => L + (n - C.n0) / Math.max(1, nFim - C.n0) * (xMax - L);
  const pMin = Math.min(0, ...C.pts.map(p => p.p)), Y = p => base - (clamp(p, pMin, 1.06) - pMin) / (1.06 - pMin) * (base - T);
  const xS = X(nFim), yS = Y(1), u = C.u, ux = X(u.n), uy = Y(u.p);
  // Serras ao longe
  out.push(serra(H * .5, 22, 34, 'url(#trLonge)'));
  // Montanha principal: a crista sobe ligeiramente acima do trilho e da projeção até ao cume
  const crista = [];
  const passos = 28;
  for (let i = 0; i <= passos; i++){
    const t = i / passos, n = C.n0 + (nFim - C.n0) * t;
    let p;
    if (n <= u.n){ let a = C.pts[0]; for (const q of C.pts){ if (q.n > n) break; a = q; } p = a.p; }
    else p = u.p + (1 - u.p) * (n - u.n) / Math.max(1, nFim - u.n);
    crista.push([X(n), Math.min(Y(p) - 16 - rnd() * 9, base - 18)]);
  }
  crista[crista.length - 1] = [xS, yS];
  const dir = [[xS + 12, yS + 14], [xS + 22, yS + 10], [xS + 36, yS + 34], [xS + 52, yS + 30], [W + 5, Math.min(base, yS + 110)]];
  const monte = `M-5 ${H}L-5 ${fx(Math.min(base - 6, crista[0][1] + 10))}L${crista.map(p => fx(p[0]) + ' ' + fx(p[1])).join('L')}L${dir.map(p => fx(p[0]) + ' ' + fx(p[1])).join('L')}L${W + 5} ${H}Z`;
  out.push(`<clipPath id="trClip"><path d="${monte}"/></clipPath>`);
  out.push(`<path d="${monte}" fill="url(#trMonte)"/>`);
  out.push(`<path d="M${crista.map(p => fx(p[0]) + ' ' + fx(p[1])).join('L')}L${dir.map(p => fx(p[0]) + ' ' + fx(p[1])).join('L')}" fill="none" stroke="#B4C4EC" stroke-opacity=".38" stroke-width="1.1" stroke-linejoin="round"/>`);
  // Neve no cume
  out.push(`<path d="M${fx(xS - 15)} ${fx(yS + 15)}L${fx(xS - 6)} ${fx(yS + 7)}L${fx(xS)} ${fx(yS)}L${fx(xS + 12)} ${fx(yS + 14)}L${fx(xS + 8)} ${fx(yS + 16)}L${fx(xS + 1)} ${fx(yS + 12)}L${fx(xS - 6)} ${fx(yS + 17)}Z" fill="#e6ecfa" opacity=".85"/>`);
  // Curvas de nível: 25, 50 e 75% do caminho (acampamentos)
  out.push(`<g clip-path="url(#trClip)">${C.campos.map(c => `<path d="M0 ${fx(Y(c.q))}H${W}" stroke="#B4C4EC" stroke-opacity=".2" stroke-width="1" stroke-dasharray="3 4"/>`).join('')}</g>`);
  // Eixo: quilos à esquerda
  out.push(`<text x="${L - 8}" y="${fx(Y(0) + 4)}" text-anchor="end" class="tr-rot">${fmt1(C.k0)}</text>`);
  out.push(`<text x="${L - 8}" y="${fx(yS + 4)}" text-anchor="end" class="tr-rot forte">${fmt1(C.obj)}</text>`);
  C.campos.forEach(c => out.push(`<text x="${L - 8}" y="${fx(Y(c.q) + 4)}" text-anchor="end" class="tr-rot">${fmt1(c.kg)}</text>`));
  out.push(`<text x="${L - 8}" y="${T - 22}" text-anchor="end" class="tr-rot">kg</text>`);
  // Projeção até ao cume
  if (!C.chegou && C.eta) out.push(`<path class="tr-proj" d="M${fx(ux)} ${fx(uy)}L${fx(xS)} ${fx(yS)}" stroke="${COR.peso}" stroke-width="2" stroke-dasharray="1 6" stroke-linecap="round" opacity=".75"/>`);
  // Trilho percorrido
  const tp = C.pts.map(p => fx(X(p.n)) + ' ' + fx(Y(p.p))).join('L');
  out.push(`<path d="M${tp}" fill="none" stroke="${COR.peso}" stroke-width="7" opacity=".28" filter="url(#trBlur)"/>`);
  out.push(`<path class="tr-feito" pathLength="1" d="M${tp}" fill="none" stroke="${COR.peso}" stroke-width="2.6" stroke-linejoin="round" stroke-linecap="round"/>`);
  // Pegadas: uma por semana
  for (let n = segundaDe(C.n0) + 7; n < u.n; n += 7){ let a = C.pts[0]; for (const q of C.pts){ if (q.n > n) break; a = q; } out.push(`<circle class="tr-pegada" cx="${fx(X(n))}" cy="${fx(Y(a.p))}" r="2.2" fill="#dbe6ff"/>`); }
  // Acampamentos: tenda cheia se já lá chegaste, contorno se ainda é previsão
  const tenda = (x, y, feito) => `<path d="M${fx(x - 6)} ${fx(y)}L${fx(x)} ${fx(y - 9)}L${fx(x + 6)} ${fx(y)}Z" fill="${feito ? COR.ouro : 'none'}" stroke="${COR.ouro}" stroke-width="1.2" stroke-linejoin="round"${feito ? '' : ' opacity=".8"'}/><path d="M${fx(x)} ${fx(y - 9)}V${fx(y)}" stroke="${feito ? '#3a2e16' : COR.ouro}" stroke-width=".9"/>`;
  C.campos.forEach(c => {
    let x = null; const y = Y(c.q);
    if (c.feito && c.n != null) x = X(c.n);
    else if (C.eta && !C.chegou && uy !== yS) x = ux + (xS - ux) * (uy - y) / (uy - yS);
    if (x != null && x > L && x < W - R) out.push(`<g class="tr-campo">${tenda(x, y - 2, c.feito)}</g>`);
  });
  // Partida: um marco de pedras
  const x0 = X(C.n0), y0 = Y(0);
  out.push(`<path d="M${fx(x0 - 5)} ${fx(y0 + 1)}h10l-2-3.5h-6zM${fx(x0 - 3.5)} ${fx(y0 - 2.5)}h7l-1.6-3.2h-3.8zM${fx(x0 - 2)} ${fx(y0 - 5.7)}h4l-2-3z" fill="#9aa6c4"/>`);
  // Bandeira no cume
  out.push(`<path d="M${fx(xS)} ${fx(yS)}V${fx(yS - 28)}" stroke="${COR.luar}" stroke-width="1.5" stroke-linecap="round"/>
    <path class="tr-bandeira" style="transform-origin:${fx(xS)}px ${fx(yS - 28)}px" d="M${fx(xS)} ${fx(yS - 28)}Q${fx(xS + 9)} ${fx(yS - 26)} ${fx(xS + 18)} ${fx(yS - 22)}Q${fx(xS + 9)} ${fx(yS - 19)} ${fx(xS)} ${fx(yS - 16)}Z" fill="${COR.ouro}"/>`);
  out.push(`<text x="${fx(xS - 6)}" y="${fx(yS - 34)}" text-anchor="${xS > W - 70 ? 'end' : 'middle'}" class="tr-rot forte">${fmt1(C.obj)} kg</text>`);
  // Caminhante com lanterna, onde estás hoje
  const cx = C.chegou ? xS - 8 : ux, cy = C.chegou ? yS : uy;
  out.push(`<g class="tr-cam" transform="translate(${fx(cx)} ${fx(cy)})">
    <circle r="22" fill="url(#trLuz)"/>
    <path d="M2.6 -15.5L22 -24L22 -9Z" fill="url(#trFeixe)" opacity=".7"/>
    <g fill="none" stroke="${COR.luar}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
      <path d="M0 -11.5L-1 -5.2M-1 -5.2L-4.2 0M-1 -5.2L2.2 0M-0.2 -9.6L3.6 -7.4M3.6 -7.4L5 0.4"/></g>
    <rect x="-4.6" y="-12" width="3.4" height="5.2" rx="1.2" fill="${COR.luar}" opacity=".85"/>
    <circle cy="-14.2" r="2.5" fill="${COR.luar}"/><circle cx="2" cy="-15.2" r="1.1" fill="#FFF4D8"/></g>`);
  // Datas por baixo
  const dt = n => dataCurta(Math.round(n));
  out.push(`<text x="${fx(Math.max(x0, L))}" y="${H - 14}" class="tr-rot">${dt(C.n0)}</text>`);
  if (!C.chegou && ux - x0 > 60 && xS - ux > 50) out.push(`<text x="${fx(ux)}" y="${H - 14}" text-anchor="middle" class="tr-rot forte">hoje</text>`);
  if (C.eta && !C.chegou) out.push(`<text x="${fx(xS)}" y="${H - 14}" text-anchor="end" class="tr-rot forte">${dt(C.eta)}</text>`);
  // Toque: data, tendência e percentagem
  const id = 'l' + (++nDica);
  LINHAS.set(id, {W, H, pts: C.pts.map(p => ({x: X(p.n), y: Y(p.p), html: `<b>${p.partida ? 'Partida, ' : ''}${dataCurta(p.n)}</b><span><i class="mk linha"></i>Tendência ${fmt1(p.t)} kg</span><span><i class="mk peso"></i>${fmtInt(clamp(p.p, -9, 9) * 100)}% do caminho</span>`}))});
  out.push(`<line class="guia" x1="0" x2="0" y1="${T - 10}" y2="${base}" hidden/><circle class="guia-pt" r="5" fill="${COR.peso}" stroke="#151923" stroke-width="2" hidden/>`);
  out.push(`<rect x="${L}" y="0" width="${W - L - R}" height="${H}" fill="transparent" data-linha="${id}"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf trilho${anim ? ' anim' : ''}" role="img" aria-label="Caminho até ao peso-objetivo: ${fmtInt(C.pct * 100)}% feito">${defs}${out.join('')}</svg>`;
}

/* ---------- A peça da semana (as formas da Forja): cada treino molda o ferro até virar lâmina ---------- */
const PF_BARRA = [[160, 184], [164, 184], [166, 184], [168, 184], [170, 184], [246, 184], [252, 189], [246, 194], [170, 194], [168, 194], [166, 194], [164, 194], [160, 194]];
const PF_LAMINA = [[112, 186], [140, 186], [140, 177], [147, 177], [147, 184], [285, 184], [312, 189], [285, 194], [147, 194], [147, 201], [140, 201], [140, 192], [112, 192]];
const PF_BIGORNA = 'M44 204.5Q80 197 118 194.5L146 194.5L146 189.5L326 189.5Q333 190 329 196.5L330 205Q329 211 320 213Q290 217 276 224Q262 232 262 246Q263 254 272 258L300 262Q306 264 306 270L306 273L280 273Q270 266 248 265L176 265Q154 266 144 273L118 273L118 270Q118 264 124 262L152 258Q161 254 162 246Q162 232 150 224Q136 216 112 213Q78 211 46 206.5Q43 205.8 44 204.5Z';
const lerpPF = (a, b, f) => a + (b - a) * f;
function svgPeca(f){
  f = clamp(f, 0, 1);
  const forma = 'M' + PF_BARRA.map((p, i) => fx(lerpPF(p[0], PF_LAMINA[i][0], f)) + ' ' + fx(lerpPF(p[1], PF_LAMINA[i][1], f))).join(' L') + ' Z';
  const cx = lerpPF(206, 212, f), meia = lerpPF(40, 92, f), pronta = f >= 1;
  const faiscas = [[cx - meia * .6, 170, 1.2, 0], [cx - 8, 162, 1, .7], [cx + meia * .4, 167, 1.3, 1.3], [cx + 22, 156, .9, .4], [cx - meia * .9, 176, .9, 1]]
    .map(([x, y, r, d]) => `<circle class="pf-faisca" cx="${fx(x)}" cy="${y}" r="${r}" fill="#FFB766" style="animation-delay:${d}s"/>`).join('');
  return `<svg class="peca${pronta ? ' pronta' : ''}" viewBox="34 138 312 142" aria-label="${pronta ? 'Lâmina forjada' : 'Ferro em brasa sobre a bigorna'}" role="img">
    <defs>
      <linearGradient id="pfMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e4"/><stop offset=".25" stop-color="#ffe08f"/><stop offset=".55" stop-color="#ffa13c"/><stop offset=".8" stop-color="#e2541b"/><stop offset="1" stop-color="#8a2208"/></linearGradient>
      <linearGradient id="pfPontas" x1="0" x2="1"><stop offset="0" stop-color="#6a1405" stop-opacity=".9"/><stop offset=".28" stop-color="#6a1405" stop-opacity="0"/><stop offset=".72" stop-color="#6a1405" stop-opacity="0"/><stop offset="1" stop-color="#6a1405" stop-opacity=".9"/></linearGradient>
      <linearGradient id="pfCorpo" x1="0" y1="196" x2="0" y2="273" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#4a4550"/><stop offset=".2" stop-color="#2b2a33"/><stop offset=".6" stop-color="#191a22"/><stop offset="1" stop-color="#0d0e14"/></linearGradient>
      <linearGradient id="pfFace" x1="140" y1="0" x2="330" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#6e6c78"/><stop offset=".45" stop-color="#cfd2de"/><stop offset=".62" stop-color="#9a9cab"/><stop offset="1" stop-color="#4d4c57"/></linearGradient>
      <linearGradient id="pfCalor" x1="40" y1="0" x2="250" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".4"/><stop offset=".4" stop-color="#ff7a2a" stop-opacity=".12"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></linearGradient>
      <radialGradient id="pfBrilho"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
      <filter id="pfB3" x="-30%" y="-80%" width="160%" height="260%"><feGaussianBlur stdDeviation="3"/></filter>
      <linearGradient id="pfRisco" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".5" stop-color="#fff" stop-opacity=".95"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="pfClip"><path d="${forma}"/></clipPath>
    </defs>
    <ellipse cx="${fx(cx)}" cy="190" rx="${fx(meia + 60)}" ry="38" fill="url(#pfBrilho)"/>
    <path d="${PF_BIGORNA}" fill="url(#pfCorpo)" stroke="#07080c" stroke-width="1"/>
    <path d="${PF_BIGORNA}" fill="url(#pfCalor)"/>
    <path d="M146 189.5L326 189.5Q333 190 329 196.5L146 196.5Z" fill="url(#pfFace)"/>
    <path d="M118 194.5L146 194.5L146 196.5L116 197Z" fill="#6b6060"/>
    <ellipse cx="${fx(cx)}" cy="193" rx="${fx(meia + 24)}" ry="4.5" fill="#ffb255" opacity=".7" filter="url(#pfB3)"/>
    <path class="pf-calor" d="${forma}" fill="#ff9a3c" filter="url(#pfB3)" opacity=".9"/>
    <path d="${forma}" fill="url(#pfMetal)"/>
    <path d="${forma}" fill="url(#pfPontas)"/>
    <ellipse cx="${fx(cx + 4)}" cy="187" rx="${fx(meia * .66)}" ry="2" fill="#fffdf2" opacity=".9"/>
    ${pronta ? `<g clip-path="url(#pfClip)"><rect class="pf-risco" x="90" y="170" width="40" height="40" fill="url(#pfRisco)" transform="skewX(-25)"/></g>` : ''}
    ${faiscas}
  </svg>`;
}

/* ---------- O vigia: uma coruja num ramo, com a lua por trás ---------- */
function svgCoruja(){
  const olho = x => `<g transform="translate(${x} 40)"><clipPath id="cuC${x}"><circle r="8.6"/></clipPath>
    <circle r="9.6" fill="#1a1f2d"/><circle r="8.6" fill="url(#cuOlho)"/>
    <g class="cu-pupila"><circle r="4.3" fill="#0b0d14"/><circle cx="-2" cy="-2.3" r="1.5" fill="#fff"/></g>
    <g clip-path="url(#cuC${x})"><rect class="cu-palpebra" x="-10" y="-10" width="20" height="20" fill="#2f3851"/></g></g>`;
  const penas = [];
  for (let r = 0; r < 4; r++) for (let i = 0; i < 4 - (r === 3 ? 1 : 0); i++){ const x = 38.5 + i * 7 + (r % 2 ? 3.5 : 0) - (r === 3 ? -3.5 : 0), y = 70 + r * 8; penas.push(`<path d="M${x} ${y}q3.5 3.4 7 0" fill="none" stroke="#56627f" stroke-width="1" stroke-linecap="round" opacity=".7"/>`); }
  return `<svg class="coruja" viewBox="0 0 118 124" role="img" aria-label="O vigia, uma coruja">
    <defs>
      <radialGradient id="cuCorpo" cx="50%" cy="32%" r="72%"><stop offset="0" stop-color="#46526f"/><stop offset=".55" stop-color="#2a3247"/><stop offset="1" stop-color="#171c29"/></radialGradient>
      <radialGradient id="cuDisco" cx="50%" cy="45%" r="60%"><stop offset="0" stop-color="#65728f"/><stop offset="1" stop-color="#39425b"/></radialGradient>
      <radialGradient id="cuOlho" cx="42%" cy="38%" r="62%"><stop offset="0" stop-color="#FFEDB8"/><stop offset=".55" stop-color="#E8BA5C"/><stop offset="1" stop-color="#9a6c20"/></radialGradient>
      <radialGradient id="cuLua"><stop offset="0" stop-color="#E6CC93" stop-opacity=".35"/><stop offset="1" stop-color="#E6CC93" stop-opacity="0"/></radialGradient>
    </defs>
    <circle cx="103" cy="18" r="18" fill="url(#cuLua)"/>
    <path d="M107 9a9.5 9.5 0 1 0 0 18a7.2 7.2 0 1 1 0-18z" fill="#E6CC93" opacity=".8"/>
    <g class="cu-estrelas"><path d="${estrela(50, 4, 3)}" fill="#E6CC93"/><path d="${estrela(86, 44, 2.4)}" fill="#A9C8FF"/><path d="${estrela(14, 46, 2.6)}" fill="#ECE8DE"/></g>
    <path d="M3 110Q46 101 114 107" fill="none" stroke="#3a2f2a" stroke-width="5" stroke-linecap="round"/>
    <path d="M86 105Q96 98 104 98" fill="none" stroke="#3a2f2a" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M101 98q5-6 9-2q-4 5-9 2z" fill="#2f3a2a"/>
    <g class="cu-corpo">
      <path d="M44 104L50 116L56 104Z" fill="#1d2333"/>
      <path d="M50 44C71 44 79 64 77 84C75 100 65 108 50 108C35 108 25 100 23 84C21 64 29 44 50 44Z" fill="url(#cuCorpo)"/>
      <path d="M27 60C17 73 19 96 34 104C29 90 29 75 33 62Z" fill="#1a2030"/>
      <path d="M73 60C83 73 81 96 66 104C71 90 71 75 67 62Z" fill="#1a2030"/>
      ${penas.join('')}
      <g class="cu-cabeca">
        <path d="M26 25L21 7L37 18Z" fill="#2a3247"/><path d="M74 25L79 7L63 18Z" fill="#2a3247"/>
        <path d="M50 15C69 15 79 27 79 42C79 56 67 64 50 64C33 64 21 56 21 42C21 27 31 15 50 15Z" fill="url(#cuCorpo)"/>
        <path d="M50 26C44 22 30 24 27 34C24 45 31 54 41 55C46 56 49 53 50 51C51 53 54 56 59 55C69 54 76 45 73 34C70 24 56 22 50 26Z" fill="url(#cuDisco)" stroke="#7a87a6" stroke-opacity=".45" stroke-width=".8"/>
        ${olho(38)}${olho(62)}
        <path d="M50 45L46.6 50L50 56L53.4 50Z" fill="#C9A86A"/>
      </g>
      <path d="M42 105l-2 4M45 105v5M48 105l2 4M53 105l-2 4M56 105v5M59 105l2 4" stroke="#C9A86A" stroke-width="1.6" stroke-linecap="round"/>
    </g>
  </svg>`;
}
