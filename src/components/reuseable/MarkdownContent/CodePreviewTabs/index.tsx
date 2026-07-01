"use client"

import React, { useState } from "react"
import { Tabs, cn } from "@heroui/react"
import { Code, LayoutSplitSideContentLeft } from "@gravity-ui/icons"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Props for {@link CodePreviewTabs}. */
export interface CodePreviewTabsProps extends WithClassNames<undefined> {
    /** Live render (the rendered React component). */
    preview: React.ReactNode
    /** Source code panel (Shiki-highlighted). */
    code: React.ReactNode
}

/**
 * Presentational **[ Preview | Code ]** tabs, self-contained (HeroUI `Tabs` + gravity icons).
 * Preview is selected first so the learner sees the rendered result, then flips to the code.
 * Shared by {@link RenderReactComponent} (single ` ```mdx ` source) and TabsBlock (dual
 * `:::tab` panes) so the tab shell stays identical and depends on NO layout component.
 * @param props - {@link CodePreviewTabsProps}
 */
export const CodePreviewTabs = ({ preview, code, className }: CodePreviewTabsProps) => {
    const [tab, setTab] = useState<"preview" | "code">("preview")
    return (
        <div className={cn("not-prose flex flex-col gap-1.5", className)}>
            <Tabs
                selectedKey={tab}
                variant="secondary"
                onSelectionChange={(key) => setTab(String(key) === "code" ? "code" : "preview")}
            >
                <Tabs.ListContainer className="w-fit bg-transparent">
                    <Tabs.List aria-label="Preview / Code" className="w-fit bg-transparent">
                        <Tabs.Tab
                            id="preview"
                            className="gap-1.5 rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                        >
                            <LayoutSplitSideContentLeft />
                            Preview
                        </Tabs.Tab>
                        <Tabs.Tab
                            id="code"
                            className="gap-1.5 rounded-none data-[selected=true]:border-b-2 data-[selected=true]:border-accent data-[selected=true]:text-accent"
                        >
                            <Code />
                            Code
                        </Tabs.Tab>
                    </Tabs.List>
                </Tabs.ListContainer>
            </Tabs>
            <div className={tab === "preview" ? "rounded-xl border border-divider p-3" : undefined}>
                {tab === "preview" ? preview : code}
            </div>
        </div>
    )
}
