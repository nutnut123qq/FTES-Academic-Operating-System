import useSWRMutation from "swr/mutation"
import type { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateSignUpInit } from "@/modules/api/graphql/mutations/mutation-sign-up-init"
import { type SignUpInitRequest } from "@/modules/api/graphql/mutations/types/sign-up-init"

type MutateSignUpInitResult = Awaited<ReturnType<typeof mutateSignUpInit>>

/**
 * SWR mutation for `signUpInit`: creates account and sends OTP to email.
 */
export const useMutateSignUpSwr = () => {
    return useSWRMutation<
        MutateSignUpInitResult,
        Error,
        string,
        AbortableRequest<SignUpInitRequest> & { headers?: Record<string, string> }
    >(
        "MUTATE_SIGN_UP_INIT_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateSignUpInit({
                request: arg.request,
                signal: arg.signal,
                headers: arg.headers,
            })
        },
    )
}
