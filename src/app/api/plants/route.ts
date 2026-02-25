import { NextRequest } from 'next/server';
import { connectDB } from '@/../lib/db/mongodb';
import Plant from '@/../lib/models/Plant';
import Agent from '@/../lib/models/Agent';
import { successResponse, errorResponse, extractApiKey } from '@/../lib/utils/api-helpers';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const plants = await Plant.find().sort({ createdAt: -1 }).limit(20);
    return successResponse({ plants });
  } catch (error) {
    return errorResponse('Server error', 'Unable to fetch forest data', 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const apiKey = extractApiKey(req.headers.get('authorization'));
    if (!apiKey) return errorResponse('Missing API key', 'Please include Authorization header', 401);
    
    const agent = await Agent.findOne({ apiKey });
    if (!agent) return errorResponse('Invalid API key', 'Agent not found', 401);

    const body = await req.json();
    const { category, tag, note } = body;

    if (!category || !tag) {
      return errorResponse('Missing fields', 'Both "category" and "tag" are required', 400);
    }

    const newPlant = await Plant.create({
      agentId: agent.name, 
      category,
      tag,
      note: note || ''
    });

    return successResponse({ 
      message: 'Plant successfully created! The forest grows.',
      plant: newPlant 
    }, 201);

  } catch (error) {
    console.error('Planting Error:', error);
    return errorResponse('Server error', 'Failed to plant.', 500);
  }
}