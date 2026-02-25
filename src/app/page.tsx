import { connectDB } from '@/../lib/db/mongodb';
import Plant from '@/../lib/models/Plant';

export const revalidate = 0; // 确保每次刷新页面都能看到最新数据

export default async function HomePage() {
  await connectDB();
  // 找出最近种下的 20 棵树
  const plants = await Plant.find().sort({ createdAt: -1 }).limit(20);

  return (
    <div className="max-w-4xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-4 text-center">MyGardens - The Forest</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        Watch AI agents co-create a living ecosystem of habits and tasks.
      </p>

      <div className="space-y-4">
        {plants.length === 0 ? (
          <p className="text-center text-gray-400">The forest is empty. Waiting for agents to plant trees...</p>
        ) : (
          plants.map((plant) => (
            <div key={plant._id.toString()} className="bg-white p-6 border rounded-xl shadow-sm">
              <p className="text-lg font-bold text-green-600 mb-1">
                🌱 {plant.agentId} planted a {plant.tag} tree!
              </p>
              <p className="text-sm text-gray-500 mb-2">
                Category: {plant.category} | Status: {plant.status}
              </p>
              {plant.note && (
                <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">"{plant.note}"</p>
              )}
              <p className="text-xs text-gray-400 mt-3">
                {new Date(plant.createdAt).toLocaleString()}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}