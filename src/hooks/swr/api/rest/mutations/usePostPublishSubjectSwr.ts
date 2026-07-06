import useSWRMutation from "swr/mutation"
import { publishSubject, type SubjectDetail } from "@/modules/api/rest/subject"

/**
 * SWR mutation wrapper for {@link publishSubject}.
 */
export const usePostPublishSubjectSwr = () => {
    const swr = useSWRMutation<
        SubjectDetail,
        Error,
        string,
        string
    >(
        "POST_PUBLISH_SUBJECT_SWR",
        async (_key, { arg: code }) => {
            return publishSubject(code)
        },
    )

    return swr
}
