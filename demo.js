'use strict';
/* Mirante — dados de exemplo: 12 semanas plausíveis de comida, treino e peso.
   Servem para ver a app antes de ligar a Garfada e a Forja. Gerados sempre da mesma forma (semente fixa). */
function gerarDemo(){
  let s = 20261017;
  const rnd = () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const gauss = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return u - 3; };
  const pick = a => a[Math.floor(rnd() * a.length)];
  const kData = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  // [prato, kcal, prot, hid, gord, fibra, açúcar, saturada, sódio]
  const P = {
    peq: [['Iogurte grego com aveia e mirtilos', 380, 28, 45, 9, 6, 18, 4, 120], ['Ovos mexidos com torrada', 420, 24, 30, 22, 3, 3, 7, 520],
      ['Café com leite e torrada', 290, 11, 38, 10, 3, 9, 4, 380], ['Papas de aveia com banana', 410, 14, 68, 9, 8, 22, 2, 90]],
    alm: [['Frango grelhado com arroz e salada', 640, 48, 68, 16, 5, 4, 4, 680], ['Bacalhau à Brás', 720, 36, 48, 42, 4, 3, 9, 1250],
      ['Salmão com batata-doce e brócolos', 690, 42, 55, 30, 9, 11, 6, 420], ['Massa à bolonhesa', 780, 38, 92, 26, 6, 10, 9, 820],
      ['Bifinhos de peru com esparguete', 650, 50, 70, 15, 5, 6, 4, 600], ['Salada de atum com grão', 520, 38, 40, 21, 11, 5, 3, 760], ['Arroz de pato', 830, 40, 85, 34, 3, 2, 10, 980]],
    lan: [['Tosta mista', 360, 18, 34, 16, 2, 4, 8, 900], ['Banana e iogurte natural', 220, 9, 38, 4, 3, 26, 2, 70], ['Batido de proteína com leite', 260, 32, 18, 6, 0, 16, 3, 220],
      ['Pastel de nata e café', 300, 4, 34, 16, 1, 18, 8, 120], ['Maçã e frutos secos', 260, 6, 22, 17, 6, 15, 2, 5]],
    jan: [['Sopa de legumes e omelete', 480, 26, 28, 28, 7, 8, 8, 1100], ['Febras com arroz e feijão', 760, 46, 72, 30, 9, 3, 10, 900],
      ['Peixe grelhado com batata cozida', 560, 42, 50, 18, 6, 3, 3, 520], ['Hambúrguer no pão', 820, 38, 62, 44, 4, 10, 16, 1300],
      ['Caldo verde e pão com chouriço', 620, 22, 66, 28, 6, 4, 9, 1500], ['Bifana no pão', 560, 32, 50, 24, 2, 4, 8, 1000]],
    fds: [['Francesinha', 1250, 58, 80, 72, 4, 12, 30, 2600], ['Pizza margherita', 980, 38, 120, 36, 6, 10, 16, 2100]]
  };
  const HORA = {peq: 8, alm: 13, lan: 16, jan: 20};
  const cfgG = {sexo: 'H', idade: 31, altura: 178, peso: 83, atividade: '1.55', objetivo: 'perder', perfilOk: true, pesoMeta: 77, manual: false, ts: 1};
  const META = 2360;
  const refeicoes = [], agua = {}, pesosG = {}, pesosF = [], treinos = [];
  const hoje = new Date(); hoje.setHours(12, 0, 0, 0);
  const DIAS = 84;
  let pesoReal = 84.6;
  // Exercícios por tipo de treino: [id, kg inicial, reps, séries, passo de progressão em kg]
  const PLANOS = {
    push: ['Empurrar', [['Barbell_Bench_Press_-_Medium_Grip', 60, 8, 4, 2.5], ['Incline_Dumbbell_Press', 22, 10, 3, 2], ['Dumbbell_Shoulder_Press', 18, 10, 3, 2], ['Side_Lateral_Raise', 8, 14, 3, 1], ['Lying_Triceps_Press', 25, 10, 3, 2.5]]],
    pull: ['Puxar', [['Pullups', 0, 7, 4, 0], ['Bent_Over_Barbell_Row', 50, 8, 4, 2.5], ['One-Arm_Dumbbell_Row', 26, 10, 3, 2], ['Barbell_Curl', 25, 10, 3, 2.5], ['Hammer_Curls', 12, 12, 3, 1]]],
    pernas: ['Pernas', [['Barbell_Squat', 70, 8, 4, 2.5], ['Romanian_Deadlift', 70, 10, 3, 2.5], ['Dumbbell_Lunges', 16, 10, 3, 2], ['Barbell_Hip_Thrust', 70, 10, 3, 5], ['Standing_Calf_Raises', 40, 15, 3, 5], ['Hanging_Leg_Raise', 0, 12, 3, 0]]],
    superior: ['Tronco superior', [['Dumbbell_Bench_Press', 26, 10, 3, 2], ['Pullups', 0, 7, 3, 0], ['Seated_Dumbbell_Press', 16, 10, 3, 2], ['Bent_Over_Barbell_Row', 50, 8, 3, 2.5], ['Dumbbell_Bicep_Curl', 12, 12, 3, 1], ['Lying_Triceps_Press', 25, 10, 3, 2.5]]]
  };
  const ROTA = ['push', 'pull', 'pernas', 'superior'];
  let rota = 0;
  for (let i = DIAS; i >= 0; i--){
    const d = new Date(hoje); d.setDate(d.getDate() - i);
    const k = kData(d), dow = (d.getDay() + 6) % 7, fds = dow >= 5, semana = Math.floor((DIAS - i) / 7), ehHoje = i === 0;
    // Peso: tendência de cerca de −0,35 kg por semana, mais lenta nas semanas de excessos.
    pesoReal += (-0.35 + (fds ? 0.15 : -0.02)) / 7 + gauss() * 0.04;
    if (rnd() < 0.72){
      const kg = Math.round((pesoReal + gauss() * 0.32) * 10) / 10, ts = d.getTime() - 4 * 3600e3;
      if (rnd() < 0.7) pesosG[k] = {kg, ts}; else pesosF.push({d: k, kg, ts});
    }
    // Comida: alguns dias sem registo; fins de semana mais pesados.
    if (rnd() > 0.09 || ehHoje){
      const lista = [pick(P.peq), pick(P.alm)];
      if (rnd() < 0.7) lista.push(pick(P.lan));
      lista.push(fds && rnd() < 0.55 ? pick(P.fds) : pick(P.jan));
      const refs = lista.map((x, j) => [x, ['peq', 'alm', lista.length === 4 && j === 2 ? 'lan' : 'jan', 'jan'][j] || 'jan']);
      if (lista.length === 3) refs[2][1] = 'jan';
      const soma = lista.reduce((a, x) => a + x[1], 0);
      const alvo = META * (fds ? 1.13 : 0.95 + gauss() * 0.07);
      const fator = Math.max(0.75, Math.min(1.35, Math.round(alvo / soma * 20) / 20));
      refs.forEach(([x, ref], j) => {
        const h = HORA[ref] + (rnd() * 1.5 - 0.5);
        if (ehHoje && h > new Date().getHours() + 0.5) return;
        const t = new Date(d); t.setHours(Math.floor(h), Math.floor((h % 1) * 60), 0, 0);
        refeicoes.push({id: 'demo' + k + j, ts: t.getTime(), data: k, refeicao: ref, fator, prato: x[0], atualizado: t.getTime(), confianca: 'alta', thumb: '',
          base: {kcal: x[1], prot: x[2], hid: x[3], gord: x[4], fibra: x[5], acucar: x[6], sat: x[7], sodio: x[8]}, micros: {}});
      });
      if (rnd() < 0.8) agua[k] = Math.round((1500 + rnd() * 1300) / 250) * 250;
    }
    // Treino: 3 a 4 por semana, ao fim da tarde, com progressão lenta das cargas.
    const treinaHoje = [0, 1, 3, 5].includes(dow) ? rnd() < (semana === 6 ? 0.35 : 0.86) : rnd() < 0.08;
    if (treinaHoje && !(ehHoje && new Date().getHours() < 20)){
      const tipo = ROTA[rota++ % 4], [nome, exs] = PLANOS[tipo];
      const ini = new Date(d); ini.setHours(18, 20 + Math.floor(rnd() * 40), 0, 0);
      const itens = exs.map(([id, kg0, reps, n, passo]) => {
        const fase = id.length % 4, kg = kg0 ? kg0 + passo * Math.floor((semana + fase) / 4) : 0;
        return {id, series: Array.from({length: n}, (_, j) => ({kg, reps: Math.max(4, reps - (j > 1 ? 1 : 0) + (kg0 ? 0 : Math.floor((semana + fase) / 5)) + (rnd() < 0.08 ? 1 : 0))}))};
      });
      const dur = (48 + Math.floor(rnd() * 24)) * 60e3;
      treinos.push({id: 'demo-t' + k, inicio: ini.getTime(), fim: ini.getTime() + dur, tipo, nome, itens, atualizado: ini.getTime() + dur});
    }
  }
  return {
    garfada: {refeicoes, cfg: cfgG, agua, aguaTs: {}, pesos: pesosG, apagados: {}, existe: true},
    forja: {treinos, cfg: {nome: '', objetivo: 'hipertrofia', nivel: 2, dias: 4, duracao: 60, meta: 0, ts: 1}, apagados: {}, pesos: pesosF, pesosApag: {}, existe: true}
  };
}
