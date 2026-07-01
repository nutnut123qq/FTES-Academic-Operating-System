import useSWRMutation from "swr/mutation"
import { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateGenerateAvatarPresignUrl } from "@/modules/api/graphql/mutations/mutation-generate-avatar-presign-url"
import { type GenerateAvatarPresignUrlRequest } from "@/modules/api/graphql/mutations/types/generate-avatar-presign-url"

type MutateGenerateAvatarPresignUrlResult = Awaited<ReturnType<typeof mutateGenerateAvatarPresignUrl>>

/**
 * SWR mutation core for minting a pre-signed avatar upload URL.
 * @returns the SWR mutation handle.
 */
export const useMutateGenerateAvatarPresignUrlSwr = () => {
    return useSWRMutation<
        MutateGenerateAvatarPresignUrlResult,
        Error,
        string,
        AbortableRequest<GenerateAvatarPresignUrlRequest>
    >(
        "MUTATE_GENERATE_AVATAR_PRESIGN_URL_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateGenerateAvatarPresignUrl(
                {
                    request: arg.request,
                    signal: arg.signal,
                }
            )
        },
    )
}
