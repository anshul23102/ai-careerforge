import { stripHtmlToText } from '@ai-careerforge/shared'
import { renderPageHtml } from './portfolioRenderer'

// A plain fetch returns just the empty app shell for client-rendered SPAs
// (React/Vue/etc with no server-rendered content) — this little text is the
// signal to fall back to headless rendering instead.
const LIKELY_SPA_SHELL_THRESHOLD = 200

export async function fetchPortfolioData(
  url: string,
  render: (url: string) => Promise<string | null> = renderPageHtml
): Promise<string> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-CareerForge-bot/1.0)' },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return `Portfolio site returned status ${res.status}.`

    let text = stripHtmlToText(await res.text())

    if (text.length < LIKELY_SPA_SHELL_THRESHOLD) {
      const renderedHtml = await render(url)
      if (renderedHtml) text = stripHtmlToText(renderedHtml)
    }

    if (!text) {
      return 'Portfolio site returned no readable text (it may require JavaScript that failed to render).'
    }

    return `Portfolio website content (${url}):\n${text}`
  } catch {
    return 'Portfolio site could not be fetched (may block bots or timed out).'
  }
}
