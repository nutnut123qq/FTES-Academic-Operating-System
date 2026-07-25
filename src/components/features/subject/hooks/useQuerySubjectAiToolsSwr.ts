"use client"

import useSWR from "swr"

/** AI tool key (§9 AI Platform surfaces inside a subject). */
export type AiToolKey = "tutor" | "summary" | "quiz" | "flashcards" | "ocr"

/** Availability of a tool. `available` opens a surface; `comingSoon` is a disabled shell. */
export type AiToolStatus = "available" | "comingSoon"

/** An AI tool entry of the subject hub. */
export interface AiTool {
    key: AiToolKey
    /** Whether the tool opens a working surface or renders a coming-soon shell. */
    status: AiToolStatus
}

/**
 * The tool roster. There is no BE "list my AI tools" endpoint — the set is fixed by
 * what the AI module actually exposes, so it is declared here rather than fetched:
 * tutor rides `POST /ai/sessions` (SSE), summary/quiz/flashcards ride the async
 * learning jobs (`/ai/learning/{summary,quiz,flashcards}` → `/ai/jobs/{id}`), and OCR
 * rides `/ai/learning/ocr` on an uploaded `storageKey`. All five are wired, so none
 * is `comingSoon` anymore.
 */
const listAiTools = async (): Promise<Array<AiTool>> => [
    { key: "tutor", status: "available" },
    { key: "summary", status: "available" },
    { key: "quiz", status: "available" },
    { key: "flashcards", status: "available" },
    { key: "ocr", status: "available" },
]

/** Loads a subject's AI tool roster (static set; SWR-shaped for a per-subject gate later). */
export const useQuerySubjectAiToolsSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-ai-tools", subjectId],
        () => listAiTools(),
    )
    return { tools: data ?? [], isLoading, error, mutate }
}
