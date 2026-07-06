import useSWRMutation from "swr/mutation"
import {
    setEventRecording,
    type EventRecordingRequest,
} from "@/modules/api/rest/event"

/**
 * Params for {@link usePostSetEventRecordingSwr}.
 */
export interface SetEventRecordingParams {
    id: string
    request: EventRecordingRequest
}

/**
 * SWR mutation wrapper for {@link setEventRecording}.
 */
export const usePostSetEventRecordingSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        SetEventRecordingParams
    >("POST_SET_EVENT_RECORDING_SWR", async (_key, { arg }) => {
        return setEventRecording(arg.id, arg.request)
    })

    return swr
}
