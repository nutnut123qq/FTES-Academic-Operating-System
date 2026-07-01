import useSWRMutation from "swr/mutation"
import validator from "validator"
import { queryCheckEmailExists } from "@/modules/api/graphql/queries/query-check-email-exists"
import { type CheckEmailExistsData, type CheckEmailExistsRequest } from "@/modules/api/graphql/queries/types/check-email-exists"
import { AbortableRequest } from "@/modules/api/graphql/types"

/**
 * SWR mutation: bloom-filter `checkEmailExists` (public GraphQL, no auth).
 * Call `trigger({ email })` when you need a result (e.g. after blur or before submit).
 */
export const useQueryCheckEmailExistsSwr = () => {
    const swr = useSWRMutation<
        CheckEmailExistsData,
        Error,
        string,
        AbortableRequest<CheckEmailExistsRequest>
    >(
        "MUTATE_CHECK_EMAIL_EXISTS_SWR",
        async (
            _, { arg }
        ) => {
            const trimmed = arg.request?.email.trim() ?? ""
            const valid = validator.isEmail(trimmed)
            if (!valid) {
                throw new Error("Invalid email address")
            }
            const { data } = await queryCheckEmailExists(arg)
            const envelope = data?.checkEmailExists
            const inner = envelope?.data
            if (!envelope?.success || inner == null) {
                throw new Error(
                    "Check email exists failed"
                )
            }
            return inner
        },
    )
    return swr
}
