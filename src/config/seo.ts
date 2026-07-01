/**
 * SEO / analytics configuration, sourced from public env vars so values can be
 * swapped per environment without code changes. Mock-friendly: every field has a
 * safe default, and consumers treat empty strings as "not configured" (e.g. the
 * Google Analytics tag and the search-console verification meta only render when
 * their id is present).
 *
 * Set these in `.env.local` (see `.env.example`):
 * - `NEXT_PUBLIC_SITE_URL` — absolute site origin, used for canonical / OG / sitemap urls.
 * - `NEXT_PUBLIC_GA_ID` — GA4 Measurement Id (`G-XXXXXXXXXX`).
 * - `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` — Google Search Console verification token.
 */
export const SEO_CONFIG = {
    /** Human-readable site / brand name used in titles + OG. */
    siteName: "StarCi Academy",
    /** Absolute origin for canonical / OpenGraph / sitemap urls (no trailing slash). */
    siteUrl: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
    /** GA4 Measurement Id; empty disables the Google Analytics tag. */
    gaId: process.env.NEXT_PUBLIC_GA_ID ?? "",
    /** Google Search Console verification token; empty omits the verification meta. */
    googleSiteVerification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION ?? "",
    /** Default site description (fallback when a page has none). */
    defaultDescription:
        "StarCi Academy — học Fullstack, System Design và AI/LLM Engineering qua dự án thật, thực hành chấm điểm và lộ trình rõ ràng.",
    /** Locales the public site is served under (mirrors the `[locale]` segment). */
    locales: ["vi", "en"] as ReadonlyArray<string>,
    /** Default locale — used for `x-default` hreflang + the canonical sitemap url. */
    defaultLocale: "vi",
    /** Default share image (relative to {@link siteUrl}); per-entity pages override with a real cover. */
    ogImage: "/logo-lockup.png",
} as const
