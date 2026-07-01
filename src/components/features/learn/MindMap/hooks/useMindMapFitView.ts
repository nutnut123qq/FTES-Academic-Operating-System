import { useReactFlow } from "@xyflow/react"
import { useEffect } from "react"
import { useAppSelector } from "@/redux/hooks"

/** Default zoom when landing on the "you are here" module — readable, not the tiny fit-all. */
const CURRENT_MODULE_ZOOM = 1.2

/**
 * Sets the mind-map's initial camera. When the viewer's current ("you are here")
 * module is known, it lands centred on it at a readable zoom — orientation first,
 * not the tiny fit-everything view. Otherwise (guest / no progress) it eases into a
 * fit of the whole graph.
 *
 * @param currentModuleId - The module that owns the viewer's next content task, if any.
 */
export const useMindMapFitView = (currentModuleId?: string) => {
    /** The course entity. */
    const entity = useAppSelector((state) => state.course.entity)
    /** React Flow camera helpers. */
    const { fitView, setCenter, getNode } = useReactFlow()
    /** The useEffect to set the initial mind map view. */
    useEffect(() => {
        /** If the entity is not found, return. */
        if (!entity) {
            return
        }
        /** The request animation frame to set the initial view once nodes are laid out. */
        const id = requestAnimationFrame(() => {
            const node = currentModuleId ? getNode(currentModuleId) : undefined
            if (node) {
                // land centred on the current module so the learner sees "where am I" up close
                const width = node.measured?.width ?? 300
                const height = node.measured?.height ?? 100
                void setCenter(
                    node.position.x + width / 2,
                    node.position.y + height / 2,
                    { zoom: CURRENT_MODULE_ZOOM, duration: 500 },
                )
                return
            }
            // no current module (guest / all done) → ease into the whole-graph overview
            void fitView({ padding: 0.2, duration: 500 })
        })
        /** The cleanup function to cancel the request animation frame. */
        return () => cancelAnimationFrame(id)
    }, [entity, entity?.id, entity?.modules?.length, currentModuleId, fitView, setCenter, getNode])
}
