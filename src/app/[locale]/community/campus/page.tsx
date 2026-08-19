"use client"

import React from "react"
import { CommunityFeed } from "@/components/features/community/CommunityFeed"

/**
 * `/community/campus` — the Campus feed (BE `feed(tab: CAMPUS, campus)`). The feed itself owns
 * the campus picker this tab shows: its default sends NO campus arg, so the BE scopes to the
 * viewer's profile campus (empty, with a guide-to-profile hint, when they never set one), and
 * picking a campus sends that code instead.
 */
const Page = () => <CommunityFeed tab="campus" />

export default Page
