import useSWRMutation from "swr/mutation"
import {
    setPassword,
    type MessageResponse,
    type SetPasswordRequest,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link setPassword} (`POST /api/v1/identity/password/set`).
 *
 * Creates the first password for a federated-only account. The backend returns 409
 * `IDENTITY_CREDENTIAL_ALREADY_SET` if a password already exists; the caller surfaces
 * that through the toast wrapper.
 */
export const usePostSetPasswordSwr = () => {
    const swr = useSWRMutation<MessageResponse, Error, string, SetPasswordRequest>(
        "POST_SET_PASSWORD_SWR",
        async (_key, { arg }) => {
            return setPassword(arg)
        },
    )

    return swr
}
