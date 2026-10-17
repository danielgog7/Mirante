'use strict';
/* Mirante — a cena da Forja (bigorna, cepo, tenaz, martelo e fogo), com o mesmo código da app Forja.
   A peça sobre a bigorna é a "peça da semana": cada treino molda o ferro até virar lâmina. */
const ForjaCena = (() => {
const BARRA = [[160, 184], [164, 184], [166, 184], [168, 184], [170, 184], [246, 184], [252, 189], [246, 194], [170, 194], [168, 194], [166, 194], [164, 194], [160, 194]];
const LAMINA = [[112, 186], [140, 186], [140, 177], [147, 177], [147, 184], [285, 184], [312, 189], [285, 194], [147, 194], [147, 201], [140, 201], [140, 192], [112, 192]];
const lerp = (a, b, f) => a + (b - a) * f;
const formaPeca = f => 'M' + BARRA.map((p, i) => lerp(p[0], LAMINA[i][0], f).toFixed(1) + ' ' + lerp(p[1], LAMINA[i][1], f).toFixed(1)).join(' L') + ' Z';
const BIGORNA = 'M44 204.5Q80 197 118 194.5L146 194.5L146 189.5L326 189.5Q333 190 329 196.5L330 205Q329 211 320 213Q290 217 276 224Q262 232 262 246Q263 254 272 258L300 262Q306 264 306 270L306 273L280 273Q270 266 248 265L176 265Q154 266 144 273L118 273L118 270Q118 264 124 262L152 258Q161 254 162 246Q162 232 150 224Q136 216 112 213Q78 211 46 206.5Q43 205.8 44 204.5Z';
// Bigorna de ferreiro em perspetiva ligeira (vista de frente, um pouco de cima e da esquerda, do lado da forja).
const DEFS_BIGORNA = `
    <linearGradient id="gbCorpo" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="273"><stop offset="0" stop-color="#3f3833"/><stop offset=".16" stop-color="#2d2825"/><stop offset=".45" stop-color="#1d1917"/><stop offset=".78" stop-color="#131110"/><stop offset="1" stop-color="#0b0a09"/></linearGradient>
    <linearGradient id="gbPlaca" gradientUnits="userSpaceOnUse" x1="0" y1="196" x2="0" y2="206"><stop offset="0" stop-color="#5e5650"/><stop offset=".35" stop-color="#3d3632"/><stop offset="1" stop-color="#24201d"/></linearGradient>
    <linearGradient id="gbFace" gradientUnits="userSpaceOnUse" x1="140" y1="0" x2="330" y2="0"><stop offset="0" stop-color="#7d736c"/><stop offset=".3" stop-color="#a99e96"/><stop offset=".5" stop-color="#ddd3ca"/><stop offset=".64" stop-color="#b3a8a0"/><stop offset="1" stop-color="#5a524c"/></linearGradient>
    <linearGradient id="gbFaceFundo" gradientUnits="userSpaceOnUse" x1="0" y1="189.5" x2="0" y2="196"><stop offset="0" stop-color="#000" stop-opacity=".42"/><stop offset=".55" stop-color="#000" stop-opacity=".08"/><stop offset="1" stop-color="#000" stop-opacity="0"/></linearGradient>
    <linearGradient id="gbMesa" gradientUnits="userSpaceOnUse" x1="112" y1="0" x2="146" y2="0"><stop offset="0" stop-color="#7e6656"/><stop offset="1" stop-color="#8f847c"/></linearGradient>
    <linearGradient id="gbCorno" gradientUnits="userSpaceOnUse" x1="44" y1="0" x2="120" y2="0"><stop offset="0" stop-color="#d98a4e"/><stop offset=".3" stop-color="#957865"/><stop offset="1" stop-color="#857a72"/></linearGradient>
    <linearGradient id="gbCornoSombra" gradientUnits="userSpaceOnUse" x1="0" y1="200" x2="0" y2="213"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".5"/></linearGradient>
    <linearGradient id="gbForja" gradientUnits="userSpaceOnUse" x1="40" y1="0" x2="250" y2="0"><stop offset="0" stop-color="#ff7a2a" stop-opacity=".42"/><stop offset=".35" stop-color="#ff7a2a" stop-opacity=".14"/><stop offset="1" stop-color="#ff7a2a" stop-opacity="0"/></linearGradient>
    <linearGradient id="gbAro" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a615b"/><stop offset=".25" stop-color="#342e2a"/><stop offset="1" stop-color="#0b0908"/></linearGradient>
    <radialGradient id="gbTocoLuz" gradientUnits="userSpaceOnUse" cx="190" cy="278" r="90"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".28"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gbPrego" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#b3a79e"/><stop offset=".5" stop-color="#4f4741"/><stop offset="1" stop-color="#151210"/></radialGradient>`;
function bigornaSVG(){
  let sem = 11; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  // marcas de uso: picadas escuras e riscos claros no corpo
  const marcas = Array.from({length: 34}, () => { const x = 56 + rnd() * 268, y = 202 + rnd() * 66;
    return `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${(.5 + rnd() * 1.5).toFixed(2)}" ry="${(.35 + rnd() * .7).toFixed(2)}" fill="${rnd() < .62 ? '#000' : '#9a8f87'}" opacity="${(.14 + rnd() * .22).toFixed(2)}"/>`; }).join('');
  const riscos = Array.from({length: 9}, () => { const x = 150 + rnd() * 140, y = 190.8 + rnd() * 4.4, l = 8 + rnd() * 24;
    return `<path d="M${x.toFixed(1)} ${y.toFixed(2)}L${(x + l).toFixed(1)} ${(y - .3 + rnd() * .6).toFixed(2)}" stroke="${rnd() < .5 ? '#fff' : '#3a3330'}" stroke-width=".35" opacity="${(.18 + rnd() * .2).toFixed(2)}"/>`; }).join('');
  const lascas = [[166, 2], [203, 1.3], [244, 1.7], [318, 1.5]].map(([x, w]) => `<path d="M${x} 196L${x + w} 196L${x + w * .55} 197.1Z" fill="#0d0b0a" opacity=".75"/>`).join('');
  // aro de ferro do cepo e rebites ao longo da curva
  const aroY = t => 292 + 2 * (1 - t) * t * 20;
  const rebites = [.1, .3, .5, .7, .9].map(t => `<circle cx="${(118 + 188 * t).toFixed(1)}" cy="${(aroY(t) + 3.6).toFixed(1)}" r="1.5" fill="url(#gbPrego)"/>`).join('');
  const prego = (x, y) => `<circle cx="${x}" cy="${y}" r="1.9" fill="url(#gbPrego)"/><circle cx="${x - .5}" cy="${y - .6}" r=".5" fill="#e8ddd4" opacity=".7"/>`;
  const fixa = (d, px, py) => `<path d="${d}" fill="url(#gbAro)" stroke="#060504" stroke-width=".6"/>${prego(px, py)}`;
  return `
  <path d="M117 270Q113 296 118 342L306 342Q311 296 307 270Z" fill="url(#gToco)"/>
  <path d="M117 270Q113 296 118 342" stroke="#080503" stroke-width="3" fill="none"/><path d="M307 270Q311 296 306 342" stroke="#080503" stroke-width="3" fill="none"/>
  <path d="M136 284Q132 308 138 340M160 286Q164 310 158 340M186 288Q182 314 188 340M240 288Q244 312 238 340M266 286Q262 310 268 340M290 284Q294 306 288 340" stroke="#120a05" stroke-width="2" fill="none" opacity=".75"/>
  <path d="M117.5 292Q212 312 306.5 292L306.8 299.5Q212 319.5 117.3 299.5Z" fill="url(#gbAro)" stroke="#060504" stroke-width=".6"/>
  <path d="M118 292.6Q212 312.6 306 292.6" stroke="#a89c93" stroke-width=".6" fill="none" opacity=".45"/>
  ${rebites}
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="url(#gTocoTopo)"/>
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="url(#gbTocoLuz)"/>
  <ellipse cx="212" cy="270" rx="72" ry="9.4" fill="none" stroke="#3a2414" stroke-width="1" opacity=".8"/>
  <ellipse cx="212" cy="270" rx="50" ry="6.6" fill="none" stroke="#3a2414" stroke-width="1" opacity=".75"/>
  <ellipse cx="212" cy="270" rx="28" ry="3.8" fill="none" stroke="#3a2414" stroke-width="1" opacity=".7"/>
  <path d="M188 275L172 281.4M232 275.5L246 281.6M212 276L211 282.4" stroke="#1a0f08" stroke-width=".9" opacity=".8"/>
  <ellipse cx="212" cy="270" rx="94" ry="12.6" fill="none" stroke="#120a05" stroke-width="2.4"/>
  <ellipse cx="212" cy="273.5" rx="99" ry="5.5" fill="#000" opacity=".75" filter="url(#fB3)"/>
  <path d="M144 273Q154 266 176 265L248 265Q270 266 280 273Z" fill="#030202" opacity=".92"/>

  <path d="${BIGORNA}" fill="url(#gbCorpo)"/>
  <g clip-path="url(#cpBigorna)">
    <rect x="40" y="185" width="300" height="92" fill="url(#gbForja)"/>
    <rect x="50" y="190" width="290" height="90" fill="url(#gBigornaLado)"/>
    <path d="M150 224Q162 232 162 246Q161 254 152 258M276 224Q262 232 262 246Q263 254 272 258" stroke="#000" stroke-width="12" opacity=".38" fill="none" filter="url(#fB3)"/>
    <ellipse cx="212" cy="238" rx="34" ry="24" fill="#ffd9b0" opacity=".06" filter="url(#fB6)"/>
    <rect class="luzFogo" x="50" y="190" width="290" height="90" fill="url(#gAquecido)"/>
    ${marcas}
  </g>
  <path d="M140 196L328 196L330 205L140 206Z" fill="url(#gbPlaca)"/>
  <path d="M140 206.1L330 204.9" stroke="#0a0807" stroke-width=".9"/><path d="M140 207L329.6 205.8" stroke="#7a6f67" stroke-width=".45" opacity=".35"/>
  <path d="M44 204.5Q80 197 118 194.5L112 201Q78 202.6 46 205.6Z" fill="url(#gbCorno)"/>
  <path d="M46 205.6Q78 202.6 112 201L112 213Q78 211 46 206.5Z" fill="url(#gbCornoSombra)"/>
  <path d="M118 194.5L146 194.5L140 201L112 201Z" fill="url(#gbMesa)"/>
  <path d="M146 189.5L140 196L140 201L146 194.5Z" fill="#7a5038"/>
  <path d="M146 189.5L326 189.5Q333 190 328 196L140 196Z" fill="url(#gbFace)"/>
  <path d="M146 189.5L326 189.5Q333 190 328 196L140 196Z" fill="url(#gbFaceFundo)"/>
  ${riscos}
  <path d="${BIGORNA}" fill="#000" filter="url(#fGrao)" opacity=".16"/>

  <path d="M146.3 189.6L325.6 189.6" stroke="#1d1917" stroke-width=".7"/>
  <path d="M141 196.1L327.6 196.1" stroke="#f7eee6" stroke-width=".9" opacity=".8"/>
  <path d="M112.4 201.1L140 201.1" stroke="#e6d9cf" stroke-width=".7" opacity=".6"/>
  <path d="M118.4 194.6L146 194.6" stroke="#2a2420" stroke-width=".6"/>
  <path d="M49 203.7Q82 198.4 116.5 196" stroke="#f6e4d2" stroke-width="1.1" fill="none" opacity=".6"/>
  <path d="M46 204.5Q60 201 74 199.6" stroke="#ffb06a" stroke-width="2.4" fill="none" opacity=".45" filter="url(#fB1)"/>
  <path d="M46.5 206.5Q78 211 112 213Q136 216 150 224Q162 232 162 246Q161 254 152 258L124 262Q118 264 118 270L118 273" stroke="#ff8a3a" stroke-width="1.2" fill="none" opacity=".42"/>
  <path d="M329 196.5L330 205Q329 211 320 213Q290 217 276 224Q262 232 262 246Q263 254 272 258L300 262Q306 264 306 270" stroke="#9aa3ad" stroke-width=".8" fill="none" opacity=".22"/>
  <path d="M152.5 258.2L124.5 262.2M271.5 258.2L299.5 262.2" stroke="#8a7f77" stroke-width=".8" opacity=".55"/>
  <path d="M144 273Q154 266 176 265L248 265Q270 266 280 273" stroke="#5a504a" stroke-width=".7" fill="none" opacity=".5"/>

  <g font-family="'Cinzel', Georgia, serif" font-size="8.4" font-weight="700" letter-spacing="2.2" text-anchor="middle">
    <text x="213.1" y="241.7" fill="#050404" opacity=".9">FORJA</text>
    <text x="212.6" y="240.4" fill="#6d645d" opacity=".55">FORJA</text>
    <text x="212.8" y="241" fill="#221d1a">FORJA</text>
  </g>
  <path d="M190 245.6L235.6 245.6" stroke="#050404" stroke-width=".7" opacity=".7"/><path d="M190 245L235.6 245" stroke="#6d645d" stroke-width=".4" opacity=".4"/>

  <path d="M295 194.8L304 194.8L307.9 190.6L298.9 190.6Z" fill="#070605"/>
  <path d="M298.9 190.6L307.9 190.6L307 191.7L298 191.7Z" fill="#4d4540"/>
  <ellipse cx="285" cy="192.9" rx="2.7" ry="1.5" fill="#070605"/><path d="M282.4 192.6Q285 191.2 287.6 192.6Q285 191.9 282.4 192.6Z" fill="#4d4540"/>
  ${lascas}

  ${fixa('M121 262.8L133.5 262L135.5 279.8L119 280.4Z', 127.4, 276.6)}
  ${fixa('M290.5 262L303 262.8L305 280.4L288.5 279.8Z', 296.8, 276.6)}`;
}
// Martelo de ferreiro (pena transversal): cabeça de aço chanfrada, cabo de freixo e pega de couro. Coordenadas no repouso da animação.
const CABECA = 'M199 184Q215 185.4 231 184L233.5 181.5L234 164Q235.4 159 235.2 154Q235 148.5 234 145L220.4 127.6Q215 124.6 209.6 127.6L196 145Q195 148.5 194.8 154Q194.6 159 196 164L196.5 181.5Z';
const CABO = 'M228 149.6C270 149.4 320 147 430 145.6L430 164C320 163.4 270 161 228 160.6Z';
const COURO = 'M338 146.8C360 146.3 400 145.8 430 145.3L430 164.3C400 164 360 163.8 338 163.4Z';
const DEFS_MARTELO = `
    <linearGradient id="gmFace" gradientUnits="userSpaceOnUse" x1="199" y1="0" x2="231" y2="0"><stop offset="0" stop-color="#5d544e"/><stop offset=".32" stop-color="#9c928b"/><stop offset=".55" stop-color="#ddd3cb"/><stop offset=".72" stop-color="#9d928b"/><stop offset="1" stop-color="#3f3833"/></linearGradient>
    <linearGradient id="gmChanfroE" gradientUnits="userSpaceOnUse" x1="0" y1="128" x2="0" y2="184"><stop offset="0" stop-color="#7a5640"/><stop offset=".5" stop-color="#6b4a36"/><stop offset="1" stop-color="#9a6440"/></linearGradient>
    <linearGradient id="gmChanfroD" gradientUnits="userSpaceOnUse" x1="0" y1="128" x2="0" y2="184"><stop offset="0" stop-color="#2e2825"/><stop offset="1" stop-color="#110e0c"/></linearGradient>
    <linearGradient id="gmAltura" gradientUnits="userSpaceOnUse" x1="0" y1="124" x2="0" y2="186"><stop offset="0" stop-color="#000" stop-opacity=".3"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".8" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".22"/></linearGradient>
    <linearGradient id="gmCabo" gradientUnits="userSpaceOnUse" x1="0" y1="145" x2="0" y2="164"><stop offset="0" stop-color="#d9a26a"/><stop offset=".22" stop-color="#a87242"/><stop offset=".68" stop-color="#6c4425"/><stop offset="1" stop-color="#3a2210"/></linearGradient>
    <linearGradient id="gmCouro" gradientUnits="userSpaceOnUse" x1="0" y1="145" x2="0" y2="165"><stop offset="0" stop-color="#6a4630"/><stop offset=".3" stop-color="#42291a"/><stop offset="1" stop-color="#170c06"/></linearGradient>
    <clipPath id="cpCabeca"><path d="${CABECA}"/></clipPath>
    <clipPath id="cpCabo"><path d="${CABO}"/></clipPath>
    <clipPath id="cpCouro"><path d="${COURO}"/></clipPath>`;
function marteloSVG(){
  let sem = 5; const rnd = () => (sem = (sem * 16807) % 2147483647) / 2147483647;
  const voltas = Array.from({length: 14}, (_, i) => { const x = 336 + i * 7;
    return `<path d="M${x} 146L${x + 6} 164.6" stroke="#120804" stroke-width="1.4"/><path d="M${x - 1.3} 146L${x + 4.7} 164.6" stroke="#9a6a46" stroke-width=".5" opacity=".6"/>`; }).join('');
  const picadas = Array.from({length: 14}, () => `<ellipse cx="${(198 + rnd() * 34).toFixed(1)}" cy="${(132 + rnd() * 50).toFixed(1)}" rx="${(.4 + rnd() * 1.1).toFixed(2)}" ry="${(.3 + rnd() * .6).toFixed(2)}" fill="${rnd() < .7 ? '#000' : '#fff'}" opacity="${(.1 + rnd() * .14).toFixed(2)}"/>`).join('');
  return `
      <path d="${CABO}" fill="url(#gmCabo)"/>
      <g clip-path="url(#cpCabo)">
        <path d="M240 152.4C290 152 330 150 430 149.2M246 156.9C300 157.1 350 156.6 430 156.9M262 154.6Q300 154.1 332 153.2M282 159.3Q310 159.7 336 159.3M300 150.6Q318 150.2 334 149.6" stroke="#4a2a14" stroke-width=".7" fill="none" opacity=".55"/>
        <path d="M228 162.4C270 162.8 320 164.8 430 165.4" stroke="#000" stroke-width="5" opacity=".4" fill="none" filter="url(#fB1)"/>
        <ellipse cx="312" cy="150.2" rx="24" ry="1.5" fill="#ffe1b8" opacity=".25" filter="url(#fB1)"/>
      </g>
      <path d="M236 150.3C280 150 320 147.8 338 147.3" stroke="#f6cd98" stroke-width=".7" fill="none" opacity=".55"/>
      <path d="${COURO}" fill="url(#gmCouro)"/>
      <g clip-path="url(#cpCouro)">${voltas}</g>
      <path d="M338.6 146.8L338.6 163.4" stroke="#8a5e3e" stroke-width="1.3"/><path d="M336.6 147L336.6 163.2" stroke="#1a0e07" stroke-width="1.6"/>
      <ellipse cx="237" cy="155" rx="4.5" ry="7.5" fill="#000" opacity=".6" filter="url(#fB1)"/>
      <path d="${CABECA}" fill="url(#gmFace)"/>
      <g clip-path="url(#cpCabeca)">
        <path d="M196.5 181.5L196 164Q194.6 159 194.8 154Q195 148.5 196 145L209.6 127.6L211.6 129.4L199.6 145.6Q198.5 148.8 198.4 154Q198.3 159 199.7 164L200.2 181Z" fill="url(#gmChanfroE)"/>
        <path d="M233.5 181.5L234 164Q235.4 159 235.2 154Q235 148.5 234 145L220.4 127.6L218.4 129.4L230.4 145.6Q231.5 148.8 231.6 154Q231.7 159 230.3 164L229.8 181Z" fill="url(#gmChanfroD)"/>
        <path d="M190 145.4L209.6 127.6Q215 124.6 220.4 127.6L240 145.4Z" fill="#fff" opacity=".09"/>
        <rect x="188" y="120" width="54" height="70" fill="url(#gmAltura)"/>
        <ellipse cx="219.5" cy="163" rx="1.9" ry="15" fill="#fff" opacity=".34" filter="url(#fB1)"/>
        <ellipse cx="208" cy="137" rx="1.1" ry="6" fill="#fff" opacity=".2" filter="url(#fB1)" transform="rotate(38 208 137)"/>
        ${picadas}
        <path d="${CABECA}" fill="url(#gCabecaBaixo)"/>
      </g>
      <path d="${CABECA}" fill="#000" filter="url(#fGrao)" opacity=".18"/>
      <path d="M200.2 181L199.7 164Q198.3 159 198.4 154Q198.5 148.8 199.6 145.6L211.6 129.4" stroke="#e2c0a2" stroke-width=".5" fill="none" opacity=".5"/>
      <path d="M229.8 181L230.3 164Q231.7 159 231.6 154Q231.5 148.8 230.4 145.6L218.4 129.4" stroke="#0b0908" stroke-width=".6" fill="none" opacity=".7"/>
      <path d="M198 145.6L232 145.6" stroke="#e8ddd4" stroke-width=".5" opacity=".4"/><path d="M198 146.3L232 146.3" stroke="#000" stroke-width=".5" opacity=".3"/>
      <path d="M196.7 181.3L233.3 181.3" stroke="#d8cdc4" stroke-width=".6" opacity=".6"/>
      <path d="M199 184Q215 185.4 231 184" stroke="#ffcf8a" stroke-width="1.3" fill="none" opacity=".9"/>
      <path d="M210.4 127.4Q215 125 219.6 127.4" stroke="#f4eae1" stroke-width=".9" fill="none" opacity=".8"/>
      <path d="M196 145Q195 148.5 194.8 154Q194.6 159 196 164L196.5 181.5" stroke="#ff9a4a" stroke-width=".9" fill="none" opacity=".55"/>
      <path d="M234 145Q235 148.5 235.2 154Q235.4 159 234 164L233.5 181.5" stroke="#0a0807" stroke-width=".8" fill="none"/>`;
}
const PIVO = '380px 155px', IMPACTO = [215, 184];
function cenaForja(f){
  const jx = lerp(160, 112, f), cx = lerp(206, 212, f), meia = lerp(40, 92, f);
  const chamas = [[86, 46, 1], [104, 58, .9], [122, 50, 1.1], [140, 40, .8], [96, 34, .7]].map(([x, h, e], i) =>
    `<path class="cChama" style="transform-origin:${x}px 196px" d="M${x - 11 * e} 196Q${x - 13 * e} ${196 - h * .55} ${x} ${196 - h}Q${x + 13 * e} ${196 - h * .55} ${x + 11 * e} 196Z" fill="url(#gChama)" opacity="${.75 - i * .06}"/>`).join('');
  const brasas = [[62, 195, 7], [78, 198, 9], [96, 194, 8], [114, 198, 10], [132, 195, 8], [150, 198, 7], [88, 200, 6], [124, 201, 7]].map(([x, y, r]) =>
    `<circle class="cCarvao" cx="${x}" cy="${y + 3}" r="${r * .7}" fill="url(#gCarvao)" opacity=".8"/>`).join('');
  const pedras = [[2, 52, 46, 22], [50, 50, 52, 20], [106, 48, 50, 22], [160, 52, 46, 20], [0, 78, 30, 26], [170, 76, 34, 24], [0, 108, 28, 28], [174, 104, 32, 28],
    [0, 140, 30, 26], [172, 136, 34, 28], [0, 170, 28, 30], [176, 168, 30, 30]].map(([x, y, w, h]) =>
    `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="5" fill="#130e0b" stroke="#060403" stroke-width="2"/>`).join('');
  return `<svg viewBox="0 36 400 290" id="cCena" aria-label="Bigorna com ferro em brasa">
  <defs>
    <radialGradient id="gFogo" cx="50%" cy="100%" r="90%"><stop offset="0" stop-color="#fff1cf"/><stop offset=".18" stop-color="#ffc861"/><stop offset=".4" stop-color="#ff7a1c"/><stop offset=".7" stop-color="#8a1f08"/><stop offset="1" stop-color="#2a0c05"/></radialGradient>
    <linearGradient id="gChama" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#fff1cf"/><stop offset=".25" stop-color="#ffc861"/><stop offset=".6" stop-color="#ff6a1a"/><stop offset="1" stop-color="#b3260e" stop-opacity="0"/></linearGradient>
    <radialGradient id="gCarvao" cx="45%" cy="40%" r="60%"><stop offset="0" stop-color="#ffe39a"/><stop offset=".35" stop-color="#ff8a24"/><stop offset=".75" stop-color="#9a2a0a"/><stop offset="1" stop-color="#2a0d05"/></radialGradient>
    <radialGradient id="gLuzForja" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gChao" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1d1511" stop-opacity="0"/><stop offset=".22" stop-color="#0e0a08"/><stop offset="1" stop-color="#040302"/></linearGradient>
    <radialGradient id="gLuzChao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".35"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gToco" x1="0" x2="1"><stop offset="0" stop-color="#0c0704"/><stop offset=".25" stop-color="#2a1a0f"/><stop offset=".45" stop-color="#3e2817"/><stop offset=".75" stop-color="#21140b"/><stop offset="1" stop-color="#140b06"/></linearGradient>
    <radialGradient id="gTocoTopo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#7a5636"/><stop offset=".6" stop-color="#4e3420"/><stop offset="1" stop-color="#2a1a0f"/></radialGradient>
    <linearGradient id="gBigornaLado" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".55"/><stop offset=".3" stop-color="#000" stop-opacity="0"/><stop offset=".7" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".6"/></linearGradient>
    <radialGradient id="gReflexo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffd27a" stop-opacity=".95"/><stop offset=".4" stop-color="#ff8a2a" stop-opacity=".5"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <radialGradient id="gAquecido" cx="30%" cy="0%" r="80%"><stop offset="0" stop-color="#ff8a2a" stop-opacity=".45"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff8e4"/><stop offset=".25" stop-color="#ffe08f"/><stop offset=".55" stop-color="#ffa13c"/><stop offset=".8" stop-color="#e2541b"/><stop offset="1" stop-color="#8a2208"/></linearGradient>
    <linearGradient id="gMetalPontas" x1="0" x2="1"><stop offset="0" stop-color="#6a1405" stop-opacity=".9"/><stop offset=".28" stop-color="#6a1405" stop-opacity="0"/><stop offset=".72" stop-color="#6a1405" stop-opacity="0"/><stop offset="1" stop-color="#6a1405" stop-opacity=".9"/></linearGradient>
    <linearGradient id="gCabecaBaixo" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="#ff8a2a" stop-opacity="0"/><stop offset="1" stop-color="#ff8a2a" stop-opacity=".8"/></linearGradient>
    <linearGradient id="gTenaz" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6a605a"/><stop offset=".5" stop-color="#2c2623"/><stop offset="1" stop-color="#110e0c"/></linearGradient>
    <radialGradient id="gClarao" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffffff"/><stop offset=".2" stop-color="#fff1cf"/><stop offset=".5" stop-color="#ffb347" stop-opacity=".7"/><stop offset="1" stop-color="#ff6a1a" stop-opacity="0"/></radialGradient>
    <linearGradient id="gRasto" gradientUnits="userSpaceOnUse" x1="240" y1="68" x2="215" y2="160"><stop offset="0" stop-color="#ffd9b0" stop-opacity="0"/><stop offset="1" stop-color="#ffd9b0" stop-opacity=".5"/></linearGradient>
    <filter id="fB1" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
    <filter id="fB3" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
    <filter id="fB6" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="6"/></filter>
    <filter id="fB14" x="-80%" y="-200%" width="260%" height="500%"><feGaussianBlur stdDeviation="14"/></filter>
    <filter id="fGrao" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.7" numOctaves="2" seed="7" result="r"/>
      <feColorMatrix in="r" type="matrix" values="0 0 0 0 .62  0 0 0 0 .56  0 0 0 0 .52  0 0 0 1.4 -.62" result="n"/><feComposite in="n" in2="SourceGraphic" operator="in"/></filter>
    <radialGradient id="gMascara" gradientUnits="userSpaceOnUse" cx="98" cy="150" r="175"><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>
    <mask id="mParede" maskUnits="userSpaceOnUse" x="-80" y="0" width="400" height="260"><rect x="-80" y="0" width="400" height="260" fill="url(#gMascara)"/></mask>
    <clipPath id="cpBigorna"><path d="${BIGORNA}"/></clipPath>${DEFS_BIGORNA}${DEFS_MARTELO}
    <clipPath id="cpBoca"><path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202Z"/></clipPath>
  </defs>

  <g filter="url(#fB1)" opacity=".95" mask="url(#mParede)">
    <path d="M-40 202L-40 44L210 44L210 202Z" fill="#0b0806"/>
    ${pedras}
    <ellipse class="luzFogo" cx="98" cy="150" rx="110" ry="90" fill="url(#gLuzForja)"/>
    <g clip-path="url(#cpBoca)"><rect x="30" y="80" width="140" height="130" fill="url(#gFogo)"/>${chamas}${brasas}</g>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#ff9a3c" stroke-width="3" opacity=".55" filter="url(#fB3)"/>
    <path d="M40 202L40 128Q40 84 98 84Q156 84 156 128L156 202" fill="none" stroke="#0d0907" stroke-width="4"/>
  </g>

  <rect x="-60" y="232" width="520" height="110" fill="url(#gChao)"/>
  <ellipse class="luzFogo" cx="212" cy="272" rx="190" ry="26" fill="url(#gLuzChao)"/>

  ${bigornaSVG()}
  <g clip-path="url(#cpBigorna)"><ellipse cx="${cx}" cy="203" rx="${meia + 30}" ry="11" fill="url(#gReflexo)" opacity=".6" filter="url(#fB6)"/></g>
  <ellipse cx="${cx}" cy="193" rx="${meia + 26}" ry="5" fill="url(#gReflexo)" filter="url(#fB3)"/>

  <ellipse id="cBrilho" cx="${cx}" cy="186" rx="${meia + 40}" ry="22" fill="#ff7a1c" opacity=".45" filter="url(#fB14)"/>
  <path id="cPecaBrilho" d="${formaPeca(f)}" fill="#ff9a3c" filter="url(#fB3)" opacity=".9"/>
  <path id="cPeca" d="${formaPeca(f)}" fill="url(#gMetal)"/>
  <path d="${formaPeca(f)}" fill="url(#gMetalPontas)"/>
  <ellipse cx="${cx + 4}" cy="187" rx="${meia * .66}" ry="2.2" fill="#fffdf2" opacity=".95" filter="url(#fB1)"/>

  <g>
    <path d="M${jx + 9} 183.5Q${jx - 4} 179 ${jx - 20} 179L-40 126" fill="none" stroke="url(#gTenaz)" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M${jx + 9} 194.5Q${jx - 6} 199 ${jx - 22} 186L-40 140" fill="none" stroke="url(#gTenaz)" stroke-width="4.5" stroke-linecap="round"/>
    <circle cx="${jx - 21}" cy="182.5" r="3.6" fill="#5a504a" stroke="#0d0b0a" stroke-width="1"/>
    <ellipse cx="${jx + 6}" cy="189" rx="10" ry="8" fill="#ff8a2a" opacity=".35" filter="url(#fB3)"/>
  </g>

  <path id="cRasto" d="M246 72A165 165 0 0 0 215 155" fill="none" stroke="url(#gRasto)" stroke-width="34" stroke-linecap="round" opacity="0" filter="url(#fB3)"/>
  <g id="cMarteloIdle" style="transform-origin:${PIVO}">
    <g id="cMartelo" style="transform-origin:${PIVO};transform:rotate(32deg)">
      ${marteloSVG()}
    </g>
  </g>
  <ellipse id="cOnda" cx="${IMPACTO[0]}" cy="191" rx="50" ry="7" fill="none" stroke="#ffd27a" stroke-width="2.5" opacity="0" style="transform-origin:${IMPACTO[0]}px 191px"/>
  <circle id="cClarao" cx="${IMPACTO[0]}" cy="${IMPACTO[1]}" r="34" fill="url(#gClarao)" opacity="0" style="transform-origin:${IMPACTO[0]}px ${IMPACTO[1]}px"/>
</svg>`;
}

  // Animações da cena (chamas, carvões, brilho e o martelo a respirar), presas a um contentor.
  function animar(raiz){
    if (!raiz || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const anima = (el, k, o) => el && el.animate && el.animate(k, Object.assign({iterations: Infinity, direction: 'alternate', easing: 'ease-in-out'}, o));
    raiz.querySelectorAll('.cChama').forEach((c, i) => anima(c, [{transform: 'scaleY(.82) scaleX(1.05)', opacity: .55}, {transform: 'scaleY(1.12) scaleX(.94)', opacity: .9}], {duration: 520 + i * 170, delay: -i * 230}));
    raiz.querySelectorAll('.cCarvao').forEach((c, i) => anima(c, [{opacity: .7}, {opacity: 1}], {duration: 700 + (i % 3) * 400, delay: -i * 300}));
    anima(raiz.querySelector('#cBrilho'), [{opacity: .35}, {opacity: .55}], {duration: 1800});
    anima(raiz.querySelector('#cMarteloIdle'), [{transform: 'rotate(0deg)'}, {transform: 'rotate(-2.5deg)'}], {duration: 1400});
  }
  // Uma martelada: o martelo desce, bate na peça e saltam faíscas no ponto de impacto.
  function golpe(raiz, depois){
    const m = raiz && raiz.querySelector('#cMartelo'), svg = raiz && raiz.querySelector('svg');
    if (!m || !svg || matchMedia('(prefers-reduced-motion: reduce)').matches){ if (depois) depois(); return; }
    const a = m.animate([{transform: 'rotate(32deg)'}, {transform: 'rotate(-4deg)', offset: .45}, {transform: 'rotate(2deg)', offset: .6}, {transform: 'rotate(32deg)'}], {duration: 520, easing: 'cubic-bezier(.5,0,.4,1)'});
    setTimeout(() => {
      const ctm = svg.getScreenCTM(); if (!ctm) return;
      const p = svg.createSVGPoint(); p.x = IMPACTO[0]; p.y = IMPACTO[1]; const q = p.matrixTransform(ctm);
      if (window.Centelhas) Centelhas.explodir(q.x, q.y, 'treino', 18);
      const cl = raiz.querySelector('#cClarao'); if (cl) cl.animate([{opacity: .9, transform: 'scale(.6)'}, {opacity: 0, transform: 'scale(1.6)'}], {duration: 380, easing: 'ease-out'});
      const on = raiz.querySelector('#cOnda'); if (on) on.animate([{opacity: .9, transform: 'scale(.5)'}, {opacity: 0, transform: 'scale(1.5)'}], {duration: 420, easing: 'ease-out'});
    }, 235);
    a.onfinish = () => { if (depois) depois(); };
  }
  return {cena: cenaForja, animar, golpe};
})();
