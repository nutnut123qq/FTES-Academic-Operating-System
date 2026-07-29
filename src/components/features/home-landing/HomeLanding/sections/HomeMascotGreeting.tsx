"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { FtesMascot } from "@/components/reuseable/FtesMascot"

/**
 * FrosTES's welcome under the "Continue learning" band — a SMALL, subtle one-liner:
 * a `sm` mascot next to a short "welcome back, {name}" line, NOT a hero-sized speech
 * bubble occupying its own band. It reads as a friendly footer beneath the
 * resume-your-courses section, never a banner. Signed-in viewers are greeted by name;
 * guests get a short invite. The second sentence of the old greeting is dropped so the
 * line stays compact.
 *
 * Deliberately NON-nagging ambient chrome: it never blocks content, shows on every
 * visit with no dismiss and no localStorage, and is the ONLY mascot on the landing
 * page (guardrail: one mascot per page). The mascot art is decorative
 * ({@link FtesMascot}); the text carries the meaning. Reduced-motion is handled inside
 * {@link FtesMascot}.
 *
 * Auth comes from Redux, which is unauthenticated on first paint (matches SSR), then
 * flips to the signed-in copy once Keycloak resolves — a normal state transition, not a
 * hydration mismatch.
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
        <div className="flex items-center gap-3">
            <FtesMascot pose="greeting" size="sm" />
            <p className="text-sm font-medium text-foreground/80">
                {isSignedIn ? welcomeTitle : t("guestTitle")}
            </p>
        </div>
    )
}
