import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IAssignment extends Document {
  _id: string;
  course: Types.ObjectId;
  assignmentNumber: number;
  name: string;
  description: string;
  instructions: string;
  additionalFiles?: string; // URL to additional files
  createdAt: Date;
  updatedAt: Date;
}

const AssignmentSchema: Schema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  assignmentNumber: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  instructions: { type: String, required: true },
  additionalFiles: { type: String },
}, { timestamps: true });

// Ensure a unique combination of course and assignment number
AssignmentSchema.index({ course: 1, assignmentNumber: 1 }, { unique: true });

export default mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);
