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

/** A module-showcase card: i18n key + locale-aware target route. */
export interface ModuleCard {
    key: string
    href: string
}

/** What's inside each journey stop — Workplace / Course / Cộng đồng. */
export const MODULE_CARDS: ReadonlyArray<ModuleCard> = [
    { key: "workplace", href: "/subjects" },
    { key: "course", href: "/courses" },
    { key: "community", href: "/community" },
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

/** A mentor of the FTES team — real people from the legacy home view. */
export interface Mentor {
    /** i18n key suffix under `homeLanding.mentors.people.*` (name / role / quote). */
    key: string
    /** Avatar CDN URL (legacy FE). House avatar-fallback covers load failure. */
    avatarUrl: string
    /** Public FTES profile link (opens in a new tab). */
    profileUrl: string
}

/** Five real mentors, ordered founders-first (spec "Đội ngũ FTES"). */
export const MENTORS: ReadonlyArray<Mentor> = [
    {
        key: "anhKhoa",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/inbound3495336968961600058.jpg_1755149863087.jpg?v=1755149865389",
        profileUrl: "https://ftes.vn/vi/profiles/detail/khoana71",
    },
    {
        key: "ducHai",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/NTC_7861.JPG_1755370693669.JPG?v=1755370696709",
        profileUrl: "https://ftes.vn/vi/profiles/detail/haitthcs",
    },
    {
        key: "thanhHuy",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1755118228915@main/images/avata_thanh_huy.jpg_1755134964229.jpg?v=1755134965957",
        profileUrl: "https://ftes.vn/vi/profiles/detail/huybk",
    },
    {
        key: "nhatHuy",
        avatarUrl:
            "https://cdn.jsdelivr.net/gh/ftesedu/funnycode-images-1757352873747@main/images/z7011459834968_c3b2808b021d68c3455b96b8f881c71f.jpg_1758015271900.jpg?v=1758015274883",
        profileUrl: "https://ftes.vn/vi/profiles/detail/NhatHuyDev",
    },
    {
        key: "ngocHieu",
        avatarUrl:
            "http://res.cloudinary.com/dnt5cqzjy/image/upload/v1744559602/soewnzobl40pqextcipr.jpg",
        profileUrl: "https://ftes.vn/vi/profiles/detail/ngochieu3165",
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
}

/**
 * Six real achievers for the Bảng vàng FTES section.
 * ponytail: imageUrls still point at the legacy baked-text award posters (`poster: true`
 * triggers the face zoom-crop). When clean portrait URLs exist, swap the URL and drop
 * the `poster` flag — no code change needed.
 */
export const ACHIEVERS: ReadonlyArray<Achiever> = [
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

/** FAQ item keys — copy under `homeLanding.faq.items.<key>.{q,a}`. `refund` is mandatory. */
export const FAQ_KEYS = [
    "refund",
    "trial",
    "installment",
    "group",
    "scholarship",
    "afterCourse",
] as const
