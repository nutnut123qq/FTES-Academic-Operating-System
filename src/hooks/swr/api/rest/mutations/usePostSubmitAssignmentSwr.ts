import useSWRMutation from "swr/mutation"
import {
    submitAssignment,
    type CourseSubmissionView,
    type SubmitAssignmentRequest,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostSubmitAssignmentSwr}.
 */
export interface SubmitAssignmentParams {
    assignmentId: string
    request: SubmitAssignmentRequest
}

/**
 * SWR mutation wrapper for {@link submitAssignment}.
 */
export const usePostSubmitAssignmentSwr = () => {
    const swr = useSWRMutation<
        CourseSubmissionView,
        Error,
        string,
        SubmitAssignmentParams
    >(
        "POST_SUBMIT_ASSIGNMENT_SWR",
        async (_key, { arg }) => {
            return submitAssignment(arg.assignmentId, arg.request)
        },
    )

    return swr
}
