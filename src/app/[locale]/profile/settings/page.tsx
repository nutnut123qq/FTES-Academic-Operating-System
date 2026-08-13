import React from "react"
import { AppearanceSection } from "@/components/features/profile/Settings/AppearanceSection"

/**
 * `/profile/settings` — the Appearance section of the settings area (the hub route).
 * The heading, the navigation rail between sections and the page frame belong to
 * `SettingsShell`, mounted by the profile layout.
 *
 * THREE ROUTES, not one page: appearance · notifications · security each own a URL, so
 * a link can point at "the security settings" and the account menu can deep-link the
 * notification preferences. The rail in `SettingsShell` is what ties them together.
 */
const Page = () => <AppearanceSection />

export default Page
