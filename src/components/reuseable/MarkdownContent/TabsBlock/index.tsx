"use client"

import React from "react"
import { CodePreviewTabs } from "../CodePreviewTabs"

/**
 * One pane inside a `:::tab` block: the source code (`:::code` → ` ```tsx ` Shiki) or the live
 * demo (`:::preview` → ` ```mdx ` render). It only renders its children (the fence rendered by the
 * normal `pre` handler); {@link TabsBlock} identifies which pane is which by the original directive
 * tag name (`tabcode`/`tabpreview`), not by this prop.
 */
export const TabPane = (
    { children }: { kind: "code" | "preview", children?: React.ReactNode },
) => <>{children}</>

/** The hast node react-markdown threads onto every element renderer via the `node` prop. */
interface NodeProp {
    node?: { tagName?: string }
}

/**
 * Renders a `:::tab` block as **[ Preview | Code ]** tabs via the shared {@link CodePreviewTabs}.
 *
 * Use this (not a single ` ```mdx `) when the real code has logic/imports that can't be evaluated:
 * the `:::code` pane shows the FULL code (Shiki, not rendered) and the `:::preview` pane shows a
 * separate renderable demo.
 *
 * Panes are matched by the original directive tag name carried on each child's `node` prop
 * (`tabcode` / `tabpreview`) — order-independent. NOTE: the children TabsBlock receives are the
 * `tabcode`/`tabpreview` element renderers themselves, whose own props are only `{ node, children }`;
 * the `kind` lives on the `TabPane` they *return*, so it is NOT visible here — match on `node.tagName`.
 * @param props.children - The `:::code` / `:::preview` pane elements.
 */
export const TabsBlock = ({ children }: { children?: React.ReactNode }) => {
    let previewNode: React.ReactNode = null
    let codeNode: React.ReactNode = null
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement(child)) {
            return
        }
        const tagName = (child.props as NodeProp).node?.tagName
        if (tagName === "tabpreview") {
            previewNode = child
        } else if (tagName === "tabcode") {
            codeNode = child
        }
    })

    if (previewNode == null && codeNode == null) {
        return <>{children}</>
    }
    return <CodePreviewTabs preview={previewNode} code={codeNode} />
}
