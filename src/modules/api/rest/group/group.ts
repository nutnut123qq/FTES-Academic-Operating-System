import { restRequest } from "@/modules/api/rest/client"
import type {
    GroupAnnouncement,
    GroupAnnouncementRequest,
    GroupAnnouncementUpdateRequest,
    GroupCreateGroupRequest,
    GroupDecisionRequest,
    GroupFeedSlice,
    GroupInviteRequest,
    GroupJoinRequest,
    GroupJoinRequestDto,
    GroupJoinResult,
    GroupMember,
    GroupPage,
    GroupPostSummary,
    GroupResourceLink,
    GroupResourceNote,
    GroupRespondInviteRequest,
    GroupResponse,
    GroupRoleChangeRequest,
    GroupTransferOwnershipRequest,
    GroupUpdateGroupRequest,
} from "./types"

// ---------------- GroupController ----------------

export const createGroup = async (
    request: GroupCreateGroupRequest,
): Promise<GroupResponse> =>
    restRequest<GroupResponse>({
        method: "POST",
        url: "/groups",
        data: request,
    })

export const getGroup = async (idOrSlug: string): Promise<GroupResponse> =>
    restRequest<GroupResponse>({
        method: "GET",
        url: `/groups/${idOrSlug}`,
        authenticated: true,
    })

export const discoverGroups = async (request?: {
    type?: string
    campus?: string
    q?: string
    cursor?: string
    limit?: number
}): Promise<GroupPage<GroupResponse>> =>
    restRequest<GroupPage<GroupResponse>>({
        method: "GET",
        url: "/groups",
        params: {
            type: request?.type,
            campus: request?.campus,
            q: request?.q,
            cursor: request?.cursor,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const getGroupFeed = async (
    id: string,
    request?: {
        cursor?: string
        limit?: number
    },
): Promise<GroupFeedSlice> =>
    restRequest<GroupFeedSlice>({
        method: "GET",
        url: `/groups/${id}/feed`,
        params: {
            cursor: request?.cursor,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const updateGroup = async (
    id: string,
    request: GroupUpdateGroupRequest,
): Promise<GroupResponse> =>
    restRequest<GroupResponse>({
        method: "PATCH",
        url: `/groups/${id}`,
        data: request,
    })

export const archiveGroup = async (id: string): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/groups/${id}/archive`,
    })

export const joinGroup = async (
    id: string,
    request?: GroupJoinRequestDto,
): Promise<GroupJoinResult> =>
    restRequest<GroupJoinResult>({
        method: "POST",
        url: `/groups/${id}/join`,
        data: request,
    })

export const listJoinRequests = async (
    id: string,
    request?: {
        status?: string
        limit?: number
    },
): Promise<GroupJoinRequest[]> =>
    restRequest<GroupJoinRequest[]>({
        method: "GET",
        url: `/groups/${id}/join-requests`,
        params: {
            status: request?.status,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const decideJoinRequest = async (
    id: string,
    reqId: string,
    request: GroupDecisionRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/groups/${id}/join-requests/${reqId}/decision`,
        data: request,
    })

export const inviteToGroup = async (
    id: string,
    request: GroupInviteRequest,
): Promise<string> =>
    restRequest<string>({
        method: "POST",
        url: `/groups/${id}/invitations`,
        data: request,
    })

export const listGroupMembers = async (
    id: string,
    request?: {
        role?: string
        limit?: number
    },
): Promise<GroupMember[]> =>
    restRequest<GroupMember[]>({
        method: "GET",
        url: `/groups/${id}/members`,
        params: {
            role: request?.role,
            limit: request?.limit,
        },
        authenticated: true,
    })

export const changeMemberRole = async (
    id: string,
    userId: string,
    request: GroupRoleChangeRequest,
): Promise<void> =>
    restRequest<void>({
        method: "PATCH",
        url: `/groups/${id}/members/${userId}`,
        data: request,
    })

export const removeMember = async (id: string, userId: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/members/${userId}`,
    })

export const transferOwnership = async (
    id: string,
    request: GroupTransferOwnershipRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/groups/${id}/transfer-ownership`,
        data: request,
    })

export const createAnnouncement = async (
    id: string,
    request: GroupAnnouncementRequest,
): Promise<GroupAnnouncement> =>
    restRequest<GroupAnnouncement>({
        method: "POST",
        url: `/groups/${id}/announcements`,
        data: request,
    })

export const updateAnnouncement = async (
    id: string,
    announcementId: string,
    request: GroupAnnouncementUpdateRequest,
): Promise<GroupAnnouncement> =>
    restRequest<GroupAnnouncement>({
        method: "PATCH",
        url: `/groups/${id}/announcements/${announcementId}`,
        data: request,
    })

export const deleteAnnouncement = async (
    id: string,
    announcementId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/announcements/${announcementId}`,
    })

export const listAnnouncements = async (
    id: string,
    request?: {
        limit?: number
    },
): Promise<GroupAnnouncement[]> =>
    restRequest<GroupAnnouncement[]>({
        method: "GET",
        url: `/groups/${id}/announcements`,
        params: {
            limit: request?.limit,
        },
        authenticated: true,
    })

export const pinPost = async (id: string, postId: string): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/groups/${id}/pinned-posts/${postId}`,
    })

export const unpinPost = async (id: string, postId: string): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/pinned-posts/${postId}`,
    })

export const listPinnedPosts = async (
    id: string,
): Promise<GroupPostSummary[]> =>
    restRequest<GroupPostSummary[]>({
        method: "GET",
        url: `/groups/${id}/pinned-posts`,
        authenticated: true,
    })

export const linkResource = async (
    id: string,
    resourceId: string,
    request?: GroupResourceNote,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/groups/${id}/resources/${resourceId}`,
        data: request,
    })

export const unlinkResource = async (
    id: string,
    resourceId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/resources/${resourceId}`,
    })

export const listLinkedResources = async (
    id: string,
): Promise<GroupResourceLink[]> =>
    restRequest<GroupResourceLink[]>({
        method: "GET",
        url: `/groups/${id}/resources`,
        authenticated: true,
    })

// ---------------- InvitationController ----------------

export const respondToInvitation = async (
    id: string,
    request: GroupRespondInviteRequest,
): Promise<void> =>
    restRequest<void>({
        method: "POST",
        url: `/invitations/${id}/respond`,
        data: request,
    })
