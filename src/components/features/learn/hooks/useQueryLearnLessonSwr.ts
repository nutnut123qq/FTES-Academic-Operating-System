"use client"

import useSWR from "swr"
import {
    getCourseDetail,
    readLessonContent,
    type CourseDetail,
    type LessonContentView,
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

/** One prose block in the lesson body. */
export interface LessonBlock {
    /** Stable key. */
    id: string
    /** "heading" renders an anchored H2/H3; "para" a paragraph; "code" a code sample. */
    kind: "heading" | "para" | "code"
    /** Text content (heading text / paragraph / code). */
    text: string
    /** For headings only — the TOC level. */
    level?: 2 | 3
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
    /** Body blocks keyed by language. */
    bodyByLang: Record<string, Array<LessonBlock>>
    /** Prev/next content ids for the pager. */
    prevId: string | null
    nextId: string | null
    /** Previous / next lesson titles (for the pager cards). */
    prevTitle: string | null
    nextTitle: string | null
    isCompleted: boolean
    /** True → this lesson has an auto-graded challenge (shows the submission entry). */
    hasChallenge: boolean
    /** Premium + not enrolled → body is gated (select-none, AI ask suppressed). */
    isLocked: boolean
    /** True → this lesson has a READY video → the reader renders the HLS player. */
    hasVideo: boolean
}

// The BE serves lesson bodies as one markdown string (no per-language variants),
// so the reader renders a single body under a single lang key (its switcher hides
// when availableLangs has one entry).
const BODY_LANG = "typescript"

/** Minimal markdown → typed-block parser: headings (# / ###), fenced code, paragraphs. */
const parseMarkdownToBlocks = (markdown: string): Array<LessonBlock> => {
    const blocks: Array<LessonBlock> = []
    let paragraph: Array<string> = []
    let codeLines: Array<string> | null = null

    const flushParagraph = () => {
        if (paragraph.length > 0) {
            blocks.push({ id: `p-${blocks.length}`, kind: "para", text: paragraph.join(" ").trim() })
            paragraph = []
        }
    }

    for (const line of markdown.split(/\r?\n/)) {
        if (codeLines !== null) {
            if (/^```/.test(line)) {
                blocks.push({ id: `c-${blocks.length}`, kind: "code", text: codeLines.join("\n") })
                codeLines = null
            } else {
                codeLines.push(line)
            }
            continue
        }
        if (/^```/.test(line)) {
            flushParagraph()
            codeLines = []
            continue
        }
        const heading = /^(#{1,6})\s+(.*)$/.exec(line)
        if (heading) {
            flushParagraph()
            const level: 2 | 3 = heading[1]!.length <= 2 ? 2 : 3
            blocks.push({ id: `h-${blocks.length}`, kind: "heading", level, text: heading[2]!.trim() })
            continue
        }
        if (line.trim() === "") {
            flushParagraph()
            continue
        }
        paragraph.push(line.trim())
    }
    if (codeLines !== null && codeLines.length > 0) {
        blocks.push({ id: `c-${blocks.length}`, kind: "code", text: codeLines.join("\n") })
    }
    flushParagraph()
    return blocks
}

/** A curriculum lesson flattened with its owning module, for title/nav resolution. */
interface FlatLesson {
    id: string
    name: string
    description: string
    moduleId: string
    moduleTitle: string
    /** BE video processing state — "READY" means a playable HLS stream exists. */
    videoStatus: string
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
                    videoStatus: lesson.videoStatus ?? "",
                })),
        )

const buildLessonView = (
    contentId: string,
    content: LessonContentView,
    curriculum: Array<FlatLesson>,
): LearnLessonView => {
    const index = curriculum.findIndex((lesson) => lesson.id === contentId)
    const current = index >= 0 ? curriculum[index] : undefined
    const prev = index > 0 ? curriculum[index - 1] : undefined
    const next = index >= 0 && index < curriculum.length - 1 ? curriculum[index + 1] : undefined
    const minutes = content.readingMinutes ?? 0

    return {
        id: contentId,
        moduleId: current?.moduleId ?? "",
        title: current?.name ?? "",
        description: current?.description ?? "",
        moduleTitle: current?.moduleTitle ?? "",
        readTimeLabel: content.readingMinutes ? `${content.readingMinutes} min` : "",
        minutesRead: minutes,
        challengeCount: 0,
        outcomes: [],
        availableLangs: [BODY_LANG],
        bodyByLang: { [BODY_LANG]: parseMarkdownToBlocks(content.bodyMd ?? "") },
        prevId: prev?.id ?? null,
        nextId: next?.id ?? null,
        prevTitle: prev?.name ?? null,
        nextTitle: next?.name ?? null,
        isCompleted: false,
        hasChallenge: false,
        isLocked: content.locked,
        hasVideo: current?.videoStatus === "READY",
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
            return buildLessonView(contentId, content, flattenCurriculum(detail))
        },
    )
    return { lesson: data, isLoading, error, mutate }
}
