import type { AbstractEntity } from "./abstract"
import type { ContentEntity } from "./content"
import type { ModuleEntity } from "./module"
import type { FlashcardCardEntity } from "./flashcard-card"
import type { ChallengeDifficulty } from "../enums/challenge-difficulty"

/**
 * Interview-prep flashcard deck owned by a course. Mirrors table `flashcard_decks`.
 */
export interface FlashcardDeckEntity extends AbstractEntity {
    /** Deck title. */
    title: string
    /** Human-facing stable identifier from the mount folder slug. */
    displayId: string
    /** Deck description (Markdown). */
    description: string
    /** Relative difficulty of the deck. */
    difficulty: ChallengeDifficulty
    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number
    /** Default locale for this deck row. */
    defaultLocale: string
    /** Owning course id. */
    courseId?: string
    /** Contents this deck references (optional N:N, `# contentRefs`). */
    contents?: Array<ContentEntity>
    /** Modules this deck references (optional N:N, `# moduleRefs`). */
    modules?: Array<ModuleEntity>
    /** Open-ended Q&A flashcards belonging to this deck. */
    cards?: Array<FlashcardCardEntity>
    /** Viewer's cards currently due in this deck (runtime, per-user; absent when not requested). */
    dueCount?: number
    /** Viewer's mastered cards in this deck — repetitions ≥ 2 (runtime, per-user). */
    masteredCount?: number
}
