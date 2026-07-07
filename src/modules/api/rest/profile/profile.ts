import { restRequest } from "@/modules/api/rest/client"
import type {
    AssetView,
    CursorPage,
    ProfileAchievementRequest,
    ProfilePrivacySettings,
    ProfileProjectCreateRequest,
    ProfileProjectRequest,
    ProfileReplaceSocialLinksRequest,
    ProfileUpdateRequest,
    ProjectView,
    AchievementView,
    SelfProfile,
    TimelineEntry,
} from "./types"

// ---------------------------------------------------------------- MeProfileController

/**
 * Returns the current user's full self profile (rich fields not present on the
 * GraphQL `Viewer`: email, bio, jobTitle, address, social links, academic, …).
 *
 * `GET /api/v1/profiles/me` (authenticated).
 */
export const getSelfProfile = async (): Promise<SelfProfile> => {
    return restRequest<SelfProfile>({
        method: "GET",
        url: "/profiles/me",
        authenticated: true,
    })
}

/**
 * Uploads a new avatar image for the current user.
 *
 * `PUT /api/v1/profiles/me/avatar`
 */
export const uploadAvatar = async (file: File): Promise<SelfProfile> => {
    const formData = new FormData()
    formData.append("file", file)
    return restRequest<SelfProfile>({
        method: "PUT",
        url: "/profiles/me/avatar",
        data: formData,
        headers: { "Content-Type": null as unknown as string },
    })
}

/**
 * Uploads a new cover image for the current user.
 *
 * `PUT /api/v1/profiles/me/cover`
 */
export const uploadCover = async (file: File): Promise<SelfProfile> => {
    const formData = new FormData()
    formData.append("file", file)
    return restRequest<SelfProfile>({
        method: "PUT",
        url: "/profiles/me/cover",
        data: formData,
        headers: { "Content-Type": null as unknown as string },
    })
}

/**
 * Replaces the current user's social links.
 *
 * `PUT /api/v1/profiles/me/social-links`
 */
export const replaceSocialLinks = async (
    request: ProfileReplaceSocialLinksRequest,
): Promise<SelfProfile> => {
    return restRequest<SelfProfile>({
        method: "PUT",
        url: "/profiles/me/social-links",
        data: request,
    })
}

/**
 * Returns the current user's privacy settings.
 *
 * `GET /api/v1/profiles/me/privacy`
 */
export const getPrivacySettings = async (): Promise<ProfilePrivacySettings> => {
    return restRequest<ProfilePrivacySettings>({
        method: "GET",
        url: "/profiles/me/privacy",
    })
}

/**
 * Updates the current user's privacy settings.
 *
 * `PUT /api/v1/profiles/me/privacy`
 */
export const updatePrivacySettings = async (
    request: ProfilePrivacySettings,
): Promise<ProfilePrivacySettings> => {
    return restRequest<ProfilePrivacySettings>({
        method: "PUT",
        url: "/profiles/me/privacy",
        data: request,
    })
}

/**
 * Creates a portfolio project for the current user.
 *
 * `POST /api/v1/profiles/me/portfolio/projects`
 */
export const createPortfolioProject = async (
    request: ProfileProjectCreateRequest,
): Promise<ProjectView> => {
    return restRequest<ProjectView>({
        method: "POST",
        url: "/profiles/me/portfolio/projects",
        data: request,
    })
}

/**
 * Updates a portfolio project for the current user.
 *
 * `PATCH /api/v1/profiles/me/portfolio/projects/{id}`
 */
export const updatePortfolioProject = async (
    id: string,
    request: ProfileProjectRequest,
): Promise<ProjectView> => {
    return restRequest<ProjectView>({
        method: "PATCH",
        url: `/profiles/me/portfolio/projects/${id}`,
        data: request,
    })
}

/**
 * Deletes a portfolio project for the current user.
 *
 * `DELETE /api/v1/profiles/me/portfolio/projects/{id}`
 */
export const deletePortfolioProject = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/profiles/me/portfolio/projects/${id}`,
    })
}

/**
 * Uploads a portfolio asset for the current user.
 *
 * `POST /api/v1/profiles/me/portfolio/assets`
 */
export const uploadPortfolioAsset = async (
    file: File,
    type?: string | null,
    title?: string | null,
): Promise<AssetView> => {
    const formData = new FormData()
    formData.append("file", file)
    if (type !== undefined && type !== null) {
        formData.append("type", type)
    }
    if (title !== undefined && title !== null) {
        formData.append("title", title)
    }
    return restRequest<AssetView>({
        method: "POST",
        url: "/profiles/me/portfolio/assets",
        data: formData,
        headers: { "Content-Type": null as unknown as string },
    })
}

/**
 * Deletes a portfolio asset for the current user.
 *
 * `DELETE /api/v1/profiles/me/portfolio/assets/{id}`
 */
export const deletePortfolioAsset = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/profiles/me/portfolio/assets/${id}`,
    })
}

/**
 * Adds a self-declared achievement for the current user.
 *
 * `POST /api/v1/profiles/me/achievements`
 */
export const addAchievement = async (
    request: ProfileAchievementRequest,
): Promise<AchievementView> => {
    return restRequest<AchievementView>({
        method: "POST",
        url: "/profiles/me/achievements",
        data: request,
    })
}

/**
 * Deletes a self-declared achievement for the current user.
 *
 * `DELETE /api/v1/profiles/me/achievements/{id}`
 */
export const deleteAchievement = async (id: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/profiles/me/achievements/${id}`,
    })
}

// ---------------------------------------------------------------- PublicProfileController

/**
 * Returns the activity timeline for a public profile.
 *
 * `GET /api/v1/profiles/{username}/timeline?cursor=&limit=`
 */
export const getProfileTimeline = async (
    username: string,
    params?: {
        cursor?: string | null
        limit?: number
    },
): Promise<CursorPage<TimelineEntry>> => {
    return restRequest<CursorPage<TimelineEntry>>({
        method: "GET",
        url: `/profiles/${username}/timeline`,
        params: {
            cursor: params?.cursor ?? undefined,
            limit: params?.limit ?? 10,
        },
    })
}

/**
 * Moderates another user's profile (requires `profile.update.any`).
 *
 * `PATCH /api/v1/profiles/{userId}/moderate`
 */
export const moderateProfile = async (
    userId: string,
    request: ProfileUpdateRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PATCH",
        url: `/profiles/${userId}/moderate`,
        data: request,
    })
}
