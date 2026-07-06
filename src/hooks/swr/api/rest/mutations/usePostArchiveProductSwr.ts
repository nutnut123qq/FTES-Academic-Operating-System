import useSWRMutation from "swr/mutation"
import { archiveProduct } from "@/modules/api/rest/commerce"

/**
 * SWR mutation wrapper for {@link archiveProduct}.
 */
export const usePostArchiveProductSwr = () => {
    const swr = useSWRMutation<void, Error, string, string>(
        "POST_ARCHIVE_PRODUCT_SWR",
        async (_key, { arg }) => {
            return archiveProduct(arg)
        },
    )

    return swr
}
