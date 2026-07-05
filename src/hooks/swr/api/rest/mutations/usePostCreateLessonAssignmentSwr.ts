import useSWRMutation from "swr/mutation"
import {
    createLessonAssignment,
    type CreateAssignmentRequest,
    type IdResponse,
} from "@/modules/api/rest/course"

/**
 * Params for {@link usePostCreateLessonAssignmentSwr}.
 */
export interface CreateLessonAssignmentParams {
    lessonId: string
    request: CreateAssignmentRequest
}

/**
 * SWR mutation wrapper for {@link createLessonAssignment}.
 */
export const usePostCreateLessonAssignmentSwr = () => {
    const swr = useSWRMutation<
        IdResponse,
        Error,
        string,
        CreateLessonAssignmentParams
    >(
        "POST_CREATE_LESSON_ASSIGNMENT_SWR",
        async (_key, { arg }) => {
            return createLessonAssignment(arg.lessonId, arg.request)
        },
    )

    return swr
}
