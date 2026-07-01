"use client"

import useSWR from "swr"

/** A social link entry. */
export interface SocialLink {
    key: "github" | "linkedin" | "website" | "email"
    value: string
}

/** Personal-section detail (mock until BE lands). */
export interface ProfilePersonalDetail {
    about: string
    socials: Array<SocialLink>
}

// ponytail: mock BE — no profile endpoint yet. Deterministic sample.
const fetchPersonalMock = async (): Promise<ProfilePersonalDetail> => ({
    about: "Sinh viên năm 3 ngành Kỹ thuật phần mềm. Quan tâm lập trình hệ thống, giải thuật và DevOps. Đang xây vài dự án cá nhân về công cụ CLI.",
    socials: [
        { key: "github", value: "github.com/vanhoc" },
        { key: "linkedin", value: "linkedin.com/in/vanhoc" },
        { key: "website", value: "vanhoc.dev" },
        { key: "email", value: "vanhoc@example.com" },
    ],
})

/** Loads the viewer's personal detail. Mocked; SWR-shaped for a drop-in BE swap. */
export const useQueryProfilePersonalSwr = () => {
    const { data, isLoading, error } = useSWR(["profile-personal", "me"], () => fetchPersonalMock())
    return { detail: data, isLoading, error }
}
