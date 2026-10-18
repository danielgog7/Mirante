# Plano: o cultivador do Mirante

Estado: planeado, por construir. Este ficheiro é o guião para as sessões de construção.

## Ideia

Ao abrir o Mirante aparece uma capa com o cultivador (o mesmo personagem da capa da Nascente, para as apps serem um só universo).
Ele cultiva com o qi que vem de todas as apps. O cenário sobe com o reino: começa no cume do Mirante e acaba entre as galáxias.
Três toques despertam-no e levam para a app.

Base de código a reutilizar (não redesenhar): `nascente/cultivo.js`
- `avatarSVG()` (personagem, 7 aparências por reino), `VISUAL_C`
- motor de partículas da capa (`capaQi`, `novaMote`, `passoCapa`, `rajadaCapa`), `somCapa`, `toqueCapa`, `fecharCapa`, `armarInatividade`, `mensagemCapa`
- a estrutura `REINOS_C` / `NIVEIS_C` / `nivelInfo` (reinos com níveis de custo variável e chão no início de cada reino)

## Os Três Tesouros (de onde vem o qi)

| Tesouro | App | Dantian | Cor | Máx./dia |
|---|---|---|---|---|
| Jing (essência) | Garfada | ventre (cy 238) | verde #9AC74B | 12 |
| Qi (energia) | Forja | peito (cy 190) | laranja #EE6A22 | 12 |
| Shen (espírito) | Nascente | testa (cy 97) | ciano #4FD6D6 | 10 |
| Forma | Peso | a lua atrás dele (fase = % até à meta) | azul #7AA2F5 | 4 |

Ganhos por dia:
- Jing: 2 ou mais refeições registadas +4; calorias entre 90 e 110% da meta +5; proteína >= 90% da meta +2; água na meta +1.
- Qi: treino concluído +10; recorde nesse treino +2. Os dias de descanso não tiram nada: ao fechar a semana, treinos >= meta dá +12 ("semana forjada").
- Shen: ritual da manhã +4, da noite +4, registo da pele +2.
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
2. Céu completo: palcos 4 a 9, astrolábio, lótus dos 28 dias, vista Cultivo com os gráficos. Publicar.
3. Acabamentos: tribulação, constelações das semanas, vigia a falar do cultivo, afinação de desempenho e som. Publicar.

## Testes por fase

- node: semana perfeita, dias vazios (perdas e chão), gargalo, desvio, tesouro inativo não bloqueia, fluxo.
- Playwright: capa abre, 3 toques entram na app, sem erros na consola, fps >= 50 em 2 s, capturas de cada palco (`?reino=N` só para pré-visualização), animações reduzidas.
