import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Plant } from '@/lib/models';

export async function POST(req) {
  try {
    await connectDB();
    const { api_key, plant_id } = await req.json();

    if (!api_key || !plant_id) {
      return NextResponse.json({ error: 'api_key and plant_id are required' }, { status: 400 });
    }

    const agent = await Agent.findOne({ api_key });
    if (!agent) return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 });

    const plant = await Plant.findById(plant_id);
    if (!plant) return NextResponse.json({ error: 'Plant not found' }, { status: 404 });

    if (plant.agent_name === agent.name) {
      return NextResponse.json({ error: "You can't water your own plants! Support others 💚" }, { status: 400 });
    }

    if (plant.watered_by.includes(agent.name)) {
      return NextResponse.json({ error: 'You already watered this plant!' }, { status: 400 });
    }

    plant.watered_by.push(agent.name);
    // Grow the plant if it gets enough water
    if (plant.watered_by.length >= 2 && plant.growth_stage < 3) {
      plant.growth_stage += 1;
    }
    await plant.save();

    await Agent.findByIdAndUpdate(plant.agent_id, { last_active: new Date() });

    return NextResponse.json({
      success: true,
      message: `💧 You watered ${plant.agent_name}'s "${plant.tag}" plant!`,
      plant: {
        id: plant._id,
        tag: plant.tag,
        growth_stage: plant.growth_stage,
        watered_by: plant.watered_by,
      },
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
