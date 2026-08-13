import useSWRMutation from "swr/mutation"
import { submitUnlockAppeal, type UnlockAppealRequest } from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link submitUnlockAppeal}.
 *
 * KHÔNG đụng token/redux như các hook auth khác: đơn xin mở khoá không cấp phiên, nó chỉ ghi một
 * bản trình bày vào hàng đợi duyệt của admin. Tài khoản chỉ mở lại khi admin bấm duyệt.
 */
export const usePostUnlockAppealSwr = () => {
    return useSWRMutation<void, Error, string, UnlockAppealRequest>(
        "POST_UNLOCK_APPEAL_SWR",
        async (_key, { arg }) => submitUnlockAppeal(arg),
    )
}
