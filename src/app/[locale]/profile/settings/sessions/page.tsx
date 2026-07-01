import React from "react"
import { Sessions } from "@/components/features/profile/Sessions"

/**
 * Route `/[locale]/profile/sessions` — renders the devices / sessions feature.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <Sessions />
}

export default Page
