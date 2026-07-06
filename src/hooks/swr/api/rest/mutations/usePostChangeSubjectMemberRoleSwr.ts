import useSWRMutation from "swr/mutation"
import {
    changeSubjectMemberRole,
    type ChangeRoleRequest,
} from "@/modules/api/rest/subject"

/**
 * Params for {@link usePostChangeSubjectMemberRoleSwr}.
 */
export interface ChangeSubjectMemberRoleParams {
    code: string
    userId: string
    request: ChangeRoleRequest
}

/**
 * SWR mutation wrapper for {@link changeSubjectMemberRole}.
 */
export const usePostChangeSubjectMemberRoleSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        ChangeSubjectMemberRoleParams
    >(
        "POST_CHANGE_SUBJECT_MEMBER_ROLE_SWR",
        async (_key, { arg }) => {
            return changeSubjectMemberRole(arg.code, arg.userId, arg.request)
        },
    )

    return swr
}
