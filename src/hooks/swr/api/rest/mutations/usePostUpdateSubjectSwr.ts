import useSWRMutation from "swr/mutation"
import {
    updateSubject,
    type SubjectDetail,
    type UpdateSubjectRequest,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostUpdateSubjectSwr}.
 */
export interface UpdateSubjectParams {
    code: string
    request: UpdateSubjectRequest
}

/**
 * SWR mutation wrapper for {@link updateSubject}.
 */
export const usePostUpdateSubjectSwr = () => {
    const swr = useSWRMutation<
        SubjectDetail,
        Error,
        string,
        UpdateSubjectParams
    >(
        "POST_UPDATE_SUBJECT_SWR",
        async (_key, { arg }) => {
            return updateSubject(arg.code, arg.request)
        },
    )

    return swr
}
