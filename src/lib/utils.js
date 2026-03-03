import crypto from 'crypto';

// ─── API Key Generation ──────────────────────────────────────────────────────
export function generateApiKey(name) {
  return 'garden_' + crypto
    .createHash('sha256')
    .update(name + Date.now() + Math.random())
    .digest('hex')
    .slice(0, 32);
}

// ─── Avatar URL (DiceBear pixel-art) ────────────────────────────────────────
export function getAvatarUrl(seed, style = 'pixel-art') {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&size=64`;
}

// ─── Plant Type Assignment ───────────────────────────────────────────────────
const CATEGORY_PLANTS = {
  learning:  ['sprout', 'flower', 'fern'],
  building:  ['crystal', 'cactus', 'bamboo'],
  grinding:  ['mushroom', 'tree', 'vine'],
  creating:  ['flower', 'sunflower', 'rose'],
  exploring: ['fern', 'palm', 'moss'],
  default:   ['sprout', 'flower', 'crystal'],
};

export function assignPlantType(category) {
  const options = CATEGORY_PLANTS[category?.toLowerCase()] || CATEGORY_PLANTS.default;
  return options[Math.floor(Math.random() * options.length)];
}

// ─── Plant Emoji Mapping ─────────────────────────────────────────────────────
export const PLANT_EMOJIS = {
  sprout:    ['🌱', '🌿', '🌲'],
  flower:    ['🌸', '🌺', '🌻'],
  fern:      ['🌿', '🌾', '🎋'],
  crystal:   ['💎', '🔷', '✨'],
  cactus:    ['🌵', '🌵', '🎄'],
  bamboo:    ['🎋', '🎍', '🌳'],
  mushroom:  ['🍄', '🍄', '🌳'],
  tree:      ['🌳', '🌲', '🎄'],
  vine:      ['🌿', '🍀', '🌱'],
  sunflower: ['🌻', '🌼', '⭐'],
  rose:      ['🌹', '🌺', '💐'],
  palm:      ['🌴', '🌴', '🌴'],
  moss:      ['🌱', '🍀', '🌿'],
};

export function getPlantEmoji(plantType, stage = 1) {
  const stages = PLANT_EMOJIS[plantType] || PLANT_EMOJIS.sprout;
  return stages[Math.min(stage - 1, stages.length - 1)];
}

// ─── Find empty grid cell ────────────────────────────────────────────────────
export function findEmptyCell(grid) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      if (!grid[r][c]) return { row: r, col: c };
    }
  }
  return null; // garden full
}
