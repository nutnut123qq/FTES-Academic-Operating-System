import useSWRMutation from "swr/mutation"
import {
    revokeSecurityDevice,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link revokeSecurityDevice}.
 */
export const useDeleteRevokeSecurityDeviceSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        string
    >("DELETE_REVOKE_SECURITY_DEVICE_SWR", async (_key, { arg }) => {
        return revokeSecurityDevice(arg)
    })

    return swr
}
