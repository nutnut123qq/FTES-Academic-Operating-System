import useSWRMutation from "swr/mutation"
import type { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateVerifySubmitCvPresignUrl } from "@/modules/api/graphql/mutations/mutation-verify-submit-cv-presign-url"
import { type VerifySubmitCvPresignUrlRequest } from "@/modules/api/graphql/mutations/types/verify-submit-cv-presign-url"

type MutateVerifySubmitCvPresignUrlResult = Awaited<ReturnType<typeof mutateVerifySubmitCvPresignUrl>>

/**
 * SWR mutation core for verifying the CV pre-signed upload URL.
 * @returns the SWR mutation handle.
 */
export const useMutateVerifySubmitCvPresignUrlSwr = () => {
    return useSWRMutation<
        MutateVerifySubmitCvPresignUrlResult,
        Error,
        string,
        AbortableRequest<VerifySubmitCvPresignUrlRequest>
    >(
        "MUTATE_VERIFY_SUBMIT_CV_PRESIGN_URL_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateVerifySubmitCvPresignUrl(
                {
                    request: arg.request,
                    signal: arg.signal,
                }
            )
        },
    )
}
