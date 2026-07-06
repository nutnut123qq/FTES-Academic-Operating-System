import useSWRMutation from "swr/mutation"
import {
    resetPassword,
    type ResetPasswordRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link resetPassword}.
 */
export const usePostResetPasswordSwr = () => {
    const swr = useSWRMutation<void, Error, string, ResetPasswordRequest>(
        "POST_RESET_PASSWORD_SWR",
        async (_key, { arg }) => {
            return resetPassword(arg)
        },
    )

    return swr
}
