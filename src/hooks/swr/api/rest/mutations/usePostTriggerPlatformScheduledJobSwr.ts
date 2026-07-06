import useSWRMutation from "swr/mutation"
import {
    triggerPlatformScheduledJob,
    type PlatformJobTriggerResult,
} from "@/modules/api/rest/platform"

/**
 * SWR mutation wrapper for {@link triggerPlatformScheduledJob}.
 */
export const usePostTriggerPlatformScheduledJobSwr = () => {
    const swr = useSWRMutation<
        PlatformJobTriggerResult,
        Error,
        string,
        string
    >("POST_TRIGGER_PLATFORM_SCHEDULED_JOB_SWR", async (_key, { arg }) => {
        return triggerPlatformScheduledJob(arg)
    })

    return swr
}
