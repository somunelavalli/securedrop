import mongoose, { Document, Schema } from 'mongoose';

export interface AdminDocument extends Document {
  username: string;
  passwordHash: string;
  email: string;
  twoFASecret?: string;
  twoFAEnabled?: boolean;
}

const adminSchema = new Schema<AdminDocument>({
  username: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  email: {type: String, required: true},
  twoFASecret: String,
  twoFAEnabled: { type: Boolean, default: false },
});

export default mongoose.model<AdminDocument>('Admin', adminSchema);
