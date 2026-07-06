import useSWRMutation from "swr/mutation"
import {
    submitRecommendationFeedback,
    type RecommendationFeedbackRequest,
} from "@/modules/api/rest/recommendation"

/**
 * SWR mutation wrapper for {@link submitRecommendationFeedback}.
 */
export const usePostRecommendationFeedbackSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        { id: string; request: RecommendationFeedbackRequest }
    >("POST_RECOMMENDATION_FEEDBACK_SWR", async (_key, { arg }) => {
        return submitRecommendationFeedback(arg.id, arg.request)
    })

    return swr
}
