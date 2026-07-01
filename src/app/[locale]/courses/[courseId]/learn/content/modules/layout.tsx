"use client"

import React from "react"

interface LayoutProps {
    children: React.ReactNode
}

/**
 * Modules route layout. The content-column shell + right module-outline rail live in the
 * shared learn layout; the lesson breadcrumb now lives INSIDE the PageHeader (ContentHeader)
 * so the whole header reads as one unit (challenge solve pages keep their own "← Quay lại
 * bài học" back link). This layout just passes children through.
 */
const Layout = ({ children }: LayoutProps) => <>{children}</>

export default Layout
