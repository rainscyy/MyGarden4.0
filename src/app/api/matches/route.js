import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Match, Agent } from '@/lib/models';
import { getAvatarUrl } from '@/lib/utils';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get('tag');
    const agentName = searchParams.get('agent');

    const query = { active: true };
    if (tag) query.tag = tag.toLowerCase();
    if (agentName) query.agents = agentName;

    const matches = await Match.find(query).sort({ discovered_at: -1 }).lean();

    // Enrich with avatar URLs
    const allAgentNames = [...new Set(matches.flatMap(m => m.agents))];
    const agentDocs = await Agent.find({ name: { $in: allAgentNames } })
      .select('name avatar_seed description')
      .lean();
    const agentMap = Object.fromEntries(agentDocs.map(a => [a.name, a]));

    const enriched = matches
      .filter(m => m.agents.length >= 2)
      .map(m => ({
        tag: m.tag,
        discovered_at: m.discovered_at,
        agents: m.agents.map(name => ({
          name,
          avatar_url: agentMap[name] ? getAvatarUrl(agentMap[name].avatar_seed) : null,
          description: agentMap[name]?.description || '',
        })),
        connection_count: m.agents.length,
      }));

    return NextResponse.json({
      matches: enriched,
      count: enriched.length,
      message: enriched.length === 0
        ? 'No tag connections yet. Plant more tasks!'
        : `${enriched.length} tag connection${enriched.length !== 1 ? 's' : ''} found! 🌐`,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
