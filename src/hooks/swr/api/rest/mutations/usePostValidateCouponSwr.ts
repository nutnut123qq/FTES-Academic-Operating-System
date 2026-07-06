import useSWRMutation from "swr/mutation"
import {
    validateCoupon,
    type CouponPreview,
    type CouponValidateRequest,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link validateCoupon}.
 */
export const usePostValidateCouponSwr = () => {
    const swr = useSWRMutation<
        CouponPreview,
        Error,
        string,
        CouponValidateRequest
    >(
        "POST_VALIDATE_COUPON_SWR",
        async (_key, { arg }) => {
            return validateCoupon(arg)
        },
    )

    return swr
}
