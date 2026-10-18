'use strict';
/* Mirante — o vigia.
   Lê o dia, a semana e o mês à luz dos teus objetivos (peso e treino) e diz o que correu bem, o que falta
   e o próximo passo. As regras funcionam sem IA; com a chave do Gemini, a IA escreve os comentários uma vez por dia. */

let vigiaTab = null, vigiaIAPedida = false, vigiaPensa = false, falarT = 0, ultimoOlhar = 0;
const OBJ_TREINO = {hipertrofia: 'ganhar músculo', forca: 'ganhar força', gordura: 'perder gordura', geral: 'condição geral'};
const OBJ_PESO = {perder: 'perder peso', manter: 'manter o peso', ganhar: 'ganhar peso'};
const NOME_PER = {dia: 'Hoje', semana: 'Esta semana', mes: 'Este mês'};
const MESES_N = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const cap = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
const lista = a => a.length < 2 ? (a[0] || '') : a.slice(0, -1).join(', ') + ' e ' + a[a.length - 1];
const semTags = s => String(s || '').replace(/<[^>]+>/g, '');
const tsDe = n => new Date(chaveDe(n) + 'T00:00:00').getTime();

/* ---------- Objetivos e dias ---------- */
function objetivos(){
  const g = D.gcfg || {}, f = D.fcfg || {}, meta = (+g.pesoMeta) || (+f.meta) || 0;
  const tA = IDX.tend.length ? IDX.tend[IDX.tend.length - 1].t : null;
  let peso = g.objetivo || (f.objetivo === 'gordura' ? 'perder' : 'manter');
  if (meta && tA) peso = Math.abs(meta - tA) < .4 ? 'manter' : meta < tA ? 'perder' : 'ganhar';
  return {peso, meta, tA, treino: f.objetivo || null, alvo: (+f.dias) || 3};
}
const forcaPrio = o => o.treino === 'hipertrofia' || o.treino === 'forca';
function diaObj(n){
  const k = chaveDe(n), c = IDX.dias.get(k), h = hojeN();
  return {n, k, i: (new Date(n * DIA).getUTCDay() + 6) % 7, hoje: n === h, futuro: n > h,
    kcal: c ? c.kcal : 0, prot: c ? c.prot : 0, hid: c ? c.hid : 0, gord: c ? c.gord : 0, fibra: c ? c.fibra : 0,
    acucar: c ? c.acucar : 0, sat: c ? c.sat : 0, sodio: c ? c.sodio : 0, nRef: c ? c.n : 0, refeicoes: c ? c.refeicoes : [],
    agua: D.agua[k] || 0, treinos: IDX.treinosDia.get(k) || [], peso: IDX.peso.has(k) ? IDX.peso.get(k) : null};
}
// Nota de comida de um dia fechado (mesmos critérios do score da Garfada, sem o registo).
function notaDiaComida(d, m){
  if (d.kcal < Math.min(1000, m.kcal * .5)) return null;
  const lim = (v, l) => v <= l ? 1 : clamp(2 - v / l, 0, 1);
  const c = {cal: clamp(1 - (Math.abs(d.kcal - m.kcal) / m.kcal - .1) / .3, 0, 1), prot: clamp((d.prot / m.prot - .5) / .4, 0, 1),
    qual: (Math.min(1, d.fibra / 25) + lim(d.acucar, m.kcal * .1 / 4) + lim(d.sat, m.kcal * .1 / 9) + lim(d.sodio, 2000)) / 4,
    agua: d.agua > 0 ? Math.min(1, d.agua / m.agua) : null};
  const P = {cal: 40, prot: 20, qual: 15, agua: 10};
  let s = 0, w = 0; for (const k in P) if (c[k] != null){ s += P[k] * c[k]; w += P[k]; }
  return Math.round(s / w * 100);
}
// Ritmo do peso face ao objetivo, em % do peso por semana.
function avaliaRitmo(ritmo, peso, obj){
  const pct = ritmo / peso * 100, [a, b] = obj === 'perder' ? [-1, -.2] : obj === 'ganhar' ? [.1, .5] : [-.25, .25];
  const dist = pct < a ? a - pct : pct > b ? pct - b : 0;
  return {pct, score: clamp(1 - dist / .5, 0, 1), dentro: dist === 0,
    rapido: obj === 'perder' && pct < a,
    errado: (obj === 'perder' && pct >= .05) || (obj === 'ganhar' && pct <= -.05) || (obj === 'manter' && Math.abs(pct) > .5),
    lento: (obj === 'perder' && pct > b && pct < .05) || (obj === 'ganhar' && pct < a && pct > -.05)};
}
function equivProt(g){
  const fr = Math.max(50, Math.round(g / .31 / 10) * 10), io = Math.max(1, Math.round(g / 15));
  return `por exemplo ${fr} g de peito de frango ou ${io} ${io === 1 ? 'iogurte grego' : 'iogurtes gregos'}`;
}
function grupoDescansado(){
  const ult = {};
  for (const t of D.treinos) for (const it of t.itens){
    const ex = EXDB[it.id]; if (!ex || it.fase || !it.series.length || !CAT_FORCA.has(ex[3])) continue;
    for (const [g, ms] of GRUPOS) if (ex[1].some(x => ms.includes(x))) ult[g] = Math.max(ult[g] || 0, t.inicio);
  }
  return GRUPOS.map(([g]) => [g, ult[g] ? (Date.now() - ult[g]) / 864e5 : 99]).sort((a, b) => b[1] - a[1]);
}
function recordesEntre(t0, t1){
  const R = [];
  for (const [id, h] of IDX.hist){
    const antes = h.filter(x => x.ts < t0), agora = h.filter(x => x.ts >= t0 && x.ts < t1);
    if (!antes.length || !agora.length) continue;
    const b = Math.max(...agora.map(x => x.v)), a = Math.max(...antes.map(x => x.v));
    if (b > a + .01) R.push({id, nome: nomeEx(id), v: b, ant: a, comPeso: agora.some(x => x.comPeso)});
  }
  return R.sort((x, y) => (y.v - y.ant) / y.ant - (x.v - x.ant) / x.ant);
}
const faixaPer = (s, per) => s == null ? '' : s >= 85 ? 'Excelente' : s >= 70 ? (per === 'dia' ? 'Bom dia' : per === 'mes' ? 'Bom mês' : 'Boa semana') : s >= 55 ? 'Irregular' : 'Fora do caminho';
const humorDe = s => s == null ? 'neutro' : s >= 78 ? 'feliz' : s >= 58 ? 'neutro' : 'preocupado';
function coletor(){
  const pos = [], neg = [];
  return {pos, neg, bom: (peso, area, txt, curto, id) => pos.push({peso, area, txt, curto, id}), mau: (peso, area, txt, curto, id) => neg.push({peso, area, txt, curto, id}),
    ordenar(){ pos.sort((a, b) => b.peso - a.peso); neg.sort((a, b) => b.peso - a.peso); }};
}
function veredictoDe(fx, per, K, extra){
  const abre = {Excelente: per === 'dia' ? 'Um dia de manual.' : per === 'mes' ? 'Um mês de excelência até agora.' : 'Uma semana de excelência.',
    'Bom dia': 'Um bom dia.', 'Boa semana': 'Uma boa semana.', 'Bom mês': 'Um bom mês até agora.',
    Irregular: per === 'dia' ? 'Um dia irregular.' : per === 'mes' ? 'Um mês irregular.' : 'Uma semana irregular.',
    'Fora do caminho': per === 'dia' ? 'Um dia fora do plano.' : per === 'mes' ? 'Um mês fora do plano.' : 'Uma semana fora do plano.'}[fx] || '';
  const b = K.pos[0], m = K.neg[0];
  return `${extra ? extra + ' ' + abre.charAt(0).toLowerCase() + abre.slice(1) : abre}${b ? ' O melhor: ' + b.curto + '.' : ''}${m ? ' A corrigir: ' + m.curto + '.' : ''}`.trim();
}
function regrasPele(K, P, Pa, ini, fim, cedo, nomePer){
  const esc4 = v => PELE_MED_I.geral[2][Math.round(clamp(v, 0, 4))].toLowerCase();
  if (P.adesao >= .85) K.bom(62, 'pele', `Rituais da pele feitos em <b>${P.feitas} de ${P.possiveis}</b> sessões.`, 'rituais da pele em dia');
  else if (P.adesao < .6 && !cedo) K.mau(58, 'pele', `Só <b>${P.feitas} de ${P.possiveis}</b> rituais da pele feitos. A pele precisa de constância para responder.`, 'rituais da pele em falta', 'ritual');
  const g = P.medias.geral, ga = Pa && Pa.medias.geral;
  if (g != null && ga != null){
    if (g - ga >= .4) K.bom(56, 'pele', `A pele está melhor: estado geral de ${esc4(ga)} para <b>${esc4(g)}</b>.`, 'pele a melhorar');
    else if (ga - g >= .4) K.mau(56, 'pele', `A pele piorou: estado geral de ${esc4(ga)} para <b>${esc4(g)}</b>.`, 'pele a piorar', 'pelePior');
  }
  const b = P.medias.borbulhas, ba = Pa && Pa.medias.borbulhas;
  if (b != null && ba != null){
    if (ba - b >= .5) K.bom(44, 'pele', `Menos borbulhas do que ${nomePer === 'mês' ? 'no mês anterior' : 'na semana anterior'}.`, 'menos borbulhas');
    else if (b - ba >= .5) K.mau(46, 'pele', `Mais borbulhas do que ${nomePer === 'mês' ? 'no mês anterior' : 'na semana anterior'}.`, 'mais borbulhas', 'acucarPele');
  }
  if (!P.regs.length && D.nas.pele.length && !cedo) K.mau(30, 'pele', `Sem registos da pele ${nomePer === 'mês' ? 'este mês' : 'esta semana'}. Regista 1 ou 2 vezes por semana para veres se a rotina funciona.`, 'pele sem registos', 'registoPele');
  const fr = frascos();
  if (fr.alertas.length){ const x = fr.alertas[0]; K.mau(x.v.estado === 'expirado' ? 48 : 30, 'pele', x.v.estado === 'expirado' ? `<b>${esc(x.p.nome)}</b> passou da validade. Deita-o fora e marca-o como acabado na Nascente.` : `<b>${esc(x.p.nome)}</b> expira dentro de ${x.v.dias} ${x.v.dias === 1 ? 'dia' : 'dias'}.`, 'frasco a expirar'); }
  const spf = usoProtetor(ini, fim);
  if (spf && fr.fotossens.length && spf.com < spf.manhas * .9) K.mau(52, 'pele', `Protetor solar em só <b>${spf.com} de ${spf.manhas}</b> manhãs, com ativos que deixam a pele sensível ao sol.`, 'protetor solar em falta', 'spf');
  else if (spf && fr.fotossens.length && spf.manhas >= 3) K.bom(36, 'pele', `Protetor solar em <b>${spf.com} de ${spf.manhas}</b> manhãs.`, 'protetor solar em dia');
}
const CONSELHO = {
  prot: o => `Junta uma fonte de proteína a cada refeição (ovos, iogurte grego, frango, atum, leguminosas). ${forcaPrio(o) ? 'Para ganhar músculo, é o ajuste com mais efeito.' : 'Ajuda a saciedade e protege o músculo.'}`,
  kcalAlta: () => 'Aponta à meta todos os dias e planeia o fim de semana com antecedência: é aí que o saldo derrapa.',
  kcalBaixa: o => o.peso === 'perder' ? 'Come até perto da meta: cortar demais trava a perda e rouba músculo.' : 'Acrescenta uma refeição ou um snack calórico com proteína: estás a ficar curto de combustível.',
  treinos: o => `Marca os ${o.alvo} treinos no calendário no início de cada semana, com dia e hora, como se fossem reuniões.`,
  registo: () => 'Regista todos os dias, mesmo os menos bons: os dias em falta escondem o que está a acontecer.',
  agua: m => `Deixa uma garrafa à vista e bebe ${fmt1(m.agua / 1000)} L por dia.`,
  pesoErrado: o => o.peso === 'perder' ? 'Revê as calorias: a média tem de ficar abaixo do que gastas. Começa pelo fim de semana.' : 'Revê as calorias: precisas de comer acima do que gastas para subir.',
  esquecidos: () => 'Na próxima semana, dá pelo menos 6 séries aos grupos que ficaram esquecidos.',
  pesagens: () => 'Pesa-te 3 a 4 vezes por semana, de manhã, antes de comer.',
  cargas: () => 'Dorme e come o suficiente nos dias de treino: cargas a descer costumam ser cansaço, não falta de força.',
  fds: () => 'Ao fim de semana, decide de antemão uma refeição livre e mantém as outras dentro da meta.',
  ritual: () => 'Deixa os frascos à vista, junto à escova de dentes: o ritual da pele cola-se a um hábito que já tens.',
  registoPele: () => 'Regista a pele na Nascente 2 vezes por semana, sempre à mesma hora e com a mesma luz.',
  spf: () => 'Põe o protetor solar no fim do ritual da manhã, todos os dias, mesmo com o céu nublado.',
  pelePior: () => 'Se a pele piorou, tira um ativo forte durante uma semana e vê se acalma. Se continuar, fala com um dermatologista.',
  acucarPele: () => 'Experimenta duas semanas com menos açúcar (bebidas e doces) e compara as borbulhas na Nascente.'
};

/* ---------- Hoje ---------- */
function analiseDia(){
  const h = hojeN(), d = diaObj(h), m = IDX.metas, o = objetivos(), K = coletor(), agora = new Date();
  const H = agora.getHours() + agora.getMinutes() / 60, hh = `${Math.floor(H)}h`;
  const S = semana(segundaDe(h)), t = S.treino, usaAgua = Object.keys(D.agua).length > 0;
  const esperado = clamp((H - 7) / 15, 0, 1), fK = d.kcal / m.kcal, fP = d.prot / m.prot, fA = d.agua / m.agua;
  const fechado = H >= 21 || fK >= .9;
  let nota = null, notaComida = null;
  if (d.nRef){
    if (fechado) notaComida = notaDiaComida(d, m);
    else if (esperado >= .1){
      const cal = 1 - clamp((Math.abs(fK - esperado) - .15) / .45, 0, 1), prot = clamp((fP / esperado - .4) / .5, 0, 1), ag = usaAgua ? clamp(fA / esperado / .9, 0, 1) : null;
      notaComida = Math.round((45 * cal + 35 * prot + (ag != null ? 20 * ag : 0)) / (ag != null ? 100 : 80) * 100);
    }
  }
  // O treino entra com 25%: feito hoje vale 100; descanso com a semana em dia, 85; descanso com a semana atrasada, 40.
  let notaTreino = null;
  if (D.temForja){ const espT = t.alvo * S.decorridos / 7; notaTreino = d.treinos.length ? 100 : t.sessoes + .5 >= espT ? 85 : 40; }
  // Treino
  if (d.treinos.length){
    const tr = d.treinos[0], min = Math.round((tr.fim - tr.inicio) / 60000), rec = recordesEntre(tsDe(h), tsDe(h + 1));
    K.bom(92, 'treino', `Treinaste hoje: <b>${esc(tr.nome || 'treino')}</b>, ${min} min${rec.length ? `, com <b>${rec.length} ${rec.length === 1 ? 'recorde' : 'recordes'}</b> (${esc(rec[0].nome.toLowerCase())})` : ''}.`, `treino de ${esc((tr.nome || 'hoje').toLowerCase())} feito`);
  } else if (D.temForja){
    const espT = t.alvo * S.decorridos / 7;
    if (t.sessoes + .5 < espT && H < 21){
      const g = grupoDescansado().slice(0, 2).map(x => x[0].toLowerCase());
      K.mau(68, 'treino', `Vais em <b>${t.sessoes} de ${t.alvo}</b> treinos esta semana. Hoje é um bom dia para treinar${g.length ? ` ${lista(g)}, que descansam há mais tempo` : ''}.`, 'treino em atraso na semana', 'treinos');
    } else if (t.sessoes >= Math.floor(espT)) K.bom(34, 'treino', `Dia de descanso, e estás em dia com os treinos: <b>${t.sessoes} de ${t.alvo}</b> na semana.`, 'treinos em dia');
  }
  // Comida
  if (!d.nRef){ if (H >= 11) K.mau(85, 'comida', 'Ainda não registaste nenhuma refeição hoje.', 'nada registado hoje', 'registo'); }
  else {
    if (d.kcal > m.kcal * 1.1) K.mau(o.peso === 'perder' ? 95 : 62, 'comida', `Já passaste a meta em <b>${fmtInt(d.kcal - m.kcal)} kcal</b> (${fmtInt(d.kcal)} de ${fmtInt(m.kcal)}).${o.peso === 'perder' ? ' Com o objetivo de perder peso, é o que mais pesa hoje.' : ''}`, 'calorias acima da meta', 'kcalAlta');
    else if (fechado && fK < .8) K.mau(o.peso === 'ganhar' || forcaPrio(o) ? 82 : 58, 'comida', `Ficaste a <b>${fmtInt(m.kcal - d.kcal)} kcal</b> da meta.${o.peso === 'perder' ? ' Comer de menos também trava: o corpo poupa energia e perde músculo.' : ' Faltou combustível para o treino.'}`, 'calorias abaixo da meta', 'kcalBaixa');
    else if (!fechado && fK > esperado + .25) K.mau(58, 'comida', `Já vais em <b>${fmtInt(d.kcal)} kcal</b> às ${hh}, à frente do ritmo. Sobram ${fmtInt(Math.max(0, m.kcal - d.kcal))} kcal para o resto do dia.`, 'calorias à frente do ritmo', 'kcalAlta');
    else if (fechado) K.bom(78, 'comida', `Calorias na meta: <b>${fmtInt(d.kcal)}</b> de ${fmtInt(m.kcal)} kcal.`, 'calorias na meta');
    else if (Math.abs(fK - esperado) <= .15) K.bom(48, 'comida', `Calorias a bom ritmo: <b>${fmtInt(d.kcal)} kcal</b> às ${hh}.`, 'calorias a bom ritmo');
    const falta = m.prot - d.prot;
    if (fechado){
      if (fP >= .9) K.bom(forcaPrio(o) ? 80 : 68, 'comida', `Proteína na meta: <b>${fmtInt(d.prot)} g</b> de ${m.prot} g.`, 'proteína na meta');
      else K.mau(forcaPrio(o) ? 90 : 74, 'comida', `Proteína abaixo da meta: <b>${fmtInt(d.prot)} g</b> de ${m.prot} g.${forcaPrio(o) ? ' É ela que constrói o músculo que treinas.' : ''}`, 'proteína abaixo da meta', 'prot');
    } else if (esperado > .25){
      if (fP >= esperado * .9) K.bom(55, 'comida', `Proteína em dia: <b>${fmtInt(d.prot)} g</b> até agora.`, 'proteína em dia');
      else if (fP < esperado * .7) K.mau(72, 'comida', `Proteína atrasada: <b>${fmtInt(d.prot)} g</b> às ${hh}. Faltam ${fmtInt(falta)} g, ${equivProt(falta)}.`, 'proteína atrasada', 'prot');
    }
    if (d.fibra >= 25) K.bom(28, 'comida', `Fibra em dia: <b>${fmtInt(d.fibra)} g</b>.`, 'fibra em dia');
    if (d.sodio > 2300) K.mau(32, 'comida', `Sódio alto: <b>${fmtInt(d.sodio)} mg</b>, acima dos 2000 mg recomendados.`, 'sódio alto');
    const tarde = d.refeicoes.filter(r => new Date(r.ts).getHours() >= 22).reduce((a, r) => a + r.kcal, 0);
    if (tarde > 400) K.mau(36, 'comida', `<b>${fmtInt(tarde)} kcal</b> depois das 22h. Comer mais cedo ajuda o sono e o apetite de amanhã.`, 'comida tardia');
  }
  if (usaAgua){
    if (fA >= .9) K.bom(40, 'comida', `Água na meta: <b>${fmt1(d.agua / 1000)} L</b>.`, 'água na meta');
    else if (esperado > .4 && fA < esperado * .6) K.mau(44, 'comida', d.agua ? `Pouca água: <b>${fmt1(d.agua / 1000)} L</b> de ${fmt1(m.agua / 1000)} L.` : 'Ainda sem água registada hoje.', 'pouca água', 'agua');
  }
  // Peso de hoje
  let notaPeso = '';
  if (d.peso != null){
    const tt = tendEm(h), dif = tt ? d.peso - tt.t : 0;
    K.bom(22, 'peso', `Pesaste-te hoje: <b>${fmt1(d.peso)} kg</b>.`, 'pesagem feita');
    if (dif > .5) notaPeso = ` A pesagem de hoje está ${fmt1(dif)} kg acima da tendência: é água e sal, não gordura.`;
    else if (dif < -.5) notaPeso = ` A pesagem de hoje está ${fmt1(-dif)} kg abaixo da tendência: bom sinal, mas é a tendência que conta.`;
  }
  // Pele (Nascente): os rituais de hoje
  let notaPeleDia = null;
  if (D.temNascente){
    const rp = ritualDia(d.k), espP = (rp.m || H >= 12 ? 1 : 0) + (rp.n || H >= 23 ? 1 : 0), feitasP = (rp.m ? 1 : 0) + (rp.n ? 1 : 0), fr = frascos();
    if (espP) notaPeleDia = Math.round(100 * Math.min(1, feitasP / espP));
    if (rp.m) K.bom(46, 'pele', `Ritual da manhã feito${fr.temSPF ? ', com protetor solar no fim' : ''}.`, 'ritual da manhã feito');
    else if (H >= 12) K.mau(fr.fotossens.length ? 62 : 46, 'pele', `Falta o ritual da manhã.${fr.fotossens.length ? ` Com ${lista(fr.fotossens.slice(0, 2).map(p => esc(p.nome)))} na rotina, o protetor solar é obrigatório.` : ''}`, 'ritual da manhã por fazer', 'ritual');
    if (rp.n) K.bom(44, 'pele', 'Ritual da noite feito.', 'ritual da noite feito');
    else if (H >= 21) K.mau(42, 'pele', 'Ainda falta o ritual da noite, antes de dormir.', 'ritual da noite por fazer', 'ritual');
    const pl = D.nas.pele.find(x => x.d === d.k);
    if (pl && pl.geral != null) K.bom(26, 'pele', `Registaste a pele hoje: estado geral <b>${PELE_MED_I.geral[2][pl.geral].toLowerCase()}</b>.`, 'pele registada');
  }
  {
    const partes = [[notaComida, 60], [notaComida != null ? notaTreino : null, 20], [notaPeleDia, 20]].filter(x => x[0] != null);
    nota = notaComida == null && notaPeleDia == null ? null : Math.round(partes.reduce((a, x) => a + x[0] * x[1], 0) / partes.reduce((a, x) => a + x[1], 0));
  }
  K.ordenar();
  // Conselho
  const resto = m.kcal - d.kcal, restoP = Math.max(0, m.prot - d.prot);
  let conselho;
  if (!d.nRef && H < 11) conselho = 'Começa com um pequeno-almoço com proteína: ovos, iogurte grego ou aveia com leite.';
  else if (!fechado && resto > 150) conselho = `Para fechar o dia na meta: cerca de <b>${fmtInt(resto)} kcal</b> e <b>${fmtInt(restoP)} g de proteína</b>${restoP >= 15 ? `, ${equivProt(restoP)}` : ''}.`;
  else if (!fechado && resto > -100) conselho = 'Estás praticamente na meta. Se tiveres fome, escolhe algo leve e com proteína.';
  else if (d.kcal > m.kcal * 1.1) conselho = o.peso === 'perder' ? 'Fecha a cozinha por hoje. Amanhã não compenses comendo de menos: volta simplesmente à meta.' : 'Amanhã volta à meta, sem compensar.';
  else conselho = K.neg.length ? `Amanhã, o ponto a corrigir: ${K.neg[0].curto}.` : 'Repete amanhã o que fizeste hoje.';
  conselho += notaPeso;
  const fx = faixaPer(nota, 'dia');
  let veredicto;
  if (!d.nRef) veredicto = H < 11 ? 'O dia ainda agora começou. Vamos a isso.' : `Ainda não há refeições registadas hoje.${K.pos.find(x => x.area === 'pele') ? ' Mas a pele já teve o seu ritual.' : ''}`;
  else if (!fechado) veredicto = `Até às ${hh}: ${fmtInt(d.kcal)} kcal e ${fmtInt(d.prot)} g de proteína. ${nota >= 80 ? 'O dia está a correr bem.' : nota >= 60 ? 'O dia está razoável, mas há margem.' : 'O resto do dia pode endireitar isto.'}${K.neg[0] ? ' Atenção: ' + K.neg[0].curto + '.' : ''}`;
  else veredicto = veredictoDe(fx, 'dia', K);
  return {per: 'dia', nota, notaComida, notaTreino, notaPeleDia, faixa: fx, provisoria: !fechado && nota != null, pos: K.pos, neg: K.neg, conselho, veredicto, d, m, H, S};
}

/* ---------- Esta semana ---------- */
function analiseSemana(){
  const h = hojeN(), S = semana(segundaDe(h)), A = semana(segundaDe(h) - 7), m = S.metas, o = objetivos(), K = coletor();
  const c = S.comida, cc = c.comps || {}, t = S.treino, p = S.peso;
  if (c.tem){
    if (cc.calorias >= .8) K.bom(72, 'comida', `Calorias perto da meta em <b>${c.naMeta} de ${c.diasReg}</b> dias, com média de ${fmtInt(c.kcalMed)} kcal.`, 'calorias controladas');
    else if (cc.calorias < .55){ const acima = c.kcalMed > m.kcal;
      K.mau(acima && o.peso === 'perder' ? 94 : 76, 'comida', `Média de <b>${fmtInt(c.kcalMed)} kcal</b>, ${fmtInt(Math.abs(c.kcalMed - m.kcal))} ${acima ? 'acima' : 'abaixo'} da meta de ${fmtInt(m.kcal)}.`, acima ? 'calorias acima da meta' : 'calorias abaixo da meta', acima ? 'kcalAlta' : 'kcalBaixa'); }
    if (cc.proteina >= .85) K.bom(forcaPrio(o) ? 80 : 66, 'comida', `Proteína na meta em <b>${c.protOk} de ${c.diasReg}</b> dias, com média de ${fmtInt(c.protMed)} g.`, 'proteína em dia');
    else if (cc.proteina < .6) K.mau(forcaPrio(o) ? 90 : 74, 'comida', `Proteína média de <b>${fmtInt(c.protMed)} g</b>, abaixo dos ${m.prot} g.${forcaPrio(o) ? ' Para ganhar músculo, é a primeira coisa a corrigir.' : ''}`, 'proteína baixa', 'prot');
    if (cc.registo >= .95 && c.fechados >= 3) K.bom(42, 'comida', `Comida registada em todos os ${c.fechados} dias.`, 'registo completo');
    else if (cc.registo < .75) K.mau(60, 'comida', `Só <b>${c.diasReg} de ${c.fechados}</b> dias com a comida registada.`, 'dias sem registo', 'registo');
    if (cc.agua != null){ if (cc.agua >= .85) K.bom(34, 'comida', `Água em dia: média de <b>${fmt1(c.aguaMed / 1000)} L</b>.`, 'água em dia');
      else if (cc.agua < .6) K.mau(46, 'comida', `Água média de <b>${fmt1(c.aguaMed / 1000)} L</b>, abaixo dos ${fmt1(m.agua / 1000)} L.`, 'pouca água', 'agua'); }
    const comp = S.dias.filter(d => d.kcal >= Math.min(1000, m.kcal * .5) && !(d.hoje && S.emCurso)), fds = comp.filter(d => d.i >= 5), ut = comp.filter(d => d.i < 5);
    if (fds.length && ut.length >= 3){ const dif = media(fds.map(d => d.kcal)) - media(ut.map(d => d.kcal));
      if (dif > m.kcal * .12) K.mau(o.peso === 'perder' ? 70 : 50, 'comida', `Ao fim de semana comeste <b>${sinal(dif)} kcal por dia</b> do que nos dias úteis.`, 'fim de semana pesado', 'fds'); }
  }
  if (D.temForja && S.decorridos){
    const esp = t.alvo * S.decorridos / 7;
    if (t.sessoes >= t.alvo) K.bom(88, 'treino', `Objetivo de treino cumprido: <b>${t.sessoes} de ${t.alvo}</b> treinos.`, 'treinos cumpridos');
    else if (t.sessoes + .5 >= esp) K.bom(60, 'treino', `<b>${t.sessoes} de ${t.alvo}</b> treinos, no ritmo certo para a semana.`, 'treinos em dia');
    else K.mau(86, 'treino', `<b>${t.sessoes} de ${t.alvo}</b> treinos${S.emCurso ? ' até agora: estás atrás do ritmo' : ''}.`, 'treinos em falta', 'treinos');
    if (t.recordes.length) K.bom(80 + Math.min(10, t.recordes.length), 'treino', `<b>${t.recordes.length} ${t.recordes.length === 1 ? 'recorde' : 'recordes'}</b>, com destaque para ${esc(t.recordes[0].nome.toLowerCase())} (${sinal((t.recordes[0].v - t.recordes[0].ant) / t.recordes[0].ant * 100)}%).`, t.recordes.length === 1 ? 'um recorde' : `${t.recordes.length} recordes`);
    if (t.piorou > t.melhorou && t.piorou >= 2) K.mau(56, 'treino', `Desceste em <b>${t.piorou}</b> exercícios face à última vez. Pode ser cansaço, sono ou pouca comida.`, 'cargas a descer', 'cargas');
    else if (t.melhorou >= 2 && !t.recordes.length) K.bom(58, 'treino', `Subiste em <b>${t.melhorou}</b> exercícios face à última vez.`, 'cargas a subir');
    if (t.sessoes && (!S.emCurso || t.sessoes >= t.alvo)){ const esq = GRUPOS.filter(([g]) => !t.grupos[g]).map(([g]) => g.toLowerCase());
      if (esq.length && esq.length < 5) K.mau(52, 'treino', `Sem séries de ${lista(esq)} nesta semana.`, `${lista(esq)} esquecidos`, 'esquecidos'); }
    const pp = !S.emCurso || t.sessoes >= t.alvo;
    if (pp && t.empurrar + t.puxar >= 16 && t.empurrar > t.puxar * 1.5) K.mau(40, 'treino', `<b>${t.empurrar} séries a empurrar e ${t.puxar} a puxar</b>. Mais remadas e elevações protegem os ombros.`, 'pouco trabalho de puxar');
    else if (pp && t.empurrar + t.puxar >= 16 && t.puxar > t.empurrar * 1.5) K.mau(36, 'treino', `<b>${t.puxar} séries a puxar e ${t.empurrar} a empurrar</b>. Peito e ombros pedem mais atenção.`, 'pouco trabalho de empurrar');
  }
  if (p.ritmo != null && p.tFim){
    const r = avaliaRitmo(p.ritmo, p.tFim, o.peso);
    if (r.dentro) K.bom(76, 'peso', `Peso a <b>${sinal(p.ritmo, fmt1)} kg por semana</b>, no ritmo certo para ${OBJ_PESO[o.peso]}.`, 'peso no ritmo certo');
    else if (r.errado) K.mau(88, 'peso', `O peso está a ${p.ritmo > 0 ? 'subir' : 'descer'} (<b>${sinal(p.ritmo, fmt1)} kg por semana</b>), ao contrário do objetivo.`, 'peso na direção errada', 'pesoErrado');
    else if (r.rapido) K.mau(66, 'peso', `Estás a perder peso depressa demais (<b>${sinal(p.ritmo, fmt1)} kg por semana</b>). Mais de 1% por semana arrisca perder músculo.`, 'perda rápida demais', 'kcalBaixa');
    else if (r.lento) K.mau(48, 'peso', `O peso mexe devagar: <b>${sinal(p.ritmo, fmt1)} kg por semana</b>.`, 'peso a mexer devagar', o.peso === 'perder' ? 'kcalAlta' : 'kcalBaixa');
  }
  if (D.pesos.length && p.pesagens.length < 3 && (!S.emCurso || S.decorridos >= 5)) K.mau(34, 'peso', `Só <b>${p.pesagens.length}</b> ${p.pesagens.length === 1 ? 'pesagem' : 'pesagens'} esta semana. Com 3 ou mais, a tendência fica fiável.`, 'poucas pesagens', 'pesagens');
  // Pele (Nascente)
  if (S.pele && S.pele.adesao != null) regrasPele(K, S.pele, A.pele, S.ini, Math.min(S.fim, h), S.emCurso && S.decorridos < 5, 'semana');
  K.ordenar();
  const nota = S.nota.total, fx = faixaPer(nota, 'semana');
  const F = focos(S);
  const conselho = K.neg[0] && CONSELHO[K.neg[0].id] ? CONSELHO[K.neg[0].id](o, m) : F[0] ? F[0][1] : 'Mantém o rumo: a constância vale mais do que semanas perfeitas.';
  return {per: 'semana', nota, faixa: fx, provisoria: S.emCurso, ant: A.nota.total, pos: K.pos, neg: K.neg, conselho,
    veredicto: nota == null ? 'Ainda há poucos dados nesta semana.' : veredictoDe(fx, 'semana', K), S, A};
}

/* ---------- Este mês ---------- */
function periodoMes(ano, mes, ate){
  const ini = Date.UTC(ano, mes, 1) / DIA, fimMes = Date.UTC(ano, mes + 1, 0) / DIA, fim = Math.min(fimMes, ate), dias = [];
  for (let n = ini; n <= fimMes; n++) dias.push(diaObj(n));
  return {ini, fim, fimMes, dias, ate: dias.filter(d => d.n <= fim), nome: MESES_N[((mes % 12) + 12) % 12]};
}
function agregaMes(P, m, o){
  const sc = scoreComida(P.ate, m), comp = sc.comp || [];
  const t0 = tsDe(P.ini), t1 = tsDe(P.fim + 1), sess = D.treinos.filter(t => t.inicio >= t0 && t.inicio < t1);
  const nd = P.fim - P.ini + 1, esp = o.alvo * nd / 7, grupos = {};
  for (const [g, ms] of GRUPOS){ let v = 0; for (const t of sess) for (const it of t.itens){ const ex = EXDB[it.id]; if (!it.fase && ex && CAT_FORCA.has(ex[3]) && ex[1].some(x => ms.includes(x))) v += it.series.length; } grupos[g] = v; }
  const vol = sess.reduce((a, t) => a + t.itens.reduce((x, it) => x + (it.fase ? 0 : it.series.reduce((y, s) => y + s.kg * s.reps, 0)), 0), 0);
  let sobe = 0, desce = 0;
  for (const [, hh] of IDX.hist){ const l = hh.filter(x => x.ts >= t0 && x.ts < t1); if (l.length >= 2){ const dd = l[l.length - 1].v - l[0].v; if (dd > .01) sobe++; else if (dd < -.01) desce++; } }
  const tI = tendEm(P.ini - 1) || IDX.tend.find(x => x.n >= P.ini) || null, tF = tendEm(P.fim);
  return {sc, comp, kcalMed: media(comp.map(d => d.kcal)), protMed: media(comp.map(d => d.prot)), aguaMed: media(P.ate.filter(d => d.agua).map(d => d.agua)),
    sess, nSess: sess.length, esp, grupos, vol, rec: recordesEntre(t0, t1), sobe, desce, nd, tI, tF,
    delta: tI && tF && tF.n >= P.ini ? tF.t - tI.t : null, pesagens: P.ate.filter(d => d.peso != null).length};
}
function analiseMes(){
  const h = hojeN(), hj = new Date(), o = objetivos(), m = IDX.metas, K = coletor();
  const P = periodoMes(hj.getFullYear(), hj.getMonth(), h), Pa = periodoMes(hj.getFullYear(), hj.getMonth() - 1, h);
  const M = agregaMes(P, m, o), Ma = agregaMes(Pa, m, o), cc = M.sc.c || {};
  // Nota do mês: comida 45 (score da Garfada), treino 40 (frequência e progressão), peso 15 (ritmo face ao objetivo)
  const comps = {};
  if (M.sc.score != null) comps.comida = M.sc.score;
  if (D.temForja){ const freq = clamp(M.nSess / Math.max(1, M.esp), 0, 1), prog = M.sobe + M.desce ? M.sobe / (M.sobe + M.desce) : null; comps.treino = Math.round(100 * (prog == null ? freq : freq * .6 + prog * .4)); }
  const ritmo = ritmoPeso(h, 28);
  if (ritmo != null && M.tF){ const r = avaliaRitmo(ritmo, M.tF.t, o.peso); comps.peso = Math.round(r.score * 100); }
  const PM = D.temNascente ? pelePeriodo(P.ini, P.fim) : null; if (PM){ const np = notaPele(PM); if (np != null) comps.pele = np; }
  let s = 0, w = 0; for (const k of PARTES_NOTA) if (comps[k] != null){ s += NOTA_PESOS[k] * comps[k]; w += NOTA_PESOS[k]; }
  const nota = w ? Math.round(s / w) : null, fx = faixaPer(nota, 'mes');
  // Comida
  if (M.comp.length){
    if (cc.calorias >= .78) K.bom(72, 'comida', `Calorias perto da meta na maior parte do mês: média de <b>${fmtInt(M.kcalMed)} kcal</b> por dia.`, 'calorias controladas');
    else if (cc.calorias < .55){ const acima = M.kcalMed > m.kcal; K.mau(acima && o.peso === 'perder' ? 92 : 74, 'comida', `Média de <b>${fmtInt(M.kcalMed)} kcal</b> por dia, ${fmtInt(Math.abs(M.kcalMed - m.kcal))} ${acima ? 'acima' : 'abaixo'} da meta.`, acima ? 'calorias acima da meta' : 'calorias abaixo da meta', acima ? 'kcalAlta' : 'kcalBaixa'); }
    if (cc.proteina >= .85) K.bom(forcaPrio(o) ? 78 : 64, 'comida', `Proteína consistente: média de <b>${fmtInt(M.protMed)} g</b> por dia.`, 'proteína consistente');
    else if (cc.proteina < .6) K.mau(forcaPrio(o) ? 88 : 72, 'comida', `Proteína média de <b>${fmtInt(M.protMed)} g</b>, abaixo dos ${m.prot} g.`, 'proteína baixa', 'prot');
    if (cc.registo >= .9) K.bom(44, 'comida', `Comida registada em <b>${M.comp.length} de ${M.sc.fechados.length}</b> dias.`, 'registo quase completo');
    else if (cc.registo < .75) K.mau(58, 'comida', `Só <b>${M.comp.length} de ${M.sc.fechados.length}</b> dias com a comida registada.`, 'dias sem registo', 'registo');
    if (Ma.comp.length >= 5){
      const dA = Math.abs(Ma.kcalMed - m.kcal), dN = Math.abs(M.kcalMed - m.kcal);
      if (dA - dN > 80) K.bom(52, 'comida', `Mais perto da meta do que em ${Pa.nome}: ${fmtInt(M.kcalMed)} contra ${fmtInt(Ma.kcalMed)} kcal por dia.`, `melhor do que ${Pa.nome} na comida`);
      if (Ma.protMed - M.protMed > 10) K.mau(48, 'comida', `Menos proteína do que em ${Pa.nome}: ${fmtInt(M.protMed)} contra ${fmtInt(Ma.protMed)} g por dia.`, 'menos proteína do que no mês anterior', 'prot');
    }
  }
  // Treino
  if (D.temForja){
    const porSem = M.nSess / (M.nd / 7);
    if (M.nSess >= M.esp - .5) K.bom(84, 'treino', `<b>${M.nSess} treinos</b> em ${M.nd} dias, ${fmt1(porSem)} por semana, no ritmo do objetivo (${o.alvo}).`, 'treinos no ritmo');
    else if (M.nSess >= M.esp * .88) K.bom(66, 'treino', `<b>${M.nSess} treinos</b> em ${M.nd} dias, ${fmt1(porSem)} por semana: perto do objetivo de ${o.alvo}.`, 'treinos perto do objetivo');
    else K.mau(84, 'treino', `<b>${M.nSess} treinos</b> em ${M.nd} dias, ${fmt1(porSem)} por semana, abaixo dos ${o.alvo} do objetivo.`, 'treinos abaixo do objetivo', 'treinos');
    if (M.rec.length) K.bom(80 + Math.min(10, M.rec.length), 'treino', `<b>${M.rec.length} ${M.rec.length === 1 ? 'recorde' : 'recordes'}</b> este mês, com destaque para ${esc(M.rec[0].nome.toLowerCase())} (${sinal((M.rec[0].v - M.rec[0].ant) / M.rec[0].ant * 100)}%).`, M.rec.length === 1 ? 'um recorde' : `${M.rec.length} recordes`);
    if (M.sobe + M.desce >= 3){ if (M.sobe >= M.desce * 2) K.bom(62, 'treino', `As cargas subiram em <b>${M.sobe}</b> exercícios ao longo do mês.`, 'força a subir'); else if (M.desce > M.sobe) K.mau(58, 'treino', `As cargas desceram em <b>${M.desce}</b> exercícios ao longo do mês.`, 'força a descer', 'cargas'); }
    const esq = GRUPOS.filter(([g]) => M.grupos[g] < 6).map(([g]) => g.toLowerCase());
    if (M.nSess >= 3 && esq.length && esq.length < 5) K.mau(50, 'treino', `Pouco trabalho de ${lista(esq)}: menos de 6 séries no mês.`, `${lista(esq)} esquecidos`, 'esquecidos');
  }
  // Peso
  if (ritmo != null && M.tF){
    const r = avaliaRitmo(ritmo, M.tF.t, o.peso);
    const txtD = M.delta != null ? `${sinal(M.delta, fmt1)} kg desde o início do mês` : '';
    if (r.dentro) K.bom(78, 'peso', `${txtD ? cap(txtD) + ', ' : ''}<b>${sinal(ritmo, fmt1)} kg por semana</b>: o ritmo certo para ${OBJ_PESO[o.peso]}.`, 'peso no ritmo certo');
    else if (r.errado) K.mau(90, 'peso', `${txtD ? cap(txtD) + '. ' : ''}O peso vai ao contrário do objetivo (<b>${sinal(ritmo, fmt1)} kg por semana</b>).`, 'peso na direção errada', 'pesoErrado');
    else if (r.rapido) K.mau(66, 'peso', `Perda rápida demais: <b>${sinal(ritmo, fmt1)} kg por semana</b>. Abranda um pouco para proteger o músculo.`, 'perda rápida demais', 'kcalBaixa');
    else if (r.lento) K.mau(50, 'peso', `${txtD ? cap(txtD) + '. ' : ''}O peso mexe devagar (<b>${sinal(ritmo, fmt1)} kg por semana</b>).`, 'peso a mexer devagar', o.peso === 'perder' ? 'kcalAlta' : 'kcalBaixa');
    const C = caminhoPeso();
    if (!C.vazio && C.eta && !C.chegou) K.bom(40, 'peso', `No ritmo atual, chegas aos ${fmt1(C.obj)} kg por volta de <b>${mesAno(C.eta * DIA)}</b>.`, 'chegada ao objetivo à vista');
  }
  if (D.pesos.length && M.nd >= 10 && M.pesagens < M.nd / 7 * 2.5) K.mau(32, 'peso', `Só <b>${M.pesagens}</b> pesagens em ${M.nd} dias.`, 'poucas pesagens', 'pesagens');
  // Melhor semana do mês
  const sems = []; for (let n = segundaDe(P.ini); n <= h; n += 7){ const X = semana(n); if (X.nota.total != null && !X.emCurso) sems.push(X); }
  if (sems.length >= 2){ const b = sems.reduce((a, x) => x.nota.total > a.nota.total ? x : a); K.bom(38, 'nota', `A melhor semana foi a de <b>${rotSemana(b.ini)}</b>, com nota ${b.nota.total}.`, `semana de ${rotSemana(b.ini)} em destaque`); }
  // Pele (Nascente) e cruzamentos com a comida
  if (PM && PM.adesao != null){
    regrasPele(K, PM, pelePeriodo(Pa.ini, Pa.fim), P.ini, P.fim, M.nd < 7, 'mês');
    for (const x of cruzamentosPele()) if (x.forte) K.mau(x.id === 'acucar' ? 54 : 40, 'pele', x.txt, x.id === 'acucar' ? 'açúcar ligado às borbulhas' : 'pouca água ligada à secura', x.id === 'acucar' ? 'acucarPele' : 'agua');
    const fr = frascos(), acab = fr.acabados.filter(p => p.fim >= chaveDe(P.ini));
    if (acab.length) K.bom(24, 'pele', `Gastaste até ao fim <b>${acab.length} ${acab.length === 1 ? 'frasco' : 'frascos'}</b> este mês (${esc(lista(acab.slice(0, 3).map(p => p.nome)))}).`, 'frascos usados até ao fim');
  }
  K.ordenar();
  const conselho = K.neg[0] && CONSELHO[K.neg[0].id] ? CONSELHO[K.neg[0].id](o, m) : 'Mantém o rumo: a constância vale mais do que semanas perfeitas.';
  const veredicto = nota == null ? 'Ainda há poucos dados este mês.' : veredictoDe(fx, 'mes', K, `${cap(P.nome)}, ${M.nd} ${M.nd === 1 ? 'dia' : 'dias'}:`);
  return {per: 'mes', nota, faixa: fx, provisoria: P.fim < P.fimMes, comps, pos: K.pos, neg: K.neg, conselho, veredicto, P, Pa, M, Ma};
}

/* ---------- Gráficos ---------- */
// Hoje: as calorias a acumular ao longo do dia, contra o ritmo ideal até à meta.
function svgRitmoDia(d, m, W, anim){
  const H = 200, L = 40, R = 16, T = 20, B = 26, refs = d.refeicoes.slice().sort((a, b) => a.ts - b.ts);
  const hr = r => { const t = new Date(r.ts); return t.getHours() + t.getMinutes() / 60; };
  const h0 = Math.min(6, ...refs.map(r => Math.floor(hr(r)))), h1 = 24, nowH = d.hoje ? new Date().getHours() + new Date().getMinutes() / 60 : 24;
  const maxK = Math.max(m.kcal * 1.22, d.kcal * 1.08), X = h => L + (h - h0) / (h1 - h0) * (W - L - R), Y = k => T + (1 - k / maxK) * (H - T - B), out = [];
  const passo = maxK > 3200 ? 1000 : 500;
  for (let v = 0; v <= maxK; v += passo) out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" class="grelha"/><text x="${L - 6}" y="${r1(Y(v) + 4)}" text-anchor="end" class="eixo">${fmtInt(v)}</text>`);
  for (const hh of [6, 9, 12, 15, 18, 21, 24]) if (hh >= h0) out.push(`<text x="${r1(X(hh))}" y="${H - 7}" text-anchor="middle" class="eixo">${hh}h</text>`);
  out.push(`<rect x="${L}" y="${r1(Y(m.kcal * 1.1))}" width="${W - L - R}" height="${r1(Y(m.kcal * .9) - Y(m.kcal * 1.1))}" fill="${COR.ouro}" opacity=".08"/>`);
  out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(m.kcal))}" y2="${r1(Y(m.kcal))}" stroke="${COR.ouro}" stroke-width="1.2"/><text x="${L + 4}" y="${r1(Y(m.kcal * 1.1) - 5)}" class="eixo forte">meta ${fmtInt(m.kcal)} kcal</text>`);
  // Ritmo ideal: das 7h às 22h, em linha reta até à meta
  out.push(`<path d="M${r1(X(Math.max(h0, 7)))} ${r1(Y(0))}L${r1(X(22))} ${r1(Y(m.kcal))}L${r1(X(24))} ${r1(Y(m.kcal))}" fill="none" stroke="${COR.nevoa}" stroke-width="1.2" stroke-dasharray="4 4" opacity=".55"/>`);
  if (refs.length){
    let cum = 0, dP = `M${r1(X(h0))} ${r1(Y(0))}`;
    const pts = [];
    for (const r of refs){ const x = X(hr(r)); dP += `L${r1(x)} ${r1(Y(cum))}`; cum += r.kcal; dP += `L${r1(x)} ${r1(Y(cum))}`; pts.push({x, y: Y(cum), r, cum}); }
    const xFim = X(d.hoje ? Math.max(nowH, hr(refs[refs.length - 1])) : 24);
    dP += `L${r1(xFim)} ${r1(Y(cum))}`;
    out.push(`<defs><linearGradient id="vhArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${COR.comida}" stop-opacity=".32"/><stop offset="1" stop-color="${COR.comida}" stop-opacity="0"/></linearGradient></defs>`);
    out.push(`<path class="vh-area" d="${dP}L${r1(xFim)} ${r1(Y(0))}Z" fill="url(#vhArea)"/>`);
    out.push(`<path class="vh-linha" pathLength="1" d="${dP}" fill="none" stroke="${COR.comida}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`);
    const maxR = Math.max(...refs.map(r => r.kcal));
    pts.forEach((p, i) => out.push(`<circle class="vh-ponto" style="--i:${i}" cx="${r1(p.x)}" cy="${r1(p.y)}" r="${r1(3.4 + 3.2 * Math.sqrt(p.r.kcal / maxR))}" fill="${COR.comida}" stroke="#151923" stroke-width="2" data-dica="${dica(`<b>${esc(p.r.prato)}</b><span>${hora(p.r.ts)}, ${fmtInt(p.r.kcal)} kcal e ${fmtInt(p.r.prot)} g de proteína</span><span>Total até aqui: ${fmtInt(p.cum)} kcal</span>`)}"/>`));
    const u = pts[pts.length - 1];
    out.push(`<text x="${r1(Math.min(u.x + 8, W - R - 4))}" y="${r1(u.y - 8)}" text-anchor="${u.x > W - 90 ? 'end' : 'start'}" class="valor">${fmtInt(cum)} kcal</text>`);
  }
  if (d.hoje && nowH > h0 && nowH < 24) out.push(`<line x1="${r1(X(nowH))}" x2="${r1(X(nowH))}" y1="${T - 6}" y2="${H - B}" stroke="${COR.luar}" stroke-opacity=".4" stroke-width="1"/><text x="${r1(X(nowH))}" y="${T - 9}" text-anchor="middle" class="eixo forte">agora</text>`);
  out.push(`<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="${COR.aresta2}"/>`);
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf vh-ritmo${anim ? ' anim' : ''}" role="img" aria-label="Calorias ao longo do dia">${out.join('')}</svg>`;
}
function anelMini(frac, cor, centro, rot, sub, anim){
  const f = clamp(frac || 0, 0, 1), mais = clamp((frac || 0) - 1, 0, 1);
  return `<div class="anel-mini"><div class="am-anel"><svg viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="26" stroke="#2c3448" stroke-width="5.5" fill="none"/>
    ${f > .005 ? `<circle class="am-arco${anim ? ' anim' : ''}" cx="32" cy="32" r="26" stroke="${cor}" stroke-width="5.5" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="${f.toFixed(3)} 2" transform="rotate(-90 32 32)"/>` : ''}
    ${mais > .005 ? `<circle cx="32" cy="32" r="26" stroke="${COR.ouro}" stroke-width="2.4" fill="none" stroke-linecap="round" pathLength="1" stroke-dasharray="${mais.toFixed(3)} 2" transform="rotate(-90 32 32)"/>` : ''}</svg>
    <b>${centro}</b></div><span>${rot}</span><small>${sub}</small></div>`;
}
// Semana: a nota de cada dia como uma constelação, com a semana anterior em fundo.
function svgSemanaVigia(S, A, W, hojeNota, anim){
  const H = 196, L = 32, R = 14, T = 16, B = 46, m = S.metas, out = [];
  const X = i => L + (i + .5) * (W - L - R) / 7, Y = v => T + (1 - v / 100) * (H - T - B);
  for (const v of [0, 50, 100]) out.push(`<line x1="${L}" x2="${W - R}" y1="${r1(Y(v))}" y2="${r1(Y(v))}" class="grelha"/><text x="${L - 6}" y="${r1(Y(v) + 4)}" text-anchor="end" class="eixo">${v}</text>`);
  out.push(`<rect x="${L}" y="${r1(Y(100))}" width="${W - L - R}" height="${r1(Y(70) - Y(100))}" fill="${COR.comida}" opacity=".05"/><text x="${W - R - 4}" y="${r1(Y(70) - 5)}" text-anchor="end" class="eixo">zona boa</text>`);
  const notas = X2 => X2.dias.map(d => d.futuro ? null : d.hoje ? null : notaDiaComida(d, m));
  const nA = notas(A), nS = notas(S);
  const ti = S.dias.findIndex(d => d.hoje); if (ti >= 0 && hojeNota != null) nS[ti] = hojeNota;
  const linha = (ns, cls, attrs) => { let d = '', dentro = false; ns.forEach((v, i) => { if (v == null){ dentro = false; return; } d += `${dentro ? 'L' : 'M'}${r1(X(i))} ${r1(Y(v))}`; dentro = true; }); return d ? `<path class="${cls}" d="${d}" ${attrs}/>` : ''; };
  out.push(linha(nA, 'vh-ant', `fill="none" stroke="${COR.nevoa}" stroke-width="1.3" opacity=".45" stroke-linejoin="round"`));
  nA.forEach((v, i) => { if (v != null) out.push(`<circle cx="${r1(X(i))}" cy="${r1(Y(v))}" r="2.2" fill="${COR.nevoa}" opacity=".5"/>`); });
  out.push(linha(nS, 'vh-linha', `pathLength="1" fill="none" stroke="${COR.ouro}" stroke-width="2.2" stroke-linejoin="round"`));
  nS.forEach((v, i) => {
    if (v == null) return;
    const prov = S.dias[i].hoje, x = X(i), y = Y(v);
    out.push(`<g class="vh-ponto" style="--i:${i}"><circle cx="${r1(x)}" cy="${r1(y)}" r="11" fill="url(#vhBrilho)"/><path d="${estrela(x, y, 6.5)}" fill="${prov ? '#151923' : COR.ouro}" stroke="${COR.ouro}" stroke-width="${prov ? 1.4 : 0}"/></g>`);
    out.push(`<text x="${r1(x)}" y="${r1(y - 11)}" text-anchor="middle" class="eixo forte">${v}</text>`);
  });
  S.dias.forEach((d, i) => {
    const x = X(i), cls = d.hoje ? 'eixo forte' : 'eixo';
    out.push(`<text x="${r1(x)}" y="${H - B + 16}" text-anchor="middle" class="${cls}">${INICIAIS[d.i]}</text>`);
    if (d.treinos.length) out.push(`<circle cx="${r1(x)}" cy="${H - B + 31}" r="7" fill="url(#vhBrasa)"/><circle cx="${r1(x)}" cy="${H - B + 31}" r="2.6" fill="#FFE9C2"/>`);
    const html = `<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b>${nS[i] != null ? `<span><i class="mk nota"></i>Nota do dia ${nS[i]}${d.hoje ? ' (em curso)' : ''}</span>` : `<span>${d.futuro ? 'Ainda não chegou' : 'Sem nota (pouco registo)'}</span>`}${d.kcal ? `<span><i class="mk comida"></i>${fmtInt(d.kcal)} kcal, ${fmtInt(d.prot)} g de proteína</span>` : ''}${d.treinos.length ? `<span><i class="mk treino"></i>${esc(d.treinos[0].nome || 'Treino')}</span>` : ''}${nA[i] != null ? `<span>Semana anterior: ${nA[i]}</span>` : ''}`;
    out.push(`<rect x="${r1(L + (W - L - R) / 7 * i)}" y="0" width="${r1((W - L - R) / 7)}" height="${H}" fill="transparent" data-dica="${dica(html)}"${d.futuro ? '' : ` data-acao="dia" data-v="${d.k}" style="cursor:pointer"`}/>`);
  });
  return `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="graf vh-semana${anim ? ' anim' : ''}" role="img" aria-label="Nota de cada dia da semana">
    <defs><radialGradient id="vhBrilho"><stop offset="0" stop-color="#E6CC93" stop-opacity=".45"/><stop offset="1" stop-color="#E6CC93" stop-opacity="0"/></radialGradient>
    <radialGradient id="vhBrasa"><stop offset="0" stop-color="#FFB766"/><stop offset=".55" stop-color="#EE6A22"/><stop offset="1" stop-color="#EE6A22" stop-opacity="0"/></radialGradient></defs>${out.join('')}</svg>`;
}
// Mês: o calendário, cada dia pintado pela nota de comida; a brasa marca os treinos.
function svgMesVigia(P, W){
  const m = IDX.metas, gap = 4, cel = Math.min(42, Math.floor((W - gap * 6) / 7)), off = P.dias[0].i, linhas = Math.ceil((off + P.dias.length) / 7);
  const Wf = cel * 7 + gap * 6, T = 18, H = T + linhas * (cel + gap), out = [];
  INICIAIS.forEach((l, i) => out.push(`<text x="${r1(i * (cel + gap) + cel / 2)}" y="11" text-anchor="middle" class="eixo">${l}</text>`));
  P.dias.forEach((d, j) => {
    const k = off + j, x = (k % 7) * (cel + gap), y = T + Math.floor(k / 7) * (cel + gap);
    const s = d.futuro || d.hoje ? null : notaDiaComida(d, m), nv = d.futuro ? -1 : s == null ? (d.kcal ? 1 : 0) : s >= 85 ? 4 : s >= 70 ? 3 : s >= 55 ? 2 : 1;
    const fill = nv < 0 ? 'none' : RAMPA[nv], escuro = nv >= 3;
    out.push(`<rect x="${x}" y="${y}" width="${cel}" height="${cel}" rx="${Math.round(cel / 5)}" fill="${fill}" stroke="${d.hoje ? COR.luar : nv < 0 ? COR.aresta2 : 'none'}" stroke-width="${d.hoje ? 1.6 : 1}"${nv < 0 ? '' : ` data-acao="dia" data-v="${d.k}" style="cursor:pointer"`} data-dica="${dica(`<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b>${d.futuro ? '<span>Ainda não chegou</span>' : `${s != null ? `<span><i class="mk nota"></i>Nota do dia ${s}</span>` : ''}${d.kcal ? `<span><i class="mk comida"></i>${fmtInt(d.kcal)} kcal, ${fmtInt(d.prot)} g de proteína</span>` : '<span>Sem registo</span>'}${d.treinos.length ? `<span><i class="mk treino"></i>${esc(d.treinos[0].nome || 'Treino')}</span>` : ''}`}`)}"/>`);
    out.push(`<text x="${x + 5}" y="${y + 13}" class="vh-cal-n${escuro ? ' escuro' : ''}${nv < 0 ? ' futuro' : ''}" pointer-events="none">${new Date(d.n * DIA).getUTCDate()}</text>`);
    if (d.treinos.length) out.push(`<circle cx="${x + cel - 8}" cy="${y + cel - 8}" r="${Math.max(3, cel / 10)}" fill="${COR.treino}" stroke="${fill === 'none' ? '#151923' : fill}" stroke-width="1.5" pointer-events="none"/>`);
  });
  return `<svg viewBox="0 0 ${Wf} ${H}" width="${Wf}" height="${H}" class="graf vh-mes" role="img" aria-label="Calendário do mês">${out.join('')}</svg>`;
}
function anelNota(v, anim){
  const f = v == null ? 0 : clamp(v / 100, 0, 1);
  return `<svg class="vh-anel${anim ? ' anim' : ''}" viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="vhOuro" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF1C9"/><stop offset=".6" stop-color="#E6C77F"/><stop offset="1" stop-color="#B8903F"/></linearGradient></defs>
    <circle cx="60" cy="60" r="50" fill="none" stroke="#2c3448" stroke-width="8"/>
    ${[...Array(20)].map((_, i) => { const a = i / 20 * Math.PI * 2 - Math.PI / 2; return `<path d="M${r1(60 + 41 * Math.cos(a))} ${r1(60 + 41 * Math.sin(a))}L${r1(60 + 38 * Math.cos(a))} ${r1(60 + 38 * Math.sin(a))}" stroke="#B4C4EC" stroke-opacity=".3"/>`; }).join('')}
    ${f > .005 ? `<circle class="vh-anel-arco" cx="60" cy="60" r="50" fill="none" stroke="url(#vhOuro)" stroke-width="8" stroke-linecap="round" pathLength="1" stroke-dasharray="${f.toFixed(3)} 2" transform="rotate(-90 60 60)"/>` : ''}</svg>`;
}

/* ---------- O painel do vigia ---------- */
function kpisNota(c, extra){
  const nomes = {comida: 'Comida', treino: 'Treino', peso: 'Peso', pele: 'Pele'};
  const itens = PARTES_NOTA.filter(k => c[k] != null).map(k => [nomes[k], c[k]]).concat(extra || []);
  return `<dl class="vh-kpis">${itens.map(([n, v]) => `<div><dt>${n}</dt><dd>${v}</dd></div>`).join('')}</dl>`;
}
function subPer(tab, a){
  if (tab === 'dia') return a.nota == null ? (a.d.nRef ? 'Ainda pouco registo para dar nota.' : 'Sem refeições registadas.') : `${a.provisoria ? `Ritmo até às ${Math.floor(a.H)}h. ` : ''}${[a.notaComida != null ? `comida ${a.notaComida}` : '', a.notaComida != null && a.notaTreino != null ? `treino ${a.notaTreino}` : '', a.notaPeleDia != null ? `pele ${a.notaPeleDia}` : ''].filter(Boolean).join(', ').replace(/^./, c => c.toUpperCase())}.`;
  if (tab === 'semana') return `${rotSemana(a.S.ini)}${a.provisoria ? ', em curso' : ''}.`;
  return `${cap(a.P.nome)}, ${a.M.nd} ${a.M.nd === 1 ? 'dia' : 'dias'}${a.provisoria ? ' até hoje' : ''}.`;
}
function vigiaAnalises(){ return {dia: analiseDia(), semana: analiseSemana(), mes: analiseMes()}; }
function tabPadrao(an){
  if (vigiaTab) return vigiaTab;
  return an.dia.d.nRef || new Date().getHours() >= 11 ? 'dia' : 'semana';
}
function iaHoje(){ const v = ML.get('vigiaIA', null); return v && v.dia === chaveData(new Date()) ? v : null; }
function assinaturaTotal(an){
  const s = JSON.stringify([an.dia.d.kcal | 0, an.dia.d.prot | 0, an.dia.d.agua, an.dia.d.treinos.length, an.semana.nota, an.mes.nota, D.pesos.length]);
  let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h;
}
function objetivosChips(o, m){
  const c = [];
  c.push(o.meta ? `${cap(OBJ_PESO[o.peso])} até aos ${fmt1(o.meta)} kg` : cap(OBJ_PESO[o.peso]));
  if (o.treino) c.push(`Treino: ${OBJ_TREINO[o.treino]}, ${o.alvo} por semana`);
  c.push(`${fmtInt(m.kcal)} kcal e ${m.prot} g de proteína por dia`);
  return c.map(x => `<span>${x}</span>`).join('');
}
function renderVigiaHero(anim){
  const el = $('#vigiaHero'); if (!el || !DADOS) return;
  const an = vigiaAnalises(), tab = tabPadrao(an), a = an[tab], o = objetivos(), m = IDX.metas;
  const ia = iaHoje(), r = ia && ia.r && ia.r[tab], usaIA = !!(r && r.veredicto);
  const veredicto = usaIA ? r.veredicto : semTags(a.veredicto);
  const pos = usaIA ? (r.positivos || []).map(x => ({txt: esc(x)})) : a.pos.slice(0, 4);
  const neg = usaIA ? (r.negativos || []).map(x => ({txt: esc(x)})) : a.neg.slice(0, 4);
  const conselho = usaIA && r.conselho ? esc(r.conselho) : a.conselho;
  const humor = humorDe(a.nota);
  // Resumo à direita do anel
  let resumo = '';
  if (tab === 'dia'){
    const d = a.d, t = an.semana.S.treino;
    resumo = `<div class="aneis" role="group" aria-label="Hoje, face às metas">${anelMini(d.kcal / m.kcal, COR.comida, fmtInt(d.kcal), 'Calorias', `de ${fmtInt(m.kcal)}`, anim)}${anelMini(d.prot / m.prot, COR.comida, fmtInt(d.prot) + ' g', 'Proteína', `de ${m.prot} g`, anim)}
      ${anelMini(d.agua / m.agua, '#4FC3F7', d.agua ? fmt1(d.agua / 1000) + ' L' : '—', 'Água', `de ${fmt1(m.agua / 1000)} L`, anim)}${D.temForja ? anelMini(d.treinos.length ? 1 : t.sessoes / Math.max(1, t.alvo), COR.treino, d.treinos.length ? 'Feito' : `${t.sessoes}/${t.alvo}`, 'Treino', d.treinos.length ? 'hoje' : 'na semana', anim) : ''}${D.temNascente ? (() => { const rp = ritualDia(d.k), f = (rp.m ? 1 : 0) + (rp.n ? 1 : 0); return anelMini(f / 2, COR.pele, `${f}/2`, 'Pele', `${rp.m ? '☀' : '·'} manhã ${rp.n ? '☾' : '·'} noite`.replace(/·/g, '○'), anim); })() : ''}</div>`;
  } else if (tab === 'semana'){
    const S = a.S;
    resumo = kpisNota(S.nota.c, [['Semana anterior', a.ant ?? '—']]);
  } else {
    resumo = kpisNota(a.comps, [['Dias', a.M.nd]]);
  }
  // Comparação do mês com o anterior
  let extra = '';
  if (tab === 'mes'){
    const M = a.M, Ma = a.Ma, lin = [];
    // A seta mostra para onde foi o valor; a cor diz se isso te aproxima do objetivo.
    const seta = (dv, bom) => `<i class="vh-seta ${dv === 0 ? '' : bom ? 'bom' : 'mau'}" aria-label="${dv === 0 ? 'igual' : bom ? 'melhor' : 'pior'}">${dv > 0 ? '↑' : dv < 0 ? '↓' : '='}</i>`;
    if (M.comp.length && Ma.comp.length){
      const dist = x => Math.abs(x - m.kcal), dk = Math.round(M.kcalMed - Ma.kcalMed);
      lin.push(['Calorias por dia', fmtInt(M.kcalMed), fmtInt(Ma.kcalMed), seta(Math.sign(dk), dist(M.kcalMed) <= dist(Ma.kcalMed))]);
      const dp = Math.round(M.protMed - Ma.protMed); lin.push(['Proteína por dia', fmtInt(M.protMed) + ' g', fmtInt(Ma.protMed) + ' g', seta(Math.sign(dp), dp >= 0)]);
    }
    if (D.temForja){ const a1 = M.nSess / (M.nd / 7), a0 = Ma.nSess / (Ma.nd / 7), dt = Math.round((a1 - a0) * 10); lin.push(['Treinos por semana', fmt1(a1), fmt1(a0), seta(Math.sign(dt), dt >= 0)]); }
    if (M.delta != null && Ma.delta != null && M.nd >= 7){
      const r1s = M.delta / (M.nd / 7), r0s = Ma.delta / (Ma.nd / 7), dr = Math.round((r1s - r0s) * 10);
      const bom = o.peso === 'perder' ? r1s <= r0s : o.peso === 'ganhar' ? r1s >= r0s : Math.abs(r1s) <= Math.abs(r0s);
      lin.push(['Peso por semana', sinal(r1s, fmt1) + ' kg', sinal(r0s, fmt1) + ' kg', seta(Math.sign(dr), bom)]);
    }
    if (lin.length) extra = `<div class="vh-comp"><h3>Face a ${a.Pa.nome}</h3><ul>${lin.map(([n, v, x, s]) => `<li><span>${n}</span><b>${v}</b><small>antes ${x}</small>${s}</li>`).join('')}</ul></div>`;
  }
  const legenda = tab === 'dia' ? `<div class="lev-legenda"><span><i class="mk comida"></i>Calorias acumuladas</span><span><svg width="18" height="2" aria-hidden="true"><path d="M0 1h18" stroke="${COR.nevoa}" stroke-dasharray="4 3"/></svg>Ritmo ideal</span><span><svg width="16" height="2" aria-hidden="true"><rect width="16" height="2" fill="${COR.ouro}"/></svg>Meta</span></div>`
    : tab === 'semana' ? `<div class="lev-legenda"><span><i class="mk nota"></i>Nota de cada dia</span><span><svg width="18" height="2" aria-hidden="true"><rect width="18" height="2" fill="${COR.nevoa}" opacity=".6"/></svg>Semana anterior</span><span><i class="mk treino"></i>Treino</span></div>`
    : `<div class="lev-legenda"><span><i class="q" style="background:${RAMPA[0]}"></i>Sem registo</span><span><i class="q" style="background:${RAMPA[1]}"></i>Abaixo de 55</span><span><i class="q" style="background:${RAMPA[2]}"></i>55 a 69</span><span><i class="q" style="background:${RAMPA[3]}"></i>70 a 84</span><span><i class="q" style="background:${RAMPA[4]}"></i>85 ou mais</span><span><i class="mk treino"></i>Treino</span></div>`;
  const tituloGraf = tab === 'dia' ? 'O teu dia, hora a hora' : tab === 'semana' ? 'A semana, dia a dia' : `${cap(a.P.nome)}, dia a dia`;
  const estadoIA = !D.ia.chave ? `<button class="bt vh-bt" data-acao="irLigacoes">Ligar a IA para comentários escritos</button>`
    : vigiaPensa ? '<span>O vigia está a pensar…</span>'
    : ia ? `<span>${usaIA ? 'Comentários escritos pela IA' : 'Análise automática'}, às ${hora(ia.ts)}.</span>${ia.ass !== assinaturaTotal(an) ? '<button class="bt vh-bt" data-acao="vigiaIA">Atualizar a leitura</button>' : ''}`
    : '<button class="bt vh-bt" data-acao="vigiaIA">Pedir a leitura da IA</button>';
  el.innerHTML = `
    <div class="vh-esq">
      <div class="vh-topo">
        <div class="vh-coruja" data-acao="coruja" role="button" tabindex="0" aria-label="O vigia: toca para o acordar">${svgCoruja(humor, true)}</div>
        <div class="vh-balao"><span class="vh-quem">O vigia · ${NOME_PER[tab].toLowerCase()}</span>
          <p class="vh-veredicto"><span class="fantasma">${esc(veredicto)}</span><span class="vivo"></span></p></div>
      </div>
      <div class="vh-obj" aria-label="Os teus objetivos">${objetivosChips(o, m)}</div>
    </div>
    <div class="vh-dir">
      <div class="vh-tabs" role="tablist">${['dia', 'semana', 'mes'].map(k => `<button role="tab" class="vh-tab${k === tab ? ' sel' : ''}" aria-selected="${k === tab}" data-acao="vigiaTab" data-v="${k}">${NOME_PER[k]}</button>`).join('')}</div>
      <div class="vh-resumo">
        <div class="vh-nota">${anelNota(a.nota, anim)}<div class="vh-nota-num"><b data-conta="${a.nota ?? ''}">${a.nota == null ? '—' : anim ? 0 : a.nota}</b><span>${a.nota == null ? 'sem nota' : a.provisoria ? 'em curso' : 'de 100'}</span></div></div>
        <div class="vh-resumo-txt"><h2>${a.faixa || NOME_PER[tab]}</h2><p class="sub">${subPer(tab, a)}</p>${tab === 'dia' ? '' : resumo}</div>
      </div>
      ${tab === 'dia' ? resumo : ''}
      <div class="vh-graf"><h3>${tituloGraf}</h3><div class="graf-caixa${tab === 'mes' ? ' vh-mes-caixa' : ''}" data-graf="vh"></div>${legenda}</div>
      ${extra}
      <div class="vh-listas">
        <div class="vh-lista bom"><h3><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="${estrela(10, 10, 8)}" fill="${COR.ouro}"/></svg>Correu bem</h3>
          ${pos.length ? `<ul>${pos.map(x => `<li><i></i><span>${x.txt}</span></li>`).join('')}</ul>` : '<p class="nota-vazia">Ainda nada a destacar.</p>'}</div>
        <div class="vh-lista mau"><h3><svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true"><path d="M10 2.5L18.5 17H1.5Z" fill="none" stroke="#FF8A7A" stroke-width="1.8" stroke-linejoin="round"/><path d="M10 8v4.2" stroke="#FF8A7A" stroke-width="1.8" stroke-linecap="round"/><circle cx="10" cy="14.6" r="1.1" fill="#FF8A7A"/></svg>A melhorar</h3>
          ${neg.length ? `<ul>${neg.map(x => `<li><i></i><span>${x.txt}</span></li>`).join('')}</ul>` : '<p class="nota-vazia">Nada a apontar. Continua assim.</p>'}</div>
      </div>
      <div class="vh-conselho"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5a7 7 0 0 0-4 12.7V18h8v-2.8A7 7 0 0 0 12 2.5z" fill="none" stroke="${COR.ouro}" stroke-width="1.6"/><path d="M9.5 21h5" stroke="${COR.ouro}" stroke-width="1.6" stroke-linecap="round"/></svg><p><b>O próximo passo.</b> ${conselho}</p></div>
      <div class="vh-ia">${estadoIA}</div>
    </div>`;
  GRAFS.vh = w => tab === 'dia' ? svgRitmoDia(a.d, m, w, anim) : tab === 'semana' ? svgSemanaVigia(a.S, a.A, w, an.dia.nota, anim) : svgMesVigia(a.P, w);
  desenhar(el);
  if (anim && a.nota != null) contar(el.querySelector('.vh-nota-num b'), a.nota, 1200);
  falar(el.querySelector('.vh-veredicto'), veredicto, anim);
  const c = el.querySelector('.coruja'); if (c && vigiaPensa) c.classList.add('pensa');
  // Leitura da IA automática, uma vez por dia
  if (D.ia.chave && !D.demo && !vigiaIAPedida && !iaHoje()){ vigiaIAPedida = true; pedirLeituraIA(an); }
}

/* ---------- A coruja fala, olha e reage ---------- */
function falar(p, texto, anim){
  if (!p) return;
  const vivo = p.querySelector('.vivo'), c = document.querySelector('#vigiaHero .coruja');
  clearInterval(falarT);
  if (!anim && p.dataset.dito === texto || matchMedia('(prefers-reduced-motion: reduce)').matches){ vivo.textContent = texto; p.dataset.dito = texto; return; }
  let i = 0; vivo.textContent = ''; p.classList.add('a-escrever'); if (c) c.classList.add('fala');
  const passo = Math.max(14, Math.min(30, 2000 / Math.max(1, texto.length)));
  falarT = setInterval(() => {
    i += texto.length > 160 ? 2 : 1; vivo.textContent = texto.slice(0, i);
    if (i >= texto.length){ clearInterval(falarT); p.classList.remove('a-escrever'); p.dataset.dito = texto; const cc = document.querySelector('#vigiaHero .coruja'); if (cc) cc.classList.remove('fala'); }
  }, passo);
}
function olharPara(x, y){
  $$('.coruja.segue').forEach(c => {
    const r = c.getBoundingClientRect(); if (!r.width) return;
    const cx = r.left + r.width * .5, cy = r.top + r.height * .31, dx = x - cx, dy = y - cy, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 160);
    c.style.setProperty('--ex', (dx / d * 3.4 * k).toFixed(2) + 'px'); c.style.setProperty('--ey', (dy / d * 2.8 * k).toFixed(2) + 'px');
  });
}
document.addEventListener('pointermove', e => { if (e.pointerType === 'mouse'){ ultimoOlhar = Date.now(); olharPara(e.clientX, e.clientY); } }, {passive: true});
document.addEventListener('pointerdown', e => { ultimoOlhar = Date.now() + 1200; olharPara(e.clientX, e.clientY); }, {passive: true});
setInterval(() => {
  if (document.hidden || Date.now() - ultimoOlhar < 3500) return;
  $$('.coruja.segue').forEach(c => { const r = Math.random(); c.style.setProperty('--ex', (r < .35 ? 0 : (Math.random() * 6 - 3)).toFixed(2) + 'px'); c.style.setProperty('--ey', (r < .35 ? 0 : (Math.random() * 4 - 1.5)).toFixed(2) + 'px'); });
}, 2600);

/* ---------- A leitura da IA: os três períodos de uma vez ---------- */
async function pedirLeituraIA(an){
  if (!D.ia.chave) return;
  an = an || vigiaAnalises();
  vigiaPensa = true;
  $$('#vigiaHero .coruja').forEach(c => c.classList.add('pensa'));
  const st = $('#vigiaHero .vh-ia'); if (st) st.innerHTML = '<span>O vigia está a pensar…</span>';
  const o = objetivos(), m = IDX.metas, d = an.dia.d, tt = tendEm(hojeN());
  const resumoLista = a => ({nota: a.nota, positivos: a.pos.map(x => semTags(x.txt)), negativos: a.neg.map(x => semTags(x.txt))});
  const dados = {
    nome: D.nome || null,
    objetivos: {peso: OBJ_PESO[o.peso], peso_objetivo_kg: o.meta || null, treino: OBJ_TREINO[o.treino] || null, treinos_por_semana: o.alvo, metas_diarias: {kcal: m.kcal, proteina_g: m.prot, agua_ml: m.agua}},
    hoje: {hora: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`, kcal: Math.round(d.kcal), proteina_g: Math.round(d.prot), agua_ml: d.agua,
      refeicoes: d.refeicoes.map(r => ({hora: hora(r.ts), prato: r.prato, kcal: Math.round(r.kcal), proteina_g: Math.round(r.prot)})),
      treino: d.treinos.map(t => ({nome: t.nome, minutos: Math.round((t.fim - t.inicio) / 60000)})), peso_kg: d.peso, tendencia_peso_kg: tt ? +tt.t.toFixed(1) : null},
    semana: resumoParaIA(an.semana.S, an.semana.A),
    mes: {mes: an.mes.P.nome, dias_decorridos: an.mes.M.nd, nota: an.mes.nota, componentes: an.mes.comps, kcal_media: Math.round(an.mes.M.kcalMed), proteina_media_g: Math.round(an.mes.M.protMed),
      dias_registados: an.mes.M.comp.length, treinos: an.mes.M.nSess, treinos_esperados: Math.round(an.mes.M.esp), recordes: an.mes.M.rec.map(r => r.nome), peso_variacao_kg: an.mes.M.delta != null ? +an.mes.M.delta.toFixed(1) : null,
      mes_anterior: {mes: an.mes.Pa.nome, kcal_media: Math.round(an.mes.Ma.kcalMed), proteina_media_g: Math.round(an.mes.Ma.protMed), treinos: an.mes.Ma.nSess, peso_variacao_kg: an.mes.Ma.delta != null ? +an.mes.Ma.delta.toFixed(1) : null}},
    pele: D.temNascente ? (() => { const h0 = hojeN(), rp = ritualDia(chaveDe(h0)), Ps = pelePeriodo(segundaDe(h0), h0), Pm = pelePeriodo(an.mes.P.ini, h0), r = reinoPele(), fr = frascos();
      const med = x => Object.fromEntries(Object.entries(x.medias).filter(([, v]) => v != null).map(([k, v]) => [k, +v.toFixed(1)]));
      return {escala: '0 a 4; no estado geral, mais é melhor; nas outras medidas, menos é melhor', hoje: {manha_feita: rp.m, noite_feita: rp.n},
        semana: {rituais_feitos: Ps.feitas, rituais_possiveis: Ps.possiveis, medias: med(Ps), registos: Ps.regs.length}, mes: {rituais_feitos: Pm.feitas, rituais_possiveis: Pm.possiveis, medias: med(Pm), sinais: Pm.sinais},
        reino_de_cultivo: r.nome, dias_seguidos: sequenciaPele(), frascos_em_uso: fr.uso.map(p => p.nome), alertas_validade: fr.alertas.map(x => x.p.nome),
        cruzamentos: cruzamentosPele().map(x => semTags(x.txt))}; })() : null,
    analise_automatica: {dia: resumoLista(an.dia), semana: resumoLista(an.semana), mes: resumoLista(an.mes)}
  };
  const prompt = `És o vigia do Mirante: uma coruja sábia que acompanha a alimentação (registada na app Garfada), os treinos de ginásio em casa (registados na app Forja) e os cuidados da pele (rituais de manhã e de noite e registos da pele, na app Nascente) de uma pessoa, para a ajudar a chegar aos seus objetivos.
Escreve em português de Portugal (PT-PT), no tom direto e caloroso de um treinador experiente que conhece bem a pessoa. Sem emojis, sem termos em inglês, sem exageros.
Analisa três períodos: hoje (o dia pode estar em curso; tem em conta a hora), esta semana e este mês. Para cada período, avalia o desempenho à luz dos objetivos e responde só com JSON neste formato:
{"dia": {"veredicto": "uma frase curta e concreta que resume o período", "positivos": ["2 a 3 frases curtas, com números"], "negativos": ["2 a 3 frases curtas, com números"], "conselho": "uma ação concreta e específica para o próximo passo"}, "semana": {...igual...}, "mes": {...igual...}}
Regras: usa os números dos dados; cruza comida, treino e peso quando fizer sentido (por exemplo, proteína nos dias de treino, calorias e ritmo do peso); não inventes dados; se não houver negativos reais, diz o que pode ficar ainda melhor; não dês conselhos médicos. A análise automática serve de base, mas melhora-a e escreve-a à tua maneira.
Dados: ${JSON.stringify(dados)}`;
  try {
    const txt = await IA.pedir({texto: prompt, json: true, chave: D.ia.chave, modelo: D.ia.modelo, temperatura: .5});
    const a = txt.indexOf('{'), b = txt.lastIndexOf('}'); const o2 = JSON.parse(txt.slice(a, b + 1));
    const limpa = x => x && typeof x === 'object' ? {veredicto: String(x.veredicto || '').slice(0, 320), positivos: (x.positivos || []).slice(0, 4).map(y => String(y).slice(0, 280)), negativos: (x.negativos || []).slice(0, 4).map(y => String(y).slice(0, 280)), conselho: String(x.conselho || '').slice(0, 320)} : null;
    const res = {dia: limpa(o2.dia), semana: limpa(o2.semana), mes: limpa(o2.mes)};
    if (!res.dia && !res.semana && !res.mes) throw new Error('A IA respondeu num formato inválido.');
    ML.set('vigiaIA', {dia: chaveData(new Date()), ts: Date.now(), ass: assinaturaTotal(an), r: res});
  } catch(e){ toast(e.message || 'Não consegui a leitura da IA.', 4000); }
  vigiaPensa = false;
  if ($('#vigiaHero')) renderVigiaHero(false);
}

function corujaToque(el){
  const c = el.querySelector('.coruja'); if (!c) return;
  c.classList.remove('toque'); void c.getBoundingClientRect(); c.classList.add('toque');
  setTimeout(() => c.classList.remove('toque'), 1150);
  const p = el.closest('#vigiaHero') && document.querySelector('#vigiaHero .vh-veredicto');
  if (p){ const t = p.querySelector('.fantasma').textContent; setTimeout(() => falar(p, t, true), 450); }
}
