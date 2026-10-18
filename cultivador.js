'use strict';
/* Mirante — o cultivador.
   O personagem é o da capa da Nascente (avatarSVG, portado tal e qual), aqui com os Três Tesouros no corpo:
   Jing no ventre (comida), Qi no peito (treino) e Shen na testa (rituais). O palco muda com o reino.
   A capa abre ao entrar; três toques despertam-no e entram no Mirante. */

const VIS_M = [0, 1, 2, 3, 4, 4, 5, 5, 6];   // aparência da Nascente para cada um dos 9 reinos do Mirante
const DAN_Y = {jing: 238, qi: 190, shen: 99};
function dantiansM(id, r, tes, desvio, mini){
  const defs = TRES.map(t => `<radialGradient id="${id}gD${t}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="${desvio.includes(t) ? '#8a8f99' : TESOUROS[t].cor}" stop-opacity=".85"/><stop offset="1" stop-color="${desvio.includes(t) ? '#8a8f99' : TESOUROS[t].cor}" stop-opacity="0"/></radialGradient>`).join('');
  const g = TRES.map(t => {
    const ativo = !tes || !tes.ativos || tes.ativos[t] || !Object.values(tes.ativos).some(Boolean);
    if (!ativo) return '';
    const frac = tes ? clamp((tes[t] || 0) / TESOUROS[t].max, 0, 1) : .5, rr = ((mini ? 4.5 : 4) + frac * 7 + r * .7) * (t === 'shen' ? .5 : 1), y = DAN_Y[t], des = desvio.includes(t);
    const fenda = des ? `<path d="M${150 - rr * .5} ${y - rr * .6} l${rr * .35} ${rr * .5} l-${rr * .2} ${rr * .3} l${rr * .45} ${rr * .4}" stroke="#ff6b5e" stroke-width="1.2" fill="none"/>` : '';
    return `<g class="c-dan d-${t}${des ? ' desvio' : ''}"><circle class="c-dan-h" cx="150" cy="${y}" r="${(rr * 2.3).toFixed(1)}" fill="url(#${id}gD${t})" opacity="${((.45 + frac * .55) * (t === 'shen' ? .75 : 1)).toFixed(2)}"/>
      <circle class="c-dan-n" cx="150" cy="${y}" r="${(rr * .42).toFixed(1)}" fill="#fff" opacity="${(.55 + frac * .45).toFixed(2)}"/>${fenda}</g>`;
  }).join('');
  return `<defs>${defs}</defs>${g}`;
}

/* ---------- Os objetos de cada app ---------- */
const ESPADA_COR = [['#6f757c', '#aab0b6', '#5d636a', 0], ['#cfd8dc', '#ffffff', '#9fb0b6', .15], ['#e8f4ff', '#ffffff', '#b8d6f0', .4], ['#ffb46b', '#fff3d6', '#ff7a2a', .65], ['#ffd27a', '#ffffff', '#ff5a1f', .95]];
function objetosM(obj, id, mini){
  if (!obj) return {tras: '', frente: ''};
  let tras = '', frente = '';
  if (obj.espada && obj.espada.ativo){
    const n = obj.espada.nivel, [c1, c2, c3, gl] = ESPADA_COR[n];
    tras = `<g class="c-espada e${n}"><g transform="translate(222 132) rotate(28)">
      <defs><linearGradient id="${id}gEsp" x1="0" x2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".5" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
        <radialGradient id="${id}gEspB"><stop offset="0" stop-color="${n >= 3 ? '#ff9a3c' : '#dff1ff'}" stop-opacity=".9"/><stop offset="1" stop-color="${n >= 3 ? '#ff5a1f' : '#9fd0ff'}" stop-opacity="0"/></radialGradient></defs>
      ${gl ? `<ellipse class="esp-brilho" cx="0" cy="-18" rx="${10 + n * 4}" ry="${52 + n * 6}" fill="url(#${id}gEspB)" opacity="${gl}"/>` : ''}
      <rect x="-3" y="-62" width="6" height="88" rx="1.5" fill="url(#${id}gEsp)"/><path d="M-3 -62 L0 -74 L3 -62Z" fill="${c2}"/>
      ${n >= 2 ? `<path d="M0 -70 L0 24" stroke="#fff" stroke-width=".8" opacity=".8"/>` : ''}
      <rect x="-12" y="26" width="24" height="5" rx="2" fill="#c9a86a"/><rect x="-2.5" y="31" width="5" height="18" rx="2" fill="#5a3b26"/><circle cy="52" r="3.5" fill="#c9a86a"/>
      ${n >= 4 && !mini ? `<g class="esp-faiscas" fill="#ffd27a"><circle cx="-8" cy="-40" r="1.6"/><circle cx="9" cy="-12" r="1.3"/><circle cx="-6" cy="8" r="1.1"/><circle cx="7" cy="-55" r="1.2"/></g>` : ''}</g></g>`;
  }
  if (obj.cabaca && obj.cabaca.ativo){
    const fr = clamp(obj.cabaca.frac, 0, 1), topo = 268 - fr * 40;
    frente += `<g class="c-cabaca"><defs><clipPath id="${id}cCab"><path d="M108 228 C102 228 101 236 104 240 C96 244 94 256 98 262 C102 270 114 270 118 262 C122 256 120 244 112 240 C115 236 114 228 108 228Z"/></clipPath>
        <linearGradient id="${id}gCab" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d8f59a"/><stop offset="1" stop-color="#6f9a2c"/></linearGradient></defs>
      <path d="M108 222 L108 229" stroke="#c9a86a" stroke-width="1.3"/>
      <path d="M108 228 C102 228 101 236 104 240 C96 244 94 256 98 262 C102 270 114 270 118 262 C122 256 120 244 112 240 C115 236 114 228 108 228Z" fill="#3b2a1c" stroke="#c9a86a" stroke-width="1.2"/>
      <rect clip-path="url(#${id}cCab)" x="92" y="${topo.toFixed(1)}" width="32" height="${(272 - topo).toFixed(1)}" fill="url(#${id}gCab)" opacity=".95"/>
      ${fr >= .5 ? `<ellipse cx="108" cy="${(topo + 1).toFixed(1)}" rx="9" ry="1.6" fill="#f2ffd0" opacity=".7"/>` : ''}
      <path d="M103 237 L113 237" stroke="#c9a86a" stroke-width="1.6"/></g>`;
  }
  if (obj.jade && obj.jade.ativo){
    const n = obj.jade.nivel, cor = ['#5f7f74', '#7fd1b4', '#9ff0d0', '#c6fff0', '#ffffff'][n];
    frente += `<g class="c-jade j${n}"><path d="M192 224 L192 242" stroke="#c9a86a" stroke-width="1.2"/>
      ${n ? `<circle cx="192" cy="250" r="${12 + n * 3}" fill="${cor}" opacity="${(.12 + n * .07).toFixed(2)}"/>` : ''}
      <circle cx="192" cy="250" r="8.5" fill="${cor}" fill-opacity="${(.55 + n * .1).toFixed(2)}" stroke="#eafff6" stroke-opacity="${(.4 + n * .12).toFixed(2)}"/><circle cx="192" cy="250" r="2.8" fill="#0b1c18"/>
      <path d="M187 262 L192 270 L197 262" stroke="#c9a86a" stroke-width="1" fill="none"/></g>`;
  }
  return {tras, frente};
}

/* ---------- O céu verdadeiro: a fase da lua de hoje e a hora a que abres ---------- */
// Caminho da parte iluminada da lua (f: 0 lua nova, 0,5 cheia).
function caminhoLua(cx, cy, r, f){
  const crescente = f < .5, k = Math.cos(2 * Math.PI * f), rx = Math.abs(k) * r;
  const sT = crescente ? (k > 0 ? 0 : 1) : (k > 0 ? 1 : 0);
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${crescente ? 1 : 0} ${cx} ${cy + r} A${rx.toFixed(2)} ${r} 0 0 ${sT} ${cx} ${cy - r}Z`;
}
function horaDoCeu(d = new Date()){ const h = d.getHours() + d.getMinutes() / 60; return h >= 5.5 && h < 8.5 ? 'aurora' : h >= 8.5 && h < 17.5 ? 'dia' : h >= 17.5 && h < 20.5 ? 'ocaso' : 'noite'; }
const HORA_TINTA = {
  aurora: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b4f8f" stop-opacity=".15"/><stop offset=".6" stop-color="#ff9f7a" stop-opacity=".18"/><stop offset=".78" stop-color="#ffc08a" stop-opacity=".42"/><stop offset="1" stop-color="#ff9f7a" stop-opacity="0"/></linearGradient>`,
  dia: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7fa8ff" stop-opacity=".22"/><stop offset=".75" stop-color="#bcd4ff" stop-opacity=".26"/><stop offset="1" stop-color="#bcd4ff" stop-opacity="0"/></linearGradient>`,
  ocaso: `<linearGradient id="phora" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a6a" stop-opacity=".2"/><stop offset=".65" stop-color="#ff7a3c" stop-opacity=".22"/><stop offset=".78" stop-color="#ff9a4c" stop-opacity=".45"/><stop offset="1" stop-color="#ff7a3c" stop-opacity="0"/></linearGradient>`,
  noite: ''
};
function luaPequena(L){
  const p = caminhoLua(318, 150, 15, L.f);
  return `<g class="lua-real"><circle cx="318" cy="150" r="${(40 + L.ilum * 30).toFixed(0)}" fill="#f3ead2" opacity="${(.025 + L.ilum * .06).toFixed(2)}"/>
    <circle cx="318" cy="150" r="15" fill="#2b3150" opacity=".55"/><path d="${p}" fill="#f6efd8"/></g>`;
}

/* ---------- Palcos (o cenário de cada reino) ---------- */
// Fundo em SVG 400 x 800 (como a capa da Nascente), a base onde ele se senta e os efeitos do canvas.
const SERRA_LONGE = 'M0 600 L40 572 L78 584 L120 540 L160 566 L196 528 L236 560 L276 534 L318 570 L356 546 L400 568 V800 H0Z';
const SERRA_PERTO = 'M0 650 L36 628 L70 640 L112 606 L150 632 L190 618 L232 642 L270 620 L312 646 L356 624 L400 640 V800 H0Z';
function palcoM(r, L = faseLua(hojeN()), hora = horaDoCeu()){
  const p = Math.min(r, 3);
  const fundo = [
    // 0 · Mortal Desperto: o cume ao anoitecer
    `<defs><linearGradient id="pc0" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#110e22"/><stop offset=".42" stop-color="#2a1b3d"/><stop offset=".66" stop-color="#6b3346"/><stop offset=".76" stop-color="#c2683f"/><stop offset=".86" stop-color="#3a1d2a"/><stop offset="1" stop-color="#140c16"/></linearGradient>
      <radialGradient id="ps0"><stop offset="0" stop-color="#ffbe78" stop-opacity=".85"/><stop offset="1" stop-color="#ff8a4c" stop-opacity="0"/></radialGradient></defs>
     <rect width="400" height="800" fill="url(#pc0)"/><ellipse cx="200" cy="610" rx="300" ry="110" fill="url(#ps0)" opacity=".55"/>
     <path d="${SERRA_LONGE}" fill="#3b2442"/><path d="${SERRA_PERTO}" fill="#1d1426"/><rect y="700" width="400" height="100" fill="#120b17"/>`,
    // 1 · Recolha da Luz Estelar: noite, Via Láctea
    `<defs><linearGradient id="pc1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#03050c"/><stop offset=".6" stop-color="#0a1026"/><stop offset=".8" stop-color="#18224a"/><stop offset="1" stop-color="#070b18"/></linearGradient>
      <linearGradient id="pv1" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8fa6ff" stop-opacity="0"/><stop offset=".5" stop-color="#d8d2ff" stop-opacity=".55"/><stop offset="1" stop-color="#8fa6ff" stop-opacity="0"/></linearGradient>
      <filter id="pf1" x="-20%" y="-50%" width="140%" height="200%"><feGaussianBlur stdDeviation="16"/></filter></defs>
     <rect width="400" height="800" fill="url(#pc1)"/><ellipse cx="200" cy="300" rx="330" ry="46" fill="url(#pv1)" filter="url(#pf1)" transform="rotate(-32 200 300)"/>
     <ellipse cx="200" cy="300" rx="260" ry="14" fill="#fff" opacity=".07" filter="url(#pf1)" transform="rotate(-32 200 300)"/>
     <path d="${SERRA_LONGE}" fill="#101834"/><path d="${SERRA_PERTO}" fill="#0a0f22"/><rect y="700" width="400" height="100" fill="#060914"/>`,
    // 2 · Fundação de Jade: aurora sobre a serra
    `<defs><linearGradient id="pc2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#020809"/><stop offset=".55" stop-color="#05201f"/><stop offset=".78" stop-color="#0d3b37"/><stop offset="1" stop-color="#03100f"/></linearGradient></defs>
     <rect width="400" height="800" fill="url(#pc2)"/><path d="${SERRA_LONGE}" fill="#0a2a2a"/><path d="${SERRA_PERTO}" fill="#061a1a"/><rect y="700" width="400" height="100" fill="#031010"/>`,
    // 3 · Núcleo Lunar: acima das nuvens, a lua cheia
    `<defs><linearGradient id="pc3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#04060f"/><stop offset=".5" stop-color="#0b1430"/><stop offset="1" stop-color="#1a2a55"/></linearGradient>
      <radialGradient id="pl3" cx=".42" cy=".38" r=".7"><stop offset="0" stop-color="#fbf5e2"/><stop offset=".7" stop-color="#ddd3b8"/><stop offset="1" stop-color="#b9ae94"/></radialGradient>
      <radialGradient id="pg3"><stop offset=".55" stop-color="#f3ead2" stop-opacity=".35"/><stop offset="1" stop-color="#f3ead2" stop-opacity="0"/></radialGradient>
      <filter id="pf3" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter></defs>
     <rect width="400" height="800" fill="url(#pc3)"/><circle cx="200" cy="330" r="250" fill="url(#pg3)"/>
     <g class="lua-grande"><circle cx="200" cy="330" r="150" fill="#3a4266" opacity=".75"/><clipPath id="pk3"><path d="${caminhoLua(200, 330, 150, L.f)}"/></clipPath><path d="${caminhoLua(200, 330, 150, L.f)}" fill="url(#pl3)"/>
       <g fill="#8d846d" opacity=".22" clip-path="url(#pk3)"><circle cx="150" cy="280" r="26"/><circle cx="240" cy="250" r="14"/><circle cx="262" cy="350" r="34"/><circle cx="170" cy="390" r="18"/><circle cx="215" cy="420" r="10"/><circle cx="120" cy="340" r="9"/></g></g>
     <g class="nuvens n1" filter="url(#pf3)"><path d="M-60 640 C0 600 60 610 110 628 C160 596 230 600 270 626 C320 598 400 606 460 630 V800 H-60Z" fill="#2c3a66" opacity=".9"/></g>
     <g class="nuvens n2" filter="url(#pf3)"><path d="M-60 690 C10 652 80 664 140 682 C200 650 270 660 320 684 C370 660 430 668 460 690 V800 H-60Z" fill="#3a4a7a"/></g>
     <g class="nuvens n3" filter="url(#pf3)"><path d="M-60 740 C20 710 90 718 160 736 C220 708 300 716 350 738 C400 716 440 722 460 740 V800 H-60Z" fill="#56679a"/></g>`
  ][p];
  const rocha = `<path d="M34 -10 C64 -30 116 -36 150 -36 C188 -36 236 -30 266 -10 L280 46 L300 220 H0 L20 50Z" fill="url(#cbR)"/><path d="M34 -10 C64 -30 116 -36 150 -36 C188 -36 236 -30 266 -10" stroke="#fff" stroke-opacity=".14" fill="none"/><path d="M60 40 L92 70 L84 120 M228 30 L210 84 L232 130" stroke="#000" stroke-opacity=".25" fill="none"/>`;
  const base = [
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3b4f"/><stop offset=".5" stop-color="#22192a"/><stop offset="1" stop-color="#120b17"/></linearGradient></defs>${rocha}`,
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2c3558"/><stop offset=".5" stop-color="#121931"/><stop offset="1" stop-color="#060914"/></linearGradient></defs>${rocha}`,
    `<defs><linearGradient id="cbR" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d4a45"/><stop offset=".5" stop-color="#0b2422"/><stop offset="1" stop-color="#031010"/></linearGradient>
      <radialGradient id="cbJ" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#bff0dc"/><stop offset=".5" stop-color="#4fa889"/><stop offset="1" stop-color="#1f5e4f"/></radialGradient></defs>${rocha}
      <ellipse class="jade-brilho" cx="150" cy="10" rx="150" ry="30" fill="#7fd1b4" opacity=".25"/><ellipse cx="150" cy="8" rx="118" ry="19" fill="url(#cbJ)" stroke="#d6fff0" stroke-opacity=".6"/>
      <path d="M150 -8 L188 0 L188 16 L150 24 L112 16 L112 0Z" fill="none" stroke="#eafff6" stroke-opacity=".55"/><ellipse cx="150" cy="8" rx="96" ry="14" fill="none" stroke="#eafff6" stroke-opacity=".3"/>`,
    `<defs><radialGradient id="cbN" cx=".5" cy=".3" r=".7"><stop offset="0" stop-color="#eef2ff"/><stop offset=".6" stop-color="#a9b6dc"/><stop offset="1" stop-color="#5d6c9c" stop-opacity="0"/></radialGradient></defs>
      <g class="nuvem-base"><ellipse cx="150" cy="22" rx="150" ry="34" fill="url(#cbN)" opacity=".9"/><ellipse cx="96" cy="14" rx="62" ry="24" fill="#f1f4ff" opacity=".75"/><ellipse cx="206" cy="12" rx="70" ry="26" fill="#f1f4ff" opacity=".7"/><ellipse cx="150" cy="4" rx="58" ry="20" fill="#fff" opacity=".8"/></g>`
  ][p];
  const ef = Object.assign({}, [{estrelas: 50, topo: .45, fios: 0, aurora: false}, {estrelas: 240, topo: .75, fios: 7, aurora: false}, {estrelas: 170, topo: .7, fios: 4, aurora: true}, {estrelas: 160, topo: .55, fios: 3, aurora: false}][p]);
  // A lua verdadeira nos palcos de serra e a cor da hora a que abres a app
  let f2 = fundo.replace(/(<rect width="400" height="800" fill="url\(#pc\d\)"\/>)/, m => m + (p < 3 ? luaPequena(L) : '') + (HORA_TINTA[hora] ? `<defs>${HORA_TINTA[hora]}</defs><rect width="400" height="800" fill="url(#phora)"/>` : ''));
  ef.brilho = hora === 'dia' ? .35 : hora === 'noite' ? 1 : .7;
  return {p, hora, fundo: `<svg class="capa-paisagem" viewBox="0 0 400 800" preserveAspectRatio="xMidYMax slice" aria-hidden="true">${f2}</svg>`, base: `<svg class="capa-assento p${p}" viewBox="0 -40 300 260" aria-hidden="true">${base}</svg>`, ef};
}

// O astrolábio: os nove reinos à volta dele, com o arco do caminho até ao próximo.
const ROMANOS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];
function astrolabioM(c){
  const R = 132, cx = 150, cy = 190, ang = i => (-70 + i * 40) * Math.PI / 180;
  const iniR = NIVEIS_M.find(l => l.r === c.r).ini, proxR = NIVEIS_M.find(l => l.r === c.r + 1), fr = proxR ? clamp((c.qi - iniR) / (proxR.ini - iniR), 0, 1) : 1;
  const a0 = ang(c.r), a1 = a0 + fr * 40 * Math.PI / 180, arco = fr > 0 ? `<path d="M${(cx + R * Math.cos(a0)).toFixed(1)} ${(cy + R * Math.sin(a0)).toFixed(1)} A${R} ${R} 0 0 1 ${(cx + R * Math.cos(a1)).toFixed(1)} ${(cy + R * Math.sin(a1)).toFixed(1)}" stroke="#f2d48a" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
  const marcas = REINOS_M.map((Rm, i) => { const a = ang(i), x = cx + R * Math.cos(a), y = cy + R * Math.sin(a), est = i < c.r ? 'feito' : i === c.r ? 'atual' : 'futuro';
    return `<g class="as-r ${est}"><circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i === c.r ? 13 : 10}"/><text x="${x.toFixed(1)}" y="${(y + 3.6).toFixed(1)}" text-anchor="middle">${ROMANOS[i]}</text></g>`; }).join('');
  const ticks = Array.from({length: 72}, (_, i) => { const a = i * 5 * Math.PI / 180, r1 = R + 18, r2 = R + (i % 8 === 0 ? 26 : 22);
    return `<line x1="${(cx + r1 * Math.cos(a)).toFixed(1)}" y1="${(cy + r1 * Math.sin(a)).toFixed(1)}" x2="${(cx + r2 * Math.cos(a)).toFixed(1)}" y2="${(cy + r2 * Math.sin(a)).toFixed(1)}"/>`; }).join('');
  return `<svg class="astrolabio" viewBox="0 0 300 360" aria-hidden="true"><g class="as-roda"><circle cx="${cx}" cy="${cy}" r="${R}" class="as-aro"/><circle cx="${cx}" cy="${cy}" r="${R + 30}" class="as-aro fino"/><g class="as-ticks">${ticks}</g></g>${arco}${marcas}</svg>`;
}

/* ---------- O cultivador (avatarSVG da Nascente, com os três tesouros) ---------- */
const VISUAL_C = [
  {manto: '#6a5644', manto2: '#4d3d30', orla: '#8f7556', interior: '#d8c5a6', aura: '#e0a26b', qi: '232,170,110', cabelo: '#1c1714'},
  {manto: '#2f7260', manto2: '#205244', orla: '#a6dcc6', interior: '#eef6f1', aura: '#7fd1b4', qi: '160,236,210', cabelo: '#1c1714'},
  {manto: '#21506a', manto2: '#173a4f', orla: '#e3c47e', interior: '#eef4f6', aura: '#86cddd', qi: '175,228,245', cabelo: '#1a1716'},
  {manto: '#ebe3cc', manto2: '#c9bd9a', orla: '#d6a537', interior: '#fffaea', aura: '#f2c35b', qi: '250,210,115', cabelo: '#1f1a18'},
  {manto: '#ece6f6', manto2: '#c3b5de', orla: '#b398e8', interior: '#ffffff', aura: '#c9b6f0', qi: '210,190,250', cabelo: '#2a2530'},
  {manto: '#f6f3ea', manto2: '#d8d1bc', orla: '#e3c47e', interior: '#ffffff', aura: '#fff0c4', qi: '255,240,200', cabelo: '#e9e6ef'},
  {manto: '#fffbf1', manto2: '#eddcb4', orla: '#ffd36a', interior: '#ffffff', aura: '#ffe7a0', qi: '255,232,160', cabelo: '#f2efe8'}
];
function avatarM({r: rm = 0, f = 0, fluxo = 0, mini = false, id = 'a', tes = null, desvio = [], obj = null} = {}){
  const OB = objetosM(obj, id, mini);
  const r = VIS_M[clamp(rm, 0, 8)], V = VISUAL_C[r], pele = '#e2c3a1', peleS = '#c9a483';
  const auraOp = (.1 + r * .07 + f * .08 + (mini ? 0 : fluxo * .05)).toFixed(2), danR = 9 + r * 2.6 + f * 4, aneis = Math.max(0, r - 1);
  const flut = r >= 5 ? ' c-flutua' : '';
  const correntes = mini ? '' : [
    'M6 110 C70 128 112 190 150 238', 'M294 140 C228 150 192 206 150 238', 'M30 352 C84 310 122 276 150 240', 'M272 352 C218 310 180 276 150 240'
  ].slice(0, fluxo >= 2 ? fluxo : 0).map((d, i) => `<path class="c-corrente" d="${d}" stroke="${V.aura}" stroke-width="${1.2 + fluxo * .5}" style="animation-delay:${-i * .4}s"/>`).join('');
  const espada = r >= 3 ? `<g class="c-espada"><g transform="translate(222 132) rotate(28)">
      <rect x="-3" y="-62" width="6" height="88" rx="1.5" fill="url(#${id}gLam)"/><path d="M-3 -62 L0 -74 L3 -62Z" fill="#f5f2e6"/>
      <rect x="-12" y="26" width="24" height="5" rx="2" fill="${V.orla}"/><rect x="-2.5" y="31" width="5" height="18" rx="2" fill="#5a3b26"/><circle cy="52" r="3.5" fill="${V.orla}"/></g></g>` : '';
  const halo = r >= 5 ? `<g class="c-halo"><circle cx="150" cy="112" r="40" fill="none" stroke="${V.aura}" stroke-width="2" opacity=".7"/>
      <circle cx="150" cy="112" r="47" fill="none" stroke="${V.aura}" stroke-width="1" stroke-dasharray="3 7" opacity=".6"/></g>` : '';
  const alma = r >= 4 ? `<g class="c-alma"><g transform="translate(0 -20)"><circle cx="150" cy="34" r="18" fill="url(#${id}gAura)" opacity=".95"/>
      <circle cx="150" cy="27" r="4.5" fill="#fff" opacity=".95"/><path d="M150 32 C143 32 140 38 139 44 L161 44 C160 38 157 32 150 32Z" fill="#fff" opacity=".9"/>
      <path d="M136 46 C140 41 146 41 150 44 C154 41 160 41 164 46" stroke="${V.orla}" stroke-width="1.3" fill="none"/></g></g>` : '';
  const petala = (dx, dy, esc) => `<path d="M0 0 C-11 -12 -11 -32 0 -46 C11 -32 11 -12 0 0Z" transform="translate(${150 + dx} ${dy}) rotate(${(dx / 120 * 58).toFixed(1)}) scale(${esc})" fill="${V.aura}" fill-opacity=".38" stroke="${V.orla}" stroke-width="1"/>`;
  const trono = r >= 5 ? `<g class="c-trono"><ellipse cx="150" cy="322" rx="126" ry="20" fill="${V.aura}" opacity=".28"/>${[-118, -84, -46, 0, 46, 84, 118].map(dx => petala(dx, 322 - 14 * Math.sqrt(Math.max(0, 1 - (dx / 126) ** 2)), 1.15)).join('')}</g>` : '';
  const tronoFrente = r >= 5 ? `<g class="c-trono">${[-100, -54, 0, 54, 100].map(dx => petala(dx, 336 + 6 * Math.sqrt(Math.max(0, 1 - (dx / 126) ** 2)), .8)).join('')}</g>` : '';
  const pilar = r >= 6 && !mini ? `<rect class="c-pilar" x="96" y="-400" width="108" height="760" fill="url(#${id}gPilar)"/>` : '';
  const marca = '';
  const madeixas = r === 4 ? `<path d="M134 98 C130 120 128 150 130 190 M166 98 C170 120 172 150 170 190" stroke="#d8d4e6" stroke-width="2" fill="none" opacity=".8"/>` : '';
  const toucado = r === 0 ? `<path d="M129 97 C140 92 160 92 171 97" stroke="#8a6d4f" stroke-width="5" fill="none" stroke-linecap="round"/><rect x="141" y="66" width="18" height="6" rx="2" fill="#8a6d4f"/>`
    : r === 1 ? `<path d="M132 66 L170 74" stroke="#a87c4f" stroke-width="2.6" stroke-linecap="round"/>`
    : r <= 3 ? `<path d="M140 66 L160 66 L157 54 L143 54Z" fill="${V.orla}"/><path d="M130 62 L172 62" stroke="${V.orla}" stroke-width="2.2" stroke-linecap="round"/>`
    : r <= 5 ? `<path d="M139 66 L161 66 L158 52 L142 52Z" fill="${r === 4 ? '#d9d2ee' : V.orla}" stroke="${V.orla}" stroke-width="1"/><circle cx="150" cy="58" r="2.4" fill="${V.aura}"/><path d="M128 62 L174 62" stroke="${V.orla}" stroke-width="2" stroke-linecap="round"/>`
    : `<path d="M136 66 L164 66 L162 50 L156 56 L150 44 L144 56 L138 50Z" fill="${V.orla}"/><circle cx="150" cy="55" r="2.6" fill="#fff"/>`;
  const olhos = `<g class="c-olhos-f"><path d="M137 113 Q142 116.5 147 113 M153 113 Q158 116.5 163 113" stroke="#3a2a22" stroke-width="1.7" fill="none" stroke-linecap="round"/></g>
    <g class="c-olhos-a"><ellipse cx="142" cy="113" rx="3.2" ry="2.4" fill="${V.aura}"/><ellipse cx="158" cy="113" rx="3.2" ry="2.4" fill="${V.aura}"/><circle cx="142" cy="113" r="1.2" fill="#fff"/><circle cx="158" cy="113" r="1.2" fill="#fff"/></g>`;
  const pendente = r >= 2 ? `<path d="M150 232 L150 250" stroke="${V.orla}" stroke-width="1.2"/><circle cx="150" cy="253" r="3.4" fill="${V.aura}"/>` : '';
  const nucleo = r >= 3 ? `<circle class="c-nucleo" cx="150" cy="238" r="${5 + (r - 3) * 1.2}" fill="#fff6d2" stroke="#f2c35b" stroke-width="1.4"/>` : '';
  return `<svg class="cultivador r${r}${mini ? ' mini' : ''} f${fluxo}" viewBox="0 0 300 360" aria-hidden="true">
  <defs>
    <radialGradient id="${id}gAura" cx=".5" cy=".55" r=".55"><stop offset="0" stop-color="${V.aura}" stop-opacity=".9"/><stop offset=".55" stop-color="${V.aura}" stop-opacity=".25"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></radialGradient>
    <radialGradient id="${id}gDan" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".95"/><stop offset=".3" stop-color="${V.aura}" stop-opacity=".8"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></radialGradient>
    <linearGradient id="${id}gManto" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${V.manto}"/><stop offset="1" stop-color="${V.manto2}"/></linearGradient>
    <linearGradient id="${id}gLam" x1="0" x2="1"><stop offset="0" stop-color="#cfd8dc"/><stop offset=".5" stop-color="#ffffff"/><stop offset="1" stop-color="#9fb0b6"/></linearGradient>
    <linearGradient id="${id}gPilar" x1="0" x2="1"><stop offset="0" stop-color="${V.aura}" stop-opacity="0"/><stop offset=".5" stop-color="${V.aura}" stop-opacity=".45"/><stop offset="1" stop-color="${V.aura}" stop-opacity="0"/></linearGradient>
  </defs>
  ${pilar}
  <path class="c-aura" d="M150 ${44 - r * 4} C${204 + r * 4} 62 ${240 + r * 3} 120 ${244 + r * 3} 200 C${248 + r * 3} 262 224 314 150 328 C76 314 ${52 - r * 3} 262 ${56 - r * 3} 200 C${60 - r * 3} 120 ${96 - r * 4} 62 150 ${44 - r * 4}Z" fill="url(#${id}gAura)" opacity="${auraOp}"/>
  ${Array.from({length: aneis}, (_, i) => `<ellipse class="c-anel" cx="150" cy="236" rx="${70 + i * 26}" ry="${18 + i * 7}" fill="none" stroke="${V.aura}" stroke-width="1" opacity="${(.5 - i * .08).toFixed(2)}" style="animation-delay:${-i * .8}s"/>`).join('')}
  ${correntes}${halo}${OB.tras}
  <g class="c-corpo${flut}">
    ${trono}
    <path d="M128 100 C121 140 117 182 124 206 L176 206 C183 182 179 140 172 100Z" fill="${V.cabelo}"/>${madeixas}
    <path d="M58 300 C56 272 92 254 150 256 C208 254 244 272 242 300 C242 314 205 320 150 318 C95 320 58 314 58 300Z" fill="${V.manto2}"/>
    <path d="M98 292 C120 280 140 283 150 302 M202 292 C180 280 160 283 150 302" stroke="rgba(0,0,0,.18)" stroke-width="1.4" fill="none"/>${tronoFrente}
    <g class="c-respira">
      <path d="M150 146 C126 146 106 152 98 166 C90 182 92 220 96 262 L204 262 C208 220 210 182 202 166 C194 152 174 146 150 146Z" fill="url(#${id}gManto)"/>
      <path d="M138 148 L150 184 L162 148Z" fill="${V.interior}"/>
      <path d="M134 148 L162 206 M166 148 L151 180" stroke="${V.orla}" stroke-width="5" stroke-linecap="round" fill="none"/>
      <path d="M100 214 C130 222 170 222 200 214 L201 229 C170 237 130 237 99 229Z" fill="${V.orla}" opacity=".9"/>${OB.frente}
      <path d="M102 164 C80 180 70 226 80 262 C88 280 112 280 132 270 C140 266 146 262 150 258 C134 250 120 232 114 206 C110 190 108 176 102 164Z" fill="url(#${id}gManto)"/>
      <path d="M198 164 C220 180 230 226 220 262 C212 280 188 280 168 270 C160 266 154 262 150 258 C166 250 180 232 186 206 C190 190 192 176 198 164Z" fill="url(#${id}gManto)"/>
      <path d="M102 164 C108 178 110 192 114 206 C120 232 134 250 150 258 M198 164 C192 178 190 192 186 206 C180 232 166 250 150 258" stroke="rgba(0,0,0,.22)" stroke-width="2" fill="none"/>
      <path d="M102 164 C80 180 70 226 80 262 M198 164 C220 180 230 226 220 262" stroke="rgba(255,255,255,.12)" stroke-width="1.5" fill="none"/>
      <path d="M80 262 C88 280 112 280 132 270 M220 262 C212 280 188 280 168 270" stroke="${V.orla}" stroke-width="4" fill="none" stroke-linecap="round"/>
      <ellipse cx="150" cy="257" rx="16" ry="7" fill="${pele}"/><path d="M140 254 Q150 246 160 254" stroke="${peleS}" stroke-width="1.4" fill="none"/>
      ${nucleo}
      <path d="M142 126 L142 150 L158 150 L158 126Z" fill="${peleS}"/>
      <ellipse cx="129" cy="115" rx="3.5" ry="6" fill="${peleS}"/><ellipse cx="171" cy="115" rx="3.5" ry="6" fill="${peleS}"/>
      <ellipse cx="150" cy="112" rx="21" ry="25" fill="${pele}"/>
      <path d="M136 106 Q142 103 147 105 M153 105 Q158 103 164 106" stroke="${V.cabelo === '#e9e6ef' || V.cabelo === '#f2efe8' ? '#bdb7c6' : V.cabelo}" stroke-width="1.7" fill="none" stroke-linecap="round"/>
      ${olhos}
      <path d="M150 115 L148.4 122.5 L151.5 123" stroke="${peleS}" stroke-width="1.2" fill="none"/><path d="M145 129 Q150 131 155 129" stroke="#9a6656" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      ${marca}
      <path d="M128 108 C126 86 138 76 150 76 C162 76 174 86 172 108 C168 98 160 92 150 92 C140 92 132 98 128 108Z" fill="${V.cabelo}"/>
      <path d="M129 104 C126 120 127 132 131 142 M171 104 C174 120 173 132 169 142" stroke="${V.cabelo}" stroke-width="3.2" fill="none" stroke-linecap="round"/>
      <circle cx="150" cy="69" r="11" fill="${V.cabelo}"/>${toucado}
      ${dantiansM(id, r, tes, desvio, mini)}
    </g>
  </g>
  ${alma}
</svg>`;
}


/* ---------- A capa: o cultivador a absorver o qi dos três tesouros; três toques para entrar ---------- */
const CAPA_CFG = () => Object.assign({on: true, som: true}, ML.get('capa', {}) || {});
let capaAberta = false, toquesCapa = 0, escondidoEm = 0, capaC = null, audioC = null, tLongo = null;
const capaQi = {cv: null, c: null, w: 0, h: 0, ps: [], alvos: {}, acc: {}, ult: 0, raf: 0, spr: {}, taxa: {}, estrelas: [], fios: [], ef: null, t: 0, fim: 0, sprE: null};
function spriteM(cor){ const s = document.createElement('canvas'); s.width = s.height = 32; const c = s.getContext('2d'), g = c.createRadialGradient(16, 16, 0, 16, 16, 16);
  g.addColorStop(0, `rgba(${cor},1)`); g.addColorStop(.3, `rgba(${cor},.5)`); g.addColorStop(1, `rgba(${cor},0)`); c.fillStyle = g; c.fillRect(0, 0, 32, 32); return s; }
function capaGeo(){
  const Q = capaQi, cv = Q.cv, dpr = Math.min(1.5, devicePixelRatio || 1); if (!cv) return;
  Q.w = innerWidth; Q.h = innerHeight; cv.width = Q.w * dpr; cv.height = Q.h * dpr; Q.c.setTransform(dpr, 0, 0, dpr, 0, 0);
  for (const t of TRES){ const d = document.querySelector(`#capa .d-${t} .c-dan-n`); if (d){ const b = d.getBoundingClientRect(); Q.alvos[t] = {x: b.left + b.width / 2, y: b.top + b.height / 2}; } }
  const fig = $('#capaFig .cultivador'); if (fig){ const b = fig.getBoundingClientRect(); Q.centro = {x: b.left + b.width / 2, y: b.top + b.height * .5}; }
  // Estrelas do palco (fixas, a cintilar) e os fios de luz que descem até ele
  const ef = Q.ef || {estrelas: 0, topo: .5, fios: 0};
  Q.estrelas = Array.from({length: ef.estrelas}, () => ({x: Math.random() * Q.w, y: Math.pow(Math.random(), 1.4) * Q.h * ef.topo, r: .4 + Math.random() * 1.3, f: Math.random() * 6.28, v: .6 + Math.random() * 2.2}));
  const alvo = Q.alvos.shen || Q.centro || {x: Q.w / 2, y: Q.h / 2};
  Q.fios = Array.from({length: ef.fios}, (_, i) => { const e = Q.estrelas[Math.floor(Math.random() * Math.max(1, Q.estrelas.length))] || {x: Math.random() * Q.w, y: 20};
    return {x0: e.x, y0: e.y, cx: (e.x + alvo.x) / 2 + (Math.random() - .5) * 120, cy: Math.min(e.y, alvo.y) + Math.random() * 60, x1: alvo.x, y1: alvo.y, f: i * 1.7}; });
}
function novaMoteM(t, perto){
  const Q = capaQi, A = Q.alvos[t] || Q.centro || {x: Q.w / 2, y: Q.h / 2}, a = Math.random() * Math.PI * 2;
  const R = (perto ? 50 : 120) + Math.random() * Math.max(Q.w, Q.h) * (perto ? .2 : .55), fl = capaC ? FLUXOS_M.length - 1 - FLUXOS_M.findIndex(f => f[2] === capaC.fluxo) : 0;
  const cinza = capaC && capaC.desvio.includes(t);
  return {t, x: A.x + Math.cos(a) * R, y: A.y + Math.sin(a) * R * .8, a, R, rot: (Math.random() < .5 ? -1 : 1) * (.6 + Math.random() * .8),
    v: (cinza ? .2 : .35) + Math.random() * .5 + fl * .15, s: 4 + Math.random() * 6 + fl, vida: 0, cinza};
}
function passoCapaM(ts){
  const Q = capaQi; if (!capaAberta) return;
  Q.raf = requestAnimationFrame(passoCapaM);
  const dt = Math.min(.05, (ts - (Q.ult || ts)) / 1000); Q.ult = ts; Q.t += dt;
  const c = Q.c; c.clearRect(0, 0, Q.w, Q.h);
  const warp = Q.fim ? Math.min(1, (performance.now() - Q.fim) / 700) : 0, C = Q.centro || {x: Q.w / 2, y: Q.h / 2};
  // Estrelas (no salto final esticam em raios a partir do centro)
  c.globalCompositeOperation = 'lighter';
  for (const e of Q.estrelas){
    const al = (.35 + .65 * (.5 + .5 * Math.sin(Q.t * e.v + e.f))) * (Q.ef && Q.ef.brilho != null ? Q.ef.brilho : 1);
    if (warp){ const dx = e.x - C.x, dy = e.y - C.y, k = 1 + warp * warp * 2.5; c.strokeStyle = `rgba(235,240,255,${(al * .9).toFixed(2)})`; c.lineWidth = e.r;
      c.beginPath(); c.moveTo(C.x + dx * (1 + warp * .3), C.y + dy * (1 + warp * .3)); c.lineTo(C.x + dx * k, C.y + dy * k); c.stroke(); }
    else { c.globalAlpha = al; c.drawImage(Q.sprE, e.x - e.r * 3, e.y - e.r * 3, e.r * 6, e.r * 6); }
  }
  c.globalAlpha = 1;
  // Fios de luz das estrelas até ele
  if (Q.fios.length && !warp){
    c.lineWidth = 1.1; c.setLineDash([4, 14]);
    for (const f of Q.fios){ c.lineDashOffset = -(Q.t * 26 + f.f * 10); c.strokeStyle = `rgba(232,224,255,${(.16 + .1 * Math.sin(Q.t + f.f)).toFixed(2)})`;
      c.beginPath(); c.moveTo(f.x0, f.y0); c.quadraticCurveTo(f.cx, f.cy, f.x1, f.y1); c.stroke(); }
    c.setLineDash([]);
  }
  // Aurora (Fundação de Jade)
  if (Q.ef && Q.ef.aurora && !warp){
    [['95,227,176', .12, .18, 0], ['79,214,214', .2, .14, 2], ['154,124,240', .3, .1, 4]].forEach(([cor, y0, al, f]) => {
      const base = Q.h * y0, g = c.createLinearGradient(0, base - 60, 0, base + 90); g.addColorStop(0, `rgba(${cor},0)`); g.addColorStop(.4, `rgba(${cor},${al})`); g.addColorStop(1, `rgba(${cor},0)`);
      c.fillStyle = g; c.beginPath();
      for (let x = -10; x <= Q.w + 10; x += 12) c.lineTo(x, base + Math.sin(x * .012 + Q.t * .5 + f) * 26 + Math.sin(x * .031 - Q.t * .3) * 10);
      for (let x = Q.w + 10; x >= -10; x -= 12) c.lineTo(x, base + 110 + Math.sin(x * .01 + Q.t * .4 + f) * 20);
      c.closePath(); c.fill();
    });
  }
  // Partículas de qi, uma corrente por tesouro
  for (const t of TRES){ if (!Q.taxa[t]) continue; Q.acc[t] = (Q.acc[t] || 0) + dt * Q.taxa[t];
    while (Q.acc[t] > 1 && Q.ps.length < 260){ Q.acc[t]--; Q.ps.push(novaMoteM(t)); } }
  for (const p of Q.ps){
    const A = Q.alvos[p.t] || C, acel = Q.fim ? 4 : 1;
    p.vida += dt; p.R -= p.v * acel * (40 + 140 / Math.max(.4, p.R / 100)) * dt; p.a += p.rot * dt * (1.2 + 90 / Math.max(20, p.R));
    p.x = A.x + Math.cos(p.a) * p.R; p.y = A.y + Math.sin(p.a) * p.R * .8;
    c.globalAlpha = Math.max(0, Math.min(1, p.vida * 1.5) * Math.min(1, p.R / 30) * (p.cinza ? .45 : .85));
    const s = p.s * (.6 + Math.min(1, p.R / 160) * .6); c.drawImage(Q.spr[p.cinza ? 'cinza' : p.t], p.x - s / 2, p.y - s / 2, s, s);
  }
  Q.ps = Q.ps.filter(p => p.R > 6); c.globalAlpha = 1; c.globalCompositeOperation = 'source-over';
}
function rajadaCapaM(n){ for (let i = 0; i < n; i++){ const t = TRES.filter(x => capaQi.taxa[x])[i % Math.max(1, TRES.filter(x => capaQi.taxa[x]).length)] || 'jing';
  capaQi.ps.push(Object.assign(novaMoteM(t, true), {v: 1.2 + Math.random(), s: 7 + Math.random() * 8})); } }
function somCapaM(n){
  if (!CAPA_CFG().som) return;
  try {
    audioC = audioC || new (window.AudioContext || window.webkitAudioContext)(); if (audioC.state === 'suspended') audioC.resume();
    const t = audioC.currentTime, saida = audioC.createGain(); saida.gain.value = n >= 3 ? .3 : .2; saida.connect(audioC.destination);
    const base = n >= 3 ? 174.6 : [440, 554.37][n - 1] || 440;
    [[1, .7, n >= 3 ? 4.2 : 2.2], [2.01, .3, 1.6], [2.76, .18, 1.1], [5.4, .08, .6]].forEach(([m, a, dur]) => {
      const o = audioC.createOscillator(), g = audioC.createGain(); o.type = 'sine'; o.frequency.value = base * m;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(a, t + .008); g.gain.exponentialRampToValueAtTime(.0004, t + dur);
      o.connect(g); g.connect(saida); o.start(t); o.stop(t + dur + .1);
    });
  } catch(e){}
}
const vibrarM = p => { try { navigator.vibrate && navigator.vibrate(p); } catch(e){} };
const reinoForcado = () => { try { const v = new URLSearchParams(location.search).get('reino'); return v != null && v !== '' ? clamp(+v - 1, 0, 8) : null; } catch(e){ return null; } };
function mensagemCapaM(c){
  const v = ML.get('cultivoVisto', null), partes = [];
  if (v){
    const rAntes = NIVEIS_M[Math.min(v.idx, NIVEIS_M.length - 1)].r, desdeN = numDe(chaveData(new Date(v.ts)));
    if (c.r > rAntes) partes.push(`<span class="capa-sobe">Rompeste para ${esc(c.reino)}!</span>`);
    else if (c.idx > v.idx) partes.push(`<span class="capa-sobe">Avançaste: ${esc(c.nivel)}.</span>`);
    const perdas = c.eventos.filter(e => e.tipo === 'perda' && e.n >= desdeN), perdido = perdas.reduce((s, e) => s + e.qi, 0);
    if (perdido) partes.push(`<span class="capa-desce">${perdas.length === 1 ? 'Um dia vazio' : perdas.length + ' dias vazios'}: −${perdido} qi.</span>`);
    const salvos = c.eventos.filter(e => e.tipo === 'pilula' && e.n >= desdeN).length;
    if (salvos) partes.push(`<span class="capa-sobe">${salvos === 1 ? 'Uma pílula protegeu-te de um dia vazio' : salvos + ' pílulas protegeram-te de dias vazios'}.</span>`);
    const ganho = c.qi - v.qi + perdido;
    if (ganho > 0 && !partes.length) partes.push(`<span class="capa-sobe">+${ganho} qi absorvido desde a última vez.</span>`);
  }
  if (partes.length) return partes.join(' ');
  if (c.gargalo.preso) return `<span class="capa-desce">${esc(textoGargalo(c))}</span>`;
  if (c.lua.cheia && c.ativos.shen) return '<span class="capa-sobe">Lua cheia: hoje os rituais da Nascente valem o dobro.</span>';
  if (c.desvio.length) return `<span class="capa-desce">Desvio de qi: ${c.desvio.map(t => TESOUROS[t].app).join(' e ')} ${c.desvio.length > 1 ? 'esquecidas' : 'esquecida'}. Os ganhos valem 70%.</span>`;
  const falta = TRES.filter(t => c.ativos[t] && !c.hoje[t]).map(t => TESOUROS[t].app);
  return falta.length && c.qi ? `Hoje ainda falta: ${falta.join(', ')}.` : esc(c.frase);
}
function renderCapaM(){
  const c = capaC = cultivoMirante(), rf = reinoForcado(), r = rf != null ? rf : c.r, P = palcoM(r), V = VISUAL_C[VIS_M[r]], CF = CAPA_CFG();
  capaQi.ef = P.ef;
  const tes = Object.assign({ativos: c.ativos}, c.hoje), alg = TRES.some(t => c.ativos[t]);
  const chips = TRES.map((t, i) => { const T = TESOUROS[t], at = c.ativos[t] || !alg;
    return `<div class="ct${at ? '' : ' off'}${c.desvio.includes(t) ? ' desvio' : ''}" style="--c:${T.cor};--d:${i * 180}ms"><span>${T.nome}<small>${T.app}</small></span><b>${at ? `${c.hoje[t] || 0}<small>/${T.max}</small>` : '—'}</b><i style="width:${at ? Math.round(clamp((c.hoje[t] || 0) / T.max, 0, 1) * 100) : 0}%"></i></div>`; }).join('');
  $('#capa').innerHTML = `${P.fundo}
    <canvas id="capaQi" aria-hidden="true"></canvas>
    <div class="capa-topo"><div class="capa-marca">MIRANTE</div>
      <h1 class="capa-reino" style="--brilho:${V.aura}">${esc(REINOS_M[r].nome)}</h1><p class="capa-nivel">${esc(rf != null ? 'Pré-visualização do palco' : c.nivel)}</p>
      <p class="capa-lua${c.lua.cheia ? ' cheia' : ''}"><svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true"><circle cx="10" cy="10" r="8" fill="#2b3150"/><path d="${caminhoLua(10, 10, 8, c.lua.f)}" fill="#f6efd8"/></svg>${c.lua.nome}${c.lua.cheia ? ' · o Shen vale o dobro' : ''}</p></div>
    <div class="capa-figura p${P.p}" id="capaFig">${P.base}${astrolabioM(rf != null ? Object.assign({}, c, {r, qi: NIVEIS_M.find(l => l.r === r).ini}) : c)}${avatarM({r, f: c.pct, fluxo: Math.max(0, 4 - FLUXOS_M.findIndex(f => f[2] === c.fluxo)), id: 'cp', tes, desvio: c.desvio, obj: c.objetos})}</div>
    <div class="capa-base">
      <div class="capa-tes">${chips}</div>
      <div class="capa-barra"><i style="width:${Math.round(c.pct * 100)}%;background:linear-gradient(90deg, ${V.orla}, ${V.aura}, #fff)"></i></div>
      <div class="capa-dados"><span>${c.prox ? `${c.dentro} / ${c.custo} qi` : `${c.qi} qi`}</span><span>Fluxo: ${c.fluxo}${c.serie ? ` · ${c.serie} ${c.serie === 1 ? 'dia' : 'dias'}` : ''}</span><span class="capa-pil" title="Pílulas de proteção">${pilulasHTML(c.pilulas)}</span></div>
      <p class="capa-msg">${mensagemCapaM(c)}</p>
      <p class="capa-dica">Toca três vezes para despertar</p><div class="capa-pontos"><i></i><i></i><i></i></div>
    </div>`;
  const Q = capaQi; Q.cv = $('#capaQi'); Q.c = Q.cv.getContext('2d'); Q.ps = []; Q.fim = 0; Q.t = 0; Q.acc = {};
  Q.spr = {cinza: spriteM('150,156,170')}; for (const t of TRES) Q.spr[t] = spriteM(TESOUROS[t].rgb); Q.sprE = Q.sprE || spriteM('235,240,255');
  // Mais qi hoje = mais partículas nesse tesouro; os inativos não absorvem nada.
  for (const t of TRES) Q.taxa[t] = (c.ativos[t] || !alg) ? 3 + 9 * clamp((c.hoje[t] || 0) / TESOUROS[t].max, 0, 1) + VIS_M[r] * .8 : 0;
  void CF;
}
function mostrarCapa(forcar){
  if (capaAberta || (!forcar && !CAPA_CFG().on) || !D) return;
  toquesCapa = 0; capaAberta = true;
  const el = $('#capa'); el.className = ''; el.hidden = false; renderCapaM(); el.focus({preventScroll: true});
  document.documentElement.classList.add('com-capa');
  requestAnimationFrame(() => { capaGeo(); for (const t of TRES) if (capaQi.taxa[t]) for (let i = 0; i < 14; i++) capaQi.ps.push(novaMoteM(t));
    capaQi.ult = 0; cancelAnimationFrame(capaQi.raf); capaQi.raf = requestAnimationFrame(passoCapaM); });
}
function toqueCapaM(){
  if (!capaAberta || toquesCapa >= 3) return;
  toquesCapa++; vibrarM(toquesCapa >= 3 ? [25, 40, 40] : 18); somCapaM(toquesCapa);
  const el = $('#capa');
  el.querySelectorAll('.capa-pontos i').forEach((p, i) => p.classList.toggle('on', i < toquesCapa));
  const fig = $('#capaFig'); fig.classList.remove('pulso'); void fig.offsetWidth; fig.classList.add('pulso');
  rajadaCapaM(16 + toquesCapa * 12);
  const C = capaQi.alvos.qi || capaQi.centro, o = document.createElement('span'); o.className = 'capa-onda'; if (C){ o.style.left = C.x + 'px'; o.style.top = C.y + 'px'; } el.appendChild(o); setTimeout(() => o.remove(), 1200);
  el.classList.add('t' + toquesCapa);
  if (toquesCapa === 1) $('#capa .capa-dica').textContent = 'Os três tesouros de hoje';
  if (toquesCapa === 2) $('#capa .capa-dica').textContent = 'O caminho dos nove céus';
  if (toquesCapa >= 3){ capaQi.fim = performance.now(); el.classList.add('despertar'); $('#capa .capa-dica').textContent = 'Desperta'; setTimeout(fecharCapa, 1000); }
}
function fecharCapa(){
  if (!capaAberta) return;
  capaAberta = false; const c = capaC || cultivoMirante();
  ML.set('cultivoVisto', {qi: c.qi, idx: c.idx, ts: Date.now()});
  const el = $('#capa'); el.classList.add('sair'); document.documentElement.classList.remove('com-capa');
  setTimeout(() => { el.hidden = true; el.innerHTML = ''; cancelAnimationFrame(capaQi.raf); capaQi.ps = []; }, 560);
}
function ligarCapa(){
  const el = $('#capa'); if (!el || el.dataset.ligada) return; el.dataset.ligada = '1';
  el.addEventListener('pointerdown', () => { clearTimeout(tLongo); tLongo = setTimeout(() => { tLongo = 'longo'; fecharCapa(); }, 650); });
  el.addEventListener('pointerup', () => { if (tLongo === 'longo'){ tLongo = null; return; } clearTimeout(tLongo); tLongo = null; toqueCapaM(); });
  el.addEventListener('pointercancel', () => { clearTimeout(tLongo); tLongo = null; });
  el.addEventListener('keydown', e => { if (e.key === 'Escape'){ e.preventDefault(); fecharCapa(); } else if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); toqueCapaM(); } });
  addEventListener('resize', () => { if (capaAberta) setTimeout(capaGeo, 60); });
  // Volta a aparecer quando se regressa à app depois de 10 minutos fora.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden){ escondidoEm = Date.now(); if (capaAberta) cancelAnimationFrame(capaQi.raf); return; }
    if (capaAberta){ capaQi.ult = 0; capaQi.raf = requestAnimationFrame(passoCapaM); return; }
    if (escondidoEm && Date.now() - escondidoEm > 10 * 60e3){ escondidoEm = 0; mostrarCapa(); }
  });
}

/* ---------- Mosaico do cultivo no Início ---------- */
function tileCultivo(){
  const c = cultivoMirante(), V = VISUAL_C[VIS_M[c.r]], tes = Object.assign({ativos: c.ativos}, c.hoje), alg = TRES.some(t => c.ativos[t]);
  const barras = TRES.map(t => { const T = TESOUROS[t], at = c.ativos[t] || !alg, fr = at ? clamp((c.hoje[t] || 0) / T.max, 0, 1) : 0;
    return `<div class="cu-t${at ? '' : ' off'}"><span><i class="mk" style="background:${T.cor}"></i>${T.nome}<small> ${T.app}</small></span><b>${at ? `${c.hoje[t] || 0}/${T.max}` : '—'}</b><em><i style="width:${Math.round(fr * 100)}%;background:${T.cor}"></i></em></div>`; }).join('');
  return `<div class="painel tile ti-cult" data-acao="ir" data-v="vCultivo" role="link" tabindex="0" aria-label="Cultivo: ${esc(c.reino)}, ver o detalhe">
    <span class="tile-cab"><i class="mk" style="background:${V.aura}"></i>Cultivo</span>
    <div class="cu-grid"><div class="cu-fig">${avatarM({r: c.r, f: c.pct, mini: true, id: 'ti', tes, desvio: c.desvio, obj: c.objetos})}</div>
      <div class="cu-info"><h2 style="--brilho:${V.aura}">${esc(c.reino)}</h2><p class="sub">${esc(c.nivel)} · fluxo ${c.fluxo.toLowerCase()} <span class="capa-pil">${pilulasHTML(c.pilulas)}</span></p>
        <div class="cu-barra"><i style="width:${Math.max(2, Math.round(c.pct * 100))}%;background:linear-gradient(90deg, ${V.orla}, ${V.aura})"></i></div>
        <p class="cu-num">${c.prox ? `${c.dentro} / ${c.custo} qi · a seguir: ${esc(c.prox)}` : `${c.qi} qi`}</p>
        <div class="cu-tes">${barras}</div>
        ${c.gargalo.preso ? `<p class="cu-aviso">${esc(textoGargalo(c))}</p>` : c.desvio.length ? `<p class="cu-aviso">Desvio de qi: ${c.desvio.map(t => TESOUROS[t].app).join(' e ')} ${c.desvio.length > 1 ? 'esquecidas' : 'esquecida'}.</p>` : ''}</div></div></div>`;
}

const PILULA = cheia => `<svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><g transform="rotate(-40 8 8)"><rect x="2" y="5" width="12" height="6" rx="3" fill="${cheia ? '#4FD6D6' : 'none'}" stroke="#4FD6D6" stroke-opacity="${cheia ? 1 : .45}"/>${cheia ? '<rect x="8" y="5" width="6" height="6" rx="3" fill="#ECE8DE"/>' : ''}</g></svg>`;
const pilulasHTML = n => [0, 1, 2].map(i => PILULA(i < n)).join('');

/* ================= Vista Cultivo: o cultivador, os objetos, o mapa da ascensão e a crónica do mês ================= */
const CURTO_M = ['Mortal', 'Luz Estelar', 'Jade', 'Núcleo Lunar', 'Alma Solar', 'Constelações', 'Nebular', 'Galáxia', 'Firmamento'];
const COR_REINO = ['#6b3346', '#1f2c5c', '#0d4a44', '#2a3d78', '#6a5a2a', '#1a2050', '#5a2a78', '#3a2468', '#7a6420'];
const MESES_PT = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const nomeMes = m => { const [y, mm] = m.split('-').map(Number); return `${MESES_PT[mm - 1]} de ${y}`; };
// Posição vertical de um valor de qi no mapa: cada reino ocupa uma faixa igual.
function yReino(qi, base, bandH){
  const i = nivelEm(NIVEIS_M, qi), r = NIVEIS_M[i].r, ini = NIVEIS_M.find(l => l.r === r).ini, prox = NIVEIS_M.find(l => l.r === r + 1);
  const fr = prox ? clamp((qi - ini) / (prox.ini - ini), 0, 1) : .5;
  return base - (r + fr) * bandH;
}
function svgMapaAsc(c, W){
  const H = W < 560 ? 540 : 600, L = W < 560 ? 86 : 120, R = 16, T = 12, B = 30, bandH = (H - T - B) / 9, base = H - B, h = hojeN();
  if (!c.dias.length) return '<p class="nota-vazia">Quando registares na Garfada, na Forja ou na Nascente, o caminho aparece aqui.</p>';
  const n0 = c.dias[0].n, nFim = Math.max(h + 10, c.projecao ? Math.min(c.projecao.n, h + 200) + 6 : h + 10);
  const X = n => L + (n - n0) / Math.max(1, nFim - n0) * (W - L - R), out = [];
  out.push(`<defs><linearGradient id="maLinha" x1="0" x2="1"><stop offset="0" stop-color="#C9A86A"/><stop offset="1" stop-color="#fff2c4"/></linearGradient>
    <filter id="maBrilho" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.5"/></filter></defs>`);
  for (let i = 0; i < 9; i++){
    const y = base - (i + 1) * bandH, atual = i === c.r;
    out.push(`<rect x="${L}" y="${y.toFixed(1)}" width="${W - L - R}" height="${bandH.toFixed(1)}" fill="${COR_REINO[i]}" opacity="${atual ? .42 : i < c.r ? .26 : .14}"/>
      <line x1="${L}" x2="${W - R}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#fff" stroke-opacity=".07"/>
      <text x="${L - 10}" y="${(y + bandH / 2 - 1).toFixed(1)}" text-anchor="end" class="eixo${atual ? ' forte' : ''}">${ROMANOS[i]} · ${CURTO_M[i]}</text>
      ${atual ? `<rect x="${L}" y="${y.toFixed(1)}" width="${W - L - R}" height="${bandH.toFixed(1)}" fill="none" stroke="#f2d48a" stroke-opacity=".55"/>` : ''}`);
  }
  // Meses no eixo
  const d0 = new Date(n0 * DIA); let m = new Date(Date.UTC(d0.getUTCFullYear(), d0.getUTCMonth() + 1, 1));
  while (m.getTime() / DIA < nFim){ const n = Math.round(m.getTime() / DIA), x = X(n);
    out.push(`<line x1="${x.toFixed(1)}" x2="${x.toFixed(1)}" y1="${T}" y2="${base}" stroke="#fff" stroke-opacity=".05"/><text x="${x.toFixed(1)}" y="${H - 10}" text-anchor="middle" class="eixo">${MESES_PT[m.getUTCMonth()].slice(0, 3)}</text>`);
    m = new Date(Date.UTC(m.getUTCFullYear(), m.getUTCMonth() + 1, 1)); }
  // O caminho do qi
  const pts = c.dias.map(d => `${X(d.n).toFixed(1)} ${yReino(d.qi, base, bandH).toFixed(1)}`), linha = 'M' + pts.join(' L');
  out.push(`<path d="${linha}" fill="none" stroke="#f2d48a" stroke-width="5" opacity=".35" filter="url(#maBrilho)"/><path class="vh-linha" pathLength="1" d="${linha}" fill="none" stroke="url(#maLinha)" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`);
  // Projeção até ao próximo reino
  const ult = c.dias[c.dias.length - 1], yU = yReino(ult.qi, base, bandH);
  if (c.projecao){
    const xp = X(Math.min(c.projecao.n, nFim - 6)), yp = base - (c.r + 1) * bandH;
    out.push(`<path d="M${X(h).toFixed(1)} ${yU.toFixed(1)} L${xp.toFixed(1)} ${yp.toFixed(1)}" stroke="#f2d48a" stroke-width="1.6" stroke-dasharray="4 5" fill="none" opacity=".8"/>
      <circle cx="${xp.toFixed(1)}" cy="${yp.toFixed(1)}" r="4" fill="none" stroke="#f2d48a" stroke-width="1.4"/>
      ${xp - X(h) > 46 ? `<text x="${Math.min(xp, W - R - 4).toFixed(1)}" y="${(yp - 8).toFixed(1)}" text-anchor="end" class="eixo forte">${c.projecao.n <= h + 200 ? dataCurta(c.projecao.n) : 'mais de 6 meses'}</text>` : ''}`);
  }
  // Marcas: reinos rompidos, dias vazios e pílulas
  for (const e of c.eventos){
    const d = c.dias.find(x => x.n === e.n); if (!d) continue;
    const x = X(e.n), y = yReino(d.qi, base, bandH);
    if (e.tipo === 'rompe') out.push(`<path d="M${x} ${y - 9} L${x + 2.6} ${y - 2.6} L${x + 9} ${y} L${x + 2.6} ${y + 2.6} L${x} ${y + 9} L${x - 2.6} ${y + 2.6} L${x - 9} ${y} L${x - 2.6} ${y - 2.6}Z" fill="#fff2c4" stroke="#C9A86A" data-dica="${dica(`<b>${dataCurta(e.n)}</b><span>Rompeste para ${esc(REINOS_M[NIVEIS_M[e.idx].r].nome)}</span>`)}" style="cursor:help"/>`);
    else if (e.tipo === 'perda') out.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.6" fill="#FF6B5E" stroke="#151923" data-dica="${dica(`<b>${dataCurta(e.n)}</b><span>Dia vazio: −${e.qi} qi</span>`)}"/>`);
    else if (e.tipo === 'pilula') out.push(`<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(-40)" data-dica="${dica(`<b>${dataCurta(e.n)}</b><span>Dia vazio, protegido por uma pílula</span>`)}"><rect x="-6" y="-3" width="12" height="6" rx="3" fill="#4FD6D6" stroke="#151923"/></g>`);
  }
  out.push(`<circle class="ma-hoje" cx="${X(h).toFixed(1)}" cy="${yU.toFixed(1)}" r="5.5" fill="#fff" stroke="#f2d48a" stroke-width="2"/><text x="${(X(h) - 9).toFixed(1)}" y="${(yU + 18).toFixed(1)}" text-anchor="end" class="eixo forte">hoje</text>`);
  out.push(`<line x1="${L}" x2="${W - R}" y1="${base}" y2="${base}" stroke="#353D52"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf anim" role="img" aria-label="Mapa da ascensão pelos nove reinos">${out.join('')}</svg>`;
}

// O que ainda dá qi hoje.
function dicasHoje(c){
  const h = hojeN(), k = chaveDe(h), m = IDX.metas, d = IDX.dias.get(k), reg = (D.nas && D.nas.registos[k]) || {}, out = {};
  const j = []; if (!d || d.n < 2) j.push('2 refeições registadas (+4)'); if (!d || Math.abs(d.kcal - m.kcal) > m.kcal * .1) j.push('calorias na meta (+5)'); if (!d || d.prot < m.prot * .9) j.push('proteína na meta (+2)'); if ((D.agua[k] || 0) < m.agua) j.push('água na meta (+1)');
  out.jing = j.length ? 'Falta: ' + j.join(', ') + '.' : 'Tudo feito hoje.';
  out.qi = c.hoje.qi >= 10 ? (c.hoje.qi >= 12 ? 'Treino feito, com recorde.' : 'Treino feito. Um recorde dava mais 2.') : 'Treina hoje (+10, mais 2 com recorde). Ao fechar a semana com a meta cumprida: +12.';
  const s = []; if (!reg.mF) s.push('ritual da manhã'); if (!reg.nF) s.push('ritual da noite'); if (!(D.nas && D.nas.pele.some(x => x.d === k))) s.push('registo da pele');
  out.shen = (s.length ? 'Falta: ' + s.join(', ') + '.' : 'Tudo feito hoje.') + (c.lua.cheia ? ' Lua cheia: vale o dobro.' : '');
  return out;
}
let cronMes = null;
function renderCultivo(){
  const c = cultivoMirante(), V = VISUAL_C[VIS_M[c.r]], P = palcoM(c.r), tes = Object.assign({ativos: c.ativos}, c.hoje), alg = TRES.some(t => c.ativos[t]);
  const ob = c.objetos, dh = dicasHoje(c), mesAtual = chaveData(new Date()).slice(0, 7);
  const meses = [...new Set(c.dias.map(d => d.k.slice(0, 7)))].slice(-4).reverse();
  if (!cronMes || !meses.includes(cronMes)) cronMes = meses[0] || mesAtual;
  const cron = (ML.get('cronicas', {}) || {})[cronMes];
  const cartaObj = (k, vb, titulo, app, o, vazio) => `<div class="ob-carta${o.ativo ? '' : ' off'}"><svg viewBox="${vb}" aria-hidden="true">${o.ativo ? (k === 'espada' ? objetosM({espada: o}, 'ob' + k, false).tras : objetosM({[k]: o}, 'ob' + k, false).frente) : ''}</svg>
    <div><span class="tile-cab">${titulo} · ${app}</span><b>${o.ativo ? esc(o.nome) : 'Por ganhar'}</b><span class="sub">${o.ativo ? esc(o.txt) + (o.prox ? '. ' + esc(o.prox) + '.' : '.') : vazio}</span></div></div>`;
  $('#vCultivo').innerHTML = `<div class="cab-vista"><h1>Cultivo</h1><p class="sub">A comida (Jing), os treinos (Qi) e os rituais (Shen) dão qi ao teu cultivador. Sobe pelos nove céus, do cume do Mirante ao firmamento.</p></div>
  <div class="area-grid">
    <section class="painel largo cult-hero">
      <div class="ch-palco">${P.fundo}<div class="ch-fig">${P.base}${avatarM({r: c.r, f: c.pct, fluxo: Math.max(0, 4 - FLUXOS_M.findIndex(f => f[2] === c.fluxo)), id: 'vh', tes, desvio: c.desvio, obj: ob})}</div></div>
      <div class="ch-info"><span class="tile-cab">Reino ${ROMANOS[c.r]} de IX</span><h2 style="--brilho:${V.aura}">${esc(c.reino)}</h2><p class="sub">${esc(c.nivel)}. ${esc(c.frase)}</p>
        <div class="cu-barra"><i style="width:${Math.max(2, Math.round(c.pct * 100))}%;background:linear-gradient(90deg, ${V.orla}, ${V.aura})"></i></div>
        <p class="cu-num">${c.prox ? `${c.dentro} / ${c.custo} qi · a seguir: ${esc(c.prox)}` : `${c.qi} qi`}</p>
        <dl class="stats"><div><dt>Qi total</dt><dd>${fmtInt(c.qi)}</dd></div><div><dt>Fluxo</dt><dd>${c.fluxo} <small>×${String(c.mult).replace('.', ',')}</small></dd></div>
          <div><dt>Pílulas</dt><dd class="capa-pil">${pilulasHTML(c.pilulas)}</dd></div><div><dt>Lua</dt><dd style="font-size:16px">${c.lua.nome}</dd></div></dl>
        <p class="contexto">${c.gargalo.preso ? esc(textoGargalo(c)) : c.projecao ? `Ao ritmo dos últimos 14 dias (${fmtInt(c.ritmo)} qi por dia), chegas a <b>${esc(c.projecao.reino)}</b> ${c.projecao.dias <= 200 ? `por volta de <b>${dataCurta(c.projecao.n)}</b>` : 'daqui a mais de 6 meses'}.` : 'Regista alguns dias para ver quando chegas ao próximo reino.'}
          ${c.usadas ? ` Já gastaste ${c.usadas} ${c.usadas === 1 ? 'pílula' : 'pílulas'} em dias vazios.` : ''}</p>
        <div class="linha-bt"><button class="bt pri" data-acao="verCapa">Ver o cultivador</button><button class="bt" data-acao="partilharCult">Partilhar imagem</button></div></div>
    </section>
    <section class="painel"><h2>Hoje</h2><p class="sub">O que já deste ao cultivador e o que ainda falta.</p>
      <div class="hoje-tes">${TRES.map(t => { const T = TESOUROS[t], at = c.ativos[t] || !alg, v = c.hoje[t] || 0, mx = t === 'shen' && c.lua.cheia ? 20 : T.max;
        return `<div class="ht${at ? '' : ' off'}"><div class="ht-cab"><span><i class="mk" style="background:${T.cor}"></i>${T.nome} <small>${T.app}</small></span><b>${at ? `${v}<small>/${mx}</small>` : '—'}</b></div>
          <em><i style="width:${at ? Math.round(clamp(v / mx, 0, 1) * 100) : 0}%;background:${T.cor}"></i></em><p>${at ? dh[t] : `Sem registos da ${T.app} nos últimos 30 dias: não conta, nem para o bem nem para o mal.`}</p></div>`; }).join('')}</div></section>
    <section class="painel"><h2>Os teus objetos</h2><p class="sub">Cada app dá-lhe um objeto que cresce contigo.</p>
      <div class="obj-lista">${cartaObj('espada', '172 44 104 168', 'Espada', 'Forja', ob.espada, 'Treina na Forja para a forjares.')}${cartaObj('cabaca', '88 218 40 56', 'Cabaça de elixir', 'Garfada', ob.cabaca, 'Regista a comida na Garfada para a encheres.')}${cartaObj('jade', '172 218 40 56', 'Pendente de jade', 'Nascente', ob.jade, 'Faz os rituais da Nascente para o acenderes.')}</div>
      <p class="contexto">Pílulas: cada 7 dias equilibrados seguidos dão uma (máximo 3). Um dia vazio gasta uma em vez de te tirar qi.</p></section>
    <section class="painel largo"><h2>Mapa da ascensão</h2><p class="sub">O teu qi pelos nove reinos. Estrela: rompeste um reino. Ponto vermelho: dia vazio. Cápsula: pílula gasta. Tracejado: quando chegas ao próximo, ao ritmo atual.</p>
      <div class="graf-caixa" data-graf="mapaAsc"></div></section>
    <section class="painel largo cronica"><h2>Crónica do mês</h2>
      <div class="chips" role="group" aria-label="Mês">${meses.map(m => `<button class="chip ${m === cronMes ? 'on' : ''}" data-acao="cronMes" data-v="${m}">${MESES_PT[+m.slice(5) - 1]}</button>`).join('')}</div>
      ${cron ? `<h3 class="cron-titulo">${esc(cron.titulo)}</h3>${cron.texto.split(/\n+/).filter(Boolean).map(p => `<p class="cron-p">${esc(p)}</p>`).join('')}<p class="contexto">Escrita pela IA a ${dataCurta(numDe(chaveData(new Date(cron.ts))))}${cronMes === mesAtual ? ', com o mês ainda em curso' : ''}.</p>
        <div class="linha-bt"><button class="bt" data-acao="cronica" data-v="${cronMes}">Escrever de novo</button></div>`
      : `<p class="sub">O cronista da montanha escreve, em estilo wuxia, o que se passou em ${nomeMes(cronMes)}: os reinos que rompeste, onde fraquejaste e o conselho do mestre.${cronMes === mesAtual ? ' O mês ainda não acabou.' : ''}</p>
        ${D.ia && D.ia.chave ? `<div class="linha-bt"><button class="bt pri" data-acao="cronica" data-v="${cronMes}">Escrever a crónica de ${MESES_PT[+cronMes.slice(5) - 1]}</button></div>` : '<div class="linha-bt"><button class="bt" data-acao="irLigacoes">Pôr a chave do Gemini</button></div>'}`}
    </section>
  </div>`;
  GRAFS.mapaAsc = w => svgMapaAsc(c, w);
  desenhar($('#vCultivo'));
}

/* ---------- A crónica do mês (IA) ---------- */
function resumoMesCultivo(mes){
  const c = cultivoMirante(), dm = c.dias.filter(d => d.k.startsWith(mes)); if (!dm.length) return null;
  const i0 = c.dias.indexOf(dm[0]), qiIni = i0 > 0 ? c.dias[i0 - 1].qi : 0, qiFim = dm[dm.length - 1].qi;
  const rI = infoNivel(REINOS_M, NIVEIS_M, qiIni), rF = infoNivel(REINOS_M, NIVEIS_M, qiFim), ev = c.eventos.filter(e => chaveDe(e.n).startsWith(mes));
  const med = t => Math.round(media(dm.map(d => d.p[t])) * 10) / 10, semanas = [];
  for (let seg = segundaDe(dm[0].n); seg <= dm[dm.length - 1].n; seg += 7){ try { const S = semana(seg); if (S.nota && S.nota.total != null) semanas.push({semana: rotSemana(seg), nota: S.nota.total}); } catch(e){} }
  const melhor = semanas.slice().sort((a, b) => b.nota - a.nota)[0];
  return {mes: nomeMes(mes), em_curso: mes === chaveData(new Date()).slice(0, 7), dias_contados: dm.length, reino_no_inicio: `${rI.reino} (${rI.nivel})`, reino_no_fim: `${rF.reino} (${rF.nivel})`,
    reinos_rompidos: ev.filter(e => e.tipo === 'rompe').map(e => REINOS_M[NIVEIS_M[e.idx].r].nome), qi_ganho: dm.reduce((s, d) => s + d.ganho, 0), qi_perdido: dm.reduce((s, d) => s + d.perda, 0),
    dias_vazios: ev.filter(e => e.tipo === 'perda').length, pilulas_gastas: ev.filter(e => e.tipo === 'pilula').length, dias_equilibrados: dm.filter(d => d.equilibrado).length,
    media_por_dia: {jing_comida_max_12: med('jing'), qi_treino_max_12: med('qi'), shen_rituais_max_10: med('shen')}, treinos: dm.filter(d => d.p.qi >= 10).length, dias_com_recorde: dm.filter(d => d.p.qi >= 12).length,
    desvios: [...new Set(dm.flatMap(d => d.desvio))].map(t => TESOUROS[t].app), notas_das_semanas: semanas, melhor_semana: melhor || null,
    objetos: {espada: c.objetos.espada.ativo ? c.objetos.espada.nome : null, cabaca: c.objetos.cabaca.ativo ? c.objetos.cabaca.nome : null, jade: c.objetos.jade.ativo ? c.objetos.jade.nome : null}};
}
async function pedirCronica(mes){
  const R = resumoMesCultivo(mes); if (!R) throw new Error('Não há dias registados neste mês.');
  const prompt = `És o cronista da montanha do Mirante. Escreve em português de Portugal (PT-PT) a crónica de ${R.mes} do caminho de cultivo de um praticante, no estilo de um romance wuxia (mestres, qi, reinos, tribulações), mas fiel aos números.
O qi vem de três tesouros: Jing é a alimentação (registada na Garfada), Qi são os treinos de ginásio (Forja) e Shen são os rituais de cuidado da pele (Nascente). Há nove reinos, do cume do Mirante ao firmamento.
Escreve três parágrafos curtos (no total até 170 palavras): o que conquistou, onde fraquejou e um conselho do mestre para o mês seguinte.${R.em_curso ? ' O mês ainda está a decorrer: fala do que já aconteceu.' : ''}
Não inventes acontecimentos que não estão nos dados; podes usar metáforas. Sem emojis, sem termos em inglês, sem conselhos médicos.
Responde só com JSON no formato {"titulo": "título curto e épico", "texto": "os três parágrafos separados por \\n\\n"}.
Dados: ${JSON.stringify(R)}`;
  const txt = await IA.pedir({texto: prompt, json: true, chave: D.ia.chave, modelo: D.ia.modelo, temperatura: .8});
  const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); let o;
  try { o = JSON.parse(txt.slice(a, b + 1)); } catch(e){ throw new Error('A IA respondeu num formato inválido. Tenta outra vez.'); }
  if (!o.texto) throw new Error('A IA não escreveu a crónica. Tenta outra vez.');
  const todas = ML.get('cronicas', {}) || {}; todas[mes] = {ts: Date.now(), titulo: String(o.titulo || 'Crónica de ' + R.mes).slice(0, 120), texto: String(o.texto).slice(0, 2500)};
  ML.set('cronicas', todas); if (typeof agendarSyncMirante === 'function') agendarSyncMirante();
  return todas[mes];
}

/* ---------- Imagem do cultivador para partilhar ---------- */
const svgParaImg = async (svg, w, h) => { const img = new Image(); img.width = w; img.height = h;
  img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg.replace('<svg ', `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" `)); await img.decode(); return img; };
async function imagemCultivo(){
  const c = cultivoMirante(), V = VISUAL_C[VIS_M[c.r]], P = palcoM(c.r), W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['600 90px Fraunces', 'italic 500 44px Fraunces', '700 30px Cinzel'].map(f => document.fonts.load(f))); } catch(e){}
  g.fillStyle = '#05060d'; g.fillRect(0, 0, W, H);
  try { const fundo = await svgParaImg(P.fundo.replace('preserveAspectRatio="xMidYMax slice"', ''), W, W * 2); g.drawImage(fundo, 0, H - W * 2); } catch(e){}
  const fw = 660, fh = fw * 1.2, fx = (W - fw) / 2, fy = 270;
  try { const base = await svgParaImg(P.base, fw * 1.16, fw * 1.16 * 260 / 300); g.drawImage(base, fx - fw * .08, fy + fh * .83); } catch(e){}
  try { const av = avatarM({r: c.r, f: c.pct, id: 'im', tes: Object.assign({ativos: c.ativos}, c.hoje), desvio: c.desvio, obj: c.objetos}).replace('<g class="c-olhos-f">', '<g class="c-olhos-f" display="none">');
    g.drawImage(await svgParaImg(av, fw, fh), fx, fy); } catch(e){}
  const sombra = g.createLinearGradient(0, H - 330, 0, H); sombra.addColorStop(0, 'rgba(3,5,12,0)'); sombra.addColorStop(.4, 'rgba(3,5,12,.85)'); sombra.addColorStop(1, 'rgba(3,5,12,.96)');
  g.fillStyle = sombra; g.fillRect(0, H - 330, W, 330);
  const topo = g.createLinearGradient(0, 0, 0, 300); topo.addColorStop(0, 'rgba(3,5,12,.7)'); topo.addColorStop(1, 'rgba(3,5,12,0)'); g.fillStyle = topo; g.fillRect(0, 0, W, 300);
  g.textAlign = 'center';
  g.font = '700 30px Cinzel, serif'; g.fillStyle = '#C9A86A'; g.fillText('M I R A N T E', W / 2, 92);
  g.font = '600 86px Fraunces, serif'; g.fillStyle = '#f7f3e8'; g.shadowColor = V.aura; g.shadowBlur = 30; g.fillText(c.reino, W / 2, 190, W - 100); g.shadowBlur = 0;
  g.font = 'italic 500 44px Fraunces, serif'; g.fillStyle = '#C9A86A'; g.fillText(c.nivel, W / 2, 250);
  // Barra e números
  const bx = 120, by = H - 228, bw = W - 240;
  g.fillStyle = 'rgba(255,255,255,.12)'; g.beginPath(); g.roundRect ? g.roundRect(bx, by, bw, 14, 7) : g.rect(bx, by, bw, 14); g.fill();
  const gb = g.createLinearGradient(bx, 0, bx + bw, 0); gb.addColorStop(0, V.orla); gb.addColorStop(1, V.aura); g.fillStyle = gb;
  g.beginPath(); g.roundRect ? g.roundRect(bx, by, Math.max(14, bw * c.pct), 14, 7) : g.rect(bx, by, bw * c.pct, 14); g.fill();
  g.font = '400 30px system-ui, sans-serif'; g.fillStyle = '#A2A8B7'; g.textAlign = 'left'; g.fillText(c.prox ? `${c.dentro} / ${c.custo} qi` : `${c.qi} qi`, bx, by + 56);
  g.textAlign = 'right'; g.fillText(`Fluxo: ${c.fluxo} · ${fmtInt(c.qi)} qi no total`, bx + bw, by + 56);
  const objs = [c.objetos.espada.ativo && c.objetos.espada.nome, c.objetos.cabaca.ativo && c.objetos.cabaca.nome, c.objetos.jade.ativo && c.objetos.jade.nome].filter(Boolean);
  g.textAlign = 'center'; g.font = 'italic 500 36px Fraunces, serif'; g.fillStyle = '#ECE8DE';
  if (objs.length) g.fillText(objs.join('  ·  '), W / 2, by + 118, W - 160);
  g.font = '400 26px system-ui, sans-serif'; g.fillStyle = '#6D7385'; g.fillText('Comida da Garfada, treinos da Forja, rituais da Nascente.', W / 2, H - 34);
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
