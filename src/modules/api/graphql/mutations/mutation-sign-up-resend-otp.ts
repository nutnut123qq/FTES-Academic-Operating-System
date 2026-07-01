import type { MutateParams } from "../types"
import { createNoAuthApolloClient } from "../clients"
import { DocumentNode, gql } from "@apollo/client"
import type { SignUpResendOtpRequest, MutateSignUpResendOtpResponse } from "./types/sign-up-resend-otp"

const mutation1 = gql`
  mutation SignUpResendOtp($request: SignUpResendOtpRequest!) {
    signUpResendOtp(request: $request) {
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

export enum MutationSignUpResendOtp {
    Mutation1 = "mutation1",
}

const mutationMap: Record<MutationSignUpResendOtp, DocumentNode> = {
    [MutationSignUpResendOtp.Mutation1]: mutation1,
}

/** Apollo params for {@link mutateSignUpResendOtp}. */
export type MutateSignUpResendOtpParams = MutateParams<
    MutationSignUpResendOtp,
    SignUpResendOtpRequest
>

/**
 * Resend sign-up OTP for an existing challenge (same `challengeId` from `signUpInit`).
 */
export const mutateSignUpResendOtp = async ({
    mutation = MutationSignUpResendOtp.Mutation1,
    request,
    debug,
    signal,
}: MutateSignUpResendOtpParams) => {
    const apollo = createNoAuthApolloClient({
        cache: false,
        debug,
        signal,
        withCredentials: true,
    })
    return apollo.mutate<MutateSignUpResendOtpResponse>({
        mutation: mutationMap[mutation],
        variables: { request },
    })
}
