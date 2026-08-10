"use client"

import React, { useEffect, useState } from "react"
import { Button } from "@heroui/react"
import { useTranslations } from "next-intl"
import { useRouter } from "@/i18n/navigation"
import { useAppSelector } from "@/redux/hooks"
import { useTour } from "@/components/features/onboarding"
import { MascotBubble } from "@/components/reuseable/FtesMascot"
import { isNudgeDismissed, markNudgeDismissed } from "./persistence"

/** localStorage id for the once-per-device "complete your profile" nudge. */
const NUDGE_ID = "completeProfile"

/**
 * Migration placeholder written into `display_name` for legacy accounts — it is a
 * raw id, not a name. Mirrors the backend's `profile.api.DisplayNames`.
 */
const LEGACY_NAME_PREFIX = "legacy_"

/**
 * Whether the signed-in user's profile is missing enough to be worth nudging:
 * no avatar, no bio, or no real display name — meaning empty, still falling back
 * to the username, or still the `legacy_<uuid>` migration placeholder (which
 * differs from the username, so a plain equality check would wrongly read it as
 * a name and never nudge the very group that needs it). Kept intentionally light
 * so the nudge only fires for genuinely bare profiles.
 */
const isProfileIncomplete = (user: {
    username: string
    avatar?: string
    bio?: string | null
    displayName?: string | null
} | null): boolean => {
    if (!user) return false
    const hasAvatar = Boolean(user.avatar)
    const hasBio = Boolean(user.bio && user.bio.trim())
    const name = user.displayName?.trim() ?? ""
    const hasName = Boolean(name) && name !== user.username && !name.startsWith(LEGACY_NAME_PREFIX)
    return !hasAvatar || !hasBio || !hasName
}

/**
 * A pointing-mascot nudge inviting the signed-in viewer to finish setting up
 * their profile. Shows AT MOST ONCE PER DEVICE (dismissed forever via
 * {@link isNudgeDismissed}), never while a guided tour is on screen
 * (`useTour().isActive`), and only when the profile is actually sparse. Dismiss
 * is explicit ("×") and persistent.
 *
 * Renders nothing on the server, for guests, for complete profiles, during a
 * tour, or after dismissal — so callers can drop it in without stacking mascots
 * (one mascot per page). See `openspec/changes/onboarding-mascot-guide`.
 */
export const MascotProfileNudge = () => {
    const t = useTranslations("mascot.nudge.completeProfile")
    const router = useRouter()
    const user = useAppSelector((state) => state.user.user)
    const authenticated = useAppSelector((state) => state.keycloak.authenticated)
    const { isActive: tourActive } = useTour()

    // Decide on the client only (localStorage + SSR-safe): start hidden, then
    // reveal once we know it hasn't been dismissed on this device.
    const [dismissed, setDismissed] = useState(true)
    useEffect(() => {
        setDismissed(isNudgeDismissed(NUDGE_ID))
    }, [])

    const onDismiss = () => {
        markNudgeDismissed(NUDGE_ID)
        setDismissed(true)
    }

    const onComplete = () => {
        onDismiss()
        router.push("/profile/edit")
    }

    if (!authenticated || dismissed || tourActive || !isProfileIncomplete(user)) {
        return null
    }

    return (
        <div className="rounded-2xl border border-default bg-surface p-3">
            <MascotBubble
                pose="point"
                title={t("title")}
                actions={
                    <>
                        <Button size="sm" variant="primary" onPress={onComplete}>
                            {t("cta")}
                        </Button>
                        <Button size="sm" variant="tertiary" onPress={onDismiss}>
                            {t("dismiss")}
                        </Button>
                    </>
                }
            >
                {t("body")}
            </MascotBubble>
        </div>
    )
}
