import React from "react"
import { cn, Typography } from "@heroui/react"
import { CaretRightIcon } from "@phosphor-icons/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for the {@link ArchitectureFlow} block. */
export interface ArchitectureFlowProps extends WithClassNames<undefined> {
    /** Ordered node labels rendered as boxes joined by caret connectors (left → right). */
    nodes: ReadonlyArray<string>
}

/**
 * A compact, coded mini-architecture diagram: labelled node boxes joined by caret
 * connectors — a representative system flow (e.g. `Client → Fanout → Cache → DB`).
 * Pure CSS, no image. Wraps on narrow widths. Tier-3 block — owns styling, content
 * via props. Use to visualise "the real systems you build" without screenshots.
 *
 * @param props - {@link ArchitectureFlowProps}
 */
export const ArchitectureFlow = ({ nodes, className }: ArchitectureFlowProps) => {
    return (
        <div className={cn("flex flex-wrap items-center gap-1.5", className)}>
            {nodes.map((node, index) => (
                <React.Fragment key={`${node}-${index}`}>
                    {index > 0 ? (
                        <CaretRightIcon aria-hidden focusable="false" className="size-3 shrink-0 text-muted" />
                    ) : null}
                    <span className="rounded-md border border-default bg-default px-2 py-1">
                        <Typography type="code" className="text-xs">
                            {node}
                        </Typography>
                    </span>
                </React.Fragment>
            ))}
        </div>
    )
}
