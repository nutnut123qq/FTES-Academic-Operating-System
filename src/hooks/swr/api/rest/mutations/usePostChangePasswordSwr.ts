import useSWRMutation from "swr/mutation"
import {
    changePassword,
    type ChangePasswordRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link changePassword}.
 */
export const usePostChangePasswordSwr = () => {
    const swr = useSWRMutation<void, Error, string, ChangePasswordRequest>(
        "POST_CHANGE_PASSWORD_SWR",
        async (_key, { arg }) => {
            return changePassword(arg)
        },
    )

    return swr
}
