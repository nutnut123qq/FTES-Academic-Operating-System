"use client"

// React hooks that wrap the pure toast helpers (./api) and inject localized copy
// via next-intl. Components/hooks should use these instead of importing `run*WithToast`
// directly, so every toast message is localized.
import { useCallback, useMemo } from "react"
import { useTranslations } from "next-intl"
import {
    runGraphQLWithToast,
    runRestWithToast,
    type RunGraphQLWithToastOptions,
    type RunRestWithToastOptions,
    type ToastMessages,
} from "./api"
import type { GraphQLResponse } from "@/modules/api/graphql/types"

/** Resolve the localized {@link ToastMessages} from the `toast` i18n namespace. */
const useToastMessages = (): ToastMessages => {
    const t = useTranslations("toast")
    return useMemo<ToastMessages>(
        () => ({
            successTitle: t("successTitle"),
            errorTitle: t("errorTitle"),
            unauthorizedTitle: t("unauthorizedTitle"),
            unauthorizedDescription: t("unauthorizedDescription"),
            defaultSuccess: t("defaultSuccess"),
            defaultError: t("defaultError"),
        }),
        [t],
    )
}

/**
 * Hook returning a localized `runGraphQLWithToast`. Use for every GraphQL mutation/write.
 *
 * @returns A stable function `(action, options?) => Promise<boolean>` that toasts the result.
 * @example
 * const runGraphQL = useGraphQLWithToast()
 * const onSubmit = useCallback(async () => {
 *   await runGraphQL(() => mutateSomething(request))
 * }, [runGraphQL])
 */
export const useGraphQLWithToast = () => {
    const messages = useToastMessages()
    return useCallback(
        <T>(action: () => Promise<GraphQLResponse<T>>, options?: RunGraphQLWithToastOptions) =>
            runGraphQLWithToast(action, { ...options, messages }),
        [messages],
    )
}

/**
 * Hook returning a localized `runRestWithToast`. Use for every REST write
 * (raw `fetch` / `axios`, presigned-URL uploads, etc.).
 *
 * @returns A stable function `(action, options?) => Promise<T | null>` that toasts the result.
 * @example
 * const runRest = useRestWithToast()
 * const onUpload = useCallback(async () => {
 *   const res = await runRest(() => axios.put(presignedUrl, file))
 * }, [runRest])
 */
export const useRestWithToast = () => {
    const messages = useToastMessages()
    return useCallback(
        <T>(action: () => Promise<T>, options?: RunRestWithToastOptions) =>
            runRestWithToast(action, { ...options, messages }),
        [messages],
    )
}
