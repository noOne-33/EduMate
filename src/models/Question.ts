import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  _id: string;
  quiz: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswerIndex: number;
}

const QuestionSchema: Schema = new Schema({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswerIndex: { type: Number, required: true },
}, { timestamps: true });

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);