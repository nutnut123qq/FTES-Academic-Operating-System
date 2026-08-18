import useSWRMutation from "swr/mutation"
import {
    unlinkAccount,
    type LinkedAccountProvider,
    type MessageResponse,
} from "@/modules/api/rest/identity"

/**
 * SWR mutation wrapper for {@link unlinkAccount}
 * (`DELETE /api/v1/identity/linked-accounts/{provider}`).
 *
 * The `arg` is the provider to remove. The backend guards the last-login case with 409
 * `IDENTITY_CANNOT_UNLINK_LAST_LOGIN`; the caller inspects `RestError.errorCode` to show a
 * clear message rather than a raw error.
 */
export const usePostUnlinkAccountSwr = () => {
    const swr = useSWRMutation<MessageResponse, Error, string, LinkedAccountProvider>(
        "POST_UNLINK_ACCOUNT_SWR",
        async (_key, { arg }) => {
            return unlinkAccount(arg)
        },
    )

    return swr
}
