import React from "react"
import { HomeLanding } from "@/components/features/home-landing/HomeLanding"

/**
 * `/[locale]` — the academic-OS landing (product tour + bento).
 *
 * The ONLY route that turns the signed-in redirect on. This is where a bare domain
 * lands and where a guest signs in through the landing's own modal, so "already signed
 * in → straight to the workspace" (góp ý #23) belongs here. `/[locale]/home` renders the
 * same landing WITHOUT the redirect, so the marketing page stays reachable.
 */
const Page = () => <HomeLanding redirectSignedIn />

export default Page
