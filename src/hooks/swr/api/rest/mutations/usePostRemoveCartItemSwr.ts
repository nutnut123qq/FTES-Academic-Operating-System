import useSWRMutation from "swr/mutation"
import { removeCartItem } from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link removeCartItem}.
 */
export const usePostRemoveCartItemSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_REMOVE_CART_ITEM_SWR",
        async (_key, { arg }) => {
            return removeCartItem(arg)
        },
    )

    return swr
}
