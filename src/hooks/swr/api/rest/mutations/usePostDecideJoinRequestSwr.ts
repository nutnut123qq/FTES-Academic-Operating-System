import useSWRMutation from "swr/mutation"
import {
    decideJoinRequest,
    type GroupDecisionRequest,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link decideJoinRequest}.
 */
export const usePostDecideJoinRequestSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; reqId: string; request: GroupDecisionRequest }
    >("POST_DECIDE_JOIN_REQUEST_SWR", async (_key, { arg }) => {
        return decideJoinRequest(arg.id, arg.reqId, arg.request)
    })

    return swr
}
