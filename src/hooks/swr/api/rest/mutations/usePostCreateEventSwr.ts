import useSWRMutation from "swr/mutation"
import {
    createEvent,
    type CreateEventRequest,
} from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link createEvent}.
 */
export const usePostCreateEventSwr = () => {
    const swr = useSWRMutation<string, Error, string, CreateEventRequest>(
        "POST_CREATE_EVENT_SWR",
        async (_key, { arg }) => {
            return createEvent(arg)
        },
    )

    return swr
}
