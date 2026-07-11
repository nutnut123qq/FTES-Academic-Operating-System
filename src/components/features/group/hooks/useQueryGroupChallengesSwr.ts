"use client"

import useSWR from "swr"
import { getGroupChallenges } from "@/modules/api/rest/group"

/** A group challenge summary mapped to the row contract (§7/§10, read-only bridge). */
export interface GroupChallenge {
    id: string
    title: string
    /** Challenge type (BE `type`, e.g. CODING / PROJECT). */
    type: string
    /** Lifecycle status (BE `status`, e.g. ACTIVE / CLOSED). */
    status: string
}

/**
 * Loads a group's challenges from the real group REST API
 * (`GET /api/v1/groups/{id}/challenges`) — a read-only bridge to the challenge
 * module. The BE `ChallengeSummaryDto` carries no deadline/participant count, so
 * the row surfaces `type` + `status` instead.
 */
export const useQueryGroupChallengesSwr = (groupId: string) => {
    const { data, isLoading, error, mutate } = useSWR(
        groupId ? ["GET_GROUP_CHALLENGES", groupId] : null,
        async (): Promise<Array<GroupChallenge>> => {
            const items = await getGroupChallenges(groupId)
            return (items ?? []).map((dto) => ({
                id: dto.id,
                title: dto.title,
                type: dto.type,
                status: dto.status,
            }))
        },
    )
    return { challenges: data ?? [], isLoading, error, mutate }
}
