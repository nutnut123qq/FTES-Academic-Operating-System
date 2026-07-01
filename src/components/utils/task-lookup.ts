import type { MilestoneTaskProgressItem } from "@/modules/api/graphql/queries/types/milestone-task-progress"

/** Task id → completion row for personal-project milestone progress. */
export type MilestoneTaskProgressLookup = Map<string, { completed: boolean }>

/**
 * Builds a lookup of task id → completion for pairing with `isPersonalProjectTaskActionUnlocked`.
 */
export const buildMilestoneTaskProgressLookup = (
    completionTasks: Array<MilestoneTaskProgressItem> | undefined,
): MilestoneTaskProgressLookup => {
    const map = new Map<string, { completed: boolean }>()
    if (!completionTasks) {
        return map
    }
    for (const item of completionTasks) {
        map.set(item.id, { completed: item.completed })
    }
    return map
}

/**
 * Current task or any completed task may run actions (review, sync, sidebar “open”, etc.).
 */
export const isPersonalProjectTaskActionUnlocked = (
    taskId: string,
    lookup: MilestoneTaskProgressLookup,
    currentTaskId: string | undefined,
): boolean => {
    const row = lookup.get(taskId)
    if (!row) {
        return taskId === currentTaskId
    }
    return row.completed || taskId === currentTaskId
}
