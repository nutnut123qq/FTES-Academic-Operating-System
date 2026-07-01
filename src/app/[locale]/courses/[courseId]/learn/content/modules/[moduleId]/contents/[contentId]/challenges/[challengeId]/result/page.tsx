"use client"

import React from "react"
import { SubmissionResult } from "@/components/features/learn/Challenge/SubmissionResult"

/**
 * Route `…/challenges/[challengeId]/result` — the dedicated challenge grading result
 * page (replaces the old drawer → modal stack). Reads `?submission=<requirementId>`
 * + `?attempt=<id>`. Thin route file: mounts the feature, no logic here.
 */
const Page = () => {
    return (
        <SubmissionResult />
    )
}

export default Page
