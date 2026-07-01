import useSWRMutation from "swr/mutation"
import { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateExchangeCodeForToken } from "@/modules/api/graphql/mutations/mutation-exchange-code-for-token"
import { type ExchangeCodeForTokenRequest } from "@/modules/api/graphql/mutations/types/exchange-code-for-token"
import { LocalStorage } from "@/modules/storage/local/storage"
import { LocalStorageId } from "@/modules/storage/local/enums/id"

type MutateExchangeCodeForTokenResult = Awaited<
    ReturnType<typeof mutateExchangeCodeForToken>
>

/**
 * SWR mutation wrapper for {@link mutateExchangeCodeForToken} (OIDC code → Keycloak tokens; no Bearer).
 */
export const useMutateExchangeCodeForTokenSwr = () => {
    const swr = useSWRMutation<
        MutateExchangeCodeForTokenResult,
        Error,
        string,
        AbortableRequest<ExchangeCodeForTokenRequest>
    >(
        "MUTATE_EXCHANGE_CODE_FOR_TOKEN_SWR",
        async (_key, { arg }) => {
            if (!arg.request) {
                throw new Error("Request is required")
            }
            const result = await mutateExchangeCodeForToken(
                { 
                    request: arg.request,
                    signal: arg.signal,
                }
            )
            if (result.data?.exchangeCodeForToken?.data?.accessToken) {
                LocalStorage.setItem(
                    LocalStorageId.KeycloakAccessToken,
                    result.data.exchangeCodeForToken.data.accessToken
                )
            }
            return result
        }
    )
    return swr
}