import type { Locale } from "next-intl"
import { pathConfig } from "@/resources/path"
import type { MyCourseOutlineCurrentTask, MyCourseOutlineModule, MyCourseOutlinePayload } from "@/modules/api/graphql/queries/types/my-course-outline"

/** Coarse completion state of a module, used to tint its mind-map node. */
export type MindMapModuleStatus = "done" | "inProgress" | "notStarted"

/** Per-module progress overlaid onto the mind-map from the course outline. */
export interface MindMapModuleProgress {
    /** Coarse completion state (drives the node tint + icon). */
    status: MindMapModuleStatus
    /** Lessons the viewer has read in this module. */
    lessonsRead: number
    /** Total lessons in this module. */
    lessonsTotal: number
    /** Whether the whole module sits behind the premium paywall. */
    isLocked: boolean
}

/**
 * The course outline collapsed into the lookups the mind-map graph needs:
 * per-module completion, per-lesson read flags, the "you are here" module, and
 * the overall completion percent. Absent (all empty) for guests / the public
 * standalone route, where the map degrades to a structure-only view.
 */
export interface MindMapProgress {
    /** Module id → its progress overlay. */
    byModuleId: Map<string, MindMapModuleProgress>
    /** Ids of lessons the viewer has read (for the expanded lesson cards). */
    readLessonIds: Set<string>
    /** Module that owns the viewer's next content task ("you are here"), if any. */
    currentModuleId: string | undefined
    /** Overall course completion percent (0-100), or undefined when no outline. */
    completionPercent: number | undefined
}

/** Empty overlay — guests / standalone (no outline) fall back to this. */
export const EMPTY_MIND_MAP_PROGRESS: MindMapProgress = {
    byModuleId: new Map(),
    readLessonIds: new Set(),
    currentModuleId: undefined,
    completionPercent: undefined,
}

/**
 * Find the module that owns a content task pointer (`lesson` → its module;
 * `challenge` → the module of its owning lesson). Milestone tasks have no module
 * on the map, so they resolve to `undefined`.
 *
 * @param pointer - The next-content-task pointer, or null.
 * @param modules - The outline module tree.
 * @returns The owning module id, or undefined.
 */
const resolveCurrentModuleId = (
    pointer: MyCourseOutlineCurrentTask | null,
    modules: Array<MyCourseOutlineModule>,
): string | undefined => {
    if (!pointer || pointer.kind === "milestoneTask") {
        return undefined
    }
    for (const module of modules) {
        if (pointer.kind === "lesson") {
            if (module.lessons.some((lesson) => lesson.id === pointer.id)) {
                return module.id
            }
            continue
        }
        const owns = module.lessons.some((lesson) =>
            lesson.challenges.some((challenge) => challenge.id === pointer.id))
        if (owns) {
            return module.id
        }
    }
    return undefined
}

/**
 * Collapse the viewer's {@link MyCourseOutlinePayload} into the {@link MindMapProgress}
 * overlay the graph builder consumes. A module is `done` only when every lesson is
 * read AND every challenge completed; `inProgress` when it has any read lesson or
 * attempted challenge; otherwise `notStarted`. Returns the empty overlay when no
 * outline is available (guest / standalone).
 *
 * @param outline - The course outline payload, or undefined while loading / unauthenticated.
 * @returns The mind-map progress overlay.
 */
export const computeMindMapProgress = (
    outline: MyCourseOutlinePayload | undefined,
): MindMapProgress => {
    if (!outline) {
        return EMPTY_MIND_MAP_PROGRESS
    }
    const byModuleId = new Map<string, MindMapModuleProgress>()
    const readLessonIds = new Set<string>()

    for (const module of outline.modules) {
        const lessonsTotal = module.lessons.length
        let lessonsRead = 0
        let challengesTotal = 0
        let challengesCompleted = 0
        for (const lesson of module.lessons) {
            if (lesson.isRead) {
                lessonsRead += 1
                readLessonIds.add(lesson.id)
            }
            for (const challenge of lesson.challenges) {
                challengesTotal += 1
                if (challenge.completed) {
                    challengesCompleted += 1
                }
            }
        }
        const allRead = lessonsTotal > 0 && lessonsRead === lessonsTotal
        const allChallengesDone = challengesCompleted === challengesTotal
        const hasProgress = lessonsRead > 0 || challengesCompleted > 0
        const status: MindMapModuleStatus = allRead && allChallengesDone
            ? "done"
            : hasProgress
                ? "inProgress"
                : "notStarted"
        byModuleId.set(module.id, {
            status,
            lessonsRead,
            lessonsTotal,
            isLocked: module.isPremium,
        })
    }

    return {
        byModuleId,
        readLessonIds,
        currentModuleId: resolveCurrentModuleId(outline.nextContentTask, outline.modules),
        completionPercent: outline.progress.completionPercent,
    }
}

/**
 * Resolve the in-app href the mind-map "Continue" action opens for the viewer's
 * content-first resume pointer. The mind-map is a CONTENT surface, so the pointer
 * is `nextContentTask` (a `lesson` or `challenge`, never the capstone): a lesson
 * opens its reader; a challenge opens its owning lesson on the challenges tab.
 *
 * @param pointer - The `nextContentTask` pointer, or null when all content is done.
 * @param modules - The outline module tree (to recover owning ids).
 * @param locale - The active locale.
 * @param displayId - The course display id (slug) routes are built under.
 * @returns The resume href, or null when nothing is resolvable.
 */
export const resolveContentHref = (
    pointer: MyCourseOutlineCurrentTask | null,
    modules: Array<MyCourseOutlineModule>,
    locale: Locale,
    displayId: string | undefined,
): string | null => {
    if (!pointer || pointer.kind === "milestoneTask" || !displayId) {
        return null
    }
    const learn = pathConfig().locale(locale).course(displayId).learn()
    if (pointer.kind === "lesson") {
        const owningModule = modules.find((module) =>
            module.lessons.some((lesson) => lesson.id === pointer.id))
        return owningModule
            ? learn.module(owningModule.id).content(pointer.id).build()
            : null
    }
    for (const module of modules) {
        const owningLesson = module.lessons.find((lesson) =>
            lesson.challenges.some((challenge) => challenge.id === pointer.id))
        if (owningLesson) {
            return learn.module(module.id).content(owningLesson.id).build()
        }
    }
    return null
}
