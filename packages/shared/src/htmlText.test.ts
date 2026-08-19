import { describe, it, expect } from 'vitest'
import { stripHtmlToText } from './htmlText'

describe('stripHtmlToText', () => {
  it('strips tags and collapses whitespace', () => {
    const html = '<div class="x">Hello   <b>World</b></div>'
    expect(stripHtmlToText(html)).toBe('Hello World')
  })

  it('removes script and style block contents entirely', () => {
    const html = '<html><head><style>.x{color:red}</style></head><body><script>alert(1)</script>Visible text</body></html>'
    expect(stripHtmlToText(html)).toBe('Visible text')
  })

  it('decodes common HTML entities to spaces', () => {
    const html = 'A&nbsp;B&amp;C'
    expect(stripHtmlToText(html)).toBe('A B C')
  })

  it('trims to 1500 characters', () => {
    const html = '<p>' + 'a'.repeat(2000) + '</p>'
    expect(stripHtmlToText(html).length).toBe(1500)
  })

  it('returns an empty string for an SPA shell with no rendered content', () => {
    const html = '<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>'
    expect(stripHtmlToText(html)).toBe('')
  })
})
