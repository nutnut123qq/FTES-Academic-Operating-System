import { lookup } from "node:dns/promises"

/**
 * Link-preview payload returned by `GET /api/unfurl` and rendered by the
 * `LinkPreview` card (image + title + description + domain, F8/Facebook style).
 */
export interface LinkPreviewData {
    /** FINAL url after redirects — what the card links to. */
    url: string
    /** `og:title` → `twitter:title` → `<title>` → the hostname. */
    title: string
    /** `og:description` → `twitter:description` → `<meta name="description">`; absent when the page has none. */
    description?: string
    /** Absolute, re-validated image url; absent when the page has none (card renders text-only). */
    image?: string
    /** `og:site_name`, when present. */
    siteName?: string
    /** Hostname without a leading `www.` — the small caption line on the card. */
    domain: string
}

/** Hard ceiling on the whole unfurl (all redirect hops share ONE deadline). */
const FETCH_TIMEOUT_MS = 5_000
/** Redirect hops followed before giving up (each hop is re-validated). */
const MAX_REDIRECTS = 3
/**
 * Bytes of HTML read before the connection is cut. NOT a "head is always small"
 * assumption: our own Next pages inline the RSC payload ahead of the share tags, so on
 * `/en/blog/<slug>` `og:title` sits at byte ~309k of a 315k document — a 256 KiB cap
 * silently truncated it and every FTES link unfurled as "no preview". Measured, the
 * share tags there land AFTER `</head>` (streamed metadata), so stopping at the head
 * close would reintroduce the same blind spot: the whole capped body gets scanned.
 */
const MAX_BODY_BYTES = 1024 * 1024

/** Sent so sites that vary markup by client still return their share `<head>`. */
const USER_AGENT = "Mozilla/5.0 (compatible; FTES-AOS-LinkPreview/1.0; +https://ftes.vn)"

const IPV4_PATTERN = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/

/** Host suffixes that never leave the machine / the LAN, whatever DNS says. */
const INTERNAL_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"]

/**
 * True for an IPv4 literal we must never let the server call: loopback, the
 * RFC1918 private blocks, link-local (`169.254.x` — the cloud metadata endpoint),
 * CGNAT, benchmarking, multicast/reserved and `0.x`.
 *
 * @param address - dotted-quad string; anything that is not one returns false.
 */
const isBlockedIpv4 = (address: string): boolean => {
    const match = IPV4_PATTERN.exec(address)
    if (!match) {
        return false
    }
    const [a, b] = [Number(match[1]), Number(match[2])]
    if (match.slice(1).some((part) => Number(part) > 255)) {
        return true
    }
    return (
        a === 0
        || a === 10
        || a === 127
        || (a === 100 && b >= 64 && b <= 127)
        || (a === 169 && b === 254)
        || (a === 172 && b >= 16 && b <= 31)
        || (a === 192 && b === 168)
        || (a === 192 && b === 0)
        || (a === 198 && (b === 18 || b === 19))
        || a >= 224
    )
}

/**
 * True for an IPv6 literal that points back inside: loopback/unspecified, unique
 * local (`fc00::/7`), link-local (`fe80::/10`) and IPv4-mapped forms of any
 * blocked v4 address. PUBLIC v6 is allowed through.
 *
 * @param address - v6 address WITHOUT surrounding brackets.
 */
const isBlockedIpv6 = (address: string): boolean => {
    const normalized = address.toLowerCase().split("%")[0]
    if (normalized === "::1" || normalized === "::" || normalized === "0:0:0:0:0:0:0:1") {
        return true
    }
    // ::ffff:127.0.0.1 (and the all-hex spelling) — a v4 address wearing a v6 hat.
    const mapped = /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/.exec(normalized)
    if (mapped) {
        return isBlockedIpv4(mapped[1])
    }
    const head = normalized.split(":")[0]
    if (/^f[cd]/.test(head)) {
        return true
    }
    return /^fe[89ab]/.test(head)
}

/**
 * SSRF host gate — the single predicate both the request url AND every redirect
 * target AND every DNS-resolved address are checked against.
 *
 * Blocks: IP literals inside the loopback/private/link-local ranges (v4 and v6),
 * bare names with no dot (`localhost`, `intranet`, container/service names), and
 * the `.localhost`/`.local`/`.internal`/`.home.arpa` suffixes.
 *
 * @param hostname - `URL.hostname` (v6 literals arrive bracketed) or a resolved IP.
 */
export const isBlockedHost = (hostname: string): boolean => {
    const host = hostname.trim().toLowerCase().replace(/\.$/, "")
    if (!host) {
        return true
    }
    const bare = host.startsWith("[") && host.endsWith("]") ? host.slice(1, -1) : host
    if (bare.includes(":")) {
        return isBlockedIpv6(bare)
    }
    if (IPV4_PATTERN.test(bare)) {
        return isBlockedIpv4(bare)
    }
    if (!bare.includes(".")) {
        return true
    }
    return INTERNAL_SUFFIXES.some((suffix) => bare.endsWith(suffix))
}

/**
 * Parses a caller-supplied url and returns it ONLY when it is safe to fetch:
 * `http`/`https`, no embedded credentials, and a host that passes
 * {@link isBlockedHost}. Returns null otherwise — callers answer 400, never fetch.
 *
 * @param raw - the raw `?url=` value (or a `Location` header, already absolutized).
 */
export const parseTargetUrl = (raw: string): URL | null => {
    let url: URL
    try {
        url = new URL(raw)
    } catch {
        return null
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") {
        return null
    }
    // `http://trusted.com@127.0.0.1/` — the host is the loopback, the userinfo is bait.
    if (url.username || url.password) {
        return null
    }
    return isBlockedHost(url.hostname) ? null : url
}

/**
 * DNS-rebinding gate: a perfectly public-looking name can resolve to `127.0.0.1`
 * or the metadata IP. Resolves the host and rejects if ANY returned address is
 * blocked. A lookup failure is treated as "do not fetch".
 *
 * @param hostname - host of the url about to be fetched.
 */
const resolvesToPublicAddress = async (hostname: string): Promise<boolean> => {
    const bare = hostname.startsWith("[") && hostname.endsWith("]")
        ? hostname.slice(1, -1)
        : hostname
    // Already a literal — {@link parseTargetUrl} vetted it, no DNS involved.
    if (IPV4_PATTERN.test(bare) || bare.includes(":")) {
        return true
    }
    try {
        const records = await lookup(bare, { all: true })
        return records.length > 0 && records.every((record) => !isBlockedHost(record.address))
    } catch {
        return false
    }
}

/**
 * Reads at most {@link MAX_BODY_BYTES} of the response and cancels the rest, so a
 * hostile/huge page can't be used to exhaust memory. Decoded as UTF-8 (share tags
 * are ASCII-ish; a wrong charset only garbles text we then show truncated).
 *
 * @param response - a non-redirect, HTML response.
 */
const readCappedBody = async (response: Response): Promise<string> => {
    const body = response.body
    if (!body) {
        return ""
    }
    const reader = body.getReader()
    const decoder = new TextDecoder("utf-8")
    let html = ""
    let total = 0
    for (;;) {
        const { done, value } = await reader.read()
        if (done) {
            break
        }
        if (value) {
            total += value.byteLength
            html += decoder.decode(value, { stream: true })
            if (total >= MAX_BODY_BYTES) {
                await reader.cancel()
                break
            }
        }
    }
    return html
}

/** Reads one attribute out of a single `<meta …>` tag (quoted or bare value). */
const readAttribute = (tag: string, attribute: string): string | undefined => {
    const match = new RegExp(`\\b${attribute}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s"'>]+))`, "i").exec(tag)
    if (!match) {
        return undefined
    }
    return match[2] ?? match[3] ?? match[4]
}

const NAMED_ENTITIES: Record<string, string> = {
    amp: "&",
    lt: "<",
    gt: ">",
    quot: "\"",
    apos: "'",
    nbsp: " ",
}

/** Decodes the handful of entities that actually show up in share tags. */
const decodeEntities = (value: string): string =>
    value
        .replace(/&#x([0-9a-f]+);/gi, (_full, hex: string) => String.fromCodePoint(parseInt(hex, 16)))
        .replace(/&#(\d+);/g, (_full, dec: string) => String.fromCodePoint(Number(dec)))
        .replace(/&([a-z]+);/gi, (full, name: string) => NAMED_ENTITIES[name.toLowerCase()] ?? full)

/** Collapses whitespace and trims a meta value to a card-sized string. */
const tidy = (value: string, max: number): string => {
    const text = decodeEntities(value).replace(/\s+/g, " ").trim()
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/**
 * Pulls the share card out of an HTML document: `og:*` first, `twitter:*` next,
 * then the plain `<title>` / `<meta name="description">` fallback for pages with
 * no social tags at all.
 *
 * Relative `og:image` values are resolved against the FINAL url and then run back
 * through {@link parseTargetUrl} — a page must not be able to point the card at
 * an internal host.
 *
 * @param html - (possibly truncated) HTML source.
 * @param finalUrl - url the HTML was actually served from, after redirects.
 */
export const parseLinkPreview = (html: string, finalUrl: URL): LinkPreviewData => {
    const meta: Record<string, string> = {}
    for (const tag of html.match(/<meta\b[^>]*>/gi) ?? []) {
        const key = readAttribute(tag, "property") ?? readAttribute(tag, "name")
        const content = readAttribute(tag, "content")
        if (key && content && !(key.toLowerCase() in meta)) {
            meta[key.toLowerCase()] = content
        }
    }
    const documentTitle = /<title[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1] ?? ""
    const domain = finalUrl.hostname.replace(/^www\./, "")

    const rawImage = meta["og:image"] ?? meta["og:image:url"] ?? meta["twitter:image"] ?? meta["twitter:image:src"]
    let image: string | undefined
    if (rawImage) {
        try {
            image = parseTargetUrl(new URL(decodeEntities(rawImage.trim()), finalUrl).toString())?.toString()
        } catch {
            image = undefined
        }
    }

    const title = tidy(meta["og:title"] ?? meta["twitter:title"] ?? documentTitle ?? "", 140) || domain
    const description = tidy(
        meta["og:description"] ?? meta["twitter:description"] ?? meta.description ?? "",
        200,
    )
    const siteName = tidy(meta["og:site_name"] ?? "", 80)

    return {
        url: finalUrl.toString(),
        title,
        ...(description ? { description } : {}),
        ...(image ? { image } : {}),
        ...(siteName ? { siteName } : {}),
        domain,
    }
}

/**
 * Fetches `target` and returns its share card, or null when the page cannot be
 * previewed (blocked host at any hop, non-HTML, non-2xx, timeout, network error).
 *
 * Redirects are followed MANUALLY: at most {@link MAX_REDIRECTS} hops, each new
 * `Location` re-validated by {@link parseTargetUrl} + DNS — otherwise a public
 * url could bounce the server onto `127.0.0.1` or the metadata IP. All hops share
 * one {@link FETCH_TIMEOUT_MS} deadline and the body read is capped.
 *
 * @param target - an already-validated url (see {@link parseTargetUrl}).
 */
export const fetchLinkPreview = async (target: URL): Promise<LinkPreviewData | null> => {
    const signal = AbortSignal.timeout(FETCH_TIMEOUT_MS)
    let current = target
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
        if (!(await resolvesToPublicAddress(current.hostname))) {
            return null
        }
        let response: Response
        try {
            response = await fetch(current, {
                signal,
                redirect: "manual",
                headers: {
                    "user-agent": USER_AGENT,
                    accept: "text/html,application/xhtml+xml",
                    "accept-language": "vi,en;q=0.8",
                },
            })
        } catch {
            return null
        }
        if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get("location")
            await response.body?.cancel().catch(() => undefined)
            if (!location) {
                return null
            }
            let next: URL | null
            try {
                next = parseTargetUrl(new URL(location, current).toString())
            } catch {
                return null
            }
            if (!next) {
                return null
            }
            current = next
            continue
        }
        if (!response.ok) {
            await response.body?.cancel().catch(() => undefined)
            return null
        }
        if (!(response.headers.get("content-type") ?? "").toLowerCase().includes("html")) {
            await response.body?.cancel().catch(() => undefined)
            return null
        }
        try {
            const preview = parseLinkPreview(await readCappedBody(response), current)
            // Nothing usable (client-rendered SPA shell with no share tags): the card
            // would just repeat the domain twice, so report "no preview" instead.
            const isEmpty = !preview.description && !preview.image && preview.title === preview.domain
            return isEmpty ? null : preview
        } catch {
            return null
        }
    }
    return null
}
