import useSWRMutation from "swr/mutation"
import type { AbortableRequest } from "@/modules/api/graphql/types"
import { mutateSignInInit } from "@/modules/api/graphql/mutations/mutation-sign-in-init"
import { type SignInInitRequest } from "@/modules/api/graphql/mutations/types/sign-in-init"

type MutateSignInInitResult = Awaited<ReturnType<typeof mutateSignInInit>>

/**
 * SWR mutation for `signIn` (init): verifies username/password then sends OTP to email.
 */
export const useMutateSignInInitSwr = () => {
    return useSWRMutation<
        MutateSignInInitResult,
        Error,
        string,
        AbortableRequest<SignInInitRequest> & { headers?: Record<string, string> }
    >(
        "MUTATE_SIGN_IN_INIT_SWR",
        async (_, { arg }) => {
            if (!arg.request) {
                throw new Error("request is required")
            }
            return await mutateSignInInit(
                {
                    request: arg.request,
                    signal: arg.signal,
                    headers: arg.headers,
                }
            )
        },
    )
}

