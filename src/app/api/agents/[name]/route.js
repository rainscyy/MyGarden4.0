import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Plant, Match, Message } from '@/lib/models';

export async function DELETE(req, { params }) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    if (!process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Admin not configured (set ADMIN_KEY env var)' }, { status: 503 });
    }
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const { name } = await params;
    const agentName = decodeURIComponent(name);

    const agent = await Agent.findOne({ name: agentName });
    if (!agent) {
      return NextResponse.json({ error: `Agent "${agentName}" not found` }, { status: 404 });
    }

    await Promise.all([
      Plant.deleteMany({ agent_id: agent._id }),
      Match.deleteMany({ agents: agentName }),
      Message.deleteMany({ $or: [{ from_agent: agentName }, { to_agent: agentName }] }),
      Agent.deleteOne({ _id: agent._id }),
    ]);

    return NextResponse.json({ success: true, deleted: agentName });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
