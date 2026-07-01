import useSWRMutation from "swr/mutation"
import { mutateSubmitContact } from "@/modules/api/graphql/mutations/mutation-submit-contact"
import { type SubmitContactRequest } from "@/modules/api/graphql/mutations/types/contact"

type MutateSubmitContactResult = Awaited<ReturnType<typeof mutateSubmitContact>>

/**
 * SWR mutation wrapper for {@link mutateSubmitContact} — the public contact form.
 * Works anonymously (no auth required).
 */
export const useMutateSubmitContactSwr = () => {
    /** The SWR mutation. */
    const swr = useSWRMutation<
        MutateSubmitContactResult,
        Error,
        string,
        SubmitContactRequest
    >(
        "MUTATE_SUBMIT_CONTACT_SWR",
        async (_key, { arg }) => {
            return mutateSubmitContact({
                request: arg,
            })
        }
    )
    /** Return the SWR mutation. */
    return swr
}
