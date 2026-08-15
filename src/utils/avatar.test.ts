import { describe, expect, it } from "vitest"

import { dicebearAvatarUrl, resolveAvatarSrc } from "./avatar"

/**
 * Unit — the default-avatar chain. Two properties carry the whole feature and neither is
 * visible from a screenshot: the generated face must be STABLE (a user whose face changes
 * between the feed and their profile reads as two different people), and a real uploaded
 * photo must always beat the generated one (that ordering is what keeps a mapper dropping
 * `avatarUrl` visible instead of hiding behind a pretty face — see `UserAvatar`).
 */
describe("dicebearAvatarUrl", () => {
    it("same seed → same url, every call", () => {
        const id = "7b1e2c44-0a55-4f0a-9a71-9d5a3f2b1c00"
        expect(dicebearAvatarUrl(id)).toBe(dicebearAvatarUrl(id))
        // Whitespace around the seed is not a different person.
        expect(dicebearAvatarUrl(`  ${id}  `)).toBe(dicebearAvatarUrl(id))
    })

    it("different seeds → different urls", () => {
        expect(dicebearAvatarUrl("minh_dev")).not.toBe(dicebearAvatarUrl("hai_dev"))
    })

    it("no seed → NO url (initials tile instead of one shared face)", () => {
        expect(dicebearAvatarUrl(null)).toBeNull()
        expect(dicebearAvatarUrl(undefined)).toBeNull()
        expect(dicebearAvatarUrl("   ")).toBeNull()
    })

    it("encodes the seed so spaces / unicode names stay a valid url", () => {
        const url = dicebearAvatarUrl("Phan Hải")
        expect(url).toBe("https://api.dicebear.com/9.x/thumbs/svg?seed=Phan%20H%E1%BA%A3i")
        expect(() => new URL(url as string)).not.toThrow()
    })
})

describe("resolveAvatarSrc", () => {
    it("the uploaded photo wins over the generated face", () => {
        expect(resolveAvatarSrc("https://cdn.test/me.png", "minh_dev")).toBe(
            "https://cdn.test/me.png",
        )
    })

    it("no photo → the seeded generated face", () => {
        expect(resolveAvatarSrc(null, "minh_dev")).toBe(dicebearAvatarUrl("minh_dev"))
        // A blank string from the BE is "no photo", not a url.
        expect(resolveAvatarSrc("   ", "minh_dev")).toBe(dicebearAvatarUrl("minh_dev"))
    })

    it("neither photo nor seed → nothing to render", () => {
        expect(resolveAvatarSrc(null, null)).toBeNull()
        expect(resolveAvatarSrc("", "  ")).toBeNull()
    })
})
