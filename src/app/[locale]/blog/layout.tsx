import React, { PropsWithChildren } from "react"
import { CommunityNavShell } from "@/components/features/community/CommunityNavShell"

/** `/[locale]/blog` — community nav rail around the blog tree (góp ý #21). */
const Layout = ({ children }: PropsWithChildren) => <CommunityNavShell>{children}</CommunityNavShell>

export default Layout
