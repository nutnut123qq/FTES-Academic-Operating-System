import type { GraphQLResponse } from "../../types"

/** A single daily-quest task (mirrors BE `DailyQuestKey`). */
export type DailyQuestKey =
    | "readContent"
    | "passChallenge"
    | "reviewFlashcards"

/** One daily-quest task: today's progress vs the static target. */
export interface QueryDailyQuestTaskData {
    /** Which daily task this row is. */
    key: DailyQuestKey
    /** How many of the action the user has done today. */
    current: number
    /** How many are required today to complete the task. */
    target: number
}

/** The viewer's daily quest for today (per-task progress + claim state). */
export interface QueryMyDailyQuestData {
    /** Today's Asia/Ho_Chi_Minh calendar day (YYYY-MM-DD). */
    date: string
    /** Each daily task with its current progress and target. */
    tasks: Array<QueryDailyQuestTaskData>
    /** True when every task's current >= target. */
    allDone: boolean
    /** True when the reward was already claimed today. */
    claimed: boolean
    /** Points granted when the completed quest is claimed. */
    reward: number
}

/** Apollo response shape for the `myDailyQuest` query. */
export interface QueryMyDailyQuestResponse {
    /** Top-level `myDailyQuest` field wrapping the standard API response. */
    myDailyQuest: GraphQLResponse<QueryMyDailyQuestData>
}
