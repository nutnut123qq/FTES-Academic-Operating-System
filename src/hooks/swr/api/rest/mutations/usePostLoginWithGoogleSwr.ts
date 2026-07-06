import useSWRMutation from "swr/mutation"
import {
    loginWithGoogle,
    type GoogleLoginRequest,
    type TokenResponse,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link loginWithGoogle}.
 */
export const usePostLoginWithGoogleSwr = () => {
    const swr = useSWRMutation<
        TokenResponse,
        Error,
        string,
        GoogleLoginRequest
    >(
        "POST_LOGIN_WITH_GOOGLE_SWR",
        async (_key, { arg }) => {
            return loginWithGoogle(arg)
        },
    )

    return swr
}
