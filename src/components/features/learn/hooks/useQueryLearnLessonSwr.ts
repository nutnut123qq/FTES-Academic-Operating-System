"use client"

import useSWR from "swr"

/** A heading anchor for the "On this page" TOC. */
export interface LessonHeading {
    /** DOM id used as the scroll target + TOC anchor. */
    id: string
    /** Heading text. */
    text: string
    /** 2 = section, 3 = sub-section (indent level). */
    level: 2 | 3
}

/** One prose block in the lesson body (mock content, per selected language). */
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

/** The lesson currently open in the reader (§4, mock until BE lands). */
export interface LearnLessonView {
    id: string
    title: string
    moduleTitle: string
    /** Read/watch time label. */
    readTimeLabel: string
    /** Languages this lesson has content for (subset of TS/Java/C#/Go). */
    availableLangs: Array<string>
    /** Body blocks keyed by language. */
    bodyByLang: Record<string, Array<LessonBlock>>
    /** Prev/next content ids for the pager. */
    prevId: string | null
    nextId: string | null
    isCompleted: boolean
    /** True → this lesson has an auto-graded challenge (shows the submission entry). */
    hasChallenge: boolean
    /** Premium + not enrolled → body is gated (select-none, AI ask suppressed). */
    isLocked: boolean
}

const LANGS = ["typescript", "java", "csharp", "go"]

const buildBody = (lang: string): Array<LessonBlock> => {
    const langLabel: Record<string, string> = {
        typescript: "TypeScript",
        java: "Java",
        csharp: "C#",
        go: "Go",
    }
    const label = langLabel[lang] ?? lang
    return [
        { id: "h-intro", kind: "heading", level: 2, text: "Overview" },
        {
            id: "p-intro-1",
            kind: "para",
            text: `In this lesson we walk through the core idea in ${label}. Read the passage below, then try the exercise. Select any passage to ask the AI tutor about it.`,
        },
        {
            id: "p-intro-2",
            kind: "para",
            text: "The runtime keeps a call stack of active frames. Each function call pushes a frame; returning pops it. Understanding this model explains both recursion limits and where local state lives.",
        },
        { id: "h-example", kind: "heading", level: 2, text: "A worked example" },
        {
            id: "c-example",
            kind: "code",
            text: `// ${label}\nfunction greet(name) {\n  return "Hello, " + name\n}`,
        },
        {
            id: "p-example-1",
            kind: "para",
            text: "Notice how the argument is bound at call time. The function body only sees the parameter name, never the caller's variable — this is why pass-by-value is the default mental model.",
        },
        { id: "h-edge", kind: "heading", level: 3, text: "Edge cases" },
        {
            id: "p-edge-1",
            kind: "para",
            text: "Empty input, very large input, and concurrent access each break naive implementations differently. We handle the first two here and revisit concurrency in a later module.",
        },
        { id: "h-recap", kind: "heading", level: 2, text: "Recap" },
        {
            id: "p-recap-1",
            kind: "para",
            text: "You learned the call model, saw a worked example, and identified the common edge cases. The challenge at the end of this module asks you to apply all three.",
        },
    ]
}

const fetchLearnLessonMock = async (courseId: string, contentId: string): Promise<LearnLessonView> => {
    const bodyByLang: Record<string, Array<LessonBlock>> = {}
    for (const lang of LANGS) {
        bodyByLang[lang] = buildBody(lang)
    }
    // Derive a stable prev/next from the mock id shape "m<n>-l<k>".
    const match = /^m(\d+)-l(\d+)$/.exec(contentId)
    const moduleNo = match ? Number(match[1]) : 1
    const lessonNo = match ? Number(match[2]) : 1
    const prevId = lessonNo > 1 ? `m${moduleNo}-l${lessonNo - 1}` : null
    const nextId = lessonNo < 4 ? `m${moduleNo}-l${lessonNo + 1}` : `m${moduleNo + 1}-l1`
    // Premium: the 4th lesson of modules ≥ 3 (matches useQueryLearnCourseSwr).
    const isPremium = moduleNo >= 3 && lessonNo === 4
    return {
        id: contentId,
        title: `Lesson ${moduleNo}.${lessonNo}`,
        moduleTitle: `Module ${moduleNo}`,
        readTimeLabel: `${5 + ((moduleNo + lessonNo) % 8)} min`,
        availableLangs: LANGS,
        bodyByLang,
        prevId,
        nextId,
        isCompleted: moduleNo === 1,
        hasChallenge: lessonNo === 4,
        // ponytail: mock viewer is free-enrolled → premium body is gated.
        isLocked: isPremium,
    }
}

/** Loads a single lesson's body + nav. Mocked; SWR-shaped for a BE swap. */
export const useQueryLearnLessonSwr = (courseId: string, contentId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["learn-lesson", courseId, contentId],
        () => fetchLearnLessonMock(courseId, contentId),
    )
    return { lesson: data, isLoading, error, mutate }
}
