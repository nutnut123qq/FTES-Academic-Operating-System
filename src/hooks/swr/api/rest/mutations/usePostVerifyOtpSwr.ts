import useSWRMutation from "swr/mutation"
import {
    verifyOtp,
    type OtpVerifyRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link verifyOtp}.
 */
export const usePostVerifyOtpSwr = () => {
    const swr = useSWRMutation<void, Error, string, OtpVerifyRequest>(
        "POST_VERIFY_OTP_SWR",
        async (_key, { arg }) => {
            return verifyOtp(arg)
        },
    )

    return swr
}
