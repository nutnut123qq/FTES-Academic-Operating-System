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
    /**
     * The CALLER's role in the group (`OWNER` / `ADMIN` / `MODERATOR` / `MEMBER`),
     * `null` when the caller is not a member or is anonymous. Only the detail read
     * (`GET /groups/{id}`) resolves it — the create/update/discover mappers send
     * `null` (BE `GroupMapper.toGroup`).
     */
    viewerMembership?: string | null
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

/**
 * Trimmed group card carried by an invitation row — enough to render and navigate
 * (name + id) without exposing the rules/owner of a group the invitee has not joined.
 */
export interface GroupInvitationGroupCard {
    id: string
    name: string
    slug: string
    avatarUrl?: string | null
}

/** Person shown on an invitation row; `null` fields when they have no profile yet. */
export interface GroupInvitationUserCard {
    userId: string
    username?: string | null
    displayName?: string | null
    avatarUrl?: string | null
}

/**
 * One pending invitation in the caller's inbox (`GET /invitations/me`).
 *
 * The row is self-contained on purpose — group card, inviter card and both timestamps
 * ship with it — so the inbox renders a full row (and answers it via `invitationId`)
 * without a follow-up `/groups/{id}` or profile lookup. `inviter` is `null` when the
 * person who invited has no profile; `expiresAt` is `null` for an open-ended invite.
 */
export interface GroupMyInvitation {
    invitationId: string
    group: GroupInvitationGroupCard
    inviter?: GroupInvitationUserCard | null
    status: string
    createdAt: string
    expiresAt?: string | null
}

export interface GroupRoleChangeRequest {
    role: string
}

export interface GroupTransferOwnershipRequest {
    newOwnerId: string
}

/**
 * A membership row (BE `GroupDtos.MemberDto`). The identity fields are FLAT here, not a
 * nested {@link GroupUserCard}: the BE enriches the row through the same
 * `GroupAuthorEnricher` and then spreads the card out. Every one of them is nullable —
 * a user with no profile row still gets a row back, with nulls.
 */
export interface GroupMember {
    userId: string
    /** Role INSIDE the group (OWNER/ADMIN/MODERATOR/MEMBER) — not a platform role. */
    role: string
    joinedAt: string
    displayName?: string | null
    username?: string | null
    avatarUrl?: string | null
    /** Platform staff role — see {@link GroupUserCard.staffRole}. Distinct from `role`. */
    staffRole?: string | null
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
/**
 * Body for `POST /groups/{id}/events` (BE `GroupDtos.EventRequest`).
 * `title`/`description`/`startsAt` are required; `startsAt`/`endsAt` are ISO-8601
 * instants (`Instant`, e.g. `2026-08-01T09:00:00Z`).
 */
export interface GroupEventRequest {
    title: string
    description: string
    location?: string
    startsAt: string
    endsAt?: string
}

/**
 * Body for `PATCH /groups/{id}/events/{eventId}` (BE `GroupDtos.EventUpdateRequest`).
 * Partial update: an omitted/null field keeps its current value.
 */
export interface GroupEventUpdateRequest {
    title?: string
    description?: string
    location?: string
    startsAt?: string
    endsAt?: string
}

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

/**
 * Which group image an operation targets. The BE takes the value as a path/body string
 * and matches it case-insensitively, but the FE keeps the pair closed so a typo cannot
 * reach the wire.
 */
export type GroupMediaKind = "AVATAR" | "COVER"

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
    /**
     * Author display card, batch-loaded per page by the BE `GroupAuthorEnricher`.
     * `null` when the author has no profile row — the BE deliberately sends no card
     * rather than inventing an "unknown" one.
     */
    author?: GroupUserCard | null
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
    /** Author display card (see {@link GroupThreadDto.author}); replies carry it too. */
    author?: GroupUserCard | null
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

/**
 * Display card for a user, mirrors BE `GroupDtos.UserCard` (loaded per page in one batch
 * by `GroupAuthorEnricher`). NULL when that user has no profile row — callers must render
 * a generic member label then, never the raw `authorId`.
 */
export interface GroupUserCard {
    userId: string
    username: string | null
    displayName: string | null
    avatarUrl: string | null
    /**
     * Platform staff role (BE `GroupDtos.UserCard.staffRole`, batch-resolved by
     * `GroupAuthorEnricher` via `AccessControl.publicStaffRoles`) — drives the verified
     * seal. `"SUPER_ADMIN" | "ADMIN" | "MODERATOR"`, `null` for an ordinary member.
     *
     * NOT the same thing as {@link GroupMember.role}, which is the role INSIDE the group.
     */
    staffRole: string | null
}

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
    /**
     * Author display card (BE `GroupPostSummary.author`, change group-social-engagement
     * §3.1). Optional here because it is a THEN-added field and older cached payloads may
     * lack it; `null` when the author has no profile row.
     */
    author?: GroupUserCard | null
}

export interface GroupFeedSlice {
    items: GroupPostSummary[]
    nextCursor?: string
}
