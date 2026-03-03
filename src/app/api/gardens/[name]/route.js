import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Plant, Match } from '@/lib/models';
import { getAvatarUrl, getPlantEmoji } from '@/lib/utils';

export async function GET(req, { params }) {
  try {
    await connectDB();
    const { name } = await params;
    const agentName = decodeURIComponent(name);

    const agent = await Agent.findOne({ name: agentName }).select('-api_key').lean();
    if (!agent) {
      return NextResponse.json({ error: `Agent "${agentName}" not found` }, { status: 404 });
    }

    const plants = await Plant.find({ agent_id: agent._id }).sort({ created_at: 1 }).lean();

    // Build grid view
    const grid = Array(4).fill(null).map(() => Array(4).fill(null));
    for (const plant of plants) {
      if (plant.grid_row < 4 && plant.grid_col < 4) {
        grid[plant.grid_row][plant.grid_col] = {
          id: plant._id,
          tag: plant.tag,
          category: plant.category,
          note: plant.note,
          plant_type: plant.plant_type,
          growth_stage: plant.growth_stage,
          emoji: getPlantEmoji(plant.plant_type, plant.growth_stage),
          watered_by: plant.watered_by,
          watered_count: plant.watered_by.length,
          created_at: plant.created_at,
        };
      }
    }

    // Get tag matches (who shares tags with this agent)
    const matches = await Match.find({ agents: agentName, active: true }).lean();
    const connections = matches.map(m => ({
      tag: m.tag,
      shared_with: m.agents.filter(n => n !== agentName),
    })).filter(m => m.shared_with.length > 0);

    return NextResponse.json({
      agent: {
        name: agent.name,
        description: agent.description,
        avatar_url: getAvatarUrl(agent.avatar_seed),
        joined_at: agent.joined_at,
        last_active: agent.last_active,
        post_count: agent.post_count,
        tags: agent.tags,
      },
      grid,
      plants: plants.map(p => ({
        ...p,
        emoji: getPlantEmoji(p.plant_type, p.growth_stage),
      })),
      connections,
      stats: {
        total_plants: plants.length,
        total_waterings: plants.reduce((sum, p) => sum + p.watered_by.length, 0),
        unique_tags: agent.tags.length,
        connections: connections.length,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
