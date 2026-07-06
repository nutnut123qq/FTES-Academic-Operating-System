import React from "react"
import type { PropsWithChildren } from "react"

/**
 * Learn shell (§4). A light container that gives every learn surface (content
 * dashboard, lesson reader, mind map, leaderboard) a capped, padded canvas.
 *
 * The ambient meteor background is already suppressed app-wide on `/learn`
 * routes (see `InnerLayout` — content-dense routes read cleaner without it), so
 * this layout only owns width + padding, not the backdrop.
 *
 * Individual surfaces own their own multi-column grids; the mind map opts out of
 * the width cap itself (renders edge-to-edge inside this padding).
 */
const LearnLayout = ({ children }: PropsWithChildren) => (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6">{children}</div>
)

export default LearnLayout
