"use client"

import React from "react"
import { useTranslations } from "next-intl"
import { useAppSelector } from "@/redux/hooks"
import { FtesMascot } from "@/components/reuseable/FtesMascot"
import { useQueryMyCoursesSwr } from "@/components/features/course/hooks/useQueryMyCoursesSwr"

/**
 * Display names the BE hands back for an account with no profile name of its own.
 * They are PLACEHOLDERS, not names — greeting someone as "Người dùng ẩn" reads like an
 * error, so the greeting treats them as "no name" and falls back to the friendly
 * name-less line ("Chào mừng trở lại, bạn học!"). Compared case-insensitively and only
 * HERE, at the greeting call-site: everywhere else (comment authors, member lists) the
 * placeholder is still the right thing to render.
 */
const PLACEHOLDER_DISPLAY_NAMES = ["người dùng ẩn", "ẩn danh", "anonymous", "anonymous user"]

/**
 * FrosTES's welcome on the landing — a SMALL, subtle one-liner (a `sm` mascot next to a
 * short "welcome back, {name}" line, NOT a hero-sized speech bubble), rendered INSIDE the
 * "Continue learning" band between its heading and the course cards, so it reads as a
 * friendly lead-in to "here's what you were doing". Signed-in viewers are greeted by name;
 * guests get a short invite. The second sentence of the old greeting stays dropped so the
 * line remains compact.
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
    const candidate = user?.displayName?.trim() || user?.username || ""
    // A BE placeholder ("Người dùng ẩn") is not a name — drop it so the friendly
    // name-less greeting ("… bạn học!") wins instead of echoing the placeholder.
    const name = PLACEHOLDER_DISPLAY_NAMES.includes(candidate.toLowerCase()) ? "" : candidate

    // Signed-in copy: greet by name when we have one, else the name-less "welcome
    // back, bạn học" — never interpolate an empty name into "Chào mừng trở lại, !".
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

/**
 * Fallback band for {@link HomeMascotGreeting} — renders the greeting in its own
 * band right after the hero ONLY when the "Continue learning" band is not on the
 * page (anonymous visitor, or a signed-in viewer with no active enrollment), since
 * that band hosts the greeting itself when it renders.
 *
 * Reads the SAME `useQueryMyCoursesSwr` (fixed SWR key → deduped, no second
 * request) as `MyCoursesSection` so the two can never disagree: exactly one mascot
 * shows on the landing in every state — never two, never none.
 */
export const HomeMascotGreetingBand = () => {
    const { hasCourses } = useQueryMyCoursesSwr()
    // the courses band is rendering the greeting inside itself → don't duplicate it
    if (hasCourses) return null

    return (
        <section className="mx-auto flex w-full max-w-6xl px-4 py-6 sm:px-6">
            <HomeMascotGreeting />
        </section>
    )
}
