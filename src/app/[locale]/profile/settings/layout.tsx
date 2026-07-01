import React from "react"
import {
    SettingsLayout,
} from "@/components/features/profile/Settings/SettingsLayout"

/**
 * Layout for the `/[locale]/profile/(settings)` route group — wraps every private
 * account-management page (edit, security, sessions, AI settings/subscription/usage,
 * bookmarks, membership) in the shared {@link SettingsLayout} sidebar shell. The
 * `(settings)` group keeps URLs unchanged (`/profile/<page>`) while leaving the
 * public profile (`/profile` and `/profile/[username]`) outside this chrome.
 */
const Layout = ({
    children,
}: {
    children: React.ReactNode
}) => {
    return (
        <SettingsLayout>
            {children}
        </SettingsLayout>
    )
}

export default Layout
