import type { GraphQLResponse } from "../../types"

/** Category of a changelog entry (mirrors backend `ChangelogCategory`). */
export enum ChangelogCategory {
    /** A new feature. */
    Feature = "feature",
    /** A bug fix. */
    Fix = "fix",
    /** A general announcement. */
    Announcement = "announcement",
}

/** One render-ready changelog entry (locale-resolved). */
export interface QueryChangelogEntryData {
    /** Entry id. */
    id: string
    /** Headline (locale-resolved). */
    title: string
    /** Short body (markdown, locale-resolved), or null. */
    body: string | null
    /** Category chip, or null. */
    category: ChangelogCategory | null
    /** When the entry was published (ISO string). */
    publishedAt: string
    /** Optional "read more" destination. */
    linkUrl: string | null
}

/** Apollo response shape for `changelogEntries`. */
export interface QueryChangelogEntriesResponse {
    /** Top-level field wrapping the standard API response (data = the list). */
    changelogEntries: GraphQLResponse<Array<QueryChangelogEntryData>>
}
