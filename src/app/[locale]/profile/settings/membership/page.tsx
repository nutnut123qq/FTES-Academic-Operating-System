import React from "react"
import { Membership } from "@/components/features/profile/Membership"

/**
 * Route `/[locale]/profile/membership` — renders the community membership
 * (single-product purchase) feature. Thin route file: only mounts the
 * component, no logic/UI here.
 */
const Page = () => {
    return <Membership />
}

export default Page
