import mongoose, { Schema, Document } from 'mongoose';

export interface ICourse extends Document {
  title: string;
  instructor: string;
  description: string;
  category: string;
  imageId: string;
  duration: string;
  rating: number;
}

const CourseSchema: Schema = new Schema({
  // Although the local data has an 'id', MongoDB will automatically create a unique '_id'.
  // We can rely on that instead of managing our own.
  title: { type: String, required: true },
  instructor: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  imageId: { type: String, required: true },
  duration: { type: String, required: true },
  rating: { type: Number, required: true },
});

export default mongoose.models.Course || mongoose.model<ICourse>('Course', CourseSchema);