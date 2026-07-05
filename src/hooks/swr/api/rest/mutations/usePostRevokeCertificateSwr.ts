import useSWRMutation from "swr/mutation"
import { revokeCertificate } from "@/modules/api/rest/course"

/**
 * SWR mutation wrapper for {@link revokeCertificate}.
 */
export const usePostRevokeCertificateSwr = () => {
    const swr = useSWRMutation<
        void,
        Error,
        string,
        string
    >(
        "POST_REVOKE_CERTIFICATE_SWR",
        async (_key, { arg: id }) => {
            return revokeCertificate(id)
        },
    )

    return swr
}
