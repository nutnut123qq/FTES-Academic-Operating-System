import React from "react"
import { HomeLanding } from "@/components/features/home-landing/HomeLanding"

/**
 * `/[locale]` — the academic-OS landing (product tour + bento).
 *
 * Renders the landing for EVERYONE, signed in or not. The "already signed in → straight
 * to the dashboard" redirect (góp ý #23) was removed on 2026-08-21 by the product owner's
 * call; see the {@link HomeLanding} docblock for why it kept costing more than it bought.
 */
const Page = () => <HomeLanding />

export default Page
