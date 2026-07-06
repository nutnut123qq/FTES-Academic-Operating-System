import useSWRMutation from "swr/mutation"
import {
    manualCheckinEvent,
    type EventManualCheckinRequest,
} from "@/modules/api/rest/event"

/**
 * Params for {@link usePostManualCheckinEventSwr}.
 */
export interface ManualCheckinEventParams {
    id: string
    request: EventManualCheckinRequest
}

/**
 * SWR mutation wrapper for {@link manualCheckinEvent}.
 */
export const usePostManualCheckinEventSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        ManualCheckinEventParams
    >("POST_MANUAL_CHECKIN_EVENT_SWR", async (_key, { arg }) => {
        return manualCheckinEvent(arg.id, arg.request)
    })

    return swr
}
