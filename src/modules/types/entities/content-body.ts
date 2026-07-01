import type { AbstractEntity } from "./abstract"

/**
 * SCHEMA V2 per-programming-language lesson body for a content. One row per language; `body` holds
 * the default locale and per-locale variants live in `translations`. Mirrors the backend
 * `ContentBodyEntity` (mount `bodies/<N>-<lang>/`).
 */

/** Per-locale lesson body for a content body bucket. */
export interface ContentBodyTranslation {
    /** Locale of this body (e.g. "vi", "en"). */
    locale: string
    /** Localized lesson body (Markdown). */
    body: string | null
}

/** A per-programming-language lesson body bucket. */
export interface ContentBody extends AbstractEntity {
    /** Programming language for this body (typescript / java / csharp / go). */
    lang: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default-locale lesson body (Markdown). */
    body: string | null
    /** Default locale for this body row. */
    defaultLocale: string
    /** Per-locale lesson body variants. */
    translations?: Array<ContentBodyTranslation>
}

/**
 * Resolve a body bucket's markdown for the requested locale, falling back to the bucket's
 * default-locale `body` when no matching translation exists.
 */
export function resolveContentBody(
    bucket: ContentBody | undefined,
    locale: string,
): string {
    if (!bucket) return ""
    const translation = bucket.translations?.find((row) => row.locale === locale)
    return (translation?.body ?? bucket.body) ?? ""
}

/** Pick the body bucket matching a programming language. */
export function pickContentBodyByLang(
    bodies: Array<ContentBody> | undefined,
    lang: string,
): ContentBody | undefined {
    return bodies?.find((bucket) => bucket.lang === lang)
}

/** Distinct programming languages across the body buckets, ordered by `orderIndex`. */
export function listContentBodyLangs(
    bodies: Array<ContentBody> | undefined,
): Array<string> {
    const seen = new Map<string, number>()
    for (const bucket of bodies ?? []) {
        if (!seen.has(bucket.lang)) seen.set(bucket.lang, bucket.sortIndex)
    }
    return [...seen.entries()].sort((prev, next) => prev[1] - next[1]).map(([lang]) => lang)
}
