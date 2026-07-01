import useSWRMutation from "swr/mutation"
import { mutateBuyStreakFreeze } from "@/modules/api/graphql/mutations/mutation-buy-streak-freeze"

type MutateBuyStreakFreezeResult = Awaited<ReturnType<typeof mutateBuyStreakFreeze>>

/**
 * SWR mutation wrapper for {@link mutateBuyStreakFreeze} (Bearer from Keycloak).
 * Takes no argument — the backend buys exactly one freeze per call.
 */
export const useMutateBuyStreakFreezeSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateBuyStreakFreezeResult,
        Error,
        string,
        void
    >(
        "MUTATE_BUY_STREAK_FREEZE_SWR",
        async () => {
            return mutateBuyStreakFreeze({})
        }
    )
    /** Return the SWR mutation. */
    return swr
}
