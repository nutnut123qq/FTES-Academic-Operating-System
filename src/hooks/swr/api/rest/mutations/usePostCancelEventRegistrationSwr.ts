import useSWRMutation from "swr/mutation"
import { cancelEventRegistration } from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link cancelEventRegistration}.
 */
export const usePostCancelEventRegistrationSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_CANCEL_EVENT_REGISTRATION_SWR",
        async (_key, { arg }) => {
            return cancelEventRegistration(arg)
        },
    )

    return swr
}
