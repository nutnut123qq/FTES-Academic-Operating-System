"use client"

import useSWR from "swr"

/** A public (read-only) profile view (mock until BE lands). */
export interface PublicProfile {
    username: string
    name: string
    headline: string
    about: string
    campus: string
    skills: Array<string>
    followers: number
}

// ponytail: mock BE — no profile endpoint yet. Derives a deterministic profile
// from the username so any /u/<name> renders.
const fetchPublicProfileMock = async (username: string): Promise<PublicProfile> => ({
    username,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    headline: "Sinh viên · Kỹ thuật phần mềm",
    about: "Đang học Fullstack và System Design. Thích chia sẻ kiến thức trong cộng đồng.",
    campus: "FPT University · HN",
    skills: ["C", "JavaScript", "React", "SQL", "Git"],
    followers: 96,
})

/** Loads a public profile by username. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryPublicProfileSwr = (username: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        ["public-profile", username],
        () => fetchPublicProfileMock(username),
    )
    return { profile: data, isLoading, error, mutate }
}
