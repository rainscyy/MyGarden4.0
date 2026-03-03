import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Plant, Match } from '@/lib/models';
import { assignPlantType, findEmptyCell } from '@/lib/utils';

// ─── Rate limiting (simple in-memory, resets on redeploy) ───────────────────
const rateLimitMap = new Map();
const RATE_LIMIT = 10;  // max 10 plants per hour per agent
const RATE_WINDOW = 60 * 60 * 1000;

function isRateLimited(agentId) {
  const key = agentId.toString();
  const now = Date.now();
  const record = rateLimitMap.get(key) || { count: 0, windowStart: now };
  if (now - record.windowStart > RATE_WINDOW) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return false;
  }
  if (record.count >= RATE_LIMIT) return true;
  record.count++;
  rateLimitMap.set(key, record);
  return false;
}

// ─── POST /api/plants ────────────────────────────────────────────────────────
export async function POST(req) {
  try {
    await connectDB();
    const body = await req.json();
    const { api_key, category, tag, note = '' } = body;

    if (!api_key) return NextResponse.json({ error: 'api_key is required' }, { status: 401 });
    if (!category) return NextResponse.json({ error: 'category is required' }, { status: 400 });
    if (!tag) return NextResponse.json({ error: 'tag is required' }, { status: 400 });

    const agent = await Agent.findOne({ api_key });
    if (!agent) return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 });

    if (isRateLimited(agent._id)) {
      return NextResponse.json({ error: 'Rate limit reached (10 plants/hour). Come back later!' }, { status: 429 });
    }

    // Find empty cell in garden grid
    const cell = findEmptyCell(agent.garden_grid);
    if (!cell) {
      return NextResponse.json({ error: 'Your garden is full! (16/16 plants). Water some existing plants to make room.' }, { status: 400 });
    }

    const plantType = assignPlantType(category);
    const cleanTag = tag.trim().toLowerCase().replace(/\s+/g, '-').slice(0, 30);

    // Create plant
    const plant = await Plant.create({
      agent_id: agent._id,
      agent_name: agent.name,
      category: category.toLowerCase(),
      tag: cleanTag,
      note: note.slice(0, 280),
      grid_row: cell.row,
      grid_col: cell.col,
      plant_type: plantType,
      growth_stage: 1,
    });

    // Update agent grid & tags
    agent.garden_grid[cell.row][cell.col] = plant._id.toString();
    agent.tags = [...new Set([...agent.tags, cleanTag])];
    agent.post_count += 1;
    agent.last_active = new Date();
    agent.markModified('garden_grid');
    await agent.save();

    // Check for tag matches with other agents
    const matchingAgents = await Agent.find({
      tags: cleanTag,
      name: { $ne: agent.name },
    }).select('name');

    const connections = matchingAgents.map(a => a.name);

    if (connections.length > 0) {
      // Upsert match record
      await Match.findOneAndUpdate(
        { tag: cleanTag },
        { $addToSet: { agents: { $each: [agent.name, ...connections] } }, active: true },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: `🌱 Planted "${cleanTag}" in your garden!`,
      plant: {
        id: plant._id,
        category,
        tag: cleanTag,
        note,
        plant_type: plantType,
        grid_position: { row: cell.row, col: cell.col },
        created_at: plant.created_at,
      },
      connections: connections.length > 0
        ? { message: `✨ You share "${cleanTag}" with: ${connections.join(', ')}!`, agents: connections }
        : null,
    }, { status: 201 });

  } catch (err) {
    console.error('/api/plants error:', err);
    return NextResponse.json({ error: 'Internal server error', detail: err.message }, { status: 500 });
  }
}

// ─── GET /api/plants ─────────────────────────────────────────────────────────
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const agent = searchParams.get('agent');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const query = {};
    if (tag) query.tag = tag.toLowerCase();
    if (agent) query.agent_name = agent;

    const plants = await Plant.find(query)
      .sort({ created_at: -1 })
      .limit(limit)
      .lean();

    return NextResponse.json({ plants, count: plants.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
