import useSWRMutation from "swr/mutation"
import {
    scanEventCheckin,
    type EventScanRequest,
} from "@/modules/api/rest/event"

/**
 * SWR mutation wrapper for {@link scanEventCheckin}.
 */
export const usePostScanEventCheckinSwr = () => {
    const swr = useSWRMutation<void, Error, string, EventScanRequest>(
        "POST_SCAN_EVENT_CHECKIN_SWR",
        async (_key, { arg }) => {
            return scanEventCheckin(arg)
        },
    )

    return swr
}
