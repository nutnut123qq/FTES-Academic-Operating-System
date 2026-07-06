import useSWRMutation from "swr/mutation"
import {
    joinGroup,
    type GroupJoinRequestDto,
    type GroupJoinResult,
} from "@/modules/api/rest/group"

/**
 * SWR mutation wrapper for {@link joinGroup}.
 */
export const usePostJoinGroupSwr = () => {
    const swr = useSWRMutation<
        GroupJoinResult,
        Error,
        string,
        { id: string; request?: GroupJoinRequestDto }
    >("POST_JOIN_GROUP_SWR", async (_key, { arg }) => {
        return joinGroup(arg.id, arg.request)
    })

    return swr
}
