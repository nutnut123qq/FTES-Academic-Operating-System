import { useEffect, useRef } from "react"
import { useReactFlow } from "@xyflow/react"

/**
 * Frames the radial map ONCE, the first time the graph resolves: a fit-view of the
 * whole section ring, so the viewer lands on the sections distributed around the
 * centre. It deliberately does NOT re-frame on later graph changes (expanding /
 * collapsing a section), so the viewer's own pan / zoom is preserved while they
 * explore — children fan out next to their section, which is already in view.
 *
 * @param nodeCount - Number of nodes laid out (frames once it first goes non-zero).
 */
export const useMindMapFitView = (nodeCount: number) => {
    const { fitView } = useReactFlow()
    const framedRef = useRef(false)
    useEffect(() => {
        if (nodeCount === 0 || framedRef.current) {
            return
        }
        framedRef.current = true
        const frame = requestAnimationFrame(() => {
            void fitView({ padding: 0.25, duration: 400 })
        })
        return () => cancelAnimationFrame(frame)
    }, [nodeCount, fitView])
}
