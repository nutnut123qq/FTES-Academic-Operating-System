"use client"

import useSWR from "swr"

/** A related career path entry. */
export interface RelatedCareer {
    id: string
    title: string
    /** Demand label key suffix (`high` | `medium` | `low`). */
    demand: "high" | "medium" | "low"
}

/** Career-bridge payload for a subject (§21, mock until BE lands). */
export interface SubjectCareer {
    skills: Array<string>
    careers: Array<RelatedCareer>
    nextSubject: { code: string; name: string }
}

// ponytail: mock BE — no career endpoint yet. Deterministic sample.
const fetchCareerMock = async (): Promise<SubjectCareer> => ({
    skills: ["C", "Con trỏ", "Cấu trúc dữ liệu", "Giải thuật", "Quản lý bộ nhớ"],
    careers: [
        { id: "c1", title: "Embedded Engineer", demand: "high" },
        { id: "c2", title: "Backend Developer", demand: "high" },
        { id: "c3", title: "Systems Programmer", demand: "medium" },
    ],
    nextSubject: { code: "CSD201", name: "Cấu trúc dữ liệu & Giải thuật" },
})

/** Loads a subject's career bridge. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQuerySubjectCareerSwr = (subjectId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["subject-career", subjectId],
        () => fetchCareerMock(),
    )
    return { career: data, isLoading, error, mutate }
}
