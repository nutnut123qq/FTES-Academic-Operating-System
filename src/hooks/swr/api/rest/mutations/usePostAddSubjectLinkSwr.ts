import useSWRMutation from "swr/mutation"
import {
    addSubjectLink,
    type CreateLinkRequest,
    type LinkView,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostAddSubjectLinkSwr}.
 */
export interface AddSubjectLinkParams {
    code: string
    request: CreateLinkRequest
}

/**
 * SWR mutation wrapper for {@link addSubjectLink}.
 */
export const usePostAddSubjectLinkSwr = () => {
    const swr = useSWRMutation<
        LinkView,
        Error,
        string,
        AddSubjectLinkParams
    >(
        "POST_ADD_SUBJECT_LINK_SWR",
        async (_key, { arg }) => {
            return addSubjectLink(arg.code, arg.request)
        },
    )

    return swr
}
