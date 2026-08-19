import { describe, it, expect } from 'vitest'
import { toBase64Utf8, fromBase64Utf8 } from './base64'

describe('toBase64Utf8 / fromBase64Utf8', () => {
  it('round-trips plain ASCII text', () => {
    const text = 'Hello, world!'
    expect(fromBase64Utf8(toBase64Utf8(text))).toBe(text)
  })

  it('round-trips text with a non-breaking hyphen (breaks plain btoa)', () => {
    // U+2011, exactly what showed up in real Groq output ("30‑minutes")
    const text = 'Spend 30‑45 minutes daily on DSA practice.'
    expect(() => btoa(text)).toThrow()
    expect(fromBase64Utf8(toBase64Utf8(text))).toBe(text)
  })

  it('round-trips em dashes, curly quotes, and emoji', () => {
    const text = 'A well—rounded candidate with “strong” fundamentals 🚀'
    expect(fromBase64Utf8(toBase64Utf8(text))).toBe(text)
  })

  it('round-trips a realistic JSON payload', () => {
    const payload = JSON.stringify({
      name: 'Anshul Jain',
      result: { summary: 'Shows strong enthusiasm — needs sharper DSA skills.' },
    })
    expect(fromBase64Utf8(toBase64Utf8(payload))).toBe(payload)
  })
})
