import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignInResendOtpRequest, MutateSignInResendOtpResponse } from "./types/sign-in-resend-otp"

const mutation1 = gql`
  mutation SignInResendOtp($request: SignInResendOtpRequest!) {
    signInResendOtp(request: $request) {
      success
      message
      error
      data {
        challengeId
        expiresInSeconds
      }
    }
  }
`

export enum MutationSignInResendOtp {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignInResendOtp, DocumentNode> = {
    [MutationSignInResendOtp.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignInResendOtp}. */
export type MutateSignInResendOtpParams = MutateParams<
    MutationSignInResendOtp,
    SignInResendOtpRequest
>

/**
 * Resend sign-in OTP for an existing challenge (same `challengeId` from `signInInit`).
 */
export const mutateSignInResendOtp = async ({
    mutation = MutationSignInResendOtp.Mutation1,
    request,
    debug,
    signal,
}: MutateSignInResendOtpParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignInResendOtpResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
