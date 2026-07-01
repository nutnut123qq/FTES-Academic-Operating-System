import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignUpVerifyOtpRequest, MutateSignUpVerifyOtpResponse } from "./types/sign-up-verify-otp"

const mutation1 = gql`
  mutation SignUpVerifyOtp($request: SignUpVerifyOtpInput!) {
    signUpVerifyOtp(request: $request) {
      success
      message
      error
      data {
        accessToken
      }
    }
  }
`

export enum MutationSignUpVerifyOtp {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignUpVerifyOtp, DocumentNode> = {
    [MutationSignUpVerifyOtp.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignUpVerifyOtp}. */
export type MutateSignUpVerifyOtpParams = MutateParams<
    MutationSignUpVerifyOtp,
    SignUpVerifyOtpRequest
>

/**
 * Verifies OTP and completes sign-up. Refresh token is set as HttpOnly cookie.
 */
export const mutateSignUpVerifyOtp = async ({
    mutation = MutationSignUpVerifyOtp.Mutation1,
    request,
    debug,
    signal,
}: MutateSignUpVerifyOtpParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignUpVerifyOtpResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
