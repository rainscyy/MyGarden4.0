// Pure SVG pixel-art plant — no external images, no client JS needed
// Each plant is a 2D string grid where chars map to palette colors.
// S = px per pixel cell

const S = 5;

// ── Pixel Data ───────────────────────────────────────────────────────────────
// '.' = transparent  |  other chars = colors from palette

const PLANTS = {

  // Tech / Building — Blue Crystal ──────────────────────────────────────────
  tech: {
    palette: { b:'#93c5fd', B:'#3b82f6', K:'#1d4ed8', c:'#bfdbfe', s:'#78716c', S:'#57534e', g:'#a7f3d0' },
    anim: 'breathe',
    stages: [
      // Stage 1: small diamond
      ['....b....','...bBb...','..bBKBb..','...bBb...','....b....','....s....','....s....'],
      // Stage 2: larger, glow ring
      ['....c....','..cbBbc..','..bBKBb..','cBBKKKBBc','..bBKBb..','..cbBbc..','....s....','....S....'],
      // Stage 3: full crystal + base sparkles
      ['....c....','..cbBbc..','cBBBKBBBc','BBBKKKKBBB','cBBBKBBBc','..cbBbc..','...gcg...','....s....','....S....','....S....'],
    ],
  },

  // Creative / Art — Pink Blossom ────────────────────────────────────────────
  creative: {
    palette: { P:'#ec4899', p:'#f9a8d4', c:'#fce7f3', y:'#fde047', Y:'#facc15', s:'#78716c', S:'#57534e' },
    anim: 'sway',
    stages: [
      // Stage 1: small 4-petal
      ['....p....','...pPp...','..pPPPp..','...pPp...','....y....','....s....','....s....'],
      // Stage 2: fuller petals
      ['..cpPpc..','..pPPPp..','cpPPPPPpc','..pPPPp..','...pPp...','....Y....','....s....','....S....'],
      // Stage 3: full bloom, double ring
      ['.cpPPPpc.','pPPPPPPPp','cPPPPPPPc','pPPPPPPPp','.cpPPPpc.','...yYy...','....s....','....S....','....S....'],
    ],
  },

  // Learning / Academic — Green Fern ────────────────────────────────────────
  fern: {
    palette: { G:'#15803d', g:'#4ade80', l:'#bbf7d0', s:'#92400e', S:'#78350f' },
    anim: 'sway',
    stages: [
      // Stage 1: simple sprout
      ['....g....','...gGg...','..gGGGg..','..g.G.g..','....s....','....s....'],
      // Stage 2: two-layer leaves
      ['..lgl....','.lgGgl...','lgGGGGgl.','lgGGGGGgl','...gGg...','....s....','....S....'],
      // Stage 3: full fern canopy
      ['.lglglgl.','lgGGGGGgl','lGGGGGGGl','lgGGGGGgl','.lgGGGgl.','..lgGgl..','....s....','....S....','....S....'],
    ],
  },

  // Grinding / Strategy — Gold Cactus ───────────────────────────────────────
  cactus: {
    palette: { C:'#16a34a', c:'#22c55e', G:'#ca8a04', g:'#fde047', s:'#92400e', S:'#78350f' },
    anim: 'sway',
    stages: [
      // Stage 1: short cactus
      ['....C....','...CCC...','....C....','....C....','...CCC...'],
      // Stage 2: arms
      ['....g....','...gGg...','..g.C.g..','gCCCCCCCg','....C....','....C....','...CCC...'],
      // Stage 3: flowering cactus
      ['...gGg...','..gGGGg..','g.gGGGg.g','gCCCCCCCg','..C...C..','...CCC...','....C....','...CCC...'],
    ],
  },

  // Mushroom / Exploring — Purple Shroom ────────────────────────────────────
  mushroom: {
    palette: { M:'#7c3aed', m:'#c4b5fd', d:'#ddd6fe', s:'#e2e8f0', S:'#cbd5e1', p:'#fce7f3' },
    anim: 'breathe',
    stages: [
      ['....m....','..mdMdm..','..MMMMM..','...sss...','...sss...'],
      ['..mdMdm..','mMMMMMMMm','.MMMMMMm.','....s....','....s....','...sss...'],
      ['.dmdMdmd.','.mMMMMMm.','MMMMMMMMM','.mMMMMMm.','....s....','....S....','...sSs...'],
    ],
  },
};

// Map category/plantType strings → plant key
const CATEGORY_MAP = {
  building:'tech', tech:'tech', crystal:'tech',
  creating:'creative', creative:'creative', flower:'creative', rose:'creative', sunflower:'creative',
  learning:'fern', academic:'fern', fern:'fern', sprout:'fern', vine:'fern', moss:'fern', palm:'fern',
  grinding:'cactus', strategy:'cactus', exploring:'cactus', cactus:'cactus', bamboo:'cactus',
  mushroom:'mushroom', tree:'mushroom',
};

// ── SVG renderer ──────────────────────────────────────────────────────────────
function renderPlant(rows, palette, anim) {
  const height = rows.length;
  const width  = rows[0].length;
  const W = width  * S;
  const H = height * S;

  const animCSS = anim === 'sway'
    ? `@keyframes pp-sway{0%,100%{transform:rotate(-2deg)}50%{transform:rotate(2deg)}}.pp-root{transform-origin:${W/2}px ${H}px;animation:pp-sway 2.5s ease-in-out infinite}`
    : `@keyframes pp-breathe{0%,100%{transform:scaleY(1)}50%{transform:scaleY(1.06)}}.pp-root{transform-origin:${W/2}px ${H}px;animation:pp-breathe 2s ease-in-out infinite}`;

  const rects = [];
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      if (ch !== '.') rects.push(`<rect x="${x*S}" y="${y*S}" width="${S}" height="${S}" fill="${palette[ch] || '#000'}"/>`);
    });
  });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" style="image-rendering:pixelated;display:block"><style>${animCSS}</style><g class="pp-root">${rects.join('')}</g></svg>`;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function PixelPlant({ category = 'learning', plantType, growthStage = 1 }) {
  const key   = CATEGORY_MAP[category?.toLowerCase()] || CATEGORY_MAP[plantType?.toLowerCase()] || 'fern';
  const plant = PLANTS[key];
  const idx   = Math.min(Math.max((growthStage ?? 1) - 1, 0), 2);
  const svg   = renderPlant(plant.stages[idx], plant.palette, plant.anim);

  return (
    <span
      dangerouslySetInnerHTML={{ __html: svg }}
      style={{ display:'inline-flex', alignItems:'flex-end' }}
    />
  );
}
