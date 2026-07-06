import useSWRMutation from "swr/mutation"
import {
    getCareerSuggestion,
    type CareerSuggestionView,
} from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link getCareerSuggestion}.
 */
export const usePostCareerSuggestionSwr = () => {
    const swr = useSWRMutation<
        CareerSuggestionView,
        Error,
        string,
        Record<string, unknown> | undefined
    >("POST_CAREER_SUGGESTION_SWR", async (_key, { arg }) => {
        return getCareerSuggestion(arg)
    })

    return swr
}
