import { getLessonComments, type LessonCommentView } from "@/modules/api/rest/course"
import {
    CourseQuestionFilter,
    type CourseQuestion,
    type CourseQuestionAnswer,
    type CourseQuestionsPage,
} from "./types"

/**
 * Course-wide Q&A roll-up adapter (replaces the old FE mock). Fans out
 * `GET /courses/lessons/{lessonId}/comments` across every lesson in the course,
 * maps each top-level comment → a course question (its `replies` → answers) and
 * links it back to the lesson in the learn shell. Filter/search/page then run
 * client-side over the rolled-up set (spec course-qa-rollup).
 */

/** Questions returned per client-side page. */
export const QUESTIONS_PER_PAGE = 20

/** Max concurrent lesson-comment requests in the fan-out. */
const FANOUT_CHUNK = 5

/** Comments pulled per lesson for the roll-up (first page only — believable cap). */
const COMMENTS_PER_LESSON = 50

/** Comment status the BE stamps on a deleted (tombstoned) comment. */
const DELETED_STATUS = "DELETED"

/** A lesson the roll-up should pull comments from. */
export interface RollupLesson {
    lessonId: string
    moduleId: string
    title: string
    /** Deep link to the lesson inside the learn shell. */
    href: string
}

/** Display labels + viewer identity used when mapping a comment's author. */
export interface RollupLabels {
    /** Label for the viewer's own comments. */
    you: string
    /** Label for another learner's comments (the comment API carries no display name). */
    member: string
    /** The signed-in viewer's id (or null) — drives the "you" label + the Mine filter. */
    currentUserId: string | null
}

/**
 * Resolves an author label. The lesson-comment API exposes only `userId` (no display
 * name), so we can only distinguish the viewer from everyone else — matching how the
 * per-lesson `LessonComments` thread labels rows.
 */
const authorLabel = (userId: string | null, labels: RollupLabels): string => {
    if (!userId) {
        return labels.member
    }
    return userId === labels.currentUserId ? labels.you : labels.member
}

/** Maps a nested reply comment → a course-question answer. */
const mapAnswer = (reply: LessonCommentView, labels: RollupLabels): CourseQuestionAnswer => ({
    id: reply.id,
    authorName: authorLabel(reply.userId, labels),
    authorUsername: reply.userId ?? "deleted",
    body: reply.content,
    createdAt: reply.createdAt,
    // The comment API carries no founder/instructor flag yet, so answers stay unbadged.
    isFounder: false,
})

/** Maps a top-level lesson comment → a course question anchored to its lesson. */
export const mapCommentToQuestion = (
    comment: LessonCommentView,
    lesson: RollupLesson,
    labels: RollupLabels,
): CourseQuestion => ({
    id: comment.id,
    authorId: comment.userId ?? "",
    authorName: authorLabel(comment.userId, labels),
    authorUsername: comment.userId ?? "deleted",
    body: comment.content,
    createdAt: comment.createdAt,
    lessonId: lesson.lessonId,
    lessonTitle: lesson.title,
    lessonHref: lesson.href,
    answers: (comment.replies ?? [])
        .filter((reply) => reply.status !== DELETED_STATUS && reply.userId !== null)
        .map((reply) => mapAnswer(reply, labels)),
})

/**
 * Fans out lesson-comment reads (chunks of {@link FANOUT_CHUNK}) and rolls every
 * live top-level comment up into a course question, newest first. A lesson that
 * 403s (viewer lacks FULL access) or errors contributes nothing rather than failing
 * the whole roll-up — so a course with no readable comments yields an empty list,
 * not an error.
 */
export const fetchCourseRollup = async (
    lessons: Array<RollupLesson>,
    labels: RollupLabels,
): Promise<Array<CourseQuestion>> => {
    const questions: Array<CourseQuestion> = []

    for (let start = 0; start < lessons.length; start += FANOUT_CHUNK) {
        const chunk = lessons.slice(start, start + FANOUT_CHUNK)
        const results = await Promise.all(
            chunk.map(async (lesson) => {
                try {
                    const page = await getLessonComments(lesson.lessonId, { page: 1, size: COMMENTS_PER_LESSON })
                    return { lesson, items: page.items ?? [] }
                } catch {
                    return { lesson, items: [] as Array<LessonCommentView> }
                }
            }),
        )
        for (const { lesson, items } of results) {
            for (const comment of items) {
                if (comment.status === DELETED_STATUS || comment.userId === null) {
                    continue
                }
                questions.push(mapCommentToQuestion(comment, lesson, labels))
            }
        }
    }

    questions.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    return questions
}

/** Applies the active filter + search + page to the rolled-up set (client-side). */
export const selectQuestionsPage = (
    all: Array<CourseQuestion>,
    params: {
        filter: CourseQuestionFilter
        search: string
        page: number
        currentUserId: string | null
    },
): CourseQuestionsPage => {
    const query = params.search.trim().toLowerCase()
    const filtered = all.filter((question) => {
        if (
            query &&
            !question.body.toLowerCase().includes(query) &&
            !question.lessonTitle.toLowerCase().includes(query)
        ) {
            return false
        }
        switch (params.filter) {
        case CourseQuestionFilter.Unanswered:
            return question.answers.length === 0
        case CourseQuestionFilter.Answered:
            return question.answers.length > 0
        case CourseQuestionFilter.Mine:
            return params.currentUserId !== null && question.authorId === params.currentUserId
        case CourseQuestionFilter.All:
        default:
            return true
        }
    })

    const start = (params.page - 1) * QUESTIONS_PER_PAGE
    return { questions: filtered.slice(start, start + QUESTIONS_PER_PAGE), total: filtered.length }
}
