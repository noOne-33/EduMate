import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string; // Make password optional as we might not always fetch it
  role: 'student' | 'instructor' | 'admin';
  status: 'pending' | 'active';
  createdAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false }, // `select: false` prevents password from being returned by default
  role: { type: String, enum: ['student', 'instructor', 'admin'], default: 'student', required: true },
  status: { type: String, enum: ['pending', 'active'], default: 'active', required: true },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
