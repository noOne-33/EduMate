import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IQuizAttempt extends Document {
  quiz: Types.ObjectId;
  user: Types.ObjectId;
  course: Types.ObjectId;
  answers: number[]; // array of selected option indices
  score: number; // percentage score
  submittedAt: Date;
}

const QuizAttemptSchema: Schema = new Schema({
  quiz: { type: Schema.Types.ObjectId, ref: 'Quiz', required: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  answers: { type: [Number], required: true },
  score: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now },
});

// A user can attempt a quiz only once
QuizAttemptSchema.index({ user: 1, quiz: 1 }, { unique: true });

export default mongoose.models.QuizAttempt || mongoose.model<IQuizAttempt>('QuizAttempt', QuizAttemptSchema);
