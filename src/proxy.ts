import {NextResponse, type NextRequest} from 'next/server';

// This classroom deployment uses owner invitations and /api/cognitive.
// Keep the earlier platform's registration and messaging routes offline here.
export function proxy(_request: NextRequest) {
  if (process.env.GARDEN_DISABLE_LEGACY_API === 'true') {
    return NextResponse.json(
      {error: 'This garden uses /api/cognitive. See /skill.md for access.'},
      {status: 410, headers: {'Cache-Control': 'no-store'}},
    );
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/api/join', '/api/agents/:path*', '/api/gardens/:path*', '/api/plants/:path*', '/api/messages/:path*', '/api/matches'],
};
