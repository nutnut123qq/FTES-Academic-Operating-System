import type { QueryUserSolvedChallengeItemData } from "@/modules/api/graphql/queries/types/user-solved-challenges"

/** One course group: its title (or null for ungrouped) and the rows under it. */
export interface ChallengeCourseGroup {
    /** Course title, or null when the row carries no course (V1-legacy). */
    courseTitle: string | null
    /** Solved-challenge rows belonging to this course, in source order. */
    items: Array<QueryUserSolvedChallengeItemData>
}

/**
 * Group solved challenges by `courseTitle` while preserving source order — the
 * first time a title is seen fixes that group's position. Rows with no course
 * (null `courseTitle`, e.g. V1-legacy) collapse into a single trailing group.
 * Shared by the Challenges tab and the Overview "Kỹ năng qua Challenge" snapshot
 * so both render the same course-grouped submission rows.
 *
 * @param items - solved-challenge rows to group.
 * @returns course groups in first-seen order.
 */
export const groupByCourse = (
    items: Array<QueryUserSolvedChallengeItemData>,
): Array<ChallengeCourseGroup> => {
    const order: Array<string> = []
    const byTitle = new Map<string, ChallengeCourseGroup>()
    for (const item of items) {
        const title = item.courseTitle ?? ""
        if (!byTitle.has(title)) {
            order.push(title)
            byTitle.set(title, { courseTitle: item.courseTitle ?? null, items: [] })
        }
        byTitle.get(title)?.items.push(item)
    }
    return order.map((title) => byTitle.get(title) as ChallengeCourseGroup)
}
