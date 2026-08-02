import useSWRMutation from "swr/mutation"
import {
    submitChallengeFile,
    type SubmissionView,
} from "@/modules/api/rest/challenges"

/**
 * Params for {@link usePostSubmitChallengeFileSwr}.
 */
export interface SubmitChallengeFileParams {
    /** Challenge id. */
    id: string
    /** The code / zip file to submit for AI grading. */
    file: File
    /**
     * Optional catalog model id — appended as a `model` form part so the BE persists it
     * (`grading_model`) and grades with it. Omit → the BE default model.
     */
    model?: string
}

/**
 * SWR mutation wrapper for {@link submitChallengeFile} — the FILE submission method for
 * a `CODE` challenge (multipart upload → AI graded), sibling of the JSON
 * {@link usePostSubmitChallengeSwr} used for the URL / MCQ / ESSAY / CODE payloads.
 */
export const usePostSubmitChallengeFileSwr = () => {
    const swr = useSWRMutation<
        SubmissionView,
        Error,
        string,
        SubmitChallengeFileParams
    >(
        "POST_SUBMIT_CHALLENGE_FILE_SWR",
        async (_key, { arg }) => {
            return submitChallengeFile(arg.id, arg.file, arg.model)
        },
    )

    return swr
}
