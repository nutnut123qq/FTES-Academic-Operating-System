import { restRequest } from "@/modules/api/rest/client"
import type {
    GroupAnnouncement,
    GroupAnnouncementRequest,
    GroupAnnouncementUpdateRequest,
    GroupChallengeSummary,
    GroupCreateGroupRequest,
    GroupDecisionRequest,
    GroupEvent,
    GroupFeedSlice,
    GroupInviteRequest,
    GroupJoinRequest,
    GroupJoinRequestDto,
    GroupJoinResult,
    GroupMediaPresignRequest,
    GroupMediaPresignResponse,
    GroupMediaRef,
    GroupMediaVerifyRequest,
    GroupMember,
    GroupPage,
    GroupPostSummary,
    GroupResourceLink,
    GroupResourceNote,
    GroupRespondInviteRequest,
    GroupResponse,
    GroupRoleChangeRequest,
    GroupRulesResponse,
    GroupThreadCommentDto,
    GroupThreadCommentRequest,
    GroupThreadDto,
    GroupThreadRequest,
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

// ---------------- Group events ----------------

export const listGroupEvents = async (
    id: string,
    request?: {
        limit?: number
    },
): Promise<GroupEvent[]> =>
    restRequest<GroupEvent[]>({
        method: "GET",
        url: `/groups/${id}/events`,
        params: {
            limit: request?.limit,
        },
        authenticated: true,
    })

// ---------------- Group challenges (read-only bridge) ----------------

export const getGroupChallenges = async (
    id: string,
): Promise<GroupChallengeSummary[]> =>
    restRequest<GroupChallengeSummary[]>({
        method: "GET",
        url: `/groups/${id}/challenges`,
        authenticated: true,
    })

// ---------------- Group event RSVP (change group-identity-media-rules-rsvp) ----------------

/** RSVP GOING to a group event. Returns the fresh EventDto (count+1, attending=true). */
export const attendGroupEvent = async (
    id: string,
    eventId: string,
): Promise<GroupEvent> =>
    restRequest<GroupEvent>({
        method: "POST",
        url: `/groups/${id}/events/${eventId}/attend`,
    })

/** Cancel RSVP. Returns the fresh EventDto (count−1, attending=false). */
export const unattendGroupEvent = async (
    id: string,
    eventId: string,
): Promise<GroupEvent> =>
    restRequest<GroupEvent>({
        method: "DELETE",
        url: `/groups/${id}/events/${eventId}/attend`,
    })

// ---------------- Group rules (GET/PUT whole list) ----------------

/** Reads a group's rules. Member-gated (PUBLIC: authenticated). */
export const getGroupRules = async (id: string): Promise<GroupRulesResponse> =>
    restRequest<GroupRulesResponse>({
        method: "GET",
        url: `/groups/${id}/rules`,
        authenticated: true,
    })

/** Replaces a group's entire rules list (≤ 30 items, ≤ 300 chars each). `group.manage`. */
export const updateGroupRules = async (
    id: string,
    rules: Array<string>,
): Promise<GroupRulesResponse> =>
    restRequest<GroupRulesResponse>({
        method: "PUT",
        url: `/groups/${id}/rules`,
        data: { rules },
    })

// ---------------- Group media (avatar/cover) presign → upload → verify ----------------

/** Step 1: mint a presigned upload for a group avatar/cover. `group.manage`. */
export const presignGroupMedia = async (
    id: string,
    request: GroupMediaPresignRequest,
): Promise<GroupMediaPresignResponse> =>
    restRequest<GroupMediaPresignResponse>({
        method: "POST",
        url: `/groups/${id}/media/presign`,
        data: request,
    })

/**
 * Step 2: POST the raw file to the presigned `uploadUrl` as multipart/form-data
 * (field `file`, mirroring the upload.ftes.vn `/api/images` contract). `uploadUrl`
 * is an absolute URL to the storage service, so this bypasses `restRequest`
 * (which targets the API base + envelope) and uses a bare `fetch`.
 *
 * @throws Error when the upload responds non-2xx.
 */
export const uploadGroupMediaFile = async (
    uploadUrl: string,
    file: File,
): Promise<void> => {
    const form = new FormData()
    form.append("file", file)
    const response = await fetch(uploadUrl, { method: "POST", body: form })
    if (!response.ok) {
        throw new Error(`group media upload failed (${response.status})`)
    }
}

/** Step 3: confirm the object landed and set it on the group. Returns the signed URL. */
export const verifyGroupMedia = async (
    id: string,
    request: GroupMediaVerifyRequest,
): Promise<GroupMediaRef> =>
    restRequest<GroupMediaRef>({
        method: "POST",
        url: `/groups/${id}/media/verify`,
        data: request,
    })

// ---------------- Group discussion threads (change group-social-engagement §2.2) ----------------

export const listGroupThreads = async (
    id: string,
    request?: { cursor?: string; limit?: number },
): Promise<GroupPage<GroupThreadDto>> =>
    restRequest<GroupPage<GroupThreadDto>>({
        method: "GET",
        url: `/groups/${id}/discussion/threads`,
        params: { cursor: request?.cursor, limit: request?.limit },
        authenticated: true,
    })

export const createGroupThread = async (
    id: string,
    request: GroupThreadRequest,
): Promise<GroupThreadDto> =>
    restRequest<GroupThreadDto>({
        method: "POST",
        url: `/groups/${id}/discussion/threads`,
        data: request,
    })

export const getGroupThread = async (
    id: string,
    threadId: string,
): Promise<GroupThreadDto> =>
    restRequest<GroupThreadDto>({
        method: "GET",
        url: `/groups/${id}/discussion/threads/${threadId}`,
        authenticated: true,
    })

export const deleteGroupThread = async (
    id: string,
    threadId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/discussion/threads/${threadId}`,
    })

export const listGroupThreadComments = async (
    id: string,
    threadId: string,
    request?: { cursor?: string; limit?: number },
): Promise<GroupPage<GroupThreadCommentDto>> =>
    restRequest<GroupPage<GroupThreadCommentDto>>({
        method: "GET",
        url: `/groups/${id}/discussion/threads/${threadId}/comments`,
        params: { cursor: request?.cursor, limit: request?.limit },
        authenticated: true,
    })

export const createGroupThreadComment = async (
    id: string,
    threadId: string,
    request: GroupThreadCommentRequest,
): Promise<GroupThreadCommentDto> =>
    restRequest<GroupThreadCommentDto>({
        method: "POST",
        url: `/groups/${id}/discussion/threads/${threadId}/comments`,
        data: request,
    })

export const deleteGroupThreadComment = async (
    id: string,
    commentId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/discussion/comments/${commentId}`,
    })

/** Toggle-on LIKE on a discussion thread (idempotent). */
export const likeGroupThread = async (
    id: string,
    threadId: string,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/groups/${id}/discussion/threads/${threadId}/reactions`,
    })

export const unlikeGroupThread = async (
    id: string,
    threadId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/discussion/threads/${threadId}/reactions`,
    })

/** Toggle-on LIKE on a discussion thread comment (idempotent). */
export const likeGroupThreadComment = async (
    id: string,
    commentId: string,
): Promise<void> =>
    restRequest<void>({
        method: "PUT",
        url: `/groups/${id}/discussion/comments/${commentId}/reactions`,
    })

export const unlikeGroupThreadComment = async (
    id: string,
    commentId: string,
): Promise<void> =>
    restRequest<void>({
        method: "DELETE",
        url: `/groups/${id}/discussion/comments/${commentId}/reactions`,
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
