import { describe, expect, it } from "vitest"
import type { LearnLesson, LearnModule } from "../hooks/useQueryLearnCourseSwr"
import { analyzeProgress } from "./progress"

const lesson = (id: string, opts: Partial<Pick<LearnLesson, "isCompleted" | "isLocked" | "title">> = {}): LearnLesson => ({
    id,
    title: opts.title ?? `Lesson ${id}`,
    description: "",
    readTimeLabel: "",
    contentType: "VIDEO",
    isCompleted: opts.isCompleted ?? false,
    isLocked: opts.isLocked ?? false,
    accessLevel: "FULL",
    packageSlugs: [],
    exercises: [],
})

const mod = (id: string, order: number, lessons: Array<LearnLesson>, title = `Module ${id}`): LearnModule => ({
    id,
    order,
    title,
    description: "",
    lessons,
})

describe("analyzeProgress", () => {
    it("resumes the 'you are here' lesson when it is unfinished", () => {
        const modules = [
            mod("m1", 1, [lesson("a", { isCompleted: true }), lesson("b")]),
            mod("m2", 2, [lesson("c")]),
        ]
        const insight = analyzeProgress({ modules, currentLessonId: "b", completionPercent: 33 })
        expect(insight.recommendation.kind).toBe("continue")
        expect(insight.recommendation.lessonId).toBe("b")
        expect(insight.recommendation.moduleId).toBe("m1")
    })

    it("finishes the most-complete in-progress module before starting a new one", () => {
        const modules = [
            // m1: 1/3 done (ratio .33), m2: 2/3 done (ratio .66) → m2 wins
            mod("m1", 1, [lesson("a1", { isCompleted: true }), lesson("a2"), lesson("a3")]),
            mod("m2", 2, [lesson("b1", { isCompleted: true }), lesson("b2", { isCompleted: true }), lesson("b3")]),
            mod("m3", 3, [lesson("c1")]),
        ]
        const insight = analyzeProgress({ modules, currentLessonId: null, completionPercent: 43 })
        expect(insight.recommendation.kind).toBe("finishModule")
        expect(insight.recommendation.moduleId).toBe("m2")
        expect(insight.recommendation.lessonId).toBe("b3")
        expect(insight.recommendation.reasonValues.remaining).toBe(1)
    })

    it("starts the next untouched module when nothing is in progress", () => {
        const modules = [
            mod("m1", 1, [lesson("a", { isCompleted: true })]),
            mod("m2", 2, [lesson("b"), lesson("c")]),
        ]
        const insight = analyzeProgress({ modules, currentLessonId: null, completionPercent: 33 })
        expect(insight.recommendation.kind).toBe("startModule")
        expect(insight.recommendation.moduleId).toBe("m2")
        expect(insight.recommendation.lessonId).toBe("b")
    })

    it("flags a locked recommended lesson as unlock", () => {
        const modules = [mod("m1", 1, [lesson("a", { isLocked: true })])]
        const insight = analyzeProgress({ modules, currentLessonId: "a", completionPercent: 0 })
        expect(insight.recommendation.kind).toBe("unlock")
        expect(insight.recommendation.isLocked).toBe(true)
        expect(insight.recommendation.reasonKey).toBe("unlock")
    })

    it("reports done when every lesson is completed", () => {
        const modules = [mod("m1", 1, [lesson("a", { isCompleted: true })])]
        const insight = analyzeProgress({ modules, currentLessonId: null, completionPercent: 100 })
        expect(insight.recommendation.kind).toBe("done")
        expect(insight.recommendation.lessonId).toBeNull()
    })

    it("rolls up lesson / module counts and strength & review lists", () => {
        const modules = [
            mod("m1", 1, [lesson("a", { isCompleted: true }), lesson("b", { isCompleted: true })], "Nhập môn"),
            mod("m2", 2, [lesson("c", { isCompleted: true }), lesson("d")], "Vòng lặp"),
            mod("m3", 3, [lesson("e")], "Đệ quy"),
        ]
        const insight = analyzeProgress({ modules, currentLessonId: null, completionPercent: 50 })
        expect(insight.lessons).toEqual({ completed: 3, total: 5, remaining: 2 })
        expect(insight.modules).toEqual({ completed: 1, inProgress: 1, notStarted: 1, total: 3 })
        expect(insight.strengths.map((ref) => ref.moduleId)).toEqual(["m1"])
        expect(insight.review.map((ref) => ref.moduleId)).toEqual(["m2"])
        expect(insight.overallPercent).toBe(50)
    })
})
