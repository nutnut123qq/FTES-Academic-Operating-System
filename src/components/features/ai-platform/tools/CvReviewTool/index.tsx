"use client"

import React from "react"
import { AiToolShell } from "../AiToolShell"
import { CvReviewCore } from "./CvReviewCore"

/**
 * `/ai/tools/cv-review` — the Harvard CV builder + AI review tool. Thin wrapper
 * that dresses the shared {@link CvReviewCore} in the standard AI-tool chrome
 * (back-to-hub header + quota chip). The profile page reuses the same core inside
 * its own chrome, so the builder/upload/review UI lives in one place.
 */
export const CvReviewTool = () => (
    <AiToolShell toolKey="cvReview">
        <CvReviewCore />
    </AiToolShell>
)

export { CvReviewCore } from "./CvReviewCore"
