'use strict';
/* Mirante — a pele (dados da Nascente).
   Rituais de manhã e de noite, registos da pele, frascos e o reino de cultivo, com as mesmas regras da Nascente.
   Cruza com a Garfada: o açúcar dos dias anteriores e as borbulhas, a água e a secura. */

const PELE_MED = [
  ['geral', 'Estado geral', ['Má', 'Fraca', 'Razoável', 'Boa', 'Ótima'], true],
  ['oleo', 'Oleosidade', ['Nenhuma', 'Pouca', 'Média', 'Bastante', 'Muita'], false],
  ['secura', 'Secura', ['Nenhuma', 'Pouca', 'Média', 'Bastante', 'Muita'], false],
  ['borbulhas', 'Borbulhas', ['Nenhuma', '1 ou 2', 'Algumas', 'Várias', 'Muitas'], false],
  ['irritacao', 'Irritação', ['Nenhuma', 'Ligeira', 'Média', 'Forte', 'Muito forte'], false]
];
const PELE_MED_I = Object.fromEntries(PELE_MED.map(m => [m[0], m]));
const TIPO_FRASCO = {desmaq: 'Desmaquilhante', limpeza: 'Limpeza', esfoliante: 'Esfoliante', mascara: 'Máscara', tonico: 'Tónico', serum: 'Sérum', tratamento: 'Tratamento',
  olhos: 'Contorno de olhos', outro: 'Outro', hidratante: 'Hidratante', oleo: 'Óleo facial', mascaraNoite: 'Máscara de noite', protetor: 'Protetor solar', labios: 'Lábios'};
const ATIVO_C = {retinoide: 'Retinoide', aha: 'AHA', bha: 'BHA', pha: 'PHA', vitc: 'Vit. C', niacinamida: 'Niacinamida', peroxido: 'Peróxido', azelaico: 'Azelaico', cobre: 'Cobre',
  peptidos: 'Péptidos', hialuronico: 'Hialurónico', ceramidas: 'Ceramidas', ureia: 'Ureia', enxofre: 'Enxofre', zinco: 'Zinco', argila: 'Argila', fisico: 'Grânulos', enzimas: 'Enzimas',
  despigmentante: 'Despigmentante', bakuchiol: 'Bakuchiol', calmante: 'Calmante', antioxidante: 'Antioxidante', spf: 'SPF'};
const REINOS_P = [
  [0, 'Despertar do Qi', 'Sentes o primeiro fio de energia na pele.'], [10, 'Refinamento do Corpo', 'A rotina começa a criar raízes.'],
  [30, 'Fundação', 'A barreira da pele fortalece-se.'], [70, 'Núcleo Dourado', 'A constância tornou-se natural.'],
  [140, 'Alma Nascente', 'A pele renova-se como água de nascente.'], [250, 'Transformação Divina', 'Poucos chegam tão longe.'], [400, 'Imortal da Pele de Jade', 'Pele de jade, espírito sereno.']
];

/* ---------- Rituais ---------- */
function ritualDia(k){
  const r = (D.nas && D.nas.registos[k]) || {}, nm = ehObj(r.m) ? Object.keys(r.m).length : 0, nn = ehObj(r.n) ? Object.keys(r.n).length : 0;
  return {m: !!r.mF, n: !!r.nF, mP: !r.mF && nm > 0, nP: !r.nF && nn > 0, passos: nm + nn};
}
// Sessões que já deviam estar feitas: a manhã conta a partir do meio-dia; a noite, a partir das 23h (ou se já foi feita).
function sessoesPossiveis(n){
  const h = hojeN(), H = new Date().getHours(), k = chaveDe(n), r = ritualDia(k);
  if (n < h) return 2;
  if (n > h) return 0;
  return (r.m || H >= 12 ? 1 : 0) + (r.n || H >= 23 ? 1 : 0);
}
function pelePeriodo(ini, fim){
  const dias = [];
  let feitas = 0, possiveis = 0;
  for (let n = ini; n <= fim; n++){
    const k = chaveDe(n), r = ritualDia(k), p = sessoesPossiveis(n);
    possiveis += p; feitas += Math.min(p, (r.m ? 1 : 0) + (r.n ? 1 : 0));
    dias.push(Object.assign({n, k, i: (new Date(n * DIA).getUTCDay() + 6) % 7, futuro: n > hojeN(), hoje: n === hojeN()}, r));
  }
  const kIni = chaveDe(ini), kFim = chaveDe(fim), regs = (D.nas ? D.nas.pele : []).filter(x => x.d >= kIni && x.d <= kFim);
  const medias = {};
  for (const [m] of PELE_MED){ const v = regs.filter(x => x[m] != null).map(x => +x[m]); medias[m] = v.length ? media(v) : null; }
  const sinais = {};
  for (const x of regs) for (const s of x.sinais || []) sinais[s] = (sinais[s] || 0) + 1;
  return {dias, feitas, possiveis, adesao: possiveis ? feitas / possiveis : null, regs, medias, sinais};
}
function notaPele(P){
  if (P.adesao == null) return null;
  const g = P.medias.geral;
  return Math.round(100 * (g == null ? P.adesao : P.adesao * .7 + g / 4 * .3));
}
function reinoPele(){
  const pts = Object.values(D.nas.registos).reduce((s, r) => s + (r.mF ? 1 : 0) + (r.nF ? 1 : 0), 0);
  let i = 0; while (i + 1 < REINOS_P.length && pts >= REINOS_P[i + 1][0]) i++;
  const prox = REINOS_P[i + 1];
  return {pts, i, nome: REINOS_P[i][1], frase: REINOS_P[i][2], prox: prox ? prox[1] : null, falta: prox ? prox[0] - pts : 0, pct: prox ? (pts - REINOS_P[i][0]) / (prox[0] - REINOS_P[i][0]) : 1};
}
function sequenciaPele(){
  let n = hojeN(), seq = 0;
  const feito = k => { const r = D.nas.registos[k]; return !!(r && (r.mF || r.nF)); };
  if (!feito(chaveDe(n))) n--;
  while (seq < 1000 && feito(chaveDe(n))){ seq++; n--; }
  return seq;
}

/* ---------- Frascos ---------- */
function validadeFrasco(p){
  let fim = null;
  if (p.validade && /^\d{4}-\d{2}/.test(p.validade)) fim = numDe(p.validade.length === 7 ? p.validade + '-28' : p.validade.slice(0, 10));
  if (p.aberto && +p.pao){ const a = new Date(p.aberto + 'T12:00:00'); a.setMonth(a.getMonth() + +p.pao); const n2 = numDe(chaveData(a)); fim = fim == null ? n2 : Math.min(fim, n2); }
  if (fim == null) return null;
  const dias = fim - hojeN();
  return {fim, dias, estado: dias < 0 ? 'expirado' : dias <= 30 ? 'expira' : 'ok'};
}
function frascos(){
  const ps = D.nas ? D.nas.produtos : [];
  const uso = ps.filter(p => !p.fim && !p.pausa), pausa = ps.filter(p => !p.fim && p.pausa), acabados = ps.filter(p => p.fim).sort((a, b) => String(b.fim).localeCompare(String(a.fim)));
  const alertas = uso.map(p => ({p, v: validadeFrasco(p)})).filter(x => x.v && x.v.estado !== 'ok').sort((a, b) => a.v.dias - b.v.dias);
  const temSPF = uso.some(p => p.tipo === 'protetor' || (p.ativos || []).includes('spf'));
  const fotossens = uso.filter(p => (p.ativos || []).some(a => ['retinoide', 'aha', 'bha', 'vitc'].includes(a)));
  return {uso, pausa, acabados, alertas, temSPF, fotossens};
}
// Uso do protetor solar: manhãs (feitas) em que o protetor foi marcado.
function usoProtetor(ini, fim){
  const ids = new Set((D.nas ? D.nas.produtos : []).filter(p => p.tipo === 'protetor' || (p.ativos || []).includes('spf')).map(p => p.id));
  if (!ids.size) return null;
  let manhas = 0, com = 0;
  for (let n = ini; n <= fim; n++){ const r = D.nas.registos[chaveDe(n)]; if (r && ehObj(r.m) && Object.keys(r.m).length){ manhas++; if (Object.keys(r.m).some(id => ids.has(id))) com++; } }
  return manhas ? {manhas, com} : null;
}

/* ---------- Cruzamentos com a Garfada ---------- */
// Para cada registo da pele, a média de açúcar (e de água) nos dias anteriores; compara os dias de pele pior com os de pele melhor.
function cruzamentosPele(){
  if (!D.temGarfada || !D.nas || D.nas.pele.length < 6) return [];
  const out = [], regs = D.nas.pele;
  const antes = (k, f, nd) => { const n = numDe(k), v = []; for (let j = 1; j <= nd; j++){ const x = f(chaveDe(n - j)); if (x != null) v.push(x); } return v.length >= Math.ceil(nd / 2) ? media(v) : null; };
  const acucarDe = k => { const c = IDX.dias.get(k); return c && c.kcal >= 800 ? c.acucar : null; };
  const aguaDe = k => D.agua[k] || null;
  const comparar = (campo, f, nd, limiar) => {
    const alto = [], baixo = [];
    for (const r of regs){ if (r[campo] == null) continue; const v = antes(r.d, f, nd); if (v == null) continue; (+r[campo] >= limiar ? alto : baixo).push(v); }
    return alto.length >= 3 && baixo.length >= 3 ? {alto: media(alto), baixo: media(baixo), nA: alto.length, nB: baixo.length} : null;
  };
  const a = comparar('borbulhas', acucarDe, 3, 2);
  if (a){
    const dif = a.alto - a.baixo;
    out.push({id: 'acucar', titulo: 'Açúcar e borbulhas', rotA: 'Antes de dias com borbulhas', rotB: 'Antes de dias sem borbulhas', a: a.alto, b: a.baixo, un: 'g de açúcar por dia', nA: a.nA, nB: a.nB,
      forte: dif > 12, txt: dif > 12 ? `Nos 3 dias antes dos registos com borbulhas comeste em média <b>${fmtInt(a.alto)} g de açúcar</b> por dia, contra ${fmtInt(a.baixo)} g antes dos dias de pele limpa. Pode haver relação: experimenta baixar o açúcar e vê se as borbulhas acompanham.`
        : `O açúcar dos dias anteriores não parece mexer com as borbulhas: ${fmtInt(a.alto)} g contra ${fmtInt(a.baixo)} g.`});
  }
  const w = comparar('secura', aguaDe, 2, 2);
  if (w){
    const dif = w.baixo - w.alto;
    out.push({id: 'agua', titulo: 'Água e secura', rotA: 'Antes de dias com a pele a repuxar', rotB: 'Antes de dias sem secura', a: w.alto / 1000, b: w.baixo / 1000, un: 'L de água por dia', nA: w.nA, nB: w.nB, dec: true,
      forte: dif > 250, txt: dif > 250 ? `Antes dos dias com a pele a repuxar bebeste <b>${fmt1(w.alto / 1000)} L</b> por dia, contra ${fmt1(w.baixo / 1000)} L antes dos outros. Beber mais pode ajudar.`
        : `A água dos dias anteriores não parece mexer com a secura: ${fmt1(w.alto / 1000)} L contra ${fmt1(w.baixo / 1000)} L.`});
  }
  return out;
}

/* ---------- Arte da Nascente (desenhos originais da app) ---------- */
const NAS_LOTUS = `<g fill="none" stroke-linecap="round" stroke-linejoin="round">
  <path d="M50 74c-9-6-13-15-13-25 6 4 10 8 13 13 3-5 7-9 13-13 0 10-4 19-13 25z" fill="url(#nasLot)" fill-opacity=".25" stroke="url(#nasLot)" stroke-width="1.6"/>
  <path d="M50 62c-4-8-4-17 0-28 4 11 4 20 0 28z" fill="url(#nasLot)" fill-opacity=".35" stroke="url(#nasLot)" stroke-width="1.6"/>
  <path d="M37 49c-8-2-14-1-18 3 4 10 14 17 31 22M63 49c8-2 14-1 18 3-4 10-14 17-31 22" stroke="url(#nasLot)" stroke-width="1.6"/></g>`;
const NAS_SOL = `<circle cx="24" cy="28" r="10" fill="#e3c47e" fill-opacity=".25" stroke="#e3c47e" stroke-width="1.6"/><path d="M24 8v5M10 14l3.5 3.5M38 14l-3.5 3.5M5 28h5M38 28h5" stroke="#e3c47e" stroke-width="1.6" stroke-linecap="round"/>`;
const NAS_LUA = `<path d="M31 9a12 12 0 1 0 8 19A10 10 0 0 1 31 9z" fill="#f3ead2" fill-opacity=".22" stroke="#f3ead2" stroke-width="1.6"/><circle cx="10" cy="10" r="1" fill="#f3ead2"/><circle cx="40" cy="7" r=".8" fill="#f3ead2"/>`;
// A paisagem da Nascente (montanhas, cascata e lago, da app original), com o sol e a lua acesos quando o ritual da manhã e o da noite estão feitos.
// O viewBox é só a zona que tem de se ver sempre; com "meet", as caixas largas mostram mais serra para os lados (as montanhas repetem-se em espelho)
// e as altas mostram mais céu, sem cortar o sol, a lua nem o lago.
let nNas = 0;
function svgNascente(rit, opt = {}){
  const u = 'nas' + (++nNas), lit = v => v ? 1 : .22;
  const serra = (d, f, op) => [['', 0], ['scale(-1 1)', 1], ['translate(800 0) scale(-1 1)', 1], ['translate(-800 0)', 0], ['translate(800 0)', 0], ['translate(-800 0) scale(-1 1)', 1], ['translate(1600 0) scale(-1 1)', 1]]
    .map(([t]) => `<path${t ? ` transform="${t}"` : ''} d="${d}" fill="url(#${u}${f})"${op ? ` opacity="${op}"` : ''}/>`).join('');
  return `<svg class="nascente-cena" viewBox="-50 344 500 336" preserveAspectRatio="xMidYMid meet" role="img" aria-label="A nascente: ritual da manhã ${rit.m ? 'feito' : 'por fazer'}, ritual da noite ${rit.n ? 'feito' : 'por fazer'}">
    <defs>
      <linearGradient id="${u}C" gradientUnits="userSpaceOnUse" x1="0" y1="250" x2="0" y2="640"><stop offset="0" stop-color="#0e2622"/><stop offset=".55" stop-color="#12302b"/><stop offset="1" stop-color="#0a1c19"/></linearGradient>
      <linearGradient id="${u}M1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16332e"/><stop offset="1" stop-color="#0a1a17"/></linearGradient>
      <linearGradient id="${u}M2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#10261f"/><stop offset="1" stop-color="#081412"/></linearGradient>
      <linearGradient id="${u}M3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0b1c18"/><stop offset="1" stop-color="#050d0c"/></linearGradient>
      <linearGradient id="${u}L" gradientUnits="userSpaceOnUse" x1="0" y1="640" x2="0" y2="800"><stop offset="0" stop-color="#123631" stop-opacity=".9"/><stop offset="1" stop-color="#06110f"/></linearGradient>
      <linearGradient id="${u}K" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfeee6" stop-opacity="0"/><stop offset=".3" stop-color="#cfeee6" stop-opacity=".55"/><stop offset="1" stop-color="#cfeee6" stop-opacity=".15"/></linearGradient>
      <radialGradient id="${u}G"><stop offset="0" stop-color="#f6efd8" stop-opacity=".75"/><stop offset=".35" stop-color="#9fd3c4" stop-opacity=".12"/><stop offset="1" stop-color="#9fd3c4" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}S"><stop offset="0" stop-color="#e3c47e" stop-opacity=".6"/><stop offset="1" stop-color="#e3c47e" stop-opacity="0"/></radialGradient>
      <linearGradient id="nasLot" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e9fff7"/><stop offset="1" stop-color="#5fb89a"/></linearGradient>
      <filter id="${u}B" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="9"/></filter>
    </defs>
    <rect x="-1400" y="-400" width="3200" height="1200" fill="url(#${u}C)"/>
    <g class="nas-astro${rit.m ? ' aceso' : ''}" transform="translate(-34 352)" opacity="${lit(rit.m)}">${rit.m ? `<circle cx="24" cy="28" r="30" fill="url(#${u}S)"/>` : ''}${NAS_SOL}</g>
    <g class="nas-astro${rit.n ? ' aceso' : ''}" transform="translate(392 356)" opacity="${lit(rit.n)}">${rit.n ? `<circle cx="28" cy="20" r="30" fill="url(#${u}G)"/>` : ''}${NAS_LUA}</g>
    ${serra('M0 470 L40 430 L70 445 L110 380 L140 410 L175 350 L205 395 L240 360 L280 420 L320 370 L360 430 L400 400 V800 H0Z', 'M1', '.75')}
    ${serra('M0 520 L35 490 L60 505 L95 450 L120 470 L150 430 L170 455 L195 440 L230 500 L265 470 L300 515 L340 470 L370 495 L400 470 V800 H0Z', 'M2')}
    <path class="nas-cascata" d="M196 444 C197 480 194 520 196 585" stroke="url(#${u}K)" stroke-width="3" fill="none"/>
    ${serra('M0 590 C60 570 120 600 170 585 C230 568 300 600 400 580 V800 H0Z', 'M3')}
    <rect x="-1400" y="640" width="3200" height="200" fill="url(#${u}L)"/>
    <path d="M-1400 640 H1800" stroke="#9fd3c4" stroke-opacity=".12"/>
    <ellipse class="nas-nevoa" cx="120" cy="600" rx="260" ry="14" fill="#cfeee6" opacity=".07" filter="url(#${u}B)"/>
    <ellipse class="nas-nevoa n2" cx="300" cy="560" rx="230" ry="12" fill="#cfeee6" opacity=".06" filter="url(#${u}B)"/>
    <g fill="#050d0c"><path d="M18 640 c2 -24 6 -40 4 -60 c3 18 4 36 2 60z"/><path d="M372 640 c-2 -18 -5 -30 -3 -48 c-4 14 -5 30 -3 48z"/></g>
    <g class="nas-ondas" fill="none"><ellipse class="nas-an a1" cx="200" cy="664" rx="70" ry="9" stroke="#7fd1b4" stroke-width="1.2"/><ellipse class="nas-an a2" cx="200" cy="664" rx="44" ry="6" stroke="#bff0dc" stroke-width="1.1"/></g>
    <g transform="translate(176 618) scale(.48)">${NAS_LOTUS}</g>
  </svg>`;
}
function glifoReinoP(i){
  const aneis = Array.from({length: Math.min(i + 1, 7)}, (_, k) => `<ellipse cx="32" cy="50" rx="${8 + k * 3.6}" ry="${2 + k * .9}" stroke="#7fd1b4" stroke-opacity="${.75 - k * .08}"/>`).join('');
  return `<svg class="glifo-reino" viewBox="0 0 64 64" fill="none" stroke-width="1.3" aria-hidden="true">${aneis}
    <path d="M32 46c-6-4-9-10-9-17 4 3 7 6 9 9 2-3 5-6 9-9 0 7-3 13-9 17z" fill="#e3c47e" fill-opacity="${.15 + i * .1}" stroke="#e3c47e"/>
    <path d="M32 37c-3-6-3-12 0-20 3 8 3 14 0 20z" fill="#e3c47e" fill-opacity="${.2 + i * .1}" stroke="#e3c47e"/>
    ${i >= 3 ? '<circle cx="32" cy="10" r="3" fill="#f6e2ad" fill-opacity=".8"/>' : ''}${i >= 5 ? '<path d="M24 8l-3-3M40 8l3-3M32 3V1" stroke="#f6e2ad"/>' : ''}</svg>`;
}
const astroMini = (q, estado) => `<svg class="astro-mini ${estado}" viewBox="0 0 48 48" fill="none" aria-hidden="true">${q === 'm' ? NAS_SOL : NAS_LUA}</svg>`;

/* ---------- Gráficos da pele ---------- */
// Uma medida da pele ao longo do tempo (0 a 4, com as palavras da Nascente), com os frascos que entraram na rotina marcados.
function svgPeleLinha(campo, ini, W){
  const [, nome, esc4, maisMelhor] = PELE_MED_I[campo], H = 230, L = 74, R = 14, T = 16, B = 40;
  const kIni = chaveDe(ini), regs = D.nas.pele.filter(x => x.d >= kIni && x[campo] != null), h = hojeN();
  if (regs.length < 2) return `<p class="nota-vazia">Com dois ou mais registos da pele neste período, aparece aqui a evolução.</p>`;
  const X = n => L + (n - ini) / Math.max(1, h - ini) * (W - L - R), Y = v => T + (1 - v / 4) * (H - T - B), out = [];
  for (let v = 0; v <= 4; v++) out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" class="grelha"/><text x="${L - 8}" y="${r1(Y(v) + 4)}" text-anchor="end" class="eixo">${esc4[v]}</text>`);
  // Zona boa: de "Boa" para cima (estado geral) ou de "Pouca" para baixo (as outras)
  out.push(`<rect x="${L}" y="${r1(maisMelhor ? Y(4) : Y(1))}" width="${W - L - R}" height="${r1(maisMelhor ? Y(3) - Y(4) : Y(0) - Y(1))}" fill="${COR.pele}" opacity=".07"/>`);
  const nt = Math.min(5, Math.max(2, Math.floor((W - L - R) / 80)));
  for (let i = 0; i < nt; i++){ const n = Math.round(ini + (h - ini) * i / (nt - 1)); out.push(`<text x="${r1(X(n))}" y="${H - 22}" text-anchor="${i === 0 ? 'start' : i === nt - 1 ? 'end' : 'middle'}" class="eixo">${dataCurta(n)}</text>`); }
  // Frascos que entraram (triângulos dourados por baixo do eixo)
  for (const p of D.nas.produtos) if (p.inicio && p.inicio >= kIni){
    const x = X(numDe(p.inicio));
    out.push(`<line x1="${r1(x)}" x2="${r1(x)}" y1="${T}" y2="${H - B}" stroke="${COR.ouro}" stroke-opacity=".28" stroke-dasharray="2 3"/>
      <path d="M${r1(x - 5)} ${H - 6}L${r1(x)} ${H - 14}L${r1(x + 5)} ${H - 6}Z" fill="${COR.ouro}" data-dica="${dica(`<b>${esc(p.nome)}</b><span>Entrou na rotina a ${dataCurta(numDe(p.inicio))}</span>`)}" style="cursor:help"/>`);
  }
  // Média móvel (3 registos) e os registos
  const pts = regs.map(x => ({n: numDe(x.d), v: +x[campo], x}));
  const suave = pts.map((p, i) => { const j = pts.slice(Math.max(0, i - 2), i + 1); return {n: p.n, v: media(j.map(q => q.v))}; });
  out.push(`<path class="vh-linha" pathLength="1" d="M${suave.map(p => r1(X(p.n)) + ' ' + r1(Y(p.v))).join(' L')}" fill="none" stroke="${COR.pele}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`);
  pts.forEach(p => out.push(`<circle cx="${r1(X(p.n))}" cy="${r1(Y(p.v))}" r="3.4" fill="${COR.pele}" fill-opacity=".45" stroke="#151923" stroke-width="1.2" data-dica="${dica(`<b>${dataCurta(p.n)}</b><span><i class="mk pele"></i>${nome}: ${esc4[p.v]}</span>${(p.x.sinais || []).length ? `<span>${esc(p.x.sinais.join(', '))}</span>` : ''}`)}"/>`));
  out.push(`<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="${COR.aresta2}"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf anim" role="img" aria-label="${nome} ao longo do tempo">${out.join('')}</svg>`;
}
// Os rituais da semana: sete dias, manhã e noite.
function htmlRituaisSemana(P){
  return `<div class="rituais-sem">${P.dias.map(d => {
    const est = q => d.futuro ? 'futuro' : d[q] ? 'feito' : d[q + 'P'] ? 'parcial' : (d.hoje && sessoesPossiveis(d.n) < (q === 'm' ? 1 : 2) ? 'espera' : 'falhou');
    const em = est('m'), en = est('n'), txt = {feito: 'feito', parcial: 'a meio', falhou: 'por fazer', espera: 'ainda não', futuro: ''};
    return `<div class="rs-dia${d.hoje ? ' hoje' : ''}" data-dica="${dica(`<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b><span>Manhã: ${txt[em] || '—'}</span><span>Noite: ${txt[en] || '—'}</span>`)}">
      <span class="rs-l">${INICIAIS[d.i]}</span>${astroMini('m', em)}${astroMini('n', en)}</div>`; }).join('')}</div>`;
}
