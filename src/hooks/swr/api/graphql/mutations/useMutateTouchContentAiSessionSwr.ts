import useSWRMutation from "swr/mutation"
import { mutateTouchContentAiSession } from "@/modules/api/graphql/mutations/mutation-touch-content-ai-session"
import { type TouchContentAiSessionRequest } from "@/modules/api/graphql/mutations/types/touch-content-ai-session"

type MutateTouchContentAiSessionResult = Awaited<ReturnType<typeof mutateTouchContentAiSession>>

/**
 * SWR mutation wrapper for {@link mutateTouchContentAiSession}.
 * Pass `{ sessionId }` as arg; marks that conversation as just-opened so it is
 * the one auto-reopened on reload (persisted server-side, not in the browser).
 */
export const useMutateTouchContentAiSessionSwr = () => {
    const swr = useSWRMutation<
        MutateTouchContentAiSessionResult,
        Error,
        string,
        TouchContentAiSessionRequest
    >(
        "MUTATE_TOUCH_CONTENT_AI_SESSION_SWR",
        async (_key, { arg }) => {
            return mutateTouchContentAiSession({
                request: arg,
            })
        },
    )
    return swr
}
