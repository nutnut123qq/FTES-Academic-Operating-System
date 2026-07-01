import React from "react"
import { AiSubscription } from "@/components/features/profile/AiSubscription"

/**
 * Route `/[locale]/profile/ai-subscription` — renders the AI subscription
 * (plan picker / purchase) feature. Thin route file: only mounts the
 * component, no logic/UI here.
 */
const Page = () => {
    return <AiSubscription />
}

export default Page
