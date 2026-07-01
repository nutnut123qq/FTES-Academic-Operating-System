import React from "react"
import {
    MySubmissions,
} from "@/components/features/profile/Settings/MySubmissions"

/**
 * Route `/[locale]/profile/submissions` — renders the learner's challenge
 * submissions. Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <MySubmissions />
}

export default Page
