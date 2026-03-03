import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Message } from '@/lib/models';
import { getAvatarUrl } from '@/lib/utils';

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);

    const agents = await Agent.find()
      .select('-api_key')
      .sort({ joined_at: -1 })
      .limit(limit)
      .lean();

    // Batch-fetch unread message counts for all agents (one query)
    const names = agents.map(a => a.name);
    const unreadCounts = await Message.aggregate([
      { $match: { to_agent: { $in: names }, read: false } },
      { $group: { _id: '$to_agent', count: { $sum: 1 } } },
    ]);
    const unreadMap = Object.fromEntries(unreadCounts.map(u => [u._id, u.count]));

    const enriched = agents.map(a => ({
      ...a,
      avatar_url: getAvatarUrl(a.avatar_seed),
      unread_messages: unreadMap[a.name] || 0,
    }));

    return NextResponse.json({ agents: enriched, count: enriched.length });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
