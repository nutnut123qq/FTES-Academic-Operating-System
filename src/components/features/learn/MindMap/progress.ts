import type { LearnModule } from "../hooks/useQueryLearnCourseSwr"
import { moduleStatus } from "./status"

/**
 * The kind of next-step the progress assistant recommends. Drives the panel's
 * accent copy + icon.
 *
 *  - `continue`     — resume the lesson the viewer is parked on ("you are here").
 *  - `finishModule` — finish a module already in progress (nearest-to-done first,
 *                     so the learner banks a completion instead of scattering).
 *  - `startModule`  — open the next untouched module.
 *  - `unlock`       — every remaining step is premium-locked for this viewer.
 *  - `done`         — the course is fully complete.
 */
export type RecommendationKind = "continue" | "finishModule" | "startModule" | "unlock" | "done"

/**
 * The single "do this next" the assistant surfaces. `lessonId`/`moduleId` are RAW
 * ids (not the `l:`/`m:` node ids) so the panel can route straight into the reader
 * or drive the on-canvas "gợi ý" highlight (matched on `lesson.id`).
 */
export interface ProgressRecommendation {
    kind: RecommendationKind
    moduleId: string | null
    lessonId: string | null
    /** Display title of the recommended lesson (module title when `done`/`unlock`). */
    title: string
    /** Owning module title, for context under the lesson title. */
    moduleTitle: string
    /** i18n key under `learn.mindMap.progress.reason.*`. */
    reasonKey: string
    /** Interpolation values for the reason string. */
    reasonValues: Record<string, string | number>
    /** True when the recommended lesson is premium-locked (opening triggers the gate). */
    isLocked: boolean
}

/** A module reference with its completion ratio — powers the strengths / review chips. */
export interface ModuleRef {
    moduleId: string
    title: string
    /** Lessons completed in this module. */
    done: number
    /** Total lessons in this module. */
    total: number
    /** `done / total` (0 for an empty module). */
    ratio: number
}

/**
 * The full progress read-out the {@link MindMapProgressPanel} renders — an overall
 * roll-up, the one recommended next step, and the strength / needs-work module lists.
 */
export interface ProgressInsight {
    /** Overall course completion percent 0-100 (from the BE header, authoritative). */
    overallPercent: number
    lessons: { completed: number; total: number; remaining: number }
    modules: { completed: number; inProgress: number; notStarted: number; total: number }
    recommendation: ProgressRecommendation
    /** Completed modules — the learner's strengths (course order). */
    strengths: Array<ModuleRef>
    /** In-progress modules to finish, nearest-to-done first (highest ratio wins). */
    review: Array<ModuleRef>
}

/** Inputs the progress read-out is derived from — the same tree the map is built from. */
export interface AnalyzeProgressInput {
    modules: Array<LearnModule>
    /** The viewer's resume pointer ("you are here"), if any. */
    currentLessonId: string | null
    /** Overall completion percent from the BE header (0-100). */
    completionPercent: number
}

const moduleRef = (module: LearnModule): ModuleRef => {
    const total = module.lessons.length
    const done = module.lessons.filter((lesson) => lesson.isCompleted).length
    return { moduleId: module.id, title: module.title, done, total, ratio: total === 0 ? 0 : done / total }
}

/** First lesson in a module that the viewer has NOT completed (course order), or null. */
const firstUnfinishedLesson = (module: LearnModule) =>
    module.lessons.find((lesson) => !lesson.isCompleted) ?? null

/**
 * Computes the mind-map progress read-out from the per-viewer learn tree. Pure and
 * deterministic — the recommendation is a transparent priority rule, unit-tested in
 * `progress.test.ts`:
 *
 *   1. RESUME the "you are here" lesson when it is still unfinished.
 *   2. else FINISH the most-complete in-progress module (bank the near-done win).
 *   3. else START the next untouched module.
 *   4. else, if steps remain but all are premium-locked, prompt to UNLOCK.
 *   5. else the course is DONE.
 *
 * This lives entirely on signals already on the tree; it is the seam a later
 * ai-platform job (natural-language coaching over the same snapshot — see
 * {@link https} ai-platform `useAiToolJob`) can enrich without changing this shape.
 */
export const analyzeProgress = ({
    modules,
    currentLessonId,
    completionPercent,
}: AnalyzeProgressInput): ProgressInsight => {
    const refs = modules.map(moduleRef)
    const nonEmpty = refs.filter((ref) => ref.total > 0)

    const lessonsTotal = refs.reduce((sum, ref) => sum + ref.total, 0)
    const lessonsCompleted = refs.reduce((sum, ref) => sum + ref.done, 0)

    const moduleCounts = modules.reduce(
        (acc, module) => {
            const status = moduleStatus(module)
            acc[status] += 1
            return acc
        },
        { completed: 0, inProgress: 0, notStarted: 0 } as Record<
            "completed" | "inProgress" | "notStarted",
            number
        >,
    )

    const strengths = refs.filter((ref) => ref.total > 0 && ref.done === ref.total)
    const review = nonEmpty
        .filter((ref) => ref.done > 0 && ref.done < ref.total)
        .sort((a, b) => b.ratio - a.ratio)

    const recommendation = recommendNext({ modules, currentLessonId, review })

    return {
        overallPercent: Math.round(completionPercent),
        lessons: { completed: lessonsCompleted, total: lessonsTotal, remaining: lessonsTotal - lessonsCompleted },
        modules: { ...moduleCounts, total: modules.length },
        recommendation,
        strengths,
        review,
    }
}

const doneRecommendation = (): ProgressRecommendation => ({
    kind: "done",
    moduleId: null,
    lessonId: null,
    title: "",
    moduleTitle: "",
    reasonKey: "done",
    reasonValues: {},
    isLocked: false,
})

/** The priority rule (steps 1-5 in {@link analyzeProgress}). */
const recommendNext = ({
    modules,
    currentLessonId,
    review,
}: {
    modules: Array<LearnModule>
    currentLessonId: string | null
    review: Array<ModuleRef>
}): ProgressRecommendation => {
    const withLessons = modules.filter((module) => module.lessons.length > 0)
    if (withLessons.length === 0) {
        return doneRecommendation()
    }
    const allDone = withLessons.every((module) => module.lessons.every((lesson) => lesson.isCompleted))
    if (allDone) {
        return doneRecommendation()
    }

    const build = (
        kind: RecommendationKind,
        module: LearnModule,
        lesson: LearnModule["lessons"][number],
        reasonValues: Record<string, string | number>,
    ): ProgressRecommendation => ({
        kind: lesson.isLocked ? "unlock" : kind,
        moduleId: module.id,
        lessonId: lesson.id,
        title: lesson.title,
        moduleTitle: module.title,
        reasonKey: lesson.isLocked ? "unlock" : kind,
        reasonValues,
        isLocked: lesson.isLocked,
    })

    // 1. RESUME — the "you are here" lesson, when it is still unfinished.
    if (currentLessonId) {
        for (const module of withLessons) {
            const lesson = module.lessons.find((candidate) => candidate.id === currentLessonId)
            if (lesson && !lesson.isCompleted) {
                const remaining = module.lessons.filter((candidate) => !candidate.isCompleted).length
                return build("continue", module, lesson, { module: module.title, remaining })
            }
        }
    }

    // 2. FINISH — the most-complete in-progress module (review is already ratio-desc).
    for (const ref of review) {
        const module = withLessons.find((candidate) => candidate.id === ref.moduleId)
        const lesson = module ? firstUnfinishedLesson(module) : null
        if (module && lesson) {
            return build("finishModule", module, lesson, { module: module.title, remaining: ref.total - ref.done })
        }
    }

    // 3. START — the next untouched module.
    for (const module of withLessons) {
        const done = module.lessons.filter((lesson) => lesson.isCompleted).length
        if (done === 0) {
            const lesson = module.lessons[0]
            return build("startModule", module, lesson, { module: module.title })
        }
    }

    // 4. Fallback — some lesson is unfinished but none matched above (e.g. a fully
    //    locked tail): recommend the first unfinished lesson anywhere.
    for (const module of withLessons) {
        const lesson = firstUnfinishedLesson(module)
        if (lesson) {
            return build("startModule", module, lesson, { module: module.title })
        }
    }

    // 5. Nothing unfinished remained — course complete.
    return doneRecommendation()
}
