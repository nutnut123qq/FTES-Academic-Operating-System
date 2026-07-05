import useSWRMutation from "swr/mutation"
import { joinChallengeTeam } from "@/modules/api/rest/challenges"

/**
 * Params for {@link usePostJoinChallengeTeamSwr}.
 */
export interface JoinChallengeTeamParams {
    /** Challenge id. */
    id: string
    /** Team id to join. */
    teamId: string
}

/**
 * SWR mutation wrapper for {@link joinChallengeTeam}.
 */
export const usePostJoinChallengeTeamSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        JoinChallengeTeamParams
    >(
        "POST_JOIN_CHALLENGE_TEAM_SWR",
        async (_key, { arg }) => {
            return joinChallengeTeam(arg.id, arg.teamId)
        },
    )

    return swr
}
