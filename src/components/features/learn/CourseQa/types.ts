/** Filter tabs for the course-wide Q&A roll-up (URL `?filter=` values). */
export enum CourseQuestionFilter {
    /** Questions with no answer yet (the founder queue) — the default. */
    Unanswered = "unanswered",
    /** Questions that have at least one answer. */
    Answered = "answered",
    /** Questions the viewer asked. */
    Mine = "mine",
    /** Every question. */
    All = "all",
}

/** One answer to a course question. */
export interface CourseQuestionAnswer {
    id: string
    authorName: string
    authorUsername: string
    body: string
    createdAt: string
    /** Answered by the course founder/instructor. */
    isFounder: boolean
}

/** One top-level course question. */
export interface CourseQuestion {
    id: string
    authorId: string
    authorName: string
    authorUsername: string
    body: string
    createdAt: string
    /** The lesson the question was asked on ("" for a course-general question). */
    lessonTitle: string
    answers: Array<CourseQuestionAnswer>
}

/** A page of course questions plus the unpaged total (for the pager). */
export interface CourseQuestionsPage {
    questions: Array<CourseQuestion>
    total: number
}
