import {
    SiGithub,
    SiGoogledrive,
} from "@icons-pack/react-simple-icons"
import type {
    SubmissionIconMap,
} from "./types"
import { SubmissionType } from "@/modules/types/enums/submission-type"

/** Brand icon shown next to a submission title, keyed by its expected link type. */
export const SUBMISSION_ICON_MAP: SubmissionIconMap = {
    [SubmissionType.GithubUrl]: SiGithub,
    [SubmissionType.GoogleDocsUrl]: SiGoogledrive,
}
