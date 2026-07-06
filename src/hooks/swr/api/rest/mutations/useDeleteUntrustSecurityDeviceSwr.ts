import useSWRMutation from "swr/mutation"
import {
    untrustSecurityDevice,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link untrustSecurityDevice}.
 */
export const useDeleteUntrustSecurityDeviceSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        string
    >("DELETE_UNTRUST_SECURITY_DEVICE_SWR", async (_key, { arg }) => {
        return untrustSecurityDevice(arg)
    })

    return swr
}
