import useSWRMutation from "swr/mutation"
import {
    replaceSubjectRelated,
    type RelatedView,
    type ReplaceRelatedRequest,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostReplaceSubjectRelatedSwr}.
 */
export interface ReplaceSubjectRelatedParams {
    code: string
    request: ReplaceRelatedRequest
}

/**
 * SWR mutation wrapper for {@link replaceSubjectRelated}.
 */
export const usePostReplaceSubjectRelatedSwr = () => {
    const swr = useSWRMutation<
        Array<RelatedView>,
        Error,
        string,
        ReplaceSubjectRelatedParams
    >(
        "POST_REPLACE_SUBJECT_RELATED_SWR",
        async (_key, { arg }) => {
            return replaceSubjectRelated(arg.code, arg.request)
        },
    )

    return swr
}
