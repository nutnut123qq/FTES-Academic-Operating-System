import React from "react"
import { RewardsPage } from "@/components/layouts/rewards/RewardsPage"

/**
 * Route `/[locale]/rewards` — the "điểm quà" gifts store. Thin route file: mounts
 * the store component; all catalog/wallet/redeem logic lives in the component.
 */
const Page = () => {
    return <RewardsPage />
}

export default Page
