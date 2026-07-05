import useSWRMutation from "swr/mutation"
import {
    requestCourseVideoUploadUrl,
    type UploadUrlRequest,
    type UploadUrlResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostRequestCourseVideoUploadUrlSwr}.
 */
export interface RequestCourseVideoUploadUrlParams {
    lessonId: string
    request: UploadUrlRequest
}

/**
 * SWR mutation wrapper for {@link requestCourseVideoUploadUrl}.
 */
export const usePostRequestCourseVideoUploadUrlSwr = () => {
    const swr = useSWRMutation<
        UploadUrlResponse,
        Error,
        string,
        RequestCourseVideoUploadUrlParams
    >(
        "POST_REQUEST_COURSE_VIDEO_UPLOAD_URL_SWR",
        async (_key, { arg }) => {
            return requestCourseVideoUploadUrl(arg.lessonId, arg.request)
        },
    )

    return swr
}
