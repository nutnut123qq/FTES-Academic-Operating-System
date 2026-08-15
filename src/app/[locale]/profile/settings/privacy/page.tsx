import React from "react"
import { PrivacySection } from "@/components/features/profile/Settings/PrivacySection"

/**
 * `/profile/settings/privacy` — who can see the profile and which fields it
 * reveals. Thin route file: the heading, the navigation rail between sections and
 * the page frame belong to `SettingsShell`, mounted by the profile layout.
 */
const Page = () => <PrivacySection />

export default Page
