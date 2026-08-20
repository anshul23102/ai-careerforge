import { Schema, model, type InferSchemaType } from 'mongoose'

const assessmentSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  targetRole: { type: String, required: true },
  experienceLevel: { type: String, required: true },
  resumeText: { type: String, required: true },
  skills: {
    dsa: { type: Number, required: true },
    systemDesign: { type: Number, required: true },
    projects: { type: Number, required: true },
    coding: { type: Number, required: true },
    csFundamentals: { type: Number, required: true },
  },
  githubUrl: { type: String, default: '' },
  linkedinUrl: { type: String, default: '' },
  portfolioUrl: { type: String, default: '' },
  communicationRating: { type: Number, required: true },
  hasProjects: { type: Boolean, required: true },
  result: { type: Schema.Types.Mixed, required: true },
  isPublic: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
})

export type Assessment = InferSchemaType<typeof assessmentSchema>
export const AssessmentModel = model('Assessment', assessmentSchema)
