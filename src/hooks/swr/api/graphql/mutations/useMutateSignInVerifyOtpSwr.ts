import useSWRMutation from "swr/mutation"
import { mutateSignInVerifyOtp } from "@/modules/api/graphql/mutations/mutation-sign-in-verify-otp"
import { type SignInVerifyOtpRequest } from "@/modules/api/graphql/mutations/types/sign-in-verify-otp"
import { setAccessToken, setAuthenticated } from "@/redux/slices/keycloak"
import { useAppDispatch } from "@/redux/hooks"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"
import type { AbortableRequest } from "@/modules/api/graphql/types"

type MutateSignInVerifyOtpResult = Awaited<ReturnType<typeof mutateSignInVerifyOtp>>

/**
 * SWR mutation for `signInVerifyOtp`: verifies OTP, stores access token, refresh token is set via HttpOnly cookie.
 */
export const useMutateSignInVerifyOtpSwr = () => {
    const dispatch = useAppDispatch()
    return useSWRMutation<
        MutateSignInVerifyOtpResult,
        Error,
        string,
        AbortableRequest<SignInVerifyOtpRequest>
    >(
        "MUTATE_SIGN_IN_VERIFY_OTP_SWR",
        async (_key, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            const result = await mutateSignInVerifyOtp({
                request: arg.request,
                signal: arg.signal,
            })
            const env = result.data?.signInVerifyOtp
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

