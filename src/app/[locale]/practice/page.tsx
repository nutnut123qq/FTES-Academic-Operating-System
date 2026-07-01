import React from "react"
import { Practice } from "@/components/features/practice"

/**
 * Route `/[locale]/practice` — the coding-practice catalog (phase 1: list +
 * cockpit). Thin route file: mounts the feature; all logic/UI lives there.
 */
const Page = () => {
    return <Practice />
}

export default Page
