import useSWRMutation from "swr/mutation"
import {
    updateProduct,
    type ProductUpsertRequest,
    type ProductView,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link updateProduct}.
 */
export const usePostUpdateProductSwr = () => {
    const swr = useSWRMutation<
        ProductView,
        Error,
        string,
        { id: string; request: ProductUpsertRequest }
    >(
        "POST_UPDATE_PRODUCT_SWR",
        async (_key, { arg }) => {
            return updateProduct(arg.id, arg.request)
        },
    )

    return swr
}
