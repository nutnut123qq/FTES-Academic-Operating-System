import React from "react"
import {
    MyFeedback,
} from "@/components/features/profile/Settings/MyFeedback"

/**
 * Route `/[locale]/profile/feedback` — renders the learner's received feedback.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <MyFeedback />
}

export default Page
