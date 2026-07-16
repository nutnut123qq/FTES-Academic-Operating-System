"use client"

import { useCallback } from "react"
import { useSWRConfig } from "swr"
import { updateGroupRules } from "@/modules/api/rest/group"
import { matchesGroupManageKey } from "./useQueryGroupManageSwr"

/**
 * Replaces a group's entire rules list (`PUT /groups/{id}/rules` — change
 * group-identity-media-rules-rsvp), then revalidates the manage cache so the editor
 * reflects server truth. THROWS on REST failure so a `runRestWithToast` caller shows
 * the error toast; `group.manage` gating is enforced by the BE.
 *
 * @param groupId - the owning group id.
 */
export const useMutateGroupRulesSwr = (groupId: string) => {
    const { mutate } = useSWRConfig()

    const save = useCallback(
        async (rules: Array<string>): Promise<void> => {
            await updateGroupRules(groupId, rules)
            await mutate(matchesGroupManageKey(groupId))
        },
        [groupId, mutate],
    )

    return { save }
}
