import type { Browser } from 'puppeteer-core'
import { assertSafeUrl } from './urlSafety'

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
    browser = await puppeteer.launch({
      executablePath: CHROME_PATH,
      headless: true,
      // --no-sandbox is required because this runs as root in an
      // unprivileged Docker container (Render doesn't grant the extra
      // capabilities Chrome's own sandbox needs) — it trades away Chrome's
      // internal process sandbox, which the per-navigation URL allowlist
      // below and the container boundary itself are left to compensate for.
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const page = await browser.newPage()

    // Validate every navigation this page makes (initial load, redirects,
    // and subresources) against the same private-network blocklist used for
    // the plain fetch — a URL that resolves publicly at the top of this
    // function can still redirect to an internal address once Chrome is
    // driving it.
    await page.setRequestInterception(true)
    page.on('request', (request) => {
      assertSafeUrl(request.url())
        .then(() => request.continue())
        .catch(() => request.abort('blockedbyclient'))
    })

    await assertSafeUrl(url)
    await page.goto(url, { waitUntil: 'networkidle2', timeout: RENDER_TIMEOUT_MS })
    return await page.content()
  } catch {
    return null
  } finally {
    if (browser) await browser.close()
  }
}
