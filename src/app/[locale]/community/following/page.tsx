"use client"

import React from "react"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"

/** `/community/following` — the Following feed (BE `feed(tab: FOLLOWING)`). */
const Page = () => <CommunityFeed tab="following" />

export default Page
