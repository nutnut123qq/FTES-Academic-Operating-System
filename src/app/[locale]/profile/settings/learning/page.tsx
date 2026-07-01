import React from "react"
import {
    LearningHistory,
} from "@/components/features/profile/Settings/LearningHistory"

/**
 * Route `/[locale]/profile/learning` — renders the learner's course history.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <LearningHistory />
}

export default Page
