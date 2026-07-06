"use client"

import useSWR from "swr"
import {
    getContributorScore,
    type ContributorScoreResponse,
} from "@/modules/api/rest/community"

/**
 * SWR query wrapper for {@link getContributorScore}.
 */
export const useGetCommunityContributorScoreSwr = (userId: string) => {
    const swr = useSWR<ContributorScoreResponse, Error>(
        ["GET_COMMUNITY_CONTRIBUTOR_SCORE_SWR", userId],
        () => getContributorScore(userId),
    )

    return swr
}
