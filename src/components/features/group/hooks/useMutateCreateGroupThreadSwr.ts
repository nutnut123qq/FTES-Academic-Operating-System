"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { createGroupThread } from "@/modules/api/rest/group"
import { matchesGroupThreadsKey } from "./useQueryGroupThreadsSwr"

/**
 * Creates a new discussion thread in a group (`POST /groups/{id}/discussion/threads`
 * — change group-social-engagement §2.2), then revalidates the threads cache so the
 * new thread appears at the top (BE sorts last-active desc).
 *
 * The returned `create` THROWS on REST failure (so a `runRestWithToast` caller shows
 * the error toast); auth-gating is the caller's responsibility (guard with
 * `useRequireAuth` before invoking).
 *
 * @param groupId - the owning group id.
 */
export const useMutateCreateGroupThreadSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()

    const create = useCallback(
        async (title: string, content: string): Promise<void> => {
            await createGroupThread(groupId, { title, content })
            await mutate(matchesGroupThreadsKey(groupId))
        },
        [groupId, mutate],
    )

    return { create }
}
