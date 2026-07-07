"use client"

import useSWR from "swr"

/** Category buckets the AI hub groups tools under (i18n suffix under `aiPlatform.categories.*`). */
export type AiToolCategory = "student" | "learning" | "coding" | "career" | "teacher"

/** A single AI tool tile in the hub (mock shape until the §9 BE contract lands). */
export interface AiTool {
    /** Opaque id (stable, mirrors `key` for now). */
    id: string
    /** Stable slug — drives the i18n lookup `aiPlatform.tools.<key>.{name,desc}`. */
    key: string
    /** Which category bucket this tool renders under. */
    category: AiToolCategory
}

// ponytail: mock BE — §9 AI Platform has no tools endpoint yet. Deterministic list so
// the hub renders; SWR-shaped for a drop-in swap. Wire a real GraphQL query
// (aiTools()) when the contract lands — the hook API stays the same.
const fetchAiToolsMock = async (): Promise<Array<AiTool>> => [
    { id: "tutor", key: "tutor", category: "student" },
    { id: "planner", key: "planner", category: "student" },
    { id: "summary", key: "summary", category: "learning" },
    { id: "flashcards", key: "flashcards", category: "learning" },
    { id: "quiz", key: "quiz", category: "learning" },
    { id: "debug", key: "debug", category: "coding" },
    { id: "cvReview", key: "cvReview", category: "career" },
    { id: "mentor", key: "mentor", category: "teacher" },
]

/** Loads the AI tools hub list. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryAiToolsSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["ai-tools"], () => fetchAiToolsMock())
    return { tools: data ?? [], isLoading, error, mutate }
}
