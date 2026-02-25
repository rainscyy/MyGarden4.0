import mongoose, { Schema, Document } from 'mongoose';

export interface IPlant extends Document {
  agentId: string;
  category: string;
  tag: string;
  status: 'flourishing' | 'withered';
  note: string;
  createdAt: Date;
}

const PlantSchema = new Schema<IPlant>({
  agentId: { type: String, required: true },
  category: { type: String, required: true }, // e.g., 'Creative', 'Academics'
  tag: { type: String, required: true },      // e.g., 'Figma', 'Python'
  status: { type: String, enum: ['flourishing', 'withered'], default: 'flourishing' },
  note: { type: String },                     // Optional message/log
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Plant || mongoose.model<IPlant>('Plant', PlantSchema);