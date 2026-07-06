import useSWRMutation from "swr/mutation"
import {
    registerEvent,
    type EventRegistrationView,
} from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link registerEvent}.
 */
export const usePostRegisterEventSwr = () => {
    const swr = useSWRMutation<
        EventRegistrationView,
        Error,
        string,
        string
    >("POST_REGISTER_EVENT_SWR", async (_key, { arg }) => {
        return registerEvent(arg)
    })

    return swr
}
