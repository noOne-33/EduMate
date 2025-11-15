import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ISubmission extends Document {
  course: Types.ObjectId;
  assignment: Types.ObjectId;
  user: Types.ObjectId;
  submissionUrl?: string; // For URL submissions
  submissionDataUri?: string; // For file uploads
  status: 'submitted' | 'graded';
  grade?: string;
  submittedAt: Date;
}

const SubmissionSchema: Schema = new Schema({
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true, index: true },
  assignment: { type: Schema.Types.ObjectId, ref: 'Assignment', required: true, index: true },
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  submissionUrl: { type: String },
  submissionDataUri: { type: String }, // Storing file as data URI
  status: { type: String, enum: ['submitted', 'graded'], default: 'submitted' },
  grade: { type: String },
  submittedAt: { type: Date, default: Date.now },
}, { timestamps: true });

// A user should only submit to an assignment once
SubmissionSchema.index({ user: 1, assignment: 1 }, { unique: true });

// Ensure at least one submission type is present
SubmissionSchema.pre('validate', function(next) {
  if (!this.submissionUrl && !this.submissionDataUri) {
    next(new Error('Either submissionUrl or submissionDataUri must be provided.'));
  } else {
    next();
  }
});

export default mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);