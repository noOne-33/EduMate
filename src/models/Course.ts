import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  _id: string;
  title: string;
  instructor: string;
  description: string;
  category: string;
  imageId: string;
  duration: string;
  rating: number;
  price: number;
  url?: string;
  youtubeUrl?: string;
}

const CourseSchema: Schema = new Schema({
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageId: { type: String, required: true },
  duration: { type: String, required: true },
  rating: { type: Number, required: true, min: 0, max: 5 },
  price: { type: Number, required: true, min: 0 },
  url: { type: String },
  youtubeUrl: { type: String },
});

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);
