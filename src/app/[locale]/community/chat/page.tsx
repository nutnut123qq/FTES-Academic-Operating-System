import React from "react"
import { CommunityChat } from "@/components/features/community/CommunityChat"

/**
 * Route `/[locale]/community/chat` — the member-only community chat surface
 * (global room + founder DM). Thin route file: mounts the feature.
 */
const Page = () => {
    return <CommunityChat />
}

export default Page
