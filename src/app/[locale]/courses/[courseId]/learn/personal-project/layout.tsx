"use client"

import React from "react"
import { PersonalProjectWorkspace } from "@/components/features/learn/PersonalProject/PersonalProjectWorkspace"
import { useQueryMilestonesSwr } from "@/hooks/swr/api/graphql/queries/useQueryMilestonesSwr"

const Layout = () => {
    // Load the milestones list here (not only inside MilestoneSidebar): the milestone
    // rail now lives in the shared learn layout and is hidden when the right rail is
    // collapsed, but the task body + the dashboard still depend on `milestone.entities`,
    // so the fetch must run regardless of the rail's visibility. (The base route lands
    // on the dashboard now — no auto-forward into the first task.)
    useQueryMilestonesSwr()

    // The breadcrumb now lives INSIDE each route's reading column (TaskBreadcrumb in the
    // task split / the dashboard), so it shares that column's single p-6 instead of a
    // separate padded wrapper here.
    return <PersonalProjectWorkspace />
}

export default Layout
