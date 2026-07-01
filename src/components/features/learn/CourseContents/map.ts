import type { Locale } from "next-intl"
import {
    pathConfig,
} from "@/resources/path"
import type { Difficulty } from "@/components/blocks/chips/DifficultyChip"
import type { StatusChipTone } from "@/components/blocks/chips/StatusChip"
import type { MyCourseOutlineCurrentTask, MyCourseOutlineModule } from "@/modules/api/graphql/queries/types/my-course-outline"
import { ContentTab } from "@/redux/slices/tabs"

/**
 * Normalize a raw difficulty string (lessons: beginner | intermediate |
 * advanced; challenges: easy | medium | hard | insane) into the `DifficultyChip`
 * enum. Unknown / null values fall back to `beginner`.
 *
 * @param raw - The backend difficulty string, possibly null.
 * @returns The matching {@link Difficulty}.
 */
export const toDifficulty = (raw: string | null): Difficulty => {
    switch (raw) {
    case "intermediate":
    case "medium":
        return "intermediate"
    case "advanced":
    case "hard":
        return "advanced"
    case "insane":
    case "expert":
        return "insane"
    case "beginner":
    case "easy":
    default:
        return "beginner"
    }
}

/**
 * Map a challenge lifecycle status to a {@link StatusChipTone}:
 * completed → success, failed → danger, inProgress → warning, otherwise neutral.
 *
 * @param status - The backend status string.
 * @returns The matching status-chip tone.
 */
export const toStatusTone = (status: string): StatusChipTone => {
    switch (status) {
    case "completed":
        return "success"
    case "failed":
        return "danger"
    case "inProgress":
        return "warning"
    default:
        return "neutral"
    }
}

/** Challenge statuses that count as "attempted" (a score line is worth showing). */
const ATTEMPTED_STATUSES: ReadonlyArray<string> = ["inProgress", "failed", "completed"]

/**
 * Whether a challenge status means the viewer has attempted it.
 *
 * @param status - The backend status string.
 * @returns `true` when the challenge has been attempted.
 */
export const isAttempted = (status: string): boolean => ATTEMPTED_STATUSES.includes(status)

/**
 * Resolve the in-app route the "Tiếp tục" (resume) action should open for the
 * viewer's {@link MyCourseOutlineCurrentTask}. Walks the module/lesson/challenge
 * tree to recover the owning ids so a deep link can be built:
 * - `lesson` → the lesson content route.
 * - `challenge` → the owning lesson's content route, focused on the challenges tab.
 * - `milestoneTask` → the personal-project task route.
 *
 * @param currentTask - The viewer's current-task pointer, or null when done.
 * @param modules - The outline module tree (to recover owning lesson/module ids).
 * @param locale - The active locale, for the localized route.
 * @param displayId - The course display id (slug) the routes are built under.
 * @returns The resume href, or `null` when nothing is resolvable.
 */
export const resolveResumeHref = (
    currentTask: MyCourseOutlineCurrentTask | null,
    modules: Array<MyCourseOutlineModule>,
    locale: Locale,
    displayId: string | undefined,
): string | null => {
    if (!currentTask || !displayId) {
        return null
    }
    const learn = pathConfig().locale(locale).course(displayId).learn()
    if (currentTask.kind === "milestoneTask") {
        return learn.personalProject(currentTask.id).build()
    }
    if (currentTask.kind === "lesson") {
        const owningModule = modules.find((module) =>
            module.lessons.some((lesson) => lesson.id === currentTask.id))
        if (!owningModule) {
            return null
        }
        return learn.module(owningModule.id).content(currentTask.id).build()
    }
    // challenge → its owning lesson, opened on the challenges tab
    for (const module of modules) {
        const owningLesson = module.lessons.find((lesson) =>
            lesson.challenges.some((challenge) => challenge.id === currentTask.id))
        if (owningLesson) {
            const base = learn.module(module.id).content(owningLesson.id).build()
            return `${base}?tab=${ContentTab.Challenges}`
        }
    }
    return null
}
