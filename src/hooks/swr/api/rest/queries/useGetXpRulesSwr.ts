"use client"

import useSWR from "swr"
import { listXpRules, type XpRuleResponse } from "@/modules/api/rest/gamification"

/**
 * SWR query wrapper for {@link listXpRules}.
 */
export const useGetXpRulesSwr = () => {
    const swr = useSWR<Array<XpRuleResponse>, Error>(
        ["GET_XP_RULES_SWR"],
        () => listXpRules(),
    )

    return swr
}
