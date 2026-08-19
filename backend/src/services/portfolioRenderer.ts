import type { Browser } from 'puppeteer-core'

const RENDER_TIMEOUT_MS = 10_000

// The Docker image installs system Chromium via apt (see backend/Dockerfile)
// and sets PUPPETEER_EXECUTABLE_PATH accordingly. Locally, fall back to a
// developer-installed Chrome, overridable via LOCAL_CHROME_PATH.
const CHROME_PATH =
  process.env.PUPPETEER_EXECUTABLE_PATH ||
  process.env.LOCAL_CHROME_PATH ||
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'

// Renders a page with headless Chrome and returns its final HTML, for sites
// whose content only appears after client-side JavaScript runs (a plain HTTP
// fetch returns just the empty SPA shell for these). Returns null on any
// failure so callers can fall back to their plain-fetch result rather than
// failing the whole request over one unreachable portfolio site.
export async function renderPageHtml(url: string): Promise<string | null> {
  let browser: Browser | undefined
  try {
    const puppeteer = (await import('puppeteer-core')).default
    browser = await puppeteer.launch({ executablePath: CHROME_PATH, headless: true })
    const page = await browser.newPage()
    await page.goto(url, { waitUntil: 'networkidle2', timeout: RENDER_TIMEOUT_MS })
    return await page.content()
  } catch {
    return null
  } finally {
    if (browser) await browser.close()
  }
}
