'use strict';
/* Mirante — o caminho do cultivo.
   Os Três Tesouros dão qi: Jing (a comida, da Garfada), Qi (os treinos, da Forja) e Shen (os rituais, da Nascente); a Forma (o peso) dá um pouco.
   Nove reinos, do cume do Mirante ao firmamento. Tudo sai dos registos fundidos, por isso é igual no telemóvel e no PC.
   Regras completas em docs/plano-cultivo.md. */

const FASES_M = ['Fase inicial', 'Fase intermédia', 'Fase tardia', 'Pico'];
const REINOS_M = [
  {nome: 'Mortal Desperto', niveis: ['Corpo', 'Respiração', 'Mente'], custo: () => 40, frase: 'Abriste os olhos para o caminho: o corpo, a respiração e a mente acordam.'},
  {nome: 'Recolha da Luz Estelar', niveis: 9, custo: i => 60 + 10 * i, frase: 'Fio a fio, a luz das estrelas desce até ti.'},
  {nome: 'Fundação de Jade', niveis: FASES_M, custo: () => 300, frase: 'A constância endureceu em jade: um dia mau já não a parte.'},
  {nome: 'Núcleo Lunar', niveis: FASES_M, custo: () => 400, frase: 'Acima das nuvens, o teu núcleo brilha como a lua cheia.'},
  {nome: 'Alma Solar', niveis: FASES_M, custo: () => 500, frase: 'Da lua vês a Terra nascer; a tua alma arde como um sol.'},
  {nome: 'Domínio das Constelações', niveis: FASES_M, custo: () => 600, frase: 'Cada semana cumprida é uma estrela que te obedece.'},
  {nome: 'Corpo Nebular', niveis: FASES_M, custo: () => 700, frase: 'O corpo dissolve-se em nebulosa: forma e energia são uma só.'},
  {nome: 'Coração da Galáxia', niveis: FASES_M, custo: () => 800, frase: 'Galáxias inteiras rodam à volta do teu coração.'},
  {nome: 'Ascensão ao Firmamento', niveis: ['Imortal'], custo: () => Infinity, frase: 'Tornaste-te estrela. O firmamento é o teu mirante.'}
];
const NIVEIS_M = listaNiveis(REINOS_M);
const TESOUROS = {
  jing: {nome: 'Jing', sub: 'essência', app: 'Garfada', cor: '#9AC74B', rgb: '154,199,75', max: 12},
  qi: {nome: 'Qi', sub: 'energia', app: 'Forja', cor: '#EE6A22', rgb: '238,106,34', max: 12},
  shen: {nome: 'Shen', sub: 'espírito', app: 'Nascente', cor: '#4FD6D6', rgb: '79,214,214', max: 10},
  forma: {nome: 'Forma', sub: 'o peso', app: 'Peso', cor: '#7AA2F5', rgb: '122,162,245', max: 4}
};
const TRES = ['jing', 'qi', 'shen'];
const FLUXOS_M = [[28, 1.6, 'Torrente'], [14, 1.4, 'Rio'], [6, 1.25, 'Corrente'], [2, 1.1, 'Brisa'], [0, 1, 'Disperso']];
const fluxoM = serie => FLUXOS_M.find(f => serie >= f[0]);
const perdaM = idx => Math.max(15, Math.round(Math.min(NIVEIS_M[idx].custo, 2000) * .06));

// Dias com registo de cada app e recordes por dia (calculado uma vez por cada leitura dos dados).
function baseCultivo(){
  const dias = {jing: new Set(), qi: new Set(), shen: new Set(), forma: new Set()}, recordes = new Set();
  for (const [k, c] of IDX.dias) if (c.n > 0) dias.jing.add(k);
  for (const [k, l] of IDX.treinosDia) if (l.some(t => (t.itens || []).length)) dias.qi.add(k);
  if (D.nas){
    for (const [k, r] of Object.entries(D.nas.registos || {})) if (r.mF || r.nF) dias.shen.add(k);
    for (const p of D.nas.pele || []) dias.shen.add(p.d);
  }
  for (const k of IDX.peso.keys()) dias.forma.add(k);
  for (const l of IDX.hist.values()){
    let melhor = 0;
    for (const x of l.slice().sort((a, b) => a.ts - b.ts)){ if (melhor > 0 && x.v > melhor + .01) recordes.add(chaveData(new Date(x.ts))); melhor = Math.max(melhor, x.v); }
  }
  const prim = {};
  for (const t of Object.keys(dias)){ let m = null; for (const k of dias[t]) if (!m || k < m) m = k; prim[t] = m ? numDe(m) : null; }
  return {dias, recordes, prim, pele: new Set((D.nas && D.nas.pele || []).map(p => p.d))};
}

// Pontos de um dia, sem multiplicadores.
function pontosDia(n, B){
  const k = chaveDe(n), m = IDX.metas, c = IDX.dias.get(k), reg = (D.nas && D.nas.registos[k]) || {};
  let jing = 0, qi = 0, shen = 0, forma = 0;
  if (c && c.n > 0){
    if (c.n >= 2) jing += 4;
    if (Math.abs(c.kcal - m.kcal) <= m.kcal * .1) jing += 5;
    if (c.prot >= m.prot * .9) jing += 2;
  }
  if (m.agua && (D.agua[k] || 0) >= m.agua) jing += 1;
  if (B.dias.qi.has(k)){ qi += 10; if (B.recordes.has(k)) qi += 2; }
  if (reg.mF) shen += 4;
  if (reg.nF) shen += 4;
  if (B.pele.has(k)) shen += 2;
  if (B.dias.forma.has(k)) forma += 1;
  return {jing: Math.min(12, jing), qi: Math.min(12, qi), shen: Math.min(10, shen), forma};
}

// Bónus ao fechar a semana (no domingo): semana forjada e peso a andar para a meta.
function bonusSemana(fimN, B, ativos){
  const ini = fimN - 6, meta = Math.max(1, +(D.fcfg && D.fcfg.dias) || 3);
  let qi = 0, forma = 0, treinos = 0;
  for (let n = ini; n <= fimN; n++) if (B.dias.qi.has(chaveDe(n))) treinos++;
  if (ativos.qi && treinos >= meta) qi = 12;
  if (ativos.forma){
    const a = tendEm(ini - 1) || tendEm(ini), b = tendEm(fimN);
    if (a && b && b.n >= ini){
      const dif = b.t - a.t, g = D.gcfg || {}, alvo = +g.pesoMeta || null, obj = g.objetivo || 'manter';
      const bom = alvo ? (Math.abs(b.t - alvo) <= .5 ? Math.abs(dif) <= .3 : Math.sign(alvo - a.t) === Math.sign(dif) && Math.abs(dif) >= .05)
        : obj === 'perder' ? dif <= -.05 : obj === 'ganhar' ? dif >= .05 : Math.abs(dif) <= .3;
      if (bom) forma = 6;
    }
  }
  return {qi, forma, treinos, meta};
}

// A prova para romper um reino (a partir do 3.º): equilíbrio nos últimos 14 dias e a última semana fechada com nota >= 70.
function provaRompe(n, hist, B, ativos){
  const falta = [], ult = hist.slice(-14);
  if (ativos.jing && media(ult.map(d => d.p.jing)) < 6) falta.push('jing');
  if (ativos.shen && media(ult.map(d => d.p.shen)) < 5) falta.push('shen');
  if (ativos.qi){ const meta = Math.max(1, +(D.fcfg && D.fcfg.dias) || 3); if (ult.filter(d => d.p.qi >= 10).length < meta) falta.push('qi'); }
  const sem = segundaDe(n) - 7;
  let nota = null; try { const S = semana(sem); nota = S.nota && S.nota.total; } catch(e){}
  if (nota == null || nota < 70) falta.push('nota');
  return {ok: !falta.length, falta, nota};
}

let CULT = null, CULT_D = null, CULT_H = null;
function cultivoMirante(){
  const h = hojeN();
  if (CULT && CULT_D === D && CULT_H === h) return CULT;
  const B = baseCultivo(), prims = Object.values(B.prim).filter(v => v != null);
  const vazio = {qi: 0, serie: 0, fluxo: 'Disperso', mult: 1, dias: [], eventos: [], hoje: {jing: 0, qi: 0, shen: 0, forma: 0}, ativos: {}, desvio: [], gargalo: {preso: false, falta: []}, total: 0, perdido: 0, chao: 0};
  if (!prims.length){ CULT = Object.assign(vazio, infoNivel(REINOS_M, NIVEIS_M, 0)); CULT_D = D; CULT_H = h; return CULT; }
  const ini = Math.min(...prims), ultimo = {}, zeros = {jing: 0, qi: 0, shen: 0};
  let qi = 0, chao = 0, serie = 0, total = 0, perdido = 0, gargalo = {preso: false, falta: []};
  const dias = [], eventos = [];
  for (let n = ini; n <= h; n++){
    const k = chaveDe(n), p = pontosDia(n, B), ehHoje = n === h;
    for (const t of Object.keys(B.dias)) if (B.dias[t].has(k)) ultimo[t] = n;
    const ativos = {}; for (const t of Object.keys(B.dias)) ativos[t] = ultimo[t] != null && n - ultimo[t] <= 29;
    // Equilíbrio: cada tesouro ativo cumprido (a Forja conta se a semana vai a tempo da meta).
    const seg = segundaDe(n), meta = Math.max(1, +(D.fcfg && D.fcfg.dias) || 3);
    let treinosSem = 0; for (let x = seg; x <= n; x++) if (B.dias.qi.has(chaveDe(x))) treinosSem++;
    const cumpre = {jing: p.jing >= 4, shen: p.shen >= 4, qi: p.qi >= 10 || treinosSem >= Math.floor(meta * (n - seg + 1) / 7)};
    const ativos3 = TRES.filter(t => ativos[t]), equilibrado = ativos3.length > 0 && ativos3.every(t => cumpre[t]);
    // Desvio: um tesouro ativo esquecido (5 dias sem comida ou rituais, 7 sem treino).
    for (const t of TRES) zeros[t] = ativos[t] && !(t === 'qi' ? p.qi >= 10 : p[t] > 0) ? zeros[t] + 1 : 0;
    const desvio = TRES.filter(t => ativos[t] && zeros[t] >= (t === 'qi' ? 7 : 5));
    const F = fluxoM(serie), mult = F[1] * (desvio.length ? .7 : 1);
    let base = p.jing + p.qi + p.shen + p.forma;
    const fimSemana = n === seg + 6 && !ehHoje, bon = fimSemana ? bonusSemana(n, B, ativos) : {qi: 0, forma: 0};
    base += bon.qi + bon.forma;
    let ganho = Math.round(base * mult), perda = 0;
    const idx0 = nivelEm(NIVEIS_M, qi);
    // Dia vazio: nada registado (quem só usa a Forja não perde nos dias de descanso, se a semana vai a tempo).
    const vazioDia = ativos3.length && p.jing + p.qi + p.shen + p.forma === 0 && !(ativos3.length === 1 && ativos.qi && cumpre.qi);
    if (!ehHoje && vazioDia){
      perda = Math.min(perdaM(idx0), qi - chao); qi -= perda; perdido += perda; serie = 0;
      if (perda) eventos.push({n, tipo: 'perda', qi: perda});
    } else if (ganho){
      // Gargalo: do 3.º reino em diante, só se rompe com a prova feita; senão o qi fica no limite.
      const L = NIVEIS_M[idx0], prox = NIVEIS_M[idx0 + 1];
      if (prox && prox.r !== L.r && prox.r >= 2 && qi + ganho >= prox.ini){
        const pr = provaRompe(n, dias, B, ativos);
        if (!pr.ok){ ganho = Math.max(0, prox.ini - 1 - qi); gargalo = {preso: true, falta: pr.falta, nota: pr.nota}; }
        else gargalo = {preso: false, falta: []};
      } else if (!(prox && prox.r !== L.r)) gargalo = {preso: false, falta: []};
      qi += ganho; total += ganho;
      const idx1 = nivelEm(NIVEIS_M, qi);
      if (idx1 > idx0) eventos.push({n, tipo: NIVEIS_M[idx1].r > NIVEIS_M[idx0].r ? 'rompe' : 'nivel', idx: idx1});
    }
    if (!ehHoje || equilibrado) serie = equilibrado ? serie + 1 : 0;
    const ni = nivelEm(NIVEIS_M, qi);
    if (NIVEIS_M[ni].r > NIVEIS_M[nivelEm(NIVEIS_M, chao)].r) chao = NIVEIS_M.find(l => l.r === NIVEIS_M[ni].r).ini;
    dias.push({n, k, p, bon, mult, ganho: perda ? 0 : ganho, perda, equilibrado, desvio, ativos});
  }
  const ultimoDia = dias[dias.length - 1], Fh = fluxoM(serie);
  CULT = Object.assign({qi, serie, fluxo: Fh[2], mult: Fh[1], dias, eventos, hoje: ultimoDia.p, ativos: ultimoDia.ativos, desvio: ultimoDia.desvio,
    gargalo, total, perdido, chao}, infoNivel(REINOS_M, NIVEIS_M, qi));
  CULT_D = D; CULT_H = h;
  return CULT;
}
// Texto curto do que falta para romper.
const NOME_FALTA = {jing: 'comer na meta (Garfada)', qi: 'treinar o que planeaste (Forja)', shen: 'fazer os rituais (Nascente)', nota: 'uma semana com nota 70 ou mais'};
function textoGargalo(c){ return c.gargalo.preso ? 'No limite do reino. Para romper falta: ' + c.gargalo.falta.map(f => NOME_FALTA[f]).join(', ') + '.' : ''; }
