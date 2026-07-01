"use client"

import { useCallback } from "react"
import { useHeadhunterOverlayState } from "@/hooks/zustand/overlay/hooks"
import type { ConsultantEntity } from "@/modules/types/entities/consultant"
import { useAppDispatch } from "@/redux/hooks"
import { setHeadhunter, setHeadhunterId } from "@/redux/slices/headhunter"

/**
 * Selects a headhunter in Redux and opens the profile modal.
 * @returns A callback that takes the consultant to open.
 */
export const useOpenHeadhunterDetail = () => {
    const dispatch = useAppDispatch()
    const headhunterOverlay = useHeadhunterOverlayState()

    return useCallback((headhunter: ConsultantEntity) => {
        dispatch(setHeadhunter(headhunter))
        dispatch(setHeadhunterId(headhunter.id))
        headhunterOverlay.open()
    }, [
        dispatch,
        headhunterOverlay,
    ])
}
