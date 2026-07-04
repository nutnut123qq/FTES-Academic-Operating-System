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
    /** Uploaded avatar image URL (optional). */
    avatarUrl: string
    /** Uploaded cover/banner image URL (optional). */
    coverUrl: string
}

// ponytail: mock BE — no profile endpoint yet. Deterministic sample.
// Contract preview: BE will expose avatarUrl + coverUrl for the viewer's profile.
const fetchProfileMock = async (): Promise<Profile> => ({
    name: "Nguyễn Văn Học",
    headline: "Sinh viên · Kỹ thuật phần mềm",
    bio: "Thích lập trình hệ thống và giải thuật. Đang học Fullstack.",
    campus: "FPT University · HN",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&h=400&fit=crop",
    coverUrl: "https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800&h=200&fit=crop",
})

/** Loads the viewer's profile. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfileSwr = () => {
    const { data, isLoading, error } = useSWR(["profile", "me"], () => fetchProfileMock())
    return { profile: data, isLoading, error }
}
