"use client"

import React from "react"
import type { PropsWithChildren } from "react"
import { LearnSidebar } from "@/components/features/learn/LearnShell/LearnSidebar"

/**
 * Course shell with sidebar for headhunting company routes (outside `/learn`).
 */
export const Layout = ({ children }: PropsWithChildren) => {
    return (
        <div className="flex w-full flex-col items-start lg:flex-row">
            <aside className="hidden shrink-0 lg:sticky lg:top-16 lg:block lg:h-[calc(100dvh-4rem)]">
                <LearnSidebar />
            </aside>
            <div className="min-h-0 min-w-0 flex-1">
                {children}
            </div>
        </div>
    )
}

export default Layout
