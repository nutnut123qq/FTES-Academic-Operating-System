import React from "react"
import { MiniCartDrawer } from "@/components/drawers/MiniCartDrawer"

/** Drawer mount point — global feature drawers are mounted here (add new ones below). */
export const DrawerContainer = () => {
    return (
        <>
            <MiniCartDrawer />
        </>
    )
}
