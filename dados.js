'use strict';
/* Mirante — camada de dados.
   Lê, sem nunca alterar, os dados da Garfada, da Forja e da Nascente, por dois caminhos:
   1) neste dispositivo: as três apps vivem em danielgog7.github.io, por isso partilham o armazenamento do navegador;
   2) nos repositórios privados do GitHub onde cada app sincroniza (árvore + blobs, com cache por sha).
   Funde as duas origens com as mesmas regras das apps: ganha a versão mais recente e os apagados deixam marca. */

const LS = {
  get(k, d){ try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch(e){ return d; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} }
};
// As chaves do Mirante têm prefixo próprio: nunca tocam nas da Garfada (sem prefixo) nem nas da Forja ("forja.").
const ML = { get: (k, d) => LS.get('mirante.' + k, d), set: (k, v) => LS.set('mirante.' + k, v) };

const NOME_APP = {garfada: 'Garfada', forja: 'Forja', nascente: 'Nascente'};
const APPS = ['garfada', 'forja', 'nascente'];
const ehObj = o => !!o && typeof o === 'object' && !Array.isArray(o);
const ehData = k => /^\d{4}-\d{2}-\d{2}$/.test(k);
const num = v => { const x = parseFloat(v); return isFinite(x) ? x : 0; };

/* ---------- Cache própria (IndexedDB "mirante") ---------- */
const MDB = (() => {
  let p;
  const abrir = () => p || (p = new Promise((res, rej) => {
    const r = indexedDB.open('mirante', 1);
    r.onupgradeneeded = () => {
      const db = r.result;
      if (!db.objectStoreNames.contains('blobs')) db.createObjectStore('blobs');
      if (!db.objectStoreNames.contains('kv')) db.createObjectStore('kv');
    };
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  }));
  const tx = async (loja, modo, fn) => {
    const db = await abrir();
    return new Promise((res, rej) => {
      const t = db.transaction(loja, modo), q = fn(t.objectStore(loja));
      t.oncomplete = () => res(q ? q.result : undefined);
      t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
    });
  };
  const seguro = fn => async (...a) => { try { return await fn(...a); } catch(e){ return undefined; } };
  return {
    get: seguro((loja, k) => tx(loja, 'readonly', s => s.get(k))),
    put: seguro((loja, k, v) => tx(loja, 'readwrite', s => s.put(v, k))),
    del: seguro((loja, k) => tx(loja, 'readwrite', s => s.delete(k))),
    limpar: seguro(async () => { await tx('blobs', 'readwrite', s => s.clear()); await tx('kv', 'readwrite', s => s.clear()); })
  };
})();

/* ---------- Leitura local (mesmo navegador) ---------- */
// Abre a base da Garfada só se já existir. Se não existir, o pedido de criação é cancelado,
// para não deixar uma base vazia que estragaria a Garfada quando fosse instalada neste dispositivo.
function lerIDBGarfada(){
  return new Promise(res => {
    if (!('indexedDB' in window)) return res(null);
    let r, criou = false;
    try { r = indexedDB.open('garfada'); } catch(e){ return res(null); }
    r.onupgradeneeded = () => { criou = true; try { r.transaction.abort(); } catch(e){} };
    r.onerror = () => res(null);
    r.onblocked = () => res(null);
    r.onsuccess = () => {
      const db = r.result;
      if (criou || !db.objectStoreNames.contains('refeicoes')){ db.close(); return res(null); }
      try {
        const q = db.transaction('refeicoes', 'readonly').objectStore('refeicoes').getAll();
        q.onsuccess = () => { db.close(); res(q.result || []); };
        q.onerror = () => { db.close(); res(null); };
      } catch(e){ db.close(); res(null); }
    };
  });
}
// Fotos dos frascos da Nascente (miniaturas), só se a base já existir.
function lerFotosNascente(){
  return new Promise(res => {
    if (!('indexedDB' in window)) return res({});
    let r, criou = false;
    try { r = indexedDB.open('nascente'); } catch(e){ return res({}); }
    r.onupgradeneeded = () => { criou = true; try { r.transaction.abort(); } catch(e){} };
    r.onerror = () => res({}); r.onblocked = () => res({});
    r.onsuccess = () => {
      const db = r.result;
      if (criou || !db.objectStoreNames.contains('fotos')){ db.close(); return res({}); }
      try {
        const st = db.transaction('fotos', 'readonly').objectStore('fotos'), out = {}, q = st.openCursor();
        q.onsuccess = () => { const c = q.result; if (!c){ db.close(); return res(out); } if (typeof c.value === 'string' && !String(c.key).includes(':')) out[c.key] = c.value; c.continue(); };
        q.onerror = () => { db.close(); res(out); };
      } catch(e){ db.close(); res({}); }
    };
  });
}
const pareceCfgGarfada = c => ehObj(c) && ('atividade' in c || 'perfilOk' in c || 'usarTdee' in c) && ('sexo' in c || 'objetivo' in c);
const parecePesosGarfada = p => ehObj(p) && Object.keys(p).every(ehData);

async function lerLocal(){
  const gCfg = LS.get('cfg', null), gPesos = LS.get('pesos', null), gAgua = LS.get('agua', null);
  const refeicoes = await lerIDBGarfada();
  const garfada = {
    refeicoes: refeicoes || [],
    cfg: pareceCfgGarfada(gCfg) ? gCfg : null,
    agua: ehObj(gAgua) && Object.keys(gAgua).every(ehData) ? gAgua : {},
    aguaTs: LS.get('aguaTs', {}) || {},
    pesos: parecePesosGarfada(gPesos) ? gPesos : {},
    apagados: LS.get('apagados', {}) || {}
  };
  garfada.existe = !!(refeicoes && refeicoes.length) || !!garfada.cfg || Object.keys(garfada.pesos).length > 0;
  const fT = LS.get('forja.treinos', null);
  const forja = {
    treinos: Array.isArray(fT) ? fT : [],
    cfg: LS.get('forja.cfg', null),
    apagados: LS.get('forja.apagados', {}) || {},
    pesos: LS.get('forja.pesos', []) || [],
    pesosApag: LS.get('forja.pesosApag', {}) || {}
  };
  forja.existe = forja.treinos.length > 0 || ehObj(forja.cfg) || forja.pesos.length > 0;
  const nP = LS.get('nascente.produtos', null), nR = LS.get('nascente.registos', null), nPe = LS.get('nascente.pele', null), nRe = LS.get('nascente.respiracao', null);
  const nascente = {
    cfg: ehObj(LS.get('nascente.cfg', null)) ? LS.get('nascente.cfg', null) : null,
    produtos: Array.isArray(nP) ? nP : [], registos: ehObj(nR) ? nR : {}, pele: Array.isArray(nPe) ? nPe : [], respiracao: Array.isArray(nRe) ? nRe : [],
    apagados: LS.get('nascente.apagados', {}) || {}, revisao: LS.get('nascente.revisao', null), avaliacao: LS.get('nascente.avaliacao', null)
  };
  nascente.existe = nascente.produtos.length > 0 || Object.keys(nascente.registos).length > 0 || nascente.pele.length > 0 || nascente.respiracao.length > 0;
  nascente.fotos = nascente.existe ? await lerFotosNascente() : {};
  return {garfada, forja, nascente};
}

/* ---------- Credenciais ----------
   Por ordem: a ligação própria que puseres no Mirante para essa app; a da própria app neste dispositivo;
   e, se nenhuma existir (por exemplo no PC, onde as apps não estão configuradas), o token do Mirante (repositório mirante-dados),
   com os nomes dos repositórios que o outro dispositivo lá deixou. */
function credenciaisDiretas(){
  const proprias = ML.get('fontes', {}) || {};
  const das = {garfada: LS.get('gh', null), forja: LS.get('forja.gh', null), nascente: LS.get('nascente.gh', null)};
  const out = {};
  for (const app of APPS){
    const p = proprias[app] || {}, a = ehObj(das[app]) ? das[app] : {};
    if (p.token && p.dono && p.repo) out[app] = {dono: p.dono, repo: p.repo, token: p.token, origem: 'mirante'};
    else if (a.token && a.dono && a.repo) out[app] = {dono: a.dono, repo: a.repo, token: a.token, origem: 'app'};
    else out[app] = null;
  }
  return out;
}
function credenciais(){
  const out = credenciaisDiretas(), g = ghMirante(), repos = ML.get('repos', {}) || {};
  if (g) for (const app of APPS) if (!out[app]){
    const r = ehObj(repos[app]) && repos[app].dono && repos[app].repo ? repos[app] : {dono: g.dono, repo: app + '-dados'};
    out[app] = {dono: r.dono, repo: r.repo, token: g.token, origem: 'mirante-dados', adivinhado: !ehObj(repos[app])};
  }
  return out;
}

/* ---------- GitHub ---------- */
const enc = encodeURIComponent;
async function ghFetch(c, caminho, cab){
  try {
    return await fetch(`https://api.github.com/repos/${enc(c.dono)}/${enc(c.repo)}${caminho}`, {
      cache: 'no-store',
      headers: Object.assign({'Authorization': 'Bearer ' + c.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}, cab || {})
    });
  } catch(e){ throw new Error('Sem ligação ao GitHub.'); }
}
function erroGH(r){
  if (r.status === 401) return new Error('Token do GitHub inválido ou expirado.');
  if (r.status === 403 && r.headers.get('x-ratelimit-remaining') === '0') return new Error('Limite de pedidos do GitHub atingido. Tenta daqui a uma hora.');
  if (r.status === 403) return new Error('O token não tem permissão de leitura neste repositório.');
  if (r.status === 404) return new Error('Repositório não encontrado, ou o token não tem acesso a ele.');
  return new Error('Erro do GitHub: ' + r.status);
}
async function arvoreRepo(c){
  const r = await ghFetch(c, '');
  if (!r.ok) throw erroGH(r);
  const info = await r.json();
  const r2 = await ghFetch(c, `/git/trees/${enc(info.default_branch || 'main')}?recursive=1`);
  if (r2.status === 409 || r2.status === 404) return [];   // repositório vazio
  if (!r2.ok) throw erroGH(r2);
  return ((await r2.json()).tree || []).filter(x => x.type === 'blob');
}
async function lerBlob(c, sha){
  const r = await ghFetch(c, '/git/blobs/' + sha, {'Accept': 'application/vnd.github.raw+json'});
  if (!r.ok) throw erroGH(r);
  return JSON.parse(await r.text());
}
const RX = {
  dia: /^dias\/\d{4}-\d{2}\/(\d{4}-\d{2}-\d{2})\.json$/,
  mes: /^treinos\/(\d{4}-\d{2})\.json$/
};
function tipoRepo(itens){
  if (itens.some(x => x.path === 'nascente.json')) return 'nascente';
  if (itens.some(x => RX.dia.test(x.path))) return 'garfada';
  if (itens.some(x => RX.mes.test(x.path))) return 'forja';
  return itens.length ? 'outro' : 'vazio';
}
// Só interessam os ficheiros de dados recentes (por omissão, 400 dias) e os de perfil e peso.
function relevante(app, path, limite){
  if (app === 'nascente') return path === 'nascente.json';
  if (path === 'perfil.json' || path === 'pesos.json') return true;
  if (app === 'garfada'){ const m = RX.dia.exec(path); return !!m && m[1] >= limite; }
  const m = RX.mes.exec(path); return !!m && m[1] >= limite.slice(0, 7);
}
async function emParalelo(lista, n, fn){
  const fila = lista.slice();
  const trab = async () => { while (fila.length) await fn(fila.shift()); };
  await Promise.all(Array.from({length: Math.min(n, fila.length)}, trab));
}
const chaveRepo = (app, c) => `${app}|${c.dono}/${c.repo}`;
// Devolve o que ficou guardado da última leitura, sem rede (para abrir logo, mesmo offline).
async function remotoDaCache(app, c){
  if (!c) return null;
  const base = chaveRepo(app, c), lista = await MDB.get('kv', 'lista|' + base);
  if (!Array.isArray(lista)) return null;
  const ficheiros = new Map();
  for (const path of lista){ const b = await MDB.get('blobs', base + '|' + path); if (b) ficheiros.set(path, b.dados); }
  return {ficheiros, quando: (await MDB.get('kv', 'quando|' + base)) || 0};
}
async function lerRemoto(app, c, progresso){
  const itens = await arvoreRepo(c), tipo = tipoRepo(itens);
  if (tipo !== app && tipo !== 'vazio' && tipo !== 'outro')
    throw new Error(`Este repositório tem dados da ${NOME_APP[tipo]}, não da ${NOME_APP[app]}.`);
  const limite = new Date(Date.now() - 400 * 864e5).toISOString().slice(0, 10);
  const uteis = itens.filter(x => relevante(app, x.path, limite)), base = chaveRepo(app, c);
  const ficheiros = new Map(), faltam = [];
  for (const x of uteis){
    const b = await MDB.get('blobs', base + '|' + x.path);
    if (b && b.sha === x.sha) ficheiros.set(x.path, b.dados); else faltam.push(x);
  }
  let feitos = 0;
  await emParalelo(faltam, 6, async x => {
    const dados = await lerBlob(c, x.sha);
    ficheiros.set(x.path, dados);
    await MDB.put('blobs', base + '|' + x.path, {sha: x.sha, dados});
    if (progresso) progresso(++feitos, faltam.length);
  });
  await MDB.put('kv', 'lista|' + base, uteis.map(x => x.path));
  const quando = Date.now(); await MDB.put('kv', 'quando|' + base, quando);
  return {ficheiros, quando, novos: faltam.length};
}
async function testarRepo(app, c){
  const itens = await arvoreRepo(c), tipo = tipoRepo(itens);
  if (tipo !== app && tipo !== 'vazio' && tipo !== 'outro') throw new Error(`Este repositório tem dados da ${NOME_APP[tipo]}, não da ${NOME_APP[app]}.`);
  return tipo;
}

/* ---------- O próprio Mirante no GitHub (repositório mirante-dados) ----------
   Com um só token (com acesso ao mirante-dados e aos repositórios das três apps), o Mirante funciona em qualquer dispositivo.
   No mirante.json vão só os nomes dos repositórios das apps e as leituras do vigia: nunca tokens nem chaves.
   É o único sítio onde o Mirante escreve. */
const FICH_M = 'mirante.json';
const SYNC_M = {estado: 'off', quando: 0, erro: ''};
function ghMirante(){ const g = ML.get('gh', null); return ehObj(g) && g.token && g.dono && g.repo ? g : null; }
const b64enc = s => { const b = new TextEncoder().encode(s); let t = ''; for (let i = 0; i < b.length; i += 8192) t += String.fromCharCode(...b.subarray(i, i + 8192)); return btoa(t); };
const b64dec = s => new TextDecoder().decode(Uint8Array.from(atob(s.replace(/\s/g, '')), c => c.charCodeAt(0)));
const canon = v => Array.isArray(v) ? '[' + v.map(canon).join(',') + ']' : ehObj(v) ? '{' + Object.keys(v).filter(k => v[k] !== undefined).sort().map(k => JSON.stringify(k) + ':' + canon(v[k])).join(',') + '}' : JSON.stringify(v === undefined ? null : v);
async function ghPedido(c, caminho, opt = {}){
  try {
    return await fetch(`https://api.github.com/repos/${enc(c.dono)}/${enc(c.repo)}${caminho}`, Object.assign({cache: 'no-store'}, opt, {
      headers: Object.assign({'Authorization': 'Bearer ' + c.token, 'Accept': 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28'}, opt.headers || {})}));
  } catch(e){ throw new Error('Sem ligação ao GitHub.'); }
}
async function lerMiranteRemoto(c){
  const r = await ghPedido(c, '/contents/' + FICH_M);
  if (r.status === 404){ const r0 = await ghPedido(c, ''); if (!r0.ok) throw erroGH(r0); return null; }   // repositório vazio ou ficheiro por criar
  if (!r.ok) throw erroGH(r);
  const j = await r.json(); if (Array.isArray(j)) return null;
  let txt = j.content ? b64dec(j.content) : '';
  if (!txt){ const r2 = await ghPedido(c, '/contents/' + FICH_M, {headers: {'Accept': 'application/vnd.github.raw+json'}}); if (!r2.ok) throw erroGH(r2); txt = await r2.text(); }
  let dados; try { dados = JSON.parse(txt); } catch(e){ throw new Error('O mirante.json no GitHub está estragado.'); }
  if (!ehObj(dados) || (dados.app && dados.app !== 'mirante')) throw new Error('Este repositório não é o do Mirante.');
  return {sha: j.sha, dados};
}
async function escreverMiranteRemoto(c, dados, sha){
  const corpo = {message: 'Mirante: ligações e leituras do vigia', content: b64enc(JSON.stringify(dados))}; if (sha) corpo.sha = sha;
  const r = await ghPedido(c, '/contents/' + FICH_M, {method: 'PUT', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(corpo)});
  if (r.status === 409 || r.status === 422) return {conflito: true};
  if (r.status === 403 || r.status === 404) throw new Error(`O token não consegue escrever no ${c.repo}: precisa de "Contents: Read and write" nesse repositório.`);
  if (!r.ok) throw erroGH(r);
  return {sha: (await r.json()).content.sha};
}
// O que este dispositivo sabe e vale a pena ter nos outros.
function reposConhecidos(){
  const out = Object.assign({}, ML.get('repos', {}) || {}), d = credenciaisDiretas();
  for (const app of APPS) if (d[app]) out[app] = {dono: d[app].dono, repo: d[app].repo};
  return out;
}
function estadoMirante(){
  return {app: 'mirante', versao: 1, repos: reposConhecidos(), vigia: ML.get('vigia', {}) || {}, vigiaIA: ML.get('vigiaIA', null), cronicas: ML.get('cronicas', {}) || {}};
}
function fundirMirante(rem){
  if (!ehObj(rem)) return;
  // Repositórios: os que este dispositivo conhece diretamente mandam; os outros vêm do GitHub.
  const d = credenciaisDiretas(), repos = Object.assign({}, ML.get('repos', {}) || {});
  for (const app of APPS){ const r = ehObj(rem.repos) ? rem.repos[app] : null; if (!d[app] && ehObj(r) && r.dono && r.repo) repos[app] = {dono: String(r.dono), repo: String(r.repo)}; }
  ML.set('repos', repos);
  // Leituras do vigia: em cada semana ganha a mais recente; ficam as 20 últimas.
  const v = Object.assign({}, ML.get('vigia', {}) || {});
  for (const [k, x] of Object.entries(ehObj(rem.vigia) ? rem.vigia : {})) if (ehObj(x) && x.r && (!ehObj(v[k]) || (x.ts || 0) > (v[k].ts || 0))) v[k] = x;
  const limpo = {}; for (const k of Object.keys(v).sort().slice(-20)) limpo[k] = v[k];
  ML.set('vigia', limpo);
  // Crónicas do mês: ganha a mais recente de cada mês.
  const cr = Object.assign({}, ML.get('cronicas', {}) || {});
  for (const [m, x] of Object.entries(ehObj(rem.cronicas) ? rem.cronicas : {})) if (ehObj(x) && x.texto && (!ehObj(cr[m]) || (x.ts || 0) > (cr[m].ts || 0))) cr[m] = x;
  ML.set('cronicas', cr);
  const a = ML.get('vigiaIA', null), b = rem.vigiaIA;
  if (ehObj(b) && b.r && (!ehObj(a) || (b.ts || 0) > (a.ts || 0))) ML.set('vigiaIA', b);
}
let syncEmCurso = null, tSyncM = null;
function agendarSyncMirante(ms = 2500){ if (!ghMirante()) return; clearTimeout(tSyncM); tSyncM = setTimeout(() => sincronizarMirante().catch(() => {}), ms); }
// Lê o mirante.json, junta-o ao que há aqui e grava de volta se este dispositivo tiver novidades. Devolve true se mudou alguma coisa aqui.
function sincronizarMirante(){
  const c = ghMirante();
  if (!c){ Object.assign(SYNC_M, {estado: 'off', erro: ''}); return Promise.resolve(false); }
  if (syncEmCurso) return syncEmCurso;
  SYNC_M.estado = 'a ler';
  syncEmCurso = (async () => {
    try {
      const antes = canon(estadoMirante());
      for (let tentativa = 0; tentativa < 3; tentativa++){
        const rem = await lerMiranteRemoto(c);
        if (rem) fundirMirante(rem.dados);
        const novo = estadoMirante();
        const remSemTs = rem ? Object.assign({}, rem.dados, {ts: undefined}) : null;
        if (!remSemTs || canon(remSemTs) !== canon(novo)){
          const w = await escreverMiranteRemoto(c, Object.assign({ts: Date.now()}, novo), rem && rem.sha);
          if (w.conflito) continue;
        }
        Object.assign(SYNC_M, {estado: 'ok', quando: Date.now(), erro: ''});
        return canon(estadoMirante()) !== antes;
      }
      throw new Error('O GitHub recusou a gravação três vezes seguidas. Tenta daqui a pouco.');
    } catch(e){ Object.assign(SYNC_M, {estado: 'erro', erro: e.message || 'Erro ao sincronizar o Mirante.'}); throw e; }
    finally { syncEmCurso = null; }
  })();
  return syncEmCurso;
}

/* ---------- Fusão ---------- */
function fundirGarfada(local, remoto){
  const ref = new Map(), apag = {}, agua = {};
  const pegar = e => { if (!ehObj(e) || !e.id || !ehData(e.data || '')) return; const a = ref.get(e.id); if (!a || (e.atualizado || 0) > (a.atualizado || 0)) ref.set(e.id, e); };
  (local.refeicoes || []).forEach(pegar);
  for (const [id, v] of Object.entries(local.apagados || {})) apag[id] = Math.max(apag[id] || 0, (v && v.ts) || 0);
  for (const [k, ml] of Object.entries(local.agua || {})) agua[k] = {ml: num(ml), ts: (local.aguaTs || {})[k] || 0};
  let cfg = local.cfg ? Object.assign({}, local.cfg) : null, cfgTs = (local.cfg && local.cfg.ts) || 0;
  const pesos = {};
  for (const [k, v] of Object.entries(local.pesos || {})) if (ehObj(v)) pesos[k] = v;
  if (remoto) for (const [p, d] of remoto.ficheiros){
    if (!ehObj(d)) continue;
    if (RX.dia.test(p)){
      (d.refeicoes || []).forEach(pegar);
      for (const [id, ts] of Object.entries(d.apagados || {})) apag[id] = Math.max(apag[id] || 0, ts || 0);
      if (d.agua && ehData(d.data || '') && (!agua[d.data] || (d.agua.ts || 0) > agua[d.data].ts)) agua[d.data] = {ml: num(d.agua.ml), ts: d.agua.ts || 0};
    } else if (p === 'perfil.json' && ehObj(d.cfg) && (d.ts || 0) > cfgTs){
      cfg = Object.assign({}, cfg || {}, d.cfg); cfgTs = d.ts || 0;
    } else if (p === 'pesos.json' && ehObj(d.pesos)){
      for (const [k, v] of Object.entries(d.pesos)) if (ehObj(v) && (!pesos[k] || (pesos[k].ts || 0) < (v.ts || 0))) pesos[k] = v;
    }
  }
  const refeicoes = [], aguaCha = {};
  for (const e of ref.values()){
    if (apag[e.id] && apag[e.id] >= (e.atualizado || 0)) continue;
    const f = num(e.fator) || 1, b = e.base || {}, mi = e.micros || {};
    // Chás e infusões contam para a água do dia, como na Garfada (campo aguaMl de cada refeição).
    if (num(e.aguaMl) > 0) aguaCha[e.data] = (aguaCha[e.data] || 0) + num(e.aguaMl) * f;
    refeicoes.push({
      id: e.id, ts: e.ts || 0, data: e.data, ref: e.refeicao || '', prato: String(e.prato || 'Refeição'), thumb: e.thumb || '', conf: e.confianca || '',
      kcal: num(b.kcal) * f, prot: num(b.prot) * f, hid: num(b.hid) * f, gord: num(b.gord) * f,
      fibra: num(b.fibra) * f, acucar: num(b.acucar) * f, sat: num(b.sat) * f, sodio: num(b.sodio) * f,
      potassio: num(mi.potassio) * f, calcio: num(mi.calcio) * f, ferro: num(mi.ferro) * f, vitc: num(mi.vitc) * f
    });
  }
  const aguaMl = {}, cha = {};
  for (const k of new Set([...Object.keys(agua), ...Object.keys(aguaCha)])){
    const t = ((agua[k] && agua[k].ml) || 0) + Math.round(aguaCha[k] || 0);
    if (t > 0) aguaMl[k] = t;
    if (aguaCha[k]) cha[k] = Math.round(aguaCha[k]);
  }
  const listaPesos = [];
  for (const [d, v] of Object.entries(pesos)) if (ehData(d) && v.kg != null && num(v.kg) > 20) listaPesos.push({d, kg: num(v.kg), ts: v.ts || 0});
  return {refeicoes, agua: aguaMl, aguaCha: cha, cfg, pesos: listaPesos};
}

function fundirForja(local, remoto){
  const tr = new Map(), apag = {};
  const pegar = t => { if (!ehObj(t) || !t.id || !t.inicio || !Array.isArray(t.itens)) return; const a = tr.get(t.id); if (!a || (t.atualizado || 0) > (a.atualizado || 0)) tr.set(t.id, t); };
  (local.treinos || []).forEach(pegar);
  for (const [id, v] of Object.entries(local.apagados || {})) apag[id] = Math.max(apag[id] || 0, (v && v.ts) || 0);
  let cfg = ehObj(local.cfg) ? Object.assign({}, local.cfg) : null, cfgTs = (cfg && cfg.ts) || 0;
  const pesos = new Map(), pApag = Object.assign({}, local.pesosApag || {});
  for (const p of Array.isArray(local.pesos) ? local.pesos : []) if (p && p.d) pesos.set(p.d, p);
  if (remoto) for (const [p, d] of remoto.ficheiros){
    if (!ehObj(d)) continue;
    if (RX.mes.test(p)){
      (d.treinos || []).forEach(pegar);
      for (const [id, ts] of Object.entries(d.apagados || {})) apag[id] = Math.max(apag[id] || 0, ts || 0);
    } else if (p === 'perfil.json' && ehObj(d.cfg) && (d.ts || 0) > cfgTs){
      cfg = Object.assign({}, cfg || {}, d.cfg); cfgTs = d.ts || 0;
    } else if (p === 'pesos.json'){
      for (const [dd, ts] of Object.entries(d.apagados || {})) if (!pApag[dd] || pApag[dd] < ts) pApag[dd] = ts;
      for (const x of d.pesos || []) if (x && x.d && (!pesos.has(x.d) || (pesos.get(x.d).ts || 0) < (x.ts || 0))) pesos.set(x.d, x);
    }
  }
  const treinos = [...tr.values()].filter(t => !(apag[t.id] && apag[t.id] >= (t.atualizado || 0)))
    .map(t => ({id: t.id, inicio: t.inicio, fim: t.fim || t.inicio, tipo: t.tipo || '', nome: t.nome || '', itens: t.itens.map(it => ({id: it.id, fase: it.fase || null, series: (it.series || []).map(s => ({kg: num(s.kg), reps: num(s.reps)}))}))}))
    .sort((a, b) => a.inicio - b.inicio);
  const listaPesos = [];
  for (const [d, x] of pesos) if (ehData(d) && !(pApag[d] && pApag[d] >= (x.ts || 0)) && num(x.kg) > 20) listaPesos.push({d, kg: num(x.kg), ts: x.ts || 0});
  return {treinos, cfg, pesos: listaPesos};
}

// As duas apps registam peso. Cada app resolve primeiro os seus registos; no mesmo dia ganha o mais recente.
function fundirPesos(g, f){
  const m = new Map();
  for (const [lista, fonte] of [[g, 'garfada'], [f, 'forja']])
    for (const p of lista){ const a = m.get(p.d); if (!a || p.ts > a.ts) m.set(p.d, {d: p.d, kg: p.kg, ts: p.ts, fonte}); }
  return [...m.values()].sort((a, b) => a.d < b.d ? -1 : 1);
}

function fundirNascente(local, remoto){
  const L = local || {}, apag = Object.assign({}, L.apagados || {});
  let produtos = (L.produtos || []).slice(), pele = (L.pele || []).slice(), registos = Object.assign({}, L.registos || {}), respiracao = (L.respiracao || []).slice();
  let cfg = ehObj(L.cfg) ? Object.assign({}, L.cfg) : null, revisao = L.revisao || null, avaliacao = L.avaliacao || null;
  const r = remoto && remoto.ficheiros.get('nascente.json');
  if (ehObj(r) && r.app === 'nascente'){
    for (const [id, ts] of Object.entries(r.apagados || {})) if (!apag[id] || apag[id] < ts) apag[id] = ts;
    const porId = (loc, rem, campo) => { for (const x of rem || []){ if (!ehObj(x) || !x.id) continue; const i = loc.findIndex(o => o.id === x.id); if (i < 0) loc.push(x); else if ((x[campo] || 0) > (loc[i][campo] || 0)) loc[i] = x; } return loc; };
    produtos = porId(produtos, r.produtos, 'atualizado'); pele = porId(pele, r.pele, 'ts'); respiracao = porId(respiracao, r.respiracao, 'ts');
    for (const [k, v] of Object.entries(r.registos || {})) if (ehObj(v) && (!registos[k] || (v.ts || 0) > (registos[k].ts || 0))) registos[k] = v;
    if (ehObj(r.cfg) && (r.cfg.ts || 0) > ((cfg && cfg.ts) || 0)) cfg = Object.assign({}, cfg || {}, r.cfg);
    if (r.revisao && (!revisao || r.revisao.ts > revisao.ts)) revisao = r.revisao;
    if (r.avaliacao && (!avaliacao || r.avaliacao.ts > avaliacao.ts)) avaliacao = r.avaliacao;
  }
  produtos = produtos.filter(o => ehObj(o) && !(apag[o.id] && apag[o.id] >= (o.atualizado || 0)));
  pele = pele.filter(o => ehObj(o) && ehData(o.d || '') && !(apag[o.id] && apag[o.id] >= (o.ts || 0))).sort((a, b) => a.d < b.d ? -1 : 1);
  for (const k of Object.keys(registos)) if (!ehData(k) || !ehObj(registos[k])) delete registos[k];
  respiracao = respiracao.filter(o => ehObj(o) && ehData(o.d || '')).sort((a, b) => (a.ts || 0) - (b.ts || 0));
  return {cfg, produtos, pele, registos, respiracao, revisao, avaliacao, fotos: L.fotos || {}};
}

function montar(local, remG, remF, extra = {}, remN = null){
  const g = fundirGarfada(local.garfada, remG), f = fundirForja(local.forja, remF);
  const nas = fundirNascente(local.nascente, remN);
  const gc = (local.garfada && local.garfada.cfg) || {}, fc = ehObj(local.forja && local.forja.cfg) ? local.forja.cfg : {}, mc = ML.get('cfg', {}) || {};
  const nc = (local.nascente && local.nascente.cfg) || {};
  const chave = mc.chave || gc.chave || fc.chave || nc.chave || '';
  const modelo = mc.chave ? (mc.modelo || 'gemini-flash-latest') : gc.chave ? (gc.modelo || 'gemini-flash-latest') : fc.chave ? (fc.modelo || 'gemini-flash-latest') : (nc.modelo || 'gemini-flash-latest');
  return Object.assign({
    refeicoes: g.refeicoes, agua: g.agua, aguaCha: g.aguaCha || {}, gcfg: g.cfg, treinos: f.treinos, fcfg: f.cfg,
    pesos: fundirPesos(g.pesos, f.pesos),
    temGarfada: g.refeicoes.length > 0 || !!g.cfg || g.pesos.length > 0,
    temForja: f.treinos.length > 0 || !!f.cfg,
    nas, temNascente: nas.produtos.length > 0 || Object.keys(nas.registos).length > 0 || nas.pele.length > 0 || nas.respiracao.length > 0,
    nome: (f.cfg && f.cfg.nome) || nas.cfg && nas.cfg.nome || '',
    ia: {chave, modelo},
    demo: false
  }, extra);
}

/* ---------- Carregamento ---------- */
// Desenha logo com o que há no dispositivo e na cache; depois vai ao GitHub e volta a desenhar se houver novidades.
const FONTES = {garfada: {}, forja: {}, nascente: {}};
const ROT_LOCAL = {
  garfada: L => L.refeicoes.length + ' refeições guardadas pela Garfada',
  forja: L => L.treinos.length + ' treinos guardados pela Forja',
  nascente: L => `${L.produtos.filter(p => !p.fim).length} frascos, ${Object.keys(L.registos).length} dias de ritual e ${L.pele.length} registos da pele`
};
async function carregarDados(aoAtualizar, {rede = true} = {}){
  const local = await lerLocal(), cache = {};
  let creds = credenciais();
  const ficha = (app, c, ca) => ({
    local: local[app].existe ? {rotulo: ROT_LOCAL[app](local[app])} : null,
    cred: c ? {dono: c.dono, repo: c.repo, origem: c.origem, adivinhado: !!c.adivinhado} : null,
    estado: c ? (ca ? 'cache' : 'espera') : 'off',
    quando: ca ? ca.quando : 0, erro: ''
  });
  for (const app of APPS){ cache[app] = await remotoDaCache(app, creds[app]); FONTES[app] = ficha(app, creds[app], cache[app]); }
  aoAtualizar(montar(local, cache.garfada, cache.forja, {}, cache.nascente), false);
  if (!rede || !navigator.onLine) return;
  // Primeiro o mirante-dados: num dispositivo novo é ele que diz onde estão os dados das apps.
  if (ghMirante()){
    try { await sincronizarMirante(); } catch(e){}
    const novas = credenciais();
    for (const app of APPS){
      const a = creds[app], b = novas[app];
      if (b && (!a || chaveRepo(app, a) !== chaveRepo(app, b) || a.token !== b.token)){ cache[app] = await remotoDaCache(app, b); FONTES[app] = ficha(app, b, cache[app]); }
    }
    creds = novas;
  }
  const remoto = Object.assign({}, cache);
  let novos = 0;
  await Promise.all(APPS.map(async app => {
    const c = creds[app]; if (!c) return;
    FONTES[app].estado = 'a ler';
    try {
      const r = await lerRemoto(app, c);
      remoto[app] = r; novos += r.novos;
      Object.assign(FONTES[app], {estado: 'ok', quando: r.quando, erro: ''});
    } catch(e){ Object.assign(FONTES[app], {estado: 'erro', erro: e.message || 'Erro ao ler o GitHub.'}); }
  }));
  aoAtualizar(montar(local, remoto.garfada, remoto.forja, {}, remoto.nascente), true, novos);
}
