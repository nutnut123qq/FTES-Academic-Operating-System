import React from "react"
import { cn } from "@heroui/react"
import type { ReactNode } from "react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link PageContainer} block. */
export interface PageContainerProps extends WithClassNames<undefined> {
    /** Page content, composed by the caller. */
    children: ReactNode
}

/**
 * Standard page shell — centers content at a max width with the responsive
 * horizontal gutter + vertical rhythm. Owns the page padding so features (which
 * must not use `p-*`) compose inside it. Override spacing via `className`.
 *
 * @param props - {@link PageContainerProps}
 */
export const PageContainer = ({ children, className }: PageContainerProps) => {
    return (
        <div
            className={cn(
                "mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 lg:px-8",
                className,
            )}
        >
            {children}
        </div>
    )
}
