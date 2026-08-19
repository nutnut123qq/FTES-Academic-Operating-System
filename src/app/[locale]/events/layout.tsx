import React, { PropsWithChildren } from "react"
import { CommunityNavShell } from "@/components/features/community/CommunityNavShell"

/** `/[locale]/events` — community nav rail around the events tree (§14, góp ý #21). */
const Layout = ({ children }: PropsWithChildren) => <CommunityNavShell>{children}</CommunityNavShell>

export default Layout
