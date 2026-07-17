/**
 * UI slot an ad banner is shown in. Values are the BE `enum AdvertisementPlacement`
 * literals (schema.graphqls) — they are INLINED into the query document (see the
 * non-null-variable gateway quirk in `query-active-advertisement.ts`), so they must
 * match the schema spelling exactly.
 */
export enum AdvertisementPlacement {
    /** The right rail of the logged-in dashboard. */
    DashboardRight = "DASHBOARD_RIGHT",
    /** Interstitial modal shown when a non-enrolled viewer opens a lesson. */
    LessonInterstitial = "LESSON_INTERSTITIAL",
    /** Banner on the public course detail page (below the enroll card). */
    CourseDetail = "COURSE_DETAIL",
    /** Inline banner inside the lesson reader (below the paywall fade). */
    LessonInline = "LESSON_INLINE",
    /** Right rail of the coding practice list. */
    PracticeRail = "PRACTICE_RAIL",
    /** Right rail of the course leaderboard. */
    LeaderboardRail = "LEADERBOARD_RAIL",
    /** Promo panel under the community nav rail. */
    CommunityRail = "COMMUNITY_RAIL",
}

/** Variables for the `activeAdvertisement` query (placement defaults in the client). */
export interface QueryActiveAdvertisementRequest {
    /** UI slot to fetch the banner for (defaults to the dashboard right rail). */
    placement?: AdvertisementPlacement
    /** Course context for lesson placements (enrolled viewers are exempt). */
    courseId?: string
}

/** Media kind of an ad banner (BE `enum AdvertisementMediaType` literals). */
export enum AdvertisementMediaType {
    /** A single poster image. */
    Image = "IMAGE",
    /** A video clip. */
    Video = "VIDEO",
    /** An auto-advancing slideshow. */
    Carousel = "CAROUSEL",
}

/** `media` payload for an image ad. */
export interface AdvertisementImageMedia {
    /** Poster image URL. */
    url: string
}

/** `media` payload for a video ad. */
export interface AdvertisementVideoMedia {
    /** Video source URL. */
    url: string
    /** Optional poster shown before playback. */
    poster?: string
    /** Autoplay on mount (requires muted). */
    autoplay?: boolean
    /** Loop playback. */
    loop?: boolean
    /** Start muted. */
    muted?: boolean
}

/** One slide of a carousel ad. */
export interface AdvertisementCarouselSlide {
    /** Slide image URL. */
    url: string
    /** Optional per-slide click destination. */
    link?: string
}

/** `media` payload for a carousel ad. */
export interface AdvertisementCarouselMedia {
    /** Ordered slides. */
    slides: Array<AdvertisementCarouselSlide>
    /** Auto-advance interval in ms. */
    intervalMs?: number
}

/** Discriminated `media` union (narrow by the row's `mediaType`). */
export type AdvertisementMedia =
    | AdvertisementImageMedia
    | AdvertisementVideoMedia
    | AdvertisementCarouselMedia

/** BE `type Advertisement` (returned directly — no envelope; null when no active ad). */
export interface QueryActiveAdvertisementData {
    /** Advertisement id. */
    id: string
    /** Media kind — narrow `media` by this. */
    mediaType: AdvertisementMediaType
    /** Discriminated media payload (JSON scalar from the API). */
    media: AdvertisementMedia
    /** Banner title (locale-resolved). */
    title: string
    /** CTA label (locale-resolved), or null. */
    ctaText: string | null
    /** Click destination for the whole banner. */
    linkUrl: string
    /** Sponsor name (paid slot), or null for the house ad. */
    sponsorName: string | null
}

/** Apollo response shape for `activeAdvertisement` (returned directly — no envelope). */
export interface QueryActiveAdvertisementResponse {
    /** The active banner for the placement, or null (none / viewer exempt). */
    activeAdvertisement: QueryActiveAdvertisementData | null
}
