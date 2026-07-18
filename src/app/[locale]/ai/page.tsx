import React from "react"
import { AiHub } from "@/components/features/ai-platform/AiHub"
import { RecommendationFeed } from "@/components/features/recommendation/RecommendationFeed"

/**
 * `/ai` — the §9 AI Platform tools hub, followed by the personalized "for you"
 * recommendation feed (folded in from the retired standalone `/recommendations`
 * entry, so discovery lives alongside the AI Assistant).
 */
const Page = () => (
    <>
        <AiHub />
        <RecommendationFeed />
    </>
)

export default Page
