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
    /** Display name of the requester (falls back to the user id — no profile join). */
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

const toJoinRequest = (dto: GroupJoinRequest): JoinRequest => ({
    id: dto.id,
    name: dto.userId,
    message: dto.message ?? "",
})

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
