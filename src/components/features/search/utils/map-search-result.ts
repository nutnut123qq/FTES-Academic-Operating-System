import type { Locale } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { SearchDocTypeName, SearchGroupView, SearchHitView } from "@/modules/api/rest/search"
import type { SearchCategoryKind, SearchRow } from "../types"

/**
 * BE `DocType` name → FE category kind. Only the buckets with an existing FE surface are
 * mapped; SUBJECT/TOPIC/EVENT/BLOG_POST are dropped (no category), matching the requested
 * types in {@link REQUESTED_SEARCH_TYPES}.
 */
const TYPE_TO_KIND: Partial<Record<SearchDocTypeName, SearchCategoryKind>> = {
    COURSE: "courses",
    CHALLENGE: "challenges",
    USER: "users",
    POST: "posts",
    GROUP: "groups",
    RESOURCE: "resources",
}

/** Canonical display order of the mapped result groups. */
export const SEARCH_RESULT_KINDS: ReadonlyArray<SearchCategoryKind> = [
    "courses",
    "challenges",
    "users",
    "posts",
    "groups",
    "resources",
]

/**
 * The `types` filter sent to `GET /api/v1/search` — only the buckets that map to an FE
 * category. Lower-cased request form (the BE upper-cases before parsing); excludes
 * SUBJECT/TOPIC/EVENT (no FE surface) and BLOG_POST (surfaced elsewhere). Restricting the
 * request avoids fetching + serializing buckets the palette never renders.
 */
export const REQUESTED_SEARCH_TYPES = [
    "course",
    "challenge",
    "user",
    "post",
    "group",
    "resource",
] as const

/**
 * Best-effort deep link for a hit from its `slug`. Uses the real detail route where a slug
 * resolves it (course, user); otherwise the section landing. `null` when a hit can't be routed
 * (e.g. a user hit with no slug) so the row renders non-interactive rather than a broken link.
 */
const hrefForHit = (
    kind: SearchCategoryKind,
    slug: string | null | undefined,
    locale: Locale,
): string | null => {
    const path = pathConfig().locale(locale)
    switch (kind) {
        case "courses":
            return slug ? path.course(slug).build() : path.course().build()
        case "users":
            return slug ? path.profile(slug).build() : null
        case "posts":
            return path.community().build()
        case "groups":
            return path.groups().build()
        case "resources":
            return path.resources().build()
        case "challenges":
            return path.challenges().build()
        default:
            return null
    }
}

/** BE snippet/highlight wraps matches in `<mark>` (ts_headline); strip to plain text — the row
 *  re-highlights the query client-side via SearchHighlight, so raw tags must not reach the DOM. */
const stripMarks = (value: string): string => value.replace(/<\/?mark>/gi, "")

/** Map one BE hit into the shared presentational {@link SearchRow}. */
const toRow = (kind: SearchCategoryKind, hit: SearchHitView, locale: Locale): SearchRow => ({
    id: `${kind}-${hit.docId}`,
    kind,
    title: hit.title ?? hit.slug ?? hit.docId,
    snippet: hit.snippet ? stripMarks(hit.snippet) : undefined,
    href: hrefForHit(kind, hit.slug, locale),
})

/**
 * Map the BE `SearchResult.groups` into per-kind {@link SearchRow} lists (canonical order).
 * BE buckets with no FE category (or the undeclared BLOG_POST, never requested) are ignored;
 * empty buckets yield empty arrays.
 * @param groups - the BE search groups (may be undefined before first load).
 * @param locale - active locale for href building.
 * @returns a record of FE kind → rows (only the mapped kinds are populated).
 */
export const mapSearchGroups = (
    groups: Array<SearchGroupView> | undefined,
    locale: Locale,
): Record<SearchCategoryKind, Array<SearchRow>> => {
    const byKind = {} as Record<SearchCategoryKind, Array<SearchRow>>
    for (const kind of SEARCH_RESULT_KINDS) byKind[kind] = []
    for (const group of groups ?? []) {
        const kind = TYPE_TO_KIND[group.type]
        if (!kind) continue
        byKind[kind] = group.hits.map((hit) => toRow(kind, hit, locale))
    }
    return byKind
}
