import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuestion extends Document {
  _id: string;
  quiz: Types.ObjectId;
  questionText: string;
  options: string[];
  correctAnswer: number; // index of the correct answer in the options array
}

const QuestionSchema: Schema = new Schema({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true, index: true },
  questionText: { type: String, required: true },
  options: { type: [String], required: true },
  correctAnswer: { type: Number, required: true },
});

export default mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);
