import { Schema, model, type InferSchemaType } from 'mongoose'

const userSchema = new Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now },
  resetTokenHash: { type: String, default: null },
  resetTokenExpiresAt: { type: Date, default: null },
})

export type User = InferSchemaType<typeof userSchema>
export const UserModel = model('User', userSchema)
