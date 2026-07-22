/**
 * Package-tier label helpers (lesson-tier-badge) — shared between the course
 * detail syllabus badges and the learn-side upgrade CTAs (e.g. a course-bank
 * challenge denied with `requiredPackageSlugs`). Extracted from
 * `CourseDetail/index.tsx` so both surfaces resolve the SAME human label for a
 * package slug.
 */

/**
 * Fallback tier labels for the known package slugs — used only while the course's
 * package list is still loading (the real `PackageView.name` is the source of truth).
 */
export const TIER_LABEL_FALLBACK: Record<string, string> = {
    free: "Miễn phí",
    basic: "Cơ bản",
    premium: "Premium",
    master: "Master",
    "on-tap-thuc-chien": "Ôn tập thực chiến",
}

/** Title-case a slug (`on-tap-thuc-chien` → `On Tap Thuc Chien`) as a last-resort label. */
export const titleCaseSlug = (slug: string) =>
    slug
        .split("-")
        .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
        .join(" ")

/**
 * Resolves the human label for a package slug: the admin-authored package name
 * when the course's package list has loaded, else the known-slug fallback, else
 * a Title-Cased slug so an unknown tier still renders something readable.
 */
export const resolveTierLabel = (
    slug: string,
    packageNameBySlug?: Map<string, string>,
): string => packageNameBySlug?.get(slug) ?? TIER_LABEL_FALLBACK[slug] ?? titleCaseSlug(slug)
