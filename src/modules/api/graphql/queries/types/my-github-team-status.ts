import type { GraphQLResponse } from "../../types"

/** Membership state for one enrolled course's GitHub team (mirrors backend). */
export interface GithubTeamEntry {
    /** Enrolled course id. */
    courseId: string
    /** Course display id / slug. */
    courseSlug: string
    /** Course title. */
    courseTitle: string
    /** GitHub team slug mapped to this course. */
    teamSlug: string
    /** "active" (in team) | "pending" (invited) | "none" (not invited). */
    state: string
}

/** Payload inside `myGithubTeamStatus.data`. */
export interface QueryMyGithubTeamStatusResponseData {
    /** Whether the viewer linked a GitHub identity (githubUsername set). */
    linked: boolean
    /** The linked GitHub username, when linked. */
    githubUsername: string | null
    /** One entry per enrolled course mapped to a GitHub team. */
    teams: Array<GithubTeamEntry>
    /** True when every required course team is joined (state active). */
    allInTeam: boolean
}

/** Apollo response shape for the `myGithubTeamStatus` query. */
export interface QueryMyGithubTeamStatusResponse {
    /** Top-level field wrapping the standard API response. */
    myGithubTeamStatus: GraphQLResponse<QueryMyGithubTeamStatusResponseData>
}
