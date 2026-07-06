import useSWRMutation from "swr/mutation"
import {
    createProduct,
    type ProductUpsertRequest,
    type ProductView,
} from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link createProduct}.
 */
export const usePostCreateProductSwr = () => {
    const swr = useSWRMutation<
        ProductView,
        Error,
        string,
        ProductUpsertRequest
    >(
        "POST_CREATE_PRODUCT_SWR",
        async (_key, { arg }) => {
            return createProduct(arg)
        },
    )

    return swr
}
