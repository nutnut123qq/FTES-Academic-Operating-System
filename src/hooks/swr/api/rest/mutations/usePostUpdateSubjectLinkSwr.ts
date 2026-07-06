import useSWRMutation from "swr/mutation"
import {
    updateSubjectLink,
    type LinkView,
    type UpdateLinkRequest,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostUpdateSubjectLinkSwr}.
 */
export interface UpdateSubjectLinkParams {
    code: string
    id: string
    request: UpdateLinkRequest
}

/**
 * SWR mutation wrapper for {@link updateSubjectLink}.
 */
export const usePostUpdateSubjectLinkSwr = () => {
    const swr = useSWRMutation<
        LinkView,
        Error,
        string,
        UpdateSubjectLinkParams
    >(
        "POST_UPDATE_SUBJECT_LINK_SWR",
        async (_key, { arg }) => {
            return updateSubjectLink(arg.code, arg.id, arg.request)
        },
    )

    return swr
}
