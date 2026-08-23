import { Schema, model, type InferSchemaType } from 'mongoose'

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
  // Bumped whenever all of a user's existing sessions should be
  // invalidated (currently: password reset) — a JWT is only honored while
  // its embedded tokenVersion still matches this value.
  tokenVersion: { type: Number, default: 0 },
})

export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)
