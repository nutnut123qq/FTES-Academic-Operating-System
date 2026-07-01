import React from "react"
import {
    SettingsHome,
} from "@/components/features/profile/Settings/SettingsHome"

/**
 * Route `/[locale]/profile/settings` — the settings hub landing, a card grid of
 * every account-management destination. Thin route file: mounts the component.
 * Inside the `(settings)` group, so it renders within the shared sidebar shell.
 */
const Page = () => {
    return <SettingsHome />
}

export default Page
