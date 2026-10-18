'use strict';
/* Mirante — aplicação: vistas, relato da semana, detalhe do dia, ligações e leitura do vigia (IA). */

const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
let DADOS = null, semOff = 0, vista = 'vInicio', evoRange = ML.get('evoRange', 12), demoForcado = !!ML.get('demo', false);
let GRAFS = {}, transicao = '', inicial = true, abrirRelatoNoInicio = /[?&]relato=1/.test(location.search), podeInstalar = null;

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

/* ---------- Cantos de astrolábio nas caixas (um desenho, espelhado para cada canto) ---------- */
(() => {
  const c = 27, r = 24;
  const tiques = [198, 211, 225, 239, 252].map(g => { const a = g * Math.PI / 180, d = g === 225 ? 4.2 : 2.6;
    return `<path d="M${(c + r * Math.cos(a)).toFixed(2)} ${(c + r * Math.sin(a)).toFixed(2)}L${(c + (r - d) * Math.cos(a)).toFixed(2)} ${(c + (r - d) * Math.sin(a)).toFixed(2)}"/>`; }).join('');
  const CANTO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30" fill="none" stroke-linecap="round"><g TR>` +
    `<path d="M3 27A24 24 0 0 1 27 3" stroke="#B4C4EC" stroke-opacity=".5" stroke-width=".9"/><path d="M8.5 27A18.5 18.5 0 0 1 27 8.5" stroke="#B4C4EC" stroke-opacity=".2" stroke-width=".7"/>` +
    `<g stroke="#B4C4EC" stroke-opacity=".55" stroke-width=".8">${tiques}</g><path d="${estrela(7.4, 7.4, 3.5)}" fill="#E6CC93" fill-opacity=".92"/>` +
    `<circle cx="3" cy="27" r=".9" fill="#B4C4EC" fill-opacity=".65"/><circle cx="27" cy="3" r=".9" fill="#B4C4EC" fill-opacity=".65"/></g></svg>`;
  [['tl', ''], ['tr', 'transform="translate(30 0) scale(-1 1)"'], ['bl', 'transform="translate(0 30) scale(1 -1)"'], ['br', 'transform="translate(30 30) scale(-1 -1)"']]
    .forEach(([n, tr]) => document.documentElement.style.setProperty('--c-' + n, `url("data:image/svg+xml,${encodeURIComponent(CANTO.replace('<g TR>', `<g ${tr}>`))}")`));
})();
function contar(el, alvo, ms = 1100){
  if (!el) return;
  const t0 = performance.now(), reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const passo = t => { const f = reduz ? 1 : Math.min(1, (t - t0) / ms); el.textContent = Math.round(alvo * (1 - Math.pow(1 - f, 3))); if (f < 1) requestAnimationFrame(passo); };
  requestAnimationFrame(passo);
}

/* ---------- Arranque ---------- */
async function iniciar(){
  if (ML.get('ceu', true) !== false) Ceu.ligar(); else $('#ceu').hidden = true;
  try { EXDB = window.EXDB_EMBUTIDO || await (await fetch('exercicios.json')).json(); } catch(e){ EXDB = {}; }
  renderVista();
  await carregar();
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
}
function montarDemo(){ return montar(gerarDemo(), null, null, {demo: true}); }
async function carregar(rede = true){
  if (demoForcado){ usarDados(montarDemo()); return; }
  await carregarDados((dados, final) => {
    const vazio = !dados.temGarfada && !dados.temForja && !dados.temNascente;
    const aEsperar = Object.values(FONTES).some(f => f.estado === 'espera' || f.estado === 'a ler');
    if (vazio && !final && aEsperar){ DADOS = null; renderVista(); estadoTopo(); return; }
    usarDados(vazio ? Object.assign(montarDemo(), {demoAuto: true}) : dados);
  }, {rede});
}
let capaVista = false;
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
  if (!capaVista){ capaVista = true; ligarCapa(); mostrarCapa(); }
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
  const F = Object.values(FONTES), aLer = F.some(f => f.estado === 'a ler') || SYNC_M.estado === 'a ler', erro = F.find(f => f.estado === 'erro'), ok = F.filter(f => f.estado === 'ok');
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
  if (DADOS && DADOS.demoAuto) el.innerHTML = `<div><span><b>Estás a ver dados de exemplo.</b> Ainda não encontrei dados da Garfada, da Forja nem da Nascente.</span><button class="bt pri" data-acao="irLigacoes">Ligar as minhas apps</button></div>`;
  else if (DADOS && DADOS.demo) el.innerHTML = `<div><span><b>Modo de exemplo ligado.</b> Os números não são teus.</span><button class="bt" data-acao="sairDemo">Ver os meus dados</button></div>`;
  else { el.innerHTML = ''; el.hidden = true; return; }
  el.hidden = false;
}

/* ---------- Vistas ---------- */
const VISTAS = ['vInicio', 'vComida', 'vTreino', 'vPeso', 'vPele', 'vCultivo', 'vLigacoes'];
function renderVista(){
  limparDicas(); GRAFS = {};
  for (const v of VISTAS){ const el = $('#' + v); el.hidden = v !== vista; if (v !== vista && el.innerHTML) el.innerHTML = ''; }
  $$('nav.barra .tab[data-v]').forEach(b => b.classList.toggle('ativo', b.dataset.v === vista));
  if (!DADOS){ if (vista === 'vLigacoes') renderLigacoes(); else $('#' + vista).innerHTML = '<div class="esqueleto"></div><div class="esqueleto" style="height:180px"></div>'; return; }
  ({vInicio: renderInicio, vComida: renderComida, vTreino: renderTreino, vPeso: renderPeso, vPele: renderPele, vCultivo: renderCultivo, vLigacoes: renderLigacoes})[vista]();
  const el = $('#' + vista); el.classList.remove('entra', 'entra-esq', 'entra-dir');
  if (transicao){ void el.offsetWidth; el.classList.add(transicao); transicao = ''; }
}
function desenhar(raiz = document){
  raiz.querySelectorAll('[data-graf]').forEach(el => {
    const f = GRAFS[el.dataset.graf]; if (!f) return;
    const w = Math.floor(el.clientWidth);
    if (!w || (el._w === w && el.innerHTML)) return;
    el._w = w; el.innerHTML = f(w);
  });
}
function irPara(v){ if (vista === v){ scrollTo({top: 0, behavior: 'smooth'}); return; } transicao = 'entra'; animarVista = true; vista = v; renderVista(); scrollTo({top: 0}); }

/* ---------- Blocos partilhados ---------- */
const EXPL = {
  comida: '<b>Comida</b><span>O score da Garfada: calorias perto da meta (40), proteína (20), registo completo (15), qualidade (15) e água (10).</span>',
  treino: '<b>Treino</b><span>Treinos feitos face ao objetivo semanal (50), grupos musculares trabalhados (25) e progressão das cargas (25).</span>',
  peso: '<b>Peso</b><span>Ritmo da tendência face ao objetivo: perder 0,2 a 1% do peso por semana, manter, ou ganhar 0,1 a 0,5%.</span>',
  pele: '<b>Pele</b><span>Rituais da Nascente feitos, de manhã e à noite (70), e o estado geral da pele nos registos (30).</span>'
};
const TEND = '<b>Tendência</b><span>Suaviza as oscilações do dia a dia (água, sal, hora da pesagem). É ela que mostra se estás mesmo a perder ou a ganhar.</span>';
function subSemana(S){
  if (S.emCurso){ const f = 7 - S.decorridos; return f ? `Semana em curso. ${f === 1 ? 'Falta 1 dia' : 'Faltam ' + f + ' dias'}.` : 'Último dia da semana.'; }
  const h = hojeN();
  if (semOff === -1) return h === segundaDe(h) ? 'Semana passada. A nova começou hoje.' : 'Semana passada.';
  return `Há ${-semOff} semanas.`;
}
function blocoTrilho(){
  const C = caminhoPeso(), cab = '<h2>O caminho até ao cume</h2>';
  if (C.vazio) return `${cab}<p class="caminho-txt">${C.obj ? 'Ainda há poucas pesagens para traçar o caminho.' : 'Define um peso-objetivo na Garfada ou na Forja e o caminho até ao cume aparece aqui.'}</p><div class="trilho-caixa" data-graf="trilho"></div>`;
  const pct = clamp(C.pct, -9, 9), eta = C.eta ? mesAno(C.eta * DIA) : '';
  const txt = C.chegou ? `Chegaste ao cume: <b>${fmt1(C.u.t)} kg</b>, e o objetivo era ${fmt1(C.obj)} kg.`
    : `<b>${fmtInt(Math.max(0, pct) * 100)}% do caminho</b>, de ${fmt1(C.k0)} até ${fmt1(C.obj)} kg. ` +
      (C.eta ? `No ritmo atual, de ${sinal(C.ritmo, fmt1)} kg por semana, chegas ao cume por volta de <b>${eta}</b>.` : C.longe ? 'Nas últimas semanas o trilho desceu: estás a afastar-te do objetivo.' : 'Ainda não há ritmo suficiente para prever a chegada.');
  return `${cab}<p class="caminho-txt">${txt}</p><div class="trilho-caixa" data-graf="trilho"></div>
    <dl class="stats"><div><dt>Partida</dt><dd>${fmt1(C.k0)} <small>kg</small></dd></div><div data-dica="${dica(TEND)}"><dt>Hoje</dt><dd>${fmt1(C.u.t)} <small>kg</small></dd></div>
      <div><dt>${C.chegou ? 'Para lá do cume' : 'Faltam'}</dt><dd>${fmt1(Math.abs(C.falta))} <small>kg</small></dd></div><div><dt>Chegada prevista</dt><dd>${C.chegou ? 'Já lá estás' : eta || '—'}</dd></div></dl>`;
}
function blocoBalanca(S){
  const B = balancaSemana(S);
  let ver;
  if (B.ing == null) ver = 'Sem refeições completas nesta semana: a balança fica parada.';
  else {
    const d = Math.round(B.dif);
    ver = Math.abs(d) < 80 ? 'Comes quase o mesmo que gastas: <b>equilíbrio</b>. O peso deve manter-se.'
      : `${d < 0 ? 'Défice' : 'Excedente'} de <b>${fmtInt(Math.abs(d))} kcal por dia</b>, o que dá cerca de <b>${sinal(B.kgSem, fmt1)} kg por semana</b>.`;
    if (S.peso.ritmo != null) ver += ` A balança real mostrou ${sinal(S.peso.ritmo, fmt1)} kg por semana.`;
  }
  const expl = B.real ? 'Calculado com o que comeste e com a tendência do peso nas últimas 4 semanas.' : 'Estimado pela fórmula de Mifflin-St Jeor e pelo teu nível de atividade. Fica mais certo com 2 semanas de registos e pesagens.';
  return `<h2>A balança da semana</h2><p class="sub">O que comes contra o que gastas, em média por dia.</p>
    <div class="graf-caixa" data-graf="bal"></div>
    <div class="bal-pratos"><div><span><i class="mk comida"></i>Comeste</span><b>${B.ing != null ? fmtInt(B.ing) : '—'}<small>kcal</small></b></div>
      <div data-dica="${dica(`<b>Gasto por dia</b><span>${expl}</span>`)}"><span><i class="mk peso"></i>Gastas${B.real ? '' : ' (estimativa)'}</span><b>${fmtInt(B.gasto)}<small>kcal</small></b></div></div>
    <p class="bal-veredito">${ver}</p>`;
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
  const coruja = `<span data-acao="coruja" role="button" tabindex="0" aria-label="O vigia">${svgCoruja()}</span>`;
  const cab = intro => `<div class="vigia-cab">${coruja}<div><h3>Leitura do vigia</h3>${intro}</div></div>`;
  if (!D.ia.chave) return `<div class="vigia">${cab('<p class="sub" style="margin-top:4px">A IA lê os números da semana e diz-te o que mais importa. Usa a chave do Gemini da Garfada ou da Forja.</p>')}<button class="bt" data-acao="irLigacoes">Configurar a IA</button></div>`;
  if (g) return `<div class="vigia">${cab(`<p class="veredicto">${esc(g.r.veredicto)}</p>`)}${(g.r.destaques || []).length ? `<ul>${g.r.destaques.map(x => `<li>${esc(x)}</li>`).join('')}</ul>` : ''}${g.ass !== assinaturaIA(S, A) ? '<button class="bt" data-acao="vigia">Atualizar a leitura</button>' : ''}</div>`;
  return `<div class="vigia">${cab('<p class="sub" style="margin-top:4px">A IA lê os números da semana e diz-te o que mais importa.</p>')}<button class="bt" data-acao="vigia">Pedir a leitura</button></div>`;
}
async function pedirVigia(S, A){
  const prompt = `És o vigia do Mirante, uma app que junta a alimentação (registada na Garfada) e os treinos de ginásio em casa (registados na Forja) de uma pessoa, para ela ver o progresso da semana.
Escreve em português de Portugal (PT-PT), com tom direto e caloroso de treinador experiente, sem exageros, sem emojis e sem termos em inglês.
Analisa a semana com base nestes dados e responde só com JSON no formato {"veredicto": "uma frase curta que resume a semana", "destaques": ["2 a 3 frases curtas, com números concretos, sobre o que correu bem e o que correu pior, cruzando comida, treino e peso quando fizer sentido"], "focos": ["exatamente 3 ações concretas e específicas para a próxima semana"]}.
Regras: não inventes dados que não estão aqui; se a semana estiver em curso, fala do que já aconteceu; não dês conselhos médicos.
Dados: ${JSON.stringify(resumoParaIA(S, A))}`;
  const txt = await IA.pedir({texto: prompt, json: true, chave: D.ia.chave, modelo: D.ia.modelo, temperatura: .4});
  const a = txt.indexOf('{'), b = txt.lastIndexOf('}');
  let o; try { o = JSON.parse(txt.slice(a, b + 1)); } catch(e){ throw new Error('A IA respondeu num formato inválido. Tenta outra vez.'); }
  const res = {veredicto: String(o.veredicto || '').slice(0, 300), destaques: (o.destaques || []).slice(0, 3).map(x => String(x).slice(0, 300)), focos: (o.focos || []).slice(0, 3).map(x => String(x).slice(0, 300))};
  if (!res.veredicto) throw new Error('A IA não devolveu uma leitura. Tenta outra vez.');
  const todos = ML.get('vigia', {}) || {};
  todos[chaveVigia(S)] = {ts: Date.now(), ass: assinaturaIA(S, A), r: res};
  const chaves = Object.keys(todos).sort().slice(-20), limpo = {}; for (const k of chaves) limpo[k] = todos[k];
  ML.set('vigia', limpo); agendarSyncMirante();
  return res;
}

const RANGES = [[8, '8 semanas'], [12, '3 meses'], [26, '6 meses'], [52, '1 ano']];

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
    const onde = `${esc(c.dono)}/${esc(c.repo)}`, de = c.origem === 'app' ? `, com a ligação da ${nome}` : c.origem === 'mirante-dados' ? ', com o token do Mirante' : '';
    gh = F.estado === 'ok' ? linhaFonte('ok', `<b>GitHub:</b> ${onde}${de}. Lido às ${hora(F.quando)}.`)
      : F.estado === 'erro' ? linhaFonte('erro', `<b>GitHub:</b> ${onde}. ${esc(F.erro)}${c.adivinhado ? ` Este nome foi um palpite: abre o Mirante uma vez no dispositivo onde a ${nome} está ligada, para ele deixar o nome certo no mirante-dados, ou liga-a à mão aqui em baixo.` : ''}`)
      : F.estado === 'a ler' ? linhaFonte('pend', `<b>GitHub:</b> ${onde}. A ler…`)
      : linhaFonte('pend', `<b>GitHub:</b> ${onde}${de}.${F.quando ? ' Última leitura às ' + hora(F.quando) + '.' : ''}`);
  }
  const sug = app + '-dados';
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
function blocoMirante(){
  const g = ML.get('gh', null) || {}, ligado = !!ghMirante(), d = credenciaisDiretas();
  const donoSug = g.dono || (Object.values(d).find(Boolean) || {}).dono || '';
  let estado;
  if (!ligado) estado = linhaFonte('', '<b>Sem ligação.</b> Neste dispositivo o Mirante só vê as apps que estão configuradas aqui.');
  else if (SYNC_M.estado === 'erro') estado = linhaFonte('erro', `<b>${esc(g.dono)}/${esc(g.repo)}:</b> ${esc(SYNC_M.erro)}`);
  else if (SYNC_M.estado === 'a ler') estado = linhaFonte('pend', `<b>${esc(g.dono)}/${esc(g.repo)}:</b> a sincronizar…`);
  else estado = linhaFonte(SYNC_M.estado === 'ok' ? 'ok' : 'pend', `<b>${esc(g.dono)}/${esc(g.repo)}:</b> ${SYNC_M.quando ? 'sincronizado às ' + hora(SYNC_M.quando) : 'à espera de rede'}. As apps sem ligação neste dispositivo são lidas com este token.`);
  return `<section class="painel"><h2>Mirante no telemóvel e no PC</h2><ul class="fonte-linhas">${estado}</ul>
    <details class="mais"${ligado ? '' : ' open'}><summary>${ligado ? 'Mudar a ligação' : 'Ligar ao repositório mirante-dados'}</summary>
      <div class="form" id="formMirante">
        <p class="sub">Com um só token, o Mirante abre em qualquer dispositivo com os teus dados todos, mesmo onde a Garfada, a Forja e a Nascente não estão configuradas.</p>
        <ol class="passos-gh">
          <li>No GitHub, cria um repositório <b>privado</b> chamado <b>mirante-dados</b> (pode ficar vazio).</li>
          <li>Cria um token "fine-grained" com acesso a <b>mirante-dados</b> e aos repositórios de dados da Garfada, da Forja e da Nascente, com <b>Contents: Read and write</b>.</li>
          <li>Põe aqui o token, no telemóvel e no PC.</li>
        </ol>
        <p class="sub">O token fica só neste dispositivo. No mirante-dados só ficam os nomes dos repositórios das apps, as leituras do vigia e as crónicas do cultivo; nunca tokens nem chaves. Nos repositórios das apps o Mirante só lê.</p>
        <label class="campo">Utilizador GitHub<input name="dono" value="${esc(donoSug)}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="danielgog7"></label>
        <label class="campo">Repositório<input name="repo" value="${esc(g.repo || 'mirante-dados')}" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="mirante-dados"></label>
        <label class="campo">Token<input name="token" type="password" value="${esc(g.token || '')}" autocomplete="off" spellcheck="false" placeholder="github_pat_…"></label>
        <div class="linha-bt"><button class="bt pri" data-acao="guardarMirante">Guardar e sincronizar</button>${ligado ? '<button class="bt" data-acao="esquecerMirante">Esquecer neste dispositivo</button>' : ''}</div>
      </div></details></section>`;
}
function renderLigacoes(){
  const oc = origemChave(), mc = ML.get('cfg', {}) || {};
  $('#vLigacoes').innerHTML = `
  <div class="cab-vista"><h1>Ligações</h1><p class="sub">O Mirante só lê. Nunca altera nada na Garfada, na Forja nem na Nascente.</p></div>
  ${blocoMirante()}${blocoFonte('garfada')}${blocoFonte('forja')}${blocoFonte('nascente')}
  <section class="painel"><h2>Leitura do vigia</h2>
    <ul class="fonte-linhas">${oc ? linhaFonte('ok', oc === 'mirante' ? '<b>Chave do Gemini:</b> a tua, guardada no Mirante.' : `<b>Chave do Gemini:</b> a mesma da ${NOME_APP[oc]}.`) : linhaFonte('', '<b>Chave do Gemini:</b> não encontrada neste dispositivo.')}</ul>
    <details class="mais"${mc.chave ? ' open' : ''}><summary>${mc.chave ? 'Chave própria do Mirante' : 'Usar outra chave'}</summary>
      <div class="form"><p class="sub">Cria uma chave gratuita em <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener">aistudio.google.com</a>. Fica guardada só neste dispositivo.</p>
        <label class="campo">Chave do Gemini<input id="chaveIA" type="password" value="${esc(mc.chave || '')}" autocomplete="off" spellcheck="false"></label>
        <div class="linha-bt"><button class="bt pri" data-acao="guardarChave">Guardar</button>${mc.chave ? '<button class="bt" data-acao="esquecerChave">Esquecer</button>' : ''}</div></div></details></section>
  <section class="painel"><h2>IA de reserva (Groq)</h2>${IA.htmlGroq({sub: 'sub', pri: 'bt pri', campo: 'campo'})}</section>
  <section class="painel"><label class="interruptor"><span><h2>Capa do cultivador</h2><span class="sub">Ao abrir o Mirante, o teu cultivador absorve o qi da Garfada, da Forja e da Nascente. Toca três vezes para entrar; toque longo para saltar.</span></span><input type="checkbox" data-acao="capaLig" ${CAPA_CFG().on ? 'checked' : ''} aria-label="Mostrar a capa ao abrir"></label>
    <label class="interruptor" style="margin-top:12px"><span><span class="sub">Som de sino nos toques</span></span><input type="checkbox" data-acao="capaSom" ${CAPA_CFG().som ? 'checked' : ''} aria-label="Som nos toques"></label>
    <div class="linha-bt" style="margin-top:12px"><button class="bt" data-acao="verCapa">Ver o cultivador agora</button></div></section>
  <section class="painel"><label class="interruptor"><span><h2>Céu animado</h2><span class="sub">Estrelas a rodar devagar, a Via Láctea e estrelas cadentes no fundo. Desliga para poupar bateria.</span></span><input type="checkbox" id="ceuLig" data-acao="ceu" ${ML.get('ceu', true) !== false ? 'checked' : ''} aria-label="Céu animado"></label></section>
  <section class="painel"><label class="interruptor"><span><h2>Dados de exemplo</h2><span class="sub">Mostra 12 semanas inventadas, para veres como fica.</span></span><input type="checkbox" data-acao="demo" ${demoForcado ? 'checked' : ''} aria-label="Mostrar dados de exemplo"></label></section>
  <section class="painel"><h2>Manutenção</h2><p class="sub" style="margin:4px 0 12px">A cache guarda o que veio do GitHub para abrir depressa e sem rede.</p>
    <div class="linha-bt"><button class="bt" data-acao="atualizar">Atualizar agora</button><button class="bt" data-acao="limparCache">Limpar a cache</button>${podeInstalar ? '<button class="bt pri" data-acao="instalar">Instalar o Mirante</button>' : ''}</div></section>
  <p class="pe">Como funciona: a Garfada, a Forja, a Nascente e o Mirante vivem no mesmo endereço, por isso o Mirante lê diretamente o que cada app guardou neste navegador. Para juntar os dados de outros dispositivos, lê os repositórios privados onde cada app sincroniza. Junta tudo com as mesmas regras das apps: fica sempre a versão mais recente de cada registo. O único sítio onde o Mirante escreve é o seu próprio repositório, o mirante-dados.</p>`;
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
  abre: ['rgba(12,16,32,.5)', 'rgba(122,162,245,.22)'], nota: ['rgba(20,20,36,.62)', 'rgba(201,168,106,.22)'], comida: ['rgba(12,22,12,.68)', 'rgba(154,199,75,.24)'],
  treino: ['rgba(30,16,10,.72)', 'rgba(238,106,34,.28)'], peso: ['rgba(10,18,40,.6)', 'rgba(122,162,245,.28)'], cruz: ['rgba(16,20,34,.7)', 'rgba(162,168,183,.14)'], fim: ['rgba(18,18,36,.58)', 'rgba(201,168,106,.2)'],
  pele: ['rgba(8,26,24,.66)', 'rgba(79,214,214,.24)']
};
function cartasRelato(S, A){
  const C = [], m = S.metas, n = S.nota, c = S.comida, t = S.treino, p = S.peso;
  const ola = `${D.nome ? esc(D.nome) + ', eis' : 'Eis'} como ${S.emCurso ? 'está a correr' : 'correu'} a tua semana.`;
  C.push({f: 'abre', html: `<p class="rl-sup">O relato da semana</p><h1>${rotSemana(S.ini)}</h1><div class="rl-hz" data-rl="hz"></div><p class="rl-txt">${ola}</p>`});
  if (n.total != null) C.push({f: 'nota', html: `<p class="rl-sup">A nota da semana${n.provisoria ? ', provisória' : ''}</p><div class="rl-big" data-conta="${n.total}">0</div><h2>${n.faixa}</h2>
    <ul class="rl-linhas">${[['comida', 'Comida'], ['treino', 'Treino'], ['peso', 'Peso'], ['pele', 'Pele']].filter(([k]) => n.c[k] != null).map(([k, nome]) => `<li><span><i class="mk ${k}" style="margin-right:9px"></i>${nome}</span><b>${n.c[k]}${A.nota.c[k] != null ? `<small>antes ${A.nota.c[k]}</small>` : ''}</b></li>`).join('')}</ul>`});
  if (c.tem) C.push({f: 'comida', html: `<p class="rl-sup">Comida</p><div class="rl-big">${fmtInt(c.kcalMed)}<small>kcal</small></div>
    <p class="rl-txt">por dia, em média. A meta era <b>${fmtInt(m.kcal)}</b> e ficaste perto dela em <b>${c.naMeta} de ${c.diasReg}</b> ${c.diasReg === 1 ? 'dia' : 'dias'}.</p>
    <ul class="rl-linhas"><li>Proteína<b>${fmtInt(c.protMed)} g<small>meta ${m.prot} g</small></b></li><li>Dias registados<b>${c.diasReg}<small>de ${c.fechados}</small></b></li>${c.melhorDia ? `<li>Melhor dia<b>${DIAS_SEM[c.melhorDia.i]}</b></li>` : ''}${c.diasAgua ? `<li>Água<b>${fmt1(c.aguaMed / 1000)} L<small>meta ${fmt1(m.agua / 1000)} L</small></b></li>` : ''}</ul>`});
  if (c.tem){
    const B = balancaSemana(S), d = Math.round(B.dif);
    C.push({f: 'comida', html: `<p class="rl-sup">A balança da semana</p><h2>${Math.abs(d) < 80 ? 'Equilíbrio entre o que comes e o que gastas' : `${d < 0 ? 'Défice' : 'Excedente'} de ${fmtInt(Math.abs(d))} kcal por dia`}</h2>
      <div class="rl-graf" data-rl="bal"></div><ul class="rl-linhas"><li>Comeste<b>${fmtInt(B.ing)} kcal</b></li><li>Gastas<b>${fmtInt(B.gasto)} kcal<small>${B.real ? 'real' : 'estimativa'}</small></b></li></ul>`});
  }
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
      <div class="rl-peca cena-forja">${ForjaCena.cena(t.diasTreino / Math.max(1, t.alvo))}</div>
      ${t.sessoes ? `<ul class="rl-linhas"><li>Tempo a treinar<b>${fmtHM(t.minutos)}</b></li><li>Séries<b>${t.series}</b></li><li>Volume<b>${fmtTon(t.volume)}</b></li></ul>
      ${carros >= 1 ? `<p class="rl-txt">Levantaste, no total, o peso de <b>${carros} ${carros === 1 ? 'carro pequeno' : 'carros pequenos'}</b>.</p>` : ''}` : ''}`});
    if (t.sessoes){
      const top = Object.entries(t.musc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${(MUSC[k] || k).toLowerCase()} (${fmtInt(v)})`);
      const esq = GRUPOS.filter(([g]) => !t.grupos[g]).map(([g]) => g.toLowerCase());
      C.push({f: 'treino', html: `<p class="rl-sup">Músculos</p><h2>Onde o metal aqueceu</h2>${svgCorpo(t.musc)}<p class="rl-txt">Mais trabalhados: <b>${top.join(', ')}</b>.${esq.length && esq.length < 6 ? ` Ficaram de fora: ${esq.join(', ')}.` : ''}</p>`});
    }
    if (t.recordes.length) C.push({f: 'treino', cadente: true, html: `<p class="rl-sup">Recordes</p><div class="rl-big">${t.recordes.length}</div><h2>${t.recordes.length === 1 ? 'recorde batido' : 'recordes batidos'}</h2>
      <ul class="rl-linhas">${t.recordes.slice(0, 4).map(r => `<li>${esc(r.nome)}<b>${r.comPeso ? `${fmtKg(r.serie.kg)} kg × ${r.serie.reps}` : fmtInt(r.v) + ' reps'}<small>${sinal((r.v - r.ant) / r.ant * 100)}%</small></b></li>`).join('')}</ul>`});
  }
  if (p.tFim != null && (p.delta != null || p.pesagens.length)){
    C.push({f: 'peso', html: `<p class="rl-sup">Peso</p><div class="rl-big">${p.delta != null ? sinal(p.delta, fmt1) : fmt1(p.tFim)}<small>kg</small></div>
      <p class="rl-txt">${p.delta != null ? `Na tendência, de <b>${fmt1(p.tIni)}</b> para <b>${fmt1(p.tFim)} kg</b>.` : `Tendência em <b>${fmt1(p.tFim)} kg</b>.`} ${p.ritmo != null ? `O ritmo atual é de <b>${sinal(p.ritmo, fmt1)} kg por semana</b>.` : ''}</p>
      ${p.semanasAteMeta && p.semanasAteMeta < 160 ? `<p class="rl-txt">Se continuares assim, chegas aos <b>${fmt1(p.objetivo)} kg</b> por volta de <b>${mesAno(Date.now() + p.semanasAteMeta * 7 * DIA)}</b>.</p>` : ''}
      ${caminhoPeso().vazio ? `<ul class="rl-linhas"><li>Pesagens<b>${p.pesagens.length}</b></li></ul>` : '<div class="rl-graf" data-rl="trilho"></div>'}`});
  }  if (S.pele && S.pele.adesao != null){
    const P = S.pele, r = reinoPele(), g = P.medias.geral, ga = A.pele && A.pele.medias.geral;
    C.push({f: 'pele', html: `<p class="rl-sup">Pele</p><div class="rl-big">${P.feitas}<small>de ${P.possiveis}</small></div><p class="rl-txt">rituais da Nascente feitos${S.emCurso ? ' até agora' : ''}.</p>
      ${htmlRituaisSemana(P)}
      <ul class="rl-linhas"><li>Respiração<b>${respiracaoPeriodo(S.ini, Math.min(S.fim, hojeN())).completas} sessões</b></li>${g != null ? `<li>Estado da pele<b>${PELE_MED_I.geral[2][Math.round(g)]}${ga != null ? `<small>antes ${PELE_MED_I.geral[2][Math.round(ga)].toLowerCase()}</small>` : ''}</b></li>` : ''}<li>Dias seguidos<b>${sequenciaPele()}</b></li></ul>`});
  }

  const L = leituras(S, A).slice(0, 3);
  if (L.length) C.push({f: 'cruz', html: `<p class="rl-sup">O que os números dizem juntos</p><h2>Comida, treino e peso, lado a lado</h2><ul class="leituras" style="margin-top:14px">${L.map(x => `<li><span class="glifo">${GLIFO[x.ic]}</span><p style="font-size:16px">${x.txt}</p></li>`).join('')}</ul>`});
  if (A.nota.total != null && !S.emCurso){
    const lin = [['Nota', A.nota.total, n.total, v => v], ['Calorias por dia', A.comida.tem ? A.comida.kcalMed : null, c.tem ? c.kcalMed : null, fmtInt], ['Proteína por dia', A.comida.tem ? A.comida.protMed : null, c.tem ? c.protMed : null, v => fmtInt(v) + ' g'],
      ['Treinos', D.temForja ? A.treino.sessoes : null, D.temForja ? t.sessoes : null, v => v], ['Volume', D.temForja ? A.treino.volume : null, D.temForja ? t.volume : null, fmtTon], ['Peso (tendência)', A.peso.tFim, p.tFim, v => fmt1(v) + ' kg']].filter(x => x[1] != null && x[2] != null);
    if (lin.length >= 2) C.push({f: 'cruz', html: `<p class="rl-sup">Face à semana anterior</p><h2>O que mudou</h2><ul class="rl-linhas">${lin.map(([nm, a, b, f]) => `<li>${nm}<b>${f(b)}<small>antes ${f(a)}</small></b></li>`).join('')}</ul>`});
  }
  const g = vigiaGuardado(S);
  if (D.ia.chave && n.total != null) C.push({f: 'nota', vigia: true, html: `<div class="rl-coruja">${svgCoruja()}</div><p class="rl-sup">Leitura do vigia</p>${g ? `<h2 class="veredicto" style="font-style:italic">${esc(g.r.veredicto)}</h2><ul class="rl-linhas">${(g.r.destaques || []).map(x => `<li style="display:block;line-height:1.5">${esc(x)}</li>`).join('')}</ul>`
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
  document.body.classList.add('relato-aberto');
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
  caixa.querySelectorAll('[data-rl]').forEach(el => {
    const w = Math.max(280, el.clientWidth || 320), k = el.dataset.rl;
    el.innerHTML = k === 'hz' ? svgHorizonte(RL.S, w, true, false).replace(/data-acao="dia"/g, '') : k === 'bal' ? svgBalanca(balancaSemana(RL.S), w, true) : svgTrilho(caminhoPeso(), w, true);
  });
  ForjaCena.animar(caixa.querySelector('.cena-forja'));
  const cnt = caixa.querySelector('[data-conta]');
  if (cnt){ contar(cnt, +cnt.dataset.conta); if (+cnt.dataset.conta >= 85) Ceu.cadente(900); }
  if (k.cadente) Ceu.cadente(500);
}
function pararRelato(){ document.body.classList.remove('relato-aberto'); RL = null; const el = $('#relato'); el.classList.remove('pausa'); el.innerHTML = ''; }
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
  await partilharBlob(await imagemSemana(S), `mirante-${chaveDe(S.ini)}.png`, 'A minha semana no Mirante', 'Imagem da semana', `Resumo da semana de ${rotSemana(S.ini)}`);
}
async function partilharBlob(blob, nome, titulo, cab, alt){
  if (!blob){ toast('Não consegui criar a imagem.'); return; }
  const file = new File([blob], nome, {type: 'image/png'});
  if (navigator.canShare && navigator.canShare({files: [file]})){
    try { await navigator.share({files: [file], title: titulo}); return; } catch(e){ if (e.name === 'AbortError') return; }
  }
  const url = URL.createObjectURL(blob);
  // Num computador, descarrega. Onde não dá para descarregar (por exemplo, dentro de outra página), mostra a imagem para guardar à mão.
  if (window.self === window.top && !matchMedia('(pointer: coarse)').matches){
    const a = document.createElement('a'); a.href = url; a.download = nome; document.body.appendChild(a); a.click(); a.remove();
    toast('Imagem descarregada.'); setTimeout(() => URL.revokeObjectURL(url), 5000); return;
  }
  $('#folha').innerHTML = `<div class="folha-c"><div class="pega"></div><div class="folha-cab"><div><h2 style="font-size:22px">${esc(cab)}</h2><p class="sub">Toca sem largar na imagem para a guardar ou partilhar.</p></div><button class="ic" data-acao="fecharFolha" aria-label="Fechar">${X_ICO}</button></div>
    <img src="${url}" alt="${esc(alt)}" style="width:100%;border-radius:16px;margin-top:14px;display:block"></div>`;
  $('#folha').classList.add('por-cima'); abrirOverlay('folha');
}

/* ---------- Ações ---------- */
const semanaAtual = () => { const ini = segundaDe(hojeN()) + semOff * 7; return [semana(ini), semana(ini - 7)]; };
const ACOES = {
  irInicio(){ irPara('vInicio'); }, irComida(){ irPara('vComida'); }, irTreino(){ irPara('vTreino'); }, irPeso(){ irPara('vPeso'); }, irPele(){ irPara('vPele'); },
  peleMed(el){ peleMed = el.dataset.v; const y = scrollY; renderVista(); scrollTo({top: y}); }, irLigacoes(){ irPara('vLigacoes'); },
  ir(el){ irPara(el.dataset.v); },
  irForja(el){ ForjaCena.golpe(el.querySelector('.cena-forja'), () => irPara('vTreino')); },
  golpe(el){ ForjaCena.golpe(el); },
  semAnt(){ semOff--; animarVista = true; transicao = 'entra-esq'; renderVista(); }, semSeg(){ if (semOff < 0){ semOff++; animarVista = true; transicao = 'entra-dir'; renderVista(); } },
  relato(){ abrirRelato(); },
  fecharRelato(){ fecharOverlay('relato'); }, fecharFolha(){ fecharOverlay('folha'); },
  dia(el){ if (el.dataset.v) abrirDia(el.dataset.v); },
  range(el){ evoRange = +el.dataset.v; ML.set('evoRange', evoRange); const y = scrollY; renderVista(); scrollTo({top: y}); },
  verCapa(){ mostrarCapa(true); },
  cronMes(el){ cronMes = el.dataset.v; const y = scrollY; renderVista(); scrollTo({top: y}); },
  async cronica(el){
    el.disabled = true; el.textContent = 'O cronista está a escrever…';
    try { await pedirCronica(el.dataset.v); const y = scrollY; renderVista(); scrollTo({top: y}); }
    catch(e){ toast(e.message || 'Não consegui escrever a crónica.', 4500); el.disabled = false; el.textContent = 'Tentar outra vez'; }
  },
  async partilharCult(){ toast('A preparar a imagem…'); try { await partilharBlob(await imagemCultivo(), `mirante-cultivo-${chaveData(new Date())}.png`, 'O meu cultivo no Mirante', 'O teu cultivador', 'O cultivador e o seu reino'); } catch(e){ toast('Não consegui criar a imagem.'); } },
  capaLig(el){ ML.set('capa', Object.assign(CAPA_CFG(), {on: el.checked})); },
  capaSom(el){ ML.set('capa', Object.assign(CAPA_CFG(), {som: el.checked})); },
  ceu(el){ ML.set('ceu', el.checked); if (el.checked) Ceu.ligar(); else Ceu.desligar(); },
  async atualizar(){ toast('A atualizar…', 1500); await carregar(true); estadoTopo(); if (vista === 'vLigacoes') renderLigacoes(); },
  async limparCache(){ await MDB.limpar(); toast('Cache limpa. A ler de novo…'); await carregar(true); if (vista === 'vLigacoes') renderLigacoes(); },
  async demo(el){ demoForcado = el.checked; ML.set('demo', demoForcado); semOff = 0; animarVista = true; inicial = true; await carregar(true); },
  async sairDemo(){ demoForcado = false; ML.set('demo', false); semOff = 0; inicial = true; animarVista = true; await carregar(true); if (DADOS && DADOS.demoAuto) irPara('vLigacoes'); },
  async guardarMirante(el){
    const f = $('#formMirante'), v = n => f.querySelector(`[name="${n}"]`).value.trim();
    const c = {dono: v('dono'), repo: v('repo') || 'mirante-dados', token: v('token')};
    if (!c.dono || !c.token){ toast('Preenche o utilizador e o token.'); return; }
    el.disabled = true; el.textContent = 'A verificar…';
    const antes = ML.get('gh', null);
    try {
      await lerMiranteRemoto(c);
      ML.set('gh', c);
      await sincronizarMirante();
      toast('Mirante ligado ao GitHub. A ler as apps…'); await carregar(true);
    } catch(e){ if (!antes || antes.token !== c.token) ML.set('gh', antes); toast(e.message || 'Não consegui ligar.', 5000); }
    renderVista();
  },
  async esquecerMirante(){ ML.set('gh', null); Object.assign(SYNC_M, {estado: 'off', quando: 0, erro: ''}); await carregar(true); renderVista(); },
  async guardarFonte(el){
    const app = el.dataset.v, f = el.closest('[data-fonte]'), v = n => f.querySelector(`[name="${n}"]`).value.trim();
    const c = {dono: v('dono'), repo: v('repo'), token: v('token')};
    if (!c.dono || !c.repo || !c.token){ toast('Preenche o utilizador, o repositório e o token.'); return; }
    el.disabled = true; el.textContent = 'A verificar…';
    try {
      await testarRepo(app, c);
      const todas = ML.get('fontes', {}) || {}; todas[app] = c; ML.set('fontes', todas); agendarSyncMirante();
      toast(`Ligado à ${NOME_APP[app]}. A ler…`); await carregar(true);
    } catch(e){ toast(e.message || 'Não consegui ligar.', 4000); }
    renderVista();
  },
  async esquecerFonte(el){ const todas = ML.get('fontes', {}) || {}; delete todas[el.dataset.v]; ML.set('fontes', todas); await carregar(true); renderVista(); },
  async guardarChave(){ const k = $('#chaveIA').value.trim(); const mc = ML.get('cfg', {}) || {}; mc.chave = k; if (!mc.modelo) mc.modelo = 'gemini-flash-latest'; ML.set('cfg', mc); toast(k ? 'Chave guardada.' : 'Chave apagada.'); await carregar(false); renderVista(); },
  async esquecerChave(){ const mc = ML.get('cfg', {}) || {}; delete mc.chave; ML.set('cfg', mc); await carregar(false); renderVista(); },
  async vigia(el){
    const [S, A] = semanaAtual(); el.disabled = true; el.textContent = 'O vigia está a ler a semana…'; $$('.coruja').forEach(c => c.classList.add('pensa'));
    try { await pedirVigia(S, A); renderVista(); } catch(e){ toast(e.message, 4000); el.disabled = false; el.textContent = 'Tentar outra vez'; $$('.coruja').forEach(c => c.classList.remove('pensa')); }
  },
  async vigiaRelato(el){
    if (!RL) return; el.disabled = true; el.textContent = 'O vigia está a ler a semana…'; $$('#relato .coruja').forEach(c => c.classList.add('pensa'));
    try { await pedirVigia(RL.S, RL.A); const i = RL.i; RL.cartas = cartasRelato(RL.S, RL.A); irCarta(i); }
    catch(e){ toast(e.message, 4000); el.disabled = false; el.textContent = 'Tentar outra vez'; $$('#relato .coruja').forEach(c => c.classList.remove('pensa')); }
  },
  partilhar(){ partilhar(); },
  coruja(el){ corujaToque(el); },
  vigiaTab(el){ vigiaTab = el.dataset.v; renderVigiaHero(true); },
  vigiaIA(){ pedirLeituraIA(); },
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
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-acao], [role="link"][data-acao]')){ e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', {bubbles: true})); return; }
  if (vista !== 'vLigacoes' && DADOS && !PILHA.length && !e.target.closest('input, textarea')){ const ant = $('[data-acao="semAnt"]'); if (e.key === 'ArrowLeft' && ant && !ant.disabled) ACOES.semAnt(); else if (e.key === 'ArrowRight' && semOff < 0) ACOES.semSeg(); }
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
document.addEventListener('pointerdown', e => {
  if (!e.isPrimary || !e.target.closest) return;
  const el = e.target.closest('button, [data-acao], .hz-toque, a, summary');
  const noRelato = e.target.closest('#relato');
  if (!el && !noRelato) return;
  if (el && el.disabled) return;
  if (!el){ Centelhas.explodir(e.clientX, e.clientY, 'base', 6); return; }
  const painel = el.closest('.painel'), mk = painel && painel.querySelector('.area-cab .mk, .tile-cab .mk');
  const tema = el.closest('.tab-relato, [data-acao="relato"], [data-acao="partilhar"], [data-acao="vigia"], [data-acao="vigiaRelato"]') ? 'ouro' : mk ? mk.classList[1] : 'base';
  Centelhas.explodir(e.clientX, e.clientY, tema, el.matches('.tab-relato, [data-acao="relato"]') ? 16 : 10);
}, {passive: true});
document.addEventListener('focusin', e => {
  const t = e.target.closest && e.target.closest('[data-dica]');
  if (!t || e.target.matches(':not(:focus-visible)')) return;
  const r = t.getBoundingClientRect(); mostrarDica(DICAS.get(t.dataset.dica), r.left + r.width / 2, r.top);
});
document.addEventListener('focusout', () => esconderDica());
addEventListener('scroll', () => { if (!elDica.hidden) esconderDica(); }, {passive: true});
let tRz; addEventListener('resize', () => { clearTimeout(tRz); tRz = setTimeout(() => desenhar(), 160); });
// Ao voltar ao Mirante, relê logo o que as outras apps guardaram neste dispositivo (por exemplo, a água que acabaste de pôr na Garfada);
// ao GitHub só vai de 5 em 5 minutos.
let tReler = null;
const relerLocal = () => { clearTimeout(tReler); tReler = setTimeout(() => { if (DADOS && !DADOS.demo && !capaAberta) carregar(false); }, 400); };
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState !== 'visible' || !DADOS || DADOS.demo) return;
  if (Date.now() - (window._ultimaLeitura || 0) > 5 * 60e3){ window._ultimaLeitura = Date.now(); carregar(true); } else relerLocal();
});
// Se a Garfada, a Forja ou a Nascente estiverem abertas noutro separador, cada alteração chega aqui sem recarregar.
addEventListener('storage', e => { if (e.key && !e.key.startsWith('mirante.') && e.key !== 'ia.comum') relerLocal(); });
addEventListener('beforeinstallprompt', e => { e.preventDefault(); podeInstalar = e; if (vista === 'vLigacoes') renderLigacoes(); });
addEventListener('online', () => carregar(true));

window._ultimaLeitura = Date.now();
iniciar();
