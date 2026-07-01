import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignInVerifyOtpRequest, MutateSignInVerifyOtpResponse } from "./types/sign-in-verify-otp"

const mutation1 = gql`
  mutation SignInVerifyOtp($request: SignInVerifyOtpRequest!) {
    signInVerifyOtp(request: $request) {
      success
      message
      error
      data {
        accessToken
      }
    }
  }
`

export enum MutationSignInVerifyOtp {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignInVerifyOtp, DocumentNode> = {
    [MutationSignInVerifyOtp.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignInVerifyOtp}. */
export type MutateSignInVerifyOtpParams = MutateParams<
    MutationSignInVerifyOtp,
    SignInVerifyOtpRequest
>

/**
 * Verifies OTP and completes sign-in.
 * Refresh token is set as HttpOnly cookie on the server; requires `withCredentials: true`.
 */
export const mutateSignInVerifyOtp = async ({
    mutation = MutationSignInVerifyOtp.Mutation1,
    request,
    debug,
    signal,
}: MutateSignInVerifyOtpParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignInVerifyOtpResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
