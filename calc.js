'use strict';
/* Mirante — cálculos. As fórmulas de metas e do score de comida são as mesmas da Garfada,
   para os números baterem certo entre as apps. */

const DIA = 864e5;
const chaveData = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const numDe = k => Date.UTC(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10)) / DIA;
const chaveDe = n => new Date(n * DIA).toISOString().slice(0, 10);
const hojeN = () => numDe(chaveData(new Date()));
const numTs = ts => numDe(chaveData(new Date(ts)));
const segundaDe = n => n - (new Date(n * DIA).getUTCDay() + 6) % 7;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const media = a => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
const soma = a => a.reduce((x, y) => x + y, 0);

/* ---------- Metas (iguais às da Garfada) ---------- */
const DEF_G = {sexo: 'H', idade: 30, altura: 175, peso: 75, atividade: '1.375', objetivo: 'manter'};
function manutencaoFormula(p){
  const peso = +p.peso || 75, altura = +p.altura || 175, idade = +p.idade || 30;
  return (10 * peso + 6.25 * altura - 5 * idade + (p.sexo === 'H' ? 5 : -161)) * parseFloat(p.atividade || 1.375);
}
function calcMetas(p, tdee){
  const peso = +p.peso || 75;
  let kcal = tdee || manutencaoFormula(p);
  if (p.objetivo === 'perder') kcal *= 0.85; else if (p.objetivo === 'ganhar') kcal *= 1.10;
  kcal = Math.round(Math.max(kcal, p.sexo === 'H' ? 1500 : 1200) / 10) * 10;
  const prot = Math.round(peso * (p.objetivo === 'manter' ? 1.4 : 1.8));
  const gord = Math.round(kcal * 0.28 / 9);
  const hid = Math.max(0, Math.round((kcal - prot * 4 - gord * 9) / 4));
  return {kcal, prot, hid, gord, agua: Math.round(peso * 35 / 100) * 100};
}
function metasDe(c){
  const p = Object.assign({}, DEF_G, c || {});
  if (p.manual && ehObj(p.metas) && +p.metas.kcal) return Object.assign(calcMetas(p), p.metas);
  return calcMetas(p, p.usarTdee && p.tdeeReal ? +p.tdeeReal : null);
}

/* ---------- Grupos musculares ---------- */
const MUSC = {abs: 'Abdominais', ombros: 'Ombros', quads: 'Quadríceps', peito: 'Peito', post: 'Posteriores da coxa', triceps: 'Tríceps',
  biceps: 'Bíceps', dorsais: 'Dorsais', costas: 'Meio das costas', gemeos: 'Gémeos', lombar: 'Lombar', antebracos: 'Antebraços',
  gluteos: 'Glúteos', trapezio: 'Trapézio', adutores: 'Adutores', pescoco: 'Pescoço', abdutores: 'Abdutores'};
const GRUPOS = [['Peito', ['peito']], ['Costas', ['dorsais', 'costas', 'trapezio']], ['Ombros', ['ombros']],
  ['Pernas', ['quads', 'post', 'gluteos', 'gemeos', 'adutores', 'abdutores']], ['Braços', ['biceps', 'triceps', 'antebracos']], ['Core', ['abs', 'lombar']]];
const SUPERIOR = new Set(['peito', 'ombros', 'triceps', 'biceps', 'dorsais', 'costas', 'trapezio', 'antebracos']);
const CAT_FORCA = new Set(['forca', 'olimpico', 'pliometria']);
let EXDB = {};   // id -> [nome, primários, secundários, categoria, empurrar/puxar]
const nomeEx = id => (EXDB[id] && EXDB[id][0]) || String(id).replace(/^forja_/, '').replace(/_/g, ' ');
const e1rm = s => s.kg * (1 + s.reps / 30);

/* ---------- Índice dos dados ---------- */
let D = null, IDX = null;
function indexar(dados){
  D = dados;
  const dias = new Map();
  for (const r of dados.refeicoes){
    let c = dias.get(r.data);
    if (!c) dias.set(r.data, c = {kcal: 0, prot: 0, hid: 0, gord: 0, fibra: 0, acucar: 0, sat: 0, sodio: 0, n: 0, refeicoes: []});
    for (const x of ['kcal', 'prot', 'hid', 'gord', 'fibra', 'acucar', 'sat', 'sodio']) c[x] += r[x];
    c.n++; c.refeicoes.push(r);
  }
  for (const c of dias.values()) c.refeicoes.sort((a, b) => a.ts - b.ts);
  const treinosDia = new Map();
  for (const t of dados.treinos){ const k = chaveData(new Date(t.inicio)); if (!treinosDia.has(k)) treinosDia.set(k, []); treinosDia.get(k).push(t); }
  const peso = new Map(dados.pesos.map(p => [p.d, p.kg]));
  // Tendência do peso (média móvel exponencial que respeita os dias sem pesagem).
  const tend = [];
  let t = null, nAnt = null;
  for (const p of dados.pesos){
    const n = numDe(p.d);
    if (t == null) t = p.kg; else { const a = 1 - Math.pow(0.9, n - nAnt); t = t + a * (p.kg - t); }
    tend.push({n, kg: p.kg, t}); nAnt = n;
  }
  // Melhor marca de cada exercício por treino, para recordes e progressão.
  const hist = new Map();
  for (const tr of dados.treinos){
    for (const it of tr.itens){
      if (it.fase || !it.series.length) continue;
      const comPeso = it.series.some(s => s.kg > 0);
      const v = comPeso ? Math.max(...it.series.map(e1rm)) : Math.max(...it.series.map(s => s.reps));
      if (!hist.has(it.id)) hist.set(it.id, []);
      hist.get(it.id).push({ts: tr.inicio, v, comPeso, series: it.series});
    }
  }
  IDX = {dias, treinosDia, peso, tend, hist, metas: metasDe(dados.gcfg)};
  return IDX;
}
function tendEm(n){
  let r = null;
  for (const p of IDX.tend){ if (p.n > n) break; r = p; }
  return r;
}
// Ritmo da tendência em kg/semana, pela regressão das pesagens dos últimos 21 dias até n.
function ritmoPeso(n, janela = 21){
  const pts = IDX.tend.filter(p => p.n <= n && p.n > n - janela);
  if (pts.length < 3 || pts[pts.length - 1].n - pts[0].n < 7) return null;
  const mx = media(pts.map(p => p.n)), my = media(pts.map(p => p.t));
  let a = 0, b = 0; for (const p of pts){ a += (p.n - mx) * (p.t - my); b += (p.n - mx) ** 2; }
  return b ? a / b * 7 : null;
}

/* ---------- Score de comida (igual ao da Garfada) ---------- */
const SC_PESOS = {calorias: 40, proteina: 20, registo: 15, qualidade: 15, agua: 10};
const SC_NOMES = {calorias: 'Calorias na meta', proteina: 'Proteína', registo: 'Registo completo', qualidade: 'Qualidade', agua: 'Água'};
const FAIXAS = [[85, 'Excelente'], [70, 'Boa semana'], [55, 'Irregular'], [0, 'Fora do caminho']];
const faixa = s => (FAIXAS.find(f => s >= f[0]) || FAIXAS[3])[1];
function scoreComida(dias, m){
  const h = hojeN(), hoje = dias.find(d => d.n === h);
  const hojeConta = !!(hoje && hoje.nRef && (new Date().getHours() >= 21 || hoje.kcal >= m.kcal * 0.9));
  const fechados = dias.filter(d => d.n < h || (d.n === h && hojeConta));
  const comp = fechados.filter(d => d.kcal >= Math.min(1000, m.kcal * 0.5));
  if (!comp.length) return {fechados, comp, vazio: true};
  const lim = (v, l) => v <= l ? 1 : clamp(2 - v / l, 0, 1);
  const limA = m.kcal * 0.1 / 4, limS = m.kcal * 0.1 / 9;
  const comAgua = fechados.some(d => d.agua > 0);
  const c = {
    calorias: media(comp.map(d => clamp(1 - (Math.abs(d.kcal - m.kcal) / m.kcal - 0.1) / 0.3, 0, 1))),
    proteina: media(comp.map(d => clamp((d.prot / m.prot - 0.5) / 0.4, 0, 1))),
    registo: comp.length / fechados.length,
    qualidade: media(comp.map(d => (Math.min(1, d.fibra / 25) + lim(d.acucar, limA) + lim(d.sat, limS) + lim(d.sodio, 2000)) / 4)),
    agua: comAgua ? media(fechados.map(d => Math.min(1, d.agua / m.agua))) : null
  };
  let s = 0, w = 0;
  for (const k in SC_PESOS) if (c[k] != null){ s += SC_PESOS[k] * c[k]; w += SC_PESOS[k]; }
  return {fechados, comp, c, score: Math.round(s / w * 100)};
}
const scoreDia = (d, m) => d.kcal < Math.min(1000, m.kcal * 0.5) ? null
  : 0.6 * clamp(1 - (Math.abs(d.kcal - m.kcal) / m.kcal - 0.1) / 0.3, 0, 1) + 0.4 * clamp((d.prot / m.prot - 0.5) / 0.4, 0, 1);

/* ---------- A semana ---------- */
const DIAS_SEM = ['segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado', 'domingo'];
const INICIAIS = ['S', 'T', 'Q', 'Q', 'S', 'S', 'D'];
const CACHE_SEM = new Map();
function semana(ini){
  if (CACHE_SEM.has(ini)) return CACHE_SEM.get(ini);
  const h = hojeN(), m = IDX.metas, dias = [];
  for (let i = 0; i < 7; i++){
    const n = ini + i, k = chaveDe(n), c = IDX.dias.get(k);
    dias.push({n, k, i, futuro: n > h, hoje: n === h, nRef: c ? c.n : 0, refeicoes: c ? c.refeicoes : [],
      kcal: c ? c.kcal : 0, prot: c ? c.prot : 0, hid: c ? c.hid : 0, gord: c ? c.gord : 0,
      fibra: c ? c.fibra : 0, acucar: c ? c.acucar : 0, sat: c ? c.sat : 0, sodio: c ? c.sodio : 0,
      agua: D.agua[k] || 0, treinos: IDX.treinosDia.get(k) || [], peso: IDX.peso.has(k) ? IDX.peso.get(k) : null});
  }
  const fim = ini + 6, emCurso = h >= ini && h <= fim, decorridos = emCurso ? h - ini + 1 : (h < ini ? 0 : 7);
  const S = {ini, fim, dias, emCurso, decorridos, futura: h < ini, metas: m};

  // Comida
  const sc = scoreComida(dias, m), comp = sc.comp;
  S.comida = {
    tem: comp.length > 0, score: sc.vazio ? null : sc.score, comps: sc.c || null,
    diasReg: comp.length, fechados: sc.fechados.length,
    kcalMed: media(comp.map(d => d.kcal)), protMed: media(comp.map(d => d.prot)),
    hidMed: media(comp.map(d => d.hid)), gordMed: media(comp.map(d => d.gord)), fibraMed: media(comp.map(d => d.fibra)),
    aguaMed: media(sc.fechados.filter(d => d.agua > 0).map(d => d.agua)), diasAgua: sc.fechados.filter(d => d.agua > 0).length,
    naMeta: comp.filter(d => Math.abs(d.kcal - m.kcal) <= m.kcal * 0.1).length,
    protOk: comp.filter(d => d.prot >= m.prot * 0.9).length,
    refeicoes: dias.reduce((a, d) => a + d.nRef, 0)
  };
  const melhores = comp.map(d => ({d, s: scoreDia(d, m) + (d.treinos.length ? 0.05 : 0)})).sort((a, b) => b.s - a.s);
  S.comida.melhorDia = melhores.length >= 3 ? melhores[0].d : null;

  // Treino
  const sess = dias.flatMap(d => d.treinos), alvo = (D.fcfg && +D.fcfg.dias) || 3;
  const musc = {}, grupos = {};
  let series = 0, volume = 0, minutos = 0, empurrar = 0, puxar = 0;
  const feitos = new Map();
  for (const t of sess){
    minutos += clamp((t.fim - t.inicio) / 60000, 1, 240);
    for (const it of t.itens){
      if (it.fase || !it.series.length) continue;
      const ex = EXDB[it.id], n = it.series.length;
      series += n;
      for (const s of it.series) volume += s.kg * s.reps;
      if (ex && CAT_FORCA.has(ex[3])){
        for (const mm of ex[1]) musc[mm] = (musc[mm] || 0) + n;
        for (const mm of ex[2]) musc[mm] = (musc[mm] || 0) + n * 0.5;
        if (ex[1].some(mm => SUPERIOR.has(mm))){ if (ex[4] === 'push') empurrar += n; else if (ex[4] === 'pull') puxar += n; }
      }
      if (!feitos.has(it.id)) feitos.set(it.id, []);
      feitos.get(it.id).push({ts: t.inicio, series: it.series});
    }
  }
  for (const [g, ms] of GRUPOS){
    let v = 0;
    for (const t of sess) for (const it of t.itens){ const ex = EXDB[it.id]; if (!it.fase && ex && CAT_FORCA.has(ex[3]) && ex[1].some(x => ms.includes(x))) v += it.series.length; }
    grupos[g] = v;
  }
  // Recordes e progressão: o melhor desta semana contra tudo o que veio antes.
  const recordes = [];
  let melhorou = 0, manteve = 0, piorou = 0;
  const iniTs = new Date(chaveDe(ini) + 'T00:00:00').getTime();
  for (const [id] of feitos){
    const h2 = IDX.hist.get(id) || [], antes = h2.filter(x => x.ts < iniTs), agora = h2.filter(x => x.ts >= iniTs && x.ts < iniTs + 7 * DIA);
    if (!agora.length) continue;
    const comPeso = agora.some(x => x.comPeso), best = Math.max(...agora.map(x => x.v));
    if (antes.length){
      const prevBest = Math.max(...antes.map(x => x.v)), ult = antes[antes.length - 1].v;
      if (best > prevBest + 0.01) recordes.push({id, nome: nomeEx(id), v: best, ant: prevBest, comPeso, serie: melhorSerie(agora, comPeso)});
      if (best > ult + 0.01) melhorou++; else if (best >= ult - 0.01) manteve++; else piorou++;
    }
  }
  recordes.sort((a, b) => (b.v - b.ant) / b.ant - (a.v - a.ant) / a.ant);
  const gruposHit = Object.values(grupos).filter(v => v >= 3).length;
  S.treino = {
    tem: !!D.temForja, sessoes: sess.length, alvo, minutos, series, volume, musc, grupos, gruposHit, empurrar, puxar,
    recordes, melhorou, manteve, piorou, sess,
    diasTreino: dias.filter(d => d.treinos.length).length
  };

  // Peso
  const pesagens = dias.filter(d => d.peso != null);
  const tIni = tendEm(ini - 1) || (pesagens.length ? tendEm(pesagens[0].n) : null);
  const tFim = tendEm(Math.min(fim, h));
  const ritmo = ritmoPeso(Math.min(fim, h));
  const objPeso = (D.gcfg && +D.gcfg.pesoMeta) || (D.fcfg && +D.fcfg.meta) || 0;
  S.peso = {
    tem: pesagens.length > 0 || !!(tFim && tFim.n >= ini - 7), pesagens,
    tIni: tIni ? tIni.t : null, tFim: tFim ? tFim.t : null,
    delta: tIni && tFim && tFim.n >= ini ? tFim.t - tIni.t : null,
    ritmo, objetivo: objPeso,
    direcao: objPeso && tFim ? Math.sign(objPeso - tFim.t) : (D.gcfg && D.gcfg.objetivo === 'perder') ? -1 : (D.gcfg && D.gcfg.objetivo === 'ganhar') ? 1 : 0
  };
  if (ritmo != null && objPeso && tFim && Math.sign(ritmo) === Math.sign(objPeso - tFim.t) && Math.abs(ritmo) > 0.02)
    S.peso.semanasAteMeta = Math.abs((objPeso - tFim.t) / ritmo);

  S.nota = notaSemana(S);
  CACHE_SEM.set(ini, S);
  return S;
}
function melhorSerie(lista, comPeso){
  let b = null;
  for (const x of lista) for (const s of x.series){ const v = comPeso ? e1rm(s) : s.reps; if (!b || v > b.v) b = {v, kg: s.kg, reps: s.reps}; }
  return b;
}

/* ---------- Nota da semana ---------- */
// Comida 45 (o score da Garfada), treino 40 (frequência, cobertura muscular, progressão), peso 15 (ritmo face ao objetivo).
const NOTA_PESOS = {comida: 45, treino: 40, peso: 15};
function notaSemana(S){
  const c = {};
  if (S.comida.score != null) c.comida = S.comida.score;
  if (D.temForja && S.decorridos > 0){
    const t = S.treino;
    const alvoEf = S.emCurso ? Math.max(1, t.alvo * S.decorridos / 7) : t.alvo;
    const freq = clamp(t.sessoes / alvoEf, 0, 1);
    const alvoGrupos = S.emCurso ? Math.max(1, Math.round(6 * Math.min(1, t.sessoes / t.alvo))) : 6;
    const cob = t.sessoes ? Math.min(1, t.gruposHit / alvoGrupos) : 0;
    const comp = t.melhorou + t.manteve + t.piorou, prog = comp ? (t.melhorou + t.manteve * 0.8) / comp : null;
    c.treino = Math.round(100 * (prog == null ? (freq * 0.65 + cob * 0.35) : (freq * 0.5 + cob * 0.25 + prog * 0.25)));
    c.treinoDet = {freq, cob, prog};
  }
  const p = S.peso;
  if (p.ritmo != null && p.tFim){
    const pct = p.ritmo / p.tFim * 100;
    const obj = p.direcao < 0 ? 'perder' : p.direcao > 0 ? 'ganhar' : 'manter';
    const [a, b] = obj === 'perder' ? [-1.0, -0.2] : obj === 'ganhar' ? [0.1, 0.5] : [-0.25, 0.25];
    const dist = pct < a ? a - pct : pct > b ? pct - b : 0;
    c.peso = Math.round(100 * clamp(1 - dist / 0.5, 0, 1));
    c.pesoObj = obj; c.pesoPct = pct;
  }
  let s = 0, w = 0;
  for (const k of ['comida', 'treino', 'peso']) if (c[k] != null){ s += NOTA_PESOS[k] * c[k]; w += NOTA_PESOS[k]; }
  return {total: w ? Math.round(s / w) : null, c, faixa: w ? faixa(Math.round(s / w)) : '', provisoria: S.emCurso};
}

/* ---------- Gasto real estimado ---------- */
// Média do que comeste menos a energia que a tendência do peso mostra que ganhaste ou perdeste (7700 kcal por kg).
function gastoReal(fimN, janela = 28){
  const m = IDX.metas, ks = [];
  for (let n = fimN - janela + 1; n <= fimN; n++){ const c = IDX.dias.get(chaveDe(n)); if (c && c.kcal >= Math.min(1000, m.kcal * 0.5)) ks.push(c.kcal); }
  const pts = IDX.tend.filter(p => p.n <= fimN && p.n > fimN - janela);
  if (ks.length < 14 || pts.length < 5 || pts[pts.length - 1].n - pts[0].n < 14) return null;
  const mx = media(pts.map(p => p.n)), my = media(pts.map(p => p.kg));
  let a = 0, b = 0; for (const p of pts){ a += (p.n - mx) * (p.kg - my); b += (p.n - mx) ** 2; }
  const kgDia = b ? a / b : 0;
  return {kcal: Math.round((media(ks) - kgDia * 7700) / 10) * 10, ingest: media(ks), kgSem: kgDia * 7, dias: ks.length};
}

/* ---------- Leituras: o que se destacou, cruzando comida, treino e peso ---------- */
const fmtInt = v => Math.round(v).toLocaleString('pt-PT');
const fmtKg = v => (Math.round(v * 10) / 10).toLocaleString('pt-PT', {maximumFractionDigits: 1});
const fmt1 = v => (Math.round(v * 10) / 10).toLocaleString('pt-PT', {minimumFractionDigits: 1, maximumFractionDigits: 1});
const sinal = (v, f = fmtInt) => (v > 0 ? '+' : v < 0 ? '−' : '') + f(Math.abs(v));
function leituras(S, A){
  const L = [], m = S.metas, comp = S.dias.filter(d => S.comida.tem && d.kcal >= Math.min(1000, m.kcal * 0.5) && (d.n < hojeN() || !S.emCurso || d.kcal >= m.kcal * 0.9));
  const add = (ic, peso, txt) => L.push({ic, peso, txt});
  // Dias de treino contra dias de descanso.
  const dT = comp.filter(d => d.treinos.length), dD = comp.filter(d => !d.treinos.length);
  if (dT.length >= 2 && dD.length >= 2){
    const dk = media(dT.map(d => d.kcal)) - media(dD.map(d => d.kcal)), dp = media(dT.map(d => d.prot)) - media(dD.map(d => d.prot));
    const pT = media(dT.map(d => d.prot));
    if (pT < m.prot * 0.9) add('treino', 90, `Nos dias de treino comeste em média <b>${fmtInt(pT)} g de proteína</b>, ${fmtInt(m.prot - pT)} g abaixo da meta. É nesses dias que o músculo mais precisa dela.`);
    else if (Math.abs(dk) >= 150) add('treino', 60, `Nos dias de treino comeste <b>${sinal(dk)} kcal</b> e <b>${sinal(dp)} g de proteína</b> do que nos dias de descanso.`);
  }
  // Fim de semana.
  const fds = comp.filter(d => d.i >= 5), uteis = comp.filter(d => d.i < 5);
  if (fds.length >= 1 && uteis.length >= 3){
    const dif = media(fds.map(d => d.kcal)) - media(uteis.map(d => d.kcal));
    if (dif > m.kcal * 0.12) add('comida', 70 + Math.min(20, dif / 50), `Ao fim de semana comeste <b>${sinal(dif)} kcal por dia</b> do que nos dias úteis. Só esses dois dias valem cerca de ${fmt1(dif * fds.length / 7700)} kg no ritmo do peso.`);
  }
  // Balanço energético contra a balança.
  const g = gastoReal(Math.min(S.fim, hojeN() - 1));
  if (g && S.peso.ritmo != null && S.comida.tem){
    const prev = (S.comida.kcalMed - g.kcal) * 7 / 7700;
    add('peso', 55, `Pelo que comeste e pelo que a balança mostra, o teu gasto real anda nas <b>${fmtInt(g.kcal)} kcal por dia</b>. Com a média desta semana, isso dá <b>${sinal(prev, fmt1)} kg por semana</b>.`);
  }
  // Proteína por kg.
  if (S.comida.tem && S.peso.tFim){
    const gkg = S.comida.protMed / S.peso.tFim;
    if (gkg < 1.4) add('comida', 65, `A proteína ficou em <b>${fmt1(gkg)} g por kg</b> de peso. Para quem treina força, o intervalo útil é 1,6 a 2,2 g/kg.`);
  }
  // Recordes.
  const R = S.treino.recordes;
  if (R.length) add('treino', 80 + R.length * 3, R.length === 1 ? `Bateste um recorde: <b>${R[0].nome}</b>.` : `Bateste <b>${R.length} recordes</b>, com destaque para ${R[0].nome.toLowerCase()} (${sinal((R[0].v - R[0].ant) / R[0].ant * 100, fmtInt)}%).`);
  // Músculos esquecidos nas duas últimas semanas.
  if (D.temForja && A && S.treino.sessoes + A.treino.sessoes >= 3){
    const esq = GRUPOS.filter(([gn]) => !S.treino.grupos[gn] && !A.treino.grupos[gn]).map(([gn]) => gn.toLowerCase());
    if (esq.length && esq.length < 4) add('treino', 62, `Há duas semanas que não treinas ${esq.length === 1 ? esq[0] : esq.slice(0, -1).join(', ') + ' e ' + esq[esq.length - 1]}.`);
  }
  // Empurrar contra puxar.
  const {empurrar: e, puxar: p} = S.treino;
  if (e + p >= 16 && (!S.emCurso || S.treino.sessoes >= S.treino.alvo)){
    if (e > p * 1.5) add('treino', 50, `Fizeste <b>${e} séries a empurrar e ${p} a puxar</b>. Equilibrar com mais remadas e elevações protege os ombros.`);
    else if (p > e * 1.5) add('treino', 45, `Fizeste <b>${p} séries a puxar e ${e} a empurrar</b>. Vale a pena dar mais atenção ao peito e aos ombros.`);
  }
  // Jantares tardios.
  const tardias = comp.flatMap(d => d.refeicoes.filter(r => new Date(r.ts).getHours() >= 22));
  if (comp.length >= 3){
    const pct = soma(tardias.map(r => r.kcal)) / soma(comp.map(d => d.kcal));
    if (pct > 0.25) add('comida', 48, `<b>${fmtInt(pct * 100)}% das calorias</b> foram depois das 22h. Comer mais cedo costuma ajudar o sono e o apetite do dia seguinte.`);
  }
  // Água.
  if (S.comida.diasAgua >= 3 && S.comida.aguaMed < m.agua * 0.75) add('comida', 40, `Bebeste em média <b>${fmt1(S.comida.aguaMed / 1000)} L de água</b> por dia, abaixo dos ${fmt1(m.agua / 1000)} L da tua meta.`);
  // Constância no registo.
  let seq = 0, nn = hojeN();
  const regOk = n => { const c = IDX.dias.get(chaveDe(n)); return !!c && c.kcal >= 800; };
  if (!regOk(nn)) nn--;
  while (seq < 400 && regOk(nn)){ seq++; nn--; }
  if (S.emCurso && seq >= 10) add('comida', 42, `Registas a comida há <b>${seq} dias seguidos</b>. É isto que torna todos os outros números fiáveis.`);
  // Comparação com a semana anterior.
  if (A && A.nota.total != null && S.nota.total != null && !S.emCurso){
    const dn = S.nota.total - A.nota.total;
    if (Math.abs(dn) >= 8) add('nota', 58, dn > 0 ? `A nota subiu <b>${dn} pontos</b> face à semana anterior.` : `A nota desceu <b>${-dn} pontos</b> face à semana anterior.`);
  }
  if (A && S.treino.volume && A.treino.volume && !S.emCurso){
    const dv = (S.treino.volume - A.treino.volume) / A.treino.volume;
    if (Math.abs(dv) >= 0.2) add('treino', 44, `O volume de treino ${dv > 0 ? 'subiu' : 'desceu'} <b>${fmtInt(Math.abs(dv) * 100)}%</b> face à semana anterior.`);
  }
  return L.sort((a, b) => b.peso - a.peso);
}

// Três focos para a próxima semana, a partir dos pontos mais fracos (sem IA).
function focos(S){
  const F = [], m = S.metas, c = S.comida.comps || {}, t = S.treino;
  if (D.temForja && t.sessoes < t.alvo) F.push(['treino', `Fazer os ${t.alvo} treinos. Marca já os dias e a hora, como se fossem reuniões.`]);
  if (S.comida.tem && c.proteina != null && c.proteina < 0.75) F.push(['comida', `Chegar às ${fmtInt(m.prot)} g de proteína. Junta uma fonte de proteína a cada refeição, sobretudo ao pequeno-almoço.`]);
  if (S.comida.tem && c.calorias != null && c.calorias < 0.7) F.push(['comida', S.comida.kcalMed > m.kcal ? `Aproximar as calorias da meta de ${fmtInt(m.kcal)} kcal. O fim de semana é onde há mais margem.` : `Comer o suficiente: a média ficou abaixo da meta, e isso trava o treino.`]);
  if (S.comida.tem && c.registo != null && c.registo < 0.85) F.push(['comida', 'Registar todos os dias, mesmo os menos bons. Um dia em falta esconde mais do que mostra.']);
  if (D.temForja && t.sessoes && t.gruposHit < 5){ const f = GRUPOS.filter(([g]) => (t.grupos[g] || 0) < 3).map(([g]) => g.toLowerCase()); if (f.length) F.push(['treino', `Dar pelo menos 3 séries a ${f.slice(0, 2).join(' e ')}.`]); }
  if (S.peso.pesagens.length < 3) F.push(['peso', 'Pesar-te pelo menos 3 vezes, de manhã, antes de comer. A tendência só fica fiável com pesagens regulares.']);
  if (S.comida.tem && c.agua != null && c.agua < 0.75) F.push(['comida', `Beber ${fmt1(m.agua / 1000)} L de água por dia. Deixa uma garrafa à vista.`]);
  if (F.length < 3 && t.recordes.length) F.push(['treino', 'Manter as cargas que te deram recordes e tentar mais uma repetição na primeira série.']);
  if (F.length < 3) F.push(['nota', 'Repetir o que correu bem: a constância vale mais do que uma semana perfeita.']);
  return F.slice(0, 3);
}

// Resumo compacto da semana para a IA comentar.
function resumoParaIA(S, A){
  const m = S.metas, t = S.treino;
  return {
    semana: `${chaveDe(S.ini)} a ${chaveDe(S.fim)}`, em_curso: S.emCurso,
    nota_0a100: S.nota.total, componentes: {comida: S.nota.c.comida ?? null, treino: S.nota.c.treino ?? null, peso: S.nota.c.peso ?? null},
    metas: {kcal: m.kcal, proteina_g: m.prot, agua_ml: m.agua},
    comida: S.comida.tem ? {dias_registados: S.comida.diasReg, kcal_media: Math.round(S.comida.kcalMed), proteina_media_g: Math.round(S.comida.protMed),
      dias_na_meta_kcal: S.comida.naMeta, dias_proteina_ok: S.comida.protOk, agua_media_ml: Math.round(S.comida.aguaMed),
      por_dia: S.dias.filter(d => d.nRef).map(d => ({dia: DIAS_SEM[d.i], kcal: Math.round(d.kcal), proteina: Math.round(d.prot), treinou: d.treinos.length > 0}))} : null,
    treino: D.temForja ? {sessoes: t.sessoes, alvo_semanal: t.alvo, minutos: Math.round(t.minutos), series: t.series, volume_kg: Math.round(t.volume),
      series_por_grupo: t.grupos, recordes: t.recordes.map(r => r.nome), progressao: {melhorou: t.melhorou, manteve: t.manteve, piorou: t.piorou},
      treinos: t.sess.map(x => ({dia: DIAS_SEM[(new Date(x.inicio).getDay() + 6) % 7], tipo: x.nome, minutos: Math.round((x.fim - x.inicio) / 60000)}))} : null,
    peso: S.peso.tFim ? {tendencia_inicio: S.peso.tIni && +S.peso.tIni.toFixed(1), tendencia_fim: +S.peso.tFim.toFixed(1), ritmo_kg_semana: S.peso.ritmo != null ? +S.peso.ritmo.toFixed(2) : null, objetivo_kg: S.peso.objetivo || null, pesagens: S.peso.pesagens.length} : null,
    semana_anterior: A && A.nota.total != null ? {nota: A.nota.total, kcal_media: Math.round(A.comida.kcalMed), sessoes: A.treino.sessoes, volume_kg: Math.round(A.treino.volume)} : null,
    perfil: {objetivo_peso: D.gcfg ? D.gcfg.objetivo : null, objetivo_treino: D.fcfg ? D.fcfg.objetivo : null}
  };
}
