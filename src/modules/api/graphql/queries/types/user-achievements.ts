import type { GraphQLResponse } from "../../types"
import type { QueryMyAchievementItemData } from "./achievements"

/** Variables for the `userAchievements` query. */
export interface QueryUserAchievementsRequest {
    /** Id of the user whose achievements to fetch. */
    userId: string
}

/**
 * Apollo response shape for the `userAchievements` query. Reuses
 * {@link QueryMyAchievementItemData} — the item shape is identical to
 * `myAchievements`; only the subject differs (the profile owner, not the viewer).
 */
export interface QueryUserAchievementsResponse {
    /** Top-level `userAchievements` field wrapping the standard API response. */
    userAchievements: GraphQLResponse<Array<QueryMyAchievementItemData>>
}
