"use client"

import useSWR from "swr"
import {
    getCourseDetail,
    getCourseProgress,
    readLessonContent,
    type CourseDetail,
    type CourseProgressView,
    type LessonContentView,
    type TeaserInfo,
} from "@/modules/api/rest/course"

/** A heading anchor for the "On this page" TOC. */
export interface LessonHeading {
    /** DOM id used as the scroll target + TOC anchor. */
    id: string
    /** Heading text. */
    text: string
    /** 2 = section, 3 = sub-section (indent level). */
    level: 2 | 3
}

/** A learning outcome bullet ("What you'll learn"). */
export interface LessonOutcome {
    id: string
    text: string
}

/** The lesson currently open in the reader (§4). */
export interface LearnLessonView {
    id: string
    /** Owning module id (for the prev/next route + breadcrumb). */
    moduleId: string
    /**
     * Resolved course UUID (`detail.course.id`) — the same id the rail keys its
     * progress query on, so the per-lesson progress overlay shares its SWR cache.
     */
    courseRawId: string
    /** Human course title (shown in package gate modal header). */
    courseTitle: string
    title: string
    /** Short description under the title. */
    description: string
    moduleTitle: string
    /** Read/watch time label. */
    readTimeLabel: string
    /** Estimated reading minutes (for the meta chip). */
    minutesRead: number
    /** Number of challenges attached (meta chip). */
    challengeCount: number
    /** "What you'll learn" bullets (empty → the callout is hidden). */
    outcomes: Array<LessonOutcome>
    /** Languages this lesson has content for. */
    availableLangs: Array<string>
    /** Raw markdown body keyed by language (rendered by MarkdownContent). */
    bodyByLang: Record<string, string>
    /** Prev/next content ids for the pager. */
    prevId: string | null
    nextId: string | null
    /** Previous / next lesson titles (for the pager cards). */
    prevTitle: string | null
    nextTitle: string | null
    isCompleted: boolean
    /** The BE lesson content-type (`LessonView.type`), e.g. "VIDEO" or "DOCUMENT". */
    contentType: string
    /** Derived: true when this lesson is a VIDEO lesson (authoritative content-type). */
    isVideoLesson: boolean
    /** True → this lesson has an auto-graded challenge (shows the submission entry). */
    hasChallenge: boolean
    /** Id of the linked ACTIVE challenge (null when `hasChallenge` is false). */
    challengeId: string | null
    /** True → this lesson has a PUBLISHED quiz (shows the quiz block). */
    hasQuiz: boolean
    /** Id of the linked PUBLISHED quiz (null when `hasQuiz` is false). */
    quizId: string | null
    /** Premium + not enrolled → body is gated (select-none, AI ask suppressed). */
    isLocked: boolean
    /**
     * BE access level for this viewer: "FULL" | "PREVIEW" | "NONE".
     * Mirrors `LessonView.accessLevel` from the curriculum.
     */
    accessLevel: string | null
    /** Slugs of the packages that unlock this lesson (for package-gate filtering). */
    packageSlugs: Array<string>
    /** Teaser metadata when the lesson is locked in PREVIEW mode (cheapest package, reason). */
    teaser: TeaserInfo | null
    /** True → this lesson has a READY video → the reader renders the player. */
    hasVideo: boolean
    /** Streaming ref (YouTube URL or `video_*` token) for the video player. */
    videoRef: string | null
    /**
     * Author-authored HTML body for migrated attachment lessons (type "1": notes,
     * Drive links). These store their content in `videoRef` as HTML — not a video —
     * and have no `/content` markdown, so the reader renders this string instead.
     */
    documentHtml: string | null
}

// The BE serves lesson bodies as one markdown string (no per-language variants),
// so the reader renders a single body under a single lang key (its switcher hides
// when availableLangs has one entry).
const BODY_LANG = "typescript"

/** A curriculum lesson flattened with its owning module, for title/nav resolution. */
interface FlatLesson {
    id: string
    name: string
    description: string
    moduleId: string
    moduleTitle: string
    /** BE lesson content-type (`LessonView.type`). */
    type: string
    /** BE video processing state — "READY" means a playable video exists. */
    videoStatus: string
    /** Streaming ref (YouTube URL or `video_*` token). */
    videoRef: string | null
    /** Per-viewer lock (premium + not entitled) — the RELIABLE lock signal. */
    locked: boolean
    /** BE access level for this viewer. */
    accessLevel: string | null
    /** Slugs of packages that unlock this lesson. */
    packageSlugs: Array<string>
}

/** Flattens the course detail into an ordered lesson list (module order → lesson order). */
const flattenCurriculum = (detail: CourseDetail): Array<FlatLesson> =>
    (detail.sections ?? [])
        .slice()
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .flatMap((section) =>
            (section.lessons ?? [])
                .slice()
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((lesson) => ({
                    id: lesson.id,
                    name: lesson.name,
                    description: lesson.description,
                    moduleId: section.id,
                    moduleTitle: section.name,
                    type: lesson.type ?? "",
                    videoStatus: lesson.videoStatus ?? "",
                    videoRef: lesson.videoRef ?? null,
                    locked: lesson.locked ?? false,
                    accessLevel: lesson.accessLevel ?? null,
                    packageSlugs: lesson.packageSlugs ?? [],
                })),
        )

const buildLessonView = (
    contentId: string,
    content: LessonContentView,
    curriculum: Array<FlatLesson>,
    courseRawId: string,
    courseTitle: string,
): LearnLessonView => {
    const index = curriculum.findIndex((lesson) => lesson.id === contentId)
    const current = index >= 0 ? curriculum[index] : undefined
    const prev = index > 0 ? curriculum[index - 1] : undefined
    const next = index >= 0 && index < curriculum.length - 1 ? curriculum[index + 1] : undefined
    const minutes = content.readingMinutes ?? 0
    const contentType = current?.type ?? ""
    const isVideoLesson = contentType === "VIDEO"
    const accessLevel = current?.accessLevel ?? null
    const packageSlugs = current?.packageSlugs ?? []
    const hasChallenge = content.hasChallenge ?? false
    // BE `/lessons/{id}/content` carries the linked ACTIVE challenge id (course-learn-contract-gaps).
    const challengeId = content.challengeId ?? null
    // BE `/lessons/{id}/content` carries the linked PUBLISHED quiz (course-learn-contract-gaps).
    const hasQuiz = content.hasQuiz ?? false
    const quizId = content.quizId ?? null

    // A migrated video ref is a YouTube link or an internal `video_*` token. Anything
    // else in `videoRef` (Drive links, notes) is authored HTML for an attachment
    // lesson (type "1") — render it as the body, not as a (broken) video player.
    const ref = current?.videoRef ?? null
    const isVideoRef = !!ref && (/youtu\.?be|youtube\.com/.test(ref) || /^\s*video_/.test(ref))
    const documentHtml = ref && !isVideoRef && /^\s*</.test(ref) ? ref : null

    return {
        id: contentId,
        moduleId: current?.moduleId ?? "",
        courseRawId,
        courseTitle,
        title: current?.name ?? "",
        description: current?.description ?? "",
        moduleTitle: current?.moduleTitle ?? "",
        readTimeLabel: content.readingMinutes ? `${content.readingMinutes} min` : "",
        minutesRead: minutes,
        challengeCount: 0,
        outcomes: [],
        availableLangs: [BODY_LANG],
        bodyByLang: { [BODY_LANG]: content.bodyMd ?? "" },
        prevId: prev?.id ?? null,
        nextId: next?.id ?? null,
        prevTitle: prev?.name ?? null,
        nextTitle: next?.name ?? null,
        // Base default — the hook overlays the REAL completed state from the
        // viewer's course-progress query (shared with the rail) before returning.
        isCompleted: false,
        contentType,
        isVideoLesson,
        hasChallenge,
        challengeId,
        hasQuiz,
        quizId,
        // Trust the per-viewer curriculum lock — `content.locked` comes from
        // `GET /lessons/{id}/content`, which 401s for an unentitled viewer and is
        // caught into a `locked: false` fallback (a lie that hides the paywall).
        isLocked: current?.locked ?? content.locked,
        accessLevel,
        packageSlugs,
        teaser: content.teaser ?? null,
        // Mount the video block when the curriculum ships a playable ref, OR when this
        // is a PREVIEW video lesson whose ref the catalog hides (locked) — the stream
        // response (`freemium-youtube-preview-gate`) supplies the gated ref in that case.
        hasVideo:
            current?.videoStatus === "READY" &&
            (isVideoRef || (contentType === "VIDEO" && accessLevel === "PREVIEW")),
        videoRef: ref,
        documentHtml,
    }
}

/**
 * Loads a single lesson's body + nav from the real REST API: the document content
 * (`GET /lessons/{id}/content`, markdown → typed blocks) joined against the course
 * curriculum (`GET /courses/{slug}`) for the title, owning module and prev/next.
 */
export const useQueryLearnLessonSwr = (courseId: string, contentId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        courseId && contentId ? ["GET_LEARN_LESSON", courseId, contentId] : null,
        async (): Promise<LearnLessonView> => {
            // Migrated lessons often carry no document body yet (`GET …/content` 404s
            // "Lesson has no content"). Treat that as an empty body so the reader still
            // renders the real title/module/nav from the curriculum instead of erroring.
            const [content, detail] = await Promise.all([
                readLessonContent(contentId).catch(
                    (): LessonContentView => ({
                        lessonId: contentId,
                        bodyMd: "",
                        readingMinutes: null,
                        locked: false,
                        teaser: null,
                    }),
                ),
                getCourseDetail(courseId),
            ])
            return buildLessonView(
                contentId,
                content,
                flattenCurriculum(detail),
                detail.course?.id ?? courseId,
                detail.course?.title ?? "",
            )
        },
    )

    // Overlay the viewer's REAL per-lesson completion from the course-progress query.
    // Keyed on the resolved course UUID — the SAME key the rail uses — so a mark-complete
    // that revalidates `GET_COURSE_PROGRESS` refreshes both the rail meter and this seed,
    // and a reload of an already-complete lesson starts already completed (never re-fires).
    const courseRawId = data?.courseRawId
    const { data: progress, mutate: mutateProgress } = useSWR(
        courseRawId ? ["GET_COURSE_PROGRESS", courseRawId] : null,
        async () => getCourseProgress(courseRawId as string),
        { shouldRetryOnError: false },
    )

    const lesson = data
        ? { ...data, isCompleted: isLessonCompleted(progress, contentId) || data.isCompleted }
        : undefined

    return {
        lesson,
        isLoading,
        error,
        mutate: async () => {
            await Promise.all([mutate(), mutateProgress()])
        },
    }
}

/** True when the viewer's course progress marks this lesson COMPLETED. */
const isLessonCompleted = (
    progress: CourseProgressView | undefined,
    contentId: string,
): boolean =>
    (progress?.lessons ?? []).some(
        (row) => row.lessonId === contentId && row.status === "COMPLETED",
    )
