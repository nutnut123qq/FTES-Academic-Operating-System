import { describe, expect, it } from "vitest"
import { profileAssetThumbnailUrl } from "./profileAsset"

describe("profileAssetThumbnailUrl", () => {
    it("maps heavy local avatar, frame and achievement art to WebP thumbnails", () => {
        expect(profileAssetThumbnailUrl("/gamification/avatars/avatar-01-happy.svg"))
            .toBe("/gamification/profile-thumbnails/avatars-avatar-01-happy.webp")
        expect(profileAssetThumbnailUrl("/gamification/frames/frame-gold.svg"))
            .toBe("/gamification/profile-thumbnails/frames-frame-gold.webp")
        expect(profileAssetThumbnailUrl("/gamification/achievements/top-10.png"))
            .toBe("/gamification/profile-thumbnails/achievements-top-10.webp")
    })

    it("maps the TIER badge art too — it is pinned next to a name at 16px", () => {
        // `badges/` was the one art group missing from the alternation, so the five
        // ~260 KB tier medallions were served full-size on every author card. Every
        // group here must also be listed in `groups` in
        // scripts/generate-profile-thumbnails.mjs, or this points at a file that
        // was never generated.
        expect(profileAssetThumbnailUrl("/gamification/badges/badge-gold.png"))
            .toBe("/gamification/profile-thumbnails/badges-badge-gold.webp")
        expect(profileAssetThumbnailUrl("/gamification/badges/badge-diamond.png"))
            .toBe("/gamification/profile-thumbnails/badges-badge-diamond.webp")
    })

    it("leaves uploaded and external images untouched", () => {
        expect(profileAssetThumbnailUrl("https://cdn.ftes.vn/avatar.webp"))
            .toBe("https://cdn.ftes.vn/avatar.webp")
        expect(profileAssetThumbnailUrl("/uploads/avatar.jpg")).toBe("/uploads/avatar.jpg")
    })
})
