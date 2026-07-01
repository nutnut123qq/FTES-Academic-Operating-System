import React from "react"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"

/**
 * Route `/[locale]/community` — the public community feed (posts + reactions).
 * Thin route file: mounts the feature; all logic/UI lives in the component.
 */
const Page = () => {
    return <CommunityFeed />
}

export default Page
