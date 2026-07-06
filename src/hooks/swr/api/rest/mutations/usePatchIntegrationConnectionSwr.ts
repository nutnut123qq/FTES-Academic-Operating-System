import useSWRMutation from "swr/mutation"
import {
    updateIntegrationConnection,
    type IntegrationConnectionView,
    type IntegrationUpdateConnectionRequest,
} from "@/modules/api/rest/integration"

/**
 * SWR mutation wrapper for {@link updateIntegrationConnection}.
 */
export const usePatchIntegrationConnectionSwr = () => {
    const swr = useSWRMutation<
        IntegrationConnectionView,
        Error,
        string,
        { id: string; request: IntegrationUpdateConnectionRequest }
    >("PATCH_INTEGRATION_CONNECTION_SWR", async (_key, { arg }) => {
        return updateIntegrationConnection(arg.id, arg.request)
    })

    return swr
}
