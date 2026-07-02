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
    /**
     * Cover/identity image path (local `/subjects/<code>.png` while mocked) or
     * `null` when the subject has no artwork — required-nullable so every row
     * (and the future BE mapper) makes an explicit decision. `null` (or a load
     * failure) falls back to the code-initials badge.
     */
    imageUrl: string | null
    /**
     * Optional per-subject accent color (CSS color string). Carried in the type
     * + mock only for now — no themed rendering yet (future badge/skeleton tint).
     */
    accentColor?: string
    /**
     * Ids of the Course-module courses linked to this subject (link-out only —
     * the workspace never embeds course content). ponytail: mock BE — rides the
     * real subject query when the contract lands; the hook API stays.
     */
    courseIds: Array<string>
    /**
     * Whether the viewer is a member of this workspace (enrolled in the subject).
     * Gates the AI tools (enroll/join axis — never a separate VIP product). ponytail:
     * mock BE — real BE resolves this from the enrollment of (user, subject). The
     * `swp391` subject is deterministically NON-member so the locked hub state stays
     * reachable in the mock; every other subject is a member.
     */
    isMember: boolean
}

// ponytail: mock BE — the FE has no subject endpoint yet. Returns a deterministic
// subject derived from the id so the shell renders. Wire a real GraphQL query
// (useQuerySubjectSwr -> subjects(id)) when the contract exists; the hook API stays.
// `courseIds` is deterministic too: `swp391` maps to no course so the Overview
// card's absent state stays reachable; every other subject links `<id>-course`.
// `imageUrl` is deterministic from the id (`/subjects/<id-lowercase>.png`);
// `net1704` stays null (mirrors the list mock) so the fallback path is exercised.
const fetchSubjectMock = async (id: string): Promise<Subject> => ({
    id,
    code: id.toUpperCase(),
    name: "Lập trình C",
    credits: 3,
    difficulty: "basic",
    lecturer: "Lê Minh Quân",
    progress: 62,
    imageUrl: id === "net1704" ? null : `/subjects/${id.toLowerCase()}.png`,
    courseIds: id === "swp391" ? [] : [`${id}-course`],
    isMember: id !== "swp391",
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
