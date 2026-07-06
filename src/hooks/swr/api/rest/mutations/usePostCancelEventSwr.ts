import useSWRMutation from "swr/mutation"
import { cancelEvent } from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link cancelEvent}.
 */
export const usePostCancelEventSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_CANCEL_EVENT_SWR",
        async (_key, { arg }) => {
            return cancelEvent(arg)
        },
    )

    return swr
}
