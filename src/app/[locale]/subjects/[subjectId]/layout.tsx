import React, { PropsWithChildren } from "react"
import { SubjectWorkspaceShell } from "@/components/features/subject/SubjectWorkspaceShell"

/** Route params for a subject workspace. */
interface SubjectLayoutProps extends PropsWithChildren {
    /** Awaited `[locale]/subjects/[subjectId]` params. */
    params: Promise<{ subjectId: string }>
}

/**
 * `/[locale]/subjects/[subjectId]` shell — mounts the sidebar-rail workspace
 * (archetype A) around every tab page. Thin server wrapper: resolves the id and
 * hands it to the client shell.
 */
const Layout = async ({ children, params }: SubjectLayoutProps) => {
    const { subjectId } = await params
    return <SubjectWorkspaceShell subjectId={subjectId}>{children}</SubjectWorkspaceShell>
}

export default Layout
