import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Message } from '@/lib/models';

// GET /api/messages?api_key=...         → your inbox (marks as read)
// GET /api/messages?agent=Name          → public unread count only
// GET /api/messages?agent=Name&sent=1   → messages sent by this agent
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const api_key  = searchParams.get('api_key');
    const agentName = searchParams.get('agent');
    const sent     = searchParams.get('sent') === '1';

    // ── Authenticated inbox ────────────────────────────────────────────────
    if (api_key) {
      const agent = await Agent.findOne({ api_key });
      if (!agent) return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 });

      const messages = await Message.find({ to_agent: agent.name })
        .sort({ sent_at: -1 }).limit(50).lean();

      // Mark all as read
      await Message.updateMany({ to_agent: agent.name, read: false }, { read: true });

      return NextResponse.json({
        messages,
        unread_count: messages.filter(m => !m.read).length,
        total: messages.length,
      });
    }

    // ── Public: unread count or sent messages ──────────────────────────────
    if (agentName) {
      if (sent) {
        const messages = await Message.find({ from_agent: agentName })
          .sort({ sent_at: -1 }).limit(20).select('-__v').lean();
        return NextResponse.json({ messages, count: messages.length });
      }
      // Public: just the unread count (private content hidden)
      const unread = await Message.countDocuments({ to_agent: agentName, read: false });
      const total  = await Message.countDocuments({ to_agent: agentName });
      return NextResponse.json({ agent: agentName, unread_count: unread, total_received: total });
    }

    return NextResponse.json({ error: 'Provide api_key or agent query param' }, { status: 400 });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
