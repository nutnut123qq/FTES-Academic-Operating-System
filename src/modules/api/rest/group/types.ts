/**
 * Request/response DTOs for the group REST controllers.
 *
 * Mirrors the backend records in `vn.ftes.aos.group.web.dto.GroupDtos` and
 * `vn.ftes.aos.community.api.CommunityApi` (for feed/pinned-post slices).
 *
 * All exported names are prefixed with `Group` to avoid collisions in the
 * shared `src/modules/api/rest/index.ts` barrel.
 */

export interface GroupResponse {
    id: string
    name: string
    slug: string
    description?: string
    groupType: string
    visibility: string
    joinPolicy?: string
    subjectId?: string
    campus?: string
    memberCount: number
    status: string
    ownerId: string
    createdAt: string
    /** Signed read URL of the group avatar (null → not set). Change group-identity-media-rules-rsvp. */
    avatarUrl?: string | null
    /** Signed read URL of the group cover (null → not set). */
    coverUrl?: string | null
    /** Group rules as an ordered list of strings (BE stores a JSON array). */
    rules?: Array<string> | null
}

export interface GroupCreateGroupRequest {
    name: string
    groupType: string
    visibility?: string
    joinPolicy?: string
    description?: string
    subjectId?: string
    campus?: string
}

export interface GroupUpdateGroupRequest {
    name?: string
    description?: string
    joinPolicy?: string
    visibility?: string
    rules?: string
}

export interface GroupPage<T> {
    items: T[]
    nextCursor?: string
}

export interface GroupJoinRequestDto {
    message?: string
}

export interface GroupJoinResult {
    result: string
}

export interface GroupJoinRequest {
    id: string
    userId: string
    status: string
    message: string
}

export interface GroupDecisionRequest {
    action: string
}

export interface GroupInviteRequest {
    inviteeId: string
}

export interface GroupRespondInviteRequest {
    action: string
}

export interface GroupRoleChangeRequest {
    role: string
}

export interface GroupTransferOwnershipRequest {
    newOwnerId: string
}

export interface GroupMember {
    userId: string
    role: string
    joinedAt: string
}

export interface GroupAnnouncementRequest {
    title: string
    content: string
    pinned: boolean
}

export interface GroupAnnouncementUpdateRequest {
    title?: string
    content?: string
    pinned?: boolean
}

export interface GroupAnnouncement {
    id: string
    groupId: string
    authorId: string
    title: string
    content: string
    pinned: boolean
    createdAt: string
}

export interface GroupResourceNote {
    note?: string
}

export interface GroupResourceLink {
    resourceId: string
    addedBy: string
    note: string
}

// ---------------- Group events ----------------

/**
 * Mirrors BE `GroupDtos.EventDto`. `attendeeCount` + `attending` are the live RSVP
 * state (change group-identity-media-rules-rsvp): the count reflects real GOING rows
 * and `attending` is true when the caller has RSVP'd.
 */
export interface GroupEvent {
    id: string
    groupId: string
    createdBy: string
    title: string
    description: string
    location?: string
    startsAt: string
    endsAt?: string
    /** Real count of members who RSVP'd GOING. */
    attendeeCount: number
    /** Whether the current caller has RSVP'd GOING. */
    attending: boolean
    createdAt: string
}

// ---------------- Group media (avatar/cover presign → verify) ----------------

/** Body for `POST /groups/{id}/media/presign`. `kind` = `AVATAR` | `COVER`. */
export interface GroupMediaPresignRequest {
    kind: string
    contentType: string
    sizeBytes: number
}

/** Result of presign — `uploadUrl` is where the FE POSTs the raw file. */
export interface GroupMediaPresignResponse {
    kind: string
    storageKey: string
    uploadUrl: string
}

/** Body for `POST /groups/{id}/media/verify`. */
export interface GroupMediaVerifyRequest {
    kind: string
    storageKey: string
}

/** Result of verify — the signed read URL of the now-set image. */
export interface GroupMediaRef {
    kind: string
    url: string
}

// ---------------- Group rules ----------------

/** Body/response for `GET|PUT /groups/{id}/rules`. */
export interface GroupRulesResponse {
    rules: Array<string>
}

// ---------------- Group discussion (change group-social-engagement §2.2) ----------------

/** Mirrors BE `GroupDtos.ThreadDto` — a discussion thread with denormalized counters. */
export interface GroupThreadDto {
    id: string
    groupId: string
    authorId: string
    title: string
    content: string
    replyCount: number
    likeCount: number
    likedByMe: boolean
    lastActivityAt: string
    createdAt: string
}

/** Mirrors BE `GroupDtos.ThreadCommentDto` — a threaded comment (≤ 2 levels). */
export interface GroupThreadCommentDto {
    id: string
    threadId: string
    authorId: string
    parentId?: string | null
    rootId?: string | null
    depth: number
    content: string
    likeCount: number
    likedByMe: boolean
    createdAt: string
}

/** Body for `POST /groups/{id}/discussion/threads`. */
export interface GroupThreadRequest {
    title: string
    content: string
}

/** Body for `POST /groups/{id}/discussion/threads/{threadId}/comments`. */
export interface GroupThreadCommentRequest {
    content: string
    parentId?: string
}

// ---------------- Group challenges (read-only bridge) ----------------

/** Mirrors BE `GroupDtos.ChallengeSummaryDto` (read-only bridge to challenge.api). */
export interface GroupChallengeSummary {
    id: string
    title: string
    slug: string
    type: string
    status: string
}

// ---------------- CommunityApi feed/pinned types ----------------

export interface GroupPostSummary {
    id: string
    authorId: string
    postType: string
    title: string
    status: string
    createdAt: string
    /** Like count (change group-social-engagement — hydrated via community.getPostEngagement). */
    likeCount: number
    /** Comment count. */
    commentCount: number
    /** Whether the current caller has liked this post. */
    likedByMe: boolean
}

export interface GroupFeedSlice {
    items: GroupPostSummary[]
    nextCursor?: string
}
