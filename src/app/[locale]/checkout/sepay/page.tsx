import React from "react"
import { SepayCheckout } from "@/components/layouts/checkout/SepayCheckout"

/**
 * Route `/[locale]/checkout/sepay` — renders the SePay QR checkout flow.
 * Thin route file: only mounts the component, no logic/UI here.
 */
const Page = () => {
    return <SepayCheckout />
}

export default Page
