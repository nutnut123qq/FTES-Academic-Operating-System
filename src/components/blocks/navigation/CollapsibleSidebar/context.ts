import { createContext, useContext } from "react"

/**
 * Collapsed flag shared by the {@link import("./index").CollapsibleSidebar} with
 * its nav children ({@link import("../SidebarNavGroup").SidebarNavGroup} /
 * {@link import("../SidebarNavItem").SidebarNavItem}) so rows can drop to icon-only
 * in the rail. Internal UI chrome state — not an app store.
 */
export const SidebarCollapsedContext = createContext(false)

/** Read whether the surrounding CollapsibleSidebar is collapsed (icon-rail). */
export const useSidebarCollapsed = (): boolean => useContext(SidebarCollapsedContext)
