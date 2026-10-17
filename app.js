'use strict';
/* Mirante — aplicação: vistas, relato da semana, detalhe do dia, ligações e leitura do vigia (IA). */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let DADOS = null, semOff = 0, vista = 'vSemana', evoRange = ML.get('evoRange', 12), demoForcado = !!ML.get('demo', false);
let GRAFS = {}, animarHz = true, inicial = true, abrirRelatoNoInicio = /[?&]relato=1/.test(location.search), podeInstalar = null;

/* ---------- Formatação ---------- */
const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
const dUTC = n => new Date(n * DIA);
function rotSemana(ini){
  const a = dUTC(ini), b = dUTC(ini + 6), anoAtual = new Date().getFullYear();
  const ano = d => d.getUTCFullYear() !== anoAtual ? ' de ' + d.getUTCFullYear() : '';
  if (a.getUTCFullYear() !== b.getUTCFullYear()) return `${a.getUTCDate()} de ${MESES[a.getUTCMonth()]} de ${a.getUTCFullYear()} a ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]} de ${b.getUTCFullYear()}`;
  if (a.getUTCMonth() !== b.getUTCMonth()) return `${a.getUTCDate()} de ${MESES[a.getUTCMonth()]} a ${b.getUTCDate()} de ${MESES[b.getUTCMonth()]}${ano(b)}`;
  return `${a.getUTCDate()} a ${b.getUTCDate()} de ${MESES[a.getUTCMonth()]}${ano(b)}`;
}
const diaLongo = n => `${DIAS_SEM[(dUTC(n).getUTCDay() + 6) % 7]}, ${dUTC(n).getUTCDate()} de ${MESES[dUTC(n).getUTCMonth()]}`;
const hora = ts => new Date(ts).toLocaleTimeString('pt-PT', {hour: '2-digit', minute: '2-digit'});
const fmtHM = min => { min = Math.round(min); return min < 60 ? min + ' min' : Math.floor(min / 60) + ' h ' + String(min % 60).padStart(2, '0'); };
const fmtTon = kg => kg >= 1000 ? fmt1(kg / 1000) + ' t' : fmtInt(kg) + ' kg';
const mesAno = ts => { const d = new Date(ts); return `${MESES[d.getMonth()]}${d.getFullYear() !== new Date().getFullYear() ? ' de ' + d.getFullYear() : ''}`; };
function toast(txt, ms = 2600){ const t = $('#toast'); t.textContent = txt; t.classList.add('on'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('on'), ms); }

/* ---------- Ícones ---------- */
const SETA_E = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>';
const SETA_D = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>';
const X_ICO = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
const ESTRELA_ICO = '<svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 5.3 5.6.2-4.4 3.5 1.6 5.4L12 13.8l-4.7 3.1 1.6-5.4L4.5 8l5.6-.2z"/></svg>';
const GLIFO = {
  comida: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M2.5 19L8.5 9.5L12 14L15.5 7.5L21.5 19Z" fill="#26311f" stroke="${COR.comida}" stroke-width="1.6" stroke-linejoin="round"/></svg>`,
  treino: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><defs><radialGradient id="glB"><stop offset="0" stop-color="#FFE9C2"/><stop offset=".35" stop-color="#FFB766"/><stop offset=".7" stop-color="${COR.treino}"/><stop offset="1" stop-color="${COR.treino}" stop-opacity="0"/></radialGradient></defs><circle cx="12" cy="13" r="9" fill="url(#glB)"/><circle cx="9" cy="4.5" r="1" fill="#FF9A3C"/><circle cx="15" cy="3" r=".8" fill="#FF9A3C"/></svg>`,
  peso: `<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="${estrela(12, 12, 9)}" fill="${COR.peso}"/></svg>`,
  nota: `<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 3l7 9-7 9-7-9z" fill="none" stroke="${COR.ouro}" stroke-width="1.7" stroke-linejoin="round"/></svg>`
};
const setaDelta = v => v > 0 ? '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 13V3M4 7l4-4 4 4"/></svg>'
  : v < 0 ? '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 3v10M4 9l4 4 4-4"/></svg>'
  : '<svg viewBox="0 0 16 16" width="14" height="14" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M3 8h10"/></svg>';

/* ---------- Arranque ---------- */
async function iniciar(){
  try { EXDB = window.EXDB_EMBUTIDO || await (await fetch('exercicios.json')).json(); } catch(e){ EXDB = {}; }
  renderVista();
  await carregar();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
function montarDemo(){ return montar(gerarDemo(), null, null, {demo: true}); }
async function carregar(rede = true){
  if (demoForcado){ usarDados(montarDemo()); return; }
  await carregarDados((dados, final) => {
    const vazio = !dados.temGarfada && !dados.temForja;
    const aEsperar = Object.values(FONTES).some(f => f.estado === 'espera' || f.estado === 'a ler');
    if (vazio && !final && aEsperar){ DADOS = null; renderVista(); estadoTopo(); return; }
    usarDados(vazio ? Object.assign(montarDemo(), {demoAuto: true}) : dados);
  }, {rede});
}
function usarDados(dados){
  DADOS = dados;
  CACHE_SEM.clear();
  indexar(dados);
  if (inicial){
    inicial = false;
    // À segunda-feira a semana nova ainda está vazia: abre na que acabou de fechar.
    const h = hojeN(), A = semana(segundaDe(h) - 7);
    if (h === segundaDe(h) && (A.comida.tem || A.treino.sessoes)) semOff = -1;
  }
  estadoTopo(); aviso(); renderVista();
  if (abrirRelatoNoInicio){ abrirRelatoNoInicio = false; abrirRelato(); }
}
function primeiraSemana(){
  let min = chaveData(new Date());
  for (const r of D.refeicoes) if (r.data < min) min = r.data;
  for (const t of D.treinos){ const k = chaveData(new Date(t.inicio)); if (k < min) min = k; }
  for (const p of D.pesos) if (p.d < min) min = p.d;
  return segundaDe(numDe(min));
}

/* ---------- Topo e avisos ---------- */
function estadoTopo(){
  const el = $('#estado'), p = el.querySelector('.ponto'), t = el.querySelector('span');
  const F = Object.values(FONTES), aLer = F.some(f => f.estado === 'a ler'), erro = F.find(f => f.estado === 'erro'), ok = F.filter(f => f.estado === 'ok');
  let cls = '', txt = '';
  if (DADOS && DADOS.demo){ txt = 'Dados de exemplo'; }
  else if (aLer){ cls = 'pend'; txt = 'A atualizar…'; }
  else if (erro){ cls = 'erro'; txt = 'Erro no GitHub'; el.title = erro.erro; }
  else if (ok.length){ cls = 'ok'; txt = 'Atualizado às ' + hora(Math.max(...ok.map(f => f.quando))); el.title = 'Toca para atualizar'; }
  else if (F.some(f => f.estado === 'cache')){ txt = 'Dados guardados'; el.title = 'Sem rede: a mostrar a última leitura. Toca para tentar de novo.'; }
  else if (F.some(f => f.local)){ cls = 'ok'; txt = 'Dados deste dispositivo'; el.title = 'Toca para atualizar'; }
  else txt = '';
  p.className = 'ponto ' + cls; t.textContent = txt;
}
function aviso(){
  const el = $('#aviso');
  if (DADOS && DADOS.demoAuto) el.innerHTML = `<div><span><b>Estás a ver dados de exemplo.</b> Ainda não encontrei dados da Garfada nem da Forja.</span><button class="bt pri" data-acao="irLigacoes">Ligar as minhas apps</button></div>`;
  else if (DADOS && DADOS.demo) el.innerHTML = `<div><span><b>Modo de exemplo ligado.</b> Os números não são teus.</span><button class="bt" data-acao="sairDemo">Ver os meus dados</button></div>`;
  else { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
}

/* ---------- Vistas ---------- */
function renderVista(){
  limparDicas(); GRAFS = {};
  for (const v of ['vSemana', 'vEvolucao', 'vLigacoes']) $('#' + v).hidden = v !== vista;
  $$('nav.barra .tab[data-v]').forEach(b => b.classList.toggle('ativo', b.dataset.v === vista));
  if (!DADOS){ $('#' + vista).innerHTML = vista === 'vLigacoes' ? '' : '<div class="esqueleto"></div><div class="esqueleto" style="height:180px"></div>'; if (vista === 'vLigacoes') renderLigacoes(); return; }
  if (vista === 'vSemana') renderSemana(); else if (vista === 'vEvolucao') renderEvolucao(); else renderLigacoes();
}
function desenhar(raiz = document){
  raiz.querySelectorAll('[data-graf]').forEach(el => {
    const f = GRAFS[el.dataset.graf]; if (!f) return;
    const w = Math.floor(el.clientWidth);
    if (!w || (el._w === w && el.innerHTML)) return;
    el._w = w; el.innerHTML = f(w);
  });
}
function irPara(v){ if (vista === v && v !== 'vSemana'){ scrollTo({top: 0, behavior: 'smooth'}); return; } vista = v; renderVista(); scrollTo({top: 0}); }

/* ---------- Semana ---------- */
const EXPL = {
  comida: '<b>Comida</b><span>O score da Garfada: calorias perto da meta (40), proteína (20), registo completo (15), qualidade (15) e água (10).</span>',
  treino: '<b>Treino</b><span>Treinos feitos face ao objetivo semanal (50), grupos musculares trabalhados (25) e progressão das cargas (25).</span>',
  peso: '<b>Peso</b><span>Ritmo da tendência face ao objetivo: perder 0,2 a 1% do peso por semana, manter, ou ganhar 0,1 a 0,5%.</span>'
};
const TEND = '<b>Tendência</b><span>Suaviza as oscilações do dia a dia (água, sal, hora da pesagem). É ela que mostra se estás mesmo a perder ou a ganhar.</span>';
function renderSemana(){
  const h = hojeN(), ini = segundaDe(h) + semOff * 7, S = semana(ini), A = semana(ini - 7), min = primeiraSemana();
  const L = leituras(S, A).slice(0, 5), refs = S.dias.flatMap(d => d.refeicoes);
  $('#vSemana').innerHTML = `
  <div class="cab-semana">
    <button class="seta" data-acao="semAnt" ${ini <= min ? 'disabled' : ''} aria-label="Semana anterior">${SETA_E}</button>
    <div><h1>${rotSemana(ini)}</h1><p class="sub">${subSemana(S)}</p></div>
    <button class="seta" data-acao="semSeg" ${semOff >= 0 ? 'disabled' : ''} aria-label="Semana seguinte">${SETA_D}</button>
  </div>
  <div class="sem-grid">
    <section class="painel horiz-painel g-hz"><div class="graf-caixa" data-graf="hz"></div>
      <div class="legenda"><span>${GLIFO.peso.replace('width="22" height="22"', 'width="14" height="14"')}Peso, no céu</span><span>${GLIFO.comida.replace('width="22" height="22"', 'width="16" height="16"')}Calorias de cada dia</span><span><svg width="16" height="2" aria-hidden="true"><rect width="16" height="2" fill="${COR.ouro}"/></svg>Meta</span><span>${GLIFO.treino.replace('width="22" height="22"', 'width="16" height="16"')}Treino</span></div></section>
    <section class="painel nota-painel g-nota">${blocoNota(S, A)}</section>
    <div class="tres g-areas">${areaComida(S, A)}${areaTreino(S, A)}${areaPeso(S)}</div>
    <section class="painel g-leit"><h2>O que se destacou</h2>
      ${L.length ? `<ul class="leituras">${L.map(x => `<li><span class="glifo">${GLIFO[x.ic]}</span><p>${x.txt}</p></li>`).join('')}</ul>` : `<p class="nota-vazia">${S.futura ? 'Esta semana ainda não começou.' : 'Ainda há poucos dados nesta semana para tirar conclusões.'}</p>`}
      ${blocoVigia(S, A)}</section>
    ${D.temForja ? `<section class="painel g-musc">${blocoMusculos(S)}</section>` : ''}
    ${D.temForja ? `<section class="painel g-rec">${blocoRecordes(S)}</section>` : ''}
    ${refs.length ? `<section class="painel g-pratos"><div class="painel-topo"><h2>A semana em pratos</h2><span class="sub">${refs.length} ${refs.length === 1 ? 'refeição' : 'refeições'}</span></div><div class="pratos">${refs.map(tilePrato).join('')}</div></section>` : ''}
  </div>`;
  let anim = animarHz; animarHz = false;
  GRAFS.hz = w => { const svg = svgHorizonte(S, w, anim); anim = false; return svg; };
  desenhar($('#vSemana'));
}
function subSemana(S){
  if (S.emCurso){ const f = 7 - S.decorridos; return f ? `Semana em curso. ${f === 1 ? 'Falta 1 dia' : 'Faltam ' + f + ' dias'}.` : 'Último dia da semana.'; }
  const h = hojeN();
  if (semOff === -1) return h === segundaDe(h) ? 'Semana passada. A nova começou hoje.' : 'Semana passada.';
  return `Há ${-semOff} semanas.`;
}
function blocoNota(S, A){
  const n = S.nota;
  if (n.total == null) return `<h2>Nota da semana</h2><p class="sub" style="margin-top:6px">${S.futura ? 'A semana ainda não começou.' : 'Ainda sem dados suficientes para dar nota a esta semana.'}</p>`;
  const comps = [['comida', 'Comida'], ['treino', 'Treino'], ['peso', 'Peso']].filter(([k]) => n.c[k] != null);
  return `<div class="nota">
    <div class="nota-anel-caixa">${svgNota(n)}<div class="nota-num"><b>${n.total}</b><span>de 100</span></div></div>
    <div class="nota-txt"><h2>${n.faixa}</h2>
      <p class="sub">${n.provisoria ? 'Provisória: a semana ainda não fechou.' : A.nota.total != null ? `Na semana anterior, ${A.nota.total}.` : 'A nota desta semana.'}</p>
      <ul class="nota-comps">${comps.map(([k, nome]) => `<li data-dica="${dica(EXPL[k])}" tabindex="0"><i class="mk ${k}"></i><span>${nome}</span><b>${n.c[k]}${A.nota.c[k] != null && !n.provisoria ? `<small>antes ${A.nota.c[k]}</small>` : ''}</b></li>`).join('')}</ul></div></div>
    <button class="bt pri larg" data-acao="relato">${ESTRELA_ICO}Ver o relato da semana</button>`;
}
function barraMeta(nome, v, alvo, un, f = fmtInt){
  return `<div class="barra-m"><div class="lin"><span>${nome}</span><b>${f(v)} de ${f(alvo)} ${un}</b></div><div class="trilho"><i style="width:${clamp(v / alvo * 100, 2, 100)}%"></i></div></div>`;
}
const vazioArea = (mk, titulo, txt, bt) => `<section class="painel area"><div class="area-cab"><i class="mk ${mk}"></i><h2>${titulo}</h2></div><div class="vazio-area"><p>${txt}</p>${bt ? `<button class="bt" data-acao="irLigacoes">${bt}</button>` : ''}</div></section>`;
function areaComida(S, A){
  if (!D.temGarfada) return vazioArea('comida', 'Comida', 'Liga a Garfada para veres aqui o que comeste.', 'Ligar a Garfada');
  const c = S.comida, m = S.metas;
  if (!c.tem) return vazioArea('comida', 'Comida', S.futura ? 'A semana ainda não começou.' : 'Sem refeições completas registadas nesta semana.');
  const dk = A.comida.tem ? c.kcalMed - A.comida.kcalMed : null;
  return `<section class="painel area"><div class="area-cab"><i class="mk comida"></i><h2>Comida</h2></div>
    <div class="grande"><b>${fmtInt(c.kcalMed)}</b><small>kcal</small><span>por dia, em média, em ${c.diasReg} ${c.diasReg === 1 ? 'dia registado' : 'dias registados'}</span></div>
    <p class="contexto">Meta de ${fmtInt(m.kcal)}. <b>${c.naMeta} de ${c.diasReg}</b> ${c.diasReg === 1 ? 'dia' : 'dias'} perto dela.</p>
    ${barraMeta('Proteína', c.protMed, m.prot, 'g')}
    ${c.diasAgua ? barraMeta('Água', c.aguaMed / 1000, m.agua / 1000, 'L', fmt1) : ''}
    ${dk != null ? `<p class="delta">${setaDelta(dk)}<span><b>${sinal(dk)} kcal</b> por dia face à semana anterior</span></p>` : ''}</section>`;
}
function areaTreino(S, A){
  if (!D.temForja) return vazioArea('treino', 'Treino', 'Liga a Forja para veres aqui os teus treinos.', 'Ligar a Forja');
  const t = S.treino, n = Math.max(t.alvo, t.sessoes);
  const dv = A.treino.volume && t.volume ? (t.volume - A.treino.volume) / A.treino.volume * 100 : null;
  return `<section class="painel area"><div class="area-cab"><i class="mk treino"></i><h2>Treino</h2></div>
    <div class="grande"><b>${t.sessoes}</b><small>de ${t.alvo}</small><span>treinos${S.emCurso ? ' até agora' : ' na semana'}</span></div>
    <div class="brasas" aria-hidden="true">${Array.from({length: n}, (_, i) => `<i class="${i < t.sessoes ? 'on' : ''}"></i>`).join('')}</div>
    <dl class="numeros"><div><dt>Tempo</dt><dd>${fmtHM(t.minutos)}</dd></div><div><dt>Séries</dt><dd>${t.series}</dd></div><div><dt>Volume</dt><dd>${fmtTon(t.volume)}</dd></div></dl>
    ${dv != null && !S.emCurso ? `<p class="delta">${setaDelta(dv)}<span>Volume <b>${sinal(dv)}%</b> face à semana anterior</span></p>` : A.treino.sessoes || t.sessoes ? `<p class="delta">${setaDelta(t.sessoes - A.treino.sessoes)}<span>Na semana anterior, <b>${A.treino.sessoes}</b> ${A.treino.sessoes === 1 ? 'treino' : 'treinos'}</span></p>` : ''}</section>`;
}
function areaPeso(S){
  if (!D.pesos.length) return vazioArea('peso', 'Peso', 'Regista o peso na Garfada ou na Forja e a tendência aparece aqui.');
  const p = S.peso;
  if (p.tFim == null) return vazioArea('peso', 'Peso', 'Ainda sem pesagens até esta semana.');
  let caminho = '';
  if (p.objetivo){
    const ini = (D.gcfg && +D.gcfg.pesoInicio) || IDX.tend[0].kg, tot = ini - p.objetivo, feito = ini - p.tFim;
    if (Math.abs(tot) > .3){ const pct = clamp(feito / tot, 0, 1); caminho = `<div class="barra-m"><div class="lin"><span>Até aos ${fmt1(p.objetivo)} kg</span><b>${fmtInt(pct * 100)}% do caminho</b></div><div class="trilho"><i style="width:${Math.max(2, pct * 100)}%;background:var(--peso)"></i></div></div>`; }
  }
  return `<section class="painel area"><div class="area-cab"><i class="mk peso"></i><h2>Peso</h2></div>
    <div class="grande" data-dica="${dica(TEND)}"><b>${fmt1(p.tFim)}</b><small>kg</small><span>tendência ${S.emCurso ? 'de hoje' : 'no fim da semana'}</span></div>
    <p class="contexto">${p.delta != null ? `<b>${sinal(p.delta, fmt1)} kg</b> nesta semana. ` : ''}${p.ritmo != null ? `Ritmo de ${sinal(p.ritmo, fmt1)} kg por semana.` : 'Precisa de mais pesagens para calcular o ritmo.'}</p>
    ${caminho}
    ${p.semanasAteMeta && p.semanasAteMeta < 160 ? `<p class="contexto">Neste ritmo chegas lá por volta de <b>${mesAno(Date.now() + p.semanasAteMeta * 7 * DIA)}</b>.</p>` : ''}
    <p class="delta">${GLIFO.peso.replace('width="22" height="22"', 'width="14" height="14"')}<span><b>${p.pesagens.length}</b> ${p.pesagens.length === 1 ? 'pesagem' : 'pesagens'} nesta semana</span></p></section>`;
}
function blocoMusculos(S){
  const t = S.treino;
  if (!t.sessoes) return `<h2>Músculos da semana</h2><p class="nota-vazia">Sem treinos nesta semana.</p>`;
  const top = Object.entries(t.musc).filter(([, v]) => v >= 1).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return `<h2>Músculos da semana</h2><p class="sub">Séries por músculo: quanto mais quente o metal, mais trabalho levou.</p>
    ${svgCorpo(t.musc)}
    <div class="escala" aria-hidden="true"><span>0</span>${CORPO_CORES.map(([a, b]) => `<i style="background:linear-gradient(${a},${b})"></i>`).join('')}<span>16 ou mais séries</span></div>
    <ul class="top-musc">${top.map(([k, v]) => `<li><span>${MUSC[k] || k}</span><b>${fmtInt(v)} ${Math.round(v) === 1 ? 'série' : 'séries'}</b></li>`).join('')}</ul>`;
}
function blocoRecordes(S){
  const R = S.treino.recordes;
  if (!R.length) return `<h2>Recordes</h2><p class="nota-vazia">Nenhum recorde nesta semana.${S.treino.melhorou ? ` Mas melhoraste em ${S.treino.melhorou} ${S.treino.melhorou === 1 ? 'exercício' : 'exercícios'} face à última vez.` : ''}</p>`;
  return `<h2>Recordes</h2><ul class="recordes">${R.slice(0, 6).map(r => `<li><span class="nm">${esc(r.nome)}</span><span class="vl">${r.comPeso ? `${fmtKg(r.serie.kg)} kg × ${r.serie.reps}` : fmtInt(r.v) + ' reps'}</span>
    <span class="det">${r.comPeso ? `Força máxima estimada: ${fmtKg(r.v)} kg (antes ${fmtKg(r.ant)})` : `Antes: ${fmtInt(r.ant)} reps numa série`}</span><span class="ganho">${sinal((r.v - r.ant) / r.ant * 100)}%</span></li>`).join('')}</ul>`;
}
function tilePrato(r){
  const n = numDe(r.data), cor = `hsl(${[...r.prato].reduce((a, c) => a + c.charCodeAt(0), 0) % 360} 20% 22%)`;
  const html = `<b>${esc(r.prato)}</b><span>${DIAS_SEM[(dUTC(n).getUTCDay() + 6) % 7]} às ${hora(r.ts)}, ${fmtInt(r.kcal)} kcal</span>`;
  return `<button class="prato" data-acao="dia" data-v="${r.data}" data-dica="${dica(html)}" aria-label="${esc(r.prato)}"${r.thumb ? '' : ` style="background:${cor}"`}>${r.thumb ? `<img src="${r.thumb}" alt="" loading="lazy">` : `<span>${esc(r.prato.charAt(0).toUpperCase())}</span>`}</button>`;
}

/* ---------- Leitura do vigia (IA) ---------- */
const chaveVigia = S => 'S' + S.ini;
function assinaturaIA(S, A){ const s = JSON.stringify(resumoParaIA(S, A)); let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return h; }
function vigiaGuardado(S){ return (ML.get('vigia', {}) || {})[chaveVigia(S)] || null; }
function htmlVigia(r){ return `<p class="veredicto">${esc(r.veredicto)}</p>${(r.destaques || []).length ? `<ul>${r.destaques.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}`; }
function blocoVigia(S, A){
  if (S.futura || S.nota.total == null) return '';
  const g = vigiaGuardado(S);
  const cab = `<h3>${GLIFO.nota}Leitura do vigia</h3>`;
  if (!D.ia.chave) return `<div class="vigia">${cab}<p class="sub" style="margin-top:6px">A IA lê os números da semana e diz-te o que mais importa. Usa a chave do Gemini da Garfada ou da Forja.</p><button class="bt" data-acao="irLigacoes">Configurar a IA</button></div>`;
  if (g) return `<div class="vigia">${cab}${htmlVigia(g.r)}${g.ass !== assinaturaIA(S, A) ? '<button class="bt" data-acao="vigia">Atualizar a leitura</button>' : ''}</div>`;
  return `<div class="vigia">${cab}<p class="sub" style="margin-top:6px">A IA lê os números da semana e diz-te o que mais importa.</p><button class="bt" data-acao="vigia">Pedir a leitura</button></div>`;
}
async function pedirVigia(S, A){
  const prompt = `És o vigia do Mirante, uma app que junta a alimentação (registada na Garfada) e os treinos de ginásio em casa (registados na Forja) de uma pessoa, para ela ver o progresso da semana.
Escreve em português de Portugal (PT-PT), com tom direto e caloroso de treinador experiente, sem exageros, sem emojis e sem termos em inglês.
Analisa a semana com base nestes dados e responde só com JSON no formato {"veredicto": "uma frase curta que resume a semana", "destaques": ["2 a 3 frases curtas, com números concretos, sobre o que correu bem e o que correu pior, cruzando comida, treino e peso quando fizer sentido"], "focos": ["exatamente 3 ações concretas e específicas para a próxima semana"]}.
Regras: não inventes dados que não estão aqui; se a semana estiver em curso, fala do que já aconteceu; não dês conselhos médicos.
Dados: ${JSON.stringify(resumoParaIA(S, A))}`;
  const modelo = String(D.ia.modelo || 'gemini-flash-latest').replace(/^models\//, '');
  let r;
  try {
    r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(modelo)}:generateContent`, {
      method: 'POST', headers: {'Content-Type': 'application/json', 'x-goog-api-key': D.ia.chave},
      body: JSON.stringify({contents: [{role: 'user', parts: [{text: prompt}]}], generationConfig: {temperature: 0.4, responseMimeType: 'application/json'}})
    });
  } catch(e){ throw new Error('Sem ligação à internet.'); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok){
    const msg = (j.error && j.error.message) || '';
    if (r.status === 429) throw new Error('Limite gratuito do Gemini atingido. Tenta mais tarde.');
    if (r.status === 401 || r.status === 403 || /api key/i.test(msg)) throw new Error('Chave do Gemini inválida. Verifica em Ligações.');
    if (r.status === 404) throw new Error('Modelo do Gemini não encontrado.');
    throw new Error('Erro do Gemini: ' + (msg || r.status));
  }
  const txt = ((j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts) || []).filter(p => !p.thought).map(p => p.text || '').join('');
  const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
  let o; try { o = JSON.parse(txt.slice(a, b + 1)); } catch(e){ throw new Error('A IA respondeu num formato inválido. Tenta outra vez.'); }
  const res = {veredicto: String(o.veredicto || '').slice(0, 300), destaques: (o.destaques || []).slice(0, 3).map(x => String(x).slice(0, 300)), focos: (o.focos || []).slice(0, 3).map(x => String(x).slice(0, 300))};
  if (!res.veredicto) throw new Error('A IA não devolveu uma leitura. Tenta outra vez.');
  const todos = ML.get('vigia', {}) || {};
  todos[chaveVigia(S)] = {ts: Date.now(), ass: assinaturaIA(S, A), r: res};
  const chaves = Object.keys(todos).sort().slice(-20), limpo = {}; for (const k of chaves) limpo[k] = todos[k];
  ML.set('vigia', limpo);
  return res;
}

/* ---------- Evolução ---------- */
const RANGES = [[8, '8 semanas'], [12, '3 meses'], [26, '6 meses'], [52, '1 ano']];
function renderEvolucao(){
  const h = hojeN(), seg = segundaDe(h), min = primeiraSemana();
  const inis = Array.from({length: evoRange}, (_, i) => seg - (evoRange - 1 - i) * 7).filter(x => x >= min);
  const SS = inis.map(semana), rot = ini => dataCurta(ini);
  const dicaSem = (S, linhas) => `<b>Semana de ${rotSemana(S.ini)}</b>${linhas}`;
  const tend = IDX.tend.filter(p => p.n >= inis[0]);
  const tAgora = tendEm(h), tIni = tend[0], ritmo = ritmoPeso(h), gasto = gastoReal(h - 1);
  const obj = (D.gcfg && +D.gcfg.pesoMeta) || (D.fcfg && +D.fcfg.meta) || 0;
  // Força: exercícios com carga mais feitos no período
  const desde = new Date(chaveDe(inis[0]) + 'T00:00:00').getTime(), cont = new Map();
  for (const [id, lista] of IDX.hist){ const l = lista.filter(x => x.ts >= desde && x.comPeso); if (l.length >= 2) cont.set(id, l); }
  const forca = [...cont.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 5);
  $('#vEvolucao').innerHTML = `
  <div class="cab-vista"><h1>Evolução</h1><p class="sub">${inis.length > 1 ? `De ${dUTC(inis[0]).getUTCDate()} de ${MESES[dUTC(inis[0]).getUTCMonth()]}${dUTC(inis[0]).getUTCFullYear() !== new Date().getFullYear() ? ' de ' + dUTC(inis[0]).getUTCFullYear() : ''} até hoje, semana a semana.` : 'A primeira semana de dados.'}</p>
    <div class="chips" role="group" aria-label="Período">${RANGES.map(([v, t]) => `<button class="chip ${v === evoRange ? 'sel' : ''}" data-acao="range" data-v="${v}" aria-pressed="${v === evoRange}">${t}</button>`).join('')}</div></div>
  <div class="evo-grid">
    <section class="painel largo"><h2>Nota por semana</h2><p class="sub">A barra mais clara é a semana em curso.</p><div class="graf-caixa" data-graf="nota"></div></section>
    <section class="painel largo"><h2>Peso</h2>
      ${tend.length >= 2 ? `<dl class="stats">
        <div data-dica="${dica(TEND)}"><dt>Tendência atual</dt><dd>${fmt1(tAgora.t)} <small>kg</small></dd></div>
        <div><dt>No período</dt><dd>${sinal(tAgora.t - tIni.t, fmt1)} <small>kg</small></dd></div>
        <div><dt>Ritmo atual</dt><dd>${ritmo != null ? sinal(ritmo, fmt1) + ' <small>kg/sem.</small>' : '—'}</dd></div>
        <div data-dica="${dica('<b>Gasto real estimado</b><span>A média do que comeste nos últimos 28 dias, corrigida pela energia que a tendência do peso mostra que ganhaste ou perdeste (7700 kcal por kg).</span>')}"><dt>Gasto real</dt><dd>${gasto ? fmtInt(gasto.kcal) + ' <small>kcal/dia</small>' : '—'}</dd></div>
      </dl><div class="graf-caixa" data-graf="peso"></div>` : `<p class="nota-vazia">Precisa de pelo menos duas pesagens neste período.</p>`}</section>
    ${D.temGarfada ? `<section class="painel"><h2>Calorias por dia</h2><p class="sub">Média de cada semana, nos dias registados</p><div class="graf-caixa" data-graf="kcal"></div></section>
    <section class="painel"><h2>Proteína por dia</h2><p class="sub">Média de cada semana, em gramas</p><div class="graf-caixa" data-graf="prot"></div></section>` : ''}
    ${D.temForja ? `<section class="painel"><h2>Treinos por semana</h2><p class="sub">A linha dourada é o teu objetivo semanal</p><div class="graf-caixa" data-graf="sess"></div></section>
    <section class="painel"><h2>Volume de treino</h2><p class="sub">Peso vezes repetições, somado na semana</p><div class="graf-caixa" data-graf="vol"></div></section>` : ''}
    <section class="painel largo"><h2>Constância</h2><p class="sub">Cada quadrado é um dia. Quanto mais verde, mais perto da meta ficaste; a brasa marca os treinos.</p>
      <div class="rola" data-graf="cal"></div>
      <div class="lev-legenda"><span><i class="q" style="background:${RAMPA[0]}"></i>Sem registo</span><span><i class="q" style="background:${RAMPA[1]}"></i>Longe da meta</span><span><i class="q" style="background:${RAMPA[2]}"></i>A 20%</span><span><i class="q" style="background:${RAMPA[3]}"></i>A 10%</span><span><i class="q" style="background:${RAMPA[4]}"></i>Na meta e com proteína</span><span><i class="mk treino"></i>Treino</span></div></section>
    ${D.temForja ? `<section class="painel largo"><h2>Força</h2><p class="sub">Força máxima estimada nos exercícios que mais fazes, treino a treino.</p>
      ${forca.length ? `<ul class="forca">${forca.map(([id, l]) => { const v = l.map(x => x.v), d = (v[v.length - 1] - v[0]) / v[0] * 100;
        return `<li><div><div class="nm">${esc(nomeEx(id))}</div><div class="det"><b>${fmt1(v[v.length - 1])} kg</b>, ${sinal(d)}% em ${l.length} treinos</div></div><div data-mini="${id}"></div></li>`; }).join('')}</ul>` : '<p class="nota-vazia">Ainda poucos treinos com carga neste período.</p>'}</section>` : ''}
  </div>`;
  const it = (f, extra) => SS.map(S => Object.assign({rot: rot(S.ini), atual: S.emCurso}, f(S)));
  GRAFS.nota = w => svgBarras(it(S => ({v: S.nota.total || 0, cor: COR.ouro, dica: dicaSem(S, S.nota.total != null ? `<span><i class="mk nota"></i>Nota ${S.nota.total}, ${S.nota.faixa.toLowerCase()}${S.emCurso ? ' (provisória)' : ''}</span>` : '<span>Sem dados</span>')})), w, 170, {cor: COR.ouro, max: 100, titulo: 'Nota por semana'});
  if (tend.length >= 2) GRAFS.peso = w => svgPeso(tend, w, 230, obj);
  GRAFS.kcal = w => svgBarras(it(S => ({v: S.comida.kcalMed, dica: dicaSem(S, S.comida.tem ? `<span><i class="mk comida"></i>${fmtInt(S.comida.kcalMed)} kcal por dia, ${S.comida.diasReg} dias registados</span>` : '<span>Sem registo</span>')})), w, 190, {cor: COR.comida, meta: IDX.metas.kcal, rotMeta: `meta ${fmtInt(IDX.metas.kcal)}`, titulo: 'Calorias por dia'});
  GRAFS.prot = w => svgBarras(it(S => ({v: S.comida.protMed, dica: dicaSem(S, S.comida.tem ? `<span><i class="mk comida"></i>${fmtInt(S.comida.protMed)} g por dia</span>` : '<span>Sem registo</span>')})), w, 190, {cor: COR.comida, meta: IDX.metas.prot, rotMeta: `meta ${IDX.metas.prot} g`, fmt: v => fmtInt(v) + ' g', titulo: 'Proteína por dia'});
  GRAFS.sess = w => svgBarras(it(S => ({v: S.treino.sessoes, dica: dicaSem(S, `<span><i class="mk treino"></i>${S.treino.sessoes} ${S.treino.sessoes === 1 ? 'treino' : 'treinos'}, ${fmtHM(S.treino.minutos)}</span>`)})), w, 190, {cor: COR.treino, meta: (D.fcfg && +D.fcfg.dias) || 3, rotMeta: 'objetivo', max: 5, titulo: 'Treinos por semana'});
  GRAFS.vol = w => svgBarras(it(S => ({v: S.treino.volume / 1000, dica: dicaSem(S, `<span><i class="mk treino"></i>${fmtTon(S.treino.volume)}, ${S.treino.series} séries</span>`)})), w, 190, {cor: COR.treino, fmt: v => fmt1(v) + ' t', fmtEixo: v => fmtInt(v) + ' t', titulo: 'Volume por semana'});
  GRAFS.cal = w => svgCalendario(inis[0], inis.length, w);
  desenhar($('#vEvolucao'));
  const caixa = $('#vEvolucao .rola'); if (caixa) caixa.scrollLeft = caixa.scrollWidth;
  $$('#vEvolucao [data-mini]').forEach(el => { const l = cont.get(el.dataset.mini); if (l) el.innerHTML = svgMini(l.map(x => x.v), 96, 40, COR.treino); });
}

/* ---------- Ligações ---------- */
function origemChave(){
  const mc = ML.get('cfg', {}) || {}, gc = LS.get('cfg', {}) || {}, fc = LS.get('forja.cfg', {}) || {};
  return mc.chave ? 'mirante' : (pareceCfgGarfada(gc) && gc.chave) ? 'garfada' : (fc && fc.chave) ? 'forja' : '';
}
function linhaFonte(cls, html){ return `<li><i class="ponto ${cls}"></i><span>${html}</span></li>`; }
function blocoFonte(app){
  const F = FONTES[app] || {}, nome = NOME_APP[app], c = credenciais()[app], own = ((ML.get('fontes', {}) || {})[app]) || {};
  const local = F.local ? linhaFonte('ok', `<b>Neste dispositivo:</b> ${F.local.rotulo}.`) : linhaFonte('', `<b>Neste dispositivo:</b> nada encontrado. Se usas a ${nome} neste navegador, abre-a uma vez e volta aqui.`);
  let gh;
  if (!c) gh = linhaFonte('', `<b>GitHub:</b> sem ligação. Os registos feitos noutros dispositivos não aparecem.`);
  else {
    const onde = `${esc(c.dono)}/${esc(c.repo)}`, de = c.origem === 'app' ? `, com a ligação da ${nome}` : '';
    gh = F.estado === 'ok' ? linhaFonte('ok', `<b>GitHub:</b> ${onde}${de}. Lido às ${hora(F.quando)}.`)
      : F.estado === 'erro' ? linhaFonte('erro', `<b>GitHub:</b> ${onde}. ${esc(F.erro)}`)
      : F.estado === 'a ler' ? linhaFonte('pend', `<b>GitHub:</b> ${onde}. A ler…`)
      : linhaFonte('pend', `<b>GitHub:</b> ${onde}${de}.${F.quando ? ' Última leitura às ' + hora(F.quando) + '.' : ''}`);
  }
  const sug = app === 'garfada' ? 'garfada-dados' : 'forja-dados';
  return `<section class="painel"><h2>${nome}</h2><ul class="fonte-linhas">${local}${gh}</ul>
    <details class="mais"${own.token ? ' open' : ''}><summary>${own.token ? 'Ligação própria do Mirante' : 'Ligar a um repositório GitHub'}</summary>
      <div class="form" data-fonte="${app}">
        <p class="sub">Usa um token "fine-grained" com permissão <b>Contents: Read-only</b> no repositório de dados da ${nome}. Fica guardado só neste dispositivo. ${c && c.origem === 'app' ? `Neste dispositivo já estou a usar a ligação da ${nome}; só precisas disto noutro dispositivo.` : ''}</p>
        <label class="campo">Utilizador GitHub<input name="dono" value="${esc(own.dono || (c && c.dono) || '')}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="danielgog7"></label>
        <label class="campo">Repositório<input name="repo" value="${esc(own.repo || (c && c.repo) || '')}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${sug}"></label>
        <label class="campo">Token<input name="token" type="password" value="${esc(own.token || '')}" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></label>
        <div class="linha-bt"><button class="bt pri" data-acao="guardarFonte" data-v="${app}">Guardar e ler</button>${own.token ? `<button class="bt" data-acao="esquecerFonte" data-v="${app}">Esquecer esta ligação</button>` : ''}</div>
      </div></details></section>`;
}
function renderLigacoes(){
  const oc = origemChave(), mc = ML.get('cfg', {}) || {};
  $('#vLigacoes').innerHTML = `
  <div class="cab-vista"><h1>Ligações</h1><p class="sub">O Mirante só lê. Nunca altera nada na Garfada nem na Forja.</p></div>
  ${blocoFonte('garfada')}${blocoFonte('forja')}
  <section class="painel"><h2>Leitura do vigia</h2>
    <ul class="fonte-linhas">${oc ? linhaFonte('ok', oc === 'mirante' ? '<b>Chave do Gemini:</b> a tua, guardada no Mirante.' : `<b>Chave do Gemini:</b> a mesma da ${NOME_APP[oc]}.`) : linhaFonte('', '<b>Chave do Gemini:</b> não encontrada neste dispositivo.')}</ul>
    <details class="mais"${mc.chave ? ' open' : ''}><summary>${mc.chave ? 'Chave própria do Mirante' : 'Usar outra chave'}</summary>
      <div class="form"><p class="sub">Cria uma chave gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>. Fica guardada só neste dispositivo.</p>
        <label class="campo">Chave do Gemini<input id="chaveIA" type="password" value="${esc(mc.chave || '')}" autocomplete="off" spellcheck="false"></label>
        <div class="linha-bt"><button class="bt pri" data-acao="guardarChave">Guardar</button>${mc.chave ? '<button class="bt" data-acao="esquecerChave">Esquecer</button>' : ''}</div></div></details></section>
  <section class="painel"><label class="interruptor"><span><h2>Dados de exemplo</h2><span class="sub">Mostra 12 semanas inventadas, para veres como fica.</span></span><input type="checkbox" data-acao="demo" ${demoForcado ? 'checked' : ''} aria-label="Mostrar dados de exemplo"></label></section>
  <section class="painel"><h2>Manutenção</h2><p class="sub" style="margin:4px 0 12px">A cache guarda o que veio do GitHub para abrir depressa e sem rede.</p>
    <div class="linha-bt"><button class="bt" data-acao="atualizar">Atualizar agora</button><button class="bt" data-acao="limparCache">Limpar a cache</button>${podeInstalar ? '<button class="bt pri" data-acao="instalar">Instalar o Mirante</button>' : ''}</div></section>
  <p class="pe">Como funciona: a Garfada, a Forja e o Mirante vivem no mesmo endereço, por isso o Mirante lê diretamente o que cada app guardou neste navegador. Para juntar os dados de outros dispositivos, lê os repositórios privados onde cada app sincroniza. Junta tudo com as mesmas regras das apps: fica sempre a versão mais recente de cada registo.</p>`;
}

/* ---------- Detalhe do dia ---------- */
function resumoSeries(ss){
  const kg = v => fmt1(v).replace(',0', '');
  if (ss.every(s => s.kg === ss[0].kg)){
    const reps = ss.every(s => s.reps === ss[0].reps) ? `${ss.length} × ${ss[0].reps}` : ss.map(s => s.reps).join(', ');
    return ss[0].kg ? `${kg(ss[0].kg)} kg: ${reps}` : `${reps} reps`;
  }
  return ss.map(s => s.kg ? `${kg(s.kg)}×${s.reps}` : s.reps).join(', ');
}
function abrirDia(k){
  esconderDica();
  const n = numDe(k), c = IDX.dias.get(k), tr = IDX.treinosDia.get(k) || [], peso = IDX.peso.get(k), agua = D.agua[k], m = IDX.metas;
  const REF = {peq: 'Pequeno-almoço', alm: 'Almoço', lan: 'Lanche', jan: 'Jantar', out: 'Outra'};
  $('#folha').innerHTML = `<div class="folha-c"><div class="pega"></div>
    <div class="folha-cab"><div><h2 style="font-size:22px">${diaLongo(n)}</h2><p class="sub">${[c ? `${c.n} ${c.n === 1 ? 'refeição' : 'refeições'}` : 'Sem refeições', tr.length ? `${tr.length} ${tr.length === 1 ? 'treino' : 'treinos'}` : '', peso != null ? fmt1(peso) + ' kg' : ''].filter(Boolean).join(', ')}</p></div><button class="ic" data-acao="fecharFolha" aria-label="Fechar">${X_ICO}</button></div>
    ${c ? `<dl class="macros"><div><dt>Calorias</dt><dd>${fmtInt(c.kcal)} <small>de ${fmtInt(m.kcal)}</small></dd></div><div><dt>Proteína</dt><dd>${fmtInt(c.prot)} <small>g</small></dd></div><div><dt>Hidratos</dt><dd>${fmtInt(c.hid)} <small>g</small></dd></div><div><dt>Gordura</dt><dd>${fmtInt(c.gord)} <small>g</small></dd></div></dl>
      <ul class="refeicoes">${c.refeicoes.map(r => `<li><span class="th">${r.thumb ? `<img src="${r.thumb}" alt="">` : esc(r.prato.charAt(0).toUpperCase())}</span><span><span class="nm">${esc(r.prato)}</span><br><span class="hr">${REF[r.ref] || 'Refeição'}, ${hora(r.ts)}</span></span><span class="kc">${fmtInt(r.kcal)} kcal</span></li>`).join('')}</ul>` : ''}
    ${agua ? `<p class="sub" style="margin-top:10px">Água: <b style="color:var(--luar)">${fmt1(agua / 1000)} L</b> de ${fmt1(m.agua / 1000)} L.</p>` : ''}
    ${tr.map(t => `<div class="sessao"><h3>${esc(t.nome || 'Treino')}<span>${hora(t.inicio)}, ${fmtHM((t.fim - t.inicio) / 60000)}</span></h3>
      <ul>${t.itens.filter(it => it.series.length).map(it => `<li><span>${esc(nomeEx(it.id))}${it.fase ? ' <span style="color:var(--bruma)">(' + esc(it.fase) + ')</span>' : ''}</span><b>${resumoSeries(it.series)}</b></li>`).join('')}</ul></div>`).join('')}
    ${!c && !tr.length && peso == null ? '<p class="nota-vazia">Nada registado neste dia.</p>' : ''}
  </div>`;
  abrirOverlay('folha');
}

/* ---------- Overlays e botão de voltar ---------- */
const PILHA = [];
function abrirOverlay(id){
  const el = $('#' + id);
  if (!PILHA.includes(id)){ PILHA.push(id); history.pushState({ov: id}, ''); }
  el.hidden = false; document.body.style.overflow = 'hidden';
}
function fecharOverlay(id, viaHistoria){
  const i = PILHA.indexOf(id); if (i < 0) return;
  PILHA.splice(i, 1); $('#' + id).hidden = true; if (id === 'folha') $('#folha').classList.remove('por-cima');
  if (id === 'relato') pararRelato();
  if (!PILHA.length) document.body.style.overflow = '';
  if (!viaHistoria) history.back();
}
addEventListener('popstate', () => { const id = PILHA[PILHA.length - 1]; if (id) fecharOverlay(id, true); });

/* ---------- Relato ---------- */
let RL = null;
const FUNDOS = {
  abre: ['#10152a', 'rgba(122,162,245,.22)'], nota: ['#16182a', 'rgba(201,168,106,.2)'], comida: ['#10180f', 'rgba(154,199,75,.22)'],
  treino: ['#1b110c', 'rgba(238,106,34,.26)'], peso: ['#0f1629', 'rgba(122,162,245,.26)'], cruz: ['#131726', 'rgba(162,168,183,.14)'], fim: ['#14162a', 'rgba(201,168,106,.18)']
};
function cartasRelato(S, A){
  const C = [], m = S.metas, n = S.nota, c = S.comida, t = S.treino, p = S.peso;
  const ola = `${D.nome ? esc(D.nome) + ', eis' : 'Eis'} como ${S.emCurso ? 'está a correr' : 'correu'} a tua semana.`;
  C.push({f: 'abre', html: `<p class="rl-sup">O relato da semana</p><h1>${rotSemana(S.ini)}</h1><div class="rl-hz" data-graf="rlhz"></div><p class="rl-txt">${ola}</p>`});
  if (n.total != null) C.push({f: 'nota', html: `<p class="rl-sup">A nota da semana${n.provisoria ? ', provisória' : ''}</p><div class="rl-big" data-conta="${n.total}">0</div><h2>${n.faixa}</h2>
    <ul class="rl-linhas">${[['comida', 'Comida'], ['treino', 'Treino'], ['peso', 'Peso']].filter(([k]) => n.c[k] != null).map(([k, nome]) => `<li><span><i class="mk ${k}" style="margin-right:9px"></i>${nome}</span><b>${n.c[k]}${A.nota.c[k] != null ? `<small>antes ${A.nota.c[k]}</small>` : ''}</b></li>`).join('')}</ul>`});
  if (c.tem) C.push({f: 'comida', html: `<p class="rl-sup">Comida</p><div class="rl-big">${fmtInt(c.kcalMed)}<small>kcal</small></div>
    <p class="rl-txt">por dia, em média. A meta era <b>${fmtInt(m.kcal)}</b> e ficaste perto dela em <b>${c.naMeta} de ${c.diasReg}</b> ${c.diasReg === 1 ? 'dia' : 'dias'}.</p>
    <ul class="rl-linhas"><li>Proteína<b>${fmtInt(c.protMed)} g<small>meta ${m.prot} g</small></b></li><li>Dias registados<b>${c.diasReg}<small>de ${c.fechados}</small></b></li>${c.melhorDia ? `<li>Melhor dia<b>${DIAS_SEM[c.melhorDia.i]}</b></li>` : ''}${c.diasAgua ? `<li>Água<b>${fmt1(c.aguaMed / 1000)} L<small>meta ${fmt1(m.agua / 1000)} L</small></b></li>` : ''}</ul>`});
  const refs = S.dias.flatMap(d => d.refeicoes);
  if (refs.length >= 4){
    const cont = {}; for (const r of refs) cont[r.prato] = (cont[r.prato] || 0) + 1;
    const [topo, vezes] = Object.entries(cont).sort((a, b) => b[1] - a[1])[0];
    C.push({f: 'comida', html: `<p class="rl-sup">A semana em pratos</p><h2>${refs.length} refeições</h2><div class="rl-mosaico">${refs.slice(0, 35).map(tilePrato).join('')}</div>
      <p class="rl-txt">${vezes > 1 ? `O prato da semana: <b>${esc(topo)}</b>, ${vezes} vezes.` : 'Nenhum prato se repetiu. Variedade não faltou.'}</p>`});
  }
  if (D.temForja){
    const carros = Math.floor(t.volume / 1200);
    C.push({f: 'treino', html: `<p class="rl-sup">Treino</p><div class="rl-big">${t.sessoes}<small>de ${t.alvo}</small></div><p class="rl-txt">${t.sessoes === 1 ? 'treino feito' : 'treinos feitos'}${S.emCurso ? ' até agora' : ''}.</p>
      <div class="rl-brasas">${Array.from({length: Math.max(t.alvo, t.sessoes)}, (_, i) => `<i class="${i < t.sessoes ? 'on' : ''}"></i>`).join('')}</div>
      ${t.sessoes ? `<ul class="rl-linhas"><li>Tempo a treinar<b>${fmtHM(t.minutos)}</b></li><li>Séries<b>${t.series}</b></li><li>Volume<b>${fmtTon(t.volume)}</b></li></ul>
      ${carros >= 1 ? `<p class="rl-txt">Levantaste, no total, o peso de <b>${carros} ${carros === 1 ? 'carro pequeno' : 'carros pequenos'}</b>.</p>` : ''}` : ''}`});
    if (t.sessoes){
      const top = Object.entries(t.musc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${(MUSC[k] || k).toLowerCase()} (${fmtInt(v)})`);
      const esq = GRUPOS.filter(([g]) => !t.grupos[g]).map(([g]) => g.toLowerCase());
      C.push({f: 'treino', html: `<p class="rl-sup">Músculos</p><h2>Onde o metal aqueceu</h2>${svgCorpo(t.musc)}<p class="rl-txt">Mais trabalhados: <b>${top.join(', ')}</b>.${esq.length && esq.length < 6 ? ` Ficaram de fora: ${esq.join(', ')}.` : ''}</p>`});
    }
    if (t.recordes.length) C.push({f: 'treino', html: `<p class="rl-sup">Recordes</p><div class="rl-big">${t.recordes.length}</div><h2>${t.recordes.length === 1 ? 'recorde batido' : 'recordes batidos'}</h2>
      <ul class="rl-linhas">${t.recordes.slice(0, 4).map(r => `<li>${esc(r.nome)}<b>${r.comPeso ? `${fmtKg(r.serie.kg)} kg × ${r.serie.reps}` : fmtInt(r.v) + ' reps'}<small>${sinal((r.v - r.ant) / r.ant * 100)}%</small></b></li>`).join('')}</ul>`});
  }
  if (p.tFim != null && (p.delta != null || p.pesagens.length)){
    C.push({f: 'peso', html: `<p class="rl-sup">Peso</p><div class="rl-big">${p.delta != null ? sinal(p.delta, fmt1) : fmt1(p.tFim)}<small>kg</small></div>
      <p class="rl-txt">${p.delta != null ? `Na tendência, de <b>${fmt1(p.tIni)}</b> para <b>${fmt1(p.tFim)} kg</b>.` : `Tendência em <b>${fmt1(p.tFim)} kg</b>.`} ${p.ritmo != null ? `O ritmo atual é de <b>${sinal(p.ritmo, fmt1)} kg por semana</b>.` : ''}</p>
      ${p.semanasAteMeta && p.semanasAteMeta < 160 ? `<p class="rl-txt">Se continuares assim, chegas aos <b>${fmt1(p.objetivo)} kg</b> por volta de <b>${mesAno(Date.now() + p.semanasAteMeta * 7 * DIA)}</b>.</p>` : ''}
      <ul class="rl-linhas"><li>Pesagens<b>${p.pesagens.length}</b></li></ul>`});
  }
  const L = leituras(S, A).slice(0, 3);
  if (L.length) C.push({f: 'cruz', html: `<p class="rl-sup">O que os números dizem juntos</p><h2>Comida, treino e peso, lado a lado</h2><ul class="leituras" style="margin-top:14px">${L.map(x => `<li><span class="glifo">${GLIFO[x.ic]}</span><p style="font-size:16px">${x.txt}</p></li>`).join('')}</ul>`});
  if (A.nota.total != null && !S.emCurso){
    const lin = [['Nota', A.nota.total, n.total, v => v], ['Calorias por dia', A.comida.tem ? A.comida.kcalMed : null, c.tem ? c.kcalMed : null, fmtInt], ['Proteína por dia', A.comida.tem ? A.comida.protMed : null, c.tem ? c.protMed : null, v => fmtInt(v) + ' g'],
      ['Treinos', D.temForja ? A.treino.sessoes : null, D.temForja ? t.sessoes : null, v => v], ['Volume', D.temForja ? A.treino.volume : null, D.temForja ? t.volume : null, fmtTon], ['Peso (tendência)', A.peso.tFim, p.tFim, v => fmt1(v) + ' kg']].filter(x => x[1] != null && x[2] != null);
    if (lin.length >= 2) C.push({f: 'cruz', html: `<p class="rl-sup">Face à semana anterior</p><h2>O que mudou</h2><ul class="rl-linhas">${lin.map(([nm, a, b, f]) => `<li>${nm}<b>${f(b)}<small>antes ${f(a)}</small></b></li>`).join('')}</ul>`});
  }
  const g = vigiaGuardado(S);
  if (D.ia.chave && n.total != null) C.push({f: 'nota', vigia: true, html: `<p class="rl-sup">Leitura do vigia</p>${g ? `<h2 class="veredicto" style="font-style:italic">${esc(g.r.veredicto)}</h2><ul class="rl-linhas">${(g.r.destaques || []).map(x => `<li style="display:block;line-height:1.5">${esc(x)}</li>`).join('')}</ul>`
    : `<h2>A IA lê a tua semana</h2><p class="rl-txt">Junta os números da comida, do treino e do peso e diz-te o que mais importa.</p><div class="rl-acoes"><button class="bt pri" data-acao="vigiaRelato">Pedir a leitura</button></div>`}`});
  const F = g && g.r.focos && g.r.focos.length ? g.r.focos : focos(S).map(x => x[1]);
  C.push({f: 'fim', html: `<p class="rl-sup">Para a próxima semana</p><h2>Três focos</h2><ol class="rl-focos">${F.map(x => `<li><span>${esc(x)}</span></li>`).join('')}</ol>
    <div class="rl-acoes"><button class="bt pri" data-acao="partilhar">Guardar imagem da semana</button><button class="bt" data-acao="fecharRelato">Fechar</button></div>`});
  return C;
}
function abrirRelato(){
  if (!DADOS) return;
  esconderDica();
  const ini = segundaDe(hojeN()) + semOff * 7, S = semana(ini), A = semana(ini - 7);
  RL = {S, A, cartas: cartasRelato(S, A), i: 0};
  const el = $('#relato');
  el.innerHTML = `<div class="rl-prog">${RL.cartas.map(() => '<i></i>').join('')}</div><span class="rl-marca">Mirante</span><button class="rl-fechar" data-acao="fecharRelato" aria-label="Fechar o relato">${X_ICO}</button><div class="rl-c" aria-live="polite"></div>`;
  abrirOverlay('relato');
  irCarta(0);
}
function irCarta(i){
  if (!RL) return;
  if (i < 0) i = 0;
  if (i >= RL.cartas.length){ fecharOverlay('relato'); return; }
  RL.i = i;
  const k = RL.cartas[i], el = $('#relato'), [fundo, brilho] = FUNDOS[k.f];
  el.style.setProperty('--fundo', fundo); el.style.setProperty('--brilho', brilho);
  const caixa = el.querySelector('.rl-c');
  caixa.innerHTML = k.html;
  el.querySelectorAll('.rl-prog i').forEach((b, j) => { b.className = j < i ? 'feito' : ''; });
  const barra = el.querySelectorAll('.rl-prog i')[i];
  void barra.offsetWidth; barra.className = 'ativo';
  const dur = k.vigia || i === RL.cartas.length - 1 ? 0 : Math.min(14, 6 + k.html.replace(/<[^>]+>/g, '').length / 55);
  el.style.setProperty('--dur', dur ? dur + 's' : '9999s');
  barra.onanimationend = () => { if (RL && RL.i === i && dur) irCarta(i + 1); };
  const hz = caixa.querySelector('[data-graf="rlhz"]');
  if (hz) hz.innerHTML = svgHorizonte(RL.S, Math.max(280, hz.clientWidth || 320), true, false).replace(/data-acao="dia"/g, '');
  const cnt = caixa.querySelector('[data-conta]');
  if (cnt){
    const alvo = +cnt.dataset.conta, t0 = performance.now(), reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const passo = t => { const f = reduz ? 1 : Math.min(1, (t - t0) / 1100); cnt.textContent = Math.round(alvo * (1 - Math.pow(1 - f, 3))); if (f < 1) requestAnimationFrame(passo); };
    requestAnimationFrame(passo);
  }
}
function pararRelato(){ RL = null; const el = $('#relato'); el.classList.remove('pausa'); el.innerHTML = ''; }
// Toque: terço esquerdo recua, resto avança; manter o dedo pousado pausa.
(() => {
  const el = $('#relato'); let t0 = 0, x0 = 0, y0 = 0;
  el.addEventListener('pointerdown', e => { if (e.target.closest('button, a')) return; t0 = Date.now(); x0 = e.clientX; y0 = e.clientY; el.classList.add('pausa'); });
  el.addEventListener('pointerup', e => {
    el.classList.remove('pausa');
    if (!t0 || e.target.closest('button, a')){ t0 = 0; return; }
    const dt = Date.now() - t0, dx = e.clientX - x0, dy = e.clientY - y0; t0 = 0;
    if (!RL) return;
    if (dy > 90 && Math.abs(dx) < 60){ fecharOverlay('relato'); return; }
    if (Math.abs(dx) > 50){ irCarta(RL.i + (dx < 0 ? 1 : -1)); return; }
    if (dt > 450) return;
    irCarta(RL.i + (e.clientX < innerWidth / 3 ? -1 : 1));
  });
  el.addEventListener('pointercancel', () => { el.classList.remove('pausa'); t0 = 0; });
})();

/* ---------- Imagem da semana para partilhar ---------- */
async function imagemSemana(S){
  const W = 1080, H = 1350, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  try { await Promise.all(['300 200px Fraunces', '400 60px Fraunces'].map(f => document.fonts.load(f))); } catch(e){}
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#1b2342'); gr.addColorStop(.45, '#0F121A'); gr.addColorStop(1, '#0F121A');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const txt = (s, x, y, font, cor, max) => { g.font = font; g.fillStyle = cor; let f = font; if (max){ let px = parseFloat(font.match(/(\d+)px/)[1]); while (g.measureText(s).width > max && px > 20){ px -= 2; f = font.replace(/\d+px/, px + 'px'); g.font = f; } } g.fillText(s, x, y); };
  txt('Mirante', 80, 120, '500 40px Fraunces, serif', '#A2A8B7');
  txt(rotSemana(S.ini), 80, 205, '400 64px Fraunces, serif', '#ECE8DE', W - 160);
  const n = S.nota;
  if (n.total != null){
    txt(String(n.total), 72, 440, '300 230px Fraunces, serif', '#ECE8DE');
    g.font = '300 230px Fraunces, serif'; const wn = g.measureText(String(n.total)).width;
    txt('de 100', 92 + wn, 440, '400 40px system-ui, sans-serif', '#6D7385');
    txt(n.faixa + (n.provisoria ? ' (provisória)' : ''), 80, 510, '400 50px Fraunces, serif', '#C9A86A');
  }
  const svg = svgHorizonte(S, 680, false, true), hH = Math.round(300 * 920 / 680);
  const img = new Image(); img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  try { await img.decode(); g.save(); g.beginPath(); g.roundRect ? g.roundRect(80, 560, 920, hH, 28) : g.rect(80, 560, 920, hH); g.clip(); g.drawImage(img, 80, 560, 920, hH); g.restore(); } catch(e){}
  const col = [
    S.comida.tem ? ['Comida', fmtInt(S.comida.kcalMed) + ' kcal', `por dia, meta ${fmtInt(S.metas.kcal)}`, COR.comida] : null,
    D.temForja ? ['Treino', `${S.treino.sessoes} de ${S.treino.alvo}`, `${fmtTon(S.treino.volume)} levantadas`, COR.treino] : null,
    S.peso.tFim != null ? ['Peso', (S.peso.delta != null ? sinal(S.peso.delta, fmt1) : fmt1(S.peso.tFim)) + ' kg', `tendência ${fmt1(S.peso.tFim)} kg`, COR.peso] : null
  ].filter(Boolean);
  const cw = 920 / Math.max(1, col.length);
  col.forEach(([nome, v, sub, cor], i) => {
    const x = 80 + i * cw;
    g.fillStyle = cor; g.beginPath(); g.arc(x + 9, 1018, 9, 0, Math.PI * 2); g.fill();
    txt(nome, x + 30, 1030, '500 34px system-ui, sans-serif', '#A2A8B7');
    txt(v, x, 1100, '400 62px Fraunces, serif', '#ECE8DE', cw - 24);
    txt(sub, x, 1145, '400 28px system-ui, sans-serif', '#6D7385', cw - 24);
  });
  const L = leituras(S, semana(S.ini - 7))[0];
  if (L){
    const t = L.txt.replace(/<[^>]+>/g, ''), palavras = t.split(' '); let linha = '', y = 1215; g.font = 'italic 400 34px Fraunces, serif'; g.fillStyle = '#ECE8DE';
    for (const p of palavras){ const tst = linha ? linha + ' ' + p : p; if (g.measureText(tst).width > 920){ g.fillText(linha, 80, y); y += 46; linha = p; if (y > 1262) break; } else linha = tst; }
    if (y <= 1262) g.fillText(linha, 80, y);
  }
  txt('Comida da Garfada, treino da Forja.', 80, 1310, '400 26px system-ui, sans-serif', '#6D7385');
  return new Promise(res => cv.toBlob(res, 'image/png'));
}
async function partilhar(){
  const S = RL ? RL.S : semana(segundaDe(hojeN()) + semOff * 7);
  toast('A preparar a imagem…');
  const blob = await imagemSemana(S);
  if (!blob){ toast('Não consegui criar a imagem.'); return; }
  const nome = `mirante-${chaveDe(S.ini)}.png`, file = new File([blob], nome, {type: 'image/png'});
  if (navigator.canShare && navigator.canShare({files: [file]})){
    try { await navigator.share({files: [file], title: 'A minha semana no Mirante'}); return; } catch(e){ if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  // Num computador, descarrega. Onde não dá para descarregar (por exemplo, dentro de outra página), mostra a imagem para guardar à mão.
  if (window.self === window.top && !matchMedia('(pointer: coarse)').matches){
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    toast('Imagem descarregada.'); setTimeout(() => URL.revokeObjectURL(url), 5000); return;
  }
  $('#folha').innerHTML = `<div class="folha-c"><div class="pega"></div><div class="folha-cab"><div><h2 style="font-size:22px">Imagem da semana</h2><p class="sub">Toca sem largar na imagem para a guardar ou partilhar.</p></div><button class="ic" data-acao="fecharFolha" aria-label="Fechar">${X_ICO}</button></div>
    <img src="${url}" alt="Resumo da semana de ${rotSemana(S.ini)}" style="width:100%;border-radius:16px;margin-top:14px;display:block"></div>`;
  $('#folha').classList.add('por-cima'); abrirOverlay('folha');
}

/* ---------- Ações ---------- */
const semanaAtual = () => { const ini = segundaDe(hojeN()) + semOff * 7; return [semana(ini), semana(ini - 7)]; };
const ACOES = {
  irSemana(){ irPara('vSemana'); }, irEvolucao(){ irPara('vEvolucao'); }, irLigacoes(){ irPara('vLigacoes'); },
  semAnt(){ semOff--; animarHz = true; renderVista(); }, semSeg(){ if (semOff < 0){ semOff++; animarHz = true; renderVista(); } },
  relato(){ if (vista !== 'vSemana' && DADOS){ vista = 'vSemana'; renderVista(); } abrirRelato(); },
  fecharRelato(){ fecharOverlay('relato'); }, fecharFolha(){ fecharOverlay('folha'); },
  dia(el){ if (el.dataset.v) abrirDia(el.dataset.v); },
  range(el){ evoRange = +el.dataset.v; ML.set('evoRange', evoRange); renderVista(); },
  async atualizar(){ toast('A atualizar…', 1500); await carregar(true); estadoTopo(); if (vista === 'vLigacoes') renderLigacoes(); },
  async limparCache(){ await MDB.limpar(); toast('Cache limpa. A ler de novo…'); await carregar(true); if (vista === 'vLigacoes') renderLigacoes(); },
  async demo(el){ demoForcado = el.checked; ML.set('demo', demoForcado); semOff = 0; animarHz = true; inicial = true; await carregar(true); },
  async sairDemo(){ demoForcado = false; ML.set('demo', false); semOff = 0; inicial = true; animarHz = true; await carregar(true); if (DADOS && DADOS.demoAuto) irPara('vLigacoes'); },
  async guardarFonte(el){
    const app = el.dataset.v, f = el.closest('[data-fonte]'), v = n => f.querySelector(`[name="${n}"]`).value.trim();
    const c = {dono: v('dono'), repo: v('repo'), token: v('token')};
    if (!c.dono || !c.repo || !c.token){ toast('Preenche o utilizador, o repositório e o token.'); return; }
    el.disabled = true; el.textContent = 'A verificar…';
    try {
      await testarRepo(app, c);
      const todas = ML.get('fontes', {}) || {}; todas[app] = c; ML.set('fontes', todas);
      toast(`Ligado à ${NOME_APP[app]}. A ler…`); await carregar(true);
    } catch(e){ toast(e.message || 'Não consegui ligar.', 4000); }
    renderVista();
  },
  async esquecerFonte(el){ const todas = ML.get('fontes', {}) || {}; delete todas[el.dataset.v]; ML.set('fontes', todas); await carregar(true); renderVista(); },
  async guardarChave(){ const k = $('#chaveIA').value.trim(); const mc = ML.get('cfg', {}) || {}; mc.chave = k; if (!mc.modelo) mc.modelo = 'gemini-flash-latest'; ML.set('cfg', mc); toast(k ? 'Chave guardada.' : 'Chave apagada.'); await carregar(false); renderVista(); },
  async esquecerChave(){ const mc = ML.get('cfg', {}) || {}; delete mc.chave; ML.set('cfg', mc); await carregar(false); renderVista(); },
  async vigia(el){
    const [S, A] = semanaAtual(); el.disabled = true; el.textContent = 'O vigia está a ler a semana…';
    try { await pedirVigia(S, A); renderVista(); } catch(e){ toast(e.message, 4000); el.disabled = false; el.textContent = 'Tentar outra vez'; }
  },
  async vigiaRelato(el){
    if (!RL) return; el.disabled = true; el.textContent = 'O vigia está a ler a semana…';
    try { await pedirVigia(RL.S, RL.A); const i = RL.i; RL.cartas = cartasRelato(RL.S, RL.A); irCarta(i); }
    catch(e){ toast(e.message, 4000); el.disabled = false; el.textContent = 'Tentar outra vez'; }
  },
  partilhar(){ partilhar(); },
  async instalar(){ if (!podeInstalar) return; podeInstalar.prompt(); await podeInstalar.userChoice; podeInstalar = null; renderVista(); }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-acao]'); if (!b) return;
  const f = ACOES[b.dataset.acao]; if (!f) return;
  if (b.tagName !== 'INPUT') e.preventDefault();
  f(b, e);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape'){ const id = PILHA[PILHA.length - 1]; if (id) fecharOverlay(id); return; }
  if (RL && !$('#relato').hidden){ if (e.key === 'ArrowRight' || e.key === ' '){ e.preventDefault(); irCarta(RL.i + 1); } else if (e.key === 'ArrowLeft') irCarta(RL.i - 1); return; }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-acao]')){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles: true})); return; }
  if (vista === 'vSemana' && DADOS && !PILHA.length && !e.target.closest('input, textarea')){ const ant = $('[data-acao="semAnt"]'); if (e.key === 'ArrowLeft' && ant && !ant.disabled) ACOES.semAnt(); else if (e.key === 'ArrowRight' && semOff < 0) ACOES.semSeg(); }
});

/* ---------- Dicas: rato, toque e teclado ---------- */
const elDica = $('#dica');
let alvoDica = null;
function posDica(x, y){
  const r = elDica.getBoundingClientRect();
  let l = clamp(x - r.width / 2, 8, innerWidth - r.width - 8), t = y - r.height - 14;
  if (t < 8) t = y + 20;
  elDica.style.left = l + 'px'; elDica.style.top = t + 'px';
}
function mostrarDica(html, x, y){ if (!html) return; elDica.innerHTML = html; elDica.hidden = false; posDica(x, y); }
function esconderDica(){ elDica.hidden = true; alvoDica = null; $$('.guia, .guia-pt').forEach(g => g.setAttribute('hidden', '')); }
function moverLinha(rect, e){
  const info = LINHAS.get(rect.dataset.linha); if (!info) return;
  const svg = rect.ownerSVGElement, bb = svg.getBoundingClientRect(), k = info.W / bb.width;
  const sx = (e.clientX - bb.left) * k;
  let best = info.pts[0]; for (const p of info.pts) if (Math.abs(p.x - sx) < Math.abs(best.x - sx)) best = p;
  const g = svg.querySelector('.guia'), gp = svg.querySelector('.guia-pt');
  g.removeAttribute('hidden'); gp.removeAttribute('hidden');
  g.setAttribute('x1', best.x); g.setAttribute('x2', best.x); gp.setAttribute('cx', best.x); gp.setAttribute('cy', best.y);
  mostrarDica(best.html, bb.left + best.x / k, bb.top + best.y / k);
}
document.addEventListener('pointermove', e => {
  const lin = e.target.closest && e.target.closest('[data-linha]');
  if (lin){ moverLinha(lin, e); return; }
  if (e.pointerType === 'touch') return;
  const t = e.target.closest && e.target.closest('[data-dica]');
  if (!t){ if (!elDica.hidden) esconderDica(); return; }
  if (t !== alvoDica){ alvoDica = t; elDica.innerHTML = DICAS.get(t.dataset.dica) || ''; elDica.hidden = !elDica.innerHTML; }
  posDica(e.clientX, e.clientY);
}, {passive: true});
document.addEventListener('pointerdown', e => {
  if (e.pointerType !== 'touch') return;
  const lin = e.target.closest('[data-linha]'); if (lin){ moverLinha(lin, e); return; }
  const t = e.target.closest('[data-dica]');
  if (t && !t.dataset.acao) mostrarDica(DICAS.get(t.dataset.dica), e.clientX, e.clientY); else esconderDica();
}, {passive: true});
document.addEventListener('focusin', e => {
  const t = e.target.closest && e.target.closest('[data-dica]');
  if (!t || e.target.matches(':not(:focus-visible)')) return;
  const r = t.getBoundingClientRect(); mostrarDica(DICAS.get(t.dataset.dica), r.left + r.width / 2, r.top);
});
document.addEventListener('focusout', () => esconderDica());
addEventListener('scroll', () => { if (!elDica.hidden) esconderDica(); }, {passive: true});
let tRz; addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => desenhar(), 160); });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && DADOS && !DADOS.demo && Date.now() - (window._ultimaLeitura || 0) > 5 * 60e3){ window._ultimaLeitura = Date.now(); carregar(true); } });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); podeInstalar = e; if (vista === 'vLigacoes') renderLigacoes(); });
addEventListener('online', () => carregar(true));

window._ultimaLeitura = Date.now();
iniciar();
