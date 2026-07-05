import useSWRMutation from "swr/mutation"
import {
    reportLessonProgress,
    type ProgressRequest,
    type ProgressView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostReportLessonProgressSwr}.
 */
export interface ReportLessonProgressParams {
    lessonId: string
    request: ProgressRequest
}

/**
 * SWR mutation wrapper for {@link reportLessonProgress}.
 */
export const usePostReportLessonProgressSwr = () => {
    const swr = useSWRMutation<
        ProgressView,
        Error,
        string,
        ReportLessonProgressParams
    >(
        "POST_REPORT_LESSON_PROGRESS_SWR",
        async (_key, { arg }) => {
            return reportLessonProgress(arg.lessonId, arg.request)
        },
    )

    return swr
}
