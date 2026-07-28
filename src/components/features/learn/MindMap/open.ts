import type { LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"
import type { MindMapNodeData } from "./build"

/** True when the viewer can still open this lesson (matches the content-map gate rule). */
const isOpenable = (lesson: LearnLesson): boolean => lesson.accessLevel !== "NONE"

/** Reader route for a lesson inside a module. */
const lessonHref = (courseId: string, moduleId: string, lessonId: string): string =>
    `/courses/${courseId}/learn/content/modules/${moduleId}/contents/${lessonId}`

/** Per-lesson challenge solver route (keyed on the slug the detail endpoint uses). */
const challengeHref = (courseId: string, moduleId: string, lessonId: string, slug: string): string =>
    `${lessonHref(courseId, moduleId, lessonId)}/challenges/${slug}`

/**
 * What clicking a mind-map node does. Either navigate somewhere (`route`) or open
 * the package gate for a gated lesson (`gate`) — the SAME choice the content-map
 * rail makes on the same data, so a fully-locked node offers a purchase instead of
 * dumping the viewer into a locked lesson. `null` = nothing actionable (e.g. an
 * empty module, or the root, which the canvas handles by re-framing the view).
 */
export type MindMapOpenAction =
    | { type: "route"; href: string }
    | { type: "gate"; lesson: LearnLesson }
    | null

/**
 * Resolves the click action for a node from its data + the module tree.
 *
 *  - root      → null (the canvas re-frames the whole map on a root click).
 *  - module    → open its first openable lesson; else gate the first lesson.
 *  - lesson    → open its reader when openable; else gate it.
 *  - exercise  → route to its solver (challenge → solver route, assignment → the
 *                lesson reader where the submission block renders); a gated exercise
 *                gates its parent lesson.
 */
export const resolveNodeOpen = (
    data: MindMapNodeData,
    modules: Array<LearnModule>,
    courseId: string,
): MindMapOpenAction => {
    if (data.kind === "root") {
        return null
    }
    const module = modules.find((candidate) => candidate.id === data.moduleId)
    if (!module) {
        return null
    }

    if (data.kind === "module") {
        const first = module.lessons.find(isOpenable)
        if (first) {
            return { type: "route", href: lessonHref(courseId, module.id, first.id) }
        }
        return module.lessons.length > 0 ? { type: "gate", lesson: module.lessons[0] } : null
    }

    const lesson = module.lessons.find((candidate) => candidate.id === data.lessonId)
    if (!lesson) {
        return null
    }

    if (data.kind === "lesson") {
        return isOpenable(lesson)
            ? { type: "route", href: lessonHref(courseId, module.id, lesson.id) }
            : { type: "gate", lesson }
    }

    // exercise
    if (data.isLocked || !isOpenable(lesson)) {
        return { type: "gate", lesson }
    }
    if (data.exerciseKind === "challenge") {
        return {
            type: "route",
            href: challengeHref(courseId, module.id, lesson.id, data.slug ?? ""),
        }
    }
    return { type: "route", href: lessonHref(courseId, module.id, lesson.id) }
}
