import {
    CourseQuestionFilter,
    type CourseQuestion,
    type CourseQuestionsPage,
} from "./types"

/**
 * FE-only MOCK course-questions store (no BE contract yet). Per-course questions live
 * in a module-level map, seeded lazily on first read and mutated in place by
 * ask/answer so the roll-up behaves believably for review. Same `{ questions, total }`
 * shape a real endpoint would return, so swapping in GraphQL/REST later is a one-file
 * change. `ponytail: mock store, replace with a real course-questions endpoint`.
 */

/** Questions returned per page. */
export const QUESTIONS_PER_PAGE = 20

const store = new Map<string, Array<CourseQuestion>>()
let idCounter = 0
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${(idCounter += 1)}`

/** Minutes-ago ISO helper for seed timestamps. */
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString()

const seed = (): Array<CourseQuestion> => [
    {
        id: "q-seed-1",
        authorId: "user-lan",
        authorName: "Trần Lan",
        authorUsername: "lan",
        body: "Ở bài Git branch, làm sao để gộp nhánh mà không bị conflict ạ?",
        createdAt: ago(45),
        lessonTitle: "Git branch Basic",
        answers: [
            {
                id: "a-seed-1",
                authorName: "FTES Mentor",
                authorUsername: "mentor",
                body: "Bạn nên rebase nhánh feature lên main trước khi merge để giảm conflict.",
                createdAt: ago(30),
                isFounder: true,
            },
        ],
    },
    {
        id: "q-seed-2",
        authorId: "user-quan",
        authorName: "Đỗ Quân",
        authorUsername: "quan",
        body: "Phần HTML semantic tags mình nên dùng <section> hay <div> khi nào?",
        createdAt: ago(120),
        lessonTitle: "Tất tần tật về HTML",
        answers: [],
    },
    {
        id: "q-seed-3",
        authorId: "user-hoa",
        authorName: "Phạm Hoa",
        authorUsername: "hoa",
        body: "Có tài liệu nào ôn thêm về flexbox không mọi người?",
        createdAt: ago(240),
        lessonTitle: "",
        answers: [],
    },
]

const ensure = (courseId: string): Array<CourseQuestion> => {
    const existing = store.get(courseId)
    if (existing) {
        return existing
    }
    const seeded = seed()
    store.set(courseId, seeded)
    return seeded
}

/** Read a filtered + searched + paginated page of the course's questions. */
export const fetchCourseQuestions = async (params: {
    courseId: string
    filter: CourseQuestionFilter
    search: string
    page: number
    currentUserId: string | null
}): Promise<CourseQuestionsPage> => {
    const { courseId, filter, search, page, currentUserId } = params
    const all = ensure(courseId)
    const query = search.trim().toLowerCase()

    const filtered = all.filter((question) => {
        if (query && !question.body.toLowerCase().includes(query)) {
            return false
        }
        switch (filter) {
        case CourseQuestionFilter.Unanswered:
            return question.answers.length === 0
        case CourseQuestionFilter.Answered:
            return question.answers.length > 0
        case CourseQuestionFilter.Mine:
            return currentUserId !== null && question.authorId === currentUserId
        case CourseQuestionFilter.All:
        default:
            return true
        }
    })

    const start = (page - 1) * QUESTIONS_PER_PAGE
    return { questions: filtered.slice(start, start + QUESTIONS_PER_PAGE), total: filtered.length }
}

/** Add a course-general question (prepended so it shows immediately). */
export const addCourseQuestion = (params: {
    courseId: string
    body: string
    authorId: string
    authorName: string
    authorUsername: string
}): void => {
    const all = ensure(params.courseId)
    all.unshift({
        id: nextId("q"),
        authorId: params.authorId,
        authorName: params.authorName,
        authorUsername: params.authorUsername,
        body: params.body,
        createdAt: new Date().toISOString(),
        lessonTitle: "",
        answers: [],
    })
}

/** Append an answer to a question. */
export const addCourseAnswer = (params: {
    courseId: string
    questionId: string
    body: string
    authorName: string
    authorUsername: string
}): void => {
    const all = ensure(params.courseId)
    const question = all.find((item) => item.id === params.questionId)
    if (question) {
        question.answers.push({
            id: nextId("a"),
            authorName: params.authorName,
            authorUsername: params.authorUsername,
            body: params.body,
            createdAt: new Date().toISOString(),
            isFounder: false,
        })
    }
}
