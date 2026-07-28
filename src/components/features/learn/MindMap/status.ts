import type { LearnExercise, LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"

/**
 * The typed 3-state completion status carried by every CONTENT node (module /
 * lesson / exercise) on the mind map. This is the field the LATER backend phase
 * will feed directly (see {@link exerciseStatus}); for now it is derived from the
 * per-viewer completion signals already on the learn tree.
 *
 * Colour mapping (design tokens, dark-mode safe — {@link STATUS_CARD_CLASS}):
 *  - `completed`  → GREEN   (`--success`)  — fully done.
 *  - `inProgress` → ORANGE  (`--warning`)  — started but not finished / needs attention.
 *  - `notStarted` → light warm neutral (`--default`) — untouched.
 *
 * The premium paywall is orthogonal and tracked separately as `isLocked` (mirrors
 * the content-map gate), so a locked node still carries one of the three states.
 */
export type MindMapNodeStatus = "completed" | "inProgress" | "notStarted"

/** Card tint per completion status (token-based, dark-mode safe). */
export const STATUS_CARD_CLASS: Record<MindMapNodeStatus, string> = {
    // GREEN — completed
    completed: "bg-success/10 border-success/60",
    // ORANGE (amber) — in progress / warning
    inProgress: "bg-warning/15 border-warning/60",
    // light white-brown neutral — not started
    notStarted: "bg-default border-separator",
}

/** Legend swatch className per completion status. */
export const STATUS_SWATCH: Record<MindMapNodeStatus, string> = {
    completed: "bg-success",
    inProgress: "bg-warning",
    notStarted: "bg-default border border-separator",
}

/**
 * A module counts as locked only when EVERY lesson is locked for THIS viewer
 * (per-viewer `LessonView.locked`, NOT the static `isPremium` flag — a learner who
 * already owns a premium module must not see it greyed out). Mirrors the content-map
 * gate rule (see rule `learn-gate-uses-real-signals`).
 */
export const isModuleLocked = (module: LearnModule): boolean =>
    module.lessons.length > 0 && module.lessons.every((lesson) => lesson.isLocked)

/**
 * Coarse module status from its lessons: every lesson completed → `completed`;
 * any lesson completed → `inProgress`; otherwise `notStarted`. This is where the
 * ORANGE (in-progress) state naturally surfaces on the map — lessons are binary
 * read/unread, so a partially-read module is the honest "in progress" signal.
 */
export const moduleStatus = (module: LearnModule): MindMapNodeStatus => {
    const total = module.lessons.length
    const done = module.lessons.filter((lesson) => lesson.isCompleted).length
    if (total > 0 && done === total) {
        return "completed"
    }
    return done > 0 ? "inProgress" : "notStarted"
}

/**
 * Lesson status from the per-viewer completion flag. FTES lesson progress is binary
 * (`isCompleted` from `GET /courses/{id}/me/progress`), so a lesson resolves to
 * `completed` or `notStarted` — never `inProgress`. That richer signal (a lesson
 * touched-but-not-finished) is part of the LATER backend phase.
 */
export const lessonStatus = (lesson: LearnLesson): MindMapNodeStatus =>
    lesson.isCompleted ? "completed" : "notStarted"

/**
 * Exercise status.
 *
 * TODO(mindmap-backend-phase): the public course detail carries NO per-viewer
 * exercise result — `LearnExercise.status` is the challenge LIFECYCLE state
 * (`PUBLISHED`/`RUNNING`/`CLOSED`), not the learner's outcome. So for now every
 * exercise node is `notStarted` (the neutral state). The LATER phase must feed the
 * real per-node status here: `completed` (GREEN) when the exercise is passed, and
 * `inProgress` (ORANGE) when it was attempted with a weak/failing result or the AI
 * progress log flags it for review. The signature already accepts the parent lesson
 * so that phase can also inherit context without a shape change.
 */
export const exerciseStatus = (
    _exercise: LearnExercise,
    _parentLesson: LearnLesson,
): MindMapNodeStatus => "notStarted"

/**
 * Whether a nested exercise is gated for this viewer. It rides on the parent
 * lesson's per-viewer lock: a locked lesson gates its exercises behind the same
 * paywall (mirrors the content-map, which never routes into a gated solver).
 */
export const isExerciseLocked = (parentLesson: LearnLesson): boolean => parentLesson.isLocked
