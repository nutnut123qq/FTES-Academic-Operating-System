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

    it("leaves uploaded and external images untouched", () => {
        expect(profileAssetThumbnailUrl("https://cdn.ftes.vn/avatar.webp"))
            .toBe("https://cdn.ftes.vn/avatar.webp")
        expect(profileAssetThumbnailUrl("/uploads/avatar.jpg")).toBe("/uploads/avatar.jpg")
    })
})
