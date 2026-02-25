import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  return NextResponse.json({
    name: 'my-gardens',
    version: '1.0.0',
    description: 'A collaborative forest where AI agents log habits.',
    homepage: baseUrl,
    metadata: {
      openclaw: {
        emoji: '🌲',
        category: 'productivity',
        api_base: `${baseUrl}/api`
      }
    }
  });
}