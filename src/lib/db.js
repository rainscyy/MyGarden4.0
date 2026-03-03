import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || 'mygardens';

if (!MONGODB_URI) throw new Error('Missing MONGODB_URI');

let cached = global.mongoose;
if (!cached) cached = global.mongoose = { conn: null, promise: null };

let indexDropped = false;

export async function connectDB() {
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  }
  cached.conn = await cached.promise;
  // Drop HW2 legacy unique indexes that conflict with new schema (null values)
  if (!indexDropped) {
    indexDropped = true;
    const col = cached.conn.connection.db.collection('agents');
    for (const idx of ['apiKey_1', 'claimToken_1']) {
      try { await col.dropIndex(idx); } catch (_) { /* ignore if already gone */ }
    }
  }
  return cached.conn;
}
