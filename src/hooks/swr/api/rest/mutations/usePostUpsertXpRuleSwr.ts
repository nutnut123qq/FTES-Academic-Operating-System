import useSWRMutation from "swr/mutation"
import {
    upsertXpRule,
    type XpRuleRequest,
    type XpRuleResponse,
} from "@/modules/api/rest/gamification"

/**
 * SWR mutation wrapper for {@link upsertXpRule}.
 */
export const usePostUpsertXpRuleSwr = () => {
    const swr = useSWRMutation<XpRuleResponse, Error, string, XpRuleRequest>(
        "POST_UPSERT_XP_RULE_SWR",
        async (_key, { arg }) => {
            return upsertXpRule(arg)
        },
    )

    return swr
}
