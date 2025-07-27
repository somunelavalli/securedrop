import mongoose, { Document } from 'mongoose'

export interface dbFileSchema extends Document {
  originalName: string,
  storedName: string,
  downloadCount: number,
  maxDownloads: number, // Self-destruct after X downloads
  expiresAt: Date,       // Self-destruct after a certain time
  password: string,      // Hashed
  linkId: string,        // Unique identifier
  createdAt: Date, // TTL index to auto-delete after 24hrs if no expiry set 
}

const fileSchema = new mongoose.Schema<dbFileSchema>({
  originalName: String,
  storedName: String,
  downloadCount: {
    type: Number,
    default: 0,
  },
  maxDownloads: Number, // Self-destruct after X downloads
  expiresAt: Date,       // Self-destruct after a certain time
  password: String,      // Hashed
  linkId: String,        // Unique identifier
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // TTL index to auto-delete after 24hrs if no expiry set
  }
}, {
    timestamps: true
})

export default mongoose.model<dbFileSchema>('File', fileSchema)