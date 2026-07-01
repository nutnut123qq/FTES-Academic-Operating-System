import type { IconComponent } from "@/types"
import {
    BookOpenIcon,
    CodeIcon,
    PuzzlePieceIcon,
    PlayIcon,
    CheckCircleIcon,
    FlaskIcon,
} from "@phosphor-icons/react"
import { ContentTab } from "@/redux/slices/tabs"

/**
 * Icon component rendered on each {@link ContentTab} trigger.
 *
 * Keyed by the tabs surfaced in the {@link LessonReader} bar; deprecated/unused tabs
 * fall back to the content icon so the lookup is total.
 */
export const CONTENT_TAB_ICON_MAP: Record<ContentTab, IconComponent> = {
    /** Article / markdown body tab. */
    [ContentTab.Content]: BookOpenIcon,
    /** Code explainings + implementations tab. */
    [ContentTab.CodeExplainings]: CodeIcon,
    /** Challenges tab. */
    [ContentTab.Challenges]: PuzzlePieceIcon,
    /** Live Sandpack sandbox tab. */
    [ContentTab.Sandbox]: PlayIcon,
    /** AI Lab playground tab. */
    [ContentTab.AILab]: FlaskIcon,
    /** E2E test-proof tab. */
    [ContentTab.E2e]: CheckCircleIcon,
    /** @deprecated Legacy lesson-videos tab, kept for a total lookup. */
    [ContentTab.LessonVideos]: BookOpenIcon,
    /** @deprecated Merged into code explainings; kept for a total lookup. */
    [ContentTab.CodeImplementation]: CodeIcon,
}
