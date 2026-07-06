/**
 * Request/response DTOs for the profile REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.profile.web.dto.ProfileViews` and the
 * request DTOs in the same package.
 */

/** Cursor-paginated page. */
export interface CursorPage<T> {
    items: Array<T>
    nextCursor: string | null
}

/** Academic section of a profile. */
export interface AcademicSection {
    university: string | null
    campus: string | null
    major: string | null
    currentSemester: number | null
    gpa: number | null
    studentCode: string | null
    enrollmentYear: number | null
}

/** One social link on a profile. */
export interface SocialLinkView {
    id: string
    platform: string
    url: string
    sortOrder: number
}

/** Input for one social link (replace-all). */
export interface ProfileSocialLinkInput {
    platform: string
    url: string
    sortOrder?: number | null
}

/** One portfolio project. */
export interface ProjectView {
    id: string
    title: string
    description: string | null
    repoUrl: string | null
    demoUrl: string | null
    thumbnailUrl: string | null
    techStack: Array<string>
    subjectCode: string | null
    highlighted: boolean
    sortOrder: number
}

/** One portfolio asset. */
export interface AssetView {
    id: string
    type: string | null
    title: string | null
    fileUrl: string
    mimeType: string | null
}

/** One achievement on a profile. */
export interface AchievementView {
    id: string
    source: string
    title: string
    description: string | null
    iconUrl: string | null
    achievedAt: string | null
}

/** A certificate shown on a public profile. */
export interface ProfileCertificateView {
    code: string
    name: string
    issueDate: string
}

/** Gamification progress shown on a public profile. */
export interface ProfileProgressView {
    xp: number
    level: number
    reputation: number
    coinBalance: number
}

/** Follower/following counters. */
export interface FollowCounters {
    followers: number
    following: number
}

/** One entry in a followers/following list. */
export interface FollowEntry {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
}

/** Full self profile (GET /api/v1/profiles/me). */
export interface SelfProfile {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    coverUrl: string | null
    bio: string | null
    jobTitle: string | null
    contactEmail: string | null
    phone: string | null
    address: string | null
    dateOfBirth: string | null
    gender: string | null
    academic: AcademicSection | null
    socialLinks: Array<SocialLinkView>
    projects: Array<ProjectView>
    assets: Array<AssetView>
    achievements: Array<AchievementView>
    privacy: ProfilePrivacySettings
    createdAt: string
    updatedAt: string
}

/** Public profile view (GET /api/v1/profiles/{username}). */
export interface PublicProfile {
    userId: string
    username: string
    displayName: string | null
    avatarUrl: string | null
    coverUrl: string | null
    bio: string | null
    jobTitle: string | null
    contactEmail: string | null
    phone: string | null
    academic: AcademicSection | null
    socialLinks: Array<SocialLinkView>
    projects: Array<ProjectView>
    assets: Array<AssetView>
    achievements: Array<AchievementView>
    certificates: Array<ProfileCertificateView>
    progress: ProfileProgressView | null
    counters: FollowCounters
}

/** Body of `PATCH /api/v1/profiles/me` (null fields are ignored). */
export interface ProfileUpdateRequest {
    displayName?: string | null
    bio?: string | null
    jobTitle?: string | null
    contactEmail?: string | null
    phone?: string | null
    address?: string | null
    dateOfBirth?: string | null
    gender?: string | null
    university?: string | null
    campus?: string | null
    major?: string | null
    currentSemester?: number | null
    gpa?: number | null
    studentCode?: string | null
    enrollmentYear?: number | null
}

/** Body of `PUT /api/v1/profiles/me/social-links`. */
export interface ProfileReplaceSocialLinksRequest {
    links: Array<ProfileSocialLinkInput>
}

/** Privacy settings read/write. */
export interface ProfilePrivacySettings {
    profileVisibility: string | null
    showEmail: boolean | null
    showPhone: boolean | null
    showGpa: boolean | null
    showAcademic: boolean | null
    showProgress: boolean | null
    showTimeline: boolean | null
    showFollowers: boolean | null
}

/** Body of `PATCH /api/v1/profiles/me/portfolio/projects/{id}`. */
export interface ProfileProjectRequest {
    title?: string | null
    description?: string | null
    repoUrl?: string | null
    demoUrl?: string | null
    thumbnailUrl?: string | null
    techStack?: Array<string>
    subjectCode?: string | null
    highlighted?: boolean | null
    sortOrder?: number | null
}

/** Body of `POST /api/v1/profiles/me/portfolio/projects`. */
export interface ProfileProjectCreateRequest {
    title: string
    description?: string | null
    repoUrl?: string | null
    demoUrl?: string | null
    thumbnailUrl?: string | null
    techStack?: Array<string>
    subjectCode?: string | null
    highlighted?: boolean | null
    sortOrder?: number | null
}

/** Body of `POST /api/v1/profiles/me/achievements`. */
export interface ProfileAchievementRequest {
    title: string
    description?: string | null
    iconUrl?: string | null
}

/** One timeline entry. */
export interface TimelineEntry {
    eventId: string
    type: string
    summary: string
    occurredAt: string
}
