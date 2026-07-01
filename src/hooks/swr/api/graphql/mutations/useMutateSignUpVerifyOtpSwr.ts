import useSWRMutation from "swr/mutation"
import { mutateSignUpVerifyOtp } from "@/modules/api/graphql/mutations/mutation-sign-up-verify-otp"
import { type SignUpVerifyOtpRequest } from "@/modules/api/graphql/mutations/types/sign-up-verify-otp"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { AbortableRequest } from "@/modules/api/graphql/types"

type MutateSignUpVerifyOtpResult = Awaited<ReturnType<typeof mutateSignUpVerifyOtp>>

/**
 * SWR mutation for `signUpVerifyOtp`: verifies OTP, stores access token (refresh via HttpOnly cookie).
 */
export const useMutateSignUpVerifyOtpSwr = () => {
    const dispatch = useAppDispatch()
    return useSWRMutation<
        MutateSignUpVerifyOtpResult,
        Error,
        string,
        AbortableRequest<SignUpVerifyOtpRequest>
    >(
        "MUTATE_SIGN_UP_VERIFY_OTP_SWR",
        async (_key, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            const result = await mutateSignUpVerifyOtp({
                request: arg.request,
                signal: arg.signal,
            })
            const env = result.data?.signUpVerifyOtp
            const token = env?.data?.accessToken
            if (env?.success && token) {
                LocalStorage.setItem(
                    LocalStorageId.KeycloakAccessToken,
                    token
                )
                dispatch(setAccessToken(token))
                dispatch(setAuthenticated(true))
            }
            return result
        },
    )
}
