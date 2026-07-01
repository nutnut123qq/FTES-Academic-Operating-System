import React, { PropsWithChildren } from "react"
import { CommunityShell } from "@/components/features/community/CommunityShell"

/** `/[locale]/community` shell — scope tabs over the feed (§6). */
const Layout = ({ children }: PropsWithChildren) => <CommunityShell>{children}</CommunityShell>

export default Layout
