import { NextRequest, NextResponse } from 'next/server'
import { parseResumeFile, MAX_FILE_SIZE_BYTES } from '../../../lib/parsers'
import { ParseError } from '../../../lib/parsers/errors'

export const runtime = 'nodejs'

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file was provided.' }, { status: 400 })
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: 'This file is larger than 5MB. Please upload a smaller file.' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const text = await parseResumeFile(file.name, buffer)

    return NextResponse.json({ text })
  } catch (error: unknown) {
    if (error instanceof ParseError) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    console.error('Resume parse error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: `Failed to parse resume: ${message}` }, { status: 500 })
  }
}
