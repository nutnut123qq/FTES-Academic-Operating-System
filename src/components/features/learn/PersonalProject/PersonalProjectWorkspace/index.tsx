"use client"

import React from "react"
import { cn } from "@heroui/react"
import { useParams, usePathname } from "next/navigation"
import { Task } from ".."
import {
    TaskBreadcrumb,
} from "../TaskBreadcrumb"
import {
    TaskSubmissionPanel,
} from "../TaskSubmissionPanel"
import {
    PersonalProjectDashboard,
} from "../PersonalProjectDashboard"
import {
    PersonalProjectTaskResult,
} from "../TaskResult"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link PersonalProjectWorkspace}. */
export type PersonalProjectWorkspaceProps = WithClassNames<undefined>

/**
 * Split workspace for the personal-project task page: the task BRIEF on the left
 * (swaps per task) and the persistent submission PANEL on the right (project-level —
 * repo/branch/lang + evaluate + result). Read on the left, act on the right. The
 * panel is **pinned** (`xl:sticky top-24` — pins ~2rem below the navbar so the
 * "Github dự án" label keeps breathing room instead of jamming under it; `self-start`
 * so it doesn't stretch in the flex row; bounded `max-h` + internal scroll so a tall
 * panel stays fully visible) — it stays in view while the long brief scrolls.
 *
 * The content column sits beside the milestone rail (now the left rail), so the
 * inner split only opens at `xl` to avoid cramping; below `xl` it stacks (brief
 * first, panel below), degrading to a clean single reading column. The two `xl`
 * columns are different layout REGIONS (reading vs action), so they sit `xl:gap-8`
 * apart (not the `gap-6` content rhythm). `"use client"` only for the colocated
 * features.
 * @param props - optional className for the root element
 */
export const PersonalProjectWorkspace = ({
    className,
}: PersonalProjectWorkspaceProps = {}) => {
    const params = useParams()
    const pathname = usePathname()
    const taskId = typeof params?.taskId === "string" ? params.taskId : undefined

    // no task in the URL (`/personal-project` index) → the project dashboard
    // (overview), not an empty column; a task route → the read-left / act-right split.
    if (!taskId) {
        return <PersonalProjectDashboard className={className} />
    }

    // `…/tasks/[taskId]/result` → the grading result page (full content column; the
    // milestone left-rail from the shell stays). The brief/panel split is for the task itself.
    if (/\/result\/?$/.test(pathname)) {
        return <PersonalProjectTaskResult className={className} />
    }

    return (
        <div className={cn("flex flex-col gap-6 xl:flex-row xl:items-start xl:gap-8", className)}>
            <div className="min-w-0 flex-1">
                {/* reading column: breadcrumb + brief share ONE max-w-3xl column (no separate padded
                    breadcrumb wrapper), CENTERED (`mx-auto`) within the reading region so the brief
                    sits in the middle. The column's padding is the shell's `p-6` — not re-padded here. */}
                <div className="mx-auto flex w-full max-w-3xl flex-col gap-3">
                    <TaskBreadcrumb />
                    <Task />
                </div>
            </div>
            <aside className="w-full shrink-0 xl:sticky xl:top-24 xl:max-h-[calc(100dvh-7rem)] xl:w-[360px] xl:self-start xl:overflow-y-auto">
                <TaskSubmissionPanel />
            </aside>
        </div>
    )
}
