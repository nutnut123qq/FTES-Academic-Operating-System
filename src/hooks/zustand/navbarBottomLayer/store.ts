"use client"

import { create } from "zustand"
import { useEffect, type ReactNode } from "react"

/**
 * Store holding the global Navbar's optional secondary "bottom layer" (e.g. a
 * page-specific tab strip). The Navbar is mounted once at the app root, so a page
 * that needs a second navbar layer registers its node here and the Navbar renders
 * it beneath the primary row — owning the single bottom border for the whole unit.
 */
interface NavbarBottomLayerStoreState {
    /** The node rendered as the Navbar's bottom layer, or null for a single-layer navbar. */
    bottomLayer: ReactNode | null
    /** Set (or clear) the bottom layer. */
    setBottomLayer: (node: ReactNode | null) => void
}

/** Shared store for the Navbar bottom layer. */
export const useNavbarBottomLayerStore = create<NavbarBottomLayerStoreState>((set) => ({
    bottomLayer: null,
    setBottomLayer: (node) => set({ bottomLayer: node }),
}))

/**
 * Register a page's secondary bottom layer into the global Navbar (which renders
 * it beneath its primary row and owns the single bottom border). Pass a STABLE
 * node — memoize it (`useMemo(() => <Strip/>, [])`) so it registers once; it is
 * cleared automatically on unmount. The node renders inside the Navbar subtree,
 * so it may only depend on providers mounted above the Navbar (Redux / i18n /
 * HeroUI / zustand) — which is every global provider.
 *
 * @param node - the bottom-layer node (stable reference).
 */
export const useRegisterNavbarBottomLayer = (node: ReactNode) => {
    const setBottomLayer = useNavbarBottomLayerStore((state) => state.setBottomLayer)
    useEffect(() => {
        setBottomLayer(node)
        return () => setBottomLayer(null)
    }, [node, setBottomLayer])
}
