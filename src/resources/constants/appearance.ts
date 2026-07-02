/** Identifier of an accent preset — mirrors the `[data-accent="…"]` blocks in `globals.css`. */
export type AccentId = "indigo" | "pink" | "teal" | "emerald" | "amber" | "violet"

/** Direction of the ambient background effect: embers rising vs meteors falling. */
export type EffectDirection = "rise" | "fall"

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

/** localStorage key of the persisted appearance store (zustand `persist`). */
export const APPEARANCE_STORAGE_KEY = "ftesaos-appearance"
