// Pure (non-React) toast helpers around API responses. The localized labels are
// injected by the `use*WithToast` hooks (see ./hooks) so this core stays free of
// React / i18n and is safe to call from anywhere. English fallbacks keep it working
// when no localized messages are supplied.
import { toast } from "@heroui/react"
import { GraphQLResponse } from "@/modules/api/graphql/types"

/** Localized labels used by the toast helpers. Resolved from i18n by the `use*WithToast` hooks. */
export interface ToastMessages {
    /** Toast title shown on success. */
    successTitle: string
    /** Toast title shown on error. */
    errorTitle: string
    /** Toast title shown when the action fails with an authorization error. */
    unauthorizedTitle: string
    /** Toast description shown when the action fails with an authorization error. */
    unauthorizedDescription: string
    /** Fallback success description when the response carries no message. */
    defaultSuccess: string
    /** Fallback error description when the response carries no message. */
    defaultError: string
}

/** English fallbacks so the pure core works without i18n (e.g. tests, server contexts). */
const DEFAULT_TOAST_MESSAGES: ToastMessages = {
    successTitle: "Success",
    errorTitle: "Error",
    unauthorizedTitle: "Unauthorized",
    unauthorizedDescription: "You are not authorized to access this resource.",
    defaultSuccess: "Operation completed.",
    defaultError: "Something went wrong.",
}

/**
 * Show a toast based on a GraphQL response's `success` flag.
 *
 * @param response - The standard GraphQL response wrapper.
 * @param messages - Localized labels (defaults to English fallbacks).
 */
export const showGraphQLToast = <T>(
    response: GraphQLResponse<T>,
    messages: ToastMessages = DEFAULT_TOAST_MESSAGES,
) => {
    const { success, message } = response
    const description = message || (success ? messages.defaultSuccess : messages.defaultError)

    if (success) {
        toast.success(messages.successTitle, { description })
    } else {
        toast.danger(messages.errorTitle, { description })
    }
}

/**
 * Show a toast when the user is not authorized to access a resource.
 *
 * @param messages - Localized labels (defaults to English fallbacks).
 */
export const showUnauthorizedToast = (messages: ToastMessages = DEFAULT_TOAST_MESSAGES) => {
    toast.danger(messages.unauthorizedTitle, {
        description: messages.unauthorizedDescription,
    })
}

/** Options for {@link runGraphQLWithToast}. */
export interface RunGraphQLWithToastOptions {
    /** Whether to show a toast on success. Defaults to `true`. */
    showSuccessToast?: boolean
    /** Whether to show a toast on error. Defaults to `true`. */
    showErrorToast?: boolean
    /**
     * Custom success description overriding the response message (e.g. a friendly
     * milestone copy). When omitted the response `message` / `defaultSuccess` is used.
     */
    successMessage?: string
    /** Localized labels. Injected by `useGraphQLWithToast`; defaults to English fallbacks. */
    messages?: ToastMessages
}

/**
 * Execute a GraphQL action and automatically toast the result.
 *
 * Prefer the `useGraphQLWithToast()` hook in components/hooks so toast copy is localized.
 *
 * @param action - Async function returning the GraphQL response wrapper.
 * @param options - Toast display options + localized labels.
 * @returns `true` if the action resolved, `false` if it threw.
 */
export const runGraphQLWithToast = async <T>(
    action: () => Promise<GraphQLResponse<T>>,
    options?: RunGraphQLWithToastOptions,
) => {
    const {
        showSuccessToast = true,
        showErrorToast = true,
        successMessage,
        messages = DEFAULT_TOAST_MESSAGES,
    } = options ?? {}

    try {
        const response = await action()
        if (showSuccessToast) {
            // friendly override only on success; fall back to the response-driven toast
            if (response.success && successMessage) {
                toast.success(messages.successTitle, { description: successMessage })
            } else {
                showGraphQLToast(response, messages)
            }
        }
        return true
    } catch (error) {
        const _error = error as Error
        if (_error.message.toLowerCase().includes("unauthorized")) {
            if (showErrorToast) {
                showUnauthorizedToast(messages)
            }
            return false
        }
        if (showErrorToast) {
            toast.danger(messages.errorTitle, { description: _error.message })
        }
        return false
    }
}

/** Options for {@link runRestWithToast}. */
export interface RunRestWithToastOptions {
    /** Message shown on success. Defaults to {@link ToastMessages.defaultSuccess}. */
    successMessage?: string
    /** Whether to show a toast on success. Defaults to `true`. */
    showSuccessToast?: boolean
    /** Whether to show a toast on error. Defaults to `true`. */
    showErrorToast?: boolean
    /** Localized labels. Injected by `useRestWithToast`; defaults to English fallbacks. */
    messages?: ToastMessages
}

/**
 * Execute a REST action (raw `fetch` / `axios`, presigned-URL uploads, etc.) and
 * automatically toast the result.
 *
 * Prefer the `useRestWithToast()` hook in components/hooks so toast copy is localized.
 *
 * @param action - Async function returning the response payload.
 * @param options - Toast display options + localized labels.
 * @returns The response payload on success, or `null` on failure.
 */
export const runRestWithToast = async <T>(
    action: () => Promise<T>,
    options?: RunRestWithToastOptions,
): Promise<T | null> => {
    const {
        successMessage,
        showSuccessToast = true,
        showErrorToast = true,
        messages = DEFAULT_TOAST_MESSAGES,
    } = options ?? {}

    try {
        const response = await action()
        if (showSuccessToast) {
            toast.success(messages.successTitle, {
                description: successMessage ?? messages.defaultSuccess,
            })
        }
        return response
    } catch (error) {
        const _error = error as Error
        if (_error.message.toLowerCase().includes("unauthorized")) {
            if (showErrorToast) {
                showUnauthorizedToast(messages)
            }
            return null
        }
        if (showErrorToast) {
            toast.danger(messages.errorTitle, { description: _error.message })
        }
        return null
    }
}
