import useSWRMutation from "swr/mutation"
import {
    trustSecurityDevice,
    type SecurityMessageResponse,
} from "@/modules/api/rest/identity-security"

/**
 * SWR mutation wrapper for {@link trustSecurityDevice}.
 */
export const usePostTrustSecurityDeviceSwr = () => {
    const swr = useSWRMutation<
        SecurityMessageResponse,
        Error,
        string,
        string
    >("POST_TRUST_SECURITY_DEVICE_SWR", async (_key, { arg }) => {
        return trustSecurityDevice(arg)
    })

    return swr
}
