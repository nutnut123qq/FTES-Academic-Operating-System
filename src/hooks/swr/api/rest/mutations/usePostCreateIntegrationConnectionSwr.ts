import useSWRMutation from "swr/mutation"
import {
    createIntegrationConnection,
    type IntegrationConnectionView,
    type IntegrationCreateConnectionRequest,
} from "@/modules/api/rest/integration"

/**
 * SWR mutation wrapper for {@link createIntegrationConnection}.
 */
export const usePostCreateIntegrationConnectionSwr = () => {
    const swr = useSWRMutation<
        IntegrationConnectionView,
        Error,
        string,
        IntegrationCreateConnectionRequest
    >("POST_CREATE_INTEGRATION_CONNECTION_SWR", async (_key, { arg }) => {
        return createIntegrationConnection(arg)
    })

    return swr
}
