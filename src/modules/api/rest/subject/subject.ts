import { restRequest } from "@/modules/api/rest/client"
import type {
    ChangeRoleRequest,
    CreateLinkRequest,
    CreateSubjectRequest,
    JoinResponse,
    LinkView,
    MemberView,
    MyMembershipView,
    PageResponse,
    PrerequisiteView,
    RelatedView,
    ReplacePrerequisitesRequest,
    ReplaceRelatedRequest,
    StatisticsView,
    SubjectDetail,
    SubjectSummary,
    UpdateLinkRequest,
    UpdateSubjectRequest,
    WorkspaceView,
} from "./types"

// ---------------------------------------------------------------- catalog

/**
 * Lists subjects with optional filters.
 *
 * `GET /api/v1/subjects?semester=&difficulty=&q=&page=&size=`
 */
export const listSubjects = async (params?: {
    semester?: number | null
    difficulty?: string | null
    q?: string | null
    page?: number
    size?: number
}): Promise<PageResponse<SubjectSummary>> => {
    return restRequest<PageResponse<SubjectSummary>>({
        method: "GET",
        url: "/subjects",
        params: {
            semester: params?.semester ?? undefined,
            difficulty: params?.difficulty ?? undefined,
            q: params?.q ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Creates a new subject.
 *
 * `POST /api/v1/subjects`
 */
export const createSubject = async (
    request: CreateSubjectRequest,
): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: "/subjects",
        data: request,
    })
}

/**
 * Returns a single subject by code.
 *
 * `GET /api/v1/subjects/{code}`
 */
export const getSubjectDetail = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "GET",
        url: `/subjects/${code}`,
        authenticated: false,
    })
}

/**
 * Updates subject metadata.
 *
 * `PATCH /api/v1/subjects/{code}`
 */
export const updateSubject = async (
    code: string,
    request: UpdateSubjectRequest,
): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "PATCH",
        url: `/subjects/${code}`,
        data: request,
    })
}

/**
 * Publishes a subject.
 *
 * `POST /api/v1/subjects/{code}/publish`
 */
export const publishSubject = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: `/subjects/${code}/publish`,
    })
}

/**
 * Archives a subject.
 *
 * `POST /api/v1/subjects/{code}/archive`
 */
export const archiveSubject = async (code: string): Promise<SubjectDetail> => {
    return restRequest<SubjectDetail>({
        method: "POST",
        url: `/subjects/${code}/archive`,
    })
}

/**
 * Replaces the prerequisite list of a subject.
 *
 * `PUT /api/v1/subjects/{code}/prerequisites`
 */
export const replaceSubjectPrerequisites = async (
    code: string,
    request: ReplacePrerequisitesRequest,
): Promise<Array<PrerequisiteView>> => {
    return restRequest<Array<PrerequisiteView>>({
        method: "PUT",
        url: `/subjects/${code}/prerequisites`,
        data: request,
    })
}

/**
 * Replaces the related-subject list of a subject.
 *
 * `PUT /api/v1/subjects/{code}/related`
 */
export const replaceSubjectRelated = async (
    code: string,
    request: ReplaceRelatedRequest,
): Promise<Array<RelatedView>> => {
    return restRequest<Array<RelatedView>>({
        method: "PUT",
        url: `/subjects/${code}/related`,
        data: request,
    })
}

// ---------------------------------------------------------------- workspace

/**
 * Returns the full workspace aggregate for a subject.
 *
 * `GET /api/v1/subjects/{code}/workspace`
 */
export const getSubjectWorkspace = async (
    code: string,
): Promise<WorkspaceView> => {
    return restRequest<WorkspaceView>({
        method: "GET",
        url: `/subjects/${code}/workspace`,
        authenticated: false,
    })
}

/**
 * Lists curated links for a subject, optionally filtered by tab.
 *
 * `GET /api/v1/subjects/{code}/links?tab=`
 */
export const getSubjectLinks = async (
    code: string,
    tab?: string | null,
): Promise<Array<LinkView>> => {
    return restRequest<Array<LinkView>>({
        method: "GET",
        url: `/subjects/${code}/links`,
        params: tab ? { tab } : undefined,
        authenticated: false,
    })
}

/**
 * Adds a curated link to a subject.
 *
 * `POST /api/v1/subjects/{code}/links`
 */
export const addSubjectLink = async (
    code: string,
    request: CreateLinkRequest,
): Promise<LinkView> => {
    return restRequest<LinkView>({
        method: "POST",
        url: `/subjects/${code}/links`,
        data: request,
    })
}

/**
 * Updates a curated link.
 *
 * `PATCH /api/v1/subjects/{code}/links/{id}`
 */
export const updateSubjectLink = async (
    code: string,
    id: string,
    request: UpdateLinkRequest,
): Promise<LinkView> => {
    return restRequest<LinkView>({
        method: "PATCH",
        url: `/subjects/${code}/links/${id}`,
        data: request,
    })
}

/**
 * Deletes a curated link.
 *
 * `DELETE /api/v1/subjects/{code}/links/{id}`
 */
export const deleteSubjectLink = async (
    code: string,
    id: string,
): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/links/${id}`,
    })
}

// ---------------------------------------------------------------- membership

/**
 * Lists the current user's subject memberships.
 *
 * `GET /api/v1/subjects/me`
 */
export const getMySubjects = async (): Promise<Array<MyMembershipView>> => {
    return restRequest<Array<MyMembershipView>>({
        method: "GET",
        url: "/subjects/me",
    })
}

/**
 * Joins a subject.
 *
 * `POST /api/v1/subjects/{code}/join`
 */
export const joinSubject = async (code: string): Promise<JoinResponse> => {
    return restRequest<JoinResponse>({
        method: "POST",
        url: `/subjects/${code}/join`,
    })
}

/**
 * Leaves a subject.
 *
 * `DELETE /api/v1/subjects/{code}/membership`
 */
export const leaveSubject = async (code: string): Promise<void> => {
    return restRequest<void>({
        method: "DELETE",
        url: `/subjects/${code}/membership`,
    })
}

/**
 * Lists members of a subject.
 *
 * `GET /api/v1/subjects/{code}/members?role=&page=&size=`
 */
export const getSubjectMembers = async (
    code: string,
    params?: {
        role?: string | null
        page?: number
        size?: number
    },
): Promise<PageResponse<MemberView>> => {
    return restRequest<PageResponse<MemberView>>({
        method: "GET",
        url: `/subjects/${code}/members`,
        params: {
            role: params?.role ?? undefined,
            page: params?.page ?? 0,
            size: params?.size ?? 20,
        },
        authenticated: false,
    })
}

/**
 * Changes the role of a subject member.
 *
 * `PUT /api/v1/subjects/{code}/members/{userId}/role`
 */
export const changeSubjectMemberRole = async (
    code: string,
    userId: string,
    request: ChangeRoleRequest,
): Promise<void> => {
    return restRequest<void>({
        method: "PUT",
        url: `/subjects/${code}/members/${userId}/role`,
        data: request,
    })
}

/**
 * Bans a subject member.
 *
 * `POST /api/v1/subjects/{code}/members/{userId}/ban`
 */
export const banSubjectMember = async (
    code: string,
    userId: string,
): Promise<void> => {
    return restRequest<void>({
        method: "POST",
        url: `/subjects/${code}/members/${userId}/ban`,
    })
}

// ---------------------------------------------------------------- statistics

/**
 * Returns statistics for a subject.
 *
 * `GET /api/v1/subjects/{code}/statistics`
 */
export const getSubjectStatistics = async (
    code: string,
): Promise<StatisticsView> => {
    return restRequest<StatisticsView>({
        method: "GET",
        url: `/subjects/${code}/statistics`,
        authenticated: false,
    })
}
