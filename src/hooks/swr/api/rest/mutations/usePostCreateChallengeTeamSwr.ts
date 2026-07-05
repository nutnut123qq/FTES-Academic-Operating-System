import useSWRMutation from "swr/mutation"
import {
    createChallengeTeam,
    type CreateTeamRequest,
    type TeamView,
} from "@/modules/api/rest/challenges"

/**
 * Params for {@link usePostCreateChallengeTeamSwr}.
 */
export interface CreateChallengeTeamParams {
    /** Challenge id. */
    id: string
    /** Team creation request body. */
    request: CreateTeamRequest
}

/**
 * SWR mutation wrapper for {@link createChallengeTeam}.
 */
export const usePostCreateChallengeTeamSwr = () => {
    const swr = useSWRMutation<
        TeamView,
        Error,
        string,
        CreateChallengeTeamParams
    >(
        "POST_CREATE_CHALLENGE_TEAM_SWR",
        async (_key, { arg }) => {
            return createChallengeTeam(arg.id, arg.request)
        },
    )

    return swr
}
