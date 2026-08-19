import { describe, expect, it } from "vitest"
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"

/**
 * Ảnh REMOTE phải đi qua optimizer, và ảnh `fill` phải khai `sizes`.
 *
 * <p><b>Vì sao ghim bằng test.</b> Cả hai lỗi đều KHÔNG làm gì đỏ, không log gì, và trên máy dev
 * với ảnh nhỏ thì không ai thấy. Đã trả giá thật: bốn chỗ vẽ ảnh bìa khoá học gắn `unoptimized`
 * từ thời bìa còn là ảnh picsum giả, kèm chú thích "drop when real covers land". Bìa thật lên rồi
 * mà cờ vẫn nằm đó — đo trên production: một thẻ 16:9 rộng ~300px tải nguyên bản gốc 2,2–4,0 MB,
 * cả trang danh mục 73 MB / 231 request. Qua optimizer ở w=640 còn ~73 KB.
 *
 * <p>`fill` mà thiếu `sizes` thì Next mặc định `100vw`: trình duyệt chọn ảnh to nhất trong srcset
 * cho một ô có khi chỉ 56px. Lỗi này im lặng y hệt.
 */
const SRC = join(process.cwd(), "src", "components")

const tsxFiles = (dir: string): Array<string> =>
    readdirSync(dir).flatMap((name) => {
        const full = join(dir, name)
        if (statSync(full).isDirectory()) {
            return tsxFiles(full)
        }
        return name.endsWith(".tsx") && !name.includes(".test.") ? [full] : []
    })

/** Bo comment khoi va comment dong truoc khi tim the. */
const boComment = (src: string): string =>
    src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "")

/** Mỗi phần tử `<Image ... />` trong file, kèm đường dẫn để báo lỗi chỉ đúng chỗ. */
const imageElements = (): Array<{ file: string; jsx: string }> =>
    tsxFiles(SRC).flatMap((file) => {
        // Quét trên bản ĐÃ BỎ CHÚ THÍCH: chữ "fill" hay "<img>" nằm trong comment từng làm cả hai
        // phép kiểm dưới đây báo nhầm — chính test này đã dính một lần.
        const src = boComment(readFileSync(file, "utf8"))
        if (!src.includes("next/image")) {
            return []
        }
        return [...src.matchAll(/<Image\b[\s\S]*?\/>/g)].map((m) => ({
            file: relative(process.cwd(), file),
            jsx: m[0],
        }))
    })

describe("tối ưu ảnh (next/image)", () => {
    it("KHÔNG chỗ nào còn `unoptimized`", () => {
        const viPham = imageElements()
            .filter((el) => /\bunoptimized\b/.test(el.jsx))
            .map((el) => el.file)
        expect(viPham, "`unoptimized` = tải nguyên ảnh gốc; hãy thêm host vào remotePatterns "
            + "thay vì tắt optimizer").toEqual([])
    })

    it("mọi ảnh `fill` đều khai `sizes`", () => {
        const viPham = imageElements()
            .filter((el) => /\bfill\b/.test(el.jsx) && !/\bsizes=/.test(el.jsx))
            .map((el) => el.file)
        expect(viPham, "`fill` thiếu `sizes` ⇒ Next mặc định 100vw ⇒ trình duyệt tải bản to nhất "
            + "cho một ô nhỏ").toEqual([])
    })
})

/**
 * Host ảnh mà sản phẩm THẬT SỰ dùng phải nằm trong `remotePatterns`.
 *
 * <p><b>Vì sao đáng ghim.</b> Thiếu một host thì optimizer trả 400, `onError` của thẻ bật cờ
 * "ảnh hỏng" và ảnh BIẾN MẤT lặng lẽ — không lỗi đỏ, không log, build vẫn xanh. Đã trả giá thật:
 * bỏ `unoptimized` ở hero slider mà quên `cdn.jsdelivr.net` (nơi đặt ảnh banner) ⇒ mất sạch banner
 * trên production.
 *
 * <p>Danh sách này là HỢP ĐỒNG với dữ liệu backend đang trả về, không phải sở thích:
 * `/admin-content/banners` → jsDelivr; `/courses` → document.ftes.vn + lh3.googleusercontent.com.
 * Backend đổi nơi lưu ảnh thì phải sửa cả hai chỗ cùng lúc.
 */
describe("remotePatterns phủ đủ host ảnh đang dùng", () => {
    const config = readFileSync(join(process.cwd(), "next.config.ts"), "utf8")

    it.each([
        ["cdn.jsdelivr.net", "ảnh banner (/admin-content/banners → imageUrl)"],
        ["**.ftes.vn", "ảnh bìa khoá/môn (document.ftes.vn)"],
        ["lh3.googleusercontent.com", "avatar giảng viên đăng nhập Google (mentorAvatarUrl)"],
        ["picsum.photos", "slide giả của hero slider khi endpoint banner lỗi"],
        ["res.cloudinary.com", "ảnh migrate qua Cloudinary"],
    ])("có %s — %s", (host) => {
        expect(config).toContain(host)
    })
})

/**
 * The `<img>` THO — chot HIEN TRANG de khong phat sinh them.
 *
 * <p><b>Vi sao guard cu chua du.</b> Hai phep kiem ben tren chi soi the `<Image>` cua Next nen mu
 * hoan toan voi `<img>` tho — ma do moi la duong pho bien de lot anh co goc. Da tra gia that:
 * `CoverImage`, `ContinueCourseCard`, `CourseCard` va `AchievementsSection` deu dung `<img>` kem
 * chu thich "khong can khai remotePatterns"; trang chu vi the tai nhung tam 611 KB - 2.197 KB cho
 * khung chi vai tram pixel. Bon cho do da chuyen sang `next/image`.
 *
 * <p><b>Danh sach duoi la HIEN TRANG, khong phai loi chuc phuc.</b> Trong do co nhung cho DUNG la
 * phai dung `<img>`: duong lui cua `CoverImage`, art linh vat (anh DONG, file cuc bo), anh trong
 * noi dung markdown do nguoi dung nhap (host tuy y, khong khai truoc duoc), sticker/emoji, ma QR
 * dang `data:`. So con lai la NO, go dan tung dot. Viec cua test nay la: them file MOI vao danh
 * sach phai la mot quyet dinh co y thuc, khong phai chuyen lot qua im lang.
 *
 * <p>Quet SAU KHI BO CHU THICH — ban dau cua test nay bao nham 3 file chi vi chu "img" nam trong
 * comment.
 */
const IMG_THO_HIEN_TRANG: ReadonlyArray<string> = [
    "components/blocks/feed/PostImagePicker/index.tsx",
    "components/blocks/feed/PostMediaGrid/index.tsx",
    "components/blocks/identity/IconTile/index.tsx",
    "components/blocks/identity/Logo/index.tsx",
    "components/blocks/media/CoverImage/index.tsx",
    "components/features/challenge/ChallengeView/UiUxChallengeEditor/TargetPanel.tsx",
    "components/features/community/CommunityShell/PromoBanner.tsx",
    "components/features/course/browse/CatalogCourseCard/index.tsx",
    "components/features/gamification/BadgeUnlockHost/index.tsx",
    // Art badge (iconUrl do BE seed, ví dụ /gamification/achievements/*.png|svg) — CÙNG nguồn,
    // CÙNG cách xử lý với 3 bề mặt danh mục badge đã có trong danh sách này (BadgeCatalogRow /
    // BadgeCatalogCell / BadgeDetailModal). Host do BE seed nên không ghim được vào next/image
    // remotePatterns → giữ <img>, có glyph theo kind làm phương án dự phòng.
    "components/features/gamification/LeaderboardShell/index.tsx",
    "components/features/goldenboard/GoldenBoard/index.tsx",
    "components/features/group/GroupDetailShell/index.tsx",
    "components/features/group/GroupIdentityFields/index.tsx",
    "components/features/mascot-assistant/MascotAssistant.tsx",
    "components/features/profile/ProfileBadges/BadgeCatalogGrid/BadgeCatalogCell.tsx",
    "components/features/profile/ProfileBadges/BadgeCatalogGrid/BadgeDetailModal.tsx",
    "components/features/profile/ProfileBadges/BadgeCatalogModal/BadgeCatalogRow.tsx",
    "components/features/profile/ProfileProgress/index.tsx",
    "components/features/subject/ExamImageViewer/index.tsx",
    "components/features/subject/SubjectFeAlbum/FeAlbumManager.tsx",
    "components/features/subject/SubjectPractice/ExamContribute.tsx",
    "components/features/subject/SubjectWorkspaceShell/index.tsx",
    "components/layouts/blog/BlogList/FeaturedPost/index.tsx",
    "components/layouts/blog/BlogPost/index.tsx",
    "components/modals/CommunityPhotoLightboxModal/index.tsx",
    "components/reuseable/BadgeImage/index.tsx",
    "components/reuseable/CommentComposerTools/StickerPicker.tsx",
    "components/reuseable/Discussion/ReactionEmoji.tsx",
    "components/reuseable/FtesMascot/art.tsx",
    "components/reuseable/LinkPreview/index.tsx",
    "components/reuseable/MarkdownContent/map.tsx",
    // Ảnh KHUNG VIỀN avatar (assetUrl, 512×512 nền trong suốt) đè lên avatar. Host ảnh do BE
    // seed nên không ghim được vào next/image remotePatterns → giữ <img>. (Chuyển từ
    // AvatarWithFrame sang đây khi gộp việc vẽ khung vào UserAvatar.)
    "components/reuseable/UserAvatar/index.tsx",
]

/** Duong tuong doi kieu "components/..." cho mot file tsx. */
const asKey = (file: string): string =>
    "components/" + relative(SRC, file).split("\\").join("/")

const filesCoImgTho = (): Array<string> =>
    tsxFiles(SRC)
        .filter((file) => /<img[\s>]/.test(boComment(readFileSync(file, "utf8"))))
        .map(asKey)

describe("the <img> tho", () => {
    it("khong phat sinh cho moi ngoai hien trang", () => {
        const moi = filesCoImgTho().filter((f) => !IMG_THO_HIEN_TRANG.includes(f))
        expect(moi, "the <img> tho tai NGUYEN anh goc: khong resize, khong WebP, khong srcset. "
            + "Hay dung next/image + sizes (kem onError roi ve <img> neu host co the chua duoc "
            + "khai). Neu that su phai giu <img>, them vao IMG_THO_HIEN_TRANG kem ly do trong PR")
            .toEqual([])
    })

    it("danh sach hien trang khong co muc THUA — da sua thi phai xoa khoi danh sach", () => {
        const hienTai = new Set(filesCoImgTho())
        const thua = IMG_THO_HIEN_TRANG.filter((f) => !hienTai.has(f))
        expect(thua, "file da chuyen sang next/image nhung con nam trong danh sach: xoa di, "
            + "de danh sach chi con dung phan no that").toEqual([])
    })
})
