import {
    ProgrammingLanguage,
} from "../enums/programming-language"

/** Fixed tab order for the four default programming languages in learn/challenge UI. */
export const DEFAULT_PROGRAMMING_LANGUAGES: Array<ProgrammingLanguage> = [
    ProgrammingLanguage.TypeScript,
    ProgrammingLanguage.Java,
    ProgrammingLanguage.Csharp,
    ProgrammingLanguage.Go,
]

/**
 * Normalize a programming-language key for comparisons (`TypeScript` → `typescript`).
 *
 * @param lang - Raw language key from API or UI state.
 * @returns Lowercase trimmed key.
 */
export function normalizeProgrammingLang(lang: string): string {
    return lang.trim().toLowerCase()
}

/**
 * Whether a default tab language is present in the backend payload.
 *
 * @param lang - One of {@link DEFAULT_PROGRAMMING_LANGUAGES}.
 * @param availableLangs - Language keys returned by the API.
 * @returns `true` when the language is available and the tab should be enabled.
 */
export function isProgrammingLangAvailable(
    lang: ProgrammingLanguage,
    availableLangs: Array<string>,
): boolean {
    const normalizedAvailable = new Set(availableLangs.map(normalizeProgrammingLang))
    return normalizedAvailable.has(lang)
}

/**
 * Resolve the active programming language: keep a valid selection, otherwise the first available
 * tab in {@link DEFAULT_PROGRAMMING_LANGUAGES} order, then the first backend language.
 *
 * @param selectedLang - Controlled selection from UI state (may be stale after navigation).
 * @param availableLangs - Language keys returned by the API.
 * @returns Normalized language key for tab `selectedKey`.
 */
export function resolveActiveProgrammingLang(
    selectedLang: string | null | undefined,
    availableLangs: Array<string>,
): string {
    const normalizedAvailable = new Set(availableLangs.map(normalizeProgrammingLang))

    if (selectedLang && normalizedAvailable.has(normalizeProgrammingLang(selectedLang))) {
        return normalizeProgrammingLang(selectedLang)
    }

    for (const lang of DEFAULT_PROGRAMMING_LANGUAGES) {
        if (normalizedAvailable.has(lang)) {
            return lang
        }
    }

    return availableLangs[0] ? normalizeProgrammingLang(availableLangs[0]) : DEFAULT_PROGRAMMING_LANGUAGES[0]
}
