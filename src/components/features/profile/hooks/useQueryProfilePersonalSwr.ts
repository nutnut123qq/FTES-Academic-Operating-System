"use client"

import useSWR from "swr"

/** A social link entry. */
export interface SocialLink {
    key: "github" | "linkedin" | "website" | "email"
    value: string
}

/** Structured contact info for the Personal tab. */
export interface ProfileContact {
    email: string
    phone: string
    address: string
}

/** Personal-section detail (mock until BE lands). */
export interface ProfilePersonalDetail {
    about: string
    contact: ProfileContact
    socials: Array<SocialLink>
}

// ponytail: mock BE — no profile endpoint yet. Deterministic sample.
// Contract preview: BE will expose a contact object with email/phone/address.
const fetchPersonalMock = async (): Promise<ProfilePersonalDetail> => ({
    about: "Sinh viên năm 3 ngành Kỹ thuật phần mềm. Quan tâm lập trình hệ thống, giải thuật và DevOps. Đang xây vài dự án cá nhân về công cụ CLI.",
    contact: {
        email: "vanhoc@example.com",
        phone: "+84 912 345 678",
        address: "FPT University · Hòa Lạc, Hà Nội",
    },
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
