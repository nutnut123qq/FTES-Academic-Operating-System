import React from "react"
import {
    MyAttempts,
} from "@/components/features/profile/Settings/MyAttempts"

/**
 * Route `/[locale]/profile/attempts` — renders the learner's milestone-task
 * attempts. Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <MyAttempts />
}

export default Page
