# Plano: o cultivador do Mirante

Estado: fase 1 publicada (regras, capa com 3 toques, palcos 1 a 4, mosaico, reino da Pele) e extras publicados: objetos das apps (espada, cabaça, jade), pílulas de proteção, céu real (fase da lua e hora; lua cheia dá Shen a dobrar), vista Cultivo com o mapa da ascensão, crónica do mês pela IA e imagem para partilhar. Falta: palcos 5 a 9, lótus dos 28 dias, missão do dia, tribulação, constelações, vigia a falar do cultivo. Este ficheiro é o guião para as sessões de construção.

## Ideia

Ao abrir o Mirante aparece uma capa com o cultivador (o mesmo personagem da capa da Nascente, para as apps serem um só universo).
Ele cultiva com o qi que vem de todas as apps. O cenário sobe com o reino: começa no cume do Mirante e acaba entre as galáxias.
Três toques despertam-no e levam para a app.

Desenho comum: `cultivador-arte.js` e `cultivador-arte.css` são iguais no Mirante e na Nascente (personagem, tesouros, objetos, lua, palcos). Mudar num e copiar para o outro. O Mirante guarda o retrato do cultivador em `mirante.retrato` (localStorage) e a Nascente desenha-o igual na secção Meditar.

Base de código original: `nascente/cultivo.js` (já retirado da Nascente)
- `avatarSVG()` (personagem, 7 aparências por reino), `VISUAL_C`
- motor de partículas da capa (`capaQi`, `novaMote`, `passoCapa`, `rajadaCapa`), `somCapa`, `toqueCapa`, `fecharCapa`, `armarInatividade`, `mensagemCapa`
- a estrutura `REINOS_C` / `NIVEIS_C` / `nivelInfo` (reinos com níveis de custo variável e chão no início de cada reino)

## Os Três Tesouros (de onde vem o qi)

| Tesouro | App | Dantian | Cor | Máx./dia |
|---|---|---|---|---|
| Jing (essência) | Garfada | ventre (cy 238) | verde #9AC74B | 12 |
| Qi (energia) | Forja | peito (cy 190) | laranja #EE6A22 | 12 |
| Shen (espírito) | Nascente (rituais e respiração) | testa (cy 97) | ciano #4FD6D6 | 10 |
| Forma | Peso | a lua atrás dele (fase = % até à meta) | azul #7AA2F5 | 4 |

Ganhos por dia:
- Jing: 2 ou mais refeições registadas +4; calorias entre 90 e 110% da meta +5; proteína >= 90% da meta +2; água na meta +1.
- Qi: treino concluído +10; recorde nesse treino +2. Os dias de descanso não tiram nada: ao fechar a semana, treinos >= meta dá +12 ("semana forjada").
- Shen: ritual da manhã +3, da noite +3, sessão de respiração completa na Nascente +3, registo da pele +1.
- Forma: pesagem +1; ao fechar a semana, média a andar na direção da meta +6.

Fluxo (multiplicador por dias equilibrados seguidos; os mesmos nomes da Nascente):
Disperso x1 · Brisa x1,1 (2+) · Corrente x1,25 (6+) · Rio x1,4 (14+) · Torrente x1,6 (28+).
Dia equilibrado = cada tesouro ativo com pontos nesse dia (a Forja conta como cumprida se a semana vai a tempo da meta).

Perdas e travões:
- Dia vazio (nenhum tesouro com pontos): perde 6% do custo do nível (mínimo 15) e o fluxo volta a Disperso. Nunca desce abaixo do início do reino (chão), como na Nascente.
- Desvio de qi: um tesouro ativo a zero há 5 ou mais dias faz os ganhos dos outros contarem a 70%; o seu dantian aparece rachado.
- Tesouro ativo = a app tem registos nos últimos 30 dias. Quem não usa uma app não fica preso por ela.
- Gargalo: no pico de um reino o qi para no limite até passar a tribulação: últimos 14 dias com cada tesouro ativo >= 50% do seu máximo em média e a última semana fechada com nota >= 70.

Tudo sai só dos registos (fundidos do dispositivo e do GitHub), por isso é igual no telemóvel e no PC.

## Os Nove Céus (reinos, níveis e cenário)

| # | Reino | Níveis | Custo por nível | Cenário (palco) |
|---|---|---|---|---|
| 1 | Mortal Desperto | Corpo, Respiração, Mente | 40 | cume do Mirante ao anoitecer |
| 2 | Recolha da Luz Estelar | 9 níveis | 60 + 10 x nível | cume de noite, Via Láctea, fios de luz a descer |
| 3 | Fundação de Jade | 4 fases | 300 | a rocha vira plataforma de jade, aurora |
| 4 | Núcleo Lunar | 4 fases | 400 | acima das nuvens, lua cheia enorme |
| 5 | Alma Solar | 4 fases | 500 | sentado na lua, a Terra e o sol a nascer |
| 6 | Domínio das Constelações | 4 fases | 600 | espaço; as constelações das semanas ligam-se a ele |
| 7 | Corpo Nebular | 4 fases | 700 | dentro de uma nebulosa |
| 8 | Coração da Galáxia | 4 fases | 800 | galáxia espiral a rodar atrás |
| 9 | Ascensão ao Firmamento | 1 | — | pilar de luz; ele torna-se estrela |

Ritmo esperado: cerca de 37 qi por dia bem feito, cerca de 14 200 qi até à ascensão, à volta de um ano. Calibrar com dados reais na fase 1.
Fases: Inicial, Intermédia, Tardia, Pico. Nomes diferentes dos da Nascente para não confundir.

## A capa (3 toques)

- Abrir: palco do reino, cultivador a respirar, partículas de 3 cores a cair nos 3 dantians (quantidade = qi de hoje por tesouro), mensagem desde a última visita (+qi, perdas, avanço, rompeste).
- Toque 1: abre os olhos; os 3 dantians acendem um a um com o valor de hoje.
- Toque 2: mudra; abre-se o astrolábio (anel com os 9 reinos e o arco de progresso) e, por dentro, o lótus dos 28 dias (pétala por dia, empilhada por tesouro).
- Toque 3: tudo converge para o dantian, clarão, as estrelas esticam (salto) e entra o Mirante.
- Vibração e som de sino em cada toque (como na Nascente, com interruptor). Toque longo salta.
- Aparece ao abrir e ao voltar depois de 10 min fora. Interruptor e "Ver agora" nas Ligações. Com animações reduzidas: versão parada.
- Rompimento de reino: na abertura seguinte, a tribulação (relâmpagos, ele absorve-os, o palco transforma-se).

## Dentro da app

- Mosaico "Cultivo" no Início: mini cultivador, reino, nível, barra, fluxo e gargalo.
- Vista "Cultivo" (a partir do mosaico, sem separador novo):
  1. herói com o cultivador e o estado do gargalo
  2. qi ao longo do tempo (área acumulada com faixas dos reinos, marcas de rompimentos e perdas)
  3. os três tesouros nos últimos 28 dias (barras empilhadas por dia)
  4. equilíbrio (triângulo Jing/Qi/Shen, semana atual contra a anterior)
  5. o caminho (os 9 reinos com miniaturas, como o `folhaCaminho` da Nascente)
  6. últimos ganhos e perdas; regras explicadas
- O vigia passa a falar do cultivo (gargalo, desvio, rompimentos).

## Arquitetura

- `cultivo.js`: regras puras (`REINOS_M`, `NIVEIS_M`, `cultivoMirante(D)` -> qi, nível, tesouros por dia, eventos, gargalo, desvio). Testável em node.
- `cultivador.js`: `avatarSVG` portado com 3 dantians e 9 aparências, palcos por reino (SVG + canvas), motor de partículas de 3 cores, capa e inatividade.
- `index.html` (#capa), `sw.js` (lista de ficheiros e versão), `estilo.css` (secção capa).
- Corrigir já o separador Pele: o reino da Nascente mudou para o sistema de qi do `cultivo.js`; portar o `cultivo()` da Nascente em vez de `REINOS_P`.
- Desempenho: Canvas 2D com sprites pré-desenhados, nebulosa e galáxia desenhadas uma vez em canvas fora do ecrã, máximo de 260 partículas, pausa quando a app sai de vista, `devicePixelRatio` limitado a 1,5.

## Fases

1. Núcleo: `cultivo.js` com testes; cultivador portado com 3 dantians; capa com 3 toques nos palcos 1 a 3; partículas de 3 cores; mosaico no Início; correção do reino da Pele. Publicar.
2. Céu completo: palcos 4 a 9, astrolábio, lótus dos 28 dias, missão do dia, vista Cultivo com os gráficos. Publicar.
3. Acabamentos: tribulação, constelações das semanas, vigia a falar do cultivo, afinação de desempenho e som. Publicar.

## Testes por fase

- node: semana perfeita, dias vazios (perdas e chão), gargalo, desvio, tesouro inativo não bloqueia, fluxo.
- Playwright: capa abre, 3 toques entram na app, sem erros na consola, fps >= 50 em 2 s, capturas de cada palco (`?reino=N` só para pré-visualização), animações reduzidas.

## Especificação técnica (para construir sem voltar a explorar)

### Dados do Mirante a usar (já existem)
- `IDX.dias.get(k)` -> {kcal, prot, n (refeições)}; metas em `IDX.metas` (kcal, prot, agua); água em `D.agua[k]`.
- Calorias na meta: `|kcal - m.kcal| <= m.kcal * 0.1` (igual a `S.comida.naMeta`); proteína: `prot >= m.prot * 0.9` (igual a `protOk`).
- Treinos do dia: `IDX.treinosDia.get(k)`; recorde no dia: algum exercício com `v` acima do melhor anterior em `IDX.hist` (mesma regra de `S.treino.recordes`).
- Meta semanal de treinos: `D.fcfg.dias`. Nota da semana: `semana(ini).nota.total`.
- Nascente: `D.nas.registos[k].mF` / `.nF`; registo da pele: `D.nas.pele.some(x => x.d === k)`.
- Peso: `IDX.peso.has(k)`; direção da semana: `IDX.tend` no fim contra o início, comparada com `D.gcfg.objetivo` / `pesoMeta`.

### Funções
- `tesourosDia(k)` -> {jing, qi, shen, forma, ativos: {jing, qi, shen, forma}, equilibrado}
- `ativo(t, k)`: primeiro registo da app <= k e há registo dela em [k-29, k].
- `cultivoMirante()` percorre os dias desde o primeiro registo de qualquer app até hoje (o dia de hoje só conta ganhos, nunca perdas).
  Devolve {qi, idx, r, reino, nivel, pct, prox, fluxo, serie, chao, gargalo: {preso, falta: ['shen', ...]}, desvio: ['qi', ...],
  hoje: {jing, qi, shen, forma}, dias: [{k, jing, qi, shen, forma, total, mult, perda}], eventos: [{k, tipo: 'ganho'|'perda'|'rompe'|'nivel', qi}]}.
  Guardar em cache pela assinatura dos dados (como `CACHE_SEM`).
- `missaoDia(k)`: o tesouro ativo mais fraco nos 7 dias anteriores dá a missão (ex.: "os dois rituais hoje", "proteína na meta", "treina hoje"); cumprida dá +5. Só usa dias anteriores, por isso é igual em todos os dispositivos.

### Casos de teste (node)
- Dia perfeito, fluxo Disperso: 12 + 12 + 10 + 1 = 35.
- 6 dias equilibrados seguidos: o 7.º dia multiplica por 1,25.
- Dia vazio no nível 1 do reino 2 (custo 60): perde max(15, 6% de 60) = 15 e o fluxo volta a x1; nunca abaixo do chão do reino.
- Só Garfada usada: Forja, Nascente e peso inativos; os dias com comida contam como equilibrados e não há desvio.
- Nascente a zero 5 dias com as outras ativas: ganhos dos outros a 70% e `desvio = ['shen']`.
- No pico com a última nota da semana 60: `gargalo.preso = true` e o qi fica no limite; com nota 75 e tesouros acima de 50%: rompe.
- Calibração: com os dados de exemplo, 1.º reino passado em 3 a 5 dias e reino 2 a meio ao fim de 3 semanas; se não, ajustar só os custos.

### Capa: tempos
- Entrada: aparece em 500 ms; respiração de 4,8 s em ciclo; 40 partículas iniciais.
- Toque 1 (600 ms): olhos abrem (200 ms); os dantians acendem um a um (3 x 180 ms) com o valor de hoje por baixo.
- Toque 2 (900 ms): mãos sobem ao peito (400 ms); o astrolábio cresce de 0,6 a 1 e roda (700 ms); as 28 pétalas do lótus crescem em sequência (20 ms cada).
- Toque 3 (1,5 s): as partículas aceleram para o centro (450 ms), clarão branco (150 ms), as estrelas esticam em raios (600 ms), o Mirante aparece (300 ms).
- Teclado: Espaço e Enter contam como toque; Esc salta.

### Partículas
- Por tesouro ativo: taxa = 4 + 10 x (qi de hoje / máximo) por segundo; cor do tesouro; alvo = o seu dantian. Tesouro em desvio: partículas cinzentas e lentas.
- Teto de 260 partículas; sprites de 32 px pré-desenhados; `globalCompositeOperation = 'lighter'`.

### Palcos (SVG 400 x 800, `xMidYMax slice`, mais camadas de canvas)
1. Cume ao anoitecer: céu #2a1f3d para #0d1424, brilho do sol posto (#e0a26b) no horizonte, serras do Mirante, ele num pico rochoso.
2. Noite: céu #0a0f1e para #05070d, estrelas do `ceu.js` e Via Láctea, 6 fios de luz das estrelas até ele (traço animado).
3. Jade: disco de jade (#2f7260 para #a6dcc6) por baixo dele, 3 faixas de aurora em canvas (ondas com transparência).
4. Nuvens: 4 camadas de nuvens a deslizar a velocidades diferentes, lua com crateras (r 140) atrás dele.
5. Lua: chão lunar com crateras (#8a8f99), a Terra a nascer (#3b6fb6, nuvens e atmosfera), clarão do sol.
6. Constelações: espaço negro; cada semana fechada é uma estrela (brilho = nota), ligadas em constelações e por fios a ele.
7. Nebulosa: canvas fora do ecrã com 5 gradientes radiais (#7a3fa0, #2a6fb0, #d0507a) e ruído, mais poeira a flutuar.
8. Galáxia: 1500 pontos em 2 braços em espiral logarítmica, rotação de 0,02 rad/s, núcleo brilhante.
9. Firmamento: pilar de luz branco e dourado, ele vira estrela (brilho a pulsar), anéis.

### Aparência do cultivador (índice de `VISUAL_C` da Nascente)
Reinos 1 a 9 -> 0, 1, 2, 3, 4, 4 (com faixa de estrelas), 5, 5 (com halo de galáxia), 6.

### Ficheiros a mexer
- novos: `cultivo.js`, `cultivador.js`
- `index.html` (div #capa e scripts antes de `vistas.js`), `sw.js` (lista e versão), `estilo.css` (secção capa), `app.js` (abrir a capa ao arrancar, ações, interruptores nas Ligações), `vistas.js` (mosaico e vista Cultivo), `pele.js` (reino da Nascente pelas regras novas), `vigia.js` (fase 3)
- `demo.js`: os dados de exemplo têm de dar um cultivo plausível; `?reino=N` só para pré-visualizar palcos.
