"use client"

import React, { PropsWithChildren } from "react"
import { useSelectedLayoutSegment } from "next/navigation"
import { ProfileShell } from "@/components/features/profile/ProfileShell"

/**
 * `/[locale]/profile` shell — 2-column identity + section tabs (§2).
 *
 * EXCEPTION: the account **Settings** subtree (`/profile/settings/*`) is a STANDALONE account page,
 * NOT a profile section — it must not sit inside the profile identity + section-tab frame. When the
 * active child segment is `settings`, render it plain in its own centered container instead of the
 * `ProfileShell`. Other segments (personal/academic/cv/portfolio/certificates/community/progress) keep
 * the shell.
 */
const Layout = ({ children }: PropsWithChildren) => {
    const segment = useSelectedLayoutSegment()

    if (segment === "settings") {
        return <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">{children}</div>
    }

    return <ProfileShell>{children}</ProfileShell>
}

export default Layout
