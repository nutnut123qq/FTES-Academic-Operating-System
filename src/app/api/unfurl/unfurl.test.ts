import { afterEach, describe, expect, it, vi } from "vitest"

// The SSRF guard resolves DNS before every hop. Mocked so the suite never touches
// the network: any name resolves to a PUBLIC address unless a case overrides it.
vi.mock("node:dns/promises", () => {
    const lookup = vi.fn(async () => [{ address: "93.184.216.34", family: 4 }])
    return { lookup, default: { lookup } }
})

import { fetchLinkPreview, isBlockedHost, parseLinkPreview, parseTargetUrl } from "./unfurl"

/** Minimal `Response`-shaped stub — only the members the unfurler reads. */
const htmlResponse = (html: string) =>
    ({
        status: 200,
        ok: true,
        headers: new Headers({ "content-type": "text/html; charset=utf-8" }),
        body: new Response(html).body,
    }) as unknown as Response

/** 302 stub pointing at `location`. */
const redirectResponse = (location: string) =>
    ({
        status: 302,
        ok: false,
        headers: new Headers({ location }),
        body: null,
    }) as unknown as Response

afterEach(() => {
    vi.unstubAllGlobals()
})

describe("parseTargetUrl (SSRF gate)", () => {
    it("accepts a normal public https url", () => {
        expect(parseTargetUrl("https://fullstack.edu.vn/blog/x")?.hostname).toBe("fullstack.edu.vn")
    })

    it("rejects non-http(s) schemes", () => {
        expect(parseTargetUrl("file:///etc/passwd")).toBeNull()
        expect(parseTargetUrl("javascript:alert(1)")).toBeNull()
    })

    it("rejects internal hosts", () => {
        const blocked = [
            "http://localhost:3000/x",
            "http://127.0.0.1/",
            "http://127.5.5.5/",
            "http://[::1]/",
            "http://10.0.0.7/",
            "http://172.16.0.1/",
            "http://172.31.255.254/",
            "http://192.168.1.1/",
            // cloud metadata endpoint — the one that leaks credentials
            "http://169.254.169.254/latest/meta-data/",
            "http://backend/",
            "http://api.internal/",
            "http://dev.localhost/",
        ]
        for (const url of blocked) {
            expect(parseTargetUrl(url), url).toBeNull()
        }
    })

    it("does not let userinfo disguise a loopback host", () => {
        expect(parseTargetUrl("http://fullstack.edu.vn@127.0.0.1/")).toBeNull()
    })

    it("lets public ranges next to private ones through", () => {
        expect(parseTargetUrl("http://172.32.0.1/")).not.toBeNull()
        expect(isBlockedHost("172.15.0.1")).toBe(false)
    })
})

describe("parseLinkPreview", () => {
    it("reads og:title / og:description / og:image and resolves a relative image", () => {
        const preview = parseLinkPreview(
            `<html><head>
                <title>ignored when og exists</title>
                <meta property="og:title" content="Học lập trình &amp; ra nghề" />
                <meta property="og:description" content="Khoá học miễn phí" />
                <meta property="og:image" content="/img/cover.png" />
                <meta property="og:site_name" content="F8" />
            </head></html>`,
            new URL("https://www.fullstack.edu.vn/blog/bai-1"),
        )
        expect(preview.title).toBe("Học lập trình & ra nghề")
        expect(preview.description).toBe("Khoá học miễn phí")
        expect(preview.image).toBe("https://www.fullstack.edu.vn/img/cover.png")
        expect(preview.siteName).toBe("F8")
        expect(preview.domain).toBe("fullstack.edu.vn")
    })

    it("falls back to <title> when the page has no og tags", () => {
        const preview = parseLinkPreview(
            "<html><head><title>  Trang không có OG \n</title></head><body>x</body></html>",
            new URL("https://example.com/a"),
        )
        expect(preview.title).toBe("Trang không có OG")
        expect(preview.image).toBeUndefined()
    })

    it("drops an og:image that points at an internal host", () => {
        const preview = parseLinkPreview(
            "<meta property=\"og:image\" content=\"http://169.254.169.254/token\">",
            new URL("https://example.com/a"),
        )
        expect(preview.image).toBeUndefined()
    })
})

describe("fetchLinkPreview", () => {
    it("follows a public redirect and parses the destination", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn()
                .mockResolvedValueOnce(redirectResponse("https://example.com/final"))
                .mockResolvedValueOnce(htmlResponse("<meta property=\"og:title\" content=\"Đích\">")),
        )
        const preview = await fetchLinkPreview(new URL("https://example.com/start"))
        expect(preview?.title).toBe("Đích")
        expect(preview?.url).toBe("https://example.com/final")
    })

    it("refuses a redirect that lands on an internal address", async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(redirectResponse("http://169.254.169.254/latest/meta-data/"))
        vi.stubGlobal("fetch", fetchMock)
        expect(await fetchLinkPreview(new URL("https://example.com/start"))).toBeNull()
        // the second hop was never attempted
        expect(fetchMock).toHaveBeenCalledTimes(1)
    })

    /**
     * Regression: FTES' own pages stream their share tags AFTER `</head>`, ~300 KB into
     * the document. A 256 KiB read cap (and, later, stopping at the head close) truncated
     * them, so every ftes link unfurled as "no preview" while third-party pages worked.
     */
    it("still finds share tags that stream far past </head>", async () => {
        const html = `<html><head><title>Bỏ qua</title></head><body>${"<span>x</span>".repeat(25_000)}<meta property="og:title" content="Sâu trong body"></body></html>`
        expect(Buffer.byteLength(html)).toBeGreaterThan(256 * 1024)
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(htmlResponse(html)))
        const preview = await fetchLinkPreview(new URL("https://example.com/heavy"))
        expect(preview?.title).toBe("Sâu trong body")
    })

    it("ignores a non-HTML response", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn().mockResolvedValue({
                status: 200,
                ok: true,
                headers: new Headers({ "content-type": "application/pdf" }),
                body: null,
            } as unknown as Response),
        )
        expect(await fetchLinkPreview(new URL("https://example.com/file.pdf"))).toBeNull()
    })
})
