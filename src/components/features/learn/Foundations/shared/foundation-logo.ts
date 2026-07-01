/**
 * Local square brand logos for the well-known foundation topics. The synced
 * `thumbnailUrl` banners are 16:9 artwork that crops badly into the small square
 * list leading, so for topics we ship a crisp square mark, we render the local
 * SVG instead (files live in `/public/foundations/*.svg`).
 *
 * Keyed by the topic's NORMALISED title (locale-resolved title with the
 * "Nền tảng" / "Foundation" prefix, the `.js` suffix and whitespace stripped),
 * so it matches whether the API returns "Nền tảng Node.js", "Node.js", etc.
 */
const FOUNDATION_LOGOS: Record<string, string> = {
    docker: "/foundations/docker.svg",
    kubernetes: "/foundations/kubernetes.svg",
    node: "/foundations/nodejs.svg",
    react: "/foundations/reactjs.svg",
    springboot: "/foundations/spring-boot.svg",
    go: "/foundations/go.svg",
    playwright: "/foundations/playwright.svg",
}

/**
 * Reduce a foundation title to its bare brand key so it lines up with
 * {@link FOUNDATION_LOGOS} regardless of locale prefix or `.js` suffix.
 * @param title - Locale-resolved category title (e.g. "Nền tảng Node.js").
 * @returns Lower-cased brand key (e.g. "node", "springboot", "go").
 */
const normaliseTitle = (title: string): string =>
    title
        .toLowerCase()
        .replace(/nền tảng|foundation/g, "")
        .replace(/\.js/g, "")
        .replace(/\s+/g, "")
        .trim()

/**
 * Resolve the local square brand logo for a foundation topic.
 * @param title - Locale-resolved category title.
 * @returns Public path to the square SVG, or `null` when no local logo is shipped
 *   (the caller then falls back to the API thumbnail / placeholder icon).
 */
export const resolveFoundationLogo = (title: string): string | null =>
    FOUNDATION_LOGOS[normaliseTitle(title)] ?? null
