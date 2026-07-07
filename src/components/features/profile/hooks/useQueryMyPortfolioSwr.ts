"use client"

import useSWR from "swr"
import { getSelfProfile } from "@/modules/api/rest/profile"
import type { SelfProfile } from "@/modules/api/rest/profile"
import { SELF_PROFILE_KEY } from "./useQueryProfileSwr"

/** A portfolio project. */
export interface MyPortfolioProject {
    id: string
    title: string
    description: string
    /** Tech tags shown as chips. */
    tags: Array<string>
    /** External URL of the project (repo / demo). */
    url: string
    /** Whether the project is pinned to the top of the profile. */
    pinned: boolean
}

/** An external profile link (GitHub, LinkedIn, …). */
export interface MyPortfolioLink {
    id: string
    label: string
    url: string
}

/** Resume/CV document attached to the profile. */
export interface MyPortfolioResume {
    /** URL to view/download the resume. */
    url: string
    /** Display filename. */
    filename: string
    /** ISO date the resume was uploaded. */
    uploadedAt: string
}

/** A certificate earned by the learner. */
export interface MyPortfolioCertificate {
    id: string
    /** Certificate name. */
    name: string
    /** Issuing organization. */
    issuer: string
    /** ISO date issued. */
    date: string
    /** External verification link. */
    url: string
}

/** An achievement / badge earned by the learner. */
export interface MyPortfolioAchievement {
    id: string
    /** Achievement title. */
    title: string
    /** Short description. */
    description: string
    /** ISO date earned. */
    earnedDate: string
    /** Category used for grouping (learning, skills, community, course, other). */
    category: "learning" | "skills" | "community" | "course" | "other"
}

/** Portfolio payload for the profile Portfolio tab. */
export interface MyPortfolio {
    projects: Array<MyPortfolioProject>
    links: Array<MyPortfolioLink>
    resume: MyPortfolioResume | null
    certificates: Array<MyPortfolioCertificate>
    achievements: Array<MyPortfolioAchievement>
}

/**
 * Adapts the BE `SelfProfile` DTO into the Portfolio-tab model. Projects, social
 * links, and achievements come straight from `GET /api/v1/profiles/me`. The BE
 * self profile carries no resume and no certificates (certificates live on the
 * public profile only), so those degrade to empty — the tab renders their empty
 * states rather than fabricating rows.
 */
export const toPortfolio = (profile: SelfProfile): MyPortfolio => ({
    projects: (profile.projects ?? []).map((project) => ({
        id: project.id,
        title: project.title,
        description: project.description ?? "",
        tags: project.techStack ?? [],
        url: project.repoUrl ?? project.demoUrl ?? "",
        pinned: project.highlighted,
    })),
    links: (profile.socialLinks ?? []).map((link) => ({
        id: link.id,
        label: link.platform,
        url: link.url,
    })),
    // BE self profile has no resume attachment.
    resume: null,
    // Certificates are exposed on the public profile only, not on /me.
    certificates: [],
    achievements: (profile.achievements ?? []).map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description ?? "",
        earnedDate: achievement.achievedAt ?? "",
        // The BE achievement `source` is not one of the FE grouping buckets.
        category: "other",
    })),
})

/** Loads the viewer's portfolio from the real BE (`GET /profiles/me`). */
export const useQueryMyPortfolioSwr = () => {
    const { data, isLoading, error, mutate } = useSWR(SELF_PROFILE_KEY, getSelfProfile)
    return { data: data ? toPortfolio(data) : undefined, isLoading, error, mutate }
}
