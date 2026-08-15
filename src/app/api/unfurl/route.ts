import { NextResponse } from "next/server"
import { fetchLinkPreview, parseTargetUrl, type LinkPreviewData } from "./unfurl"

// node runtime: the SSRF guard resolves DNS (`node:dns/promises`) before fetching.
export const runtime = "nodejs"

/** How long a successful card stays in the process cache. */
const SUCCESS_TTL_MS = 10 * 60 * 1000
/** Failures are cached too (shorter) so a dead link isn't re-fetched on every render. */
const FAILURE_TTL_MS = 60 * 1000
/** Entries kept before the oldest is evicted (in-memory, per server instance). */
const MAX_ENTRIES = 200

/** One memoized unfurl result — `null` value = "this url has no usable preview". */
interface CacheEntry {
    expiresAt: number
    value: LinkPreviewData | null
}

/**
 * Process-local preview cache. A post's card is unfurled once per URL instead of
 * on every render/viewer; serverless instances simply each keep their own copy
 * (an in-memory map is enough — nothing here is worth a Redis dependency).
 */
const cache = new Map<string, CacheEntry>()

/** Reads a live cache entry, dropping it when expired. */
const readCache = (key: string): CacheEntry | undefined => {
    const entry = cache.get(key)
    if (!entry) {
        return undefined
    }
    if (entry.expiresAt <= Date.now()) {
        cache.delete(key)
        return undefined
    }
    return entry
}

/** Writes an entry, evicting the oldest key once {@link MAX_ENTRIES} is reached. */
const writeCache = (key: string, value: LinkPreviewData | null): void => {
    if (cache.size >= MAX_ENTRIES) {
        const oldest = cache.keys().next()
        if (!oldest.done) {
            cache.delete(oldest.value)
        }
    }
    cache.set(key, {
        value,
        expiresAt: Date.now() + (value ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
    })
}

/**
 * `GET /api/unfurl?url=…` — server-side link unfurler behind the community post
 * preview card. Fetches the target page and returns its `og:*` / `twitter:*` /
 * `<title>` share card as JSON.
 *
 * This endpoint makes the SERVER issue a request to a url the CALLER picked, so it
 * is an SSRF surface and is fenced accordingly (see `./unfurl`): http/https only,
 * no credentials in the url, loopback / RFC1918 / link-local (metadata) / bare
 * hostnames rejected, DNS re-checked before each hop, redirects followed manually
 * (max 3, re-validated), a single 5s deadline and a 256KB body cap. Results are
 * memoized so a hot post does not re-fetch per render.
 *
 * @param request - the incoming request; `url` is the page to unfurl.
 * @returns 200 {@link LinkPreviewData}, 400 for an unusable/blocked url, 404 when
 *          the page has no preview (unreachable, non-HTML, error status).
 */
export const GET = async (request: Request): Promise<NextResponse> => {
    const raw = new URL(request.url).searchParams.get("url")
    if (!raw) {
        return NextResponse.json({ error: "missing_url" }, { status: 400 })
    }
    const target = parseTargetUrl(raw)
    if (!target) {
        return NextResponse.json({ error: "invalid_url" }, { status: 400 })
    }

    const key = target.toString()
    const cached = readCache(key)
    const preview = cached ? cached.value : await fetchLinkPreview(target)
    if (!cached) {
        writeCache(key, preview)
    }
    if (!preview) {
        return NextResponse.json({ error: "no_preview" }, { status: 404 })
    }
    return NextResponse.json(preview, {
        headers: { "cache-control": "public, max-age=600, stale-while-revalidate=3600" },
    })
}
