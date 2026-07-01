"use client"
import { useLocale } from "next-intl"
import useSWRMutation from "swr/mutation"
import { GraphQLHeadersKey } from "@/modules/api/graphql/types"
import { mutateReviewCv } from "@/modules/api/graphql/mutations/mutation-review-cv"
import { type ReviewCvRequest } from "@/modules/api/graphql/mutations/types/review-cv"
import { useAppSelector } from "@/redux/hooks"

type MutateReviewCvResult = Awaited<ReturnType<typeof mutateReviewCv>>

/**
 * SWR mutation for {@link mutateReviewCv} (auth client, `X-Locale` from next-intl).
 */
export const useMutateReviewCvSwr = () => {
    const locale = useLocale()
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    return useSWRMutation<MutateReviewCvResult, Error, string, ReviewCvRequest>(
        "MUTATE_REVIEW_CV_SWR",
        async (_key, { arg }) => {
            if (!authenticated) {
                throw new Error("Not authenticated")
            }
            return mutateReviewCv({
                request: arg,
                headers: {
                    [GraphQLHeadersKey.XLocale]: locale,
                },
            })
        },
    )
}
