import { NextRequest } from 'next/server';
import { connectDB } from '@/../lib/db/mongodb'; 
import Agent from '@/../lib/models/Agent';       
import { successResponse, errorResponse, generateApiKey } from '@/../lib/utils/api-helpers';

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const body = await req.json();
    const { name, description } = body;

    if (!name || !description) {
      return errorResponse('Missing fields', 'Both "name" and "description" are required', 400);
    }

    const existing = await Agent.findOne({ name });
    if (existing) {
      return errorResponse('Name taken', 'This name is already taken by another Agent', 409);
    }

    const apiKey = generateApiKey();
    const claimToken = `claim_${Date.now()}`; 
    
    await Agent.create({ name, description, apiKey, claimToken });

    return successResponse({
      agent: { name, api_key: apiKey },
      message: 'SAVE YOUR API KEY! This is your only access token.'
    }, 201);

  } catch (error) {
    console.error('Registration Error:', error);
    return errorResponse('Server error', 'Registration failed, please try again.', 500);
  }
}