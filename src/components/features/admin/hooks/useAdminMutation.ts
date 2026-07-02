"use client"

import { useCallback, useState } from "react"
import { toast } from "@heroui/react"
import { useSWRConfig } from "swr"

/**
 * Shared runner for the console's mock mutations: awaits the service call,
 * toasts success/error, and revalidates every SWR key whose first element is in
 * `revalidatePrefixes` (admin keys are `["ADMIN_*", ...params]`).
 *
 * ponytail: direct `toast.*` is the mock path — when the BE lands and mutations
 * return the GraphQL envelope, replace call sites with per-op `useMutate*Swr`
 * hooks run through `useGraphQLWithToast()` (canon SLICE 5.4).
 */
export const useAdminMutation = () => {
    const { mutate } = useSWRConfig()
    const [isPending, setIsPending] = useState(false)

    const run = useCallback(
        async (
            action: () => Promise<unknown>,
            options: {
                /** Localized toast title on success. */
                successMessage: string
                /** Localized toast title on failure. */
                errorMessage: string
                /** SWR key prefixes (e.g. `"ADMIN_USERS"`) to revalidate on success. */
                revalidatePrefixes: Array<string>
            },
        ): Promise<boolean> => {
            setIsPending(true)
            try {
                await action()
                await mutate(
                    (key) => Array.isArray(key) && options.revalidatePrefixes.includes(String(key[0])),
                )
                toast.success(options.successMessage)
                return true
            } catch {
                // mocked failure — state was not changed by the service, so the UI retains the prior value
                toast.danger(options.errorMessage)
                return false
            } finally {
                setIsPending(false)
            }
        },
        [mutate],
    )

    return { run, isPending }
}
