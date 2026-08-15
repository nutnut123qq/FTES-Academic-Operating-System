"use client"

import useSWR from "swr"
import { getPublicProfile } from "@/modules/api/rest/profile"
import type {
    AchievementView,
    AssetView,
    ProjectView,
    PublicProfile as PublicProfileDto,
    SocialLinkView,
} from "@/modules/api/rest/profile"

/** Academic block of a public profile (already privacy-masked by the BE). */
export interface PublicProfileAcademic {
    university: string
    campus: string
    major: string
    /** Current semester, stringified ("" when unset). */
    semester: string
    /** GPA — "" when unset OR when the owner's privacy hides it (`showGpa=false`). */
    gpa: string
    studentCode: string
    /** Enrollment year, stringified ("" when unset). */
    enrollmentYear: string
}

/** A public (read-only) profile view for the `/u/[username]` page. */
export interface PublicProfile {
    /** BE user UUID — the key every *other* module takes (activities, community search). */
    userId: string
    username: string
    name: string
    headline: string
    about: string
    /** Pre-joined "campus · university" line for the hero. */
    campus: string
    skills: Array<string>
    followers: number
    /** Users this profile follows (from `counters.following`). */
    following: number
    avatarUrl: string
    /** Contact email — "" when unset or hidden by the owner's privacy settings. */
    contactEmail: string
    /** Phone — "" when unset or hidden by the owner's privacy settings. */
    phone: string
    /** Structured academic block; `null` when the owner hides it (`showAcademic=false`). */
    academic: PublicProfileAcademic | null
    socialLinks: Array<SocialLinkView>
    projects: Array<ProjectView>
    achievements: Array<AchievementView>
    assets: Array<AssetView>
}

/**
 * Adapts the BE public-profile DTO (`GET /api/v1/profiles/{username}`) into the
 * `/u/[username]` view model.
 *
 * Privacy is applied SERVER-side (`PublicProfileAssembler`): `academic`, `contactEmail`
 * and `phone` arrive as `null` when the owner hides them, and `academic.gpa` is nulled
 * independently of the rest of the block. Every optional field therefore degrades to
 * `""` / `null` here and each card guards on it — the view never fabricates a value.
 *
 * NOT mapped, because the BE cannot populate them today (all three integration ports are
 * `@ConditionalOnMissingBean` stubs in `profile/integration/stub/IntegrationStubConfig`):
 * `progress` (ProgressPort → always `null`), `certificates` (CertificatePort → always
 * `[]`). The BE exposes no free-form "skills" list either, so `skills` stays empty.
 */
export const toPublicProfile = (dto: PublicProfileDto): PublicProfile => ({
    userId: dto.userId,
    username: dto.username,
    name: dto.displayName ?? dto.username,
    headline: dto.jobTitle ?? "",
    about: dto.bio ?? "",
    campus: [dto.academic?.campus, dto.academic?.university].filter(Boolean).join(" · "),
    skills: [],
    followers: dto.counters?.followers ?? 0,
    following: dto.counters?.following ?? 0,
    avatarUrl: dto.avatarUrl ?? "",
    contactEmail: dto.contactEmail ?? "",
    phone: dto.phone ?? "",
    academic: dto.academic
        ? {
            university: dto.academic.university ?? "",
            campus: dto.academic.campus ?? "",
            major: dto.academic.major ?? "",
            semester:
                dto.academic.currentSemester != null
                    ? String(dto.academic.currentSemester)
                    : "",
            gpa: dto.academic.gpa != null ? String(dto.academic.gpa) : "",
            studentCode: dto.academic.studentCode ?? "",
            enrollmentYear:
                dto.academic.enrollmentYear != null
                    ? String(dto.academic.enrollmentYear)
                    : "",
        }
        : null,
    socialLinks: [...(dto.socialLinks ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    projects: [...(dto.projects ?? [])].sort((a, b) => a.sortOrder - b.sortOrder),
    // newest achievement first; rows with no date sink to the bottom
    achievements: [...(dto.achievements ?? [])].sort(
        (a, b) => (b.achievedAt ?? "").localeCompare(a.achievedAt ?? ""),
    ),
    assets: dto.assets ?? [],
})

/** Loads a public profile by username from the real BE (`GET /profiles/{username}`). */
export const useQueryPublicProfileSwr = (username: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        username ? ["public-profile", username] : null,
        () => getPublicProfile(username).then(toPublicProfile),
    )
    return { profile: data, isLoading, error, mutate }
}
