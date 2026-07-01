import type { GraphQLResponse } from "../../types"

/** Variables for the `userCodingSkills` query. */
export interface QueryUserCodingSkillsRequest {
    /** Id of the user whose coding skills to fetch. */
    userId: string
}

/** One solved-count bucket keyed by a language or difficulty value. */
export interface QueryUserCodingSkillCount {
    /** Language value (python/typescript/…) or difficulty value (easy/medium/hard). */
    key: string
    /** Distinct problems solved in this bucket. */
    solved: number
}

/** A user's solved-coding breakdown by language and by difficulty. */
export interface QueryUserCodingSkillsData {
    /** Distinct problems solved, grouped by submission language. */
    byLanguage: Array<QueryUserCodingSkillCount>
    /** Distinct problems solved, grouped by problem difficulty. */
    byDifficulty: Array<QueryUserCodingSkillCount>
    /** Distinct problems solved, grouped by topic domain (arrays/dp/graph…). */
    byDomain: Array<QueryUserCodingSkillCount>
}

/** Apollo response shape for the `userCodingSkills` query. */
export interface QueryUserCodingSkillsResponse {
    /** Top-level `userCodingSkills` field wrapping the standard API response. */
    userCodingSkills: GraphQLResponse<QueryUserCodingSkillsData>
}
