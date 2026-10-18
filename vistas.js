'use strict';
/* Mirante — as vistas.
   Início: o panorama da semana em desenhos e gráficos animados; cada caixa leva ao separador com o detalhe.
   Comida, Treino e Peso: a semana em pormenor e a evolução ao longo do tempo. */

const MACRO_COR = {prot: '#ff8a65', hid: '#ffd166', gord: '#c792ea'};
let animarVista = true;
const consumirAnim = () => { const a = animarVista; animarVista = false; return a; };
const semanasAtuais = () => { const ini = segundaDe(hojeN()) + semOff * 7; return {S: semana(ini), A: semana(ini - 7)}; };
function cabSemana(S){
  return `<div class="cab-semana">
    <button class="seta" data-acao="semAnt" ${S.ini <= primeiraSemana() ? 'disabled' : ''} aria-label="Semana anterior">${SETA_E}</button>
    <div><h1>${rotSemana(S.ini)}</h1><p class="sub">${subSemana(S)}</p></div>
    <button class="seta" data-acao="semSeg" ${semOff >= 0 ? 'disabled' : ''} aria-label="Semana seguinte">${SETA_D}</button></div>`;
}
const SETA_TILE = '<svg class="tile-seta" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 3l5 5-5 5"/></svg>';
const tile = (cls, alvo, titulo, mk, corpo, acao = 'ir') => `<div class="painel tile ${cls}" data-acao="${acao}" data-v="${alvo}" role="link" tabindex="0" aria-label="${esc(titulo)}: ver o detalhe">
  <span class="tile-cab"><i class="mk ${mk}"></i>${titulo}${SETA_TILE}</span>${corpo}</div>`;
const vazioVista = (titulo, txt, bt) => `<section class="painel vazio-vista"><h2>${titulo}</h2><p class="sub">${txt}</p>${bt ? `<button class="bt pri" data-acao="irLigacoes">${bt}</button>` : ''}</section>`;
const listaLeituras = L => L.length ? `<ul class="leituras">${L.map(x => `<li><span class="glifo">${GLIFO[x.ic]}</span><p>${x.txt}</p></li>`).join('')}</ul>` : '<p class="nota-vazia">Nada de especial a assinalar nesta semana.</p>';
function chipsRange(){ return `<div class="chips" role="group" aria-label="Período">${RANGES.map(([v, t]) => `<button class="chip ${v === evoRange ? 'sel' : ''}" data-acao="range" data-v="${v}" aria-pressed="${v === evoRange}">${t}</button>`).join('')}</div>`; }
function semanasRange(){
  const seg = segundaDe(hojeN()), min = primeiraSemana();
  return Array.from({length: evoRange}, (_, i) => seg - (evoRange - 1 - i) * 7).filter(x => x >= min).map(semana);
}
const dicaSem = (S, linhas) => `<b>Semana de ${rotSemana(S.ini)}</b>${linhas}`;

/* ================= INÍCIO ================= */
function renderInicio(){
  const {S, A} = semanasAtuais(), anim = consumirAnim(), m = S.metas, c = S.comida, t = S.treino, n = S.nota;
  const C = caminhoPeso(), B = balancaSemana(S);
  const topMusc = Object.entries(t.musc).sort((a, b) => b[1] - a[1])[0];
  const pronta = t.diasTreino >= t.alvo;
  const tiles = [];
  // Nota
  tiles.push(`<section class="painel tile ti-nota">${n.total == null ? `<span class="tile-cab"><i class="mk nota"></i>Nota da semana</span><p class="sub">${S.futura ? 'A semana ainda não começou.' : 'Ainda sem dados suficientes.'}</p>`
    : `<div class="nota-mini"><div class="nota-anel-caixa">${svgNota(n, 176, anim)}<div class="nota-num"><b>${anim ? 0 : n.total}</b><span>de 100</span></div></div>
      <div><span class="tile-cab"><i class="mk nota"></i>Nota da semana</span><h2>${n.faixa}</h2><p class="sub">${n.provisoria ? 'Provisória: a semana ainda não fechou.' : A.nota.total != null ? `Na semana anterior, ${A.nota.total}.` : ''}</p>
      <button class="bt pri${anim ? ' faisca' : ''}" data-acao="relato">${ESTRELA_ICO}Ver o relato</button></div></div>`}</section>`);
  // Cultivo (os três tesouros de todas as apps)
  tiles.push(tileCultivo());
  // Comida e água
  if (D.temGarfada){
    tiles.push(tile('ti-comida', 'vComida', 'Comida', 'comida', `<div class="tile-ilu prato-caixa">${svgPrato(c.tem ? c.kcalMed / m.kcal : 0, anim)}<div class="prato-num"><b>${c.tem ? fmtInt(c.kcalMed) : '—'}</b><span>kcal/dia</span></div></div>
      <p class="tile-sub">${c.tem ? `Meta de ${fmtInt(m.kcal)}. <b>${c.naMeta} de ${c.diasReg}</b> dias perto dela.` : 'Sem refeições nesta semana.'}</p>`));
    tiles.push(tile('ti-agua', 'vComida', 'Água', 'agua', `<div class="tile-ilu jarro-caixa">${svgJarro(c.diasAgua ? c.aguaMed / m.agua : 0, anim)}</div>
      <div class="tile-num"><b>${c.diasAgua ? fmt1(c.aguaMed / 1000) : '—'}</b><small>L/dia</small></div><p class="tile-sub">Meta de ${fmt1(m.agua / 1000)} L.</p>`));
  }
  // Treino: a Forja
  if (D.temForja){
    tiles.push(tile('ti-treino', 'vTreino', 'Treino', 'treino', `<div class="tile-ilu cena-forja">${ForjaCena.cena(t.diasTreino / Math.max(1, t.alvo))}</div>
      <div class="forja-legenda"><div class="tile-num"><b>${t.sessoes}</b><small>de ${t.alvo} treinos</small></div><p class="tile-sub"><b>${pronta ? 'Lâmina forjada esta semana' : 'A peça da semana'}</b>. ${pronta ? 'Bom trabalho, ferreiro.' : 'Cada treino molda o ferro.'}</p></div>`, 'irForja'));
    tiles.push(tile('ti-musc', 'vTreino', 'Músculos', 'treino', `<div class="tile-ilu">${svgCorpo(t.musc)}</div>
      <p class="tile-sub">${topMusc && topMusc[1] >= 1 ? `Mais trabalhado: <b>${(MUSC[topMusc[0]] || topMusc[0]).toLowerCase()}</b>, ${fmtInt(topMusc[1])} séries.` : 'Sem treinos nesta semana.'}</p>`));
  }
  // Pele (Nascente)
  if (D.temNascente) tiles.push(tilePele(S, anim));
  // Balança
  if (D.temGarfada){
    const d = B.dif == null ? null : Math.round(B.dif);
    tiles.push(tile('ti-bal', 'vPeso', 'Balança', 'peso', `<div class="tile-ilu">${svgBalanca(B, 340, anim, true)}</div>
      <p class="tile-sub">${d == null ? 'Sem refeições nesta semana.' : Math.abs(d) < 80 ? '<b>Equilíbrio</b> entre o que comes e gastas.' : `<b>${d < 0 ? 'Défice' : 'Excedente'} de ${fmtInt(Math.abs(d))} kcal</b> por dia.`}</p>`));
  }
  // Peso: o trilho
  if (D.pesos.length){
    tiles.push(tile('ti-peso', 'vPeso', 'Peso', 'peso', `<div class="tile-ilu trilho-mini graf-caixa" data-graf="trilhoMini"></div>
      <p class="tile-sub">${C.vazio ? 'Define um peso-objetivo na Garfada ou na Forja para veres o caminho.' : C.chegou ? `<b>Chegaste ao cume</b>: ${fmt1(C.u.t)} kg.` : `<b>${fmtInt(Math.max(0, C.pct) * 100)}% do caminho</b> até aos ${fmt1(C.obj)} kg.${C.eta ? ` Chegada prevista em ${mesAno(C.eta * DIA)}.` : ''}`}</p>`));
  }
  // Recordes
  if (D.temForja){
    const R = t.recordes;
    tiles.push(tile('ti-rec', 'vTreino', 'Recordes', 'treino', `<div class="rec-mini"><div class="tile-ilu">${svgMedalha(R.length)}</div><div><div class="tile-num"><b>${R.length}</b><small>${R.length === 1 ? 'recorde' : 'recordes'}</small></div>
      <p class="tile-sub">${R.length ? `${esc(R[0].nome)}: <b>${R[0].comPeso ? `${fmtKg(R[0].serie.kg)} kg × ${R[0].serie.reps}` : fmtInt(R[0].v) + ' reps'}</b>` : t.melhorou ? `Melhoraste em ${t.melhorou} ${t.melhorou === 1 ? 'exercício' : 'exercícios'}.` : 'Nenhum nesta semana.'}</p></div></div>`));
  }
  $('#vInicio').innerHTML = `<section class="painel vigia-hero" id="vigiaHero" aria-label="Leitura do vigia"></section>
    ${cabSemana(S)}
    <div class="inicio-grid">
      <section class="painel horiz-painel ti-hz"><div class="graf-caixa" data-graf="hz"></div>
        <div class="legenda"><span>${GLIFO.peso.replace('width="22" height="22"', 'width="14" height="14"')}Peso</span><span>${GLIFO.comida.replace('width="22" height="22"', 'width="16" height="16"')}Calorias</span><span><svg width="16" height="2" aria-hidden="true"><rect width="16" height="2" fill="${COR.ouro}"/></svg>Meta</span><span>${GLIFO.treino.replace('width="22" height="22"', 'width="16" height="16"')}Treino</span></div></section>
      ${tiles.join('')}
    </div>`;
  GRAFS.hz = w => svgHorizonte(S, w, anim);
  GRAFS.trilhoMini = w => svgTrilho(C, w, anim, true);
  desenhar($('#vInicio'));
  ForjaCena.animar($('#vInicio .cena-forja'));
  renderVigiaHero(anim);
  if (anim && n.total != null){ contar($('#vInicio .ti-nota .nota-num b'), n.total, 1300); if (n.total >= 85) Ceu.cadente(1900); }
}

/* ================= COMIDA ================= */
function renderComida(){
  const {S, A} = semanasAtuais(), anim = consumirAnim(), m = S.metas, c = S.comida;
  if (!D.temGarfada){ $('#vComida').innerHTML = cabSemana(S) + vazioVista('Comida', 'Liga a Garfada para veres aqui o que comes, dia a dia.', 'Ligar a Garfada'); return; }
  const comp = S.dias.filter(d => d.kcal >= Math.min(1000, m.kcal * .5));
  const kP = c.protMed * 4, kH = c.hidMed * 4, kG = c.gordMed * 9, kT = kP + kH + kG || 1;
  const oP = m.prot * 4, oH = m.hid * 4, oG = m.gord * 9, oT = oP + oH + oG;
  const barraMacros = (p, h, gg, tot, rot) => `<div class="macro-linha"><span>${rot}</span><div class="macro-barra">${[['prot', p], ['hid', h], ['gord', gg]].map(([k, v]) => `<i style="flex:${fx(v / tot * 100)};background:${MACRO_COR[k]}" title="${fmtInt(v / tot * 100)}%"></i>`).join('')}</div><span class="macro-pct">${[p, h, gg].map(v => fmtInt(v / tot * 100) + '%').join(' / ')}</span></div>`;
  const refs = S.dias.flatMap(d => d.refeicoes), cont = {};
  for (const r of refs){ const o = cont[r.prato] || (cont[r.prato] = {n: 0, k: 0}); o.n++; o.k += r.kcal; }
  const topo = Object.entries(cont).sort((a, b) => b[1].n - a[1].n || b[1].k - a[1].k).slice(0, 5);
  const horas = refs.map(r => { const t = new Date(r.ts); return t.getHours() + t.getMinutes() / 60; });
  const hm = h => `${String(Math.floor(h)).padStart(2, '0')}:${String(Math.round((h % 1) * 60)).padStart(2, '0')}`;
  const prim = comp.length ? media(comp.map(d => { const t = new Date(d.refeicoes[0].ts); return t.getHours() + t.getMinutes() / 60; })) : null;
  const ult = comp.length ? media(comp.map(d => { const t = new Date(d.refeicoes[d.refeicoes.length - 1].ts); return t.getHours() + t.getMinutes() / 60; })) : null;
  const sc = c.comps || {};
  const lim = [['Fibra', c.fibraMed, 25, 'g', 'mais'], ['Açúcar', media(comp.map(d => d.acucar)), m.kcal * .1 / 4, 'g', 'menos'], ['Gordura saturada', media(comp.map(d => d.sat)), m.kcal * .1 / 9, 'g', 'menos'], ['Sódio', media(comp.map(d => d.sodio)), 2000, 'mg', 'menos']];
  $('#vComida').innerHTML = `${cabSemana(S)}
  <div class="area-grid">
    <section class="painel largo"><div class="resumo-area">
      <div class="prato-caixa grande-ilu">${svgPrato(c.tem ? c.kcalMed / m.kcal : 0, anim)}<div class="prato-num"><b>${c.tem ? fmtInt(c.kcalMed) : '—'}</b><span>kcal/dia</span></div></div>
      <dl class="stats"><div><dt>Dias na meta</dt><dd>${c.naMeta} <small>de ${c.diasReg}</small></dd></div><div><dt>Proteína</dt><dd>${fmtInt(c.protMed)} <small>de ${m.prot} g</small></dd></div>
        <div><dt>Água</dt><dd>${c.diasAgua ? fmt1(c.aguaMed / 1000) : '—'} <small>de ${fmt1(m.agua / 1000)} L</small></dd></div><div data-dica="${dica(EXPL.comida)}"><dt>Score da Garfada</dt><dd>${c.score != null ? c.score : '—'} <small>de 100</small></dd></div></dl></div></section>
    <section class="painel largo"><h2>Calorias por dia</h2><p class="sub">A faixa dourada é a meta, com 10% de margem. Toca num dia para o ver.</p><div class="graf-caixa" data-graf="kcalDia"></div></section>
    <section class="painel"><h2>Proteína por dia</h2><p class="sub">Meta de ${m.prot} g.</p><div class="graf-caixa" data-graf="protDia"></div></section>
    <section class="painel"><h2>Equilíbrio dos macros</h2><p class="sub">Parte das calorias que vem de cada macro.</p>
      ${c.tem ? `${barraMacros(kP, kH, kG, kT, 'A tua semana')}${barraMacros(oP, oH, oG, oT, 'Objetivo')}
      <ul class="macro-leg">${[['prot', 'Proteína', c.protMed, m.prot], ['hid', 'Hidratos', c.hidMed, m.hid], ['gord', 'Gordura', c.gordMed, m.gord]].map(([k, nome, v, o]) => `<li><i style="background:${MACRO_COR[k]}"></i>${nome}<b>${fmtInt(v)} g</b><small>de ${o} g</small></li>`).join('')}</ul>` : '<p class="nota-vazia">Sem refeições nesta semana.</p>'}</section>
    <section class="painel"><h2>Água, dia a dia</h2><p class="sub">Cada jarro cheio é a meta de ${fmt1(m.agua / 1000)} L.</p>
      <div class="jarros">${S.dias.map(d => `<div class="${d.futuro ? 'futuro' : ''}">${svgJarro(d.agua / m.agua, anim)}<b>${d.agua ? fmt1(d.agua / 1000) : '—'}</b><span>${INICIAIS[d.i]}</span></div>`).join('')}</div></section>
    <section class="painel"><h2>Qualidade</h2><p class="sub">As partes do score da Garfada e os limites do dia.</p>
      ${c.tem ? `<div class="barras-score">${Object.keys(SC_PESOS).filter(k => sc[k] != null).map(k => `<div class="barra-m"><div class="lin"><span>${SC_NOMES[k]}</span><b>${Math.round(sc[k] * 100)}</b></div><div class="trilho"><i style="width:${Math.max(2, sc[k] * 100)}%"></i></div></div>`).join('')}</div>
      <ul class="limites">${lim.map(([nome, v, l, u, bom]) => { const ok = bom === 'mais' ? v >= l : v <= l; return `<li><span>${nome}</span><b>${fmtInt(v)} ${u}</b><small>${bom === 'mais' ? 'mínimo' : 'limite'} ${fmtInt(l)} ${u}</small><i class="estado-lim ${ok ? 'ok' : 'nao'}">${ok ? 'dentro' : bom === 'mais' ? 'abaixo' : 'acima'}</i></li>`; }).join('')}</ul>` : '<p class="nota-vazia">Sem refeições nesta semana.</p>'}</section>
    <section class="painel"><h2>Horário das refeições</h2><p class="sub">Cada anel é um dia, com a segunda-feira ao centro. Os pontos dourados são refeições depois das 22h.</p>
      ${refs.length ? `<div class="relogio-caixa">${svgRelogio(S)}</div><dl class="stats duas"><div><dt>Primeira refeição</dt><dd>${prim != null ? hm(prim) : '—'}</dd></div><div><dt>Última refeição</dt><dd>${ult != null ? hm(ult) : '—'}</dd></div></dl>` : '<p class="nota-vazia">Sem refeições nesta semana.</p>'}</section>
    ${refs.length ? `<section class="painel largo"><div class="painel-topo"><h2>A semana em pratos</h2><span class="sub">${refs.length} ${refs.length === 1 ? 'refeição' : 'refeições'}</span></div><div class="pratos">${refs.map(tilePrato).join('')}</div>
      <ul class="top-pratos">${topo.map(([nome, o]) => `<li><span>${esc(nome)}</span><b>${o.n}×</b><small>${fmtInt(o.k / o.n)} kcal</small></li>`).join('')}</ul></section>` : ''}
    <section class="painel largo"><h2>O que se destacou</h2>${listaLeituras(leituras(S, A).filter(l => l.ic === 'comida'))}</section>
    <section class="painel largo evolucao"><div class="painel-topo"><h2>Ao longo do tempo</h2></div>${chipsRange()}
      <div class="evo-par"><div><h3>Calorias por dia, em média</h3><div class="graf-caixa" data-graf="kcalSem"></div></div><div><h3>Proteína por dia, em média</h3><div class="graf-caixa" data-graf="protSem"></div></div></div>
      <h3>Constância</h3><p class="sub">Cada quadrado é um dia. Quanto mais verde, mais perto da meta; a brasa marca os treinos.</p><div class="rola" data-graf="cal"></div>
      <div class="lev-legenda"><span><i class="q" style="background:${RAMPA[0]}"></i>Sem registo</span><span><i class="q" style="background:${RAMPA[1]}"></i>Longe da meta</span><span><i class="q" style="background:${RAMPA[2]}"></i>A 20%</span><span><i class="q" style="background:${RAMPA[3]}"></i>A 10%</span><span><i class="q" style="background:${RAMPA[4]}"></i>Na meta e com proteína</span><span><i class="mk treino"></i>Treino</span></div></section>
  </div>`;
  const dia = d => ({rot: INICIAIS[d.i], k: d.futuro ? null : d.k, atual: d.hoje && S.emCurso, v: d.futuro ? 0 : null});
  GRAFS.kcalDia = w => svgBarras(S.dias.map(d => Object.assign(dia(d), {v: d.kcal, dica: `<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b>${d.kcal ? `<span><i class="mk comida"></i>${fmtInt(d.kcal)} kcal de ${fmtInt(m.kcal)}</span>` : '<span>Sem registo</span>'}`})), w, 210, {cor: COR.comida, meta: m.kcal, banda: .1, rotMeta: `meta ${fmtInt(m.kcal)}`, anim, todosRot: true, titulo: 'Calorias por dia'});
  GRAFS.protDia = w => svgBarras(S.dias.map(d => Object.assign(dia(d), {v: d.prot, dica: `<b>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</b>${d.kcal ? `<span><i class="mk comida"></i>${fmtInt(d.prot)} g de proteína</span>` : '<span>Sem registo</span>'}`})), w, 180, {cor: COR.comida, meta: m.prot, rotMeta: `meta ${m.prot} g`, fmt: v => fmtInt(v) + ' g', anim, todosRot: true, titulo: 'Proteína por dia'});
  const SS = semanasRange(), it = f => SS.map(X => Object.assign({rot: dataCurta(X.ini), atual: X.emCurso}, f(X)));
  GRAFS.kcalSem = w => svgBarras(it(X => ({v: X.comida.kcalMed, dica: dicaSem(X, X.comida.tem ? `<span><i class="mk comida"></i>${fmtInt(X.comida.kcalMed)} kcal por dia, ${X.comida.diasReg} dias</span>` : '<span>Sem registo</span>')})), w, 180, {cor: COR.comida, meta: m.kcal, rotMeta: 'meta', anim, titulo: 'Calorias por semana'});
  GRAFS.protSem = w => svgBarras(it(X => ({v: X.comida.protMed, dica: dicaSem(X, X.comida.tem ? `<span><i class="mk comida"></i>${fmtInt(X.comida.protMed)} g por dia</span>` : '<span>Sem registo</span>')})), w, 180, {cor: COR.comida, meta: m.prot, rotMeta: 'meta', fmt: v => fmtInt(v) + ' g', anim, titulo: 'Proteína por semana'});
  GRAFS.cal = w => svgCalendario(SS[0].ini, SS.length, w);
  desenhar($('#vComida'));
  const caixa = $('#vComida .rola'); if (caixa) caixa.scrollLeft = caixa.scrollWidth;
}

/* ================= TREINO ================= */
function renderTreino(){
  const {S, A} = semanasAtuais(), anim = consumirAnim(), t = S.treino;
  if (!D.temForja){ $('#vTreino').innerHTML = cabSemana(S) + vazioVista('Treino', 'Liga a Forja para veres aqui os teus treinos.', 'Ligar a Forja'); return; }
  const pronta = t.diasTreino >= t.alvo, maxG = Math.max(24, ...Object.values(t.grupos));
  const sess = t.sess.slice().sort((a, b) => a.inicio - b.inicio);
  const cartao = s => {
    const itens = s.itens.filter(it => !it.fase && it.series.length), vol = itens.reduce((a, it) => a + it.series.reduce((x, y) => x + y.kg * y.reps, 0), 0);
    const ser = itens.reduce((a, it) => a + it.series.length, 0), k = chaveData(new Date(s.inicio)), di = (new Date(s.inicio).getDay() + 6) % 7;
    return `<button class="sessao-cartao" data-acao="dia" data-v="${k}"><span class="sc-dia"><b>${INICIAIS[di]}</b>${new Date(s.inicio).getDate()}</span>
      <span class="sc-corpo"><b>${esc(s.nome || 'Treino')}</b><span>${hora(s.inicio)}, ${fmtHM((s.fim - s.inicio) / 60000)}, ${ser} séries, ${fmtTon(vol)}</span>
      <small>${itens.slice(0, 3).map(it => esc(nomeEx(it.id))).join(', ')}${itens.length > 3 ? ` e mais ${itens.length - 3}` : ''}</small></span>${SETA_TILE}</button>`;
  };
  const tot = t.empurrar + t.puxar;
  $('#vTreino').innerHTML = `${cabSemana(S)}
  <div class="area-grid">
    <section class="painel largo forja-hero"><div class="cena-forja" data-acao="golpe" role="button" tabindex="0" aria-label="Dar uma martelada">${ForjaCena.cena(t.diasTreino / Math.max(1, t.alvo))}</div>
      <div class="forja-texto"><h2>${pronta ? 'Lâmina forjada esta semana' : 'A peça da semana'}</h2><p class="sub">${t.diasTreino} de ${t.alvo} treinos. ${pronta ? 'Bom trabalho, ferreiro.' : 'Cada treino molda o ferro até virar lâmina.'} Toca na bigorna para dar uma martelada.</p></div>
      <dl class="stats"><div><dt>Treinos</dt><dd>${t.sessoes} <small>de ${t.alvo}</small></dd></div><div><dt>Tempo</dt><dd>${fmtHM(t.minutos)}</dd></div><div><dt>Séries</dt><dd>${t.series}</dd></div><div><dt>Volume</dt><dd>${fmtTon(t.volume)}</dd></div></dl></section>
    <section class="painel largo"><h2>Sessões da semana</h2>${sess.length ? `<div class="sessoes">${sess.map(cartao).join('')}</div>` : '<p class="nota-vazia">Sem treinos nesta semana.</p>'}</section>
    <section class="painel"><h2>Músculos</h2><p class="sub">Quanto mais quente o metal, mais séries levou.</p>${svgCorpo(t.musc)}
      <div class="escala" aria-hidden="true"><span>0</span>${CORPO_CORES.map(([a, b]) => `<i style="background:linear-gradient(${a},${b})"></i>`).join('')}<span>16 ou mais séries</span></div></section>
    <section class="painel"><h2>Séries por grupo</h2><p class="sub">Para ganhar músculo, 10 a 20 séries por semana em cada grupo (faixa dourada).</p>
      <ul class="grupos">${GRUPOS.map(([g]) => { const v = t.grupos[g] || 0; return `<li><span>${g}</span><div class="gr-trilho"><i class="gr-faixa" style="left:${10 / maxG * 100}%;width:${10 / maxG * 100}%"></i><i class="gr-valor" style="width:${Math.max(v ? 2 : 0, v / maxG * 100)}%"></i></div><b>${v}</b></li>`; }).join('')}</ul>
      <h3 style="margin-top:18px">Empurrar e puxar</h3><p class="sub">Séries do tronco superior. O ideal anda perto de metade para cada lado.</p>
      ${tot ? `<div class="pp-barra"><i style="flex:${t.empurrar}"></i><i style="flex:${t.puxar}"></i><span class="pp-meio"></span></div><div class="pp-leg"><span>Empurrar <b>${t.empurrar}</b></span><span><b>${t.puxar}</b> Puxar</span></div>` : '<p class="nota-vazia">Sem séries de tronco superior.</p>'}</section>
    <section class="painel">${blocoRecordes(S)}</section>
    <section class="painel"><h2>O que se destacou</h2>${listaLeituras(leituras(S, A).filter(l => l.ic === 'treino'))}</section>
    <section class="painel largo evolucao"><div class="painel-topo"><h2>Ao longo do tempo</h2></div>${chipsRange()}
      <div class="evo-par"><div><h3>Treinos por semana</h3><div class="graf-caixa" data-graf="sessSem"></div></div><div><h3>Volume por semana</h3><div class="graf-caixa" data-graf="volSem"></div></div></div>
      <h3>Força</h3><p class="sub">Força máxima estimada nos exercícios que mais fazes, treino a treino.</p><ul class="forca" id="listaForca"></ul></section>
  </div>`;
  const SS = semanasRange(), it = f => SS.map(X => Object.assign({rot: dataCurta(X.ini), atual: X.emCurso}, f(X)));
  GRAFS.sessSem = w => svgBarras(it(X => ({v: X.treino.sessoes, dica: dicaSem(X, `<span><i class="mk treino"></i>${X.treino.sessoes} ${X.treino.sessoes === 1 ? 'treino' : 'treinos'}, ${fmtHM(X.treino.minutos)}</span>`)})), w, 180, {cor: COR.treino, meta: t.alvo, rotMeta: 'objetivo', max: 5, anim, titulo: 'Treinos por semana'});
  GRAFS.volSem = w => svgBarras(it(X => ({v: X.treino.volume / 1000, dica: dicaSem(X, `<span><i class="mk treino"></i>${fmtTon(X.treino.volume)}, ${X.treino.series} séries</span>`)})), w, 180, {cor: COR.treino, fmt: v => fmt1(v) + ' t', fmtEixo: v => fmtInt(v) + ' t', anim, titulo: 'Volume por semana'});
  desenhar($('#vTreino'));
  ForjaCena.animar($('#vTreino .cena-forja'));
  const desde = new Date(chaveDe(SS[0].ini) + 'T00:00:00').getTime(), cont = [];
  for (const [id, lista] of IDX.hist){ const l = lista.filter(x => x.ts >= desde && x.comPeso); if (l.length >= 2) cont.push([id, l]); }
  cont.sort((a, b) => b[1].length - a[1].length);
  $('#listaForca').innerHTML = cont.length ? cont.slice(0, 6).map(([id, l]) => { const v = l.map(x => x.v), d = (v[v.length - 1] - v[0]) / v[0] * 100;
    return `<li><div><div class="nm">${esc(nomeEx(id))}</div><div class="det"><b>${fmt1(v[v.length - 1])} kg</b>, ${sinal(d)}% em ${l.length} treinos</div></div><div>${svgMini(v, 96, 40, COR.treino)}</div></li>`; }).join('') : '<li class="nota-vazia">Ainda poucos treinos com carga neste período.</li>';
}

/* ================= PESO ================= */
function renderPeso(){
  const {S, A} = semanasAtuais(), anim = consumirAnim(), p = S.peso, h = hojeN();
  if (!D.pesos.length){ $('#vPeso').innerHTML = cabSemana(S) + vazioVista('Peso', 'Regista o peso na Garfada ou na Forja e o caminho até ao objetivo aparece aqui.'); return; }
  const SS = semanasRange(), tend = IDX.tend.filter(q => q.n >= SS[0].ini), tA = tendEm(h), ritmo = ritmoPeso(h), gasto = gastoReal(h - 1);
  const obj = (D.gcfg && +D.gcfg.pesoMeta) || (D.fcfg && +D.fcfg.meta) || 0;
  const recentes = D.pesos.slice(-10).reverse();
  $('#vPeso').innerHTML = `${cabSemana(S)}
  <div class="area-grid">
    <section class="painel largo">${blocoTrilho()}</section>
    ${D.temGarfada ? `<section class="painel">${blocoBalanca(S)}</section>` : ''}
    <section class="painel"><h2>Esta semana</h2>
      <dl class="stats duas"><div data-dica="${dica(TEND)}"><dt>Tendência</dt><dd>${p.tFim != null ? fmt1(p.tFim) + ' <small>kg</small>' : '—'}</dd></div><div><dt>Na semana</dt><dd>${p.delta != null ? sinal(p.delta, fmt1) + ' <small>kg</small>' : '—'}</dd></div>
        <div><dt>Ritmo</dt><dd>${p.ritmo != null ? sinal(p.ritmo, fmt1) + ' <small>kg/sem.</small>' : '—'}</dd></div><div><dt>Pesagens</dt><dd>${p.pesagens.length}</dd></div></dl>
      <ul class="pesagens">${p.pesagens.map(d => `<li><span>${DIAS_SEM[d.i]}, ${dataCurta(d.n)}</span><b>${fmt1(d.peso)} kg</b></li>`).join('') || '<li class="nota-vazia">Sem pesagens nesta semana.</li>'}</ul></section>
    <section class="painel largo evolucao"><div class="painel-topo"><h2>Ao longo do tempo</h2></div>${chipsRange()}
      ${tend.length >= 2 ? `<dl class="stats"><div data-dica="${dica(TEND)}"><dt>Tendência atual</dt><dd>${fmt1(tA.t)} <small>kg</small></dd></div><div><dt>No período</dt><dd>${sinal(tA.t - tend[0].t, fmt1)} <small>kg</small></dd></div>
        <div><dt>Ritmo atual</dt><dd>${ritmo != null ? sinal(ritmo, fmt1) + ' <small>kg/sem.</small>' : '—'}</dd></div><div data-dica="${dica('<b>Gasto real estimado</b><span>A média do que comeste nos últimos 28 dias, corrigida pela energia que a tendência do peso mostra que ganhaste ou perdeste (7700 kcal por kg).</span>')}"><dt>Gasto real</dt><dd>${gasto ? fmtInt(gasto.kcal) + ' <small>kcal/dia</small>' : '—'}</dd></div></dl>
      <h3>Peso e tendência</h3><div class="graf-caixa" data-graf="pesoLinha"></div>` : '<p class="nota-vazia">Precisa de pelo menos duas pesagens neste período.</p>'}
      ${D.temGarfada ? `<h3>Balanço energético por semana</h3><p class="sub">Calorias por dia face ao que gastas: abaixo de zero é défice (azul), acima é excedente (dourado).</p><div class="graf-caixa" data-graf="balSem"></div>` : ''}</section>
    <section class="painel"><h2>O que se destacou</h2>${listaLeituras(leituras(S, A).filter(l => l.ic === 'peso'))}</section>
    <section class="painel"><h2>Pesagens recentes</h2><ul class="pesagens">${recentes.map(q => `<li><span>${diaLongo(numDe(q.d))}</span><b>${fmt1(q.kg)} kg</b><small>${NOME_APP[q.fonte]}</small></li>`).join('')}</ul></section>
  </div>`;
  GRAFS.trilho = w => svgTrilho(caminhoPeso(), w, anim);
  GRAFS.bal = w => svgBalanca(balancaSemana(S), w, anim);
  if (tend.length >= 2) GRAFS.pesoLinha = w => svgPeso(tend, w, 240, obj);
  GRAFS.balSem = w => svgDivergente(SS.map(X => { const B = balancaSemana(X); return {rot: dataCurta(X.ini), atual: X.emCurso, v: B.dif, dica: dicaSem(X, B.dif != null ? `<span><i class="mk ${B.dif < 0 ? 'peso' : 'nota'}"></i>${B.dif < 0 ? 'Défice' : 'Excedente'} de ${fmtInt(Math.abs(B.dif))} kcal por dia</span>` : '<span>Sem registo</span>')}; }), w, 200);
  desenhar($('#vPeso'));
}

/* ================= PELE (Nascente) ================= */
let peleMed = 'geral';
function tilePele(S, anim){
  const rp = ritualDia(chaveDe(hojeN())), sh = shenDia(chaveDe(hojeN())), seq = sequenciaPele(), P = S.pele;
  return tile('ti-pele', 'vPele', 'Pele', 'pele', `<div class="tile-ilu nascente-mini">${svgNascente(rp)}</div>
    <div class="pele-legenda"><div class="pl-rit">${astroMini('m', rp.m ? 'feito' : rp.mP ? 'parcial' : 'falhou')}<span>Manhã<b>${rp.m ? 'feito' : rp.mP ? 'a meio' : 'por fazer'}</b></span></div>
      <div class="pl-rit">${astroMini('n', rp.n ? 'feito' : rp.nP ? 'parcial' : 'falhou')}<span>Noite<b>${rp.n ? 'feito' : rp.nP ? 'a meio' : 'por fazer'}</b></span></div></div>
    <p class="tile-sub"><b>Shen ${sh.total} de 10</b> hoje${seq ? `, ${seq} ${seq === 1 ? 'dia' : 'dias'} seguidos` : ''}.${P && P.adesao != null ? ` Rituais da semana: ${P.feitas} de ${P.possiveis}.` : ''}</p>`);
}
function renderPele(){
  const {S, A} = semanasAtuais(), anim = consumirAnim();
  if (!D.temNascente){ $('#vPele').innerHTML = cabSemana(S) + vazioVista('Pele', 'Liga a Nascente para veres aqui os teus rituais, a evolução da pele e os frascos.', 'Ligar a Nascente'); return; }
  const P = S.pele, Pa = A.pele, rp = ritualDia(chaveDe(hojeN())), r = reinoPele(), seq = sequenciaPele(), fr = frascos(), cruz = cruzamentosPele();
  const sh = shenDia(chaveDe(hojeN())), RS = respiracaoPeriodo(S.ini, Math.min(S.fim, hojeN())), RA = respiracaoPeriodo(S.ini - 7, S.ini - 1), CS = typeof cultivoMirante === 'function' ? cultivoMirante() : null;
  const SS = semanasRange(), ini = SS[0].ini, h = hojeN();
  const ult = D.nas.pele[D.nas.pele.length - 1], av = D.nas.avaliacao;
  const sin30 = pelePeriodo(h - 29, h).sinais, sinais = Object.entries(sin30).sort((a, b) => b[1] - a[1]).slice(0, 6), maxS = sinais.length ? sinais[0][1] : 1;
  const desdeD = p => p.aberto ? Math.max(0, h - numDe(p.aberto)) : null;
  const L = (() => { const K = coletor(); regrasPele(K, P, Pa, S.ini, Math.min(S.fim, h), S.emCurso && S.decorridos < 5, 'semana'); K.ordenar(); return K; })();
  const fotoDe = p => D.nas.fotos[p.id] ? `<img src="${D.nas.fotos[p.id]}" alt="">` : `<span>${esc((TIPO_FRASCO[p.tipo] || p.nome || '?').charAt(0))}</span>`;
  const estadoVal = v => !v ? '' : v.estado === 'expirado' ? '<i class="estado-lim nao">fora da validade</i>' : v.estado === 'expira' ? `<i class="estado-lim aviso">expira em ${v.dias} ${v.dias === 1 ? 'dia' : 'dias'}</i>` : '';
  $('#vPele').innerHTML = `${cabSemana(S)}
  <div class="area-grid">
    <section class="painel largo pele-hero">
      <div class="nascente-grande">${svgNascente(rp, {alto: true})}</div>
      <div class="pele-reino">${CS ? `<div class="pele-cult">${avatarM({r: CS.r, f: CS.pct, mini: true, id: 'pl', tes: Object.assign({ativos: CS.ativos}, CS.hoje), desvio: CS.desvio, obj: CS.objetos})}</div>` : glifoReinoP(r.i)}<div><span class="tile-cab">Shen · o espírito</span><h2>${sh.total} <small>de 10 hoje</small></h2><p class="sub">Os rituais e a respiração da Nascente alimentam o Shen, na testa do teu cultivador${CS ? ` (${esc(CS.reino)})` : ''}.</p>
        <ul class="shen-partes">${sh.partes.map(([n, v, m]) => `<li class="${v ? 'ok' : ''}"><span>${n}</span><b>${v ? '+' + v : '0'}<small> de ${m}</small></b></li>`).join('')}</ul></div></div>
      <dl class="stats"><div><dt>Rituais feitos</dt><dd>${r.pts}</dd></div><div><dt>Dias seguidos</dt><dd>${seq}</dd></div><div><dt>Esta semana</dt><dd>${P.feitas} <small>de ${P.possiveis}</small></dd></div><div><dt>Respiração</dt><dd>${RS.completas} <small>${RS.completas === 1 ? 'sessão' : 'sessões'}</small></dd></div><div><dt>Frascos em uso</dt><dd>${fr.uso.length}</dd></div></dl></section>
    <section class="painel"><h2>Respiração antes de dormir</h2><p class="sub">Os exercícios de respiração e relaxamento feitos na Nascente. Cada dia com uma sessão completa dá 3 de Shen.</p>
      <div class="resp-semana">${Array.from({length: 7}, (_, i) => { const n = S.ini + i, k = chaveDe(n), feito = RS.dias.has(k), fut = n > hojeN(); return `<div class="rs-dia${feito ? ' feito' : ''}${fut ? ' fut' : ''}"><i></i><small>${'SegTerQuaQuiSexSábDom'.slice(i * 3, i * 3 + 3)}</small></div>`; }).join('')}</div>
      <p class="contexto">${RS.completas ? `<b>${RS.completas}</b> ${RS.completas === 1 ? 'sessão completa' : 'sessões completas'} esta semana, <b>${RS.min} min</b> no total${RA.completas ? `; na semana anterior, ${RA.completas}` : ''}.${Object.keys(RS.porEx).length ? ` O mais feito: ${esc(Object.entries(RS.porEx).sort((a, b) => b[1] - a[1])[0][0])}.` : ''}` : 'Ainda sem respiração esta semana. Na Nascente, separador Meditar.'}</p></section>
    <section class="painel"><h2>Rituais da semana</h2><p class="sub">O sol é o ritual da manhã; a lua, o da noite. Meio aceso: começaste mas não terminaste.</p>
      ${htmlRituaisSemana(P)}
      <p class="contexto">${P.adesao != null ? `<b>${fmtInt(P.adesao * 100)}%</b> dos rituais feitos${Pa && Pa.adesao != null ? `; na semana anterior, ${fmtInt(Pa.adesao * 100)}%` : ''}.` : 'A semana ainda não começou.'}</p></section>
    <section class="painel"><h2>O que se destacou</h2>${L.pos.length + L.neg.length ? `<ul class="leituras">${[...L.pos.slice(0, 3).map(x => ['bom', x]), ...L.neg.slice(0, 3).map(x => ['mau', x])].map(([t, x]) => `<li class="${t}"><span class="glifo">${t === 'bom' ? `<svg viewBox="0 0 20 20" width="16" height="16"><path d="${estrela(10, 10, 8)}" fill="${COR.ouro}"/></svg>` : `<svg viewBox="0 0 20 20" width="16" height="16"><path d="M10 2.5L18.5 17H1.5Z" fill="none" stroke="#FF8A7A" stroke-width="1.8" stroke-linejoin="round"/></svg>`}</span><p>${x.txt}</p></li>`).join('')}</ul>` : '<p class="nota-vazia">Nada a destacar nesta semana.</p>'}</section>
    <section class="painel largo"><div class="painel-topo"><h2>A tua pele ao longo do tempo</h2></div>
      <div class="chips" role="group" aria-label="Medida">${PELE_MED.map(([k, n]) => `<button class="chip ${k === peleMed ? 'sel' : ''}" data-acao="peleMed" data-v="${k}" aria-pressed="${k === peleMed}">${n}</button>`).join('')}</div>
      <div class="graf-caixa" data-graf="peleLinha" style="margin-top:12px"></div>
      <div class="lev-legenda"><span><i class="mk pele"></i>Registos da Nascente</span><span><svg width="18" height="2" aria-hidden="true"><rect width="18" height="2" fill="${COR.pele}"/></svg>Média dos últimos 3</span><span><svg width="12" height="10" aria-hidden="true"><path d="M1 9L6 1L11 9Z" fill="${COR.ouro}"/></svg>Frasco que entrou na rotina</span></div>
      ${chipsRange()}</section>
    ${ult || av ? `<section class="painel"><h2>O Mestre da Nascente</h2>
      ${ult ? `<p class="sub">Último registo, ${diaLongo(numDe(ult.d))}</p><div class="medidas-mini">${PELE_MED.map(([k, n, e]) => ult[k] != null ? `<div><span>${n}</span><b>${e[ult[k]]}</b></div>` : '').join('')}</div>
        ${(ult.sinais || []).length ? `<p class="contexto">Sinais: ${esc(ult.sinais.join(', '))}.</p>` : ''}${ult.mestre ? `<blockquote class="mestre">${esc(ult.mestre)}</blockquote>` : ''}` : ''}
      ${av && av.veredicto ? `<h3 class="sec-h">Avaliação da rotina, ${dataCurta(numTs(av.ts))}</h3><p class="mestre-v">${esc(av.veredicto)}</p>${(av.tendencias || []).length ? `<ul class="lista-simples">${av.tendencias.map(t => `<li>${esc(t)}</li>`).join('')}</ul>` : ''}${(av.ajustes || []).length ? `<div class="vh-conselho" style="margin-top:12px"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 2.5a7 7 0 0 0-4 12.7V18h8v-2.8A7 7 0 0 0 12 2.5z" fill="none" stroke="${COR.ouro}" stroke-width="1.6"/></svg><p><b>Ajuste sugerido.</b> ${esc(av.ajustes[0])}</p></div>` : ''}${av.dermatologista ? `<div class="alerta-pele">O Mestre sugere falar com um dermatologista${av.porque ? ': ' + esc(av.porque) : '.'}</div>` : ''}` : ''}</section>` : ''}
    <section class="painel"><h2>Sinais mais frequentes</h2><p class="sub">Nos últimos 30 dias de registos.</p>
      ${sinais.length ? `<ul class="grupos">${sinais.map(([s2, n]) => `<li><span>${esc(s2)}</span><div class="gr-trilho"><i class="gr-valor" style="width:${n / maxS * 100}%;background:${COR.pele}"></i></div><b>${n}</b></li>`).join('')}</ul>` : '<p class="nota-vazia">Sem sinais registados.</p>'}</section>
    ${cruz.length ? `<section class="painel largo"><h2>O que a comida diz da pele</h2><p class="sub">Cruzamento dos registos da Nascente com a Garfada. É uma pista, não uma prova: com mais registos fica mais fiável.</p>
      <div class="cruzamentos">${cruz.map(x => { const mx = Math.max(x.a, x.b) || 1, f = v => x.dec ? fmt1(v) : fmtInt(v);
        return `<div class="cruz${x.forte ? ' forte' : ''}"><h3>${x.titulo}</h3><div class="cz-barras"><div><span>${x.rotA}</span><div class="cz-t"><i style="width:${x.a / mx * 100}%;background:${x.forte ? '#FF8A7A' : COR.nevoa}"></i></div><b>${f(x.a)}</b></div>
          <div><span>${x.rotB}</span><div class="cz-t"><i style="width:${x.b / mx * 100}%;background:${COR.pele}"></i></div><b>${f(x.b)}</b></div></div><p class="cz-un">${x.un}, com ${x.nA} e ${x.nB} registos</p><p class="contexto">${x.txt}</p></div>`; }).join('')}</div></section>` : ''}
    <section class="painel largo"><div class="painel-topo"><h2>Frascos</h2><span class="sub">${fr.uso.length} em uso${fr.pausa.length ? `, ${fr.pausa.length} em pausa` : ''}</span></div>
      <ul class="frascos">${fr.uso.concat(fr.pausa).map(p => { const v = validadeFrasco(p), dd = desdeD(p);
        return `<li><span class="fr-foto">${fotoDe(p)}</span><div class="fr-t"><b>${esc(p.nome)}</b><span>${esc([p.marca, TIPO_FRASCO[p.tipo]].filter(Boolean).join(' · '))}${p.pausa ? ' · em pausa' : ''}</span>
          <div class="fr-at">${(p.ativos || []).slice(0, 4).map(a2 => `<i>${esc(ATIVO_C[a2] || a2)}</i>`).join('')}</div></div><div class="fr-d">${dd != null ? `<small>aberto há ${dd} ${dd === 1 ? 'dia' : 'dias'}</small>` : ''}${estadoVal(v)}</div></li>`; }).join('')}</ul>
      ${fr.acabados.length ? `<details class="mais"><summary>Acabados (${fr.acabados.length})</summary><ul class="frascos">${fr.acabados.slice(0, 12).map(p => `<li><span class="fr-foto">${fotoDe(p)}</span><div class="fr-t"><b>${esc(p.nome)}</b><span>Acabou a ${dataCurta(numDe(p.fim))}${p.recomprar === false ? ', não recomprar' : p.recomprar ? ', recomprar' : ''}</span></div></li>`).join('')}</ul></details>` : ''}</section>
    <section class="painel largo evolucao"><div class="painel-topo"><h2>Constância ao longo do tempo</h2></div><p class="sub">Percentagem dos rituais feitos em cada semana.</p><div class="graf-caixa" data-graf="peleAdesao"></div></section>
  </div>`;
  GRAFS.peleLinha = w => svgPeleLinha(peleMed, ini, w);
  GRAFS.peleAdesao = w => svgBarras(SS.map(X => ({rot: dataCurta(X.ini), atual: X.emCurso, v: X.pele && X.pele.adesao != null ? X.pele.adesao * 100 : 0,
    dica: `<b>Semana de ${rotSemana(X.ini)}</b><span><i class="mk pele"></i>${X.pele ? `${X.pele.feitas} de ${X.pele.possiveis} rituais` : 'Sem dados'}</span>`})), w, 180, {cor: COR.pele, max: 100, meta: 85, rotMeta: 'boa constância', fmt: v => fmtInt(v) + '%', fmtEixo: v => v + '%', anim, titulo: 'Constância dos rituais por semana'});
  desenhar($('#vPele'));
}
