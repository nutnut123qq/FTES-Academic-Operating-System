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

/** One top-level course question (a top-level lesson comment rolled up course-wide). */
export interface CourseQuestion {
    /** The underlying lesson-comment id (reused for reply routing). */
    id: string
    authorId: string
    authorName: string
    authorUsername: string
    body: string
    createdAt: string
    /** The lesson this question lives on (used to route replies to the right lesson). */
    lessonId: string
    /** The lesson the question was asked on ("" when the lesson has no title). */
    lessonTitle: string
    /** Deep link to the lesson inside the learn shell. */
    lessonHref: string
    answers: Array<CourseQuestionAnswer>
}

/** A page of course questions plus the unpaged total (for the pager). */
export interface CourseQuestionsPage {
    questions: Array<CourseQuestion>
    total: number
}
