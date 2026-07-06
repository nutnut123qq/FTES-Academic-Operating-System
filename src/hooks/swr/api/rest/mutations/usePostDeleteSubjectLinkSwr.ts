import useSWRMutation from "swr/mutation"
import { deleteSubjectLink } from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostDeleteSubjectLinkSwr}.
 */
export interface DeleteSubjectLinkParams {
    code: string
    id: string
}

/**
 * SWR mutation wrapper for {@link deleteSubjectLink}.
 */
export const usePostDeleteSubjectLinkSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        DeleteSubjectLinkParams
    >(
        "POST_DELETE_SUBJECT_LINK_SWR",
        async (_key, { arg }) => {
            return deleteSubjectLink(arg.code, arg.id)
        },
    )

    return swr
}
