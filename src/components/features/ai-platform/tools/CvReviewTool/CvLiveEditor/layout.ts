/**
 * Layout / visibility / design state for the Live A4 CV editor — plus the pure
 * helpers that BOTH the on-screen A4 preview and the `pdf.tsx` exporter consume,
 * so the two renderers stay in lock-step (same section order, same hidden set,
 * same density scale, same accent).
 *
 * ★ Why localStorage and not the CV payload: the backend validates `sections`
 * against the Harvard shape and REJECTS UNKNOWN KEYS (400 CV_PROFILE_INVALID),
 * so section ORDER, VISIBILITY, and DESIGN options must never enter the saved
 * `sections`. They are FE-only presentation prefs, persisted per user in
 * localStorage under `ftes.cv.layout` / `ftes.cv.design` — mirroring the mascot
 * localStorage-persist pattern (guarded so SSR / privacy-mode never crash).
 */

// ---- keys / enums ----

/** The reorderable sections (the header is always first and NOT reorderable). */
export type CvSectionKey =
    | "summary"
    | "education"
    | "experience"
    | "projects"
    | "skills"
    | "awards"

/** Canonical section order (the default layout). */
export const CV_SECTION_KEYS: readonly CvSectionKey[] = [
    "summary",
    "education",
    "experience",
    "projects",
    "skills",
    "awards",
]

/** Print-safe accent tints — applied ONLY to the name + section-heading rule. */
export type CvAccent = "none" | "black" | "navy" | "burgundy" | "teal"
export const CV_ACCENTS: readonly CvAccent[] = ["none", "black", "navy", "burgundy", "teal"]

/** Spacing / line-height / font-size scale. */
export type CvDensity = "compact" | "normal" | "relaxed"
export const CV_DENSITIES: readonly CvDensity[] = ["compact", "normal", "relaxed"]

/** Serif vs sans body font. */
export type CvFontChoice = "serif" | "sans"
export const CV_FONTS: readonly CvFontChoice[] = ["serif", "sans"]

/** Section order + hidden set (FE-only, localStorage). */
export interface CvLayout {
    order: CvSectionKey[]
    hidden: CvSectionKey[]
}

/** Design knobs (FE-only, localStorage). */
export interface CvDesign {
    accent: CvAccent
    density: CvDensity
    font: CvFontChoice
}

/** A fresh default layout — canonical order, nothing hidden. */
export const defaultLayout = (): CvLayout => ({ order: [...CV_SECTION_KEYS], hidden: [] })

/** A fresh default design — no accent, normal density, serif body. */
export const defaultDesign = (): CvDesign => ({ accent: "none", density: "normal", font: "serif" })

// ---- pure helpers (SHARED source of truth for preview + PDF) ----

/**
 * The section keys to render, in order, excluding hidden ones. Normalises the
 * stored order (drops unknown keys, appends any newly-added section that a stale
 * stored order is missing) so schema evolution never loses a section.
 */
export const orderedVisibleKeys = (layout: CvLayout): CvSectionKey[] => {
    const hidden = new Set(layout.hidden)
    const seen = new Set<CvSectionKey>()
    const ordered: CvSectionKey[] = []
    for (const key of layout.order) {
        if (CV_SECTION_KEYS.includes(key) && !seen.has(key)) {
            ordered.push(key)
            seen.add(key)
        }
    }
    for (const key of CV_SECTION_KEYS) {
        if (!seen.has(key)) ordered.push(key)
    }
    return ordered.filter((key) => !hidden.has(key))
}

/** Numeric density factors, multiplied into base sizes by both renderers. */
export interface DensityScale {
    /** Multiplier on every base font size. */
    fontScale: number
    /** Body line-height. */
    lineHeight: number
    /** Multiplier on the inter-section / inter-item spacing. */
    gap: number
}

export const densityScale = (density: CvDensity): DensityScale => {
    switch (density) {
    case "compact":
        return { fontScale: 0.92, lineHeight: 1.28, gap: 0.7 }
    case "relaxed":
        return { fontScale: 1.08, lineHeight: 1.6, gap: 1.35 }
    default:
        return { fontScale: 1, lineHeight: 1.42, gap: 1 }
    }
}

/**
 * Hex for an accent, or `null` for "none" (⇒ the renderer falls back to the
 * default near-black text colour). Kept ATS-clean: dark, print-safe tints only.
 */
export const accentColor = (accent: CvAccent): string | null => {
    switch (accent) {
    case "black":
        return "#1a1a1a"
    case "navy":
        return "#1f3a5f"
    case "burgundy":
        return "#6b1f2e"
    case "teal":
        return "#1f4f4f"
    default:
        return null
    }
}

/** The default near-black used for the name + rule when accent is "none". */
export const CV_INK = "#1a1a1a"

/** CSS font-family stack for the HTML A4 preview (serif vs sans). */
export const cssFontStack = (font: CvFontChoice): string =>
    font === "serif"
        ? "Georgia, \"Times New Roman\", \"Noto Serif\", serif"
        : "Arial, Helvetica, \"Noto Sans\", sans-serif"

// ---- localStorage (SSR-safe, per user) ----

const LAYOUT_KEY = "ftes.cv.layout"
const DESIGN_KEY = "ftes.cv.design"

/** Per-user key: scope by the CV profile id when known, else a shared default. */
const scopedKey = (base: string, scope: string | undefined): string =>
    scope ? `${base}.${scope}` : base

const isSectionKey = (value: unknown): value is CvSectionKey =>
    typeof value === "string" && (CV_SECTION_KEYS as readonly string[]).includes(value)

/** Read + validate the stored layout for `scope`; returns the default on any miss. */
export const loadLayout = (scope: string | undefined): CvLayout => {
    try {
        if (typeof window === "undefined") return defaultLayout()
        const raw = window.localStorage.getItem(scopedKey(LAYOUT_KEY, scope))
        if (!raw) return defaultLayout()
        const parsed = JSON.parse(raw) as Partial<CvLayout>
        const order = Array.isArray(parsed.order) ? parsed.order.filter(isSectionKey) : []
        const hidden = Array.isArray(parsed.hidden) ? parsed.hidden.filter(isSectionKey) : []
        // Normalise so a partial/stale order still renders every section.
        return { order: orderedFull(order), hidden }
    } catch {
        return defaultLayout()
    }
}

/** Complete a possibly-partial order with any missing canonical keys, in order. */
const orderedFull = (order: CvSectionKey[]): CvSectionKey[] => {
    const seen = new Set<CvSectionKey>()
    const out: CvSectionKey[] = []
    for (const key of order) {
        if (!seen.has(key)) {
            out.push(key)
            seen.add(key)
        }
    }
    for (const key of CV_SECTION_KEYS) if (!seen.has(key)) out.push(key)
    return out
}

/** Persist the layout for `scope` (no-op on SSR / blocked storage). */
export const saveLayout = (scope: string | undefined, layout: CvLayout): void => {
    try {
        window.localStorage.setItem(scopedKey(LAYOUT_KEY, scope), JSON.stringify(layout))
    } catch {
        // ignore — worst case the prefs reset next visit
    }
}

const isAccent = (value: unknown): value is CvAccent =>
    typeof value === "string" && (CV_ACCENTS as readonly string[]).includes(value)
const isDensity = (value: unknown): value is CvDensity =>
    typeof value === "string" && (CV_DENSITIES as readonly string[]).includes(value)
const isFont = (value: unknown): value is CvFontChoice =>
    typeof value === "string" && (CV_FONTS as readonly string[]).includes(value)

/** Read + validate the stored design for `scope`; returns the default on any miss. */
export const loadDesign = (scope: string | undefined): CvDesign => {
    try {
        if (typeof window === "undefined") return defaultDesign()
        const raw = window.localStorage.getItem(scopedKey(DESIGN_KEY, scope))
        if (!raw) return defaultDesign()
        const parsed = JSON.parse(raw) as Partial<CvDesign>
        const base = defaultDesign()
        return {
            accent: isAccent(parsed.accent) ? parsed.accent : base.accent,
            density: isDensity(parsed.density) ? parsed.density : base.density,
            font: isFont(parsed.font) ? parsed.font : base.font,
        }
    } catch {
        return defaultDesign()
    }
}

/** Persist the design for `scope` (no-op on SSR / blocked storage). */
export const saveDesign = (scope: string | undefined, design: CvDesign): void => {
    try {
        window.localStorage.setItem(scopedKey(DESIGN_KEY, scope), JSON.stringify(design))
    } catch {
        // ignore — worst case the prefs reset next visit
    }
}
