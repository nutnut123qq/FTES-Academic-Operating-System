import type {
    StudyPlanContent,
    StudyPlanProgress,
    StudyPlanView,
} from "@/modules/api/rest/ai"

/**
 * The BE task-key for the task at `index` (0-based) of `week` (1-based): `w{week}:{index}`.
 * This is the exact key the PATCH progress endpoint expects (BE `StudyPlanProgressRequest`).
 */
export const buildTaskKey = (week: number, index: number): string => `w${week}:${index}`

/**
 * All valid task keys derived from a plan's weeks, in document order. Mirrors the BE
 * `validTaskKeys` (`plan.weeks[].tasks[]` → `w{week}:{i}`), skipping malformed weeks so
 * the client `percentDone` matches what the server computes.
 */
export const planTaskKeys = (plan: StudyPlanContent | null | undefined): string[] => {
    const keys: string[] = []
    for (const week of plan?.weeks ?? []) {
        if (!week || typeof week.week !== "number" || week.week < 0) continue
        const tasks = week.tasks ?? []
        for (let i = 0; i < tasks.length; i++) keys.push(buildTaskKey(week.week, i))
    }
    return keys
}

/** Whether a given task key is currently checked off in a plan's progress. */
export const isTaskDone = (
    progress: StudyPlanProgress | null | undefined,
    taskKey: string,
): boolean => (progress?.done ?? []).includes(taskKey)

/**
 * Overall completion percentage (0..100), mirroring the BE `computePercentDone`:
 * `|done ∩ valid task keys| / total`, rounded. Only counts done keys that map to a real
 * task (guards against stale/out-of-range progress). No tasks → 0.
 */
export const computePercentDone = (
    plan: StudyPlanContent | null | undefined,
    progress: StudyPlanProgress | null | undefined,
): number => {
    const valid = new Set(planTaskKeys(plan))
    if (valid.size === 0) return 0
    const counted = new Set<string>()
    for (const key of progress?.done ?? []) {
        if (valid.has(key)) counted.add(key)
    }
    return Math.round((100 * counted.size) / valid.size)
}

/**
 * Applies an optimistic check-off toggle to a plan view: updates `progress.done`
 * (add on `done`, remove otherwise — dedupe-safe, insertion order kept) and recomputes
 * `percentDone` client-side so the progress bar can move before the PATCH resolves. Pure
 * — returns a new view, never mutates the input (so the caller can roll back to the old one).
 */
export const applyProgress = (
    view: StudyPlanView,
    taskKey: string,
    done: boolean,
): StudyPlanView => {
    const current = view.progress?.done ?? []
    const nextDone = done
        ? current.includes(taskKey)
            ? current
            : [...current, taskKey]
        : current.filter((key) => key !== taskKey)
    const progress: StudyPlanProgress = { ...(view.progress ?? {}), done: nextDone }
    return { ...view, progress, percentDone: computePercentDone(view.plan, progress) }
}
