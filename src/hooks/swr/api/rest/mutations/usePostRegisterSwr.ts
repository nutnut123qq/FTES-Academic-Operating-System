import useSWRMutation from "swr/mutation"
import {
    register,
    type MessageResponse,
    type RegisterRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link register} (`POST /auth/register`).
 *
 * Also doubles as "resend OTP": calling it again with the same email while the
 * account is still unverified triggers an idempotent OTP resend on the backend
 * (within the 60s cooldown it still returns 200 but no new mail is sent).
 */
export const usePostRegisterSwr = () => {
    const swr = useSWRMutation<MessageResponse, Error, string, RegisterRequest>(
        "POST_REGISTER_SWR",
        async (_key, { arg }) => {
            return register(arg)
        },
    )

    return swr
}
