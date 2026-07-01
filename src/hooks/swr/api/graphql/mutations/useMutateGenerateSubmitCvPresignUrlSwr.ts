import useSWRMutation from "swr/mutation"
import { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateGenerateSubmitCvPresignUrl } from "@/modules/api/graphql/mutations/mutation-generate-submit-cv-presign-url"
import { type GenerateSubmitCvPresignUrlRequest } from "@/modules/api/graphql/mutations/types/generate-submit-cv-presign-url"

type MutateGenerateSubmitCvPresignUrlResult = Awaited<ReturnType<typeof mutateGenerateSubmitCvPresignUrl>>

/**
 * SWR mutation core for generating a pre-signed CV upload URL.
 * @returns the SWR mutation handle.
 */
export const useMutateGenerateSubmitCvPresignUrlSwr = () => {
    return useSWRMutation<
        MutateGenerateSubmitCvPresignUrlResult,
        Error,
        string,
        AbortableRequest<GenerateSubmitCvPresignUrlRequest>
    >(
        "MUTATE_GENERATE_SUBMIT_CV_PRESIGN_URL_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateGenerateSubmitCvPresignUrl(
                {
                    request: arg.request,
                    signal: arg.signal,
                }
            )
        },
    )
}
