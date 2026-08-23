import dns from 'node:dns/promises'
import ipaddr from 'ipaddr.js'

// Blocks server-side requests to internal/private infrastructure (SSRF).
// Users control `portfolioUrl`, which this backend both plain-fetches and
// navigates to with a full headless browser (see portfolioRenderer.ts) —
// without this check, that URL could point at the server's own internal
// network, localhost, or a cloud metadata endpoint (e.g. 169.254.169.254)
// and the app would happily fetch/render it and return the result.
const UNSAFE_IP_RANGES = new Set([
  'unspecified',
  'broadcast',
  'multicast',
  'linkLocal',
  'loopback',
  'private',
  'uniqueLocal',
  'ipv4Mapped',
  'rfc6052',
  '6to4',
  'teredo',
  'reserved',
])

export class UnsafeUrlError extends Error {}

function assertSafeHost(hostname: string): void {
  if (ipaddr.isValid(hostname)) {
    const range = ipaddr.process(hostname).range()
    if (UNSAFE_IP_RANGES.has(range)) {
      throw new UnsafeUrlError(`URL resolves to a non-public address (${range}).`)
    }
  }
}

// Resolves the hostname and rejects if ANY resolved address is non-public.
// This is checked again on every redirect hop in fetchSafely/isSafeRedirect
// below, since a hostname that resolves to a public IP at the first check
// can still redirect to an internal one (DNS rebinding / open redirect).
export async function assertSafeUrl(rawUrl: string): Promise<URL> {
  let url: URL
  try {
    url = new URL(rawUrl)
  } catch {
    throw new UnsafeUrlError('Not a valid URL.')
  }

  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new UnsafeUrlError(`Unsupported URL scheme "${url.protocol}".`)
  }

  assertSafeHost(url.hostname)

  // hostname may be a DNS name that resolves to a private/internal address
  // even though the literal string itself isn't an IP.
  try {
    const records = await dns.lookup(url.hostname, { all: true, verbatim: true })
    for (const record of records) {
      assertSafeHost(record.address)
    }
  } catch (error) {
    if (error instanceof UnsafeUrlError) throw error
    throw new UnsafeUrlError('Could not resolve host.')
  }

  return url
}

const MAX_REDIRECTS = 5

// A safety-checked fetch that validates the target (and every redirect hop)
// against assertSafeUrl before following it, instead of letting the
// platform's fetch follow redirects automatically and unchecked.
export async function fetchSafely(rawUrl: string, init: RequestInit = {}, maxRedirects = MAX_REDIRECTS): Promise<Response> {
  let currentUrl = (await assertSafeUrl(rawUrl)).toString()

  for (let i = 0; i <= maxRedirects; i++) {
    const res = await fetch(currentUrl, { ...init, redirect: 'manual' })

    if (res.status >= 300 && res.status < 400 && res.headers.has('location')) {
      const next = new URL(res.headers.get('location')!, currentUrl)
      currentUrl = (await assertSafeUrl(next.toString())).toString()
      continue
    }

    return res
  }

  throw new UnsafeUrlError('Too many redirects.')
}
