import useSWRMutation from "swr/mutation"
import { leaveSubject } from "@/modules/api/rest/subject"

/**
 * SWR mutation wrapper for {@link leaveSubject}.
 */
export const usePostLeaveSubjectSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_LEAVE_SUBJECT_SWR",
        async (_key, { arg: code }) => {
            return leaveSubject(code)
        },
    )

    return swr
}
