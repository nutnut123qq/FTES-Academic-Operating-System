import React, { PropsWithChildren } from "react"
import { GroupDetailShell } from "@/components/features/group/GroupDetailShell"

/** `/[locale]/groups/[groupId]` shell — group header + tabs (§7). */
const Layout = async ({ children, params }: PropsWithChildren<{ params: Promise<{ groupId: string }> }>) => {
    const { groupId } = await params
    return <GroupDetailShell groupId={groupId}>{children}</GroupDetailShell>
}

export default Layout
