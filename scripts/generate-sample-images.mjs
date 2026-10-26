// Generates illustrated sample product photos (JPEG) for tests and the clearly
// labeled demo store. Usage: node scripts/generate-sample-images.mjs [outDir]
import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const out = path.resolve(process.argv[2] ?? 'tests/fixtures/products')
await mkdir(out, { recursive: true })

const W = 1200
const H = 1200

function scene(bg1, bg2, table, body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient>
    <radialGradient id="shadow" cx="0.5" cy="0.5" r="0.5"><stop offset="0" stop-color="#000" stop-opacity="0.28"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>
    <radialGradient id="shine" cx="0.35" cy="0.3" r="0.7"><stop offset="0" stop-color="#fff" stop-opacity="0.55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.06 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect y="${H * 0.68}" width="${W}" height="${H * 0.32}" fill="${table}"/>
  <rect y="${H * 0.68}" width="${W}" height="6" fill="#000" opacity="0.06"/>
  ${body}
  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.9"/>
</svg>`
}

const shadow = (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#shadow)"/>`

const items = {
  'chocolate-cake': scene('#f6e7dc', '#ead3c3', '#d9b9a0', `
    ${shadow(600, 880, 360, 60)}
    <ellipse cx="600" cy="860" rx="330" ry="70" fill="#f4f1ec"/><ellipse cx="600" cy="850" rx="330" ry="70" fill="#fff"/>
    <rect x="330" y="560" width="540" height="280" fill="#4a2a1c"/>
    <ellipse cx="600" cy="840" rx="270" ry="55" fill="#3e2317"/>
    <rect x="330" y="660" width="540" height="22" fill="#e9c9a8"/><rect x="330" y="750" width="540" height="22" fill="#e9c9a8"/>
    <ellipse cx="600" cy="560" rx="270" ry="58" fill="#5d3524"/>
    <path d="M335 565 q30 70 60 0 q30 80 60 0 q30 60 60 0 q30 90 60 0 q30 70 60 0 q30 80 60 0 q30 60 60 0 q30 75 60 0 q25 60 50 0" fill="#5d3524"/>
    ${[...Array(9)].map((_, i) => `<circle cx="${400 + i * 50}" cy="${540 + (i % 2) * 18}" r="16" fill="#b3122e"/><circle cx="${395 + i * 50}" cy="${535 + (i % 2) * 18}" r="5" fill="#fff" opacity=".6"/>`).join('')}
  `),
  'cheesecake': scene('#eef1f4', '#dfe4ea', '#c9ced6', `
    ${shadow(600, 870, 340, 55)}
    <ellipse cx="600" cy="850" rx="320" ry="65" fill="#fff"/>
    <path d="M330 640 L870 640 L870 820 Q600 880 330 820 Z" fill="#f6e3b4"/>
    <path d="M330 800 L870 800 L870 830 Q600 890 330 830 Z" fill="#c98f4c"/>
    <ellipse cx="600" cy="640" rx="270" ry="56" fill="#fbefcc"/>
    <ellipse cx="600" cy="640" rx="230" ry="44" fill="#c7243a" opacity=".9"/>
    ${[...Array(12)].map((_, i) => `<circle cx="${420 + (i % 6) * 70}" cy="${620 + Math.floor(i / 6) * 34}" r="12" fill="#2b1a6b" opacity=".85"/>`).join('')}
    <ellipse cx="560" cy="625" rx="150" ry="20" fill="url(#shine)"/>
  `),
  'cupcakes': scene('#fbeef2', '#f3d9e1', '#e6c0cc', `
    ${[380, 600, 820].map((x, i) => `
      ${shadow(x, 860, 120, 26)}
      <path d="M${x - 95} 700 L${x + 95} 700 L${x + 75} 850 L${x - 75} 850 Z" fill="${['#f2a7b9', '#8fc9d9', '#f7d27a'][i]}"/>
      ${[...Array(6)].map((_, j) => `<line x1="${x - 80 + j * 32}" y1="705" x2="${x - 66 + j * 27}" y2="848" stroke="#fff" stroke-opacity=".35" stroke-width="6"/>`).join('')}
      <path d="M${x - 105} 705 q20 -90 105 -110 q85 20 105 110 z" fill="#fff6ee"/>
      <path d="M${x - 75} 630 q75 -120 150 0 z" fill="#fff0e4"/>
      <circle cx="${x}" cy="555" r="22" fill="#c8102e"/>
      <path d="M${x} 535 q10 -30 25 -35" stroke="#3b6b2a" stroke-width="5" fill="none"/>`).join('')}
  `),
  'sourdough': scene('#efe6d8', '#e0d2bd', '#a9876a', `
    ${shadow(600, 860, 330, 50)}
    <rect x="250" y="820" width="700" height="40" rx="10" fill="#7a5638"/>
    <ellipse cx="600" cy="700" rx="300" ry="150" fill="#b8742f"/>
    <ellipse cx="600" cy="690" rx="280" ry="130" fill="#c98a3f"/>
    <path d="M420 640 q180 -90 360 0" stroke="#f1d9a8" stroke-width="22" fill="none" stroke-linecap="round"/>
    <path d="M450 700 q150 -60 300 0" stroke="#e8c88f" stroke-width="12" fill="none" stroke-linecap="round" opacity=".8"/>
    <ellipse cx="520" cy="620" rx="140" ry="40" fill="url(#shine)"/>
    ${[...Array(40)].map((_, i) => `<circle cx="${360 + ((i * 53) % 480)}" cy="${600 + ((i * 37) % 160)}" r="2.5" fill="#f8efe0" opacity=".7"/>`).join('')}
  `),
  'cookies': scene('#f3ece4', '#e6dacb', '#cdb79e', `
    ${shadow(600, 860, 360, 50)}
    <ellipse cx="600" cy="830" rx="360" ry="80" fill="#e8edf0"/><ellipse cx="600" cy="820" rx="340" ry="70" fill="#fff"/>
    ${[[470, 760], [640, 740], [780, 780], [560, 810], [700, 690]].map(([x, y]) => `
      <ellipse cx="${x}" cy="${y + 8}" rx="95" ry="36" fill="#9c6a35"/>
      <ellipse cx="${x}" cy="${y}" rx="95" ry="36" fill="#d79a52"/>
      ${[...Array(6)].map((_, k) => `<ellipse cx="${x - 55 + k * 22}" cy="${y - 10 + (k % 3) * 9}" rx="9" ry="5" fill="#3d2214"/>`).join('')}`).join('')}
  `),
  'blue-bowl': scene('#e9eef0', '#d7dfe3', '#bcc6cb', `
    ${shadow(600, 860, 300, 50)}
    <path d="M330 600 Q330 860 600 860 Q870 860 870 600 Z" fill="#1f4f7a"/>
    <path d="M360 620 Q370 830 600 835 Q830 830 840 620 Z" fill="#2c6aa0" opacity=".55"/>
    <ellipse cx="600" cy="600" rx="270" ry="60" fill="#e9e3d6"/>
    <ellipse cx="600" cy="610" rx="240" ry="46" fill="#d7cfbf"/>
    <path d="M360 640 q60 30 120 0 t120 0 t120 0 t120 0" stroke="#9fc3e3" stroke-width="8" fill="none" opacity=".7"/>
    <ellipse cx="470" cy="700" rx="60" ry="110" fill="url(#shine)"/>
  `),
  'vase': scene('#f1ede6', '#e2dbd0', '#b9ab98', `
    ${shadow(600, 880, 200, 36)}
    <path d="M520 360 L680 360 L670 420 Q800 520 780 700 Q760 870 600 875 Q440 870 420 700 Q400 520 530 420 Z" fill="#c96f4a"/>
    <path d="M520 360 L680 360 L670 420 Q800 520 780 700 Q760 870 600 875 Q440 870 420 700 Q400 520 530 420 Z" fill="url(#shine)"/>
    <ellipse cx="600" cy="360" rx="80" ry="16" fill="#8f4a30"/>
    <path d="M440 640 q160 40 320 0" stroke="#f0d9c4" stroke-width="10" fill="none" opacity=".8"/>
    <path d="M600 360 q-40 -140 -120 -200 M600 360 q30 -170 110 -230 M600 360 q-5 -160 10 -260" stroke="#5f7a4a" stroke-width="7" fill="none"/>
    <circle cx="480" cy="160" r="26" fill="#f0e3c2"/><circle cx="710" cy="130" r="22" fill="#f0e3c2"/><circle cx="610" cy="100" r="24" fill="#f5ecd6"/>
  `),
  'mug': scene('#e8ece6', '#d6ddd3', '#a8b3a2', `
    ${shadow(600, 860, 260, 40)}
    <path d="M420 520 L780 520 L760 840 Q600 870 440 840 Z" fill="#f2efe8"/>
    <path d="M420 520 L780 520 L775 600 L425 600 Z" fill="#4d6b53"/>
    <path d="M780 590 q120 10 110 120 q-10 100 -125 90" stroke="#f2efe8" stroke-width="40" fill="none"/>
    <ellipse cx="600" cy="520" rx="180" ry="30" fill="#e3ddd2"/>
    <ellipse cx="600" cy="525" rx="160" ry="22" fill="#5b3a26"/>
    <path d="M540 470 q20 -40 0 -80 M600 470 q20 -50 0 -100 M660 470 q20 -40 0 -80" stroke="#fff" stroke-width="8" fill="none" opacity=".5" stroke-linecap="round"/>
    <ellipse cx="500" cy="700" rx="40" ry="120" fill="url(#shine)"/>
  `),
  'gold-ring': scene('#2b2f3a', '#1d2029', '#3b3f4b', `
    ${shadow(600, 820, 220, 40)}
    <ellipse cx="600" cy="680" rx="200" ry="150" fill="none" stroke="#c9a24d" stroke-width="44"/>
    <ellipse cx="600" cy="680" rx="200" ry="150" fill="none" stroke="#f3d98b" stroke-width="12" opacity=".7"/>
    <path d="M560 520 L600 450 L640 520 L600 560 Z" fill="#cfe8ff"/>
    <path d="M560 520 L600 450 L600 560 Z" fill="#9fc8f0"/>
    <path d="M580 500 L600 470 L605 500 Z" fill="#fff" opacity=".9"/>
  `),
  'necklace': scene('#f4f0ea', '#e8e0d4', '#d6c9b6', `
    <path d="M300 200 Q300 700 600 760 Q900 700 900 200" stroke="#b8923e" stroke-width="8" fill="none"/>
    <path d="M300 200 Q300 700 600 760 Q900 700 900 200" stroke="#f1d58e" stroke-width="3" fill="none" opacity=".8"/>
    ${shadow(600, 900, 90, 18)}
    <circle cx="600" cy="800" r="56" fill="#b8923e"/>
    <circle cx="600" cy="800" r="40" fill="#e9eef4"/>
    <circle cx="588" cy="786" r="12" fill="#fff" opacity=".9"/>
  `),
  'soy-candle': scene('#eee9f1', '#ddd5e3', '#bfb3c8', `
    ${shadow(600, 870, 230, 40)}
    <rect x="430" y="520" width="340" height="340" rx="30" fill="#e8ddd0" opacity=".95"/>
    <rect x="430" y="600" width="340" height="140" fill="#6c4f86"/>
    <text x="600" y="690" font-family="serif" font-size="56" fill="#f6efe6" text-anchor="middle">לבנדר</text>
    <ellipse cx="600" cy="520" rx="170" ry="26" fill="#f6efe6"/>
    <rect x="596" y="440" width="8" height="70" fill="#333"/>
    <path d="M600 330 q40 60 0 110 q-40 -50 0 -110" fill="#f7b733"/><path d="M600 370 q18 30 0 60 q-18 -30 0 -60" fill="#fff3c2"/>
  `),
  'jam-jar': scene('#fbf1e6', '#f2e1cc', '#d7b48f', `
    ${shadow(600, 870, 220, 40)}
    <rect x="440" y="460" width="320" height="400" rx="40" fill="#a3122a"/>
    <rect x="440" y="460" width="320" height="400" rx="40" fill="url(#shine)"/>
    <rect x="460" y="400" width="280" height="80" rx="12" fill="#f3e6d3"/>
    <path d="M450 400 q30 -30 60 0 q30 -30 60 0 q30 -30 60 0 q30 -30 60 0 q30 -30 60 0" fill="#c8a06a"/>
    <rect x="480" y="600" width="240" height="140" rx="10" fill="#fff8ec"/>
    <text x="600" y="690" font-family="serif" font-size="52" fill="#a3122a" text-anchor="middle">תות</text>
  `),
}

for (const [name, svg] of Object.entries(items)) {
  await sharp(Buffer.from(svg)).jpeg({ quality: 86 }).toFile(path.join(out, `${name}.jpg`))
}
console.log(`wrote ${Object.keys(items).length} images to ${out}`)
