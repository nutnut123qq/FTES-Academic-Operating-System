import React, { PropsWithChildren } from "react"
import { ProfileShell } from "@/components/features/profile/ProfileShell"

/** `/[locale]/profile` shell — 2-column identity + section tabs (§2). */
const Layout = ({ children }: PropsWithChildren) => <ProfileShell>{children}</ProfileShell>

export default Layout
