import React from "react"
import { StandaloneMindMap } from "@/components/features/learn/MindMap/StandaloneMindMap"

/**
 * Route `/[locale]/courses/[courseId]/mind-map` — public, full-width course
 * mind-map. Sits beside the `learn` segment (not inside it) so it renders
 * without the authenticated Sidebar shell and requires no login.
 *
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <StandaloneMindMap />
}

export default Page
