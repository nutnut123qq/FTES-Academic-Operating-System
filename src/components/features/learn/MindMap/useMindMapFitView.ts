import { useEffect } from "react"
import { useReactFlow } from "@xyflow/react"

/** Default zoom when landing on the "you are here" module — readable, not the tiny fit-all. */
const CURRENT_MODULE_ZOOM = 1

/**
 * Sets the mind-map's initial camera. When the viewer's current ("you are here")
 * module is known it lands centred on it at a readable zoom — orientation first,
 * not the tiny fit-everything view. Otherwise it eases into a fit of the whole tree.
 *
 * @param currentModuleId - The module that owns the viewer's resume pointer, if any.
 * @param nodeCount - Number of nodes laid out (re-frames once the graph resolves).
 */
export const useMindMapFitView = (currentModuleId: string | null, nodeCount: number) => {
    const { fitView, setCenter, getNode } = useReactFlow()
    useEffect(() => {
        if (nodeCount === 0) {
            return
        }
        const frame = requestAnimationFrame(() => {
            const node = currentModuleId ? getNode(`m:${currentModuleId}`) : undefined
            if (node) {
                const width = node.measured?.width ?? 280
                const height = node.measured?.height ?? 96
                void setCenter(
                    node.position.x + width / 2,
                    node.position.y + height / 2,
                    { zoom: CURRENT_MODULE_ZOOM, duration: 500 },
                )
                return
            }
            void fitView({ padding: 0.2, duration: 500 })
        })
        return () => cancelAnimationFrame(frame)
    }, [currentModuleId, nodeCount, fitView, setCenter, getNode])
}
