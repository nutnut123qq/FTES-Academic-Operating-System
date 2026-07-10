import useSWRMutation from "swr/mutation"
import {
    syncTurns,
    type SyncResultView,
    type SyncTurnsParams,
} from "@/modules/api/rest/mockinterview"

/**
 * SWR mutation wrapper for {@link syncTurns}.
 */
export const usePostSyncMockInterviewTurnsSwr = () => {
    const swr = useSWRMutation<SyncResultView, Error, string, SyncTurnsParams>(
        "POST_SYNC_MOCK_INTERVIEW_TURNS_SWR",
        async (_key, { arg }) => {
            return syncTurns(arg.sessionId, arg.request)
        },
    )

    return swr
}
