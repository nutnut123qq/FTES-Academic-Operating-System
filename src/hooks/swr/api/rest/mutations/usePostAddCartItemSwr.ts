import useSWRMutation from "swr/mutation"
import {
    addCartItem,
    type AddCartItemRequest,
    type CartItemView,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link addCartItem}.
 */
export const usePostAddCartItemSwr = () => {
    const swr = useSWRMutation<
        CartItemView,
        Error,
        string,
        AddCartItemRequest
    >(
        "POST_ADD_CART_ITEM_SWR",
        async (_key, { arg }) => {
            return addCartItem(arg)
        },
    )

    return swr
}
