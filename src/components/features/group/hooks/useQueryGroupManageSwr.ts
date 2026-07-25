"use client"

import { useLocale } from "next-intl"
import useSWR from "swr"
import {
    getGroupRules,
    listJoinRequests,
    listPinnedPosts,
    type GroupJoinRequest,
    type GroupPostSummary,
} from "@/modules/api/rest/group"
import { formatRelativeTime } from "@/components/features/community/hooks/relativeTime"

/** A pending join request (§7). */
export interface JoinRequest {
    id: string
    /** Internal user id of the requester (the key the decision write is scoped by). */
    userId: string
    /** URL-facing username — null while the BE profile join has no handle for the user. */
    username: string | null
    /** Preferred display name — null → the row falls back to the username, then the id. */
    displayName: string | null
    /** Avatar URL from the profile join; null when the user has none. */
    avatarUrl: string | null
    /** Resolved label for the row: displayName ?? username ?? userId (never blank). */
    name: string
    /** Optional message the requester attached to the request. */
    message: string
}

/** A pinned group post (§7). */
export interface PinnedPost {
    id: string
    title: string
    timeLabel: string
}

/** Group management payload. */
export interface GroupManage {
    joinRequests: Array<JoinRequest>
    pinned: Array<PinnedPost>
    /** Group rules read from `GET /groups/{id}/rules` (change group-identity-media-rules-rsvp). */
    rules: Array<string>
}

/** SWR cache key for a group's management data (join requests + pinned posts). */
export const groupManageKey = (groupId: string) => ["group-manage", groupId]

/**
 * Matches every locale variant of a group's management cache key. The live key
 * carries the locale (see {@link useQueryGroupManageSwr}), so the pin/unpin
 * mutation hook must revalidate with this key-filter rather than the bare
 * {@link groupManageKey}, which no longer matches the cached entry exactly.
 */
export const matchesGroupManageKey =
    (groupId: string) =>
    (key: unknown): boolean => {
        const base = groupManageKey(groupId)
        return Array.isArray(key) && key[0] === base[0] && key[1] === base[1]
    }

/**
 * Shape the join-request DTO grew when the BE started attaching the requester's
 * profile card (`GroupDtos.JoinRequestItemDto` → displayName/username/avatarUrl,
 * batch-loaded by `GroupAuthorEnricher`). The shared REST type has not caught up
 * yet, and a user with no profile row still gets nulls back, so every field is
 * read DEFENSIVELY — same treatment as the member rows (`toGroupMemberRow`).
 */
type EnrichedGroupJoinRequest = GroupJoinRequest & {
    displayName?: string | null
    username?: string | null
    avatarUrl?: string | null
}

/** Trims a possibly-missing string field down to `string | null` (blank → null). */
const text = (value: unknown): string | null => {
    if (typeof value !== "string") {
        return null
    }
    const trimmed = value.trim()
    return trimmed.length > 0 ? trimmed : null
}

/**
 * Maps a (possibly enriched) join request onto the row shape. `name` is the
 * resolved label — displayName wins, then the username, and finally the raw user
 * id so an un-enriched request still renders something rather than an empty row.
 */
export const toJoinRequest = (dto: GroupJoinRequest): JoinRequest => {
    const enriched = dto as EnrichedGroupJoinRequest
    const username = text(enriched.username)
    const displayName = text(enriched.displayName)
    return {
        id: dto.id,
        userId: dto.userId,
        username,
        displayName,
        avatarUrl: text(enriched.avatarUrl),
        name: displayName ?? username ?? dto.userId,
        message: dto.message ?? "",
    }
}

const toPinnedPost = (dto: GroupPostSummary, locale: string): PinnedPost => ({
    id: dto.id,
    title: dto.title,
    timeLabel: formatRelativeTime(dto.createdAt, locale),
})

/**
 * Loads a group's management data from the real group REST API: pending join
 * requests, pinned posts, and rules fetched in parallel (change
 * group-identity-media-rules-rsvp — rules are now live).
 */
export const useQueryGroupManageSwr = (groupId: string) => {
    const locale = useLocale()
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? [...groupManageKey(groupId), locale] : null,
        async (): Promise<GroupManage> => {
            const [requests, pinned, rules] = await Promise.all([
                listJoinRequests(groupId, { status: "PENDING", limit: 50 }),
                listPinnedPosts(groupId),
                getGroupRules(groupId),
            ])
            return {
                joinRequests: (requests ?? []).map(toJoinRequest),
                pinned: (pinned ?? []).map((dto) => toPinnedPost(dto, locale)),
                rules: rules?.rules ?? [],
            }
        },
    )
    return {
        joinRequests: data?.joinRequests ?? [],
        rules: data?.rules ?? [],
        pinned: data?.pinned ?? [],
        hasData: data != null,
        isLoading,
        error,
        mutate,
    }
}
