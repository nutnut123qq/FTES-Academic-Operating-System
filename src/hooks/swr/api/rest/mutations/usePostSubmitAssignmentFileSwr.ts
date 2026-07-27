import useSWRMutation from "swr/mutation"
import {
    submitAssignmentFile,
    type CourseSubmissionView,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostSubmitAssignmentFileSwr}.
 */
export interface SubmitAssignmentFileParams {
    assignmentId: string
    /** The code / zip file to submit for AI grading. */
    file: File
}

/**
 * SWR mutation wrapper for {@link submitAssignmentFile} — the FILE submission method
 * for a lesson assignment (multipart upload → AI graded), sibling of the GitHub-URL
 * {@link usePostSubmitAssignmentSwr}.
 */
export const usePostSubmitAssignmentFileSwr = () => {
    const swr = useSWRMutation<
        CourseSubmissionView,
        Error,
        string,
        SubmitAssignmentFileParams
    >(
        "POST_SUBMIT_ASSIGNMENT_FILE_SWR",
        async (_key, { arg }) => {
            return submitAssignmentFile(arg.assignmentId, arg.file)
        },
    )

    return swr
}
