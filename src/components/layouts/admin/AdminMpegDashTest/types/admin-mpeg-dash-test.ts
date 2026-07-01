import type { ReactNode } from "react"
import type { VideoRendererType } from "@/modules/types/enums/video-renderer-type"

/** Visual + descriptive metadata for one renderer-type selector option. */
export interface RendererTypeOption {
    /** Renderer type this option selects. */
    type: VideoRendererType
    /** Short label shown on the selector button. */
    label: string
    /** One-line description of the renderer. */
    description: string
    /** Tailwind gradient classes applied when the option is active. */
    color: string
    /** Icon element rendered before the label. */
    icon: ReactNode
}

/** A preset URL the admin can load with one click. */
export interface QuickTestUrl {
    /** Human-readable label for the preset. */
    label: string
    /** Media URL to load into the preview. */
    url: string
    /** Renderer type to activate for this URL. */
    type: VideoRendererType
}
