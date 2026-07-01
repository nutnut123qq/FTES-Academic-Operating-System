"use client"

import useSWR from "swr"

/** A subject workspace's identity + progress (mock shape until the BE contract lands). */
export interface Subject {
    /** Opaque id from the route (`[subjectId]`). */
    id: string
    /** Course code shown as the mark, e.g. `PRF192`. */
    code: string
    /** Human name, e.g. "Lập trình C". */
    name: string
    /** Credit count. */
    credits: number
    /** Difficulty label key suffix (`basic` | `intermediate` | `advanced`). */
    difficulty: "basic" | "intermediate" | "advanced"
    /** Lecturer display name. */
    lecturer: string
    /** Completion percent 0..100. */
    progress: number
}

// ponytail: mock BE — the FE has no subject endpoint yet. Returns a deterministic
// subject derived from the id so the shell renders. Wire a real GraphQL query
// (useQuerySubjectSwr -> subjects(id)) when the contract exists; the hook API stays.
const fetchSubjectMock = async (id: string): Promise<Subject> => ({
    id,
    code: id.toUpperCase(),
    name: "Lập trình C",
    credits: 3,
    difficulty: "basic",
    lecturer: "Nguyễn Văn A",
    progress: 62,
})

/**
 * Loads the subject for a workspace. Mocked for now (see note above) but shaped
 * like the real SWR query hooks so callers don't change when the BE lands.
 *
 * @param subjectId - the `[subjectId]` route segment.
 */
export const useQuerySubjectSwr = (subjectId: string) => {
    const { data, isLoading, error } = useSWR(
        ["subject", subjectId],
        () => fetchSubjectMock(subjectId),
    )
    return { subject: data, isLoading, error }
}
