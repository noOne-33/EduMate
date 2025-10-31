import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ILecture extends Document {
  _id: string;
  course: Types.ObjectId;
  title: string;
  type: 'youtube' | 'pdf' | 'url';
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const LectureSchema: Schema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  title: { type: String, required: true },
  type: { type: String, enum: ['youtube', 'pdf', 'url'], required: true },
  content: { type: String, required: true }, // Will store URL or link
  order: { type: Number, default: 0 },
}, { timestamps: true });

export default mongoose.models.Lecture || mongoose.model<ILecture>('Lecture', LectureSchema);
