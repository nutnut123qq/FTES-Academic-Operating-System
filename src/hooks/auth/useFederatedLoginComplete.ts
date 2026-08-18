"use client"

import { useCallback } from "react"
import { getIdentityMe } from "@/modules/api/rest/identity"
import { useForcedSetPasswordOverlayState } from "@/hooks/zustand/overlay/hooks"
import { useRouter } from "@/i18n/navigation"

/** Options for the function returned by {@link useFederatedLoginComplete}. */
export interface FederatedLoginCompleteOptions {
    /**
     * Locale-less path to navigate to when the account ALREADY has a password (e.g. `"/"`
     * for the GitHub callback). Omit to stay on the current page (the Google in-modal flow).
     * When a password is missing the gate carries this same target forward so the user only
     * lands there after setting the password.
     */
    redirectTo?: string
}

/**
 * Shared "what happens right after a federated (Google/GitHub) login" gate — the single
 * implementation both providers wire into.
 *
 * It reads {@link getIdentityMe}; when the account has no password yet (`hasPassword`
 * false — the owner requires a password even for federated signups), it opens the global
 * non-dismissable {@link ForcedSetPasswordModal} carrying `redirectTo`. Otherwise it just
 * proceeds (navigating to `redirectTo` when one was given).
 *
 * If the `me` check itself fails we deliberately do NOT trap the user behind a gate we
 * could not verify — we proceed as if a password exists.
 *
 * @returns a stable async `(options?) => Promise<void>`.
 */
export const useFederatedLoginComplete = () => {
    const router = useRouter()
    const { open: openForcedSetPassword } = useForcedSetPasswordOverlayState()

    return useCallback(
        async (options: FederatedLoginCompleteOptions = {}): Promise<void> => {
            const { redirectTo } = options
            let hasPassword = true
            try {
                const me = await getIdentityMe()
                hasPassword = me.hasPassword
            } catch {
                hasPassword = true
            }

            if (!hasPassword) {
                openForcedSetPassword({ redirectTo: redirectTo ?? null })
                return
            }

            if (redirectTo) {
                router.replace(redirectTo)
            }
        },
        [openForcedSetPassword, router],
    )
}
