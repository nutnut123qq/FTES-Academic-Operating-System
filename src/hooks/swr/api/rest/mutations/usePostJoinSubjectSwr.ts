import useSWRMutation from "swr/mutation"
import { joinSubject, type JoinResponse } from "@/modules/api/rest/subject"

/**
 * SWR mutation wrapper for {@link joinSubject}.
 */
export const usePostJoinSubjectSwr = () => {
    const swr = useSWRMutation<
        JoinResponse,
        Error,
        string,
        string
    >(
        "POST_JOIN_SUBJECT_SWR",
        async (_key, { arg: code }) => {
            return joinSubject(code)
        },
    )

    return swr
}
