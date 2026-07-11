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

/** Mirrors BE `GroupDtos.EventDto`. `attendeeCount` is ALWAYS 0 — no RSVP contract. */
export interface GroupEvent {
    id: string
    groupId: string
    createdBy: string
    title: string
    description: string
    location?: string
    startsAt: string
    endsAt?: string
    /** Always 0 — the BE tracks no RSVP/attendance. */
    attendeeCount: number
    createdAt: string
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
}

export interface GroupFeedSlice {
    items: GroupPostSummary[]
    nextCursor?: string
}
