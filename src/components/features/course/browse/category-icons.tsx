"use client"

import type { Icon } from "@phosphor-icons/react"
import {
    CodeIcon,
    MathOperationsIcon,
    SquaresFourIcon,
    TranslateIcon,
} from "@phosphor-icons/react"

/**
 * Phosphor icon per category slug — kept OUT of `./categories` so the pure-data
 * module stays importable from server pages (phosphor components call
 * `createContext`, which the react-server bundle does not provide). Client
 * components (chip bar, shelf, category landing) resolve icons from here.
 */
const CATEGORY_ICONS: Record<string, Icon> = {
    math: MathOperationsIcon,
    programming: CodeIcon,
    "foreign-languages": TranslateIcon,
}

/**
 * Resolves the phosphor icon for a category slug.
 *
 * @param slug - The category slug (`CourseCategory.slug`).
 * @returns The mapped icon, or a generic tile icon for unknown slugs.
 */
export const categoryIcon = (slug: string): Icon => CATEGORY_ICONS[slug] ?? SquaresFourIcon
