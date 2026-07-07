import type { Icon } from "@phosphor-icons/react"

/**
 * Canonical order + identity of the learning-entity search categories. Kept as a full
 * union so category icons/labels stay exhaustive; the live `/search` maps the BE `search`
 * buckets (COURSE→courses, CHALLENGE→challenges) onto this set.
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

/** Community-domain categories, mapped from the BE `search` buckets (USER/POST/GROUP/RESOURCE). */
export type SearchMockKind = "users" | "posts" | "groups" | "resources"

/** Any category rendered on the `/search` page (learning-entity groups + community groups). */
export type SearchCategoryKind = SearchEntityKind | SearchMockKind

/**
 * One presentational row — the shared shape the BE `search` buckets map into, consumed
 * identically by the overlay and `/search`.
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
