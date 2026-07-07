"use client"

import useSWR from "swr"

/** Academic info fields (mock until BE lands). */
export interface ProfileAcademic {
    university: string
    campus: string
    major: string
    semester: string
    gpa: string
}

// ponytail: mock BE — no profile endpoint yet. Deterministic sample.
const fetchAcademicMock = async (): Promise<ProfileAcademic> => ({
    university: "FPT University",
    campus: "Hà Nội",
    major: "Kỹ thuật phần mềm",
    semester: "Kỳ 5",
    gpa: "8.2 / 10",
})

/** Loads the viewer's academic info. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfileAcademicSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(["profile-academic", "me"], () => fetchAcademicMock())
    return { academic: data, isLoading, error, mutate }
}
