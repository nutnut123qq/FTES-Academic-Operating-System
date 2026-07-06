import useSWRMutation from "swr/mutation"
import {
    createIntegrationApiKey,
    type IntegrationCreateApiKeyRequest,
    type IntegrationCreatedKeyView,
} from "@/modules/api/rest/integration"

/**
 * SWR mutation wrapper for {@link createIntegrationApiKey}.
 */
export const usePostCreateIntegrationApiKeySwr = () => {
    const swr = useSWRMutation<
        IntegrationCreatedKeyView,
        Error,
        string,
        IntegrationCreateApiKeyRequest
    >("POST_CREATE_INTEGRATION_API_KEY_SWR", async (_key, { arg }) => {
        return createIntegrationApiKey(arg)
    })

    return swr
}
