import useSWRMutation from "swr/mutation"
import { requestTranscript, type TranscriptRef } from "@/modules/api/rest/ai"

/**
 * SWR mutation wrapper for {@link requestTranscript}.
 */
export const usePostRequestTranscriptSwr = () => {
    const swr = useSWRMutation<TranscriptRef, Error, string, Record<string, unknown>>(
        "POST_REQUEST_TRANSCRIPT_SWR",
        async (_key, { arg }) => {
            return requestTranscript(arg)
        },
    )

    return swr
}
