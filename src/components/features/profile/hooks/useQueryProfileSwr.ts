"use client"

import useSWR from "swr"

/** A user's profile identity (mock until BE lands). */
export interface Profile {
    name: string
    /** Short headline / role line. */
    headline: string
    bio: string
    /** Campus / school line. */
    campus: string
}

// ponytail: mock BE — no profile endpoint yet. Deterministic sample.
const fetchProfileMock = async (): Promise<Profile> => ({
    name: "Nguyễn Văn Học",
    headline: "Sinh viên · Kỹ thuật phần mềm",
    bio: "Thích lập trình hệ thống và giải thuật. Đang học Fullstack.",
    campus: "FPT University · HN",
})

/** Loads the viewer's profile. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfileSwr = () => {
    const { data, isLoading, error } = useSWR(["profile", "me"], () => fetchProfileMock())
    return { profile: data, isLoading, error }
}
