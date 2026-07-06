import useSWRMutation from "swr/mutation"
import {
    replaceSubjectPrerequisites,
    type PrerequisiteView,
    type ReplacePrerequisitesRequest,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostReplaceSubjectPrerequisitesSwr}.
 */
export interface ReplaceSubjectPrerequisitesParams {
    code: string
    request: ReplacePrerequisitesRequest
}

/**
 * SWR mutation wrapper for {@link replaceSubjectPrerequisites}.
 */
export const usePostReplaceSubjectPrerequisitesSwr = () => {
    const swr = useSWRMutation<
        Array<PrerequisiteView>,
        Error,
        string,
        ReplaceSubjectPrerequisitesParams
    >(
        "POST_REPLACE_SUBJECT_PREREQUISITES_SWR",
        async (_key, { arg }) => {
            return replaceSubjectPrerequisites(arg.code, arg.request)
        },
    )

    return swr
}
