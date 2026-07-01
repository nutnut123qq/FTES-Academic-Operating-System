import type { AbstractEntity } from "./abstract"

import type { ChallengeOutputLangEntity } from "./challenge-output-lang"



/**

 * SCHEMA V2 output item (one row per position).

 * Mirrors Nest `ChallengeOutputEntity` / `challenge_outputs_v2`.

 * CDN payload has no item-level title; only per-lang `text` rows.

 */

export interface ChallengeOutputEntity extends AbstractEntity {

    /** Display order within the challenge output list. */

    /** Pure ordering index used to sort/reorder (1-based). */
    sortIndex: number

    /** Default locale for this output item. */

    defaultLocale: string

    /** Per-programming-language text rows. */

    langs?: Array<ChallengeOutputLangEntity>

}


