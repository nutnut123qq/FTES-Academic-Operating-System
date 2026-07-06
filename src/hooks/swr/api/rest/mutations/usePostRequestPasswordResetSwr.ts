import useSWRMutation from "swr/mutation"
import {
    requestPasswordReset,
    type ForgotPasswordRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link requestPasswordReset}.
 */
export const usePostRequestPasswordResetSwr = () => {
    const swr = useSWRMutation<void, Error, string, ForgotPasswordRequest>(
        "POST_REQUEST_PASSWORD_RESET_SWR",
        async (_key, { arg }) => {
            return requestPasswordReset(arg)
        },
    )

    return swr
}
