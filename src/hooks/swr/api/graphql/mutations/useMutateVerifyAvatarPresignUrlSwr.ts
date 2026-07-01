import useSWRMutation from "swr/mutation"
import { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateVerifyAvatarPresignUrl } from "@/modules/api/graphql/mutations/mutation-verify-avatar-presign-url"
import { type VerifyAvatarPresignUrlRequest } from "@/modules/api/graphql/mutations/types/verify-avatar-presign-url"

type MutateVerifyAvatarPresignUrlResult = Awaited<ReturnType<typeof mutateVerifyAvatarPresignUrl>>

/**
 * SWR mutation core for confirming a direct avatar upload + persisting it.
 * @returns the SWR mutation handle.
 */
export const useMutateVerifyAvatarPresignUrlSwr = () => {
    return useSWRMutation<
        MutateVerifyAvatarPresignUrlResult,
        Error,
        string,
        AbortableRequest<VerifyAvatarPresignUrlRequest>
    >(
        "MUTATE_VERIFY_AVATAR_PRESIGN_URL_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateVerifyAvatarPresignUrl(
                {
                    request: arg.request,
                    signal: arg.signal,
                }
            )
        },
    )
}
