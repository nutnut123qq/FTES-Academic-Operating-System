import React from "react"
import { cn, Table } from "@heroui/react"
import {
    flattenMarkdownTableHeaderChildren,
    isMarkdownHeaderTableRowNode,
} from "./utils"
import type { WithClassNames } from "@/modules/types/base/class-name"

/**
 * Builds a HeroUI header column from a rendered `th`/`Table.Column` or body `Table.Cell`.
 * @param column - Rendered header cell from markdown.
 * @param index - Zero-based column index in the header row.
 * @returns A `Table.Column` with `isRowHeader` on the first column (HeroUI requirement).
 */
const toMarkdownHeaderColumn = (column: React.ReactNode, index: number): React.ReactNode => {
    if (!React.isValidElement<{ children?: React.ReactNode }>(column)) {
        return column
    }
    return (
        <Table.Column key={`md-th-${index}`} isRowHeader={index === 0}>
            {column.props.children}
        </Table.Column>
    )
}

/** Props for markdown table row/cell parts (optional HAST `node` when `passNode` is on). */
interface MarkdownTablePartProps extends WithClassNames<undefined> {
    /** Rendered cell content. */
    children?: React.ReactNode
    /** HAST element for the markdown row (requires `passNode` on `ReactMarkdown`). */
    node?: unknown
}

/**
 * Header row: columns must be direct children of `Table.Header` (fragment, not `Table.Row`).
 * Body row: wrapped in HeroUI `Table.Row`.
 */
export const MarkdownTableRow = ({ children, node, className }: MarkdownTablePartProps) => {
    if (isMarkdownHeaderTableRowNode(node)) {
        return <>{children}</>
    }

    return <Table.Row className={cn(className)}>{children}</Table.Row>
}

/**
 * Maps markdown `thead` to HeroUI `Table.Header`.
 * Rebuilds columns with `isRowHeader` on the first column (required by HeroUI / React Aria).
 * Renders a screen-reader-only column when the header row is empty so the table still mounts.
 */
export const MarkdownTableHead = ({ children, className }: MarkdownTablePartProps) => {
    const columns = flattenMarkdownTableHeaderChildren(children)

    return (
        <Table.Header className={cn(className)}>
            {columns.length === 0 ? (
                <Table.Column isRowHeader className="sr-only">
                    {" "}
                </Table.Column>
            ) : (
                columns.map((column, index) => toMarkdownHeaderColumn(column, index))
            )}
        </Table.Header>
    )
}

/** Props for {@link MarkdownTable}. */
export interface MarkdownTableProps extends WithClassNames<undefined> {
    /** Rendered `thead` / `tbody` from react-markdown. */
    children?: React.ReactNode
    /** Accessible name for `Table.Content`. */
    ariaLabel: string
}

/**
 * Wraps GFM tables in HeroUI `Table` and ensures a header row exists with `isRowHeader`.
 * Some markdown tables only emit `tbody`; the first body row is promoted to `thead` in that case.
 * @param props - {@link MarkdownTableProps}
 */
export const MarkdownTable = ({ children, ariaLabel, className }: MarkdownTableProps) => {
    const parts = React.Children.toArray(children)
    const hasThead = parts.some(
        (child) => React.isValidElement(child) && child.type === MarkdownTableHead,
    )

    if (hasThead) {
        return (
            <Table variant="primary" className={cn(className)}>
                <Table.ScrollContainer>
                    <Table.Content aria-label={ariaLabel}>
                        {children}
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        )
    }

    const tbodyIndex = parts.findIndex(
        (child) => React.isValidElement(child) && child.type === MarkdownTableBody,
    )

    if (tbodyIndex < 0) {
        return (
            <Table variant="primary" className={cn(className)}>
                <Table.ScrollContainer>
                    <Table.Content aria-label={ariaLabel}>
                        <MarkdownTableHead />
                        {children}
                    </Table.Content>
                </Table.ScrollContainer>
            </Table>
        )
    }

    const tbody = parts[tbodyIndex] as React.ReactElement<{ children?: React.ReactNode }>
    const bodyRows = React.Children.toArray(tbody.props.children)
    const [firstRow, ...restRows] = bodyRows
    const beforeTbody = parts.slice(0, tbodyIndex)
    const afterTbody = parts.slice(tbodyIndex + 1)

    return (
        <Table variant="primary" className={cn(className)}>
            <Table.ScrollContainer>
                <Table.Content aria-label={ariaLabel}>
                    {beforeTbody}
                    <MarkdownTableHead>{firstRow}</MarkdownTableHead>
                    <MarkdownTableBody>{restRows}</MarkdownTableBody>
                    {afterTbody}
                </Table.Content>
            </Table.ScrollContainer>
        </Table>
    )
}

/** Maps markdown `tbody` to HeroUI `Table.Body`. */
export const MarkdownTableBody = ({ children, className }: MarkdownTablePartProps) => (
    <Table.Body className={cn(className)}>{children}</Table.Body>
)

/** Maps markdown `th` to HeroUI `Table.Column`. */
export const MarkdownTableColumn = ({ children, className }: MarkdownTablePartProps) => (
    <Table.Column className={cn(className)}>{children}</Table.Column>
)
