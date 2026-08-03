"use client"

import React, { useState } from "react"
import { CaretRightIcon, FileCodeIcon, FolderIcon, FolderOpenIcon } from "@phosphor-icons/react"
import { cn } from "@heroui/react"
import type { WithClassNames } from "@/modules/types/base/class-name"

/** Per-file review status driving the node colour (PIN §4B: green clean / orange changed). */
export type ProjectFileStatus = "clean" | "changed"

/** Props for {@link ProjectFileTree}. */
export interface ProjectFileTreeProps extends WithClassNames<undefined> {
    /** Flat list of project-relative POSIX paths (from the zip / BE tree). */
    paths: Array<string>
    /**
     * Optional per-path status colouring. When provided, each file node is tinted
     * `changed` (warning) / `clean` (success); omit for a neutral preview tree (no grade
     * yet). Paths absent from the map fall back to `clean`.
     */
    statusByPath?: Record<string, ProjectFileStatus>
    /** The currently-open file (highlighted). Omit when no file is selectable. */
    selectedPath?: string
    /** File-click handler. Omit → the tree is a read-only structure preview. */
    onSelect?: (path: string) => void
}

/** One node of the derived tree — a directory (has `children`) or a file leaf. */
interface TreeNode {
    /** Segment name shown in the row. */
    name: string
    /** Full project-relative path (files carry the meaningful path). */
    path: string
    /** Child nodes keyed by segment name; empty for a file. */
    children: Map<string, TreeNode>
    /** True for a file leaf. */
    isFile: boolean
}

/** Builds the nested tree from the flat path list. */
const buildTree = (paths: Array<string>): TreeNode => {
    const root: TreeNode = { name: "", path: "", children: new Map(), isFile: false }
    for (const path of paths) {
        const segments = path.split("/").filter((segment) => segment.length > 0)
        let cursor = root
        segments.forEach((segment, index) => {
            const isLast = index === segments.length - 1
            let child = cursor.children.get(segment)
            if (!child) {
                child = {
                    name: segment,
                    path: segments.slice(0, index + 1).join("/"),
                    children: new Map(),
                    isFile: isLast,
                }
                cursor.children.set(segment, child)
            }
            cursor = child
        })
    }
    return root
}

/** Directories first, then files; each group alphabetical (VS Code order). */
const sortNodes = (nodes: Array<TreeNode>): Array<TreeNode> =>
    [...nodes].sort((a, b) => {
        if (a.isFile !== b.isFile) {
            return a.isFile ? 1 : -1
        }
        return a.name.localeCompare(b.name)
    })

/** Left indent (px) for a row at a given tree depth — keeps rows aligned as depth grows. */
const indentStyle = (depth: number): React.CSSProperties => ({
    paddingInlineStart: `${depth * 14 + 8}px`,
})

/**
 * A read-only, VS Code-style file tree derived from a flat path list (PIN §4A/§4B). Pure
 * and props-only: folders collapse/expand locally (presentational state), files colour by
 * {@link ProjectFileTreeProps.statusByPath} (success = no change, warning = has a flagged
 * change) and fire {@link ProjectFileTreeProps.onSelect} when clickable. All copy stays
 * out of the block — the feature owns i18n; this renders structure + icons only.
 */
export const ProjectFileTree = ({
    paths,
    statusByPath,
    selectedPath,
    onSelect,
    className,
}: ProjectFileTreeProps) => {
    // A folder is expanded unless its path is in this set (default: everything open).
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())
    const root = buildTree(paths)

    const toggle = (path: string) => {
        setCollapsed((prev) => {
            const next = new Set(prev)
            if (next.has(path)) {
                next.delete(path)
            } else {
                next.add(path)
            }
            return next
        })
    }

    const renderFile = (node: TreeNode, depth: number): React.ReactNode => {
        const status: ProjectFileStatus = statusByPath?.[node.path] ?? "clean"
        const hasStatus = statusByPath !== undefined
        const isChanged = hasStatus && status === "changed"
        const isSelected = selectedPath === node.path
        // File name colour: warning when flagged, success when reviewed-clean, plain
        // foreground for a pre-grade preview (no statusByPath given).
        const nameColor = !hasStatus ? "text-foreground" : isChanged ? "text-warning" : "text-success"

        const inner = (
            <>
                {/* Spacer aligning file rows with the folders' caret column. */}
                <span aria-hidden className="size-4 shrink-0" />
                <FileCodeIcon
                    aria-hidden
                    focusable="false"
                    className={cn("size-4 shrink-0", isChanged ? "text-warning" : "text-muted")}
                />
                <span className={cn("truncate", nameColor)}>{node.name}</span>
                {isChanged ? (
                    <span aria-hidden className="ms-auto size-2 shrink-0 rounded-full bg-warning" />
                ) : null}
            </>
        )

        if (onSelect) {
            return (
                <button
                    key={node.path}
                    type="button"
                    onClick={() => onSelect(node.path)}
                    aria-current={isSelected ? "true" : undefined}
                    style={indentStyle(depth)}
                    className={cn(
                        "flex w-full cursor-pointer items-center gap-2 rounded-md py-1 pe-2 text-start text-sm transition-colors hover:bg-surface-secondary",
                        isSelected && "bg-accent/10",
                    )}
                >
                    {inner}
                </button>
            )
        }
        return (
            <div
                key={node.path}
                style={indentStyle(depth)}
                className="flex w-full items-center gap-2 rounded-md py-1 pe-2 text-start text-sm"
            >
                {inner}
            </div>
        )
    }

    const renderNodes = (node: TreeNode, depth: number): Array<React.ReactNode> =>
        sortNodes([...node.children.values()]).flatMap((child) => {
            if (child.isFile) {
                return [renderFile(child, depth)]
            }
            const isOpen = !collapsed.has(child.path)
            return [
                <button
                    key={child.path}
                    type="button"
                    onClick={() => toggle(child.path)}
                    aria-expanded={isOpen}
                    style={indentStyle(depth)}
                    className="flex w-full items-center gap-2 rounded-md py-1 pe-2 text-start text-sm text-foreground transition-colors hover:bg-surface-secondary"
                >
                    <CaretRightIcon
                        aria-hidden
                        focusable="false"
                        className={cn("size-4 shrink-0 text-muted transition-transform", isOpen && "rotate-90")}
                    />
                    {isOpen ? (
                        <FolderOpenIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-muted" />
                    ) : (
                        <FolderIcon aria-hidden focusable="false" weight="fill" className="size-4 shrink-0 text-muted" />
                    )}
                    <span className="truncate">{child.name}</span>
                </button>,
                ...(isOpen ? renderNodes(child, depth + 1) : []),
            ]
        })

    return <div className={cn("flex flex-col gap-0", className)}>{renderNodes(root, 0)}</div>
}
