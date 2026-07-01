import React from "react"

/**
 * Flattens thead row output (e.g. a fragment wrapping columns) so the columns can be
 * passed directly as children of HeroUI `Table.Header`.
 * @param children - Rendered children of the markdown `thead` element.
 * @returns A flat array of column or cell nodes.
 */
export function flattenMarkdownTableHeaderChildren(children: React.ReactNode): Array<React.ReactNode> {
    const flattened: Array<React.ReactNode> = []

    const pushRowCells = (rowChildren: React.ReactNode): void => {
        React.Children.forEach(rowChildren, (column) => {
            flattened.push(column)
        })
    }

    React.Children.forEach(children, (row) => {
        if (!React.isValidElement<{ children?: React.ReactNode }>(row)) {
            return
        }
        if (row.type === React.Fragment) {
            React.Children.forEach(row.props.children, (nestedRow) => {
                if (!React.isValidElement<{ children?: React.ReactNode }>(nestedRow)) {
                    return
                }
                pushRowCells(nestedRow.props.children)
            })
            return
        }
        pushRowCells(row.props.children)
    })
    return flattened
}

/**
 * Detects header rows from the original HAST `tr` node (GFM uses `th` cells in thead).
 * @param node - The HAST node backing the markdown `tr` element.
 * @returns True when every child cell is a `th` element (i.e. a header row).
 */
export function isMarkdownHeaderTableRowNode(node: unknown): boolean {
    if (!node || typeof node !== "object") {
        return false
    }
    const element = node as {
        type?: string
        children?: Array<{ type?: string; tagName?: string }>
    }
    if (element.type !== "element") {
        return false
    }
    if (!Array.isArray(element.children) || element.children.length === 0) {
        return false
    }
    return element.children.every(
        (child) =>
            child.type === "element" &&
            typeof child.tagName === "string" &&
            child.tagName.toLowerCase() === "th",
    )
}
