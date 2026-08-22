import { describe, expect, it } from "vitest"
import { profileAssetThumbnailUrl, roundProfileArtUrl } from "./profileAsset"

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

describe("roundProfileArtUrl", () => {
    it("swaps the five square tier frames for their round art", () => {
        // Danh mục còn trỏ vào bộ vuông cho tới khi migration V375 chạy; khung vuông quanh
        // avatar tròn chính là ảnh chủ dự án báo lỗi "viền bị avatar đè".
        expect(roundProfileArtUrl("/gamification/frames/frame-gold.svg"))
            .toBe("/gamification/frames/frame-gold-round.svg")
        expect(roundProfileArtUrl("/gamification/frames/frame-bronze.svg"))
            .toBe("/gamification/frames/frame-bronze-round.svg")
    })

    it("swaps the nine default FrosTES avatars — and the round twin is a PNG, not an SVG", () => {
        // Cắt tròn ô vuông bo góc KHÔNG ra hình tròn: 4 góc art bo vào sâu hơn đường cắt nên
        // lộ 4 múi `bg-default`, đúng avatar VUÔNG chủ dự án chụp ở navbar.
        expect(roundProfileArtUrl("/gamification/avatars/avatar-01-happy.svg"))
            .toBe("/gamification/avatars/avatar-01-happy-round.png")
        expect(roundProfileArtUrl("/gamification/avatars/avatar-09-calm.svg"))
            .toBe("/gamification/avatars/avatar-09-calm-round.png")
    })

    it("is a no-op once the catalog already points at the round art", () => {
        // Chạy hai lần vẫn ra một kết quả — nếu không, sau khi V375 chạy sẽ ra
        // `frame-gold-round-round.svg` và mọi khung viền chết 404 trong im lặng.
        expect(roundProfileArtUrl("/gamification/frames/frame-gold-round.svg"))
            .toBe("/gamification/frames/frame-gold-round.svg")
        expect(roundProfileArtUrl("/gamification/avatars/avatar-01-happy-round.png"))
            .toBe("/gamification/avatars/avatar-01-happy-round.png")
    })

    it("leaves art it has no round twin for — and every uploaded photo — alone", () => {
        expect(roundProfileArtUrl("/gamification/frames/frame-mystery.svg"))
            .toBe("/gamification/frames/frame-mystery.svg")
        expect(roundProfileArtUrl("/gamification/badges/badge-gold.png"))
            .toBe("/gamification/badges/badge-gold.png")
        expect(roundProfileArtUrl("https://cdn.ftes.vn/avatar.webp"))
            .toBe("https://cdn.ftes.vn/avatar.webp")
        expect(roundProfileArtUrl(null)).toBeNull()
    })
})

/**
 * HỢP ĐỒNG HÌNH HỌC của bộ khung viền — kiểm bằng ĐO, không bằng lời hứa trong comment.
 *
 * <p>`FramedAvatar` ép ảnh khung ở `w-[132%]`, tức mép avatar rơi đúng ở bán kính
 * 256 ÷ 1,32 = 193,9 trong hộp art 512. Để vòng khung tụt XUỐNG DƯỚI mép avatar (không hở
 * một vành `bg-default` giữa avatar và khung), MÉP TRONG của vòng phải nằm ở r≈191 — lấn
 * vào khoảng 3 đơn vị. Và trang trí ngoài cùng phải nằm trong ngân sách r≤248 để khung
 * không bị hộp `132%` cắt cụt.
 *
 * <p><b>Vì sao phải là TEST, không phải một dòng ghi chú.</b> Hợp đồng này đã bị phá đúng
 * một lần: bộ art đợt trước có mép trong 217,8 / 212,3 / 196,8 / 193,5 / 200,8 trong khi
 * overlay cứng ở 132% — mọi kiểm tra đều xanh (tsc, eslint, build, script sinh thumbnail)
 * và lỗi ra tới production dưới dạng vành hở quanh avatar hạng Vàng. Vẽ lại art là việc
 * của người khác, ở một file khác (`public/`), nên chỉ có phép ĐO mới bắt được.
 *
 * <p><b>Assert theo MAX chứ không theo MIN.</b> Trang trí ở chân khung (ruy-băng, đá quý)
 * cố ý thò vào tới r≈137–153; đo min sẽ ra fail giả. Bán kính vòng = mép trong XA NHẤT.
 */
describe("frame art geometry", () => {
    /** Hộp art gốc của cả 5 khung (`viewBox="0 0 512 512"`). */
    const SIZE = 512
    /** Alpha coi là "có mực" — nửa đường, đủ để bỏ qua viền khử răng cưa. */
    const OPAQUE = 128

    /**
     * Bắn 360 tia từ tâm ra mép và trả về bán kính đầu/cuối có mực trên mỗi tia.
     *
     * @param tier - mã hạng (`bronze`…`diamond`).
     */
    const measureRing = async (tier: string) => {
        const sharp = (await import("sharp")).default
        const { readFile } = await import("node:fs/promises")
        const svg = await readFile(`public/gamification/frames/frame-${tier}-round.svg`)
        const pixels = await sharp(svg, { density: 300 })
            .resize(SIZE, SIZE, { fit: "fill" })
            .raw()
            .ensureAlpha()
            .toBuffer()
        const center = SIZE / 2
        const inner: Array<number> = []
        const outer: Array<number> = []
        for (let degree = 0; degree < 360; degree += 1) {
            const angle = (degree * Math.PI) / 180
            const dx = Math.cos(angle)
            const dy = Math.sin(angle)
            let first: number | null = null
            let last: number | null = null
            for (let radius = 0; radius <= center - 1; radius += 0.5) {
                const x = Math.round(center + dx * radius)
                const y = Math.round(center + dy * radius)
                if (pixels[(y * SIZE + x) * 4 + 3] > OPAQUE) {
                    if (first === null) {
                        first = radius
                    }
                    last = radius
                }
            }
            if (first !== null && last !== null) {
                inner.push(first)
                outer.push(last)
            }
        }
        return { inner: Math.max(...inner), outer: Math.max(...outer) }
    }

    it.each(["bronze", "silver", "gold", "crystal", "diamond"])(
        "keeps frame-%s-round.svg inside the 132%% overlay contract",
        async (tier) => {
            const { inner, outer } = await measureRing(tier)
            // mép trong ~191 ⇒ vòng lấn xuống dưới mép avatar 193,9 (= 256 / 1,32)
            expect(inner).toBeGreaterThanOrEqual(188)
            expect(inner).toBeLessThanOrEqual(194)
            // ngân sách trang trí: r ≤ 248, quá đó là bị hộp overlay cắt
            expect(outer).toBeLessThanOrEqual(248)
        },
        30_000,
    )
})
