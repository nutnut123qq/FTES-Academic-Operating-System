import { beforeEach, describe, expect, it, vi } from "vitest"
import { CourseQuestionFilter } from "./types"

/**
 * Pure helpers — the course-wide Q&A roll-up adapter (learn-engagement-wire task 4.3
 * quality loop). Pins the comment→question mapper (author labels, tombstone filtering),
 * the chunked lesson fan-out (max 5 in flight, an erroring lesson contributes nothing),
 * and the client-side filter/search/page selector.
 */

const getComments = vi.fn()

vi.mock("@/modules/api/rest/course", () => ({
    getLessonComments: (lessonId: string, params: unknown) => getComments(lessonId, params),
}))

import {
    QUESTIONS_PER_PAGE,
    fetchCourseRollup,
    mapCommentToQuestion,
    selectQuestionsPage,
    type RollupLabels,
    type RollupLesson,
} from "./rollup"
import type { CourseQuestion } from "./types"
import type { LessonCommentView } from "@/modules/api/rest/course"

const labels: RollupLabels = { you: "Bạn", member: "Học viên", currentUserId: "me" }

const lesson = (n: number): RollupLesson => ({
    lessonId: `l${n}`,
    moduleId: `m1`,
    title: `Bài ${n}`,
    href: `/courses/c/learn/content/modules/m1/contents/l${n}`,
})

/** Minimal live comment; override to shape tombstones / replies. */
const comment = (over: Partial<LessonCommentView> = {}): LessonCommentView => ({
    id: "cm-1",
    userId: "me",
    parentId: null,
    content: "Câu hỏi?",
    status: "ACTIVE",
    createdAt: "2026-07-01T00:00:00Z",
    reactionCount: 0,
    myReactions: [],
    replies: [],
    ...over,
})

beforeEach(() => {
    getComments.mockReset()
})

describe("mapCommentToQuestion", () => {
    it("labels the viewer 'you', others 'member', and anchors the lesson link", () => {
        const question = mapCommentToQuestion(
            comment({
                replies: [
                    comment({ id: "r1", userId: "other", content: "Trả lời", parentId: "cm-1" }),
                ],
            }),
            lesson(1),
            labels,
        )
        expect(question.authorName).toBe("Bạn")
        expect(question.lessonId).toBe("l1")
        expect(question.lessonHref).toBe("/courses/c/learn/content/modules/m1/contents/l1")
        expect(question.answers).toHaveLength(1)
        expect(question.answers[0].authorName).toBe("Học viên")
    })

    it("drops DELETED and anonymous replies from the answers", () => {
        const question = mapCommentToQuestion(
            comment({
                replies: [
                    comment({ id: "r1", userId: "other", status: "DELETED" }),
                    comment({ id: "r2", userId: null }),
                    comment({ id: "r3", userId: "other" }),
                ],
            }),
            lesson(1),
            labels,
        )
        expect(question.answers.map((answer) => answer.id)).toEqual(["r3"])
    })
})

describe("fetchCourseRollup — chunked fan-out", () => {
    it("fans out in chunks of 5 and merges every lesson's comments, newest first", async () => {
        // Track in-flight concurrency: each call resolves on a later macrotask, so a
        // burst larger than the chunk size would push `maxActive` above 5.
        let active = 0
        let maxActive = 0
        getComments.mockImplementation(async (lessonId: string) => {
            active += 1
            maxActive = Math.max(maxActive, active)
            await new Promise((resolve) => setTimeout(resolve, 0))
            active -= 1
            const n = Number(lessonId.slice(1))
            return {
                items: [
                    comment({ id: `cm-${n}`, userId: "other", createdAt: `2026-07-0${n}T00:00:00Z` }),
                ],
            }
        })

        const lessons = [1, 2, 3, 4, 5, 6, 7].map(lesson)
        const questions = await fetchCourseRollup(lessons, labels)

        expect(getComments).toHaveBeenCalledTimes(7)
        expect(getComments).toHaveBeenCalledWith("l1", { page: 1, size: 50 })
        expect(maxActive).toBe(5)
        expect(questions).toHaveLength(7)
        // newest first
        expect(questions[0].id).toBe("cm-7")
        expect(questions[6].id).toBe("cm-1")
    })

    it("skips tombstoned / anonymous top-level comments", async () => {
        getComments.mockResolvedValue({
            items: [
                comment({ id: "cm-live", userId: "other" }),
                comment({ id: "cm-del", userId: "other", status: "DELETED" }),
                comment({ id: "cm-anon", userId: null }),
            ],
        })
        const questions = await fetchCourseRollup([lesson(1)], labels)
        expect(questions.map((question) => question.id)).toEqual(["cm-live"])
    })

    it("lets a 403-ing lesson contribute nothing instead of failing the roll-up", async () => {
        getComments.mockImplementation(async (lessonId: string) => {
            if (lessonId === "l1") {
                throw new Error("403 COURSE_ACCESS_DENIED")
            }
            return { items: [comment({ id: `cm-${lessonId}`, userId: "other" })] }
        })
        const questions = await fetchCourseRollup([lesson(1), lesson(2)], labels)
        expect(questions.map((question) => question.id)).toEqual(["cm-l2"])
    })
})

describe("selectQuestionsPage — client-side filter/search/page", () => {
    const make = (over: Partial<CourseQuestion>): CourseQuestion => ({
        id: "q",
        authorId: "other",
        authorName: "Học viên",
        authorUsername: "other",
        body: "Nội dung",
        createdAt: "2026-07-01T00:00:00Z",
        lessonId: "l1",
        lessonTitle: "Bài 1",
        lessonHref: "#",
        answers: [],
        ...over,
    })

    const all = [
        make({ id: "q1", body: "Hỏi về Docker", answers: [] }),
        make({
            id: "q2",
            body: "Hỏi về Kafka",
            authorId: "me",
            answers: [
                {
                    id: "a1",
                    authorName: "Bạn",
                    authorUsername: "me",
                    body: "ok",
                    createdAt: "2026-07-02T00:00:00Z",
                    isFounder: false,
                },
            ],
        }),
    ]

    it("filters unanswered / answered / mine", () => {
        const base = { search: "", page: 1, currentUserId: "me" }
        expect(
            selectQuestionsPage(all, { ...base, filter: CourseQuestionFilter.Unanswered }).questions.map((q) => q.id),
        ).toEqual(["q1"])
        expect(
            selectQuestionsPage(all, { ...base, filter: CourseQuestionFilter.Answered }).questions.map((q) => q.id),
        ).toEqual(["q2"])
        expect(
            selectQuestionsPage(all, { ...base, filter: CourseQuestionFilter.Mine }).questions.map((q) => q.id),
        ).toEqual(["q2"])
        expect(selectQuestionsPage(all, { ...base, filter: CourseQuestionFilter.All }).total).toBe(2)
    })

    it("matches the search against the body and the lesson title, case-insensitively", () => {
        const base = { filter: CourseQuestionFilter.All, page: 1, currentUserId: null }
        expect(
            selectQuestionsPage(all, { ...base, search: "kafka" }).questions.map((q) => q.id),
        ).toEqual(["q2"])
        expect(selectQuestionsPage(all, { ...base, search: "bài 1" }).total).toBe(2)
        expect(selectQuestionsPage(all, { ...base, search: "không có" }).total).toBe(0)
    })

    it("slices pages of QUESTIONS_PER_PAGE while total counts every match", () => {
        const many = Array.from({ length: QUESTIONS_PER_PAGE + 5 }, (_, index) =>
            make({ id: `q${index}` }),
        )
        const base = { filter: CourseQuestionFilter.All, search: "", currentUserId: null }
        const page1 = selectQuestionsPage(many, { ...base, page: 1 })
        const page2 = selectQuestionsPage(many, { ...base, page: 2 })
        expect(page1.questions).toHaveLength(QUESTIONS_PER_PAGE)
        expect(page2.questions).toHaveLength(5)
        expect(page2.total).toBe(QUESTIONS_PER_PAGE + 5)
    })
})
