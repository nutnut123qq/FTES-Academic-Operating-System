"use client"

import React from "react"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"

/**
 * `/community/trending` — trending posts (§6). Renders the SAME full post-card feed as every other
 * scope tab (For you / Following / Campus) via the shared {@link CommunityFeed}; the feed hook maps
 * this tab to the BE `feed(tab: TRENDING)` connection, so trending rows carry the real author,
 * snippet, media and engagement instead of the previous sparse "rank + title + likes" list.
 */
const Page = () => <CommunityFeed tab="trending" />

export default Page
