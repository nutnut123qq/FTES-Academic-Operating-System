import useSWRMutation from "swr/mutation"
import { adminProcessVideo, type AdminProcessVideoParams } from "@/modules/api/rest/admin-process-video/process-video"
import { type AdminProcessVideoResponse } from "@/modules/api/rest/admin-process-video/types"

/**
 * SWR mutation wrapper for {@link adminProcessVideo}.
 */
export const usePostAdminProcessVideoSwr = () => {
    const swr = useSWRMutation<
        AdminProcessVideoResponse,
        Error,
        string,
        AdminProcessVideoParams
    >(
        "POST_ADMIN_PROCESS_VIDEO_SWR",
        async (_key, { arg }) => {
            return adminProcessVideo(arg)
        }
    )
    return swr
}
