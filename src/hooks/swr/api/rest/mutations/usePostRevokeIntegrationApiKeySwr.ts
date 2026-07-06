import useSWRMutation from "swr/mutation"
import { revokeIntegrationApiKey } from "@/modules/api/rest/integration"

/**
 * SWR mutation wrapper for {@link revokeIntegrationApiKey}.
 */
export const usePostRevokeIntegrationApiKeySwr = () => {
    const swr = useSWRMutation<boolean, Error, string, string>(
        "POST_REVOKE_INTEGRATION_API_KEY_SWR",
        async (_key, { arg }) => {
            return revokeIntegrationApiKey(arg)
        },
    )

    return swr
}
