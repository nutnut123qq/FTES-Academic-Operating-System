import type { GraphQLResponse } from "../../types"

/** One trending lesson (read count over the last 7 days). */
export interface QueryTrendingContentItemData {
    /** Opaque global id of the content — pass to resolveRoute on click. */
    globalId: string
    /** Lesson title (the token label). */
    title: string
    /** Times the lesson was read in the last 7 days. */
    readCount: number
}

/** Apollo response shape for the `trendingContents` query. */
export interface QueryTrendingContentsResponse {
    /** Top-level `trendingContents` field wrapping the standard API response. */
    trendingContents: GraphQLResponse<Array<QueryTrendingContentItemData>>
}
