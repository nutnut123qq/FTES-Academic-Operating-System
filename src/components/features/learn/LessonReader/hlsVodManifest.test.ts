import { afterEach, describe, expect, it, vi } from "vitest"
import {
    getHlsErrorStatus,
    getHlsManifestTokenExpiryMs,
    getHlsUrlTokenExpiryMs,
    getHlsWindowPolicy,
    normalizeHlsVodManifest,
    prepareHlsVodManifestSource,
    withPlaybackAnchor,
} from "./hlsVodManifest"

afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
})

describe("FTES VOD manifest normalization", () => {
    it("reads the expiry carried by signed manifest and segment URLs", () => {
        const payload = btoa(JSON.stringify({ v: "video-id", e: 1_787_311_002 }))
            .replace(/=/g, "")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
        const segmentUrl = `https://cdn.example/seg_00000.ts?t=${payload}.signature`

        expect(getHlsUrlTokenExpiryMs(segmentUrl)).toBe(1_787_311_002_000)
        expect(getHlsManifestTokenExpiryMs(`#EXTM3U\n#EXTINF:5,\n${segmentUrl}\n`))
            .toBe(1_787_311_002_000)

        const jwtHeader = btoa(JSON.stringify({ alg: "HS256" })).replace(/=/g, "")
        const jwtPayload = btoa(JSON.stringify({ exp: 1_787_311_100 })).replace(/=/g, "")
        expect(getHlsUrlTokenExpiryMs(
            `https://stream.ftes.vn/master.m3u8?grant=${jwtHeader}.${jwtPayload}.signature`,
        )).toBe(1_787_311_100_000)
    })

    it("reads CDN authorization status from fetch and XHR error shapes", () => {
        expect(getHlsErrorStatus({ response: { code: 403 } })).toBe(403)
        expect(getHlsErrorStatus({ networkDetails: { status: 401 } })).toBe(401)
    })

    it("removes a dangling EXTINF and closes a generated VOD playlist", () => {
        const source = [
            "#EXTM3U",
            "#EXT-X-PLAYLIST-TYPE:VOD",
            "#EXTINF:5.000000,",
            "seg_00000.ts",
            "#EXTINF:5.000000,",
            "",
        ].join("\n")

        expect(normalizeHlsVodManifest(source)).toBe([
            "#EXTM3U",
            "#EXT-X-PLAYLIST-TYPE:VOD",
            "#EXTINF:5.000000,",
            "seg_00000.ts",
            "#EXT-X-ENDLIST",
            "",
        ].join("\n"))
    })

    it("does not rewrite a multivariant or already valid playlist", () => {
        const master = "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=1000\nmedia.m3u8\n"
        const validVod = "#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXTINF:5,\n0.ts\n#EXT-X-ENDLIST\n"

        expect(normalizeHlsVodManifest(master)).toBe(master)
        expect(normalizeHlsVodManifest(validVod)).toBe(validVod)
    })

    it("uses a disposable Blob URL with absolute segment URIs for a repaired manifest", async () => {
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve(
                "#EXTM3U\n#EXT-X-PLAYLIST-TYPE:VOD\n#EXTINF:5,\nseg_00000.ts\n#EXTINF:5,\n",
            ),
        }))
        const createObjectURL = vi.spyOn(URL, "createObjectURL").mockReturnValue("blob:repaired")
        const revokeObjectURL = vi.spyOn(URL, "revokeObjectURL").mockImplementation(() => undefined)

        const prepared = await prepareHlsVodManifestSource(
            "https://cdn.example/video/master.m3u8",
            new AbortController().signal,
        )

        expect(prepared.url).toBe("blob:repaired")
        const blob = createObjectURL.mock.calls[0][0] as Blob
        await expect(blob.text()).resolves.toContain("https://cdn.example/video/seg_00000.ts")
        await expect(blob.text()).resolves.toContain("#EXT-X-ENDLIST")
        prepared.dispose()
        expect(revokeObjectURL).toHaveBeenCalledWith("blob:repaired")
    })

    it("reports grant expiry without rewriting an already valid playlist", async () => {
        const payload = btoa(JSON.stringify({ e: 1_787_311_002 })).replace(/=/g, "")
        const fetchMock = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve([
                "#EXTM3U",
                "#EXT-X-PLAYLIST-TYPE:VOD",
                "#EXTINF:5,",
                `https://cdn.example/seg_00000.ts?t=${payload}.signature`,
                "#EXT-X-ENDLIST",
                "",
            ].join("\n")),
        })
        vi.stubGlobal("fetch", fetchMock)

        const prepared = await prepareHlsVodManifestSource(
            "https://cdn.example/master.m3u8",
            new AbortController().signal,
        )

        expect(prepared.url).toBe("https://cdn.example/master.m3u8")
        expect(prepared.expiresAtMs).toBe(1_787_311_002_000)
        expect(fetchMock).toHaveBeenCalledWith(
            "https://cdn.example/master.m3u8",
            expect.objectContaining({ cache: "no-store" }),
        )
    })
})

/**
 * Cửa sổ ký của stream service. Token segment nay chỉ sống quanh lúc người xem đi tới đoạn đó, nên
 * trình phát phải đọc được cửa sổ để tự neo lại khi người dùng TUA — đây là phần giữ cho việc siết
 * chống tải hàng loạt không biến thành "tua là khựng".
 */
describe("FTES signing window", () => {
    const tokenUrl = (expiry: number) => {
        const payload = btoa(JSON.stringify({ v: "video-id", e: expiry }))
            .replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_")
        return `https://cdn.example/seg.ts?t=${payload}.signature`
    }

    it("reads the window the stream service advertises", () => {
        expect(getHlsWindowPolicy("#EXTM3U\n#EXT-X-FTES-WINDOW:lead=120,ttl=90\n"))
            .toEqual({ leadSeconds: 120, ttlSeconds: 90 })
        // Server đời cũ không công bố gì → null, và trình phát rơi về đường xử lý 403.
        expect(getHlsWindowPolicy("#EXTM3U\n#EXTINF:5,\nseg.ts\n")).toBeNull()
        expect(getHlsWindowPolicy("#EXT-X-FTES-WINDOW:lead=abc,ttl=90")).toBeNull()
    })

    it("anchors only stream-service URLs, never storage-signed ones", () => {
        expect(withPlaybackAnchor("https://s.ftes.vn/master.m3u8?grant=abc", 1200.7))
            .toBe("https://s.ftes.vn/master.m3u8?grant=abc&at=1200")
        // Chữ ký S3 phủ cả query string: thêm tham số vào là hỏng chữ ký, video 403 ngay.
        expect(withPlaybackAnchor("https://r2.example/master.m3u8?X-Amz-Signature=xyz", 30))
            .toBe("https://r2.example/master.m3u8?X-Amz-Signature=xyz")
        expect(withPlaybackAnchor("khong-phai-url", 30)).toBe("khong-phai-url")
    })

    it("treats the LAST token expiry as the manifest expiry", () => {
        // Token đoạn đầu bài hết hạn sớm là chuyện bình thường của cách ký theo cửa sổ. Lấy hạn gần
        // nhất thì trình phát đi xin nguồn mới ngay sau vài chục giây phát — tự tay làm khựng video.
        const manifest = `#EXTM3U\n${tokenUrl(1_787_311_002)}\n${tokenUrl(1_787_311_500)}\n`

        expect(getHlsManifestTokenExpiryMs(manifest)).toBe(1_787_311_500_000)
    })
})
