"use client"

import React, { PropsWithChildren } from "react"
import { useSelectedLayoutSegment } from "next/navigation"
import { ProfileShell } from "@/components/features/profile/ProfileShell"
import { SettingsShell } from "@/components/features/profile/Settings/SettingsShell"

/**
 * `/[locale]/profile` shell — 2-column identity + section tabs (§2).
 *
 * EXCEPTION: the account **Settings** subtree (`/profile/settings/*`) is a STANDALONE account page,
 * NOT a profile section — it must not sit inside the profile identity + section-tab frame. When the
 * active child segment is `settings`, it gets its OWN {@link SettingsShell} (navigation rail +
 * section) instead of the `ProfileShell`. Other segments
 * (personal/academic/cv/portfolio/certificates/community/progress) keep the shell.
 */
const Layout = ({ children }: PropsWithChildren) => {
    const segment = useSelectedLayoutSegment()

    if (segment === "settings") {
        return <SettingsShell>{children}</SettingsShell>
    }

    return <ProfileShell>{children}</ProfileShell>
}

export default Layout
