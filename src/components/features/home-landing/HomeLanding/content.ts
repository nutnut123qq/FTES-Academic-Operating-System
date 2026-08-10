/**
 * Static typed content for the home landing sections. STRUCTURE only (ordering,
 * ids, avatar/image URLs, external profile links) lives here; all human-readable
 * copy lives in i18n under `homeLanding.*` and is looked up by `key`. There is no
 * plausible near-term BE contract for mentors / achievers / offers / FAQ, so these
 * are static content modules rather than API-shaped hooks (design D7).
 *
 * Real content sourced from the legacy `Ftes-frontend` home view (mentors +
 * achievers) — the names, roles, GPAs, achievements and quote authors are REAL.
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
 * per-learner "Bảng vàng" ({@link ACHIEVERS}) and the live BE course/enrollment counters
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
        // no public post for this one
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

/** An honored achiever — real FTES learners (legacy home "Bảng vàng"). */
export interface Achiever {
    /** i18n key suffix under `homeLanding.honor.people.*` (name + achievement lines). */
    key: string
    /** Number of achievement lines in i18n (`honor.people.<key>.lines.0..n`). */
    lineCount: number
    /** Short headline badge (rank / GPA) — language-neutral. */
    highlight: string
    /** Portrait image URL (legacy CDN). Falls back to initials on error. */
    imageUrl: string
    /** Featured achievers render on the large podium row; the rest in the compact grid. */
    featured?: boolean
    /** imageUrl is a legacy baked-text award poster — the card zoom-crops the face region. */
    poster?: boolean
    /** Optional internal route (e.g. the achiever's story on the blog) — the name links there. */
    href?: string
}

/**
 * Seven real achievers for the Bảng vàng FTES section.
 * ponytail: imageUrls still point at the legacy baked-text award posters (`poster: true`
 * triggers the face zoom-crop). When clean portrait URLs exist, swap the URL and drop
 * the `poster` flag — no code change needed.
 */
export const ACHIEVERS: ReadonlyArray<Achiever> = [
    {
        key: "thuanDuc",
        highlight: "CÓC VÀNG · SP25",
        lineCount: 2,
        featured: true,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/7.png_1757437141307.png?v=1757437144076",
        href: "/blog/trang-thuan-duc--tu-no-luc-ca-nhan-den-danh-hieu-coc-vang-cung-ftes",
    },
    {
        key: "kimKhoa",
        highlight: "TOP 100 · 3 kỳ",
        lineCount: 3,
        featured: true,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/4.png_1757436769364.png?v=1757436772039",
    },
    {
        key: "hoangBlue",
        highlight: "GPA 9.4",
        lineCount: 2,
        featured: true,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/1.png_1757436678874.png?v=1757436681722",
    },
    {
        key: "hoangDuy",
        highlight: "GPA 9.6",
        lineCount: 3,
        featured: true,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/2.png_1757436714804.png?v=1757436718361",
    },
    {
        key: "hongPhuc",
        highlight: "Hackathon",
        lineCount: 2,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/3.png_1757436740942.png?v=1757436743766",
    },
    {
        key: "chiThong",
        highlight: "TOP 5 · Spring 2025",
        lineCount: 1,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/5.png_1757436795210.png?v=1757436798094",
    },
    {
        key: "tranViet",
        highlight: "Distinction SU25",
        lineCount: 1,
        poster: true,
        imageUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/6.png_1757436830366.png?v=1757436833271",
    },
] as const

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
