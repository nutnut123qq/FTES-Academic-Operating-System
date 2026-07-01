import React from "react"
import { EditProfile } from "@/components/features/profile/EditProfile"

/**
 * Route `/[locale]/profile/edit` — renders the edit-profile feature.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <EditProfile />
}

export default Page
