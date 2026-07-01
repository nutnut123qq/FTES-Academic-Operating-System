import type { GraphQLResponse } from "../../types"

/** Variables for the `userCodingHistory` query. */
export interface QueryUserCodingHistoryRequest {
    /** Id of the user whose coding history to fetch. */
    userId: string
}

/** One solved coding problem with the language(s) used. */
export interface QueryUserCodingHistoryItemData {
    /** Coding-problem title. */
    problemTitle: string
    /** Difficulty value (easy/medium/hard). */
    difficulty: string
    /** Topic domain value (arrays/strings/trees/dp/graph…), or null when not tagged. */
    domain: string | null
    /** Language values the problem was solved in. */
    languages: Array<string>
    /** First-solve time (ISO), or null. */
    firstSolvedAt: string | null
}

/** Apollo response shape for the `userCodingHistory` query. */
export interface QueryUserCodingHistoryResponse {
    /** Top-level `userCodingHistory` field wrapping the standard API response. */
    userCodingHistory: GraphQLResponse<Array<QueryUserCodingHistoryItemData>>
}
