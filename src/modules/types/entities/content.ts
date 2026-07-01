import type { AbstractEntity } from "./abstract"
import type { ChallengeEntity } from "./challenge"
import type { CodeExplainingEntity } from "./code-explaining"
import type { CodeImplementationEntity } from "./code-implementation"
import type { ContentBody } from "./content-body"
import type { ModuleEntity } from "./module"

/** One "what you'll learn" outcome bullet (mount `# outcomes`). */
export interface ContentLearningOutcome {
    /** Outcome row id. */
    id: string
    /** Outcome text (one bullet). */
    text: string
    /** Display order. */
    sortIndex: number
}

/**
 * Content attached to a module (title + body).
 */
export interface ContentEntity extends AbstractEntity {
    /** The display id. */
    displayId?: string
    /** The thumbnail URL. */
    thumbnailUrl?: string
    /** Content title. */
    title: string
    /** The description of the content. */
    description: string
    /** Markdown / HTML body. */
    body: string
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** The module that the content belongs to. */
    module?: ModuleEntity
    /** The minutes read of the content. */
    minutesRead: number
    /** Challenges linked to this content (id-only when loaded from list queries). */
    challenges?: Array<Pick<ChallengeEntity, "id">>
    /** Critical code snippets with explanations. */
    codeExplainings?: Array<CodeExplainingEntity>
    /** Multi-language implementation guides. */
    codeImplementations?: Array<CodeImplementationEntity>
    /** Whether this content requires enrollment (premium). */
    isPremium: boolean
    /** When true, the lecture tab renders a live Sandpack sandbox for React/TSX lessons. */
    isSandbox?: boolean
    /** Base GitHub repo URL (e.g. https://github.com/FTES AOS-Academy/fullstack-mastery-module-5-...). */
    githubBaseUrl?: string | null
    /** Subdirectory within the repo for this lesson's frontend source (e.g. 1-mutations/frontend). */
    githubDir?: string | null
    /** Relative path to the hosted mock API (e.g. /mocks/4-server-state-with-tanstack-query/0-usequery-and-cache-lifecycle). */
    backendUrl?: string | null
    /** Recorded E2E proofs (read-only) for the "E2E" tab; null when none. Each flow
     * carries the full `.e2e/<lang>/flow-*.md` proof markdown (commands + real output). */
    e2eFlows?: Array<{
        id: string
        title: string
        lang?: string
        status: string
        markdown?: string
    }> | null
    /**
     * Day this content was verified/audited. Non-null marks SCHEMA V2 content (drives the
     * multi-language body tabs); legacy content leaves it null/undefined.
     */
    verified?: string | null
    /** SCHEMA V2 per-language lesson bodies (mount `bodies/<N>-<lang>/`). */
    bodies?: Array<ContentBody>
    /** Ordered "what you'll learn" outcome bullets shown at the top of the lesson. */
    outcomes?: Array<ContentLearningOutcome>
}

/** Code explaining rows from `content` payload. */
export function getContentCodeExplainings(
    content: Pick<ContentEntity, "codeExplainings"> | undefined,
): Array<CodeExplainingEntity> {
    return content?.codeExplainings ?? []
}

/** Normalized implementation rows from `content` payload. */
export function getContentCodeImplementations(
    content: Pick<ContentEntity, "codeImplementations"> | undefined,
): Array<CodeImplementationEntity> {
    return content?.codeImplementations ?? []
}

/** Challenge count from GraphQL `challenges` relation. */
export function getContentChallengeCount(
    content: Pick<ContentEntity, "challenges">,
): number {
    return content.challenges?.length ?? 0
}
