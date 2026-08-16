/**
 * Static typed content for the home landing sections. STRUCTURE only (ordering,
 * ids, avatar/image URLs, external profile links) lives here; all human-readable
 * copy lives in i18n under `homeLanding.*` and is looked up by `key`. There is no
 * plausible near-term BE contract for mentors / offers / FAQ, so these are static
 * content modules rather than API-shaped hooks (design D7). The one exception, the
 * per-learner "Bảng vàng", HAS a BE contract now and left this file — see the note
 * where its data used to sit.
 *
 * Real content sourced from the legacy `Ftes-frontend` home view — the names, roles,
 * GPAs, achievements and quote authors are REAL.
 */

/** A journey station rendered both in the 3D scene and the text stepper/fallback. */
export interface JourneyStation {
    /** i18n key suffix under `homeLanding.journey.stations.*` (label + caption). */
    key: string
    /** The final "Thành quả" payoff station gets the emphasis treatment. */
    payoff?: boolean
}

/** Five ordered stations: Home → Workplace → Course → Luyện tập/AI → Thành quả. */
export const JOURNEY_STATIONS: ReadonlyArray<JourneyStation> = [
    { key: "home" },
    { key: "workplace" },
    { key: "course" },
    { key: "practice" },
    { key: "outcome", payoff: true },
] as const

/**
 * One press article about a milestone. `source` and `title` stay HERE rather than in
 * i18n on purpose: they are the publication's own name and its headline as published
 * (verbatim, Vietnamese) — citation data, not UI copy, so translating them would
 * misquote the source. Only the section label around the list is localized.
 */
export interface PressLink {
    /** Publication name, e.g. "Báo Gia Lai". */
    source: string
    /** Headline exactly as published (checked against the live article, 2026-08-15). */
    title: string
    /** Canonical article URL, opened in a new tab. */
    url: string
}

/**
 * Báo chí viết về FTES — MỘT Ô MỘT BÀI trên trang chủ.
 *
 * Trước đây chúng nằm lồng trong thẻ thành tựu dưới dạng danh sách link, nên chín bài co
 * lại thành mấy dòng chữ nhỏ trong hai thẻ. Chủ dự án chốt mỗi bài đứng thành một ô riêng:
 * một bài báo là một bằng chứng độc lập, gộp vào nhau thì mất trọng lượng của từng cái.
 *
 * `source` và `title` cố ý KHÔNG nằm trong i18n: đó là tên toà soạn và tiêu đề đúng như đã
 * đăng (tiếng Việt, nguyên văn) — dữ liệu trích dẫn chứ không phải chữ giao diện, dịch đi là
 * trích sai nguồn. Chỉ nhãn của khối mới localise.
 */
export const PRESS_ARTICLES: ReadonlyArray<PressLink> = [
    {
        source: "Báo Gia Lai",
        title: "10 dự án được chọn vào vòng chung kết cuộc thi \"Thanh niên Gia Lai khởi nghiệp sáng tạo\"",
        url: "https://baogialai.com.vn/10-du-an-vao-chung-ket-cuoc-thi-thanh-nien-gia-lai-khoi-nghiep-sang-tao-post573678.html",
    },
    {
        source: "Báo Mới",
        title: "10 dự án vào chung kết cuộc thi \"Thanh niên Gia Lai khởi nghiệp sáng tạo\"",
        url: "https://baomoi.com/10-du-an-vao-chung-ket-cuoc-thi-thanh-nien-gia-lai-khoi-nghiep-sang-tao-c53883239.epi",
    },
    {
        source: "Báo Gia Lai",
        title: "30 dự án được chọn vào vòng bán kết cuộc thi \"Thanh niên Gia Lai khởi nghiệp sáng tạo\"",
        url: "https://baogialai.com.vn/30-du-an-vao-vong-ban-ket-cuoc-thi-thanh-nien-gia-lai-khoi-nghiep-sang-tao-post572244.html",
    },
    {
        source: "Thương hiệu & Truyền thông",
        title: "Gia Lai tạo bệ phóng cho doanh nghiệp khởi nghiệp sáng tạo",
        url: "https://thuonghieutruyenthong.vn/gia-lai-tao-be-phong-cho-doanh-nghiep-khoi-nghiep-sang-tao",
    },
    {
        source: "Báo Gia Lai",
        title: "Gia Lai: Kết nối và gọi vốn đầu tư cho 4 dự án khởi nghiệp năm 2025",
        url: "https://baogialai.com.vn/gia-lai-ket-noi-va-goi-von-dau-tu-cho-4-du-an-khoi-nghiep-nam-2025-post575022.html",
    },
    {
        source: "Đại học FPT",
        title: "Đồ án khởi nghiệp của sinh viên FPTU đạt doanh thu gần 1 tỷ đồng sau 1 năm",
        url: "https://daihoc.fpt.edu.vn/tin-tuc/do-an-khoi-nghiep-cua-sinh-vien-fptu-dat-doanh-thu-gan-1-ty-dong-sau-1-nam/",
    },
    {
        source: "aFamily",
        title: "Đồ án khởi nghiệp của sinh viên FPTU đạt doanh thu gần 1 tỷ đồng sau 1 năm",
        url: "https://m.afamily.vn/do-an-khoi-nghiep-cua-sinh-vien-fptu-dat-doanh-thu-gan-1-ty-dong-sau-1-nam-23626071014333084.chn",
    },
    {
        source: "CafeF",
        title: "Học khởi nghiệp ở trường đại học: Không phải ai cũng thành founder, nhưng ai cũng cần tư duy làm chủ",
        url: "https://cafef.vn/hoc-khoi-nghiep-o-truong-dai-hoc-khong-phai-ai-cung-thanh-founder-nhung-ai-cung-can-tu-duy-lam-chu-188260623192001525.chn",
    },
    {
        source: "CafeF",
        title: "Không chờ tốt nghiệp, sinh viên trường này đã kiếm gần 1 tỷ đồng từ ý tưởng làm đồ án",
        url: "https://cafef.vn/khong-cho-tot-nghiep-sinh-vien-truong-nay-da-kiem-gan-1-ty-dong-tu-y-tuong-lam-do-an-188260616171224173.chn",
    },
]

/** One FTES achievement milestone card in the achievements carousel. */
export interface AchievementStat {
    /** i18n key suffix under `homeLanding.achievements.items.<key>.{title,description}`. */
    key: string
    /** Year the milestone happened. */
    year: string
    /**
     * Language-neutral highlight rendered verbatim for RANKED recognitions (rank /
     * percentage / count, e.g. "Top 100", "100%"). Plain events have none.
     */
    value?: string
    /**
     * Cover photo of the real event/award under `public/achievements/` (downscaled +
     * compressed from the legacy `Ftes-frontend/public/achiver/` originals). REQUIRED —
     * the carousel only carries milestones we have a real photo of; no photo is ever
     * fabricated and no photo-less card is shown.
     */
    imageSrc: string
    /**
     * Public evidence of the milestone (original Facebook post / press article), opened
     * in a new tab. Omitted when no public post exists — never a placeholder link.
     */
    href?: string
}

/**
 * Real FTES company milestones (ported from the legacy home "Thành tựu" cards + the
 * "Những gì chúng tôi đạt được" milestone slider): awards, competition placements,
 * scholarships and public events, ordered awards-first. Deliberately distinct from the
 * per-learner "Bảng vàng" (now BE-backed — `GET /api/v1/golden-board/latest`, rendered by
 * `features/goldenboard/GoldenBoard`) and the live BE course/enrollment counters
 * (PlatformStatsSection) — no figure is duplicated.
 *
 * Titles/descriptions are written against the evidence photos themselves (not the legacy
 * captions, which mislabelled the Gia Lai contest as a Ho Chi Minh City one).
 */
export const ACHIEVEMENTS: ReadonlyArray<AchievementStat> = [
    {
        key: "techfest",
        year: "2025",
        value: "Top 100",
        imageSrc: "/achievements/top-100-techfest.jpg",
        href: "https://www.facebook.com/share/p/1DHzPpWe8W/",
    },
    {
        key: "innovationQuest",
        year: "2025",
        value: "Top 30",
        imageSrc: "/achievements/innovation-quest.jpg",
        href: "https://www.facebook.com/share/p/1D2j1sS8Uo/",
    },
    {
        key: "knstgl",
        year: "2025",
        value: "Top 3",
        imageSrc: "/achievements/giai-3-knstgl.jpg",
    },
    {
        key: "fptScholarship",
        year: "2025",
        value: "100%",
        imageSrc: "/achievements/hoc-bong-khoi-nghiep-fpt.jpg",
        href: "https://www.facebook.com/share/p/1ANtcVpcoY/",
    },
    {
        key: "openDay",
        year: "2025",
        imageSrc: "/achievements/open-day.jpg",
        href: "https://www.facebook.com/share/p/1BuQmpEM2H/",
    },
    {
        key: "ttsg",
        year: "2025",
        imageSrc: "/achievements/ttsg.jpg",
        // no public post for this one
    },
    {
        key: "fundraising",
        year: "2025",
        imageSrc: "/achievements/goi-von-lan-1.jpg",
        href: "https://www.facebook.com/share/r/1CqoWaFiN8/",
    },
    {
        key: "demoDay",
        year: "2025",
        imageSrc: "/achievements/demo-day.jpg",
        href: "https://www.facebook.com/share/p/1W9YWF8U1d/",
    },
] as const

/** An AI-feature chip (static, always crawlable). i18n key under `stats.aiChips.*`. */
export const AI_CHIP_KEYS = ["tutor", "grading", "recommend", "roadmap"] as const

/** An offer / policy group — verbatim copy lives under `offers.groups.<key>.*`. */
export interface OfferGroup {
    /** i18n key suffix under `homeLanding.offers.groups.*`. */
    key: string
    /** Number of verbatim bullet lines in i18n (`offers.groups.<key>.lines.0..n`). */
    lineCount: number
}

/** Eight offer groups, in display order (spec §"Ưu đãi và chính sách"). */
export const OFFER_GROUPS: ReadonlyArray<OfferGroup> = [
    { key: "newLearner", lineCount: 3 },
    { key: "liveZoom", lineCount: 3 },
    { key: "group", lineCount: 3 },
    { key: "returning", lineCount: 3 },
    { key: "honor", lineCount: 4 },
    { key: "afterCourse", lineCount: 1 },
    { key: "installment", lineCount: 4 },
    { key: "trial", lineCount: 4 },
] as const

/** A mentor testimonial — real FTES team members (legacy home mentor carousel). */
export interface Testimonial {
    /** i18n key suffix under `homeLanding.mentors.quotes.<key>.{name,role,quote}`. */
    key: string
    /** Portrait URL (legacy CDN). Falls back to initials on error. */
    avatarUrl: string
    /** Public FTES profile — rendered as the byline "view profile" link. */
    profileUrl: string
    github?: string
    linkedin?: string
    facebook?: string
    /**
     * Các môn người này đang dạy, dạng slug khoá học (góp ý website 2026-07-26: "nên hiển thị
     * số môn học đang dạy… click vào chuyển sang khóa học detail").
     *
     * Phải khai TAY vì KHÔNG suy ra được: `GET /courses/{slug}` không trả field giảng viên nào
     * (đo apitest 2026-07-30), và danh sách mentor ở đây là tĩnh, không mang id người dùng. Bỏ
     * trống thì cụm "đang dạy" không render — thà thiếu còn hơn đoán bừa ai dạy môn gì.
     *
     * Muốn tự động thì cần BE trả giảng viên của khoá (hoặc endpoint khoá-theo-giảng-viên).
     */
    courseSlugs?: ReadonlyArray<string>
}

/**
 * Five real FTES mentors for the testimonial carousel — founder Nguyễn Anh Khoa first,
 * then the rest of the team. Copy (name/role/quote) lives in i18n `mentors.quotes.*`;
 * only URLs live here. Ngọc Hiếu's avatar is upgraded to https (the legacy source served
 * it over http, which browsers block as mixed content → the Avatar shows initials).
 */
export const TESTIMONIALS: ReadonlyArray<Testimonial> = [
    {
        key: "khoa",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/inbound3495336968961600058.jpg_1755149863087.jpg?v=1755149865389",
        profileUrl: "https://ftes.vn/vi/profiles/detail/khoana71",
        github: "https://github.com/khoa070104",
        linkedin: "https://www.linkedin.com/in/khoana-dev/",
        facebook: "https://www.facebook.com/khoaak71.vip",
    },
    {
        key: "nhatHuy",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/z7011459834968_c3b2808b021d68c3455b96b8f881c71f.jpg_1758015271900.jpg?v=1758015274883",
        profileUrl: "https://ftes.vn/vi/profiles/detail/NhatHuyDev",
    },
    {
        key: "ducHai",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/NTC_7861.JPG_1755370693669.JPG?v=1755370696709",
        profileUrl: "https://ftes.vn/vi/profiles/detail/haitthcs",
    },
    {
        key: "ngocHieu",
        avatarUrl: "https://res.cloudinary.com/dnt5cqzjy/image/upload/v1744559602/soewnzobl40pqextcipr.jpg",
        profileUrl: "https://ftes.vn/vi/profiles/detail/ngochieu3165",
    },
    {
        key: "thanhHuy",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/avata_thanh_huy.jpg_1755134964229.jpg?v=1755134965957",
        profileUrl: "https://ftes.vn/vi/profiles/detail/huybk",
    },
] as const

/*
 * REMOVED (golden-board-fe, 2026-08-13): the `Achiever` interface + the seven-entry `ACHIEVERS`
 * array that used to drive the "Bảng vàng FTES" section, together with their `homeLanding.honor
 * .people.*` i18n copy. The board is BE data now — `GET /api/v1/golden-board/latest` per term —
 * so changing one name no longer needs an FE deploy. Rendering lives in
 * `features/goldenboard/GoldenBoard`, shared by the home section and the `/goldenboard` page.
 */

/**
 * FAQ item keys — copy under `homeLanding.faq.items.<key>.{q,a}`. `refund` is mandatory.
 * Order mirrors the official FTES FAQ sheet (offers → honors → policies → trial).
 */
export const FAQ_KEYS = [
    "newStudentOffer",
    "liveClass",
    "group",
    "returningStudent",
    "scholarship",
    "afterCourse",
    "installment",
    "refund",
    "trial",
    "trialTest",
    "combineOffers",
] as const
