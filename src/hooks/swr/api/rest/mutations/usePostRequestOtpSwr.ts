import useSWRMutation from "swr/mutation"
import {
    requestOtp,
    type OtpRequestRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link requestOtp}.
 */
export const usePostRequestOtpSwr = () => {
    const swr = useSWRMutation<void, Error, string, OtpRequestRequest>(
        "POST_REQUEST_OTP_SWR",
        async (_key, { arg }) => {
            return requestOtp(arg)
        },
    )

    return swr
}
