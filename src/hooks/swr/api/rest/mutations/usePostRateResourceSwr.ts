import useSWRMutation from "swr/mutation"
import {
    rateResource,
    type RateRequest,
    type RatingResponse,
} from "@/modules/api/rest/resource"

/**
 * SWR mutation wrapper for {@link rateResource}.
 */
export const usePostRateResourceSwr = () => {
    const swr = useSWRMutation<
        RatingResponse,
        Error,
        string,
        { id: string; request: RateRequest }
    >(
        "POST_RATE_RESOURCE_SWR",
        async (_key, { arg }) => {
            return rateResource(arg.id, arg.request)
        },
    )

    return swr
}
