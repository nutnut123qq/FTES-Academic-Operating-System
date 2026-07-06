import useSWRMutation from "swr/mutation"
import {
    createSubject,
    type CreateSubjectRequest,
    type SubjectDetail,
} from "@/modules/api/rest/subject"

/**
 * SWR mutation wrapper for {@link createSubject}.
 */
export const usePostCreateSubjectSwr = () => {
    const swr = useSWRMutation<
        SubjectDetail,
        Error,
        string,
        CreateSubjectRequest
    >(
        "POST_CREATE_SUBJECT_SWR",
        async (_key, { arg }) => {
            return createSubject(arg)
        },
    )

    return swr
}
