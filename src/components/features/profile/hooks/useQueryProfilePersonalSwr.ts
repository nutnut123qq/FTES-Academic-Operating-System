"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { SelfProfile } from "@/modules/api/rest/profile"
import { SELF_PROFILE_KEY } from "./useQueryProfileSwr"

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

/** Personal-section detail. */
export interface ProfilePersonalDetail {
    about: string
    contact: ProfileContact
    socials: Array<SocialLink>
}

/** Maps a BE social-link `platform` string onto the FE's icon key set. */
const toSocialKey = (platform: string): SocialLink["key"] => {
    const normalized = platform.toLowerCase()
    if (normalized.includes("github")) return "github"
    if (normalized.includes("linkedin")) return "linkedin"
    if (normalized.includes("mail")) return "email"
    return "website"
}

/**
 * Adapts the BE `SelfProfile` DTO into the Personal-tab model: bio → about, the
 * flat contact fields → a contact object, and the BE social links → the FE's
 * keyed link list. Missing values degrade to empty (the tab renders empty-state
 * cards for each blank section).
 */
export const toPersonalDetail = (profile: SelfProfile): ProfilePersonalDetail => ({
    about: profile.bio ?? "",
    contact: {
        email: profile.contactEmail ?? "",
        phone: profile.phone ?? "",
        address: profile.address ?? "",
    },
    socials: (profile.socialLinks ?? []).map((link) => ({
        key: toSocialKey(link.platform),
        value: link.url,
    })),
})

/** Loads the viewer's personal detail from the real BE (`GET /profiles/me`). */
export const useQueryProfilePersonalSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)
    return { detail: data ? toPersonalDetail(data) : undefined, isLoading, error, mutate }
}
