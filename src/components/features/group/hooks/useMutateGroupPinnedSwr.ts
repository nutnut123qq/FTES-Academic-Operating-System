"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { pinPost, unpinPost } from "@/modules/api/rest/group"
import { useRequireAuth } from "@/hooks/useRequireAuth"
import { useRestWithToast } from "@/modules/toast/hooks"
import { matchesGroupManageKey } from "./useQueryGroupManageSwr"

/**
 * Pin / unpin a group post against the real group REST API. Both revalidate the
 * shared `["group-manage", groupId]` cache so the management "Pinned" section
 * reflects the change. Guests get the `AuthenticationModal` and nothing runs.
 *
 * Pin is idempotent on the BE (PUT), so the feed can pin without knowing the
 * current pinned set; unpin (DELETE) is exposed for the management list.
 *
 * @param groupId - the owning group id.
 */
export const useMutateGroupPinnedSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()
    const { requireAuth } = useRequireAuth()
    const runRest = useRestWithToast()

    const pin = useCallback(
        async (postId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const ok = await runRest(() => pinPost(groupId, postId))
            if (ok !== null) {
                await mutate(matchesGroupManageKey(groupId))
                return true
            }
            return false
        },
        [groupId, mutate, requireAuth, runRest],
    )

    const unpin = useCallback(
        async (postId: string): Promise<boolean> => {
            if (!requireAuth("auth.context.generic")) {
                return false
            }
            const ok = await runRest(() => unpinPost(groupId, postId))
            if (ok !== null) {
                await mutate(matchesGroupManageKey(groupId))
                return true
            }
            return false
        },
        [groupId, mutate, requireAuth, runRest],
    )

    return { pin, unpin }
}
