"use client"

import {
    useMemo,
} from "react"
import type {
    CourseTotals,
} from "../types"
import { useAppSelector } from "@/redux/hooks"

/**
 * Derives marketing trust-stats from the loaded course tree — module / lesson /
 * challenge counts + total reading minutes — entirely client-side (no extra BE
 * field). Returns zeros until the course hydrates.
 *
 * @returns the aggregate {@link CourseTotals}.
 */
export const useCourseTotals = (): CourseTotals => {
    const modules = useAppSelector((state) => state.course.entity?.modules)

    return useMemo<CourseTotals>(() => {
        const list = modules ?? []
        let lessonCount = 0
        let challengeCount = 0
        let totalMinutes = 0
        for (const module of list) {
            const contents = module.contents ?? []
            lessonCount += contents.length
            for (const content of contents) {
                challengeCount += content.challenges?.length ?? 0
                totalMinutes += content.minutesRead ?? 0
            }
        }
        return {
            moduleCount: list.length,
            lessonCount,
            challengeCount,
            totalMinutes,
        }
    }, [modules])
}
