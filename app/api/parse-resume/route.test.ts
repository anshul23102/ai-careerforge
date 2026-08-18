import { describe, it, expect } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { NextRequest } from 'next/server'
import { POST } from './route'
import { MAX_FILE_SIZE_BYTES } from '../../../lib/parsers'

const fixtures = join(__dirname, '../../../lib/parsers/__fixtures__')

function makeRequest(file: File): NextRequest {
  const formData = new FormData()
  formData.set('file', file)
  return new NextRequest('http://localhost/api/parse-resume', { method: 'POST', body: formData })
}

describe('POST /api/parse-resume', () => {
  it('returns extracted text for a valid PDF', async () => {
    const buffer = await readFile(join(fixtures, 'sample.pdf'))
    const file = new File([buffer], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(200)
    expect(body.text).toContain('John Doe')
  })

  it('returns 400 when no file is provided', async () => {
    const request = new NextRequest('http://localhost/api/parse-resume', {
      method: 'POST',
      body: new FormData(),
    })
    const response = await POST(request)
    expect(response.status).toBe(400)
  })

  it('returns 400 for a file over the size limit', async () => {
    const oversized = Buffer.alloc(MAX_FILE_SIZE_BYTES + 1, 'a')
    const file = new File([oversized], 'resume.txt', { type: 'text/plain' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/5MB/)
  })

  it('returns 400 for an unsupported file type', async () => {
    const buffer = await readFile(join(fixtures, 'unsupported.png'))
    const file = new File([buffer], 'resume.png', { type: 'image/png' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/Unsupported/)
  })

  it('returns 400 for a corrupted PDF', async () => {
    const buffer = await readFile(join(fixtures, 'corrupted.pdf'))
    const file = new File([buffer], 'resume.pdf', { type: 'application/pdf' })
    const response = await POST(makeRequest(file))
    const body = await response.json()
    expect(response.status).toBe(400)
    expect(body.error).toMatch(/could not be read/)
  })
})
