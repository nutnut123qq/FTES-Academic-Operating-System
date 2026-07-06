import useSWRMutation from "swr/mutation"
import { banSubjectMember } from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostBanSubjectMemberSwr}.
 */
export interface BanSubjectMemberParams {
    code: string
    userId: string
}

/**
 * SWR mutation wrapper for {@link banSubjectMember}.
 */
export const usePostBanSubjectMemberSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        BanSubjectMemberParams
    >(
        "POST_BAN_SUBJECT_MEMBER_SWR",
        async (_key, { arg }) => {
            return banSubjectMember(arg.code, arg.userId)
        },
    )

    return swr
}
