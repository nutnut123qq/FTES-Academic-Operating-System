import useSWRMutation from "swr/mutation"
import { submitEvent } from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link submitEvent}.
 */
export const usePostSubmitEventSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_SUBMIT_EVENT_SWR",
        async (_key, { arg }) => {
            return submitEvent(arg)
        },
    )

    return swr
}
