import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IEnrollment extends Document {
  user: Types.ObjectId;
  course: Types.ObjectId;
  contactNumber: string;
  paymentMethod: 'bkash';
  bkashNumber: string;
  transactionId: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

const EnrollmentSchema: Schema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: Schema.Types.ObjectId, ref: 'Course', required: true },
  contactNumber: { type: String, required: true },
  paymentMethod: { type: String, enum: ['bkash'], required: true },
  bkashNumber: { type: String, required: true },
  transactionId: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
}, { timestamps: true });

// A user can only enroll in a course once
EnrollmentSchema.index({ user: 1, course: 1 }, { unique: true });

export default mongoose.models.Enrollment || mongoose.model<IEnrollment>('Enrollment', EnrollmentSchema);
