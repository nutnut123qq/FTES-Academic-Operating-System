import useSWRMutation from "swr/mutation"
import { completeCourseVideoUpload } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link completeCourseVideoUpload}.
 */
export const usePostCompleteCourseVideoUploadSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_COMPLETE_COURSE_VIDEO_UPLOAD_SWR",
        async (_key, { arg: videoId }) => {
            return completeCourseVideoUpload(videoId)
        },
    )

    return swr
}
