import { afterEach, describe, expect, it, vi } from "vitest"
import {
    getHlsManifestTokenExpiryMs,
    getHlsUrlTokenExpiryMs,
    normalizeHlsVodManifest,
    prepareHlsVodManifestSource,
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
