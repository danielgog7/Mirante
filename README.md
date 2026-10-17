# Mirante

A vista da tua semana: junta a comida da [Garfada](https://danielgog7.github.io/Garfada/), os treinos da [Forja](https://danielgog7.github.io/Forja/) e o peso das duas, e mostra como correu.

- **Semana**: o horizonte da semana (peso no céu, calorias nos montes, treinos no chão), a nota da semana, comida, treino e peso, o que se destacou, músculos trabalhados, recordes e a semana em pratos.
- **Relato**: a semana contada em cartões, com três focos para a seguinte e uma imagem para partilhar.
- **Evolução**: nota, peso e tendência, calorias, proteína, treinos, volume, constância e força ao longo de semanas ou meses.

## De onde vêm os dados

O Mirante só lê; nunca altera nada nas outras apps.

1. **Neste dispositivo**: as três apps vivem em `danielgog7.github.io`, por isso o Mirante lê diretamente o que a Garfada e a Forja guardaram no mesmo navegador. Não é preciso configurar nada.
2. **GitHub**: para juntar os registos de outros dispositivos, lê os repositórios privados onde cada app sincroniza (`garfada-dados`, `forja-dados`). Usa as ligações que as apps já têm neste dispositivo, ou um token próprio com permissão *Contents: Read-only*.

Fica sempre a versão mais recente de cada registo, com as mesmas regras das apps. A leitura da IA ("vigia") usa a chave do Gemini da Garfada ou da Forja.

## Ficheiros

`dados.js` lê e funde os dados; `calc.js` faz os cálculos (metas e score de comida iguais aos da Garfada); `graficos.js` desenha os gráficos; `app.js` é a interface; `corpo.js` é o mapa muscular da Forja; `exercicios.json` é a lista de exercícios da Forja em versão reduzida; `demo.js` gera os dados de exemplo.
