"use client"

import React from "react"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"

/**
 * `/community/campus` — the Campus feed (BE `feed(tab: CAMPUS, campus)`). No campus arg is
 * passed, so the BE scopes to the viewer's profile campus and returns an empty connection
 * (with a guide-to-profile empty state) when the viewer hasn't set one.
 */
const Page = () => <CommunityFeed tab="campus" />

export default Page
