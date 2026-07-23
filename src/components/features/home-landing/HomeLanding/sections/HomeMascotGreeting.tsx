"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { MascotBubble } from "@/components/reuseable/FtesMascot"

/**
 * FrosTES's welcome at the top of the landing hero — a compact, persistent
 * greeting bubble (pose `greeting`). Signed-in viewers get a "welcome back,
 * {name}" line; guests get an invitation to explore.
 *
 * Deliberately NON-nagging: it is ambient hero chrome, not a moment — it never
 * blocks content, so it shows on every visit with no dismiss and no
 * localStorage. This is the ONLY mascot on the landing page (guardrail: one
 * mascot per page); reduced-motion is handled inside {@link MascotBubble} /
 * {@link FtesMascot}. `announce={false}` because the copy is static decorative
 * chrome that never changes after mount.
 *
 * Auth comes from Redux, which is unauthenticated on first paint (matches SSR),
 * then flips to the signed-in copy once Keycloak resolves — a normal state
 * transition, not a hydration mismatch.
 */
export const HomeMascotGreeting = () => {
    const t = useTranslations("mascot.greeting.home")
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const user = useAppSelector((state) => state.user.user)

    const isSignedIn = authenticated && Boolean(user)
    const name = user?.displayName?.trim() || user?.username || ""

    // Signed-in copy: greet by name when we have one, else a name-less "welcome
    // back" — never interpolate an empty name into "Chào mừng trở lại, !".
    const welcomeTitle = name ? t("welcomeTitle", { name }) : t("welcomeTitleNoName")

    return (
        <MascotBubble
            pose="greeting"
            size="md"
            announce={false}
            title={isSignedIn ? welcomeTitle : t("guestTitle")}
            className="w-full max-w-md"
        >
            {isSignedIn ? t("welcomeBody") : t("guestBody")}
        </MascotBubble>
    )
}
