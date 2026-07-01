/** React Flow node type id for a real lesson card expanded under a module. */
export const COURSE_MODULE_SLOT_NODE_TYPE = "courseModuleContent" as const

/** Width of a lesson card expanded beside a module (px). */
export const SLOT_NODE_WIDTH = 240

/** Approximate height of a lesson card for layout (px). */
export const SLOT_NODE_HEIGHT = 56

/** Vertical distance between consecutive lesson card **centers** (px). */
export const SLOT_VERTICAL_STEP = 72

/** Module card body height used as the layout anchor (`min-h` in `ModuleNode`). */
export const MODULE_CARD_BODY_HEIGHT = 100

/** Horizontal gap from the module card's outer edge to the lesson column (px). */
export const CONTENT_OUTWARD_GAP = 48

/** Module card width (must match `ModuleNode` / `build.ts`). */
export const MODULE_CARD_WIDTH = 300

/**
 * Stable React Flow node id for a lesson expanded under a module.
 * @param moduleId — Course module id (same as the parent `courseModule` node id).
 * @param contentId — The lesson (content) id.
 */
export const moduleContentNodeId = (moduleId: string, contentId: string): string =>
    `${moduleId}__content__${contentId}`

/** Prefix used to detect / strip a module's expanded lesson nodes + edges. */
export const MODULE_CONTENT_PREFIX = "__content__"

/**
 * React Flow handle id on the module node for edges to its lesson children.
 */
export const MODULE_CHILD_SOURCE_HANDLE = "module-child-source" as const
