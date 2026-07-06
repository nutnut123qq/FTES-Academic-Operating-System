import useSWRMutation from "swr/mutation"
import {
    updateMyPersonalizeConsent,
    type RecommendationConsentRequest,
    type RecommendationConsentView,
} from "@/modules/api/rest/recommendation"

/**
 * SWR mutation wrapper for {@link updateMyPersonalizeConsent}.
 */
export const usePutMyPersonalizeConsentSwr = () => {
    const swr = useSWRMutation<
        RecommendationConsentView,
        Error,
        string,
        RecommendationConsentRequest
    >("PUT_MY_PERSONALIZE_CONSENT_SWR", async (_key, { arg }) => {
        return updateMyPersonalizeConsent(arg)
    })

    return swr
}
