import React, { PropsWithChildren } from "react"
import { CommunityNavShell } from "@/components/features/community/CommunityNavShell"

/** `/[locale]/groups` — community nav rail around the groups tree (§7, góp ý #21). */
const Layout = ({ children }: PropsWithChildren) => <CommunityNavShell>{children}</CommunityNavShell>

export default Layout
