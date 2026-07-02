import type { Locale } from "next-intl"
import type { Icon } from "@phosphor-icons/react"
import type { AutocompleteGlobalSearchItem } from "@/modules/api/graphql/queries/types/autocomplete-global-search"

/**
 * Canonical order + identity of every searchable entity group returned by the real
 * `autocompleteGlobalSearch` contract. The union value is also the `data` field key.
 */
export type SearchEntityKind =
    | "courses"
    | "modules"
    | "contents"
    | "lessonVideos"
    | "challenges"
    | "milestones"
    | "milestoneTasks"
    | "flashcardDecks"

/**
 * Community-domain groups the backend does NOT index yet (assumption A1). Served by
 * a clearly-marked FE mock provider shaped like a future BE response; swap = replace
 * the mock hook internals only.
 */
export type SearchMockKind = "users" | "posts" | "groups" | "resources"

/** Any category rendered on the `/search` page (real entity groups + mock community groups). */
export type SearchCategoryKind = SearchEntityKind | SearchMockKind

/**
 * One presentational row — the shared shape both the real autocomplete contract and
 * the mock providers map into, consumed identically by the overlay and `/search`.
 */
export interface SearchRow {
    /** Stable id for React keys + aria option ids. */
    id: string
    /** Which category this row belongs to (drives icon + localized heading). */
    kind: SearchCategoryKind
    /** Primary title line. */
    title: string
    /** Optional supporting snippet (matched text). */
    snippet?: string
    /** Optional breadcrumb line (course › module › content) for learning entities. */
    breadcrumb?: string
    /** Deep-link route (locale-prefixed). `null` → row renders non-interactive. */
    href: string | null
}

/** Static descriptor for a searchable entity group — icon + i18n heading key. */
export interface SearchEntityDescriptor {
    /** The group key. */
    kind: SearchCategoryKind
    /** Phosphor icon shown on rows + tabs. */
    icon: Icon
    /** i18n key (under the `search` namespace) for the localized group heading. */
    labelKey: string
}

/** Locale-prefixed href builder input for {@link SearchEntityKind} rows. */
export interface BuildSearchHrefParams {
    /** The entity kind. */
    kind: SearchEntityKind
    /** The raw autocomplete item. */
    item: AutocompleteGlobalSearchItem
    /** Active locale for the URL prefix. */
    locale: Locale
}
