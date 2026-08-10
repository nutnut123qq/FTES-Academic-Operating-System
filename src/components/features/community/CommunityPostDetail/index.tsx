"use client"

import React from "react"
import { useParams } from "next/navigation"
import { CommunityPostContent } from "./CommunityPostContent"

/**
 * Community post detail (§6), Threads-style. A thin route wrapper: it reads the
 * `postId` from the `/community/{postId}` route and hands it to the shared
 * {@link CommunityPostContent}, which renders the post + its live comment thread
 * with the full engagement / ownership wiring. The photo lightbox's right pane
 * renders the SAME component, so the two surfaces never diverge.
 */
export const CommunityPostDetail = () => {
    const { postId } = useParams<{ postId: string }>()
    return <CommunityPostContent postId={postId} />
}
