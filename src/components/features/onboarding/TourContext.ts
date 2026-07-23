"use client"

import { createContext, useContext } from "react"
import type { Tour } from "./types"

/** What {@link useTour} exposes to the rest of the app. */
export interface TourContextValue {
    /** Whether a tour overlay is currently on screen (anti-nag: suppress nudges). */
    readonly isActive: boolean
    /**
     * Start a tour from its first step. Called with no argument by the account
     * menu's "Xem lại hướng dẫn" replay entry (defaults to the welcome tour).
     */
    startTour: (tour?: Tour) => void
}

/**
 * Default value so consumers can call {@link useTour} safely even if they render
 * outside the provider (SSR, tests) — the actions are no-ops and `isActive` is
 * false, never a thrown "missing provider" error.
 */
const DEFAULT: TourContextValue = {
    isActive: false,
    startTour: () => {},
}

/** Context carrying the live tour controls (provided by `TourProvider`). */
export const TourContext = createContext<TourContextValue>(DEFAULT)

/**
 * Access the guided-tour controls: `isActive` (a tour overlay is showing) and
 * `startTour()` (kick off / replay a tour). Safe outside the provider — returns
 * inert defaults rather than throwing.
 */
export const useTour = (): TourContextValue => useContext(TourContext)
