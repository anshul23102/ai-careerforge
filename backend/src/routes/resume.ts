import { Router, type Request, type Response } from 'express'
import multer from 'multer'
import { parseResumeFile, MAX_FILE_SIZE_BYTES, ParseError } from '@ai-careerforge/parsers'
import { requireAuth } from '../auth/requireAuth'
import { resumeParseLimiter } from '../rateLimiters'

export const resumeRouter = Router()

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_FILE_SIZE_BYTES } })

resumeRouter.post('/resume/parse', requireAuth, resumeParseLimiter, upload.single('file'), async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file was provided.' })
      return
    }

    const text = await parseResumeFile(req.file.originalname, req.file.buffer)
    res.status(200).json({ text })
  } catch (error: unknown) {
    if (error instanceof ParseError) {
      res.status(400).json({ error: error.message })
      return
    }
    // Logged server-side only — the underlying library error can contain
    // internal file paths or implementation details that shouldn't reach
    // an API client.
    console.error('Resume parse error:', error)
    res.status(500).json({ error: 'Failed to parse resume. Please try a different file.' })
  }
})

// multer's fileSize limit surfaces as an error passed to Express's error
// handler rather than a normal response — this middleware turns it into
// the same shaped 400 the frontend already expects.
resumeRouter.use((err: unknown, _req: Request, res: Response, next: (err?: unknown) => void) => {
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    res.status(400).json({ error: 'This file is larger than 5MB. Please upload a smaller file.' })
    return
  }
  next(err)
})
