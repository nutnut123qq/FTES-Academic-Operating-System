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

/** Chip colors a tier badge may take (subset of the HeroUI Chip palette; `danger` stays
 *  reserved for destructive meaning). */
export type TierChipColor = "default" | "success" | "accent" | "warning"

/**
 * Màu chip theo GÓI, cố định TOÀN HỆ (góp ý website 2026-07-26: "để màu khác nhau để phân
 * biệt các gói"). Khoá theo slug chứ không theo thứ hạng trong từng khoá — cùng một gói
 * PREMIUM phải ra cùng một màu ở mọi khoá, nếu không người học phải học lại bảng màu mỗi
 * lần mở khoá mới. Thang đi một chiều rẻ → đắt (xám → xanh → hồng → vàng) để màu nói được
 * thứ bậc, không phải chỉ "khác nhau".
 *
 * Gói tên tự do do giảng viên đặt (không nằm trong bảng) rơi về `default` — vẫn tách khỏi
 * 3 bậc chuẩn nên hàng chip không bị đồng phục.
 */
export const TIER_CHIP_COLOR: Record<string, TierChipColor> = {
    free: "default",
    basic: "success",
    premium: "accent",
    master: "warning",
}

/** Màu chip của một gói; gói lạ → `default`. */
export const resolveTierColor = (slug: string): TierChipColor =>
    TIER_CHIP_COLOR[slug] ?? "default"

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
