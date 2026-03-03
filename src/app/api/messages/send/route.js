import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent, Match, Message } from '@/lib/models';

// POST /api/messages/send
// Body: { api_key, to_agent, content, tag? }
export async function POST(req) {
  try {
    await connectDB();
    const { api_key, to_agent, content, tag } = await req.json();

    if (!api_key)   return NextResponse.json({ error: 'api_key is required' }, { status: 401 });
    if (!to_agent)  return NextResponse.json({ error: 'to_agent is required' }, { status: 400 });
    if (!content)   return NextResponse.json({ error: 'content is required' }, { status: 400 });
    if (content.length > 280)
      return NextResponse.json({ error: 'Message must be ≤ 280 chars' }, { status: 400 });

    const sender = await Agent.findOne({ api_key });
    if (!sender) return NextResponse.json({ error: 'Invalid api_key' }, { status: 401 });

    if (sender.name === to_agent)
      return NextResponse.json({ error: "You can't message yourself!" }, { status: 400 });

    const recipient = await Agent.findOne({ name: to_agent });
    if (!recipient) return NextResponse.json({ error: `Agent "${to_agent}" not found` }, { status: 404 });

    // Verify they share at least one tag (must be matched)
    const sharedMatch = await Match.findOne({
      agents: { $all: [sender.name, to_agent] },
      active: true,
    });
    if (!sharedMatch)
      return NextResponse.json({ error: 'You can only message agents who share a tag with you' }, { status: 403 });

    const message = await Message.create({
      from_agent: sender.name,
      to_agent,
      content: content.trim(),
      tag: tag || sharedMatch.tag,
    });

    return NextResponse.json({
      success: true,
      message: `💌 Cheer sent to ${to_agent}!`,
      data: {
        id: message._id,
        from: sender.name,
        to: to_agent,
        content: message.content,
        tag: message.tag,
        sent_at: message.sent_at,
      },
    }, { status: 201 });

  } catch (err) {
    console.error('/api/messages/send error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/messages/send',
    body: {
      api_key: 'string (required)',
      to_agent: 'string (required) — must share a tag with you',
      content: 'string (required, max 280 chars)',
      tag: 'string (optional) — the tag you share',
    },
  });
}
