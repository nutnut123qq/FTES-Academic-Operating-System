/**
 * Programming-language display metadata — GitHub-linguist brand colours + proper
 * display names — shared by the language chip and the language donut so the dev's
 * language mix reads the same everywhere (GitHub-style colour dot + name).
 *
 * Language brand colours are an intentional exception to the "tokens only, no hex"
 * rule: they are external brand identity (like the GitHub/LinkedIn logo colours),
 * not part of the app's semantic palette.
 */

/** GitHub-linguist brand colour per language key (lowercase enum value). */
const LANGUAGE_COLORS: Record<string, string> = {
    typescript: "#3178c6",
    javascript: "#f1e05a",
    python: "#3572a5",
    java: "#b07219",
    go: "#00add8",
    csharp: "#178600",
    cpp: "#f34b7d",
    c: "#555555",
    rust: "#dea584",
    kotlin: "#a97bff",
    php: "#4f5d95",
    ruby: "#701516",
    swift: "#f05138",
    dart: "#00b4ab",
}

/** Display-name overrides where a plain capitalize is wrong (C#, C++, …). */
const LANGUAGE_LABELS: Record<string, string> = {
    csharp: "C#",
    cpp: "C++",
    c: "C",
    php: "PHP",
}

/** Neutral fallback colour for languages without a brand colour. */
const FALLBACK_COLOR = "#8c95a1"

/**
 * Brand colour for a language key, or a neutral fallback when unknown.
 * @param key - the language enum value (e.g. `typescript`, `csharp`).
 * @returns a hex colour string.
 */
export const getLanguageColor = (key: string): string =>
    LANGUAGE_COLORS[key.toLowerCase()] ?? FALLBACK_COLOR

/**
 * Display name for a language key (proper casing: `csharp`→`C#`, `cpp`→`C++`,
 * otherwise title-cased).
 * @param key - the language enum value.
 * @returns the human-facing language name.
 */
export const getLanguageLabel = (key: string): string => {
    const lower = key.toLowerCase()
    return LANGUAGE_LABELS[lower] ?? lower.charAt(0).toUpperCase() + lower.slice(1)
}
