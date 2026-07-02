"use client"

import useSWR from "swr"

import { useQuerySubjectResourcesSwr } from "./useQuerySubjectResourcesSwr"

/** A pickable source (a subject resource or lesson) for summary/quiz/flashcards. */
export interface SubjectAiSource {
    id: string
    title: string
}

/**
 * Loads the pickable sources for a subject's AI generators (summary/quiz/
 * flashcards) — the subject's resources plus a couple of lesson entries. Reuses
 * the subject resources mock; SWR-shaped for a drop-in BE swap. BE assumption
 * (logged): a real BE returns the subject's resource + lesson catalog here.
 *
 * @param subjectId - the `[subjectId]` route segment.
 */
export const useQuerySubjectAiSourcesSwr = (subjectId: string) => {
    const { resources } = useQuerySubjectResourcesSwr(subjectId)

    const { data, isLoading, error, mutate } = useSWR(
        ["subject-ai-sources", subjectId, resources.length],
        async (): Promise<Array<SubjectAiSource>> =>
            resources.map((resource) => ({
                id: resource.id,
                title: resource.title,
            })),
    )

    return { sources: data ?? [], isLoading, error, mutate }
}
