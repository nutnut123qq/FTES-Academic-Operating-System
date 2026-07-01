import { ChallengeDifficulty } from "@/modules/types/enums/challenge-difficulty"

/**
 * Palette of difficulty colors.
 */
export const difficultyPalette = {
    /** Easy difficulty color. */   
    [ChallengeDifficulty.Easy]: {
        bg: "bg-cyan-500",
        text: "text-cyan-500",
    },
    /** Medium difficulty color. */
    [ChallengeDifficulty.Medium]: {
        bg: "bg-yellow-500",
        text: "text-yellow-500",
    },
    /** Hard difficulty color. */
    [ChallengeDifficulty.Hard]: {
        bg: "bg-red-500",
        text: "text-red-500",
    },
    /** Insane difficulty color. */
    [ChallengeDifficulty.Insane]: {
        bg: "bg-purple-500",
        text: "text-purple-500",
    },
    /** Expert difficulty color. */
    [ChallengeDifficulty.Expert]: {
        bg: "bg-fuchsia-500",
        text: "text-fuchsia-500",
    },
}