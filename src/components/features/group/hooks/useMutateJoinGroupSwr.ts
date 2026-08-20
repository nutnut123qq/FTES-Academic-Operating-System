"use client"

import { useCallback, useState } from "react"
import { unstable_serialize, useSWRConfig } from "swr"
import { joinGroup, removeMember } from "@/modules/api/rest/group"
import { useAppSelector } from "@/redux/hooks"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { groupHeaderKey } from "./useQueryGroupSwr"

/**
 * Membership status the CTA reflects.
 * - `idle`    — not a member (BE `viewerMembership` = null, or no membership signal
 *   is available on this surface and nothing was done this session).
 * - `pending` — optimistic in-flight, or the group requires approval (BE `PENDING`).
 * - `joined`  — the viewer is a member: either the BE reports a `viewerMembership`
 *   role on `GET /groups/{id}`, or a join was accepted immediately (`JOINED`).
 */
export type JoinStatus = "idle" | "pending" | "joined"

/** Options for {@link useMutateJoinGroupSwr}. */
export interface UseMutateJoinGroupOptions {
    /**
     * The viewer's role in the group from `GET /groups/{id}` (`viewerMembership`;
     * null = not a member). Pass it when the surface already holds the group DTO;
     * omit it and the hook falls back to the cached group header, then to the
     * session-local status.
     */
    viewerMembership?: string | null
}

/** Shape read defensively off whatever the group-header SWR cache holds. */
interface CachedGroupHeader {
    viewerMembership?: string | null
}

/**
 * Defensive read of `viewerMembership` from the cached group header.
 *
 * `useQueryGroupSwr` maps the BE `viewerMembership` (`GET /groups/{id}`) onto the
 * `GroupHeader`, so this hits whenever that detail read is already cached — e.g. the
 * buttons rendered under an opened group. On a discover list (whose DTOs carry
 * `viewerMembership: null` by contract) there is no cache entry and it degrades to
 * `null`. It deliberately reads the cache instead of subscribing to a query: a group
 * list renders dozens of these buttons and must not fan out one GET per card.
 */
const readCachedMembership = (
    cache: ReturnType<typeof useSWRConfig>["cache"],
    groupId: string,
): string | null => {
    if (!groupId) {
        return null
    }
    const cached = cache.get(unstable_serialize(groupHeaderKey(groupId)))?.data as
        | CachedGroupHeader
        | undefined
    return cached?.viewerMembership ?? null
}

/**
 * Join / leave a group through the real group REST API, with an optimistic status
 * and the shared toast.
 *
 * Join (`POST /groups/{id}/join`): optimistically flips to `pending`; the BE result
 * resolves to `joined` (open group) or stays `pending` (approval required).
 * Leave (`DELETE /groups/{id}/members/{userId}` with the viewer's OWN user id): the
 * BE `leaveOrKick` treats a self-target as a leave. An OWNER cannot leave (BE
 * `GROUP_OWNER_MUST_TRANSFER`), so owner surfaces must not offer the action.
 *
 * Both roll back to the previous status on failure and revalidate the group header +
 * the discover list, so member counts and `viewerMembership` refresh.
 *
 * @param groupId - the group to join/leave.
 * @param options - optional `viewerMembership` when the caller already has the DTO.
 */
export const useMutateJoinGroupSwr = (groupId: string, options?: UseMutateJoinGroupOptions) => {
    const { requireAuthAsync } = useRequireAuth()
    const runRest = useRestWithToast()
    const { cache, mutate } = useSWRConfig()
    const currentUserId = useAppSelector((state) => state.user.user?.id)
    // Session-local override; null = follow the BE membership signal.
    const [localStatus, setLocalStatus] = useState<JoinStatus | null>(null)
    const [isJoining, setIsJoining] = useState(false)
    const [isLeaving, setIsLeaving] = useState(false)

    const membership =
        options?.viewerMembership !== undefined
            ? options.viewerMembership
            : readCachedMembership(cache, groupId)
    const remoteStatus: JoinStatus = membership ? "joined" : "idle"
    const status: JoinStatus = localStatus ?? remoteStatus

    /** Refresh the surfaces carrying membership state (group header + discover list). */
    const revalidateMembership = useCallback(() => {
        void mutate(groupHeaderKey(groupId))
        void mutate(["GET_GROUPS_DISCOVER"])
    }, [groupId, mutate])

    const join = useCallback(async (): Promise<void> => {
        if (status === "joined" || isJoining || isLeaving) {
            return
        }
        if (!(await requireAuthAsync("auth.context.join"))) {
            return
        }
        const previous = status
        setLocalStatus("pending") // optimistic
        setIsJoining(true)
        const result = await runRest(() => joinGroup(groupId), { showSuccessToast: false })
        setIsJoining(false)
        if (result === null) {
            setLocalStatus(previous) // rollback on failure
            return
        }
        setLocalStatus(result.result === "JOINED" ? "joined" : "pending")
        revalidateMembership()
    }, [groupId, isJoining, isLeaving, requireAuthAsync, revalidateMembership, runRest, status])

    /**
     * Leave the group (self-removal). No-op unless the viewer is currently a member
     * and their internal user id is known — the endpoint is user-scoped.
     *
     * @param successMessage - localized toast copy shown on success.
     */
    const leave = useCallback(
        async (successMessage?: string): Promise<void> => {
            if (status !== "joined" || isLeaving || isJoining) {
                return
            }
            if (!(await requireAuthAsync("auth.context.join"))) {
                return
            }
            if (!currentUserId) {
                return
            }
            const previous = status
            setLocalStatus("idle") // optimistic
            setIsLeaving(true)
            // The endpoint is void — wrap it so a SUCCESSFUL call yields a non-null
            // result (runRest reports failures, and only failures, as `null`).
            const result = await runRest(
                async () => {
                    await removeMember(groupId, currentUserId)
                    return true as const
                },
                { successMessage },
            )
            setIsLeaving(false)
            if (result === null) {
                setLocalStatus(previous) // rollback on failure
                return
            }
            revalidateMembership()
        },
        [
            currentUserId,
            groupId,
            isJoining,
            isLeaving,
            requireAuthAsync,
            revalidateMembership,
            runRest,
            status,
        ],
    )

    return {
        status,
        isJoining,
        isLeaving,
        /** Whether leaving is possible right now (member + known internal user id). */
        canLeave: status === "joined" && Boolean(currentUserId),
        join,
        leave,
    }
}
