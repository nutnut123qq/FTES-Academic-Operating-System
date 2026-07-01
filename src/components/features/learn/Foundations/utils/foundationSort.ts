import type { FoundationEntity } from "@/modules/types/entities/foundation"

const STARCI_AUTHOR_PATTERN = /starci/i

/**
 * Whether the resource is authored by StarCi (cheatsheet, roadmap, academy video).
 */
export const isStarCiFoundation = (foundation: FoundationEntity): boolean => {
    return STARCI_AUTHOR_PATTERN.test(foundation.author ?? "")
}

/**
 * StarCi Academy intro video (`*-starci-video` mount folder).
 */
export const isStarCiAcademyVideo = (foundation: FoundationEntity): boolean => {
    return (
        isStarCiFoundation(foundation)
        && /starci/i.test(foundation.displayId ?? "")
    )
}

const isRoadmapFoundation = (foundation: FoundationEntity): boolean => {
    return /roadmap/i.test(foundation.displayId ?? "")
}

const isCheatsheetFoundation = (foundation: FoundationEntity): boolean => {
    return /cheatsheet/i.test(foundation.displayId ?? "")
}

/**
 * Sort tier: 0 StarCi academy video → 1 roadmap → 2 cheatsheet → 3 everything else.
 */
export const getFoundationSortTier = (foundation: FoundationEntity): number => {
    if (isStarCiAcademyVideo(foundation)) {
        return 0
    }
    if (isRoadmapFoundation(foundation)) {
        return 1
    }
    if (isCheatsheetFoundation(foundation)) {
        return 2
    }
    return 3
}

/**
 * Compare foundations for the category list (roadmap before cheatsheet when both exist).
 */
export const compareFoundations = (
    a: FoundationEntity,
    b: FoundationEntity,
): number => {
    const tierDiff = getFoundationSortTier(a) - getFoundationSortTier(b)
    if (tierDiff !== 0) {
        return tierDiff
    }
    return a.sortIndex - b.sortIndex
}
