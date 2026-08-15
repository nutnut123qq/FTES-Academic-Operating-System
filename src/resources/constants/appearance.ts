/** Identifier of an accent preset — mirrors the `[data-accent="…"]` blocks in `globals.css`. */
export type AccentId = "indigo" | "pink" | "teal" | "emerald" | "amber" | "violet"

/** Direction of the ambient background effect: embers rising vs meteors falling. */
export type EffectDirection = "rise" | "fall"

/** Speed tier of the ambient background effect (multiplies each spark's duration). */
export type EffectSpeed = "slow" | "normal" | "fast"

/**
 * Duration multiplier per speed tier, applied to each spark's base animation
 * duration (`animationDuration = baseDuration * SPEED_FACTOR[speed]`). Lower =
 * faster. `normal` is the default (×1.0); reduced-motion still fully disables the
 * effect regardless of speed.
 */
export const SPEED_FACTOR: Record<EffectSpeed, number> = {
    slow: 1.6,
    normal: 1.0,
    fast: 0.55,
}

/** Spark count per direction — fall stays sparse so streaks read as a meteor shower, not noise. */
export const SPARK_COUNT: Record<EffectDirection, number> = {
    rise: 60,
    fall: 40,
}

/** Default ambient effect speed when nothing is persisted (`normal`, ×1.0). */
export const DEFAULT_EFFECT_SPEED: EffectSpeed = "normal"

/**
 * One curated accent preset. The CSS block in `globals.css` is the value that is
 * actually applied app-wide; `swatch` only paints the picker swatch itself.
 */
export interface AccentPreset {
    /** Stable id — doubles as the `data-accent` attribute value. */
    id: AccentId
    /** CSS color used to paint the swatch in the appearance modal. */
    swatch: string
    /** i18n key (full dotted path) of the human-readable color name. */
    nameKey: string
}

/**
 * Curated accent presets, in display order. The FIRST entry (`indigo`, #3F51B5 —
 * the old Ftes-frontend `blue.primary`) is the app default; `pink` keeps the
 * previous brand accent. Every color is dark enough for white foreground text
 * to reach >= 4.5:1 contrast.
 */
export const ACCENT_PRESETS: ReadonlyArray<AccentPreset> = [
    { id: "indigo", swatch: "#3F51B5", nameKey: "appearance.accent.names.indigo" },
    { id: "pink", swatch: "oklch(70.03% 0.2092 354.13)", nameKey: "appearance.accent.names.pink" },
    { id: "teal", swatch: "#0F766E", nameKey: "appearance.accent.names.teal" },
    { id: "emerald", swatch: "#047857", nameKey: "appearance.accent.names.emerald" },
    { id: "amber", swatch: "#B45309", nameKey: "appearance.accent.names.amber" },
    { id: "violet", swatch: "#7C3AED", nameKey: "appearance.accent.names.violet" },
]

/** Default accent when nothing is persisted (first preset — indigo #3F51B5). */
export const DEFAULT_ACCENT: AccentId = "indigo"

/**
 * Whether a string is one of the curated {@link AccentId} preset ids — used to
 * tell "the account stored a preset" from "the account stored a free-form hex"
 * (both travel in the SAME `accentColor` field on the profile) and to drop values
 * an older build may have written.
 * @param value - candidate read from the server or from persisted state.
 */
export const isAccentId = (value: unknown): value is AccentId =>
    typeof value === "string" && ACCENT_PRESETS.some((preset) => preset.id === value)

/**
 * The default accent as a plain hex — the starting value of the free-form colour
 * picker (the preset swatches are not all hex, so they can't seed it).
 */
export const DEFAULT_ACCENT_HEX = "#3F51B5"

/**
 * Ambient background effect the user picked in Settings → Appearance. `ember` is
 * the app's own spark field (embers rising / meteors falling — see
 * `effectDirection` + `effectSpeed`); the other eight are self-contained looks.
 * Every effect tints from `--accent`, so it retints with the chosen accent.
 */
export type BackgroundEffect =
    | "none"
    | "ember"
    | "wave"
    | "snow"
    | "rain"
    | "bubbles"
    | "fireflies"
    | "stars"
    | "aurora"
    | "circuit"

/** The selectable ambient effects, in picker order (`none` first = "off"). */
export const BACKGROUND_EFFECTS: ReadonlyArray<BackgroundEffect> = [
    "none",
    "ember",
    "wave",
    "snow",
    "rain",
    "bubbles",
    "fireflies",
    "stars",
    "aurora",
    "circuit",
]

/** Default ambient effect when nothing is persisted — the app's own spark field. */
export const DEFAULT_BACKGROUND_EFFECT: BackgroundEffect = "ember"

/**
 * Whether a string is one of the known {@link BackgroundEffect} values — used to
 * sanitize whatever came back out of localStorage before it reaches the store.
 * @param value - candidate read from persisted state.
 */
export const isBackgroundEffect = (value: unknown): value is BackgroundEffect =>
    typeof value === "string" && (BACKGROUND_EFFECTS as ReadonlyArray<string>).includes(value)

/** Near-black foreground for light accents (mirrors the `--foreground` light token). */
const DARK_FOREGROUND = "oklch(21.03% 0.0015 354.13)"

/** White foreground for dark accents (mirrors `--accent-foreground` in every preset). */
const LIGHT_FOREGROUND = "oklch(100% 0 0)"

/**
 * Pick a readable foreground for a custom accent via the standard YIQ
 * perceived-brightness threshold — cheap, no color-space conversion, good enough
 * to keep `--accent-foreground` legible against whatever hue the user picked.
 *
 * KEEP IN SYNC with the inline pre-paint script in `[locale]/layout.tsx` (that one
 * must stay a raw string — it runs before React/modules load).
 *
 * @param hex - a `#rgb` or `#rrggbb` color string.
 * @returns the CSS color to use as `--accent-foreground`.
 */
export const accentForeground = (hex: string): string => {
    const normalized = hex.replace("#", "")
    const full = normalized.length === 3
        ? normalized.split("").map((channel) => channel + channel).join("")
        : normalized
    const r = parseInt(full.slice(0, 2), 16)
    const g = parseInt(full.slice(2, 4), 16)
    const b = parseInt(full.slice(4, 6), 16)
    // NaN (garbage input) falls through to the white foreground every preset uses
    const yiq = (r * 299 + g * 587 + b * 114) / 1000
    return yiq >= 150 ? DARK_FOREGROUND : LIGHT_FOREGROUND
}

/**
 * Whether a string is a usable `#rgb` / `#rrggbb` custom accent — persisted state
 * and the pre-paint script both go through this before touching `<html>` styles.
 * @param value - candidate read from persisted state.
 */
export const isAccentHex = (value: unknown): value is string =>
    typeof value === "string" && /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value)

/** localStorage key of the persisted appearance store (zustand `persist`). */
export const APPEARANCE_STORAGE_KEY = "ftesaos-appearance"
