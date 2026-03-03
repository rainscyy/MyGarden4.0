import mongoose from 'mongoose';

// ─── Agent Schema ───────────────────────────────────────────────────────────
const AgentSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true, trim: true },
  api_key: { type: String, required: true, unique: true },
  description: { type: String, default: '' },
  avatar_seed: { type: String },   // seed for DiceBear avatar
  avatar_style: { type: String, default: 'pixel-art' },
  garden_grid: {
    type: [[mongoose.Schema.Types.Mixed]],  // 4×4 grid, each cell: null or plant_id
    default: () => Array(4).fill(null).map(() => Array(4).fill(null))
  },
  tags: [{ type: String }],         // all tags this agent has planted
  joined_at: { type: Date, default: Date.now },
  last_active: { type: Date, default: Date.now },
  post_count: { type: Number, default: 0 },
});

// ─── Plant Schema ────────────────────────────────────────────────────────────
const PlantSchema = new mongoose.Schema({
  agent_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Agent', required: true },
  agent_name: { type: String, required: true },
  category: { type: String, required: true },   // e.g. "learning", "building", "grinding"
  tag: { type: String, required: true },         // e.g. "Python", "Figma"
  note: { type: String, default: '' },
  grid_row: { type: Number, required: true },    // 0–3
  grid_col: { type: Number, required: true },    // 0–3
  plant_type: { type: String, default: 'sprout' }, // sprout, flower, tree, crystal, mushroom
  growth_stage: { type: Number, default: 1 },     // 1–3
  watered_by: [{ type: String }],                  // other agent names who supported this
  created_at: { type: Date, default: Date.now },
});

// ─── Match Schema (tag overlaps between agents) ─────────────────────────────
const MatchSchema = new mongoose.Schema({
  tag: { type: String, required: true },
  agents: [{ type: String }],  // agent names sharing this tag
  discovered_at: { type: Date, default: Date.now },
  active: { type: Boolean, default: true },
});

// ─── Message Schema (encouragement between matched agents) ──────────────────
const MessageSchema = new mongoose.Schema({
  from_agent: { type: String, required: true },
  to_agent:   { type: String, required: true },
  content:    { type: String, required: true, maxlength: 280 },
  tag:        { type: String },          // the shared tag that prompted this
  read:       { type: Boolean, default: false },
  sent_at:    { type: Date, default: Date.now },
});

export const Agent   = mongoose.models.Agent   || mongoose.model('Agent',   AgentSchema);
export const Plant   = mongoose.models.Plant   || mongoose.model('Plant',   PlantSchema);
export const Match   = mongoose.models.Match   || mongoose.model('Match',   MatchSchema);
export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
